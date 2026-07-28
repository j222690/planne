import { describe, test, expect } from "vitest";
import { analisarMovel, type MovelParaAnalise } from "../analise-movel";

const base: MovelParaAnalise = {
  largura_cm: 80, profundidade_cm: 35, altura_cm: 70,
  portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 2,
};

describe("analisarMovel", () => {
  test("estima peso positivo e plausível", () => {
    const a = analisarMovel(base);
    expect(a.peso_kg).toBeGreaterThan(0);
    expect(a.peso_kg).toBeLessThan(200);
  });

  test("recomenda dobradiças por altura (aéreo baixo = 2)", () => {
    const a = analisarMovel(base);
    const dob = a.achados.find((x) => x.titulo === "Dobradiças");
    expect(dob?.detalhe).toContain("2 por porta");
  });

  test("roupeiro alto aponta 5 dobradiças e peso maior", () => {
    const a = analisarMovel({ ...base, largura_cm: 100, profundidade_cm: 60, altura_cm: 250, prateleiras: 4 });
    const dob = a.achados.find((x) => x.titulo === "Dobradiças");
    expect(dob?.detalhe).toContain("5 por porta");
  });

  test("folha larga (1 porta de 80cm) gera atenção", () => {
    const a = analisarMovel({ ...base, largura_cm: 80, portas: 1 });
    expect(a.achados.some((x) => x.titulo === "Folha larga")).toBe(true);
    expect(a.nivel === "atencao" || a.nivel === "critico").toBe(true);
  });

  test("prateleira de vão longo em 15mm avisa que enverga", () => {
    const a = analisarMovel({ largura_cm: 120, profundidade_cm: 35, altura_cm: 200, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 4 });
    expect(a.achados.some((x) => x.titulo === "Prateleira pode envergar")).toBe(true);
  });

  test("gaveta recomenda corrediça por profundidade", () => {
    const a = analisarMovel({ ...base, portas: 0, tipo_porta: "sem", prateleiras: 0, gavetas: 4, profundidade_cm: 50 });
    expect(a.achados.some((x) => x.titulo === "Corrediça")).toBe(true);
  });

  test("prateleiras demais em pouca altura = muito juntas", () => {
    const a = analisarMovel({ largura_cm: 60, profundidade_cm: 30, altura_cm: 100, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 6 });
    expect(a.achados.some((x) => x.titulo === "Prateleiras muito juntas")).toBe(true);
  });

  test("poucas prateleiras em muita altura = espaçadas", () => {
    const a = analisarMovel({ largura_cm: 60, profundidade_cm: 30, altura_cm: 240, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 2 });
    expect(a.achados.some((x) => x.titulo === "Prateleiras espaçadas")).toBe(true);
  });

  test("móvel simples e pequeno não gera atenção crítica", () => {
    const a = analisarMovel({ largura_cm: 40, profundidade_cm: 35, altura_cm: 60, portas: 1, tipo_porta: "abrir", gavetas: 0, prateleiras: 1 });
    expect(a.nivel).not.toBe("critico");
  });
});
