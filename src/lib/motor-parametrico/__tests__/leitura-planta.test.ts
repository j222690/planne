import { describe, test, expect } from "vitest";
import {
  parseDXF,
  fatorParaCm,
  boundingBox,
  comprimentoSegmento,
  orientacaoSegmento,
  type SegmentoDXF,
} from "../dxf-parser";
import { dxfParaAmbiente } from "../extracao-geometrica";
import { interpretarPlanta } from "../interpretar-planta";

// ─── Fixtures DXF ──────────────────────────────────────────────────────────────

/**
 * DXF mínimo: um retângulo de 400×300 (em cm) no layer PAREDES,
 * com $INSUNITS = 5 (cm) e um arco de porta de raio 80.
 */
function dxfRetangulo(opts: { insunits?: number; comLayerParede?: boolean; comArco?: boolean } = {}): string {
  const layer = opts.comLayerParede === false ? "0" : "PAREDES";
  const linhas: string[] = [];
  const push = (codigo: number, valor: string | number) => {
    linhas.push(String(codigo));
    linhas.push(String(valor));
  };

  // HEADER com $INSUNITS
  push(0, "SECTION");
  push(2, "HEADER");
  if (opts.insunits !== undefined) {
    push(9, "$INSUNITS");
    push(70, opts.insunits);
  }
  push(0, "ENDSEC");

  // ENTITIES
  push(0, "SECTION");
  push(2, "ENTITIES");

  // 4 linhas formando o retângulo 400×300
  const cantos = [
    [0, 0, 400, 0],     // bottom
    [400, 0, 400, 300], // right
    [400, 300, 0, 300], // top
    [0, 300, 0, 0],     // left
  ];
  for (const [x1, y1, x2, y2] of cantos) {
    push(0, "LINE");
    push(8, layer);
    push(10, x1); push(20, y1);
    push(11, x2); push(21, y2);
  }

  // Arco de porta (raio 80) na parede bottom, centro em x=100,y=0
  if (opts.comArco) {
    push(0, "ARC");
    push(8, "PORTAS");
    push(10, 100); push(20, 0);
    push(40, 80);
    push(50, 0); push(51, 90);
  }

  push(0, "ENDSEC");
  push(0, "EOF");

  return linhas.join("\r\n");
}

// ─── parseDXF ─────────────────────────────────────────────────────────────────

describe("parseDXF", () => {
  test("extrai 4 segmentos de linha do retângulo", () => {
    const dxf = parseDXF(dxfRetangulo());
    expect(dxf.segmentos.length).toBe(4);
  });

  test("lê $INSUNITS = 5 como centímetros", () => {
    const dxf = parseDXF(dxfRetangulo({ insunits: 5 }));
    expect(dxf.unidade).toBe("cm");
  });

  test("lê $INSUNITS = 6 como metros", () => {
    const dxf = parseDXF(dxfRetangulo({ insunits: 6 }));
    expect(dxf.unidade).toBe("m");
  });

  test("lê $INSUNITS = 4 como milímetros", () => {
    const dxf = parseDXF(dxfRetangulo({ insunits: 4 }));
    expect(dxf.unidade).toBe("mm");
  });

  test("sem $INSUNITS retorna desconhecida", () => {
    const dxf = parseDXF(dxfRetangulo());
    expect(dxf.unidade).toBe("desconhecida");
  });

  test("captura os layers", () => {
    const dxf = parseDXF(dxfRetangulo({ comArco: true }));
    expect(dxf.layers).toContain("PAREDES");
    expect(dxf.layers).toContain("PORTAS");
  });

  test("extrai arco quando presente", () => {
    const dxf = parseDXF(dxfRetangulo({ comArco: true }));
    expect(dxf.arcos.length).toBe(1);
    expect(dxf.arcos[0].raio).toBe(80);
  });

  test("parseia LWPOLYLINE fechada", () => {
    const dxf = [
      "0", "SECTION", "2", "ENTITIES",
      "0", "LWPOLYLINE", "8", "PAREDES", "70", "1",
      "10", "0", "20", "0",
      "10", "400", "20", "0",
      "10", "400", "20", "300",
      "10", "0", "20", "300",
      "0", "ENDSEC", "0", "EOF",
    ].join("\r\n");
    const r = parseDXF(dxf);
    // 4 vértices fechados → 4 segmentos
    expect(r.segmentos.length).toBe(4);
  });

  test("lida com CRLF e LF", () => {
    const comLF = dxfRetangulo().replace(/\r\n/g, "\n");
    const dxf = parseDXF(comLF);
    expect(dxf.segmentos.length).toBe(4);
  });

  test("texto vazio não quebra", () => {
    const dxf = parseDXF("");
    expect(dxf.segmentos.length).toBe(0);
  });
});

// ─── Helpers geométricos ──────────────────────────────────────────────────────

describe("helpers geométricos", () => {
  test("fatorParaCm converte corretamente", () => {
    expect(fatorParaCm("cm")).toBe(1);
    expect(fatorParaCm("m")).toBe(100);
    expect(fatorParaCm("mm")).toBe(0.1);
    expect(fatorParaCm("polegada")).toBeCloseTo(2.54);
  });

  test("comprimentoSegmento calcula distância euclidiana", () => {
    const s: SegmentoDXF = { inicio: { x: 0, y: 0 }, fim: { x: 3, y: 4 }, layer: "0" };
    expect(comprimentoSegmento(s)).toBe(5);
  });

  test("orientacaoSegmento detecta horizontal e vertical", () => {
    const h: SegmentoDXF = { inicio: { x: 0, y: 0 }, fim: { x: 100, y: 0 }, layer: "0" };
    const v: SegmentoDXF = { inicio: { x: 0, y: 0 }, fim: { x: 0, y: 100 }, layer: "0" };
    expect(orientacaoSegmento(h)).toBe("horizontal");
    expect(orientacaoSegmento(v)).toBe("vertical");
  });

  test("boundingBox do retângulo", () => {
    const segs = parseDXF(dxfRetangulo()).segmentos;
    const bbox = boundingBox(segs)!;
    expect(bbox.min_x).toBe(0);
    expect(bbox.min_y).toBe(0);
    expect(bbox.max_x).toBe(400);
    expect(bbox.max_y).toBe(300);
  });

  test("boundingBox vazio retorna null", () => {
    expect(boundingBox([])).toBeNull();
  });
});

// ─── dxfParaAmbiente ──────────────────────────────────────────────────────────

describe("dxfParaAmbiente", () => {
  test("reconstrói dimensões corretas (cm declarado)", () => {
    const dxf = parseDXF(dxfRetangulo({ insunits: 5 }));
    const { ambiente } = dxfParaAmbiente(dxf);
    expect(ambiente.dimensoes.largura_cm).toBe(400);
    expect(ambiente.dimensoes.profundidade_cm).toBe(300);
    expect(ambiente.dimensoes.area_m2).toBeCloseTo(12, 1);
  });

  test("converte metros para cm", () => {
    // Retângulo em metros: 4×3
    const dxfM = [
      "0", "SECTION", "2", "HEADER", "9", "$INSUNITS", "70", "6", "0", "ENDSEC",
      "0", "SECTION", "2", "ENTITIES",
      "0", "LINE", "8", "PAREDES", "10", "0", "20", "0", "11", "4", "21", "0",
      "0", "LINE", "8", "PAREDES", "10", "4", "20", "0", "11", "4", "21", "3",
      "0", "LINE", "8", "PAREDES", "10", "4", "20", "3", "11", "0", "21", "3",
      "0", "LINE", "8", "PAREDES", "10", "0", "20", "3", "11", "0", "21", "0",
      "0", "ENDSEC", "0", "EOF",
    ].join("\r\n");
    const { ambiente } = dxfParaAmbiente(parseDXF(dxfM));
    expect(ambiente.dimensoes.largura_cm).toBe(400);
    expect(ambiente.dimensoes.profundidade_cm).toBe(300);
  });

  test("estima unidade quando não declarada (valores em cm)", () => {
    const dxf = parseDXF(dxfRetangulo()); // sem $INSUNITS, valores 0–400
    const { ambiente, diagnosticos } = dxfParaAmbiente(dxf);
    // 400 está na faixa de cm → dimensões plausíveis
    expect(ambiente.dimensoes.largura_cm).toBe(400);
    expect(diagnosticos.some((d) => /estimad/i.test(d))).toBe(true);
  });

  test("4 paredes têm comprimentos corretos", () => {
    const { ambiente } = dxfParaAmbiente(parseDXF(dxfRetangulo({ insunits: 5 })));
    expect(ambiente.paredes.top.comprimento_cm).toBe(400);
    expect(ambiente.paredes.bottom.comprimento_cm).toBe(400);
    expect(ambiente.paredes.left.comprimento_cm).toBe(300);
    expect(ambiente.paredes.right.comprimento_cm).toBe(300);
  });

  test("detecta porta a partir de arco", () => {
    const { ambiente } = dxfParaAmbiente(parseDXF(dxfRetangulo({ insunits: 5, comArco: true })));
    const portas = Object.values(ambiente.paredes).flatMap((p) =>
      p.aberturas.filter((a) => a._tipo === "porta"),
    );
    expect(portas.length).toBeGreaterThan(0);
  });

  test("confiança maior com unidade declarada + layer de parede", () => {
    const comTudo = dxfParaAmbiente(parseDXF(dxfRetangulo({ insunits: 5 })));
    const semNada = dxfParaAmbiente(parseDXF(dxfRetangulo({ comLayerParede: false })));
    expect(comTudo.confianca).toBeGreaterThan(semNada.confianca);
  });

  test("DXF vazio retorna confiança 0", () => {
    const { confianca } = dxfParaAmbiente(parseDXF(""));
    expect(confianca).toBe(0);
  });

  test("fonte do ambiente é 'dwg'", () => {
    const { ambiente } = dxfParaAmbiente(parseDXF(dxfRetangulo({ insunits: 5 })));
    expect(ambiente.fonte).toBe("dwg");
  });
});

// ─── interpretarPlanta (pipeline) ─────────────────────────────────────────────

describe("interpretarPlanta", () => {
  test("formato dxf é determinístico", () => {
    const r = interpretarPlanta({ formato: "dxf", dxf_texto: dxfRetangulo({ insunits: 5 }) });
    expect(r.deterministico).toBe(true);
    expect(r.ambiente.dimensoes.largura_cm).toBe(400);
  });

  test("formato dxf sem texto retorna erro", () => {
    const r = interpretarPlanta({ formato: "dxf" });
    expect(r.confianca).toBe(0);
    expect(r.diagnosticos[0]).toMatch(/não fornecido/i);
  });

  test("formato manual tem confiança máxima", () => {
    const r = interpretarPlanta({
      formato: "manual",
      medidas: { largura_cm: 350, profundidade_cm: 280, altura_cm: 270 },
    });
    expect(r.confianca).toBe(1);
    expect(r.deterministico).toBe(true);
    expect(r.ambiente.dimensoes.largura_cm).toBe(350);
  });

  test("formato imagem usa análise de IA (não determinístico)", () => {
    const r = interpretarPlanta({
      formato: "imagem",
      planta_ia: { largura_cm: 400, profundidade_cm: 300, altura_cm: 270 },
    });
    expect(r.deterministico).toBe(false);
    expect(r.ambiente.dimensoes.largura_cm).toBe(400);
    expect(r.ambiente.fonte).toBe("imagem");
  });

  test("formato pdf marca fonte pdf", () => {
    const r = interpretarPlanta({
      formato: "pdf",
      planta_ia: { largura_cm: 400, profundidade_cm: 300, altura_cm: 270 },
    });
    expect(r.ambiente.fonte).toBe("pdf");
  });

  test("imagem sem análise IA retorna erro", () => {
    const r = interpretarPlanta({ formato: "imagem" });
    expect(r.confianca).toBe(0);
  });
});

// ─── Integração: DXF → motor de layout ────────────────────────────────────────

describe("integração DXF → motor", () => {
  test("ambiente extraído de DXF é usável pelo motor de cozinha", async () => {
    const { gerarLayoutCozinhaLinear } = await import("../layout-cozinha-linear");
    const r = interpretarPlanta({ formato: "dxf", dxf_texto: dxfRetangulo({ insunits: 5 }) });
    const layout = gerarLayoutCozinhaLinear(r.ambiente, {
      cor_mdf_hex: "#fff",
      ferragem: "nacional",
      tipo_porta_base: "dobradica",
      tipo_porta_aereo: "dobradica",
      versao_comercial: "intermediaria",
    });
    expect(layout.projeto.modulos.length).toBeGreaterThan(0);
    expect(layout.projeto.metricas.num_pecas_total).toBeGreaterThan(0);
  });
});
