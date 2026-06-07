/**
 * PLANNE — Motor Paramétrico
 * Fase 11: Copiloto da Marcenaria — Orquestração End-to-End
 *
 * O copiloto costura todas as fases (1–10) num pipeline único e produz, além
 * do projeto, os indicadores de negócio, a análise de viabilidade e as
 * sugestões automáticas acionáveis.
 *
 *   recomendar layout → gerar layout → validar → engenharia → orçamento
 *     → plano de corte → PCP → análise técnica → indicadores → sugestões
 *
 * Tudo determinístico e testável. A camada conversacional (LLM) consome este
 * orquestrador via copiloto-tools.
 */

import type {
  AmbienteGeometrico,
  ProjetoFabricavel,
  ParedeId,
  VersaoComercial,
  ConfiguracaoModulo,
} from "./tipos";
import type { ResultadoValidacao } from "./rule-engine";
import type { ListaEngenharia } from "./engenharia";
import type { TresVersoes } from "./orcamento-inteligente";
import type { PlanoNesting } from "./tipos";
import type { ResultadoPCP } from "./pcp";
import type { AnaliseTecnica, RecomendacaoLayout, TipoLayoutRecomendado } from "./consultor-tecnico";

import { gerarLayoutCozinhaLinear } from "./layout-cozinha-linear";
import { gerarLayoutCozinhaL, gerarLayoutCozinhaU } from "./layout-cozinha-l-u";
import { gerarLayoutIlha } from "./layout-ilha";
import { gerarLayoutDormitorio, gerarLayoutCloset } from "./layout-quarto";
import { gerarLayoutBanheiro, gerarLayoutLavanderia } from "./layout-servicos";
import { gerarEngenharia } from "./engenharia";
import { gerarTresVersoes } from "./orcamento-inteligente";
import { gerarPlanoNesting } from "./nesting";
import { gerarOrdemProducao } from "./pcp";
import { gerarListaCompras } from "./engenharia";
import { recomendarLayout, analisarProjeto } from "./consultor-tecnico";

// ─── ENTRADA ──────────────────────────────────────────────────────────────────

export type TipoComodo = "cozinha" | "quarto" | "closet" | "banheiro" | "lavanderia";

export interface PreferenciasCopiloto {
  cor_mdf_hex?: string;
  ferragem?: ConfiguracaoModulo["ferragem"];
  versao_comercial?: VersaoComercial;
  tipo_porta?: "dobradica" | "correr" | "espelho" | "basculante";
  /** Força um layout específico; se omitido, usa a recomendação da IA. */
  layout_forcado?: TipoLayoutRecomendado;
  paredes?: ParedeId[];
  empresa_id?: string;
  cliente_id?: string;
  criado_por?: string;
  nome?: string;
}

// ─── INDICADORES DE NEGÓCIO ───────────────────────────────────────────────────

export interface IndicadoresNegocio {
  linear_marcenaria_m: number;
  area_frontal_m2: number;
  peso_total_kg: number;
  num_modulos: number;
  num_pecas: number;
  num_ferragens: number;
  num_chapas: number;
  aproveitamento_chapa_pct: number;
  desperdicio_pct: number;
  /** Preço da versão intermediária por metro linear de marcenaria. */
  preco_por_metro_linear: number;
  /** Preço da versão intermediária por m² frontal. */
  preco_por_m2_frontal: number;
  margem_intermediaria_pct: number;
  prazo_producao_dias: number;
  custo_total_intermediaria: number;
  preco_venda_intermediaria: number;
}

// ─── ANÁLISE DE VIABILIDADE (preditiva) ───────────────────────────────────────

export type NivelRisco = "baixo" | "medio" | "alto";

export interface AnaliseViabilidade {
  nivel_risco: NivelRisco;
  /** Score geral 0–100 (combina validação, margem, desperdício, prazo). */
  score_geral: number;
  fatores: {
    fator: string;
    status: "ok" | "atencao" | "critico";
    detalhe: string;
  }[];
}

// ─── SUGESTÕES AUTOMÁTICAS ────────────────────────────────────────────────────

export interface Sugestao {
  prioridade: "alta" | "media" | "baixa";
  categoria: "design" | "custo" | "producao" | "comercial";
  titulo: string;
  acao: string;
}

// ─── PACOTE COMPLETO ──────────────────────────────────────────────────────────

export interface PacoteProjeto {
  recomendacao_layout: RecomendacaoLayout;
  layout_usado: TipoLayoutRecomendado;
  projeto: ProjetoFabricavel;
  validacao: ResultadoValidacao;
  engenharia: ListaEngenharia;
  orcamentos: TresVersoes;
  plano_corte: PlanoNesting;
  pcp: ResultadoPCP;
  analise_tecnica: AnaliseTecnica;
  indicadores: IndicadoresNegocio;
  viabilidade: AnaliseViabilidade;
  sugestoes: Sugestao[];
  tempo_ms: number;
}

// ─── ORQUESTRADOR PRINCIPAL ───────────────────────────────────────────────────

interface ResultadoLayoutComum {
  projeto: ProjetoFabricavel;
  validacao: ResultadoValidacao;
  avisos: string[];
}

/**
 * Gera o pacote completo de um projeto, do layout à produção, com indicadores
 * e sugestões. É o ponto de entrada único do copiloto.
 */
export function orquestrarProjeto(
  ambiente: AmbienteGeometrico,
  tipoComodo: TipoComodo,
  prefs: PreferenciasCopiloto = {},
): PacoteProjeto {
  const inicio = Date.now();

  // 1. Recomendar layout (IA Marceneira)
  const recomendacao = recomendarLayout(ambiente, tipoComodo);
  const layout = prefs.layout_forcado ?? recomendacao.layout;

  // 2. Gerar o layout escolhido
  const r = gerarPorTipo(layout, ambiente, prefs, recomendacao.paredes_sugeridas);

  // 3. Rodar todas as fases sobre o projeto
  const engenharia = gerarEngenharia(r.projeto);
  const orcamentos = gerarTresVersoes(r.projeto);
  const plano_corte = gerarPlanoNesting(
    r.projeto.modulos.flatMap((m) => m.pecas),
    r.projeto.metricas.metros_fita_borda,
  );
  const lista_compras = gerarListaCompras(r.projeto);
  const pcp = gerarOrdemProducao(r.projeto, plano_corte, { lista_compras });
  const analise_tecnica = analisarProjeto(r.projeto);

  // 4. Indicadores, viabilidade e sugestões
  const indicadores = calcularIndicadores(r.projeto, orcamentos, plano_corte, pcp, analise_tecnica);
  const viabilidade = analisarViabilidade(r.validacao, indicadores, plano_corte);
  const sugestoes = gerarSugestoes(r.validacao, analise_tecnica, indicadores, orcamentos);

  return {
    recomendacao_layout: recomendacao,
    layout_usado: layout,
    projeto: r.projeto,
    validacao: r.validacao,
    engenharia,
    orcamentos,
    plano_corte,
    pcp,
    analise_tecnica,
    indicadores,
    viabilidade,
    sugestoes,
    tempo_ms: Date.now() - inicio,
  };
}

// ─── DISPATCH DE LAYOUT ───────────────────────────────────────────────────────

function gerarPorTipo(
  layout: TipoLayoutRecomendado,
  ambiente: AmbienteGeometrico,
  prefs: PreferenciasCopiloto,
  paredesSugeridas?: ParedeId[],
): ResultadoLayoutComum {
  const base = {
    cor_mdf_hex: prefs.cor_mdf_hex ?? "#f5f3f0",
    ferragem: prefs.ferragem ?? "nacional" as const,
    versao_comercial: prefs.versao_comercial ?? "intermediaria" as const,
    empresa_id: prefs.empresa_id,
    cliente_id: prefs.cliente_id,
    criado_por: prefs.criado_por,
    nome: prefs.nome,
  };
  const paredes = prefs.paredes ?? paredesSugeridas;

  switch (layout) {
    case "cozinha_l": {
      const r = gerarLayoutCozinhaL(ambiente, { ...base, tipo_porta_base: "dobradica", tipo_porta_aereo: "dobradica", paredes });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos };
    }
    case "cozinha_u": {
      const r = gerarLayoutCozinhaU(ambiente, { ...base, tipo_porta_base: "dobradica", tipo_porta_aereo: "dobradica", paredes });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos };
    }
    case "ilha": {
      const r = gerarLayoutIlha(ambiente, { ...base });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos };
    }
    case "dormitorio": {
      const r = gerarLayoutDormitorio(ambiente, { ...base, tipo_porta: prefs.tipo_porta as "dobradica" | "correr" | "espelho" | undefined, paredes });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos };
    }
    case "closet": {
      const r = gerarLayoutCloset(ambiente, { ...base, tipo_porta: prefs.tipo_porta as "dobradica" | "correr" | "espelho" | undefined, paredes });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos };
    }
    case "banheiro": {
      const r = gerarLayoutBanheiro(ambiente, { ...base, parede_principal: paredes?.[0] });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos };
    }
    case "lavanderia": {
      const r = gerarLayoutLavanderia(ambiente, { ...base, parede_principal: paredes?.[0] });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos };
    }
    case "cozinha_linear":
    default: {
      const r = gerarLayoutCozinhaLinear(ambiente, { ...base, parede_principal: paredes?.[0], tipo_porta_base: "dobradica", tipo_porta_aereo: "dobradica" });
      return { projeto: r.projeto, validacao: r.validacao, avisos: r.avisos };
    }
  }
}

// ─── INDICADORES ──────────────────────────────────────────────────────────────

export function calcularIndicadores(
  projeto: ProjetoFabricavel,
  orcamentos: TresVersoes,
  plano: PlanoNesting,
  pcp: ResultadoPCP,
  analise: AnaliseTecnica,
): IndicadoresNegocio {
  const linearM = projeto.metricas.linear_marcenaria_cm / 100;
  const areaFrontal = projeto.metricas.area_frontal_m2;
  const precoInter = orcamentos.intermediaria.analise_financeira.preco_venda;
  const aproveitamentoMedio = plano.chapas.length > 0
    ? Math.round(plano.chapas.reduce((s, c) => s + c.eficiencia_pct, 0) / plano.chapas.length * 10) / 10
    : 0;

  return {
    linear_marcenaria_m: Math.round(linearM * 100) / 100,
    area_frontal_m2: areaFrontal,
    peso_total_kg: analise.resumo.peso_total_kg,
    num_modulos: projeto.metricas.num_modulos,
    num_pecas: projeto.metricas.num_pecas_total,
    num_ferragens: projeto.metricas.num_ferragens_total,
    num_chapas: plano.resumo.total_chapas,
    aproveitamento_chapa_pct: aproveitamentoMedio,
    desperdicio_pct: plano.resumo.desperdicio_pct,
    preco_por_metro_linear: linearM > 0 ? Math.round(precoInter / linearM) : 0,
    preco_por_m2_frontal: areaFrontal > 0 ? Math.round(precoInter / areaFrontal) : 0,
    margem_intermediaria_pct: orcamentos.intermediaria.analise_financeira.margem_desejada_pct,
    prazo_producao_dias: pcp.prazo_dias_uteis,
    custo_total_intermediaria: orcamentos.intermediaria.analise_financeira.custo_total,
    preco_venda_intermediaria: precoInter,
  };
}

// ─── VIABILIDADE ──────────────────────────────────────────────────────────────

export function analisarViabilidade(
  validacao: ResultadoValidacao,
  indicadores: IndicadoresNegocio,
  plano: PlanoNesting,
): AnaliseViabilidade {
  const fatores: AnaliseViabilidade["fatores"] = [];

  // Validação do projeto
  fatores.push({
    fator: "Validação do projeto",
    status: validacao.status === "reprovado" ? "critico" : validacao.status === "aprovado_com_alertas" ? "atencao" : "ok",
    detalhe: `${validacao.status} (score ${validacao.score})`,
  });

  // Margem
  fatores.push({
    fator: "Margem comercial",
    status: indicadores.margem_intermediaria_pct >= 40 ? "ok" : indicadores.margem_intermediaria_pct >= 30 ? "atencao" : "critico",
    detalhe: `${indicadores.margem_intermediaria_pct}% na versão intermediária`,
  });

  // Desperdício
  fatores.push({
    fator: "Aproveitamento de chapa",
    status: plano.resumo.desperdicio_pct <= 15 ? "ok" : plano.resumo.desperdicio_pct <= 25 ? "atencao" : "critico",
    detalhe: `${plano.resumo.desperdicio_pct}% de desperdício total`,
  });

  // Prazo
  fatores.push({
    fator: "Prazo de produção",
    status: indicadores.prazo_producao_dias <= 10 ? "ok" : indicadores.prazo_producao_dias <= 20 ? "atencao" : "critico",
    detalhe: `${indicadores.prazo_producao_dias} dias úteis`,
  });

  const criticos = fatores.filter((f) => f.status === "critico").length;
  const atencoes = fatores.filter((f) => f.status === "atencao").length;

  const nivel_risco: NivelRisco = criticos > 0 ? "alto" : atencoes >= 2 ? "medio" : "baixo";
  const score_geral = Math.max(0, 100 - criticos * 25 - atencoes * 10);

  return { nivel_risco, score_geral, fatores };
}

// ─── SUGESTÕES ────────────────────────────────────────────────────────────────

export function gerarSugestoes(
  validacao: ResultadoValidacao,
  analise: AnaliseTecnica,
  indicadores: IndicadoresNegocio,
  orcamentos: TresVersoes,
): Sugestao[] {
  const sugestoes: Sugestao[] = [];

  // Erros de validação → alta prioridade
  for (const v of validacao.violacoes.filter((x) => x.severidade === "erro")) {
    sugestoes.push({
      prioridade: "alta",
      categoria: "design",
      titulo: `Corrigir: ${v.regra}`,
      acao: v.mensagem,
    });
  }

  // Recomendações técnicas de atenção
  for (const r of analise.recomendacoes.filter((x) => x.severidade === "atencao")) {
    sugestoes.push({
      prioridade: "media",
      categoria: "design",
      titulo: r.titulo,
      acao: r.detalhe,
    });
  }

  // Margem baixa → comercial
  if (indicadores.margem_intermediaria_pct < 35) {
    sugestoes.push({
      prioridade: "alta",
      categoria: "comercial",
      titulo: "Margem abaixo do saudável",
      acao: `Margem de ${indicadores.margem_intermediaria_pct}%. Reveja custos ou apresente a versão premium (R$ ${orcamentos.premium.analise_financeira.preco_venda.toLocaleString("pt-BR")}).`,
    });
  }

  // Desperdício alto → produção
  if (indicadores.desperdicio_pct > 25) {
    sugestoes.push({
      prioridade: "media",
      categoria: "producao",
      titulo: "Desperdício de chapa elevado",
      acao: `${indicadores.desperdicio_pct}% de desperdício. Ajustar larguras de módulo pode reduzir o número de chapas (${indicadores.num_chapas}).`,
    });
  }

  // Upsell premium
  const ganhoPremium = orcamentos.premium.analise_financeira.preco_venda - orcamentos.intermediaria.analise_financeira.preco_venda;
  if (ganhoPremium > 0) {
    sugestoes.push({
      prioridade: "baixa",
      categoria: "comercial",
      titulo: "Oportunidade de upsell",
      acao: `Versão premium agrega R$ ${ganhoPremium.toLocaleString("pt-BR")} (ferragem Blum/Häfele, soft-close).`,
    });
  }

  return sugestoes;
}
