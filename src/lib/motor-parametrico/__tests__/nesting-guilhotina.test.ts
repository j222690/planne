import { describe, test, expect } from "vitest";
import { gerarPlanoNestingGuilhotina } from "../nesting-guilhotina";
import { gerarSequenciaCorteTexto, gerarSequenciaCorteChecklist } from "../exportacao-guilhotina";
import type { Peca, Material } from "../tipos";

function material(espessura = 15): Material {
  return {
    id: `mdf_${espessura}`,
    codigo: `mdf_${espessura}`,
    nome_display: `MDF Branco ${espessura}mm`,
    espessura_mm: espessura as 15,
    largura_chapa_mm: 2750,
    comprimento_chapa_mm: 1850,
    area_chapa_m2: 2.75 * 1.85,
    cor_hex: "#ffffff",
    acabamento: "melamina",
    preco_custo_chapa: 105,
    preco_venda_chapa: 0,
  };
}

function peca(overrides: Partial<Peca> = {}): Peca {
  return {
    id: `peca_${Math.random().toString(36).slice(2)}`,
    modulo_instanciado_id: "mod_1",
    regra_nome: "lateral",
    material: material(),
    espessura_mm: 15,
    largura_mm: 600,
    comprimento_mm: 720,
    largura_final_mm: 597,
    comprimento_final_mm: 717,
    quantidade: 1,
    direcao_fio: "indiferente",
    fita_borda: { esquerda: false, direita: false, topo: true, base: false },
    etiqueta_producao: "LATERAL",
    ...overrides,
  } as Peca;
}

/** Confere que 2 retângulos (mm) não se sobrepõem. */
function seSobrepoe(
  a: { x_mm: number; y_mm: number; largura_mm: number; comprimento_mm: number },
  b: { x_mm: number; y_mm: number; largura_mm: number; comprimento_mm: number },
): boolean {
  return a.x_mm < b.x_mm + b.largura_mm && a.x_mm + a.largura_mm > b.x_mm
    && a.y_mm < b.y_mm + b.comprimento_mm && a.y_mm + a.comprimento_mm > b.y_mm;
}

describe("gerarPlanoNestingGuilhotina", () => {
  test("gera pelo menos 1 chapa com peças alocadas", () => {
    const pecas = [peca({ quantidade: 6, largura_mm: 600, comprimento_mm: 720 })];
    const { plano } = gerarPlanoNestingGuilhotina(pecas);
    expect(plano.algoritmo).toBe("guillotine");
    expect(plano.chapas.length).toBeGreaterThan(0);
    expect(plano.resumo.total_pecas).toBe(6);
  });

  test("nenhuma peça se sobrepõe dentro da mesma chapa", () => {
    const pecas = [
      peca({ quantidade: 4, largura_mm: 800, comprimento_mm: 600 }),
      peca({ quantidade: 6, largura_mm: 400, comprimento_mm: 300, regra_nome: "prateleira" }),
      peca({ quantidade: 3, largura_mm: 200, comprimento_mm: 1500, regra_nome: "lateral_alta" }),
    ];
    const { plano } = gerarPlanoNestingGuilhotina(pecas);
    for (const chapa of plano.chapas) {
      for (let i = 0; i < chapa.pecas_alocadas.length; i++) {
        for (let j = i + 1; j < chapa.pecas_alocadas.length; j++) {
          expect(seSobrepoe(chapa.pecas_alocadas[i], chapa.pecas_alocadas[j])).toBe(false);
        }
      }
    }
  });

  test("todas as peças ficam dentro dos limites da chapa (com margem de refilo)", () => {
    const pecas = [peca({ quantidade: 8, largura_mm: 500, comprimento_mm: 400 })];
    const { plano } = gerarPlanoNestingGuilhotina(pecas);
    for (const chapa of plano.chapas) {
      for (const p of chapa.pecas_alocadas) {
        expect(p.x_mm).toBeGreaterThanOrEqual(0);
        expect(p.y_mm).toBeGreaterThanOrEqual(0);
        expect(p.x_mm + p.largura_mm).toBeLessThanOrEqual(chapa.largura_mm);
        expect(p.y_mm + p.comprimento_mm).toBeLessThanOrEqual(chapa.comprimento_mm);
      }
    }
  });

  test("restrição guilhotina: cada corte é uma linha reta sobre um retângulo válido", () => {
    const pecas = [
      peca({ quantidade: 5, largura_mm: 700, comprimento_mm: 500 }),
      peca({ quantidade: 4, largura_mm: 300, comprimento_mm: 900, regra_nome: "porta" }),
    ];
    const { cortes_por_chapa } = gerarPlanoNestingGuilhotina(pecas);
    const todosCortes = Object.values(cortes_por_chapa).flat();
    expect(todosCortes.length).toBeGreaterThan(0);
    for (const corte of todosCortes) {
      expect(corte.sobre.w).toBeGreaterThan(0);
      expect(corte.sobre.h).toBeGreaterThan(0);
      if (corte.eixo === "vertical") {
        expect(corte.posicao_mm).toBeGreaterThan(corte.sobre.x);
        expect(corte.posicao_mm).toBeLessThan(corte.sobre.x + corte.sobre.w);
      } else {
        expect(corte.posicao_mm).toBeGreaterThan(corte.sobre.y);
        expect(corte.posicao_mm).toBeLessThan(corte.sobre.y + corte.sobre.h);
      }
    }
  });

  test("nenhuma peça maior que a chapa é alocada (ignorada silenciosamente)", () => {
    const pecas = [peca({ quantidade: 1, largura_mm: 3000, comprimento_mm: 3000 })];
    const { plano } = gerarPlanoNestingGuilhotina(pecas);
    expect(plano.chapas.length).toBe(0);
  });

  test("peças com direção de fio fixa não rotacionam", () => {
    const pecas = [peca({
      quantidade: 4, largura_mm: 2000, comprimento_mm: 100,
      direcao_fio: "paralelo_largura",
    })];
    const { plano } = gerarPlanoNestingGuilhotina(pecas);
    for (const chapa of plano.chapas) {
      for (const p of chapa.pecas_alocadas) {
        expect(p.rotacionada).toBe(false);
      }
    }
  });

  test("materiais diferentes vão para chapas separadas", () => {
    const pecas = [
      peca({ quantidade: 2, material: material(15) }),
      peca({ quantidade: 2, material: material(18) }),
    ];
    const { plano } = gerarPlanoNestingGuilhotina(pecas);
    const espessuras = new Set(plano.chapas.map((c) => c.material.espessura_mm));
    expect(espessuras.size).toBe(2);
  });
});

describe("exportação da sequência de corte", () => {
  test("texto CSV lista todos os cortes de todas as chapas", () => {
    const pecas = [peca({ quantidade: 6, largura_mm: 600, comprimento_mm: 500 })];
    const { plano, cortes_por_chapa } = gerarPlanoNestingGuilhotina(pecas);
    const texto = gerarSequenciaCorteTexto(plano.chapas, cortes_por_chapa);
    const linhas = texto.split("\n");
    expect(linhas[0]).toContain("Chapa;Material;Corte");
    const totalCortes = Object.values(cortes_por_chapa).flat().length;
    expect(linhas.length - 1).toBe(totalCortes);
  });

  test("checklist tem um bloco por chapa com a contagem certa de cortes", () => {
    const pecas = [peca({ quantidade: 6, largura_mm: 600, comprimento_mm: 500 })];
    const { plano, cortes_por_chapa } = gerarPlanoNestingGuilhotina(pecas);
    const checklist = gerarSequenciaCorteChecklist(plano.chapas, cortes_por_chapa);
    plano.chapas.forEach((chapa) => {
      expect(checklist).toContain(`CHAPA ${chapa.numero_sequencial}`);
      const n = cortes_por_chapa[chapa.id]?.length ?? 0;
      expect(checklist).toContain(`${n} corte(s) reto(s)`);
    });
  });
});
