import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import { CheckCircle2, Circle, Loader2, AlertCircle, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { getEmpresaAtual } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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

function Producao() {
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const empresa = await getEmpresaAtual();
      if (!empresa) throw new Error("Empresa não encontrada");
      const { data, error } = await supabase
        .from("ordens_producao")
        .select("*, projetos(nome, clientes(nome))")
        .eq("empresa_id", empresa.id)
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
      <PageHeader
        eyebrow="Operação"
        title="Produção"
        description="Acompanhe ordens de produção do corte à entrega."
        actions={
          <button className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5">
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
          <div className="text-[13px] text-muted-foreground">As ordens são geradas a partir de projetos aprovados.</div>
        </Surface>
      ) : (
        <div className="space-y-3">
          {ordens.map((o) => {
            const feitas = ETAPA_STATUS[o.status] ?? [];
            const idxAtual = STATUS_FLOW.indexOf(o.status);
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
