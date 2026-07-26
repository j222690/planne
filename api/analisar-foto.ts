import type { VercelRequest, VercelResponse } from "@vercel/node";

// Estima a medida de UMA parede a partir de uma foto, usando um objeto de
// referência de escala conhecida (folha A4 = 21×29,7cm, ou régua de 30cm).
// Também detecta porta e janela na parede. É ESTIMATIVA — o marceneiro deve
// confirmar com trena antes de cortar.

function detectMime(b64: string): string {
  if (b64.startsWith("/9j")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

const REFS: Record<string, string> = {
  a4: "uma folha de papel A4 (21cm de largura por 29,7cm de altura) colada/apoiada na parede",
  regua: "uma régua de 30cm",
  porta: "a folha de uma porta padrão (80cm de largura por 210cm de altura)",
};

interface FotoAnalisada {
  largura_cm: number;
  altura_cm: number;
  porta: boolean;
  janela: boolean;
  confianca: "alta" | "media" | "baixa";
  observacao?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body as { imagem_b64?: string; referencia?: string };
  const imagem_b64 = body.imagem_b64;
  const ref = REFS[body.referencia ?? "a4"] ?? REFS.a4;
  if (!imagem_b64) return res.status(400).json({ error: "Foto da parede não fornecida (imagem_b64)." });

  const geminiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!geminiKey) return res.status(500).json({ error: "GEMINI_API_KEY não configurada" });

  const prompt = `Você é um especialista em medição de ambientes para marcenaria.
Na foto há ${ref} como REFERÊNCIA DE ESCALA. Use essa referência para estimar as
medidas REAIS da parede principal visível na foto.

Estime, em centímetros:
- largura_cm: largura (horizontal) da parede visível
- altura_cm: altura (pé-direito) da parede visível
Detecte também:
- porta: true se há uma porta nesta parede
- janela: true se há uma janela nesta parede
- confianca: "alta" | "media" | "baixa" (quão confiável é a estimativa pela referência)
- observacao: 1 frase curta se algo atrapalhou a medição (ângulo, referência longe, etc.)

Regras: use SOMENTE a referência de escala para calcular; se a referência não
estiver visível ou clara, confianca = "baixa". Não invente — prefira estimativa
conservadora. Responda APENAS JSON válido, sem markdown:
{"largura_cm": 380, "altura_cm": 270, "porta": false, "janela": true, "confianca": "media", "observacao": ""}`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey.trim()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: detectMime(imagem_b64), data: imagem_b64 } },
            ],
          }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
        }),
      },
    );

    if (!r.ok) {
      const err = await r.text();
      return res.status(502).json({ error: `Gemini (HTTP ${r.status}): ${err.slice(0, 200)}` });
    }

    const d = await r.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const txt = d.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
    if (!txt) return res.status(502).json({ error: "Gemini não retornou análise (possível bloqueio da imagem)." });

    const result = JSON.parse(txt) as FotoAnalisada;
    // sanidade: limita a valores plausíveis de ambiente
    result.largura_cm = Math.max(50, Math.min(1500, Math.round(result.largura_cm || 0)));
    result.altura_cm = Math.max(180, Math.min(400, Math.round(result.altura_cm || 270)));
    return res.json(result);
  } catch (e) {
    return res.status(502).json({ error: `Falha ao analisar a foto: ${e instanceof Error ? e.message : "erro"}` });
  }
}
