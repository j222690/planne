/**
 * PLANNE — Motor Paramétrico
 * Fase 6: Fundação Compartilhada de Layout
 *
 * Helpers reutilizados por todos os geradores de layout (linear, L, U, ilha,
 * closet, dormitório, banheiro, lavanderia). Centraliza a criação de materiais,
 * configurações, instanciação de módulos numa parede e montagem do projeto.
 *
 * Princípio: cada gerador de ambiente decide ONDE e QUAIS módulos colocar;
 * esta camada cuida do COMO instanciar e montar de forma consistente.
 */

import type {
  AmbienteGeometrico,
  ProjetoFabricavel,
  ModuloInstanciado,
  ModuloParametrico,
  ConfiguracaoModulo,
  Material,
  ParedeId,
  VersaoComercial,
  SegmentoLivre,
} from "./tipos";
import { AREA_CHAPA_M2 } from "./tipos";
import { calcularPecas, calcularFerragens, calcularMetricas } from "./pecas";
import { validarProjeto, type ResultadoValidacao } from "./rule-engine";

// ─── PREFERÊNCIAS BASE (comum a todos os ambientes) ───────────────────────────

export interface PreferenciasBase {
  cor_mdf_hex: string;
  ferragem: ConfiguracaoModulo["ferragem"];
  versao_comercial: VersaoComercial;
  criado_por?: string;
  empresa_id?: string;
  cliente_id?: string;
  nome?: string;
  estilo?: string;
}

// ─── RESULTADO PADRÃO DE LAYOUT ───────────────────────────────────────────────

export interface ResultadoLayoutBase {
  projeto: ProjetoFabricavel;
  /** Paredes onde os módulos foram posicionados. */
  paredes_usadas: ParedeId[];
  /** Soma das larguras de todos os módulos base (cm lineares). */
  linear_total_cm: number;
  /** Avisos não-bloqueantes. */
  avisos: string[];
  /** Veredicto do Rule Engine. */
  validacao: ResultadoValidacao;
}

// ─── MATERIAIS ────────────────────────────────────────────────────────────────

const PRECOS_CHAPA: Record<number, number> = { 3: 38, 6: 45, 9: 60, 12: 72, 15: 85, 18: 105, 25: 160 };

/**
 * Cria um Material placeholder. Preços reais entram no orçamento formal
 * (catálogo da empresa). Aqui usamos referências de mercado BR 2026.
 */
export function criarMaterialPadrao(cor_hex: string, espessura: 3 | 6 | 9 | 12 | 15 | 18 | 25): Material {
  return {
    id: `padrao_${espessura}mm`,
    codigo: `mdf_${espessura}mm_padrao`,
    nome_display: `MDF ${espessura}mm`,
    espessura_mm: espessura,
    largura_chapa_mm: 2750,
    comprimento_chapa_mm: 1830,
    area_chapa_m2: AREA_CHAPA_M2,
    cor_hex,
    acabamento: "melamina",
    preco_custo_chapa: PRECOS_CHAPA[espessura] ?? 85,
    preco_venda_chapa: 0,
  };
}

// ─── CONFIGURAÇÃO DE MÓDULO ───────────────────────────────────────────────────

/** Configuração base padrão — ponto de partida para qualquer módulo. */
export function configPadrao(overrides: Partial<ConfiguracaoModulo> = {}): ConfiguracaoModulo {
  return {
    tipo_porta: "dobradica",
    num_portas: 2,
    num_prateleiras: 1,
    num_gavetas: 0,
    num_divisorias: 0,
    tem_cabideiro: false,
    tem_fundo: true,
    espessura_fundo_mm: 6,
    tem_rodape: false,
    altura_rodape_cm: 10,
    tem_pes_regulaveis: true,
    altura_pes_cm: 10,
    tem_roda_teto: false,
    tem_iluminacao_led: false,
    tem_espelho_interno: false,
    tem_ripado: false,
    espessura_corpo_mm: 15,
    espessura_porta_mm: 15,
    ferragem: "nacional",
    tipo_puxador: "perfil_aluminio",
    ...overrides,
  };
}

// ─── ALGORITMO DE ENCAIXE GREEDY ──────────────────────────────────────────────

/**
 * Calcula as larguras dos módulos que encaixam num espaço linear disponível.
 * Greedy: prefere módulos de `preferido_cm`, ajusta o resto com módulos padrão.
 *
 * @param disponivel_cm - largura linear a preencher
 * @param larguras_validas - larguras de módulo disponíveis (decrescente)
 * @param preferido_cm - largura preferencial (default 60)
 * @param min_cm - largura mínima de módulo (default 30)
 */
export function encaixarLarguras(
  disponivel_cm: number,
  larguras_validas: readonly number[] = [90, 80, 70, 60, 50, 45, 40, 30],
  preferido_cm = 60,
  min_cm = 30,
): number[] {
  const resultado: number[] = [];
  let restante = Math.round(disponivel_cm);
  const max_cm = Math.max(...larguras_validas);

  while (restante >= min_cm) {
    let escolhido: number;

    if (restante >= preferido_cm) {
      const aposPreferido = restante - preferido_cm;
      if (aposPreferido === 0 || aposPreferido >= min_cm) {
        escolhido = preferido_cm;
      } else {
        const perfeito = larguras_validas.find(
          (l) => l > preferido_cm && l <= restante && (restante - l === 0 || restante - l >= min_cm),
        );
        escolhido = perfeito ?? preferido_cm;
      }
    } else {
      escolhido = larguras_validas.find((l) => l <= restante) ?? restante;
    }

    escolhido = Math.min(escolhido, restante, max_cm);
    resultado.push(escolhido);
    restante -= escolhido;
  }

  // Absorver sobra pequena (< min_cm) no último módulo, se couber no máximo
  if (restante > 0 && resultado.length > 0) {
    const ultimo = resultado[resultado.length - 1];
    if (ultimo + restante <= max_cm) {
      resultado[resultado.length - 1] = ultimo + restante;
    }
  }

  return resultado;
}

// ─── INSTANCIAÇÃO DE MÓDULOS NUMA PAREDE ──────────────────────────────────────

export interface OpcoesInstanciacao {
  parede: ParedeId;
  /** Posição inicial ao longo da parede (cm). */
  inicio_cm: number;
  /** Altura do piso até a base do módulo (cm). 0 = base no chão. */
  posicao_y_cm: number;
  altura_cm: number;
  profundidade_cm: number;
  /** Prefixo do id e do código de instância (ex.: "base", "aereo", "roupeiro"). */
  prefixo: string;
  materialCorpo: Material;
  materialFundo?: Material;
  materialPorta?: Material;
  /** Resolve o template a partir da largura. */
  getTemplate: (largura_cm: number) => ModuloParametrico | undefined;
  templateFallback: ModuloParametrico;
  /** Gera a configuração de cada módulo a partir da largura. */
  configDe: (largura_cm: number) => ConfiguracaoModulo;
  /** Rótulo da parede para o nome de exibição. */
  rotuloParede?: string;
  /** Contador de ordem inicial. */
  ordemInicial?: number;
}

/**
 * Instancia uma sequência de módulos ao longo de uma parede, calculando
 * peças e ferragens de cada um. Função genérica usada por todos os ambientes.
 *
 * @returns os módulos instanciados (com pecas/ferragens derivadas)
 */
export function instanciarModulos(
  larguras: number[],
  opcoes: OpcoesInstanciacao,
): ModuloInstanciado[] {
  const modulos: ModuloInstanciado[] = [];
  let posX = opcoes.inicio_cm;
  let ordem = opcoes.ordemInicial ?? 0;

  for (const largura of larguras) {
    const template = opcoes.getTemplate(largura) ?? opcoes.templateFallback;
    const cfg = opcoes.configDe(largura);
    const rotulo = opcoes.rotuloParede ?? `Parede ${opcoes.parede}`;

    const instancia: ModuloInstanciado = {
      id: `${opcoes.prefixo}_${largura}_${opcoes.parede}_${Math.round(posX)}`,
      modulo_template_id: template.id,
      modulo_template_codigo: template.codigo,
      modulo_template_versao: template.versao,
      largura_cm: largura,
      altura_cm: opcoes.altura_cm,
      profundidade_cm: opcoes.profundidade_cm,
      parede: opcoes.parede,
      posicao_x_cm: posX,
      posicao_y_cm: opcoes.posicao_y_cm,
      configuracao: cfg,
      material_corpo: opcoes.materialCorpo,
      material_fundo: opcoes.materialFundo,
      material_porta: opcoes.materialPorta,
      pecas: [],
      ferragens: [],
      nome_display: `${template.nome} — ${rotulo}`,
      ordem: ordem++,
    };

    instancia.pecas = calcularPecas(instancia, template);
    instancia.ferragens = calcularFerragens(instancia, template);

    modulos.push(instancia);
    posX += largura;
  }

  return modulos;
}

// ─── SELEÇÃO DE PAREDE ────────────────────────────────────────────────────────

/** Maior segmento livre (não bloqueado) de uma parede. */
export function maiorSegmento(ambiente: AmbienteGeometrico, parede: ParedeId): SegmentoLivre | null {
  const validos = ambiente.paredes[parede].segmentos_livres.filter(
    (s) => !s.bloqueado_por_janela_baixa && s.comprimento_cm >= 30,
  );
  if (validos.length === 0) return null;
  return validos.reduce((maior, s) => (s.comprimento_cm > maior.comprimento_cm ? s : maior));
}

/** Comprimento livre máximo de uma parede. */
export function comprimentoLivre(ambiente: AmbienteGeometrico, parede: ParedeId): number {
  const seg = maiorSegmento(ambiente, parede);
  return seg?.comprimento_cm ?? 0;
}

/**
 * Ordena as paredes por comprimento livre decrescente.
 * Útil para escolher a parede principal e secundárias em L/U.
 */
export function paredesPorComprimento(ambiente: AmbienteGeometrico): ParedeId[] {
  const paredes: ParedeId[] = ["top", "bottom", "left", "right"];
  return paredes
    .map((p) => ({ p, comp: comprimentoLivre(ambiente, p) }))
    .sort((a, b) => b.comp - a.comp)
    .map((x) => x.p);
}

/** Pares de paredes adjacentes (perpendiculares) — para cantos em L. */
export const PAREDES_ADJACENTES: Record<ParedeId, ParedeId[]> = {
  top: ["left", "right"],
  bottom: ["left", "right"],
  left: ["top", "bottom"],
  right: ["top", "bottom"],
};

/** Verifica se duas paredes são perpendiculares (formam canto). */
export function saoAdjacentes(a: ParedeId, b: ParedeId): boolean {
  return PAREDES_ADJACENTES[a].includes(b);
}

/** Parede oposta (para layout em U, corredor). */
export const PAREDE_OPOSTA: Record<ParedeId, ParedeId> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

// ─── MONTAGEM DO PROJETO ──────────────────────────────────────────────────────

export interface OpcoesMontagem {
  ambiente: AmbienteGeometrico;
  modulos: ModuloInstanciado[];
  paredes_usadas: ParedeId[];
  tipo_ambiente: string;
  preferencias: PreferenciasBase;
  avisos: string[];
  observacoes_extra?: string[];
  nome_padrao: string;
}

/**
 * Monta o ProjetoFabricavel final a partir dos módulos instanciados,
 * calcula métricas e roda o Rule Engine. Comum a todos os ambientes.
 */
export function montarProjeto(opcoes: OpcoesMontagem): ResultadoLayoutBase {
  const { ambiente, modulos, paredes_usadas, tipo_ambiente, preferencias, avisos } = opcoes;

  const metricas = calcularMetricas(modulos);
  const linear_total_cm = modulos
    .filter((m) => m.posicao_y_cm === 0) // bases no chão
    .reduce((s, m) => s + m.largura_cm, 0);

  const agora = new Date().toISOString();
  const projeto: ProjetoFabricavel = {
    id: `proj_${tipo_ambiente.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`,
    empresa_id: preferencias.empresa_id ?? "",
    cliente_id: preferencias.cliente_id ?? "",
    nome: preferencias.nome ?? opcoes.nome_padrao,
    tipo_ambiente,
    versao_comercial: preferencias.versao_comercial,
    numero_revisao: 1,
    ambiente,
    modulos,
    metricas,
    estilo: preferencias.estilo ?? "Moderno Minimalista",
    observacoes_tecnicas: [
      `${modulos.length} módulos em ${paredes_usadas.length} parede(s)`,
      `${linear_total_cm}cm lineares de marcenaria`,
      ...(opcoes.observacoes_extra ?? []),
      ...avisos,
    ],
    status: "rascunho",
    criado_por: preferencias.criado_por ?? "motor_parametrico",
    criado_em: agora,
    atualizado_em: agora,
  };

  const validacao = validarProjeto(projeto);

  return {
    projeto,
    paredes_usadas,
    linear_total_cm,
    avisos,
    validacao,
  };
}
