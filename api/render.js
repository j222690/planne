// ARQUIVO GERADO por scripts/bundle-api.mjs — NÃO EDITAR.
// Edite src/server/http/ e rode npm run build.


// src/server/require-user.ts
import { createClient } from "@supabase/supabase-js";
function header(req, name) {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
function readAccessToken(req) {
  const raw = header(req, "authorization");
  if (raw) {
    const match = raw.match(/^Bearer\s+(\S+)/i);
    if (match?.[1]) return match[1].trim();
  }
  const body = req.body;
  const fromBody = body?.userToken ?? body?.user_token;
  if (typeof fromBody === "string" && fromBody.trim()) return fromBody.trim();
  return null;
}
async function requireUser(req, res) {
  const token = readAccessToken(req);
  if (!token) {
    res.status(401).json({ error: "N\xE3o autenticado" });
    return null;
  }
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    res.status(500).json({ error: "Supabase n\xE3o configurado" });
    return null;
  }
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "N\xE3o autenticado" });
    return null;
  }
  return { id: data.user.id, token };
}

// src/server/midia.ts
import { createClient as createClient2 } from "@supabase/supabase-js";
var MAX_BYTES = 8 * 1024 * 1024;
var MAX_B64_CHARS = 6e6;
function detectMime(b64) {
  if (b64.startsWith("/9j")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("UklGR")) return "image/webp";
  if (b64.startsWith("JVBER")) return "application/pdf";
  return "image/jpeg";
}
function stripDataUrl(value) {
  return value.replace(/^data:[^;]+;base64,/, "");
}
function isSupabaseHttpsUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host.endsWith(".supabase.co") || host.endsWith(".supabase.in")) return true;
    const configured = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    if (!configured) return false;
    return new URL(configured).hostname.toLowerCase() === host;
  } catch {
    return false;
  }
}
async function baixarMidiaPermitida(url) {
  if (!isSupabaseHttpsUrl(url)) return null;
  const response = await fetch(url);
  if (!response.ok) return null;
  const buf = Buffer.from(await response.arrayBuffer());
  if (buf.length === 0 || buf.length > MAX_BYTES) return null;
  const mime = (response.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
  return { data: buf.toString("base64"), mime };
}
async function inlineParaGemini(opts) {
  if (opts.url && isSupabaseHttpsUrl(opts.url)) return baixarMidiaPermitida(opts.url);
  if (!opts.b64) return null;
  const raw = stripDataUrl(opts.b64);
  if (!raw || raw.length > MAX_B64_CHARS) return null;
  return { data: raw, mime: opts.mime || detectMime(raw) };
}
async function publicarImagemRender(token, userId, base64, mime) {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key || !base64) return null;
  const sb = createClient2(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const path = `${userId}/renders/${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length === 0 || bytes.length > MAX_BYTES) return null;
  const blob = new Blob([bytes], { type: mime || "image/png" });
  const { error } = await sb.storage.from("ia-uploads").upload(path, blob, {
    contentType: mime || "image/png",
    upsert: false
  });
  if (error) return null;
  const { data } = sb.storage.from("ia-uploads").getPublicUrl(path);
  return data.publicUrl || null;
}

// src/server/http/render.ts
async function jsonComImagem(res, auth, base64, mime, payload) {
  const stored = await publicarImagemRender(auth.token, auth.id, base64, mime);
  return res.json({ ...payload, url: stored ?? `data:${mime};base64,${base64}` });
}
function hexToVisual(hex) {
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
function generateVisualContext(m) {
  const color = hexToVisual(m.cor_hex);
  const catMap = {
    armario: "wardrobe cabinet",
    bancada: "countertop cabinet",
    mesa: "dining table",
    rack: "TV media console",
    estante: "open shelving unit",
    cama: "bed frame platform",
    escritorio: "desk workstation",
    sofa: "sofa",
    outro: "custom furniture piece"
  };
  const piece = catMap[m.categoria?.toLowerCase() ?? "outro"] ?? "furniture";
  const dim = m.largura_cm ? `${m.largura_cm}\xD7${m.altura_cm}cm` : "";
  return [color ? `${color} finish` : "", piece, dim].filter(Boolean).join(" ");
}
var VISTAS_CAMERA = {
  geral: "wide angle establishing shot from the entrance, showing the FULL room composition, 24mm lens",
  frontal: "front-facing view centered on the main wall and its built-in furniture, eye-level, symmetric composition",
  canto: "corner perspective from the opposite side, wide angle capturing two walls and the complete layout",
  lateral: "side view along the longest wall, showing the depth and circulation of the room, 28mm lens"
};
function lado(x) {
  if (x === void 0) return "";
  if (x < 0.33) return "left";
  if (x > 0.66) return "right";
  return "center";
}
function profundidadeRel(y) {
  if (y === void 0) return "";
  if (y < 0.33) return "against the back wall";
  if (y > 0.66) return "near the entrance";
  return "in the middle of the room";
}
var PAREDE_EN = {
  top: "back wall",
  bottom: "front wall (entrance)",
  left: "left wall",
  right: "right wall"
};
function describeLayout(moveis, medidas) {
  const partes = [];
  if (medidas?.largura && medidas?.profundidade) {
    partes.push(`room dimensions ${medidas.largura}m wide \xD7 ${medidas.profundidade}m deep${medidas.altura ? ` \xD7 ${medidas.altura}m ceiling height` : ""}`);
  }
  const marcenaria = moveis.filter((m) => (m.tipo_elemento ?? "movel") === "movel");
  const existentes = moveis.filter((m) => m.tipo_elemento === "existente");
  const portas = moveis.filter((m) => m.tipo_elemento === "porta");
  const janelas = moveis.filter((m) => m.tipo_elemento === "janela");
  const descreveMovel = (m) => {
    const loc = [profundidadeRel(m.y_pct), lado(m.x_pct) ? `on the ${lado(m.x_pct)}` : ""].filter(Boolean).join(", ");
    const dim = m.largura_cm && m.altura_cm ? ` (${Math.round(m.largura_cm)}cm wide \xD7 ${Math.round(m.altura_cm)}cm tall)` : "";
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
var ESTILO_MAP = {
  "Moderno Minimalista": "modern minimalist, clean lines, simple geometry, neutral palette",
  "Contempor\xE2neo": "contemporary sleek sophisticated, balanced proportions",
  "Cl\xE1ssico": "classic elegant traditional, ornate crown molding, symmetrical",
  "Industrial": "industrial loft, raw concrete walls, exposed black metal frames",
  "Escandinavo": "Scandinavian hygge, warm birch wood, white walls, cozy textiles",
  "Boho Chic": "bohemian eclectic, layered warm textures, rattan, earthy tones",
  "R\xFAstico": "rustic farmhouse, reclaimed wood beams, warm earthy stone",
  "Luxo": "ultra luxury high-end, marble surfaces, gold brass accents, opulent"
};
var AMBIENTE_MAP = {
  "Sala de estar": "living room",
  "Quarto casal": "master bedroom",
  "Quarto solteiro": "bedroom",
  "Cozinha": "modern kitchen",
  "Home office": "home office study",
  "Closet": "walk-in closet dressing room",
  "Banheiro": "bathroom",
  "\xC1rea gourmet": "gourmet outdoor kitchen terrace",
  "Escrit\xF3rio": "professional office workspace",
  "Lavanderia": "laundry utility room"
};
var LIGHTING_BY_STYLE = {
  "Moderno Minimalista": "cool white diffused LED ceiling panels, recessed spotlights, indirect strip lighting concealed behind cabinets, 5600K clean shadowless illumination",
  "Contempor\xE2neo": "balanced natural daylight from wide floor-to-ceiling windows, warm white recessed ceiling lights 3000K, discreet accent spots highlighting furniture details",
  "Cl\xE1ssico": "warm traditional chandelier 2700K, elegant wall sconces with fabric shades, soft golden even illumination throughout the room",
  "Industrial": "exposed Edison filament pendant bulbs 2200K warm amber, high-contrast chiaroscuro shadows, cool blue ambient light from large industrial windows",
  "Escandinavo": "soft diffused north-facing daylight, hygge warm candle accent lighting 2400K, cozy warm glow with no harsh shadows, hygge atmosphere",
  "Boho Chic": "golden afternoon sunlight streaming through sheer linen curtains, rattan pendant lamp casting intricate patterned shadows, fairy lights in corners",
  "R\xFAstico": "warm low-angle side light through rustic wooden shutters, incandescent warm glow 2200K, candlelight flickering on wooden surfaces",
  "Luxo": "dramatic architectural golden lighting 3200K, concealed LED strips in every niche and shelf, soft downlights highlighting marble surfaces, crystal chandelier casting brilliant reflections"
};
var DECOR_BY_STYLE = {
  "Moderno Minimalista": "single white tulip in tall geometric ceramic vase, abstract geometric print in thin black frame, concrete sphere sculpture on shelf, matte ceramic coffee cup on counter",
  "Contempor\xE2neo": "curated architectural art book stack on coffee table, sculptural matte ceramic vase, small succulent in designer pot, abstract canvas painting",
  "Cl\xE1ssico": "crystal vase with fresh white hydrangeas, ornate gilded picture frame with classical art, rich velvet throw pillow, silk drapes with tassel trim",
  "Industrial": "vintage Edison table lamp, industrial metal pipe bookend with hardcover books, reclaimed wooden decorative crate, raw brick wall texture visible",
  "Escandinavo": "dried pampas grass in white ceramic vase, chunky knit wool throw blanket draped on chair, beeswax candle cluster on tray, small monstera plant",
  "Boho Chic": "macram\xE9 wall hanging above sofa, terracotta pots with cacti and trailing pothos plant, layered vintage kilim area rug, woven rattan basket",
  "R\xFAstico": "handmade clay pottery on shelf, wooden cutting board with artisan bread loaf, dried herb bundle hanging, mason jar with wildflowers, linen napkins",
  "Luxo": "fresh white orchid arrangement in crystal vase, Carrara marble decorative tray with gold accessories, brass candlestick holders, luxury coffee table book, cashmere throw"
};
var DECOR_BY_AMBIENTE = {
  "Cozinha": "polished granite countertop with integrated stainless steel sink, espresso coffee machine on counter, ceramic fruit bowl with fresh fruits, bar stools at the island counter, kitchen herb garden on window sill",
  "Sala de estar": "elegant area rug with sophisticated pattern, glass coffee table with stacked design books, throw blanket draped on sofa arm, tall indoor floor plant in corner, decorative cushions",
  "Quarto casal": "matching bedside tables with warm reading lamps, alarm clock, carefully folded throw blanket at foot of bed, framed art above upholstered headboard",
  "Quarto solteiro": "study desk with warm desk lamp and open notebook, bookshelf with books and collectibles, backpack near desk, small potted cactus plant",
  "Banheiro": "neatly folded white spa towels, stone soap dispenser and dish set, white orchid on marble countertop, LED-backlit frameless mirror, scented candle on tray",
  "Closet": "organized shoes visible through glass panel doors, neatly folded clothes stacked, jewelry tray on shelf, full-length mirror with slim frame",
  "Lavanderia": "modern front-load washing machine neatly integrated, stack of clean folded laundry, matching labeled detergent bottles arranged on shelf, small potted succulent, wire laundry basket",
  "Escrit\xF3rio": "open laptop on organized desk, warm desk lamp with brass base, pen and pencil holder, framed motivational artwork, organized document tray, small succulent plant",
  "Home office": "open laptop with external monitor, ergonomic chair with lumbar support, organized bookshelf, ceramic coffee mug, cork board with notes and calendar",
  "\xC1rea gourmet": "stainless steel outdoor grill with hood, pendant lights above marble counter, bar stools, wine rack with bottles, fresh herbs in pots"
};
var REGRAS_FUNCIONAIS_GERAL = "functional ergonomic cabinetmaking layout following real Brazilian marcenaria best practices: tall built-in cabinets may and usually do extend full height all the way up to the ceiling for maximum storage; when cabinets go up to the ceiling, the upper doors closest to the ceiling should simply be TALLER and longer (extending down far enough to be opened and reached from the floor), keeping the normal number of doors side by side; do NOT use small separate high compartments or tiny stacked cabinets that would require a stool, chair or ladder to reach; every cabinet, wardrobe and room door must have full clearance to open completely, NO plants, objects, furniture or decor blocking or standing in front of any door or drawer, respect circulation space and door swing clearance between furniture pieces";
var FUNCIONAL_POR_AMBIENTE = {
  "Cozinha": "the base cabinet under the sink MUST have hinged swing doors (never drawers) to allow access to the faucet and plumbing; oven, cooktop and stove positioned away from windows at a safe distance from the glass; drawers only where practical, doors under the sink and under the cooktop; countertop at standard ergonomic working height",
  "\xC1rea gourmet": "the cabinet under the sink must have hinged doors (not drawers) for plumbing access; grill and cooktop away from windows; ergonomic counter height",
  "Quarto casal": "wardrobe doors with full clearance to open; the bench or ottoman at the foot of the bed kept well away from the wardrobe so its doors open freely; nightstands not blocking any door; clear circulation around the bed",
  "Quarto solteiro": "wardrobe and desk drawers with full clearance to open; nothing blocking the wardrobe doors; clear walking space",
  "Closet": "all wardrobe and cabinet doors and drawers with full clearance to open completely, nothing blocking them; upper storage at reachable height, no unreachable shelves stacked near the ceiling",
  "Banheiro": "the vanity cabinet under the sink MUST have hinged doors (not drawers) for plumbing access; mirror cabinet at reachable height",
  "Lavanderia": "the cabinet under the tank/sink must have hinged doors for plumbing access; upper cabinets at reachable height; clear access to the washing machine door"
};
function buildRenderPrompt(input) {
  const roomEn = AMBIENTE_MAP[input.ambiente] ?? input.ambiente;
  const styleEn = ESTILO_MAP[input.estilo] ?? input.estilo;
  const lighting = LIGHTING_BY_STYLE[input.estilo] ?? "warm natural window light, 3000K warm white LED ceiling lights";
  const decorStyle = DECOR_BY_STYLE[input.estilo] ?? "curated decorative objects, plants, framed artwork";
  const decorAmbiente = DECOR_BY_AMBIENTE[input.ambiente] ?? "";
  const moveisList = input.moveis.filter((m) => (m.tipo_elemento ?? "movel") === "movel").slice(0, 10).map(generateVisualContext).filter(Boolean).join(", ");
  const dominantColor = hexToVisual(input.moveis[0]?.cor_hex) || "neutral warm wood tone";
  const layout = describeLayout(input.moveis, input.medidas);
  const funcionalAmbiente = FUNCIONAL_POR_AMBIENTE[input.ambiente] ?? "";
  const partes = [
    "professional interior architecture visualization, photorealistic render, award-winning completed room",
    `${styleEn} ${roomEn}`,
    "fully furnished and decorated, ready to live in, no empty or unfinished areas in the room",
    // Layout real do projeto — guia a disposição dos móveis na cena
    layout ? `IMPORTANT spatial layout to respect: ${layout}` : "",
    moveisList ? `custom built-in marcenaria furniture: ${moveisList}` : "",
    `dominant color palette: ${dominantColor}, harmonious complementary tones throughout the entire space`,
    "Brazilian luxury marcenaria planejada, premium MDF melamina finish, crisp ABS edgebanding on all panels, aluminum profile handles, soft-close concealed hinges, impeccable joinery",
    "base cabinets sit on a recessed clipped toe-kick base (rodap\xE9) over adjustable feet; tall cabinets finish at the ceiling with a crown-molding trim (roda-teto); countertops and visible fronts have a thick doubled 30mm edge (engrosso)",
    "furniture dimensions and proportions must exactly match the specified measurements",
    // Regras de funcionalidade/ergonomia — evita erros de marcenaria na cena
    REGRAS_FUNCIONAIS_GERAL,
    funcionalAmbiente,
    `lighting: ${lighting}`,
    decorStyle ? `style-appropriate decor: ${decorStyle}` : "",
    decorAmbiente ? `room accessories: ${decorAmbiente}` : "",
    // Ângulo de câmera da vista solicitada (cada vista cobre uma parte do ambiente)
    VISTAS_CAMERA[input.vista ?? "geral"],
    "8K photorealistic CGI render, ultra-high detail on material surfaces, accurate light physics and reflections",
    "Architectural Digest magazine quality, sharp focus throughout, cinematic composition",
    "no people, no text overlays, no watermarks, no unfinished walls, complete flooring visible",
    input.descricao ? input.descricao.slice(0, 200) : ""
  ].filter(Boolean);
  const full = partes.join(", ");
  const LIMITE = 2900;
  if (full.length <= LIMITE) return full;
  const corte = full.slice(0, LIMITE);
  const sep = corte.lastIndexOf(", ");
  return sep > LIMITE * 0.6 ? corte.slice(0, sep) : corte;
}
var FLUXAPI_GENERATE = "https://api.fluxapi.ai/api/v1/flux/kontext/generate";
var FLUXAPI_STATUS = "https://api.fluxapi.ai/api/v1/flux/kontext/record-info";
var FLUX_CONFIGS = {
  schnell: { model: "flux-kontext-pro", label: "Flux Kontext Pro (preview)" },
  pro: { model: "flux-kontext-max", label: "Flux Kontext Max (premium)" }
};
var config = { maxDuration: 60 };
async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const auth = await requireUser(req, res);
  if (!auth) return;
  if (req.method === "GET") return statusHandler(req, res);
  if (req.body?.action === "render3d_enqueue") {
    return render3dEnqueueHandler(req, res);
  }
  const body = req.body;
  const moveis = body.moveis ?? (body.moveis_nomes ?? []).map((n) => ({ nome: n, categoria: "outro" }));
  const mode = body.mode === "schnell" ? "schnell" : "pro";
  const input = {
    ambiente: body.ambiente ?? "sala de estar",
    estilo: body.estilo ?? "Moderno Minimalista",
    estilo_detectado: body.estilo_detectado,
    moveis,
    descricao: body.descricao ?? "",
    descricao_comercial: body.descricao_comercial,
    mode,
    vista: body.vista,
    medidas: body.medidas
  };
  const fluxKey = process.env.FLUX_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!fluxKey && !geminiKey) {
    return res.status(500).json({ error: "Nenhuma API de render configurada (FLUX_API_KEY ou GEMINI_API_KEY)" });
  }
  const prompt = buildRenderPrompt(input);
  const fluxCfg = FLUX_CONFIGS[mode];
  const pediuGuia = !!(body.guia_url || body.guia_b64);
  const guiaInline = pediuGuia ? await inlineParaGemini({ url: body.guia_url, b64: body.guia_b64 }) : null;
  if (pediuGuia && !guiaInline) {
    return res.status(400).json({ error: "N\xE3o foi poss\xEDvel ler a imagem-guia." });
  }
  if (guiaInline && geminiKey) {
    const model = "gemini-2.5-flash-image";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey.trim()}`;
    const promptGuia = [
      "You are given a reference image: a 2D/3D schematic of a Brazilian planned-furniture (marcenaria) project on a wall.",
      "Recreate this EXACT layout as a photorealistic interior render \u2014 keep every cabinet, door, drawer, shelf and module in the SAME position, count and proportion as in the reference. Do not add or remove furniture.",
      prompt,
      body.materiais_txt ? `Specified materials and hardware to depict: ${body.materiais_txt.slice(0, 400)}` : ""
    ].filter(Boolean).join(". ").slice(0, 4e3);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ inlineData: { mimeType: guiaInline.mime, data: guiaInline.data } }, { text: promptGuia }] }],
          generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" } }
        })
      });
      if (!response.ok) {
        const err = await response.text();
        return res.status(502).json({ error: `Gemini guia (HTTP ${response.status}): ${err.slice(0, 200)}` });
      }
      const data = await response.json();
      const imgPart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      if (!imgPart?.inlineData?.data) {
        return res.status(502).json({ error: "Gemini n\xE3o retornou imagem a partir do guia (poss\xEDvel bloqueio de seguran\xE7a)." });
      }
      const mime = imgPart.inlineData.mimeType ?? "image/png";
      return jsonComImagem(res, auth, imgPart.inlineData.data, mime, {
        provider: "gemini",
        status: "completed",
        mode,
        prompt: promptGuia
      });
    } catch (e) {
      return res.status(502).json({ error: `Gemini (guia) indispon\xEDvel: ${e instanceof Error ? e.message : "erro de rede"}` });
    }
  }
  if (fluxKey) {
    try {
      const response = await fetch(FLUXAPI_GENERATE, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${fluxKey.trim()}` },
        body: JSON.stringify({
          prompt,
          model: fluxCfg.model,
          aspectRatio: "16:9",
          // interior wide
          outputFormat: "jpeg",
          promptUpsampling: true,
          safetyTolerance: 2,
          // Planta como guia de composição (modo edição) — requer URL pública
          ...input.planta_b64 && /^https?:\/\//.test(input.planta_b64) ? { inputImage: input.planta_b64 } : {}
        })
      });
      const json = await response.json().catch(() => ({}));
      if (response.ok && json.data?.taskId) {
        return res.json({
          provider: "fluxapi",
          job_id: json.data.taskId,
          status: "processing",
          mode,
          prompt
        });
      }
      const dica = response.status === 401 || response.status === 403 ? " Verifique a FLUX_API_KEY (Bearer) em fluxapi.ai." : /credit|insufficient|balance|quota/i.test(json.msg ?? "") ? " A conta FluxAPI.ai est\xE1 sem cr\xE9ditos \u2014 recarregue em fluxapi.ai." : "";
      return res.status(502).json({ error: `FluxAPI (HTTP ${response.status}): ${json.msg ?? "sem taskId"}.${dica}` });
    } catch (e) {
      return res.status(502).json({ error: `FluxAPI indispon\xEDvel: ${e instanceof Error ? e.message : "erro de rede"}` });
    }
  }
  if (geminiKey) {
    const model = "gemini-2.5-flash-image";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey.trim()}`;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt.slice(0, 4e3) }] }],
          generationConfig: {
            responseModalities: ["IMAGE"],
            imageConfig: { aspectRatio: "16:9" }
          }
        })
      });
      if (!response.ok) {
        const err = await response.text();
        const dica = response.status === 403 ? " Verifique a GEMINI_API_KEY em aistudio.google.com." : response.status === 429 ? " Cota da API Gemini excedida \u2014 aguarde ou aumente o limite no Google AI Studio." : "";
        return res.status(502).json({ error: `Gemini (HTTP ${response.status}): ${err.slice(0, 200)}.${dica}` });
      }
      const data = await response.json();
      const imgPart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      if (!imgPart?.inlineData?.data) {
        return res.status(502).json({ error: "Gemini n\xE3o retornou imagem (poss\xEDvel bloqueio de seguran\xE7a do prompt)." });
      }
      const mime = imgPart.inlineData.mimeType ?? "image/png";
      return jsonComImagem(res, auth, imgPart.inlineData.data, mime, {
        provider: "gemini",
        status: "completed",
        mode,
        prompt
      });
    } catch (e) {
      return res.status(502).json({ error: `Gemini indispon\xEDvel: ${e instanceof Error ? e.message : "erro de rede"}` });
    }
  }
  return res.status(500).json({ error: "Nenhuma API dispon\xEDvel" });
}
async function statusHandler(req, res) {
  const { job_id } = req.query;
  const fluxKey = process.env.FLUX_API_KEY;
  if (!fluxKey) return res.status(500).json({ error: "FLUX_API_KEY n\xE3o configurada" });
  if (!job_id) return res.status(400).json({ error: "job_id obrigat\xF3rio" });
  const response = await fetch(`${FLUXAPI_STATUS}?taskId=${job_id}`, {
    headers: { Authorization: `Bearer ${fluxKey.trim()}` }
  });
  if (!response.ok) {
    return res.status(502).json({ error: "Erro ao consultar FluxAPI" });
  }
  const json = await response.json().catch(() => ({}));
  const flag = json.data?.successFlag;
  const url = json.data?.response?.resultImageUrl;
  if (flag === 1 && url) {
    return res.json({ status: "completed", url });
  }
  if (flag === 2 || flag === 3) {
    return res.json({ status: "error", error: "FluxAPI n\xE3o conseguiu gerar a imagem." });
  }
  return res.json({ status: "processing" });
}
async function render3dEnqueueHandler(req, res) {
  const { job_id } = req.body ?? {};
  if (!job_id) return res.status(400).json({ error: "job_id obrigat\xF3rio" });
  const modalUrl = process.env.MODAL_RENDER_ENQUEUE_URL;
  if (!modalUrl) {
    return res.status(500).json({
      error: "Render 3D (Blender) ainda n\xE3o foi implantado. Rode 'modal deploy render-worker/modal_app.py' e configure MODAL_RENDER_ENQUEUE_URL nas vari\xE1veis de ambiente da Vercel com a URL do endpoint /enqueue."
    });
  }
  try {
    const response = await fetch(modalUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      return res.status(502).json({ error: `Modal (HTTP ${response.status}): ${data.erro ?? "falha ao acionar o worker"}` });
    }
    return res.json({ ok: true, job_id });
  } catch (e) {
    return res.status(502).json({ error: `Worker de render indispon\xEDvel: ${e instanceof Error ? e.message : "erro de rede"}` });
  }
}
export {
  config,
  handler as default
};
