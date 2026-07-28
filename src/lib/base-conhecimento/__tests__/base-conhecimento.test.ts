import { describe, test, expect } from "vitest";
import {
  TOTAL_ATOMOS,
  categorias,
  atomoPorId,
  atomosPorCategoria,
  atomosPorEntidade,
  buscarAtomos,
  resumirParaPrompt,
} from "../index";

describe("Base de Conhecimento — loader e retrieval", () => {
  test("carrega os 112 átomos", () => {
    expect(TOTAL_ATOMOS).toBe(112);
  });

  test("tem as 12 categorias do escopo", () => {
    const cats = categorias();
    expect(cats).toContain("Ferragens");
    expect(cats).toContain("Estrutura");
    expect(cats).toContain("Cozinhas");
    expect(cats.length).toBeGreaterThanOrEqual(12);
  });

  test("filtra por categoria", () => {
    const ferragens = atomosPorCategoria("Ferragens");
    expect(ferragens.length).toBe(10);
    expect(ferragens.every((a) => a.categoria === "Ferragens")).toBe(true);
  });

  test("busca por texto encontra a regra de dobradiças", () => {
    const res = buscarAtomos({ categoria: "Ferragens", texto: "dobradiça" });
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].tags).toContain("dobradiças");
  });

  test("busca ordena por confiança (desc)", () => {
    const res = buscarAtomos({ categoria: "Estrutura" });
    for (let i = 1; i < res.length; i++) {
      expect(res[i - 1].confianca.score).toBeGreaterThanOrEqual(res[i].confianca.score);
    }
  });

  test("filtro por confiança mínima", () => {
    const res = buscarAtomos({ confiancaMin: 100 });
    expect(res.every((a) => a.confianca.score >= 100)).toBe(true);
  });

  test("recupera átomo por id e por entidade", () => {
    const qualquer = buscarAtomos({ categoria: "Ferragens" })[0];
    expect(atomoPorId(qualquer.id)?.id).toBe(qualquer.id);
    const porEnt = atomosPorEntidade(qualquer.entidade);
    expect(porEnt.some((a) => a.id === qualquer.id)).toBe(true);
  });

  test("resumo para prompt remove marcadores [cf. ...] e limita o tamanho", () => {
    const res = buscarAtomos({ categoria: "Ferragens" });
    const txt = resumirParaPrompt(res, 3);
    expect(txt).not.toMatch(/\[cf\./);
    expect(txt.split("\n\n").length).toBeLessThanOrEqual(3);
  });
});
