/**
 * PLANNE — Motor Paramétrico
 * Fase 6: Biblioteca de Módulos de Quarto / Closet
 *
 * Módulos: roupeiro, gaveteiro, cabideiro, sapateira.
 * Diferem dos de cozinha: são altos (220–250cm), têm cabideiro, divisórias
 * verticais e mais prateleiras. Usam as regras de corte comuns (Fase 6).
 */

import type { ModuloParametrico, ConfiguracaoModulo } from "./tipos";
import {
  regrasCorpo,
  regraPortaDobradica,
  regraPortaCorrer,
  regrasGaveta,
  regraDobradicas,
  regraCorredicaGaveta,
  regraTrilhoCorrer,
  regraCabideiro,
  regraPuxadores,
  regraMinifix,
  regraPes,
} from "./regras-corte-comuns";

// ─── DIMENSÕES PADRÃO ─────────────────────────────────────────────────────────

export const ROUPEIRO_ALTURA_CM = 250;
export const ROUPEIRO_PROFUNDIDADE_CM = 60;
export const GAVETEIRO_ALTURA_CM = 80;
export const GAVETEIRO_PROFUNDIDADE_CM = 50;
export const CABIDEIRO_ALTURA_CM = 130;
export const SAPATEIRA_ALTURA_CM = 100;
export const SAPATEIRA_PROFUNDIDADE_CM = 35;

const publicado = "2026-06-05T00:00:00Z";

// ─── CONFIGS PADRÃO ───────────────────────────────────────────────────────────

const cfgRoupeiro: ConfiguracaoModulo = {
  tipo_porta: "dobradica",
  num_portas: 2,
  num_prateleiras: 3,
  num_gavetas: 0,
  num_divisorias: 1,
  tem_cabideiro: true,
  tem_fundo: true,
  espessura_fundo_mm: 6,
  tem_rodape: false,
  altura_rodape_cm: 10,
  tem_pes_regulaveis: true,
  altura_pes_cm: 10,
  tem_roda_teto: false,
  tem_iluminacao_led: false,
  tem_espelho_interno: false,
  tem_ripado: false,
  espessura_corpo_mm: 15,
  espessura_porta_mm: 15,
  ferragem: "nacional",
  tipo_puxador: "puxador_alu",
};

// ─── FÁBRICAS ─────────────────────────────────────────────────────────────────

function criarRoupeiro(largura_cm: number): ModuloParametrico {
  return {
    id: `roupeiro_${largura_cm}`,
    codigo: `roupeiro_${largura_cm}`,
    nome: `Roupeiro ${largura_cm}cm`,
    versao: 1,
    categorias: ["quarto", "closet"],
    tipo: "roupeiro",
    largura: { min_cm: 40, max_cm: 100, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 220, max_cm: 270, padrao_cm: ROUPEIRO_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 55, max_cm: 65, padrao_cm: ROUPEIRO_PROFUNDIDADE_CM, passo_cm: 5 },
    configuracao_padrao: { ...cfgRoupeiro, num_portas: largura_cm <= 50 ? 1 : 2 },
    limites: {
      num_portas: { min: 1, max: 4 },
      num_gavetas: { min: 0, max: 4 },
      num_prateleiras: { min: 1, max: 8 },
      tipos_porta_validos: ["dobradica", "correr", "espelho"],
      permite_espelho: true,
      permite_iluminacao_led: true,
      permite_ripado: false,
    },
    regras_pecas: [
      ...regrasCorpo({ com_divisoria: true }),
      regraPortaDobradica(),
      regraPortaCorrer(),
      ...regrasGaveta(),
    ],
    regras_ferragens: [
      regraDobradicas(),
      regraTrilhoCorrer(),
      regraCorredicaGaveta(),
      regraCabideiro(),
      regraPuxadores(),
      regraMinifix(),
      regraPes(),
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 0,
      folga_teto_min_cm: 5,
      afastamento_lateral_cm: 0,
      permite_sequencia: true,
    },
    norma_referencia: "Roupeiro: cabideiro a ~150cm, prateleira superior a ~200cm",
    ativo: true,
    publicado_em: publicado,
  };
}

function criarGaveteiro(largura_cm: number): ModuloParametrico {
  return {
    id: `gaveteiro_${largura_cm}`,
    codigo: `gaveteiro_${largura_cm}`,
    nome: `Gaveteiro ${largura_cm}cm`,
    versao: 1,
    categorias: ["quarto", "closet"],
    tipo: "gaveta_bloco",
    largura: { min_cm: 40, max_cm: 80, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 60, max_cm: 100, padrao_cm: GAVETEIRO_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 45, max_cm: 55, padrao_cm: GAVETEIRO_PROFUNDIDADE_CM, passo_cm: 5 },
    configuracao_padrao: {
      ...cfgRoupeiro,
      tipo_porta: "aberta",
      num_portas: 0,
      num_prateleiras: 0,
      num_gavetas: 4,
      num_divisorias: 0,
      tem_cabideiro: false,
    },
    limites: {
      num_portas: { min: 0, max: 0 },
      num_gavetas: { min: 2, max: 6 },
      num_prateleiras: { min: 0, max: 0 },
      tipos_porta_validos: ["aberta"],
      permite_espelho: false,
      permite_iluminacao_led: false,
      permite_ripado: false,
    },
    regras_pecas: [
      ...regrasCorpo(),
      ...regrasGaveta(),
    ],
    regras_ferragens: [
      regraCorredicaGaveta(),
      regraPuxadores(),
      regraMinifix(),
      regraPes(),
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 0,
      folga_teto_min_cm: 0,
      afastamento_lateral_cm: 0,
      permite_sequencia: true,
    },
    ativo: true,
    publicado_em: publicado,
  };
}

function criarCabideiro(largura_cm: number): ModuloParametrico {
  return {
    id: `cabideiro_${largura_cm}`,
    codigo: `cabideiro_${largura_cm}`,
    nome: `Módulo Cabideiro ${largura_cm}cm`,
    versao: 1,
    categorias: ["quarto", "closet"],
    tipo: "cabideiro",
    largura: { min_cm: 40, max_cm: 100, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 100, max_cm: 150, padrao_cm: CABIDEIRO_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 55, max_cm: 60, padrao_cm: ROUPEIRO_PROFUNDIDADE_CM, passo_cm: 5 },
    configuracao_padrao: {
      ...cfgRoupeiro,
      tipo_porta: "aberta",
      num_portas: 0,
      num_prateleiras: 1,
      num_gavetas: 0,
      num_divisorias: 0,
      tem_cabideiro: true,
    },
    limites: {
      num_portas: { min: 0, max: 2 },
      num_gavetas: { min: 0, max: 0 },
      num_prateleiras: { min: 0, max: 2 },
      tipos_porta_validos: ["aberta", "dobradica"],
      permite_espelho: false,
      permite_iluminacao_led: true,
      permite_ripado: false,
    },
    regras_pecas: [
      ...regrasCorpo(),
      regraPortaDobradica(),
    ],
    regras_ferragens: [
      regraDobradicas(),
      regraCabideiro(),
      regraPuxadores(),
      regraMinifix(),
      regraPes(),
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 0,
      folga_teto_min_cm: 0,
      afastamento_lateral_cm: 0,
      permite_sequencia: true,
    },
    ativo: true,
    publicado_em: publicado,
  };
}

function criarSapateira(largura_cm: number): ModuloParametrico {
  return {
    id: `sapateira_${largura_cm}`,
    codigo: `sapateira_${largura_cm}`,
    nome: `Sapateira ${largura_cm}cm`,
    versao: 1,
    categorias: ["quarto", "closet"],
    tipo: "sapateira",
    largura: { min_cm: 40, max_cm: 90, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 80, max_cm: 120, padrao_cm: SAPATEIRA_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 30, max_cm: 40, padrao_cm: SAPATEIRA_PROFUNDIDADE_CM, passo_cm: 5 },
    configuracao_padrao: {
      ...cfgRoupeiro,
      tipo_porta: "dobradica",
      num_portas: 2,
      num_prateleiras: 4,
      num_gavetas: 0,
      num_divisorias: 0,
      tem_cabideiro: false,
    },
    limites: {
      num_portas: { min: 1, max: 2 },
      num_gavetas: { min: 0, max: 0 },
      num_prateleiras: { min: 2, max: 6 },
      tipos_porta_validos: ["dobradica", "basculante"],
      permite_espelho: false,
      permite_iluminacao_led: false,
      permite_ripado: false,
    },
    regras_pecas: [
      ...regrasCorpo(),
      regraPortaDobradica(),
    ],
    regras_ferragens: [
      regraDobradicas(),
      regraPuxadores(),
      regraMinifix(),
      regraPes(),
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 0,
      folga_teto_min_cm: 0,
      afastamento_lateral_cm: 0,
      permite_sequencia: true,
    },
    norma_referencia: "Sapateira: prateleiras inclinadas a cada ~18cm",
    ativo: true,
    publicado_em: publicado,
  };
}

// ─── BIBLIOTECAS EXPORTADAS ───────────────────────────────────────────────────

export const MODULOS_ROUPEIRO: ModuloParametrico[] = [
  criarRoupeiro(50), criarRoupeiro(60), criarRoupeiro(70), criarRoupeiro(80), criarRoupeiro(90), criarRoupeiro(100),
];

export const MODULOS_GAVETEIRO: ModuloParametrico[] = [
  criarGaveteiro(40), criarGaveteiro(50), criarGaveteiro(60), criarGaveteiro(70), criarGaveteiro(80),
];

export const MODULOS_CABIDEIRO: ModuloParametrico[] = [
  criarCabideiro(50), criarCabideiro(60), criarCabideiro(70), criarCabideiro(80), criarCabideiro(90), criarCabideiro(100),
];

export const MODULOS_SAPATEIRA: ModuloParametrico[] = [
  criarSapateira(40), criarSapateira(50), criarSapateira(60), criarSapateira(70), criarSapateira(80),
];

export const BIBLIOTECA_QUARTO: Record<string, ModuloParametrico> = {
  ...Object.fromEntries(MODULOS_ROUPEIRO.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_GAVETEIRO.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_CABIDEIRO.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_SAPATEIRA.map((m) => [m.codigo, m])),
};

/** Busca por largura dentro de uma família. */
function buscarPorLargura(familia: ModuloParametrico[], largura_cm: number): ModuloParametrico | undefined {
  return familia.find((m) => m.largura.padrao_cm === largura_cm)
    ?? familia.reduce((maisProx, m) =>
      Math.abs(m.largura.padrao_cm - largura_cm) < Math.abs(maisProx.largura.padrao_cm - largura_cm) ? m : maisProx,
    );
}

export const getTemplateRoupeiro = (l: number) => buscarPorLargura(MODULOS_ROUPEIRO, l);
export const getTemplateGaveteiro = (l: number) => buscarPorLargura(MODULOS_GAVETEIRO, l);
export const getTemplateCabideiro = (l: number) => buscarPorLargura(MODULOS_CABIDEIRO, l);
export const getTemplateSapateira = (l: number) => buscarPorLargura(MODULOS_SAPATEIRA, l);
