import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/planne/primitives";
import {
  Sparkles, Send, Loader2, Zap, Bot,
  Users, FileText, Wallet, Folder, UserPlus,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app/ia")({
  component: IA,
});

const examples = [
  "Quais clientes temos cadastrados em Chapecó?",
  "Mostre os orçamentos aprovados",
  "Qual é o resumo financeiro do mês?",
  "Quantos projetos estão em andamento?",
  "Cadastra um novo cliente: João Silva, (49) 99999-1234, Instagram",
];

const TOOL_LABELS: Record<string, { label: string; Icon: React.ElementType }> = {
  buscar_clientes:    { label: "Buscando clientes",    Icon: Users },
  listar_orcamentos:  { label: "Listando orçamentos",  Icon: FileText },
  resumo_financeiro:  { label: "Consultando financeiro", Icon: Wallet },
  listar_projetos:    { label: "Listando projetos",    Icon: Folder },
  criar_cliente:      { label: "Criando cliente",      Icon: UserPlus },
};

interface ToolCallSummary {
  name: string;
  result: unknown;
}

interface Msg {
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
  provider?: "groq" | "openai";
  toolCalls?: ToolCallSummary[];
}

function ToolCallBadge({ tc }: { tc: ToolCallSummary }) {
  const meta = TOOL_LABELS[tc.name] ?? { label: tc.name, Icon: Sparkles };
  const { Icon } = meta;
  const hasError = tc.result && typeof tc.result === "object" && "erro" in (tc.result as object);
  return (
    <div className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md border ${
      hasError
        ? "bg-destructive/8 text-destructive border-destructive/20"
        : "bg-violet-500/8 text-violet-500 border-violet-500/20"
    }`}>
      <Icon className="size-3" />
      <span>{meta.label}</span>
      {hasError && <span className="text-destructive/70">· erro</span>}
    </div>
  );
}

function ProviderBadge({ provider }: { provider?: "groq" | "openai" }) {
  if (!provider) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-sm font-medium border ${
      provider === "groq"
        ? "bg-violet-500/8 text-violet-500 border-violet-500/20"
        : "bg-emerald-500/8 text-emerald-600 border-emerald-500/20"
    }`}>
      {provider === "groq" ? <Zap className="size-2.5" /> : <Bot className="size-2.5" />}
      {provider === "groq" ? "Groq · Llama 3.3" : "GPT-4o mini"}
    </span>
  );
}

function IA() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou o Grat, seu assistente do Planne.\n\nPosso buscar clientes, listar orçamentos, verificar o financeiro, listar projetos e cadastrar novos clientes — tudo diretamente no seu banco de dados.\n\nComo posso ajudar?",
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

    const { data: { session } } = await supabase.auth.getSession();
    const userToken = session?.access_token ?? "";

    const history = [...messages, userMsg]
      .filter((m) => !m.loading)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, userToken }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" })) as { error: string };
        throw new Error(err.error ?? "Erro no agente");
      }

      const { text: reply, toolCalls, provider } = await res.json() as {
        text: string;
        toolCalls: ToolCallSummary[];
        provider: "groq" | "openai";
      };

      setMessages((m) => [
        ...m.slice(0, -1),
        { role: "assistant", content: reply, provider, toolCalls },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m.slice(0, -1),
        {
          role: "assistant",
          content: `Não consegui processar sua solicitação.\n\nDetalhe: ${err instanceof Error ? err.message : String(err)}`,
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
        title="Grat — Assistente Planne"
        description="Consulte dados, cadastre clientes e gerencie seu negócio em linguagem natural."
      />

      <Surface padded={false} className="flex flex-col h-[calc(100vh-220px)] min-h-[520px]">
        <div className="flex-1 overflow-auto p-6 space-y-5">
          <AnimatePresence initial={false}>
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
                <div className="flex-1 min-w-0 pt-0.5 space-y-2">
                  {m.loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-[13px]">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Grat está pensando…</span>
                    </div>
                  ) : (
                    <>
                      {m.toolCalls && m.toolCalls.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {m.toolCalls.map((tc, j) => (
                            <ToolCallBadge key={j} tc={tc} />
                          ))}
                        </div>
                      )}
                      <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      {m.role === "assistant" && i > 0 && (
                        <ProviderBadge provider={m.provider} />
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
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
              placeholder="Pergunte sobre clientes, orçamentos, financeiro… (Enter para enviar)"
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
            Grat usa <span className="text-violet-500">Groq · Llama 3.3 70b</span> com acesso ao banco de dados da sua empresa
          </div>
        </div>
      </Surface>
    </>
  );
}
