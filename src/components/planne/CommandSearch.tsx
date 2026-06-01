import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { Search, Users, FileText, Folder, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getEmpresaAtual } from "@/lib/db";

type SearchResult = {
  id: string;
  label: string;
  sub?: string;
  type: "cliente" | "orcamento" | "projeto";
};

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load empresa id once
  useEffect(() => {
    getEmpresaAtual().then((e) => {
      if (e) setEmpresaId((e as { id: string }).id);
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim() || !empresaId) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.trim();
        const [clientes, orcamentos, projetos] = await Promise.all([
          supabase.from("clientes").select("id,nome,telefone").eq("empresa_id", empresaId)
            .ilike("nome", `%${q}%`).limit(5),
          supabase.from("orcamentos").select("id,numero,status,clientes(nome)").eq("empresa_id", empresaId)
            .ilike("numero", `%${q}%`).limit(5),
          supabase.from("projetos").select("id,nome,status").eq("empresa_id", empresaId)
            .ilike("nome", `%${q}%`).limit(5),
        ]);

        const all: SearchResult[] = [
          ...(clientes.data ?? []).map((c) => ({
            id: c.id, label: c.nome, sub: c.telefone ?? undefined, type: "cliente" as const,
          })),
          ...(orcamentos.data ?? []).map((o) => ({
            id: o.id, label: `Orçamento #${o.numero ?? o.id.slice(0, 6)}`,
            sub: (Array.isArray(o.clientes) ? o.clientes[0]?.nome : (o.clientes as {nome:string}|null)?.nome) ?? undefined,
            type: "orcamento" as const,
          })),
          ...(projetos.data ?? []).map((p) => ({
            id: p.id, label: p.nome, sub: p.status ?? undefined, type: "projeto" as const,
          })),
        ];
        setResults(all);
      } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, empresaId]);

  const handleSelect = (r: SearchResult) => {
    setOpen(false);
    if (r.type === "cliente") navigate({ to: "/app/clientes" });
    else if (r.type === "orcamento") navigate({ to: "/app/orcamentos" });
    else if (r.type === "projeto") navigate({ to: "/app/projetos" });
  };

  const ICONS = { cliente: Users, orcamento: FileText, projeto: Folder };
  const LABELS = { cliente: "Clientes", orcamento: "Orçamentos", projeto: "Projetos" };

  const grouped = results.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar clientes, orçamentos, projetos..."
                className="flex-1 text-[14px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
              {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>

            {query.trim() && !loading && results.length === 0 && (
              <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                Nenhum resultado para "{query}"
              </div>
            )}

            {!query.trim() && (
              <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                Digite para buscar em toda a plataforma...
                <div className="mt-1 text-[11px] opacity-60">Esc para fechar · Ctrl+K / ⌘+K para abrir</div>
              </div>
            )}

            {Object.entries(grouped).map(([type, items]) => {
              const Icon = ICONS[type as keyof typeof ICONS];
              return (
                <div key={type}>
                  <div className="px-4 py-2 text-[10.5px] uppercase tracking-wider text-muted-foreground bg-secondary/30 flex items-center gap-1.5">
                    <Icon className="size-3" /> {LABELS[type as keyof typeof LABELS]}
                  </div>
                  {items.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelect(r)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary text-left transition-colors"
                    >
                      <Icon className="size-3.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium truncate">{r.label}</div>
                        {r.sub && <div className="text-[11.5px] text-muted-foreground truncate">{r.sub}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
