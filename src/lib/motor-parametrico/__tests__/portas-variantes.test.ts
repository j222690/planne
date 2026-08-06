import { describe, test, expect } from "vitest";
import { criarAmbienteManual } from "../ambiente";
import { gerarLayoutDormitorio, type PreferenciasQuarto } from "../layout-quarto";
import type { AmbienteGeometrico, ModuloInstanciado } from "../tipos";

const baseQuarto: PreferenciasQuarto = {
  cor_mdf_hex: "#e8e0d5",
  ferragem: "nacional",
  versao_comercial: "intermediaria",
};

function amb(largura: number, profundidade: number, altura = 270): AmbienteGeometrico {
  return criarAmbienteManual({ largura_cm: largura, profundidade_cm: profundidade, altura_cm: altura });
}

/** Primeiro roupeiro com >0 portas (evita módulos auxiliares sem porta, se houver). */
function primeiroRoupeiroComPorta(modulos: ModuloInstanciado[]): ModuloInstanciado {
  const m = modulos.find((x) => x.configuracao.num_portas > 0);
  if (!m) throw new Error("Nenhum roupeiro com porta encontrado");
  return m;
}

describe("variantes de porta de armário — veneziana", () => {
  test("gera lâminas horizontais (porta_veneziana), não o painel liso", () => {
    const r = gerarLayoutDormitorio(amb(200, 300), { ...baseQuarto, tipo_porta: "veneziana" });
    const m = primeiroRoupeiroComPorta(r.projeto.modulos);
    const laminas = m.pecas.filter((p) => p.regra_nome === "porta_veneziana");
    expect(laminas.length).toBeGreaterThan(0);
    expect(m.pecas.some((p) => p.regra_nome === "porta")).toBe(false);
  });

  test("cada lâmina cobre a largura da folha e tem 30mm de altura", () => {
    const r = gerarLayoutDormitorio(amb(200, 300), { ...baseQuarto, tipo_porta: "veneziana" });
    const m = primeiroRoupeiroComPorta(r.projeto.modulos);
    const lamina = m.pecas.find((p) => p.regra_nome === "porta_veneziana")!;
    expect(lamina.largura_mm).toBe(30);
    const larguraFolhaEsperada = Math.round((m.largura_cm * 10) / m.configuracao.num_portas);
    expect(lamina.comprimento_mm).toBe(larguraFolhaEsperada);
  });

  test("dobradiças são geradas normalmente (porta veneziana abre por dobradiça)", () => {
    const r = gerarLayoutDormitorio(amb(200, 300), { ...baseQuarto, tipo_porta: "veneziana" });
    const m = primeiroRoupeiroComPorta(r.projeto.modulos);
    expect(m.ferragens.some((f) => f.tipo === "dobradica_35mm_110grau")).toBe(true);
  });
});

describe("variantes de porta de armário — provençal", () => {
  test("gera porta_provencal (mesma geometria da dobradiça) e serviço de usinagem", () => {
    const r = gerarLayoutDormitorio(amb(200, 300), { ...baseQuarto, tipo_porta: "provencal" });
    const m = primeiroRoupeiroComPorta(r.projeto.modulos);
    const portas = m.pecas.filter((p) => p.regra_nome === "porta_provencal");
    expect(portas.length).toBe(m.configuracao.num_portas);

    const usinagem = m.ferragens.find((f) => f.tipo === "usinagem_provencal");
    expect(usinagem).toBeDefined();
    expect(usinagem!.quantidade).toBe(m.configuracao.num_portas);

    expect(m.ferragens.some((f) => f.tipo === "dobradica_35mm_110grau")).toBe(true);
  });
});

describe("variantes de porta de armário — alumínio/vidro", () => {
  test("gera 1 peça de vidro por folha, menor que a folha (moldura de 30mm por lado)", () => {
    const r = gerarLayoutDormitorio(amb(200, 300), { ...baseQuarto, tipo_porta: "aluminio_vidro" });
    const m = primeiroRoupeiroComPorta(r.projeto.modulos);
    const vidros = m.pecas.filter((p) => p.regra_nome === "vidro_porta");
    expect(vidros.length).toBe(m.configuracao.num_portas);

    const larguraFolhaMm = (m.largura_cm * 10) / m.configuracao.num_portas;
    expect(vidros[0].largura_mm).toBe(Math.round(larguraFolhaMm) - 60); // 30mm × 2 lados
    expect(vidros[0].material.acabamento).toBe("vidro");
  });

  test("gera ferragem de perfil de alumínio proporcional ao perímetro das folhas", () => {
    const r = gerarLayoutDormitorio(amb(200, 300), { ...baseQuarto, tipo_porta: "aluminio_vidro" });
    const m = primeiroRoupeiroComPorta(r.projeto.modulos);
    const perfil = m.ferragens.find((f) => f.tipo === "perfil_aluminio_porta_1m");
    expect(perfil).toBeDefined();
    expect(perfil!.quantidade).toBeGreaterThan(0);
  });

  test("não gera peça de porta lisa nem moldura de palha junto", () => {
    const r = gerarLayoutDormitorio(amb(200, 300), { ...baseQuarto, tipo_porta: "aluminio_vidro" });
    const m = primeiroRoupeiroComPorta(r.projeto.modulos);
    expect(m.pecas.some((p) => p.regra_nome === "porta")).toBe(false);
    expect(m.pecas.some((p) => p.regra_nome.startsWith("moldura_palha"))).toBe(false);
  });
});

describe("variantes de porta de armário — palha", () => {
  test("gera moldura de MDF (travessas + montantes) + miolo de palha por folha", () => {
    const r = gerarLayoutDormitorio(amb(200, 300), { ...baseQuarto, tipo_porta: "palha" });
    const m = primeiroRoupeiroComPorta(r.projeto.modulos);
    const travessas = m.pecas.filter((p) => p.regra_nome === "moldura_palha_travessa");
    const montantes = m.pecas.filter((p) => p.regra_nome === "moldura_palha_montante");
    const insert = m.pecas.filter((p) => p.regra_nome === "palha_insert");

    expect(travessas.length).toBe(m.configuracao.num_portas * 2);
    expect(montantes.length).toBe(m.configuracao.num_portas * 2);
    expect(insert.length).toBe(m.configuracao.num_portas);
    expect(insert[0].material.acabamento).toBe("palha");
    // moldura é MDF do corpo, não o material do miolo
    expect(travessas[0].material.acabamento).not.toBe("palha");
  });
});

describe("material_insert — deriva certo por tipo_porta", () => {
  test("dobradica/correr/provencal/veneziana não geram material_insert", () => {
    for (const tipo of ["dobradica", "correr", "provencal", "veneziana"] as const) {
      const r = gerarLayoutDormitorio(amb(200, 300), { ...baseQuarto, tipo_porta: tipo });
      const m = primeiroRoupeiroComPorta(r.projeto.modulos);
      expect(m.material_insert).toBeUndefined();
    }
  });

  test("aluminio_vidro e palha geram material_insert com o acabamento certo", () => {
    const rVidro = gerarLayoutDormitorio(amb(200, 300), { ...baseQuarto, tipo_porta: "aluminio_vidro" });
    expect(primeiroRoupeiroComPorta(rVidro.projeto.modulos).material_insert?.acabamento).toBe("vidro");

    const rPalha = gerarLayoutDormitorio(amb(200, 300), { ...baseQuarto, tipo_porta: "palha" });
    expect(primeiroRoupeiroComPorta(rPalha.projeto.modulos).material_insert?.acabamento).toBe("palha");
  });
});

describe("variantes de porta — validação não reprova o projeto", () => {
  test.each(["veneziana", "provencal", "aluminio_vidro", "palha"] as const)("%s", (tipo) => {
    const r = gerarLayoutDormitorio(amb(300, 300), { ...baseQuarto, tipo_porta: tipo });
    expect(r.validacao.status).not.toBe("reprovado");
    expect(r.projeto.modulos.length).toBeGreaterThan(0);
  });
});
