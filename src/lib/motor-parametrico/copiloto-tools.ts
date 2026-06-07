/**
 * PLANNE — Motor Paramétrico
 * Fase 11: Copiloto da Marcenaria — Catálogo de Ferramentas (LLM tools)
 *
 * Define as ferramentas que a camada conversacional (LLM) pode invocar para
 * operar o motor. Cada ferramenta tem schema (para o tool-calling) e um
 * executor determinístico que chama o motor.
 *
 * Princípio da Vision: "A IA decide. O motor paramétrico constrói." O LLM
 * escolhe QUAL ferramenta chamar e com quais argumentos; a execução é 100%
 * determinística e auditável.
 */

import { criarAmbienteManual } from "./ambiente";
import { interpretarPlanta } from "./interpretar-planta";
import { recomendarLayout } from "./consultor-tecnico";
import { consultarConhecimento } from "./conhecimento-tecnico";
import { orquestrarProjeto, type TipoComodo, type PreferenciasCopiloto } from "./copiloto";
import type { ParedeId } from "./tipos";

// ─── DEFINIÇÃO DE FERRAMENTA ──────────────────────────────────────────────────

export interface PropriedadeSchema {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: string[];
  items?: { type: string };
}

export interface FerramentaCopiloto {
  nome: string;
  descricao: string;
  parametros: {
    type: "object";
    properties: Record<string, PropriedadeSchema>;
    required: string[];
  };
  /** Executor determinístico. */
  executar: (args: Record<string, unknown>) => unknown;
}

// ─── FERRAMENTAS ──────────────────────────────────────────────────────────────

const num = (v: unknown, fallback = 0): number => (typeof v === "number" ? v : Number(v) || fallback);
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);

/** 1. Criar ambiente a partir de medidas. */
const ferramentaCriarAmbiente: FerramentaCopiloto = {
  nome: "criar_ambiente",
  descricao: "Cria um ambiente geométrico a partir de medidas em centímetros (largura, profundidade, altura).",
  parametros: {
    type: "object",
    properties: {
      largura_cm: { type: "number", description: "Largura do ambiente em cm" },
      profundidade_cm: { type: "number", description: "Profundidade do ambiente em cm" },
      altura_cm: { type: "number", description: "Pé-direito em cm (default 270)" },
      porta_parede: { type: "string", description: "Parede da porta", enum: ["top", "bottom", "left", "right"] },
    },
    required: ["largura_cm", "profundidade_cm"],
  },
  executar: (a) => criarAmbienteManual({
    largura_cm: num(a.largura_cm, 400),
    profundidade_cm: num(a.profundidade_cm, 300),
    altura_cm: num(a.altura_cm, 270),
    porta_parede: a.porta_parede as ParedeId | undefined,
  }),
};

/** 2. Interpretar planta (DXF ou medidas). */
const ferramentaInterpretarPlanta: FerramentaCopiloto = {
  nome: "interpretar_planta",
  descricao: "Interpreta uma planta DXF (texto) e devolve o ambiente geométrico com dimensões reais.",
  parametros: {
    type: "object",
    properties: {
      dxf_texto: { type: "string", description: "Conteúdo de texto de um arquivo DXF" },
    },
    required: ["dxf_texto"],
  },
  executar: (a) => interpretarPlanta({ formato: "dxf", dxf_texto: str(a.dxf_texto) }),
};

/** 3. Recomendar layout para um ambiente. */
const ferramentaRecomendarLayout: FerramentaCopiloto = {
  nome: "recomendar_layout",
  descricao: "Recomenda o melhor tipo de layout para um ambiente e tipo de cômodo, com justificativa técnica.",
  parametros: {
    type: "object",
    properties: {
      largura_cm: { type: "number", description: "Largura em cm" },
      profundidade_cm: { type: "number", description: "Profundidade em cm" },
      tipo_comodo: { type: "string", description: "Tipo de cômodo", enum: ["cozinha", "quarto", "closet", "banheiro", "lavanderia"] },
    },
    required: ["largura_cm", "profundidade_cm", "tipo_comodo"],
  },
  executar: (a) => {
    const amb = criarAmbienteManual({
      largura_cm: num(a.largura_cm, 400),
      profundidade_cm: num(a.profundidade_cm, 300),
      altura_cm: num(a.altura_cm, 270),
    });
    return recomendarLayout(amb, str(a.tipo_comodo, "cozinha") as TipoComodo);
  },
};

/** 4. Gerar projeto completo (orquestração). */
const ferramentaGerarProjeto: FerramentaCopiloto = {
  nome: "gerar_projeto_completo",
  descricao: "Gera um projeto completo: layout, validação, orçamento (3 versões), plano de corte, PCP, indicadores e sugestões.",
  parametros: {
    type: "object",
    properties: {
      largura_cm: { type: "number", description: "Largura em cm" },
      profundidade_cm: { type: "number", description: "Profundidade em cm" },
      altura_cm: { type: "number", description: "Pé-direito em cm" },
      tipo_comodo: { type: "string", description: "Tipo de cômodo", enum: ["cozinha", "quarto", "closet", "banheiro", "lavanderia"] },
      cor_mdf_hex: { type: "string", description: "Cor do MDF em hex" },
      ferragem: { type: "string", description: "Qualidade da ferragem", enum: ["nacional", "blum", "hafele", "grass"] },
    },
    required: ["largura_cm", "profundidade_cm", "tipo_comodo"],
  },
  executar: (a) => {
    const amb = criarAmbienteManual({
      largura_cm: num(a.largura_cm, 400),
      profundidade_cm: num(a.profundidade_cm, 300),
      altura_cm: num(a.altura_cm, 270),
    });
    const prefs: PreferenciasCopiloto = {
      cor_mdf_hex: a.cor_mdf_hex ? str(a.cor_mdf_hex) : undefined,
      ferragem: a.ferragem as PreferenciasCopiloto["ferragem"],
    };
    const pacote = orquestrarProjeto(amb, str(a.tipo_comodo, "cozinha") as TipoComodo, prefs);
    // Resumo enxuto para o LLM (evita devolver o projeto inteiro)
    return {
      layout: pacote.layout_usado,
      justificativa: pacote.recomendacao_layout.justificativa,
      validacao: pacote.validacao.status,
      score: pacote.validacao.score,
      indicadores: pacote.indicadores,
      viabilidade: pacote.viabilidade,
      precos: pacote.orcamentos.comparativo,
      sugestoes: pacote.sugestoes,
    };
  },
};

/** 5. Consultar conhecimento técnico. */
const ferramentaConsultarConhecimento: FerramentaCopiloto = {
  nome: "consultar_conhecimento",
  descricao: "Consulta a base de conhecimento técnico de marcenaria (MDF, ferragens, normas, boas práticas).",
  parametros: {
    type: "object",
    properties: {
      consulta: { type: "string", description: "Termo ou pergunta técnica (ex.: 'circulação', 'prateleira', 'dobradiça')" },
    },
    required: ["consulta"],
  },
  executar: (a) => consultarConhecimento(str(a.consulta)),
};

// ─── CATÁLOGO ─────────────────────────────────────────────────────────────────

export const FERRAMENTAS_COPILOTO: FerramentaCopiloto[] = [
  ferramentaCriarAmbiente,
  ferramentaInterpretarPlanta,
  ferramentaRecomendarLayout,
  ferramentaGerarProjeto,
  ferramentaConsultarConhecimento,
];

/** Mapa nome → ferramenta, para execução pelo agente. */
export const FERRAMENTAS_POR_NOME: Record<string, FerramentaCopiloto> =
  Object.fromEntries(FERRAMENTAS_COPILOTO.map((f) => [f.nome, f]));

/**
 * Exporta o catálogo no formato de tools da OpenAI (function calling).
 */
export function ferramentasFormatoOpenAI(): unknown[] {
  return FERRAMENTAS_COPILOTO.map((f) => ({
    type: "function",
    function: {
      name: f.nome,
      description: f.descricao,
      parameters: f.parametros,
    },
  }));
}

/**
 * Executa uma ferramenta pelo nome. Lança se a ferramenta não existir.
 */
export function executarFerramenta(nome: string, args: Record<string, unknown>): unknown {
  const ferramenta = FERRAMENTAS_POR_NOME[nome];
  if (!ferramenta) throw new Error(`Ferramenta desconhecida: ${nome}`);
  return ferramenta.executar(args);
}
