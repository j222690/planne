/**
 * PLANNE — Motor Paramétrico
 * Nesting Guilhotina — corte reto de ponta a ponta (compatível com serra
 * seccionadora / panel saw: Giben, Holzma, SCM Cyflex etc.)
 *
 * O nesting.ts (MaxRects) encaixa peças em qualquer canto do retângulo livre —
 * ótimo pra aproveitamento, mas gera layouts que uma serra reta NÃO consegue
 * executar (ela só corta em linha reta de ponta a ponta da chapa/pedaço atual).
 *
 * Este módulo usa "Guillotine Split": toda vez que uma peça é colocada num
 * retângulo livre, o restante é dividido em EXATAMENTE 2 sub-retângulos via
 * UM corte reto (linha inteira). Isso garante que o plano inteiro é
 * fisicamente cortável em sequência — é o preço de aproveitamento um pouco
 * pior (o algoritmo não pode "encaixar" uma peça pequena num canto isolado
 * como o MaxRects faz).
 *
 * Referência: Jylänki, "A Thousand Ways to Pack the Bin" — Guillotine Split
 * (heurística "shorter leftover axis").
 */

import type {
  Peca,
  Material,
  PlanoNesting,
  ChapaAlocada,
  PecaAlocada,
  DirecaoFio,
  FitaBorda,
} from "./tipos";
import { KERF_MM, MARGEM_CHAPA_MM } from "./nesting";
import { gerarSvgChapa } from "./nesting";

// ─── TIPOS ──────────────────────────────────────────────────────────────────

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PecaNesting {
  peca_id: string;
  w: number;
  h: number;
  w_real: number;
  h_real: number;
  pode_rotacionar: boolean;
  etiqueta: string;
  direcao_fio: DirecaoFio;
  fita_borda: FitaBorda;
}

interface Colocacao {
  peca: PecaNesting;
  x: number;
  y: number;
  w: number;
  h: number;
  rotacionada: boolean;
}

/**
 * Um corte reto executado numa serra: a linha (vertical ou horizontal) que
 * divide o retângulo `sobre` em 2 partes. `posicao_mm` é a coordenada
 * absoluta da chapa onde a lâmina passa.
 */
export interface CorteGuilhotina {
  ordem: number;
  eixo: "vertical" | "horizontal";
  /** Coordenada absoluta (mm) do corte — X se vertical, Y se horizontal. */
  posicao_mm: number;
  /** Retângulo (da chapa ou sobra) sobre o qual este corte é executado. */
  sobre: Rect;
}

// ─── BIN GUILHOTINA ───────────────────────────────────────────────────────────

class GuillotineBin {
  readonly largura: number;
  readonly altura: number;
  private livres: Rect[];
  colocacoes: Colocacao[] = [];
  cortes: CorteGuilhotina[] = [];
  private ordemCorte = 0;

  constructor(largura: number, altura: number) {
    this.largura = largura;
    this.altura = altura;
    this.livres = [{
      x: MARGEM_CHAPA_MM,
      y: MARGEM_CHAPA_MM,
      w: largura - 2 * MARGEM_CHAPA_MM,
      h: altura - 2 * MARGEM_CHAPA_MM,
    }];
  }

  inserir(peca: PecaNesting): boolean {
    const escolha = this.melhorPosicao(peca);
    if (!escolha) return false;
    this.colocar(escolha);
    return true;
  }

  /** Best Area Fit: escolhe o menor retângulo livre onde a peça cabe. */
  private melhorPosicao(peca: PecaNesting): (Colocacao & { livreIdx: number }) | null {
    let melhor: (Colocacao & { livreIdx: number }) | null = null;
    let melhorArea = Infinity;

    this.livres.forEach((livre, idx) => {
      if (peca.w <= livre.w && peca.h <= livre.h) {
        const area = livre.w * livre.h;
        if (area < melhorArea) {
          melhorArea = area;
          melhor = { peca, x: livre.x, y: livre.y, w: peca.w, h: peca.h, rotacionada: false, livreIdx: idx };
        }
      }
      if (peca.pode_rotacionar && peca.h <= livre.w && peca.w <= livre.h) {
        const area = livre.w * livre.h;
        if (area < melhorArea) {
          melhorArea = area;
          melhor = { peca, x: livre.x, y: livre.y, w: peca.h, h: peca.w, rotacionada: true, livreIdx: idx };
        }
      }
    });

    return melhor;
  }

  /**
   * Coloca a peça no retângulo livre e divide o restante em 2 via UM corte
   * reto — heurística "shorter leftover axis": corta no eixo que sobra menos,
   * deixando o maior retângulo contíguo pra próximas peças.
   */
  private colocar(c: Colocacao & { livreIdx: number }): void {
    const livre = this.livres[c.livreIdx];
    this.livres.splice(c.livreIdx, 1);

    const sobraDireita = livre.w - c.w;
    const sobraCima = livre.h - c.h;

    if (sobraDireita === 0 && sobraCima === 0) {
      // preencheu o retângulo inteiro — nenhum corte extra necessário
    } else if (sobraDireita <= sobraCima) {
      // corte vertical primeiro (separa a peça+faixa de baixo da faixa de cima)
      this.registrarCorte("horizontal", livre.y + c.h, livre);
      if (sobraCima > 0) this.livres.push({ x: livre.x, y: livre.y + c.h, w: livre.w, h: sobraCima });
      if (sobraDireita > 0) {
        this.registrarCorte("vertical", livre.x + c.w, { x: livre.x, y: livre.y, w: livre.w, h: c.h });
        this.livres.push({ x: livre.x + c.w, y: livre.y, w: sobraDireita, h: c.h });
      }
    } else {
      // corte horizontal primeiro (separa a peça+faixa da direita da faixa da esquerda)
      this.registrarCorte("vertical", livre.x + c.w, livre);
      if (sobraDireita > 0) this.livres.push({ x: livre.x + c.w, y: livre.y, w: sobraDireita, h: livre.h });
      if (sobraCima > 0) {
        this.registrarCorte("horizontal", livre.y + c.h, { x: livre.x, y: livre.y, w: c.w, h: livre.h });
        this.livres.push({ x: livre.x, y: livre.y + c.h, w: c.w, h: sobraCima });
      }
    }

    // Diferente do MaxRects, o split guilhotina sempre produz retângulos
    // livres disjuntos entre si (partição limpa) — só precisa descartar
    // sobras degeneradas (largura/altura ~0), sem checar contenção.
    this.livres = this.livres.filter((r) => r.w > 1 && r.h > 1);
    this.colocacoes.push(c);
  }

  private registrarCorte(eixo: "vertical" | "horizontal", posicao_mm: number, sobre: Rect): void {
    this.cortes.push({ ordem: this.ordemCorte++, eixo, posicao_mm, sobre });
  }
}

// ─── PREPARAÇÃO ───────────────────────────────────────────────────────────────

const NAO_CHAPA = /vidro|espelho|maci/i;

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
        direcao_fio: p.direcao_fio,
        fita_borda: p.fita_borda,
      });
    }
    grupos.set(chave, grupo);
  }

  return grupos;
}

// ─── GERADOR DE PLANO ─────────────────────────────────────────────────────────

export interface OpcoesNestingGuilhotina {
  com_svg?: boolean;
}

export interface ResultadoNestingGuilhotina {
  plano: PlanoNesting;
  /** Sequência de cortes por chapa (id da ChapaAlocada → cortes em ordem). */
  cortes_por_chapa: Record<string, CorteGuilhotina[]>;
}

/**
 * Gera o plano de corte via Guillotine Split — toda chapa produzida é
 * executável numa serra reta (Giben, Holzma, seccionadora comum), ao custo
 * de um aproveitamento um pouco menor que o nesting livre (MaxRects).
 */
export function gerarPlanoNestingGuilhotina(
  pecas: Peca[],
  metrosFitaTotal = 0,
  opcoes: OpcoesNestingGuilhotina = {},
): ResultadoNestingGuilhotina {
  const grupos = prepararPorMaterial(pecas);
  const chapas: ChapaAlocada[] = [];
  const cortesPorChapa: Record<string, CorteGuilhotina[]> = {};
  let numeroChapa = 0;

  for (const { material, itens } of grupos.values()) {
    itens.sort((a, b) => b.w * b.h - a.w * a.h);

    const larguraChapa = material.largura_chapa_mm;
    const alturaChapa = material.comprimento_chapa_mm;

    let pendentes = [...itens];

    while (pendentes.length > 0) {
      const bin = new GuillotineBin(larguraChapa, alturaChapa);
      const naoCabe: PecaNesting[] = [];

      for (const peca of pendentes) {
        if (
          (peca.w > larguraChapa - 2 * MARGEM_CHAPA_MM || peca.h > alturaChapa - 2 * MARGEM_CHAPA_MM) &&
          (peca.h > larguraChapa - 2 * MARGEM_CHAPA_MM || peca.w > alturaChapa - 2 * MARGEM_CHAPA_MM)
        ) {
          continue; // não cabe em nenhuma orientação
        }
        if (!bin.inserir(peca)) naoCabe.push(peca);
      }

      if (bin.colocacoes.length === 0) break;

      const chapa = montarChapa(++numeroChapa, material, bin, opcoes.com_svg !== false);
      chapas.push(chapa);
      cortesPorChapa[chapa.id] = bin.cortes;
      pendentes = naoCabe;
    }
  }

  return { plano: montarPlano(chapas, metrosFitaTotal), cortes_por_chapa: cortesPorChapa };
}

function montarChapa(
  numero: number,
  material: Material,
  bin: GuillotineBin,
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
    direcao_fio: c.peca.direcao_fio,
    fita_borda: c.peca.fita_borda,
  }));

  const areaChapa = bin.largura * bin.altura;
  const areaUtil = pecas_alocadas.reduce((s, p) => s + p.largura_mm * p.comprimento_mm, 0);
  const eficiencia = Math.round((areaUtil / areaChapa) * 1000) / 10;

  return {
    id: `chapa_g_${numero}`,
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
    algoritmo: "guillotine",
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
      csv_operador: "",
    },
    calculado_em: new Date().toISOString(),
  };
}
