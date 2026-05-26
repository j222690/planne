import type { VercelRequest, VercelResponse } from "@vercel/node";

// Dado um móvel com dimensões, gera as peças de corte via GPT-4o-mini (barato e rápido)

const SYSTEM = `Você é especialista em marcenaria planejada brasileira.
Dado um móvel com dimensões, retorne a lista de peças de corte em MDF.

RESPONDA APENAS com JSON válido:

{
  "pecas": [
    {
      "movel": "nome do móvel",
      "peca": "Lateral Esquerda",
      "material": "MDF 18mm",
      "largura_mm": 550,
      "comprimento_mm": 2200,
      "quantidade": 2,
      "fita_l": true,
      "fita_r": false,
      "fita_t": true,
      "fita_b": true,
      "observacao": ""
    }
  ],
  "resumo": {
    "total_pecas": 0,
    "chapas_estimadas": 0,
    "metros_fita": 0
  }
}

REGRAS:
- Espessura padrão: 18mm para estrutura, 6mm para fundos
- Fita de borda: marcar lados expostos (visíveis ao cliente)
- fita_l/r/t/b = esquerda/direita/topo/base
- largura_mm e comprimento_mm já descontam a espessura do painel (18mm por lado)
- Chapas: calcule quantas chapas 2750×1830mm são necessárias (estimativa de 70% aproveitamento)
- Fita: some os lados com fita × comprimento, em metros lineares`;

interface MovelInput {
  nome: string;
  categoria: string;
  largura_cm: number;
  profundidade_cm: number;
  altura_cm: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { moveis } = req.body as { moveis: MovelInput[] };
  if (!moveis?.length) return res.status(400).json({ error: "moveis é obrigatório" });

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY não configurada" });

  const moveisList = moveis
    .map((m) => `- ${m.nome} (${m.largura_cm}×${m.profundidade_cm}×${m.altura_cm}cm) — categoria: ${m.categoria}`)
    .join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Gere a lista de corte para estes móveis:\n${moveisList}`,
          },
        ],
        max_tokens: 4000,
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: `OpenAI: ${err.slice(0, 300)}` });
    }

    const data = (await response.json()) as { choices: { message: { content: string } }[] };
    const result = JSON.parse(data.choices[0].message.content);
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erro interno" });
  }
}
