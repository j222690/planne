import { createClient } from "@supabase/supabase-js";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_B64_CHARS = 6_000_000;

export function detectMime(b64: string): string {
  if (b64.startsWith("/9j")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("UklGR")) return "image/webp";
  if (b64.startsWith("JVBER")) return "application/pdf";
  return "image/jpeg";
}

export function stripDataUrl(value: string): string {
  return value.replace(/^data:[^;]+;base64,/, "");
}

/** Só aceita URL do próprio Supabase — evita que a função busque host arbitrário. */
export function isSupabaseHttpsUrl(url: string): boolean {
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

/**
 * URL que a OpenAI pode buscar direto (imagem no Storage) ou data-URL legado.
 * PDF continua inline: o endpoint de visão não busca application/pdf por URL.
 */
export async function urlParaModelo(opts: {
  url?: string | null;
  b64?: string | null;
  mime?: string | null;
}): Promise<string | null> {
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

export async function baixarMidiaPermitida(url: string): Promise<{ data: string; mime: string } | null> {
  if (!isSupabaseHttpsUrl(url)) return null;
  const response = await fetch(url);
  if (!response.ok) return null;
  const buf = Buffer.from(await response.arrayBuffer());
  if (buf.length === 0 || buf.length > MAX_BYTES) return null;
  const mime = (response.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
  return { data: buf.toString("base64"), mime };
}

/** Gemini generateContent pede a imagem inline. Baixa do Storage quando vier URL. */
export async function inlineParaGemini(opts: {
  url?: string | null;
  b64?: string | null;
  mime?: string | null;
}): Promise<{ data: string; mime: string } | null> {
  if (opts.url && isSupabaseHttpsUrl(opts.url)) return baixarMidiaPermitida(opts.url);
  if (!opts.b64) return null;
  const raw = stripDataUrl(opts.b64);
  if (!raw || raw.length > MAX_B64_CHARS) return null;
  return { data: raw, mime: opts.mime || detectMime(raw) };
}

/**
 * Grava o render no Storage e devolve a URL pública. Se o bucket/policy ainda
 * não existir, devolve null e o chamador mantém o data-URL (a tela continua funcionando).
 */
export async function publicarImagemRender(
  token: string,
  userId: string,
  base64: string,
  mime: string,
): Promise<string | null> {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key || !base64) return null;

  const sb = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const path = `${userId}/renders/${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length === 0 || bytes.length > MAX_BYTES) return null;
  const blob = new Blob([bytes], { type: mime || "image/png" });

  const { error } = await sb.storage.from("ia-uploads").upload(path, blob, {
    contentType: mime || "image/png",
    upsert: false,
  });
  if (error) return null;
  const { data } = sb.storage.from("ia-uploads").getPublicUrl(path);
  return data.publicUrl || null;
}
