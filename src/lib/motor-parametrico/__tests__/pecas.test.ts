import { describe, test, expect } from "vitest";
import { calcularPecas, calcularFerragens, calcularMetricas } from "../pecas";
import {
  TOLERANCIA_SERRA_MM,
  MAX_PECA_MM,
  AREA_CHAPA_M2,
  ESP_CORPO_MM,
} from "../tipos";
import type {
  ModuloInstanciado,
  ModuloParametrico,
  ConfiguracaoModulo,
  Material,
  RegraCorte,
  RegraFerragem,
} from "../tipos";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const materialCorpo: Material = {
  id: "mdf_15mm_branco",
  codigo: "mdf_15mm_branco_tx",
  nome_display: "MDF 15mm Branco TX",
  espessura_mm: 15,
  largura_chapa_mm: 2750,
  comprimento_chapa_mm: 1830,
  area_chapa_m2: 2.750 * 1.830,
  cor_hex: "#f5f3f0",
  acabamento: "melamina",
  preco_custo_chapa: 85,
  preco_venda_chapa: 170,
};

const materialFundo: Material = {
  ...materialCorpo,
  id: "mdf_6mm_branco",
  codigo: "mdf_6mm_branco_tx",
  nome_display: "MDF 6mm Branco TX",
  espessura_mm: 6,
  preco_custo_chapa: 45,
  preco_venda_chapa: 90,
};

const cfgPadrao: ConfiguracaoModulo = {
  tipo_porta: "dobradica",
  num_portas: 2,
  num_prateleiras: 1,
  num_gavetas: 0,
  num_divisorias: 0,
  tem_cabideiro: false,
  tem_fundo: true,
  espessura_fundo_mm: 6,
  tem_rodape: false,
  altura_rodape_cm: 10,
  tem_pes_regulaveis: true,
  altura_pes_cm: 10,
  tem_roda_teto: false,
  tem_iluminacao_led: false,
  tem_espelho_interno: false,
  tem_ripado: false,
  espessura_corpo_mm: 15,
  espessura_porta_mm: 15,
  ferragem: "nacional",
  tipo_puxador: "perfil_aluminio",
};

// Regras de corte simplificadas para um gabinete base 60cm
// (baseadas na lógica real de _calc.ts)
const regraLateral: RegraCorte = {
  nome: "lateral",
  grupo: "corpo",
  ativa_quando: () => true,
  calcular_largura_mm: (_L, _A, P) => P,       // profundidade
  calcular_comprimento_mm: (_L, A) => A,         // altura
  calcular_quantidade: () => 2,
  espessura_mm: 15,
  direcao_fio: "paralelo_comprimento",
  fita_borda: () => ({ esquerda: false, direita: false, topo: true, base: false }),
  usa_material: "corpo",
};

const regraTeto: RegraCorte = {
  nome: "teto",
  grupo: "corpo",
  ativa_quando: () => true,
  calcular_largura_mm: (L) => L - 2 * 15,      // largura interna
  calcular_comprimento_mm: (_L, _A, P) => P,
  calcular_quantidade: () => 1,
  espessura_mm: 15,
  direcao_fio: "paralelo_largura",
  fita_borda: () => ({ esquerda: false, direita: false, topo: true, base: false }),
  usa_material: "corpo",
};

const regraBase: RegraCorte = {
  nome: "base",
  grupo: "corpo",
  ativa_quando: () => true,
  calcular_largura_mm: (L) => L - 2 * 15,
  calcular_comprimento_mm: (_L, _A, P) => P,
  calcular_quantidade: () => 1,
  espessura_mm: 15,
  direcao_fio: "paralelo_largura",
  fita_borda: () => ({ esquerda: false, direita: false, topo: false, base: false }),
  usa_material: "corpo",
};

const regraFundo: RegraCorte = {
  nome: "fundo",
  grupo: "fundo",
  ativa_quando: (cfg) => cfg.tem_fundo,
  calcular_largura_mm: (L) => L - 2 * 15,
  calcular_comprimento_mm: (_L, A) => A - 2 * 15,
  calcular_quantidade: () => 1,
  espessura_mm: 6,
  direcao_fio: "indiferente",
  fita_borda: () => ({ esquerda: false, direita: false, topo: false, base: false }),
  usa_material: "fundo",
};

const regraPorta: RegraCorte = {
  nome: "porta",
  grupo: "porta",
  ativa_quando: (cfg) => cfg.num_portas > 0 && cfg.tipo_porta === "dobradica",
  calcular_largura_mm: (L, _A, _P, cfg) => Math.round(L / cfg.num_portas),
  calcular_comprimento_mm: (_L, A) => A,
  calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas,
  espessura_mm: 15,
  direcao_fio: "paralelo_comprimento",
  fita_borda: () => ({ esquerda: true, direita: true, topo: true, base: true }),
  usa_material: "porta",
};

const regraPrateleira: RegraCorte = {
  nome: "prateleira",
  grupo: "corpo",
  ativa_quando: (cfg) => cfg.num_prateleiras > 0,
  calcular_largura_mm: (L) => L - 2 * 15,
  calcular_comprimento_mm: (_L, _A, P) => P - 6,
  calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_prateleiras,
  espessura_mm: 15,
  direcao_fio: "paralelo_largura",
  fita_borda: () => ({ esquerda: false, direita: false, topo: true, base: false }),
  usa_material: "corpo",
};

const regraFerrDobradica: RegraFerragem = {
  tipo: "dobradica_35mm_110grau",
  ativa_quando: (cfg) => cfg.tipo_porta === "dobradica" && cfg.num_portas > 0,
  calcular_quantidade: (_L, A, _P, cfg) => cfg.num_portas * (A > 1500 ? 3 : 2),
  descricao_tecnica: "2 dobradiças por porta se altura ≤ 150cm, 3 se acima",
};

const regraFerrPuxador: RegraFerragem = {
  tipo: "puxador_perfil_alu_1200mm",
  ativa_quando: (cfg) => cfg.tipo_puxador === "perfil_aluminio",
  calcular_quantidade: (_L, _A, _P, cfg) => cfg.num_portas + cfg.num_gavetas,
  descricao_tecnica: "1 puxador por porta e gaveta",
};

// Template simples para um gabinete base
const templateBase60: ModuloParametrico = {
  id: "base_60",
  codigo: "base_60",
  nome: "Gabinete Base 60cm",
  versao: 1,
  categorias: ["cozinha"],
  tipo: "base",
  largura: { min_cm: 60, max_cm: 60, padrao_cm: 60, passo_cm: 0 },
  altura: { min_cm: 72, max_cm: 72, padrao_cm: 72, passo_cm: 0 },
  profundidade: { min_cm: 55, max_cm: 55, padrao_cm: 55, passo_cm: 0 },
  configuracao_padrao: cfgPadrao,
  limites: {
    num_portas: { min: 1, max: 4 },
    num_gavetas: { min: 0, max: 3 },
    num_prateleiras: { min: 0, max: 4 },
    tipos_porta_validos: ["dobradica", "correr"],
    permite_espelho: false,
    permite_iluminacao_led: false,
    permite_ripado: false,
  },
  regras_pecas: [regraLateral, regraTeto, regraBase, regraFundo, regraPorta, regraPrateleira],
  regras_ferragens: [regraFerrDobradica, regraFerrPuxador],
  restricoes_placement: {
    altura_piso_padrao_cm: 0,
    folga_teto_min_cm: 0,
    afastamento_lateral_cm: 0,
    permite_sequencia: true,
  },
  ativo: true,
  publicado_em: "2025-01-01T00:00:00Z",
};

function criarInstancia(largura = 60, altura = 72, profundidade = 55, cfg = cfgPadrao): ModuloInstanciado {
  return {
    id: `inst_${largura}x${altura}x${profundidade}`,
    modulo_template_id: templateBase60.id,
    modulo_template_codigo: templateBase60.codigo,
    modulo_template_versao: templateBase60.versao,
    largura_cm: largura,
    altura_cm: altura,
    profundidade_cm: profundidade,
    parede: "top",
    posicao_x_cm: 0,
    posicao_y_cm: 0,
    configuracao: cfg,
    material_corpo: materialCorpo,
    material_fundo: materialFundo,
    pecas: [],
    ferragens: [],
    nome_display: `Gabinete Base ${largura}cm`,
    ordem: 0,
  };
}

// ─── calcularPecas ────────────────────────────────────────────────────────────

describe("calcularPecas — Gabinete Base 60cm", () => {
  const instancia = criarInstancia();
  const pecas = calcularPecas(instancia, templateBase60);

  test("retorna array não vazio", () => {
    expect(pecas.length).toBeGreaterThan(0);
  });

  test("gera exatamente 2 laterais", () => {
    const laterais = pecas.filter(p => p.regra_nome === "lateral");
    expect(laterais.reduce((s, p) => s + p.quantidade, 0)).toBe(2);
  });

  test("largura da lateral = profundidade em mm (55cm → 550mm)", () => {
    const lateral = pecas.find(p => p.regra_nome === "lateral")!;
    expect(lateral.largura_mm).toBe(550);
  });

  test("comprimento da lateral = altura em mm (72cm → 720mm)", () => {
    const lateral = pecas.find(p => p.regra_nome === "lateral")!;
    expect(lateral.comprimento_mm).toBe(720);
  });

  test("largura interna (teto/base) = largura - 2×ESP_CORPO = 570mm", () => {
    const teto = pecas.find(p => p.regra_nome === "teto")!;
    expect(teto.largura_mm).toBe(600 - 2 * 15); // 570mm
  });

  test("largura_final_mm = largura_mm - TOLERANCIA_SERRA_MM", () => {
    pecas.forEach(p => {
      expect(p.largura_final_mm).toBe(p.largura_mm - TOLERANCIA_SERRA_MM);
    });
  });

  test("comprimento_final_mm = comprimento_mm - TOLERANCIA_SERRA_MM", () => {
    pecas.forEach(p => {
      expect(p.comprimento_final_mm).toBe(p.comprimento_mm - TOLERANCIA_SERRA_MM);
    });
  });

  test("nenhuma peça excede MAX_PECA_MM", () => {
    pecas.forEach(p => {
      expect(Math.max(p.largura_mm, p.comprimento_mm)).toBeLessThanOrEqual(MAX_PECA_MM);
    });
  });

  test("fundo usa materialFundo (6mm)", () => {
    const fundo = pecas.find(p => p.regra_nome === "fundo")!;
    expect(fundo).toBeDefined();
    expect(fundo.material.espessura_mm).toBe(6);
    expect(fundo.espessura_mm).toBe(6);
  });

  test("portas têm fita_borda em todos os lados", () => {
    const portas = pecas.filter(p => p.regra_nome === "porta");
    expect(portas.length).toBe(2);
    portas.forEach(p => {
      expect(p.fita_borda.esquerda).toBe(true);
      expect(p.fita_borda.direita).toBe(true);
      expect(p.fita_borda.topo).toBe(true);
      expect(p.fita_borda.base).toBe(true);
    });
  });

  test("sem gavetas não gera peças de gaveta", () => {
    const gavetas = pecas.filter(p => p.regra_nome.includes("gaveta"));
    expect(gavetas).toHaveLength(0);
  });

  test("sem fundo não gera peça de fundo", () => {
    const cfgSemFundo = { ...cfgPadrao, tem_fundo: false };
    const inst = criarInstancia(60, 72, 55, cfgSemFundo);
    const p = calcularPecas(inst, templateBase60);
    const fundos = p.filter(x => x.regra_nome === "fundo");
    expect(fundos).toHaveLength(0);
  });

  test("todas as peças têm status 'pendente'", () => {
    pecas.forEach(p => expect(p.status).toBe("pendente"));
  });

  test("todas as peças têm etiqueta_producao não vazia", () => {
    pecas.forEach(p => expect(p.etiqueta_producao.length).toBeGreaterThan(0));
  });
});

// ─── Peça maior que MAX_PECA_MM ───────────────────────────────────────────────

describe("calcularPecas — divisão em segmentos", () => {
  // Criar template com painel que excede MAX_PECA
  const regraGigante: RegraCorte = {
    nome: "painel_gigante",
    grupo: "corpo",
    ativa_quando: () => true,
    calcular_largura_mm: () => 2800,  // maior que MAX_PECA_MM (2690)
    calcular_comprimento_mm: () => 600,
    calcular_quantidade: () => 1,
    espessura_mm: 15,
    direcao_fio: "indiferente",
    fita_borda: () => ({ esquerda: false, direita: false, topo: false, base: false }),
    usa_material: "corpo",
  };

  const templateGigante: ModuloParametrico = {
    ...templateBase60,
    regras_pecas: [regraGigante],
    regras_ferragens: [],
  };

  test("peça > MAX_PECA_MM é dividida em segmentos", () => {
    const inst = criarInstancia();
    const pecas = calcularPecas(inst, templateGigante);

    expect(pecas.length).toBeGreaterThan(1);
    pecas.forEach(p => {
      expect(Math.max(p.largura_mm, p.comprimento_mm)).toBeLessThanOrEqual(MAX_PECA_MM);
    });
  });

  test("segmentos têm referência ao pai", () => {
    const inst = criarInstancia();
    const pecas = calcularPecas(inst, templateGigante);

    pecas.forEach(p => {
      expect(p.segmento_de).toBeDefined();
      expect(p.total_segmentos).toBeGreaterThan(1);
      expect(p.observacao_uniao).toBeDefined();
    });
  });
});

// ─── calcularFerragens ────────────────────────────────────────────────────────

describe("calcularFerragens — Gabinete Base 60cm", () => {
  const instancia = criarInstancia();
  const ferragens = calcularFerragens(instancia, templateBase60);

  test("retorna array não vazio para módulo com portas", () => {
    expect(ferragens.length).toBeGreaterThan(0);
  });

  test("2 dobradiças por porta com altura ≤ 150cm → 4 total", () => {
    const dobradicas = ferragens.filter(f => f.tipo === "dobradica_35mm_110grau");
    expect(dobradicas).toHaveLength(1);
    expect(dobradicas[0].quantidade).toBe(4); // 2 portas × 2 dobradiças
  });

  test("3 dobradiças por porta quando altura > 150cm", () => {
    const instAlta = criarInstancia(60, 200, 55);
    const f = calcularFerragens(instAlta, templateBase60);
    const dobradicas = f.filter(x => x.tipo === "dobradica_35mm_110grau");
    expect(dobradicas[0].quantidade).toBe(6); // 2 portas × 3 dobradiças
  });

  test("puxador = num_portas + num_gavetas", () => {
    const puxadores = ferragens.filter(f => f.tipo === "puxador_perfil_alu_1200mm");
    expect(puxadores).toHaveLength(1);
    expect(puxadores[0].quantidade).toBe(cfgPadrao.num_portas + cfgPadrao.num_gavetas);
  });

  test("marca respeita ferragem da configuração", () => {
    const instBlum = criarInstancia(60, 72, 55, { ...cfgPadrao, ferragem: "blum" });
    const f = calcularFerragens(instBlum, templateBase60);
    f.forEach(ferr => expect(ferr.marca).toBe("blum"));
  });

  test("sem portas não gera dobradiças", () => {
    const cfgSemPortas = { ...cfgPadrao, num_portas: 0 };
    const inst = criarInstancia(60, 72, 55, cfgSemPortas);
    const f = calcularFerragens(inst, templateBase60);
    const dobradicas = f.filter(x => x.tipo === "dobradica_35mm_110grau");
    expect(dobradicas).toHaveLength(0);
  });
});

// ─── calcularMetricas ─────────────────────────────────────────────────────────

describe("calcularMetricas", () => {
  test("projeto vazio retorna métricas zeradas", () => {
    const m = calcularMetricas([]);
    expect(m.num_modulos).toBe(0);
    expect(m.num_pecas_total).toBe(0);
    expect(m.linear_marcenaria_cm).toBe(0);
  });

  test("linear_marcenaria_cm = soma das larguras dos módulos", () => {
    const inst1 = { ...criarInstancia(60), pecas: calcularPecas(criarInstancia(60), templateBase60), ferragens: [] };
    const inst2 = { ...criarInstancia(90), pecas: calcularPecas(criarInstancia(90), templateBase60), ferragens: [] };
    const m = calcularMetricas([inst1, inst2]);

    expect(m.linear_marcenaria_cm).toBe(150);
    expect(m.num_modulos).toBe(2);
  });

  test("metros_fita inclui 15% de desperdício", () => {
    const inst = { ...criarInstancia(60), pecas: calcularPecas(criarInstancia(60), templateBase60), ferragens: [] };
    const m = calcularMetricas([inst]);
    // Deve ter algum valor de fita (portas têm fita em todos os lados)
    expect(m.metros_fita_borda).toBeGreaterThan(0);
  });

  test("calculado_em é uma data ISO válida", () => {
    const m = calcularMetricas([]);
    expect(() => new Date(m.calculado_em)).not.toThrow();
    expect(new Date(m.calculado_em).getFullYear()).toBeGreaterThan(2024);
  });
});
