/**
 * PLANNE — Base de Conhecimento da Marcenaria
 * Análise inteligente de um móvel: roda os parâmetros/validadores da base sobre
 * a configuração de UM móvel e devolve achados (avisos) + peso estimado.
 *
 * É o que deixa o sistema "esperto sobre o móvel" no fluxo do orçamento: a
 * secretária vê, na hora, se falta dobradiça, se a folha vai cair, se a
 * prateleira enverga, quanto o móvel pesa — tudo rastreável à base.
 *
 * Frontend-safe: importa só `parametros`/`pesos` (dado puro), nunca o índice de
 * átomos (que carrega o JSON grande).
 */

import type { EspessuraMDF } from "../motor-parametrico/tipos";
import { espessuraParaVao, corredicaParaProfundidade } from "../motor-parametrico/conhecimento-tecnico";
import {
  dobradicasPorAlturaMm,
  larguraFolhaExcede,
  LARGURA_MAX_FOLHA_MM,
  LARGURA_MAX_CORRER_MM,
} from "./parametros";
import { pesoModulo, pesoPorta, validarDobradicas, type PecaPeso } from "./pesos";

export interface MovelParaAnalise {
  nome?: string;
  largura_cm: number;
  profundidade_cm: number;
  altura_cm: number;
  portas: number;
  /** "abrir" | "correr" | "sem" | "abrir_vidro" | "correr_espelho" ... */
  tipo_porta?: string;
  gavetas: number;
  prateleiras: number;
  espessura_corpo_mm?: EspessuraMDF;
  espessura_porta_mm?: EspessuraMDF;
}

export type SeveridadeAchado = "info" | "atencao" | "critico";

export interface AchadoMovel {
  severidade: SeveridadeAchado;
  titulo: string;
  detalhe: string;
  /** id do átomo/param de origem, quando aplicável. */
  fonte?: string;
}

export interface AnaliseMovel {
  peso_kg: number;
  achados: AchadoMovel[];
  /** severidade mais alta encontrada (para o selo do card). */
  nivel: SeveridadeAchado | "ok";
}

const cm2mm = (v: number) => Math.round(v * 10);

/** Peças aproximadas do corpo, para estimar o peso do móvel. */
function pecasAprox(m: MovelParaAnalise): PecaPeso[] {
  const esp: EspessuraMDF = m.espessura_corpo_mm ?? 15;
  const espPorta: EspessuraMDF = m.espessura_porta_mm ?? 15;
  const L = cm2mm(m.largura_cm), A = cm2mm(m.altura_cm), P = cm2mm(m.profundidade_cm);
  const Lint = L - 2 * 15;
  const pecas: PecaPeso[] = [
    { largura_mm: P, comprimento_mm: A, espessura_mm: esp, quantidade: 2 },      // laterais
    { largura_mm: Lint, comprimento_mm: P, espessura_mm: esp, quantidade: 2 },   // teto + base
  ];
  if (m.prateleiras > 0) pecas.push({ largura_mm: Lint, comprimento_mm: P - 60, espessura_mm: esp, quantidade: m.prateleiras });
  if (m.portas > 0 && m.tipo_porta && m.tipo_porta !== "sem") {
    pecas.push({ largura_mm: Math.round(L / m.portas), comprimento_mm: A, espessura_mm: espPorta, quantidade: m.portas });
  }
  // fundo 6mm
  pecas.push({ largura_mm: Lint, comprimento_mm: A - 30, espessura_mm: 6, quantidade: 1 });
  return pecas;
}

const ehAbrir = (tp?: string) => !!tp && tp.startsWith("abrir");
const ehCorrer = (tp?: string) => !!tp && tp.startsWith("correr");

/**
 * Analisa um móvel contra a Base de Conhecimento. Puro e determinístico.
 */
export function analisarMovel(m: MovelParaAnalise): AnaliseMovel {
  const achados: AchadoMovel[] = [];
  const peso = pesoModulo(pecasAprox(m));

  // ── Portas de abrir: dobradiças (nº + carga) e folha larga ──
  if (m.portas > 0 && ehAbrir(m.tipo_porta)) {
    const altura_mm = cm2mm(m.altura_cm);
    const larguraFolha_mm = cm2mm(m.largura_cm) / Math.max(m.portas, 1);
    const nDobr = dobradicasPorAlturaMm(altura_mm);
    achados.push({
      severidade: "info",
      titulo: "Dobradiças",
      detalhe: `${nDobr} por porta (${m.portas} porta${m.portas > 1 ? "s" : ""} → ${nDobr * m.portas} no total) para ${m.altura_cm}cm de altura.`,
      fonte: "DOBRADICAS_POR_ALTURA",
    });

    const pesoFolha = pesoPorta(larguraFolha_mm, altura_mm, m.espessura_porta_mm ?? 15);
    const v = validarDobradicas(pesoFolha, altura_mm, nDobr);
    if (!v.ok) {
      achados.push({
        severidade: v.severidade === "critico" ? "critico" : "atencao",
        titulo: "Carga da porta",
        detalhe: v.mensagem,
        fonte: "DOBRADICAS_POR_PESO",
      });
    }

    if (larguraFolhaExcede(larguraFolha_mm)) {
      achados.push({
        severidade: "atencao",
        titulo: "Folha larga",
        detalhe: `Folha de ${Math.round(larguraFolha_mm / 10)}cm passa de ${LARGURA_MAX_FOLHA_MM.valor / 10}cm — tende a deformar. Divida em mais folhas ou use correr.`,
        fonte: LARGURA_MAX_FOLHA_MM.fonteAtomo,
      });
    }
  }

  // ── Porta de correr muito larga ──
  if (m.portas > 0 && ehCorrer(m.tipo_porta)) {
    const larguraFolha_mm = cm2mm(m.largura_cm) / Math.max(m.portas, 1);
    if (larguraFolha_mm > LARGURA_MAX_CORRER_MM.valor) {
      achados.push({
        severidade: "atencao",
        titulo: "Folha de correr larga",
        detalhe: `Folha de correr de ${Math.round(larguraFolha_mm / 10)}cm passa de ${LARGURA_MAX_CORRER_MM.valor / 10}cm por folha. Divida em mais folhas.`,
        fonte: LARGURA_MAX_CORRER_MM.fonteAtomo,
      });
    }
  }

  // ── Prateleira que enverga (vão x espessura) ──
  if (m.prateleiras > 0) {
    const vaoInterno = m.largura_cm - 3;
    const espRec = espessuraParaVao(vaoInterno);
    const espAtual = m.espessura_corpo_mm ?? 15;
    if (espRec > espAtual) {
      achados.push({
        severidade: "atencao",
        titulo: "Prateleira pode envergar",
        detalhe: `Vão de ${vaoInterno}cm em ${espAtual}mm. Use ${espRec}mm ou reforço central (testeira).`,
        fonte: "BP-03",
      });
    }
  }

  // ── Gaveta: corrediça recomendada por profundidade ──
  if (m.gavetas > 0) {
    const corr = corredicaParaProfundidade(m.profundidade_cm);
    achados.push({
      severidade: "info",
      titulo: "Corrediça",
      detalhe: `${corr.replace(/_/g, " ")} para ${m.profundidade_cm}cm de profundidade (${m.gavetas} gaveta${m.gavetas > 1 ? "s" : ""}).`,
      fonte: "ESPECS_FERRAGEM",
    });
  }

  const nivel: AnaliseMovel["nivel"] =
    achados.some((a) => a.severidade === "critico") ? "critico"
    : achados.some((a) => a.severidade === "atencao") ? "atencao"
    : achados.some((a) => a.severidade === "info") ? "info"
    : "ok";

  return { peso_kg: peso, achados, nivel };
}
