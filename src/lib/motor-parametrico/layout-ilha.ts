/**
 * PLANNE — Motor Paramétrico
 * Fase 6: Ilha de Cozinha
 *
 * Uma ilha é um conjunto de gabinetes base independente, posicionado no centro
 * do ambiente (não encostado em parede). Requer circulação livre ao redor.
 *
 * Regra de circulação: a NBR e a ergonomia pedem ≥ 90cm livres de cada lado
 * entre a ilha e os móveis/paredes ao redor. O gerador valida o espaço e
 * dimensiona a ilha para caber com folga.
 *
 * Modelagem: como ParedeId não tem "central", a ilha usa "bottom" como
 * referência de eixo e posiciona-se via posicao_y_cm = centro da profundidade.
 * O nome e as observações deixam claro que é uma ilha.
 */

import type {
  AmbienteGeometrico,
  ModuloInstanciado,
} from "./tipos";
import {
  MODULOS_BASE_COZINHA,
  getTemplateBase,
  BASE_ALTURA_CM,
  BASE_PROFUNDIDADE_CM,
} from "./biblioteca-cozinha";
import {
  criarMaterialPadrao,
  configPadrao,
  encaixarLarguras,
  instanciarModulos,
  montarProjeto,
  type PreferenciasBase,
  type ResultadoLayoutBase,
} from "./layout-shared";

/** Circulação mínima ao redor da ilha (cm). */
export const CIRCULACAO_ILHA_MIN_CM = 90;

/** Profundidade padrão de uma ilha (cm) — pode ser dupla face. */
export const ILHA_PROFUNDIDADE_CM = 90;

/** Comprimento máximo recomendado de ilha (cm). */
const ILHA_COMPRIMENTO_MAX_CM = 280;

export interface PreferenciasIlha extends PreferenciasBase {
  tipo_porta_base?: "dobradica" | "correr";
  /** Comprimento desejado da ilha (cm). Se omitido, dimensiona pelo ambiente. */
  comprimento_desejado_cm?: number;
  /** Profundidade da ilha (cm). Default 90 (dupla face). */
  profundidade_cm?: number;
}

/**
 * Gera uma ilha central dimensionada para caber no ambiente com circulação.
 */
export function gerarLayoutIlha(
  ambiente: AmbienteGeometrico,
  prefs: PreferenciasIlha,
): ResultadoLayoutBase {
  const avisos: string[] = [];
  const { largura_cm, profundidade_cm } = ambiente.dimensoes;

  const profIlha = prefs.profundidade_cm ?? ILHA_PROFUNDIDADE_CM;

  // 1. Verificar se há espaço para a ilha + circulação em ambos os eixos.
  // Eixo X (largura): ilha + 2× circulação ≤ largura
  // Eixo Y (profundidade): ilha + 2× circulação ≤ profundidade
  const maxComprimentoPorLargura = largura_cm - 2 * CIRCULACAO_ILHA_MIN_CM;
  const espacoProfundidade = profundidade_cm - 2 * CIRCULACAO_ILHA_MIN_CM;

  if (espacoProfundidade < profIlha) {
    avisos.push(
      `Ambiente com ${profundidade_cm}cm de profundidade não comporta ilha de ${profIlha}cm ` +
      `com circulação de ${CIRCULACAO_ILHA_MIN_CM}cm em volta. Ilha não recomendada.`,
    );
  }

  // 2. Dimensionar comprimento da ilha
  let comprimentoIlha = prefs.comprimento_desejado_cm
    ?? Math.min(maxComprimentoPorLargura, ILHA_COMPRIMENTO_MAX_CM);
  comprimentoIlha = Math.max(0, Math.min(comprimentoIlha, maxComprimentoPorLargura, ILHA_COMPRIMENTO_MAX_CM));

  if (comprimentoIlha < 120) {
    avisos.push(
      `Espaço para ilha de apenas ${Math.round(comprimentoIlha)}cm (mínimo prático 120cm). ` +
      `Considere uma bancada encostada na parede.`,
    );
  }

  // 3. Encaixar gabinetes ao longo do comprimento
  const larguras = comprimentoIlha >= 30 ? encaixarLarguras(comprimentoIlha) : [];

  // 4. Posicionar a ilha centralizada
  const ocupado = larguras.reduce((s, l) => s + l, 0);
  const inicioX = Math.round((largura_cm - ocupado) / 2);
  const centroY = Math.round((profundidade_cm - profIlha) / 2);

  const materialCorpo = criarMaterialPadrao(prefs.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(prefs.cor_mdf_hex, 6);

  const modulos: ModuloInstanciado[] = instanciarModulos(larguras, {
    parede: "bottom", // eixo de referência (ilha não encosta em parede)
    inicio_cm: inicioX,
    posicao_y_cm: centroY,
    altura_cm: BASE_ALTURA_CM,
    profundidade_cm: profIlha,
    prefixo: "ilha",
    materialCorpo,
    materialFundo,
    getTemplate: getTemplateBase,
    templateFallback: MODULOS_BASE_COZINHA[4],
    configDe: (largura) => configPadrao({
      tipo_porta: prefs.tipo_porta_base ?? "dobradica",
      ferragem: prefs.ferragem,
      num_portas: largura <= 40 ? 1 : 2,
      // ilha dupla-face: sem fundo fechado, acesso pelos dois lados
      tem_fundo: false,
    }),
    rotuloParede: "Ilha central",
  });

  if (modulos.length === 0) {
    avisos.push("Ilha não pôde ser gerada — espaço insuficiente.");
  }

  const circulacaoLateral = Math.round((largura_cm - ocupado) / 2);

  return montarProjeto({
    ambiente,
    modulos,
    paredes_usadas: [],
    tipo_ambiente: "Cozinha com Ilha",
    preferencias: prefs,
    avisos,
    observacoes_extra: [
      `Ilha central ${ocupado}×${profIlha}cm`,
      `Circulação lateral: ${circulacaoLateral}cm de cada lado`,
      `Circulação frontal: ${centroY}cm de cada lado`,
    ],
    nome_padrao: `Cozinha com Ilha — ${ocupado}cm`,
  });
}
