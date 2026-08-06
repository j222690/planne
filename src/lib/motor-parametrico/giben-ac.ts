/**
 * PLANNE — Motor Paramétrico
 * Exportação Giben .AC — formato oficial GibenAmerica/Optisave v5.0
 *
 * Especificação obtida do PDF oficial "GibenAmerica AC File Format" (2006) —
 * ver memória `reference_giben_ac_formato` da sessão que a encontrou. Texto
 * ASCII de campo fixo, sem delimitador. Estrutura de corte real do formato é
 * GUILHOTINA EM 2 ESTÁGIOS (não uma árvore recursiva genérica como
 * `nesting-guilhotina.ts`):
 *   1. rip cut — corta a chapa inteira em faixas (largura fixa por faixa).
 *   2. cross cut — dentro de CADA faixa, corta ao longo do comprimento,
 *      gerando as peças finais numeradas.
 *
 * Ressalva: essa é a especificação clássica (Optisave), pode não bater 100%
 * com controladores G57 mais novos — confirmar com arquivo real da máquina
 * antes de usar em produção.
 */

import type { Peca, Material, DirecaoFio } from "./tipos";
import { KERF_MM, MARGEM_CHAPA_MM } from "./nesting";

// ─── TIPOS ──────────────────────────────────────────────────────────────────

interface ItemGiben {
  peca_id: string;
  numero_parte: number;
  largura_mm: number; // eixo do rip cut (faixa)
  comprimento_mm: number; // eixo do cross cut
  direcao_fio: DirecaoFio;
}

/** Uma faixa (resultado de UM rip cut) com suas peças (cross cuts). */
interface FaixaGiben {
  largura_mm: number;
  /** Peças agrupadas por comprimento — cada entrada vira uma linha de cross cut. */
  cortes: { numero_parte: number; comprimento_mm: number; quantidade: number }[];
}

export interface ChapaGiben {
  numero_pattern: number;
  material: Material;
  largura_mm: number;
  comprimento_mm: number;
  faixas: FaixaGiben[];
}

// ─── EMPACOTAMENTO SHELF (rip cut + cross cut) ────────────────────────────────

/**
 * Empacota as peças de UM material em chapas usando o padrão "shelf":
 * agrupa por largura (cada grupo = candidatas a uma ou mais faixas de rip
 * cut), e dentro do grupo faz bin-packing 1D ao longo do comprimento da
 * chapa (first-fit decreasing) — cada faixa cheia vira 1 rip cut + seus
 * cross cuts.
 */
function empacotarShelf(
  itens: ItemGiben[],
  material: Material,
): ChapaGiben[] {
  const larguraChapa = material.largura_chapa_mm;
  const comprimentoChapa = material.comprimento_chapa_mm;
  const areaUtilLargura = larguraChapa - 2 * MARGEM_CHAPA_MM;
  const areaUtilComprimento = comprimentoChapa - 2 * MARGEM_CHAPA_MM;

  // Agrupa por largura (mm, arredondada) — peças da mesma largura cabem na
  // mesma faixa de rip cut.
  const porLargura = new Map<number, ItemGiben[]>();
  for (const item of itens) {
    const w = Math.round(item.largura_mm);
    const grupo = porLargura.get(w) ?? [];
    grupo.push(item);
    porLargura.set(w, grupo);
  }

  // Gera as faixas: dentro de cada largura, first-fit decreasing por
  // comprimento ao longo do comprimento útil da chapa.
  const todasFaixas: FaixaGiben[] = [];
  for (const [largura, grupo] of porLargura) {
    if (largura > areaUtilLargura) continue; // não cabe em nenhuma chapa — ignora
    const restante = [...grupo].sort((a, b) => b.comprimento_mm - a.comprimento_mm);

    while (restante.length > 0) {
      const faixaItens: ItemGiben[] = [];
      let usado = 0;
      for (let i = restante.length - 1; i >= 0; i--) {
        const c = restante[i].comprimento_mm + KERF_MM;
        if (usado + c <= areaUtilComprimento) {
          faixaItens.push(restante[i]);
          usado += c;
          restante.splice(i, 1);
        }
      }
      if (faixaItens.length === 0) {
        // peça isolada maior que o comprimento útil — não cabe, descarta
        restante.pop();
        continue;
      }
      // Agrupa por comprimento dentro da faixa (cross cuts iguais viram 1 linha)
      const porComprimento = new Map<string, { numero_parte: number; comprimento_mm: number; quantidade: number }>();
      for (const it of faixaItens) {
        const chave = `${it.numero_parte}|${Math.round(it.comprimento_mm)}`;
        const atual = porComprimento.get(chave);
        if (atual) atual.quantidade += 1;
        else porComprimento.set(chave, { numero_parte: it.numero_parte, comprimento_mm: it.comprimento_mm, quantidade: 1 });
      }
      todasFaixas.push({ largura_mm: largura, cortes: [...porComprimento.values()] });
    }
  }

  // Empacota as faixas em chapas (bin-packing 1D pela largura das faixas)
  const chapas: ChapaGiben[] = [];
  let faixasRestantes = [...todasFaixas].sort((a, b) => b.largura_mm - a.largura_mm);
  let numeroPattern = 0;

  while (faixasRestantes.length > 0) {
    const faixasChapa: FaixaGiben[] = [];
    let usadoLargura = 0;
    for (let i = faixasRestantes.length - 1; i >= 0; i--) {
      const w = faixasRestantes[i].largura_mm + KERF_MM;
      if (usadoLargura + w <= areaUtilLargura) {
        faixasChapa.push(faixasRestantes[i]);
        usadoLargura += w;
        faixasRestantes.splice(i, 1);
      }
    }
    if (faixasChapa.length === 0) {
      // uma faixa sozinha já não cabe na largura útil — pula (peça inválida)
      faixasRestantes.pop();
      continue;
    }
    chapas.push({
      numero_pattern: ++numeroPattern,
      material,
      largura_mm: larguraChapa,
      comprimento_mm: comprimentoChapa,
      faixas: faixasChapa,
    });
  }

  return chapas;
}

// ─── PREPARAÇÃO ───────────────────────────────────────────────────────────────

const NAO_CHAPA = /vidro|espelho|maci/i;

/**
 * Gera o plano de chapas Giben (shelf/rip+cross) a partir das peças do
 * projeto. Peças com direção de fio fixa mantêm a orientação (largura_mm =
 * eixo do rip cut); não há rotação neste exportador (a máquina real também
 * costuma preferir orientação consistente por veio).
 */
export function gerarPlanoGiben(pecas: Peca[]): ChapaGiben[] {
  // Agrupa por material primeiro — cada material/espessura é um "job" de
  // corte separado no mundo real, então a numeração de peça (campo de só 2
  // dígitos, máx 99 tipos distintos) reinicia por grupo em vez de global.
  // Isso evita colapsar peças distintas no mesmo número quando o projeto
  // tem muitos tipos de peça espalhados por vários materiais.
  const porMaterial = new Map<string, { material: Material; pecas: Peca[] }>();
  for (const p of pecas) {
    if (NAO_CHAPA.test(p.material.nome_display)) continue;
    const chave = `${p.material.id}|${p.espessura_mm}`;
    const grupo = porMaterial.get(chave) ?? { material: p.material, pecas: [] };
    grupo.pecas.push(p);
    porMaterial.set(chave, grupo);
  }

  const chapas: ChapaGiben[] = [];
  for (const { material, pecas: pecasDoMaterial } of porMaterial.values()) {
    let proximoNumeroParte = 1;
    const numeroPartePorPeca = new Map<string, number>();
    const itens: ItemGiben[] = [];
    for (const p of pecasDoMaterial) {
      if (!numeroPartePorPeca.has(p.id)) {
        numeroPartePorPeca.set(p.id, proximoNumeroParte <= 99 ? proximoNumeroParte++ : 99);
      }
      const numero_parte = numeroPartePorPeca.get(p.id)!;
      for (let i = 0; i < p.quantidade; i++) {
        itens.push({
          peca_id: `${p.id}#${i}`,
          numero_parte,
          largura_mm: p.largura_mm,
          comprimento_mm: p.comprimento_mm,
          direcao_fio: p.direcao_fio,
        });
      }
    }
    // Número do pattern reinicia por material (cada material é um JOB/arquivo
    // separado no formato real — ver gerarArquivosAC). Campo de 2 dígitos:
    // no máximo 99 chapas por material num único arquivo.
    const chapasDoMaterial = empacotarShelf(itens, material).map((c, i) => ({
      ...c,
      numero_pattern: (i % 99) + 1,
    }));
    chapas.push(...chapasDoMaterial);
  }
  return chapas;
}

// ─── CODIFICAÇÃO DO ARQUIVO .AC (campo fixo) ──────────────────────────────────

function padTexto(s: string, largura: number): string {
  return s.slice(0, largura).padEnd(largura, " ");
}

function padNumero(n: number, largura: number): string {
  const inteiro = Math.max(0, Math.round(n));
  return String(inteiro).padStart(largura, "0").slice(-largura);
}

function linhaHeadline(chapa: ChapaGiben): string {
  const tipo = padTexto(chapa.material.nome_display, 15);
  const espessura = padNumero(chapa.material.espessura_mm * 10, 3);
  const pattern = padNumero(chapa.numero_pattern, 2);
  const recordKey = "1";
  const quantidade = padNumero(1, 5);
  const comprimento = padNumero(chapa.comprimento_mm * 10, 5);
  const largura = padNumero(chapa.largura_mm * 10, 5);
  const trim = "0";
  return tipo + espessura + pattern + recordKey + quantidade + comprimento + largura + trim;
}

function linhasPattern(chapa: ChapaGiben): string[] {
  const tipo = padTexto(chapa.material.nome_display, 15);
  const espessura = padNumero(chapa.material.espessura_mm * 10, 3);
  const pattern = padNumero(chapa.numero_pattern, 2);
  const prefixo = tipo + espessura + pattern;

  const linhas: string[] = [];

  // headcut opcional: refila a borda inicial (comprimento total da chapa)
  linhas.push(prefixo + "2" + padNumero(0, 2) + padNumero(chapa.comprimento_mm * 10, 5) + padNumero(1, 2));

  for (const faixa of chapa.faixas) {
    // rip cut: 1 faixa desta largura
    linhas.push(prefixo + "3" + padNumero(0, 2) + padNumero(faixa.largura_mm * 10, 5) + padNumero(1, 2));
    // cross cuts: peças finais dentro da faixa
    for (const corte of faixa.cortes) {
      const qtd = Math.min(corte.quantidade, 99);
      linhas.push(
        prefixo + "4" + padNumero(corte.numero_parte, 2) + padNumero(corte.comprimento_mm * 10, 5) + padNumero(qtd, 2),
      );
      // quantidade > 99 (raro): linhas extras
      let sobra = corte.quantidade - 99;
      while (sobra > 0) {
        const q = Math.min(sobra, 99);
        linhas.push(
          prefixo + "4" + padNumero(corte.numero_parte, 2) + padNumero(corte.comprimento_mm * 10, 5) + padNumero(q, 2),
        );
        sobra -= q;
      }
    }
  }

  return linhas;
}

/**
 * Gera o conteúdo textual de um único arquivo .AC a partir de chapas —
 * usar só com chapas do MESMO material (a spec é explícita: "the AC file
 * contains the cutting pattern data for ONE material"). Para um projeto com
 * vários materiais, usar `gerarArquivosAC` (1 arquivo por material).
 */
export function gerarArquivoAC(chapas: ChapaGiben[]): string {
  const linhas: string[] = [];
  for (const chapa of chapas) {
    linhas.push(linhaHeadline(chapa));
    linhas.push(...linhasPattern(chapa));
  }
  return linhas.join("\r\n");
}

/** Um arquivo .AC pronto pra baixar — nome sugerido + conteúdo. */
export interface ArquivoGiben {
  nome_arquivo: string;
  conteudo: string;
}

/**
 * Gera um arquivo .AC POR MATERIAL/espessura — a especificação da Giben diz
 * explicitamente que um arquivo .AC cobre um material só; um projeto real
 * (MDF 15mm de corpo, 6mm de fundo etc.) vira vários arquivos.
 */
export function gerarArquivosAC(chapas: ChapaGiben[]): ArquivoGiben[] {
  const porMaterial = new Map<string, { nome: string; chapas: ChapaGiben[] }>();
  for (const chapa of chapas) {
    const chave = `${chapa.material.id}|${chapa.material.espessura_mm}`;
    const grupo = porMaterial.get(chave) ?? { nome: chapa.material.nome_display, chapas: [] };
    grupo.chapas.push(chapa);
    porMaterial.set(chave, grupo);
  }
  return [...porMaterial.values()].map(({ nome, chapas: chapasDoMaterial }) => ({
    nome_arquivo: `${nome.replace(/[^\w-]+/g, "_")}.AC`,
    conteudo: gerarArquivoAC(chapasDoMaterial),
  }));
}
