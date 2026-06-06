/**
 * PLANNE — Motor Paramétrico
 * Fase 9: PCP — Planejamento e Controle de Produção
 *
 * Transforma um ProjetoFabricavel + PlanoNesting numa OrdemProducao completa:
 *   - Sequência de etapas como DAG (separação → corte → … → instalação)
 *   - Cronograma com datas via ordenação topológica + dias úteis
 *   - Checklists de qualidade por etapa
 *   - Lista de compras com prazos
 *
 * Princípio: o sequenciamento é determinístico. As dependências entre etapas
 * formam um DAG (Directed Acyclic Graph) — validado contra ciclos.
 */

import type {
  ProjetoFabricavel,
  PlanoNesting,
  OrdemProducao,
  EtapaProducao,
  TipoEtapa,
  ChecklistItem,
  ListaCompras,
  StatusOrdem,
} from "./tipos";

// ─── PARÂMETROS DE TEMPO ──────────────────────────────────────────────────────

/** Parâmetros de produção (espelham a Fase 5; default mercado BR 2026). */
export interface ParametrosPCP {
  horas_uteis_por_dia: number;
  min_separacao_por_chapa: number;
  min_corte_por_peca: number;
  min_bordagem_por_metro: number;
  min_usinagem_por_modulo: number;
  min_montagem_por_modulo: number;
  min_acabamento_por_m2: number;
  min_inspecao_por_modulo: number;
  min_embalagem_por_modulo: number;
  min_instalacao_por_modulo: number;
  /** Pular fins de semana no cronograma? */
  pular_fim_de_semana: boolean;
}

export const PARAMETROS_PCP_PADRAO: ParametrosPCP = {
  horas_uteis_por_dia: 8,
  min_separacao_por_chapa: 5,
  min_corte_por_peca: 3,
  min_bordagem_por_metro: 1.5,
  min_usinagem_por_modulo: 8,
  min_montagem_por_modulo: 25,
  min_acabamento_por_m2: 15,
  min_inspecao_por_modulo: 4,
  min_embalagem_por_modulo: 6,
  min_instalacao_por_modulo: 20,
  pular_fim_de_semana: true,
};

// ─── FUNÇÃO RESPONSÁVEL POR ETAPA ─────────────────────────────────────────────

const FUNCAO_POR_ETAPA: Record<TipoEtapa, string> = {
  separacao_material: "almoxarife",
  corte_cnc: "operador_cnc",
  corte_manual: "cortador",
  bordagem: "operador_coladeira",
  usinagem: "operador_cnc",
  montagem: "montador",
  pintura_laca: "pintor",
  inspecao_qualidade: "inspetor_qualidade",
  embalagem: "auxiliar",
  instalacao_obra: "instalador",
};

// ─── CHECKLISTS PADRÃO ────────────────────────────────────────────────────────

const CHECKLIST_POR_ETAPA: Partial<Record<TipoEtapa, string[]>> = {
  separacao_material: [
    "Conferir chapas por cor e espessura",
    "Conferir ferragens contra a lista",
    "Separar fitas de borda",
  ],
  corte_cnc: [
    "Conferir plano de corte carregado",
    "Validar dimensões da primeira peça",
    "Etiquetar peças cortadas",
  ],
  bordagem: [
    "Conferir cor da fita x cor da chapa",
    "Validar temperatura da coladeira",
    "Inspecionar acabamento das bordas",
  ],
  usinagem: [
    "Conferir posição de furações",
    "Validar furos de dobradiça e minifix",
  ],
  montagem: [
    "Montar corpo e conferir esquadro",
    "Instalar ferragens",
    "Testar abertura de portas e gavetas",
  ],
  inspecao_qualidade: [
    "Conferir dimensões finais",
    "Inspecionar acabamento e fitas",
    "Validar funcionamento de ferragens",
    "Conferir cor e ausência de avarias",
  ],
  embalagem: [
    "Proteger quinas e superfícies",
    "Etiquetar volumes",
    "Conferir contagem de volumes",
  ],
  instalacao_obra: [
    "Conferir nível e prumo",
    "Fixar módulos na parede",
    "Ajustar portas e gavetas",
    "Limpeza final e entrega ao cliente",
  ],
};

function criarChecklist(tipo: TipoEtapa): ChecklistItem[] {
  const itens = CHECKLIST_POR_ETAPA[tipo] ?? [];
  return itens.map((descricao, i) => ({
    id: `chk_${tipo}_${i}`,
    descricao,
    obrigatorio: true,
    concluido: false,
  }));
}

// ─── ESTIMATIVA DE DURAÇÕES ───────────────────────────────────────────────────

interface MetricasProducao {
  num_chapas: number;
  num_pecas: number;
  num_modulos: number;
  metros_fita: number;
  area_frontal_m2: number;
  tem_laca: boolean;
}

function extrairMetricas(projeto: ProjetoFabricavel, plano: PlanoNesting): MetricasProducao {
  return {
    num_chapas: plano.resumo.total_chapas,
    num_pecas: plano.resumo.total_pecas,
    num_modulos: projeto.modulos.length,
    metros_fita: projeto.metricas.metros_fita_borda,
    area_frontal_m2: projeto.metricas.area_frontal_m2,
    tem_laca: projeto.modulos.some((m) => m.material_porta?.acabamento.includes("laca") ?? false),
  };
}

/** Horas de cada tipo de etapa, a partir das métricas do projeto. */
function estimarDuracoes(m: MetricasProducao, p: ParametrosPCP): Record<TipoEtapa, number> {
  const h = (min: number) => Math.round((min / 60) * 100) / 100;
  return {
    separacao_material: h(m.num_chapas * p.min_separacao_por_chapa),
    corte_cnc: h(m.num_pecas * p.min_corte_por_peca),
    corte_manual: 0,
    bordagem: h(m.metros_fita * p.min_bordagem_por_metro),
    usinagem: h(m.num_modulos * p.min_usinagem_por_modulo),
    montagem: h(m.num_modulos * p.min_montagem_por_modulo),
    pintura_laca: m.tem_laca ? h(m.area_frontal_m2 * p.min_acabamento_por_m2) : 0,
    inspecao_qualidade: h(m.num_modulos * p.min_inspecao_por_modulo),
    embalagem: h(m.num_modulos * p.min_embalagem_por_modulo),
    instalacao_obra: h(m.num_modulos * p.min_instalacao_por_modulo),
  };
}

// ─── GERAÇÃO DO DAG DE ETAPAS ─────────────────────────────────────────────────

/**
 * Define a sequência de etapas e suas dependências (DAG).
 * Etapas com duração 0 (ex.: pintura sem laca) são omitidas, e as dependências
 * são reconectadas para manter o grafo válido.
 */
export function gerarEtapasProducao(
  projeto: ProjetoFabricavel,
  plano: PlanoNesting,
  parametros: ParametrosPCP = PARAMETROS_PCP_PADRAO,
): EtapaProducao[] {
  const metricas = extrairMetricas(projeto, plano);
  const duracoes = estimarDuracoes(metricas, parametros);

  // Sequência canônica (cada uma depende da anterior presente).
  const sequencia: { tipo: TipoEtapa; descricao: string }[] = [
    { tipo: "separacao_material", descricao: "Separação de chapas, ferragens e fitas" },
    { tipo: "corte_cnc", descricao: "Corte das peças (CNC / seccionadora)" },
    { tipo: "bordagem", descricao: "Aplicação de fita de borda" },
    { tipo: "usinagem", descricao: "Furações e usinagem de ferragens" },
    { tipo: "montagem", descricao: "Montagem dos módulos" },
    { tipo: "pintura_laca", descricao: "Pintura / laca (acabamento)" },
    { tipo: "inspecao_qualidade", descricao: "Inspeção de qualidade" },
    { tipo: "embalagem", descricao: "Embalagem e proteção" },
    { tipo: "instalacao_obra", descricao: "Instalação na obra" },
  ];

  // Filtrar etapas com duração > 0 (ou sempre presentes como separação/montagem/inspeção)
  const sempre: TipoEtapa[] = ["separacao_material", "corte_cnc", "montagem", "inspecao_qualidade", "embalagem", "instalacao_obra"];
  const presentes = sequencia.filter(
    (s) => sempre.includes(s.tipo) || duracoes[s.tipo] > 0,
  );

  const etapas: EtapaProducao[] = [];
  let idAnterior: string | null = null;

  presentes.forEach((s, i) => {
    const id = `etapa_${i + 1}_${s.tipo}`;
    etapas.push({
      id,
      tipo: s.tipo,
      ordem: i + 1,
      descricao: s.descricao,
      duracao_estimada_horas: Math.max(0.25, duracoes[s.tipo]),
      depende_de: idAnterior ? [idAnterior] : [],
      funcao_responsavel: FUNCAO_POR_ETAPA[s.tipo],
      status: idAnterior ? "bloqueada" : "pendente",
      checklist: criarChecklist(s.tipo),
    });
    idAnterior = id;
  });

  return etapas;
}

// ─── VALIDAÇÃO DO DAG (sem ciclos) ────────────────────────────────────────────

/** Retorna true se as etapas formam um DAG válido (sem ciclos). */
export function validarDAG(etapas: EtapaProducao[]): boolean {
  const visitado = new Map<string, number>(); // 0=não, 1=visitando, 2=ok
  const porId = new Map(etapas.map((e) => [e.id, e]));

  const dfs = (id: string): boolean => {
    const estado = visitado.get(id) ?? 0;
    if (estado === 1) return false; // ciclo
    if (estado === 2) return true;
    visitado.set(id, 1);
    const etapa = porId.get(id);
    if (etapa) {
      for (const dep of etapa.depende_de) {
        if (!dfs(dep)) return false;
      }
    }
    visitado.set(id, 2);
    return true;
  };

  return etapas.every((e) => dfs(e.id));
}

// ─── ORDENAÇÃO TOPOLÓGICA ─────────────────────────────────────────────────────

/** Ordena as etapas topologicamente (dependências antes dos dependentes). */
export function ordenarTopologicamente(etapas: EtapaProducao[]): EtapaProducao[] {
  const porId = new Map(etapas.map((e) => [e.id, e]));
  const visitado = new Set<string>();
  const ordenado: EtapaProducao[] = [];

  const visitar = (e: EtapaProducao) => {
    if (visitado.has(e.id)) return;
    visitado.add(e.id);
    for (const dep of e.depende_de) {
      const d = porId.get(dep);
      if (d) visitar(d);
    }
    ordenado.push(e);
  };

  for (const e of etapas) visitar(e);
  return ordenado;
}

// ─── CRONOGRAMA (datas) ───────────────────────────────────────────────────────

export interface EtapaAgendada extends EtapaProducao {
  data_inicio_planejada: string;
  data_conclusao_planejada: string;
}

/** Avança N horas úteis a partir de uma data, respeitando jornada e fins de semana. */
function avancarHorasUteis(inicio: Date, horas: number, p: ParametrosPCP): Date {
  const d = new Date(inicio);
  let restante = horas;

  while (restante > 0) {
    // Pular fim de semana
    if (p.pular_fim_de_semana && (d.getDay() === 0 || d.getDay() === 6)) {
      d.setDate(d.getDate() + 1);
      d.setHours(8, 0, 0, 0);
      continue;
    }
    const horasNoDia = Math.min(restante, p.horas_uteis_por_dia);
    restante -= horasNoDia;
    if (restante > 0) {
      d.setDate(d.getDate() + 1);
      d.setHours(8, 0, 0, 0);
    } else {
      d.setHours(d.getHours() + Math.ceil(horasNoDia));
    }
  }
  return d;
}

/**
 * Calcula o cronograma: atribui data de início e conclusão a cada etapa,
 * respeitando as dependências (uma etapa só começa após as suas dependências).
 */
export function calcularCronograma(
  etapas: EtapaProducao[],
  dataInicio: Date,
  parametros: ParametrosPCP = PARAMETROS_PCP_PADRAO,
): EtapaAgendada[] {
  const ordenadas = ordenarTopologicamente(etapas);
  const conclusao = new Map<string, Date>();
  const agendadas: EtapaAgendada[] = [];

  for (const etapa of ordenadas) {
    // Início = max(conclusão das dependências) ou dataInicio
    let inicio = new Date(dataInicio);
    for (const dep of etapa.depende_de) {
      const fimDep = conclusao.get(dep);
      if (fimDep && fimDep > inicio) inicio = new Date(fimDep);
    }

    const fim = avancarHorasUteis(inicio, etapa.duracao_estimada_horas, parametros);
    conclusao.set(etapa.id, fim);

    agendadas.push({
      ...etapa,
      data_inicio_planejada: inicio.toISOString(),
      data_conclusao_planejada: fim.toISOString(),
    });
  }

  // Devolver na ordem original (por `ordem`)
  return agendadas.sort((a, b) => a.ordem - b.ordem);
}

// ─── ORDEM DE PRODUÇÃO COMPLETA ───────────────────────────────────────────────

export interface OpcoesOrdemProducao {
  numero?: string;
  orcamento_id?: string;
  empresa_id?: string;
  criado_por?: string;
  data_inicio?: Date;
  lista_compras?: ListaCompras;
  parametros?: ParametrosPCP;
}

export interface ResultadoPCP {
  ordem: OrdemProducao;
  etapas_agendadas: EtapaAgendada[];
  dag_valido: boolean;
  duracao_total_horas: number;
  prazo_dias_uteis: number;
}

/**
 * Gera a OrdemProducao completa a partir do projeto e do plano de corte.
 */
export function gerarOrdemProducao(
  projeto: ProjetoFabricavel,
  plano: PlanoNesting,
  opcoes: OpcoesOrdemProducao = {},
): ResultadoPCP {
  const parametros = opcoes.parametros ?? PARAMETROS_PCP_PADRAO;
  const dataInicio = opcoes.data_inicio ?? proximoDiaUtil(new Date());

  const etapas = gerarEtapasProducao(projeto, plano, parametros);
  const dag_valido = validarDAG(etapas);
  const agendadas = calcularCronograma(etapas, dataInicio, parametros);

  const duracaoTotal = etapas.reduce((s, e) => s + e.duracao_estimada_horas, 0);
  const dataEntrega = agendadas.length > 0
    ? new Date(agendadas[agendadas.length - 1].data_conclusao_planejada)
    : dataInicio;
  const prazoDias = Math.max(1, Math.ceil((dataEntrega.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)));

  const listaComprasVazia: ListaCompras = {
    itens: [],
    resumo: { itens_em_estoque: 0, itens_para_comprar: 0, custo_total_estimado: 0, prazo_max_entrega_dias: 0 },
    pedidos_sugeridos: [],
    gerado_em: new Date().toISOString(),
  };

  const ordem: OrdemProducao = {
    id: `op_${Date.now()}`,
    numero: opcoes.numero ?? `OP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    empresa_id: opcoes.empresa_id ?? projeto.empresa_id,
    orcamento_id: opcoes.orcamento_id ?? "",
    projeto,
    plano_corte: plano,
    lista_compras: opcoes.lista_compras ?? listaComprasVazia,
    etapas: agendadas,
    data_inicio_planejada: dataInicio.toISOString(),
    data_entrega_prometida: dataEntrega.toISOString(),
    status: "aguardando_material" as StatusOrdem,
    historico_status: [{
      de: "aguardando_material",
      para: "aguardando_material",
      em: new Date().toISOString(),
      por: opcoes.criado_por ?? "motor_parametrico",
      nota: "Ordem de produção gerada pelo PCP.",
    }],
    observacoes: `${etapas.length} etapas · ${Math.round(duracaoTotal)}h de produção · prazo ${prazoDias} dias`,
    criado_em: new Date().toISOString(),
    criado_por: opcoes.criado_por ?? "motor_parametrico",
  };

  return {
    ordem,
    etapas_agendadas: agendadas,
    dag_valido,
    duracao_total_horas: Math.round(duracaoTotal * 100) / 100,
    prazo_dias_uteis: prazoDias,
  };
}

// ─── HELPER ───────────────────────────────────────────────────────────────────

function proximoDiaUtil(data: Date): Date {
  const d = new Date(data);
  d.setHours(8, 0, 0, 0);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}
