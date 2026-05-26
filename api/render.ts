import type { VercelRequest, VercelResponse } from "@vercel/node";

// ─── Visual context ────────────────────────────────────────────────────────────

interface MovelInput {
  nome: string;
  categoria: string;
  cor_hex?: string;
  largura_cm?: number;
  profundidade_cm?: number;
  altura_cm?: number;
}

function hexToVisual(hex?: string): string {
  if (!hex) return "";
  const h = hex.toLowerCase();
  if (h === "#ffffff" || h === "#fafafa" || h === "#f5f5f2") return "white";
  if (h === "#f2ede8" || h === "#f0ebe0") return "off-white";
  if (h === "#2c2c2c" || h === "#1a1a1a") return "matte black";
  if (h.startsWith("#8") || h.startsWith("#7") || h.startsWith("#6") || h.startsWith("#5")) {
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    if (r > g && r > b) return "warm brown wood";
    if (g > r && g > b) return "natural green";
    return "dark charcoal";
  }
  if (h.startsWith("#c") || h.startsWith("#d") || h.startsWith("#e")) {
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    if (r > g + 20 && r > b + 20) return "warm beige";
    if (Math.abs(r - g) < 15 && Math.abs(g - b) < 15) return "light gray";
    if (r > 180 && g > 150 && b < 120) return "warm oak";
    return "light neutral";
  }
  return "neutral";
}

function generateVisualContext(m: MovelInput): string {
  const color = hexToVisual(m.cor_hex);
  const cat = m.categoria?.toLowerCase() ?? "";
  const dim = m.largura_cm ? `${m.largura_cm}×${m.profundidade_cm}×${m.altura_cm}cm` : "";

  const catMap: Record<string, string> = {
    armario: "wardrobe cabinet",
    bancada: "countertop cabinet",
    mesa: "table",
    rack: "TV unit media console",
    estante: "open shelving unit",
    cama: "bed frame",
    escritorio: "desk workstation",
    sofa: "sofa",
    outro: "furniture piece",
  };

  const piece = catMap[cat] ?? "cabinet";
  const colorDesc = color ? `${color} finish` : "";
  const sizeDesc = dim ? `(${dim})` : "";

  return [colorDesc, piece, sizeDesc].filter(Boolean).join(" ");
}

// ─── Prompt builder ────────────────────────────────────────────────────────────

interface RenderInput {
  ambiente: string;
  estilo: string;
  estilo_detectado?: string;
  moveis: MovelInput[];
  descricao: string;
  descricao_comercial?: string;
}

function buildRenderPrompt(input: RenderInput): string {
  const { ambiente, estilo, moveis, descricao } = input;

  const styleMap: Record<string, string> = {
    "Moderno Minimalista": "modern minimalist, clean lines, simple geometry, functional",
    "Contemporâneo": "contemporary, sleek, sophisticated",
    "Clássico": "classic elegant, traditional, ornate details",
    "Industrial": "industrial loft, raw materials, exposed metal, concrete",
    "Escandinavo": "Scandinavian, warm wood tones, cozy hygge, functional",
    "Boho Chic": "bohemian eclectic, warm textures, layered decor",
    "Rústico": "rustic farmhouse, natural wood, warm earthy tones",
    "Luxo": "luxury high-end, premium materials, gold accents, opulent",
  };

  const ambienteMap: Record<string, string> = {
    "Sala de estar": "living room",
    "Quarto casal": "master bedroom",
    "Quarto solteiro": "bedroom",
    "Cozinha": "kitchen",
    "Home office": "home office",
    "Closet": "walk-in closet",
    "Banheiro": "bathroom",
    "Área gourmet": "gourmet outdoor kitchen area",
    "Escritório": "professional office",
  };

  const roomEn = ambienteMap[ambiente] ?? ambiente;
  const styleEn = styleMap[estilo] ?? estilo;
  const moveisList = moveis.slice(0, 8).map(generateVisualContext).filter(Boolean).join(", ");

  // Dominant color from first piece
  const dominantColor = moveis[0]?.cor_hex ? hexToVisual(moveis[0].cor_hex) : "neutral";

  const prompt = [
    `Professional architectural visualization photograph`,
    `${styleEn} ${roomEn}`,
    `featuring ${moveisList}`,
    `dominant color palette: ${dominantColor}`,
    `Brazilian luxury home interior`,
    `photorealistic render`,
    `8K ultra-detailed`,
    `cinematic lighting with warm natural light from large windows`,
    `premium MDF furniture with perfect finishing`,
    `clean sophisticated composition`,
    `shot with 24mm wide angle lens`,
    `shallow depth of field`,
    `golden hour lighting`,
    `no people`,
    descricao ? descricao.slice(0, 200) : "",
  ].filter(Boolean).join(", ");

  return prompt;
}

// ─── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body as Partial<RenderInput> & { moveis_nomes?: string[] };

  // Compatibilidade com chamadas antigas (moveis_nomes)
  const moveis: MovelInput[] = body.moveis ?? (body.moveis_nomes ?? []).map((n) => ({ nome: n, categoria: "outro" }));

  const input: RenderInput = {
    ambiente: body.ambiente ?? "sala de estar",
    estilo: body.estilo ?? "Moderno Minimalista",
    estilo_detectado: body.estilo_detectado,
    moveis,
    descricao: body.descricao ?? "",
    descricao_comercial: body.descricao_comercial,
  };

  const fluxKey = process.env.FLUX_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!fluxKey && !openaiKey) {
    return res.status(500).json({ error: "Nenhuma API de render configurada (FLUX_API_KEY ou OPENAI_API_KEY)" });
  }

  const prompt = buildRenderPrompt(input);

  // Flux Pro 1.1 (async — retorna job_id para polling)
  if (fluxKey) {
    try {
      const response = await fetch("https://api.bfl.ml/v1/flux-pro-1.1", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Key": fluxKey },
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
      // fallthrough para DALL-E
    }
  }

  // DALL-E 3 fallback (síncrono)
  if (openaiKey) {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
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
      prompt,
      revised_prompt: data.data[0].revised_prompt,
    });
  }

  return res.status(500).json({ error: "Nenhuma API disponível" });
}
