/**
 * PLANNE — Motor Paramétrico
 * Fase 10: IA Marceneira — Base de Conhecimento Técnico
 *
 * Conhecimento de marcenaria estruturado e AUDITÁVEL: especificações de MDF,
 * ferragens, normas (NBR / ergonomia) e boas práticas do mercado brasileiro.
 *
 * Princípio da Vision: "Todo cálculo deve ser auditável." A IA Marceneira NÃO
 * inventa números — ela consulta esta base determinística e o motor. Cada
 * recomendação técnica é rastreável a uma regra explícita aqui.
 */

import type { EspessuraMDF, TipoFerragem, TipoModulo } from "./tipos";

// ─── ESPECIFICAÇÃO DE MDF/MDP ─────────────────────────────────────────────────

export interface EspecMDF {
  espessura_mm: EspessuraMDF;
  usos: string[];
  /** Vão máximo de prateleira sem apoio central (cm). */
  vao_max_prateleira_cm: number;
  densidade_kg_m3: number;
}

/** Catálogo técnico de espessuras de MDF e seus usos corretos. */
export const ESPECS_MDF: Record<number, EspecMDF> = {
  3: { espessura_mm: 3, usos: ["fundo de gaveta leve", "costas de quadro"], vao_max_prateleira_cm: 0, densidade_kg_m3: 750 },
  6: { espessura_mm: 6, usos: ["fundo de armário", "fundo de gaveta", "costas"], vao_max_prateleira_cm: 0, densidade_kg_m3: 730 },
  9: { espessura_mm: 9, usos: ["fundo reforçado", "divisória leve"], vao_max_prateleira_cm: 40, densidade_kg_m3: 720 },
  12: { espessura_mm: 12, usos: ["prateleira leve", "divisória"], vao_max_prateleira_cm: 60, densidade_kg_m3: 710 },
  15: { espessura_mm: 15, usos: ["estrutura padrão", "corpo", "porta", "prateleira"], vao_max_prateleira_cm: 80, densidade_kg_m3: 700 },
  18: { espessura_mm: 18, usos: ["porta grande", "prateleira longa", "tampo", "estrutura premium"], vao_max_prateleira_cm: 100, densidade_kg_m3: 700 },
  25: { espessura_mm: 25, usos: ["tampo de bancada", "nicho estrutural", "mesa"], vao_max_prateleira_cm: 120, densidade_kg_m3: 690 },
};

/** Recomenda a espessura mínima para uma prateleira de dado vão (cm). */
export function espessuraParaVao(vao_cm: number): EspessuraMDF {
  if (vao_cm <= 60) return 15;
  if (vao_cm <= 80) return 15;
  if (vao_cm <= 100) return 18;
  return 25;
}

/** Peso estimado de uma peça de MDF (kg). */
export function pesoPeca(largura_mm: number, comprimento_mm: number, espessura_mm: EspessuraMDF): number {
  const volume_m3 = (largura_mm / 1000) * (comprimento_mm / 1000) * (espessura_mm / 1000);
  const densidade = ESPECS_MDF[espessura_mm]?.densidade_kg_m3 ?? 700;
  return Math.round(volume_m3 * densidade * 100) / 100;
}

// ─── ESPECIFICAÇÃO DE FERRAGENS ───────────────────────────────────────────────

export interface EspecFerragem {
  tipo: TipoFerragem;
  nome: string;
  aplicacao: string;
  /** Capacidade de peso por unidade (kg), quando aplicável. */
  capacidade_kg?: number;
}

export const ESPECS_FERRAGEM: Partial<Record<TipoFerragem, EspecFerragem>> = {
  dobradica_35mm_110grau: { tipo: "dobradica_35mm_110grau", nome: "Dobradiça 35mm 110°", aplicacao: "porta de abrir padrão", capacidade_kg: 8 },
  dobradica_35mm_165grau: { tipo: "dobradica_35mm_165grau", nome: "Dobradiça 35mm 165°", aplicacao: "porta de canto / abertura ampla", capacidade_kg: 8 },
  dobradica_push_open: { tipo: "dobradica_push_open", nome: "Dobradiça Push-Open", aplicacao: "porta sem puxador (toque)", capacidade_kg: 7 },
  corredicao_tandem_300mm: { tipo: "corredicao_tandem_300mm", nome: "Corrediça Tandem 300mm", aplicacao: "gaveta rasa", capacidade_kg: 30 },
  corredicao_tandem_400mm: { tipo: "corredicao_tandem_400mm", nome: "Corrediça Tandem 400mm", aplicacao: "gaveta média", capacidade_kg: 30 },
  corredicao_tandem_500mm: { tipo: "corredicao_tandem_500mm", nome: "Corrediça Tandem 500mm", aplicacao: "gaveta profunda", capacidade_kg: 40 },
  corredicao_lateral_porta: { tipo: "corredicao_lateral_porta", nome: "Trilho de Correr", aplicacao: "porta de correr de roupeiro" },
  cabideiro_simples: { tipo: "cabideiro_simples", nome: "Cabideiro", aplicacao: "barra de cabide em roupeiro" },
  amortecedor_soft_close: { tipo: "amortecedor_soft_close", nome: "Soft-Close", aplicacao: "amortecimento de fechamento" },
};

/**
 * Recomenda o número de dobradiças por porta segundo altura e peso.
 * Regra de mercado: 2 (≤90cm), 3 (≤150cm), 4 (≤200cm), 5 (>200cm).
 */
export function numDobradicasPorPorta(altura_cm: number): number {
  if (altura_cm <= 90) return 2;
  if (altura_cm <= 150) return 3;
  if (altura_cm <= 200) return 4;
  return 5;
}

/**
 * Recomenda a corrediça adequada para a profundidade da gaveta.
 */
export function corredicaParaProfundidade(profundidade_cm: number): TipoFerragem {
  if (profundidade_cm <= 35) return "corredicao_tandem_300mm";
  if (profundidade_cm <= 45) return "corredicao_tandem_400mm";
  return "corredicao_tandem_500mm";
}

// ─── NORMAS E ERGONOMIA ───────────────────────────────────────────────────────

export interface NormaTecnica {
  codigo: string;
  descricao: string;
  valor: number;
  unidade: string;
}

/** Parâmetros normativos/ergonômicos de marcenaria (cm). */
export const NORMAS: Record<string, NormaTecnica> = {
  altura_bancada_cozinha: { codigo: "ERG-COZ-01", descricao: "Altura de bancada de cozinha", valor: 90, unidade: "cm" },
  altura_bancada_banheiro: { codigo: "ERG-BAN-01", descricao: "Altura de bancada de banheiro", valor: 85, unidade: "cm" },
  circulacao_minima: { codigo: "NBR-CIRC-01", descricao: "Circulação mínima entre móveis", valor: 80, unidade: "cm" },
  circulacao_ideal: { codigo: "ERG-CIRC-02", descricao: "Circulação ideal entre bancadas", valor: 120, unidade: "cm" },
  altura_aereo_piso: { codigo: "ERG-COZ-02", descricao: "Altura do piso à base do aéreo", valor: 150, unidade: "cm" },
  profundidade_aereo: { codigo: "ERG-COZ-03", descricao: "Profundidade de armário aéreo", valor: 33, unidade: "cm" },
  profundidade_base_cozinha: { codigo: "ERG-COZ-04", descricao: "Profundidade de gabinete base", valor: 55, unidade: "cm" },
  altura_cabideiro_camisa: { codigo: "ERG-ROUP-01", descricao: "Altura de cabideiro (camisas)", valor: 160, unidade: "cm" },
  altura_cabideiro_vestido: { codigo: "ERG-ROUP-02", descricao: "Altura de cabideiro (vestidos longos)", valor: 180, unidade: "cm" },
  profundidade_roupeiro: { codigo: "ERG-ROUP-03", descricao: "Profundidade de roupeiro", valor: 60, unidade: "cm" },
  vao_porta_max: { codigo: "TEC-PORT-01", descricao: "Largura máxima de porta de abrir", valor: 50, unidade: "cm" },
  peitoril_janela_min: { codigo: "ERG-JAN-01", descricao: "Peitoril mínimo p/ gabinete base", valor: 90, unidade: "cm" },
};

// ─── BOAS PRÁTICAS ────────────────────────────────────────────────────────────

export interface BoaPratica {
  id: string;
  categoria: "estrutura" | "acabamento" | "ferragem" | "montagem";
  regra: string;
}

export const BOAS_PRATICAS: BoaPratica[] = [
  { id: "BP-01", categoria: "estrutura", regra: "Fundo 6mm encaixado em rebaixo de 4mm nas laterais." },
  { id: "BP-02", categoria: "estrutura", regra: "Engrosso frontal de 50mm nas laterais para batida de portas." },
  { id: "BP-03", categoria: "estrutura", regra: "Prateleira com vão > 80cm exige MDF 18mm ou apoio central." },
  { id: "BP-04", categoria: "acabamento", regra: "Fita de borda em todas as bordas aparentes (frontais)." },
  { id: "BP-05", categoria: "ferragem", regra: "Mínimo 2 dobradiças por porta; +1 a cada 60cm de altura." },
  { id: "BP-06", categoria: "ferragem", regra: "Corrediça dimensionada para a profundidade real da gaveta." },
  { id: "BP-07", categoria: "montagem", regra: "Junção de peças com cavilha 8×30mm + minifix." },
  { id: "BP-08", categoria: "estrutura", regra: "Porta de abrir até 50cm de largura; acima, usar correr ou dupla." },
  { id: "BP-09", categoria: "ferragem", regra: "Módulos > 150cm de largura: 6 pés reguláveis em vez de 4." },
  { id: "BP-10", categoria: "acabamento", regra: "Cuba/tanque sem fundo de MDF na zona molhada." },
];

/** Busca boas práticas por categoria. */
export function boasPraticasPorCategoria(categoria: BoaPratica["categoria"]): BoaPratica[] {
  return BOAS_PRATICAS.filter((b) => b.categoria === categoria);
}

// ─── CONHECIMENTO DE MÓDULOS ──────────────────────────────────────────────────

export interface PerfilModulo {
  tipo: TipoModulo;
  altura_tipica_cm: number;
  profundidade_tipica_cm: number;
  observacao: string;
}

export const PERFIS_MODULO: Partial<Record<TipoModulo, PerfilModulo>> = {
  base: { tipo: "base", altura_tipica_cm: 72, profundidade_tipica_cm: 55, observacao: "Bancada a 90cm com tampo." },
  aereo: { tipo: "aereo", altura_tipica_cm: 40, profundidade_tipica_cm: 33, observacao: "Base a 150cm do piso." },
  roupeiro: { tipo: "roupeiro", altura_tipica_cm: 250, profundidade_tipica_cm: 60, observacao: "Cabideiro + prateleiras + gavetas internas." },
  gaveta_bloco: { tipo: "gaveta_bloco", altura_tipica_cm: 80, profundidade_tipica_cm: 50, observacao: "Bloco de 4 gavetas." },
  cabideiro: { tipo: "cabideiro", altura_tipica_cm: 130, profundidade_tipica_cm: 60, observacao: "Barra de cabide aberta." },
  sapateira: { tipo: "sapateira", altura_tipica_cm: 100, profundidade_tipica_cm: 35, observacao: "Prateleiras inclinadas a cada 18cm." },
  espelheira: { tipo: "espelheira", altura_tipica_cm: 70, profundidade_tipica_cm: 12, observacao: "Armário-espelho a 120cm do piso." },
};

// ─── CONSULTA GERAL ───────────────────────────────────────────────────────────

export interface RespostaConhecimento {
  encontrado: boolean;
  topico: string;
  conteudo: string;
  referencia?: string;
}

/**
 * Consulta a base de conhecimento por um tópico (busca textual simples).
 * Usado pela camada de IA como fonte auditável de respostas técnicas.
 */
export function consultarConhecimento(consulta: string): RespostaConhecimento[] {
  const q = consulta.toLowerCase();
  const respostas: RespostaConhecimento[] = [];

  // Normas
  for (const [chave, n] of Object.entries(NORMAS)) {
    if (chave.includes(q) || n.descricao.toLowerCase().includes(q)) {
      respostas.push({ encontrado: true, topico: n.descricao, conteudo: `${n.valor}${n.unidade}`, referencia: n.codigo });
    }
  }

  // MDF
  if (/mdf|espessura|chapa|prateleira/.test(q)) {
    for (const espec of Object.values(ESPECS_MDF)) {
      respostas.push({
        encontrado: true,
        topico: `MDF ${espec.espessura_mm}mm`,
        conteudo: `Usos: ${espec.usos.join(", ")}. Vão máx prateleira: ${espec.vao_max_prateleira_cm || "n/a"}cm.`,
      });
    }
  }

  // Ferragens
  if (/ferragem|dobrad|corredi|cabideiro|trilho/.test(q)) {
    for (const espec of Object.values(ESPECS_FERRAGEM)) {
      if (espec) respostas.push({ encontrado: true, topico: espec.nome, conteudo: espec.aplicacao });
    }
  }

  // Boas práticas
  for (const bp of BOAS_PRATICAS) {
    if (bp.regra.toLowerCase().includes(q)) {
      respostas.push({ encontrado: true, topico: `Boa prática ${bp.id}`, conteudo: bp.regra, referencia: bp.id });
    }
  }

  if (respostas.length === 0) {
    respostas.push({ encontrado: false, topico: consulta, conteudo: "Sem entrada específica na base de conhecimento." });
  }

  return respostas;
}
