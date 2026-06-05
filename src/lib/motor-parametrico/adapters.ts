/**
 * PLANNE — Motor Paramétrico
 * Fase 2: Adapters — Bridge entre entidades do Motor e sistema atual
 *
 * projetoToMovelInput: converte ProjetoFabricavel → MovelInput[]
 * Permite que o motor paramétrico use os endpoints existentes:
 *   - api/calcular-orcamento (cálculo de preços)
 *   - api/lista-corte (nesting e lista de corte)
 *
 * COMPATIBILIDADE GARANTIDA: api/_calc.ts não é modificado.
 */

import type { ProjetoFabricavel, ModuloInstanciado } from "./tipos";

/**
 * Subconjunto de MovelInput de api/_calc.ts.
 * Definido localmente para não depender de import de api/ (camada serverless).
 * Deve manter compatibilidade com a interface real em api/_calc.ts.
 */
export interface MovelInput {
  id?: string;
  nome: string;
  tipo?: string;
  largura_cm: number;
  profundidade_cm: number;
  altura_cm: number;
  portas: number;
  tipo_porta?: "abrir" | "correr" | "sem" | "abrir_vidro" | "abrir_espelho" | "correr_vidro" | "correr_espelho";
  gavetas: number;
  prateleiras: number;
  tem_fundo?: boolean;
  tem_rodape?: boolean;
  tem_pes?: boolean;
  pe_altura_cm?: number;
  tem_roda_teto?: boolean;
  altura_teto_cm?: number;
  mdf_id?: string;
  mdf_caixa_id?: string;
  mdf_externo_id?: string;
  fundo_id?: string;
  dobradica_id?: string;
  corrediça_porta_id?: string;
  corrediça_gaveta_id?: string;
  puxador_id?: string;
}

/**
 * Converte um ProjetoFabricavel em MovelInput[] para consumo por api/_calc.ts.
 *
 * Somente módulos de marcenaria (base, aéreo) são incluídos.
 * Módulos existentes (cama, fogão) e aberturas (porta, janela) são excluídos.
 */
export function projetoToMovelInput(projeto: ProjetoFabricavel): MovelInput[] {
  return projeto.modulos
    .filter(isModuloMarcenaria)
    .map(moduloToMovelInput);
}

/**
 * Verifica se um módulo é de marcenaria (não é móvel existente nem abertura).
 */
function isModuloMarcenaria(modulo: ModuloInstanciado): boolean {
  return modulo.largura_cm > 0 && modulo.altura_cm > 0;
}

/**
 * Converte um ModuloInstanciado em MovelInput.
 */
function moduloToMovelInput(modulo: ModuloInstanciado): MovelInput {
  const cfg = modulo.configuracao;

  return {
    id: modulo.id,
    nome: modulo.nome_display,
    largura_cm: modulo.largura_cm,
    profundidade_cm: modulo.profundidade_cm,
    altura_cm: modulo.altura_cm,
    portas: cfg.num_portas,
    tipo_porta: adaptarTipoPorta(cfg.tipo_porta),
    gavetas: cfg.num_gavetas,
    prateleiras: cfg.num_prateleiras,
    tem_fundo: cfg.tem_fundo,
    tem_rodape: cfg.tem_rodape,
    tem_pes: cfg.tem_pes_regulaveis,
    pe_altura_cm: cfg.altura_pes_cm,
    tem_roda_teto: cfg.tem_roda_teto,
    altura_teto_cm: cfg.altura_teto_cm,
    mdf_id: modulo.material_corpo.id,
    mdf_caixa_id: modulo.material_corpo.id,
    mdf_externo_id: modulo.material_porta?.id ?? modulo.material_corpo.id,
    fundo_id: modulo.material_fundo?.id ?? modulo.material_corpo.id,
  };
}

/**
 * Mapeia tipo_porta do motor para o formato legado de api/_calc.ts.
 */
function adaptarTipoPorta(
  tipo: ModuloInstanciado["configuracao"]["tipo_porta"],
): MovelInput["tipo_porta"] {
  const mapa: Record<string, MovelInput["tipo_porta"]> = {
    dobradica: "abrir",
    correr: "correr",
    basculante: "abrir",
    aberta: "sem",
    vidro: "abrir_vidro",
    espelho: "abrir_espelho",
    ripado: "sem",
  };
  return mapa[tipo] ?? "abrir";
}

/**
 * Calcula o custo estimado de MDF de um projeto (sem overhead, sem margem).
 * Útil para pré-visualização no Step 4 antes de criar o orçamento formal.
 */
export function calcularCustoEstimado(projeto: ProjetoFabricavel): {
  chapas_15mm: number;
  chapas_6mm: number;
  custo_mdf: number;
  custo_ferragens_ref: number;
  subtotal: number;
} {
  const { metricas } = projeto;

  const preco15 = 85;  // R$/chapa — referência de mercado 2025
  const preco18 = 105;
  const preco6 = 45;

  const custo_mdf =
    metricas.chapas_15mm * preco15 +
    metricas.chapas_18mm * preco18 +
    metricas.chapas_6mm * preco6;

  const custo_ferragens_ref = custo_mdf * 0.28; // 28% do MDF em ferragens

  return {
    chapas_15mm: metricas.chapas_15mm,
    chapas_6mm: metricas.chapas_6mm,
    custo_mdf,
    custo_ferragens_ref,
    subtotal: custo_mdf + custo_ferragens_ref,
  };
}

