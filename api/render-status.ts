import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { job_id } = req.query;
  const fluxKey = process.env.FLUX_API_KEY;

  if (!fluxKey) return res.status(500).json({ error: "FLUX_API_KEY não configurada" });
  if (!job_id) return res.status(400).json({ error: "job_id obrigatório" });

  const response = await fetch(`https://api.bfl.ml/v1/get_result?id=${job_id}`, {
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
