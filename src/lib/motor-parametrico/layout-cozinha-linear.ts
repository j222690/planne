/**
 * PLANNE — Motor Paramétrico
 * Fase 2: Motor Paramétrico V1 — Layout de Cozinha Linear
 * (refatorado na Fase 6 para usar a fundação compartilhada `layout-shared`)
 *
 * gerarLayoutCozinhaLinear: transforma um AmbienteGeometrico em um
 * ProjetoFabricavel com módulos base e aéreos numa única parede.
 *
 * CRITÉRIO DE ACEITE (roadmap): Parede 4m → Projeto → Peças → Ferragens
 */

import type {
  AmbienteGeometrico,
  ProjetoFabricavel,
  ModuloInstanciado,
  ConfiguracaoModulo,
  ParedeId,
  VersaoComercial,
} from "./tipos";
import {
  MODULOS_BASE_COZINHA,
  MODULOS_AEREOS_COZINHA,
  getTemplateBase,
  getTemplateAereo,
  BASE_ALTURA_CM,
  BASE_PROFUNDIDADE_CM,
  AEREO_ALTURA_CM,
  AEREO_PROFUNDIDADE_CM,
} from "./biblioteca-cozinha";
import { validarProjeto, type ResultadoValidacao } from "./rule-engine";
import { calcularMetricas } from "./pecas";
import {
  criarMaterialPadrao,
  configPadrao,
  encaixarLarguras,
  instanciarModulos,
  maiorSegmento,
} from "./layout-shared";

// ─── ALTURA DO AÉREO (piso → base) ────────────────────────────────────────────

const AEREO_INICIO_Y_CM = 150;

// ─── TIPOS DE ENTRADA ─────────────────────────────────────────────────────────

export interface PreferenciasCozinha {
  parede_principal?: ParedeId;
  cor_mdf_hex: string;
  ferragem: ConfiguracaoModulo["ferragem"];
  tipo_porta_base: "dobradica" | "correr";
  tipo_porta_aereo: "dobradica" | "basculante";
  versao_comercial: VersaoComercial;
  criado_por?: string;
  empresa_id?: string;
  cliente_id?: string;
  nome?: string;
}

export interface ResultadoLayout {
  projeto: ProjetoFabricavel;
  parede_usada: ParedeId;
  largura_disponivel_cm: number;
  largura_ocupada_cm: number;
  aproveitamento_pct: number;
  avisos: string[];
  validacao: ResultadoValidacao;
}

// ─── FUNÇÃO PRINCIPAL ─────────────────────────────────────────────────────────

export function gerarLayoutCozinhaLinear(
  ambiente: AmbienteGeometrico,
  preferencias: PreferenciasCozinha,
): ResultadoLayout {
  const avisos: string[] = [];

  // 1. Identificar parede principal
  const paredeId = escolherParedePrincipal(ambiente, preferencias.parede_principal, avisos);
  const parede = ambiente.paredes[paredeId];

  // 2. Maior segmento livre
  let segmento = maiorSegmento(ambiente, paredeId);
  if (!segmento) {
    avisos.push(`Nenhum segmento livre suficiente na parede ${paredeId}. Verifique aberturas.`);
    segmento = {
      inicio_cm: 0,
      fim_cm: parede.comprimento_cm,
      comprimento_cm: parede.comprimento_cm,
      altura_util_cm: parede.altura_cm,
      bloqueado_por_janela_baixa: false,
    };
  }

  const larguraDisponivel = segmento.comprimento_cm;

  // 3. Encaixe greedy
  const largurasBases = encaixarModulos(larguraDisponivel);
  if (largurasBases.length === 0) {
    avisos.push(`Segmento de ${larguraDisponivel}cm é insuficiente para um módulo mínimo (30cm).`);
  }

  // 4. Materiais
  const materialCorpo = criarMaterialPadrao(preferencias.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(preferencias.cor_mdf_hex, 6);

  // 5. Instanciar bases
  const modulosBase = instanciarModulos(largurasBases, {
    parede: paredeId,
    inicio_cm: segmento.inicio_cm,
    posicao_y_cm: 0,
    altura_cm: BASE_ALTURA_CM,
    profundidade_cm: BASE_PROFUNDIDADE_CM,
    prefixo: "base",
    materialCorpo,
    materialFundo,
    getTemplate: getTemplateBase,
    templateFallback: MODULOS_BASE_COZINHA[4],
    configDe: (largura) => configPadrao({
      tipo_porta: preferencias.tipo_porta_base,
      ferragem: preferencias.ferragem,
      num_portas: largura <= 40 ? 1 : 2,
    }),
  });

  // 6. Instanciar aéreos (alinhados com bases)
  const modulosAereo = instanciarModulos(largurasBases, {
    parede: paredeId,
    inicio_cm: segmento.inicio_cm,
    posicao_y_cm: AEREO_INICIO_Y_CM,
    altura_cm: AEREO_ALTURA_CM,
    profundidade_cm: AEREO_PROFUNDIDADE_CM,
    prefixo: "aereo",
    materialCorpo,
    materialFundo,
    getTemplate: getTemplateAereo,
    templateFallback: MODULOS_AEREOS_COZINHA[4],
    configDe: (largura) => configPadrao({
      tipo_porta: preferencias.tipo_porta_aereo as ConfiguracaoModulo["tipo_porta"],
      ferragem: preferencias.ferragem,
      num_portas: largura <= 40 ? 1 : 2,
      tem_pes_regulaveis: false,
    }),
    ordemInicial: modulosBase.length,
  });

  const modulos = [...modulosBase, ...modulosAereo];

  // 7. Aproveitamento
  const larguraOcupada = largurasBases.reduce((s, l) => s + l, 0);
  const aproveitamento = larguraDisponivel > 0
    ? Math.round((larguraOcupada / larguraDisponivel) * 100)
    : 0;
  if (aproveitamento < 85 && largurasBases.length > 0) {
    avisos.push(
      `Aproveitamento de ${aproveitamento}% (${larguraOcupada}cm de ${larguraDisponivel}cm disponíveis). ` +
      `Sobra de ${larguraDisponivel - larguraOcupada}cm.`,
    );
  }

  // 8. Montar projeto
  const metricas = calcularMetricas(modulos);
  const agora = new Date().toISOString();
  const projeto: ProjetoFabricavel = {
    id: `proj_cozinha_${Date.now()}`,
    empresa_id: preferencias.empresa_id ?? "",
    cliente_id: preferencias.cliente_id ?? "",
    nome: preferencias.nome ?? `Cozinha Linear — ${ambiente.dimensoes.largura_cm / 100}m`,
    tipo_ambiente: "Cozinha",
    versao_comercial: preferencias.versao_comercial,
    numero_revisao: 1,
    ambiente,
    modulos,
    metricas,
    estilo: "Moderno Minimalista",
    observacoes_tecnicas: [
      `${largurasBases.length} módulos base (${larguraOcupada}cm linear)`,
      `${largurasBases.length} módulos aéreos alinhados`,
      `Aproveitamento da parede: ${aproveitamento}%`,
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
    parede_usada: paredeId,
    largura_disponivel_cm: larguraDisponivel,
    largura_ocupada_cm: larguraOcupada,
    aproveitamento_pct: aproveitamento,
    avisos,
    validacao,
  };
}

// ─── ALGORITMO DE ENCAIXE (compatibilidade Fase 2) ────────────────────────────

/**
 * Wrapper de compatibilidade sobre encaixarLarguras (layout-shared).
 * Mantém a assinatura pública usada pelos testes e pelo index da Fase 2.
 */
export function encaixarModulos(disponivel_cm: number): number[] {
  return encaixarLarguras(disponivel_cm, [90, 80, 70, 60, 50, 45, 40, 30], 60, 30);
}

// ─── SELEÇÃO DE PAREDE ────────────────────────────────────────────────────────

function escolherParedePrincipal(
  ambiente: AmbienteGeometrico,
  preferida: ParedeId | undefined,
  avisos: string[],
): ParedeId {
  if (preferida) {
    const parede = ambiente.paredes[preferida];
    const temEspaco = parede.segmentos_livres.some((s) => s.comprimento_cm >= 120);
    if (!temEspaco) {
      avisos.push(`Parede "${preferida}" tem menos de 120cm disponível. Usando a melhor alternativa.`);
    } else {
      return preferida;
    }
  }

  const paredes: ParedeId[] = ["top", "bottom", "left", "right"];
  let melhor: ParedeId = "top";
  let melhorComp = 0;
  for (const pId of paredes) {
    const p = ambiente.paredes[pId];
    const maxSeg = Math.max(0, ...p.segmentos_livres.map((s) => s.comprimento_cm));
    if (maxSeg > melhorComp) {
      melhorComp = maxSeg;
      melhor = pId;
    }
  }
  return melhor;
}
