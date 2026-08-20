/**
 * PLANNE — Book técnico
 * PDF único consolidando o projeto: capa, planta baixa, vista de elevação,
 * croqui técnico de cada módulo, lista de corte, resumo do orçamento.
 *
 * Client-only, mesmo isolamento de exportacao-zip.ts (fica fora de
 * motor-parametrico/ pra não inflar o bundle do motor, api/motor.js).
 */
import { jsPDF } from "jspdf";
import { pdfListaCorte } from "./exportacao-zip";
import { calcularCroquiGeometria, type ModuloParaCroqui } from "@/components/planne/CroquiTecnicoModulo";
import type { PlanoNesting } from "./motor-parametrico/tipos";

export interface BookTecnicoInput {
  nomeProjeto: string;
  ambiente: string;
  clienteNome?: string;
  /** PNG (data-uri) da planta baixa — já capturado via svgParaPngDataUri, ou null se indisponível. */
  plantaPngDataUri?: string | null;
  /** PNG (data-uri) da vista de elevação atualmente ativa. */
  elevacaoPngDataUri?: string | null;
  modulos: ModuloParaCroqui[];
  planoCorte: PlanoNesting;
  orcamento: {
    versaoLabel: string;
    custoTotal: number;
    precoVenda: number;
    margemPct: number;
    prazoDias: number;
  };
  /**
   * Cada marcenaria monta o book do seu jeito — alguns times não emitem
   * lista de corte pra fora (produção própria), outros já têm um book de
   * elevação separado etc. Configurável em Configurações; sem nada
   * definido, o book sai completo (todas as seções ligadas por padrão).
   */
  secoes?: {
    planta?: boolean;
    elevacao?: boolean;
    croquis?: boolean;
    listaCorte?: boolean;
    resumoOrcamento?: boolean;
  };
}

function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function adicionarImagemPagina(doc: jsPDF, titulo: string, dataUri: string): void {
  doc.addPage();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(titulo, 14, 15);
  const props = doc.getImageProperties(dataUri);
  const maxW = pageW - 28;
  const maxH = pageH - 30;
  const ratio = Math.min(maxW / props.width, maxH / props.height);
  const w = props.width * ratio;
  const h = props.height * ratio;
  doc.addImage(dataUri, "PNG", (pageW - w) / 2, 22, w, h);
}

/** Desenha o croqui técnico de UM módulo nativo em jsPDF (sem rasterizar — texto/linhas ficam nítidos no PDF). */
function desenharCroqui(
  doc: jsPDF,
  x: number,
  y: number,
  larguraDisp: number,
  alturaDisp: number,
  modulo: ModuloParaCroqui,
  titulo: string,
): void {
  const geo = calcularCroquiGeometria(modulo);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(titulo, x, y);

  const reservaRodape = 12;
  const topoDesenho = y + 5;
  const alturaUtil = alturaDisp - reservaRodape;
  const escala = Math.min((larguraDisp - 12) / geo.larguraM, alturaUtil / geo.alturaM);
  const bx = x + (larguraDisp - geo.larguraM * escala) / 2;
  const by = topoDesenho;

  const telaX = (xLocal: number) => bx + (xLocal + geo.larguraM / 2) * escala;
  const telaY = (yLocal: number) => by + (geo.alturaM - yLocal) * escala;

  // Caixa externa
  doc.setDrawColor(55, 65, 81);
  doc.setLineWidth(0.3);
  doc.rect(bx, by, geo.larguraM * escala, geo.alturaM * escala);

  // Divisórias entre portas
  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(0.15);
  for (const p of geo.portas.slice(1)) {
    const lx = telaX(p.xCentroM - p.larguraM / 2);
    doc.line(lx, by, lx, by + geo.alturaM * escala);
  }
  // Divisórias de gaveta
  for (const g of geo.gavetas) {
    const ly = telaY(g.yCentroM + g.alturaM / 2);
    doc.line(bx, ly, bx + geo.larguraM * escala, ly);
  }
  // Prateleiras (tracejado)
  doc.setDrawColor(180, 83, 9);
  doc.setLineDashPattern([1, 0.8], 0);
  for (const pr of geo.prateleiras) {
    const ly = telaY(pr.yCentroM);
    doc.line(bx + 1, ly, bx + geo.larguraM * escala - 1, ly);
  }
  doc.setLineDashPattern([], 0);

  // Cotas totais
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(55, 65, 81);
  doc.text(`${Math.round(geo.larguraM * 100)}cm`, bx + (geo.larguraM * escala) / 2, by + geo.alturaM * escala + 4, {
    align: "center",
  });
  doc.text(`${Math.round(geo.alturaM * 100)}cm`, Math.max(x, bx - 2), by + (geo.alturaM * escala) / 2, {
    align: "right",
  });

  // Anotações
  doc.setFontSize(6.3);
  doc.setTextColor(120);
  const a = geo.anotacoes;
  const partes = [
    `${a.numPortas} porta(s) · ${a.numGavetas} gaveta(s) · ${a.numPrateleiras} prateleira(s)`,
    `Corpo ${a.espCorpoMm}mm · Porta ${a.espPortaMm}mm`,
    a.ferragemLabel ? `Ferragem ${a.ferragemLabel}` : null,
    a.puxadorLabel ? `Puxador ${a.puxadorLabel}` : null,
  ].filter(Boolean);
  doc.text(partes.join("  ·  "), x, by + geo.alturaM * escala + 9, { maxWidth: larguraDisp });
  doc.setTextColor(0);
}

/** Gera e baixa o book técnico do projeto (PDF único). */
export async function gerarBookTecnico(input: BookTecnicoInput): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Capa
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("Book técnico", pageW / 2, 70, { align: "center" });
  doc.setFontSize(15);
  doc.setFont("helvetica", "normal");
  doc.text(input.nomeProjeto, pageW / 2, 84, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(input.ambiente, pageW / 2, 92, { align: "center" });
  let yCapa = 99;
  if (input.clienteNome) {
    doc.text(`Cliente: ${input.clienteNome}`, pageW / 2, yCapa, { align: "center" });
    yCapa += 7;
  }
  doc.text(new Date().toLocaleDateString("pt-BR"), pageW / 2, yCapa, { align: "center" });
  doc.setTextColor(0);

  const secoes = {
    planta: input.secoes?.planta ?? true,
    elevacao: input.secoes?.elevacao ?? true,
    croquis: input.secoes?.croquis ?? true,
    listaCorte: input.secoes?.listaCorte ?? true,
    resumoOrcamento: input.secoes?.resumoOrcamento ?? true,
  };

  if (secoes.planta && input.plantaPngDataUri) adicionarImagemPagina(doc, "Planta baixa", input.plantaPngDataUri);
  if (secoes.elevacao && input.elevacaoPngDataUri) adicionarImagemPagina(doc, "Vista de elevação", input.elevacaoPngDataUri);

  // Croquis técnicos — 2 por página, empilhados
  if (secoes.croquis && input.modulos.length) {
    const pageH = doc.internal.pageSize.getHeight();
    const margemX = 14;
    const larguraDisp = pageW - margemX * 2;
    const alturaCard = (pageH - 30) / 2;
    input.modulos.forEach((m, i) => {
      const pos = i % 2;
      if (pos === 0) {
        doc.addPage();
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text("Croquis técnicos", margemX, 15);
      }
      const y = 22 + pos * alturaCard;
      desenharCroqui(doc, margemX, y, larguraDisp, alturaCard - 4, m, m.nome_display ?? m.nome ?? `Módulo ${i + 1}`);
    });
  }

  // Lista de corte — acrescentada no MESMO doc (reaproveita pdfListaCorte)
  if (secoes.listaCorte) pdfListaCorte(input.planoCorte, "Lista de corte", doc);

  // Resumo do orçamento
  if (secoes.resumoOrcamento) {
    doc.addPage();
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Resumo do orçamento", 14, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let y = 26;
    doc.text(`Versão: ${input.orcamento.versaoLabel}`, 14, y);
    y += 7;
    doc.text(`Custo de produção: ${brl(input.orcamento.custoTotal)}`, 14, y);
    y += 7;
    doc.text(`Margem: ${input.orcamento.margemPct}%`, 14, y);
    y += 7;
    doc.text(`Prazo de produção: ${input.orcamento.prazoDias} dia(s)`, 14, y);
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total ao cliente: ${brl(input.orcamento.precoVenda)}`, 14, y);
  }

  const nomeArquivo = `book-tecnico-${input.nomeProjeto.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
  doc.save(nomeArquivo);
}
