/**
 * PLANNE — Motor Paramétrico
 * Fase 6: Banheiro e Lavanderia
 *
 * - gerarLayoutBanheiro: gabinete de pia + espelheira acima, na parede da pia.
 * - gerarLayoutLavanderia: gabinete de tanque + armários de serviço acima.
 *
 * Ambos respeitam pontos hidráulicos: se houver, a parede da pia/tanque é
 * escolhida pela presença do ponto de água.
 */

import type {
  AmbienteGeometrico,
  ModuloInstanciado,
  ParedeId,
} from "./tipos";
import {
  MODULOS_GABINETE_PIA,
  MODULOS_ESPELHEIRA,
  MODULOS_GABINETE_TANQUE,
  MODULOS_ARMARIO_SERVICO,
  getTemplateGabinetePia,
  getTemplateEspelheira,
  getTemplateGabineteTanque,
  getTemplateArmarioServico,
  GAB_PIA_ALTURA_CM,
  GAB_PIA_PROFUNDIDADE_CM,
  ESPELHEIRA_ALTURA_CM,
  ESPELHEIRA_PROFUNDIDADE_CM,
  GAB_TANQUE_ALTURA_CM,
  GAB_TANQUE_PROFUNDIDADE_CM,
  ARMARIO_SERVICO_ALTURA_CM,
  ARMARIO_SERVICO_PROFUNDIDADE_CM,
} from "./biblioteca-servicos";
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

const ESPELHEIRA_INICIO_Y_CM = 120;
const ARMARIO_SERVICO_INICIO_Y_CM = 150;
const LARGURAS_SERVICO = [80, 70, 60, 50, 40] as const;

export interface PreferenciasServico extends PreferenciasBase {
  parede_principal?: ParedeId;
  /** Inclui espelheira/armário superior? (default true) */
  com_superior?: boolean;
}

// ─── Escolha de parede (prioriza ponto hidráulico) ────────────────────────────

function escolherParedeMolhada(
  ambiente: AmbienteGeometrico,
  preferida: ParedeId | undefined,
  avisos: string[],
): ParedeId {
  if (preferida) return preferida;

  // Parede com ponto hidráulico que requer módulo adjacente
  const ph = ambiente.pontos_hidraulicos.find((p) => p.parede && p.requer_modulo_adjacente);
  if (ph?.parede) return ph.parede;

  if (ambiente.pontos_hidraulicos.length > 0) {
    avisos.push("Ponto hidráulico sem parede definida — usando a parede mais longa.");
  }
  return paredesPorComprimento(ambiente)[0];
}

// ─── BANHEIRO ─────────────────────────────────────────────────────────────────

export function gerarLayoutBanheiro(
  ambiente: AmbienteGeometrico,
  prefs: PreferenciasServico,
): ResultadoLayoutBase {
  const avisos: string[] = [];
  const parede = escolherParedeMolhada(ambiente, prefs.parede_principal, avisos);
  const seg = maiorSegmento(ambiente, parede);
  const comp = ambiente.paredes[parede].comprimento_cm;
  const inicio = seg?.inicio_cm ?? 0;
  const disponivel = seg?.comprimento_cm ?? comp;

  const materialCorpo = criarMaterialPadrao(prefs.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(prefs.cor_mdf_hex, 6);

  // Gabinete de pia (geralmente 1 módulo, mas pode haver mais largura)
  const larguras = encaixarLarguras(Math.min(disponivel, 120), LARGURAS_SERVICO, 60, 40);

  const gabinetes = instanciarModulos(larguras, {
    parede,
    inicio_cm: inicio,
    posicao_y_cm: 0,
    altura_cm: GAB_PIA_ALTURA_CM,
    profundidade_cm: GAB_PIA_PROFUNDIDADE_CM,
    prefixo: "gab_pia",
    materialCorpo,
    materialFundo,
    getTemplate: getTemplateGabinetePia,
    templateFallback: MODULOS_GABINETE_PIA[2],
    configDe: (largura) => configPadrao({
      ferragem: prefs.ferragem,
      num_portas: largura <= 50 ? 1 : 2,
      tem_fundo: false,
    }),
  });

  let modulos: ModuloInstanciado[] = [...gabinetes];

  // Espelheira acima (alinhada com o gabinete)
  if (prefs.com_superior !== false) {
    const espelheiras = instanciarModulos(larguras, {
      parede,
      inicio_cm: inicio,
      posicao_y_cm: ESPELHEIRA_INICIO_Y_CM,
      altura_cm: ESPELHEIRA_ALTURA_CM,
      profundidade_cm: ESPELHEIRA_PROFUNDIDADE_CM,
      prefixo: "espelheira",
      materialCorpo,
      materialFundo,
      getTemplate: getTemplateEspelheira,
      templateFallback: MODULOS_ESPELHEIRA[2],
      configDe: (largura) => configPadrao({
        tipo_porta: "espelho",
        ferragem: prefs.ferragem,
        num_portas: largura <= 50 ? 1 : 2,
        num_prateleiras: 2,
        tem_pes_regulaveis: false,
        tem_espelho_interno: true,
        espessura_porta_mm: 18,
      }),
      ordemInicial: gabinetes.length,
    });
    modulos = [...gabinetes, ...espelheiras];
  }

  if (modulos.length === 0) avisos.push("Banheiro sem espaço para gabinete. Verifique as dimensões.");

  return montarProjeto({
    ambiente,
    modulos,
    paredes_usadas: [parede],
    tipo_ambiente: "Banheiro",
    preferencias: prefs,
    avisos,
    observacoes_extra: [
      `Gabinete de pia na parede ${parede}`,
      prefs.com_superior !== false ? "Espelheira a 120cm do piso" : "Sem espelheira",
    ],
    nome_padrao: `Banheiro — Gabinete ${larguras.reduce((s, l) => s + l, 0)}cm`,
  });
}

// ─── LAVANDERIA ───────────────────────────────────────────────────────────────

export function gerarLayoutLavanderia(
  ambiente: AmbienteGeometrico,
  prefs: PreferenciasServico,
): ResultadoLayoutBase {
  const avisos: string[] = [];
  const parede = escolherParedeMolhada(ambiente, prefs.parede_principal, avisos);
  const seg = maiorSegmento(ambiente, parede);
  const comp = ambiente.paredes[parede].comprimento_cm;
  const inicio = seg?.inicio_cm ?? 0;
  const disponivel = seg?.comprimento_cm ?? comp;

  const materialCorpo = criarMaterialPadrao(prefs.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(prefs.cor_mdf_hex, 6);

  // Gabinete de tanque (1 módulo) + bases de apoio
  const larguras = encaixarLarguras(disponivel, LARGURAS_SERVICO, 60, 40);

  // Primeiro módulo é o gabinete de tanque; demais são bases de apoio (também tanque template)
  const gabinetes = instanciarModulos(larguras, {
    parede,
    inicio_cm: inicio,
    posicao_y_cm: 0,
    altura_cm: GAB_TANQUE_ALTURA_CM,
    profundidade_cm: GAB_TANQUE_PROFUNDIDADE_CM,
    prefixo: "gab_tanque",
    materialCorpo,
    materialFundo,
    getTemplate: getTemplateGabineteTanque,
    templateFallback: MODULOS_GABINETE_TANQUE[2],
    configDe: (largura) => configPadrao({
      ferragem: prefs.ferragem,
      num_portas: largura <= 50 ? 1 : 2,
      tem_fundo: false,
    }),
  });

  let modulos: ModuloInstanciado[] = [...gabinetes];

  // Armários de serviço acima
  if (prefs.com_superior !== false) {
    const armarios = instanciarModulos(larguras, {
      parede,
      inicio_cm: inicio,
      posicao_y_cm: ARMARIO_SERVICO_INICIO_Y_CM,
      altura_cm: ARMARIO_SERVICO_ALTURA_CM,
      profundidade_cm: ARMARIO_SERVICO_PROFUNDIDADE_CM,
      prefixo: "armario_servico",
      materialCorpo,
      materialFundo,
      getTemplate: getTemplateArmarioServico,
      templateFallback: MODULOS_ARMARIO_SERVICO[2],
      configDe: (largura) => configPadrao({
        ferragem: prefs.ferragem,
        num_portas: largura <= 50 ? 1 : 2,
        num_prateleiras: 2,
        tem_pes_regulaveis: false,
      }),
      ordemInicial: gabinetes.length,
    });
    modulos = [...gabinetes, ...armarios];
  }

  if (modulos.length === 0) avisos.push("Lavanderia sem espaço para gabinete. Verifique as dimensões.");

  return montarProjeto({
    ambiente,
    modulos,
    paredes_usadas: [parede],
    tipo_ambiente: "Lavanderia",
    preferencias: prefs,
    avisos,
    observacoes_extra: [
      `Gabinete de tanque + apoio na parede ${parede}`,
      prefs.com_superior !== false ? "Armários de serviço a 150cm do piso" : "Sem armários superiores",
    ],
    nome_padrao: `Lavanderia — ${larguras.reduce((s, l) => s + l, 0)}cm`,
  });
}
