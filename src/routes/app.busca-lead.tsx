import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/planne/primitives";
import { Search, Loader2, Mail, Phone, MapPin, UserPlus, Users, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getClientes, getEmpresaAtual, upsertCliente } from "@/lib/db";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export const Route = createFileRoute("/app/busca-lead")({
  component: BuscaLead,
});

type Lead = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  origem: string | null;
  created_at: string;
};

const novoSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido").or(z.literal("")).optional(),
  telefone: z.string().optional(),
  cidade: z.string().optional(),
  origem: z.string().optional(),
});
type NovoForm = z.infer<typeof novoSchema>;

const origens = ["Indicação", "Instagram", "Google", "Facebook", "Direto", "Arquiteto parceiro", "Outro"];

function NovoLeadModal({ onClose, onSaved }: { onClose: () => void; onSaved: (nome: string) => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NovoForm>({
    resolver: zodResolver(novoSchema),
  });

  const onSubmit = async (data: NovoForm) => {
    try {
      const empresa = await getEmpresaAtual();
      if (!empresa) throw new Error("Empresa não encontrada");
      await upsertCliente((empresa as { id: string }).id, data);
      onSaved(data.nome);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao cadastrar");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-md bg-surface border border-border rounded-lg shadow-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-[15px] font-semibold">Novo lead</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Cadastre um potencial cliente</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-3">
          <div>
            <div className="text-[11.5px] text-muted-foreground mb-1">Nome *</div>
            <input
              {...register("nome")}
              placeholder="Nome completo ou empresa"
              className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong"
            />
            {errors.nome && <div className="text-[11px] text-destructive mt-1">{errors.nome.message}</div>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Telefone / WhatsApp</div>
              <input
                {...register("telefone")}
                placeholder="+55 49 9..."
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong"
              />
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Cidade</div>
              <input
                {...register("cidade")}
                placeholder="Chapecó"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong"
              />
            </div>
          </div>
          <div>
            <div className="text-[11.5px] text-muted-foreground mb-1">E-mail</div>
            <input
              {...register("email")}
              type="email"
              placeholder="contato@email.com"
              className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong"
            />
            {errors.email && <div className="text-[11px] text-destructive mt-1">{errors.email.message}</div>}
          </div>
          <div>
            <div className="text-[11.5px] text-muted-foreground mb-1">Canal de origem</div>
            <select
              {...register("origem")}
              className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground"
            >
              <option value="">Selecione...</option>
              {origens.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              Cadastrar lead
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function BuscaLead() {
  const [query, setQuery] = useState("");
  const [todos, setTodos] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const empresa = await getEmpresaAtual();
      if (!empresa) return;
      const data = await getClientes((empresa as { id: string }).id);
      setTodos(data as Lead[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    inputRef.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();
  const results = q === ""
    ? todos
    : todos.filter((c) =>
        c.nome.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.telefone ?? "").toLowerCase().includes(q) ||
        (c.cidade ?? "").toLowerCase().includes(q) ||
        (c.origem ?? "").toLowerCase().includes(q)
      );

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <NovoLeadModal
            onClose={() => setShowModal(false)}
            onSaved={(nome) => {
              toast.success(`Lead "${nome}" cadastrado!`);
              load();
            }}
          />
        )}
      </AnimatePresence>

      <PageHeader
        eyebrow="CRM"
        title="Busca de Leads"
        description="Encontre e gerencie leads e clientes em potencial."
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <UserPlus className="size-3.5" /> Novo lead
          </button>
        }
      />

      <Surface padded={false}>
        {/* Search bar */}
        <div className="p-4 border-b border-border">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, email, telefone, cidade ou origem..."
              className="w-full h-10 pl-10 pr-4 rounded-md border border-border bg-surface-2 text-[14px] outline-none focus:border-border-strong transition"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="mt-2 text-[11.5px] text-muted-foreground">
            {loading ? "Carregando..." : `${results.length} de ${todos.length} leads`}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-[13px]">
            <Loader2 className="size-4 animate-spin" /> Carregando leads...
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="size-10 mb-3 opacity-30" />
            <div className="text-[14px] font-medium text-foreground">
              {q ? "Nenhum lead encontrado" : "Nenhum lead cadastrado"}
            </div>
            <div className="text-[13px] mt-1">
              {q ? `Sem resultados para "${query}"` : "Cadastre o primeiro lead"}
            </div>
            {!q && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5"
              >
                <UserPlus className="size-3.5" /> Novo lead
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {results.map((lead) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/40 cursor-pointer group"
                onClick={() => navigate({ to: "/app/clientes" })}
              >
                <div className="size-9 rounded-md bg-secondary text-foreground/70 grid place-items-center text-[12px] font-semibold shrink-0">
                  {lead.nome.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[13.5px] truncate">{lead.nome}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {lead.email && (
                      <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                        <Mail className="size-3" />{lead.email}
                      </span>
                    )}
                    {lead.telefone && (
                      <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                        <Phone className="size-3" />{lead.telefone}
                      </span>
                    )}
                    {lead.cidade && (
                      <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                        <MapPin className="size-3" />{lead.cidade}
                      </span>
                    )}
                  </div>
                </div>
                {lead.origem && (
                  <span className="hidden sm:block text-[11.5px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-sm shrink-0">
                    {lead.origem}
                  </span>
                )}
                <div className="text-[11px] text-muted-foreground shrink-0">
                  {new Date(lead.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Surface>
    </>
  );
}
