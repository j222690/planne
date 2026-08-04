import { describe, test, expect } from "vitest";
import { calcularVistaExplodida, calcularCenaCompleta } from "../vista-explodida";

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

  test("prateleiras só aparecem atrás de porta (não atrás de só gaveta)", () => {
    const comPorta = calcularVistaExplodida({
      largura_cm: 60,
      altura_cm: 72,
      profundidade_cm: 55,
      configuracao: { num_portas: 2, num_gavetas: 0, num_prateleiras: 2 },
    });
    expect(comPorta.filter((p) => p.tipo === "prateleira")).toHaveLength(2);

    const soGaveta = calcularVistaExplodida({
      largura_cm: 60,
      altura_cm: 72,
      profundidade_cm: 55,
      configuracao: { num_portas: 0, num_gavetas: 3, num_prateleiras: 2 },
    });
    expect(soGaveta.filter((p) => p.tipo === "prateleira")).toHaveLength(0);
  });
});

describe("calcularCenaCompleta", () => {
  test("2 módulos lado a lado ficam com centros em X diferentes, na ordem certa", () => {
    const cena = calcularCenaCompleta([
      {
        largura_cm: 60,
        altura_cm: 72,
        profundidade_cm: 55,
        configuracao: { num_portas: 2 },
        posicao_x_cm: 0,
        posicao_y_cm: 0,
        nome_display: "Base A",
      },
      {
        largura_cm: 80,
        altura_cm: 72,
        profundidade_cm: 55,
        configuracao: { num_portas: 2 },
        posicao_x_cm: 60,
        posicao_y_cm: 0,
        nome_display: "Base B",
      },
    ]);
    expect(cena).toHaveLength(2);
    expect(cena[0].origemX).toBe(0);
    expect(cena[1].origemX).toBeCloseTo(0.6);
    // o módulo B (à direita) tem todas as peças com X maior que o A
    const maxXA = Math.max(...cena[0].pecas.map((p) => p.posicao[0]));
    const minXB = Math.min(...cena[1].pecas.map((p) => p.posicao[0]));
    expect(minXB).toBeGreaterThan(maxXA);
  });

  test("módulo aéreo (posicao_y_cm ≥ 100) fica mais alto que módulo de piso", () => {
    const cena = calcularCenaCompleta([
      {
        largura_cm: 60,
        altura_cm: 72,
        profundidade_cm: 55,
        configuracao: { num_portas: 2 },
        posicao_x_cm: 0,
        posicao_y_cm: 0,
      },
      {
        largura_cm: 60,
        altura_cm: 40,
        profundidade_cm: 33,
        configuracao: { num_portas: 2 },
        posicao_x_cm: 0,
        posicao_y_cm: 150,
      },
    ]);
    const baseY = cena[0].pecas.find((p) => p.tipo === "base")!.posicao[1];
    const aereoY = cena[1].pecas.find((p) => p.tipo === "base")!.posicao[1];
    expect(aereoY).toBeGreaterThan(baseY);
  });

  test("ids das peças ficam únicos entre módulos (prefixados por módulo)", () => {
    const cena = calcularCenaCompleta([
      {
        largura_cm: 60,
        altura_cm: 72,
        profundidade_cm: 55,
        configuracao: { num_portas: 2 },
        posicao_x_cm: 0,
        posicao_y_cm: 0,
      },
      {
        largura_cm: 60,
        altura_cm: 72,
        profundidade_cm: 55,
        configuracao: { num_portas: 2 },
        posicao_x_cm: 60,
        posicao_y_cm: 0,
      },
    ]);
    const todosIds = cena.flatMap((m) => m.pecas.map((p) => p.id));
    expect(new Set(todosIds).size).toBe(todosIds.length);
  });
});
