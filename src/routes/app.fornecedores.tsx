import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import { Plus, Upload, Globe, Loader2, AlertCircle, X, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getEmpresaAtual, updateFornecedor, deleteFornecedor } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/app/fornecedores")({
  component: Fornecedores,
});

type Fornecedor = {
  id: string; nome: string; categoria: string | null;
  modo_sync: string | null; ativo: boolean; created_at: string;
};

const SYNC_TONE: Record<string, "green" | "amber" | "blue" | "neutral"> = {
  api: "green", planilha: "blue", pdf: "amber", manual: "neutral",
};
const SYNC_LABEL: Record<string, string> = { api: "API", planilha: "Planilha", pdf: "PDF · OCR", manual: "Manual" };

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  categoria: z.string().optional(),
  modo_sync: z.string().default("manual"),
});
type FormData = z.infer<typeof schema>;

const FORNECEDORES_PADRAO = [
  { nome: "Arauco", categoria: "Chapas MDF / MDP", modo_sync: "planilha" },
  { nome: "Berneck", categoria: "Chapas MDF", modo_sync: "planilha" },
  { nome: "Duratex", categoria: "Chapas / Pisos", modo_sync: "pdf" },
  { nome: "Hettich", categoria: "Ferragens", modo_sync: "manual" },
  { nome: "Blum", categoria: "Ferragens premium", modo_sync: "manual" },
  { nome: "GMAD", categoria: "Ferragens / Puxadores", modo_sync: "manual" },
  { nome: "Acasel Chapecó", categoria: "Distribuidor regional", modo_sync: "manual" },
  { nome: "Guararapes", categoria: "Chapas", modo_sync: "planilha" },
];

function FornecedorModal({
  onClose, onSaved, empresaId, initialData,
}: {
  onClose: () => void; onSaved: () => void; empresaId: string; initialData?: Fornecedor;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? { nome: initialData.nome, categoria: initialData.categoria ?? "", modo_sync: initialData.modo_sync ?? "manual" }
      : { modo_sync: "manual" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (initialData) {
        await updateFornecedor(initialData.id, {
          nome: data.nome,
          categoria: data.categoria || null,
          modo_sync: data.modo_sync,
        });
        toast.success("Fornecedor atualizado!");
      } else {
        const { error } = await supabase.from("fornecedores").insert({
          empresa_id: empresaId, nome: data.nome,
          categoria: data.categoria || null, modo_sync: data.modo_sync,
        });
        if (error) throw new Error(error.message);
        toast.success("Fornecedor adicionado!");
      }
      onSaved(); onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const importarPadrao = async () => {
    const rows = FORNECEDORES_PADRAO.map((f) => ({ ...f, empresa_id: empresaId, ativo: true }));
    const { error } = await supabase.from("fornecedores").insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} fornecedores importados!`);
    onSaved(); onClose();
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
          <h2 className="text-[15px] font-semibold">{initialData ? "Editar fornecedor" : "Adicionar fornecedor"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {!initialData && (
            <>
              <button onClick={importarPadrao}
                className="w-full h-10 rounded-md border border-dashed border-border text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center justify-center gap-2">
                <Upload className="size-4" /> Importar fornecedores padrão (Arauco, Berneck, Hettich…)
              </button>
              <div className="relative flex items-center gap-2 text-[11.5px] text-muted-foreground">
                <div className="flex-1 border-t border-border" /> ou adicionar manualmente <div className="flex-1 border-t border-border" />
              </div>
            </>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Nome *</div>
              <input {...register("nome")} placeholder="Ex: Arauco"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
              {errors.nome && <div className="text-[11px] text-destructive mt-1">{errors.nome.message}</div>}
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Categoria</div>
              <input {...register("categoria")} placeholder="Chapas MDF / Ferragens / Puxadores..."
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Modo de sincronização</div>
              <select {...register("modo_sync")}
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground">
                <option value="manual">Manual</option>
                <option value="planilha">Planilha (XLSX/CSV)</option>
                <option value="pdf">PDF com OCR</option>
                <option value="api">API (planejado)</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-border">
              <button type="button" onClick={onClose} className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-secondary">Cancelar</button>
              <button type="submit" disabled={isSubmitting}
                className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5">
                {isSubmitting && <Loader2 className="size-3.5 animate-spin" />} {initialData ? "Salvar alterações" : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const empresa = await getEmpresaAtual();
      if (!empresa) throw new Error("Empresa não encontrada");
      const eid = (empresa as { id: string }).id;
      setEmpresaId(eid);
      const { data, error } = await supabase.from("fornecedores")
        .select("*").eq("empresa_id", eid).order("nome");
      if (error) throw error;
      setFornecedores(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleAtivo = async (f: Fornecedor) => {
    await supabase.from("fornecedores").update({ ativo: !f.ativo }).eq("id", f.id);
    toast.success(f.ativo ? "Fornecedor desativado" : "Fornecedor ativado");
    setFornecedores((fs) => fs.map((x) => x.id === f.id ? { ...x, ativo: !f.ativo } : x));
  };

  const handleDelete = (f: Fornecedor) => {
    toast(`Excluir "${f.nome}"?`, {
      action: {
        label: "Excluir",
        onClick: async () => {
          try {
            await deleteFornecedor(f.id);
            toast.success("Fornecedor excluído");
            load();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao excluir");
          }
        },
      },
      cancel: { label: "Cancelar", onClick: () => {} },
    });
  };

  return (
    <>
      <AnimatePresence>
        {(showModal || editando) && empresaId && (
          <FornecedorModal
            onClose={() => { setShowModal(false); setEditando(null); }}
            onSaved={load}
            empresaId={empresaId}
            initialData={editando ?? undefined}
          />
        )}
      </AnimatePresence>

      <PageHeader
        eyebrow="Operação"
        title="Fornecedores"
        description="Gerencie catálogos e sincronize preços de chapas, ferragens e acessórios."
        actions={
          <button onClick={() => setShowModal(true)}
            className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5">
            <Plus className="size-3.5" /> Adicionar
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground text-[13px]">
          <Loader2 className="size-4 animate-spin" /> Carregando...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 gap-2 text-destructive text-[13px]">
          <AlertCircle className="size-4" /> {error}
        </div>
      ) : fornecedores.length === 0 ? (
        <Surface className="text-center py-12">
          <Globe className="size-8 text-muted-foreground mx-auto mb-3" />
          <div className="text-[14px] font-medium mb-1">Nenhum fornecedor cadastrado</div>
          <div className="text-[13px] text-muted-foreground mb-4">Importe os fornecedores padrão ou adicione manualmente.</div>
          <button onClick={() => setShowModal(true)}
            className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5 mx-auto">
            <Plus className="size-3.5" /> Adicionar fornecedor
          </button>
        </Surface>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {fornecedores.map((f) => (
            <Surface key={f.id} padded={false} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="size-9 rounded-md border border-border bg-surface-2 grid place-items-center text-[11px] font-bold text-muted-foreground shrink-0">
                  {f.nome.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium truncate">{f.nome}</div>
                  <div className="text-[11.5px] text-muted-foreground truncate">{f.categoria ?? "—"}</div>
                </div>
                <button onClick={() => toggleAtivo(f)}
                  className={`size-2 rounded-full shrink-0 mt-1.5 ${f.ativo ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
                  title={f.ativo ? "Ativo — clique para desativar" : "Inativo — clique para ativar"}
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Pill tone={SYNC_TONE[f.modo_sync ?? "manual"] ?? "neutral"}>
                  {SYNC_LABEL[f.modo_sync ?? "manual"] ?? f.modo_sync}
                </Pill>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditando(f)}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title="Editar"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(f)}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </>
  );
}
