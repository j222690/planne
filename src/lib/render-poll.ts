import { supabase } from "@/lib/supabase";
import { authFetch } from "@/lib/api-client";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll do Flux (/api/render?job_id). Começa em 2,5s e vai até 15s.
 * Para de vez aos 3 minutos — o intervalo fixo de 3s chegava a ~40 chamadas.
 */
export async function acompanharRenderFlux(jobId: string, timeoutMs = 3 * 60 * 1000): Promise<string | null> {
  const inicio = Date.now();
  let espera = 2500;
  while (Date.now() - inicio < timeoutMs) {
    await sleep(espera);
    try {
      const r = await authFetch(`/api/render?job_id=${encodeURIComponent(jobId)}`);
      if (!r.ok) return null;
      const s = (await r.json()) as { status?: string; url?: string; error?: string };
      if (s.status === "completed" && s.url) return s.url;
      if (s.status === "error" || s.error) return null;
    } catch {
      return null;
    }
    espera = Math.min(15000, Math.round(espera * 1.5));
  }
  return null;
}

/**
 * Poll do render 3D (linha em render3d_job, imagem no bucket renders3d).
 * O worker leva ~30–90s. Backoff de 3s até 12s, teto de 4 minutos.
 */
export async function acompanharRender3D(
  jobId: string,
  timeoutMs = 4 * 60 * 1000,
): Promise<{ ok: true; imageUrl: string } | { ok: false; error: string }> {
  const inicio = Date.now();
  let espera = 3000;
  while (Date.now() - inicio < timeoutMs) {
    await sleep(espera);
    const { data: row } = await supabase
      .from("render3d_job")
      .select("status, image_path, error")
      .eq("id", jobId)
      .single();
    if (row?.status === "completed" && row.image_path) {
      const { data: pub } = supabase.storage.from("renders3d").getPublicUrl(row.image_path);
      return { ok: true, imageUrl: pub.publicUrl };
    }
    if (row?.status === "error") {
      return { ok: false, error: row.error ?? "Erro no render" };
    }
    espera = Math.min(12000, Math.round(espera * 1.4));
  }
  return { ok: false, error: "Tempo esgotado aguardando o render." };
}
