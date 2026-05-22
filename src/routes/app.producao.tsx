import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import { CheckCircle2, Circle, Loader2, AlertCircle, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { getEmpresaAtual, getProjetos, upsertOrdemProducao } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/app/producao")({
  component: Producao,
});

type Ordem = {
  id: string; numero: string | null; status: string;
  etapa_atual: string | null; created_at: string;
  projetos: { nome: string; clientes: { nome: string } | null } | null;
};

const STATUS_TONE: Record<string, "amber"|"green"|"blue"|"neutral"> = {
  aberta: "neutral", corte: "blue", montagem: "amber", inspecao: "amber", entregue: "green",
};
const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta", corte: "Em corte", montagem: "Montagem", inspecao: "Inspeção", entregue: "Entregue",
};

const ETAPAS = ["Lista de corte", "Separação de materiais", "Corte CNC", "Bordas + montagem", "Inspeção final", "Entrega"];
const ETAPA_STATUS: Record<string, string[]> = {
  aberta:    [],
  corte:     ["Lista de corte", "Separação de materiais"],
  montagem:  ["Lista de corte", "Separação de materiais", "Corte CNC"],
  inspecao:  ["Lista de corte", "Separação de materiais", "Corte CNC", "Bordas + montagem"],
  entregue:  [...ETAPAS],
};
const STATUS_FLOW = ["aberta", "corte", "montagem", "inspecao", "entregue"];

const ordemSchema = z.object({
  projeto_id: z.string().optional(),
  observacoes: z.string().optional(),
});
type OrdemForm = z.infer<typeof ordemSchema>;

function NovaOrdemModal({ onClose, onSaved, empresaId }: { onClose: () => void; onSaved: () => void; empresaId: string }) {
  const [projetos, setProjetos] = useState<{id:string;nome:string}[]>([]);

  useEffect(() => {
    getProjetos(empresaId).then((p) => setProjetos(p as {id:string;nome:string}[]));
  }, [empresaId]);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<OrdemForm>({
    resolver: zodResolver(ordemSchema),
  });

  const onSubmit = async (data: OrdemForm) => {
    try {
      // numero gerado pelo trigger do banco
      await upsertOrdemProducao(empresaId, {
        projeto_id: data.projeto_id || null,
      });
      toast.success("Ordem de produção criada!");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar ordem");
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
            <h2 className="text-[15px] font-semibold">Nova ordem de produção</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Número gerado automaticamente</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-3">
          <div>
            <div className="text-[11.5px] text-muted-foreground mb-1">Projeto vinculado</div>
            <select
              {...register("projeto_id")}
              className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground"
            >
              <option value="">Sem projeto</option>
              {projetos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[11.5px] text-muted-foreground mb-1">Observações</div>
            <textarea
              {...register("observacoes")}
              rows={2}
              placeholder="Detalhes, prioridade, prazo..."
              className="w-full rounded-md border border-border bg-surface-2 px-2.5 py-2 text-[13px] outline-none focus:border-border-strong resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting}
              className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5">
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />} Criar ordem
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function Producao() {
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  const load = async () => {
    try {
      const empresa = await getEmpresaAtual();
      if (!empresa) throw new Error("Empresa não encontrada");
      const eid = (empresa as {id:string}).id;
      setEmpresaId(eid);
      const { data, error } = await supabase
        .from("ordens_producao")
        .select("*, projetos(nome, clientes(nome))")
        .eq("empresa_id", eid)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrdens(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const avancarEtapa = async (ordem: Ordem) => {
    const idx = STATUS_FLOW.indexOf(ordem.status);
    if (idx >= STATUS_FLOW.length - 1) return;
    const newStatus = STATUS_FLOW[idx + 1];
    const { error } = await supabase.from("ordens_producao")
      .update({ status: newStatus, etapa_atual: STATUS_LABEL[newStatus] })
      .eq("id", ordem.id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    toast.success(`Ordem avançada para ${STATUS_LABEL[newStatus]}`);
    setOrdens((os) => os.map((o) => o.id === ordem.id ? { ...o, status: newStatus } : o));
  };

  return (
    <>
      <AnimatePresence>
        {showModal && empresaId && (
          <NovaOrdemModal onClose={() => setShowModal(false)} onSaved={load} empresaId={empresaId} />
        )}
      </AnimatePresence>

      <PageHeader
        eyebrow="Operação"
        title="Produção"
        description="Acompanhe ordens de produção do corte à entrega."
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <Plus className="size-3.5" /> Nova ordem
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
      ) : ordens.length === 0 ? (
        <Surface className="text-center py-12">
          <div className="text-[14px] font-medium mb-1">Nenhuma ordem de produção</div>
          <div className="text-[13px] text-muted-foreground mb-4">Crie uma ordem ou vincule a um projeto aprovado.</div>
          <button
            onClick={() => setShowModal(true)}
            className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5 mx-auto"
          >
            <Plus className="size-3.5" /> Nova ordem
          </button>
        </Surface>
      ) : (
        <div className="space-y-3">
          {ordens.map((o) => {
            const feitas = ETAPA_STATUS[o.status] ?? [];
            return (
              <Surface key={o.id} padded={false} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] text-muted-foreground">{o.numero ?? "OP-????"}</span>
                      <Pill tone={STATUS_TONE[o.status] ?? "neutral"}>{STATUS_LABEL[o.status] ?? o.status}</Pill>
                    </div>
                    <div className="mt-1 text-[14px] font-medium">{o.projetos?.nome ?? "Projeto não vinculado"}</div>
                    {o.projetos?.clientes && (
                      <div className="text-[12px] text-muted-foreground">{o.projetos.clientes.nome}</div>
                    )}
                  </div>
                  {o.status !== "entregue" && (
                    <button
                      onClick={() => avancarEtapa(o)}
                      className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary transition-colors"
                    >
                      Avançar etapa →
                    </button>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                  {ETAPAS.map((etapa, i) => {
                    const done = feitas.includes(etapa);
                    const atual = !done && i === feitas.length;
                    return (
                      <div key={etapa} className={`flex items-center gap-1.5 text-[12px] ${done ? "text-emerald-600" : atual ? "text-foreground" : "text-muted-foreground"}`}>
                        {done
                          ? <CheckCircle2 className="size-3.5 shrink-0" />
                          : <Circle className={`size-3.5 shrink-0 ${atual ? "text-accent" : ""}`} />}
                        {etapa}
                      </div>
                    );
                  })}
                </div>
              </Surface>
            );
          })}
        </div>
      )}
    </>
  );
}
