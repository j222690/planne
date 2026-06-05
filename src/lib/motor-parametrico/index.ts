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
} from "./layout-cozinha-linear";
export type { PreferenciasCozinha, ResultadoLayout } from "./layout-cozinha-linear";

export {
  MODULOS_BASE_COZINHA,
  MODULOS_AEREOS_COZINHA,
  BIBLIOTECA_COZINHA,
  LARGURAS_PADRAO,
  getTemplateBase,
  getTemplateAereo,
  BASE_ALTURA_CM,
  BASE_PROFUNDIDADE_CM,
  AEREO_ALTURA_CM,
  AEREO_PROFUNDIDADE_CM,
} from "./biblioteca-cozinha";

export { projetoToMovelInput, calcularCustoEstimado } from "./adapters";

// Fase 3 — Rule Engine
export {
  validarProjeto,
  CIRCULACAO_MINIMA_CM,
  CIRCULACAO_CONFORTAVEL_CM,
  LARGURA_MODULO_MIN_CM,
  LARGURA_MODULO_MAX_CM,
  APROVEITAMENTO_MIN_PCT,
  FOLGA_TETO_MIN_CM,
} from "./rule-engine";
export type {
  ResultadoValidacao,
  ViolacaoRegra,
  SeveridadeRegra,
  StatusValidacao,
} from "./rule-engine";

// Fase 4 — Engenharia Automática
export {
  consolidarPecas,
  consolidarFerragens,
  consolidarMateriais,
  consolidarFita,
  gerarListaCompras,
  gerarEngenharia,
  DESPERDICIO_CHAPA_PCT,
  DESPERDICIO_FITA_PCT,
} from "./engenharia";
export type {
  ListaEngenharia,
  PecaConsolidada,
  FerragemConsolidada,
  MaterialConsolidado,
  ResumoFita,
  EstoqueAtual,
} from "./engenharia";

// Fase 5 — Orçamento Inteligente
export {
  calcularOrcamentoCompleto,
  gerarTresVersoes,
  CONFIG_CUSTO_PADRAO,
} from "./orcamento-inteligente";
export type {
  ConfiguracaoCusto,
  OrcamentoCompleto,
  TresVersoes,
} from "./orcamento-inteligente";

// Fase 6 — Ambientes Complexos
// Fundação compartilhada de layout
export {
  criarMaterialPadrao,
  configPadrao,
  encaixarLarguras,
  instanciarModulos,
  montarProjeto,
  maiorSegmento,
  comprimentoLivre,
  paredesPorComprimento,
  saoAdjacentes,
  PAREDE_OPOSTA,
  PAREDES_ADJACENTES,
} from "./layout-shared";
export type { PreferenciasBase, ResultadoLayoutBase } from "./layout-shared";

// Cozinhas complexas
export { gerarLayoutCozinhaL, gerarLayoutCozinhaU } from "./layout-cozinha-l-u";
export type { PreferenciasCozinhaMP } from "./layout-cozinha-l-u";
export { gerarLayoutIlha, CIRCULACAO_ILHA_MIN_CM, ILHA_PROFUNDIDADE_CM } from "./layout-ilha";
export type { PreferenciasIlha } from "./layout-ilha";

// Quarto / Closet
export {
  gerarLayoutDormitorio,
  gerarLayoutCloset,
} from "./layout-quarto";
export type { PreferenciasQuarto } from "./layout-quarto";
export {
  MODULOS_ROUPEIRO,
  MODULOS_GAVETEIRO,
  MODULOS_CABIDEIRO,
  MODULOS_SAPATEIRA,
  BIBLIOTECA_QUARTO,
  getTemplateRoupeiro,
  getTemplateGaveteiro,
  getTemplateCabideiro,
  getTemplateSapateira,
} from "./biblioteca-quarto";

// Banheiro / Lavanderia
export {
  gerarLayoutBanheiro,
  gerarLayoutLavanderia,
} from "./layout-servicos";
export type { PreferenciasServico } from "./layout-servicos";
export {
  MODULOS_GABINETE_PIA,
  MODULOS_ESPELHEIRA,
  MODULOS_GABINETE_TANQUE,
  MODULOS_ARMARIO_SERVICO,
  BIBLIOTECA_SERVICOS,
  getTemplateGabinetePia,
  getTemplateEspelheira,
  getTemplateGabineteTanque,
  getTemplateArmarioServico,
} from "./biblioteca-servicos";

// Regras de corte reutilizáveis
export {
  regrasCorpo,
  regraPortaDobradica,
  regraPortaCorrer,
  regrasGaveta,
} from "./regras-corte-comuns";

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
