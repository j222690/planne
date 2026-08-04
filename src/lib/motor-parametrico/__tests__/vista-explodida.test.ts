import { describe, test, expect } from "vitest";
import { calcularVistaExplodida } from "../vista-explodida";

describe("calcularVistaExplodida", () => {
  test("módulo com 2 portas e sem gaveta: 5 peças de carcaça + 2 portas", () => {
    const pecas = calcularVistaExplodida({
      largura_cm: 60,
      altura_cm: 72,
      profundidade_cm: 55,
      configuracao: { num_portas: 2, num_gavetas: 0 },
    });
    expect(pecas).toHaveLength(7);
    expect(pecas.filter((p) => p.tipo === "porta")).toHaveLength(2);
    expect(pecas.filter((p) => p.tipo === "gaveta")).toHaveLength(0);
  });

  test("gaveteiro com 3 gavetas e sem porta: 5 + 3", () => {
    const pecas = calcularVistaExplodida({
      largura_cm: 60,
      altura_cm: 72,
      profundidade_cm: 55,
      configuracao: { num_portas: 0, num_gavetas: 3 },
    });
    expect(pecas.filter((p) => p.tipo === "gaveta")).toHaveLength(3);
    expect(pecas.filter((p) => p.tipo === "porta")).toHaveLength(0);
  });

  test("laterais explodem em direções opostas (esquerda -X, direita +X)", () => {
    const [le, ld] = calcularVistaExplodida({
      largura_cm: 60,
      altura_cm: 72,
      profundidade_cm: 55,
      configuracao: { num_portas: 2, num_gavetas: 0 },
    });
    expect(le.direcaoExplosao[0]).toBeLessThan(0);
    expect(ld.direcaoExplosao[0]).toBeGreaterThan(0);
    // e ficam nas bordas opostas do módulo, não no centro
    expect(le.posicao[0]).toBeLessThan(0);
    expect(ld.posicao[0]).toBeGreaterThan(0);
  });

  test("portas somam a largura do módulo (não se sobrepõem nem deixam vão)", () => {
    const larguraCm = 90;
    const pecas = calcularVistaExplodida({
      largura_cm: larguraCm,
      altura_cm: 72,
      profundidade_cm: 55,
      configuracao: { num_portas: 3, num_gavetas: 0 },
    });
    const portas = pecas.filter((p) => p.tipo === "porta");
    const somaLargurasMm = portas.reduce((s, p) => s + p.larguraMm, 0);
    // soma das portas ≈ largura do módulo (mm), a menos da folga de 6mm por porta
    expect(somaLargurasMm).toBeGreaterThan(larguraCm * 10 - 3 * 10);
    expect(somaLargurasMm).toBeLessThanOrEqual(larguraCm * 10);
  });

  test("nenhuma peça fica com tamanho zero ou negativo", () => {
    const pecas = calcularVistaExplodida({
      largura_cm: 40,
      altura_cm: 40,
      profundidade_cm: 33,
      configuracao: { num_portas: 1, num_gavetas: 2 },
    });
    for (const p of pecas) {
      for (const dim of p.tamanho) expect(dim).toBeGreaterThan(0);
    }
  });
});
