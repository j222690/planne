export type AIMessage = { role: "user" | "assistant"; content: string };

export type AIConfig = {
  system?: string;
  messages: AIMessage[];
  max_tokens?: number;
  temperature?: number;
};

export async function askAI(config: AIConfig): Promise<{ text: string; provider: "groq" | "openai" }> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" })) as { error: string };
    throw new Error(err.error ?? "Erro ao chamar IA");
  }

  return res.json() as Promise<{ text: string; provider: "groq" | "openai" }>;
}
