import { describe, test, expect } from "vitest";
import { gerarCSVCorte, gerarDXFCorte } from "../exportacao-corte";
import type { PlanoNesting, ChapaAlocada, PecaAlocada, Material } from "../tipos";

function material(): Material {
  return {
    id: "mdf_15", codigo: "mdf_15", nome_display: "MDF Branco 15mm",
    espessura_mm: 15, largura_chapa_mm: 2750, comprimento_chapa_mm: 1850,
    area_chapa_m2: 2.75 * 1.85, cor_hex: "#fff", acabamento: "melamina",
    preco_custo_chapa: 105, preco_venda_chapa: 0,
  };
}

function pecaAlocada(overrides: Partial<PecaAlocada> = {}): PecaAlocada {
  return {
    peca_id: "peca_1#0",
    x_mm: 10, y_mm: 10, largura_mm: 600, comprimento_mm: 720,
    rotacionada: false, etiqueta: "LATERAL — Gabinete Base 60cm",
    ...overrides,
  };
}

function chapa(pecas: PecaAlocada[]): ChapaAlocada {
  return {
    id: "chapa_1", numero_sequencial: 1, material: material(),
    largura_mm: 2750, comprimento_mm: 1850, pecas_alocadas: pecas,
    area_util_mm2: 0, area_desperdicada_mm2: 0, eficiencia_pct: 0, svg_layout: "",
  };
}

function plano(pecas: PecaAlocada[]): PlanoNesting {
  return {
    algoritmo: "maxrects", chapas: [chapa(pecas)],
    resumo: { total_pecas: pecas.length, total_chapas: 1, area_util_total_m2: 0, area_desperdicada_m2: 0, desperdicio_pct: 0, metros_fita_total: 0 },
    exportacoes: { csv_operador: "" }, calculado_em: new Date().toISOString(),
  };
}

describe("gerarCSVCorte — colunas de veio e lado fitado", () => {
  test("cabeçalho inclui veio e lado_fitado", () => {
    const csv = gerarCSVCorte(plano([pecaAlocada()]));
    const cabecalho = csv.split("\n")[0];
    expect(cabecalho).toContain("veio");
    expect(cabecalho).toContain("lado_fitado");
  });

  test("veio 'paralelo_largura' aparece como 'largura'", () => {
    const csv = gerarCSVCorte(plano([pecaAlocada({ direcao_fio: "paralelo_largura" })]));
    const linha = csv.split("\n")[1];
    expect(linha.split(";")).toContain("largura");
  });

  test("peça sem direcao_fio deixa a coluna veio vazia (não quebra)", () => {
    const csv = gerarCSVCorte(plano([pecaAlocada({ direcao_fio: undefined })]));
    const colunas = csv.split("\n")[1].split(";");
    const idxVeio = csv.split("\n")[0].split(";").indexOf("veio");
    expect(colunas[idxVeio]).toBe("");
  });

  test("lado_fitado lista os lados certos, não rotacionada", () => {
    const csv = gerarCSVCorte(plano([
      pecaAlocada({ fita_borda: { esquerda: true, direita: true, topo: false, base: false }, rotacionada: false }),
    ]));
    const idxFita = csv.split("\n")[0].split(";").indexOf("lado_fitado");
    const valor = csv.split("\n")[1].split(";")[idxFita];
    expect(valor).toBe("esquerda+direita");
  });

  test("lado_fitado troca eixo quando a peça está rotacionada (esquerda/direita → topo/base)", () => {
    const csv = gerarCSVCorte(plano([
      pecaAlocada({ fita_borda: { esquerda: true, direita: false, topo: false, base: false }, rotacionada: true }),
    ]));
    const idxFita = csv.split("\n")[0].split(";").indexOf("lado_fitado");
    const valor = csv.split("\n")[1].split(";")[idxFita];
    expect(valor).toBe("topo");
  });

  test("peça sem fita_borda deixa a coluna vazia", () => {
    const csv = gerarCSVCorte(plano([pecaAlocada({ fita_borda: undefined })]));
    const idxFita = csv.split("\n")[0].split(";").indexOf("lado_fitado");
    const valor = csv.split("\n")[1].split(";")[idxFita];
    expect(valor).toBe("");
  });

  test("colunas originais (etiqueta, posição, rotação) continuam presentes", () => {
    const csv = gerarCSVCorte(plano([pecaAlocada({ etiqueta: "TETO — Módulo X" })]));
    expect(csv).toContain("TETO — Módulo X");
    const cabecalho = csv.split("\n")[0];
    for (const col of ["chapa", "material", "peca", "largura_mm", "comprimento_mm", "x_mm", "y_mm", "rotacionada", "etiqueta"]) {
      expect(cabecalho).toContain(col);
    }
  });
});

// ─── Usinagens manuais (furo) — MVP de usinagens livres ───────────────────────

describe("gerarCSVCorte — coluna de usinagens", () => {
  test("cabeçalho inclui a coluna usinagens", () => {
    const csv = gerarCSVCorte(plano([pecaAlocada()]));
    expect(csv.split("\n")[0]).toContain("usinagens");
  });

  test("peça sem usinagens deixa a coluna vazia", () => {
    const csv = gerarCSVCorte(plano([pecaAlocada()]));
    const idx = csv.split("\n")[0].split(";").indexOf("usinagens");
    expect(csv.split("\n")[1].split(";")[idx]).toBe("");
  });

  test("peça com 1 furo mostra diâmetro e posição na coluna", () => {
    const csv = gerarCSVCorte(plano([
      pecaAlocada({ usinagens: [{ id: "u1", peca_regra_nome: "lateral", tipo: "furo", x_mm: 120, y_mm: 45, diametro_mm: 8 }] }),
    ]));
    const idx = csv.split("\n")[0].split(";").indexOf("usinagens");
    expect(csv.split("\n")[1].split(";")[idx]).toContain("furo Ø8mm @ (120,45)");
  });

  test("peça com 2 furos lista os dois separados por ;  (escapado entre aspas)", () => {
    const csv = gerarCSVCorte(plano([
      pecaAlocada({
        usinagens: [
          { id: "u1", peca_regra_nome: "lateral", tipo: "furo", x_mm: 10, y_mm: 10, diametro_mm: 8 },
          { id: "u2", peca_regra_nome: "lateral", tipo: "furo", x_mm: 200, y_mm: 30, diametro_mm: 5 },
        ],
      }),
    ]));
    const linha = csv.split("\n")[1];
    expect(linha).toContain("furo Ø8mm @ (10,10)");
    expect(linha).toContain("furo Ø5mm @ (200,30)");
  });
});

describe("gerarDXFCorte — furos manuais viram CIRCLE", () => {
  test("peça sem usinagens não gera nenhuma entidade CIRCLE", () => {
    const dxf = gerarDXFCorte(plano([pecaAlocada()]));
    expect(dxf).not.toContain("CIRCLE");
  });

  test("peça com 1 furo gera exatamente 1 CIRCLE, raio = diametro/2", () => {
    const dxf = gerarDXFCorte(plano([
      pecaAlocada({ x_mm: 10, y_mm: 10, usinagens: [{ id: "u1", peca_regra_nome: "lateral", tipo: "furo", x_mm: 120, y_mm: 45, diametro_mm: 8 }] }),
    ]));
    const linhas = dxf.split("\r\n");
    const idxCircle = linhas.indexOf("CIRCLE");
    expect(idxCircle).toBeGreaterThan(-1);
    // Depois de "CIRCLE" vem "8"/layer, então os pares de código/valor de
    // centro (10) e raio (40) — confere que o raio é metade do diâmetro.
    const idxRaio = linhas.indexOf("40", idxCircle);
    expect(Number(linhas[idxRaio + 1])).toBe(4); // 8mm / 2
  });

  test("posição do CIRCLE = posição da peça na chapa + x_mm/y_mm da usinagem", () => {
    const dxf = gerarDXFCorte(plano([
      pecaAlocada({ x_mm: 10, y_mm: 10, usinagens: [{ id: "u1", peca_regra_nome: "lateral", tipo: "furo", x_mm: 120, y_mm: 45, diametro_mm: 8 }] }),
    ]));
    const linhas = dxf.split("\r\n");
    const idxCircle = linhas.indexOf("CIRCLE");
    const idxCentroX = linhas.indexOf("10", idxCircle);
    expect(Number(linhas[idxCentroX + 1])).toBe(130); // offsetX(0) + p.x_mm(10) + u.x_mm(120)
    const idxCentroY = linhas.indexOf("20", idxCentroX);
    expect(Number(linhas[idxCentroY + 1])).toBe(55); // p.y_mm(10) + u.y_mm(45)
  });
});
