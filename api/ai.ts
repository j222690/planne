import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { system, messages, max_tokens = 800, temperature = 0.3 } = req.body;

  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!groqKey && !openaiKey) {
    return res.status(500).json({ error: "Nenhuma chave de IA configurada" });
  }

  // Tenta Groq primeiro
  if (groqKey) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: system ? [{ role: "system", content: system }, ...messages] : messages,
          max_tokens,
          temperature,
        }),
      });

      if (response.ok) {
        const data = await response.json() as { choices: { message: { content: string } }[] };
        return res.json({ text: data.choices[0].message.content, provider: "groq" });
      }
    } catch {
      // cai no fallback
    }
  }

  // Fallback OpenAI
  if (openaiKey) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: system ? [{ role: "system", content: system }, ...messages] : messages,
        max_tokens,
        temperature,
      }),
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Erro ao chamar IA" });
    }

    const data = await response.json() as { choices: { message: { content: string } }[] };
    return res.json({ text: data.choices[0].message.content, provider: "openai" });
  }

  return res.status(500).json({ error: "Falha ao chamar IA" });
}
