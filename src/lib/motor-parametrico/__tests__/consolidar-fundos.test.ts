import { describe, test, expect } from "vitest";
import { consolidarFundos } from "../pecas";
import type { ModuloInstanciado, Peca, Material } from "../tipos";

const mat: Material = {
  id: "fundo6", codigo: "f6", nome_display: "MDF 6mm Branco", espessura_mm: 6,
  largura_chapa_mm: 2750, comprimento_chapa_mm: 1850, area_chapa_m2: 5, cor_hex: "#fff",
  acabamento: "melamina", preco_custo_chapa: 40, preco_venda_chapa: 0,
};

function fundo(id: string, largura_mm: number, comprimento_mm: number): Peca {
  return {
    id, modulo_instanciado_id: id, regra_nome: "fundo",
    largura_mm, comprimento_mm, espessura_mm: 6,
    largura_final_mm: largura_mm - 4, comprimento_final_mm: comprimento_mm - 4,
    material: mat, direcao_fio: "indiferente",
    fita_borda: { esquerda: false, direita: false, topo: false, base: false },
    quantidade: 1, etiqueta_producao: "FUNDO", status: "pendente",
  };
}

function modulo(id: string, x_cm: number, y_cm: number, altura_cm: number, larguraFundo: number, altFundo: number): ModuloInstanciado {
  return {
    id, modulo_template_id: "t", modulo_template_codigo: "base", modulo_template_versao: 1,
    largura_cm: 60, altura_cm, profundidade_cm: 55, parede: "top",
    posicao_x_cm: x_cm, posicao_y_cm: y_cm,
    configuracao: {} as ModuloInstanciado["configuracao"],
    material_corpo: mat, pecas: [fundo(`${id}_f`, larguraFundo, altFundo)],
    ferragens: [], nome_display: "Gabinete Base 60cm", ordem: 0,
  };
}

const contaFundos = (mods: ModuloInstanciado[]) =>
  mods.flatMap((m) => m.pecas).filter((p) => p.regra_nome === "fundo").length;
const areaFundos = (mods: ModuloInstanciado[]) =>
  mods.flatMap((m) => m.pecas).filter((p) => p.regra_nome === "fundo")
    .reduce((s, p) => s + p.largura_mm * p.comprimento_mm, 0);

describe("consolidarFundos", () => {
  test("corrido de 5 módulos base vira 1 fundo (não passa da chapa)", () => {
    // 5 × 570mm = 2850mm > 2730 útil → na verdade divide em 2. Use 4 × 570 = 2280 < 2730.
    const mods = [0, 60, 120, 180].map((x, i) => modulo(`b${i}`, x, 0, 72, 570, 690));
    const areaAntes = areaFundos(mods);
    consolidarFundos(mods, 2750, 1850);
    expect(contaFundos(mods)).toBe(1); // 2280mm cabe numa chapa
    expect(areaFundos(mods)).toBe(areaAntes); // área preservada
  });

  test("divide o fundo grande quando passa da chapa", () => {
    // 6 × 570 = 3420mm > 2730 útil → 2 partes
    const mods = [0, 60, 120, 180, 240, 300].map((x, i) => modulo(`b${i}`, x, 0, 72, 570, 690));
    consolidarFundos(mods, 2750, 1850);
    expect(contaFundos(mods)).toBe(2);
  });

  test("não mistura base com aéreo (faixas de altura diferentes)", () => {
    const base = [0, 60].map((x, i) => modulo(`b${i}`, x, 0, 72, 570, 690));
    const aereo = [0, 60].map((x, i) => modulo(`a${i}`, x, 150, 40, 570, 370));
    const mods = [...base, ...aereo];
    consolidarFundos(mods, 2750, 1850);
    // base vira 1 fundo, aéreo vira 1 fundo = 2 no total
    expect(contaFundos(mods)).toBe(2);
  });

  test("módulo único não é alterado", () => {
    const mods = [modulo("solo", 0, 0, 230, 570, 2170)];
    consolidarFundos(mods, 2750, 1850);
    expect(contaFundos(mods)).toBe(1);
    expect(mods[0].pecas.find((p) => p.regra_nome === "fundo")?.largura_mm).toBe(570);
  });
});
