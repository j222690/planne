import { describe, test, expect } from "vitest";
import { gerarPlanoGiben, gerarArquivoAC, gerarArquivosAC } from "../giben-ac";
import type { Peca, Material } from "../tipos";

function materialEspessura(espessura: 15 | 6): Material {
  return {
    id: `mdf_${espessura}`,
    codigo: `mdf_${espessura}`,
    nome_display: `MDF Branco ${espessura}mm`,
    espessura_mm: espessura,
    largura_chapa_mm: 2750,
    comprimento_chapa_mm: 1850,
    area_chapa_m2: 2.75 * 1.85,
    cor_hex: "#ffffff",
    acabamento: "melamina",
    preco_custo_chapa: 105,
    preco_venda_chapa: 0,
  };
}

function material(): Material {
  return {
    id: "mdf_15",
    codigo: "mdf_15",
    nome_display: "MDF Branco 15mm",
    espessura_mm: 15,
    largura_chapa_mm: 2750,
    comprimento_chapa_mm: 1850,
    area_chapa_m2: 2.75 * 1.85,
    cor_hex: "#ffffff",
    acabamento: "melamina",
    preco_custo_chapa: 105,
    preco_venda_chapa: 0,
  };
}

function peca(id: string, overrides: Partial<Peca> = {}): Peca {
  return {
    id,
    modulo_instanciado_id: "mod_1",
    regra_nome: "lateral",
    material: material(),
    espessura_mm: 15,
    largura_mm: 600,
    comprimento_mm: 720,
    largura_final_mm: 597,
    comprimento_final_mm: 717,
    quantidade: 1,
    direcao_fio: "indiferente",
    fita_borda: { esquerda: false, direita: false, topo: true, base: false },
    etiqueta_producao: "LATERAL",
    ...overrides,
  } as Peca;
}

// Posições de coluna (1-indexadas) da especificação oficial — usadas pra
// "reabrir" o texto gerado e conferir campo a campo.
function ler(linha: string, de: number, ate: number): string {
  return linha.slice(de - 1, ate);
}

describe("gerarPlanoGiben — empacotamento shelf (rip + cross)", () => {
  test("todas as peças de entrada aparecem como cross cuts na saída", () => {
    const pecas = [
      peca("p1", { largura_mm: 600, comprimento_mm: 720, quantidade: 3 }),
      peca("p2", { largura_mm: 400, comprimento_mm: 500, quantidade: 2, regra_nome: "prateleira" }),
    ];
    const chapas = gerarPlanoGiben(pecas);
    const totalCortes = chapas.reduce(
      (s, c) => s + c.faixas.reduce((s2, f) => s2 + f.cortes.reduce((s3, co) => s3 + co.quantidade, 0), 0),
      0,
    );
    expect(totalCortes).toBe(5); // 3 + 2
  });

  test("cada faixa (rip cut) tem uma única largura — peças da faixa não excedem o comprimento da chapa", () => {
    const pecas = [peca("p1", { largura_mm: 600, comprimento_mm: 900, quantidade: 6 })];
    const chapas = gerarPlanoGiben(pecas);
    for (const chapa of chapas) {
      for (const faixa of chapa.faixas) {
        const somaComprimentos = faixa.cortes.reduce((s, c) => s + c.comprimento_mm * c.quantidade, 0);
        expect(somaComprimentos).toBeLessThanOrEqual(chapa.comprimento_mm);
      }
    }
  });

  test("soma das larguras das faixas não excede a largura da chapa", () => {
    const pecas = [
      peca("p1", { largura_mm: 800, comprimento_mm: 400, quantidade: 2 }),
      peca("p2", { largura_mm: 900, comprimento_mm: 400, quantidade: 2, regra_nome: "porta" }),
    ];
    const chapas = gerarPlanoGiben(pecas);
    for (const chapa of chapas) {
      const somaLarguras = chapa.faixas.reduce((s, f) => s + f.largura_mm, 0);
      expect(somaLarguras).toBeLessThanOrEqual(chapa.largura_mm);
    }
  });

  test("peça maior que a chapa em qualquer eixo é ignorada, sem quebrar", () => {
    const pecas = [peca("p1", { largura_mm: 3000, comprimento_mm: 3000, quantidade: 1 })];
    const chapas = gerarPlanoGiben(pecas);
    expect(chapas.length).toBe(0);
  });
});

describe("gerarArquivoAC — formato de campo fixo, coluna a coluna", () => {
  test("HEADLINE tem 37 caracteres e linhas de PATTERN DATA têm 30 (larguras fixas da spec)", () => {
    const pecas = [
      peca("p1", { largura_mm: 600, comprimento_mm: 720, quantidade: 4 }),
      peca("p2", { largura_mm: 300, comprimento_mm: 500, quantidade: 3, regra_nome: "prateleira" }),
    ];
    const chapas = gerarPlanoGiben(pecas);
    const texto = gerarArquivoAC(chapas);
    const linhas = texto.split("\r\n").filter((l) => l.length > 0);
    expect(linhas[0].length).toBe(37); // headline
    for (const linha of linhas.slice(1)) {
      expect(linha.length).toBe(30); // pattern data
    }
  });

  test("HEADLINE bate com as posições da especificação oficial", () => {
    const pecas = [peca("p1", { largura_mm: 600, comprimento_mm: 720, quantidade: 4 })];
    const chapas = gerarPlanoGiben(pecas);
    const texto = gerarArquivoAC(chapas);
    const linhas = texto.split("\r\n");
    const headline = linhas[0];

    expect(headline.length).toBe(37);
    expect(ler(headline, 1, 15).trim()).toBe("MDF Branco 15mm".slice(0, 15).trim());
    expect(ler(headline, 16, 18)).toBe("150"); // 15mm * 10
    expect(ler(headline, 19, 20)).toBe("01");
    expect(ler(headline, 21, 21)).toBe("1"); // record key HEADLINE
    expect(ler(headline, 22, 26)).toBe("00001"); // 1 chapa
    expect(ler(headline, 27, 31)).toBe("18500"); // comprimento 1850mm em 1/10mm
    expect(ler(headline, 32, 36)).toBe("27500"); // largura 2750mm em 1/10mm
    expect(ler(headline, 37, 37)).toBe("0");
  });

  test("linhas de PATTERN DATA têm os 2 primeiros campos (material+espessura) iguais à HEADLINE", () => {
    const pecas = [
      peca("p1", { largura_mm: 600, comprimento_mm: 720, quantidade: 4 }),
      peca("p2", { largura_mm: 300, comprimento_mm: 500, quantidade: 3, regra_nome: "prateleira" }),
    ];
    const chapas = gerarPlanoGiben(pecas);
    const texto = gerarArquivoAC(chapas);
    const linhas = texto.split("\r\n").filter((l) => l.length > 0);

    const materialHeadline = ler(linhas[0], 1, 18);
    for (const linha of linhas) {
      expect(ler(linha, 1, 18)).toBe(materialHeadline);
    }
  });

  test("record keys seguem a sequência esperada: headcut, depois rip+cross por faixa", () => {
    const pecas = [peca("p1", { largura_mm: 600, comprimento_mm: 720, quantidade: 4 })];
    const chapas = gerarPlanoGiben(pecas);
    const texto = gerarArquivoAC(chapas);
    const linhas = texto.split("\r\n").filter((l) => l.length > 0);
    const patternLinhas = linhas.slice(1); // pula a headline

    expect(ler(patternLinhas[0], 21, 21)).toBe("2"); // headcut primeiro
    expect(ler(patternLinhas[1], 21, 21)).toBe("3"); // rip cut da 1ª faixa
    // as linhas seguintes até a próxima rip/headline são cross cuts (key 4)
    expect(ler(patternLinhas[2], 21, 21)).toBe("4");
  });

  test("rip cut carrega a largura da faixa em 1/10mm no campo de dimensão", () => {
    const pecas = [peca("p1", { largura_mm: 600, comprimento_mm: 720, quantidade: 1 })];
    const chapas = gerarPlanoGiben(pecas);
    const texto = gerarArquivoAC(chapas);
    const ripLinha = texto.split("\r\n").find((l) => ler(l, 21, 21) === "3");
    expect(ripLinha).toBeDefined();
    expect(ler(ripLinha!, 24, 28)).toBe("06000"); // 600mm em 1/10mm
  });

  test("cross cut carrega o comprimento certo, e a soma das quantidades bate com o total de peças", () => {
    // 720mm não cabe 5x no comprimento de uma chapa (1850mm) — o algoritmo
    // corretamente distribui em mais de uma faixa/chapa; conferimos a SOMA.
    const pecas = [peca("p1", { largura_mm: 600, comprimento_mm: 720, quantidade: 5 })];
    const chapas = gerarPlanoGiben(pecas);
    const texto = gerarArquivoAC(chapas);
    const crossLinhas = texto.split("\r\n").filter((l) => ler(l, 21, 21) === "4");
    expect(crossLinhas.length).toBeGreaterThan(0);
    for (const l of crossLinhas) expect(ler(l, 24, 28)).toBe("07200"); // 720mm em 1/10mm
    const somaQuantidade = crossLinhas.reduce((s, l) => s + Number(ler(l, 29, 30)), 0);
    expect(somaQuantidade).toBe(5);
  });

  test("peças que cabem numa faixa só (comprimento pequeno) viram 1 linha de cross cut com a quantidade certa", () => {
    const pecas = [peca("p1", { largura_mm: 300, comprimento_mm: 200, quantidade: 5 })];
    const chapas = gerarPlanoGiben(pecas);
    const texto = gerarArquivoAC(chapas);
    const crossLinha = texto.split("\r\n").find((l) => ler(l, 21, 21) === "4");
    expect(crossLinha).toBeDefined();
    expect(ler(crossLinha!, 24, 28)).toBe("02000"); // 200mm em 1/10mm
    expect(ler(crossLinha!, 29, 30)).toBe("05"); // quantidade 5
  });
});

describe("gerarArquivosAC — 1 arquivo por material (spec: \"AC file... for ONE material\")", () => {
  test("projeto com 2 materiais gera 2 arquivos, cada um só com o material dele", () => {
    const pecas = [
      peca("corpo1", { largura_mm: 600, comprimento_mm: 720, quantidade: 2, material: materialEspessura(15) }),
      peca("fundo1", { largura_mm: 590, comprimento_mm: 710, quantidade: 2, espessura_mm: 6, material: materialEspessura(6), regra_nome: "fundo" }),
    ];
    const chapas = gerarPlanoGiben(pecas);
    const arquivos = gerarArquivosAC(chapas);
    expect(arquivos.length).toBe(2);
    for (const arquivo of arquivos) {
      const linhas = arquivo.conteudo.split("\r\n").filter((l) => l.length > 0);
      const materiaisNoArquivo = new Set(linhas.map((l) => l.slice(0, 18)));
      expect(materiaisNoArquivo.size).toBe(1); // só 1 material+espessura por arquivo
    }
  });

  test("número do pattern reinicia em 1 por material (não é global)", () => {
    const pecas = [
      peca("corpo1", { largura_mm: 600, comprimento_mm: 720, quantidade: 1, material: materialEspessura(15) }),
      peca("fundo1", { largura_mm: 590, comprimento_mm: 710, quantidade: 1, espessura_mm: 6, material: materialEspessura(6), regra_nome: "fundo" }),
    ];
    const chapas = gerarPlanoGiben(pecas);
    const arquivos = gerarArquivosAC(chapas);
    for (const arquivo of arquivos) {
      const headline = arquivo.conteudo.split("\r\n")[0];
      expect(headline.slice(18, 20)).toBe("01"); // 1ª (única) chapa de cada material começa em 01
    }
  });
});
