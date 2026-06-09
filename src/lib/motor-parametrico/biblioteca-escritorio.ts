/**
 * PLANNE — Motor Paramétrico
 * Fase 7: Biblioteca de Escritório / Home Office
 *
 * Bancada de trabalho (escrivaninha) com gavetas, gaveteiro-bloco e estante
 * aérea de prateleiras para livros/arquivos.
 */

import type { ModuloParametrico, ConfiguracaoModulo } from "./tipos";
import {
  regrasCorpo,
  regraPortaDobradica,
  regrasGaveta,
  regraDobradicas,
  regraCorredicaGaveta,
  regraPuxadores,
  regraMinifix,
  regraPes,
} from "./regras-corte-comuns";

// ─── DIMENSÕES ────────────────────────────────────────────────────────────────

export const ESCRIVANINHA_ALTURA_CM = 74;
export const ESCRIVANINHA_PROFUNDIDADE_CM = 60;
export const GAVETEIRO_ESC_ALTURA_CM = 70;
export const GAVETEIRO_ESC_PROFUNDIDADE_CM = 50;
export const ESTANTE_ESC_ALTURA_CM = 70;
export const ESTANTE_ESC_PROFUNDIDADE_CM = 30;

export const ESTANTE_ESC_INICIO_Y_CM = 120;

const publicado = "2026-06-09T00:00:00Z";

const cfgBaseEsc: ConfiguracaoModulo = {
  tipo_porta: "dobradica",
  num_portas: 0,
  num_prateleiras: 1,
  num_gavetas: 0,
  num_divisorias: 0,
  tem_cabideiro: false,
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
  tipo_puxador: "perfil_aluminio",
};

// ─── FÁBRICAS ─────────────────────────────────────────────────────────────────

function criarEscrivaninha(largura_cm: number): ModuloParametrico {
  return {
    id: `escrivaninha_${largura_cm}`,
    codigo: `escrivaninha_${largura_cm}`,
    nome: `Bancada de Trabalho ${largura_cm}cm`,
    versao: 1,
    categorias: ["escritorio"],
    tipo: "escrivaninha",
    largura: { min_cm: 60, max_cm: 200, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 72, max_cm: 78, padrao_cm: ESCRIVANINHA_ALTURA_CM, passo_cm: 2 },
    profundidade: { min_cm: 50, max_cm: 70, padrao_cm: ESCRIVANINHA_PROFUNDIDADE_CM, passo_cm: 5 },
    configuracao_padrao: {
      ...cfgBaseEsc,
      num_portas: 0,
      num_gavetas: largura_cm >= 100 ? 2 : 1,
      num_prateleiras: 0,
    },
    limites: {
      num_portas: { min: 0, max: 2 },
      num_gavetas: { min: 0, max: 3 },
      num_prateleiras: { min: 0, max: 1 },
      tipos_porta_validos: ["dobradica"],
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
    norma_referencia: "Bancada de trabalho: altura ergonômica 72–75cm (NR-17)",
    ativo: true,
    publicado_em: publicado,
  };
}

function criarGaveteiroEsc(largura_cm: number): ModuloParametrico {
  return {
    id: `gaveteiro_esc_${largura_cm}`,
    codigo: `gaveteiro_esc_${largura_cm}`,
    nome: `Gaveteiro ${largura_cm}cm`,
    versao: 1,
    categorias: ["escritorio"],
    tipo: "gaveta_bloco",
    largura: { min_cm: 35, max_cm: 50, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 65, max_cm: 72, padrao_cm: GAVETEIRO_ESC_ALTURA_CM, passo_cm: 2 },
    profundidade: { min_cm: 45, max_cm: 55, padrao_cm: GAVETEIRO_ESC_PROFUNDIDADE_CM, passo_cm: 5 },
    configuracao_padrao: {
      ...cfgBaseEsc,
      num_portas: 0,
      num_gavetas: 4,
      num_prateleiras: 0,
    },
    limites: {
      num_portas: { min: 0, max: 0 },
      num_gavetas: { min: 2, max: 5 },
      num_prateleiras: { min: 0, max: 0 },
      tipos_porta_validos: ["dobradica"],
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

function criarEstanteEsc(largura_cm: number): ModuloParametrico {
  return {
    id: `estante_esc_${largura_cm}`,
    codigo: `estante_esc_${largura_cm}`,
    nome: `Estante de Prateleiras ${largura_cm}cm`,
    versao: 1,
    categorias: ["escritorio"],
    tipo: "estante",
    largura: { min_cm: 40, max_cm: 120, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 50, max_cm: 100, padrao_cm: ESTANTE_ESC_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 25, max_cm: 35, padrao_cm: ESTANTE_ESC_PROFUNDIDADE_CM, passo_cm: 2 },
    configuracao_padrao: {
      ...cfgBaseEsc,
      num_portas: largura_cm >= 80 ? 2 : 0,
      num_prateleiras: 3,
      tem_pes_regulaveis: false,
    },
    limites: {
      num_portas: { min: 0, max: 2 },
      num_gavetas: { min: 0, max: 0 },
      num_prateleiras: { min: 1, max: 5 },
      tipos_porta_validos: ["dobradica", "correr"],
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
      regraPuxadores(),
      regraMinifix(),
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: ESTANTE_ESC_INICIO_Y_CM,
      folga_teto_min_cm: 10,
      afastamento_lateral_cm: 0,
      permite_sequencia: true,
    },
    ativo: true,
    publicado_em: publicado,
  };
}

// ─── BIBLIOTECAS EXPORTADAS ───────────────────────────────────────────────────

export const MODULOS_ESCRIVANINHA: ModuloParametrico[] = [
  criarEscrivaninha(80), criarEscrivaninha(100), criarEscrivaninha(120), criarEscrivaninha(140), criarEscrivaninha(160),
];

export const MODULOS_GAVETEIRO_ESC: ModuloParametrico[] = [
  criarGaveteiroEsc(40), criarGaveteiroEsc(45), criarGaveteiroEsc(50),
];

export const MODULOS_ESTANTE_ESC: ModuloParametrico[] = [
  criarEstanteEsc(50), criarEstanteEsc(60), criarEstanteEsc(70), criarEstanteEsc(80), criarEstanteEsc(90),
];

export const BIBLIOTECA_ESCRITORIO: Record<string, ModuloParametrico> = {
  ...Object.fromEntries(MODULOS_ESCRIVANINHA.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_GAVETEIRO_ESC.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_ESTANTE_ESC.map((m) => [m.codigo, m])),
};

function buscarPorLargura(familia: ModuloParametrico[], largura_cm: number): ModuloParametrico | undefined {
  return familia.find((m) => m.largura.padrao_cm === largura_cm)
    ?? familia.reduce((maisProx, m) =>
      Math.abs(m.largura.padrao_cm - largura_cm) < Math.abs(maisProx.largura.padrao_cm - largura_cm) ? m : maisProx,
    );
}

export const getTemplateEscrivaninha = (l: number) => buscarPorLargura(MODULOS_ESCRIVANINHA, l);
export const getTemplateGaveteiroEsc = (l: number) => buscarPorLargura(MODULOS_GAVETEIRO_ESC, l);
export const getTemplateEstanteEsc = (l: number) => buscarPorLargura(MODULOS_ESTANTE_ESC, l);
