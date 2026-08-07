import { describe, test, expect } from "vitest";
import { listarTodosOsModulos, buscarTemplatePorCodigo, criarModuloManual } from "../editor-manual";
import { instanciarModulos, criarMaterialPadrao } from "../layout-shared";
import {
  MODULOS_BASE_COZINHA,
  getTemplateBase,
  BASE_ALTURA_CM,
  BASE_PROFUNDIDADE_CM,
} from "../biblioteca-cozinha";
import { MODULOS_ROUPEIRO } from "../biblioteca-quarto";

describe("listarTodosOsModulos — catálogo unificado", () => {
  test("agrega módulos de todas as bibliotecas (cozinha, quarto, sala, escritório, serviços)", () => {
    const todos = listarTodosOsModulos();
    const categorias = new Set(todos.flatMap((m) => m.categorias));
    expect(todos.length).toBeGreaterThan(20);
    expect(categorias.has("cozinha")).toBe(true);
    expect(categorias.has("quarto")).toBe(true);
    expect(categorias.has("sala")).toBe(true);
    expect(categorias.has("escritorio")).toBe(true);
    expect(categorias.has("banheiro")).toBe(true);
  });

  test("filtra por categoria", () => {
    const soQuarto = listarTodosOsModulos("quarto");
    expect(soQuarto.length).toBeGreaterThan(0);
    expect(soQuarto.every((m) => m.categorias.includes("quarto"))).toBe(true);
  });

  test("só retorna módulos ativos", () => {
    const todos = listarTodosOsModulos();
    expect(todos.every((m) => m.ativo)).toBe(true);
  });
});

describe("buscarTemplatePorCodigo", () => {
  test("acha um template real pelo código", () => {
    const t = buscarTemplatePorCodigo("roupeiro_100");
    expect(t).toBeDefined();
    expect(t!.codigo).toBe("roupeiro_100");
  });

  test("código inexistente retorna undefined (não lança)", () => {
    expect(buscarTemplatePorCodigo("nao_existe_xyz")).toBeUndefined();
  });
});

describe("criarModuloManual — equivalência com o fluxo automático", () => {
  test("módulo manual gera as mesmas peças que instanciarModulos pra largura/config equivalente", () => {
    const largura = 60;
    const template = getTemplateBase(largura)!;
    const materialCorpo = criarMaterialPadrao("#D9C7A8", 15);
    const materialFundo = criarMaterialPadrao("#D9C7A8", 6);

    const [automatico] = instanciarModulos([largura], {
      parede: "top",
      inicio_cm: 0,
      posicao_y_cm: 0,
      altura_cm: BASE_ALTURA_CM,
      profundidade_cm: BASE_PROFUNDIDADE_CM,
      prefixo: "base",
      materialCorpo,
      materialFundo,
      getTemplate: getTemplateBase,
      templateFallback: MODULOS_BASE_COZINHA[4],
      configDe: () => template.configuracao_padrao,
    });

    const manual = criarModuloManual(
      template,
      { posicao_x_cm: 0, posicao_y_cm: 0, parede: "top", largura_cm: largura },
      { materialCorpo, materialFundo },
      0,
    );

    expect(manual.pecas.length).toBe(automatico.pecas.length);
    expect(manual.ferragens.length).toBe(automatico.ferragens.length);
    const somaLarguraAuto = automatico.pecas.reduce((s, p) => s + p.largura_mm * p.quantidade, 0);
    const somaLarguraManual = manual.pecas.reduce((s, p) => s + p.largura_mm * p.quantidade, 0);
    expect(somaLarguraManual).toBe(somaLarguraAuto);
  });

  test("posição/parede vêm exatamente do placement dado (não recalcula)", () => {
    const template = getTemplateBase(60)!;
    const materialCorpo = criarMaterialPadrao("#D9C7A8", 15);
    const manual = criarModuloManual(
      template,
      { posicao_x_cm: 137, posicao_y_cm: 0, parede: "left", largura_cm: 60 },
      { materialCorpo },
      3,
    );
    expect(manual.posicao_x_cm).toBe(137);
    expect(manual.parede).toBe("left");
    expect(manual.ordem).toBe(3);
  });

  test("modo ilha: parede 'bottom' + posicao_y_cm guardando profundidade (mesma convenção de layout-ilha.ts)", () => {
    const template = getTemplateBase(90)!;
    const materialCorpo = criarMaterialPadrao("#D9C7A8", 15);
    const manual = criarModuloManual(
      template,
      { posicao_x_cm: 150, posicao_y_cm: 45, parede: "bottom", largura_cm: 90 },
      { materialCorpo },
      0,
    );
    expect(manual.parede).toBe("bottom");
    expect(manual.posicao_y_cm).toBe(45);
    expect(manual.pecas.length).toBeGreaterThan(0);
  });

  test("largura_cm override troca o tamanho da peça sem quebrar o cálculo", () => {
    const template = buscarTemplatePorCodigo("roupeiro_100")!;
    const materialCorpo = criarMaterialPadrao("#D9C7A8", 15);
    const manual80 = criarModuloManual(
      template,
      { posicao_x_cm: 0, posicao_y_cm: 0, parede: "top", largura_cm: 80 },
      { materialCorpo },
      0,
    );
    expect(manual80.largura_cm).toBe(80);
    expect(manual80.pecas.length).toBeGreaterThan(0);
    expect(MODULOS_ROUPEIRO.some((m) => m.codigo === template.codigo)).toBe(true);
  });

  test("configOverrides aplica por cima da configuracao_padrao do template", () => {
    const template = getTemplateBase(60)!;
    const materialCorpo = criarMaterialPadrao("#D9C7A8", 15);
    const manual = criarModuloManual(
      template,
      { posicao_x_cm: 0, posicao_y_cm: 0, parede: "top", largura_cm: 60 },
      { materialCorpo },
      0,
      { num_gavetas: 2 },
    );
    expect(manual.configuracao.num_gavetas).toBe(2);
  });
});
