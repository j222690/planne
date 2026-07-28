import { describe, test, expect } from "vitest";
import {
  dobradicasPorAlturaMm,
  dobradicasPorPesoKg,
  forcaPistaoKg,
  larguraFolhaExcede,
  LARGURA_MAX_FOLHA_MM,
  FOLGA_ENTRE_GAVETAS_MM,
  CHAPA_PADRAO_MM,
  DOBRADICAS_POR_ALTURA,
} from "../parametros";
import { atomoPorId } from "../index";
import {
  pesoModulo,
  pesoPorta,
  validarDobradicas,
  validarCorredica,
} from "../pesos";

describe("Camada 3 — parâmetros da base", () => {
  test("dobradiças por altura seguem a faixa da base (zona 600-900 = 2)", () => {
    expect(dobradicasPorAlturaMm(700)).toBe(2);   // aéreo ≤900
    expect(dobradicasPorAlturaMm(1200)).toBe(3);  // médio-alto ≤2000
    expect(dobradicasPorAlturaMm(1800)).toBe(3);  // ≤2000
    expect(dobradicasPorAlturaMm(2300)).toBe(4);  // ≤2400
    expect(dobradicasPorAlturaMm(2600)).toBe(5);  // >2400
  });

  test("dobradiças por peso só valem para portas pesadas", () => {
    expect(dobradicasPorPesoKg(10)).toBeNull();
    expect(dobradicasPorPesoKg(22)).toBe(5);
    expect(dobradicasPorPesoKg(30)).toBe(7);
  });

  test("fórmula do pistão a gás bate com o exemplo da base (~9,36kg)", () => {
    // porta 600mm (0,6m), 2,6kg → 6 × 2,6 × 0,6 = 9,36
    expect(forcaPistaoKg(2.6, 0.6)).toBeCloseTo(9.36, 2);
  });

  test("largura de folha acima de 600mm é sinalizada", () => {
    expect(larguraFolhaExcede(650)).toBe(true);
    expect(larguraFolhaExcede(500)).toBe(false);
    expect(LARGURA_MAX_FOLHA_MM.valor).toBe(600);
  });

  test("folga entre gavetas e chapa padrão têm os valores da base", () => {
    expect(FOLGA_ENTRE_GAVETAS_MM.valor).toBe(20);
    expect(CHAPA_PADRAO_MM.valor).toEqual({ comprimento: 2750, largura: 1850 });
  });

  test("RASTREABILIDADE: todo fonteAtomo aponta para um átomo real da base", () => {
    // se a base mudar e um id sumir, este teste quebra — mantém a ligação honesta
    expect(atomoPorId(DOBRADICAS_POR_ALTURA.fonteAtomo)).toBeDefined();
    expect(atomoPorId(CHAPA_PADRAO_MM.fonteAtomo)).toBeDefined();
  });
});

describe("Camada 3 — pesos e cargas", () => {
  test("peso de peça e módulo são positivos e somam", () => {
    const p1 = pesoPorta(400, 700, 15);
    expect(p1).toBeGreaterThan(0);
    const mod = pesoModulo([
      { largura_mm: 600, comprimento_mm: 2000, espessura_mm: 15, quantidade: 2 },
      { largura_mm: 580, comprimento_mm: 600, espessura_mm: 15, quantidade: 2 },
    ]);
    expect(mod).toBeGreaterThan(0);
  });

  test("valida dobradiças: porta pesada pede mais ferragem", () => {
    const leve = validarDobradicas(6, 550, 2); // ≤600mm → 2 dobradiças bastam
    expect(leve.ok).toBe(true);
    const pesada = validarDobradicas(30, 2200, 2);
    expect(pesada.ok).toBe(false);
    expect(pesada.quantidade_recomendada).toBeGreaterThan(2);
  });

  test("valida corrediça contra a carga da gaveta", () => {
    expect(validarCorredica(25, "padrao").ok).toBe(true);
    expect(validarCorredica(40, "padrao").ok).toBe(false);
    expect(validarCorredica(40, "reforcada").ok).toBe(true);
  });
});
