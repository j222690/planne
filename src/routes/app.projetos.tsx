import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import { Plus, Calendar, User, Loader2, AlertCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getProjetos, getClientes, getEmpresaAtual } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/projetos")({
  component: Projetos,
});

type Projeto = {
  id: string; nome: string; descricao: string | null;
  status: string; created_at: string;
  clientes: { nome: string } | null;
};

const COLUNAS = [
  { key: "briefing",  label: "Briefing",    tone: "neutral" as const },
  { key: "projeto",   label: "Em projeto",  tone: "blue" as const },
  { key: "aprovacao", label: "Aprovação",   tone: "amber" as const },
  { key: "producao",  label: "Produção",    tone: "green" as const },
];

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  cliente_id: z.string().optional(),
  descricao: z.string().optional(),
  status: z.string().default("briefing"),
});
type FormData = z.infer<typeof schema>;

function NovoProjetoModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [clientes, setClientes] = useState<{id:string;nome:string}[]>([]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "briefing" },
  });

  useEffect(() => {
    getEmpresaAtual().then((e) => e && getClientes(e.id).then((c) => setClientes(c as any[])));
  }, []);

  const onSubmit = async (data: FormData) => {
    const empresa = await getEmpresaAtual();
    if (!empresa) return;
    const { error } = await supabase.from("projetos").insert({
      empresa_id: empresa.id,
      nome: data.nome,
      cliente_id: data.cliente_id || null,
      descricao: data.descricao || null,
      status: data.status,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Projeto criado!");
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative w-full max-w-md bg-surface border border-border rounded-lg shadow-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[15px] font-semibold">Novo projeto</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-3">
          <div>
            <div className="text-[11.5px] text-muted-foreground mb-1">Nome do projeto *</div>
            <input {...register("nome")} placeholder="Cozinha integrada — Família Mendes"
              className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
            {errors.nome && <div className="text-[11px] text-destructive mt-1">{errors.nome.message}</div>}
          </div>
          <div>
            <div className="text-[11.5px] text-muted-foreground mb-1">Cliente</div>
            <select {...register("cliente_id")}
              className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground">
              <option value="">Sem cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[11.5px] text-muted-foreground mb-1">Etapa inicial</div>
            <select {...register("status")}
              className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground">
              {COLUNAS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[11.5px] text-muted-foreground mb-1">Descrição</div>
            <textarea {...register("descricao")} rows={2} placeholder="Detalhes do escopo..."
              className="w-full rounded-md border border-border bg-surface-2 px-2.5 py-2 text-[13px] outline-none focus:border-border-strong resize-none" />
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting}
              className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5">
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />} Criar projeto
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function Projetos() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    const empresa = await getEmpresaAtual();
    if (!empresa) return;
    const data = await getProjetos(empresa.id);
    setProjetos(data as Projeto[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const moveStatus = async (proj: Projeto, newStatus: string) => {
    const { error } = await supabase.from("projetos").update({ status: newStatus }).eq("id", proj.id);
    if (error) { toast.error("Erro ao mover projeto"); return; }
    toast.success("Projeto atualizado!");
    setProjetos((ps) => ps.map((p) => p.id === proj.id ? { ...p, status: newStatus } : p));
  };

  return (
    <>
      <AnimatePresence>
        {showModal && <NovoProjetoModal onClose={() => setShowModal(false)} onSaved={load} />}
      </AnimatePresence>

      <PageHeader
        eyebrow="Operação"
        title="Projetos"
        description="Pipeline do briefing à entrega — sincronizado com orçamentos e produção."
        actions={
          <button onClick={() => setShowModal(true)}
            className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5">
            <Plus className="size-3.5" /> Novo projeto
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground text-[13px]">
          <Loader2 className="size-4 animate-spin" /> Carregando...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUNAS.map((col) => {
            const items = projetos.filter((p) => p.status === col.key);
            return (
              <div key={col.key} className="rounded-md border border-border bg-surface-2/40 p-3">
                <div className="flex items-center justify-between px-1 mb-3">
                  <div className="flex items-center gap-2">
                    <Pill tone={col.tone}>{col.label}</Pill>
                    <span className="text-[11.5px] text-muted-foreground num">{items.length}</span>
                  </div>
                  <button onClick={() => setShowModal(true)} className="text-muted-foreground hover:text-foreground">
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {items.length === 0 && (
                    <div className="text-[12px] text-muted-foreground text-center py-4">Nenhum projeto</div>
                  )}
                  {items.map((proj) => (
                    <Surface key={proj.id} padded={false} className="p-3 hover:border-border-strong cursor-pointer transition group">
                      <div className="text-[13px] font-medium tracking-tight">{proj.nome}</div>
                      <div className="mt-2 flex items-center gap-3 text-[11.5px] text-muted-foreground">
                        {proj.clientes && <span className="flex items-center gap-1"><User className="size-3" /> {proj.clientes.nome}</span>}
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {format(new Date(proj.created_at), "d MMM", { locale: ptBR })}
                        </span>
                      </div>
                      {/* Quick move buttons */}
                      <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition flex-wrap">
                        {COLUNAS.filter((c) => c.key !== col.key).map((c) => (
                          <button key={c.key} onClick={() => moveStatus(proj, c.key)}
                            className="text-[10.5px] px-1.5 py-0.5 border border-border rounded hover:bg-secondary text-muted-foreground">
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </Surface>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
