import type { VercelRequest, VercelResponse } from "@vercel/node";

function detectMime(b64: string): string {
  if (b64.startsWith("/9j")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

const SYSTEM = `Você é especialista em leitura de plantas baixas residenciais e comerciais brasileiras.
Analise a planta baixa e extraia com precisão as dimensões do ambiente e a posição exata de cada porta e janela.

RETORNE APENAS JSON válido (sem markdown):
{
  "largura_cm": 400,
  "profundidade_cm": 350,
  "altura_cm": 270,
  "porta_principal": {
    "parede": "bottom",
    "x_pct": 0.15,
    "largura_cm": 90
  },
  "portas_secundarias": [
    {
      "parede": "left",
      "x_pct": 0.6,
      "largura_cm": 80,
      "descricao": "porta do banheiro"
    }
  ],
  "janelas": [
    {
      "parede": "top",
      "x_pct": 0.25,
      "largura_cm": 120,
      "descricao": "janela principal"
    }
  ],
  "paredes": [
    {
      "id": "A",
      "lado": "bottom",
      "descricao": "Parede de entrada",
      "largura_cm": 400,
      "espaco_util_cm": 310,
      "obstaculos": "porta de entrada 90cm"
    }
  ],
  "observacoes": "Ambiente retangular com boa iluminação natural."
}

REGRAS CRÍTICAS:
- "parede" usa os valores: "top" (fundo/fundos), "bottom" (frente/entrada), "left" (esquerda), "right" (direita) — vista de cima, como planta baixa
- "x_pct" = posição do CENTRO do elemento ao longo da parede, de 0.0 (início) a 1.0 (fim)
- "largura_cm" = largura do vão (porta ou janela) em centímetros
- "altura_cm" = pé-direito do ambiente. Se não estiver claro na planta, use 270cm
- Identifique a parede de entrada como "bottom", a parede de fundo como "top"
- "espaco_util_cm" = largura_cm menos vigas, colunas e elementos fixos que saem da parede. Portas e janelas NÃO reduzem espaco_util_cm pois o móvel pode ir ao lado
- Se a escala não estiver clara, estime pelas proporções visuais e cotas desenhadas
- Nomeie as paredes A, B, C, D no sentido horário a partir da parede de entrada (bottom)`;

export interface PlantaAnalisada {
  nome: string;
  largura_cm: number;
  profundidade_cm: number;
  altura_cm: number;
  porta_principal: { parede: string; x_pct: number; largura_cm: number };
  portas_secundarias: { parede: string; x_pct: number; largura_cm: number; descricao?: string }[];
  janelas: { parede: string; x_pct: number; largura_cm: number; descricao?: string }[];
  paredes: { id: string; lado: string; descricao: string; largura_cm: number; espaco_util_cm: number; obstaculos: string }[];
  observacoes: string;
  imagem_b64?: string;
  analisado_em: string;
}

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
                text: `Analise esta planta baixa${ambiente ? ` do ambiente: ${ambiente}` : ""}. Extraia com precisão: dimensões do ambiente, posição e tamanho de cada porta e janela (em qual parede e em que ponto x_pct ao longo da parede), e espaço útil de cada parede.`,
              },
              {
                type: "image_url",
                image_url: { url: `data:${detectMime(planta_b64)};base64,${planta_b64}`, detail: "high" },
              },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!r.ok) throw new Error(await r.text());
    const d = await r.json() as { choices: { message: { content: string } }[] };
    const result = JSON.parse(d.choices[0].message.content) as PlantaAnalisada;
    result.analisado_em = new Date().toISOString();
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erro ao analisar planta" });
  }
}
