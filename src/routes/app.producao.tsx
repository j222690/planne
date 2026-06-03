import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import { CheckCircle2, Circle, Loader2, AlertCircle, Plus, X, Scissors, Check, Printer, ChevronDown, ChevronUp, AlertTriangle, QrCode } from "lucide-react";
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

type Peca = {
  id: string; descricao_peca: string; largura_mm: number; comprimento_mm: number;
  quantidade: number; ambiente: string | null; movel: string | null;
  fita_borda_l: boolean; fita_borda_r: boolean; fita_borda_t: boolean; fita_borda_b: boolean;
  cortado: boolean; ordem: number;
  materiais: { nome: string } | null;
};

const STATUS_TONE: Record<string, "amber" | "green" | "blue" | "neutral"> = {
  aberta: "neutral", corte: "blue", montagem: "amber", inspecao: "amber", entregue: "green",
};
const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta", corte: "Em corte", montagem: "Montagem", inspecao: "Inspeção", entregue: "Entregue",
};
const ETAPAS = ["Lista de corte", "Separação de materiais", "Corte CNC", "Bordas + montagem", "Inspeção final", "Entrega"];
const ETAPA_STATUS: Record<string, string[]> = {
  aberta: [], corte: ["Lista de corte", "Separação de materiais"],
  montagem: ["Lista de corte", "Separação de materiais", "Corte CNC"],
  inspecao: ["Lista de corte", "Separação de materiais", "Corte CNC", "Bordas + montagem"],
  entregue: [...ETAPAS],
};
const STATUS_FLOW = ["aberta", "corte", "montagem", "inspecao", "entregue"];

const ordemSchema = z.object({
  projeto_id: z.string().optional(),
  observacoes: z.string().optional(),
});
type OrdemForm = z.infer<typeof ordemSchema>;

const pecaSchema = z.object({
  descricao_peca: z.string().min(1, "Obrigatório"),
  largura_mm: z.coerce.number().min(1),
  comprimento_mm: z.coerce.number().min(1),
  quantidade: z.coerce.number().min(1),
  ambiente: z.string().optional(),
  movel: z.string().optional(),
  fita_borda_l: z.boolean(),
  fita_borda_r: z.boolean(),
  fita_borda_t: z.boolean(),
  fita_borda_b: z.boolean(),
});
type PecaForm = z.infer<typeof pecaSchema>;

// Feature 13: business days estimate
function addBusinessDays(date: Date, days: number): Date {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
}

type EstoqueAlerta = { nome: string; atual: number; minimo: number };

function NovaOrdemModal({ onClose, onSaved, empresaId }: { onClose: () => void; onSaved: () => void; empresaId: string }) {
  const [projetos, setProjetos] = useState<{ id: string; nome: string }[]>([]);
  const [numPecas, setNumPecas] = useState<number | null>(null);
  const [estoqueAlertas, setEstoqueAlertas] = useState<EstoqueAlerta[]>([]);
  useEffect(() => { getProjetos(empresaId).then((p) => setProjetos(p as { id: string; nome: string }[])); }, [empresaId]);
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<OrdemForm>({ resolver: zodResolver(ordemSchema) });
  const projetoId = watch("projeto_id");

  useEffect(() => {
    if (!projetoId) { setNumPecas(null); setEstoqueAlertas([]); return; }
    supabase.from("orcamentos").select("id").eq("projeto_id", projetoId).eq("status", "aprovado").order("created_at", { ascending: false }).limit(1)
      .then(({ data }) => {
        if (!data?.length) { setNumPecas(null); return; }
        supabase.from("orcamento_itens").select("quantidade").eq("orcamento_id", data[0].id)
          .then(({ data: itens }) => {
            const total = (itens ?? []).reduce((s, i) => s + Number(i.quantidade), 0);
            setNumPecas(Math.round(total * 3));
          });
      });

    // Item 7: check material stock levels
    supabase.from("materiais")
      .select("nome,estoque_atual,estoque_minimo")
      .or(`empresa_id.is.null,empresa_id.eq.${empresaId}`)
      .not("estoque_atual", "is", null)
      .not("estoque_minimo", "is", null)
      .then(({ data }) => {
        const alertas = (data ?? [])
          .filter((m) => Number(m.estoque_atual) <= Number(m.estoque_minimo))
          .map((m) => ({ nome: m.nome, atual: Number(m.estoque_atual), minimo: Number(m.estoque_minimo) }));
        setEstoqueAlertas(alertas);
      });
  }, [projetoId, empresaId]);

  const diasEstimados = numPecas ? Math.max(1, Math.ceil(numPecas / 20)) : null;
  const dataEstimada = diasEstimados ? addBusinessDays(new Date(), diasEstimados) : null;

  const onSubmit = async (data: OrdemForm) => {
    try {
      await upsertOrdemProducao(empresaId, { projeto_id: data.projeto_id || null, observacoes: data.observacoes || null });
      toast.success("Ordem de produção criada!"); onSaved(); onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao criar ordem"); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.18 }}
        className="relative w-full max-w-md bg-surface border border-border rounded-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div><h2 className="text-[15px] font-semibold">Nova ordem de produção</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Número gerado automaticamente</p></div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-3">
          <div>
            <div className="text-[11.5px] text-muted-foreground mb-1">Projeto vinculado</div>
            <select {...register("projeto_id")}
              className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground">
              <option value="">Sem projeto</option>
              {projetos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          {diasEstimados && dataEstimada && (
            <div className="flex items-center gap-2 text-[12px] p-2.5 rounded-md bg-accent/10 border border-accent/20 text-accent">
              <Scissors className="size-3.5 shrink-0" />
              <span>
                Prazo estimado: <strong>{diasEstimados} dias úteis</strong>
                {" "}(~{dataEstimada.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })})
                {" · "}{numPecas} peças · 20/dia
              </span>
            </div>
          )}
          {estoqueAlertas.length > 0 && (
            <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/30 space-y-1">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-amber-700 dark:text-amber-400">
                <AlertTriangle className="size-3.5 shrink-0" /> Estoque baixo — verifique antes de produzir:
              </div>
              {estoqueAlertas.map((a) => (
                <div key={a.nome} className="text-[11.5px] text-amber-700 dark:text-amber-400 pl-5">
                  {a.nome}: <strong>{a.atual}</strong> em estoque (mín. {a.minimo})
                </div>
              ))}
            </div>
          )}
          <div>
            <div className="text-[11.5px] text-muted-foreground mb-1">Observações</div>
            <textarea {...register("observacoes")} rows={2} placeholder="Detalhes, prioridade, prazo..."
              className="w-full rounded-md border border-border bg-surface-2 px-2.5 py-2 text-[13px] outline-none focus:border-border-strong resize-none" />
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

function NovaPecaModal({ ordemId, empresaId, onClose, onSaved }: { ordemId: string; empresaId: string; onClose: () => void; onSaved: () => void }) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<PecaForm>({
    resolver: zodResolver(pecaSchema),
    defaultValues: { quantidade: 1, fita_borda_l: false, fita_borda_r: false, fita_borda_t: false, fita_borda_b: false },
  });
  const onSubmit = async (data: PecaForm) => {
    try {
      const { error } = await supabase.from("lista_corte").insert({
        ordem_producao_id: ordemId, empresa_id: empresaId,
        descricao_peca: data.descricao_peca,
        largura_mm: data.largura_mm, comprimento_mm: data.comprimento_mm,
        quantidade: data.quantidade, ambiente: data.ambiente || null, movel: data.movel || null,
        fita_borda_l: data.fita_borda_l, fita_borda_r: data.fita_borda_r,
        fita_borda_t: data.fita_borda_t, fita_borda_b: data.fita_borda_b,
        cortado: false,
      });
      if (error) throw error;
      toast.success("Peça adicionada!"); onSaved(); onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  };
  const fitas = [
    { key: "fita_borda_l" as const, label: "E" },
    { key: "fita_borda_r" as const, label: "D" },
    { key: "fita_borda_t" as const, label: "C" },
    { key: "fita_borda_b" as const, label: "B" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.18 }}
        className="relative w-full max-w-lg bg-surface border border-border rounded-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[15px] font-semibold">Adicionar peça à lista de corte</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <div className="text-[11.5px] text-muted-foreground mb-1">Descrição da peça *</div>
              <input {...register("descricao_peca")} placeholder="Ex: Lateral esquerda do armário"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
              {errors.descricao_peca && <div className="text-[11px] text-destructive mt-1">{errors.descricao_peca.message}</div>}
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Largura (mm) *</div>
              <input {...register("largura_mm")} type="number" min="1"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Comprimento (mm) *</div>
              <input {...register("comprimento_mm")} type="number" min="1"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Quantidade</div>
              <input {...register("quantidade")} type="number" min="1"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Ambiente</div>
              <input {...register("ambiente")} placeholder="Ex: Cozinha"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Móvel</div>
              <input {...register("movel")} placeholder="Ex: Armário superior"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Fita de borda</div>
              <div className="flex gap-2">
                {fitas.map(({ key, label }) => (
                  <button key={key} type="button" onClick={() => setValue(key, !watch(key))}
                    className={`h-8 w-8 rounded border text-[12px] font-medium transition-colors ${watch(key) ? "bg-accent border-accent text-white" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                    {label}
                  </button>
                ))}
                <span className="text-[10.5px] text-muted-foreground self-center ml-1">E=Esq D=Dir C=Cima B=Baixo</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting}
              className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5">
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />} Adicionar peça
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ListaCortePanel({ ordem, empresaId }: { ordem: Ordem; empresaId: string }) {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNovaPeca, setShowNovaPeca] = useState(false);
  const [qrPeca, setQrPeca] = useState<Peca | null>(null);

  const loadPecas = async () => {
    setLoading(true);
    const { data } = await supabase.from("lista_corte")
      .select("*, materiais(nome)")
      .eq("ordem_producao_id", ordem.id)
      .order("ordem");
    setPecas((data ?? []) as Peca[]);
    setLoading(false);
  };

  useEffect(() => { loadPecas(); }, [ordem.id]);

  const toggleCortado = async (peca: Peca) => {
    await supabase.from("lista_corte").update({ cortado: !peca.cortado }).eq("id", peca.id);
    setPecas((ps) => ps.map((p) => p.id === peca.id ? { ...p, cortado: !p.cortado } : p));
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = pecas.map((p) => {
      const fitas = [p.fita_borda_l && "E", p.fita_borda_r && "D", p.fita_borda_t && "C", p.fita_borda_b && "B"].filter(Boolean).join("");
      return `<tr style="${p.cortado ? "text-decoration:line-through;color:#999" : ""}">
        <td>${p.descricao_peca}</td><td>${p.ambiente ?? ""}</td><td>${p.movel ?? ""}</td>
        <td style="text-align:right">${p.largura_mm}</td><td style="text-align:right">${p.comprimento_mm}</td>
        <td style="text-align:center">${p.quantidade}</td><td style="text-align:center">${fitas || "—"}</td>
        <td style="text-align:center">${p.cortado ? "✓" : ""}</td></tr>`;
    }).join("");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lista de Corte — ${ordem.numero ?? ""}</title>
      <style>body{font-family:sans-serif;padding:32px;font-size:12px}h1{font-size:16px;margin-bottom:4px}
      table{width:100%;border-collapse:collapse;margin-top:16px}th{text-align:left;border-bottom:2px solid #ddd;padding:6px;font-size:10px;text-transform:uppercase;color:#666}
      td{padding:5px 6px;border-bottom:1px solid #eee}@media print{body{padding:16px}}</style></head><body>
      <h1>Lista de Corte — ${ordem.numero ?? ""}</h1>
      <div style="color:#666;font-size:11px">${ordem.projetos?.nome ?? ""} · ${pecas.length} peças</div>
      <table><thead><tr><th>Descrição</th><th>Ambiente</th><th>Móvel</th><th style="text-align:right">Larg (mm)</th>
      <th style="text-align:right">Comp (mm)</th><th style="text-align:center">Qtd</th>
      <th style="text-align:center">Fitas</th><th style="text-align:center">✓</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };

  const totalPecas = pecas.reduce((s, p) => s + p.quantidade, 0);
  const cortadas = pecas.filter((p) => p.cortado).reduce((s, p) => s + p.quantidade, 0);

  return (
    <>
      <AnimatePresence>
        {showNovaPeca && (
          <NovaPecaModal ordemId={ordem.id} empresaId={empresaId}
            onClose={() => setShowNovaPeca(false)} onSaved={loadPecas} />
        )}
        {qrPeca && <QRModal peca={qrPeca} onClose={() => setQrPeca(null)} />}
      </AnimatePresence>

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Scissors className="size-3.5 text-muted-foreground" />
            <span className="text-[12.5px] font-medium">Lista de corte</span>
            {!loading && pecas.length > 0 && (
              <span className="text-[11px] text-muted-foreground">{cortadas}/{totalPecas} peças cortadas</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {pecas.length > 0 && (
              <button onClick={handlePrint}
                className="h-7 px-2.5 rounded-md border border-border text-[11.5px] hover:bg-secondary inline-flex items-center gap-1">
                <Printer className="size-3" /> Imprimir
              </button>
            )}
            <button onClick={() => setShowNovaPeca(true)}
              className="h-7 px-2.5 rounded-md border border-border text-[11.5px] hover:bg-secondary inline-flex items-center gap-1">
              <Plus className="size-3" /> Peça
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-2">
            <Loader2 className="size-3.5 animate-spin" /> Carregando...
          </div>
        ) : pecas.length === 0 ? (
          <div className="text-[12px] text-muted-foreground py-2 text-center border border-dashed border-border rounded-md">
            Nenhuma peça cadastrada. <button onClick={() => setShowNovaPeca(true)} className="text-foreground underline">Adicionar primeira →</button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-[12px] min-w-[640px]">
              <thead className="bg-surface-2">
                <tr className="border-b border-border text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  <th className="text-left px-3 py-2">Peça</th>
                  <th className="text-left px-2 py-2">Amb./Móvel</th>
                  <th className="text-right px-2 py-2">Larg</th>
                  <th className="text-right px-2 py-2">Comp</th>
                  <th className="text-center px-2 py-2">Qtd</th>
                  <th className="text-center px-2 py-2">Fitas</th>
                  <th className="text-center px-2 py-2 w-12">Cortado</th>
                  <th className="px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {pecas.map((p) => (
                  <tr key={p.id} className={`border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${p.cortado ? "opacity-50" : ""}`}>
                    <td className="px-3 py-2">
                      <span className={p.cortado ? "line-through text-muted-foreground" : ""}>{p.descricao_peca}</span>
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">
                      {[p.ambiente, p.movel].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="px-2 py-2 text-right num">{p.largura_mm}</td>
                    <td className="px-2 py-2 text-right num">{p.comprimento_mm}</td>
                    <td className="px-2 py-2 text-center">{p.quantidade}</td>
                    <td className="px-2 py-2 text-center font-mono text-[10.5px]">
                      {[p.fita_borda_l && "E", p.fita_borda_r && "D", p.fita_borda_t && "C", p.fita_borda_b && "B"].filter(Boolean).join("") || "—"}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => toggleCortado(p)}
                        className={`size-5 rounded border inline-flex items-center justify-center transition-colors ${p.cortado ? "bg-emerald-500 border-emerald-500" : "border-border hover:border-foreground"}`}>
                        {p.cortado && <Check className="size-3 text-white" />}
                      </button>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => setQrPeca(p)} title="Ver QR Code"
                        className="text-muted-foreground hover:text-foreground transition-colors">
                        <QrCode className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pecas.length > 0 && (
          <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${totalPecas > 0 ? (cortadas / totalPecas) * 100 : 0}%` }} />
          </div>
        )}
      </div>
    </>
  );
}

function QRModal({ peca, onClose }: { peca: Peca; onClose: () => void }) {
  const text = `${peca.descricao_peca}\n${peca.largura_mm}×${peca.comprimento_mm}mm × ${peca.quantidade}un\n${[peca.ambiente, peca.movel].filter(Boolean).join(" / ")}\nID:${peca.id.slice(0, 8)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}&margin=10`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }}
        className="relative bg-surface border border-border rounded-lg shadow-xl p-5 max-w-xs w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold">QR Code — Peça</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="flex flex-col items-center gap-3">
          <img src={qrUrl} alt="QR Code" className="rounded-md border border-border" width={200} height={200} />
          <div className="text-center">
            <div className="text-[13px] font-medium">{peca.descricao_peca}</div>
            <div className="text-[11.5px] text-muted-foreground mt-0.5">{peca.largura_mm}×{peca.comprimento_mm}mm · Qtd {peca.quantidade}</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function OrdemCard({ ordem, empresaId, onAvancar }: { ordem: Ordem; empresaId: string; onAvancar: (o: Ordem) => void }) {
  const [showCorte, setShowCorte] = useState(false);
  const feitas = ETAPA_STATUS[ordem.status] ?? [];

  return (
    <Surface padded={false} className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12px] text-muted-foreground">{ordem.numero ?? "OP-????"}</span>
            <Pill tone={STATUS_TONE[ordem.status] ?? "neutral"}>{STATUS_LABEL[ordem.status] ?? ordem.status}</Pill>
          </div>
          <div className="mt-1 text-[14px] font-medium">{ordem.projetos?.nome ?? "Projeto não vinculado"}</div>
          {ordem.projetos?.clientes && (
            <div className="text-[12px] text-muted-foreground">{ordem.projetos.clientes.nome}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCorte((v) => !v)}
            className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary inline-flex items-center gap-1.5">
            <Scissors className="size-3.5" />
            {showCorte ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
          {ordem.status !== "entregue" && (
            <button onClick={() => onAvancar(ordem)}
              className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary">
              Avançar etapa →
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {ETAPAS.map((etapa, i) => {
          const done = feitas.includes(etapa);
          const atual = !done && i === feitas.length;
          return (
            <div key={etapa} className={`flex items-center gap-1.5 text-[12px] ${done ? "text-emerald-600" : atual ? "text-foreground" : "text-muted-foreground"}`}>
              {done ? <CheckCircle2 className="size-3.5 shrink-0" /> : <Circle className={`size-3.5 shrink-0 ${atual ? "text-accent" : ""}`} />}
              {etapa}
            </div>
          );
        })}
      </div>

      {showCorte && <ListaCortePanel ordem={ordem} empresaId={empresaId} />}
    </Surface>
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
      const eid = (empresa as { id: string }).id;
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
      .update({ status: newStatus, etapa_atual: STATUS_LABEL[newStatus] }).eq("id", ordem.id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    toast.success(`Avançado para ${STATUS_LABEL[newStatus]}`);
    setOrdens((os) => os.map((o) => o.id === ordem.id ? { ...o, status: newStatus } : o));
  };

  return (
    <>
      <AnimatePresence>
        {showModal && empresaId && (
          <NovaOrdemModal onClose={() => setShowModal(false)} onSaved={load} empresaId={empresaId} />
        )}
      </AnimatePresence>

      <PageHeader eyebrow="Operação" title="Produção"
        description="Acompanhe ordens de produção do corte à entrega, com lista de peças para CNC."
        actions={
          <button onClick={() => setShowModal(true)}
            className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5">
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
          <button onClick={() => setShowModal(true)}
            className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5 mx-auto">
            <Plus className="size-3.5" /> Nova ordem
          </button>
        </Surface>
      ) : (
        <div className="space-y-3">
          {ordens.map((o) => (
            <OrdemCard key={o.id} ordem={o} empresaId={empresaId!} onAvancar={avancarEtapa} />
          ))}
        </div>
      )}
    </>
  );
}
