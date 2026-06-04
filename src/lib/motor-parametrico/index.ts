/**
 * PLANNE — Motor Paramétrico
 * Fase 1: Fundação — API Pública
 *
 * Re-exports de todas as entidades e funções públicas do núcleo.
 * Importar sempre daqui, nunca diretamente dos sub-módulos.
 *
 * @example
 *   import { AmbienteGeometrico, calcularPecas, plantaToAmbiente } from "@/lib/motor-parametrico";
 */

// Entidades centrais (tipos)
export type {
  // Primitivos
  Milimetros,
  Centimetros,
  MetrosQuadrados,
  Ponto2D,
  Retangulo2D,
  EspessuraMDF,
  DirecaoFio,
  FitaBorda,
  ParedeId,

  // Material
  Material,

  // Ambiente
  AmbienteGeometrico,
  Parede,
  SegmentoLivre,
  Abertura,
  Porta,
  Janela,
  Obstaculo,
  TipoObstaculo,
  PontoEletrico,
  PontoHidraulico,

  // Módulo
  ModuloParametrico,
  ModuloInstanciado,
  DimensaoParametrica,
  ConfiguracaoModulo,
  LimitesConfiguracao,
  RestricaoPlacement,
  RegraCorte,
  RegraFerragem,
  TipoFerragem,
  CategoriaAmbiente,
  TipoModulo,

  // Produção
  Peca,
  Ferragem,

  // Projeto
  ProjetoFabricavel,
  MetricasProjeto,
  StatusProjeto,
  VersaoComercial,

  // Orçamento
  Orcamento,
  StatusOrcamento,
  CustoMateriais,
  CustoProducao,
  CustoInstalacao,
  CustosIndiretos,
  AnaliseFinanceira,
  ItemOrcamento,
  LinhaMaterial,
  LinhaProducao,
  AssinaturaDigital,
  DadosFiscal,

  // Ordem de Produção
  OrdemProducao,
  StatusOrdem,
  EventoStatus,
  PlanoNesting,
  ChapaAlocada,
  PecaAlocada,
  EtapaProducao,
  TipoEtapa,
  ChecklistItem,
  ListaCompras,
  ItemCompra,
  PedidoFornecedor,
} from "./tipos";

// Constantes
export {
  TOLERANCIA_SERRA_MM,
  MAX_PECA_MM,
  AREA_CHAPA_M2,
  ESP_CORPO_MM,
  ESP_FUNDO_MM,
} from "./tipos";

// Fase 2 — Motor Paramétrico V1
export {
  gerarLayoutCozinhaLinear,
  encaixarModulos,
  BASE_ALTURA_CM,
  BASE_PROFUNDIDADE_CM,
  AEREO_ALTURA_CM,
  AEREO_PROFUNDIDADE_CM,
} from "./layout-cozinha-linear";
export type { PreferenciasCozinha, ResultadoLayout } from "./layout-cozinha-linear";

export {
  MODULOS_BASE_COZINHA,
  MODULOS_AEREOS_COZINHA,
  BIBLIOTECA_COZINHA,
  LARGURAS_PADRAO,
  getTemplateBase,
  getTemplateAereo,
} from "./biblioteca-cozinha";

export { projetoToMovelInput, calcularCustoEstimado } from "./adapters";

// Funções de AmbienteGeometrico
export {
  calcularSegmentosLivres,
  plantaToAmbiente,
  criarAmbienteManual,
} from "./ambiente";

// Funções puras de cálculo
export {
  calcularPecas,
  calcularFerragens,
  calcularMetricas,
} from "./pecas";
