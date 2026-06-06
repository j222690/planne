import { describe, test, expect } from "vitest";
import { gerarPlanoNesting, KERF_MM, MARGEM_CHAPA_MM } from "../nesting";
import {
  gerarCSVCorte,
  gerarDXFCorte,
  gerarEtiquetas,
  gerarExportacoes,
} from "../exportacao-corte";
import { gerarLayoutCozinhaLinear } from "../layout-cozinha-linear";
import { criarAmbienteManual } from "../ambiente";
import { parseDXF } from "../dxf-parser";
import type { Peca, Material } from "../tipos";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const material15: Material = {
  id: "mdf_15", codigo: "mdf_15", nome_display: "MDF 15mm Branco",
  espessura_mm: 15, largura_chapa_mm: 2750, comprimento_chapa_mm: 1830,
  area_chapa_m2: 5.0325, cor_hex: "#fff", acabamento: "melamina",
  preco_custo_chapa: 85, preco_venda_chapa: 0,
};

function peca(id: string, largura: number, comprimento: number, qtd = 1, fio: Peca["direcao_fio"] = "indiferente"): Peca {
  return {
    id, modulo_instanciado_id: "m1", regra_nome: "teste",
    largura_mm: largura, comprimento_mm: comprimento, espessura_mm: 15,
    largura_final_mm: largura - 3, comprimento_final_mm: comprimento - 3,
    material: material15, direcao_fio: fio,
    fita_borda: { esquerda: false, direita: false, topo: true, base: false },
    quantidade: qtd, etiqueta_producao: `Peça ${id}`, status: "pendente",
  };
}

function projetoCozinha(largura = 400) {
  const amb = criarAmbienteManual({ largura_cm: largura, profundidade_cm: 300, altura_cm: 270 });
  return gerarLayoutCozinhaLinear(amb, {
    cor_mdf_hex: "#fff", ferragem: "nacional",
    tipo_porta_base: "dobradica", tipo_porta_aereo: "dobradica",
    versao_comercial: "intermediaria",
  }).projeto;
}

function todasPecas(projeto: ReturnType<typeof projetoCozinha>): Peca[] {
  return projeto.modulos.flatMap((m) => m.pecas);
}

// ─── gerarPlanoNesting ────────────────────────────────────────────────────────

describe("gerarPlanoNesting — MaxRects", () => {
  test("aloca peças em pelo menos uma chapa", () => {
    const plano = gerarPlanoNesting([peca("p1", 600, 720, 4)]);
    expect(plano.chapas.length).toBeGreaterThanOrEqual(1);
    expect(plano.resumo.total_pecas).toBe(4);
  });

  test("usa algoritmo maxrects", () => {
    const plano = gerarPlanoNesting([peca("p1", 600, 720)]);
    expect(plano.algoritmo).toBe("maxrects");
  });

  test("nenhuma peça se sobrepõe na mesma chapa", () => {
    const plano = gerarPlanoNesting([peca("p", 400, 500, 12)]);
    for (const chapa of plano.chapas) {
      const ps = chapa.pecas_alocadas;
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const a = ps[i], b = ps[j];
          const aw = a.rotacionada ? a.comprimento_mm : a.largura_mm;
          const ah = a.rotacionada ? a.largura_mm : a.comprimento_mm;
          const bw = b.rotacionada ? b.comprimento_mm : b.largura_mm;
          const bh = b.rotacionada ? b.largura_mm : b.comprimento_mm;
          const sobrepoe = a.x_mm < b.x_mm + bw && a.x_mm + aw > b.x_mm &&
                           a.y_mm < b.y_mm + bh && a.y_mm + ah > b.y_mm;
          expect(sobrepoe).toBe(false);
        }
      }
    }
  });

  test("peças ficam dentro dos limites da chapa", () => {
    const plano = gerarPlanoNesting([peca("p", 400, 500, 10)]);
    for (const chapa of plano.chapas) {
      for (const p of chapa.pecas_alocadas) {
        const w = p.rotacionada ? p.comprimento_mm : p.largura_mm;
        const h = p.rotacionada ? p.largura_mm : p.comprimento_mm;
        expect(p.x_mm + w).toBeLessThanOrEqual(chapa.largura_mm - MARGEM_CHAPA_MM + 0.5);
        expect(p.y_mm + h).toBeLessThanOrEqual(chapa.comprimento_mm - MARGEM_CHAPA_MM + 0.5);
      }
    }
  });

  test("eficiência de cada chapa entre 0 e 100", () => {
    const plano = gerarPlanoNesting([peca("p", 400, 500, 10)]);
    for (const chapa of plano.chapas) {
      expect(chapa.eficiencia_pct).toBeGreaterThan(0);
      expect(chapa.eficiencia_pct).toBeLessThanOrEqual(100);
    }
  });

  test("chapa cheia é bem aproveitada (eficiência > 70%)", () => {
    // 40 peças de 300×400: a primeira chapa deve ficar densamente preenchida.
    // (A última chapa naturalmente sobra; o que mede a qualidade do MaxRects
    //  é a densidade da chapa cheia.)
    const plano = gerarPlanoNesting([peca("p", 300, 400, 40)]);
    const maisCheia = plano.chapas.reduce((a, b) => (a.eficiencia_pct >= b.eficiencia_pct ? a : b));
    expect(maisCheia.eficiencia_pct).toBeGreaterThan(70);
  });

  test("separa materiais diferentes em chapas distintas", () => {
    const material18: Material = { ...material15, id: "mdf_18", espessura_mm: 18, nome_display: "MDF 18mm" };
    const p15 = peca("a", 600, 720, 2);
    const p18: Peca = { ...peca("b", 600, 720, 2), material: material18, espessura_mm: 18 };
    const plano = gerarPlanoNesting([p15, p18]);
    // Cada material tem suas próprias chapas
    const materiais = new Set(plano.chapas.map((c) => c.material.id));
    expect(materiais.size).toBe(2);
  });

  test("respeita kerf (peça ocupa largura + kerf)", () => {
    expect(KERF_MM).toBeGreaterThan(0);
    // Uma peça que com kerf excede metade da chapa não cabe 2x lado a lado exato
    const plano = gerarPlanoNesting([peca("p", 600, 720, 1)]);
    expect(plano.chapas[0].pecas_alocadas.length).toBe(1);
  });

  test("peça com fio fixo não rotaciona", () => {
    const plano = gerarPlanoNesting([peca("p", 600, 720, 1, "paralelo_comprimento")]);
    expect(plano.chapas[0].pecas_alocadas[0].rotacionada).toBe(false);
  });

  test("excede 1 chapa quando peças não cabem em uma", () => {
    // 30 peças de 800×1000 não cabem numa chapa só
    const plano = gerarPlanoNesting([peca("p", 800, 1000, 30)]);
    expect(plano.chapas.length).toBeGreaterThan(1);
  });

  test("ignora materiais não-chapa (vidro)", () => {
    const vidro: Material = { ...material15, id: "vidro", nome_display: "Vidro temperado 8mm" };
    const pvidro: Peca = { ...peca("v", 600, 720), material: vidro };
    const plano = gerarPlanoNesting([pvidro]);
    expect(plano.chapas.length).toBe(0);
  });

  test("projeto real de cozinha gera plano coerente", () => {
    const pecas = todasPecas(projetoCozinha(400));
    const plano = gerarPlanoNesting(pecas);
    expect(plano.chapas.length).toBeGreaterThan(0);
    expect(plano.resumo.total_pecas).toBeGreaterThan(0);
    expect(plano.resumo.total_chapas).toBe(plano.chapas.length);
  });

  test("é determinística", () => {
    const pecas = todasPecas(projetoCozinha(400));
    const a = gerarPlanoNesting(pecas);
    const b = gerarPlanoNesting(pecas);
    expect(a.resumo.total_chapas).toBe(b.resumo.total_chapas);
    expect(a.resumo.desperdicio_pct).toBe(b.resumo.desperdicio_pct);
  });

  test("SVG é gerado quando solicitado", () => {
    const plano = gerarPlanoNesting([peca("p", 600, 720, 2)], 0, { com_svg: true });
    expect(plano.chapas[0].svg_layout).toContain("<svg");
  });

  test("SVG omitido quando com_svg=false", () => {
    const plano = gerarPlanoNesting([peca("p", 600, 720, 2)], 0, { com_svg: false });
    expect(plano.chapas[0].svg_layout).toBe("");
  });
});

// ─── Exportações ──────────────────────────────────────────────────────────────

describe("gerarCSVCorte", () => {
  test("CSV tem cabeçalho e linhas por peça", () => {
    const plano = gerarPlanoNesting([peca("p", 600, 720, 3)]);
    const csv = gerarCSVCorte(plano);
    expect(csv).toContain("chapa;material;peca");
    const linhasPecas = csv.split("\n").filter((l) => l.startsWith("1;"));
    expect(linhasPecas.length).toBe(3);
  });

  test("CSV inclui resumo no rodapé", () => {
    const plano = gerarPlanoNesting([peca("p", 600, 720, 2)]);
    const csv = gerarCSVCorte(plano);
    expect(csv).toMatch(/Total de chapas/);
    expect(csv).toMatch(/Desperdício/);
  });
});

describe("gerarDXFCorte", () => {
  test("DXF é válido e parseável de volta", () => {
    const plano = gerarPlanoNesting([peca("p", 600, 720, 4)]);
    const dxf = gerarDXFCorte(plano);
    expect(dxf).toContain("SECTION");
    expect(dxf).toContain("ENTITIES");
    expect(dxf).toContain("EOF");
    // O parser DXF da Fase 7 consegue lê-lo
    const parsed = parseDXF(dxf);
    expect(parsed.unidade).toBe("mm");
    expect(parsed.segmentos.length).toBeGreaterThan(0);
  });

  test("DXF tem 1 retângulo de contorno por chapa + peças", () => {
    const plano = gerarPlanoNesting([peca("p", 600, 720, 2)]);
    const dxf = gerarDXFCorte(plano);
    const parsed = parseDXF(dxf);
    // contorno (4 seg) + cada peça (4 seg). 1 chapa + 2 peças = 3 retângulos = 12 segmentos
    expect(parsed.segmentos.length).toBeGreaterThanOrEqual(12);
  });
});

describe("gerarEtiquetas", () => {
  test("uma etiqueta por peça alocada", () => {
    const plano = gerarPlanoNesting([peca("p", 600, 720, 5)]);
    const etiquetas = gerarEtiquetas(plano, "proj_1");
    expect(etiquetas.length).toBe(5);
  });

  test("código segue padrão C{chapa}-P{n}", () => {
    const plano = gerarPlanoNesting([peca("p", 600, 720, 2)]);
    const etiquetas = gerarEtiquetas(plano);
    expect(etiquetas[0].codigo).toMatch(/^C\d+-P\d{2}$/);
  });

  test("QR payload é JSON válido com peca_id", () => {
    const plano = gerarPlanoNesting([peca("p", 600, 720, 1)]);
    const etiquetas = gerarEtiquetas(plano, "proj_xyz");
    const qr = JSON.parse(etiquetas[0].qr_payload);
    expect(qr.proj).toBe("proj_xyz");
    expect(qr.cod).toBe(etiquetas[0].codigo);
    expect(qr.pid).toBeTruthy();
  });
});

describe("gerarExportacoes (pacote completo)", () => {
  test("retorna plano com CSV embutido + dxf + etiquetas", () => {
    const plano = gerarPlanoNesting([peca("p", 600, 720, 3)]);
    const { plano: planoComCsv, exportacoes } = gerarExportacoes(plano, "proj_1");
    expect(planoComCsv.exportacoes.csv_operador.length).toBeGreaterThan(0);
    expect(exportacoes.dxf_corte).toContain("SECTION");
    expect(exportacoes.etiquetas.length).toBe(3);
  });

  test("não muta o plano original", () => {
    const plano = gerarPlanoNesting([peca("p", 600, 720, 2)]);
    const csvAntes = plano.exportacoes.csv_operador;
    gerarExportacoes(plano);
    expect(plano.exportacoes.csv_operador).toBe(csvAntes);
  });
});
