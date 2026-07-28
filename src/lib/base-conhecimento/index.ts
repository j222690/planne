/**
 * PLANNE — Base de Conhecimento da Marcenaria (Camada 2)
 * Loader + retrieval dos átomos estruturados.
 *
 * Uso típico (camada de IA/consultor): recuperar apenas os átomos relevantes
 * para o contexto (categoria + tags do móvel) e injetar no prompt/validação —
 * NUNCA jogar os 112 átomos de uma vez. Cada resultado é rastreável pelo `id`
 * e traz `fonte`/`confianca`, mantendo o princípio de auditabilidade.
 *
 * O motor determinístico NÃO importa este módulo — ele usa a Camada 3
 * (`parametros.ts`), que são os números já extraídos daqui.
 */

import consolidada from "./dados/00-knowledge-base-consolidada.json";
import entidadesRaw from "./dados/entidades.json";
import type {
  AtomoConhecimento,
  EntidadeConhecimento,
  FiltroConhecimento,
} from "./tipos";

// A tipagem do JSON importado é estrutural; fazemos o cast para o tipo curado.
const ATOMOS = (consolidada as { total_atomos: number; atomos: AtomoConhecimento[] }).atomos;
const ENTIDADES = (entidadesRaw as { total_entidades: number; entidades: Record<string, EntidadeConhecimento> }).entidades;

/** Total de átomos carregados na base. */
export const TOTAL_ATOMOS = ATOMOS.length;

/** Todas as categorias (módulos) presentes na base. */
export function categorias(): string[] {
  return [...new Set(ATOMOS.map((a) => a.categoria))].sort();
}

/** Recupera um átomo pelo id (ou undefined). */
export function atomoPorId(id: string): AtomoConhecimento | undefined {
  return ATOMOS.find((a) => a.id === id);
}

/** Átomos de uma categoria (módulo), ex.: "Ferragens". */
export function atomosPorCategoria(categoria: string): AtomoConhecimento[] {
  const c = categoria.toLowerCase();
  return ATOMOS.filter((a) => a.categoria.toLowerCase() === c);
}

/** Átomos de uma entidade nomeada (ex.: "DOBRADIÇAS — QUANTIDADE..."). */
export function atomosPorEntidade(nome: string): AtomoConhecimento[] {
  const ent = ENTIDADES[nome];
  if (!ent) {
    // fallback: casa por substring no nome da entidade do átomo
    const q = nome.toLowerCase();
    return ATOMOS.filter((a) => a.entidade.toLowerCase().includes(q));
  }
  return ent.atomos.map(atomoPorId).filter((a): a is AtomoConhecimento => !!a);
}

/**
 * Busca com filtro combinado. Retorna ordenado por confiança (desc) e depois
 * por prioridade (crítico → baixo). Esse é o ponto de entrada do "retrieval".
 */
export function buscarAtomos(filtro: FiltroConhecimento = {}): AtomoConhecimento[] {
  const texto = filtro.texto?.toLowerCase().trim();
  const tags = filtro.tags?.map((t) => t.toLowerCase());
  const cats = (filtro.categorias ?? (filtro.categoria ? [filtro.categoria] : []))
    .map((c) => c.toLowerCase());

  const res = ATOMOS.filter((a) => {
    if (cats.length && !cats.includes(a.categoria.toLowerCase())) return false;
    if (filtro.entidade && !a.entidade.toLowerCase().includes(filtro.entidade.toLowerCase())) return false;
    if (filtro.tipo && a.tipo !== filtro.tipo) return false;
    if (typeof filtro.confiancaMin === "number" && a.confianca.score < filtro.confiancaMin) return false;
    if (tags?.length) {
      const atags = a.tags.map((t) => t.toLowerCase());
      if (!tags.some((t) => atags.includes(t))) return false;
    }
    if (texto) {
      const hay = `${a.titulo} ${a.descricao} ${a.entidade} ${a.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(texto)) return false;
    }
    return true;
  });

  const pesoPrioridade: Record<string, number> = { "crítico": 4, "alto": 3, "médio": 2, "baixo": 1, "nenhum": 0 };
  return res.sort((a, b) =>
    b.confianca.score - a.confianca.score ||
    (pesoPrioridade[b.prioridade] ?? 0) - (pesoPrioridade[a.prioridade] ?? 0));
}

/**
 * Resume um conjunto de átomos em texto compacto para injetar num prompt de IA.
 * Mantém a rastreabilidade (id + fonte) e corta o excesso de prosa.
 */
export function resumirParaPrompt(atomos: AtomoConhecimento[], max = 20): string {
  return atomos.slice(0, max).map((a) => {
    const partes = [
      `• [${a.id}] ${a.titulo} (${a.tipo}, conf ${a.confianca.score})`,
      `  ${a.descricao.replace(/\s*\[cf\.[^\]]*\]/g, "").trim()}`,
    ];
    if (a.condicoes.quando_aplicar) partes.push(`  Quando: ${a.condicoes.quando_aplicar}`);
    if (a.restricoes.quando_nao_aplicar) partes.push(`  Não aplicar: ${a.restricoes.quando_nao_aplicar}`);
    return partes.join("\n");
  }).join("\n\n");
}

export type { AtomoConhecimento, EntidadeConhecimento, FiltroConhecimento } from "./tipos";
