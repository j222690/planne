import type { VercelRequest, VercelResponse } from "@vercel/node";

// ─── Visual context ────────────────────────────────────────────────────────────

interface MovelInput {
  nome: string;
  categoria: string;
  cor_hex?: string;
  largura_cm?: number;
  profundidade_cm?: number;
  altura_cm?: number;
  // Posicionamento espacial (vista de cima) — para fidelidade do render
  x_pct?: number;        // 0 (esquerda) a 1 (direita)
  y_pct?: number;        // 0 (fundo) a 1 (frente/entrada)
  parede?: "top" | "bottom" | "left" | "right";
  tipo_elemento?: "movel" | "porta" | "janela" | "existente";
}

function hexToVisual(hex?: string): string {
  if (!hex) return "";
  const h = hex.toLowerCase();
  if (h === "#ffffff" || h === "#fafafa" || h === "#f5f5f2") return "white";
  if (h === "#f2ede8" || h === "#f0ebe0" || h === "#f0e6d0") return "off-white";
  if (h === "#2c2c2c" || h === "#1a1a1a") return "matte black";
  if (h === "#e8d8b8" || h === "#d4b070") return "champagne gold";
  if (h === "#5a6a4a") return "moss green";
  if (h === "#e8c0b0") return "rose gold pink";
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  const lum = (r + g + b) / 3;
  if (lum < 60) return "dark charcoal";
  if (lum > 210) return "light neutral";
  if (r > g + 25 && r > b + 25) return "warm wood";
  if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20) return "gray";
  return "natural wood";
}

function generateVisualContext(m: MovelInput): string {
  const color = hexToVisual(m.cor_hex);
  const catMap: Record<string, string> = {
    armario: "wardrobe cabinet",
    bancada: "countertop cabinet",
    mesa: "dining table",
    rack: "TV media console",
    estante: "open shelving unit",
    cama: "bed frame platform",
    escritorio: "desk workstation",
    sofa: "sofa",
    outro: "custom furniture piece",
  };
  const piece = catMap[m.categoria?.toLowerCase() ?? "outro"] ?? "furniture";
  const dim = m.largura_cm ? `${m.largura_cm}×${m.altura_cm}cm` : "";
  return [color ? `${color} finish` : "", piece, dim].filter(Boolean).join(" ");
}

// ─── Prompt builder ────────────────────────────────────────────────────────────

interface RenderInput {
  ambiente: string;
  estilo: string;
  estilo_detectado?: string;
  moveis: MovelInput[];
  descricao: string;
  descricao_comercial?: string;
  mode?: "schnell" | "pro";
  // Dimensões reais do ambiente (m) — para fidelidade do render
  medidas?: { largura: number; profundidade: number; altura: number };
  // Planta baixa exportada (base64) — usada como guia de composição no Flux
  planta_b64?: string;
}

// ─── Descrição espacial do layout (top-down → linguagem natural) ────────────────

function lado(x?: number): string {
  if (x === undefined) return "";
  if (x < 0.33) return "left";
  if (x > 0.66) return "right";
  return "center";
}

function profundidadeRel(y?: number): string {
  if (y === undefined) return "";
  if (y < 0.33) return "against the back wall";
  if (y > 0.66) return "near the entrance";
  return "in the middle of the room";
}

const PAREDE_EN: Record<string, string> = {
  top: "back wall", bottom: "front wall (entrance)", left: "left wall", right: "right wall",
};

/**
 * Descreve o layout real do ambiente em linguagem natural, para o render
 * respeitar a disposição dos móveis, portas e janelas.
 */
function describeLayout(moveis: MovelInput[], medidas?: RenderInput["medidas"]): string {
  const partes: string[] = [];

  if (medidas?.largura && medidas?.profundidade) {
    partes.push(`room dimensions ${medidas.largura}m wide × ${medidas.profundidade}m deep${medidas.altura ? ` × ${medidas.altura}m ceiling height` : ""}`);
  }

  const marcenaria = moveis.filter((m) => (m.tipo_elemento ?? "movel") === "movel");
  const existentes = moveis.filter((m) => m.tipo_elemento === "existente");
  const portas = moveis.filter((m) => m.tipo_elemento === "porta");
  const janelas = moveis.filter((m) => m.tipo_elemento === "janela");

  const descreveMovel = (m: MovelInput) => {
    const loc = [profundidadeRel(m.y_pct), lado(m.x_pct) ? `on the ${lado(m.x_pct)}` : ""].filter(Boolean).join(", ");
    return loc ? `${m.nome} ${loc}` : m.nome;
  };

  if (marcenaria.length > 0) {
    partes.push("custom built-in furniture layout: " + marcenaria.slice(0, 8).map(descreveMovel).join("; "));
  }
  if (existentes.length > 0) {
    partes.push("existing furniture: " + existentes.slice(0, 5).map(descreveMovel).join("; "));
  }
  for (const p of portas.slice(0, 2)) {
    partes.push(`door on the ${PAREDE_EN[p.parede ?? "bottom"]}`);
  }
  for (const j of janelas.slice(0, 3)) {
    partes.push(`window on the ${PAREDE_EN[j.parede ?? "top"]}`);
  }

  return partes.join(". ");
}

const ESTILO_MAP: Record<string, string> = {
  "Moderno Minimalista": "modern minimalist, clean lines, simple geometry, neutral palette",
  "Contemporâneo": "contemporary sleek sophisticated, balanced proportions",
  "Clássico": "classic elegant traditional, ornate crown molding, symmetrical",
  "Industrial": "industrial loft, raw concrete walls, exposed black metal frames",
  "Escandinavo": "Scandinavian hygge, warm birch wood, white walls, cozy textiles",
  "Boho Chic": "bohemian eclectic, layered warm textures, rattan, earthy tones",
  "Rústico": "rustic farmhouse, reclaimed wood beams, warm earthy stone",
  "Luxo": "ultra luxury high-end, marble surfaces, gold brass accents, opulent",
};

const AMBIENTE_MAP: Record<string, string> = {
  "Sala de estar": "living room",
  "Quarto casal": "master bedroom",
  "Quarto solteiro": "bedroom",
  "Cozinha": "modern kitchen",
  "Home office": "home office study",
  "Closet": "walk-in closet dressing room",
  "Banheiro": "bathroom",
  "Área gourmet": "gourmet outdoor kitchen terrace",
  "Escritório": "professional office workspace",
};

function buildRenderPrompt(input: RenderInput): string {
  const roomEn = AMBIENTE_MAP[input.ambiente] ?? input.ambiente;
  const styleEn = ESTILO_MAP[input.estilo] ?? input.estilo;
  const moveisList = input.moveis
    .filter((m) => (m.tipo_elemento ?? "movel") === "movel")
    .slice(0, 10).map(generateVisualContext).filter(Boolean).join(", ");
  const dominantColor = hexToVisual(input.moveis[0]?.cor_hex) || "neutral warm wood tone";
  const layout = describeLayout(input.moveis, input.medidas);

  return [
    "professional interior architecture visualization, photorealistic render, finished completed room",
    `${styleEn} ${roomEn}`,
    "fully furnished and decorated, ready to live in",
    // Layout real do projeto — guia a disposição dos móveis na cena
    layout ? `IMPORTANT spatial layout to respect: ${layout}` : "",
    moveisList ? `custom planned furniture: ${moveisList}` : "",
    `color palette: ${dominantColor}, harmonious complementary tones`,
    "Brazilian luxury marcenaria planejada, premium MDF finishing, perfect edges and details",
    "furniture proportions must match the specified dimensions",
    "styled with decorative objects, plants, artwork, throw pillows and rugs",
    "8K photorealistic, cinematic lighting, warm natural light from windows",
    "wide angle interior shot showing full room composition from the entrance point of view",
    "architectural magazine quality, 24mm lens, clean sophisticated atmosphere",
    "no people, no text, no watermarks",
    input.descricao ? input.descricao.slice(0, 200) : "",
  ].filter(Boolean).join(", ");
}

// ─── Flux configs ──────────────────────────────────────────────────────────────

const FLUX_CONFIGS = {
  schnell: {
    // flux-schnell não existe na API comercial; flux-dev é o rápido/barato p/ preview
    endpoint: "https://api.bfl.ai/v1/flux-dev",
    steps: 28,
    guidance: 3,
    label: "Flux Dev (preview)",
  },
  pro: {
    endpoint: "https://api.bfl.ai/v1/flux-pro-1.1",
    steps: 40,
    guidance: 3.5,
    label: "Flux Pro 1.1 (premium)",
  },
} as const;

// ─── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET → consulta de status do job (consolidado de render-status)
  if (req.method === "GET") return statusHandler(req, res);
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body as Partial<RenderInput> & { moveis_nomes?: string[] };

  // Compatibilidade com chamadas antigas (moveis_nomes)
  const moveis: MovelInput[] = body.moveis
    ?? (body.moveis_nomes ?? []).map((n) => ({ nome: n, categoria: "outro" }));

  const mode: "schnell" | "pro" = body.mode === "schnell" ? "schnell" : "pro";

  const input: RenderInput = {
    ambiente: body.ambiente ?? "sala de estar",
    estilo: body.estilo ?? "Moderno Minimalista",
    estilo_detectado: body.estilo_detectado,
    moveis,
    descricao: body.descricao ?? "",
    descricao_comercial: body.descricao_comercial,
    mode,
  };

  const fluxKey = process.env.FLUX_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!fluxKey && !openaiKey) {
    return res.status(500).json({ error: "Nenhuma API de render configurada (FLUX_API_KEY ou OPENAI_API_KEY)" });
  }

  const prompt = buildRenderPrompt(input);
  const fluxCfg = FLUX_CONFIGS[mode];

  // ── Flux (Schnell ou Pro) ──────────────────────────────────────────────────
  if (fluxKey) {
    try {
      const response = await fetch(fluxCfg.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Key": fluxKey },
        body: JSON.stringify({
          prompt,
          width: mode === "schnell" ? 1024 : 1440,
          height: mode === "schnell" ? 680 : 960,
          steps: fluxCfg.steps,
          guidance: fluxCfg.guidance,
          output_format: "jpeg",
          safety_tolerance: 2,
          // Planta baixa como guia de composição (Redux-style image conditioning).
          // Faz o render respeitar a disposição/cores do layout real do projeto.
          ...(input.planta_b64 ? { image_prompt: input.planta_b64 } : {}),
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as { id: string };
        return res.json({
          provider: mode === "schnell" ? "flux-schnell" : "flux-pro",
          job_id: data.id,
          status: "processing",
          mode,
          prompt,
        });
      }

      // Flux falhou — mostra o erro REAL (não mascara no DALL-E).
      // A causa quase sempre é key inválida (401) ou sem saldo na conta BFL.
      const errText = await response.text();
      const dica = response.status === 401 || response.status === 403
        ? " Verifique se a FLUX_API_KEY está correta em api.bfl.ai (sem espaços)."
        : response.status === 402 || /credit|insufficient|balance/i.test(errText)
          ? " A conta Black Forest Labs está sem saldo — adicione créditos em api.bfl.ai."
          : "";
      return res.status(502).json({ error: `Flux (HTTP ${response.status}): ${errText.slice(0, 250)}.${dica}` });
    } catch (e) {
      return res.status(502).json({ error: `Flux indisponível: ${e instanceof Error ? e.message : "erro de rede"}` });
    }
  }

  // ── DALL-E fallback (DALL-E 2 foi descontinuado pela OpenAI) ────────────────
  // schnell → DALL-E 3 standard (1024×1024)
  // pro     → DALL-E 3 HD (1792×1024, requires maxDuration: 60 in vercel.json)
  if (openaiKey) {
    if (mode === "schnell") {
      // DALL-E 3 standard: preview de qualidade (dall-e-2 não existe mais)
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt.slice(0, 4000),
          n: 1,
          size: "1024x1024",
          quality: "standard",
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return res.status(502).json({ error: `DALL-E 3 (preview): ${err.slice(0, 300)}` });
      }

      const data = (await response.json()) as { data: { url: string }[] };
      return res.json({
        provider: "dalle3",
        status: "completed",
        url: data.data[0].url,
        mode,
        prompt,
      });
    } else {
      // DALL-E 3 HD: high quality, requires maxDuration: 60 in vercel.json (Vercel Pro plan)
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt.slice(0, 4000),
          n: 1,
          size: "1792x1024",
          quality: "hd",
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return res.status(502).json({ error: `DALL-E 3: ${err.slice(0, 300)}` });
      }

      const data = (await response.json()) as { data: { url: string; revised_prompt: string }[] };
      return res.json({
        provider: "dalle3",
        status: "completed",
        url: data.data[0].url,
        mode,
        prompt,
        revised_prompt: data.data[0].revised_prompt,
      });
    }
  }

  return res.status(500).json({ error: "Nenhuma API disponível" });
}

// ─── Status do job (consolidado de render-status) ────────────────────────────
// GET /api/render?job_id=XXX
async function statusHandler(req: VercelRequest, res: VercelResponse) {
  const { job_id } = req.query;
  const fluxKey = process.env.FLUX_API_KEY;

  if (!fluxKey) return res.status(500).json({ error: "FLUX_API_KEY não configurada" });
  if (!job_id) return res.status(400).json({ error: "job_id obrigatório" });

  const response = await fetch(`https://api.bfl.ai/v1/get_result?id=${job_id}`, {
    headers: { "X-Key": fluxKey },
  });

  if (!response.ok) {
    return res.status(502).json({ error: "Erro ao consultar Flux" });
  }

  const data = (await response.json()) as {
    status: string;
    result?: { sample: string };
  };

  if (data.status === "Ready" && data.result?.sample) {
    return res.json({ status: "completed", url: data.result.sample });
  }

  return res.json({ status: data.status === "Error" ? "error" : "processing" });
}
