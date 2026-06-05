/**
 * PLANNE — Motor Paramétrico
 * Fase 6: Cozinha em L e em U
 *
 * Estende a cozinha linear para múltiplas paredes com tratamento de canto.
 *
 * Tratamento de canto (recuo simples):
 *   Quando duas paredes perpendiculares recebem gabinetes, o canto onde elas
 *   se encontram seria ocupado por ambos. Para evitar colisão, a parede
 *   secundária tem seu início recuado pela PROFUNDIDADE do gabinete da parede
 *   primária (55cm). O canto fica acessível e os gabinetes não se sobrepõem.
 *
 *   Vista de cima (L, primária=top, secundária=left):
 *
 *     ┌─[55]─┬──────────────────┐  ← parede top (primária): x=0..comp
 *     │ canto│   gabinetes top   │
 *     ├──────┘                   │
 *     │ g                        │
 *     │ a   (recuo de 55cm no    │
 *     │ b    início da left)     │
 *     │ left                     │
 *     └──────────────────────────┘
 */

import type {
  AmbienteGeometrico,
  ModuloInstanciado,
  ConfiguracaoModulo,
  ParedeId,
} from "./tipos";
import {
  MODULOS_BASE_COZINHA,
  MODULOS_AEREOS_COZINHA,
  getTemplateBase,
  getTemplateAereo,
  BASE_ALTURA_CM,
  BASE_PROFUNDIDADE_CM,
  AEREO_ALTURA_CM,
  AEREO_PROFUNDIDADE_CM,
} from "./biblioteca-cozinha";
import {
  criarMaterialPadrao,
  configPadrao,
  encaixarLarguras,
  instanciarModulos,
  maiorSegmento,
  montarProjeto,
  paredesPorComprimento,
  saoAdjacentes,
  PAREDE_OPOSTA,
  type PreferenciasBase,
  type ResultadoLayoutBase,
} from "./layout-shared";

const AEREO_INICIO_Y_CM = 150;

// ─── PREFERÊNCIAS ─────────────────────────────────────────────────────────────

export interface PreferenciasCozinhaMP extends PreferenciasBase {
  tipo_porta_base: "dobradica" | "correr";
  tipo_porta_aereo: "dobradica" | "basculante";
  /** Paredes a usar. Se omitido, escolhe automaticamente as mais longas. */
  paredes?: ParedeId[];
  /** Inclui módulos aéreos? (default true) */
  com_aereos?: boolean;
}

// ─── HELPERS DE PAREDE/CANTO ──────────────────────────────────────────────────

/** Comprimento físico de uma parede do ambiente. */
function comprimentoParede(ambiente: AmbienteGeometrico, parede: ParedeId): number {
  return ambiente.paredes[parede].comprimento_cm;
}

/**
 * Instancia bases + aéreos numa parede, a partir de um início recuado.
 * Retorna os módulos e o linear ocupado.
 */
function montarParede(
  ambiente: AmbienteGeometrico,
  parede: ParedeId,
  inicioRecuo_cm: number,
  prefs: PreferenciasCozinhaMP,
  ordemInicial: number,
  avisos: string[],
): { modulos: ModuloInstanciado[]; ocupado_cm: number } {
  const seg = maiorSegmento(ambiente, parede);
  const comp = comprimentoParede(ambiente, parede);

  const inicio = Math.max(inicioRecuo_cm, seg?.inicio_cm ?? 0);
  const fim = seg ? seg.fim_cm : comp;
  const disponivel = Math.max(0, fim - inicio);

  if (disponivel < 30) {
    avisos.push(`Parede ${parede}: apenas ${Math.round(disponivel)}cm úteis após recuo de canto — sem gabinetes.`);
    return { modulos: [], ocupado_cm: 0 };
  }

  const larguras = encaixarLarguras(disponivel);
  const materialCorpo = criarMaterialPadrao(prefs.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(prefs.cor_mdf_hex, 6);

  const bases = instanciarModulos(larguras, {
    parede,
    inicio_cm: inicio,
    posicao_y_cm: 0,
    altura_cm: BASE_ALTURA_CM,
    profundidade_cm: BASE_PROFUNDIDADE_CM,
    prefixo: "base",
    materialCorpo,
    materialFundo,
    getTemplate: getTemplateBase,
    templateFallback: MODULOS_BASE_COZINHA[4],
    configDe: (largura) => configPadrao({
      tipo_porta: prefs.tipo_porta_base,
      ferragem: prefs.ferragem,
      num_portas: largura <= 40 ? 1 : 2,
    }),
    ordemInicial,
  });

  let modulos = bases;

  if (prefs.com_aereos !== false) {
    const aereos = instanciarModulos(larguras, {
      parede,
      inicio_cm: inicio,
      posicao_y_cm: AEREO_INICIO_Y_CM,
      altura_cm: AEREO_ALTURA_CM,
      profundidade_cm: AEREO_PROFUNDIDADE_CM,
      prefixo: "aereo",
      materialCorpo,
      materialFundo,
      getTemplate: getTemplateAereo,
      templateFallback: MODULOS_AEREOS_COZINHA[4],
      configDe: (largura) => configPadrao({
        tipo_porta: prefs.tipo_porta_aereo as ConfiguracaoModulo["tipo_porta"],
        ferragem: prefs.ferragem,
        num_portas: largura <= 40 ? 1 : 2,
        tem_pes_regulaveis: false,
      }),
      ordemInicial: ordemInicial + bases.length,
    });
    modulos = [...bases, ...aereos];
  }

  const ocupado = larguras.reduce((s, l) => s + l, 0);
  return { modulos, ocupado_cm: ocupado };
}

// ─── COZINHA EM L ─────────────────────────────────────────────────────────────

/**
 * Gera uma cozinha em L: duas paredes perpendiculares.
 * A primeira (mais longa) recebe gabinetes do início ao fim;
 * a segunda recua 55cm no canto para não colidir com a primeira.
 */
export function gerarLayoutCozinhaL(
  ambiente: AmbienteGeometrico,
  prefs: PreferenciasCozinhaMP,
): ResultadoLayoutBase {
  const avisos: string[] = [];

  // Selecionar duas paredes perpendiculares
  let [pA, pB] = selecionarParedesL(ambiente, prefs.paredes, avisos);

  // Parede primária: a mais longa das duas
  if (comprimentoParede(ambiente, pB) > comprimentoParede(ambiente, pA)) {
    [pA, pB] = [pB, pA];
  }

  // Parede primária: sem recuo
  const ladoA = montarParede(ambiente, pA, 0, prefs, 0, avisos);

  // Parede secundária: recuo de 55cm (profundidade do gabinete da primária) no canto
  const ladoB = montarParede(ambiente, pB, BASE_PROFUNDIDADE_CM, prefs, ladoA.modulos.length, avisos);

  const modulos = [...ladoA.modulos, ...ladoB.modulos];

  if (modulos.length === 0) {
    avisos.push("Nenhum módulo pôde ser posicionado. Verifique as dimensões do ambiente.");
  }

  return montarProjeto({
    ambiente,
    modulos,
    paredes_usadas: [pA, pB],
    tipo_ambiente: "Cozinha em L",
    preferencias: prefs,
    avisos,
    observacoes_extra: [
      `Parede ${pA}: ${ladoA.ocupado_cm}cm · Parede ${pB}: ${ladoB.ocupado_cm}cm (recuo de canto ${BASE_PROFUNDIDADE_CM}cm)`,
    ],
    nome_padrao: `Cozinha em L — ${pA}+${pB}`,
  });
}

// ─── COZINHA EM U ─────────────────────────────────────────────────────────────

/**
 * Gera uma cozinha em U: três paredes (uma central + duas laterais opostas).
 * As duas laterais recuam 55cm no canto que toca a parede central.
 */
export function gerarLayoutCozinhaU(
  ambiente: AmbienteGeometrico,
  prefs: PreferenciasCozinhaMP,
): ResultadoLayoutBase {
  const avisos: string[] = [];

  const { central, laterais } = selecionarParedesU(ambiente, prefs.paredes, avisos);

  // Parede central: sem recuo
  const ladoCentral = montarParede(ambiente, central, 0, prefs, 0, avisos);
  let ordem = ladoCentral.modulos.length;

  // Duas laterais: recuo de 55cm no canto que encosta na central
  const ladosLaterais = laterais.map((lat) => {
    const r = montarParede(ambiente, lat, BASE_PROFUNDIDADE_CM, prefs, ordem, avisos);
    ordem += r.modulos.length;
    return r;
  });

  const modulos = [
    ...ladoCentral.modulos,
    ...ladosLaterais.flatMap((l) => l.modulos),
  ];

  if (modulos.length === 0) {
    avisos.push("Nenhum módulo pôde ser posicionado. Verifique as dimensões do ambiente.");
  }

  const paredesUsadas = [central, ...laterais];

  return montarProjeto({
    ambiente,
    modulos,
    paredes_usadas: paredesUsadas,
    tipo_ambiente: "Cozinha em U",
    preferencias: prefs,
    avisos,
    observacoes_extra: [
      `Central ${central}: ${ladoCentral.ocupado_cm}cm · ` +
      laterais.map((l, i) => `${l}: ${ladosLaterais[i].ocupado_cm}cm`).join(" · ") +
      ` (recuo de canto ${BASE_PROFUNDIDADE_CM}cm)`,
    ],
    nome_padrao: `Cozinha em U — ${paredesUsadas.join("+")}`,
  });
}

// ─── SELEÇÃO DE PAREDES ───────────────────────────────────────────────────────

/** Seleciona duas paredes perpendiculares para o L. */
function selecionarParedesL(
  ambiente: AmbienteGeometrico,
  preferidas: ParedeId[] | undefined,
  avisos: string[],
): [ParedeId, ParedeId] {
  if (preferidas && preferidas.length >= 2 && saoAdjacentes(preferidas[0], preferidas[1])) {
    return [preferidas[0], preferidas[1]];
  }
  if (preferidas && preferidas.length >= 2) {
    avisos.push(`Paredes ${preferidas[0]}+${preferidas[1]} não formam um L (não são perpendiculares). Escolhendo automaticamente.`);
  }

  // Maior parede + maior adjacente a ela
  const ordenadas = paredesPorComprimento(ambiente);
  const primaria = ordenadas[0];
  const secundaria = ordenadas.find((p) => saoAdjacentes(p, primaria)) ?? "left";
  return [primaria, secundaria];
}

/** Seleciona uma parede central + duas laterais perpendiculares opostas para o U. */
function selecionarParedesU(
  ambiente: AmbienteGeometrico,
  preferidas: ParedeId[] | undefined,
  avisos: string[],
): { central: ParedeId; laterais: [ParedeId, ParedeId] } {
  if (preferidas && preferidas.length >= 3) {
    const [c, l1, l2] = preferidas;
    if (saoAdjacentes(c, l1) && saoAdjacentes(c, l2) && PAREDE_OPOSTA[l1] === l2) {
      return { central: c, laterais: [l1, l2] };
    }
    avisos.push(`Paredes ${preferidas.join("+")} não formam um U válido. Escolhendo automaticamente.`);
  }

  // Central = maior parede; laterais = suas duas adjacentes (que são opostas entre si)
  const ordenadas = paredesPorComprimento(ambiente);
  const central = ordenadas[0];
  const laterais = ordenadas.filter((p) => saoAdjacentes(p, central));
  const l1 = laterais[0] ?? "left";
  const l2 = PAREDE_OPOSTA[l1];
  return { central, laterais: [l1, l2] };
}
