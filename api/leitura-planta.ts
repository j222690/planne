/**
 * PLANNE — Motor Paramétrico V1
 * Fase 7: Endpoint de Leitura de Plantas
 *
 * POST /api/leitura-planta
 *
 * Interpreta uma planta em DXF (determinístico), imagem/PDF (IA Vision) ou
 * medidas manuais, e devolve sempre um AmbienteGeometrico do núcleo, pronto
 * para o motor de layout.
 *
 * Para imagem/PDF, delega à OpenAI Vision (mesma lógica de analisar-planta.ts)
 * e converte o resultado via interpretarPlanta(formato="imagem").
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  interpretarPlanta,
  type FormatoPlanta,
  type PlantaAnalisadaIA,
} from "../src/lib/motor-parametrico/interpretar-planta";
import type { ParedeId } from "../src/lib/motor-parametrico/tipos";

interface RequestBody {
  formato: FormatoPlanta;
  /** DXF: conteúdo de texto do arquivo. */
  dxf_texto?: string;
  /** Imagem/PDF: base64 da planta (será enviado à IA Vision). */
  planta_b64?: string;
  /** Manual: medidas digitadas. */
  medidas?: {
    largura_cm: number;
    profundidade_cm: number;
    altura_cm: number;
    porta_parede?: ParedeId;
    janelas_paredes?: ParedeId[];
  };
  altura_padrao_cm?: number;
  ambiente_descricao?: string;
}

function detectMime(b64: string): string {
  if (b64.startsWith("/9j")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

const SYSTEM_VISION = `Você é especialista em leitura de plantas baixas residenciais brasileiras.
Extraia com precisão as dimensões do ambiente e a posição de cada porta e janela.
RETORNE APENAS JSON válido (sem markdown):
{
  "largura_cm": 400,
  "profundidade_cm": 350,
  "altura_cm": 270,
  "porta_principal": { "parede": "bottom", "x_pct": 0.15, "largura_cm": 90 },
  "portas_secundarias": [],
  "janelas": [{ "parede": "top", "x_pct": 0.3, "largura_cm": 120 }]
}
REGRAS:
- "parede": top (fundo), bottom (entrada), left, right — vista de cima
- "x_pct": posição do centro do elemento ao longo da parede, 0.0 a 1.0
- "altura_cm": pé-direito; se não estiver claro, use 270`;

async function analisarComIA(planta_b64: string, descricao?: string): Promise<PlantaAnalisadaIA> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error("OPENAI_API_KEY não configurada");

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_VISION },
        {
          role: "user",
          content: [
            { type: "text", text: `Analise esta planta baixa${descricao ? ` (${descricao})` : ""}. Extraia dimensões e posições de portas e janelas.` },
            { type: "image_url", image_url: { url: `data:${detectMime(planta_b64)};base64,${planta_b64}`, detail: "high" } },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });

  if (!r.ok) throw new Error(`OpenAI Vision: ${(await r.text()).slice(0, 300)}`);
  const d = (await r.json()) as { choices: { message: { content: string } }[] };
  return JSON.parse(d.choices[0].message.content) as PlantaAnalisadaIA;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const body = req.body as RequestBody;
  if (!body.formato) {
    return res.status(400).json({ error: "Campo 'formato' obrigatório (dxf | imagem | pdf | manual)." });
  }

  try {
    const inicio = Date.now();

    // Para imagem/PDF, primeiro chamamos a IA Vision e injetamos o resultado.
    let planta_ia: PlantaAnalisadaIA | undefined;
    if ((body.formato === "imagem" || body.formato === "pdf") && body.planta_b64) {
      planta_ia = await analisarComIA(body.planta_b64, body.ambiente_descricao);
    }

    const resultado = interpretarPlanta({
      formato: body.formato,
      dxf_texto: body.dxf_texto,
      planta_ia,
      medidas: body.medidas,
      altura_padrao_cm: body.altura_padrao_cm,
    });

    const ms = Date.now() - inicio;

    return res.json({
      ambiente: resultado.ambiente,
      formato: resultado.formato,
      confianca: resultado.confianca,
      deterministico: resultado.deterministico,
      diagnosticos: resultado.diagnosticos,
      resumo: {
        largura_cm: resultado.ambiente.dimensoes.largura_cm,
        profundidade_cm: resultado.ambiente.dimensoes.profundidade_cm,
        altura_cm: resultado.ambiente.dimensoes.altura_cm,
        area_m2: resultado.ambiente.dimensoes.area_m2,
        num_portas: Object.values(resultado.ambiente.paredes).reduce(
          (s, p) => s + p.aberturas.filter((a) => a._tipo === "porta").length, 0,
        ),
        num_janelas: Object.values(resultado.ambiente.paredes).reduce(
          (s, p) => s + p.aberturas.filter((a) => a._tipo === "janela").length, 0,
        ),
        tempo_ms: ms,
      },
    });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : "Erro interno na leitura da planta",
    });
  }
}
