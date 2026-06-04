/**
 * PLANNE — Motor Paramétrico
 * Fase 2: Motor Paramétrico V1 — Biblioteca de Módulos de Cozinha
 *
 * Define os ModuloParametrico[] para cozinha linear (base + aéreos).
 * Cada módulo contém regras puras (RegraCorte[] + RegraFerragem[]) baseadas
 * na lógica real do mercado brasileiro e na norma de alturas de cozinha.
 *
 * Referência: api/_calc.ts (pecasCorpo) — mesma lógica, novo formato declarativo.
 * Norma de referência: alturas padrão de bancada 90cm, aéreo começa a 150cm do piso.
 */

import type {
  ModuloParametrico,
  ConfiguracaoModulo,
  RegraCorte,
  RegraFerragem,
  EspessuraMDF,
  FitaBorda,
} from "./tipos";
import { AREA_CHAPA_M2 } from "./tipos";

// ─── DIMENSÕES PADRÃO ─────────────────────────────────────────────────────────

export const BASE_PROFUNDIDADE_CM = 55;   // profundidade padrão de gabinete base
export const BASE_ALTURA_CM = 72;          // altura padrão (rodapé 10cm + corpo 62cm)
export const AEREO_PROFUNDIDADE_CM = 33;  // profundidade padrão de armário aéreo
export const AEREO_ALTURA_CM = 40;         // altura padrão de aéreo simples
export const AEREO_ALTURA_ALTA_CM = 70;   // altura de aéreo alto

const ESP: EspessuraMDF = 15;   // espessura do corpo
const FUNDO: EspessuraMDF = 6;  // espessura do fundo

// ─── REGRAS COMUNS ────────────────────────────────────────────────────────────

const regrasCorpoBase: RegraCorte[] = [
  {
    nome: "lateral",
    grupo: "corpo",
    ativa_quando: () => true,
    calcular_largura_mm: (_L, _A, P) => P,
    calcular_comprimento_mm: (_L, A) => A,
    calcular_quantidade: () => 2,
    espessura_mm: ESP,
    direcao_fio: "paralelo_comprimento",
    fita_borda: (): FitaBorda => ({ esquerda: false, direita: false, topo: true, base: false }),
    usa_material: "corpo",
  },
  {
    nome: "teto",
    grupo: "corpo",
    ativa_quando: () => true,
    calcular_largura_mm: (L) => L - 2 * ESP,
    calcular_comprimento_mm: (_L, _A, P) => P,
    calcular_quantidade: () => 1,
    espessura_mm: ESP,
    direcao_fio: "paralelo_largura",
    fita_borda: (): FitaBorda => ({ esquerda: false, direita: false, topo: true, base: false }),
    usa_material: "corpo",
  },
  {
    nome: "base",
    grupo: "corpo",
    ativa_quando: () => true,
    calcular_largura_mm: (L) => L - 2 * ESP,
    calcular_comprimento_mm: (_L, _A, P) => P,
    calcular_quantidade: () => 1,
    espessura_mm: ESP,
    direcao_fio: "paralelo_largura",
    fita_borda: (): FitaBorda => ({ esquerda: false, direita: false, topo: false, base: false }),
    usa_material: "corpo",
  },
  {
    nome: "prateleira",
    grupo: "corpo",
    ativa_quando: (cfg) => cfg.num_prateleiras > 0,
    calcular_largura_mm: (L) => L - 2 * ESP,
    calcular_comprimento_mm: (_L, _A, P) => P - FUNDO,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_prateleiras,
    espessura_mm: ESP,
    direcao_fio: "paralelo_largura",
    fita_borda: (): FitaBorda => ({ esquerda: false, direita: false, topo: true, base: false }),
    usa_material: "corpo",
  },
  {
    nome: "engrosso",
    grupo: "detalhe",
    ativa_quando: () => true,
    calcular_largura_mm: () => 50,
    calcular_comprimento_mm: (_L, A) => A - 2 * ESP,
    calcular_quantidade: () => 4,
    espessura_mm: ESP,
    direcao_fio: "indiferente",
    fita_borda: (): FitaBorda => ({ esquerda: false, direita: false, topo: false, base: false }),
    usa_material: "corpo",
    observacao: "Reforço frontal para batida das portas",
  },
  {
    nome: "fundo",
    grupo: "fundo",
    ativa_quando: (cfg) => cfg.tem_fundo,
    calcular_largura_mm: (L) => L - 2 * ESP,
    calcular_comprimento_mm: (_L, A) => A - 2 * ESP,
    calcular_quantidade: () => 1,
    espessura_mm: FUNDO,
    direcao_fio: "indiferente",
    fita_borda: (): FitaBorda => ({ esquerda: false, direita: false, topo: false, base: false }),
    usa_material: "fundo",
  },
  {
    nome: "porta_dobradica",
    grupo: "porta",
    ativa_quando: (cfg) => cfg.num_portas > 0 && cfg.tipo_porta === "dobradica",
    calcular_largura_mm: (L, _A, _P, cfg) => Math.round(L / Math.max(cfg.num_portas, 1)),
    calcular_comprimento_mm: (_L, A) => A,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas,
    espessura_mm: ESP,
    direcao_fio: "paralelo_comprimento",
    fita_borda: (): FitaBorda => ({ esquerda: true, direita: true, topo: true, base: true }),
    usa_material: "porta",
  },
  {
    nome: "porta_correr",
    grupo: "porta",
    ativa_quando: (cfg) => cfg.num_portas > 0 && cfg.tipo_porta === "correr",
    calcular_largura_mm: (L, _A, _P, cfg) => Math.round(L / Math.max(cfg.num_portas, 1)),
    calcular_comprimento_mm: (_L, A) => A,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas,
    espessura_mm: ESP,
    direcao_fio: "paralelo_comprimento",
    fita_borda: (): FitaBorda => ({ esquerda: true, direita: true, topo: true, base: true }),
    usa_material: "porta",
  },
  // Gavetas
  {
    nome: "frente_gaveta",
    grupo: "gaveta",
    ativa_quando: (cfg) => cfg.num_gavetas > 0,
    calcular_largura_mm: (L, _A, _P, cfg) => Math.round((L - 2 * ESP) / Math.max(cfg.num_gavetas, 1)),
    calcular_comprimento_mm: () => 160,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas,
    espessura_mm: ESP,
    direcao_fio: "indiferente",
    fita_borda: (): FitaBorda => ({ esquerda: true, direita: true, topo: true, base: true }),
    usa_material: "porta",
  },
  {
    nome: "lateral_gaveta",
    grupo: "gaveta",
    ativa_quando: (cfg) => cfg.num_gavetas > 0,
    calcular_largura_mm: (_L, _A, P) => P - 2 * ESP,
    calcular_comprimento_mm: () => 110,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas * 2,
    espessura_mm: ESP,
    direcao_fio: "indiferente",
    fita_borda: (): FitaBorda => ({ esquerda: false, direita: false, topo: false, base: false }),
    usa_material: "corpo",
  },
  {
    nome: "traseira_gaveta",
    grupo: "gaveta",
    ativa_quando: (cfg) => cfg.num_gavetas > 0,
    calcular_largura_mm: (L, _A, _P, cfg) => Math.round((L - 2 * ESP) / Math.max(cfg.num_gavetas, 1)) - 2 * ESP,
    calcular_comprimento_mm: () => 110,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas,
    espessura_mm: ESP,
    direcao_fio: "indiferente",
    fita_borda: (): FitaBorda => ({ esquerda: false, direita: false, topo: false, base: false }),
    usa_material: "corpo",
  },
  {
    nome: "fundo_gaveta",
    grupo: "gaveta",
    ativa_quando: (cfg) => cfg.num_gavetas > 0,
    calcular_largura_mm: (L, _A, _P, cfg) => Math.round((L - 2 * ESP) / Math.max(cfg.num_gavetas, 1)) - 2 * ESP,
    calcular_comprimento_mm: (_L, _A, P) => P - 2 * ESP,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas,
    espessura_mm: FUNDO,
    direcao_fio: "indiferente",
    fita_borda: (): FitaBorda => ({ esquerda: false, direita: false, topo: false, base: false }),
    usa_material: "fundo",
  },
];

// ─── FERRAGENS COMUNS ─────────────────────────────────────────────────────────

const regrasDobradica: RegraFerragem[] = [
  {
    tipo: "dobradica_35mm_110grau",
    ativa_quando: (cfg) => cfg.tipo_porta === "dobradica" && cfg.num_portas > 0,
    calcular_quantidade: (_L, A, _P, cfg) => cfg.num_portas * (A > 1500 ? 3 : 2),
    descricao_tecnica: "2 dobradiças por porta (≤150cm) ou 3 (>150cm)",
  },
];

const regrasCorredica: RegraFerragem[] = [
  {
    tipo: "corredicao_lateral_porta",
    ativa_quando: (cfg) => cfg.tipo_porta === "correr" && cfg.num_portas > 0,
    calcular_quantidade: (_L, _A, _P, cfg) => Math.ceil(cfg.num_portas / 2),
    descricao_tecnica: "1 par de corrediças por 2 portas de correr",
  },
];

const regrasPuxador: RegraFerragem[] = [
  {
    tipo: "puxador_perfil_alu_1200mm",
    ativa_quando: (cfg) => cfg.tipo_puxador === "perfil_aluminio",
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas + cfg.num_gavetas,
    descricao_tecnica: "1 puxador por porta + 1 por gaveta",
  },
  {
    tipo: "puxador_alu_128mm",
    ativa_quando: (cfg) => cfg.tipo_puxador === "puxador_alu",
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas + cfg.num_gavetas,
    descricao_tecnica: "1 puxador 128mm por porta + 1 por gaveta",
  },
];

const regrasCorredicas: RegraFerragem[] = [
  {
    tipo: "corredicao_tandem_300mm",
    ativa_quando: (cfg) => cfg.num_gavetas > 0,
    calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_gavetas,
    descricao_tecnica: "1 par de corrediças por gaveta",
  },
];

const regrasMinifix: RegraFerragem[] = [
  {
    tipo: "minifix_15mm",
    ativa_quando: () => true,
    calcular_quantidade: (_L, _A, _P, cfg) => 8 + cfg.num_prateleiras * 4 + cfg.num_gavetas * 4,
    descricao_tecnica: "8 por corpo + 4 por prateleira + 4 por gaveta",
  },
];

const regrasPes: RegraFerragem[] = [
  {
    tipo: "ajustador_pe_100mm",
    ativa_quando: (cfg) => cfg.tem_pes_regulaveis,
    calcular_quantidade: (L) => L > 1500 ? 6 : 4,
    descricao_tecnica: "4 pés (módulo ≤150cm) ou 6 pés (>150cm)",
  },
];

// ─── CONFIGURAÇÃO PADRÃO ──────────────────────────────────────────────────────

const cfgBase: ConfiguracaoModulo = {
  tipo_porta: "dobradica",
  num_portas: 2,
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

const cfgAereo: ConfiguracaoModulo = {
  ...cfgBase,
  num_portas: 2,
  num_prateleiras: 1,
  tem_pes_regulaveis: false,
};

// ─── FÁBRICA DE MÓDULOS ───────────────────────────────────────────────────────

function criarModuloBase(largura_cm: number): ModuloParametrico {
  return {
    id: `base_${largura_cm}`,
    codigo: `base_${largura_cm}`,
    nome: `Gabinete Base ${largura_cm}cm`,
    versao: 1,
    categorias: ["cozinha"],
    tipo: "base",
    largura: { min_cm: largura_cm, max_cm: largura_cm, padrao_cm: largura_cm, passo_cm: 0 },
    altura: { min_cm: BASE_ALTURA_CM, max_cm: BASE_ALTURA_CM, padrao_cm: BASE_ALTURA_CM, passo_cm: 0 },
    profundidade: { min_cm: BASE_PROFUNDIDADE_CM, max_cm: BASE_PROFUNDIDADE_CM, padrao_cm: BASE_PROFUNDIDADE_CM, passo_cm: 0 },
    configuracao_padrao: { ...cfgBase, num_portas: largura_cm <= 40 ? 1 : 2 },
    limites: {
      num_portas: { min: 1, max: 4 },
      num_gavetas: { min: 0, max: 3 },
      num_prateleiras: { min: 0, max: 4 },
      tipos_porta_validos: ["dobradica", "correr"],
      permite_espelho: false,
      permite_iluminacao_led: false,
      permite_ripado: false,
    },
    regras_pecas: regrasCorpoBase,
    regras_ferragens: [
      ...regrasDobradica,
      ...regrasCorredica,
      ...regrasPuxador,
      ...regrasCorredicas,
      ...regrasMinifix,
      ...regrasPes,
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 0,
      folga_teto_min_cm: 0,
      afastamento_lateral_cm: 0,
      permite_sequencia: true,
    },
    norma_referencia: "Altura padrão bancada cozinha 90cm (piso + rodapé + base + tampo)",
    altura_trabalho_cm: 90,
    ativo: true,
    publicado_em: "2026-06-04T00:00:00Z",
  };
}

function criarModuloAereo(largura_cm: number, altura_cm = AEREO_ALTURA_CM): ModuloParametrico {
  return {
    id: `aereo_${largura_cm}_${altura_cm}`,
    codigo: `aereo_${largura_cm}`,
    nome: `Armário Aéreo ${largura_cm}cm`,
    versao: 1,
    categorias: ["cozinha"],
    tipo: "aereo",
    largura: { min_cm: largura_cm, max_cm: largura_cm, padrao_cm: largura_cm, passo_cm: 0 },
    altura: { min_cm: altura_cm, max_cm: altura_cm, padrao_cm: altura_cm, passo_cm: 0 },
    profundidade: { min_cm: AEREO_PROFUNDIDADE_CM, max_cm: AEREO_PROFUNDIDADE_CM, padrao_cm: AEREO_PROFUNDIDADE_CM, passo_cm: 0 },
    configuracao_padrao: { ...cfgAereo, num_portas: largura_cm <= 40 ? 1 : 2 },
    limites: {
      num_portas: { min: 1, max: 4 },
      num_gavetas: { min: 0, max: 0 },
      num_prateleiras: { min: 0, max: 3 },
      tipos_porta_validos: ["dobradica", "basculante"],
      permite_espelho: false,
      permite_iluminacao_led: true,
      permite_ripado: false,
    },
    regras_pecas: regrasCorpoBase,
    regras_ferragens: [
      ...regrasDobradica,
      ...regrasPuxador,
      ...regrasMinifix,
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 150,  // início do aéreo a 150cm do piso
      folga_teto_min_cm: 10,
      afastamento_lateral_cm: 0,
      permite_sequencia: true,
    },
    ativo: true,
    publicado_em: "2026-06-04T00:00:00Z",
  };
}

// ─── BIBLIOTECAS EXPORTADAS ───────────────────────────────────────────────────

/** Módulos base padrão para cozinha linear (larguras em cm). */
export const MODULOS_BASE_COZINHA: ModuloParametrico[] = [
  criarModuloBase(30),
  criarModuloBase(40),
  criarModuloBase(45),
  criarModuloBase(50),
  criarModuloBase(60),
  criarModuloBase(70),
  criarModuloBase(80),
  criarModuloBase(90),
];

/** Módulos aéreos padrão para cozinha linear (larguras em cm, altura 40cm). */
export const MODULOS_AEREOS_COZINHA: ModuloParametrico[] = [
  criarModuloAereo(30),
  criarModuloAereo(40),
  criarModuloAereo(45),
  criarModuloAereo(50),
  criarModuloAereo(60),
  criarModuloAereo(70),
  criarModuloAereo(80),
  criarModuloAereo(90),
];

/** Índice: código → template. Usado pelo motor para lookup rápido. */
export const BIBLIOTECA_COZINHA: Record<string, ModuloParametrico> = {
  ...Object.fromEntries(MODULOS_BASE_COZINHA.map(m => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_AEREOS_COZINHA.map(m => [m.codigo, m])),
};

/** Buscar template base pela largura. Retorna undefined se largura não está na biblioteca. */
export function getTemplateBase(largura_cm: number): ModuloParametrico | undefined {
  return MODULOS_BASE_COZINHA.find(m => m.largura.padrao_cm === largura_cm);
}

/** Buscar template aéreo pela largura. */
export function getTemplateAereo(largura_cm: number): ModuloParametrico | undefined {
  return MODULOS_AEREOS_COZINHA.find(m => m.largura.padrao_cm === largura_cm);
}

/** Larguras padrão disponíveis (ordenadas de maior para menor para o algoritmo greedy). */
export const LARGURAS_PADRAO = [90, 80, 70, 60, 50, 45, 40, 30] as const;
