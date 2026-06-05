import { describe, test, expect } from "vitest";
import { validarProjeto, CIRCULACAO_MINIMA_CM } from "../rule-engine";
import { gerarLayoutCozinhaLinear } from "../layout-cozinha-linear";
import { criarAmbienteManual } from "../ambiente";
import type { PreferenciasCozinha } from "../layout-cozinha-linear";
import type { ProjetoFabricavel, ModuloInstanciado } from "../tipos";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const prefs: PreferenciasCozinha = {
  cor_mdf_hex: "#f5f3f0",
  ferragem: "nacional",
  tipo_porta_base: "dobradica",
  tipo_porta_aereo: "dobradica",
  versao_comercial: "intermediaria",
};

/** Projeto saudável: parede 4m, ambiente fundo 3m → circulação 245cm. */
function projetoSaudavel(): ProjetoFabricavel {
  const amb = criarAmbienteManual({ largura_cm: 400, profundidade_cm: 300, altura_cm: 270 });
  return gerarLayoutCozinhaLinear(amb, { ...prefs, parede_principal: "top" }).projeto;
}

// ─── Validação de projeto saudável ────────────────────────────────────────────

describe("validarProjeto — projeto saudável", () => {
  test("retorna estrutura completa de resultado", () => {
    const r = validarProjeto(projetoSaudavel());

    expect(r.status).toBeDefined();
    expect(typeof r.score).toBe("number");
    expect(Array.isArray(r.violacoes)).toBe(true);
    expect(r.resumo.total_regras_avaliadas).toBe(8);
    expect(r.avaliado_em).toBeTruthy();
  });

  test("cozinha 4m × 3m de fundo é aprovada", () => {
    const r = validarProjeto(projetoSaudavel());
    expect(r.status).toBe("aprovado");
    expect(r.resumo.erros).toBe(0);
  });

  test("score de projeto aprovado é 100", () => {
    const r = validarProjeto(projetoSaudavel());
    expect(r.score).toBe(100);
  });

  test("score sempre entre 0 e 100", () => {
    const r = validarProjeto(projetoSaudavel());
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});

// ─── Regra: circulação mínima ─────────────────────────────────────────────────

describe("regra circulacao_minima", () => {
  test("ambiente estreito (fundo 120cm) reprova por circulação", () => {
    // fundo 120cm - 55cm base = 65cm circulação < 80cm mínimo
    const amb = criarAmbienteManual({ largura_cm: 400, profundidade_cm: 120, altura_cm: 270 });
    const projeto = gerarLayoutCozinhaLinear(amb, { ...prefs, parede_principal: "top" }).projeto;
    const r = validarProjeto(projeto);

    const viol = r.violacoes.find(v => v.regra === "circulacao_minima");
    expect(viol).toBeDefined();
    expect(viol?.severidade).toBe("erro");
    expect(r.status).toBe("reprovado");
  });

  test("circulação confortável (fundo 300cm) não gera violação", () => {
    const amb = criarAmbienteManual({ largura_cm: 400, profundidade_cm: 300, altura_cm: 270 });
    const projeto = gerarLayoutCozinhaLinear(amb, { ...prefs, parede_principal: "top" }).projeto;
    const r = validarProjeto(projeto);

    const viol = r.violacoes.find(v => v.regra === "circulacao_minima");
    expect(viol).toBeUndefined();
  });

  test("circulação apertada (fundo 140cm) gera alerta, não erro", () => {
    // fundo 140cm - 55cm = 85cm → entre 80 (mín) e 90 (confortável) = alerta
    const amb = criarAmbienteManual({ largura_cm: 400, profundidade_cm: 140, altura_cm: 270 });
    const projeto = gerarLayoutCozinhaLinear(amb, { ...prefs, parede_principal: "top" }).projeto;
    const r = validarProjeto(projeto);

    const viol = r.violacoes.find(v => v.regra === "circulacao_minima");
    expect(viol?.severidade).toBe("alerta");
    expect(r.status).toBe("aprovado_com_alertas");
  });

  test("constante de circulação mínima é 80cm", () => {
    expect(CIRCULACAO_MINIMA_CM).toBe(80);
  });
});

// ─── Regra: módulo dentro da parede ───────────────────────────────────────────

describe("regra modulo_dentro_parede", () => {
  test("módulo que ultrapassa a parede gera erro", () => {
    const projeto = projetoSaudavel();
    // Forçar um módulo a ultrapassar
    const mod = projeto.modulos[0];
    const moduloRuim: ModuloInstanciado = {
      ...mod,
      posicao_x_cm: 380,
      largura_cm: 60, // termina em 440, parede tem 400
    };
    const projetoRuim: ProjetoFabricavel = {
      ...projeto,
      modulos: [moduloRuim],
    };
    const r = validarProjeto(projetoRuim);

    const viol = r.violacoes.find(v => v.regra === "modulo_dentro_parede");
    expect(viol).toBeDefined();
    expect(viol?.severidade).toBe("erro");
    expect(viol?.modulo_id).toBe(moduloRuim.id);
  });

  test("módulos do layout normal não ultrapassam a parede", () => {
    const r = validarProjeto(projetoSaudavel());
    const viol = r.violacoes.find(v => v.regra === "modulo_dentro_parede");
    expect(viol).toBeUndefined();
  });
});

// ─── Regra: módulo invade porta ───────────────────────────────────────────────

describe("regra modulo_invade_porta", () => {
  test("módulo sobreposto a porta gera erro", () => {
    const amb = criarAmbienteManual({
      largura_cm: 400,
      profundidade_cm: 300,
      altura_cm: 270,
      porta_parede: "top",
      porta_largura_cm: 90,
    });
    const projeto = gerarLayoutCozinhaLinear(amb, { ...prefs, parede_principal: "top" }).projeto;

    // Forçar módulo sobre a porta (porta está centralizada ~155-245)
    const mod = projeto.modulos[0];
    const moduloRuim: ModuloInstanciado = { ...mod, posicao_x_cm: 160, largura_cm: 60 };
    const projetoRuim: ProjetoFabricavel = { ...projeto, modulos: [moduloRuim] };
    const r = validarProjeto(projetoRuim);

    const viol = r.violacoes.find(v => v.regra === "modulo_invade_porta");
    expect(viol).toBeDefined();
    expect(viol?.severidade).toBe("erro");
  });

  test("layout que respeita segmentos livres não invade porta", () => {
    const amb = criarAmbienteManual({
      largura_cm: 400,
      profundidade_cm: 300,
      altura_cm: 270,
      porta_parede: "top",
      porta_largura_cm: 90,
    });
    const projeto = gerarLayoutCozinhaLinear(amb, { ...prefs, parede_principal: "top" }).projeto;
    const r = validarProjeto(projeto);

    const viol = r.violacoes.find(v => v.regra === "modulo_invade_porta");
    expect(viol).toBeUndefined();
  });
});

// ─── Regra: aéreo colide com teto ─────────────────────────────────────────────

describe("regra aereo_colide_teto", () => {
  test("aéreo que ultrapassa o teto gera erro", () => {
    const projeto = projetoSaudavel();
    const aereo = projeto.modulos.find(m => m.modulo_template_codigo.startsWith("aereo_"))!;
    const aereoRuim: ModuloInstanciado = {
      ...aereo,
      posicao_y_cm: 250,
      altura_cm: 40, // topo em 290, teto 270
    };
    const projetoRuim: ProjetoFabricavel = { ...projeto, modulos: [aereoRuim] };
    const r = validarProjeto(projetoRuim);

    const viol = r.violacoes.find(v => v.regra === "aereo_colide_teto");
    expect(viol).toBeDefined();
    expect(viol?.severidade).toBe("erro");
  });
});

// ─── Regra: largura de módulo válida ──────────────────────────────────────────

describe("regra largura_modulo_valida", () => {
  test("módulo menor que 30cm gera alerta", () => {
    const projeto = projetoSaudavel();
    const mod = projeto.modulos[0];
    const moduloPequeno: ModuloInstanciado = { ...mod, largura_cm: 20, posicao_x_cm: 0 };
    const projetoRuim: ProjetoFabricavel = { ...projeto, modulos: [moduloPequeno] };
    const r = validarProjeto(projetoRuim);

    const viol = r.violacoes.find(v => v.regra === "largura_modulo_valida");
    expect(viol).toBeDefined();
    expect(viol?.severidade).toBe("alerta");
  });

  test("módulo maior que 90cm gera alerta", () => {
    const projeto = projetoSaudavel();
    const mod = projeto.modulos[0];
    const moduloGrande: ModuloInstanciado = { ...mod, largura_cm: 120, posicao_x_cm: 0 };
    const projetoRuim: ProjetoFabricavel = { ...projeto, modulos: [moduloGrande] };
    const r = validarProjeto(projetoRuim);

    const viol = r.violacoes.find(v => v.regra === "largura_modulo_valida");
    expect(viol?.severidade).toBe("alerta");
  });

  test("módulos padrão (30-90cm) não geram alerta de largura", () => {
    const r = validarProjeto(projetoSaudavel());
    const viol = r.violacoes.find(v => v.regra === "largura_modulo_valida");
    expect(viol).toBeUndefined();
  });
});

// ─── Score e status ───────────────────────────────────────────────────────────

describe("score e status", () => {
  test("1 erro derruba o score em 25 pontos", () => {
    const projeto = projetoSaudavel();
    const mod = projeto.modulos[0];
    const moduloRuim: ModuloInstanciado = { ...mod, posicao_x_cm: 380, largura_cm: 60 };
    const projetoRuim: ProjetoFabricavel = { ...projeto, modulos: [moduloRuim] };
    const r = validarProjeto(projetoRuim);

    expect(r.score).toBeLessThanOrEqual(75);
    expect(r.status).toBe("reprovado");
  });

  test("projeto com apenas alertas é aprovado_com_alertas", () => {
    const amb = criarAmbienteManual({ largura_cm: 400, profundidade_cm: 140, altura_cm: 270 });
    const projeto = gerarLayoutCozinhaLinear(amb, { ...prefs, parede_principal: "top" }).projeto;
    const r = validarProjeto(projeto);

    expect(r.resumo.erros).toBe(0);
    expect(r.resumo.alertas).toBeGreaterThan(0);
    expect(r.status).toBe("aprovado_com_alertas");
  });

  test("validarProjeto é determinística (mesmo input → mesmo veredicto)", () => {
    const projeto = projetoSaudavel();
    const r1 = validarProjeto(projeto);
    const r2 = validarProjeto(projeto);

    expect(r1.status).toBe(r2.status);
    expect(r1.score).toBe(r2.score);
    expect(r1.violacoes.length).toBe(r2.violacoes.length);
  });
});
