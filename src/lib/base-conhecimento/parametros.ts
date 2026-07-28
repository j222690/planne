/**
 * PLANNE — Base de Conhecimento da Marcenaria (Camada 3)
 * Parâmetros EXECUTÁVEIS extraídos da Camada 2 (átomos).
 *
 * Aqui os números que estavam presos na prosa dos átomos viram DADO tipado que
 * o motor determinístico consome. Cada parâmetro carrega `fonteAtomo` (o id do
 * átomo de origem) — então todo cálculo continua rastreável até a fonte.
 *
 * Regra de ouro: se um número de marcenaria é usado num cálculo, ele deve nascer
 * aqui (ou na `conhecimento-tecnico.ts`, que é a Camada 3 histórica), nunca
 * hardcoded solto dentro de uma fórmula. Migrar as regras fixas para cá é o que
 * transforma o Planne num sistema que "entende" as regras, não que as repete.
 *
 * ⚠️ Trocar o motor para ler estes valores pode mudar o orçamento — cada ligação
 * deve vir com teste de paridade. Este arquivo em si é só dado: não calcula nada
 * do orçamento sozinho, então adicioná-lo é seguro.
 */

/** Um valor de marcenaria rastreável até o átomo que o originou. */
export interface Param<T> {
  valor: T;
  unidade: string;
  fonteAtomo: string;
  obs?: string;
}

// ─── DOBRADIÇAS ───────────────────────────────────────────────────────────────

const A_DOBR_ALTURA = "atom_02_dobradicas_quantidade_espacamento_e_capacidade_de_carga_regra_de_quantidade_p";
const A_DOBR_PESO = "atom_02_dobradicas_quantidade_espacamento_e_capacidade_de_carga_capacidade_de_carga_p";
const A_DOBR_ESP = "atom_02_dobradicas_quantidade_espacamento_e_capacidade_de_carga_faixas_de_espessura_d";

/** Faixas de nº de dobradiças por ALTURA da folha (mm). Fonte: base (EN 1935 / catálogos). */
export const DOBRADICAS_POR_ALTURA: Param<{ ate_mm: number; qtd: number }[]> = {
  valor: [
    { ate_mm: 600, qtd: 2 },
    { ate_mm: 2000, qtd: 3 },
    { ate_mm: 2400, qtd: 4 },
    { ate_mm: Infinity, qtd: 5 },
  ],
  unidade: "un por porta",
  fonteAtomo: A_DOBR_ALTURA,
  obs: "2 até 600mm, 3 até 2000mm, 4 até 2400mm, 5 acima. Portas com mola: mín. 3.",
};

/** Nº de dobradiças recomendado para uma porta de dada altura (mm). */
export function dobradicasPorAlturaMm(altura_mm: number): number {
  const faixa = DOBRADICAS_POR_ALTURA.valor.find((f) => altura_mm <= f.ate_mm);
  return faixa?.qtd ?? 5;
}

/** Faixas de nº de dobradiças por PESO de frente (kg), sistemas elevatórios/pesados. */
export const DOBRADICAS_POR_PESO: Param<{ ate_kg: number; qtd: number }[]> = {
  valor: [
    { ate_kg: 22, qtd: 5 },
    { ate_kg: 27, qtd: 6 },
    { ate_kg: 32, qtd: 7 },
  ],
  unidade: "un por porta",
  fonteAtomo: A_DOBR_PESO,
  obs: "Catálogo de portas elevatórias/pesadas, testado a 80.000 ciclos.",
};

/**
 * Nº de dobradiças pela carga (kg) da frente — só a partir de portas pesadas
 * (≥22kg). Abaixo disso a regra que vale é a por altura; retorna null.
 */
export function dobradicasPorPesoKg(peso_kg: number): number | null {
  if (peso_kg < 22) return null;
  const faixa = DOBRADICAS_POR_PESO.valor.find((f) => peso_kg <= f.ate_kg);
  return faixa?.qtd ?? 7;
}

/** Faixa de espessura de porta (mm) compatível com dobradiça de copo Ø35mm. */
export const ESPESSURA_PORTA_COPO_MM: Param<{ min: number; max: number }> = {
  valor: { min: 14, max: 26 },
  unidade: "mm",
  fonteAtomo: A_DOBR_ESP,
};

// ─── PORTAS: FOLGAS, LARGURA MÁXIMA, CORRER ──────────────────────────────────

const A_FOLGA_PORTA = "atom_04_folgas_e_recobrimento_de_portas_folgas_de_referencia_entre_portas_e_nas_later";
const A_LARG_FOLHA = "atom_04_largura_maxima_recomendada_por_folha_limite_pratico_de_largura_por_folha_em_m";
const A_CORRER_DIM = "atom_04_porta_de_correr_limites_dimensionais_por_sistema_fabricante";

/** Folga lateral de porta embutida (respiro), por lado. */
export const FOLGA_LATERAL_PORTA_MM: Param<number> = { valor: 2, unidade: "mm", fonteAtomo: A_FOLGA_PORTA };
/** Folga entre folhas de porta de bater. */
export const FOLGA_ENTRE_PORTAS_MM: Param<number> = { valor: 3, unidade: "mm", fonteAtomo: A_FOLGA_PORTA };

/**
 * Largura máxima recomendada por folha de porta em MDF/MDP. Acima disso a folha
 * tende a "cair" (deforma, sobrecarrega dobradiça). Confortável: 400–500mm.
 */
export const LARGURA_MAX_FOLHA_MM: Param<number> = {
  valor: 600, unidade: "mm", fonteAtomo: A_LARG_FOLHA,
  obs: "Acima de ~600mm: usar porta de correr ou dividir em mais folhas. Confortável 400–500mm.",
};

/** Largura máxima prática por folha de porta de correr (referência independente de sistema). */
export const LARGURA_MAX_CORRER_MM: Param<number> = {
  valor: 1200, unidade: "mm", fonteAtomo: A_CORRER_DIM,
  obs: "1,20m por folha; altura limitada pelo tamanho de chapa/trilho.",
};

/** Deve dividir a porta em mais folhas / trocar por correr? */
export function larguraFolhaExcede(largura_mm: number): boolean {
  return largura_mm > LARGURA_MAX_FOLHA_MM.valor;
}

// ─── GAVETAS ──────────────────────────────────────────────────────────────────

const A_GAV_FOLGA = "atom_04_gavetas_folgas_entre_frentes_e_composicao_vertical_folgas_entre_frentes_de_ga";

/** Folga mínima entre frentes de gaveta (inclui espessura de fundo e ajuste). */
export const FOLGA_ENTRE_GAVETAS_MM: Param<number> = {
  valor: 20, unidade: "mm", fonteAtomo: A_GAV_FOLGA,
  obs: "≥2cm entre frentes; +~1cm de folga superior e inferior no módulo.",
};
/** Folga superior/inferior adicional na composição vertical de gavetas. */
export const FOLGA_GAVETA_TOPO_BASE_MM: Param<number> = { valor: 10, unidade: "mm", fonteAtomo: A_GAV_FOLGA };

// ─── PISTÃO A GÁS (BASCULANTE) ────────────────────────────────────────────────

const A_PISTAO = "atom_04_porta_basculante_e_pistao_a_gas_formula_de_dimensionamento_da_forca_do_pistao";

/**
 * Força ideal (kg) do pistão a gás para porta basculante.
 * Fórmula da base: F = 6 × peso(kg) × altura(m). Arredonda-se para cima ao
 * valor comercial (ex.: 9,36 → pistão de 10).
 */
export function forcaPistaoKg(peso_kg: number, altura_m: number): number {
  return Math.round(6 * peso_kg * altura_m * 100) / 100;
}

// ─── ESTRUTURA: ENGROSSO, EMPENAMENTO ─────────────────────────────────────────

const A_ENGROSSO = "atom_03_engrosso_e_tamponamento_tecnicas_de_composicao_de_espessura_e_acabamento_engr";
const A_EMPENO = "atom_03_empenamento_causas_e_prevencao_limite_de_tolerancia_e_criterio_de_substituica";

/** Espessura típica da chapa de engrosso colada sobre a peça. */
export const ENGROSSO_CHAPA_MM: Param<{ min: number; max: number }> = {
  valor: { min: 6, max: 9 }, unidade: "mm", fonteAtomo: A_ENGROSSO,
  obs: "Caixaria 15mm + chapa 6mm = 21mm aparente. Tamponamento usa 15–18mm.",
};

/** Torção acima da qual a peça deve ser substituída (não corrigida). */
export const TORCAO_MAX_TOLERAVEL_MM: Param<number> = {
  valor: 5, unidade: "mm", fonteAtomo: A_EMPENO,
  obs: "Acima de 5mm ou se atrapalha o alinhamento da porta: substituir a peça.",
};

// ─── MATERIAIS: CHAPA PADRÃO ──────────────────────────────────────────────────

const A_CHAPA = "atom_05_dimensoes_padrao_de_chapa_e_espessuras_disponiveis_formato_padrao_de_chapa_no";

/**
 * Formato-padrão de chapa no mercado brasileiro (Guararapes RUC / Arauco).
 * ⚠️ Nota de paridade: parte do motor usa 2750×1830. A base oficial é 2750×1850.
 * Não trocar no motor sem recalcular consumo de chapa (muda custo de material).
 */
export const CHAPA_PADRAO_MM: Param<{ comprimento: number; largura: number }> = {
  valor: { comprimento: 2750, largura: 1850 }, unidade: "mm", fonteAtomo: A_CHAPA,
};

/** Espessuras de MDF hidrófugo (RUC) disponíveis no mercado. */
export const ESPESSURAS_HIDROFUGO_MM: Param<number[]> = {
  valor: [3, 6, 12, 15, 18], unidade: "mm",
  fonteAtomo: "atom_05_mdf_hidrofugo_ruc_ultra_linhas_resistentes_a_umidade_por_fabricante_linha_ruc",
  obs: "Linha RUC Guararapes; 3mm apenas cru. Ambiente úmido (cozinha/banheiro): preferir hidrófugo ou MDP.",
};
