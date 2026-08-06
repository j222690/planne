/**
 * Teste de integração ponta-a-ponta da exportação XLSX:
 * motor real (gerarHandler) → mapeamento igual ao usado em app.ia-projetos.tsx
 * → gerarXLSXProjeto → parse do .xlsx gerado de volta com ExcelJS, validando
 * conteúdo real (não só "não lançou exceção").
 */
import { describe, test, expect } from "vitest";
import ExcelJS from "exceljs";
import { gerarHandler } from "../../server/motor-gerar";
import { gerarXLSXProjeto } from "../exportacao-xls";
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

describe("exportação XLSX — integração com o motor real", () => {
  test("gera planilha válida a partir de um projeto de cozinha real", async () => {
    const { req, res, getStatus, getJson } = mockReqRes({
      tipo_layout: "cozinha_linear",
      medidas: { largura_cm: 350, profundidade_cm: 60, altura_cm: 270 },
      preferencias: { versao_comercial: "intermediaria" },
    });
    await gerarHandler(req, res);
    expect(getStatus()).toBe(200);

    const data = getJson() as {
      plano_corte: {
        resumo: {
          total_chapas: number;
          total_pecas: number;
          desperdicio_pct: number;
          metros_fita_total: number;
        };
        chapas: {
          numero_sequencial: number;
          material: { nome_display: string };
          pecas_alocadas: {
            peca_id: string;
            largura_mm: number;
            comprimento_mm: number;
            etiqueta: string;
            rotacionada: boolean;
          }[];
        }[];
      };
      orcamentos: {
        intermediaria: {
          itens: {
            descricao: string;
            quantidade: number;
            preco_custo: number;
            preco_unitario: number;
            total: number;
          }[];
        };
      };
    };

    // Mesmo mapeamento feito em handleExportarXLS (app.ia-projetos.tsx)
    const pecas = data.plano_corte.chapas.flatMap((chapa) =>
      chapa.pecas_alocadas.map((p) => ({
        chapa: chapa.numero_sequencial,
        material: chapa.material.nome_display,
        peca_id: p.peca_id,
        largura_mm: p.largura_mm,
        comprimento_mm: p.comprimento_mm,
        rotacionada: p.rotacionada,
        etiqueta: p.etiqueta,
      })),
    );
    const itensOrcamento = data.orcamentos.intermediaria.itens.map((it) => ({
      descricao: it.descricao,
      quantidade: it.quantidade,
      preco_custo: it.preco_custo,
      preco_unitario: it.preco_unitario,
      total: it.total,
    }));

    expect(pecas.length).toBeGreaterThan(0);
    expect(itensOrcamento.length).toBeGreaterThan(0);

    const blob = await gerarXLSXProjeto({
      nomeProjeto: "Cozinha Teste E2E",
      versaoOrcamento: "intermediária",
      pecas,
      itensOrcamento,
      resumoCorte: {
        totalChapas: data.plano_corte.resumo.total_chapas,
        totalPecas: data.plano_corte.resumo.total_pecas,
        desperdicioPct: data.plano_corte.resumo.desperdicio_pct,
        metrosFita: data.plano_corte.resumo.metros_fita_total,
      },
    });

    expect(blob.type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(blob.size).toBeGreaterThan(0);

    // Round-trip real: lê o .xlsx gerado de volta e confere o conteúdo.
    const buffer = Buffer.from(await blob.arrayBuffer());
    // Assinatura ZIP (PK\x03\x04) — confirma que é um .xlsx real, não texto solto.
    expect(buffer.subarray(0, 2).toString("latin1")).toBe("PK");

    const wbLido = new ExcelJS.Workbook();
    await wbLido.xlsx.load(buffer);

    const shPecas = wbLido.getWorksheet("Lista de Peças");
    expect(shPecas).toBeDefined();
    expect(shPecas!.rowCount).toBe(pecas.length + 1); // +1 cabeçalho
    const primeiraLinhaPeca = shPecas!.getRow(2);
    expect(primeiraLinhaPeca.getCell(3).value).toBe(pecas[0].peca_id); // coluna "Peça"
    expect(primeiraLinhaPeca.getCell(7).value).toBe(pecas[0].etiqueta); // coluna "Etiqueta"

    const shOrc = wbLido.getWorksheet("Orçamento");
    expect(shOrc).toBeDefined();
    expect(shOrc!.rowCount).toBe(itensOrcamento.length + 1);
    expect(shOrc!.getRow(2).getCell(1).value).toBe(itensOrcamento[0].descricao);

    const shResumo = wbLido.getWorksheet("Resumo");
    expect(shResumo).toBeDefined();
    expect(shResumo!.getRow(1).getCell(2).value).toBe("Cozinha Teste E2E");
    expect(shResumo!.getRow(3).getCell(2).value).toBe(data.plano_corte.resumo.total_chapas);
  });
});
