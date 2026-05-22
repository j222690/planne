import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const AIRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    }),
  ),
  system: z.string().optional(),
  max_tokens: z.number().optional(),
  temperature: z.number().optional(),
});

export const callAIServer = createServerFn()
  .validator(AIRequestSchema)
  .handler(async ({ data }) => {
    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    const msgs = data.system
      ? [{ role: "system" as const, content: data.system }, ...data.messages]
      : data.messages;

    if (groqKey) {
      try {
        const res = await fetch(GROQ_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: msgs,
            max_tokens: data.max_tokens ?? 1024,
            temperature: data.temperature ?? 0.3,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          const text: string = json.choices?.[0]?.message?.content ?? "";
          return { text, provider: "groq" as const };
        }
      } catch {
        // fallthrough to openai
      }
    }

    if (!openaiKey) throw new Error("Nenhuma chave de API configurada (GROQ_API_KEY / OPENAI_API_KEY)");

    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: msgs,
        max_tokens: data.max_tokens ?? 1024,
        temperature: data.temperature ?? 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${err}`);
    }

    const json = await res.json();
    const text: string = json.choices?.[0]?.message?.content ?? "";
    return { text, provider: "openai" as const };
  });
