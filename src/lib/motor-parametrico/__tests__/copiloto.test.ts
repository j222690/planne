import { describe, test, expect } from "vitest";
import {
  orquestrarProjeto,
  calcularIndicadores,
  analisarViabilidade,
  gerarSugestoes,
} from "../copiloto";
import {
  FERRAMENTAS_COPILOTO,
  FERRAMENTAS_POR_NOME,
  ferramentasFormatoOpenAI,
  executarFerramenta,
} from "../copiloto-tools";
import { criarAmbienteManual } from "../ambiente";
import type { AmbienteGeometrico } from "../tipos";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function amb(largura = 400, profundidade = 300): AmbienteGeometrico {
  return criarAmbienteManual({ largura_cm: largura, profundidade_cm: profundidade, altura_cm: 270 });
}

// ─── orquestrarProjeto ────────────────────────────────────────────────────────

describe("orquestrarProjeto — pipeline completo", () => {
  test("gera pacote completo com todas as seções", () => {
    const p = orquestrarProjeto(amb(), "cozinha");
    expect(p.projeto).toBeDefined();
    expect(p.validacao).toBeDefined();
    expect(p.engenharia).toBeDefined();
    expect(p.orcamentos).toBeDefined();
    expect(p.plano_corte).toBeDefined();
    expect(p.pcp).toBeDefined();
    expect(p.analise_tecnica).toBeDefined();
    expect(p.indicadores).toBeDefined();
    expect(p.viabilidade).toBeDefined();
    expect(Array.isArray(p.sugestoes)).toBe(true);
  });

  test("usa o layout recomendado pela IA quando não forçado", () => {
    const p = orquestrarProjeto(amb(400, 180), "cozinha");
    expect(p.layout_usado).toBe(p.recomendacao_layout.layout);
    expect(p.layout_usado).toBe("cozinha_linear");
  });

  test("respeita layout forçado", () => {
    const p = orquestrarProjeto(amb(400, 350), "cozinha", { layout_forcado: "cozinha_l" });
    expect(p.layout_usado).toBe("cozinha_l");
    expect(p.projeto.tipo_ambiente).toBe("Cozinha em L");
  });

  test("gera projeto para cada tipo de cômodo", () => {
    const cozinha = orquestrarProjeto(amb(400, 300), "cozinha");
    const quarto = orquestrarProjeto(amb(350, 300), "quarto");
    const banheiro = orquestrarProjeto(amb(200, 180), "banheiro");
    expect(cozinha.projeto.modulos.length).toBeGreaterThan(0);
    expect(quarto.projeto.modulos.length).toBeGreaterThan(0);
    expect(banheiro.projeto.modulos.length).toBeGreaterThan(0);
  });

  test("orçamento tem 3 versões com preços crescentes", () => {
    const p = orquestrarProjeto(amb(), "cozinha");
    const c = p.orcamentos.comparativo;
    expect(c.preco_premium).toBeGreaterThan(c.preco_intermediaria);
    expect(c.preco_intermediaria).toBeGreaterThan(c.preco_economica);
  });

  test("PCP tem DAG válido", () => {
    const p = orquestrarProjeto(amb(), "cozinha");
    expect(p.pcp.dag_valido).toBe(true);
  });

  test("é determinístico (mesma entrada → mesmos indicadores)", () => {
    const a = orquestrarProjeto(amb(), "cozinha");
    const b = orquestrarProjeto(amb(), "cozinha");
    expect(a.indicadores.preco_venda_intermediaria).toBe(b.indicadores.preco_venda_intermediaria);
    expect(a.indicadores.num_pecas).toBe(b.indicadores.num_pecas);
  });
});

// ─── Indicadores ──────────────────────────────────────────────────────────────

describe("calcularIndicadores", () => {
  test("indicadores são coerentes e positivos", () => {
    const p = orquestrarProjeto(amb(), "cozinha");
    const i = p.indicadores;
    expect(i.linear_marcenaria_m).toBeGreaterThan(0);
    expect(i.peso_total_kg).toBeGreaterThan(0);
    expect(i.num_pecas).toBeGreaterThan(0);
    expect(i.num_chapas).toBeGreaterThan(0);
    expect(i.preco_por_metro_linear).toBeGreaterThan(0);
    expect(i.preco_por_m2_frontal).toBeGreaterThan(0);
  });

  test("aproveitamento de chapa entre 0 e 100", () => {
    const p = orquestrarProjeto(amb(), "cozinha");
    expect(p.indicadores.aproveitamento_chapa_pct).toBeGreaterThan(0);
    expect(p.indicadores.aproveitamento_chapa_pct).toBeLessThanOrEqual(100);
  });

  test("preço por metro linear = preço / linear", () => {
    const p = orquestrarProjeto(amb(), "cozinha");
    const i = p.indicadores;
    const esperado = Math.round(i.preco_venda_intermediaria / i.linear_marcenaria_m);
    expect(i.preco_por_metro_linear).toBe(esperado);
  });
});

// ─── Viabilidade ──────────────────────────────────────────────────────────────

describe("analisarViabilidade", () => {
  test("projeto saudável tem risco baixo", () => {
    const p = orquestrarProjeto(amb(400, 300), "cozinha");
    expect(["baixo", "medio"]).toContain(p.viabilidade.nivel_risco);
    expect(p.viabilidade.score_geral).toBeGreaterThan(50);
  });

  test("avalia 4 fatores (validação, margem, desperdício, prazo)", () => {
    const p = orquestrarProjeto(amb(), "cozinha");
    expect(p.viabilidade.fatores.length).toBe(4);
    const nomes = p.viabilidade.fatores.map((f) => f.fator);
    expect(nomes).toContain("Margem comercial");
    expect(nomes).toContain("Prazo de produção");
  });

  test("cozinha estreita (reprovada) tem risco alto", () => {
    const p = orquestrarProjeto(amb(400, 120), "cozinha", { layout_forcado: "cozinha_linear" });
    // circulação insuficiente → validação reprovada → fator crítico
    expect(p.viabilidade.nivel_risco).toBe("alto");
  });

  test("score_geral entre 0 e 100", () => {
    const p = orquestrarProjeto(amb(), "cozinha");
    expect(p.viabilidade.score_geral).toBeGreaterThanOrEqual(0);
    expect(p.viabilidade.score_geral).toBeLessThanOrEqual(100);
  });
});

// ─── Sugestões ────────────────────────────────────────────────────────────────

describe("gerarSugestoes", () => {
  test("sempre sugere upsell premium (ganho positivo)", () => {
    const p = orquestrarProjeto(amb(), "cozinha");
    const upsell = p.sugestoes.find((s) => s.titulo.includes("upsell"));
    expect(upsell).toBeDefined();
    expect(upsell?.categoria).toBe("comercial");
  });

  test("cozinha reprovada gera sugestão de alta prioridade", () => {
    const p = orquestrarProjeto(amb(400, 120), "cozinha", { layout_forcado: "cozinha_linear" });
    const alta = p.sugestoes.filter((s) => s.prioridade === "alta");
    expect(alta.length).toBeGreaterThan(0);
  });

  test("cada sugestão tem prioridade, categoria, título e ação", () => {
    const p = orquestrarProjeto(amb(), "cozinha");
    p.sugestoes.forEach((s) => {
      expect(["alta", "media", "baixa"]).toContain(s.prioridade);
      expect(["design", "custo", "producao", "comercial"]).toContain(s.categoria);
      expect(s.titulo.length).toBeGreaterThan(0);
      expect(s.acao.length).toBeGreaterThan(0);
    });
  });
});

// ─── Ferramentas (LLM tools) ──────────────────────────────────────────────────

describe("copiloto-tools", () => {
  test("catálogo tem ferramentas", () => {
    expect(FERRAMENTAS_COPILOTO.length).toBeGreaterThanOrEqual(5);
  });

  test("cada ferramenta tem nome, descrição, schema e executor", () => {
    FERRAMENTAS_COPILOTO.forEach((f) => {
      expect(f.nome).toBeTruthy();
      expect(f.descricao).toBeTruthy();
      expect(f.parametros.type).toBe("object");
      expect(typeof f.executar).toBe("function");
    });
  });

  test("formato OpenAI tem type=function", () => {
    const tools = ferramentasFormatoOpenAI() as { type: string; function: { name: string } }[];
    expect(tools.every((t) => t.type === "function")).toBe(true);
    expect(tools.every((t) => t.function.name)).toBe(true);
  });

  test("executarFerramenta criar_ambiente retorna ambiente", () => {
    const r = executarFerramenta("criar_ambiente", { largura_cm: 400, profundidade_cm: 300 }) as { dimensoes: { largura_cm: number } };
    expect(r.dimensoes.largura_cm).toBe(400);
  });

  test("executarFerramenta recomendar_layout retorna recomendação", () => {
    const r = executarFerramenta("recomendar_layout", { largura_cm: 400, profundidade_cm: 180, tipo_comodo: "cozinha" }) as { layout: string };
    expect(r.layout).toBe("cozinha_linear");
  });

  test("executarFerramenta gerar_projeto_completo retorna resumo", () => {
    const r = executarFerramenta("gerar_projeto_completo", { largura_cm: 400, profundidade_cm: 300, tipo_comodo: "cozinha" }) as { layout: string; indicadores: unknown; sugestoes: unknown[] };
    expect(r.layout).toBeTruthy();
    expect(r.indicadores).toBeDefined();
    expect(Array.isArray(r.sugestoes)).toBe(true);
  });

  test("executarFerramenta consultar_conhecimento responde", () => {
    const r = executarFerramenta("consultar_conhecimento", { consulta: "circulação" }) as unknown[];
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBeGreaterThan(0);
  });

  test("ferramenta desconhecida lança erro", () => {
    expect(() => executarFerramenta("inexistente", {})).toThrow();
  });

  test("FERRAMENTAS_POR_NOME indexa corretamente", () => {
    expect(FERRAMENTAS_POR_NOME["criar_ambiente"]).toBeDefined();
    expect(FERRAMENTAS_POR_NOME["gerar_projeto_completo"]).toBeDefined();
  });
});
