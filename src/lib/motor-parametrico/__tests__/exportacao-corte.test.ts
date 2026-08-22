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

// ─── Retângulo da peça rotacionada — bug real achado investigando usinagens ───
//
// PecaAlocada.largura_mm/comprimento_mm JÁ vêm com a troca de eixo aplicada
// pra peça rotacionada (é assim que nesting.ts monta o objeto) — o DXF tinha
// uma troca DE NOVO em cima disso, desenhando o retângulo com a dimensão de
// ANTES da rotação. Pra peça não-quadrada isso desenha um retângulo que
// pode ultrapassar o contorno da chapa. Ver reference_dxf_rotacao_bug.

describe("gerarDXFCorte — retângulo de peça rotacionada", () => {
  function extrairRetangulos(dxf: string): { x: number; y: number; w: number; h: number }[] {
    const linhas = dxf.split("\r\n");
    const retangulos: { x: number; y: number; w: number; h: number }[] = [];
    for (let i = 0; i < linhas.length; i++) {
      if (linhas[i] !== "LWPOLYLINE") continue;
      // próximos 4 pares (10/20) são os 4 vértices, em ordem:
      // (x,y) (x+w,y) (x+w,y+h) (x,y+h)
      const codigos = linhas.slice(i, i + 26);
      const xs: number[] = [];
      const ys: number[] = [];
      for (let j = 0; j < codigos.length - 1; j++) {
        if (codigos[j] === "10") xs.push(Number(codigos[j + 1]));
        if (codigos[j] === "20") ys.push(Number(codigos[j + 1]));
        if (xs.length === 4 && ys.length === 4) break;
      }
      const x = Math.min(...xs), y = Math.min(...ys);
      const w = Math.max(...xs) - x, h = Math.max(...ys) - y;
      retangulos.push({ x, y, w, h });
    }
    return retangulos;
  }

  test("peça NÃO rotacionada: retângulo usa largura_mm/comprimento_mm direto", () => {
    const dxf = gerarDXFCorte(plano([
      pecaAlocada({ x_mm: 0, y_mm: 0, largura_mm: 600, comprimento_mm: 720, rotacionada: false }),
    ]));
    const [, peca1] = extrairRetangulos(dxf); // [0]=contorno da chapa, [1]=peça
    expect(peca1).toMatchObject({ w: 600, h: 720 });
  });

  test("peça ROTACIONADA: retângulo usa largura_mm/comprimento_mm direto, SEM trocar de novo", () => {
    // largura_mm/comprimento_mm aqui já representam a peça COMO FOI COLOCADA
    // (é isso que rotacionada:true significa em PecaAlocada) — o DXF não
    // deve trocar esses valores de novo.
    const dxf = gerarDXFCorte(plano([
      pecaAlocada({ x_mm: 0, y_mm: 0, largura_mm: 2000, comprimento_mm: 1000, rotacionada: true }),
    ]));
    const [, peca1] = extrairRetangulos(dxf);
    expect(peca1).toMatchObject({ w: 2000, h: 1000 });
  });

  test("peça rotacionada nunca ultrapassa o contorno da chapa (regressão do bug)", () => {
    // Chapa 2750×1830 (fixture `material()`); peça 2000×1000 rotacionada
    // cabe dentro dela — se o bug voltar (troca de novo), viraria 1000×2000
    // e estouraria os 1830mm de comprimento da chapa.
    const dxf = gerarDXFCorte(plano([
      pecaAlocada({ x_mm: 10, y_mm: 10, largura_mm: 2000, comprimento_mm: 1000, rotacionada: true }),
    ]));
    const [chapaRet, pecaRet] = extrairRetangulos(dxf);
    expect(pecaRet.y + pecaRet.h).toBeLessThanOrEqual(chapaRet.h);
    expect(pecaRet.x + pecaRet.w).toBeLessThanOrEqual(chapaRet.w);
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
