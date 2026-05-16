// Planne AI — usa Groq (llama-3.3-70b) como primário, GPT-4o mini como fallback
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AIConfig {
  messages: AIMessage[];
  system?: string;
  max_tokens?: number;
  temperature?: number;
}

async function callGroq(config: AIConfig): Promise<string> {
  const groqKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!groqKey) throw new Error("VITE_GROQ_API_KEY não configurada");

  const msgs = config.system
    ? [{ role: "system", content: config.system }, ...config.messages]
    : config.messages;

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: msgs,
      max_tokens: config.max_tokens ?? 1024,
      temperature: config.temperature ?? 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callOpenAI(config: AIConfig): Promise<string> {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!openaiKey) throw new Error("VITE_OPENAI_API_KEY não configurada");

  const msgs = config.system
    ? [{ role: "system", content: config.system }, ...config.messages]
    : config.messages;

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: msgs,
      max_tokens: config.max_tokens ?? 1024,
      temperature: config.temperature ?? 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * Tenta Groq primeiro (mais rápido e gratuito).
 * Se falhar (rate limit, chave ausente, erro), usa GPT-4o mini como fallback.
 */
export async function askAI(config: AIConfig): Promise<{ text: string; provider: "groq" | "openai" }> {
  try {
    const text = await callGroq(config);
    return { text, provider: "groq" };
  } catch (groqErr) {
    console.warn("[AI] Groq falhou, tentando GPT-4o mini:", groqErr);
    try {
      const text = await callOpenAI(config);
      return { text, provider: "openai" };
    } catch (openaiErr) {
      throw new Error(`Ambos os provedores falharam.\nGroq: ${groqErr}\nOpenAI: ${openaiErr}`);
    }
  }
}
