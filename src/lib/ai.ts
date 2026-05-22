import { callAIServer } from "./ai-server";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIConfig {
  messages: AIMessage[];
  system?: string;
  max_tokens?: number;
  temperature?: number;
}

export async function askAI(config: AIConfig): Promise<{ text: string; provider: "groq" | "openai" }> {
  return callAIServer({ data: config });
}
