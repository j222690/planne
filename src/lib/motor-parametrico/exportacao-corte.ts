/**
 * PLANNE — Motor Paramétrico
 * Fase 8: Plano de Corte — Exportações para Produção
 *
 * Transforma um PlanoNesting nos artefatos que a fábrica usa:
 *   - CSV do operador (lista de corte por chapa, com posições)
 *   - DXF de corte (layout das chapas para CNC com controle automático)
 *   - Etiquetas por peça com payload de QR Code
 *
 * Funções puras: o backend produz os dados; o frontend renderiza o QR/PDF.
 */

import type { PlanoNesting, ChapaAlocada, PecaAlocada } from "./tipos";

// ─── CSV DO OPERADOR ──────────────────────────────────────────────────────────

/**
 * Gera o CSV de corte para o operador imprimir.
 * Uma linha por peça, agrupada por chapa, com posição e rotação.
 */
export function gerarCSVCorte(plano: PlanoNesting): string {
  const sep = ";";
  const cabecalho = [
    "chapa", "material", "peca", "largura_mm", "comprimento_mm",
    "x_mm", "y_mm", "rotacionada", "etiqueta",
  ].join(sep);

  const linhas: string[] = [cabecalho];

  for (const chapa of plano.chapas) {
    for (const p of chapa.pecas_alocadas) {
      linhas.push([
        chapa.numero_sequencial,
        escaparCSV(chapa.material.nome_display),
        escaparCSV(p.peca_id),
        p.largura_mm,
        p.comprimento_mm,
        p.x_mm,
        p.y_mm,
        p.rotacionada ? "SIM" : "NAO",
        escaparCSV(p.etiqueta),
      ].join(sep));
    }
  }

  // Resumo no rodapé
  linhas.push("");
  linhas.push(`# Total de chapas${sep}${plano.resumo.total_chapas}`);
  linhas.push(`# Total de peças${sep}${plano.resumo.total_pecas}`);
  linhas.push(`# Desperdício${sep}${plano.resumo.desperdicio_pct}%`);
  linhas.push(`# Metros de fita${sep}${plano.resumo.metros_fita_total}`);

  return linhas.join("\n");
}

function escaparCSV(valor: string): string {
  if (/[;"\n]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
  return valor;
}

// ─── DXF DE CORTE ─────────────────────────────────────────────────────────────

/**
 * Gera um DXF com o layout de todas as chapas para CNC.
 * Cada peça é um retângulo (LWPOLYLINE) no layer da chapa.
 * As chapas são dispostas lado a lado no eixo X com espaçamento.
 */
export function gerarDXFCorte(plano: PlanoNesting): string {
  const L: string[] = [];
  const push = (codigo: number, valor: string | number) => {
    L.push(String(codigo));
    L.push(String(valor));
  };

  // Cabeçalho mínimo com unidade em mm
  push(0, "SECTION");
  push(2, "HEADER");
  push(9, "$INSUNITS");
  push(70, 4); // mm
  push(0, "ENDSEC");

  push(0, "SECTION");
  push(2, "ENTITIES");

  let offsetX = 0;
  const espacoEntreChapas = 200; // mm

  for (const chapa of plano.chapas) {
    const layer = `CHAPA_${chapa.numero_sequencial}`;

    // Contorno da chapa
    retangulo(push, layer, offsetX, 0, chapa.largura_mm, chapa.comprimento_mm);

    // Peças
    for (const p of chapa.pecas_alocadas) {
      const w = p.rotacionada ? p.comprimento_mm : p.largura_mm;
      const h = p.rotacionada ? p.largura_mm : p.comprimento_mm;
      retangulo(push, layer, offsetX + p.x_mm, p.y_mm, w, h);
      // Texto com etiqueta no centro da peça
      texto(push, layer, offsetX + p.x_mm + w / 2, p.y_mm + h / 2, p.etiqueta);
    }

    offsetX += chapa.largura_mm + espacoEntreChapas;
  }

  push(0, "ENDSEC");
  push(0, "EOF");

  return L.join("\r\n");
}

function retangulo(
  push: (c: number, v: string | number) => void,
  layer: string,
  x: number, y: number, w: number, h: number,
): void {
  push(0, "LWPOLYLINE");
  push(8, layer);
  push(90, 4);      // 4 vértices
  push(70, 1);      // fechada
  push(10, x); push(20, y);
  push(10, x + w); push(20, y);
  push(10, x + w); push(20, y + h);
  push(10, x); push(20, y + h);
}

function texto(
  push: (c: number, v: string | number) => void,
  layer: string,
  x: number, y: number, conteudo: string,
): void {
  push(0, "TEXT");
  push(8, layer);
  push(10, Math.round(x)); push(20, Math.round(y));
  push(40, 20); // altura do texto
  push(1, conteudo);
}

// ─── ETIQUETAS COM QR ─────────────────────────────────────────────────────────

export interface EtiquetaPeca {
  /** Código curto e legível (ex.: C1-P03 = chapa 1, peça 3). */
  codigo: string;
  chapa: number;
  peca_id: string;
  descricao: string;
  largura_mm: number;
  comprimento_mm: number;
  rotacionada: boolean;
  /** Payload do QR Code (string que o frontend renderiza como QR). */
  qr_payload: string;
}

/**
 * Gera as etiquetas de produção de todas as peças, com payload de QR Code.
 * O QR contém um JSON compacto para rastreabilidade no chão de fábrica.
 */
export function gerarEtiquetas(plano: PlanoNesting, projetoId = ""): EtiquetaPeca[] {
  const etiquetas: EtiquetaPeca[] = [];

  for (const chapa of plano.chapas) {
    chapa.pecas_alocadas.forEach((p, idx) => {
      const codigo = `C${chapa.numero_sequencial}-P${String(idx + 1).padStart(2, "0")}`;
      const qr = {
        v: 1,
        proj: projetoId,
        cod: codigo,
        ch: chapa.numero_sequencial,
        pid: p.peca_id,
        dim: `${p.largura_mm}x${p.comprimento_mm}`,
        rot: p.rotacionada ? 1 : 0,
      };
      etiquetas.push({
        codigo,
        chapa: chapa.numero_sequencial,
        peca_id: p.peca_id,
        descricao: p.etiqueta,
        largura_mm: p.largura_mm,
        comprimento_mm: p.comprimento_mm,
        rotacionada: p.rotacionada,
        qr_payload: JSON.stringify(qr),
      });
    });
  }

  return etiquetas;
}

// ─── PACOTE COMPLETO ──────────────────────────────────────────────────────────

export interface ExportacoesCorte {
  csv_operador: string;
  dxf_corte: string;
  etiquetas: EtiquetaPeca[];
}

/**
 * Gera todas as exportações de corte de uma vez e devolve o plano com o CSV
 * já embutido no campo `exportacoes.csv_operador`.
 */
export function gerarExportacoes(plano: PlanoNesting, projetoId = ""): {
  plano: PlanoNesting;
  exportacoes: ExportacoesCorte;
} {
  const csv = gerarCSVCorte(plano);
  const dxf = gerarDXFCorte(plano);
  const etiquetas = gerarEtiquetas(plano, projetoId);

  const planoComCsv: PlanoNesting = {
    ...plano,
    exportacoes: { ...plano.exportacoes, csv_operador: csv },
  };

  return {
    plano: planoComCsv,
    exportacoes: { csv_operador: csv, dxf_corte: dxf, etiquetas },
  };
}
