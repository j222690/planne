/**
 * PLANNE — Motor Paramétrico
 * Fase 6: Dormitório e Closet
 *
 * - gerarLayoutDormitorio: parede de roupeiros (o resto do quarto é a cama).
 * - gerarLayoutCloset: closet em L com mix funcional (roupeiros + cabideiro +
 *   gaveteiro + sapateira), aproveitando duas paredes.
 */

import type {
  AmbienteGeometrico,
  ModuloInstanciado,
  ParedeId,
  ModuloParametrico,
} from "./tipos";
import {
  MODULOS_ROUPEIRO,
  getTemplateRoupeiro,
  getTemplateGaveteiro,
  getTemplateCabideiro,
  getTemplateSapateira,
  ROUPEIRO_ALTURA_CM,
  ROUPEIRO_PROFUNDIDADE_CM,
} from "./biblioteca-quarto";
import {
  criarMaterialPadrao,
  configPadrao,
  encaixarLarguras,
  instanciarModulos,
  montarProjeto,
  maiorSegmento,
  paredesPorComprimento,
  saoAdjacentes,
  type PreferenciasBase,
  type ResultadoLayoutBase,
} from "./layout-shared";

// Larguras de módulo de quarto (mais largas que cozinha).
const LARGURAS_QUARTO = [100, 90, 80, 70, 60, 50] as const;

export interface PreferenciasQuarto extends PreferenciasBase {
  tipo_porta?: "dobradica" | "correr" | "espelho";
  /** Paredes a usar. Se omitido, escolhe automaticamente. */
  paredes?: ParedeId[];
}

// ─── HELPER: instanciar roupeiros numa parede ─────────────────────────────────

function montarParedeRoupeiros(
  ambiente: AmbienteGeometrico,
  parede: ParedeId,
  inicioRecuo_cm: number,
  prefs: PreferenciasQuarto,
  ordemInicial: number,
  avisos: string[],
): { modulos: ModuloInstanciado[]; ocupado_cm: number } {
  const seg = maiorSegmento(ambiente, parede);
  const comp = ambiente.paredes[parede].comprimento_cm;
  const inicio = Math.max(inicioRecuo_cm, seg?.inicio_cm ?? 0);
  const fim = seg ? seg.fim_cm : comp;
  const disponivel = Math.max(0, fim - inicio);

  if (disponivel < 50) {
    avisos.push(`Parede ${parede}: ${Math.round(disponivel)}cm úteis — insuficiente para roupeiro.`);
    return { modulos: [], ocupado_cm: 0 };
  }

  const larguras = encaixarLarguras(disponivel, LARGURAS_QUARTO, 80, 50);
  const materialCorpo = criarMaterialPadrao(prefs.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(prefs.cor_mdf_hex, 6);

  const modulos = instanciarModulos(larguras, {
    parede,
    inicio_cm: inicio,
    posicao_y_cm: 0,
    altura_cm: ROUPEIRO_ALTURA_CM,
    profundidade_cm: ROUPEIRO_PROFUNDIDADE_CM,
    prefixo: "roupeiro",
    materialCorpo,
    materialFundo,
    getTemplate: getTemplateRoupeiro,
    templateFallback: MODULOS_ROUPEIRO[3],
    configDe: (largura) => configPadrao({
      tipo_porta: prefs.tipo_porta ?? "dobradica",
      ferragem: prefs.ferragem,
      num_portas: largura <= 50 ? 1 : 2,
      num_prateleiras: 3,
      num_divisorias: 1,
      tem_cabideiro: true,
      espessura_porta_mm: (prefs.tipo_porta === "correr" || prefs.tipo_porta === "espelho") ? 18 : 15,
    }),
    ordemInicial,
  });

  const ocupado = larguras.reduce((s, l) => s + l, 0);
  return { modulos, ocupado_cm: ocupado };
}

// ─── DORMITÓRIO ───────────────────────────────────────────────────────────────

/**
 * Dormitório: roupeiro ao longo da parede mais longa disponível.
 */
export function gerarLayoutDormitorio(
  ambiente: AmbienteGeometrico,
  prefs: PreferenciasQuarto,
): ResultadoLayoutBase {
  const avisos: string[] = [];

  const parede = prefs.paredes?.[0]
    ?? paredesPorComprimento(ambiente)[0];

  const { modulos, ocupado_cm } = montarParedeRoupeiros(ambiente, parede, 0, prefs, 0, avisos);

  if (modulos.length === 0) {
    avisos.push("Nenhum roupeiro pôde ser posicionado. Verifique as dimensões do quarto.");
  }

  return montarProjeto({
    ambiente,
    modulos,
    paredes_usadas: [parede],
    tipo_ambiente: "Dormitório",
    preferencias: prefs,
    avisos,
    observacoes_extra: [
      `Roupeiro de ${ocupado_cm}cm na parede ${parede}`,
      `Altura ${ROUPEIRO_ALTURA_CM}cm · profundidade ${ROUPEIRO_PROFUNDIDADE_CM}cm`,
    ],
    nome_padrao: `Dormitório — Roupeiro ${ocupado_cm}cm`,
  });
}

// ─── CLOSET ───────────────────────────────────────────────────────────────────

/**
 * Closet em L: parede primária com roupeiros; parede secundária com mix
 * funcional (sapateira + cabideiro + gaveteiro), recuada 60cm no canto.
 */
export function gerarLayoutCloset(
  ambiente: AmbienteGeometrico,
  prefs: PreferenciasQuarto,
): ResultadoLayoutBase {
  const avisos: string[] = [];

  // Selecionar duas paredes perpendiculares
  let [pA, pB] = selecionarParedesL(ambiente, prefs.paredes, avisos);
  if (ambiente.paredes[pB].comprimento_cm > ambiente.paredes[pA].comprimento_cm) {
    [pA, pB] = [pB, pA];
  }

  // Primária: roupeiros
  const ladoA = montarParedeRoupeiros(ambiente, pA, 0, prefs, 0, avisos);

  // Secundária: mix funcional, recuo de 60cm (profundidade do roupeiro)
  const ladoB = montarMixCloset(ambiente, pB, ROUPEIRO_PROFUNDIDADE_CM, prefs, ladoA.modulos.length, avisos);

  const modulos = [...ladoA.modulos, ...ladoB.modulos];

  if (modulos.length === 0) {
    avisos.push("Nenhum módulo pôde ser posicionado no closet. Verifique as dimensões.");
  }

  return montarProjeto({
    ambiente,
    modulos,
    paredes_usadas: [pA, pB],
    tipo_ambiente: "Closet",
    preferencias: prefs,
    avisos,
    observacoes_extra: [
      `Parede ${pA}: roupeiros (${ladoA.ocupado_cm}cm) · Parede ${pB}: mix funcional (${ladoB.ocupado_cm}cm)`,
      `Recuo de canto: ${ROUPEIRO_PROFUNDIDADE_CM}cm`,
    ],
    nome_padrao: `Closet em L — ${pA}+${pB}`,
  });
}

/**
 * Monta a parede secundária do closet com mix: sapateira → cabideiros → gaveteiro.
 */
function montarMixCloset(
  ambiente: AmbienteGeometrico,
  parede: ParedeId,
  inicioRecuo_cm: number,
  prefs: PreferenciasQuarto,
  ordemInicial: number,
  avisos: string[],
): { modulos: ModuloInstanciado[]; ocupado_cm: number } {
  const seg = maiorSegmento(ambiente, parede);
  const comp = ambiente.paredes[parede].comprimento_cm;
  const inicio = Math.max(inicioRecuo_cm, seg?.inicio_cm ?? 0);
  const fim = seg ? seg.fim_cm : comp;
  const disponivel = Math.max(0, fim - inicio);

  if (disponivel < 50) {
    avisos.push(`Parede ${parede}: ${Math.round(disponivel)}cm — sem mix de closet.`);
    return { modulos: [], ocupado_cm: 0 };
  }

  const larguras = encaixarLarguras(disponivel, LARGURAS_QUARTO, 70, 50);
  const materialCorpo = criarMaterialPadrao(prefs.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(prefs.cor_mdf_hex, 6);

  // Distribuir tipos: 1º = sapateira, último = gaveteiro, meio = cabideiros
  const modulos: ModuloInstanciado[] = [];
  let posX = inicio;
  let ordem = ordemInicial;

  larguras.forEach((largura, i) => {
    let getTpl: (l: number) => ModuloParametrico | undefined;
    let prefixo: string;
    let alturaSel: number;
    let cfgExtra: Parameters<typeof configPadrao>[0];

    if (i === 0) {
      getTpl = getTemplateSapateira; prefixo = "sapateira"; alturaSel = 100;
      cfgExtra = { tipo_porta: "dobradica", num_portas: largura <= 50 ? 1 : 2, num_prateleiras: 4, tem_cabideiro: false };
    } else if (i === larguras.length - 1 && larguras.length > 1) {
      getTpl = getTemplateGaveteiro; prefixo = "gaveteiro"; alturaSel = 80;
      cfgExtra = { tipo_porta: "aberta", num_portas: 0, num_prateleiras: 0, num_gavetas: 4, tem_cabideiro: false };
    } else {
      getTpl = getTemplateCabideiro; prefixo = "cabideiro"; alturaSel = 130;
      cfgExtra = { tipo_porta: "aberta", num_portas: 0, num_prateleiras: 1, tem_cabideiro: true };
    }

    const tpl = getTpl(largura);
    const inst = instanciarModulos([largura], {
      parede,
      inicio_cm: posX,
      posicao_y_cm: 0,
      altura_cm: alturaSel,
      profundidade_cm: ROUPEIRO_PROFUNDIDADE_CM,
      prefixo,
      materialCorpo,
      materialFundo,
      getTemplate: getTpl,
      templateFallback: tpl ?? MODULOS_ROUPEIRO[3],
      configDe: () => configPadrao({ ferragem: prefs.ferragem, ...cfgExtra }),
      ordemInicial: ordem,
    });

    modulos.push(...inst);
    posX += largura;
    ordem += inst.length;
  });

  const ocupado = larguras.reduce((s, l) => s + l, 0);
  return { modulos, ocupado_cm: ocupado };
}

// ─── SELEÇÃO DE PAREDES ───────────────────────────────────────────────────────

function selecionarParedesL(
  ambiente: AmbienteGeometrico,
  preferidas: ParedeId[] | undefined,
  avisos: string[],
): [ParedeId, ParedeId] {
  if (preferidas && preferidas.length >= 2 && saoAdjacentes(preferidas[0], preferidas[1])) {
    return [preferidas[0], preferidas[1]];
  }
  if (preferidas && preferidas.length >= 2) {
    avisos.push(`Paredes ${preferidas[0]}+${preferidas[1]} não formam um L. Escolhendo automaticamente.`);
  }
  const ordenadas = paredesPorComprimento(ambiente);
  const primaria = ordenadas[0];
  const secundaria = ordenadas.find((p) => saoAdjacentes(p, primaria)) ?? "left";
  return [primaria, secundaria];
}
