/**
 * PLANNE — Motor Paramétrico
 * Fase 5: Orçamento Inteligente — Engenharia de Custos
 *
 * Calcula o custo COMPLETO de um projeto, não apenas o material direto:
 *   material + produção + instalação + indiretos → preço de venda + margem real
 *
 * - calcularOrcamentoCompleto: decompõe o custo em todas as camadas
 * - gerarTresVersoes: produz econômica / intermediária / premium
 *
 * Princípio da Vision: "Todo cálculo deve ser auditável."
 * Funções puras. Os parâmetros de custo vêm de ConfiguracaoCusto (defaults de
 * mercado BR 2026); em produção, cada empresa sobrescreve com seus valores.
 */

import type {
  ProjetoFabricavel,
  CustoMateriais,
  CustoProducao,
  CustoInstalacao,
  CustosIndiretos,
  AnaliseFinanceira,
  LinhaMaterial,
  LinhaProducao,
  ItemOrcamento,
  VersaoComercial,
  TipoFerragem,
} from "./tipos";
import { gerarEngenharia, consolidarFerragens } from "./engenharia";

// ─── PREÇOS DE REFERÊNCIA DE FERRAGEM (R$/un, BR 2026) ────────────────────────
// O motor cria ferragens sem preço (preco_custo_unit = 0); aqui é onde os
// custos são atribuídos. Cada empresa pode sobrescrever via catálogo futuro.
const PRECO_FERRAGEM_REF: Record<TipoFerragem, number> = {
  dobradica_35mm_110grau: 4.5,
  dobradica_35mm_165grau: 8.0,
  dobradica_push_open: 12.0,
  corredicao_tandem_300mm: 35.0,
  corredicao_tandem_400mm: 45.0,
  corredicao_tandem_500mm: 55.0,
  corredicao_lateral_porta: 80.0,
  puxador_perfil_alu_1200mm: 45.0,
  puxador_alu_128mm: 12.0,
  puxador_push_open: 0,
  ajustador_pe_100mm: 3.5,
  ajustador_pe_150mm: 4.5,
  rodape_pvc_100mm: 18.0,
  cabideiro_simples: 25.0,
  perfil_led_1m: 60.0,
  amortecedor_soft_close: 8.0,
  minifix_15mm: 0.8,
  cavilha_8x30mm: 0.15,
};

// ─── CONFIGURAÇÃO DE CUSTO (por empresa) ──────────────────────────────────────

/**
 * Parâmetros de custo de uma marcenaria.
 * Defaults refletem médias de mercado BR 2026 — cada empresa sobrescreve.
 */
export interface ConfiguracaoCusto {
  // Mão de obra (R$/hora por etapa)
  valor_hora_corte: number;
  valor_hora_bordagem: number;
  valor_hora_usinagem: number;
  valor_hora_montagem: number;
  valor_hora_acabamento: number;

  // Tempos unitários (minutos)
  min_por_peca_corte: number;
  min_por_metro_fita: number;
  min_por_modulo_usinagem: number;
  min_por_modulo_montagem: number;
  min_por_m2_acabamento: number;

  // Instalação
  valor_hora_instalacao: number;
  min_por_modulo_instalacao: number;
  custo_por_km: number;
  distancia_padrao_km: number;

  // Indiretos
  overhead_pct: number;          // % sobre (material + produção)
  regime_tributario: string;
  aliquota_imposto_pct: number;  // % sobre o preço de venda
  comissao_pct: number;          // % sobre o preço de venda

  // Comercial
  margem_desejada_pct: number;   // markup sobre o custo total
  desperdicio_material_pct: number;
}

/** Configuração padrão — médias de mercado BR 2026. */
export const CONFIG_CUSTO_PADRAO: ConfiguracaoCusto = {
  valor_hora_corte: 45,
  valor_hora_bordagem: 40,
  valor_hora_usinagem: 50,
  valor_hora_montagem: 55,
  valor_hora_acabamento: 60,

  min_por_peca_corte: 3,
  min_por_metro_fita: 1.5,
  min_por_modulo_usinagem: 8,
  min_por_modulo_montagem: 25,
  min_por_m2_acabamento: 15,

  valor_hora_instalacao: 65,
  min_por_modulo_instalacao: 20,
  custo_por_km: 2.5,
  distancia_padrao_km: 20,

  overhead_pct: 18,
  regime_tributario: "Simples Nacional",
  aliquota_imposto_pct: 6,
  comissao_pct: 5,

  margem_desejada_pct: 45,
  desperdicio_material_pct: 15,
};

// ─── MULTIPLICADORES DE VERSÃO ────────────────────────────────────────────────

/**
 * Cada versão comercial ajusta ferragem, material e margem.
 * Aplicados sobre o custo base do projeto.
 */
interface AjusteVersao {
  mult_ferragem: number;   // ferragem mais cara em versões superiores
  mult_material: number;   // 18mm vs 15mm, acabamentos melhores
  margem_pct: number;      // margem desejada da versão
  rotulo: string;
}

const AJUSTES_VERSAO: Record<VersaoComercial, AjusteVersao> = {
  economica:     { mult_ferragem: 1.0, mult_material: 1.0,  margem_pct: 35, rotulo: "Econômica — ferragem nacional, MDF 15mm" },
  intermediaria: { mult_ferragem: 1.5, mult_material: 1.1,  margem_pct: 45, rotulo: "Intermediária — ferragem reforçada, acabamento premium" },
  premium:       { mult_ferragem: 2.4, mult_material: 1.35, margem_pct: 58, rotulo: "Premium — ferragem Blum/Häfele, MDF 18mm, soft-close" },
};

// ─── RESULTADO ────────────────────────────────────────────────────────────────

export interface OrcamentoCompleto {
  versao: VersaoComercial;
  custo_materiais: CustoMateriais;
  custo_producao: CustoProducao;
  custo_instalacao: CustoInstalacao;
  custos_indiretos: CustosIndiretos;
  analise_financeira: AnaliseFinanceira;
  itens: ItemOrcamento[];
  prazo_producao_dias: number;
  prazo_instalacao_dias: number;
  gerado_em: string;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function arredondar(v: number, casas = 2): number {
  const f = 10 ** casas;
  return Math.round(v * f) / f;
}

function linhaProducao(horas: number, valorHora: number): LinhaProducao {
  // Arredonda horas primeiro e calcula o total a partir delas, garantindo
  // a consistência interna: horas_estimadas × valor_hora === total.
  const horasArred = arredondar(horas, 2);
  return {
    horas_estimadas: horasArred,
    valor_hora: valorHora,
    total: arredondar(horasArred * valorHora),
  };
}

/** Custo de ferragens do projeto usando a tabela de preços de referência. */
function custoFerragensReferencia(projeto: ProjetoFabricavel): number {
  const consolidadas = consolidarFerragens(projeto);
  return consolidadas.reduce(
    (s, f) => s + f.quantidade_total * (PRECO_FERRAGEM_REF[f.tipo] ?? 0),
    0,
  );
}

// ─── CÁLCULO DE MATERIAIS ─────────────────────────────────────────────────────

function calcularCustoMateriais(
  projeto: ProjetoFabricavel,
  cfg: ConfiguracaoCusto,
  ajuste: AjusteVersao,
): CustoMateriais {
  const eng = gerarEngenharia(projeto);

  const linhas: LinhaMaterial[] = eng.materiais.map((m) => ({
    descricao: `${m.material_nome} (${m.espessura_mm}mm)`,
    material_id: `mat_${m.espessura_mm}mm`,
    quantidade: m.chapas_necessarias,
    unidade: "chapa" as const,
    preco_custo_unit: arredondar(m.preco_custo_chapa * ajuste.mult_material),
    total: arredondar(m.chapas_necessarias * m.preco_custo_chapa * ajuste.mult_material),
  }));

  // Fita de borda como linha de material
  const custoFitaMetro = 3.5; // R$/m referência
  linhas.push({
    descricao: "Fita de borda",
    material_id: "fita_borda",
    quantidade: eng.fita_borda.metros_com_desperdicio,
    unidade: "m",
    preco_custo_unit: custoFitaMetro,
    total: arredondar(eng.fita_borda.metros_com_desperdicio * custoFitaMetro),
  });

  const subtotal_chapas = arredondar(linhas.reduce((s, l) => s + l.total, 0));
  const subtotal_ferragens = arredondar(custoFerragensReferencia(projeto) * ajuste.mult_ferragem);

  return {
    linhas,
    subtotal_chapas,
    subtotal_ferragens,
    desperdicio_pct: cfg.desperdicio_material_pct,
    total: arredondar(subtotal_chapas + subtotal_ferragens),
  };
}

// ─── CÁLCULO DE PRODUÇÃO ──────────────────────────────────────────────────────

function calcularCustoProducao(
  projeto: ProjetoFabricavel,
  cfg: ConfiguracaoCusto,
): CustoProducao {
  const eng = gerarEngenharia(projeto);
  const numModulos = projeto.modulos.length;
  const numPecas = eng.resumo.num_pecas_total;
  const metrosFita = eng.fita_borda.metros_com_desperdicio;
  const areaFrontal = projeto.metricas.area_frontal_m2;

  const h = (min: number) => min / 60;

  const corte_cnc = linhaProducao(h(numPecas * cfg.min_por_peca_corte), cfg.valor_hora_corte);
  const bordagem = linhaProducao(h(metrosFita * cfg.min_por_metro_fita), cfg.valor_hora_bordagem);
  const usinagem = linhaProducao(h(numModulos * cfg.min_por_modulo_usinagem), cfg.valor_hora_usinagem);
  const montagem = linhaProducao(h(numModulos * cfg.min_por_modulo_montagem), cfg.valor_hora_montagem);
  const acabamento = linhaProducao(h(areaFrontal * cfg.min_por_m2_acabamento), cfg.valor_hora_acabamento);

  const subtotal = arredondar(
    corte_cnc.total + bordagem.total + usinagem.total + montagem.total + acabamento.total,
  );

  return { corte_cnc, bordagem, usinagem, montagem, acabamento, subtotal };
}

// ─── CÁLCULO DE INSTALAÇÃO ────────────────────────────────────────────────────

function calcularCustoInstalacao(
  projeto: ProjetoFabricavel,
  cfg: ConfiguracaoCusto,
): CustoInstalacao {
  const numModulos = projeto.modulos.length;
  const horas = (numModulos * cfg.min_por_modulo_instalacao) / 60;
  const custoMaoObra = horas * cfg.valor_hora_instalacao;
  const custoDeslocamento = cfg.distancia_padrao_km * 2 * cfg.custo_por_km; // ida e volta

  return {
    horas_equipe: arredondar(horas, 2),
    valor_hora: cfg.valor_hora_instalacao,
    distancia_km: cfg.distancia_padrao_km,
    custo_por_km: cfg.custo_por_km,
    subtotal: arredondar(custoMaoObra + custoDeslocamento),
  };
}

// ─── CUSTOS INDIRETOS ─────────────────────────────────────────────────────────

function calcularCustosIndiretos(
  baseDirecta: number,
  precoVendaEstimado: number,
  cfg: ConfiguracaoCusto,
): CustosIndiretos {
  const overheadTotal = arredondar(baseDirecta * (cfg.overhead_pct / 100));
  const impostoTotal = arredondar(precoVendaEstimado * (cfg.aliquota_imposto_pct / 100));
  const comissaoTotal = arredondar(precoVendaEstimado * (cfg.comissao_pct / 100));

  return {
    overhead: { pct: cfg.overhead_pct, base: baseDirecta, total: overheadTotal },
    impostos: {
      regime: cfg.regime_tributario,
      aliquota_pct: cfg.aliquota_imposto_pct,
      base: precoVendaEstimado,
      total: impostoTotal,
    },
    comissao: { pct: cfg.comissao_pct, base: precoVendaEstimado, total: comissaoTotal },
    subtotal: arredondar(overheadTotal + impostoTotal + comissaoTotal),
  };
}

// ─── ITENS COMERCIAIS ─────────────────────────────────────────────────────────

function gerarItensComerciais(
  projeto: ProjetoFabricavel,
  custoTotal: number,
  precoVenda: number,
): ItemOrcamento[] {
  const fatorVenda = custoTotal > 0 ? precoVenda / custoTotal : 1;
  // Distribuir o preço proporcionalmente à área frontal de cada módulo
  const areaTotal = projeto.modulos.reduce((s, m) => s + (m.largura_cm * m.altura_cm), 0) || 1;

  return projeto.modulos.map((m, i) => {
    const peso = (m.largura_cm * m.altura_cm) / areaTotal;
    const custoModulo = arredondar(custoTotal * peso);
    const precoModulo = arredondar(custoModulo * fatorVenda);
    return {
      id: `item_${m.id}`,
      modulo_instanciado_id: m.id,
      ordem: i,
      descricao: m.nome_display,
      quantidade: 1,
      unidade: "un" as const,
      preco_custo: custoModulo,
      preco_unitario: precoModulo,
      total: precoModulo,
      observacao: `${m.largura_cm}×${m.altura_cm}×${m.profundidade_cm}cm`,
    };
  });
}

// ─── FUNÇÃO PRINCIPAL ─────────────────────────────────────────────────────────

/**
 * Calcula o orçamento completo de um projeto para uma versão comercial.
 *
 * @param projeto - ProjetoFabricavel com módulos e peças derivadas
 * @param versao  - econômica / intermediária / premium
 * @param config  - parâmetros de custo da empresa (default: mercado BR 2026)
 */
export function calcularOrcamentoCompleto(
  projeto: ProjetoFabricavel,
  versao: VersaoComercial = "intermediaria",
  config: ConfiguracaoCusto = CONFIG_CUSTO_PADRAO,
): OrcamentoCompleto {
  const ajuste = AJUSTES_VERSAO[versao];

  const custo_materiais = calcularCustoMateriais(projeto, config, ajuste);
  const custo_producao = calcularCustoProducao(projeto, config);
  const custo_instalacao = calcularCustoInstalacao(projeto, config);

  // Base direta = material + produção + instalação
  const baseDirecta = arredondar(
    custo_materiais.total + custo_producao.subtotal + custo_instalacao.subtotal,
  );

  // Markup pela margem da versão para estimar preço de venda
  const margemPct = ajuste.margem_pct;
  // preço de venda preliminar (antes de impostos/comissão) via markup sobre base+overhead
  const overheadPreliminar = baseDirecta * (config.overhead_pct / 100);
  const custoComOverhead = baseDirecta + overheadPreliminar;
  const precoVendaPreliminar = custoComOverhead / (1 - margemPct / 100);

  const custos_indiretos = calcularCustosIndiretos(baseDirecta, precoVendaPreliminar, config);

  const custo_total = arredondar(baseDirecta + custos_indiretos.subtotal);

  // Preço de venda final: custo total com markup de margem
  const preco_venda = arredondar(custo_total / (1 - margemPct / 100));
  const preco_minimo = arredondar(custo_total * 1.05);
  const lucro_bruto = arredondar(preco_venda - custo_total);
  const lucro_pct = preco_venda > 0 ? arredondar((lucro_bruto / preco_venda) * 100, 1) : 0;

  const analise_financeira: AnaliseFinanceira = {
    custo_total,
    margem_desejada_pct: margemPct,
    preco_venda,
    preco_minimo,
    lucro_bruto,
    lucro_pct,
    roi_estimado_dias: 0,
  };

  const itens = gerarItensComerciais(projeto, custo_total, preco_venda);

  // Prazos heurísticos
  const horasProducao = custo_producao.corte_cnc.horas_estimadas +
    custo_producao.bordagem.horas_estimadas +
    custo_producao.usinagem.horas_estimadas +
    custo_producao.montagem.horas_estimadas +
    custo_producao.acabamento.horas_estimadas;
  const prazo_producao_dias = Math.max(3, Math.ceil(horasProducao / 8));
  const prazo_instalacao_dias = Math.max(1, Math.ceil(custo_instalacao.horas_equipe / 8));

  return {
    versao,
    custo_materiais,
    custo_producao,
    custo_instalacao,
    custos_indiretos,
    analise_financeira,
    itens,
    prazo_producao_dias,
    prazo_instalacao_dias,
    gerado_em: new Date().toISOString(),
  };
}

// ─── TRÊS VERSÕES ─────────────────────────────────────────────────────────────

export interface TresVersoes {
  economica: OrcamentoCompleto;
  intermediaria: OrcamentoCompleto;
  premium: OrcamentoCompleto;
  comparativo: {
    preco_economica: number;
    preco_intermediaria: number;
    preco_premium: number;
  };
}

/**
 * Gera as 3 versões comerciais do mesmo projeto para o cliente comparar.
 * As três usam o mesmo layout; variam ferragem, material e margem.
 */
export function gerarTresVersoes(
  projeto: ProjetoFabricavel,
  config: ConfiguracaoCusto = CONFIG_CUSTO_PADRAO,
): TresVersoes {
  const economica = calcularOrcamentoCompleto(projeto, "economica", config);
  const intermediaria = calcularOrcamentoCompleto(projeto, "intermediaria", config);
  const premium = calcularOrcamentoCompleto(projeto, "premium", config);

  return {
    economica,
    intermediaria,
    premium,
    comparativo: {
      preco_economica: economica.analise_financeira.preco_venda,
      preco_intermediaria: intermediaria.analise_financeira.preco_venda,
      preco_premium: premium.analise_financeira.preco_venda,
    },
  };
}
