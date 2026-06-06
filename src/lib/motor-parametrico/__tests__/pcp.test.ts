import { describe, test, expect } from "vitest";
import {
  gerarEtapasProducao,
  validarDAG,
  ordenarTopologicamente,
  calcularCronograma,
  gerarOrdemProducao,
  PARAMETROS_PCP_PADRAO,
} from "../pcp";
import { gerarLayoutCozinhaLinear } from "../layout-cozinha-linear";
import { gerarPlanoNesting } from "../nesting";
import { gerarListaCompras } from "../engenharia";
import { criarAmbienteManual } from "../ambiente";
import type { EtapaProducao, ProjetoFabricavel, PlanoNesting } from "../tipos";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function projeto(largura = 400): ProjetoFabricavel {
  const amb = criarAmbienteManual({ largura_cm: largura, profundidade_cm: 300, altura_cm: 270 });
  return gerarLayoutCozinhaLinear(amb, {
    cor_mdf_hex: "#fff", ferragem: "nacional",
    tipo_porta_base: "dobradica", tipo_porta_aereo: "dobradica",
    versao_comercial: "intermediaria",
  }).projeto;
}

function plano(p: ProjetoFabricavel): PlanoNesting {
  return gerarPlanoNesting(p.modulos.flatMap((m) => m.pecas), p.metricas.metros_fita_borda);
}

// ─── gerarEtapasProducao ──────────────────────────────────────────────────────

describe("gerarEtapasProducao", () => {
  test("gera sequência de etapas não vazia", () => {
    const p = projeto();
    const etapas = gerarEtapasProducao(p, plano(p));
    expect(etapas.length).toBeGreaterThan(0);
  });

  test("inclui etapas essenciais (separação, corte, montagem, instalação)", () => {
    const p = projeto();
    const tipos = gerarEtapasProducao(p, plano(p)).map((e) => e.tipo);
    expect(tipos).toContain("separacao_material");
    expect(tipos).toContain("corte_cnc");
    expect(tipos).toContain("montagem");
    expect(tipos).toContain("instalacao_obra");
  });

  test("primeira etapa não tem dependências", () => {
    const p = projeto();
    const etapas = gerarEtapasProducao(p, plano(p));
    expect(etapas[0].depende_de.length).toBe(0);
    expect(etapas[0].status).toBe("pendente");
  });

  test("etapas seguintes dependem da anterior e ficam bloqueadas", () => {
    const p = projeto();
    const etapas = gerarEtapasProducao(p, plano(p));
    for (let i = 1; i < etapas.length; i++) {
      expect(etapas[i].depende_de).toContain(etapas[i - 1].id);
      expect(etapas[i].status).toBe("bloqueada");
    }
  });

  test("cada etapa tem duração > 0 e função responsável", () => {
    const p = projeto();
    const etapas = gerarEtapasProducao(p, plano(p));
    etapas.forEach((e) => {
      expect(e.duracao_estimada_horas).toBeGreaterThan(0);
      expect(e.funcao_responsavel.length).toBeGreaterThan(0);
    });
  });

  test("etapas têm checklist de qualidade", () => {
    const p = projeto();
    const etapas = gerarEtapasProducao(p, plano(p));
    const montagem = etapas.find((e) => e.tipo === "montagem")!;
    expect(montagem.checklist.length).toBeGreaterThan(0);
    expect(montagem.checklist.every((c) => !c.concluido)).toBe(true);
  });

  test("pintura/laca omitida quando não há laca", () => {
    const p = projeto(); // material melamina, sem laca
    const tipos = gerarEtapasProducao(p, plano(p)).map((e) => e.tipo);
    expect(tipos).not.toContain("pintura_laca");
  });
});

// ─── validarDAG ───────────────────────────────────────────────────────────────

describe("validarDAG", () => {
  test("sequência gerada é um DAG válido", () => {
    const p = projeto();
    const etapas = gerarEtapasProducao(p, plano(p));
    expect(validarDAG(etapas)).toBe(true);
  });

  test("detecta ciclo", () => {
    const etapas: EtapaProducao[] = [
      { id: "a", tipo: "corte_cnc", ordem: 1, descricao: "", duracao_estimada_horas: 1, depende_de: ["b"], funcao_responsavel: "x", status: "pendente", checklist: [] },
      { id: "b", tipo: "montagem", ordem: 2, descricao: "", duracao_estimada_horas: 1, depende_de: ["a"], funcao_responsavel: "y", status: "pendente", checklist: [] },
    ];
    expect(validarDAG(etapas)).toBe(false);
  });
});

// ─── ordenarTopologicamente ───────────────────────────────────────────────────

describe("ordenarTopologicamente", () => {
  test("dependências aparecem antes dos dependentes", () => {
    const p = projeto();
    const etapas = gerarEtapasProducao(p, plano(p));
    const ord = ordenarTopologicamente(etapas);
    const indice = new Map(ord.map((e, i) => [e.id, i]));
    for (const e of ord) {
      for (const dep of e.depende_de) {
        expect(indice.get(dep)!).toBeLessThan(indice.get(e.id)!);
      }
    }
  });
});

// ─── calcularCronograma ───────────────────────────────────────────────────────

describe("calcularCronograma", () => {
  test("cada etapa tem data de início e conclusão", () => {
    const p = projeto();
    const etapas = gerarEtapasProducao(p, plano(p));
    const ag = calcularCronograma(etapas, new Date("2026-06-08T08:00:00"));
    ag.forEach((e) => {
      expect(e.data_inicio_planejada).toBeTruthy();
      expect(e.data_conclusao_planejada).toBeTruthy();
      expect(new Date(e.data_conclusao_planejada).getTime())
        .toBeGreaterThanOrEqual(new Date(e.data_inicio_planejada).getTime());
    });
  });

  test("etapa só inicia após a conclusão da dependência", () => {
    const p = projeto();
    const etapas = gerarEtapasProducao(p, plano(p));
    const ag = calcularCronograma(etapas, new Date("2026-06-08T08:00:00"));
    const porId = new Map(ag.map((e) => [e.id, e]));
    for (const e of ag) {
      for (const dep of e.depende_de) {
        const d = porId.get(dep)!;
        expect(new Date(e.data_inicio_planejada).getTime())
          .toBeGreaterThanOrEqual(new Date(d.data_conclusao_planejada).getTime());
      }
    }
  });

  test("conclusão final é depois do início (cronograma avança)", () => {
    const p = projeto();
    const etapas = gerarEtapasProducao(p, plano(p));
    const inicio = new Date("2026-06-08T08:00:00");
    const ag = calcularCronograma(etapas, inicio);
    const fim = new Date(ag[ag.length - 1].data_conclusao_planejada);
    expect(fim.getTime()).toBeGreaterThan(inicio.getTime());
  });

  test("não agenda em fins de semana quando configurado", () => {
    const p = projeto();
    const etapas = gerarEtapasProducao(p, plano(p));
    // Começa numa sexta-feira
    const ag = calcularCronograma(etapas, new Date("2026-06-05T08:00:00"), PARAMETROS_PCP_PADRAO);
    ag.forEach((e) => {
      const diaInicio = new Date(e.data_inicio_planejada).getDay();
      expect(diaInicio).not.toBe(0); // domingo
      expect(diaInicio).not.toBe(6); // sábado
    });
  });
});

// ─── gerarOrdemProducao ───────────────────────────────────────────────────────

describe("gerarOrdemProducao", () => {
  test("gera ordem completa com DAG válido", () => {
    const p = projeto();
    const r = gerarOrdemProducao(p, plano(p));
    expect(r.dag_valido).toBe(true);
    expect(r.ordem.etapas.length).toBeGreaterThan(0);
    expect(r.ordem.numero).toMatch(/^OP-/);
  });

  test("ordem começa em aguardando_material com histórico", () => {
    const p = projeto();
    const r = gerarOrdemProducao(p, plano(p));
    expect(r.ordem.status).toBe("aguardando_material");
    expect(r.ordem.historico_status.length).toBeGreaterThan(0);
  });

  test("data de entrega é posterior ao início", () => {
    const p = projeto();
    const r = gerarOrdemProducao(p, plano(p));
    expect(new Date(r.ordem.data_entrega_prometida).getTime())
      .toBeGreaterThan(new Date(r.ordem.data_inicio_planejada).getTime());
  });

  test("prazo em dias úteis é >= 1", () => {
    const p = projeto();
    const r = gerarOrdemProducao(p, plano(p));
    expect(r.prazo_dias_uteis).toBeGreaterThanOrEqual(1);
  });

  test("incorpora lista de compras quando fornecida", () => {
    const p = projeto();
    const lista = gerarListaCompras(p);
    const r = gerarOrdemProducao(p, plano(p), { lista_compras: lista });
    expect(r.ordem.lista_compras.itens.length).toBe(lista.itens.length);
  });

  test("projeto maior tem prazo maior ou igual", () => {
    const pequeno = gerarOrdemProducao(projeto(240), plano(projeto(240)));
    const grande = gerarOrdemProducao(projeto(500), plano(projeto(500)));
    expect(grande.duracao_total_horas).toBeGreaterThan(pequeno.duracao_total_horas);
  });

  test("é determinística (mesmo projeto + data → mesmo cronograma)", () => {
    const p = projeto();
    const pl = plano(p);
    const data = new Date("2026-06-08T08:00:00");
    const a = gerarOrdemProducao(p, pl, { data_inicio: data });
    const b = gerarOrdemProducao(p, pl, { data_inicio: data });
    expect(a.duracao_total_horas).toBe(b.duracao_total_horas);
    expect(a.ordem.data_entrega_prometida).toBe(b.ordem.data_entrega_prometida);
  });
});
