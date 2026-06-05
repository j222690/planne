/**
 * PLANNE — Motor Paramétrico
 * Fase 4: Engenharia Automática — Consolidação para Produção
 *
 * Transforma um ProjetoFabricavel validado nas listas que a fábrica consome:
 *   - consolidarPecas:     todas as peças agrupadas por material + dimensão
 *   - consolidarFerragens: ferragens agregadas por tipo + marca
 *   - consolidarMateriais: chapas por espessura + metros de fita
 *   - gerarListaCompras:   o que comprar (necessário − estoque)
 *   - gerarEngenharia:     o pacote completo
 *
 * Princípio da Vision: "Todo projeto deve ser fabricável."
 * Todas as funções são puras (sem I/O). Consolidam dados já calculados
 * por calcularPecas()/calcularFerragens() — não recalculam geometria.
 */

import type {
  ProjetoFabricavel,
  Peca,
  Ferragem,
  EspessuraMDF,
  FitaBorda,
  TipoFerragem,
  ListaCompras,
  ItemCompra,
} from "./tipos";
import { AREA_CHAPA_M2 } from "./tipos";

// ─── PARÂMETROS ───────────────────────────────────────────────────────────────

/** Margem de desperdício de chapa aplicada no cálculo de quantidade. */
export const DESPERDICIO_CHAPA_PCT = 15;

/** Margem de desperdício de fita de borda (sobras de aplicação). */
export const DESPERDICIO_FITA_PCT = 15;

// ─── TIPOS DE SAÍDA ───────────────────────────────────────────────────────────

export interface PecaConsolidada {
  /** Chave de agrupamento legível. */
  chave: string;
  material_id: string;
  material_nome: string;
  espessura_mm: EspessuraMDF;
  largura_mm: number;
  comprimento_mm: number;
  quantidade_total: number;
  area_unitaria_m2: number;
  area_total_m2: number;
  fita_borda: FitaBorda;
  /** Etiquetas dos módulos de origem (para rastreabilidade). */
  origens: string[];
}

export interface FerragemConsolidada {
  tipo: TipoFerragem;
  marca: string;
  descricao: string;
  quantidade_total: number;
  preco_custo_unit: number;
  custo_total: number;
}

export interface MaterialConsolidado {
  espessura_mm: EspessuraMDF;
  material_nome: string;
  area_total_m2: number;
  chapas_necessarias: number;
  preco_custo_chapa: number;
  custo_total: number;
}

export interface ResumoFita {
  metros_liquidos: number;
  metros_com_desperdicio: number;
}

export interface ListaEngenharia {
  pecas: PecaConsolidada[];
  ferragens: FerragemConsolidada[];
  materiais: MaterialConsolidado[];
  fita_borda: ResumoFita;
  resumo: {
    num_pecas_total: number;
    num_pecas_unicas: number;
    num_ferragens_total: number;
    num_chapas_total: number;
    custo_materiais: number;
    custo_ferragens: number;
    custo_total: number;
  };
  gerado_em: string;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function todasAsPecas(projeto: ProjetoFabricavel): Peca[] {
  return projeto.modulos.flatMap((m) => m.pecas);
}

function todasAsFerragens(projeto: ProjetoFabricavel): Ferragem[] {
  return projeto.modulos.flatMap((m) => m.ferragens);
}

function areaM2(largura_mm: number, comprimento_mm: number): number {
  return (largura_mm * comprimento_mm) / 1_000_000;
}

function arredondar(valor: number, casas = 2): number {
  const f = 10 ** casas;
  return Math.round(valor * f) / f;
}

/** Soma os metros de fita de uma peça segundo seus lados marcados. */
function metrosFitaPeca(p: Peca): number {
  const l_m = p.largura_mm / 1000;
  const c_m = p.comprimento_mm / 1000;
  let total = 0;
  if (p.fita_borda.esquerda) total += c_m;
  if (p.fita_borda.direita) total += c_m;
  if (p.fita_borda.topo) total += l_m;
  if (p.fita_borda.base) total += l_m;
  return total * p.quantidade;
}

// ─── consolidarPecas ──────────────────────────────────────────────────────────

/**
 * Agrupa peças idênticas (mesmo material, espessura e dimensões) numa só linha,
 * somando as quantidades. Reduz a lista de corte ao conjunto mínimo distinto.
 */
export function consolidarPecas(projeto: ProjetoFabricavel): PecaConsolidada[] {
  const mapa = new Map<string, PecaConsolidada>();

  for (const p of todasAsPecas(projeto)) {
    const fb = p.fita_borda;
    const chave = `${p.material.id}|${p.espessura_mm}|${p.largura_mm}x${p.comprimento_mm}|${fb.esquerda ? 1 : 0}${fb.direita ? 1 : 0}${fb.topo ? 1 : 0}${fb.base ? 1 : 0}`;

    const existente = mapa.get(chave);
    const areaU = areaM2(p.largura_mm, p.comprimento_mm);

    if (existente) {
      existente.quantidade_total += p.quantidade;
      existente.area_total_m2 = arredondar(existente.area_unitaria_m2 * existente.quantidade_total);
      if (!existente.origens.includes(p.etiqueta_producao)) {
        existente.origens.push(p.etiqueta_producao);
      }
    } else {
      mapa.set(chave, {
        chave,
        material_id: p.material.id,
        material_nome: p.material.nome_display,
        espessura_mm: p.espessura_mm,
        largura_mm: p.largura_mm,
        comprimento_mm: p.comprimento_mm,
        quantidade_total: p.quantidade,
        area_unitaria_m2: arredondar(areaU, 4),
        area_total_m2: arredondar(areaU * p.quantidade),
        fita_borda: { ...p.fita_borda },
        origens: [p.etiqueta_producao],
      });
    }
  }

  // Ordenar por área decrescente (peças grandes primeiro — útil no corte)
  return [...mapa.values()].sort((a, b) => b.area_total_m2 - a.area_total_m2);
}

// ─── consolidarFerragens ──────────────────────────────────────────────────────

/**
 * Agrega ferragens por tipo + marca, somando quantidades e custos.
 */
export function consolidarFerragens(projeto: ProjetoFabricavel): FerragemConsolidada[] {
  const mapa = new Map<string, FerragemConsolidada>();

  for (const f of todasAsFerragens(projeto)) {
    const chave = `${f.tipo}|${f.marca}`;
    const existente = mapa.get(chave);

    if (existente) {
      existente.quantidade_total += f.quantidade;
      existente.custo_total = arredondar(existente.preco_custo_unit * existente.quantidade_total);
    } else {
      mapa.set(chave, {
        tipo: f.tipo,
        marca: f.marca,
        descricao: f.descricao,
        quantidade_total: f.quantidade,
        preco_custo_unit: f.preco_custo_unit,
        custo_total: arredondar(f.preco_custo_unit * f.quantidade),
      });
    }
  }

  return [...mapa.values()].sort((a, b) => b.quantidade_total - a.quantidade_total);
}

// ─── consolidarMateriais ──────────────────────────────────────────────────────

/**
 * Calcula chapas necessárias por espessura, a partir da área total das peças
 * de cada material + margem de desperdício.
 */
export function consolidarMateriais(projeto: ProjetoFabricavel): MaterialConsolidado[] {
  const mapa = new Map<string, { espessura: EspessuraMDF; nome: string; area: number; preco: number }>();

  for (const p of todasAsPecas(projeto)) {
    const chave = `${p.material.id}|${p.espessura_mm}`;
    const area = areaM2(p.largura_mm, p.comprimento_mm) * p.quantidade;
    const existente = mapa.get(chave);
    if (existente) {
      existente.area += area;
    } else {
      mapa.set(chave, {
        espessura: p.espessura_mm,
        nome: p.material.nome_display,
        area,
        preco: p.material.preco_custo_chapa,
      });
    }
  }

  const fator = 1 + DESPERDICIO_CHAPA_PCT / 100;

  return [...mapa.values()]
    .map((m) => {
      const areaComDesperdicio = m.area * fator;
      const chapas = Math.ceil(areaComDesperdicio / AREA_CHAPA_M2);
      return {
        espessura_mm: m.espessura,
        material_nome: m.nome,
        area_total_m2: arredondar(m.area),
        chapas_necessarias: chapas,
        preco_custo_chapa: m.preco,
        custo_total: arredondar(chapas * m.preco),
      };
    })
    .sort((a, b) => b.espessura_mm - a.espessura_mm);
}

// ─── consolidarFita ───────────────────────────────────────────────────────────

/**
 * Soma os metros lineares de fita de borda de todas as peças.
 */
export function consolidarFita(projeto: ProjetoFabricavel): ResumoFita {
  const liquidos = todasAsPecas(projeto).reduce((s, p) => s + metrosFitaPeca(p), 0);
  const fator = 1 + DESPERDICIO_FITA_PCT / 100;
  return {
    metros_liquidos: arredondar(liquidos, 1),
    metros_com_desperdicio: arredondar(liquidos * fator, 1),
  };
}

// ─── gerarListaCompras ────────────────────────────────────────────────────────

/** Estoque atual por material_id (chapas) — opcional. */
export type EstoqueAtual = Record<string, number>;

/**
 * Gera a lista de compras a partir dos materiais consolidados, descontando
 * o que já existe em estoque. Compatível com a entidade ListaCompras do núcleo.
 */
export function gerarListaCompras(
  projeto: ProjetoFabricavel,
  estoque: EstoqueAtual = {},
): ListaCompras {
  const materiais = consolidarMateriais(projeto);

  const itens: ItemCompra[] = materiais.map((m) => {
    // Casar pela combinação nome+espessura via primeiro material com essa espessura
    const materialId = encontrarMaterialId(projeto, m.espessura_mm);
    const emEstoque = estoque[materialId] ?? 0;
    const necessario = m.chapas_necessarias;
    const comprar = Math.max(0, necessario - emEstoque);

    return {
      material_id: materialId,
      descricao: `${m.material_nome} (${m.espessura_mm}mm)`,
      quantidade_necessaria: necessario,
      quantidade_em_estoque: emEstoque,
      quantidade_a_comprar: comprar,
      unidade: "chapa",
      preco_referencia: m.preco_custo_chapa,
      urgencia: "normal",
    };
  });

  const itensParaComprar = itens.filter((i) => i.quantidade_a_comprar > 0);
  const custoTotal = itensParaComprar.reduce(
    (s, i) => s + i.quantidade_a_comprar * i.preco_referencia,
    0,
  );

  return {
    itens,
    resumo: {
      itens_em_estoque: itens.length - itensParaComprar.length,
      itens_para_comprar: itensParaComprar.length,
      custo_total_estimado: arredondar(custoTotal),
      prazo_max_entrega_dias: 0,
    },
    pedidos_sugeridos: [],
    gerado_em: new Date().toISOString(),
  };
}

function encontrarMaterialId(projeto: ProjetoFabricavel, espessura: EspessuraMDF): string {
  for (const m of projeto.modulos) {
    const p = m.pecas.find((pc) => pc.espessura_mm === espessura);
    if (p) return p.material.id;
  }
  return `material_${espessura}mm`;
}

// ─── gerarEngenharia (pacote completo) ────────────────────────────────────────

/**
 * Gera o pacote completo de engenharia para produção.
 * É a função principal da Fase 4: entrada = projeto validado, saída = tudo
 * que a fábrica precisa para fabricar.
 */
export function gerarEngenharia(projeto: ProjetoFabricavel): ListaEngenharia {
  const pecas = consolidarPecas(projeto);
  const ferragens = consolidarFerragens(projeto);
  const materiais = consolidarMateriais(projeto);
  const fita_borda = consolidarFita(projeto);

  const num_pecas_total = pecas.reduce((s, p) => s + p.quantidade_total, 0);
  const num_ferragens_total = ferragens.reduce((s, f) => s + f.quantidade_total, 0);
  const num_chapas_total = materiais.reduce((s, m) => s + m.chapas_necessarias, 0);
  const custo_materiais = arredondar(materiais.reduce((s, m) => s + m.custo_total, 0));
  const custo_ferragens = arredondar(ferragens.reduce((s, f) => s + f.custo_total, 0));

  return {
    pecas,
    ferragens,
    materiais,
    fita_borda,
    resumo: {
      num_pecas_total,
      num_pecas_unicas: pecas.length,
      num_ferragens_total,
      num_chapas_total,
      custo_materiais,
      custo_ferragens,
      custo_total: arredondar(custo_materiais + custo_ferragens),
    },
    gerado_em: new Date().toISOString(),
  };
}
