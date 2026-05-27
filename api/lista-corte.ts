import type { VercelRequest, VercelResponse } from "@vercel/node";

// ── Chapa padrão ─────────────────────────────────────────────────────────────
const SHEET_W = 2750; // mm
const SHEET_H = 1830; // mm

// ── Bin packing 2D (Guillotine — Best Area Fit) ──────────────────────────────

interface FreeRect { x: number; y: number; w: number; h: number; }

function guillotineSplit(free: FreeRect, pw: number, ph: number): FreeRect[] {
  const result: FreeRect[] = [];
  // Rightover strip (same height as placed piece)
  if (free.w - pw > 5) result.push({ x: free.x + pw, y: free.y, w: free.w - pw, h: ph });
  // Bottom strip (full width)
  if (free.h - ph > 5) result.push({ x: free.x, y: free.y + ph, w: free.w, h: free.h - ph });
  return result;
}

interface PecaCorte {
  material: string;
  largura_mm: number;
  comprimento_mm: number;
  quantidade: number;
  [key: string]: unknown;
}

interface ChapaMaterial {
  material: string;
  chapas_otimizadas: number; // resultado real do bin packing
  chapas_com_folga: number;  // com buffer de segurança
}

function calcularChapas(pecas: PecaCorte[]): ChapaMaterial[] {
  // Agrupa instâncias individuais de peça por material
  const byMat = new Map<string, { w: number; h: number }[]>();
  for (const p of pecas) {
    if (!p.largura_mm || !p.comprimento_mm || !p.quantidade) continue;
    const list = byMat.get(p.material) ?? [];
    for (let i = 0; i < p.quantidade; i++) {
      list.push({ w: p.largura_mm, h: p.comprimento_mm });
    }
    byMat.set(p.material, list);
  }

  const results: ChapaMaterial[] = [];

  for (const [material, pieces] of byMat) {
    // Maior área primeiro → melhor aproveitamento
    pieces.sort((a, b) => b.w * b.h - a.w * a.h);

    // Cada entrada = lista de free rects de uma chapa
    const sheets: FreeRect[][] = [];

    for (const piece of pieces) {
      // Orientações possíveis (normal + rotacionada 90°)
      const orientations: [number, number][] = [];
      if (piece.w <= SHEET_W && piece.h <= SHEET_H) orientations.push([piece.w, piece.h]);
      if (piece.h <= SHEET_W && piece.w <= SHEET_H) orientations.push([piece.h, piece.w]);
      if (orientations.length === 0) continue; // peça maior que a chapa — ignora

      let placed = false;

      // Tenta encaixar numa chapa existente
      outer: for (const freeRects of sheets) {
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
            placed = true;
            break outer;
          }
        }
      }

      // Nenhuma chapa existente tem espaço — abre nova
      if (!placed) {
        const [pw, ph] = orientations[0];
        sheets.push(guillotineSplit({ x: 0, y: 0, w: SHEET_W, h: SHEET_H }, pw, ph));
      }
    }

    const raw = sheets.length;
    // Buffer de segurança: ao menos 1 chapa extra + 15% para pedidos grandes
    // Cobre falhas, cortes errados, furos errados e rejeites de qualidade
    const comFolga = raw + Math.max(1, Math.ceil(raw * 0.15));

    results.push({ material, chapas_otimizadas: raw, chapas_com_folga: comFolga });
  }

  return results;
}

// ── Prompt IA (gera apenas a lista de peças — chapas calculamos aqui) ─────────

const SYSTEM = `Você é especialista em marcenaria planejada brasileira e em otimização de corte de chapas MDF/MDP.
Dado um ou mais móveis configurados, gere a lista completa de peças de corte.

CONSTRUÇÃO DO MÓVEL (padrão marcenaria brasileira):
- CAIXA (interior): laterais, teto, base, divisórias, prateleiras → MDF 15mm da caixa (geralmente Branco TX)
- ENVELOPE (exterior / faces visíveis): portas, gavetas e laterais expostas ao cliente → MDF externo (cor do cliente)
- FUNDO: chapa MDF 6mm Branco TX (padrão — sempre usar mesmo quando não especificado, se tem_fundo = true)
- ENGROSSOS: faixa de MDF 5cm na borda frontal de cada painel vertical → reforça onde as portas batem
  - 1 engrosso por lateral (L e R), 1 no topo e 1 na base = 4 por corpo
  - Dimensão: 5cm × altura interna do corpo (altura_cm - espessura topo - espessura base)
  - Material: mesmo MDF da caixa, 15mm

DESCONTOS DE ESPESSURA (15mm por painel adjacente):
- Lateral: profundidade_cm × altura_cm (descontado pelo teto e base onde encaixada)
- Teto e base: largura_cm × profundidade_cm (teto desconta 2 laterais → largura - 30mm)
- Prateleiras: mesma largura interna (largura - 30mm) × profundidade - fundo (profundidade - 6mm se tem fundo)
- Portas de abrir: largura_cm ÷ num_portas por folha × altura_cm (sem descontos, sobreposição de 15mm)
- Gavetas: frente = largura interna ÷ num_gavetas × altura_gaveta (padrão 16cm)
  corpo da gaveta = fundo + laterais + traseira em MDF 15mm

FITA DE BORDA (fita_l/r/t/b = esquerdo/direito/topo/base da peça):
- Marcar apenas lados VISÍVEIS ao cliente após montagem
- Laterais internas: apenas frontal (fita_t = true se topo exposto)
- Portas e gavetas: todos os 4 lados
- Prateleiras: frontal (fita_t ou fita_b conforme orientação)

RESPONDA APENAS com JSON válido:
{
  "pecas": [
    {
      "movel": "nome exato do móvel",
      "peca": "Lateral Esquerda (caixa)",
      "material": "MDF 15mm Branco TX (caixa)",
      "largura_mm": 550,
      "comprimento_mm": 2200,
      "quantidade": 2,
      "fita_l": false,
      "fita_r": false,
      "fita_t": true,
      "fita_b": false,
      "observacao": ""
    }
  ],
  "resumo": {
    "total_pecas": 0,
    "metros_fita": 0
  }
}

METROS DE FITA: some todos os lados marcados × dimensão correspondente em metros.
NÃO calcule chapas — isso é feito pelo sistema automaticamente.`;

interface MovelInput {
  nome: string;
  tipo?: string;
  largura_cm: number;
  profundidade_cm: number;
  altura_cm: number;
  portas?: number;
  tipo_porta?: string;
  gavetas?: number;
  prateleiras?: number;
  tem_fundo?: boolean;
  mdf_caixa_id?: string;
  mdf_externo_id?: string;
  mdf_id?: string; // legacy
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { moveis } = req.body as { moveis: MovelInput[] };
  if (!moveis?.length) return res.status(400).json({ error: "moveis é obrigatório" });

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY não configurada" });

  const moveisList = moveis.map((m) => {
    const linhas = [
      `- ${m.nome} — ${m.largura_cm}×${m.profundidade_cm}×${m.altura_cm}cm`,
      `  Portas: ${m.portas ?? 0}${m.portas ? ` (${m.tipo_porta})` : ""} | Gavetas: ${m.gavetas ?? 0} | Prateleiras: ${m.prateleiras ?? 0}`,
      `  Fundo traseiro: ${(m.tem_fundo ?? true) ? "SIM" : "NÃO"}`,
      `  MDF caixa (interior): ${m.mdf_caixa_id ? `ID ${m.mdf_caixa_id}` : "Branco TX padrão"}`,
      `  MDF envelope (faces externas/portas): ${m.mdf_externo_id ? `ID ${m.mdf_externo_id}` : "mesmo da caixa"}`,
    ];
    return linhas.join("\n");
  }).join("\n\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Gere a lista completa de corte para estes móveis, incluindo caixa, envelope, engrossos e fundo:\n\n${moveisList}` },
        ],
        max_tokens: 6000,
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: `OpenAI: ${err.slice(0, 300)}` });
    }

    const data = (await response.json()) as { choices: { message: { content: string } }[] };
    const resultado = JSON.parse(data.choices[0].message.content) as {
      pecas: PecaCorte[];
      resumo: { total_pecas: number; metros_fita: number };
    };

    // Bin packing real por material com buffer de segurança
    const chapas = calcularChapas(resultado.pecas ?? []);
    const totalChapas = chapas.reduce((s, c) => s + c.chapas_com_folga, 0);

    return res.json({
      ...resultado,
      resumo: {
        ...resultado.resumo,
        chapas_estimadas: totalChapas,
        chapas_por_material: chapas,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erro interno" });
  }
}
