import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import { Plus, Loader2, GripVertical, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { getEmpresaAtual } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/app/pipeline")({
  component: Pipeline,
});

type Estagio = { id: string; nome: string; ordem: number; cor: string | null };
type Oportunidade = {
  id: string; titulo: string; valor_estimado: number | null; status: string;
  estagio_id: string | null; empresa_id: string; notas: string | null;
  created_at: string;
  clientes: { nome: string } | null;
};

const DEFAULT_ESTAGIOS: Estagio[] = [
  { id: "prospecao", nome: "Prospecção", ordem: 1, cor: "#6366f1" },
  { id: "contato", nome: "Primeiro contato", ordem: 2, cor: "#f59e0b" },
  { id: "proposta", nome: "Proposta enviada", ordem: 3, cor: "#3b82f6" },
  { id: "negociacao", nome: "Negociação", ordem: 4, cor: "#8b5cf6" },
  { id: "fechado", nome: "Fechado", ordem: 5, cor: "#10b981" },
];

function NovaOpModal({ empresaId, estagios, onClose, onSaved }: {
  empresaId: string; estagios: Estagio[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({ titulo: "", valor_estimado: "", estagio_id: estagios[0]?.id ?? "", notas: "" });
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("clientes").select("id,nome").eq("empresa_id", empresaId).order("nome")
      .then(({ data }) => setClientes(data ?? []));
  }, [empresaId]);

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error("Título obrigatório"); return; }
    setSaving(true);
    const { error } = await supabase.from("oportunidades").insert({
      titulo: form.titulo,
      valor_estimado: parseFloat(form.valor_estimado) || null,
      estagio_id: form.estagio_id || null,
      status: "aberto",
      notas: form.notas || null,
      empresa_id: empresaId,
      cliente_id: clienteId || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Oportunidade criada!");
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.15 }}
        className="relative w-full max-w-md bg-surface border border-border rounded-lg shadow-xl p-5 space-y-3"
      >
        <h2 className="text-[15px] font-semibold">Nova oportunidade</h2>

        <label className="block">
          <div className="text-[11.5px] text-muted-foreground mb-1">Título *</div>
          <input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            placeholder="Ex: Cozinha planejada — João Silva" className="input" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <div className="text-[11.5px] text-muted-foreground mb-1">Valor estimado (R$)</div>
            <input type="number" value={form.valor_estimado} onChange={(e) => setForm((f) => ({ ...f, valor_estimado: e.target.value }))}
              className="input" min={0} step={100} />
          </label>
          <label className="block">
            <div className="text-[11.5px] text-muted-foreground mb-1">Estágio</div>
            <select value={form.estagio_id} onChange={(e) => setForm((f) => ({ ...f, estagio_id: e.target.value }))}
              className="input">
              {estagios.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </label>
        </div>

        {clientes.length > 0 && (
          <label className="block">
            <div className="text-[11.5px] text-muted-foreground mb-1">Cliente</div>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="input">
              <option value="">Sem cliente vinculado</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
        )}

        <label className="block">
          <div className="text-[11.5px] text-muted-foreground mb-1">Notas</div>
          <textarea value={form.notas} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
            rows={2} className="input h-auto resize-none py-2" placeholder="Observações sobre a oportunidade..." />
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="h-8 px-4 rounded-md border border-border text-[12.5px] hover:bg-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="h-8 px-4 rounded-md bg-foreground text-background text-[12.5px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Criar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function KanbanCard({ op, onMoved, estagios }: { op: Oportunidade; onMoved: () => void; estagios: Estagio[] }) {
  const [moving, setMoving] = useState(false);

  const moveToNext = async () => {
    const cur = estagios.findIndex((e) => e.id === op.estagio_id);
    const next = estagios[cur + 1];
    if (!next) return;
    setMoving(true);
    const { error } = await supabase.from("oportunidades").update({ estagio_id: next.id, status: next.id }).eq("id", op.id);
    setMoving(false);
    if (error) { toast.error(error.message); return; }
    onMoved();
  };

  return (
    <div className="rounded-md border border-border bg-background p-3 hover:border-border-strong transition-colors cursor-pointer group">
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-[12.5px] truncate">{op.titulo}</div>
        <GripVertical className="size-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100" />
      </div>
      {op.clientes && (
        <div className="text-[11.5px] text-muted-foreground mt-0.5 truncate">{op.clientes.nome}</div>
      )}
      <div className="flex items-center justify-between mt-2 gap-2">
        {op.valor_estimado ? (
          <span className="text-[11.5px] font-medium flex items-center gap-0.5 text-emerald-600">
            <DollarSign className="size-3" />
            {Number(op.valor_estimado).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        ) : <span />}
        {moving ? (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        ) : (
          <button onClick={moveToNext} className="text-[10.5px] text-accent hover:underline opacity-0 group-hover:opacity-100">
            Avançar →
          </button>
        )}
      </div>
    </div>
  );
}

function Pipeline() {
  const [estagios, setEstagios] = useState<Estagio[]>([]);
  const [ops, setOps] = useState<Oportunidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    const empresa = await getEmpresaAtual();
    if (!empresa) return;
    const eid = (empresa as { id: string }).id;
    setEmpresaId(eid);

    let { data: est } = await supabase
      .from("pipeline_estagios").select("*").eq("empresa_id", eid).order("ordem");

    if (!est || est.length === 0) {
      const seeds = [
        { nome: "Prospecção",        ordem: 1, cor: "#6366f1", empresa_id: eid },
        { nome: "Primeiro contato",  ordem: 2, cor: "#f59e0b", empresa_id: eid },
        { nome: "Proposta enviada",  ordem: 3, cor: "#3b82f6", empresa_id: eid },
        { nome: "Negociação",        ordem: 4, cor: "#8b5cf6", empresa_id: eid },
        { nome: "Fechado",           ordem: 5, cor: "#10b981", empresa_id: eid },
      ];
      const { data: inserted } = await supabase.from("pipeline_estagios").insert(seeds).select("*");
      est = inserted ?? [];
    }

    const { data: opData } = await supabase
      .from("oportunidades").select("*,clientes(nome)").eq("empresa_id", eid).order("created_at", { ascending: false });

    setEstagios(est ?? []);
    setOps(opData ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalPipeline = ops.reduce((s, o) => s + (Number(o.valor_estimado) || 0), 0);

  return (
    <>
      {showModal && empresaId && (
        <NovaOpModal empresaId={empresaId} estagios={estagios} onClose={() => setShowModal(false)} onSaved={load} />
      )}

      <PageHeader
        eyebrow="Comercial"
        title="Pipeline de oportunidades"
        description="Acompanhe negociações em andamento por estágio."
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <Plus className="size-3.5" /> Nova oportunidade
          </button>
        }
      />

      <div className="grid md:grid-cols-3 gap-3 mb-5">
        <Surface padded={false} className="p-4">
          <div className="text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground">Oportunidades</div>
          <div className="mt-1.5 text-[20px] font-semibold num">{loading ? "—" : ops.length}</div>
        </Surface>
        <Surface padded={false} className="p-4">
          <div className="text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground">Pipeline total</div>
          <div className="mt-1.5 text-[20px] font-semibold num">
            {loading ? "—" : "R$ " + totalPipeline.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
          </div>
        </Surface>
        <Surface padded={false} className="p-4">
          <div className="text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground">Ticket médio</div>
          <div className="mt-1.5 text-[20px] font-semibold num">
            {loading || ops.length === 0 ? "—" : "R$ " + (totalPipeline / ops.filter(o => o.valor).length || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
          </div>
        </Surface>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando...
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {estagios.map((est) => {
              const estOps = ops.filter((o) => o.estagio_id === est.id || o.status === est.id);
              const estTotal = estOps.reduce((s, o) => s + (Number(o.valor) || 0), 0);
              return (
                <div key={est.id} className="w-[240px] shrink-0">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="size-2 rounded-full shrink-0" style={{ background: est.cor ?? "#6366f1" }} />
                    <span className="text-[12.5px] font-semibold truncate">{est.nome}</span>
                    <span className="ml-auto text-[11.5px] text-muted-foreground shrink-0">{estOps.length}</span>
                  </div>
                  {estTotal > 0 && (
                    <div className="text-[10.5px] text-muted-foreground px-1 mb-2">
                      R$ {estTotal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </div>
                  )}
                  <div className="bg-surface-2 rounded-lg p-2 space-y-2 min-h-[200px]">
                    {estOps.map((op) => (
                      <KanbanCard key={op.id} op={op} onMoved={load} estagios={estagios} />
                    ))}
                    {estOps.length === 0 && (
                      <div className="text-[11.5px] text-muted-foreground text-center py-8">Sem oportunidades</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
