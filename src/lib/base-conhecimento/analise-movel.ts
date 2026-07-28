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
  /** Nome/tipo do cômodo (para detectar área úmida). Ex.: "Cozinha", "Banheiro". */
  ambiente?: string;
  /** Tem fundo estrutural? (default: assume que sim). */
  tem_fundo?: boolean;
}

/** Ambientes com umidade — pedem material resistente (hidrófugo/MDP). */
const ehAreaUmida = (ambiente?: string) =>
  !!ambiente && /banheiro|cozinha|lavanderia|gourmet|área de servi|area de servi/i.test(ambiente);

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

// Espaçamento vertical confortável entre prateleiras (cm) — prática de mercado.
const ESPACO_PRATELEIRA_MIN_CM = 22;
const ESPACO_PRATELEIRA_MAX_CM = 45;

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

  // ── Prateleira que enverga (vão HORIZONTAL x espessura) ──
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

    // Espaçamento VERTICAL entre prateleiras (ergonomia de uso).
    const espacamento = Math.round((m.altura_cm - 3) / (m.prateleiras + 1));
    if (espacamento < ESPACO_PRATELEIRA_MIN_CM) {
      achados.push({
        severidade: "atencao",
        titulo: "Prateleiras muito juntas",
        detalhe: `~${espacamento}cm entre prateleiras. Abaixo de ${ESPACO_PRATELEIRA_MIN_CM}cm dificulta guardar itens — reduza a quantidade.`,
        fonte: "ergonomia",
      });
    } else if (espacamento > ESPACO_PRATELEIRA_MAX_CM) {
      achados.push({
        severidade: "info",
        titulo: "Prateleiras espaçadas",
        detalhe: `~${espacamento}cm entre prateleiras. Acima de ${ESPACO_PRATELEIRA_MAX_CM}cm há espaço ocioso — cabe mais uma prateleira.`,
        fonte: "ergonomia",
      });
    } else {
      achados.push({
        severidade: "info",
        titulo: "Prateleiras",
        detalhe: `${m.prateleiras} prateleiras · ~${espacamento}cm de vão entre elas.`,
        fonte: "ergonomia",
      });
    }
  }

  // ── Profundidade fora do usual (alcance / uso) ──
  if (m.portas > 0 && ehAbrir(m.tipo_porta) && m.profundidade_cm > 70) {
    achados.push({
      severidade: "info",
      titulo: "Móvel profundo",
      detalhe: `${m.profundidade_cm}cm de profundidade com porta de abrir — o fundo fica de difícil alcance. Considere gaveta/aramado interno.`,
      fonte: "ergonomia",
    });
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

  // ── Material para área úmida (hidrófugo / MDP) ──
  if (ehAreaUmida(m.ambiente)) {
    achados.push({
      severidade: "atencao",
      titulo: "Área úmida",
      detalhe: `${m.ambiente}: prefira MDF hidrófugo (RUC/Ultra) ou MDP — o MDF comum incha e empena com a umidade. Zona molhada (sob cuba/tanque): sem fundo de MDF.`,
      fonte: "atom_05_mdf_hidrofugo_ruc_ultra_linhas_resistentes_a_umidade_por_fabricante_linha_ruc",
    });
  }

  // ── Fundo estrutural (trava o esquadro) ──
  if (m.tem_fundo === false && (m.largura_cm > 100 || m.altura_cm > 180)) {
    achados.push({
      severidade: "atencao",
      titulo: "Sem fundo estrutural",
      detalhe: `Móvel grande sem fundo tende a perder o esquadro (torcer) com o tempo — o fundo trava o corpo em 90°. Considere incluir fundo 6mm.`,
      fonte: "atom_03_fundo_do_movel_funcao_estrutural_travamento_tra",
    });
  }

  const nivel: AnaliseMovel["nivel"] =
    achados.some((a) => a.severidade === "critico") ? "critico"
    : achados.some((a) => a.severidade === "atencao") ? "atencao"
    : achados.some((a) => a.severidade === "info") ? "info"
    : "ok";

  return { peso_kg: peso, achados, nivel };
}

// ─── RESUMO DO PROJETO (agrega todos os móveis) ──────────────────────────────

// Porta de elevador de referência 0,80×2,00m (base, módulo Transporte): uma peça
// acima disso não passa em pé pela rota interna → içar ou desmontar.
const ALTURA_ACESSO_CM = 200;

export interface ResumoProjeto {
  peso_total_kg: number;
  num_moveis: number;
  alertas: number;      // achados de atenção + crítico somados
  maior_dimensao_cm: number;
  notas: AchadoMovel[]; // avisos de nível de projeto (transporte, peso)
}

/** Agrega a análise de todos os móveis num panorama técnico do projeto. */
export function resumirProjeto(moveis: MovelParaAnalise[]): ResumoProjeto {
  let peso = 0, alertas = 0, maior = 0;
  for (const m of moveis) {
    const a = analisarMovel(m);
    peso += a.peso_kg;
    alertas += a.achados.filter((x) => x.severidade !== "info").length;
    maior = Math.max(maior, m.altura_cm, m.largura_cm);
  }
  const notas: AchadoMovel[] = [];
  if (maior > ALTURA_ACESSO_CM) {
    notas.push({
      severidade: "info",
      titulo: "Acesso / transporte",
      detalhe: `Há peça de ${Math.round(maior)}cm — pode não passar em pé por porta/elevador (ref. 0,80×2,00m). Verifique o acesso; talvez precise desmontar ou içar.`,
      fonte: "atom_10_dimensoes_padrao_de_elevador_predial_e_por",
    });
  }
  if (peso > 200) {
    notas.push({
      severidade: "info",
      titulo: "Peso do projeto",
      detalhe: `~${Math.round(peso)}kg no total — planeje pessoal/equipamento para a montagem (peças pesadas embaixo na carga).`,
      fonte: "atom_10_acondicionamento_e_organizacao_de_carga_di",
    });
  }
  return {
    peso_total_kg: Math.round(peso),
    num_moveis: moveis.length,
    alertas,
    maior_dimensao_cm: Math.round(maior),
    notas,
  };
}
