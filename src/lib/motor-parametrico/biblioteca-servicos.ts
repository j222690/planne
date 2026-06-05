/**
 * PLANNE — Motor Paramétrico
 * Fase 6: Biblioteca de Banheiro e Lavanderia (ambientes molhados)
 *
 * Banheiro:   gabinete de pia, espelheira, nicho.
 * Lavanderia: gabinete de tanque, armário de serviço (produtos), prateleira.
 *
 * Características comuns: módulos rasos, resistência à umidade (acabamento),
 * gabinete de pia/tanque sem fundo na zona da cuba.
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

export const GAB_PIA_ALTURA_CM = 55;
export const GAB_PIA_PROFUNDIDADE_CM = 46;
export const ESPELHEIRA_ALTURA_CM = 70;
export const ESPELHEIRA_PROFUNDIDADE_CM = 12;
export const GAB_TANQUE_ALTURA_CM = 70;
export const GAB_TANQUE_PROFUNDIDADE_CM = 55;
export const ARMARIO_SERVICO_ALTURA_CM = 60;
export const ARMARIO_SERVICO_PROFUNDIDADE_CM = 33;

const publicado = "2026-06-05T00:00:00Z";

const cfgBaseUmido: ConfiguracaoModulo = {
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
  altura_pes_cm: 12,
  tem_roda_teto: false,
  tem_iluminacao_led: false,
  tem_espelho_interno: false,
  tem_ripado: false,
  espessura_corpo_mm: 15,
  espessura_porta_mm: 15,
  ferragem: "nacional",
  tipo_puxador: "puxador_alu",
};

// ─── FÁBRICAS — BANHEIRO ──────────────────────────────────────────────────────

function criarGabinetePia(largura_cm: number): ModuloParametrico {
  return {
    id: `gab_pia_${largura_cm}`,
    codigo: `gab_pia_${largura_cm}`,
    nome: `Gabinete de Pia ${largura_cm}cm`,
    versao: 1,
    categorias: ["banheiro"],
    tipo: "base",
    largura: { min_cm: 40, max_cm: 120, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 50, max_cm: 60, padrao_cm: GAB_PIA_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 40, max_cm: 50, padrao_cm: GAB_PIA_PROFUNDIDADE_CM, passo_cm: 2 },
    configuracao_padrao: {
      ...cfgBaseUmido,
      num_portas: largura_cm <= 50 ? 1 : 2,
      num_prateleiras: 1,
      tem_fundo: false, // zona da cuba: sem fundo
    },
    limites: {
      num_portas: { min: 1, max: 3 },
      num_gavetas: { min: 0, max: 3 },
      num_prateleiras: { min: 0, max: 2 },
      tipos_porta_validos: ["dobradica", "basculante"],
      permite_espelho: false,
      permite_iluminacao_led: false,
      permite_ripado: false,
    },
    regras_pecas: [
      ...regrasCorpo(),
      regraPortaDobradica(),
      ...regrasGaveta(),
    ],
    regras_ferragens: [
      regraDobradicas(),
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
      requer_ponto_hidraulico: true,
    },
    norma_referencia: "Gabinete de pia: altura útil ~80cm com bancada",
    ativo: true,
    publicado_em: publicado,
  };
}

function criarEspelheira(largura_cm: number): ModuloParametrico {
  return {
    id: `espelheira_${largura_cm}`,
    codigo: `espelheira_${largura_cm}`,
    nome: `Espelheira ${largura_cm}cm`,
    versao: 1,
    categorias: ["banheiro"],
    tipo: "espelheira",
    largura: { min_cm: 40, max_cm: 120, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 60, max_cm: 80, padrao_cm: ESPELHEIRA_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 10, max_cm: 15, padrao_cm: ESPELHEIRA_PROFUNDIDADE_CM, passo_cm: 1 },
    configuracao_padrao: {
      ...cfgBaseUmido,
      tipo_porta: "espelho",
      num_portas: largura_cm <= 50 ? 1 : 2,
      num_prateleiras: 2,
      tem_pes_regulaveis: false,
      tem_espelho_interno: true,
    },
    limites: {
      num_portas: { min: 1, max: 3 },
      num_gavetas: { min: 0, max: 0 },
      num_prateleiras: { min: 1, max: 3 },
      tipos_porta_validos: ["espelho", "dobradica"],
      permite_espelho: true,
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
      altura_piso_padrao_cm: 120,
      folga_teto_min_cm: 0,
      afastamento_lateral_cm: 0,
      permite_sequencia: true,
    },
    ativo: true,
    publicado_em: publicado,
  };
}

// ─── FÁBRICAS — LAVANDERIA ────────────────────────────────────────────────────

function criarGabineteTanque(largura_cm: number): ModuloParametrico {
  return {
    id: `gab_tanque_${largura_cm}`,
    codigo: `gab_tanque_${largura_cm}`,
    nome: `Gabinete de Tanque ${largura_cm}cm`,
    versao: 1,
    categorias: ["lavanderia"],
    tipo: "base",
    largura: { min_cm: 40, max_cm: 100, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 65, max_cm: 75, padrao_cm: GAB_TANQUE_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 50, max_cm: 60, padrao_cm: GAB_TANQUE_PROFUNDIDADE_CM, passo_cm: 5 },
    configuracao_padrao: {
      ...cfgBaseUmido,
      num_portas: largura_cm <= 50 ? 1 : 2,
      num_prateleiras: 1,
      tem_fundo: false, // zona do tanque
    },
    limites: {
      num_portas: { min: 1, max: 2 },
      num_gavetas: { min: 0, max: 2 },
      num_prateleiras: { min: 0, max: 2 },
      tipos_porta_validos: ["dobradica"],
      permite_espelho: false,
      permite_iluminacao_led: false,
      permite_ripado: false,
    },
    regras_pecas: [
      ...regrasCorpo(),
      regraPortaDobradica(),
      ...regrasGaveta(),
    ],
    regras_ferragens: [
      regraDobradicas(),
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
      requer_ponto_hidraulico: true,
    },
    ativo: true,
    publicado_em: publicado,
  };
}

function criarArmarioServico(largura_cm: number): ModuloParametrico {
  return {
    id: `armario_servico_${largura_cm}`,
    codigo: `armario_servico_${largura_cm}`,
    nome: `Armário de Serviço ${largura_cm}cm`,
    versao: 1,
    categorias: ["lavanderia"],
    tipo: "aereo",
    largura: { min_cm: 40, max_cm: 100, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 50, max_cm: 80, padrao_cm: ARMARIO_SERVICO_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 30, max_cm: 35, padrao_cm: ARMARIO_SERVICO_PROFUNDIDADE_CM, passo_cm: 2 },
    configuracao_padrao: {
      ...cfgBaseUmido,
      num_portas: largura_cm <= 50 ? 1 : 2,
      num_prateleiras: 2,
      tem_pes_regulaveis: false,
    },
    limites: {
      num_portas: { min: 1, max: 3 },
      num_gavetas: { min: 0, max: 0 },
      num_prateleiras: { min: 1, max: 3 },
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
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: 150,
      folga_teto_min_cm: 10,
      afastamento_lateral_cm: 0,
      permite_sequencia: true,
    },
    ativo: true,
    publicado_em: publicado,
  };
}

// ─── BIBLIOTECAS EXPORTADAS ───────────────────────────────────────────────────

export const MODULOS_GABINETE_PIA: ModuloParametrico[] = [
  criarGabinetePia(40), criarGabinetePia(50), criarGabinetePia(60), criarGabinetePia(70), criarGabinetePia(80),
];

export const MODULOS_ESPELHEIRA: ModuloParametrico[] = [
  criarEspelheira(40), criarEspelheira(50), criarEspelheira(60), criarEspelheira(70), criarEspelheira(80),
];

export const MODULOS_GABINETE_TANQUE: ModuloParametrico[] = [
  criarGabineteTanque(40), criarGabineteTanque(50), criarGabineteTanque(60), criarGabineteTanque(70),
];

export const MODULOS_ARMARIO_SERVICO: ModuloParametrico[] = [
  criarArmarioServico(40), criarArmarioServico(50), criarArmarioServico(60), criarArmarioServico(70), criarArmarioServico(80),
];

export const BIBLIOTECA_SERVICOS: Record<string, ModuloParametrico> = {
  ...Object.fromEntries(MODULOS_GABINETE_PIA.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_ESPELHEIRA.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_GABINETE_TANQUE.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_ARMARIO_SERVICO.map((m) => [m.codigo, m])),
};

function buscarPorLargura(familia: ModuloParametrico[], largura_cm: number): ModuloParametrico | undefined {
  return familia.find((m) => m.largura.padrao_cm === largura_cm)
    ?? familia.reduce((maisProx, m) =>
      Math.abs(m.largura.padrao_cm - largura_cm) < Math.abs(maisProx.largura.padrao_cm - largura_cm) ? m : maisProx,
    );
}

export const getTemplateGabinetePia = (l: number) => buscarPorLargura(MODULOS_GABINETE_PIA, l);
export const getTemplateEspelheira = (l: number) => buscarPorLargura(MODULOS_ESPELHEIRA, l);
export const getTemplateGabineteTanque = (l: number) => buscarPorLargura(MODULOS_GABINETE_TANQUE, l);
export const getTemplateArmarioServico = (l: number) => buscarPorLargura(MODULOS_ARMARIO_SERVICO, l);
