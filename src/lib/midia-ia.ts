import { supabase } from "@/lib/supabase";

const BUCKET = "ia-uploads";

export type MidiaPronta = { url?: string; b64?: string; mime: string };

async function comprimirParaJpeg(file: Blob, maxEdge: number, quality: number): Promise<Blob | null> {
  if (typeof document === "undefined") return null;
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return null;
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality));
}

async function blobParaBase64(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return dataUrl.split(",")[1] ?? "";
}

/**
 * Comprime imagem no browser e sobe direto no Supabase Storage.
 * Se o bucket ainda não existir, devolve base64 já comprimido para a rota
 * continuar aceitando o formato antigo.
 */
export async function prepararMidiaIA(
  file: Blob,
  opts?: { maxEdge?: number; quality?: number },
): Promise<MidiaPronta> {
  const tipo = file.type || "";
  const ehImagem = tipo.startsWith("image/") && tipo !== "image/svg+xml";
  let payload: Blob = file;
  let mime = tipo || "application/octet-stream";

  if (ehImagem) {
    const jpeg = await comprimirParaJpeg(file, opts?.maxEdge ?? 1600, opts?.quality ?? 0.72);
    if (jpeg && jpeg.size > 0 && jpeg.size < file.size * 1.05) {
      payload = jpeg;
      mime = "image/jpeg";
    }
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("sem sessão");
    const ext = mime === "image/jpeg" ? "jpg"
      : mime === "image/png" ? "png"
        : mime === "image/webp" ? "webp"
          : mime === "application/pdf" ? "pdf"
            : "bin";
    const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, payload, {
      contentType: mime,
      upsert: false,
    });
    if (error) throw error;
    const { data, error: signErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    if (signErr || !data?.signedUrl) throw signErr ?? new Error("sem url");
    return { url: data.signedUrl, mime };
  } catch {
    const b64 = await blobParaBase64(payload);
    return { b64, mime };
  }
}

export async function prepararDataUriIA(dataUri: string): Promise<MidiaPronta> {
  const blob = await fetch(dataUri).then((r) => r.blob());
  return prepararMidiaIA(blob, { maxEdge: 1280, quality: 0.7 });
}

export function camposImagem(prefixo: "planta" | "imagem" | "pdf" | "guia", midia: MidiaPronta | null | undefined) {
  if (!midia) return {};
  if (midia.url) return { [`${prefixo}_url`]: midia.url };
  if (midia.b64) return { [`${prefixo}_b64`]: midia.b64 };
  return {};
}
