import { describe, test, expect } from "vitest";
import { consolidarCorrido } from "../pecas";
import type { ModuloInstanciado, Peca, Material } from "../tipos";

const mat: Material = {
  id: "m", codigo: "m", nome_display: "MDF 15mm Branco", espessura_mm: 15,
  largura_chapa_mm: 2750, comprimento_chapa_mm: 1850, area_chapa_m2: 5, cor_hex: "#fff",
  acabamento: "melamina", preco_custo_chapa: 85, preco_venda_chapa: 0,
};

function peca(id: string, regra: string, largura_mm: number, comprimento_mm: number, esp = 15): Peca {
  return {
    id, modulo_instanciado_id: id, regra_nome: regra,
    largura_mm, comprimento_mm, espessura_mm: esp as Peca["espessura_mm"],
    largura_final_mm: largura_mm - 4, comprimento_final_mm: comprimento_mm - 4,
    material: mat, direcao_fio: "indiferente",
    fita_borda: { esquerda: false, direita: false, topo: false, base: false },
    quantidade: 1, etiqueta_producao: regra.toUpperCase(), status: "pendente",
  };
}

// gabinete base de 60cm: 2 laterais (P×A), teto, base (Lint×P), fundo (Lint×Ai 6mm)
function modBase(id: string, x_cm: number): ModuloInstanciado {
  const P = 550, A = 720, Lint = 570;
  return {
    id, modulo_template_id: "t", modulo_template_codigo: "base", modulo_template_versao: 1,
    largura_cm: 60, altura_cm: 72, profundidade_cm: 55, parede: "top",
    posicao_x_cm: x_cm, posicao_y_cm: 0,
    configuracao: {} as ModuloInstanciado["configuracao"],
    material_corpo: mat, nome_display: "Gabinete Base 60cm", ferragens: [], ordem: 0,
    pecas: [
      peca(`${id}_l0`, "lateral", P, A),
      peca(`${id}_l1`, "lateral", P, A),
      peca(`${id}_teto`, "teto", Lint, P),
      peca(`${id}_base`, "base", Lint, P),
      peca(`${id}_fundo`, "fundo", Lint, A - 30, 6),
      peca(`${id}_porta`, "porta_dobradica", 300, A, 15),
    ],
  };
}

const conta = (mods: ModuloInstanciado[], regra: string) =>
  mods.flatMap((m) => m.pecas).filter((p) => p.regra_nome === regra).length;

describe("consolidarCorrido — corpo do corrido", () => {
  test("4 gabinetes: laterais viram 2 Lateral + 3 Divisória", () => {
    const mods = [0, 60, 120, 180].map((x, i) => modBase(`b${i}`, x));
    consolidarCorrido(mods, 2750, 1850);
    expect(conta(mods, "lateral")).toBe(2);     // pontas
    expect(conta(mods, "divisoria")).toBe(3);   // N−1 internas
  });

  test("teto e base viram contínuos (menos peças)", () => {
    const mods = [0, 60, 120, 180].map((x, i) => modBase(`b${i}`, x));
    consolidarCorrido(mods, 2750, 1850);
    // 4×60cm = 240cm de vão < 273cm → 1 peça de teto e 1 de base
    expect(conta(mods, "teto")).toBe(1);
    expect(conta(mods, "base")).toBe(1);
    expect(conta(mods, "fundo")).toBe(1);
  });

  test("portas continuam por vão (não mexe)", () => {
    const mods = [0, 60, 120, 180].map((x, i) => modBase(`b${i}`, x));
    const antes = conta(mods, "porta_dobradica");
    consolidarCorrido(mods, 2750, 1850);
    expect(conta(mods, "porta_dobradica")).toBe(antes);
  });

  test("corrido largo divide teto/base ao passar da chapa", () => {
    const mods = [0, 60, 120, 180, 240, 300].map((x, i) => modBase(`b${i}`, x));
    // 6×60 = 360cm externo → vão ~357cm > 273 → 2 partes
    consolidarCorrido(mods, 2750, 1850);
    expect(conta(mods, "teto")).toBe(2);
    expect(conta(mods, "lateral")).toBe(2);
    expect(conta(mods, "divisoria")).toBe(5); // 6−1
  });

  test("módulo único (torre) não é alterado", () => {
    const mods = [modBase("solo", 0)];
    consolidarCorrido(mods, 2750, 1850);
    expect(conta(mods, "lateral")).toBe(2);
    expect(conta(mods, "divisoria")).toBe(0);
  });
});
