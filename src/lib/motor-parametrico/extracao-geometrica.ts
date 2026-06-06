/**
 * PLANNE — Motor Paramétrico
 * Fase 7: Leitura de Plantas — Extração Geométrica
 *
 * Reconstrói um AmbienteGeometrico a partir da geometria 2D extraída de um DXF.
 * Funções puras: dados os segmentos/arcos de uma planta, produzem o ambiente
 * normalizado do núcleo.
 *
 * Estratégia:
 *   1. Identificar os segmentos de PAREDE (por layer ou pelos mais longos).
 *   2. Calcular o bounding box → dimensões reais do ambiente (largura × prof).
 *   3. Detectar aberturas (portas = arcos; janelas = vãos em layer próprio).
 *   4. Mapear tudo para AmbienteGeometrico com as 4 paredes e segmentos livres.
 */

import type {
  AmbienteGeometrico,
  Parede,
  ParedeId,
  Abertura,
  Porta,
  Janela,
} from "./tipos";
import {
  type DXFParseado,
  type SegmentoDXF,
  type ArcoDXF,
  fatorParaCm,
  comprimentoSegmento,
  boundingBox,
  type UnidadeDXF,
} from "./dxf-parser";
import { calcularSegmentosLivres } from "./ambiente";

// ─── CONVENÇÕES DE LAYER ──────────────────────────────────────────────────────

/** Nomes de layer que tipicamente contêm paredes (case-insensitive). */
const LAYERS_PAREDE = /pared|wall|muro|alvenaria/i;
/** Nomes de layer de porta. */
const LAYERS_PORTA = /porta|door/i;
/** Nomes de layer de janela. */
const LAYERS_JANELA = /janela|window|esquadria/i;

// ─── RESULTADO ────────────────────────────────────────────────────────────────

export interface ResultadoExtracao {
  ambiente: AmbienteGeometrico;
  /** Nível de confiança 0–1 da reconstrução. */
  confianca: number;
  /** Diagnósticos da extração. */
  diagnosticos: string[];
}

// ─── SELEÇÃO DE PAREDES ───────────────────────────────────────────────────────

/**
 * Seleciona os segmentos que representam paredes.
 * Prioridade: layer de parede; senão, os segmentos mais longos (contorno).
 */
function selecionarParedes(dxf: DXFParseado, diag: string[]): SegmentoDXF[] {
  const porLayer = dxf.segmentos.filter((s) => LAYERS_PAREDE.test(s.layer));
  if (porLayer.length >= 3) {
    diag.push(`Paredes identificadas pelo layer (${porLayer.length} segmentos).`);
    return porLayer;
  }

  // Sem layer de parede: usar o bounding box do desenho inteiro como contorno.
  diag.push("Sem layer de parede explícito — usando o contorno geral do desenho.");
  return dxf.segmentos;
}

// ─── DETECÇÃO DE ABERTURAS ────────────────────────────────────────────────────

/**
 * Determina em qual parede (top/bottom/left/right) um ponto está,
 * dado o bounding box do ambiente.
 */
function paredeDoPonto(
  x: number,
  y: number,
  bbox: { min_x: number; min_y: number; max_x: number; max_y: number },
): ParedeId {
  const dTop = Math.abs(y - bbox.max_y);
  const dBottom = Math.abs(y - bbox.min_y);
  const dLeft = Math.abs(x - bbox.min_x);
  const dRight = Math.abs(x - bbox.max_x);
  const min = Math.min(dTop, dBottom, dLeft, dRight);
  if (min === dTop) return "top";
  if (min === dBottom) return "bottom";
  if (min === dLeft) return "left";
  return "right";
}

/** Posição (cm) de um ponto ao longo da sua parede, a partir do canto esquerdo. */
function posicaoNaParede(
  x: number,
  y: number,
  parede: ParedeId,
  bbox: { min_x: number; min_y: number; max_x: number; max_y: number },
  fator: number,
): number {
  if (parede === "top" || parede === "bottom") {
    return Math.round((x - bbox.min_x) * fator);
  }
  return Math.round((y - bbox.min_y) * fator);
}

/**
 * Extrai portas a partir dos arcos (a folha de porta gira descrevendo um arco).
 */
function extrairPortas(
  arcos: ArcoDXF[],
  bbox: { min_x: number; min_y: number; max_x: number; max_y: number },
  fator: number,
  diag: string[],
): Porta[] {
  // Considerar arcos no layer de porta OU arcos com raio típico de porta (60–100cm).
  const candidatos = arcos.filter((a) => {
    const raioCm = a.raio * fator;
    return LAYERS_PORTA.test(a.layer) || (raioCm >= 50 && raioCm <= 110);
  });

  const portas: Porta[] = candidatos.map((a, i) => {
    const parede = paredeDoPonto(a.centro.x, a.centro.y, bbox);
    const larguraCm = Math.round(a.raio * fator);
    return {
      id: `porta_dxf_${i}`,
      _tipo: "porta",
      parede,
      posicao_cm: Math.max(0, posicaoNaParede(a.centro.x, a.centro.y, parede, bbox, fator) - Math.round(larguraCm / 2)),
      largura_cm: larguraCm,
      subtipo: "simples",
      altura_cm: 210,
      zona_exclusao_cm: larguraCm,
      lado_dobradica: "esquerda",
      sentido_abertura: "para_dentro",
    };
  });

  if (portas.length > 0) diag.push(`${portas.length} porta(s) detectada(s) por arco.`);
  return portas;
}

/**
 * Extrai janelas a partir de segmentos no layer de janela.
 */
function extrairJanelas(
  segmentos: SegmentoDXF[],
  bbox: { min_x: number; min_y: number; max_x: number; max_y: number },
  fator: number,
  altura_cm: number,
  diag: string[],
): Janela[] {
  const candidatos = segmentos.filter((s) => LAYERS_JANELA.test(s.layer));
  // Agrupar por proximidade não é trivial; cada segmento de janela vira uma janela.
  const janelas: Janela[] = candidatos.map((s, i) => {
    const meioX = (s.inicio.x + s.fim.x) / 2;
    const meioY = (s.inicio.y + s.fim.y) / 2;
    const parede = paredeDoPonto(meioX, meioY, bbox);
    const larguraCm = Math.round(comprimentoSegmento(s) * fator);
    return {
      id: `janela_dxf_${i}`,
      _tipo: "janela",
      parede,
      posicao_cm: Math.max(0, posicaoNaParede(meioX, meioY, parede, bbox, fator) - Math.round(larguraCm / 2)),
      largura_cm: larguraCm,
      subtipo: "abrir",
      altura_peitoril_cm: 100,
      altura_verga_cm: altura_cm - 30,
      bloqueia_base: false,
      bloqueia_aereo: false,
    };
  });

  if (janelas.length > 0) diag.push(`${janelas.length} janela(s) detectada(s) por layer.`);
  return janelas;
}

// ─── ESTIMATIVA DE UNIDADE ────────────────────────────────────────────────────

/**
 * Estima a unidade quando o DXF não declara $INSUNITS, pela magnitude do
 * bounding box (um ambiente residencial tem 2–10m de lado).
 */
function estimarUnidade(
  bbox: { min_x: number; min_y: number; max_x: number; max_y: number },
  diag: string[],
): UnidadeDXF {
  const largura = bbox.max_x - bbox.min_x;
  // Se ~2–15 → metros; ~200–1500 → cm; ~2000–15000 → mm
  if (largura >= 2 && largura <= 20) { diag.push("Unidade estimada: metros (pelo tamanho)."); return "m"; }
  if (largura >= 150 && largura <= 2000) { diag.push("Unidade estimada: centímetros."); return "cm"; }
  if (largura >= 1500 && largura <= 20000) { diag.push("Unidade estimada: milímetros."); return "mm"; }
  diag.push("Unidade indeterminada — assumindo centímetros.");
  return "cm";
}

// ─── FUNÇÃO PRINCIPAL ─────────────────────────────────────────────────────────

/**
 * Converte uma planta DXF parseada em AmbienteGeometrico.
 *
 * @param dxf - resultado de parseDXF()
 * @param alturaPadrao_cm - pé-direito (DXF 2D não traz altura); default 270
 */
export function dxfParaAmbiente(
  dxf: DXFParseado,
  alturaPadrao_cm = 270,
): ResultadoExtracao {
  const diag: string[] = [];

  const paredesSeg = selecionarParedes(dxf, diag);
  const bbox = boundingBox(paredesSeg);

  if (!bbox || paredesSeg.length === 0) {
    diag.push("Nenhuma geometria de parede encontrada no DXF.");
    return {
      ambiente: ambienteVazio(alturaPadrao_cm),
      confianca: 0,
      diagnosticos: diag,
    };
  }

  // Unidade: declarada ou estimada
  let unidade = dxf.unidade;
  if (unidade === "desconhecida") {
    unidade = estimarUnidade(bbox, diag);
  } else {
    diag.push(`Unidade declarada no DXF: ${unidade}.`);
  }
  const fator = fatorParaCm(unidade);

  const largura_cm = Math.round((bbox.max_x - bbox.min_x) * fator);
  const profundidade_cm = Math.round((bbox.max_y - bbox.min_y) * fator);

  // Sanidade dimensional
  if (largura_cm < 50 || profundidade_cm < 50 || largura_cm > 5000 || profundidade_cm > 5000) {
    diag.push(`Dimensões suspeitas: ${largura_cm}×${profundidade_cm}cm. Verifique a escala/unidade.`);
  }

  // Aberturas
  const portas = extrairPortas(dxf.arcos, bbox, fator, diag);
  const janelas = extrairJanelas(dxf.segmentos, bbox, fator, alturaPadrao_cm, diag);

  // Distribuir aberturas por parede
  const aberturasPorParede: Record<ParedeId, Abertura[]> = { top: [], bottom: [], left: [], right: [] };
  for (const p of portas) aberturasPorParede[p.parede].push(p);
  for (const j of janelas) aberturasPorParede[j.parede].push(j);

  const buildParede = (id: ParedeId): Parede => {
    const comprimento = id === "top" || id === "bottom" ? largura_cm : profundidade_cm;
    const parede: Parede = {
      id,
      comprimento_cm: comprimento,
      espessura_cm: 15,
      altura_cm: alturaPadrao_cm,
      aberturas: aberturasPorParede[id],
      segmentos_livres: [],
      obstaculos_adjacentes: [],
    };
    parede.segmentos_livres = calcularSegmentosLivres(parede);
    return parede;
  };

  const ambiente: AmbienteGeometrico = {
    id: `amb_dxf_${Date.now()}`,
    dimensoes: {
      largura_cm,
      profundidade_cm,
      altura_cm: alturaPadrao_cm,
      area_m2: Math.round((largura_cm * profundidade_cm) / 10000 * 100) / 100,
    },
    paredes: {
      top: buildParede("top"),
      bottom: buildParede("bottom"),
      left: buildParede("left"),
      right: buildParede("right"),
    },
    obstaculos: [],
    pontos_eletricos: [],
    pontos_hidraulicos: [],
    fonte: "dwg",
    escala_detectada: unidade === "desconhecida" ? null : `unidade ${unidade}`,
    confianca_extracao: 0,
    extraido_em: new Date().toISOString(),
  };

  // Confiança: alta se unidade declarada + paredes por layer; menor se estimado.
  let confianca = 0.5;
  if (dxf.unidade !== "desconhecida") confianca += 0.25;
  if (dxf.segmentos.some((s) => LAYERS_PAREDE.test(s.layer))) confianca += 0.15;
  if (portas.length > 0 || janelas.length > 0) confianca += 0.1;
  confianca = Math.min(1, confianca);
  ambiente.confianca_extracao = confianca;

  diag.push(`Ambiente reconstruído: ${largura_cm}×${profundidade_cm}cm (${ambiente.dimensoes.area_m2}m²).`);

  return { ambiente, confianca, diagnosticos: diag };
}

// ─── HELPER: ambiente vazio (fallback) ────────────────────────────────────────

function ambienteVazio(altura_cm: number): AmbienteGeometrico {
  const buildParede = (id: ParedeId, comprimento: number): Parede => ({
    id,
    comprimento_cm: comprimento,
    espessura_cm: 15,
    altura_cm,
    aberturas: [],
    segmentos_livres: [{
      inicio_cm: 0, fim_cm: comprimento, comprimento_cm: comprimento,
      altura_util_cm: altura_cm, bloqueado_por_janela_baixa: false,
    }],
    obstaculos_adjacentes: [],
  });
  return {
    id: `amb_vazio_${Date.now()}`,
    dimensoes: { largura_cm: 0, profundidade_cm: 0, altura_cm, area_m2: 0 },
    paredes: {
      top: buildParede("top", 0),
      bottom: buildParede("bottom", 0),
      left: buildParede("left", 0),
      right: buildParede("right", 0),
    },
    obstaculos: [],
    pontos_eletricos: [],
    pontos_hidraulicos: [],
    fonte: "dwg",
    escala_detectada: null,
    confianca_extracao: 0,
    extraido_em: new Date().toISOString(),
  };
}
