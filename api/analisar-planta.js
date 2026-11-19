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
async function urlParaModelo(opts) {
  if (opts.url && isSupabaseHttpsUrl(opts.url)) {
    const looksPdf = (opts.mime ?? "").includes("pdf") || /\.pdf(\?|$)/i.test(opts.url);
    if (!looksPdf) return opts.url;
    const inline = await baixarMidiaPermitida(opts.url);
    if (!inline) return null;
    return `data:${inline.mime};base64,${inline.data}`;
  }
  if (!opts.b64) return null;
  const raw = stripDataUrl(opts.b64);
  if (!raw || raw.length > MAX_B64_CHARS) return null;
  const mime = opts.mime || detectMime(raw);
  return `data:${mime};base64,${raw}`;
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

// src/server/http/analisar-planta.ts
var config = { maxDuration: 30 };
var SYSTEM = `Voc\xEA \xE9 especialista em leitura de plantas baixas residenciais e comerciais brasileiras.
Analise a planta baixa e extraia com precis\xE3o as dimens\xF5es do ambiente e a posi\xE7\xE3o exata de cada porta e janela.

RETORNE APENAS JSON v\xE1lido (sem markdown):
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
  "observacoes": "Ambiente retangular com boa ilumina\xE7\xE3o natural."
}

REGRAS CR\xCDTICAS:
- "parede" usa os valores: "top" (fundo/fundos), "bottom" (frente/entrada), "left" (esquerda), "right" (direita) \u2014 vista de cima, como planta baixa
- "x_pct" = posi\xE7\xE3o do CENTRO do elemento ao longo da parede, de 0.0 (in\xEDcio) a 1.0 (fim)
- "largura_cm" = largura do v\xE3o (porta ou janela) em cent\xEDmetros
- "altura_cm" = p\xE9-direito do ambiente. Se n\xE3o estiver claro na planta, use 270cm
- Identifique a parede de entrada como "bottom", a parede de fundo como "top"
- "espaco_util_cm" = largura_cm menos vigas, colunas e elementos fixos que saem da parede. Portas e janelas N\xC3O reduzem espaco_util_cm pois o m\xF3vel pode ir ao lado
- Se a escala n\xE3o estiver clara, estime pelas propor\xE7\xF5es visuais e cotas desenhadas
- Nomeie as paredes A, B, C, D no sentido hor\xE1rio a partir da parede de entrada (bottom)`;
async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const auth = await requireUser(req, res);
  if (!auth) return;
  const body = req.body;
  if (body.modo === "foto" || body.referencia) {
    return analisarFotoParede(body, res);
  }
  const { ambiente } = body;
  const imagemUrl = await urlParaModelo({
    url: body.planta_url ?? body.imagem_url,
    b64: body.planta_b64 ?? body.imagem_b64
  });
  if (!imagemUrl) return res.status(400).json({ error: "Imagem da planta n\xE3o fornecida" });
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY n\xE3o configurada" });
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
                text: `Analise esta planta baixa${ambiente ? ` do ambiente: ${ambiente}` : ""}. Extraia com precis\xE3o: dimens\xF5es do ambiente, posi\xE7\xE3o e tamanho de cada porta e janela (em qual parede e em que ponto x_pct ao longo da parede), e espa\xE7o \xFAtil de cada parede.`
              },
              {
                type: "image_url",
                image_url: { url: imagemUrl, detail: "high" }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });
    if (!r.ok) throw new Error(await r.text());
    const d = await r.json();
    const result = JSON.parse(d.choices[0].message.content);
    result.analisado_em = (/* @__PURE__ */ new Date()).toISOString();
    const toP = (s) => ["top", "bottom", "left", "right"].includes(s) ? s : "bottom";
    const largura = result.largura_cm;
    const profundidade = result.profundidade_cm;
    const altura = result.altura_cm || 270;
    const buildSeg = (comprimento) => [{
      inicio_cm: 0,
      fim_cm: comprimento,
      comprimento_cm: comprimento,
      altura_util_cm: altura,
      bloqueado_por_janela_baixa: false
    }];
    const aberturasPorParede = {
      top: [],
      bottom: [],
      left: [],
      right: []
    };
    if (result.porta_principal) {
      const p = result.porta_principal;
      const par = toP(p.parede);
      const comp = par === "top" || par === "bottom" ? largura : profundidade;
      aberturasPorParede[par].push({
        id: "porta_principal",
        _tipo: "porta",
        parede: par,
        posicao_cm: Math.round(p.x_pct * comp),
        largura_cm: p.largura_cm,
        subtipo: "simples",
        altura_cm: 210,
        zona_exclusao_cm: 90,
        lado_dobradica: "esquerda",
        sentido_abertura: "para_dentro"
      });
    }
    (result.janelas || []).forEach((j, i) => {
      const par = toP(j.parede);
      const comp = par === "top" || par === "bottom" ? largura : profundidade;
      aberturasPorParede[par].push({
        id: `janela_${i}`,
        _tipo: "janela",
        parede: par,
        posicao_cm: Math.round(j.x_pct * comp),
        largura_cm: j.largura_cm,
        subtipo: "abrir",
        altura_peitoril_cm: 100,
        altura_verga_cm: altura - 30,
        bloqueia_base: false,
        bloqueia_aereo: false
      });
    });
    const buildParede = (id, comprimento) => ({
      id,
      comprimento_cm: comprimento,
      espessura_cm: 15,
      altura_cm: altura,
      aberturas: aberturasPorParede[id] || [],
      segmentos_livres: buildSeg(comprimento),
      obstaculos_adjacentes: []
    });
    const ambiente_geometrico = {
      id: `amb_${Date.now()}`,
      dimensoes: {
        largura_cm: largura,
        profundidade_cm: profundidade,
        altura_cm: altura,
        area_m2: Math.round(largura * profundidade / 1e4 * 100) / 100
      },
      paredes: {
        top: buildParede("top", largura),
        bottom: buildParede("bottom", largura),
        left: buildParede("left", profundidade),
        right: buildParede("right", profundidade)
      },
      obstaculos: [],
      pontos_eletricos: [],
      pontos_hidraulicos: [],
      fonte: "imagem",
      escala_detectada: null,
      confianca_extracao: 0.7,
      extraido_em: result.analisado_em
    };
    return res.json({ ...result, ambiente_geometrico });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erro ao analisar planta" });
  }
}
var REFS_FOTO = {
  a4: "uma folha de papel A4 (21cm de largura por 29,7cm de altura) colada/apoiada na parede",
  regua: "uma r\xE9gua de 30cm",
  porta: "a folha de uma porta padr\xE3o (80cm de largura por 210cm de altura)"
};
async function analisarFotoParede(body, res) {
  const ref = REFS_FOTO[body.referencia ?? "a4"] ?? REFS_FOTO.a4;
  const inline = await inlineParaGemini({
    url: body.imagem_url ?? body.planta_url,
    b64: body.imagem_b64 ?? body.planta_b64
  });
  if (!inline) return res.status(400).json({ error: "Foto da parede n\xE3o fornecida (imagem_b64 ou imagem_url)." });
  const geminiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!geminiKey) return res.status(500).json({ error: "GEMINI_API_KEY n\xE3o configurada" });
  const prompt = `Voc\xEA \xE9 um especialista em medi\xE7\xE3o de ambientes para marcenaria.
Na foto h\xE1 ${ref} como REFER\xCANCIA DE ESCALA. Use essa refer\xEAncia para estimar as
medidas REAIS da parede principal vis\xEDvel na foto.

Estime, em cent\xEDmetros:
- largura_cm: largura (horizontal) da parede vis\xEDvel
- altura_cm: altura (p\xE9-direito) da parede vis\xEDvel
Detecte tamb\xE9m:
- porta: true se h\xE1 uma porta nesta parede
- janela: true se h\xE1 uma janela nesta parede
- confianca: "alta" | "media" | "baixa"
- observacao: 1 frase curta se algo atrapalhou a medi\xE7\xE3o

Use SOMENTE a refer\xEAncia para calcular; se ela n\xE3o estiver clara, confianca="baixa".
Responda APENAS JSON v\xE1lido, sem markdown:
{"largura_cm":380,"altura_cm":270,"porta":false,"janela":true,"confianca":"media","observacao":""}`;
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey.trim()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: inline.mime, data: inline.data } }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
        })
      }
    );
    if (!r.ok) return res.status(502).json({ error: `Gemini (HTTP ${r.status}): ${(await r.text()).slice(0, 200)}` });
    const d = await r.json();
    const txt = d.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
    if (!txt) return res.status(502).json({ error: "Gemini n\xE3o retornou an\xE1lise (poss\xEDvel bloqueio da imagem)." });
    const out = JSON.parse(txt);
    out.largura_cm = Math.max(50, Math.min(1500, Math.round(out.largura_cm || 0)));
    out.altura_cm = Math.max(180, Math.min(400, Math.round(out.altura_cm || 270)));
    return res.json(out);
  } catch (e) {
    return res.status(502).json({ error: `Falha ao analisar a foto: ${e instanceof Error ? e.message : "erro"}` });
  }
}
export {
  config,
  handler as default
};
