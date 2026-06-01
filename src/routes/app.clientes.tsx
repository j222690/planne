import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/planne/primitives";
import { Plus, Mail, Phone, MoreHorizontal, Search, Loader2, AlertCircle, X, Pencil, Trash2, CheckCircle2, Circle, CalendarClock, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getClientes, getEmpresaAtual, upsertCliente, updateCliente, deleteCliente } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/app/clientes")({
  component: Clientes,
});

type Cliente = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  origem: string | null;
  cidade: string | null;
  observacoes: string | null;
};

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido").or(z.literal("")).optional(),
  telefone: z.string().optional(),
  cidade: z.string().optional(),
  origem: z.string().optional(),
  observacoes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const origens = ["Indicação", "Instagram", "Google", "Facebook", "Direto", "Arquiteto parceiro", "Outro"];

function ClienteModal({
  onClose, onSaved, initialData,
}: {
  onClose: () => void; onSaved: () => void; initialData?: Cliente;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      nome: initialData.nome,
      email: initialData.email ?? "",
      telefone: initialData.telefone ?? "",
      cidade: initialData.cidade ?? "",
      origem: initialData.origem ?? "",
      observacoes: initialData.observacoes ?? "",
    } : {},
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (initialData) {
        await updateCliente(initialData.id, data);
        toast.success("Cliente atualizado!");
      } else {
        const empresa = await getEmpresaAtual();
        if (!empresa) throw new Error("Empresa não encontrada");
        await upsertCliente((empresa as { id: string }).id, data);
        toast.success("Cliente cadastrado com sucesso!");
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar cliente");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-lg bg-surface border border-border rounded-lg shadow-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-[15px] font-semibold">{initialData ? "Editar cliente" : "Novo cliente"}</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Preencha os dados do cliente</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome completo / Razão social *</Label>
              <Input {...register("nome")} placeholder="Família Mendes" error={errors.nome?.message} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input {...register("email")} type="email" placeholder="contato@email.com" error={errors.email?.message} />
            </div>
            <div>
              <Label>Telefone / WhatsApp</Label>
              <Input {...register("telefone")} placeholder="+55 49 99999-9999" />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input {...register("cidade")} placeholder="Chapecó" />
            </div>
            <div>
              <Label>Como nos conheceu</Label>
              <select
                {...register("origem")}
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong text-foreground"
              >
                <option value="">Selecione...</option>
                {origens.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <Label>Observações</Label>
              <textarea
                {...register("observacoes")}
                rows={2}
                placeholder="Preferências, restrições, referências..."
                className="w-full rounded-md border border-border bg-surface-2 px-2.5 py-2 text-[13px] outline-none focus:border-border-strong resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-secondary transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {initialData ? "Salvar alterações" : "Salvar cliente"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function RowMenu({ cliente, onEdit, onDeleted }: { cliente: Cliente; onEdit: () => void; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleDelete = () => {
    setOpen(false);
    toast(`Excluir "${cliente.nome}"?`, {
      action: {
        label: "Excluir",
        onClick: async () => {
          try {
            await deleteCliente(cliente.id);
            toast.success("Cliente excluído");
            onDeleted();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao excluir");
          }
        },
      },
      cancel: { label: "Cancelar", onClick: () => {} },
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="text-muted-foreground hover:text-foreground p-1 rounded"
        aria-label="Mais opções"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[130px]">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-[12.5px] hover:bg-secondary text-foreground"
          >
            <Pencil className="size-3.5" /> Editar
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-[12.5px] hover:bg-secondary text-destructive"
          >
            <Trash2 className="size-3.5" /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}

function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [detalhe, setDetalhe] = useState<Cliente | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const empresa = await getEmpresaAtual();
      if (!empresa) throw new Error("Empresa não encontrada");
      const eid = (empresa as { id: string }).id;
      setEmpresaId(eid);
      const data = await getClientes(eid);
      setClientes(data as Cliente[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = clientes.filter((c) =>
    search === "" ||
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.cidade ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.origem ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <AnimatePresence>
        {(showModal || editando) && (
          <ClienteModal
            onClose={() => { setShowModal(false); setEditando(null); }}
            onSaved={load}
            initialData={editando ?? undefined}
          />
        )}
        {detalhe && !editando && (
          <ClienteDetalhePanel
            cliente={detalhe}
            empresaId={empresaId}
            onClose={() => setDetalhe(null)}
            onEdit={() => { setEditando(detalhe); setDetalhe(null); }}
          />
        )}
      </AnimatePresence>

      <PageHeader
        eyebrow="CRM"
        title="Clientes"
        description="Histórico unificado de clientes, projetos, comunicações e financeiro."
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <Plus className="size-3.5" /> Novo cliente
          </button>
        }
      />

      <Surface padded={false}>
        <div className="border-b border-border p-3 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full h-8 pl-8 pr-3 rounded-md border border-border bg-surface-2 text-[13px] outline-none focus:border-border-strong"
            />
          </div>
          {!loading && <div className="ml-auto text-[12px] text-muted-foreground">{filtered.length} clientes</div>}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-[13px]">
            <Loader2 className="size-4 animate-spin" /> Carregando...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 gap-2 text-destructive text-[13px]">
            <AlertCircle className="size-4" /> {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[560px]">
              <thead className="text-[11.5px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left font-medium px-5 py-2.5">Cliente</th>
                  <th className="text-left font-medium px-5 py-2.5">Contato</th>
                  <th className="text-left font-medium px-5 py-2.5">Cidade</th>
                  <th className="text-left font-medium px-5 py-2.5">Origem</th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                      {clientes.length === 0
                        ? <span>Nenhum cliente ainda. <button onClick={() => setShowModal(true)} className="text-foreground underline">Cadastrar primeiro cliente →</button></span>
                        : "Nenhum resultado encontrado."}
                    </td>
                  </tr>
                ) : filtered.map((c) => (
                  <tr key={c.id} onClick={() => setDetalhe(c)} className="border-b border-border last:border-0 hover:bg-secondary/40 cursor-pointer group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-md bg-secondary text-foreground/70 grid place-items-center text-[11.5px] font-semibold shrink-0">
                          {c.nome.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                        </div>
                        <div className="font-medium truncate max-w-[180px]">{c.nome}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                          <Mail className="size-3 shrink-0" /><span className="truncate max-w-[160px]">{c.email}</span>
                        </a>
                      )}
                      {c.telefone && (
                        <a href={`tel:${c.telefone}`} className="flex items-center gap-1.5 mt-0.5 hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                          <Phone className="size-3 shrink-0" />{c.telefone}
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{c.cidade ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{c.origem ?? "—"}</td>
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <RowMenu cliente={c} onEdit={() => setEditando(c)} onDeleted={load} />
                        <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
    </>
  );
}

type Atividade = {
  id: string; tipo: string; titulo: string; descricao: string | null;
  data_atividade: string | null; concluida: boolean; created_at: string;
};

const TIPO_ATIV: Record<string, string> = {
  ligacao: "Ligação", visita: "Visita", email: "E-mail",
  whatsapp: "WhatsApp", reuniao: "Reunião",
  manutencao: "Manutenção / Pós-venda", outro: "Outro",
};

function ClienteDetalhePanel({ cliente, empresaId, onClose, onEdit }: {
  cliente: Cliente; empresaId: string | null; onClose: () => void; onEdit: () => void;
}) {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loadingAtiv, setLoadingAtiv] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [novoTipo, setNovoTipo] = useState("ligacao");
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaData, setNovaData] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAtividades = async () => {
    setLoadingAtiv(true);
    const { data } = await supabase.from("atividades")
      .select("*").eq("cliente_id", cliente.id)
      .order("data_atividade", { ascending: false });
    setAtividades((data ?? []) as Atividade[]);
    setLoadingAtiv(false);
  };

  useEffect(() => { loadAtividades(); }, [cliente.id]);

  const handleAdd = async () => {
    if (!novoTitulo.trim() || !empresaId) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from("atividades").insert({
        empresa_id: empresaId, cliente_id: cliente.id,
        usuario_id: session?.user.id,
        tipo: novoTipo, titulo: novoTitulo,
        data_atividade: novaData || new Date().toISOString(),
        concluida: false,
      });
      if (error) throw error;
      setNovoTitulo(""); setNovaData(""); setShowForm(false);
      toast.success("Atividade registrada!"); loadAtividades();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setSaving(false); }
  };

  const toggleConcluida = async (a: Atividade) => {
    await supabase.from("atividades").update({ concluida: !a.concluida }).eq("id", a.id);
    setAtividades((prev) => prev.map((x) => x.id === a.id ? { ...x, concluida: !x.concluida } : x));
  };

  const pendentes = atividades.filter((a) => !a.concluida).length;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="relative w-full max-w-sm bg-surface border-l border-border shadow-2xl flex flex-col h-full"
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <div className="size-10 rounded-lg bg-secondary text-foreground/70 grid place-items-center text-[13px] font-semibold mb-2">
              {cliente.nome.split(" ").map((s) => s[0]).slice(0, 2).join("")}
            </div>
            <div className="text-[15px] font-semibold">{cliente.nome}</div>
            <div className="text-[12px] text-muted-foreground">{cliente.origem ?? "—"} · {cliente.cidade ?? "—"}</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-1"><X className="size-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Contato */}
          <div className="space-y-1.5">
            {cliente.email && (
              <a href={`mailto:${cliente.email}`} className="flex items-center gap-2 text-[12.5px] text-muted-foreground hover:text-foreground">
                <Mail className="size-3.5" /> {cliente.email}
              </a>
            )}
            {cliente.telefone && (
              <a href={`tel:${cliente.telefone}`} className="flex items-center gap-2 text-[12.5px] text-muted-foreground hover:text-foreground">
                <Phone className="size-3.5" /> {cliente.telefone}
              </a>
            )}
            {cliente.observacoes && (
              <div className="text-[12px] text-muted-foreground mt-2 p-2 rounded bg-secondary">{cliente.observacoes}</div>
            )}
          </div>

          {/* Atividades */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <CalendarClock className="size-3.5 text-muted-foreground" />
                <span className="text-[12.5px] font-medium">Atividades</span>
                {pendentes > 0 && (
                  <span className="text-[10.5px] bg-accent text-white px-1.5 py-0.5 rounded-full">{pendentes}</span>
                )}
              </div>
              <button onClick={() => setShowForm((v) => !v)}
                className="h-6 px-2 rounded border border-border text-[11px] hover:bg-secondary inline-flex items-center gap-1">
                <Plus className="size-3" /> Nova
              </button>
            </div>

            {showForm && (
              <div className="mb-3 p-3 rounded-md border border-border bg-surface-2 space-y-2">
                <div className="flex gap-2">
                  <select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)}
                    className="h-8 rounded border border-border bg-surface px-2 text-[12px] outline-none">
                    {Object.entries(TIPO_ATIV).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <input type="datetime-local" value={novaData} onChange={(e) => setNovaData(e.target.value)}
                    className="flex-1 h-8 rounded border border-border bg-surface px-2 text-[12px] outline-none" />
                </div>
                <input value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)}
                  placeholder="Descrição da atividade..." onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="w-full h-8 rounded border border-border bg-surface px-2.5 text-[12px] outline-none focus:border-border-strong" />
                <div className="flex justify-end gap-1.5">
                  <button onClick={() => setShowForm(false)} className="h-7 px-2.5 rounded border border-border text-[11px] hover:bg-secondary">Cancelar</button>
                  <button onClick={handleAdd} disabled={saving || !novoTitulo.trim()}
                    className="h-7 px-2.5 rounded bg-foreground text-background text-[11px] font-medium disabled:opacity-60">
                    {saving ? <Loader2 className="size-3 animate-spin" /> : "Salvar"}
                  </button>
                </div>
              </div>
            )}

            {loadingAtiv ? (
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-2">
                <Loader2 className="size-3.5 animate-spin" /> Carregando...
              </div>
            ) : atividades.length === 0 ? (
              <div className="text-[12px] text-muted-foreground text-center py-4 border border-dashed border-border rounded-md">
                Nenhuma atividade. <button onClick={() => setShowForm(true)} className="text-foreground underline">Registrar →</button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {atividades.map((a) => (
                  <div key={a.id} className={`flex items-start gap-2.5 p-2.5 rounded-md border transition-colors ${a.concluida ? "border-border/50 opacity-60" : "border-border hover:bg-secondary/50"}`}>
                    <button onClick={() => toggleConcluida(a)} className="mt-0.5 shrink-0">
                      {a.concluida
                        ? <CheckCircle2 className="size-4 text-emerald-500" />
                        : <Circle className="size-4 text-muted-foreground" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[12.5px] font-medium leading-tight ${a.concluida ? "line-through" : ""}`}>{a.titulo}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {TIPO_ATIV[a.tipo] ?? a.tipo}
                        {a.data_atividade && ` · ${new Date(a.data_atividade).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border shrink-0">
          <button onClick={onEdit}
            className="w-full h-9 rounded-md border border-border text-[13px] hover:bg-secondary inline-flex items-center justify-center gap-2">
            <Pencil className="size-3.5" /> Editar cliente
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11.5px] text-muted-foreground mb-1">{children}</div>;
}
function Input({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <input
        {...props}
        className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong transition-colors"
      />
      {error && <div className="text-[11px] text-destructive mt-1">{error}</div>}
    </div>
  );
}
