/**
 * PLANNE — Motor Paramétrico
 * Fase 7: Escritório / Home Office
 *
 * gerarLayoutEscritorio: bancada de trabalho (escrivaninha) ao longo da parede
 * principal, com gaveteiro-bloco numa extremidade e estante aérea de prateleiras.
 */

import type {
  AmbienteGeometrico,
  ModuloInstanciado,
  ParedeId,
} from "./tipos";
import {
  MODULOS_ESCRIVANINHA,
  MODULOS_GAVETEIRO_ESC,
  MODULOS_ESTANTE_ESC,
  getTemplateEscrivaninha,
  getTemplateGaveteiroEsc,
  getTemplateEstanteEsc,
  ESCRIVANINHA_ALTURA_CM,
  ESCRIVANINHA_PROFUNDIDADE_CM,
  GAVETEIRO_ESC_ALTURA_CM,
  GAVETEIRO_ESC_PROFUNDIDADE_CM,
  ESTANTE_ESC_ALTURA_CM,
  ESTANTE_ESC_PROFUNDIDADE_CM,
  ESTANTE_ESC_INICIO_Y_CM,
} from "./biblioteca-escritorio";
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

const LARGURAS_BANCADA = [160, 140, 120, 100, 80] as const;
const LARGURAS_ESTANTE = [90, 80, 70, 60, 50] as const;
const GAVETEIRO_LARGURA_CM = 45;

export interface PreferenciasEscritorio extends PreferenciasBase {
  parede_principal?: ParedeId;
  /** Inclui estante aérea de prateleiras? (default true) */
  com_superior?: boolean;
  /** Inclui gaveteiro-bloco? (default true) */
  com_gaveteiro?: boolean;
}

export function gerarLayoutEscritorio(
  ambiente: AmbienteGeometrico,
  prefs: PreferenciasEscritorio,
): ResultadoLayoutBase {
  const avisos: string[] = [];
  const parede = prefs.parede_principal ?? paredesPorComprimento(ambiente)[0];
  const seg = maiorSegmento(ambiente, parede);
  const comp = ambiente.paredes[parede].comprimento_cm;
  const inicio = seg?.inicio_cm ?? 0;
  const disponivel = seg?.comprimento_cm ?? comp;

  const materialCorpo = criarMaterialPadrao(prefs.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(prefs.cor_mdf_hex, 6);

  let modulos: ModuloInstanciado[] = [];
  let cursor = inicio;
  let restante = disponivel;

  // Gaveteiro-bloco numa extremidade
  const incluiGaveteiro = prefs.com_gaveteiro !== false && restante >= GAVETEIRO_LARGURA_CM + 80;
  if (incluiGaveteiro) {
    const gaveteiros = instanciarModulos([GAVETEIRO_LARGURA_CM], {
      parede,
      inicio_cm: cursor,
      posicao_y_cm: 0,
      altura_cm: GAVETEIRO_ESC_ALTURA_CM,
      profundidade_cm: GAVETEIRO_ESC_PROFUNDIDADE_CM,
      prefixo: "gaveteiro_esc",
      materialCorpo,
      materialFundo,
      getTemplate: getTemplateGaveteiroEsc,
      templateFallback: MODULOS_GAVETEIRO_ESC[1],
      configDe: () => configPadrao({
        ferragem: prefs.ferragem,
        num_portas: 0,
        num_gavetas: 4,
        num_prateleiras: 0,
      }),
    });
    modulos = [...modulos, ...gaveteiros];
    cursor += GAVETEIRO_LARGURA_CM;
    restante -= GAVETEIRO_LARGURA_CM;
  }

  // Bancada de trabalho (escrivaninha) no restante da parede
  const largurasBancada = encaixarLarguras(restante, LARGURAS_BANCADA, 120, 80);
  const bancadas = instanciarModulos(largurasBancada, {
    parede,
    inicio_cm: cursor,
    posicao_y_cm: 0,
    altura_cm: ESCRIVANINHA_ALTURA_CM,
    profundidade_cm: ESCRIVANINHA_PROFUNDIDADE_CM,
    prefixo: "escrivaninha",
    materialCorpo,
    materialFundo,
    getTemplate: getTemplateEscrivaninha,
    templateFallback: MODULOS_ESCRIVANINHA[1],
    configDe: (largura) => configPadrao({
      ferragem: prefs.ferragem,
      num_portas: 0,
      num_gavetas: largura >= 100 ? 2 : 1,
      num_prateleiras: 0,
    }),
    ordemInicial: modulos.length,
  });
  modulos = [...modulos, ...bancadas];

  // Estante aérea de prateleiras (ao longo da parede)
  if (prefs.com_superior !== false) {
    const largurasEstante = encaixarLarguras(disponivel, LARGURAS_ESTANTE, 80, 50);
    const estantes = instanciarModulos(largurasEstante, {
      parede,
      inicio_cm: inicio,
      posicao_y_cm: ESTANTE_ESC_INICIO_Y_CM,
      altura_cm: ESTANTE_ESC_ALTURA_CM,
      profundidade_cm: ESTANTE_ESC_PROFUNDIDADE_CM,
      prefixo: "estante_esc",
      materialCorpo,
      materialFundo,
      getTemplate: getTemplateEstanteEsc,
      templateFallback: MODULOS_ESTANTE_ESC[2],
      configDe: (largura) => configPadrao({
        ferragem: prefs.ferragem,
        num_portas: largura >= 80 ? 2 : 0,
        num_prateleiras: 3,
        tem_pes_regulaveis: false,
      }),
      ordemInicial: modulos.length,
    });
    modulos = [...modulos, ...estantes];
  }

  if (modulos.length === 0) avisos.push("Escritório sem espaço para bancada. Verifique as dimensões.");

  return montarProjeto({
    ambiente,
    modulos,
    paredes_usadas: [parede],
    tipo_ambiente: "Escritório",
    preferencias: prefs,
    avisos,
    observacoes_extra: [
      `Bancada de trabalho na parede ${parede}`,
      incluiGaveteiro ? "Gaveteiro-bloco de 4 gavetas" : "Sem gaveteiro",
      prefs.com_superior !== false ? "Estante de prateleiras a 120cm do piso" : "Sem estante aérea",
    ],
    nome_padrao: `Escritório — Home Office ${disponivel}cm`,
  });
}
