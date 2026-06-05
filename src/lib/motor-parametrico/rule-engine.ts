/**
 * PLANNE — Motor Paramétrico
 * Fase 3: Rule Engine — Validação Automática de Projetos
 *
 * validarProjeto: avalia um ProjetoFabricavel contra um conjunto de regras de
 * engenharia e ergonomia, produzindo um veredicto auditável.
 *
 * CRITÉRIO DE ACEITE (roadmap):
 *   Resultado → Aprovado / Aprovado com alertas / Reprovado
 *
 * Princípio da Vision: "Todo cálculo deve ser auditável."
 * Cada regra é uma função pura que recebe o contexto e devolve violações.
 * Nenhuma regra faz I/O. O mesmo projeto sempre produz o mesmo veredicto.
 */

import type {
  ProjetoFabricavel,
  ModuloInstanciado,
  AmbienteGeometrico,
  Parede,
  ParedeId,
  Porta,
  Janela,
  Centimetros,
} from "./tipos";

// ─── PARÂMETROS NORMATIVOS ────────────────────────────────────────────────────

/** Circulação mínima absoluta em cozinha (NBR / ergonomia). Abaixo disso: reprova. */
export const CIRCULACAO_MINIMA_CM: Centimetros = 80;

/** Circulação confortável recomendada. Entre mínima e esta: alerta. */
export const CIRCULACAO_CONFORTAVEL_CM: Centimetros = 90;

/** Largura mínima de um módulo padrão. */
export const LARGURA_MODULO_MIN_CM: Centimetros = 30;

/** Largura máxima de um módulo padrão. */
export const LARGURA_MODULO_MAX_CM: Centimetros = 90;

/** Aproveitamento mínimo aceitável da parede antes de gerar alerta. */
export const APROVEITAMENTO_MIN_PCT = 85;

/** Folga mínima entre o topo do armário aéreo e o teto. */
export const FOLGA_TETO_MIN_CM: Centimetros = 5;

/** Profundidade padrão de gabinete base (espelha biblioteca-cozinha). */
const BASE_PROFUNDIDADE_CM: Centimetros = 55;

// ─── TIPOS DE RESULTADO ───────────────────────────────────────────────────────

export type SeveridadeRegra = "erro" | "alerta" | "info";

export type StatusValidacao = "aprovado" | "aprovado_com_alertas" | "reprovado";

export interface ViolacaoRegra {
  /** Código da regra, ex.: "circulacao_minima". */
  regra: string;
  severidade: SeveridadeRegra;
  /** Mensagem legível para o usuário final. */
  mensagem: string;
  /** ID do módulo afetado, quando aplicável. */
  modulo_id?: string;
  /** Valor encontrado no projeto (cm, %, etc.). */
  valor_encontrado?: number;
  /** Valor esperado/limite da regra. */
  valor_esperado?: number;
}

export interface ResultadoValidacao {
  status: StatusValidacao;
  /** Score 0–100. 100 = projeto perfeito. */
  score: number;
  violacoes: ViolacaoRegra[];
  resumo: {
    erros: number;
    alertas: number;
    infos: number;
    total_regras_avaliadas: number;
  };
  avaliado_em: string;
}

// ─── PESOS DO SCORE ───────────────────────────────────────────────────────────

const PESO_ERRO = 25;
const PESO_ALERTA = 8;

// ─── FUNÇÃO PRINCIPAL ─────────────────────────────────────────────────────────

/**
 * Valida um ProjetoFabricavel contra todas as regras do motor.
 * Função pura — não modifica o projeto.
 *
 * @param projeto - ProjetoFabricavel com ambiente embedded e módulos posicionados
 * @returns ResultadoValidacao com status, score e lista de violações
 */
export function validarProjeto(projeto: ProjetoFabricavel): ResultadoValidacao {
  const ambiente = projeto.ambiente;
  const modulos = projeto.modulos;

  const regras: Array<(p: ProjetoFabricavel, a: AmbienteGeometrico, m: ModuloInstanciado[]) => ViolacaoRegra[]> = [
    regraCirculacaoMinima,
    regraModuloDentroParede,
    regraModuloInvadePorta,
    regraBaseSobJanelaBaixa,
    regraAereoColideTeto,
    regraLarguraModuloValida,
    regraAproveitamentoParede,
    regraPontoHidraulicoAtendido,
  ];

  const violacoes = regras.flatMap((regra) => regra(projeto, ambiente, modulos));

  const erros = violacoes.filter((v) => v.severidade === "erro").length;
  const alertas = violacoes.filter((v) => v.severidade === "alerta").length;
  const infos = violacoes.filter((v) => v.severidade === "info").length;

  const score = Math.max(0, 100 - erros * PESO_ERRO - alertas * PESO_ALERTA);

  const status: StatusValidacao =
    erros > 0 ? "reprovado"
    : alertas > 0 ? "aprovado_com_alertas"
    : "aprovado";

  return {
    status,
    score,
    violacoes,
    resumo: {
      erros,
      alertas,
      infos,
      total_regras_avaliadas: regras.length,
    },
    avaliado_em: new Date().toISOString(),
  };
}

// ─── HELPERS GEOMÉTRICOS ──────────────────────────────────────────────────────

/** Comprimento da parede onde a cozinha foi montada. */
function comprimentoParede(ambiente: AmbienteGeometrico, parede: ParedeId): Centimetros {
  return ambiente.paredes[parede].comprimento_cm;
}

/**
 * Dimensão de circulação à frente da parede usada.
 * Se a cozinha está em top/bottom, a circulação é a profundidade do ambiente;
 * se está em left/right, é a largura.
 */
function dimensaoFrente(ambiente: AmbienteGeometrico, parede: ParedeId): Centimetros {
  return parede === "top" || parede === "bottom"
    ? ambiente.dimensoes.profundidade_cm
    : ambiente.dimensoes.largura_cm;
}

/** Verifica se dois intervalos [a1,a2] e [b1,b2] se sobrepõem. */
function sobrepoe(a1: number, a2: number, b1: number, b2: number): boolean {
  return a1 < b2 && b1 < a2;
}

/** Identifica a parede principal a partir dos módulos base. */
function paredeDosModulos(modulos: ModuloInstanciado[]): ParedeId | null {
  const base = modulos.find((m) => isBase(m));
  return base ? base.parede : null;
}

function isBase(m: ModuloInstanciado): boolean {
  return m.modulo_template_codigo.startsWith("base_");
}

function isAereo(m: ModuloInstanciado): boolean {
  return m.modulo_template_codigo.startsWith("aereo_");
}

// ─── REGRA 1: Circulação mínima ───────────────────────────────────────────────

function regraCirculacaoMinima(
  _p: ProjetoFabricavel,
  ambiente: AmbienteGeometrico,
  modulos: ModuloInstanciado[],
): ViolacaoRegra[] {
  const parede = paredeDosModulos(modulos);
  if (!parede) return [];

  const frente = dimensaoFrente(ambiente, parede);
  const circulacao = frente - BASE_PROFUNDIDADE_CM;

  if (circulacao < CIRCULACAO_MINIMA_CM) {
    return [{
      regra: "circulacao_minima",
      severidade: "erro",
      mensagem: `Circulação de ${circulacao}cm é menor que o mínimo de ${CIRCULACAO_MINIMA_CM}cm. ` +
        `O ambiente é estreito demais para a profundidade dos gabinetes (${BASE_PROFUNDIDADE_CM}cm).`,
      valor_encontrado: circulacao,
      valor_esperado: CIRCULACAO_MINIMA_CM,
    }];
  }

  if (circulacao < CIRCULACAO_CONFORTAVEL_CM) {
    return [{
      regra: "circulacao_minima",
      severidade: "alerta",
      mensagem: `Circulação de ${circulacao}cm está abaixo do recomendado (${CIRCULACAO_CONFORTAVEL_CM}cm). ` +
        `Funcional, mas apertado para dois usuários simultâneos.`,
      valor_encontrado: circulacao,
      valor_esperado: CIRCULACAO_CONFORTAVEL_CM,
    }];
  }

  return [];
}

// ─── REGRA 2: Módulo dentro da parede ─────────────────────────────────────────

function regraModuloDentroParede(
  _p: ProjetoFabricavel,
  ambiente: AmbienteGeometrico,
  modulos: ModuloInstanciado[],
): ViolacaoRegra[] {
  const violacoes: ViolacaoRegra[] = [];

  for (const m of modulos) {
    const comp = comprimentoParede(ambiente, m.parede);
    const fim = m.posicao_x_cm + m.largura_cm;
    if (fim > comp + 0.5) {
      violacoes.push({
        regra: "modulo_dentro_parede",
        severidade: "erro",
        mensagem: `Módulo "${m.nome_display}" termina em ${fim}cm mas a parede tem só ${comp}cm. ` +
          `O módulo ultrapassa o limite físico.`,
        modulo_id: m.id,
        valor_encontrado: fim,
        valor_esperado: comp,
      });
    }
  }

  return violacoes;
}

// ─── REGRA 3: Módulo invade zona de porta ─────────────────────────────────────

function regraModuloInvadePorta(
  _p: ProjetoFabricavel,
  ambiente: AmbienteGeometrico,
  modulos: ModuloInstanciado[],
): ViolacaoRegra[] {
  const violacoes: ViolacaoRegra[] = [];

  for (const m of modulos) {
    const parede = ambiente.paredes[m.parede];
    const portas = parede.aberturas.filter((ab): ab is Porta => ab._tipo === "porta");

    for (const porta of portas) {
      const portaInicio = porta.posicao_cm;
      const portaFim = porta.posicao_cm + porta.largura_cm;
      if (sobrepoe(m.posicao_x_cm, m.posicao_x_cm + m.largura_cm, portaInicio, portaFim)) {
        violacoes.push({
          regra: "modulo_invade_porta",
          severidade: "erro",
          mensagem: `Módulo "${m.nome_display}" (${m.posicao_x_cm}–${m.posicao_x_cm + m.largura_cm}cm) ` +
            `sobrepõe a porta em ${portaInicio}–${portaFim}cm. Bloqueia a passagem.`,
          modulo_id: m.id,
          valor_encontrado: m.posicao_x_cm,
          valor_esperado: portaFim,
        });
      }
    }
  }

  return violacoes;
}

// ─── REGRA 4: Base sob janela baixa ───────────────────────────────────────────

function regraBaseSobJanelaBaixa(
  _p: ProjetoFabricavel,
  ambiente: AmbienteGeometrico,
  modulos: ModuloInstanciado[],
): ViolacaoRegra[] {
  const violacoes: ViolacaoRegra[] = [];

  for (const m of modulos) {
    if (!isBase(m)) continue;
    const parede = ambiente.paredes[m.parede];
    const janelasBaixas = parede.aberturas.filter(
      (ab): ab is Janela => ab._tipo === "janela" && ab.bloqueia_base,
    );

    for (const j of janelasBaixas) {
      if (sobrepoe(m.posicao_x_cm, m.posicao_x_cm + m.largura_cm, j.posicao_cm, j.posicao_cm + j.largura_cm)) {
        violacoes.push({
          regra: "base_sob_janela_baixa",
          severidade: "alerta",
          mensagem: `Gabinete base "${m.nome_display}" está sob janela de peitoril baixo ` +
            `(${j.altura_peitoril_cm}cm). Verifique se a bancada não cobre a janela.`,
          modulo_id: m.id,
          valor_encontrado: j.altura_peitoril_cm,
          valor_esperado: 90,
        });
      }
    }
  }

  return violacoes;
}

// ─── REGRA 5: Aéreo colide com o teto ─────────────────────────────────────────

function regraAereoColideTeto(
  _p: ProjetoFabricavel,
  ambiente: AmbienteGeometrico,
  modulos: ModuloInstanciado[],
): ViolacaoRegra[] {
  const violacoes: ViolacaoRegra[] = [];
  const teto = ambiente.dimensoes.altura_cm;

  for (const m of modulos) {
    if (!isAereo(m)) continue;
    const topo = m.posicao_y_cm + m.altura_cm;

    if (topo > teto + 0.5) {
      violacoes.push({
        regra: "aereo_colide_teto",
        severidade: "erro",
        mensagem: `Armário aéreo "${m.nome_display}" chega a ${topo}cm mas o pé-direito é ${teto}cm. ` +
          `Não cabe na altura disponível.`,
        modulo_id: m.id,
        valor_encontrado: topo,
        valor_esperado: teto,
      });
    } else if (topo > teto - FOLGA_TETO_MIN_CM) {
      violacoes.push({
        regra: "aereo_colide_teto",
        severidade: "alerta",
        mensagem: `Armário aéreo "${m.nome_display}" deixa folga de ${teto - topo}cm até o teto ` +
          `(recomendado ≥ ${FOLGA_TETO_MIN_CM}cm para instalação).`,
        modulo_id: m.id,
        valor_encontrado: teto - topo,
        valor_esperado: FOLGA_TETO_MIN_CM,
      });
    }
  }

  return violacoes;
}

// ─── REGRA 6: Largura de módulo válida ────────────────────────────────────────

function regraLarguraModuloValida(
  _p: ProjetoFabricavel,
  _a: AmbienteGeometrico,
  modulos: ModuloInstanciado[],
): ViolacaoRegra[] {
  const violacoes: ViolacaoRegra[] = [];

  for (const m of modulos) {
    if (m.largura_cm < LARGURA_MODULO_MIN_CM) {
      violacoes.push({
        regra: "largura_modulo_valida",
        severidade: "alerta",
        mensagem: `Módulo "${m.nome_display}" tem ${m.largura_cm}cm, abaixo do mínimo prático de ${LARGURA_MODULO_MIN_CM}cm.`,
        modulo_id: m.id,
        valor_encontrado: m.largura_cm,
        valor_esperado: LARGURA_MODULO_MIN_CM,
      });
    } else if (m.largura_cm > LARGURA_MODULO_MAX_CM) {
      violacoes.push({
        regra: "largura_modulo_valida",
        severidade: "alerta",
        mensagem: `Módulo "${m.nome_display}" tem ${m.largura_cm}cm, acima do máximo de ${LARGURA_MODULO_MAX_CM}cm ` +
          `(porta larga demais empena com o tempo).`,
        modulo_id: m.id,
        valor_encontrado: m.largura_cm,
        valor_esperado: LARGURA_MODULO_MAX_CM,
      });
    }
  }

  return violacoes;
}

// ─── REGRA 7: Aproveitamento da parede ────────────────────────────────────────

function regraAproveitamentoParede(
  _p: ProjetoFabricavel,
  ambiente: AmbienteGeometrico,
  modulos: ModuloInstanciado[],
): ViolacaoRegra[] {
  const parede = paredeDosModulos(modulos);
  if (!parede) return [];

  const bases = modulos.filter(isBase);
  if (bases.length === 0) return [];

  const ocupado = bases.reduce((s, m) => s + m.largura_cm, 0);
  const disponivel = comprimentoParede(ambiente, parede);
  const pct = Math.round((ocupado / disponivel) * 100);

  if (pct < APROVEITAMENTO_MIN_PCT) {
    return [{
      regra: "aproveitamento_parede",
      severidade: "alerta",
      mensagem: `Aproveitamento de ${pct}% da parede (${ocupado}cm de ${disponivel}cm). ` +
        `Sobra de ${disponivel - ocupado}cm pode ser otimizada.`,
      valor_encontrado: pct,
      valor_esperado: APROVEITAMENTO_MIN_PCT,
    }];
  }

  return [];
}

// ─── REGRA 8: Ponto hidráulico atendido ───────────────────────────────────────

function regraPontoHidraulicoAtendido(
  _p: ProjetoFabricavel,
  ambiente: AmbienteGeometrico,
  modulos: ModuloInstanciado[],
): ViolacaoRegra[] {
  const pontos = ambiente.pontos_hidraulicos.filter((ph) => ph.requer_modulo_adjacente);
  if (pontos.length === 0) return [];

  const bases = modulos.filter(isBase);
  const violacoes: ViolacaoRegra[] = [];

  for (const ph of pontos) {
    if (!ph.parede) continue;
    const tolerancia = ph.distancia_max_cm ?? 60;
    // Há um módulo base na parede do ponto, dentro da tolerância da posição?
    const atendido = bases.some((m) => {
      if (m.parede !== ph.parede) return false;
      const centro = m.posicao_x_cm + m.largura_cm / 2;
      // posição do ponto ao longo da parede ≈ ph.posicao.x_cm
      const posPonto = ph.posicao.x_cm;
      return Math.abs(centro - posPonto) <= tolerancia + m.largura_cm / 2;
    });

    if (!atendido) {
      violacoes.push({
        regra: "ponto_hidraulico_atendido",
        severidade: "alerta",
        mensagem: `Ponto hidráulico (${ph.tipo}) não tem gabinete adjacente para receber cuba/pia. ` +
          `Verifique o posicionamento.`,
        valor_esperado: tolerancia,
      });
    }
  }

  return violacoes;
}
