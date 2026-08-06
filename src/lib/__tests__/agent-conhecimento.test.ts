import { describe, test, expect } from "vitest";
import { buscarConhecimentoTool } from "../../../api/agent";

describe("buscarConhecimentoTool — retrieval da base de conhecimento pro chat", () => {
  test("pergunta com match direto retorna átomos reais, sourced", () => {
    const r = buscarConhecimentoTool("qual broca usar no Minifix") as {
      encontrado: boolean;
      total: number;
      resumo: string;
    };
    expect(r.encontrado).toBe(true);
    expect(r.total).toBeGreaterThan(0);
    expect(r.resumo).toContain("minifix");
    // resumirParaPrompt sempre inclui o id do átomo — rastreabilidade até a fonte
    expect(r.resumo).toMatch(/\[atom_/);
  });

  test("categoria restringe a busca quando informada", () => {
    const r = buscarConhecimentoTool("dobradiça", "Ferragens") as { encontrado: boolean; total: number };
    expect(r.encontrado).toBe(true);
    expect(r.total).toBeGreaterThan(0);
  });

  test("pergunta sem nenhum match cai no fallback palavra-a-palavra antes de desistir", () => {
    // frase real com 1 termo técnico (corrediça) em meio a palavras genéricas
    // que não batem em conjunto, mas a palavra isolada deve encontrar algo.
    const r = buscarConhecimentoTool("me explica direitinho sobre corrediça por favor") as {
      encontrado: boolean;
      total: number;
    };
    expect(r.encontrado).toBe(true);
    expect(r.total).toBeGreaterThan(0);
  });

  test("pergunta totalmente fora do domínio retorna encontrado:false sem lançar exceção", () => {
    const r = buscarConhecimentoTool("qual a receita de bolo de chocolate") as { encontrado: boolean; mensagem?: string };
    expect(r.encontrado).toBe(false);
    expect(r.mensagem).toBeTruthy();
  });
});
