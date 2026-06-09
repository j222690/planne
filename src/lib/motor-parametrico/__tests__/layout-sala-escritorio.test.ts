import { describe, test, expect } from "vitest";
import { gerarLayoutSala } from "../layout-sala";
import { gerarLayoutEscritorio } from "../layout-escritorio";
import { criarAmbienteManual } from "../ambiente";
import type { PreferenciasSala } from "../layout-sala";
import type { PreferenciasEscritorio } from "../layout-escritorio";

const prefsSala: PreferenciasSala = {
  cor_mdf_hex: "#D9C7A8",
  ferragem: "nacional",
  margem_desejada_pct: 300,
};
const prefsEsc: PreferenciasEscritorio = {
  cor_mdf_hex: "#D9C7A8",
  ferragem: "nacional",
  margem_desejada_pct: 300,
};

function ambiente(largura = 400, profundidade = 350) {
  return criarAmbienteManual({ largura_cm: largura, profundidade_cm: profundidade, altura_cm: 270 });
}

// ─── SALA ──────────────────────────────────────────────────────────────────────

describe("gerarLayoutSala", () => {
  test("gera projeto de sala com módulos", () => {
    const { projeto } = gerarLayoutSala(ambiente(), prefsSala);
    expect(projeto).toBeDefined();
    expect(projeto.modulos.length).toBeGreaterThan(0);
    expect(projeto.tipo_ambiente).toBe("Sala");
  });

  test("inclui rack de TV na base (y=0)", () => {
    const { projeto } = gerarLayoutSala(ambiente(), prefsSala);
    const racks = projeto.modulos.filter((m) => m.id.startsWith("rack_tv"));
    expect(racks.length).toBeGreaterThan(0);
    racks.forEach((r) => expect(r.posicao_y_cm).toBe(0));
  });

  test("inclui painel ripado e estante quando há espaço", () => {
    const { projeto } = gerarLayoutSala(ambiente(400, 350), prefsSala);
    expect(projeto.modulos.some((m) => m.id.startsWith("painel_ripado"))).toBe(true);
    expect(projeto.modulos.some((m) => m.id.startsWith("nicho_sala"))).toBe(true);
  });

  test("com_superior=false e com_painel=false geram só o rack", () => {
    const { projeto } = gerarLayoutSala(ambiente(), { ...prefsSala, com_superior: false, com_painel: false });
    expect(projeto.modulos.every((m) => m.id.startsWith("rack_tv"))).toBe(true);
  });

  test("validação não reprova um projeto de sala padrão", () => {
    const { validacao } = gerarLayoutSala(ambiente(), prefsSala);
    expect(validacao.status).not.toBe("reprovado");
  });

  test("módulos cabem dentro da parede (não estouram a largura)", () => {
    const largura = 400;
    const { projeto } = gerarLayoutSala(ambiente(largura), prefsSala);
    projeto.modulos
      .filter((m) => m.id.startsWith("rack_tv"))
      .forEach((m) => expect(m.posicao_x_cm + m.largura_cm).toBeLessThanOrEqual(largura + 1));
  });
});

// ─── ESCRITÓRIO ─────────────────────────────────────────────────────────────────

describe("gerarLayoutEscritorio", () => {
  test("gera projeto de escritório com módulos", () => {
    const { projeto } = gerarLayoutEscritorio(ambiente(), prefsEsc);
    expect(projeto).toBeDefined();
    expect(projeto.modulos.length).toBeGreaterThan(0);
    expect(projeto.tipo_ambiente).toBe("Escritório");
  });

  test("inclui bancada de trabalho (escrivaninha) na base", () => {
    const { projeto } = gerarLayoutEscritorio(ambiente(), prefsEsc);
    const bancadas = projeto.modulos.filter((m) => m.id.startsWith("escrivaninha"));
    expect(bancadas.length).toBeGreaterThan(0);
    bancadas.forEach((b) => expect(b.posicao_y_cm).toBe(0));
  });

  test("inclui gaveteiro quando há espaço", () => {
    const { projeto } = gerarLayoutEscritorio(ambiente(400), prefsEsc);
    expect(projeto.modulos.some((m) => m.id.startsWith("gaveteiro_esc"))).toBe(true);
  });

  test("inclui estante aérea de prateleiras", () => {
    const { projeto } = gerarLayoutEscritorio(ambiente(400), prefsEsc);
    const estantes = projeto.modulos.filter((m) => m.id.startsWith("estante_esc"));
    expect(estantes.length).toBeGreaterThan(0);
    estantes.forEach((e) => expect(e.posicao_y_cm).toBeGreaterThan(100));
  });

  test("com_gaveteiro=false e com_superior=false geram só a bancada", () => {
    const { projeto } = gerarLayoutEscritorio(ambiente(), { ...prefsEsc, com_gaveteiro: false, com_superior: false });
    expect(projeto.modulos.every((m) => m.id.startsWith("escrivaninha"))).toBe(true);
  });

  test("validação não reprova um projeto de escritório padrão", () => {
    const { validacao } = gerarLayoutEscritorio(ambiente(), prefsEsc);
    expect(validacao.status).not.toBe("reprovado");
  });
});
