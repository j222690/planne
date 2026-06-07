/**
 * PLANNE — Motor Paramétrico
 * Fase 10: IA Marceneira — Consultor Técnico
 *
 * A "IA Marceneira" determinística: recomenda o tipo de layout, analisa
 * projetos e sugere ferragens — sempre baseada na base de conhecimento
 * (conhecimento-tecnico.ts) e nas métricas reais do projeto.
 *
 * Princípio da Vision: "A IA decide. O motor paramétrico constrói."
 * Aqui a IA DECIDE parâmetros (qual layout, qual ferragem) com regras
 * auditáveis; a construção fica com os geradores das Fases 2/6.
 */

import type {
  AmbienteGeometrico,
  ProjetoFabricavel,
  ModuloInstanciado,
  ParedeId,
} from "./tipos";
import {
  NORMAS,
  numDobradicasPorPorta,
  corredicaParaProfundidade,
  espessuraParaVao,
  pesoPeca,
} from "./conhecimento-tecnico";
import { comprimentoLivre, paredesPorComprimento, saoAdjacentes } from "./layout-shared";

// ─── RECOMENDAÇÃO DE LAYOUT ───────────────────────────────────────────────────

export type TipoLayoutRecomendado =
  | "cozinha_linear" | "cozinha_l" | "cozinha_u" | "ilha"
  | "dormitorio" | "closet" | "banheiro" | "lavanderia";

export interface RecomendacaoLayout {
  layout: TipoLayoutRecomendado;
  /** Confiança da recomendação 0–1. */
  confianca: number;
  /** Justificativa técnica (auditável). */
  justificativa: string;
  /** Paredes sugeridas, quando aplicável. */
  paredes_sugeridas?: ParedeId[];
  /** Alternativas consideradas. */
  alternativas: { layout: TipoLayoutRecomendado; motivo: string }[];
}

/**
 * Recomenda o melhor tipo de layout para um ambiente, dado o tipo de cômodo.
 * Decisão baseada em geometria + normas — não em "achismo".
 */
export function recomendarLayout(
  ambiente: AmbienteGeometrico,
  tipoComodo: "cozinha" | "quarto" | "closet" | "banheiro" | "lavanderia",
): RecomendacaoLayout {
  const { largura_cm, profundidade_cm, area_m2 } = ambiente.dimensoes;
  const ordenadas = paredesPorComprimento(ambiente);
  const maiorParede = ordenadas[0];
  const compMaior = comprimentoLivre(ambiente, maiorParede);
  const segundaParede = ordenadas.find((p) => saoAdjacentes(p, maiorParede));
  const compSegunda = segundaParede ? comprimentoLivre(ambiente, segundaParede) : 0;
  const alternativas: RecomendacaoLayout["alternativas"] = [];

  if (tipoComodo === "cozinha") {
    const cabeIlha =
      largura_cm - 2 * NORMAS.circulacao_ideal.valor >= 120 &&
      profundidade_cm - 2 * NORMAS.circulacao_ideal.valor >= 90;

    // Duas paredes longas adjacentes → L ou U
    if (segundaParede && compSegunda >= 200 && compMaior >= 200) {
      const terceira = ordenadas.find((p) => p !== maiorParede && p !== segundaParede && saoAdjacentes(p, segundaParede));
      const compTerceira = terceira ? comprimentoLivre(ambiente, terceira) : 0;

      if (compTerceira >= 200 && area_m2 >= 12) {
        alternativas.push({ layout: "cozinha_l", motivo: "Duas paredes seriam suficientes." });
        if (cabeIlha) alternativas.push({ layout: "ilha", motivo: "Há espaço para ilha central." });
        return {
          layout: "cozinha_u",
          confianca: 0.85,
          justificativa: `Três paredes ≥ 200cm (${compMaior}/${compSegunda}/${compTerceira}cm) e ${area_m2}m² favorecem layout em U, maximizando bancada.`,
          paredes_sugeridas: [maiorParede, segundaParede!, terceira!],
          alternativas,
        };
      }

      if (cabeIlha) alternativas.push({ layout: "ilha", motivo: "Há espaço para ilha." });
      alternativas.push({ layout: "cozinha_linear", motivo: "Uma parede só, se preferir simplicidade." });
      return {
        layout: "cozinha_l",
        confianca: 0.85,
        justificativa: `Duas paredes adjacentes longas (${compMaior}cm e ${compSegunda}cm) aproveitam o canto — layout em L é o mais eficiente.`,
        paredes_sugeridas: [maiorParede, segundaParede!],
        alternativas,
      };
    }

    // Ambiente grande e quadrado → ilha
    if (cabeIlha && area_m2 >= 15) {
      alternativas.push({ layout: "cozinha_linear", motivo: "Bancada encostada, sem ilha." });
      return {
        layout: "ilha",
        confianca: 0.7,
        justificativa: `Ambiente de ${area_m2}m² com ${largura_cm}×${profundidade_cm}cm comporta ilha com circulação de ${NORMAS.circulacao_ideal.valor}cm.`,
        alternativas,
      };
    }

    // Default: linear na maior parede
    return {
      layout: "cozinha_linear",
      confianca: 0.8,
      justificativa: `Parede de ${compMaior}cm é a mais adequada para uma cozinha linear; demais paredes não comportam bancada (${compSegunda}cm).`,
      paredes_sugeridas: [maiorParede],
      alternativas,
    };
  }

  if (tipoComodo === "quarto") {
    return {
      layout: "dormitorio",
      confianca: 0.85,
      justificativa: `Roupeiro na parede de ${compMaior}cm; o restante do quarto fica para a cama (não-marcenaria).`,
      paredes_sugeridas: [maiorParede],
      alternativas: compSegunda >= 200 ? [{ layout: "closet", motivo: "Se for ambiente dedicado (walk-in), usar closet em L." }] : [],
    };
  }

  if (tipoComodo === "closet") {
    return {
      layout: "closet",
      confianca: 0.8,
      justificativa: `Closet em L aproveita duas paredes (${compMaior}cm + ${compSegunda}cm) com mix de roupeiro, cabideiro, gaveteiro e sapateira.`,
      paredes_sugeridas: segundaParede ? [maiorParede, segundaParede] : [maiorParede],
      alternativas: [{ layout: "dormitorio", motivo: "Uma parede de roupeiros, se o espaço for estreito." }],
    };
  }

  if (tipoComodo === "banheiro") {
    const paredeHidro = ambiente.pontos_hidraulicos.find((p) => p.parede)?.parede;
    return {
      layout: "banheiro",
      confianca: 0.85,
      justificativa: paredeHidro
        ? `Gabinete na parede ${paredeHidro} (ponto hidráulico) + espelheira a ${NORMAS.altura_aereo_piso.valor - 30}cm.`
        : `Gabinete de pia + espelheira na parede de ${compMaior}cm.`,
      paredes_sugeridas: paredeHidro ? [paredeHidro] : [maiorParede],
      alternativas: [],
    };
  }

  // lavanderia
  const paredeHidro = ambiente.pontos_hidraulicos.find((p) => p.parede)?.parede;
  return {
    layout: "lavanderia",
    confianca: 0.85,
    justificativa: paredeHidro
      ? `Gabinete de tanque na parede ${paredeHidro} (ponto hidráulico) + armários de serviço.`
      : `Gabinete de tanque + armários de serviço na parede de ${compMaior}cm.`,
    paredes_sugeridas: paredeHidro ? [paredeHidro] : [maiorParede],
    alternativas: [],
  };
}

// ─── ANÁLISE TÉCNICA DE PROJETO ───────────────────────────────────────────────

export type SeveridadeTecnica = "info" | "sugestao" | "atencao";

export interface RecomendacaoTecnica {
  severidade: SeveridadeTecnica;
  modulo_id?: string;
  titulo: string;
  detalhe: string;
  referencia?: string;
}

export interface AnaliseTecnica {
  recomendacoes: RecomendacaoTecnica[];
  resumo: {
    total: number;
    atencao: number;
    sugestoes: number;
    peso_total_kg: number;
  };
  analisado_em: string;
}

/**
 * Analisa um projeto e produz recomendações técnicas auditáveis,
 * cruzando os módulos com a base de conhecimento.
 */
export function analisarProjeto(projeto: ProjetoFabricavel): AnaliseTecnica {
  const recs: RecomendacaoTecnica[] = [];
  let pesoTotal = 0;

  for (const m of projeto.modulos) {
    recs.push(...analisarModulo(m));
    pesoTotal += pesoModulo(m);
  }

  // Recomendações de ambiente
  recs.push(...analisarAmbiente(projeto));

  const atencao = recs.filter((r) => r.severidade === "atencao").length;
  const sugestoes = recs.filter((r) => r.severidade === "sugestao").length;

  return {
    recomendacoes: recs,
    resumo: {
      total: recs.length,
      atencao,
      sugestoes,
      peso_total_kg: Math.round(pesoTotal * 10) / 10,
    },
    analisado_em: new Date().toISOString(),
  };
}

function analisarModulo(m: ModuloInstanciado): RecomendacaoTecnica[] {
  const recs: RecomendacaoTecnica[] = [];
  const cfg = m.configuracao;

  // Prateleira: vão x espessura
  if (cfg.num_prateleiras > 0) {
    const vaoInterno = m.largura_cm - 3; // descontando 2 laterais 15mm
    const espRecomendada = espessuraParaVao(vaoInterno);
    if (espRecomendada > cfg.espessura_corpo_mm) {
      recs.push({
        severidade: "atencao",
        modulo_id: m.id,
        titulo: "Prateleira pode fletir",
        detalhe: `Vão de ${vaoInterno}cm com MDF ${cfg.espessura_corpo_mm}mm. Recomendado ${espRecomendada}mm ou apoio central.`,
        referencia: "BP-03",
      });
    }
  }

  // Dobradiças por altura
  if (cfg.num_portas > 0 && cfg.tipo_porta === "dobradica") {
    const recomendado = numDobradicasPorPorta(m.altura_cm);
    recs.push({
      severidade: "info",
      modulo_id: m.id,
      titulo: "Dobradiças recomendadas",
      detalhe: `${recomendado} dobradiças por porta para ${m.altura_cm}cm de altura.`,
      referencia: "BP-05",
    });
  }

  // Porta larga demais para abrir
  if (cfg.num_portas > 0 && cfg.tipo_porta === "dobradica") {
    const larguraPorta = m.largura_cm / cfg.num_portas;
    if (larguraPorta > NORMAS.vao_porta_max.valor) {
      recs.push({
        severidade: "sugestao",
        modulo_id: m.id,
        titulo: "Porta larga",
        detalhe: `Porta de ${Math.round(larguraPorta)}cm excede ${NORMAS.vao_porta_max.valor}cm. Considere porta de correr ou dividir em mais folhas.`,
        referencia: "BP-08",
      });
    }
  }

  // Gaveta: corrediça adequada
  if (cfg.num_gavetas > 0) {
    const corr = corredicaParaProfundidade(m.profundidade_cm);
    recs.push({
      severidade: "info",
      modulo_id: m.id,
      titulo: "Corrediça recomendada",
      detalhe: `${corr.replace(/_/g, " ")} para profundidade de ${m.profundidade_cm}cm.`,
      referencia: "BP-06",
    });
  }

  // Iluminação LED em roupeiro/closet
  if ((m.modulo_template_codigo.startsWith("roupeiro") || m.modulo_template_codigo.startsWith("cabideiro")) && !cfg.tem_iluminacao_led) {
    recs.push({
      severidade: "sugestao",
      modulo_id: m.id,
      titulo: "Considere iluminação LED",
      detalhe: "Roupeiros e closets ganham muito com fita LED interna acionada por sensor.",
    });
  }

  return recs;
}

function analisarAmbiente(projeto: ProjetoFabricavel): RecomendacaoTecnica[] {
  const recs: RecomendacaoTecnica[] = [];
  const { profundidade_cm } = projeto.ambiente.dimensoes;

  // Circulação (cozinha/banheiro)
  if (/cozinha/i.test(projeto.tipo_ambiente)) {
    const circulacao = profundidade_cm - NORMAS.profundidade_base_cozinha.valor;
    if (circulacao < NORMAS.circulacao_ideal.valor) {
      recs.push({
        severidade: circulacao < NORMAS.circulacao_minima.valor ? "atencao" : "sugestao",
        titulo: "Circulação",
        detalhe: `Circulação de ${circulacao}cm. Ideal ≥ ${NORMAS.circulacao_ideal.valor}cm (mínimo ${NORMAS.circulacao_minima.valor}cm).`,
        referencia: NORMAS.circulacao_ideal.codigo,
      });
    }
  }

  return recs;
}

function pesoModulo(m: ModuloInstanciado): number {
  return m.pecas.reduce(
    (s, p) => s + pesoPeca(p.largura_mm, p.comprimento_mm, p.espessura_mm) * p.quantidade,
    0,
  );
}
