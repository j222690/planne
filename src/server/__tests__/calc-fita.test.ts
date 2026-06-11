import { describe, test, expect } from "vitest";
import { calcularMetrosFita } from "../../../api/_calc";
import type { PecaCorte } from "../../../api/_calc";

function peca(over: Partial<PecaCorte>): PecaCorte {
  return {
    movel: "x", peca: "x", material: "x",
    largura_mm: 0, comprimento_mm: 0, quantidade: 1,
    fita_l: false, fita_r: false, fita_t: false, fita_b: false,
    observacao: "",
    ...over,
  };
}

// Blindagem do BUG 1: a metragem de fita estava com largura/comprimento invertidos.
describe("calcularMetrosFita — convenção geométrica das bordas", () => {
  test("fita de topo (fita_t) corre ao longo da LARGURA, não do comprimento", () => {
    // peça 600 (larg) × 2000 (comp), só borda de topo
    const m = calcularMetrosFita([peca({ largura_mm: 600, comprimento_mm: 2000, fita_t: true })]);
    expect(m).toBeCloseTo(0.6); // 600mm = 0,6m (largura), NÃO 2,0m
  });

  test("fita de base (fita_b) corre ao longo da largura", () => {
    const m = calcularMetrosFita([peca({ largura_mm: 800, comprimento_mm: 450, fita_b: true })]);
    expect(m).toBeCloseTo(0.8);
  });

  test("fita esquerda/direita (fita_l/fita_r) corre ao longo do COMPRIMENTO", () => {
    const m = calcularMetrosFita([peca({ largura_mm: 600, comprimento_mm: 2000, fita_l: true, fita_r: true })]);
    expect(m).toBeCloseTo(4.0); // 2 × 2000mm = 4m, NÃO 1,2m
  });

  test("fita nos 4 lados = perímetro 2·(largura + comprimento)", () => {
    const m = calcularMetrosFita([peca({ largura_mm: 500, comprimento_mm: 700, fita_l: true, fita_r: true, fita_t: true, fita_b: true })]);
    expect(m).toBeCloseTo(2 * (0.5 + 0.7)); // 2,4m
  });

  test("multiplica pela quantidade de peças", () => {
    const m = calcularMetrosFita([peca({ largura_mm: 1000, comprimento_mm: 500, fita_t: true, quantidade: 3 })]);
    expect(m).toBeCloseTo(3.0);
  });

  test("peça sem fita não soma nada", () => {
    expect(calcularMetrosFita([peca({ largura_mm: 1000, comprimento_mm: 1000 })])).toBe(0);
  });
});
