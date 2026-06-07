import { describe, test, expect } from "vitest";
import {
  ESPECS_MDF,
  ESPECS_FERRAGEM,
  NORMAS,
  BOAS_PRATICAS,
  espessuraParaVao,
  pesoPeca,
  numDobradicasPorPorta,
  corredicaParaProfundidade,
  consultarConhecimento,
  boasPraticasPorCategoria,
} from "../conhecimento-tecnico";
import {
  recomendarLayout,
  analisarProjeto,
} from "../consultor-tecnico";
import { criarAmbienteManual } from "../ambiente";
import { gerarLayoutCozinhaLinear } from "../layout-cozinha-linear";
import { gerarLayoutDormitorio } from "../layout-quarto";
import type { ProjetoFabricavel } from "../tipos";

// ─── Base de conhecimento ─────────────────────────────────────────────────────

describe("conhecimento-tecnico — MDF", () => {
  test("espessuraParaVao recomenda 15mm até 80cm", () => {
    expect(espessuraParaVao(60)).toBe(15);
    expect(espessuraParaVao(80)).toBe(15);
  });

  test("espessuraParaVao recomenda 18mm até 100cm", () => {
    expect(espessuraParaVao(90)).toBe(18);
    expect(espessuraParaVao(100)).toBe(18);
  });

  test("espessuraParaVao recomenda 25mm acima de 100cm", () => {
    expect(espessuraParaVao(120)).toBe(25);
  });

  test("pesoPeca calcula peso plausível (lateral roupeiro)", () => {
    // 600×2500×15mm ≈ 0.0225m³ × 700 ≈ 15.75kg
    const peso = pesoPeca(600, 2500, 15);
    expect(peso).toBeGreaterThan(14);
    expect(peso).toBeLessThan(18);
  });

  test("ESPECS_MDF cobre espessuras comuns", () => {
    expect(ESPECS_MDF[15]).toBeDefined();
    expect(ESPECS_MDF[18].vao_max_prateleira_cm).toBe(100);
  });
});

describe("conhecimento-tecnico — ferragens", () => {
  test("numDobradicasPorPorta segue a regra de altura", () => {
    expect(numDobradicasPorPorta(80)).toBe(2);
    expect(numDobradicasPorPorta(150)).toBe(3);
    expect(numDobradicasPorPorta(200)).toBe(4);
    expect(numDobradicasPorPorta(250)).toBe(5);
  });

  test("corredicaParaProfundidade escolhe pelo tamanho", () => {
    expect(corredicaParaProfundidade(30)).toBe("corredicao_tandem_300mm");
    expect(corredicaParaProfundidade(45)).toBe("corredicao_tandem_400mm");
    expect(corredicaParaProfundidade(55)).toBe("corredicao_tandem_500mm");
  });

  test("ESPECS_FERRAGEM tem capacidade de peso para dobradiça", () => {
    expect(ESPECS_FERRAGEM.dobradica_35mm_110grau?.capacidade_kg).toBeGreaterThan(0);
  });
});

describe("conhecimento-tecnico — normas", () => {
  test("altura de bancada de cozinha é 90cm", () => {
    expect(NORMAS.altura_bancada_cozinha.valor).toBe(90);
  });

  test("circulação mínima é 80cm e ideal 120cm", () => {
    expect(NORMAS.circulacao_minima.valor).toBe(80);
    expect(NORMAS.circulacao_ideal.valor).toBe(120);
  });
});

describe("conhecimento-tecnico — boas práticas", () => {
  test("há boas práticas catalogadas", () => {
    expect(BOAS_PRATICAS.length).toBeGreaterThan(5);
  });

  test("filtra por categoria", () => {
    const ferr = boasPraticasPorCategoria("ferragem");
    expect(ferr.length).toBeGreaterThan(0);
    expect(ferr.every((b) => b.categoria === "ferragem")).toBe(true);
  });
});

describe("consultarConhecimento", () => {
  test("encontra norma de circulação", () => {
    const r = consultarConhecimento("circulação");
    expect(r.some((x) => x.encontrado)).toBe(true);
  });

  test("responde sobre MDF e prateleira", () => {
    const r = consultarConhecimento("prateleira");
    expect(r.length).toBeGreaterThan(0);
  });

  test("consulta sem correspondência retorna não-encontrado", () => {
    const r = consultarConhecimento("xyzabc123");
    expect(r[0].encontrado).toBe(false);
  });
});

// ─── recomendarLayout ─────────────────────────────────────────────────────────

describe("recomendarLayout", () => {
  test("cozinha estreita e longa → linear", () => {
    const amb = criarAmbienteManual({ largura_cm: 400, profundidade_cm: 180, altura_cm: 270 });
    const r = recomendarLayout(amb, "cozinha");
    expect(r.layout).toBe("cozinha_linear");
    expect(r.justificativa.length).toBeGreaterThan(0);
  });

  test("cozinha quadrada grande → L, U ou ilha", () => {
    const amb = criarAmbienteManual({ largura_cm: 450, profundidade_cm: 450, altura_cm: 270 });
    const r = recomendarLayout(amb, "cozinha");
    expect(["cozinha_l", "cozinha_u", "ilha"]).toContain(r.layout);
  });

  test("recomendação tem justificativa e confiança", () => {
    const amb = criarAmbienteManual({ largura_cm: 400, profundidade_cm: 350, altura_cm: 270 });
    const r = recomendarLayout(amb, "cozinha");
    expect(r.confianca).toBeGreaterThan(0);
    expect(r.confianca).toBeLessThanOrEqual(1);
    expect(r.justificativa).toBeTruthy();
  });

  test("quarto → dormitório", () => {
    const amb = criarAmbienteManual({ largura_cm: 350, profundidade_cm: 300, altura_cm: 270 });
    const r = recomendarLayout(amb, "quarto");
    expect(r.layout).toBe("dormitorio");
  });

  test("banheiro com ponto hidráulico sugere a parede certa", () => {
    const amb = criarAmbienteManual({ largura_cm: 200, profundidade_cm: 180, altura_cm: 250 });
    amb.pontos_hidraulicos.push({
      id: "ph", tipo: "entrada_fria", posicao: { x_cm: 50, y_cm: 0 },
      parede: "left", requer_modulo_adjacente: true,
    });
    const r = recomendarLayout(amb, "banheiro");
    expect(r.layout).toBe("banheiro");
    expect(r.paredes_sugeridas).toContain("left");
  });

  test("closet sugere layout em L com mix", () => {
    const amb = criarAmbienteManual({ largura_cm: 300, profundidade_cm: 280, altura_cm: 270 });
    const r = recomendarLayout(amb, "closet");
    expect(r.layout).toBe("closet");
  });
});

// ─── analisarProjeto ──────────────────────────────────────────────────────────

function projetoCozinha(largura = 400): ProjetoFabricavel {
  const amb = criarAmbienteManual({ largura_cm: largura, profundidade_cm: 300, altura_cm: 270 });
  return gerarLayoutCozinhaLinear(amb, {
    cor_mdf_hex: "#fff", ferragem: "nacional",
    tipo_porta_base: "dobradica", tipo_porta_aereo: "dobradica",
    versao_comercial: "intermediaria",
  }).projeto;
}

describe("analisarProjeto", () => {
  test("retorna análise com recomendações", () => {
    const a = analisarProjeto(projetoCozinha());
    expect(a.recomendacoes.length).toBeGreaterThan(0);
    expect(a.resumo.total).toBe(a.recomendacoes.length);
  });

  test("calcula peso total plausível", () => {
    const a = analisarProjeto(projetoCozinha(400));
    expect(a.resumo.peso_total_kg).toBeGreaterThan(0);
  });

  test("recomenda número de dobradiças para portas", () => {
    const a = analisarProjeto(projetoCozinha());
    const dob = a.recomendacoes.find((r) => r.titulo.includes("Dobradiças"));
    expect(dob).toBeDefined();
    expect(dob?.referencia).toBe("BP-05");
  });

  test("cozinha estreita gera atenção de circulação", () => {
    const amb = criarAmbienteManual({ largura_cm: 400, profundidade_cm: 120, altura_cm: 270 });
    const projeto = gerarLayoutCozinhaLinear(amb, {
      cor_mdf_hex: "#fff", ferragem: "nacional",
      tipo_porta_base: "dobradica", tipo_porta_aereo: "dobradica",
      versao_comercial: "intermediaria", parede_principal: "top",
    }).projeto;
    const a = analisarProjeto(projeto);
    const circ = a.recomendacoes.find((r) => r.titulo === "Circulação");
    expect(circ).toBeDefined();
    expect(circ?.severidade).toBe("atencao");
  });

  test("roupeiro sem LED gera sugestão", () => {
    const amb = criarAmbienteManual({ largura_cm: 350, profundidade_cm: 300, altura_cm: 270 });
    const projeto = gerarLayoutDormitorio(amb, {
      cor_mdf_hex: "#fff", ferragem: "nacional", versao_comercial: "intermediaria",
    }).projeto;
    const a = analisarProjeto(projeto);
    const led = a.recomendacoes.find((r) => r.titulo.includes("LED"));
    expect(led).toBeDefined();
    expect(led?.severidade).toBe("sugestao");
  });

  test("é determinística", () => {
    const p = projetoCozinha();
    const a = analisarProjeto(p);
    const b = analisarProjeto(p);
    expect(a.resumo.total).toBe(b.resumo.total);
    expect(a.resumo.peso_total_kg).toBe(b.resumo.peso_total_kg);
  });
});
