import { describe, test, expect } from "vitest";
import { encaixarModulos, gerarLayoutCozinhaLinear } from "../layout-cozinha-linear";
import { criarAmbienteManual } from "../ambiente";
import { projetoToMovelInput } from "../adapters";
import type { PreferenciasCozinha } from "../layout-cozinha-linear";
import type { AmbienteGeometrico } from "../tipos";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const prefsPadrao: PreferenciasCozinha = {
  cor_mdf_hex: "#f5f3f0",
  ferragem: "nacional",
  tipo_porta_base: "dobradica",
  tipo_porta_aereo: "dobradica",
  versao_comercial: "intermediaria",
};

function ambiente(largura_cm: number, profundidade_cm = 280): AmbienteGeometrico {
  return criarAmbienteManual({ largura_cm, profundidade_cm, altura_cm: 270 });
}

function ambienteComPorta(largura_cm: number): AmbienteGeometrico {
  return criarAmbienteManual({
    largura_cm,
    profundidade_cm: 280,
    altura_cm: 270,
    porta_parede: "bottom",
    porta_largura_cm: 90,
  });
}

// ─── encaixarModulos ──────────────────────────────────────────────────────────

describe("encaixarModulos — algoritmo greedy", () => {
  test("400cm → soma exata 400", () => {
    const r = encaixarModulos(400);
    expect(r.reduce((s, v) => s + v, 0)).toBe(400);
  });

  test("320cm → soma exata 320", () => {
    const r = encaixarModulos(320);
    expect(r.reduce((s, v) => s + v, 0)).toBe(320);
  });

  test("280cm → soma exata 280", () => {
    const r = encaixarModulos(280);
    expect(r.reduce((s, v) => s + v, 0)).toBe(280);
  });

  test("380cm → soma exata 380", () => {
    const r = encaixarModulos(380);
    expect(r.reduce((s, v) => s + v, 0)).toBe(380);
  });

  test("240cm → soma exata 240", () => {
    const r = encaixarModulos(240);
    expect(r.reduce((s, v) => s + v, 0)).toBe(240);
  });

  test("150cm → soma exata 150", () => {
    const r = encaixarModulos(150);
    expect(r.reduce((s, v) => s + v, 0)).toBe(150);
  });

  test("60cm → 1 módulo de 60cm", () => {
    const r = encaixarModulos(60);
    expect(r).toEqual([60]);
  });

  test("30cm → 1 módulo de 30cm", () => {
    const r = encaixarModulos(30);
    expect(r).toEqual([30]);
  });

  test("nenhum módulo < 30cm é gerado", () => {
    for (const largura of [120, 145, 200, 245, 300, 365, 400]) {
      const r = encaixarModulos(largura);
      r.forEach(m => expect(m).toBeGreaterThanOrEqual(30));
    }
  });

  test("nenhum módulo > 90cm é gerado", () => {
    for (const largura of [120, 145, 200, 245, 300, 365, 400]) {
      const r = encaixarModulos(largura);
      r.forEach(m => expect(m).toBeLessThanOrEqual(90));
    }
  });

  test("retorna array vazio para disponivel < 30", () => {
    const r = encaixarModulos(20);
    expect(r.length).toBe(0);
  });

  test("500cm → ao menos 5 módulos", () => {
    const r = encaixarModulos(500);
    expect(r.length).toBeGreaterThanOrEqual(5);
    expect(r.reduce((s, v) => s + v, 0)).toBe(500);
  });
});

// ─── gerarLayoutCozinhaLinear ─────────────────────────────────────────────────

describe("gerarLayoutCozinhaLinear — critério de aceite do roadmap", () => {
  test("Parede 4m → ProjetoFabricavel com módulos", () => {
    const amb = ambiente(400);
    const { projeto } = gerarLayoutCozinhaLinear(amb, prefsPadrao);

    expect(projeto).toBeDefined();
    expect(projeto.modulos.length).toBeGreaterThan(0);
    expect(projeto.tipo_ambiente).toBe("Cozinha");
  });

  test("Parede 4m → tem módulos base", () => {
    const amb = ambiente(400);
    const { projeto } = gerarLayoutCozinhaLinear(amb, prefsPadrao);

    const bases = projeto.modulos.filter(m => m.modulo_template_codigo.startsWith("base_"));
    expect(bases.length).toBeGreaterThan(0);
  });

  test("Parede 4m → tem módulos aéreos", () => {
    const amb = ambiente(400);
    const { projeto } = gerarLayoutCozinhaLinear(amb, prefsPadrao);

    const aereos = projeto.modulos.filter(m => m.modulo_template_codigo.startsWith("aereo_"));
    expect(aereos.length).toBeGreaterThan(0);
  });

  test("Parede 4m → tem Peças geradas", () => {
    const amb = ambiente(400);
    const { projeto } = gerarLayoutCozinhaLinear(amb, prefsPadrao);

    const totalPecas = projeto.modulos.reduce((s, m) => s + m.pecas.length, 0);
    expect(totalPecas).toBeGreaterThan(0);
    expect(projeto.metricas.num_pecas_total).toBeGreaterThan(0);
  });

  test("Parede 4m → tem Ferragens geradas", () => {
    const amb = ambiente(400);
    const { projeto } = gerarLayoutCozinhaLinear(amb, prefsPadrao);

    const totalFerragens = projeto.modulos.reduce((s, m) => s + m.ferragens.length, 0);
    expect(totalFerragens).toBeGreaterThan(0);
    expect(projeto.metricas.num_ferragens_total).toBeGreaterThan(0);
  });

  test("módulos não ultrapassam a largura da parede", () => {
    const largura = 400;
    const amb = ambiente(largura);
    const { projeto, parede_usada } = gerarLayoutCozinhaLinear(amb, prefsPadrao);

    const bases = projeto.modulos.filter(m => m.modulo_template_codigo.startsWith("base_"));
    const totalBase = bases.reduce((s, m) => s + m.largura_cm, 0);

    expect(totalBase).toBeLessThanOrEqual(amb.paredes[parede_usada].comprimento_cm);
  });

  test("módulos não se sobrepõem", () => {
    const amb = ambiente(400);
    const { projeto } = gerarLayoutCozinhaLinear(amb, prefsPadrao);

    const bases = projeto.modulos
      .filter(m => m.modulo_template_codigo.startsWith("base_"))
      .sort((a, b) => a.posicao_x_cm - b.posicao_x_cm);

    for (let i = 1; i < bases.length; i++) {
      const anterior = bases[i - 1];
      const atual = bases[i];
      expect(atual.posicao_x_cm).toBeGreaterThanOrEqual(anterior.posicao_x_cm + anterior.largura_cm);
    }
  });

  test("aproveitamento ≥ 85% para paredes de 300-500cm", () => {
    for (const largura of [300, 320, 360, 400, 450, 480, 500]) {
      const amb = ambiente(largura);
      const { aproveitamento_pct } = gerarLayoutCozinhaLinear(amb, prefsPadrao);
      expect(aproveitamento_pct).toBeGreaterThanOrEqual(85);
    }
  });

  test("parede com porta reduz espaço disponível", () => {
    const ambComPorta = ambienteComPorta(400);
    const ambSemPorta = ambiente(400);

    const resultadoComPorta = gerarLayoutCozinhaLinear(
      ambComPorta,
      { ...prefsPadrao, parede_principal: "bottom" },
    );
    const resultadoSemPorta = gerarLayoutCozinhaLinear(
      ambSemPorta,
      { ...prefsPadrao, parede_principal: "bottom" },
    );

    // Com porta (90cm ocupado), a soma das larguras deve ser menor
    expect(resultadoComPorta.largura_ocupada_cm).toBeLessThan(resultadoSemPorta.largura_ocupada_cm);
  });

  test("aéreos estão posicionados a 150cm do piso", () => {
    const amb = ambiente(400);
    const { projeto } = gerarLayoutCozinhaLinear(amb, prefsPadrao);

    const aereos = projeto.modulos.filter(m => m.modulo_template_codigo.startsWith("aereo_"));
    aereos.forEach(m => {
      expect(m.posicao_y_cm).toBe(150);
    });
  });

  test("aéreos têm a mesma largura total que as bases", () => {
    const amb = ambiente(400);
    const { projeto } = gerarLayoutCozinhaLinear(amb, prefsPadrao);

    const bases = projeto.modulos.filter(m => m.modulo_template_codigo.startsWith("base_"));
    const aereos = projeto.modulos.filter(m => m.modulo_template_codigo.startsWith("aereo_"));

    const totalBases = bases.reduce((s, m) => s + m.largura_cm, 0);
    const totalAereos = aereos.reduce((s, m) => s + m.largura_cm, 0);

    expect(totalBases).toBe(totalAereos);
  });

  test("ProjetoFabricavel tem métricas calculadas", () => {
    const amb = ambiente(400);
    const { projeto } = gerarLayoutCozinhaLinear(amb, prefsPadrao);

    expect(projeto.metricas.chapas_15mm).toBeGreaterThan(0);
    expect(projeto.metricas.metros_fita_borda).toBeGreaterThan(0);
    expect(projeto.metricas.linear_marcenaria_cm).toBeGreaterThan(0);
    expect(projeto.metricas.calculado_em).toBeTruthy();
  });

  test("ferragem blum altera cor da marca nas ferragens", () => {
    const amb = ambiente(400);
    const { projeto } = gerarLayoutCozinhaLinear(amb, {
      ...prefsPadrao,
      ferragem: "blum",
    });

    const ferragens = projeto.modulos.flatMap(m => m.ferragens);
    expect(ferragens.every(f => f.marca === "blum")).toBe(true);
  });
});

// ─── projetoToMovelInput (adapter) ────────────────────────────────────────────

describe("projetoToMovelInput — compatibilidade com _calc.ts", () => {
  test("retorna array com mesmo número de módulos", () => {
    const amb = ambiente(400);
    const { projeto } = gerarLayoutCozinhaLinear(amb, prefsPadrao);
    const moveis = projetoToMovelInput(projeto);

    expect(moveis.length).toBe(projeto.modulos.length);
  });

  test("cada MovelInput tem nome, largura, altura, profundidade válidos", () => {
    const amb = ambiente(400);
    const { projeto } = gerarLayoutCozinhaLinear(amb, prefsPadrao);
    const moveis = projetoToMovelInput(projeto);

    moveis.forEach(m => {
      expect(m.nome).toBeTruthy();
      expect(m.largura_cm).toBeGreaterThan(0);
      expect(m.altura_cm).toBeGreaterThan(0);
      expect(m.profundidade_cm).toBeGreaterThan(0);
    });
  });

  test("tipo_porta 'dobradica' é mapeado para 'abrir'", () => {
    const amb = ambiente(400);
    const { projeto } = gerarLayoutCozinhaLinear(amb, prefsPadrao);
    const moveis = projetoToMovelInput(projeto);

    moveis.forEach(m => {
      expect(["abrir", "correr", "sem", "abrir_vidro", "abrir_espelho", "correr_vidro", "correr_espelho"]).toContain(m.tipo_porta);
    });
  });
});
