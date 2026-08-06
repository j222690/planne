import { describe, test, expect } from "vitest";
import { gerarDAE } from "../exportacao-dae";
import type { ModuloParaDAE } from "../exportacao-dae";
import { gerarHandler } from "../../../server/motor-gerar";
import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Validador de boa-formação XML sem depender de DOMParser (ambiente vitest é
 * "node", sem DOM) — pilha de tags via regex, cobre o que precisamos: tags
 * abertas/fechadas balanceadas, sem tags soltas.
 */
function validarXmlBemFormado(xml: string): void {
  const tagRegex = /<(\/?)([a-zA-Z_][\w:-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g;
  const pilha: string[] = [];
  let m: RegExpExecArray | null;
  let total = 0;
  while ((m = tagRegex.exec(xml))) {
    total++;
    const [, fechamento, nome, , autofechada] = m;
    if (fechamento) {
      const topo = pilha.pop();
      if (topo !== nome) {
        throw new Error(
          `Tag mal fechada: esperava </${topo}>, achou </${nome}> (posição ${m.index})`,
        );
      }
    } else if (!autofechada) {
      pilha.push(nome);
    }
  }
  if (pilha.length > 0) throw new Error(`Tags não fechadas: ${pilha.join(", ")}`);
  expect(total).toBeGreaterThan(0);
}

function modulo(overrides: Partial<ModuloParaDAE> = {}): ModuloParaDAE {
  return {
    largura_cm: 60,
    altura_cm: 200,
    profundidade_cm: 60,
    posicao_x_cm: 0,
    posicao_y_cm: 0,
    parede: "top",
    configuracao: { num_portas: 2, num_gavetas: 0, num_prateleiras: 1 },
    nome_display: "Módulo Teste",
    cor_hex: "#D9C7A8",
    ...overrides,
  };
}

describe("gerarDAE — estrutura COLLADA", () => {
  test("gera XML bem formado com 1 módulo", () => {
    const xml = gerarDAE([modulo()]);
    validarXmlBemFormado(xml);
    expect(xml).toContain(
      '<COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1">',
    );
    expect(xml).toContain("</COLLADA>");
  });

  test("1 <node> de módulo por módulo de entrada", () => {
    const xml = gerarDAE([modulo(), modulo({ posicao_x_cm: 60, nome_display: "Módulo 2" })]);
    const nosModulo = xml.match(/<node id="modulo_\d+"/g) ?? [];
    expect(nosModulo.length).toBe(2);
  });

  test("1 <instance_geometry> por peça esquemática (caixa/porta/prateleira etc.)", () => {
    const xml = gerarDAE([
      modulo({ configuracao: { num_portas: 2, num_gavetas: 0, num_prateleiras: 1 } }),
    ]);
    // Caixa (4: laterais+base+teto) + fundo + 2 portas + 1 prateleira = 8 peças
    const instancias = xml.match(/<instance_geometry url="#box">/g) ?? [];
    expect(instancias.length).toBe(8);
  });

  test("nomes com caracteres especiais (acentos, & < >) são escapados", () => {
    const xml = gerarDAE([modulo({ nome_display: 'Armário "Cozinha" & Sala <teste>' })]);
    validarXmlBemFormado(xml);
    expect(xml).toContain("&amp;");
    expect(xml).toContain("&lt;teste&gt;");
  });

  test("1 material por cor hex única entre os módulos (dedup)", () => {
    const xml = gerarDAE([
      modulo({ cor_hex: "#D9C7A8" }),
      modulo({ cor_hex: "#D9C7A8", posicao_x_cm: 60 }),
      modulo({ cor_hex: "#2B2B2E", posicao_x_cm: 120 }),
    ]);
    const materiais = xml.match(/<material id="mat_[0-9A-F]{6}"/g) ?? [];
    expect(materiais.length).toBe(2);
  });

  test("rotação por parede vira graus corretos (top=0, left=90, bottom=180, right=-90)", () => {
    const xml = gerarDAE(
      [
        modulo({ parede: "top" }),
        modulo({ parede: "left", posicao_x_cm: 0 }),
        modulo({ parede: "bottom", posicao_x_cm: 0 }),
        modulo({ parede: "right", posicao_x_cm: 0 }),
      ],
      { largura_cm: 300, profundidade_cm: 300 },
    );
    expect(xml).toContain("<rotate>0 1 0 0</rotate>");
    expect(xml).toContain("<rotate>0 1 0 90</rotate>");
    expect(xml).toContain("<rotate>0 1 0 180</rotate>");
    expect(xml).toContain("<rotate>0 1 0 -90</rotate>");
  });

  test("sem módulos ainda gera um documento COLLADA válido (vazio)", () => {
    const xml = gerarDAE([]);
    validarXmlBemFormado(xml);
    expect(xml).toContain("<visual_scene");
  });
});

// ─── Integração com o motor real ──────────────────────────────────────────

function mockReqRes(body: unknown) {
  const req = { method: "POST", body } as VercelRequest;
  let statusCode = 200;
  let jsonBody: unknown;
  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      jsonBody = payload;
      return res;
    },
  } as unknown as VercelResponse;
  return { req, res, getStatus: () => statusCode, getJson: () => jsonBody };
}

describe("exportação DAE — integração com o motor real", () => {
  test("gerarHandler com incluir_dae:true retorna um .dae bem formado e coerente com os módulos gerados", async () => {
    const { req, res, getStatus, getJson } = mockReqRes({
      tipo_layout: "cozinha_linear",
      medidas: { largura_cm: 350, profundidade_cm: 60, altura_cm: 270 },
      preferencias: { versao_comercial: "intermediaria" },
      incluir_dae: true,
    });
    await gerarHandler(req, res);
    expect(getStatus()).toBe(200);

    const data = getJson() as {
      arquivo_dae?: string;
      projeto: { modulos: unknown[] };
    };
    expect(data.arquivo_dae).toBeDefined();
    validarXmlBemFormado(data.arquivo_dae!);
    const nosModulo = data.arquivo_dae!.match(/<node id="modulo_\d+"/g) ?? [];
    expect(nosModulo.length).toBe(data.projeto.modulos.length);
  });

  test("sem incluir_dae, arquivo_dae não vem na resposta (opt-in)", async () => {
    const { req, res, getJson } = mockReqRes({
      tipo_layout: "cozinha_linear",
      medidas: { largura_cm: 350, profundidade_cm: 60, altura_cm: 270 },
      preferencias: { versao_comercial: "intermediaria" },
    });
    await gerarHandler(req, res);
    const data = getJson() as { arquivo_dae?: string };
    expect(data.arquivo_dae).toBeUndefined();
  });
});
