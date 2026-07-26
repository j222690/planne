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
  MODULO_TORRE_FORNO,
  getTemplateBase,
  getTemplateAereo,
  BASE_ALTURA_CM,
  BASE_PROFUNDIDADE_CM,
  AEREO_ALTURA_CM,
  AEREO_PROFUNDIDADE_CM,
  TORRE_ALTURA_CM,
  TORRE_PROFUNDIDADE_CM,
} from "./biblioteca-cozinha";
import { validarProjeto, type ResultadoValidacao } from "./rule-engine";
import { calcularMetricas, calcularPecas } from "./pecas";
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
  /** Inclui torre de forno (paneleiro) quando houver espaço. Default: true. */
  com_torre_forno?: boolean;
  /** Marca um gabinete central com recorte de cooktop. Default: true. */
  com_cooktop?: boolean;
  /** Tampo de pedra (granito/quartzo) em vez de MDF. Default: false. */
  tampo_pedra?: boolean;
  criado_por?: string;
  empresa_id?: string;
  cliente_id?: string;
  nome?: string;
}

const TORRE_LARGURA_CM = 60;

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

  // 2. Segmentos livres úteis da parede — preenche TODOS (ao lado da porta etc.).
  //    Assim a marcenaria fica na parede da porta, sem cobrir a porta.
  let segmentos = parede.segmentos_livres.filter(
    (s) => s.comprimento_cm >= 60 && !s.bloqueado_por_janela_baixa,
  );
  if (segmentos.length === 0) {
    avisos.push(`Nenhum segmento livre suficiente na parede ${paredeId}. Verifique aberturas.`);
    segmentos = [{
      inicio_cm: 0, fim_cm: parede.comprimento_cm, comprimento_cm: parede.comprimento_cm,
      altura_util_cm: parede.altura_cm, bloqueado_por_janela_baixa: false,
    }];
  }

  const larguraDisponivel = segmentos.reduce((s, seg) => s + seg.comprimento_cm, 0);
  const maiorSeg = segmentos.reduce((a, b) => (b.comprimento_cm > a.comprimento_cm ? b : a));

  // 3. Materiais
  const materialCorpo = criarMaterialPadrao(preferencias.cor_mdf_hex, 15);
  const materialFundo = criarMaterialPadrao(preferencias.cor_mdf_hex, 6);

  // 4. Preencher cada segmento com base + aéreo. A torre de forno entra no maior
  //    segmento (reserva 60cm num extremo, piso ao teto, sem aéreo acima).
  const modulosBase: ModuloInstanciado[] = [];
  const modulosAereo: ModuloInstanciado[] = [];
  const modulosTorre: ModuloInstanciado[] = [];
  let larguraOcupada = 0;
  let ordem = 0;

  for (const seg of segmentos) {
    const torreNesteSeg = preferencias.com_torre_forno !== false
      && seg === maiorSeg && seg.comprimento_cm >= TORRE_LARGURA_CM + 90;
    const offset = torreNesteSeg ? TORRE_LARGURA_CM : 0;
    const largurasBases = encaixarModulos(seg.comprimento_cm - offset);
    if (largurasBases.length === 0) continue;
    larguraOcupada += largurasBases.reduce((s, l) => s + l, 0);

    const bases = instanciarModulos(largurasBases, {
      parede: paredeId,
      inicio_cm: seg.inicio_cm + offset,
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
        tem_engrosso_tampo: true,
        tampo_pedra: preferencias.tampo_pedra,
      }),
      ordemInicial: ordem,
    });
    ordem += bases.length;

    const aereos = instanciarModulos(largurasBases, {
      parede: paredeId,
      inicio_cm: seg.inicio_cm + offset,
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
        tem_rodape: false,
        tem_roda_teto: true,
      }),
      ordemInicial: ordem,
    });
    ordem += aereos.length;

    modulosBase.push(...bases);
    modulosAereo.push(...aereos);

    if (torreNesteSeg) {
      const torre = instanciarModulos([TORRE_LARGURA_CM], {
        parede: paredeId,
        inicio_cm: seg.inicio_cm,
        posicao_y_cm: 0,
        altura_cm: TORRE_ALTURA_CM,
        profundidade_cm: TORRE_PROFUNDIDADE_CM,
        prefixo: "torre_forno",
        materialCorpo,
        materialFundo,
        getTemplate: () => MODULO_TORRE_FORNO,
        templateFallback: MODULO_TORRE_FORNO,
        configDe: () => configPadrao({
          tipo_porta: "dobradica",
          ferragem: preferencias.ferragem,
          num_portas: 2,
          num_prateleiras: 3,
          tem_roda_teto: true,
          tem_engrosso_tampo: false,
        }),
        rotuloParede: "Torre de forno",
        ordemInicial: ordem,
      });
      ordem += torre.length;
      modulosTorre.push(...torre);
    }
  }

  const torreAtiva = modulosTorre.length > 0;

  // Cooktop: marca um gabinete base central com recorte + reforço e recalcula
  // suas peças (adiciona as travessas de reforço do recorte no corte).
  if (preferencias.com_cooktop !== false && modulosBase.length > 0) {
    const idx = Math.floor(modulosBase.length / 2);
    const m = modulosBase[idx];
    m.configuracao = { ...m.configuracao, tem_recorte_cooktop: true };
    const tpl = getTemplateBase(m.largura_cm) ?? MODULOS_BASE_COZINHA[4];
    m.pecas = calcularPecas(m, tpl);
    m.nome_display = `${m.nome_display} (cooktop)`;
  }

  const modulos = [...modulosBase, ...modulosAereo, ...modulosTorre];

  // 7. Aproveitamento (larguraOcupada somada no loop dos segmentos)
  const aproveitamento = larguraDisponivel > 0
    ? Math.round((larguraOcupada / larguraDisponivel) * 100)
    : 0;
  if (aproveitamento < 85 && modulosBase.length > 0) {
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
      `${modulosBase.length} módulos base (${larguraOcupada}cm linear)`,
      `${modulosAereo.length} módulos aéreos alinhados`,
      ...(torreAtiva ? [`1 torre de forno (${TORRE_LARGURA_CM}cm, piso ao teto)`] : []),
      ...(preferencias.com_cooktop !== false ? ["1 gabinete com recorte de cooktop"] : []),
      ...(preferencias.tampo_pedra
        ? [`Tampo em pedra (granito/quartzo) — orçar à parte: ~${((larguraOcupada / 100) * (BASE_PROFUNDIDADE_CM / 100)).toFixed(2)}m² de bancada`]
        : []),
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

  // Escolhe a parede com MAIOR espaço livre TOTAL (soma dos segmentos). Assim uma
  // parede com porta no meio (dois trechos) ainda pode ser a principal — e o
  // layout preenche os dois lados da porta, sem cobrir a porta.
  const paredes: ParedeId[] = ["top", "bottom", "left", "right"];
  let melhor: ParedeId = "top";
  let melhorTotal = 0;
  for (const pId of paredes) {
    const p = ambiente.paredes[pId];
    const total = p.segmentos_livres
      .filter((s) => s.comprimento_cm >= 60 && !s.bloqueado_por_janela_baixa)
      .reduce((s, seg) => s + seg.comprimento_cm, 0);
    if (total > melhorTotal) {
      melhorTotal = total;
      melhor = pId;
    }
  }
  return melhor;
}
