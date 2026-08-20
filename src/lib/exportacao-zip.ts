/**
 * PLANNE — "Baixar Tudo"
 * Empacota os artefatos de produção de um plano de corte num único .zip:
 * lista de corte (CSV + PDF), DXF pra CNC, etiquetas com QR (PDF) e o
 * contrato (HTML, se fornecido).
 *
 * Client-only: usa jszip/jspdf/qrcode, que NÃO devem entrar no bundle do
 * motor (api/motor.js) — por isso mora fora de src/lib/motor-parametrico/.
 */

import JSZip from "jszip";
import { jsPDF } from "jspdf";
import { toDataURL as qrToDataURL } from "qrcode";
import { gerarExportacoes, type EtiquetaPeca } from "./motor-parametrico/exportacao-corte";
import type { ChapaAlocada, PlanoNesting } from "./motor-parametrico/tipos";

function metrosFitaTotal(chapas: ChapaAlocada[]): number {
  let total = 0;
  for (const chapa of chapas) {
    for (const p of chapa.pecas_alocadas) {
      const fb = p.fita_borda;
      if (!fb) continue;
      const rot = p.rotacionada;
      // fita_borda vem na orientação NÃO rotacionada; mapeia p/ as arestas
      // efetivamente colocadas (mesma lógica do preview do plano de corte).
      if (rot ? fb.esquerda : fb.topo) total += p.largura_mm;
      if (rot ? fb.direita : fb.base) total += p.largura_mm;
      if (rot ? fb.base : fb.esquerda) total += p.comprimento_mm;
      if (rot ? fb.topo : fb.direita) total += p.comprimento_mm;
    }
  }
  return total / 1000;
}

function montarPlano(chapas: ChapaAlocada[]): PlanoNesting {
  const total_pecas = chapas.reduce((s, c) => s + c.pecas_alocadas.length, 0);
  const areaUtil = chapas.reduce((s, c) => s + (c.area_util_mm2 ?? 0), 0);
  const areaTotal = chapas.reduce((s, c) => s + c.largura_mm * c.comprimento_mm, 0);
  const areaDesperdicada = Math.max(0, areaTotal - areaUtil);
  return {
    algoritmo: "bottom_left_fill",
    chapas,
    resumo: {
      total_pecas,
      total_chapas: chapas.length,
      area_util_total_m2: Math.round((areaUtil / 1_000_000) * 100) / 100,
      area_desperdicada_m2: Math.round((areaDesperdicada / 1_000_000) * 100) / 100,
      desperdicio_pct: areaTotal > 0 ? Math.round((areaDesperdicada / areaTotal) * 1000) / 10 : 0,
      metros_fita_total: Math.round(metrosFitaTotal(chapas) * 10) / 10,
    },
    exportacoes: { csv_operador: "" },
    calculado_em: new Date().toISOString(),
  };
}

/**
 * `docExistente`: quando fornecido, a lista é acrescentada NUMA PÁGINA NOVA
 * do mesmo documento (em vez de criar um jsPDF isolado) — usado pelo book
 * técnico (exportacao-book-tecnico.ts) pra não duplicar essa lógica.
 */
export function pdfListaCorte(plano: PlanoNesting, titulo: string, docExistente?: jsPDF): jsPDF {
  const doc = docExistente ?? new jsPDF({ unit: "mm", format: "a4" });
  if (docExistente) doc.addPage();
  const pageH = doc.internal.pageSize.getHeight();
  let y = 15;

  doc.setFontSize(14);
  doc.text(titulo, 14, y);
  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(
    `${plano.resumo.total_chapas} chapa(s) · ${plano.resumo.total_pecas} peça(s) · ${plano.resumo.desperdicio_pct}% desperdício · ${plano.resumo.metros_fita_total}m de fita`,
    14,
    y,
  );
  y += 9;
  doc.setTextColor(0);

  for (const chapa of plano.chapas) {
    if (y > pageH - 20) {
      doc.addPage();
      y = 15;
    }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Chapa ${chapa.numero_sequencial} — ${chapa.material.nome_display} (${chapa.largura_mm}×${chapa.comprimento_mm}mm)`,
      14,
      y,
    );
    y += 6;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    for (const p of chapa.pecas_alocadas) {
      if (y > pageH - 12) {
        doc.addPage();
        y = 15;
      }
      doc.text(
        `${p.etiqueta}  —  ${p.largura_mm}×${p.comprimento_mm}mm${p.rotacionada ? "  (rotacionada)" : ""}`,
        18,
        y,
      );
      y += 4.5;
    }
    y += 4;
  }
  return doc;
}

async function pdfEtiquetas(etiquetas: EtiquetaPeca[]): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const cols = 3,
    cardW = 60,
    cardH = 38,
    marginX = 12,
    marginY = 14,
    gap = 4;
  const pageH = doc.internal.pageSize.getHeight();
  const rowsPerPage = Math.floor((pageH - marginY * 2) / (cardH + gap));
  const perPage = cols * rowsPerPage;

  for (let i = 0; i < etiquetas.length; i++) {
    const et = etiquetas[i];
    const posNaPagina = i % perPage;
    if (i > 0 && posNaPagina === 0) doc.addPage();
    const col = posNaPagina % cols;
    const row = Math.floor(posNaPagina / cols);
    const x = marginX + col * (cardW + gap);
    const y = marginY + row * (cardH + gap);

    doc.setDrawColor(190);
    doc.rect(x, y, cardW, cardH);

    const qr = await qrToDataURL(et.qr_payload, { margin: 0, width: 200 });
    doc.addImage(qr, "PNG", x + 3, y + 3, 26, 26);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(et.codigo, x + 32, y + 8);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const linhas = doc.splitTextToSize(et.descricao, cardW - 34) as string[];
    doc.text(linhas.slice(0, 3), x + 32, y + 13);
    doc.text(`${et.largura_mm}×${et.comprimento_mm}mm`, x + 32, y + 30);
    doc.text(`Chapa ${et.chapa}${et.rotacionada ? " · rot." : ""}`, x + 32, y + 34);
  }
  return doc;
}

export interface BaixarTudoInput {
  chapas: ChapaAlocada[];
  projetoId: string;
  numeroOrcamento: string;
  /** HTML do contrato (já pronto pra impressão); se ausente, não entra no zip. */
  contratoHtml?: string;
}

/** Gera o pacote completo de produção e devolve o .zip pronto pra download. */
export async function gerarPacoteCompleto(input: BaixarTudoInput): Promise<Blob> {
  const plano = montarPlano(input.chapas);
  const { exportacoes } = gerarExportacoes(plano, input.projetoId);

  const zip = new JSZip();
  zip.file("lista-corte.csv", "﻿" + exportacoes.csv_operador);
  zip.file("plano-corte.dxf", exportacoes.dxf_corte);
  zip.file(
    "lista-corte.pdf",
    pdfListaCorte(plano, `Lista de corte — Orçamento ${input.numeroOrcamento}`).output(
      "arraybuffer",
    ),
  );
  if (exportacoes.etiquetas.length) {
    const doc = await pdfEtiquetas(exportacoes.etiquetas);
    zip.file("etiquetas.pdf", doc.output("arraybuffer"));
  }
  if (input.contratoHtml) zip.file("contrato.html", input.contratoHtml);

  return zip.generateAsync({ type: "blob" });
}
