import { describe, test, expect } from "vitest";
import {
  calcularVistaExplodida,
  calcularCenaCompleta,
  calcularPassosMontagem,
} from "../vista-explodida";

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
  test("2 módulos lado a lado (parede top) ficam com centros de grupo em X diferentes, na ordem certa", () => {
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
    expect(cena[0].grupoRotacaoY).toBe(0); // parede "top" (default) = sem rotação
    expect(cena[0].grupoPosicao[0]).toBeCloseTo(0.3); // centro do módulo A (60cm largura)
    expect(cena[1].grupoPosicao[0]).toBeCloseTo(1.0); // 0.6 + 0.8/2
    expect(cena[1].grupoPosicao[0]).toBeGreaterThan(cena[0].grupoPosicao[0]);
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
    expect(cena[1].grupoPosicao[1]).toBeGreaterThan(cena[0].grupoPosicao[1]);
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

  test("cozinha em L: módulo na parede 'left' fica rotacionado 90° e encostado em X=0", () => {
    const cena = calcularCenaCompleta(
      [
        {
          largura_cm: 60,
          altura_cm: 72,
          profundidade_cm: 55,
          configuracao: { num_portas: 2 },
          posicao_x_cm: 0,
          posicao_y_cm: 0,
          parede: "top",
        },
        {
          largura_cm: 60,
          altura_cm: 72,
          profundidade_cm: 55,
          configuracao: { num_portas: 2 },
          posicao_x_cm: 55,
          posicao_y_cm: 0,
          parede: "left",
        },
      ],
      { largura_cm: 300, profundidade_cm: 300 },
    );
    expect(cena[1].grupoRotacaoY).toBeCloseTo(Math.PI / 2);
    // encostado na parede esquerda: X do grupo = metade da profundidade do módulo
    expect(cena[1].grupoPosicao[0]).toBeCloseTo(0.275); // 0.55/2
    // avança pela parede em Z (não em X, que é fixo pela parede)
    expect(cena[1].grupoPosicao[2]).toBeCloseTo(0.55 + 0.3); // posicao_x_cm/100 + L/2
  });

  test("cozinha em U: módulo na parede 'right' fica rotacionado -90° e encostado na parede oposta", () => {
    const cena = calcularCenaCompleta(
      [
        {
          largura_cm: 60,
          altura_cm: 72,
          profundidade_cm: 55,
          configuracao: { num_portas: 2 },
          posicao_x_cm: 0,
          posicao_y_cm: 0,
          parede: "right",
        },
      ],
      { largura_cm: 300, profundidade_cm: 300 },
    );
    expect(cena[0].grupoRotacaoY).toBeCloseTo(-Math.PI / 2);
    expect(cena[0].grupoPosicao[0]).toBeCloseTo(3 - 0.275); // largura_amb - P/2
  });
});

describe("calcularPassosMontagem", () => {
  test("gabinete com porta e sem gaveta/prateleira: 3 passos (caixa, fundo, portas)", () => {
    const passos = calcularPassosMontagem({ num_portas: 2, num_gavetas: 0, num_prateleiras: 0 });
    expect(passos.map((p) => p.titulo)).toEqual([
      "Montar a caixa",
      "Fixar o fundo",
      "Instalar as portas",
    ]);
  });

  test("gaveteiro com prateleira: passos na ordem caixa → fundo → prateleiras → gavetas", () => {
    const passos = calcularPassosMontagem({ num_portas: 0, num_gavetas: 3, num_prateleiras: 1 });
    expect(passos.map((p) => p.titulo)).toEqual([
      "Montar a caixa",
      "Fixar o fundo",
      "Instalar as prateleiras",
      "Instalar as gavetas",
    ]);
  });

  test("todo módulo cobre todos os tipos de peça geradas (nenhuma peça fica sem passo)", () => {
    const cfg = { num_portas: 2, num_gavetas: 2, num_prateleiras: 1 };
    const pecas = calcularVistaExplodida({
      largura_cm: 80,
      altura_cm: 90,
      profundidade_cm: 55,
      configuracao: cfg,
    });
    const passos = calcularPassosMontagem(cfg);
    const tiposCobertos = new Set(passos.flatMap((p) => p.tipos));
    for (const peca of pecas) expect(tiposCobertos.has(peca.tipo)).toBe(true);
  });

  test("ferragens são separadas por passo certo (dobradiça só em portas, corrediça só em gavetas)", () => {
    const ferragens = [
      { tipo: "dobradica_35mm_110grau", quantidade: 4 },
      { tipo: "corredicao_tandem_400mm", quantidade: 4 },
      { tipo: "ajustador_pe_100mm", quantidade: 4 },
    ];
    const passos = calcularPassosMontagem({ num_portas: 2, num_gavetas: 2 }, ferragens);
    const passoCaixa = passos.find((p) => p.titulo === "Montar a caixa")!;
    const passoPortas = passos.find((p) => p.titulo === "Instalar as portas")!;
    const passoGavetas = passos.find((p) => p.titulo === "Instalar as gavetas")!;
    expect(passoCaixa.ferragens.some((f) => f.tipo.includes("Pé regulável"))).toBe(true);
    expect(passoPortas.ferragens.some((f) => f.tipo.includes("Dobradiça"))).toBe(true);
    expect(passoGavetas.ferragens.some((f) => f.tipo.includes("Corrediça"))).toBe(true);
    expect(passoPortas.ferragens.some((f) => f.tipo.includes("Corrediça"))).toBe(false);
  });
});
