/**
 * PLANNE — Exportação XLSX (lista de peças + orçamento)
 *
 * Client-only: gera a planilha no navegador a partir do resultado já
 * carregado do motor paramétrico. Não faz parte do motor-parametrico/ nem
 * é importado por api/motor.js — mantém o bundle serverless intocado.
 */

import ExcelJS from "exceljs";

export interface PecaXLS {
  chapa: number;
  material: string;
  peca_id: string;
  largura_mm: number;
  comprimento_mm: number;
  rotacionada: boolean;
  etiqueta: string;
}

export interface ItemOrcamentoXLS {
  descricao: string;
  quantidade: number;
  preco_custo: number;
  preco_unitario: number;
  total: number;
}

export interface DadosProjetoXLS {
  nomeProjeto: string;
  versaoOrcamento: string;
  pecas: PecaXLS[];
  itensOrcamento: ItemOrcamentoXLS[];
  resumoCorte: {
    totalChapas: number;
    totalPecas: number;
    desperdicioPct: number;
    metrosFita: number;
  };
}

const COR_CABECALHO = "FF1F2937";
const FONTE_CABECALHO = { bold: true, color: { argb: "FFFFFFFF" } } as const;

function estilizarCabecalho(row: ExcelJS.Row) {
  row.font = FONTE_CABECALHO;
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_CABECALHO } };
  });
}

export async function gerarXLSXProjeto(dados: DadosProjetoXLS): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Planne";
  wb.created = new Date();

  // ─── Lista de peças ─────────────────────────────────────────────────────
  const shPecas = wb.addWorksheet("Lista de Peças");
  shPecas.columns = [
    { header: "Chapa", key: "chapa", width: 8 },
    { header: "Material", key: "material", width: 22 },
    { header: "Peça", key: "peca_id", width: 24 },
    { header: "Largura (mm)", key: "largura_mm", width: 14 },
    { header: "Comprimento (mm)", key: "comprimento_mm", width: 16 },
    { header: "Rotacionada", key: "rotacionada", width: 12 },
    { header: "Etiqueta", key: "etiqueta", width: 40 },
  ];
  estilizarCabecalho(shPecas.getRow(1));
  for (const p of dados.pecas) {
    shPecas.addRow({
      chapa: p.chapa,
      material: p.material,
      peca_id: p.peca_id,
      largura_mm: p.largura_mm,
      comprimento_mm: p.comprimento_mm,
      rotacionada: p.rotacionada ? "SIM" : "NÃO",
      etiqueta: p.etiqueta,
    });
  }
  shPecas.autoFilter = { from: "A1", to: "G1" };
  shPecas.views = [{ state: "frozen", ySplit: 1 }];

  // ─── Orçamento ───────────────────────────────────────────────────────────
  const shOrc = wb.addWorksheet("Orçamento");
  shOrc.columns = [
    { header: "Descrição", key: "descricao", width: 42 },
    { header: "Qtd", key: "quantidade", width: 8 },
    { header: "Custo Unit.", key: "preco_custo", width: 14 },
    { header: "Preço Unit.", key: "preco_unitario", width: 14 },
    { header: "Total", key: "total", width: 14 },
  ];
  estilizarCabecalho(shOrc.getRow(1));
  for (const it of dados.itensOrcamento) shOrc.addRow(it);
  for (const col of ["preco_custo", "preco_unitario", "total"] as const) {
    shOrc.getColumn(col).numFmt = '"R$" #,##0.00';
  }
  shOrc.views = [{ state: "frozen", ySplit: 1 }];

  // ─── Resumo ──────────────────────────────────────────────────────────────
  const shResumo = wb.addWorksheet("Resumo");
  shResumo.columns = [
    { key: "campo", width: 24 },
    { key: "valor", width: 30 },
  ];
  shResumo.addRows([
    ["Projeto", dados.nomeProjeto],
    ["Versão do orçamento", dados.versaoOrcamento],
    ["Total de chapas", dados.resumoCorte.totalChapas],
    ["Total de peças", dados.resumoCorte.totalPecas],
    ["Desperdício (%)", dados.resumoCorte.desperdicioPct],
    ["Metros de fita de borda", dados.resumoCorte.metrosFita],
    ["Gerado em", new Date().toLocaleString("pt-BR")],
  ]);
  shResumo.getColumn("campo").font = { bold: true };

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
