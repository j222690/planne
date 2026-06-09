/**
 * PLANNE — Motor Paramétrico
 * Fase 7: Sala de estar / home theater
 *
 * gerarLayoutSala: rack de TV na base ao longo da parede principal, painel
 * ripado decorativo central atrás da TV e estante de nichos aérea.
 *
 * A parede principal é a da TV (mais longa por padrão, ou a indicada).
 */

import type {
  AmbienteGeometrico,
  ModuloInstanciado,
  ParedeId,
} from "./tipos";
import {
  MODULOS_RACK_TV,
  MODULOS_PAINEL_RIPADO,
  MODULOS_NICHO_SALA,
  getTemplateRackTv,
  getTemplatePainelRipado,
  getTemplateNichoSala,
  RACK_TV_ALTURA_CM,
  RACK_TV_PROFUNDIDADE_CM,
  PAINEL_RIPADO_ALTURA_CM,
  PAINEL_RIPADO_PROFUNDIDADE_CM,
  PAINEL_RIPADO_INICIO_Y_CM,
  NICHO_SALA_ALTURA_CM,
  NICHO_SALA_PROFUNDIDADE_CM,
  NICHO_SALA_INICIO_Y_CM,
} from "./biblioteca-sala";
import {
  criarMaterialPadrao,
  configPadrao,
  encaixarLarguras,
  instanciarModulos,
  montarProjeto,
  maiorSegmento,
  paredesPorComprimento,
  type PreferenciasBase,
  type ResultadoLayoutBase,
} from "./layout-shared";

const LARGURAS_RACK = [90, 80, 70, 60, 50] as const;
const LARGURAS_NICHO = [90, 80, 70, 60, 50] as const;
const LARGURAS_PAINEL = [180, 160, 140, 120, 100] as const;

export interface PreferenciasSala extends PreferenciasBase {
  parede_principal?: ParedeId;
  /** Inclui estante de nichos aérea? (default true) */
  com_superior?: boolean;
  /** Inclui painel ripado decorativo atrás da TV? (default true) */
  com_painel?: boolean;
}

export function gerarLayoutSala(
  ambiente: AmbienteGeometrico,
  prefs: PreferenciasSala,
): ResultadoLayoutBase {
  const avisos: string[] = [];
  const parede = prefs.parede_principal ?? paredesPorComprimento(ambiente)[0];
  const seg = maiorSegmento(ambiente, parede);
  const comp = ambiente.paredes[parede].comprimento_cm;
  const inicio = seg?.inicio_cm ?? 0;
  const disponivel = seg?.comprimento_cm ?? comp;

  const materialCorpo = criarMaterialPadrao(prefs.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(prefs.cor_mdf_hex, 6);

  // Rack de TV na base, ao longo da parede
  const largurasRack = encaixarLarguras(disponivel, LARGURAS_RACK, 80, 50);
  const racks = instanciarModulos(largurasRack, {
    parede,
    inicio_cm: inicio,
    posicao_y_cm: 0,
    altura_cm: RACK_TV_ALTURA_CM,
    profundidade_cm: RACK_TV_PROFUNDIDADE_CM,
    prefixo: "rack_tv",
    materialCorpo,
    materialFundo,
    getTemplate: getTemplateRackTv,
    templateFallback: MODULOS_RACK_TV[1],
    configDe: (largura) => configPadrao({
      ferragem: prefs.ferragem,
      num_portas: largura <= 50 ? 1 : 2,
      num_gavetas: largura >= 80 ? 2 : 1,
      num_prateleiras: 1,
    }),
  });

  let modulos: ModuloInstanciado[] = [...racks];

  // Painel ripado decorativo central (atrás da TV)
  if (prefs.com_painel !== false && disponivel >= 100) {
    const largPainel = Math.min(disponivel, LARGURAS_PAINEL.find((l) => l <= disponivel) ?? 100);
    const inicioPainel = inicio + Math.max(0, (disponivel - largPainel) / 2);
    const painel = instanciarModulos([largPainel], {
      parede,
      inicio_cm: inicioPainel,
      posicao_y_cm: PAINEL_RIPADO_INICIO_Y_CM,
      altura_cm: PAINEL_RIPADO_ALTURA_CM,
      profundidade_cm: PAINEL_RIPADO_PROFUNDIDADE_CM,
      prefixo: "painel_ripado",
      materialCorpo,
      materialFundo,
      getTemplate: getTemplatePainelRipado,
      templateFallback: MODULOS_PAINEL_RIPADO[1],
      configDe: () => configPadrao({
        ferragem: prefs.ferragem,
        num_portas: 0,
        num_prateleiras: 0,
        tem_fundo: false,
        tem_pes_regulaveis: false,
        tem_ripado: true,
      }),
      ordemInicial: modulos.length,
    });
    modulos = [...modulos, ...painel];
  }

  // Estante de nichos aérea
  if (prefs.com_superior !== false) {
    const largurasNicho = encaixarLarguras(disponivel, LARGURAS_NICHO, 70, 50);
    const nichos = instanciarModulos(largurasNicho, {
      parede,
      inicio_cm: inicio,
      posicao_y_cm: NICHO_SALA_INICIO_Y_CM,
      altura_cm: NICHO_SALA_ALTURA_CM,
      profundidade_cm: NICHO_SALA_PROFUNDIDADE_CM,
      prefixo: "nicho_sala",
      materialCorpo,
      materialFundo,
      getTemplate: getTemplateNichoSala,
      templateFallback: MODULOS_NICHO_SALA[1],
      configDe: (largura) => configPadrao({
        ferragem: prefs.ferragem,
        num_portas: 0,
        num_prateleiras: 2,
        num_divisorias: largura >= 80 ? 1 : 0,
        tem_pes_regulaveis: false,
      }),
      ordemInicial: modulos.length,
    });
    modulos = [...modulos, ...nichos];
  }

  if (modulos.length === 0) avisos.push("Sala sem espaço para rack. Verifique as dimensões.");

  return montarProjeto({
    ambiente,
    modulos,
    paredes_usadas: [parede],
    tipo_ambiente: "Sala",
    preferencias: prefs,
    avisos,
    observacoes_extra: [
      `Rack de TV na parede ${parede}`,
      prefs.com_painel !== false ? "Painel ripado decorativo atrás da TV" : "Sem painel ripado",
      prefs.com_superior !== false ? "Estante de nichos a 175cm do piso" : "Sem estante aérea",
    ],
    nome_padrao: `Sala — Home ${largurasRack.reduce((s, l) => s + l, 0)}cm`,
  });
}
