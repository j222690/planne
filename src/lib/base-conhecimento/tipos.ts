/**
 * PLANNE — Base de Conhecimento da Marcenaria
 * Tipos da Camada 2 (átomos estruturados) — espelham o schema de
 * `dados/README-SCHEMA.md`. São a fonte OFICIAL de conhecimento da marcenaria.
 *
 * Estas structs descrevem CONHECIMENTO (prosa rastreável, com fonte e confiança),
 * consumido pela camada de IA/consultor. Os NÚMEROS executáveis que o motor
 * determinístico usa ficam na Camada 3 (parâmetros tipados), extraídos daqui e
 * ligados de volta pelo id do átomo — ver `parametros.ts`.
 */

export type TipoAtomo =
  | "regra_obrigatoria"
  | "recomendacao"
  | "boa_pratica"
  | "alerta"
  | "restricao";

export type NivelImpacto = "nenhum" | "baixo" | "médio" | "alto" | "crítico";

export type BaseConfianca =
  | "norma_oficial"
  | "fabricante_oficial"
  | "manual_tecnico_fabricante"
  | "estudo_academico"
  | "blog_tecnico_especializado"
  | "comunidade";

/** Um átomo de conhecimento — a unidade indivisível da base. */
export interface AtomoConhecimento {
  id: string;
  entidade: string;
  categoria: string;
  subcategoria: string;
  titulo: string;
  tipo: TipoAtomo;
  descricao: string;
  condicoes: { quando_aplicar: string; condicoes_adicionais: string };
  restricoes: { quando_nao_aplicar: string; limitacoes: string };
  acoes_recomendadas: string;
  motivo_tecnico: string;
  impacto: { estrutural: NivelImpacto; financeiro: NivelImpacto; estetico: NivelImpacto };
  prioridade: NivelImpacto;
  confianca: { score: number; base: BaseConfianca };
  fonte: string;
  fabricante: string | null;
  observacoes: string;
  tags: string[];
  modulo_origem: string;
  versao: { numero: number; origem: string };
}

/** Uma entidade/subcategoria e os átomos que pertencem a ela. */
export interface EntidadeConhecimento {
  nome: string;
  categoria: string;
  atomos: string[];
}

/** Filtro de busca na base. Campos ausentes não restringem. */
export interface FiltroConhecimento {
  categoria?: string;
  categorias?: string[];
  entidade?: string;
  tipo?: TipoAtomo;
  tags?: string[];
  /** Busca textual em título, descrição, entidade e tags (case-insensitive). */
  texto?: string;
  /** Score mínimo de confiança (0-100). */
  confiancaMin?: number;
}
