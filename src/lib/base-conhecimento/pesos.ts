/**
 * PLANNE — Base de Conhecimento da Marcenaria (Camada 3 · Pesos e Cargas)
 *
 * Faz o sistema "entender peso": estima o peso das peças/módulos (via densidade
 * do MDF, já na conhecimento-tecnico) e valida se as ferragens escolhidas
 * aguentam a carga — usando as capacidades pesquisadas na base.
 *
 * Reutiliza `pesoPeca`/`ESPECS_MDF` (não duplica densidade) e complementa com as
 * cargas de corrediça e porta de correr extraídas dos átomos.
 */

import type { EspessuraMDF } from "../motor-parametrico/tipos";
import { pesoPeca, ESPECS_FERRAGEM } from "../motor-parametrico/conhecimento-tecnico";
import { dobradicasPorPesoKg, dobradicasPorAlturaMm, type Param } from "./parametros";

// re-export utilitário de peso de peça (fonte única: conhecimento-tecnico)
export { pesoPeca };

const A_CORR_CARGA = "atom_02_corredicas_capacidade_de_carga_e_tipos_de_extracao_capacidade_de_carga_por_co";
const A_CORRER_CARGA = "atom_04_porta_de_correr_capacidade_de_carga_do_sistema_de_correr_por_linha_de_ferrage";

// ─── CAPACIDADES DE CARGA (da base) ──────────────────────────────────────────

/** Capacidade de carga por par de corrediça telescópica, por linha. */
export const CARGA_CORREDICA_KG: Param<{ padrao: number; reforcada: number; invisivel: number }> = {
  valor: { padrao: 30, reforcada: 45, invisivel: 30 },
  unidade: "kg por par",
  fonteAtomo: A_CORR_CARGA,
  obs: "Telescópica 250mm ~30kg; reforçada ~45kg; invisível 550mm ~30kg.",
};

/** Capacidade de carga do sistema de porta de correr, por linha. */
export const CARGA_PORTA_CORRER_KG: Param<{ leve: number; media: number; reforcada: number }> = {
  valor: { leve: 30, media: 50, reforcada: 100 },
  unidade: "kg por folha",
  fonteAtomo: A_CORRER_CARGA,
  obs: "Embutido 30–80kg; linha específica 50kg; reforçada (alumínio) até 100kg.",
};

// ─── PESO DE PEÇAS E MÓDULOS ─────────────────────────────────────────────────

export interface PecaPeso {
  largura_mm: number;
  comprimento_mm: number;
  espessura_mm: EspessuraMDF;
  quantidade?: number;
}

/** Peso total (kg) de um conjunto de peças. */
export function pesoModulo(pecas: PecaPeso[]): number {
  const total = pecas.reduce(
    (s, p) => s + pesoPeca(p.largura_mm, p.comprimento_mm, p.espessura_mm) * (p.quantidade ?? 1),
    0,
  );
  return Math.round(total * 100) / 100;
}

/** Peso (kg) de uma folha de porta retangular de MDF. */
export function pesoPorta(largura_mm: number, altura_mm: number, espessura_mm: EspessuraMDF = 15): number {
  return pesoPeca(largura_mm, altura_mm, espessura_mm);
}

// ─── VALIDAÇÃO DE CARGA ──────────────────────────────────────────────────────

export interface VeredictoCarga {
  ok: boolean;
  peso_kg: number;
  capacidade_kg: number;
  severidade: "ok" | "atencao" | "critico";
  mensagem: string;
  /** nº de ferragens recomendado para o peso (quando aplicável). */
  quantidade_recomendada?: number;
}

/**
 * Valida se um jogo de dobradiças aguenta o peso da porta.
 * Cruza a capacidade unitária (ESPECS_FERRAGEM) com o nº escolhido, e recomenda
 * a quantidade certa quando falta ferragem — combinando a regra por altura e a
 * regra por peso (a mais exigente vence).
 */
export function validarDobradicas(
  peso_kg: number,
  altura_mm: number,
  num_dobradicas: number,
): VeredictoCarga {
  const capUnit = ESPECS_FERRAGEM.dobradica_35mm_110grau?.capacidade_kg ?? 8;
  const capacidade = capUnit * num_dobradicas;
  const porAltura = dobradicasPorAlturaMm(altura_mm);
  const porPeso = dobradicasPorPesoKg(peso_kg);
  const recomendada = Math.max(porAltura, porPeso ?? 0, Math.ceil(peso_kg / capUnit));
  const ok = capacidade >= peso_kg && num_dobradicas >= porAltura;
  const severidade: VeredictoCarga["severidade"] = capacidade < peso_kg ? "critico" : !ok ? "atencao" : "ok";
  return {
    ok,
    peso_kg,
    capacidade_kg: capacidade,
    severidade,
    quantidade_recomendada: recomendada,
    mensagem: ok
      ? `${num_dobradicas} dobradiças suportam ${peso_kg}kg (capacidade ${capacidade}kg).`
      : `Porta de ${peso_kg}kg / ${Math.round(altura_mm / 10)}cm: use ${recomendada} dobradiças (atual ${num_dobradicas}, capacidade ${capacidade}kg).`,
  };
}

/** Valida a carga de uma gaveta contra a corrediça escolhida. */
export function validarCorredica(
  carga_kg: number,
  linha: keyof typeof CARGA_CORREDICA_KG.valor = "padrao",
): VeredictoCarga {
  const capacidade = CARGA_CORREDICA_KG.valor[linha];
  const ok = capacidade >= carga_kg;
  return {
    ok,
    peso_kg: carga_kg,
    capacidade_kg: capacidade,
    severidade: ok ? "ok" : carga_kg > CARGA_CORREDICA_KG.valor.reforcada ? "critico" : "atencao",
    mensagem: ok
      ? `Corrediça ${linha} (${capacidade}kg/par) suporta a gaveta de ${carga_kg}kg.`
      : `Gaveta de ${carga_kg}kg excede a corrediça ${linha} (${capacidade}kg). Use linha reforçada.`,
  };
}
