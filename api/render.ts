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
  // Ângulo de câmera — gera múltiplas vistas do mesmo ambiente
  vista?: VistaCamera;
  // Dimensões reais do ambiente (m) — para fidelidade do render
  medidas?: { largura: number; profundidade: number; altura: number };
  // Planta baixa exportada (base64) — usada como guia de composição no Flux
  planta_b64?: string;
}

// Vistas que, juntas, cobrem o espaço interno inteiro do ambiente.
type VistaCamera = "geral" | "frontal" | "canto" | "lateral";

const VISTAS_CAMERA: Record<VistaCamera, string> = {
  geral: "wide angle establishing shot from the entrance, showing the FULL room composition, 24mm lens",
  frontal: "front-facing view centered on the main wall and its built-in furniture, eye-level, symmetric composition",
  canto: "corner perspective from the opposite side, wide angle capturing two walls and the complete layout",
  lateral: "side view along the longest wall, showing the depth and circulation of the room, 28mm lens",
};

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
    // 3.3: dimensões reais → o render respeita proporção e escala de cada peça
    const dim = m.largura_cm && m.altura_cm
      ? ` (${Math.round(m.largura_cm)}cm wide × ${Math.round(m.altura_cm)}cm tall)`
      : "";
    return `${m.nome}${dim}${loc ? ` ${loc}` : ""}`;
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
  "Lavanderia": "laundry utility room",
};

// ─── Iluminação específica por estilo ────────────────────────────────────────

const LIGHTING_BY_STYLE: Record<string, string> = {
  "Moderno Minimalista": "cool white diffused LED ceiling panels, recessed spotlights, indirect strip lighting concealed behind cabinets, 5600K clean shadowless illumination",
  "Contemporâneo": "balanced natural daylight from wide floor-to-ceiling windows, warm white recessed ceiling lights 3000K, discreet accent spots highlighting furniture details",
  "Clássico": "warm traditional chandelier 2700K, elegant wall sconces with fabric shades, soft golden even illumination throughout the room",
  "Industrial": "exposed Edison filament pendant bulbs 2200K warm amber, high-contrast chiaroscuro shadows, cool blue ambient light from large industrial windows",
  "Escandinavo": "soft diffused north-facing daylight, hygge warm candle accent lighting 2400K, cozy warm glow with no harsh shadows, hygge atmosphere",
  "Boho Chic": "golden afternoon sunlight streaming through sheer linen curtains, rattan pendant lamp casting intricate patterned shadows, fairy lights in corners",
  "Rústico": "warm low-angle side light through rustic wooden shutters, incandescent warm glow 2200K, candlelight flickering on wooden surfaces",
  "Luxo": "dramatic architectural golden lighting 3200K, concealed LED strips in every niche and shelf, soft downlights highlighting marble surfaces, crystal chandelier casting brilliant reflections",
};

// ─── Decorações específicas por estilo ────────────────────────────────────────

const DECOR_BY_STYLE: Record<string, string> = {
  "Moderno Minimalista": "single white tulip in tall geometric ceramic vase, abstract geometric print in thin black frame, concrete sphere sculpture on shelf, matte ceramic coffee cup on counter",
  "Contemporâneo": "curated architectural art book stack on coffee table, sculptural matte ceramic vase, small succulent in designer pot, abstract canvas painting",
  "Clássico": "crystal vase with fresh white hydrangeas, ornate gilded picture frame with classical art, rich velvet throw pillow, silk drapes with tassel trim",
  "Industrial": "vintage Edison table lamp, industrial metal pipe bookend with hardcover books, reclaimed wooden decorative crate, raw brick wall texture visible",
  "Escandinavo": "dried pampas grass in white ceramic vase, chunky knit wool throw blanket draped on chair, beeswax candle cluster on tray, small monstera plant",
  "Boho Chic": "macramé wall hanging above sofa, terracotta pots with cacti and trailing pothos plant, layered vintage kilim area rug, woven rattan basket",
  "Rústico": "handmade clay pottery on shelf, wooden cutting board with artisan bread loaf, dried herb bundle hanging, mason jar with wildflowers, linen napkins",
  "Luxo": "fresh white orchid arrangement in crystal vase, Carrara marble decorative tray with gold accessories, brass candlestick holders, luxury coffee table book, cashmere throw",
};

// ─── Acessórios específicos por ambiente ──────────────────────────────────────

const DECOR_BY_AMBIENTE: Record<string, string> = {
  "Cozinha": "polished granite countertop with integrated stainless steel sink, espresso coffee machine on counter, ceramic fruit bowl with fresh fruits, bar stools at the island counter, kitchen herb garden on window sill",
  "Sala de estar": "elegant area rug with sophisticated pattern, glass coffee table with stacked design books, throw blanket draped on sofa arm, tall indoor floor plant in corner, decorative cushions",
  "Quarto casal": "matching bedside tables with warm reading lamps, alarm clock, carefully folded throw blanket at foot of bed, framed art above upholstered headboard",
  "Quarto solteiro": "study desk with warm desk lamp and open notebook, bookshelf with books and collectibles, backpack near desk, small potted cactus plant",
  "Banheiro": "neatly folded white spa towels, stone soap dispenser and dish set, white orchid on marble countertop, LED-backlit frameless mirror, scented candle on tray",
  "Closet": "organized shoes visible through glass panel doors, neatly folded clothes stacked, jewelry tray on shelf, full-length mirror with slim frame",
  "Lavanderia": "modern front-load washing machine neatly integrated, stack of clean folded laundry, matching labeled detergent bottles arranged on shelf, small potted succulent, wire laundry basket",
  "Escritório": "open laptop on organized desk, warm desk lamp with brass base, pen and pencil holder, framed motivational artwork, organized document tray, small succulent plant",
  "Home office": "open laptop with external monitor, ergonomic chair with lumbar support, organized bookshelf, ceramic coffee mug, cork board with notes and calendar",
  "Área gourmet": "stainless steel outdoor grill with hood, pendant lights above marble counter, bar stools, wine rack with bottles, fresh herbs in pots",
};

function buildRenderPrompt(input: RenderInput): string {
  const roomEn = AMBIENTE_MAP[input.ambiente] ?? input.ambiente;
  const styleEn = ESTILO_MAP[input.estilo] ?? input.estilo;
  const lighting = LIGHTING_BY_STYLE[input.estilo] ?? "warm natural window light, 3000K warm white LED ceiling lights";
  const decorStyle = DECOR_BY_STYLE[input.estilo] ?? "curated decorative objects, plants, framed artwork";
  const decorAmbiente = DECOR_BY_AMBIENTE[input.ambiente] ?? "";

  const moveisList = input.moveis
    .filter((m) => (m.tipo_elemento ?? "movel") === "movel")
    .slice(0, 10).map(generateVisualContext).filter(Boolean).join(", ");
  const dominantColor = hexToVisual(input.moveis[0]?.cor_hex) || "neutral warm wood tone";
  const layout = describeLayout(input.moveis, input.medidas);

  return [
    "professional interior architecture visualization, photorealistic render, award-winning completed room",
    `${styleEn} ${roomEn}`,
    "fully furnished and decorated, ready to live in, no empty or unfinished areas in the room",
    // Layout real do projeto — guia a disposição dos móveis na cena
    layout ? `IMPORTANT spatial layout to respect: ${layout}` : "",
    moveisList ? `custom built-in marcenaria furniture: ${moveisList}` : "",
    `dominant color palette: ${dominantColor}, harmonious complementary tones throughout the entire space`,
    "Brazilian luxury marcenaria planejada, premium MDF melamina finish, crisp ABS edgebanding on all panels, aluminum profile handles, soft-close concealed hinges, impeccable joinery",
    "furniture dimensions and proportions must exactly match the specified measurements",
    `lighting: ${lighting}`,
    decorStyle ? `style-appropriate decor: ${decorStyle}` : "",
    decorAmbiente ? `room accessories: ${decorAmbiente}` : "",
    // Ângulo de câmera da vista solicitada (cada vista cobre uma parte do ambiente)
    VISTAS_CAMERA[input.vista ?? "geral"],
    "8K photorealistic CGI render, ultra-high detail on material surfaces, accurate light physics and reflections",
    "Architectural Digest magazine quality, sharp focus throughout, cinematic composition",
    "no people, no text overlays, no watermarks, no unfinished walls, complete flooring visible",
    input.descricao ? input.descricao.slice(0, 200) : "",
  ].filter(Boolean).join(", ");
}

// ─── FluxAPI.ai configs (serviço usado: api.fluxapi.ai, auth Bearer) ────────────

const FLUXAPI_GENERATE = "https://api.fluxapi.ai/api/v1/flux/kontext/generate";
const FLUXAPI_STATUS = "https://api.fluxapi.ai/api/v1/flux/kontext/record-info";

const FLUX_CONFIGS = {
  schnell: { model: "flux-kontext-pro", label: "Flux Kontext Pro (preview)" },
  pro: { model: "flux-kontext-max", label: "Flux Kontext Max (premium)" },
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
    vista: body.vista,
    medidas: body.medidas,
  };

  const fluxKey = process.env.FLUX_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!fluxKey && !openaiKey) {
    return res.status(500).json({ error: "Nenhuma API de render configurada (FLUX_API_KEY ou OPENAI_API_KEY)" });
  }

  const prompt = buildRenderPrompt(input);
  const fluxCfg = FLUX_CONFIGS[mode];

  // ── FluxAPI.ai (Kontext Pro/Max) ────────────────────────────────────────────
  if (fluxKey) {
    try {
      const response = await fetch(FLUXAPI_GENERATE, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${fluxKey.trim()}` },
        body: JSON.stringify({
          prompt,
          model: fluxCfg.model,
          aspectRatio: "16:9",        // interior wide
          outputFormat: "jpeg",
          promptUpsampling: true,
          safetyTolerance: 2,
          // Planta como guia de composição (modo edição) — requer URL pública
          ...(input.planta_b64 && /^https?:\/\//.test(input.planta_b64) ? { inputImage: input.planta_b64 } : {}),
        }),
      });

      const json = (await response.json().catch(() => ({}))) as {
        code?: number; msg?: string; data?: { taskId?: string };
      };

      if (response.ok && json.data?.taskId) {
        return res.json({
          provider: "fluxapi",
          job_id: json.data.taskId,
          status: "processing",
          mode,
          prompt,
        });
      }

      // Erro real do FluxAPI (key inválida, sem crédito, etc.)
      const dica = response.status === 401 || response.status === 403
        ? " Verifique a FLUX_API_KEY (Bearer) em fluxapi.ai."
        : /credit|insufficient|balance|quota/i.test(json.msg ?? "")
          ? " A conta FluxAPI.ai está sem créditos — recarregue em fluxapi.ai."
          : "";
      return res.status(502).json({ error: `FluxAPI (HTTP ${response.status}): ${json.msg ?? "sem taskId"}.${dica}` });
    } catch (e) {
      return res.status(502).json({ error: `FluxAPI indisponível: ${e instanceof Error ? e.message : "erro de rede"}` });
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

// ─── Status do job (FluxAPI.ai record-info) ──────────────────────────────────
// GET /api/render?job_id=XXX
// successFlag: 0=gerando, 1=sucesso, 2/3=falha
async function statusHandler(req: VercelRequest, res: VercelResponse) {
  const { job_id } = req.query;
  const fluxKey = process.env.FLUX_API_KEY;

  if (!fluxKey) return res.status(500).json({ error: "FLUX_API_KEY não configurada" });
  if (!job_id) return res.status(400).json({ error: "job_id obrigatório" });

  const response = await fetch(`${FLUXAPI_STATUS}?taskId=${job_id}`, {
    headers: { Authorization: `Bearer ${fluxKey.trim()}` },
  });

  if (!response.ok) {
    return res.status(502).json({ error: "Erro ao consultar FluxAPI" });
  }

  const json = (await response.json().catch(() => ({}))) as {
    data?: { successFlag?: number; response?: { resultImageUrl?: string } };
  };

  const flag = json.data?.successFlag;
  const url = json.data?.response?.resultImageUrl;

  if (flag === 1 && url) {
    return res.json({ status: "completed", url });
  }
  if (flag === 2 || flag === 3) {
    return res.json({ status: "error", error: "FluxAPI não conseguiu gerar a imagem." });
  }
  return res.json({ status: "processing" });
}
