/**
 * PLANNE — Motor Paramétrico
 * Fase 7: Biblioteca de Sala (home theater / sala de estar)
 *
 * Rack de TV (base baixa com gavetas e portas), painel ripado decorativo
 * atrás da TV, e estante de nichos aérea para livros/decoração.
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

export const RACK_TV_ALTURA_CM = 45;
export const RACK_TV_PROFUNDIDADE_CM = 48;
export const PAINEL_RIPADO_ALTURA_CM = 110;
export const PAINEL_RIPADO_PROFUNDIDADE_CM = 4;
export const NICHO_SALA_ALTURA_CM = 60;
export const NICHO_SALA_PROFUNDIDADE_CM = 30;

export const PAINEL_RIPADO_INICIO_Y_CM = 55;
export const NICHO_SALA_INICIO_Y_CM = 175;

const publicado = "2026-06-09T00:00:00Z";

const cfgBaseSala: ConfiguracaoModulo = {
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
  altura_pes_cm: 8,
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

function criarRackTv(largura_cm: number): ModuloParametrico {
  return {
    id: `rack_tv_${largura_cm}`,
    codigo: `rack_tv_${largura_cm}`,
    nome: `Rack de TV ${largura_cm}cm`,
    versao: 1,
    categorias: ["sala"],
    tipo: "rack_tv",
    largura: { min_cm: 40, max_cm: 120, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 35, max_cm: 55, padrao_cm: RACK_TV_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 40, max_cm: 55, padrao_cm: RACK_TV_PROFUNDIDADE_CM, passo_cm: 2 },
    configuracao_padrao: {
      ...cfgBaseSala,
      num_portas: largura_cm <= 50 ? 1 : 2,
      num_gavetas: largura_cm >= 80 ? 2 : 1,
      num_prateleiras: 1,
    },
    limites: {
      num_portas: { min: 0, max: 3 },
      num_gavetas: { min: 0, max: 3 },
      num_prateleiras: { min: 0, max: 2 },
      tipos_porta_validos: ["dobradica", "basculante"],
      permite_espelho: false,
      permite_iluminacao_led: true,
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
    },
    norma_referencia: "Rack de TV: centro da tela ~110cm do piso (NBR de ergonomia visual)",
    ativo: true,
    publicado_em: publicado,
  };
}

function criarPainelRipado(largura_cm: number): ModuloParametrico {
  return {
    id: `painel_ripado_${largura_cm}`,
    codigo: `painel_ripado_${largura_cm}`,
    nome: `Painel Ripado TV ${largura_cm}cm`,
    versao: 1,
    categorias: ["sala"],
    tipo: "painel_ripado",
    largura: { min_cm: 60, max_cm: 200, padrao_cm: largura_cm, passo_cm: 10 },
    altura: { min_cm: 80, max_cm: 160, padrao_cm: PAINEL_RIPADO_ALTURA_CM, passo_cm: 10 },
    profundidade: { min_cm: 3, max_cm: 6, padrao_cm: PAINEL_RIPADO_PROFUNDIDADE_CM, passo_cm: 1 },
    configuracao_padrao: {
      ...cfgBaseSala,
      tipo_porta: "dobradica",
      num_portas: 0,
      num_prateleiras: 0,
      tem_fundo: false,
      tem_pes_regulaveis: false,
      tem_ripado: true,
    },
    limites: {
      num_portas: { min: 0, max: 0 },
      num_gavetas: { min: 0, max: 0 },
      num_prateleiras: { min: 0, max: 0 },
      tipos_porta_validos: ["dobradica"],
      permite_espelho: false,
      permite_iluminacao_led: true,
      permite_ripado: true,
    },
    regras_pecas: [
      ...regrasCorpo(),
    ],
    regras_ferragens: [
      regraMinifix(),
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: PAINEL_RIPADO_INICIO_Y_CM,
      folga_teto_min_cm: 0,
      afastamento_lateral_cm: 0,
      permite_sequencia: false,
    },
    norma_referencia: "Painel decorativo ripado: fixação direta na parede atrás da TV",
    ativo: true,
    publicado_em: publicado,
  };
}

function criarNichoSala(largura_cm: number): ModuloParametrico {
  return {
    id: `nicho_sala_${largura_cm}`,
    codigo: `nicho_sala_${largura_cm}`,
    nome: `Estante de Nichos ${largura_cm}cm`,
    versao: 1,
    categorias: ["sala"],
    tipo: "estante",
    largura: { min_cm: 40, max_cm: 120, padrao_cm: largura_cm, passo_cm: 5 },
    altura: { min_cm: 40, max_cm: 90, padrao_cm: NICHO_SALA_ALTURA_CM, passo_cm: 5 },
    profundidade: { min_cm: 25, max_cm: 35, padrao_cm: NICHO_SALA_PROFUNDIDADE_CM, passo_cm: 2 },
    configuracao_padrao: {
      ...cfgBaseSala,
      num_portas: 0,
      num_prateleiras: 2,
      num_divisorias: largura_cm >= 80 ? 1 : 0,
      tem_fundo: true,
      tem_pes_regulaveis: false,
    },
    limites: {
      num_portas: { min: 0, max: 2 },
      num_gavetas: { min: 0, max: 0 },
      num_prateleiras: { min: 1, max: 4 },
      tipos_porta_validos: ["dobradica"],
      permite_espelho: false,
      permite_iluminacao_led: true,
      permite_ripado: false,
    },
    regras_pecas: [
      ...regrasCorpo(),
    ],
    regras_ferragens: [
      regraMinifix(),
    ],
    restricoes_placement: {
      altura_piso_padrao_cm: NICHO_SALA_INICIO_Y_CM,
      folga_teto_min_cm: 10,
      afastamento_lateral_cm: 0,
      permite_sequencia: true,
    },
    ativo: true,
    publicado_em: publicado,
  };
}

// ─── BIBLIOTECAS EXPORTADAS ───────────────────────────────────────────────────

export const MODULOS_RACK_TV: ModuloParametrico[] = [
  criarRackTv(50), criarRackTv(60), criarRackTv(70), criarRackTv(80), criarRackTv(90),
];

export const MODULOS_PAINEL_RIPADO: ModuloParametrico[] = [
  criarPainelRipado(100), criarPainelRipado(120), criarPainelRipado(140), criarPainelRipado(160), criarPainelRipado(180),
];

export const MODULOS_NICHO_SALA: ModuloParametrico[] = [
  criarNichoSala(50), criarNichoSala(60), criarNichoSala(70), criarNichoSala(80), criarNichoSala(90),
];

export const BIBLIOTECA_SALA: Record<string, ModuloParametrico> = {
  ...Object.fromEntries(MODULOS_RACK_TV.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_PAINEL_RIPADO.map((m) => [m.codigo, m])),
  ...Object.fromEntries(MODULOS_NICHO_SALA.map((m) => [m.codigo, m])),
};

function buscarPorLargura(familia: ModuloParametrico[], largura_cm: number): ModuloParametrico | undefined {
  return familia.find((m) => m.largura.padrao_cm === largura_cm)
    ?? familia.reduce((maisProx, m) =>
      Math.abs(m.largura.padrao_cm - largura_cm) < Math.abs(maisProx.largura.padrao_cm - largura_cm) ? m : maisProx,
    );
}

export const getTemplateRackTv = (l: number) => buscarPorLargura(MODULOS_RACK_TV, l);
export const getTemplatePainelRipado = (l: number) => buscarPorLargura(MODULOS_PAINEL_RIPADO, l);
export const getTemplateNichoSala = (l: number) => buscarPorLargura(MODULOS_NICHO_SALA, l);
