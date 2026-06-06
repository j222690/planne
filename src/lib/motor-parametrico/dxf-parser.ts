/**
 * PLANNE — Motor Paramétrico
 * Fase 7: Leitura de Plantas — Parser DXF
 *
 * Parser DXF próprio (sem dependências externas). DXF é um formato de texto
 * com pares (código de grupo, valor) em linhas alternadas. Extraímos a
 * geometria 2D relevante: LINE, LWPOLYLINE, ARC, CIRCLE, INSERT.
 *
 * Princípio da Vision: geometria de CAD é EXATA — não é estimativa de IA.
 * O DXF dá as dimensões reais medidas no projeto arquitetônico.
 *
 * Não cobre todo o spec DXF (é vasto); cobre o subconjunto necessário para
 * reconstruir a planta de um ambiente: paredes (linhas/polilinhas), aberturas
 * (arcos de porta) e a unidade de medida ($INSUNITS).
 */

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface PontoDXF {
  x: number;
  y: number;
}

export interface SegmentoDXF {
  inicio: PontoDXF;
  fim: PontoDXF;
  layer: string;
}

export interface ArcoDXF {
  centro: PontoDXF;
  raio: number;
  angulo_inicial: number; // graus
  angulo_final: number;   // graus
  layer: string;
}

export interface InsercaoDXF {
  posicao: PontoDXF;
  nome_bloco: string;
  layer: string;
}

/** Unidades DXF conforme $INSUNITS. */
export type UnidadeDXF = "mm" | "cm" | "m" | "polegada" | "pe" | "desconhecida";

export interface DXFParseado {
  segmentos: SegmentoDXF[];
  arcos: ArcoDXF[];
  insercoes: InsercaoDXF[];
  unidade: UnidadeDXF;
  /** Layers únicos encontrados no arquivo. */
  layers: string[];
}

// ─── TOKENIZER ────────────────────────────────────────────────────────────────

interface ParGrupo {
  codigo: number;
  valor: string;
}

/**
 * Converte o texto DXF em pares (código, valor).
 * O DXF alterna linhas: código numérico, depois o valor.
 */
function tokenizar(texto: string): ParGrupo[] {
  // Normaliza quebras de linha (DXF usa CRLF)
  const linhas = texto.split(/\r\n|\r|\n/);
  const pares: ParGrupo[] = [];

  for (let i = 0; i + 1 < linhas.length; i += 2) {
    const codigoStr = linhas[i].trim();
    const valor = linhas[i + 1];
    if (codigoStr === "") continue;
    const codigo = Number(codigoStr);
    if (Number.isNaN(codigo)) continue;
    pares.push({ codigo, valor: valor !== undefined ? valor.trim() : "" });
  }

  return pares;
}

// ─── MAPA DE UNIDADES ($INSUNITS) ─────────────────────────────────────────────

function unidadeDe(insunits: number): UnidadeDXF {
  switch (insunits) {
    case 1: return "polegada";
    case 2: return "pe";
    case 4: return "mm";
    case 5: return "cm";
    case 6: return "m";
    default: return "desconhecida";
  }
}

/** Fator de conversão da unidade DXF para centímetros. */
export function fatorParaCm(unidade: UnidadeDXF): number {
  switch (unidade) {
    case "mm": return 0.1;
    case "cm": return 1;
    case "m": return 100;
    case "polegada": return 2.54;
    case "pe": return 30.48;
    case "desconhecida": return 1;
  }
}

// ─── PARSER PRINCIPAL ─────────────────────────────────────────────────────────

/**
 * Parseia um arquivo DXF (texto) e extrai geometria 2D.
 * Função pura: mesmo texto → mesmo resultado.
 */
export function parseDXF(texto: string): DXFParseado {
  const pares = tokenizar(texto);

  const segmentos: SegmentoDXF[] = [];
  const arcos: ArcoDXF[] = [];
  const insercoes: InsercaoDXF[] = [];
  const layersSet = new Set<string>();
  let unidade: UnidadeDXF = "desconhecida";

  // 1. Detectar $INSUNITS no HEADER
  for (let i = 0; i < pares.length - 2; i++) {
    if (pares[i].codigo === 9 && pares[i].valor === "$INSUNITS") {
      // O valor está no próximo par com código 70
      for (let j = i + 1; j < Math.min(i + 4, pares.length); j++) {
        if (pares[j].codigo === 70) {
          unidade = unidadeDe(Number(pares[j].valor));
          break;
        }
      }
      break;
    }
  }

  // 2. Percorrer entidades (separadas por código 0)
  // Agrupar pares em blocos de entidade.
  const entidades: ParGrupo[][] = [];
  let atual: ParGrupo[] | null = null;

  for (const par of pares) {
    if (par.codigo === 0) {
      if (atual) entidades.push(atual);
      atual = [par];
    } else if (atual) {
      atual.push(par);
    }
  }
  if (atual) entidades.push(atual);

  // 3. Interpretar cada entidade
  for (const ent of entidades) {
    const tipo = ent[0].valor;
    const get = (codigo: number): string | undefined =>
      ent.find((p) => p.codigo === codigo)?.valor;
    const getNum = (codigo: number, fallback = 0): number => {
      const v = get(codigo);
      return v !== undefined ? Number(v) : fallback;
    };
    const layer = get(8) ?? "0";

    if (tipo === "LINE") {
      layersSet.add(layer);
      segmentos.push({
        inicio: { x: getNum(10), y: getNum(20) },
        fim: { x: getNum(11), y: getNum(21) },
        layer,
      });
    } else if (tipo === "LWPOLYLINE" || tipo === "POLYLINE") {
      layersSet.add(layer);
      // Vértices: pares (10, 20) repetidos
      const vertices: PontoDXF[] = [];
      let vx: number | null = null;
      for (const p of ent) {
        if (p.codigo === 10) vx = Number(p.valor);
        else if (p.codigo === 20 && vx !== null) {
          vertices.push({ x: vx, y: Number(p.valor) });
          vx = null;
        }
      }
      // Fechar polilinha se flag 70 indicar (bit 1) — código 70 em LWPOLYLINE
      const flags = getNum(70);
      const fechada = (flags & 1) === 1;
      for (let i = 0; i + 1 < vertices.length; i++) {
        segmentos.push({ inicio: vertices[i], fim: vertices[i + 1], layer });
      }
      if (fechada && vertices.length > 2) {
        segmentos.push({ inicio: vertices[vertices.length - 1], fim: vertices[0], layer });
      }
    } else if (tipo === "ARC") {
      layersSet.add(layer);
      arcos.push({
        centro: { x: getNum(10), y: getNum(20) },
        raio: getNum(40),
        angulo_inicial: getNum(50),
        angulo_final: getNum(51),
        layer,
      });
    } else if (tipo === "INSERT") {
      layersSet.add(layer);
      insercoes.push({
        posicao: { x: getNum(10), y: getNum(20) },
        nome_bloco: get(2) ?? "",
        layer,
      });
    }
  }

  return {
    segmentos,
    arcos,
    insercoes,
    unidade,
    layers: [...layersSet].sort(),
  };
}

// ─── HELPERS GEOMÉTRICOS ──────────────────────────────────────────────────────

/** Comprimento de um segmento. */
export function comprimentoSegmento(s: SegmentoDXF): number {
  const dx = s.fim.x - s.inicio.x;
  const dy = s.fim.y - s.inicio.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Orientação aproximada de um segmento. */
export function orientacaoSegmento(s: SegmentoDXF): "horizontal" | "vertical" | "diagonal" {
  const dx = Math.abs(s.fim.x - s.inicio.x);
  const dy = Math.abs(s.fim.y - s.inicio.y);
  if (dx < 1e-6 && dy < 1e-6) return "diagonal";
  if (dy <= dx * 0.1) return "horizontal";
  if (dx <= dy * 0.1) return "vertical";
  return "diagonal";
}

/** Bounding box de um conjunto de segmentos. */
export function boundingBox(segmentos: SegmentoDXF[]): {
  min_x: number; min_y: number; max_x: number; max_y: number;
} | null {
  if (segmentos.length === 0) return null;
  let min_x = Infinity, min_y = Infinity, max_x = -Infinity, max_y = -Infinity;
  for (const s of segmentos) {
    for (const p of [s.inicio, s.fim]) {
      if (p.x < min_x) min_x = p.x;
      if (p.y < min_y) min_y = p.y;
      if (p.x > max_x) max_x = p.x;
      if (p.y > max_y) max_y = p.y;
    }
  }
  return { min_x, min_y, max_x, max_y };
}
