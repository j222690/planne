/**
 * Teste de integração do Editor 3D: módulos posicionados manualmente
 * (modulos_manuais) rodando pelo MESMO pipeline de orçamento/corte/PCP que
 * o layout automático usa — via gerarHandler real, sem mock do motor.
 */
import { describe, test, expect } from "vitest";
import { gerarHandler } from "../../server/motor-gerar";
import type { VercelRequest, VercelResponse } from "@vercel/node";

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

type RespostaMotor = {
  projeto: {
    modulos: {
      modulo_template_codigo: string;
      parede: string;
      posicao_x_cm: number;
      pecas: unknown[];
    }[];
  };
  orcamentos: { intermediaria: { itens: unknown[] } };
  plano_corte: { resumo: { total_chapas: number; total_pecas: number } };
  pcp: { numero: string };
  validacao: { status: string };
  error?: string;
};

describe("Editor 3D — modulos_manuais roda o mesmo motor do layout automático", () => {
  test("2 módulos presos à parede + 1 ilha geram orçamento/corte/PCP reais", async () => {
    const { req, res, getStatus, getJson } = mockReqRes({
      tipo_layout: "cozinha_linear", // ignorado quando modulos_manuais vem preenchido
      medidas: { largura_cm: 400, profundidade_cm: 350, altura_cm: 270 },
      preferencias: { versao_comercial: "intermediaria" },
      modulos_manuais: [
        {
          template_codigo: "base_60",
          posicao_x_cm: 0,
          posicao_y_cm: 0,
          parede: "top",
          largura_cm: 60,
        },
        {
          template_codigo: "aereo_60",
          posicao_x_cm: 0,
          posicao_y_cm: 150,
          parede: "top",
          largura_cm: 60,
        },
        // ilha: parede "bottom" fixa + posicao_y_cm guardando profundidade
        {
          template_codigo: "base_90",
          posicao_x_cm: 150,
          posicao_y_cm: 45,
          parede: "bottom",
          largura_cm: 90,
        },
      ],
    });
    await gerarHandler(req, res);
    expect(getStatus()).toBe(200);

    const data = getJson() as RespostaMotor;
    expect(data.error).toBeUndefined();
    expect(data.projeto.modulos.length).toBe(3);
    expect(data.projeto.modulos.every((m) => m.pecas.length > 0)).toBe(true);
    expect(data.projeto.modulos.some((m) => m.parede === "bottom" && m.posicao_x_cm === 150)).toBe(
      true,
    );

    // Mesmo pipeline: orçamento real, plano de corte real, PCP real — nada mockado.
    expect(data.orcamentos.intermediaria.itens.length).toBeGreaterThan(0);
    expect(data.plano_corte.resumo.total_pecas).toBeGreaterThan(0);
    expect(data.plano_corte.resumo.total_chapas).toBeGreaterThan(0);
    expect(data.pcp.numero).toBeTruthy();
    expect(["aprovado", "aprovado_com_alertas", "reprovado"]).toContain(data.validacao.status);
  });

  test("template_codigo inexistente retorna erro 500 claro, não quebra silenciosamente", async () => {
    const { req, res, getStatus, getJson } = mockReqRes({
      medidas: { largura_cm: 300, profundidade_cm: 300, altura_cm: 270 },
      preferencias: { versao_comercial: "intermediaria" },
      modulos_manuais: [
        {
          template_codigo: "modulo_que_nao_existe",
          posicao_x_cm: 0,
          posicao_y_cm: 0,
          parede: "top",
        },
      ],
    });
    await gerarHandler(req, res);
    expect(getStatus()).toBe(500);
    const data = getJson() as { error: string };
    expect(data.error).toContain("modulo_que_nao_existe");
  });

  test("tipo_porta no placement seleciona o material de insert certo (aluminio_vidro)", async () => {
    const { req, res, getJson } = mockReqRes({
      medidas: { largura_cm: 300, profundidade_cm: 300, altura_cm: 270 },
      preferencias: { versao_comercial: "intermediaria" },
      modulos_manuais: [
        {
          template_codigo: "roupeiro_100",
          posicao_x_cm: 0,
          posicao_y_cm: 0,
          parede: "top",
          tipo_porta: "aluminio_vidro",
        },
      ],
    });
    await gerarHandler(req, res);
    const data = getJson() as {
      projeto: {
        modulos: { pecas: { regra_nome: string; material: { nome_display: string } }[] }[];
      };
    };
    const pecaVidro = data.projeto.modulos[0].pecas.find((p) => p.regra_nome === "vidro_porta");
    expect(pecaVidro).toBeDefined();
    expect(pecaVidro!.material.nome_display).toContain("Vidro");
  });
});
