import type { VercelRequest, VercelResponse } from "@vercel/node";

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
    "chapas_estimadas": 0,
    "metros_fita": 0
  }
}

CHAPAS: calcule quantas chapas 2750×1830mm são necessárias (estimativa 70% aproveitamento por material).
METROS DE FITA: some todos os lados marcados × dimensão correspondente em metros.`;

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
  // legacy
  mdf_id?: string;
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
    return res.json(JSON.parse(data.choices[0].message.content));
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erro interno" });
  }
}
