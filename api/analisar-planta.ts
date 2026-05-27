import type { VercelRequest, VercelResponse } from "@vercel/node";

function detectMime(b64: string): string {
  if (b64.startsWith("/9j")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

const SYSTEM = `Você é especialista em leitura de plantas baixas residenciais e comerciais brasileiras.
Analise a planta baixa e extraia as dimensões de CADA parede do ambiente, incluindo obstáculos como vigas, janelas, portas e colunas.

RETORNE APENAS JSON válido (sem markdown):
{
  "paredes": [
    {
      "id": "A",
      "descricao": "Parede principal (entrada)",
      "largura_cm": 400,
      "espaco_util_cm": 320,
      "obstaculos": "porta de entrada 80cm"
    },
    {
      "id": "B",
      "descricao": "Parede lateral direita",
      "largura_cm": 350,
      "espaco_util_cm": 300,
      "obstaculos": "viga de concreto 50cm no início"
    }
  ],
  "largura_cm": 400,
  "profundidade_cm": 350,
  "altura_cm": 270,
  "observacoes": "Ambiente retangular. Viga de 50cm na parede B reduz o espaço útil."
}

REGRAS:
- Nomeie as paredes A, B, C, D no sentido horário a partir da parede principal
- "espaco_util_cm" = largura_cm menos todos os obstáculos fixos (vigas, colunas, nichos)
  ATENÇÃO: portas e janelas NÃO reduzem o espaço útil para móveis pois o móvel pode ir ao lado
  Apenas vigas, colunas e elementos fixos que saem da parede reduzem o espaço útil
- Se não houver obstáculos fixos, espaco_util_cm = largura_cm
- "altura_cm" = pé-direito do ambiente. Se não especificado na planta, use 270cm como padrão
- Converta TODAS as medidas para centímetros
- Se a escala não estiver clara, estime pelas proporções visuais`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { planta_b64, ambiente } = req.body as { planta_b64: string; ambiente?: string };
  if (!planta_b64) return res.status(400).json({ error: "Imagem da planta não fornecida" });

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY não configurada" });

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analise esta planta baixa${ambiente ? ` do ambiente: ${ambiente}` : ""}. Extraia as dimensões de cada parede, o espaço útil disponível e todos os obstáculos.`,
              },
              {
                type: "image_url",
                image_url: { url: `data:${detectMime(planta_b64)};base64,${planta_b64}`, detail: "high" },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!r.ok) throw new Error(await r.text());
    const d = await r.json() as { choices: { message: { content: string } }[] };
    return res.json(JSON.parse(d.choices[0].message.content));
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erro ao analisar planta" });
  }
}
