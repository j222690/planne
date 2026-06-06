/**
 * PLANNE — Motor Paramétrico
 * Fase 8: Plano de Corte — Nesting 2D Industrial (MaxRects)
 *
 * Algoritmo MaxRects (Best Short Side Fit) — referência da indústria para
 * bin-packing 2D. Supera o Guillotine simples em aproveitamento de chapa.
 *
 * Entrada: Peca[] (da Fase 4). Saída: PlanoNesting do núcleo.
 *
 * Princípio: nesting é otimização determinística — mesmo conjunto de peças
 * sempre produz o mesmo plano. Meta de desperdício < 12%.
 *
 * Regras:
 *   - Peças são agrupadas por material (uma chapa só corta um material/cor).
 *   - Rotação 90° permitida apenas quando a peça aceita (direcao_fio indiferente).
 *   - Considera a espessura do disco de corte (kerf) como folga entre peças.
 */

import type {
  Peca,
  Material,
  PlanoNesting,
  ChapaAlocada,
  PecaAlocada,
} from "./tipos";

// ─── PARÂMETROS ───────────────────────────────────────────────────────────────

/** Folga de corte (kerf) entre peças, em mm. */
export const KERF_MM = 4;

/** Margem de borda da chapa (refilo), em mm. */
export const MARGEM_CHAPA_MM = 10;

// ─── TIPOS INTERNOS ───────────────────────────────────────────────────────────

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PecaNesting {
  peca_id: string;
  w: number; // largura + kerf
  h: number; // comprimento + kerf
  w_real: number;
  h_real: number;
  pode_rotacionar: boolean;
  etiqueta: string;
}

interface Colocacao {
  peca: PecaNesting;
  x: number;
  y: number;
  w: number; // dimensão final colocada (pode estar rotacionada)
  h: number;
  rotacionada: boolean;
}

// ─── BIN MAXRECTS ─────────────────────────────────────────────────────────────

/**
 * Uma chapa gerenciada pelo algoritmo MaxRects.
 * Mantém a lista de retângulos livres e insere peças por Best Short Side Fit.
 */
class MaxRectsBin {
  readonly largura: number;
  readonly altura: number;
  private livres: Rect[];
  colocacoes: Colocacao[] = [];

  constructor(largura: number, altura: number) {
    this.largura = largura;
    this.altura = altura;
    // Área útil descontando a margem de refilo nas bordas.
    this.livres = [{
      x: MARGEM_CHAPA_MM,
      y: MARGEM_CHAPA_MM,
      w: largura - 2 * MARGEM_CHAPA_MM,
      h: altura - 2 * MARGEM_CHAPA_MM,
    }];
  }

  /** Tenta inserir uma peça. Retorna true se coube. */
  inserir(peca: PecaNesting): boolean {
    const escolha = this.melhorPosicao(peca);
    if (!escolha) return false;

    this.colocar(escolha);
    return true;
  }

  /** Best Short Side Fit: minimiza a menor sobra do retângulo livre. */
  private melhorPosicao(peca: PecaNesting): Colocacao | null {
    let melhor: Colocacao | null = null;
    let melhorCurto = Infinity;
    let melhorLongo = Infinity;

    for (const livre of this.livres) {
      // Orientação normal
      if (peca.w <= livre.w && peca.h <= livre.h) {
        const sobraH = livre.w - peca.w;
        const sobraV = livre.h - peca.h;
        const curto = Math.min(sobraH, sobraV);
        const longo = Math.max(sobraH, sobraV);
        if (curto < melhorCurto || (curto === melhorCurto && longo < melhorLongo)) {
          melhorCurto = curto;
          melhorLongo = longo;
          melhor = { peca, x: livre.x, y: livre.y, w: peca.w, h: peca.h, rotacionada: false };
        }
      }
      // Orientação rotacionada 90°
      if (peca.pode_rotacionar && peca.h <= livre.w && peca.w <= livre.h) {
        const sobraH = livre.w - peca.h;
        const sobraV = livre.h - peca.w;
        const curto = Math.min(sobraH, sobraV);
        const longo = Math.max(sobraH, sobraV);
        if (curto < melhorCurto || (curto === melhorCurto && longo < melhorLongo)) {
          melhorCurto = curto;
          melhorLongo = longo;
          melhor = { peca, x: livre.x, y: livre.y, w: peca.h, h: peca.w, rotacionada: true };
        }
      }
    }

    return melhor;
  }

  /** Coloca a peça e atualiza a lista de retângulos livres. */
  private colocar(c: Colocacao): void {
    const usado: Rect = { x: c.x, y: c.y, w: c.w, h: c.h };
    const novos: Rect[] = [];

    for (const livre of this.livres) {
      if (this.intersecta(usado, livre)) {
        novos.push(...this.dividir(livre, usado));
      } else {
        novos.push(livre);
      }
    }

    this.livres = this.podar(novos);
    this.colocacoes.push(c);
  }

  private intersecta(a: Rect, b: Rect): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  /** Divide um retângulo livre subtraindo o usado (gera até 4 sub-retângulos). */
  private dividir(livre: Rect, usado: Rect): Rect[] {
    const res: Rect[] = [];
    // Faixa à esquerda
    if (usado.x > livre.x) {
      res.push({ x: livre.x, y: livre.y, w: usado.x - livre.x, h: livre.h });
    }
    // Faixa à direita
    if (usado.x + usado.w < livre.x + livre.w) {
      res.push({ x: usado.x + usado.w, y: livre.y, w: livre.x + livre.w - (usado.x + usado.w), h: livre.h });
    }
    // Faixa abaixo
    if (usado.y > livre.y) {
      res.push({ x: livre.x, y: livre.y, w: livre.w, h: usado.y - livre.y });
    }
    // Faixa acima
    if (usado.y + usado.h < livre.y + livre.h) {
      res.push({ x: livre.x, y: usado.y + usado.h, w: livre.w, h: livre.y + livre.h - (usado.y + usado.h) });
    }
    return res.filter((r) => r.w > 1 && r.h > 1);
  }

  /** Remove retângulos livres contidos em outros (poda). */
  private podar(rects: Rect[]): Rect[] {
    const result: Rect[] = [];
    for (let i = 0; i < rects.length; i++) {
      let contido = false;
      for (let j = 0; j < rects.length; j++) {
        if (i !== j && this.contido(rects[i], rects[j])) {
          contido = true;
          break;
        }
      }
      if (!contido) result.push(rects[i]);
    }
    return result;
  }

  private contido(a: Rect, b: Rect): boolean {
    return a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
  }
}

// ─── PREPARAÇÃO DAS PEÇAS ─────────────────────────────────────────────────────

/** Materiais que não vão para o nesting de chapa (vidro, espelho, maciço). */
const NAO_CHAPA = /vidro|espelho|maci/i;

/**
 * Expande Peca[] em peças individuais para nesting, agrupadas por material.
 */
function prepararPorMaterial(pecas: Peca[]): Map<string, { material: Material; itens: PecaNesting[] }> {
  const grupos = new Map<string, { material: Material; itens: PecaNesting[] }>();

  for (const p of pecas) {
    if (NAO_CHAPA.test(p.material.nome_display)) continue;

    const chave = `${p.material.id}|${p.espessura_mm}`;
    const grupo = grupos.get(chave) ?? { material: p.material, itens: [] };

    const podeRotacionar = p.direcao_fio === "indiferente";
    for (let i = 0; i < p.quantidade; i++) {
      grupo.itens.push({
        peca_id: `${p.id}#${i}`,
        w: p.largura_mm + KERF_MM,
        h: p.comprimento_mm + KERF_MM,
        w_real: p.largura_mm,
        h_real: p.comprimento_mm,
        pode_rotacionar: podeRotacionar,
        etiqueta: p.etiqueta_producao,
      });
    }
    grupos.set(chave, grupo);
  }

  return grupos;
}

// ─── GERADOR DE PLANO ─────────────────────────────────────────────────────────

export interface OpcoesNesting {
  /** Gera o SVG de cada chapa? (default true) */
  com_svg?: boolean;
}

/**
 * Gera o plano de corte (nesting MaxRects) a partir das peças do projeto.
 *
 * @param pecas - todas as peças (ex.: projeto.modulos.flatMap(m => m.pecas))
 * @param metrosFitaTotal - metros de fita já calculados (Fase 4), para o resumo
 */
export function gerarPlanoNesting(
  pecas: Peca[],
  metrosFitaTotal = 0,
  opcoes: OpcoesNesting = {},
): PlanoNesting {
  const grupos = prepararPorMaterial(pecas);
  const chapas: ChapaAlocada[] = [];
  let numeroChapa = 0;

  for (const { material, itens } of grupos.values()) {
    // Ordenar por área decrescente (peças grandes primeiro)
    itens.sort((a, b) => b.w * b.h - a.w * a.h);

    const larguraChapa = material.largura_chapa_mm;
    const alturaChapa = material.comprimento_chapa_mm;

    let pendentes = [...itens];

    while (pendentes.length > 0) {
      const bin = new MaxRectsBin(larguraChapa, alturaChapa);
      const naoCabe: PecaNesting[] = [];

      for (const peca of pendentes) {
        // Peça maior que a chapa: não há como cortar — registra e pula.
        if (
          (peca.w > larguraChapa - 2 * MARGEM_CHAPA_MM || peca.h > alturaChapa - 2 * MARGEM_CHAPA_MM) &&
          (peca.h > larguraChapa - 2 * MARGEM_CHAPA_MM || peca.w > alturaChapa - 2 * MARGEM_CHAPA_MM)
        ) {
          // não cabe em nenhuma orientação; ignora silenciosamente (peça inválida)
          continue;
        }
        if (!bin.inserir(peca)) naoCabe.push(peca);
      }

      // Se nada coube nesta chapa, evita loop infinito.
      if (bin.colocacoes.length === 0) break;

      chapas.push(montarChapa(++numeroChapa, material, bin, opcoes.com_svg !== false));
      pendentes = naoCabe;
    }
  }

  return montarPlano(chapas, metrosFitaTotal);
}

function montarChapa(
  numero: number,
  material: Material,
  bin: MaxRectsBin,
  comSvg: boolean,
): ChapaAlocada {
  const pecas_alocadas: PecaAlocada[] = bin.colocacoes.map((c) => ({
    peca_id: c.peca.peca_id,
    x_mm: c.x,
    y_mm: c.y,
    largura_mm: c.rotacionada ? c.peca.h_real : c.peca.w_real,
    comprimento_mm: c.rotacionada ? c.peca.w_real : c.peca.h_real,
    rotacionada: c.rotacionada,
    etiqueta: c.peca.etiqueta,
  }));

  const areaChapa = bin.largura * bin.altura;
  const areaUtil = pecas_alocadas.reduce((s, p) => s + p.largura_mm * p.comprimento_mm, 0);
  const eficiencia = Math.round((areaUtil / areaChapa) * 1000) / 10;

  return {
    id: `chapa_${numero}`,
    numero_sequencial: numero,
    material,
    largura_mm: bin.largura,
    comprimento_mm: bin.altura,
    pecas_alocadas,
    area_util_mm2: Math.round(areaUtil),
    area_desperdicada_mm2: Math.round(areaChapa - areaUtil),
    eficiencia_pct: eficiencia,
    svg_layout: comSvg ? gerarSvgChapa(numero, material, bin.largura, bin.altura, pecas_alocadas) : "",
  };
}

function montarPlano(chapas: ChapaAlocada[], metrosFitaTotal: number): PlanoNesting {
  const totalPecas = chapas.reduce((s, c) => s + c.pecas_alocadas.length, 0);
  const areaUtil = chapas.reduce((s, c) => s + c.area_util_mm2, 0);
  const areaTotal = chapas.reduce((s, c) => s + c.largura_mm * c.comprimento_mm, 0);
  const areaDesperdicada = areaTotal - areaUtil;
  const desperdicioPct = areaTotal > 0 ? Math.round((areaDesperdicada / areaTotal) * 1000) / 10 : 0;

  return {
    algoritmo: "maxrects",
    chapas,
    resumo: {
      total_pecas: totalPecas,
      total_chapas: chapas.length,
      area_util_total_m2: Math.round(areaUtil / 1_000_000 * 100) / 100,
      area_desperdicada_m2: Math.round(areaDesperdicada / 1_000_000 * 100) / 100,
      desperdicio_pct: desperdicioPct,
      metros_fita_total: Math.round(metrosFitaTotal * 10) / 10,
    },
    exportacoes: {
      csv_operador: "", // preenchido por exportacao-corte
    },
    calculado_em: new Date().toISOString(),
  };
}

// ─── SVG (preview da chapa) ───────────────────────────────────────────────────

/** Gera um SVG simples do layout de uma chapa (escala 1:10). */
export function gerarSvgChapa(
  numero: number,
  material: Material,
  largura_mm: number,
  comprimento_mm: number,
  pecas: PecaAlocada[],
): string {
  const escala = 0.1; // 1px = 10mm
  const W = Math.round(largura_mm * escala);
  const H = Math.round(comprimento_mm * escala);
  const cores = ["#cfe8ff", "#ffe6cc", "#d6f5d6", "#f5d6e6", "#fff3bf", "#e0d6ff"];

  const rects = pecas.map((p, i) => {
    const x = Math.round(p.x_mm * escala);
    const y = Math.round(p.y_mm * escala);
    const w = Math.round((p.rotacionada ? p.comprimento_mm : p.largura_mm) * escala);
    const h = Math.round((p.rotacionada ? p.largura_mm : p.comprimento_mm) * escala);
    const cor = cores[i % cores.length];
    const label = `${p.largura_mm}×${p.comprimento_mm}${p.rotacionada ? " ↻" : ""}`;
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${cor}" stroke="#333" stroke-width="0.5"/>` +
      `<text x="${x + w / 2}" y="${y + h / 2}" font-size="6" text-anchor="middle" dominant-baseline="middle" fill="#222">${label}</text></g>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<rect x="0" y="0" width="${W}" height="${H}" fill="#fafafa" stroke="#000" stroke-width="1"/>` +
    rects +
    `<text x="4" y="10" font-size="7" fill="#666">Chapa ${numero} — ${material.nome_display}</text>` +
    `</svg>`;
}
