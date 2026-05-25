import type { VercelRequest, VercelResponse } from "@vercel/node";

function buildPrompt(ambiente: string, estilo: string, moveis: string[], descricao: string): string {
  const moveisList = moveis.slice(0, 6).join(", ");
  return `Professional interior design photograph, ${ambiente} room, ${estilo} style, featuring ${moveisList}. Brazilian luxury home interior, photorealistic rendering, 8K ultra-detailed, cinematic lighting, warm natural light, premium materials, clean composition, architectural visualization, ${descricao}. Shot with wide angle lens, depth of field, no people.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { ambiente, estilo, moveis_nomes, descricao } = req.body as {
    ambiente: string;
    estilo: string;
    moveis_nomes: string[];
    descricao: string;
  };

  const fluxKey = process.env.FLUX_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!fluxKey && !openaiKey) {
    return res.status(500).json({ error: "Nenhuma API de render configurada (FLUX_API_KEY ou OPENAI_API_KEY)" });
  }

  const prompt = buildPrompt(ambiente ?? "sala de estar", estilo ?? "moderno", moveis_nomes ?? [], descricao ?? "");

  // Flux Pro 1.1 (async — returns job_id to poll)
  if (fluxKey) {
    try {
      const response = await fetch("https://api.bfl.ml/v1/flux-pro-1.1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Key": fluxKey,
        },
        body: JSON.stringify({
          prompt,
          width: 1440,
          height: 960,
          steps: 40,
          guidance: 3.5,
          output_format: "jpeg",
          safety_tolerance: 2,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as { id: string };
        return res.json({ provider: "flux", job_id: data.id, status: "processing", prompt });
      }
    } catch {
      // fall through to DALL-E
    }
  }

  // DALL-E 3 fallback (synchronous)
  if (openaiKey) {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt.slice(0, 4000),
        n: 1,
        size: "1792x1024",
        quality: "hd",
        style: "natural",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: `DALL-E: ${err.slice(0, 300)}` });
    }

    const data = (await response.json()) as { data: { url: string; revised_prompt: string }[] };
    return res.json({
      provider: "dalle3",
      status: "completed",
      url: data.data[0].url,
      revised_prompt: data.data[0].revised_prompt,
    });
  }

  return res.status(500).json({ error: "Nenhuma API disponível" });
}
