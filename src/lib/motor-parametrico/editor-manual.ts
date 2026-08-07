/**
 * PLANNE — Motor Paramétrico
 * Editor 3D de ambiente — instanciação MANUAL de módulos.
 *
 * `instanciarModulos()` (layout-shared.ts) só serve o fluxo de layout
 * AUTOMÁTICO (uma sequência de larguras preenchendo uma parede). O editor 3D
 * precisa colocar UM módulo por vez, na posição exata que o usuário arrastou
 * — mesmos campos, mesmas funções de cálculo (`calcularPecas`/
 * `calcularFerragens` são puras, não dependem de como o módulo foi
 * posicionado), só que uma peça de cada vez em vez de uma sequência.
 *
 * "Ilha" (módulo solto no meio do cômodo) usa a MESMA convenção que
 * `layout-ilha.ts` já usa pro layout automático: `parede: "bottom"` como
 * eixo de referência fixo + `posicao_y_cm` guardando a profundidade (em vez
 * de altura do piso) — assim `calcularCenaCompleta()` renderiza sem
 * nenhuma mudança, tanto pro layout automático quanto pro editor manual.
 */

import type {
  ModuloParametrico,
  ModuloInstanciado,
  ConfiguracaoModulo,
  ParedeId,
  Material,
  CategoriaAmbiente,
} from "./tipos";
import { calcularPecas, calcularFerragens } from "./pecas";
import { BIBLIOTECA_COZINHA } from "./biblioteca-cozinha";
import { BIBLIOTECA_QUARTO } from "./biblioteca-quarto";
import { BIBLIOTECA_SALA } from "./biblioteca-sala";
import { BIBLIOTECA_ESCRITORIO } from "./biblioteca-escritorio";
import { BIBLIOTECA_SERVICOS } from "./biblioteca-servicos";

const TODAS_BIBLIOTECAS: Record<string, ModuloParametrico>[] = [
  BIBLIOTECA_COZINHA,
  BIBLIOTECA_QUARTO,
  BIBLIOTECA_SALA,
  BIBLIOTECA_ESCRITORIO,
  BIBLIOTECA_SERVICOS,
];

/** Catálogo unificado de todos os módulos disponíveis (pro seletor do editor). */
export function listarTodosOsModulos(categoria?: CategoriaAmbiente): ModuloParametrico[] {
  const todos = TODAS_BIBLIOTECAS.flatMap((b) => Object.values(b)).filter((m) => m.ativo);
  return categoria ? todos.filter((m) => m.categorias.includes(categoria)) : todos;
}

/** Busca um template pelo código exato (usado ao reidratar `modulos_manuais` no servidor). */
export function buscarTemplatePorCodigo(codigo: string): ModuloParametrico | undefined {
  for (const biblioteca of TODAS_BIBLIOTECAS) {
    const encontrado = Object.values(biblioteca).find((m) => m.codigo === codigo);
    if (encontrado) return encontrado;
  }
  return undefined;
}

export interface PlacementManual {
  posicao_x_cm: number;
  /** ≥100 = aéreo (módulo de parede); pra `ehIlha:true`, é a profundidade livre no chão. */
  posicao_y_cm: number;
  /** Ignorado quando `ehIlha:true` (mantido por compatibilidade — a ilha não encosta em parede). */
  parede: ParedeId;
  /** Override de largura (outra opção da família do template). Default: largura padrão do template. */
  largura_cm?: number;
  /** Módulo solto no meio do cômodo — ver ModuloInstanciado.eh_ilha em tipos.ts. */
  ehIlha?: boolean;
}

export interface MateriaisManual {
  materialCorpo: Material;
  materialFundo?: Material;
  materialPorta?: Material;
  materialInsert?: Material;
}

/**
 * Instancia UM módulo na posição exata dada (não uma sequência) — mesmos
 * campos e mesmas funções de cálculo que `instanciarModulos()` usa por
 * módulo, só que sem o loop de preenchimento automático de parede.
 */
export function criarModuloManual(
  template: ModuloParametrico,
  placement: PlacementManual,
  materiais: MateriaisManual,
  ordem: number,
  configOverrides?: Partial<ConfiguracaoModulo>,
): ModuloInstanciado {
  const largura_cm = placement.largura_cm ?? template.largura.padrao_cm;
  const configuracao: ConfiguracaoModulo = { ...template.configuracao_padrao, ...configOverrides };

  const instancia: ModuloInstanciado = {
    id: `manual_${template.codigo}_${placement.parede}_${Math.round(placement.posicao_x_cm)}_${ordem}`,
    modulo_template_id: template.id,
    modulo_template_codigo: template.codigo,
    modulo_template_versao: template.versao,
    largura_cm,
    altura_cm: template.altura.padrao_cm,
    profundidade_cm: template.profundidade.padrao_cm,
    parede: placement.parede,
    posicao_x_cm: placement.posicao_x_cm,
    posicao_y_cm: placement.posicao_y_cm,
    configuracao,
    material_corpo: materiais.materialCorpo,
    material_fundo: materiais.materialFundo,
    material_porta: materiais.materialPorta,
    material_insert: materiais.materialInsert,
    eh_ilha: placement.ehIlha,
    pecas: [],
    ferragens: [],
    nome_display: `${template.nome} — Editor 3D`,
    ordem,
  };

  instancia.pecas = calcularPecas(instancia, template);
  instancia.ferragens = calcularFerragens(instancia, template);
  return instancia;
}
