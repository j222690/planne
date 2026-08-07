import { describe, test, expect } from "vitest";
import {
  comprimentoParede,
  colideNaParede,
  moverModuloNaParede,
  colideNoChao,
  moverModuloIlha,
  proximaPosicaoLivreNaParede,
} from "../editor-colisao";

const ambiente = { largura_cm: 400, profundidade_cm: 350 };

describe("comprimentoParede", () => {
  test("top/bottom usam a largura do ambiente", () => {
    expect(comprimentoParede("top", ambiente)).toBe(400);
    expect(comprimentoParede("bottom", ambiente)).toBe(400);
  });
  test("left/right usam a profundidade do ambiente", () => {
    expect(comprimentoParede("left", ambiente)).toBe(350);
    expect(comprimentoParede("right", ambiente)).toBe(350);
  });
});

describe("colideNaParede", () => {
  test("dois módulos sobrepostos colidem", () => {
    const candidato = { id: "a", posicao_x_cm: 50, largura_cm: 60 };
    const outros = [{ id: "b", posicao_x_cm: 80, largura_cm: 60 }]; // 80-140 vs 50-110 → sobrepõe
    expect(colideNaParede(candidato, outros)).toBe(true);
  });
  test("módulos encostados (borda a borda) NÃO colidem", () => {
    const candidato = { id: "a", posicao_x_cm: 0, largura_cm: 60 };
    const outros = [{ id: "b", posicao_x_cm: 60, largura_cm: 60 }];
    expect(colideNaParede(candidato, outros)).toBe(false);
  });
  test("ignora a si mesmo na lista de outros", () => {
    const candidato = { id: "a", posicao_x_cm: 50, largura_cm: 60 };
    expect(colideNaParede(candidato, [candidato])).toBe(false);
  });
});

describe("moverModuloNaParede", () => {
  test("move livremente quando não há colisão nem estoura os limites", () => {
    const atual = { id: "a", posicao_x_cm: 0, largura_cm: 60 };
    const novaX = moverModuloNaParede(atual, 100, "top", ambiente, []);
    expect(novaX).toBe(100);
  });
  test("clampa no início da parede (não deixa ir negativo)", () => {
    const atual = { id: "a", posicao_x_cm: 50, largura_cm: 60 };
    const novaX = moverModuloNaParede(atual, -30, "top", ambiente, []);
    expect(novaX).toBe(0);
  });
  test("clampa no fim da parede (não deixa passar do comprimento)", () => {
    const atual = { id: "a", posicao_x_cm: 50, largura_cm: 60 };
    const novaX = moverModuloNaParede(atual, 380, "top", ambiente, []); // 380+60=440 > 400
    expect(novaX).toBe(340); // 400-60
  });
  test("rejeita o movimento (mantém posição anterior) se colidir com outro módulo da mesma parede", () => {
    const atual = { id: "a", posicao_x_cm: 0, largura_cm: 60 };
    const outros = [{ id: "b", posicao_x_cm: 100, largura_cm: 60 }];
    const novaX = moverModuloNaParede(atual, 90, "top", ambiente, outros); // 90-150 colide com 100-160
    expect(novaX).toBe(0); // mantém a posição anterior, não trava travado no limite errado
  });
  test("usa o comprimento certo pra parede left/right (profundidade, não largura do ambiente)", () => {
    const atual = { id: "a", posicao_x_cm: 0, largura_cm: 60 };
    const novaX = moverModuloNaParede(atual, 500, "left", ambiente, []); // tentaria passar de 350
    expect(novaX).toBe(290); // 350-60
  });
});

describe("colideNoChao (ilha, AABB 2D)", () => {
  test("retângulos sobrepostos em X e Z colidem", () => {
    const candidato = {
      id: "a",
      posicao_x_cm: 100,
      posicao_y_cm: 100,
      largura_cm: 120,
      profundidade_cm: 90,
    };
    const outros = [
      { id: "b", posicao_x_cm: 150, posicao_y_cm: 130, largura_cm: 100, profundidade_cm: 90 },
    ];
    expect(colideNoChao(candidato, outros)).toBe(true);
  });
  test("sobrepostos em X mas NÃO em Z não colidem", () => {
    const candidato = {
      id: "a",
      posicao_x_cm: 100,
      posicao_y_cm: 0,
      largura_cm: 120,
      profundidade_cm: 90,
    };
    const outros = [
      { id: "b", posicao_x_cm: 150, posicao_y_cm: 200, largura_cm: 100, profundidade_cm: 90 },
    ];
    expect(colideNoChao(candidato, outros)).toBe(false);
  });
});

describe("moverModuloIlha", () => {
  test("move livremente em X e Z dentro dos limites do cômodo", () => {
    const atual = {
      id: "a",
      posicao_x_cm: 0,
      posicao_y_cm: 0,
      largura_cm: 120,
      profundidade_cm: 90,
    };
    const r = moverModuloIlha(atual, { x: 150, z: 100 }, ambiente, []);
    expect(r).toEqual({ posicao_x_cm: 150, posicao_y_cm: 100 });
  });
  test("clampa nos dois eixos independentemente", () => {
    const atual = {
      id: "a",
      posicao_x_cm: 0,
      posicao_y_cm: 0,
      largura_cm: 120,
      profundidade_cm: 90,
    };
    const r = moverModuloIlha(atual, { x: -50, z: 9999 }, ambiente, []);
    expect(r.posicao_x_cm).toBe(0);
    expect(r.posicao_y_cm).toBe(260); // 350-90
  });
  test("rejeita o movimento (mantém posição anterior) se colidir com outra ilha", () => {
    const atual = {
      id: "a",
      posicao_x_cm: 0,
      posicao_y_cm: 0,
      largura_cm: 120,
      profundidade_cm: 90,
    };
    const outros = [
      { id: "b", posicao_x_cm: 150, posicao_y_cm: 50, largura_cm: 100, profundidade_cm: 90 },
    ];
    const r = moverModuloIlha(atual, { x: 140, z: 60 }, ambiente, outros); // colide
    expect(r).toEqual({ posicao_x_cm: 0, posicao_y_cm: 0 });
  });
});

describe("proximaPosicaoLivreNaParede", () => {
  test("parede vazia: começa em 0", () => {
    expect(proximaPosicaoLivreNaParede(60, "top", ambiente, [])).toBe(0);
  });
  test("encaixa depois do último módulo já posicionado", () => {
    const existentes = [
      { id: "a", posicao_x_cm: 0, largura_cm: 60 },
      { id: "b", posicao_x_cm: 60, largura_cm: 80 },
    ];
    expect(proximaPosicaoLivreNaParede(60, "top", ambiente, existentes)).toBe(140);
  });
  test("clampa se não houver mais espaço (evita estourar a parede)", () => {
    const existentes = [{ id: "a", posicao_x_cm: 0, largura_cm: 380 }];
    expect(proximaPosicaoLivreNaParede(60, "top", ambiente, existentes)).toBe(340); // 400-60
  });
});
