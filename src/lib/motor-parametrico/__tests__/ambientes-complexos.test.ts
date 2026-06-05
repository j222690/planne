import { describe, test, expect } from "vitest";
import { criarAmbienteManual } from "../ambiente";
import { gerarLayoutCozinhaL, gerarLayoutCozinhaU, type PreferenciasCozinhaMP } from "../layout-cozinha-l-u";
import { gerarLayoutIlha, type PreferenciasIlha } from "../layout-ilha";
import { gerarLayoutDormitorio, gerarLayoutCloset, type PreferenciasQuarto } from "../layout-quarto";
import { gerarLayoutBanheiro, gerarLayoutLavanderia, type PreferenciasServico } from "../layout-servicos";
import { calcularPecas, calcularFerragens } from "../pecas";
import { getTemplateRoupeiro } from "../biblioteca-quarto";
import type { AmbienteGeometrico, ModuloInstanciado } from "../tipos";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const baseCozinhaMP: PreferenciasCozinhaMP = {
  cor_mdf_hex: "#f5f3f0",
  ferragem: "nacional",
  versao_comercial: "intermediaria",
  tipo_porta_base: "dobradica",
  tipo_porta_aereo: "dobradica",
};

const baseQuarto: PreferenciasQuarto = {
  cor_mdf_hex: "#e8e0d5",
  ferragem: "nacional",
  versao_comercial: "intermediaria",
};

const baseServico: PreferenciasServico = {
  cor_mdf_hex: "#ffffff",
  ferragem: "nacional",
  versao_comercial: "economica",
};

function amb(largura: number, profundidade: number, altura = 270): AmbienteGeometrico {
  return criarAmbienteManual({ largura_cm: largura, profundidade_cm: profundidade, altura_cm: altura });
}

/** Verifica que módulos numa mesma parede e mesma faixa de altura não se sobrepõem. */
function semSobreposicao(modulos: ModuloInstanciado[]): boolean {
  const grupos = new Map<string, ModuloInstanciado[]>();
  for (const m of modulos) {
    const chave = `${m.parede}|${m.posicao_y_cm}`;
    const arr = grupos.get(chave) ?? [];
    arr.push(m);
    grupos.set(chave, arr);
  }
  for (const arr of grupos.values()) {
    const ord = [...arr].sort((a, b) => a.posicao_x_cm - b.posicao_x_cm);
    for (let i = 1; i < ord.length; i++) {
      if (ord[i].posicao_x_cm < ord[i - 1].posicao_x_cm + ord[i - 1].largura_cm - 0.5) return false;
    }
  }
  return true;
}

// ─── COZINHA EM L ─────────────────────────────────────────────────────────────

describe("gerarLayoutCozinhaL", () => {
  test("gera módulos em 2 paredes", () => {
    const r = gerarLayoutCozinhaL(amb(400, 350), baseCozinhaMP);
    expect(r.projeto.modulos.length).toBeGreaterThan(0);
    expect(r.paredes_usadas.length).toBe(2);
  });

  test("módulos têm peças e ferragens", () => {
    const r = gerarLayoutCozinhaL(amb(400, 350), baseCozinhaMP);
    const pecas = r.projeto.modulos.reduce((s, m) => s + m.pecas.length, 0);
    const ferr = r.projeto.modulos.reduce((s, m) => s + m.ferragens.length, 0);
    expect(pecas).toBeGreaterThan(0);
    expect(ferr).toBeGreaterThan(0);
  });

  test("paredes usadas são perpendiculares (formam L)", () => {
    const r = gerarLayoutCozinhaL(amb(400, 350), baseCozinhaMP);
    const [a, b] = r.paredes_usadas;
    const perpendicular =
      ((a === "top" || a === "bottom") && (b === "left" || b === "right")) ||
      ((a === "left" || a === "right") && (b === "top" || b === "bottom"));
    expect(perpendicular).toBe(true);
  });

  test("módulos não se sobrepõem dentro de cada parede/altura", () => {
    const r = gerarLayoutCozinhaL(amb(400, 350), baseCozinhaMP);
    expect(semSobreposicao(r.projeto.modulos)).toBe(true);
  });

  test("tipo_ambiente é 'Cozinha em L'", () => {
    const r = gerarLayoutCozinhaL(amb(400, 350), baseCozinhaMP);
    expect(r.projeto.tipo_ambiente).toBe("Cozinha em L");
  });

  test("segunda parede recua no canto (não começa em 0)", () => {
    const r = gerarLayoutCozinhaL(amb(400, 350), { ...baseCozinhaMP, paredes: ["top", "left"] });
    const modsLeft = r.projeto.modulos.filter((m) => m.parede === "left" && m.posicao_y_cm === 0);
    if (modsLeft.length > 0) {
      const minX = Math.min(...modsLeft.map((m) => m.posicao_x_cm));
      expect(minX).toBeGreaterThanOrEqual(55); // recuo de profundidade
    }
  });
});

// ─── COZINHA EM U ─────────────────────────────────────────────────────────────

describe("gerarLayoutCozinhaU", () => {
  test("usa 3 paredes", () => {
    const r = gerarLayoutCozinhaU(amb(400, 350), baseCozinhaMP);
    expect(r.paredes_usadas.length).toBe(3);
  });

  test("gera módulos com peças", () => {
    const r = gerarLayoutCozinhaU(amb(400, 350), baseCozinhaMP);
    expect(r.projeto.modulos.length).toBeGreaterThan(0);
    expect(r.projeto.metricas.num_pecas_total).toBeGreaterThan(0);
  });

  test("módulos não se sobrepõem", () => {
    const r = gerarLayoutCozinhaU(amb(400, 350), baseCozinhaMP);
    expect(semSobreposicao(r.projeto.modulos)).toBe(true);
  });

  test("U tem mais módulos que L no mesmo ambiente", () => {
    const l = gerarLayoutCozinhaL(amb(400, 400), baseCozinhaMP);
    const u = gerarLayoutCozinhaU(amb(400, 400), baseCozinhaMP);
    expect(u.projeto.modulos.length).toBeGreaterThanOrEqual(l.projeto.modulos.length);
  });
});

// ─── ILHA ─────────────────────────────────────────────────────────────────────

describe("gerarLayoutIlha", () => {
  const baseIlha: PreferenciasIlha = {
    cor_mdf_hex: "#222",
    ferragem: "blum",
    versao_comercial: "premium",
  };

  test("ambiente grande comporta ilha", () => {
    const r = gerarLayoutIlha(amb(500, 450), baseIlha);
    expect(r.projeto.modulos.length).toBeGreaterThan(0);
  });

  test("ilha é centralizada na largura", () => {
    const r = gerarLayoutIlha(amb(500, 450), baseIlha);
    const mods = r.projeto.modulos.filter((m) => m.posicao_y_cm > 0);
    if (mods.length > 0) {
      const minX = Math.min(...mods.map((m) => m.posicao_x_cm));
      const maxX = Math.max(...mods.map((m) => m.posicao_x_cm + m.largura_cm));
      const centro = (minX + maxX) / 2;
      expect(centro).toBeCloseTo(250, -1); // ~centro de 500cm
    }
  });

  test("ambiente estreito gera aviso de circulação", () => {
    const r = gerarLayoutIlha(amb(300, 250), baseIlha);
    expect(r.avisos.length).toBeGreaterThan(0);
  });

  test("ilha não encosta em parede (posicao_y > 0)", () => {
    const r = gerarLayoutIlha(amb(500, 450), baseIlha);
    r.projeto.modulos.forEach((m) => expect(m.posicao_y_cm).toBeGreaterThan(0));
  });
});

// ─── DORMITÓRIO ───────────────────────────────────────────────────────────────

describe("gerarLayoutDormitorio", () => {
  test("gera roupeiros na parede mais longa", () => {
    const r = gerarLayoutDormitorio(amb(350, 300), baseQuarto);
    expect(r.projeto.modulos.length).toBeGreaterThan(0);
    expect(r.projeto.tipo_ambiente).toBe("Dormitório");
  });

  test("roupeiros têm altura alta (~250cm)", () => {
    const r = gerarLayoutDormitorio(amb(350, 300), baseQuarto);
    r.projeto.modulos.forEach((m) => expect(m.altura_cm).toBeGreaterThanOrEqual(220));
  });

  test("roupeiros têm cabideiro nas ferragens", () => {
    const r = gerarLayoutDormitorio(amb(350, 300), baseQuarto);
    const temCabideiro = r.projeto.modulos.some((m) =>
      m.ferragens.some((f) => f.tipo === "cabideiro_simples"),
    );
    expect(temCabideiro).toBe(true);
  });

  test("porta de correr gera trilho", () => {
    const r = gerarLayoutDormitorio(amb(350, 300), { ...baseQuarto, tipo_porta: "correr" });
    const temTrilho = r.projeto.modulos.some((m) =>
      m.ferragens.some((f) => f.tipo === "corredicao_lateral_porta"),
    );
    expect(temTrilho).toBe(true);
  });
});

// ─── CLOSET ───────────────────────────────────────────────────────────────────

describe("gerarLayoutCloset", () => {
  test("usa 2 paredes em L", () => {
    const r = gerarLayoutCloset(amb(350, 300), baseQuarto);
    expect(r.paredes_usadas.length).toBe(2);
    expect(r.projeto.tipo_ambiente).toBe("Closet");
  });

  test("mix funcional: tem sapateira, cabideiro ou gaveteiro", () => {
    const r = gerarLayoutCloset(amb(350, 300), baseQuarto);
    const codigos = r.projeto.modulos.map((m) => m.modulo_template_codigo);
    const temMix = codigos.some((c) =>
      c.startsWith("sapateira") || c.startsWith("cabideiro") || c.startsWith("gaveteiro"),
    );
    expect(temMix).toBe(true);
  });

  test("módulos não se sobrepõem", () => {
    const r = gerarLayoutCloset(amb(350, 300), baseQuarto);
    expect(semSobreposicao(r.projeto.modulos)).toBe(true);
  });
});

// ─── BANHEIRO ─────────────────────────────────────────────────────────────────

describe("gerarLayoutBanheiro", () => {
  test("gera gabinete de pia + espelheira", () => {
    const r = gerarLayoutBanheiro(amb(200, 180), baseServico);
    expect(r.projeto.modulos.length).toBeGreaterThan(0);
    const temGab = r.projeto.modulos.some((m) => m.modulo_template_codigo.startsWith("gab_pia"));
    const temEsp = r.projeto.modulos.some((m) => m.modulo_template_codigo.startsWith("espelheira"));
    expect(temGab).toBe(true);
    expect(temEsp).toBe(true);
  });

  test("espelheira fica acima do gabinete (posicao_y alta)", () => {
    const r = gerarLayoutBanheiro(amb(200, 180), baseServico);
    const esp = r.projeto.modulos.filter((m) => m.modulo_template_codigo.startsWith("espelheira"));
    esp.forEach((m) => expect(m.posicao_y_cm).toBeGreaterThan(100));
  });

  test("com_superior=false omite espelheira", () => {
    const r = gerarLayoutBanheiro(amb(200, 180), { ...baseServico, com_superior: false });
    const temEsp = r.projeto.modulos.some((m) => m.modulo_template_codigo.startsWith("espelheira"));
    expect(temEsp).toBe(false);
  });

  test("escolhe parede com ponto hidráulico", () => {
    const ambiente = criarAmbienteManual({ largura_cm: 200, profundidade_cm: 180, altura_cm: 250 });
    ambiente.pontos_hidraulicos.push({
      id: "ph1", tipo: "entrada_fria", posicao: { x_cm: 100, y_cm: 0 },
      parede: "right", requer_modulo_adjacente: true,
    });
    const r = gerarLayoutBanheiro(ambiente, baseServico);
    expect(r.paredes_usadas).toContain("right");
  });
});

// ─── LAVANDERIA ───────────────────────────────────────────────────────────────

describe("gerarLayoutLavanderia", () => {
  test("gera gabinete de tanque + armário de serviço", () => {
    const r = gerarLayoutLavanderia(amb(220, 180), baseServico);
    expect(r.projeto.modulos.length).toBeGreaterThan(0);
    const temTanque = r.projeto.modulos.some((m) => m.modulo_template_codigo.startsWith("gab_tanque"));
    const temArmario = r.projeto.modulos.some((m) => m.modulo_template_codigo.startsWith("armario_servico"));
    expect(temTanque).toBe(true);
    expect(temArmario).toBe(true);
  });

  test("tipo_ambiente é 'Lavanderia'", () => {
    const r = gerarLayoutLavanderia(amb(220, 180), baseServico);
    expect(r.projeto.tipo_ambiente).toBe("Lavanderia");
  });

  test("módulos têm peças geradas", () => {
    const r = gerarLayoutLavanderia(amb(220, 180), baseServico);
    expect(r.projeto.metricas.num_pecas_total).toBeGreaterThan(0);
  });
});

// ─── BIBLIOTECA DE QUARTO (regras de corte) ───────────────────────────────────

describe("biblioteca-quarto — regras de corte", () => {
  test("roupeiro 80cm gera laterais com profundidade correta", () => {
    const tpl = getTemplateRoupeiro(80)!;
    const inst: ModuloInstanciado = {
      id: "test_roupeiro", modulo_template_id: tpl.id, modulo_template_codigo: tpl.codigo,
      modulo_template_versao: 1, largura_cm: 80, altura_cm: 250, profundidade_cm: 60,
      parede: "top", posicao_x_cm: 0, posicao_y_cm: 0,
      configuracao: tpl.configuracao_padrao,
      material_corpo: { id: "m", codigo: "m", nome_display: "MDF", espessura_mm: 15, largura_chapa_mm: 2750, comprimento_chapa_mm: 1830, area_chapa_m2: 5, cor_hex: "#fff", acabamento: "melamina", preco_custo_chapa: 85, preco_venda_chapa: 0 },
      pecas: [], ferragens: [], nome_display: "Roupeiro teste", ordem: 0,
    };
    const pecas = calcularPecas(inst, tpl);
    const laterais = pecas.filter((p) => p.regra_nome === "lateral");
    expect(laterais.reduce((s, p) => s + p.quantidade, 0)).toBe(2);
    expect(laterais[0].largura_mm).toBe(600); // profundidade 60cm
    expect(laterais[0].comprimento_mm).toBe(2500); // altura 250cm
  });

  test("roupeiro alto (250cm) usa 4 dobradiças por porta", () => {
    const tpl = getTemplateRoupeiro(80)!;
    const inst: ModuloInstanciado = {
      id: "test", modulo_template_id: tpl.id, modulo_template_codigo: tpl.codigo,
      modulo_template_versao: 1, largura_cm: 80, altura_cm: 250, profundidade_cm: 60,
      parede: "top", posicao_x_cm: 0, posicao_y_cm: 0,
      configuracao: { ...tpl.configuracao_padrao, tipo_porta: "dobradica", num_portas: 2 },
      material_corpo: { id: "m", codigo: "m", nome_display: "MDF", espessura_mm: 15, largura_chapa_mm: 2750, comprimento_chapa_mm: 1830, area_chapa_m2: 5, cor_hex: "#fff", acabamento: "melamina", preco_custo_chapa: 85, preco_venda_chapa: 0 },
      pecas: [], ferragens: [], nome_display: "Roupeiro", ordem: 0,
    };
    const ferr = calcularFerragens(inst, tpl);
    const dob = ferr.find((f) => f.tipo === "dobradica_35mm_110grau");
    expect(dob?.quantidade).toBe(8); // 2 portas × 4 dobradiças (>200cm)
  });
});

// ─── VALIDAÇÃO INTEGRADA (Rule Engine roda em todos) ──────────────────────────

describe("Rule Engine integrado nos ambientes complexos", () => {
  test("todos os layouts retornam veredicto de validação", () => {
    const layouts = [
      gerarLayoutCozinhaL(amb(400, 350), baseCozinhaMP),
      gerarLayoutCozinhaU(amb(400, 350), baseCozinhaMP),
      gerarLayoutDormitorio(amb(350, 300), baseQuarto),
      gerarLayoutCloset(amb(350, 300), baseQuarto),
      gerarLayoutBanheiro(amb(200, 180), baseServico),
      gerarLayoutLavanderia(amb(220, 180), baseServico),
    ];
    layouts.forEach((l) => {
      expect(l.validacao).toBeDefined();
      expect(["aprovado", "aprovado_com_alertas", "reprovado"]).toContain(l.validacao.status);
      expect(l.validacao.score).toBeGreaterThanOrEqual(0);
      expect(l.validacao.score).toBeLessThanOrEqual(100);
    });
  });
});
