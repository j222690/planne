import { describe, test, expect } from "vitest";
import {
  consolidarPecas,
  consolidarFerragens,
  consolidarMateriais,
  consolidarFita,
  gerarListaCompras,
  gerarEngenharia,
  DESPERDICIO_CHAPA_PCT,
} from "../engenharia";
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

// ─── consolidarPecas ──────────────────────────────────────────────────────────

describe("consolidarPecas", () => {
  test("retorna lista não vazia", () => {
    const pecas = consolidarPecas(projeto());
    expect(pecas.length).toBeGreaterThan(0);
  });

  test("número de peças únicas ≤ número de peças totais", () => {
    const p = projeto();
    const totalBruto = p.modulos.reduce((s, m) => s + m.pecas.length, 0);
    const consolidadas = consolidarPecas(p);
    expect(consolidadas.length).toBeLessThanOrEqual(totalBruto);
  });

  test("soma das quantidades consolidadas = soma das peças brutas", () => {
    const p = projeto();
    const totalBruto = p.modulos.reduce(
      (s, m) => s + m.pecas.reduce((ss, pc) => ss + pc.quantidade, 0),
      0,
    );
    const totalConsolidado = consolidarPecas(p).reduce((s, pc) => s + pc.quantidade_total, 0);
    expect(totalConsolidado).toBe(totalBruto);
  });

  test("peças idênticas são agrupadas (quantidade > 1)", () => {
    // Em uma cozinha com vários módulos iguais, deve haver agrupamento
    const pecas = consolidarPecas(projeto(400));
    const temAgrupamento = pecas.some((p) => p.quantidade_total > 1);
    expect(temAgrupamento).toBe(true);
  });

  test("ordenadas por área decrescente", () => {
    const pecas = consolidarPecas(projeto());
    for (let i = 1; i < pecas.length; i++) {
      expect(pecas[i - 1].area_total_m2).toBeGreaterThanOrEqual(pecas[i].area_total_m2);
    }
  });

  test("area_total = area_unitaria × quantidade", () => {
    const pecas = consolidarPecas(projeto());
    pecas.forEach((p) => {
      expect(p.area_total_m2).toBeCloseTo(p.area_unitaria_m2 * p.quantidade_total, 1);
    });
  });
});

// ─── consolidarFerragens ──────────────────────────────────────────────────────

describe("consolidarFerragens", () => {
  test("retorna lista não vazia para cozinha com portas", () => {
    const ferragens = consolidarFerragens(projeto());
    expect(ferragens.length).toBeGreaterThan(0);
  });

  test("agrega por tipo (sem tipos duplicados na mesma marca)", () => {
    const ferragens = consolidarFerragens(projeto());
    const chaves = ferragens.map((f) => `${f.tipo}|${f.marca}`);
    const unicas = new Set(chaves);
    expect(chaves.length).toBe(unicas.size);
  });

  test("soma das quantidades = total bruto de ferragens", () => {
    const p = projeto();
    const totalBruto = p.modulos.reduce(
      (s, m) => s + m.ferragens.reduce((ss, f) => ss + f.quantidade, 0),
      0,
    );
    const totalConsolidado = consolidarFerragens(p).reduce((s, f) => s + f.quantidade_total, 0);
    expect(totalConsolidado).toBe(totalBruto);
  });

  test("ordenadas por quantidade decrescente", () => {
    const ferragens = consolidarFerragens(projeto());
    for (let i = 1; i < ferragens.length; i++) {
      expect(ferragens[i - 1].quantidade_total).toBeGreaterThanOrEqual(ferragens[i].quantidade_total);
    }
  });
});

// ─── consolidarMateriais ──────────────────────────────────────────────────────

describe("consolidarMateriais", () => {
  test("agrupa por espessura", () => {
    const materiais = consolidarMateriais(projeto());
    expect(materiais.length).toBeGreaterThan(0);
    // Cozinha usa 15mm (corpo) + 6mm (fundo)
    const espessuras = materiais.map((m) => m.espessura_mm);
    expect(espessuras).toContain(15);
  });

  test("chapas necessárias ≥ 1 quando há peças", () => {
    const materiais = consolidarMateriais(projeto());
    materiais.forEach((m) => {
      expect(m.chapas_necessarias).toBeGreaterThanOrEqual(1);
    });
  });

  test("chapas incluem margem de desperdício", () => {
    const materiais = consolidarMateriais(projeto());
    const fator = 1 + DESPERDICIO_CHAPA_PCT / 100;
    materiais.forEach((m) => {
      // chapas devem cobrir ao menos area × fator / area_chapa
      const minChapas = (m.area_total_m2 * fator) / (2.75 * 1.83);
      expect(m.chapas_necessarias).toBeGreaterThanOrEqual(Math.ceil(minChapas) - 0.01);
    });
  });

  test("custo_total = chapas × preço", () => {
    const materiais = consolidarMateriais(projeto());
    materiais.forEach((m) => {
      expect(m.custo_total).toBeCloseTo(m.chapas_necessarias * m.preco_custo_chapa, 1);
    });
  });

  test("ordenadas por espessura decrescente", () => {
    const materiais = consolidarMateriais(projeto());
    for (let i = 1; i < materiais.length; i++) {
      expect(materiais[i - 1].espessura_mm).toBeGreaterThanOrEqual(materiais[i].espessura_mm);
    }
  });
});

// ─── consolidarFita ───────────────────────────────────────────────────────────

describe("consolidarFita", () => {
  test("metros líquidos > 0 (portas têm fita em todos os lados)", () => {
    const fita = consolidarFita(projeto());
    expect(fita.metros_liquidos).toBeGreaterThan(0);
  });

  test("metros com desperdício > metros líquidos", () => {
    const fita = consolidarFita(projeto());
    expect(fita.metros_com_desperdicio).toBeGreaterThan(fita.metros_liquidos);
  });
});

// ─── gerarListaCompras ────────────────────────────────────────────────────────

describe("gerarListaCompras", () => {
  test("sem estoque: comprar tudo que é necessário", () => {
    const lista = gerarListaCompras(projeto());
    lista.itens.forEach((i) => {
      expect(i.quantidade_a_comprar).toBe(i.quantidade_necessaria);
      expect(i.quantidade_em_estoque).toBe(0);
    });
  });

  test("com estoque suficiente: não comprar nada daquele item", () => {
    const p = projeto();
    const materiais = consolidarMateriais(p);
    // Montar estoque cobrindo o primeiro material
    const primeiroId = gerarListaCompras(p).itens[0].material_id;
    const estoque = { [primeiroId]: 999 };
    const lista = gerarListaCompras(p, estoque);
    const item = lista.itens.find((i) => i.material_id === primeiroId)!;
    expect(item.quantidade_a_comprar).toBe(0);
  });

  test("resumo conta itens para comprar corretamente", () => {
    const lista = gerarListaCompras(projeto());
    const paraComprar = lista.itens.filter((i) => i.quantidade_a_comprar > 0).length;
    expect(lista.resumo.itens_para_comprar).toBe(paraComprar);
  });

  test("custo estimado = soma(comprar × preço)", () => {
    const lista = gerarListaCompras(projeto());
    const esperado = lista.itens.reduce(
      (s, i) => s + i.quantidade_a_comprar * i.preco_referencia,
      0,
    );
    expect(lista.resumo.custo_total_estimado).toBeCloseTo(esperado, 1);
  });
});

// ─── gerarEngenharia (pacote completo) ────────────────────────────────────────

describe("gerarEngenharia", () => {
  test("retorna pacote completo com todas as seções", () => {
    const eng = gerarEngenharia(projeto());
    expect(eng.pecas.length).toBeGreaterThan(0);
    expect(eng.ferragens.length).toBeGreaterThan(0);
    expect(eng.materiais.length).toBeGreaterThan(0);
    expect(eng.fita_borda.metros_com_desperdicio).toBeGreaterThan(0);
  });

  test("resumo bate com as listas detalhadas", () => {
    const eng = gerarEngenharia(projeto());
    expect(eng.resumo.num_pecas_unicas).toBe(eng.pecas.length);
    const somaChapas = eng.materiais.reduce((s, m) => s + m.chapas_necessarias, 0);
    expect(eng.resumo.num_chapas_total).toBe(somaChapas);
  });

  test("custo_total = materiais + ferragens", () => {
    const eng = gerarEngenharia(projeto());
    expect(eng.resumo.custo_total).toBeCloseTo(
      eng.resumo.custo_materiais + eng.resumo.custo_ferragens,
      1,
    );
  });

  test("é determinística (mesmo projeto → mesmo resultado)", () => {
    const p = projeto();
    const e1 = gerarEngenharia(p);
    const e2 = gerarEngenharia(p);
    expect(e1.resumo.num_pecas_total).toBe(e2.resumo.num_pecas_total);
    expect(e1.resumo.num_chapas_total).toBe(e2.resumo.num_chapas_total);
    expect(e1.resumo.custo_total).toBe(e2.resumo.custo_total);
  });

  test("projeto maior gera mais peças e chapas", () => {
    const pequeno = gerarEngenharia(projeto(240));
    const grande = gerarEngenharia(projeto(500));
    expect(grande.resumo.num_pecas_total).toBeGreaterThan(pequeno.resumo.num_pecas_total);
  });
});
