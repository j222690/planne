import { describe, test, expect } from "vitest";
import { calcularSegmentosLivres, criarAmbienteManual } from "../ambiente";
import type { Parede, Porta, Janela } from "../tipos";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function paredeVazia(comprimento_cm: number, altura_cm = 270): Parede {
  return {
    id: "top",
    comprimento_cm,
    espessura_cm: 15,
    altura_cm,
    aberturas: [],
    segmentos_livres: [],
    obstaculos_adjacentes: [],
  };
}

function portaSimples(posicao_cm: number, largura_cm = 90): Porta {
  return {
    id: `porta_${posicao_cm}`,
    _tipo: "porta",
    parede: "bottom",
    posicao_cm,
    largura_cm,
    subtipo: "simples",
    altura_cm: 210,
    zona_exclusao_cm: 0,
    lado_dobradica: "esquerda",
    sentido_abertura: "para_fora",
  };
}

function portaGiro(posicao_cm: number, largura_cm = 90, zona = 90): Porta {
  return {
    id: `porta_giro_${posicao_cm}`,
    _tipo: "porta",
    parede: "bottom",
    posicao_cm,
    largura_cm,
    subtipo: "simples",
    altura_cm: 210,
    zona_exclusao_cm: zona,
    lado_dobradica: "esquerda",
    sentido_abertura: "para_dentro",
  };
}

function janelaAlta(posicao_cm: number, largura_cm = 120): Janela {
  return {
    id: `janela_${posicao_cm}`,
    _tipo: "janela",
    parede: "top",
    posicao_cm,
    largura_cm,
    subtipo: "abrir",
    altura_peitoril_cm: 100,
    altura_verga_cm: 220,
    bloqueia_base: false,
    bloqueia_aereo: false,
  };
}

function janelaBaixa(posicao_cm: number, largura_cm = 120): Janela {
  return {
    id: `janela_baixa_${posicao_cm}`,
    _tipo: "janela",
    parede: "top",
    posicao_cm,
    largura_cm,
    subtipo: "abrir",
    altura_peitoril_cm: 60,
    altura_verga_cm: 160,
    bloqueia_base: true,
    bloqueia_aereo: false,
  };
}

// ─── calcularSegmentosLivres ──────────────────────────────────────────────────

describe("calcularSegmentosLivres", () => {
  test("parede sem aberturas retorna 1 segmento = comprimento total", () => {
    const parede = paredeVazia(400);
    const segs = calcularSegmentosLivres(parede);

    expect(segs).toHaveLength(1);
    expect(segs[0].inicio_cm).toBe(0);
    expect(segs[0].fim_cm).toBe(400);
    expect(segs[0].comprimento_cm).toBe(400);
    expect(segs[0].bloqueado_por_janela_baixa).toBe(false);
  });

  test("porta no centro divide em 2 segmentos", () => {
    const parede: Parede = {
      ...paredeVazia(400),
      aberturas: [portaSimples(155, 90)],
    };
    const segs = calcularSegmentosLivres(parede);

    expect(segs).toHaveLength(2);
    expect(segs[0].inicio_cm).toBe(0);
    expect(segs[0].fim_cm).toBe(155);
    expect(segs[1].inicio_cm).toBe(245);
    expect(segs[1].fim_cm).toBe(400);
  });

  test("porta no início cria 1 segmento à direita", () => {
    const parede: Parede = {
      ...paredeVazia(400),
      aberturas: [portaSimples(0, 90)],
    };
    const segs = calcularSegmentosLivres(parede);

    expect(segs).toHaveLength(1);
    expect(segs[0].inicio_cm).toBe(90);
    expect(segs[0].comprimento_cm).toBe(310);
  });

  test("porta com giro para dentro exclui zona de circulação", () => {
    const parede: Parede = {
      ...paredeVazia(400),
      aberturas: [portaGiro(155, 90, 90)],
    };
    const segs = calcularSegmentosLivres(parede);

    // Com zona de exclusão 90cm à esquerda: posição excluída = [65, 245]
    expect(segs).toHaveLength(2);
    expect(segs[0].fim_cm).toBeLessThanOrEqual(155);
    expect(segs[1].inicio_cm).toBeGreaterThanOrEqual(245);
  });

  test("soma dos segmentos é menor que o comprimento total quando há aberturas", () => {
    const parede: Parede = {
      ...paredeVazia(400),
      aberturas: [portaSimples(100, 90), portaSimples(250, 80)],
    };
    const segs = calcularSegmentosLivres(parede);
    const soma = segs.reduce((s, seg) => s + seg.comprimento_cm, 0);

    expect(soma).toBeLessThan(400);
    expect(soma).toBe(400 - 90 - 80);
  });

  test("janela alta não marca segmento como bloqueado_por_janela_baixa", () => {
    const parede: Parede = {
      ...paredeVazia(400),
      aberturas: [janelaAlta(100, 120)],
    };
    const segs = calcularSegmentosLivres(parede);
    expect(segs.some(s => s.bloqueado_por_janela_baixa)).toBe(false);
  });

  test("janela baixa cria 2 segmentos (antes e depois) sem overlap com a abertura", () => {
    // A janela É uma abertura — cria um gap. Os segmentos livres ficam ao redor da janela,
    // portanto não há sobreposição geométrica entre segmentos e a janela.
    // O campo bloqueado_por_janela_baixa se tornará relevante em Fase 3 (Rule Engine)
    // quando o motor verificar clearance mínimo entre módulos e janelas baixas.
    const parede: Parede = {
      ...paredeVazia(400),
      aberturas: [janelaBaixa(100, 120)],
    };
    const segs = calcularSegmentosLivres(parede);

    // 2 segmentos: [0-100] e [220-400]
    expect(segs).toHaveLength(2);
    expect(segs[0].comprimento_cm).toBe(100);
    expect(segs[1].inicio_cm).toBe(220);
    expect(segs[1].comprimento_cm).toBe(180);
    // Segmentos não se sobrepõem com a abertura — bloqueado_por_janela_baixa = false
    expect(segs.every(s => !s.bloqueado_por_janela_baixa)).toBe(true);
  });
});

// ─── criarAmbienteManual ──────────────────────────────────────────────────────

describe("criarAmbienteManual", () => {
  test("cria ambiente com dimensões corretas", () => {
    const amb = criarAmbienteManual({ largura_cm: 400, profundidade_cm: 300, altura_cm: 270 });

    expect(amb.dimensoes.largura_cm).toBe(400);
    expect(amb.dimensoes.profundidade_cm).toBe(300);
    expect(amb.dimensoes.altura_cm).toBe(270);
    expect(amb.dimensoes.area_m2).toBeCloseTo(12, 1);
  });

  test("paredes top e bottom têm comprimento = largura_cm", () => {
    const amb = criarAmbienteManual({ largura_cm: 400, profundidade_cm: 300, altura_cm: 270 });

    expect(amb.paredes.top.comprimento_cm).toBe(400);
    expect(amb.paredes.bottom.comprimento_cm).toBe(400);
    expect(amb.paredes.left.comprimento_cm).toBe(300);
    expect(amb.paredes.right.comprimento_cm).toBe(300);
  });

  test("parede sem aberturas tem 1 segmento livre = comprimento total", () => {
    const amb = criarAmbienteManual({ largura_cm: 400, profundidade_cm: 300, altura_cm: 270 });

    expect(amb.paredes.top.segmentos_livres).toHaveLength(1);
    expect(amb.paredes.top.segmentos_livres[0].comprimento_cm).toBe(400);
  });

  test("porta cria abertura na parede correta e reduz segmentos", () => {
    const amb = criarAmbienteManual({
      largura_cm: 400,
      profundidade_cm: 300,
      altura_cm: 270,
      porta_parede: "bottom",
      porta_largura_cm: 90,
    });

    expect(amb.paredes.bottom.aberturas).toHaveLength(1);
    expect(amb.paredes.bottom.aberturas[0]._tipo).toBe("porta");
    // Segmento total deve ser menor que 400cm (porta excluída)
    const totalBottom = amb.paredes.bottom.segmentos_livres.reduce(
      (s, seg) => s + seg.comprimento_cm,
      0,
    );
    expect(totalBottom).toBeLessThan(400);
  });

  test("confianca_extracao = 1.0 para ambiente manual", () => {
    const amb = criarAmbienteManual({ largura_cm: 300, profundidade_cm: 250, altura_cm: 260 });
    expect(amb.confianca_extracao).toBe(1.0);
    expect(amb.fonte).toBe("manual");
  });

  test("invariante: area_m2 = largura × profundidade / 10000", () => {
    const largura = 320;
    const profundidade = 280;
    const amb = criarAmbienteManual({ largura_cm: largura, profundidade_cm: profundidade, altura_cm: 270 });

    const esperado = Math.round((largura * profundidade) / 10000 * 100) / 100;
    expect(amb.dimensoes.area_m2).toBe(esperado);
  });
});
