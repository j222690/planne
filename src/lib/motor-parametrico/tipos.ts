/**
 * PLANNE — Motor Paramétrico
 * Fase 1: Fundação — Entidades Centrais
 *
 * Estas interfaces são o núcleo do sistema conforme definido em PLANNE_VISION.md.
 * TODA funcionalidade futura deve ser construída sobre estas entidades.
 * Nunca modificar sem aprovação do arquiteto principal.
 */

// ─── PRIMITIVOS ───────────────────────────────────────────────────────────────

export type Milimetros = number;
export type Centimetros = number;
export type MetrosQuadrados = number;

export interface Ponto2D {
  x_cm: Centimetros;
  y_cm: Centimetros;
}

export interface Retangulo2D {
  origem: Ponto2D;
  largura_cm: Centimetros;
  profundidade_cm: Centimetros;
}

/** Espessuras válidas de MDF/MDP no mercado brasileiro (mm). */
export type EspessuraMDF = 3 | 6 | 9 | 12 | 15 | 18 | 25;

export type DirecaoFio = "paralelo_largura" | "paralelo_comprimento" | "indiferente";

export interface FitaBorda {
  esquerda: boolean;
  direita: boolean;
  topo: boolean;
  base: boolean;
}

/**
 * Convenção das 4 paredes (vista de cima):
 *   top    = parede de fundo
 *   bottom = parede da entrada
 *   left   = parede esquerda
 *   right  = parede direita
 */
export type ParedeId = "top" | "bottom" | "left" | "right";

/** Tolerância de serra circular — desconto aplicado em largura_final e comprimento_final. */
export const TOLERANCIA_SERRA_MM: Milimetros = 3;

/** Comprimento máximo de peça processável no CNC padrão. */
export const MAX_PECA_MM: Milimetros = 2690;

/** Área útil de uma chapa padrão 2750×1830mm. */
export const AREA_CHAPA_M2: MetrosQuadrados = 2.750 * 1.830;

/** Espessura padrão do corpo do móvel. */
export const ESP_CORPO_MM: EspessuraMDF = 15;

/** Espessura padrão do fundo do gabinete. */
export const ESP_FUNDO_MM: EspessuraMDF = 6;

// ─── MATERIAL ─────────────────────────────────────────────────────────────────

/**
 * Material: representa uma chapa física com propriedades e preços.
 * Referência à tabela `materiais` da empresa.
 * Imutável após ser referenciado em uma Peca ou Orcamento.
 */
export interface Material {
  id: string;
  codigo: string;
  nome_display: string;
  espessura_mm: EspessuraMDF;
  largura_chapa_mm: Milimetros;
  comprimento_chapa_mm: Milimetros;
  area_chapa_m2: MetrosQuadrados;
  cor_hex: string;
  acabamento: "melamina" | "laca_uv" | "laca_pu" | "pvc" | "folha_natural" | "cru";
  preco_custo_chapa: number;
  preco_venda_chapa: number;
  fornecedor_id?: string;
}

// ─── AMBIENTE GEOMÉTRICO ──────────────────────────────────────────────────────

/**
 * AmbienteGeometrico: representação normalizada de um espaço físico.
 *
 * Responsabilidade: ser a "planta digitalizada" consumida pelo motor.
 * Contém APENAS geometria e elementos estruturais.
 *
 * IMUTÁVEL após extração. Alterações no espaço geram um novo AmbienteGeometrico.
 *
 * Invariantes:
 *   - paredes.top.comprimento_cm === paredes.bottom.comprimento_cm
 *   - paredes.left.comprimento_cm === paredes.right.comprimento_cm
 *   - dimensoes.area_m2 === (largura_cm × profundidade_cm) / 10_000
 */
export interface AmbienteGeometrico {
  id: string;
  dimensoes: {
    largura_cm: Centimetros;
    profundidade_cm: Centimetros;
    altura_cm: Centimetros;
    area_m2: MetrosQuadrados;
  };
  paredes: Record<ParedeId, Parede>;
  obstaculos: Obstaculo[];
  pontos_eletricos: PontoEletrico[];
  pontos_hidraulicos: PontoHidraulico[];
  fonte: "imagem" | "foto" | "dwg" | "pdf" | "manual";
  escala_detectada: string | null;
  confianca_extracao: number;
  imagem_original_url?: string;
  extraido_em: string;
}

// ─── PAREDE ───────────────────────────────────────────────────────────────────

/**
 * Parede: superfície física com elementos e espaços disponíveis.
 *
 * segmentos_livres é DERIVADO — calculado por calcularSegmentosLivres().
 * Nunca armazenar diretamente; recalcular quando aberturas mudam.
 */
export interface Parede {
  id: ParedeId;
  comprimento_cm: Centimetros;
  espessura_cm: Centimetros;
  altura_cm: Centimetros;
  aberturas: Abertura[];
  segmentos_livres: SegmentoLivre[];
  obstaculos_adjacentes: string[];
}

export interface SegmentoLivre {
  inicio_cm: Centimetros;
  fim_cm: Centimetros;
  comprimento_cm: Centimetros;
  altura_util_cm: Centimetros;
  bloqueado_por_janela_baixa: boolean;
}

// ─── ABERTURA (PORTA | JANELA) ────────────────────────────────────────────────

export type Abertura = Porta | Janela;

interface AberturaBase {
  id: string;
  parede: ParedeId;
  posicao_cm: Centimetros;
  largura_cm: Centimetros;
}

/**
 * Porta: vão de porta com implicações de circulação.
 * zona_exclusao_cm: espaço necessário para o giro da folha.
 */
export interface Porta extends AberturaBase {
  _tipo: "porta";
  subtipo: "simples" | "dupla" | "correr" | "pivotante" | "balcao";
  altura_cm: Centimetros;
  zona_exclusao_cm: Centimetros;
  lado_dobradica: "esquerda" | "direita";
  sentido_abertura: "para_dentro" | "para_fora";
}

/**
 * Janela: vão de janela que condiciona a altura de móveis aéreos e bases.
 * bloqueia_base: peitoril < 90cm → impede gabinetes base
 * bloqueia_aereo: verga alta → impede armários aéreos nessa faixa
 */
export interface Janela extends AberturaBase {
  _tipo: "janela";
  subtipo: "abrir" | "maxim_ar" | "correr" | "fixa" | "basculante";
  altura_peitoril_cm: Centimetros;
  altura_verga_cm: Centimetros;
  bloqueia_base: boolean;
  bloqueia_aereo: boolean;
}

// ─── OBSTÁCULO ────────────────────────────────────────────────────────────────

export type TipoObstaculo =
  | "pilar"
  | "viga"
  | "shaft"
  | "duto_hidraulico"
  | "duto_eletrico"
  | "prumada";

export interface Obstaculo {
  id: string;
  tipo: TipoObstaculo;
  posicao: Retangulo2D;
  altura_livre_cm?: Centimetros;
  parede_adjacente?: ParedeId;
  recuo_lateral_cm?: Centimetros;
  descricao?: string;
}

export interface PontoEletrico {
  id: string;
  tipo: "tomada_simples" | "tomada_dupla" | "tomada_alta" | "interruptor" | "ar_condicionado";
  parede: ParedeId;
  posicao_ao_longo_cm: Centimetros;
  altura_piso_cm: Centimetros;
  requer_furo_passagem: boolean;
}

export interface PontoHidraulico {
  id: string;
  tipo: "entrada_fria" | "entrada_quente" | "saida_esgoto" | "ralo" | "gas";
  posicao: Ponto2D;
  parede?: ParedeId;
  requer_modulo_adjacente: boolean;
  distancia_max_cm?: Centimetros;
}

// ─── MÓDULO PARAMÉTRICO (TEMPLATE) ───────────────────────────────────────────

/**
 * ModuloParametrico: template reutilizável que define REGRAS de construção.
 * NÃO representa um móvel específico — define como construir um tipo de módulo.
 *
 * IMUTÁVEL após publicação. Novas versões criam novo id.
 * A lógica de calcularPecas() aplica as RegraCorte[] a uma instância concreta.
 */
export type CategoriaAmbiente =
  | "cozinha" | "quarto" | "closet" | "banheiro"
  | "sala" | "lavanderia" | "escritorio" | "area_gourmet";

export type TipoModulo =
  | "base" | "aereo" | "torre" | "ilha"
  | "despenseiro" | "paneleiro" | "gaveta_bloco"
  | "roupeiro" | "cabideiro" | "sapateira"
  | "rack_tv" | "estante" | "escrivaninha" | "aparador"
  | "bancada" | "espelheira" | "nicho" | "painel_ripado";

export interface ModuloParametrico {
  id: string;
  codigo: string;
  nome: string;
  versao: number;
  categorias: CategoriaAmbiente[];
  tipo: TipoModulo;
  largura: DimensaoParametrica;
  altura: DimensaoParametrica;
  profundidade: DimensaoParametrica;
  configuracao_padrao: ConfiguracaoModulo;
  limites: LimitesConfiguracao;
  regras_pecas: RegraCorte[];
  regras_ferragens: RegraFerragem[];
  restricoes_placement: RestricaoPlacement;
  norma_referencia?: string;
  altura_trabalho_cm?: Centimetros;
  ativo: boolean;
  publicado_em: string;
}

export interface DimensaoParametrica {
  min_cm: Centimetros;
  max_cm: Centimetros;
  padrao_cm: Centimetros;
  passo_cm: Centimetros;
}

export interface ConfiguracaoModulo {
  tipo_porta: "dobradica" | "correr" | "basculante" | "aberta" | "vidro" | "espelho" | "ripado";
  num_portas: number;
  num_prateleiras: number;
  num_gavetas: number;
  num_divisorias: number;
  tem_cabideiro: boolean;
  tem_fundo: boolean;
  espessura_fundo_mm: 6 | 3;
  tem_rodape: boolean;
  altura_rodape_cm: Centimetros;
  tem_pes_regulaveis: boolean;
  altura_pes_cm: Centimetros;
  tem_roda_teto: boolean;
  altura_teto_cm?: Centimetros;
  tem_iluminacao_led: boolean;
  tem_espelho_interno: boolean;
  tem_ripado: boolean;
  ripa_largura_mm?: Milimetros;
  ripa_espessura_mm?: Milimetros;
  espessura_corpo_mm: 15 | 18;
  espessura_porta_mm: 15 | 18;
  ferragem: "nacional" | "blum" | "hafele" | "grass";
  tipo_puxador: "perfil_aluminio" | "puxador_alu" | "push_open" | "sem";
}

export interface LimitesConfiguracao {
  num_portas: { min: number; max: number };
  num_gavetas: { min: number; max: number };
  num_prateleiras: { min: number; max: number };
  tipos_porta_validos: ConfiguracaoModulo["tipo_porta"][];
  permite_espelho: boolean;
  permite_iluminacao_led: boolean;
  permite_ripado: boolean;
}

export interface RestricaoPlacement {
  altura_piso_padrao_cm: Centimetros;
  folga_teto_min_cm: Centimetros;
  afastamento_lateral_cm: Centimetros;
  permite_sequencia: boolean;
  requer_ponto_hidraulico?: boolean;
}

// ─── REGRAS DE CORTE E FERRAGEM ───────────────────────────────────────────────

/**
 * RegraCorte: função pura que descreve UMA peça do módulo.
 * Inputs: L=largura mm, A=altura mm, P=profundidade mm, cfg=configuração
 * DEVE ser pura (sem side effects) para garantir auditabilidade.
 */
export interface RegraCorte {
  nome: string;
  grupo: "corpo" | "porta" | "gaveta" | "fundo" | "detalhe";
  ativa_quando: (cfg: ConfiguracaoModulo) => boolean;
  calcular_largura_mm: (L: Milimetros, A: Milimetros, P: Milimetros, cfg: ConfiguracaoModulo) => Milimetros;
  calcular_comprimento_mm: (L: Milimetros, A: Milimetros, P: Milimetros, cfg: ConfiguracaoModulo) => Milimetros;
  calcular_quantidade: (L: Milimetros, A: Milimetros, P: Milimetros, cfg: ConfiguracaoModulo) => number;
  espessura_mm: EspessuraMDF | ((cfg: ConfiguracaoModulo) => EspessuraMDF);
  direcao_fio: DirecaoFio;
  fita_borda: (cfg: ConfiguracaoModulo) => FitaBorda;
  usa_material: "corpo" | "porta" | "fundo";
  observacao?: string;
}

export type TipoFerragem =
  | "dobradica_35mm_110grau"
  | "dobradica_35mm_165grau"
  | "dobradica_push_open"
  | "corredicao_tandem_300mm"
  | "corredicao_tandem_400mm"
  | "corredicao_tandem_500mm"
  | "corredicao_lateral_porta"
  | "puxador_perfil_alu_1200mm"
  | "puxador_alu_128mm"
  | "puxador_push_open"
  | "ajustador_pe_100mm"
  | "ajustador_pe_150mm"
  | "rodape_pvc_100mm"
  | "cabideiro_simples"
  | "perfil_led_1m"
  | "amortecedor_soft_close"
  | "minifix_15mm"
  | "cavilha_8x30mm";

export interface RegraFerragem {
  tipo: TipoFerragem;
  ativa_quando: (cfg: ConfiguracaoModulo) => boolean;
  calcular_quantidade: (L: Milimetros, A: Milimetros, P: Milimetros, cfg: ConfiguracaoModulo) => number;
  descricao_tecnica: string;
}

// ─── MÓDULO INSTANCIADO ───────────────────────────────────────────────────────

/**
 * ModuloInstanciado: um ModuloParametrico aplicado a um projeto com valores concretos.
 *
 * Invariantes:
 *   - largura_cm ∈ [template.largura.min_cm, template.largura.max_cm]
 *   - posicao_x_cm + largura_cm ≤ parede.comprimento_cm
 *   - pecas e ferragens são SEMPRE derivados — recalculados quando config muda
 */
export interface ModuloInstanciado {
  id: string;
  modulo_template_id: string;
  modulo_template_codigo: string;
  modulo_template_versao: number;
  largura_cm: Centimetros;
  altura_cm: Centimetros;
  profundidade_cm: Centimetros;
  parede: ParedeId;
  posicao_x_cm: Centimetros;
  posicao_y_cm: Centimetros;
  configuracao: ConfiguracaoModulo;
  material_corpo: Material;
  material_porta?: Material;
  material_fundo?: Material;
  /** DERIVADO — calculado por calcularPecas(). Nunca salvar como fonte de verdade. */
  pecas: Peca[];
  /** DERIVADO — calculado por calcularFerragens(). */
  ferragens: Ferragem[];
  nome_display: string;
  observacoes?: string;
  ordem: number;
}

// ─── PEÇA ─────────────────────────────────────────────────────────────────────

/**
 * Peca: corte retangular de chapa MDF/MDP para produção.
 *
 * NUNCA criada manualmente. Sempre produzida por calcularPecas().
 *
 * Invariantes:
 *   - largura_final_mm  = largura_mm  - TOLERANCIA_SERRA_MM
 *   - comprimento_final_mm = comprimento_mm - TOLERANCIA_SERRA_MM
 *   - Se largura_mm > MAX_PECA_MM: dividir em segmentos
 */
export interface Peca {
  id: string;
  modulo_instanciado_id: string;
  regra_nome: string;
  largura_mm: Milimetros;
  comprimento_mm: Milimetros;
  espessura_mm: EspessuraMDF;
  largura_final_mm: Milimetros;
  comprimento_final_mm: Milimetros;
  material: Material;
  direcao_fio: DirecaoFio;
  fita_borda: FitaBorda;
  quantidade: number;
  etiqueta_producao: string;
  segmento_de?: string;
  numero_segmento?: number;
  total_segmentos?: number;
  observacao_uniao?: string;
  status: "pendente" | "alocada" | "cortada" | "com_defeito";
  chapa_alocada_id?: string;
  posicao_na_chapa?: Ponto2D;
  rotacionada?: boolean;
}

// ─── FERRAGEM ─────────────────────────────────────────────────────────────────

/**
 * Ferragem: hardware derivado de ModuloInstanciado + RegraFerragem.
 * NUNCA criada manualmente. Sempre produzida por calcularFerragens().
 */
export interface Ferragem {
  id: string;
  modulo_instanciado_id: string;
  tipo: TipoFerragem;
  marca: "nacional" | "blum" | "hafele" | "grass" | "hettich";
  quantidade: number;
  codigo_fornecedor?: string;
  descricao: string;
  preco_custo_unit: number;
  preco_venda_unit: number;
  etiqueta_producao: string;
}

// ─── PROJETO FABRICÁVEL ───────────────────────────────────────────────────────

/**
 * ProjetoFabricavel: entidade central. Combina ambiente + módulos.
 * Todos os documentos (Orcamento, OrdemProducao) derivam desta entidade.
 *
 * O campo `ambiente` é EMBEDDED (não FK) — garante imutabilidade do espaço físico.
 * `metricas` é cache derivado — recalcular quando `modulos[]` muda.
 */
export type StatusProjeto =
  | "rascunho"
  | "em_revisao"
  | "aprovado_cliente"
  | "em_producao"
  | "entregue"
  | "cancelado";

export type VersaoComercial = "economica" | "intermediaria" | "premium";

export interface ProjetoFabricavel {
  id: string;
  empresa_id: string;
  cliente_id: string;
  nome: string;
  tipo_ambiente: string;
  versao_comercial: VersaoComercial;
  numero_revisao: number;
  revisao_anterior_id?: string;
  /** Embedded — não referência. Imutável após criação do projeto. */
  ambiente: AmbienteGeometrico;
  modulos: ModuloInstanciado[];
  /** Cache derivado de modulos[]. Recalcular sempre que modulos[] muda. */
  metricas: MetricasProjeto;
  estilo: string;
  descricao_comercial?: string;
  observacoes_tecnicas: string[];
  imagem_render_url?: string;
  status: StatusProjeto;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
  aprovado_em?: string;
}

export interface MetricasProjeto {
  chapas_18mm: number;
  chapas_15mm: number;
  chapas_6mm: number;
  metros_fita_borda: number;
  linear_marcenaria_cm: Centimetros;
  area_frontal_m2: MetrosQuadrados;
  num_modulos: number;
  num_pecas_total: number;
  num_ferragens_total: number;
  custo_material_estimado: number;
  custo_ferragens_estimado: number;
  calculado_em: string;
}

// ─── ORÇAMENTO ────────────────────────────────────────────────────────────────

/**
 * Orcamento: representação comercial de um ProjetoFabricavel.
 * `projeto_snapshot` é CONGELADO quando status = "enviado".
 */
export type StatusOrcamento =
  | "rascunho" | "enviado" | "em_analise"
  | "aprovado" | "recusado" | "expirado" | "cancelado";

export interface Orcamento {
  id: string;
  numero: string;
  empresa_id: string;
  cliente_id: string;
  projeto_id: string;
  projeto_revisao: number;
  /** Snapshot imutável do ProjetoFabricavel no momento do envio. */
  projeto_snapshot: ProjetoFabricavel;
  custo_materiais: CustoMateriais;
  custo_producao: CustoProducao;
  custo_instalacao: CustoInstalacao;
  custos_indiretos: CustosIndiretos;
  analise_financeira: AnaliseFinanceira;
  itens: ItemOrcamento[];
  validade_dias: number;
  validade_ate: string;
  condicoes_pagamento: string;
  prazo_producao_dias: number;
  prazo_instalacao_dias: number;
  status: StatusOrcamento;
  enviado_em?: string;
  aprovado_em?: string;
  assinatura?: AssinaturaDigital;
  fiscal?: DadosFiscal;
  observacoes: string;
  criado_em: string;
  atualizado_em: string;
}

export interface CustoMateriais {
  linhas: LinhaMaterial[];
  subtotal_chapas: number;
  subtotal_ferragens: number;
  desperdicio_pct: number;
  total: number;
}

export interface LinhaMaterial {
  descricao: string;
  material_id: string;
  quantidade: number;
  unidade: "chapa" | "m" | "un";
  preco_custo_unit: number;
  total: number;
}

export interface CustoProducao {
  corte_cnc: LinhaProducao;
  bordagem: LinhaProducao;
  usinagem: LinhaProducao;
  montagem: LinhaProducao;
  acabamento: LinhaProducao;
  subtotal: number;
}

export interface LinhaProducao {
  horas_estimadas: number;
  valor_hora: number;
  total: number;
}

export interface CustoInstalacao {
  horas_equipe: number;
  valor_hora: number;
  distancia_km: number;
  custo_por_km: number;
  subtotal: number;
}

export interface CustosIndiretos {
  overhead: { pct: number; base: number; total: number };
  impostos: { regime: string; aliquota_pct: number; base: number; total: number };
  comissao?: { pct: number; base: number; total: number };
  subtotal: number;
}

export interface AnaliseFinanceira {
  custo_total: number;
  margem_desejada_pct: number;
  preco_venda: number;
  preco_minimo: number;
  lucro_bruto: number;
  lucro_pct: number;
  roi_estimado_dias: number;
  preco_economica?: number;
  preco_intermediaria?: number;
  preco_premium?: number;
}

export interface ItemOrcamento {
  id: string;
  modulo_instanciado_id: string;
  ordem: number;
  descricao: string;
  quantidade: number;
  unidade: "un";
  preco_custo: number;
  preco_unitario: number;
  total: number;
  observacao?: string;
}

export interface AssinaturaDigital {
  assinado_em: string;
  ip_signatario: string;
  hash_orcamento: string;
  imagem_base64: string;
  nome_signatario: string;
}

export interface DadosFiscal {
  nfe_ref?: string;
  nfe_chave?: string;
  nfe_status?: "processando" | "emitida" | "cancelada" | "erro";
  nfe_ambiente: "homologacao" | "producao";
  boleto?: { asaas_id: string; url: string; vencimento: string; status: string };
  pix?: { asaas_id: string; qr_code: string; copia_cola: string; status: string };
}

// ─── ORDEM DE PRODUÇÃO ────────────────────────────────────────────────────────

/**
 * OrdemProducao: instrução completa de fabricação.
 * Criada SOMENTE a partir de Orcamento com status = "aprovado".
 * `projeto` é snapshot imutável após criação.
 */
export type StatusOrdem =
  | "aguardando_material" | "material_separado" | "em_corte"
  | "em_bordagem" | "em_montagem" | "em_acabamento"
  | "em_inspecao" | "aprovada_inspecao" | "em_instalacao"
  | "concluida" | "cancelada";

export interface OrdemProducao {
  id: string;
  numero: string;
  empresa_id: string;
  orcamento_id: string;
  /** Snapshot imutável do projeto no momento da criação da ordem. */
  projeto: ProjetoFabricavel;
  plano_corte: PlanoNesting;
  lista_compras: ListaCompras;
  etapas: EtapaProducao[];
  data_inicio_planejada: string;
  data_entrega_prometida: string;
  data_entrega_real?: string;
  status: StatusOrdem;
  historico_status: EventoStatus[];
  observacoes: string;
  criado_em: string;
  criado_por: string;
}

export interface EventoStatus {
  de: StatusOrdem;
  para: StatusOrdem;
  em: string;
  por: string;
  nota?: string;
}

export interface PlanoNesting {
  algoritmo: "bottom_left_fill" | "deepnest" | "guillotine" | "maxrects";
  chapas: ChapaAlocada[];
  resumo: {
    total_pecas: number;
    total_chapas: number;
    area_util_total_m2: MetrosQuadrados;
    area_desperdicada_m2: MetrosQuadrados;
    desperdicio_pct: number;
    metros_fita_total: number;
  };
  exportacoes: {
    csv_operador: string;
    svg_preview_url?: string;
    dxf_url?: string;
  };
  calculado_em: string;
}

export interface ChapaAlocada {
  id: string;
  numero_sequencial: number;
  material: Material;
  largura_mm: Milimetros;
  comprimento_mm: Milimetros;
  pecas_alocadas: PecaAlocada[];
  area_util_mm2: number;
  area_desperdicada_mm2: number;
  eficiencia_pct: number;
  svg_layout: string;
}

export interface PecaAlocada {
  peca_id: string;
  x_mm: Milimetros;
  y_mm: Milimetros;
  largura_mm: Milimetros;
  comprimento_mm: Milimetros;
  rotacionada: boolean;
  etiqueta: string;
}

export type TipoEtapa =
  | "separacao_material" | "corte_cnc" | "corte_manual"
  | "bordagem" | "usinagem" | "montagem" | "pintura_laca"
  | "inspecao_qualidade" | "embalagem" | "instalacao_obra";

export interface EtapaProducao {
  id: string;
  tipo: TipoEtapa;
  ordem: number;
  descricao: string;
  duracao_estimada_horas: number;
  depende_de: string[];
  funcao_responsavel: string;
  operador_id?: string;
  status: "bloqueada" | "pendente" | "em_andamento" | "concluida" | "com_problema";
  iniciada_em?: string;
  concluida_em?: string;
  checklist: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  descricao: string;
  obrigatorio: boolean;
  concluido: boolean;
  concluido_em?: string;
  concluido_por?: string;
}

export interface ListaCompras {
  itens: ItemCompra[];
  resumo: {
    itens_em_estoque: number;
    itens_para_comprar: number;
    custo_total_estimado: number;
    prazo_max_entrega_dias: number;
  };
  pedidos_sugeridos: PedidoFornecedor[];
  gerado_em: string;
}

export interface ItemCompra {
  material_id: string;
  descricao: string;
  quantidade_necessaria: number;
  quantidade_em_estoque: number;
  quantidade_a_comprar: number;
  unidade: string;
  preco_referencia: number;
  fornecedor_preferencial_id?: string;
  urgencia: "normal" | "urgente";
}

export interface PedidoFornecedor {
  fornecedor_id: string;
  fornecedor_nome: string;
  itens: ItemCompra[];
  total_estimado: number;
  prazo_entrega_dias: number;
}
