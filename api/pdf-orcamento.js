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

// src/server/http/pdf-orcamento.ts
var config = { maxDuration: 30 };
var SYSTEM = `Voc\xEA \xE9 especialista em or\xE7amentos de marcenaria planejada brasileira.
Analise o documento de or\xE7amento/proposta na imagem e extraia todos os itens.
RESPONDA APENAS com JSON v\xE1lido (sem markdown):
{
  "itens": [
    {
      "descricao": "nome do item/m\xF3vel",
      "quantidade": 1,
      "unidade": "un",
      "preco_custo": 0,
      "preco_unitario": 0
    }
  ],
  "margem_detectada": 35,
  "observacoes": "condi\xE7\xF5es comerciais detectadas",
  "total_detectado": 0
}
Use os pre\xE7os do documento como preco_unitario. Se n\xE3o houver custo, calcule como 65% do pre\xE7o (margem 35%).
Unidades comuns: un, chapa, metro, par, kit, cj.`;
async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const auth = await requireUser(req, res);
  if (!auth) return;
  const { pdf_b64, pdf_url, tipo_mime } = req.body;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY n\xE3o configurada" });
  const dataUrl = await urlParaModelo({ url: pdf_url, b64: pdf_b64, mime: tipo_mime });
  if (!dataUrl) return res.status(400).json({ error: "pdf_b64 ou pdf_url obrigat\xF3rio" });
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: "Extraia todos os itens deste or\xE7amento/proposta de marcenaria:" },
              { type: "image_url", image_url: { url: dataUrl, detail: "high" } }
            ]
          }
        ],
        max_tokens: 3e3,
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });
    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: `OpenAI: ${err.slice(0, 300)}` });
    }
    const data = await response.json();
    const extracted = JSON.parse(data.choices[0].message.content);
    return res.json(extracted);
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erro" });
  }
}
export {
  config,
  handler as default
};
