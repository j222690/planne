import { describe, test, expect } from "vitest";
import {
  calcularOrcamentoCompleto,
  gerarTresVersoes,
  CONFIG_CUSTO_PADRAO,
} from "../orcamento-inteligente";
import { gerarLayoutCozinhaLinear } from "../layout-cozinha-linear";
import { criarAmbienteManual } from "../ambiente";
import type { PreferenciasCozinha } from "../layout-cozinha-linear";
import type { ProjetoFabricavel } from "../tipos";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const prefs: PreferenciasCozinha = {
  cor_mdf_hex: "#f5f3f0",
  ferragem: "nacional",
  tipo_porta_base: "dobradica",
  tipo_porta_aereo: "dobradica",
  versao_comercial: "intermediaria",
};

function projeto(largura_cm = 400): ProjetoFabricavel {
  const amb = criarAmbienteManual({ largura_cm, profundidade_cm: 300, altura_cm: 270 });
  return gerarLayoutCozinhaLinear(amb, { ...prefs, parede_principal: "top" }).projeto;
}

// ─── calcularOrcamentoCompleto ────────────────────────────────────────────────

describe("calcularOrcamentoCompleto", () => {
  test("retorna todas as camadas de custo", () => {
    const orc = calcularOrcamentoCompleto(projeto());
    expect(orc.custo_materiais.total).toBeGreaterThan(0);
    expect(orc.custo_producao.subtotal).toBeGreaterThan(0);
    expect(orc.custo_instalacao.subtotal).toBeGreaterThan(0);
    expect(orc.custos_indiretos.subtotal).toBeGreaterThan(0);
    expect(orc.analise_financeira.preco_venda).toBeGreaterThan(0);
  });

  test("custo de produção soma as 5 etapas", () => {
    const cp = calcularOrcamentoCompleto(projeto()).custo_producao;
    const soma = cp.corte_cnc.total + cp.bordagem.total + cp.usinagem.total +
      cp.montagem.total + cp.acabamento.total;
    expect(cp.subtotal).toBeCloseTo(soma, 1);
  });

  test("cada etapa de produção: total = horas × valor_hora", () => {
    const cp = calcularOrcamentoCompleto(projeto()).custo_producao;
    for (const etapa of [cp.corte_cnc, cp.bordagem, cp.usinagem, cp.montagem, cp.acabamento]) {
      expect(etapa.total).toBeCloseTo(etapa.horas_estimadas * etapa.valor_hora, 1);
    }
  });

  test("preço de venda > custo total (margem positiva)", () => {
    const af = calcularOrcamentoCompleto(projeto()).analise_financeira;
    expect(af.preco_venda).toBeGreaterThan(af.custo_total);
    expect(af.lucro_bruto).toBeGreaterThan(0);
  });

  test("preço mínimo = custo × 1.05", () => {
    const af = calcularOrcamentoCompleto(projeto()).analise_financeira;
    expect(af.preco_minimo).toBeCloseTo(af.custo_total * 1.05, 0);
  });

  test("lucro_pct coerente com lucro_bruto / preco_venda", () => {
    const af = calcularOrcamentoCompleto(projeto()).analise_financeira;
    expect(af.lucro_pct).toBeCloseTo((af.lucro_bruto / af.preco_venda) * 100, 0);
  });

  test("gera 1 item comercial por módulo", () => {
    const p = projeto();
    const orc = calcularOrcamentoCompleto(p);
    expect(orc.itens.length).toBe(p.modulos.length);
  });

  test("soma dos itens ≈ preço de venda", () => {
    const orc = calcularOrcamentoCompleto(projeto());
    const somaItens = orc.itens.reduce((s, i) => s + i.total, 0);
    expect(somaItens).toBeCloseTo(orc.analise_financeira.preco_venda, 0);
  });

  test("custos indiretos incluem overhead, imposto e comissão", () => {
    const ci = calcularOrcamentoCompleto(projeto()).custos_indiretos;
    expect(ci.overhead.total).toBeGreaterThan(0);
    expect(ci.impostos.total).toBeGreaterThan(0);
    expect(ci.comissao?.total).toBeGreaterThan(0);
    expect(ci.impostos.regime).toBe(CONFIG_CUSTO_PADRAO.regime_tributario);
  });

  test("prazos de produção e instalação ≥ mínimos", () => {
    const orc = calcularOrcamentoCompleto(projeto());
    expect(orc.prazo_producao_dias).toBeGreaterThanOrEqual(3);
    expect(orc.prazo_instalacao_dias).toBeGreaterThanOrEqual(1);
  });

  test("é determinística", () => {
    const p = projeto();
    const a = calcularOrcamentoCompleto(p);
    const b = calcularOrcamentoCompleto(p);
    expect(a.analise_financeira.preco_venda).toBe(b.analise_financeira.preco_venda);
    expect(a.analise_financeira.custo_total).toBe(b.analise_financeira.custo_total);
  });

  test("config customizada altera o custo de produção", () => {
    const p = projeto();
    const padrao = calcularOrcamentoCompleto(p);
    const caro = calcularOrcamentoCompleto(p, "intermediaria", {
      ...CONFIG_CUSTO_PADRAO,
      valor_hora_montagem: 200,
    });
    expect(caro.custo_producao.montagem.total).toBeGreaterThan(padrao.custo_producao.montagem.total);
  });
});

// ─── gerarTresVersoes ─────────────────────────────────────────────────────────

describe("gerarTresVersoes", () => {
  test("retorna as 3 versões", () => {
    const v = gerarTresVersoes(projeto());
    expect(v.economica).toBeDefined();
    expect(v.intermediaria).toBeDefined();
    expect(v.premium).toBeDefined();
  });

  test("premium > intermediária > econômica em preço", () => {
    const v = gerarTresVersoes(projeto());
    expect(v.comparativo.preco_premium).toBeGreaterThan(v.comparativo.preco_intermediaria);
    expect(v.comparativo.preco_intermediaria).toBeGreaterThan(v.comparativo.preco_economica);
  });

  test("comparativo bate com preços das versões", () => {
    const v = gerarTresVersoes(projeto());
    expect(v.comparativo.preco_economica).toBe(v.economica.analise_financeira.preco_venda);
    expect(v.comparativo.preco_premium).toBe(v.premium.analise_financeira.preco_venda);
  });

  test("premium tem margem maior que econômica", () => {
    const v = gerarTresVersoes(projeto());
    expect(v.premium.analise_financeira.margem_desejada_pct)
      .toBeGreaterThan(v.economica.analise_financeira.margem_desejada_pct);
  });

  test("premium tem custo de ferragem maior (mult 2.4x)", () => {
    const v = gerarTresVersoes(projeto());
    expect(v.premium.custo_materiais.subtotal_ferragens)
      .toBeGreaterThan(v.economica.custo_materiais.subtotal_ferragens);
  });

  test("todas as versões têm preço de venda positivo", () => {
    const v = gerarTresVersoes(projeto());
    for (const orc of [v.economica, v.intermediaria, v.premium]) {
      expect(orc.analise_financeira.preco_venda).toBeGreaterThan(0);
    }
  });
});

// ─── Sanidade econômica ───────────────────────────────────────────────────────

describe("sanidade econômica", () => {
  test("cozinha 4m tem preço de venda em faixa plausível (R$3k–60k)", () => {
    const orc = calcularOrcamentoCompleto(projeto(400));
    expect(orc.analise_financeira.preco_venda).toBeGreaterThan(3000);
    expect(orc.analise_financeira.preco_venda).toBeLessThan(60000);
  });

  test("cozinha maior custa mais que cozinha menor", () => {
    const pequena = calcularOrcamentoCompleto(projeto(240));
    const grande = calcularOrcamentoCompleto(projeto(500));
    expect(grande.analise_financeira.preco_venda)
      .toBeGreaterThan(pequena.analise_financeira.preco_venda);
  });
});
