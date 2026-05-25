import type { VercelRequest, VercelResponse } from "@vercel/node";

const SYSTEM = `Você é especialista em orçamentos de marcenaria planejada brasileira.
Analise o documento de orçamento/proposta na imagem e extraia todos os itens.
RESPONDA APENAS com JSON válido (sem markdown):
{
  "itens": [
    {
      "descricao": "nome do item/móvel",
      "quantidade": 1,
      "unidade": "un",
      "preco_custo": 0,
      "preco_unitario": 0
    }
  ],
  "margem_detectada": 35,
  "observacoes": "condições comerciais detectadas",
  "total_detectado": 0
}
Use os preços do documento como preco_unitario. Se não houver custo, calcule como 65% do preço (margem 35%).
Unidades comuns: un, chapa, metro, par, kit, cj.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { pdf_b64, tipo_mime } = req.body as { pdf_b64: string; tipo_mime?: string };
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY não configurada" });
  if (!pdf_b64) return res.status(400).json({ error: "pdf_b64 obrigatório" });

  const mime = tipo_mime ?? "image/jpeg";
  const dataUrl = `data:${mime};base64,${pdf_b64}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: "Extraia todos os itens deste orçamento/proposta de marcenaria:" },
              { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
            ],
          },
        ],
        max_tokens: 3000,
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: `OpenAI: ${err.slice(0, 300)}` });
    }

    const data = (await response.json()) as { choices: { message: { content: string } }[] };
    const extracted = JSON.parse(data.choices[0].message.content);
    return res.json(extracted);
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erro" });
  }
}
