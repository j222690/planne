import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/planne/primitives";
import { Sparkles, Send, Loader2, Zap, Bot } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { askAI, type AIMessage } from "@/lib/ai";

export const Route = createFileRoute("/app/ia")({
  component: IA,
});

const examples = [
  "Guarda-roupa casal 2,40m com 6 portas, MDF amadeirado",
  "Cozinha em L 3,80m × 2,60m com torre de forno",
  "Closet master 4m com gaveteiros internos",
  "Estante TV suspensa 3,2m com nichos e iluminação LED",
];

const SYSTEM = `Você é o Assistente Planne, especialista em marcenaria planejada brasileira.
Quando o usuário descrever um móvel, responda com:
1. Análise estrutural (módulos, portas, organização interna)
2. Lista de materiais estimada com quantidades e custos aproximados em R$
3. Custo total, margem recomendada (%) e preço de venda sugerido

Use valores de mercado para Chapecó/SC em 2025. Responda em português, de forma concisa e estruturada.`;

interface Msg {
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
  provider?: "groq" | "openai";
}

function ProviderBadge({ provider }: { provider?: "groq" | "openai" }) {
  if (!provider) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-sm font-medium border ml-2 ${
      provider === "groq"
        ? "bg-violet-500/8 text-violet-500 border-violet-500/20"
        : "bg-emerald-500/8 text-emerald-600 border-emerald-500/20"
    }`}>
      {provider === "groq" ? <Zap className="size-2.5" /> : <Bot className="size-2.5" />}
      {provider === "groq" ? "Groq" : "GPT-4o mini"}
    </span>
  );
}

function IA() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Olá! Descreva um móvel em linguagem natural — vou interpretar as medidas, sugerir a estrutura, calcular chapas e ferragens, estimar o desperdício e propor a margem ideal.\n\nUso Groq (Llama 3.3) para velocidade e GPT-4o mini como fallback automático.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Msg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg, { role: "assistant", content: "", loading: true }]);
    setInput("");
    setLoading(true);

    // Monta histórico no formato AIMessage (sem o placeholder)
    const history: AIMessage[] = [...messages, userMsg]
      .filter((m) => !m.loading)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const { text: reply, provider } = await askAI({
        system: SYSTEM,
        messages: history,
        max_tokens: 1024,
        temperature: 0.3,
      });

      setMessages((m) => [
        ...m.slice(0, -1),
        { role: "assistant", content: reply, provider },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m.slice(0, -1),
        {
          role: "assistant",
          content: `Não consegui gerar uma resposta. Verifique se as chaves VITE_GROQ_API_KEY e VITE_OPENAI_API_KEY estão no seu arquivo .env.\n\nDetalhe: ${err instanceof Error ? err.message : String(err)}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Inteligência"
        title="Assistente Planne"
        description="Pré-projetos, listas de materiais e cálculos — em linguagem natural."
      />

      <Surface padded={false} className="flex flex-col h-[calc(100vh-220px)] min-h-[520px]">
        <div className="flex-1 overflow-auto p-6 space-y-5">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-3"
            >
              <div
                className={`size-7 shrink-0 rounded-md grid place-items-center text-[11px] font-semibold ${
                  m.role === "user"
                    ? "bg-foreground text-background"
                    : "bg-accent/10 text-accent border border-accent/20"
                }`}
              >
                {m.role === "user" ? "EU" : <Sparkles className="size-3.5" />}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                {m.loading ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground mt-1" />
                ) : (
                  <>
                    <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    {m.role === "assistant" && i > 0 && (
                      <ProviderBadge provider={m.provider} />
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-6 pb-3 flex flex-wrap gap-2">
            {examples.map((e) => (
              <button
                key={e}
                onClick={() => send(e)}
                className="text-[12px] border border-border rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              >
                {e}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2 rounded-md border border-border bg-surface-2 focus-within:border-border-strong p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Descreva o móvel ou o ambiente… (Enter para enviar)"
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-[14px] py-1.5 placeholder:text-muted-foreground"
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="h-8 px-3 rounded-md bg-foreground text-background text-[12.5px] font-medium inline-flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="size-3.5" /> Enviar
                </>
              )}
            </button>
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground px-1">
            Primário: <span className="text-violet-500">Groq · Llama 3.3 70b</span> — Fallback: <span className="text-emerald-600">GPT-4o mini</span>
          </div>
        </div>
      </Surface>
    </>
  );
}
