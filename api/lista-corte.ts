import type { VercelRequest, VercelResponse } from "@vercel/node";
import { gerarListaCorte } from "./_calc";
import type { MovelInput, PecaCorte } from "./_calc";

// ── Chapa padrão ─────────────────────────────────────────────────────────────
const SHEET_W = 2750; // mm
const SHEET_H = 1830; // mm

// Materiais que NÃO são chapas MDF/MDP — excluir do bin packing
const NAO_CHAPA = /madeira\s*maci|vidro|espelho/i;

// ── Bin packing 2D (Guillotine — Best Area Fit) ──────────────────────────────

interface FreeRect { x: number; y: number; w: number; h: number };

function guillotineSplit(free: FreeRect, pw: number, ph: number): FreeRect[] {
  const result: FreeRect[] = [];
  // Rightover strip (same height as placed piece)
  if (free.w - pw > 5) result.push({ x: free.x + pw, y: free.y, w: free.w - pw, h: ph });
  // Bottom strip (full width)
  if (free.h - ph > 5) result.push({ x: free.x, y: free.y + ph, w: free.w, h: free.h - ph });
  return result;
}

interface PlacedPiece { x: number; y: number; w: number; h: number; label: string }

interface ChapaMaterial {
  material: string;
  chapas_otimizadas: number;
  chapas_com_folga: number;
  layouts: { sheet_index: number; placed: PlacedPiece[] }[];
}

// Peça que não cabe na chapa padrão em nenhuma orientação — precisa de emenda,
// chapa especial ou revisão do projeto. NÃO pode ser descartada em silêncio.
interface PecaInvalida {
  peca: string;
  material: string;
  largura_mm: number;
  comprimento_mm: number;
  motivo: string;
}

function calcularChapas(pecas: PecaCorte[]): { materiais: ChapaMaterial[]; invalidas: PecaInvalida[] } {
  const byMat = new Map<string, { w: number; h: number; label: string }[]>();
  const invalidas: PecaInvalida[] = [];
  for (const p of pecas) {
    if (!p.largura_mm || !p.comprimento_mm || !p.quantidade) continue;
    if (NAO_CHAPA.test(p.material)) continue;
    const list = byMat.get(p.material) ?? [];
    const label = `${p.peca ?? ""}${p.movel ? ` (${p.movel})` : ""}`;
    for (let i = 0; i < p.quantidade; i++) {
      list.push({ w: p.largura_mm, h: p.comprimento_mm, label });
    }
    byMat.set(p.material, list);
  }

  const results: ChapaMaterial[] = [];

  for (const [material, pieces] of byMat) {
    pieces.sort((a, b) => b.w * b.h - a.w * a.h);

    const sheets: FreeRect[][] = [];
    const sheetLayouts: PlacedPiece[][] = [];

    for (const piece of pieces) {
      const orientations: [number, number][] = [];
      if (piece.w <= SHEET_W && piece.h <= SHEET_H) orientations.push([piece.w, piece.h]);
      if (piece.h <= SHEET_W && piece.w <= SHEET_H) orientations.push([piece.h, piece.w]);
      if (orientations.length === 0) {
        // Peça excede a chapa padrão (2750×1830) — registra em vez de descartar.
        invalidas.push({
          peca: piece.label,
          material,
          largura_mm: piece.w,
          comprimento_mm: piece.h,
          motivo: `Excede a chapa padrão ${SHEET_W}×${SHEET_H}mm em ambas as orientações`,
        });
        continue;
      }

      let placed = false;

      outerLoop: for (let si = 0; si < sheets.length; si++) {
        const freeRects = sheets[si];
        for (const [pw, ph] of orientations) {
          let bestIdx = -1;
          let bestWaste = Infinity;

          for (let i = 0; i < freeRects.length; i++) {
            const r = freeRects[i];
            if (pw <= r.w && ph <= r.h) {
              const waste = r.w * r.h - pw * ph;
              if (waste < bestWaste) { bestWaste = waste; bestIdx = i; }
            }
          }

          if (bestIdx >= 0) {
            const chosen = freeRects.splice(bestIdx, 1)[0];
            freeRects.push(...guillotineSplit(chosen, pw, ph));
            sheetLayouts[si].push({ x: chosen.x, y: chosen.y, w: pw, h: ph, label: piece.label });
            placed = true;
            break outerLoop;
          }
        }
      }

      if (!placed) {
        const [pw, ph] = orientations[0];
        sheets.push(guillotineSplit({ x: 0, y: 0, w: SHEET_W, h: SHEET_H }, pw, ph));
        sheetLayouts.push([{ x: 0, y: 0, w: pw, h: ph, label: piece.label }]);
      }
    }

    const raw = sheets.length;
    const comFolga = raw + Math.max(1, Math.ceil(raw * 0.15));

    results.push({
      material,
      chapas_otimizadas: raw,
      chapas_com_folga: comFolga,
      layouts: sheetLayouts.map((placed, i) => ({ sheet_index: i, placed })),
    });
  }

  return { materiais: results, invalidas };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { moveis } = req.body as { moveis: MovelInput[] };
  if (!moveis?.length) return res.status(400).json({ error: "moveis é obrigatório" });

  try {
    const resultado = gerarListaCorte(moveis);

    const { materiais: chapas, invalidas } = calcularChapas(resultado.pecas);
    const totalChapas = chapas.reduce((s, c) => s + c.chapas_com_folga, 0);

    return res.json({
      ...resultado,
      pecas_invalidas: invalidas,
      resumo: {
        ...resultado.resumo,
        chapas_estimadas: totalChapas,
        chapas_por_material: chapas,
        pecas_invalidas_count: invalidas.length,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erro interno" });
  }
}
