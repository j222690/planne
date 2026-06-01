import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, StatCard } from "@/components/planne/primitives";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useState, useEffect, useRef } from "react";
import { getEmpresaAtual, upsertLancamento, updateLancamento, deleteLancamento } from "@/lib/db";
import { Loader2, Plus, X, MoreHorizontal, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/app/financeiro")({
  component: Financeiro,
});

type Lancamento = {
  id: string; tipo: string; descricao: string; valor: number;
  status: string; vencimento: string | null; pago_em: string | null;
  categoria: string | null; created_at: string;
};

const lancSchema = z.object({
  tipo: z.enum(["entrada", "saida"]),
  descricao: z.string().min(1, "Descrição obrigatória"),
  valor: z.coerce.number().positive("Valor deve ser positivo"),
  categoria: z.string().optional(),
  status: z.string().default("pendente"),
  vencimento: z.string().optional(),
});
type LancForm = z.infer<typeof lancSchema>;

const CATEGORIAS_ENTRADA = ["Orçamento aprovado", "Adiantamento", "Medição", "Saldo final", "Outro"];
const CATEGORIAS_SAIDA = ["Materiais", "Mão de obra", "Frete", "Ferramentas", "Overhead", "Impostos", "Outro"];

function LancamentoModal({
  onClose, onSaved, empresaId, initialData,
}: {
  onClose: () => void; onSaved: () => void; empresaId: string; initialData?: Lancamento;
}) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<LancForm>({
    resolver: zodResolver(lancSchema),
    defaultValues: initialData ? {
      tipo: initialData.tipo as "entrada" | "saida",
      descricao: initialData.descricao,
      valor: initialData.valor,
      categoria: initialData.categoria ?? "",
      status: initialData.status,
      vencimento: initialData.vencimento ?? "",
    } : { tipo: "entrada", status: "pendente" },
  });
  const tipo = watch("tipo");
  const categorias = tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  const onSubmit = async (data: LancForm) => {
    try {
      const payload = {
        tipo: data.tipo,
        descricao: data.descricao,
        valor: data.valor,
        categoria: data.categoria || null,
        status: data.status,
        vencimento: data.vencimento || null,
      };
      if (initialData) {
        await updateLancamento(initialData.id, payload);
        toast.success("Lançamento atualizado!");
      } else {
        await upsertLancamento(empresaId, payload);
        toast.success("Lançamento registrado!");
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
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
          <h2 className="text-[15px] font-semibold">{initialData ? "Editar lançamento" : "Novo lançamento"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-3">
          {/* Tipo */}
          <div>
            <div className="text-[11.5px] text-muted-foreground mb-1">Tipo *</div>
            <div className="flex gap-2">
              {(["entrada", "saida"] as const).map((t) => (
                <label key={t} className="flex-1">
                  <input type="radio" value={t} {...register("tipo")} className="sr-only" />
                  <div className={`h-9 rounded-md border text-[13px] font-medium flex items-center justify-center cursor-pointer transition-colors ${
                    tipo === t
                      ? t === "entrada" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "border-destructive bg-destructive/10 text-destructive"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}>
                    {t === "entrada" ? "Entrada" : "Saída"}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <div className="text-[11.5px] text-muted-foreground mb-1">Descrição *</div>
            <input
              {...register("descricao")}
              placeholder={tipo === "entrada" ? "Ex: Adiantamento — Família Mendes" : "Ex: Chapas MDF Arauco"}
              className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong"
            />
            {errors.descricao && <div className="text-[11px] text-destructive mt-1">{errors.descricao.message}</div>}
          </div>

          {/* Valor + Categoria */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Valor (R$) *</div>
              <input
                {...register("valor")}
                type="number" step="0.01" min="0"
                placeholder="0,00"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong"
              />
              {errors.valor && <div className="text-[11px] text-destructive mt-1">{errors.valor.message}</div>}
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Categoria</div>
              <select
                {...register("categoria")}
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground"
              >
                <option value="">Selecione...</option>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Status + Vencimento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Status</div>
              <select
                {...register("status")}
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground"
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago / Recebido</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Vencimento</div>
              <input
                {...register("vencimento")}
                type="date"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting}
              className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5">
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />} {initialData ? "Salvar alterações" : "Registrar"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function LancRowMenu({ lanc, onEdit, onDeleted }: { lanc: Lancamento; onEdit: () => void; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const handleDelete = () => {
    setOpen(false);
    toast(`Excluir "${lanc.descricao}"?`, {
      action: {
        label: "Excluir",
        onClick: async () => {
          try {
            await deleteLancamento(lanc.id);
            toast.success("Lançamento excluído");
            onDeleted();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro");
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
        className="opacity-0 group-hover:opacity-100 transition p-1 rounded text-muted-foreground hover:text-foreground"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[130px]">
          <button onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-[12.5px] hover:bg-secondary text-foreground">
            <Pencil className="size-3.5" /> Editar
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-[12.5px] hover:bg-secondary text-destructive">
            <Trash2 className="size-3.5" /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}

function Financeiro() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [chartData, setChartData] = useState<{m:string;entrada:number;saida:number}[]>([]);
  const [totais, setTotais] = useState({ receita: 0, despesa: 0, aReceber: 0, aPagar: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Lancamento | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  const load = async () => {
    try {
      const empresa = await getEmpresaAtual();
      if (!empresa) return;
      const eid = (empresa as {id:string}).id;
      setEmpresaId(eid);

      const { data: lancs } = await supabase
        .from("financeiro")
        .select("*")
        .eq("empresa_id", eid)
        .order("created_at", { ascending: false })
        .limit(50);

      const all = (lancs ?? []) as Lancamento[];
      setLancamentos(all);

      const receita  = all.filter(l => l.tipo === "entrada" && l.status === "pago").reduce((s,l) => s + Number(l.valor), 0);
      const despesa  = all.filter(l => l.tipo === "saida"   && l.status === "pago").reduce((s,l) => s + Number(l.valor), 0);
      const aReceber = all.filter(l => l.tipo === "entrada" && l.status !== "pago").reduce((s,l) => s + Number(l.valor), 0);
      const aPagar   = all.filter(l => l.tipo === "saida"   && l.status !== "pago").reduce((s,l) => s + Number(l.valor), 0);
      setTotais({ receita, despesa, aReceber, aPagar });

      const months = [];
      for (let i = 5; i >= 0; i--) {
        const ref   = subMonths(new Date(), i);
        const start = startOfMonth(ref);
        const end   = endOfMonth(ref);
        const label = format(ref, "MMM", { locale: ptBR });
        const mes   = all.filter(l => {
          const d = new Date(l.created_at ?? l.vencimento ?? "");
          return d >= start && d <= end;
        });
        const entrada = mes.filter(l => l.tipo === "entrada").reduce((s,l) => s + Number(l.valor), 0);
        const saida   = mes.filter(l => l.tipo === "saida").reduce((s,l) => s + Number(l.valor), 0);
        months.push({ m: label, entrada: Math.round(entrada/1000*10)/10, saida: Math.round(saida/1000*10)/10 });
      }
      setChartData(months);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fmt = (n: number) => "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const STATUS_COLOR: Record<string, string> = {
    pago: "text-emerald-600", pendente: "text-amber-600", atrasado: "text-destructive",
  };

  return (
    <>
      <AnimatePresence>
        {(showModal || editando) && empresaId && (
          <LancamentoModal
            onClose={() => { setShowModal(false); setEditando(null); }}
            onSaved={load}
            empresaId={empresaId}
            initialData={editando ?? undefined}
          />
        )}
      </AnimatePresence>

      <PageHeader
        eyebrow="Inteligência"
        title="Financeiro"
        description="Entradas, saídas e fluxo de caixa da operação."
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <Plus className="size-3.5" /> Lançamento
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground text-[13px]">
          <Loader2 className="size-4 animate-spin" /> Carregando...
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <StatCard label="Receita recebida"  value={fmt(totais.receita)}  hint="entradas pagas" />
            <StatCard label="Despesas pagas"    value={fmt(totais.despesa)}  hint="saídas pagas" />
            <StatCard label="A receber"         value={fmt(totais.aReceber)} hint="entradas pendentes" />
            <StatCard label="A pagar"           value={fmt(totais.aPagar)}   hint="saídas pendentes" />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mb-5">
            <Surface className="lg:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="text-[12.5px] font-medium">Fluxo de caixa</div>
                  <div className="text-[11.5px] text-muted-foreground">Últimos 6 meses · R$ mil</div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-accent inline-block"/>Entrada</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-muted-foreground/40 inline-block"/>Saída</span>
                </div>
              </div>
              <div className="h-[220px] mt-3 -mx-2">
                <ResponsiveContainer>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="ent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
                      </linearGradient>
                      <linearGradient id="sai" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--muted-foreground)" stopOpacity="0.15"/>
                        <stop offset="100%" stopColor="var(--muted-foreground)" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false}/>
                    <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false}/>
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={32}/>
                    <Tooltip contentStyle={{background:"var(--popover)",border:"1px solid var(--border)",borderRadius:6,fontSize:12}} cursor={{stroke:"var(--border-strong)"}}/>
                    <Area type="monotone" dataKey="entrada" name="Entrada" stroke="var(--accent)" strokeWidth={1.5} fill="url(#ent)"/>
                    <Area type="monotone" dataKey="saida"   name="Saída"   stroke="var(--muted-foreground)" strokeWidth={1.5} fill="url(#sai)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Surface>

            <Surface>
              <div className="text-[12.5px] font-medium mb-4">Últimos lançamentos</div>
              <div className="space-y-2">
                {lancamentos.slice(0,6).length === 0 ? (
                  <div className="text-[13px] text-muted-foreground text-center py-4">Nenhum lançamento ainda.</div>
                ) : lancamentos.slice(0,6).map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-[12.5px] py-1.5 border-b border-border last:border-0">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{l.descricao}</div>
                      <div className={`text-[11px] ${STATUS_COLOR[l.status] ?? "text-muted-foreground"}`}>{l.status}</div>
                    </div>
                    <div className={`num font-medium shrink-0 ml-2 ${l.tipo === "entrada" ? "text-emerald-600" : "text-destructive"}`}>
                      {l.tipo === "entrada" ? "+" : "-"} R$ {Number(l.valor).toLocaleString("pt-BR",{minimumFractionDigits:0})}
                    </div>
                  </div>
                ))}
              </div>
            </Surface>
          </div>

          <Surface padded={false}>
            <div className="p-4 border-b border-border text-[12.5px] font-medium">Todos os lançamentos</div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] min-w-[680px]">
                <thead className="text-[11.5px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="text-left font-medium px-5 py-2.5">Descrição</th>
                    <th className="text-left font-medium px-3 py-2.5">Categoria</th>
                    <th className="text-left font-medium px-3 py-2.5">Tipo</th>
                    <th className="text-left font-medium px-3 py-2.5">Vencimento</th>
                    <th className="text-right font-medium px-3 py-2.5">Valor</th>
                    <th className="text-left font-medium px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground text-[13px]">
                      Nenhum lançamento. <button onClick={() => setShowModal(true)} className="text-foreground underline">Adicionar primeiro →</button>
                    </td></tr>
                  ) : lancamentos.map((l) => {
                    const atrasado = l.status !== "pago" && l.vencimento && new Date(l.vencimento) < new Date();
                    const vencFmt = l.vencimento ? new Date(l.vencimento).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—";
                    return (
                    <tr key={l.id} className={`border-b border-border last:border-0 hover:bg-secondary/40 group ${atrasado ? "bg-destructive/5" : ""}`}>
                      <td className="px-5 py-3 font-medium">{l.descricao}</td>
                      <td className="px-3 py-3 text-muted-foreground text-[12px]">{l.categoria ?? "—"}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[12px] font-medium ${l.tipo === "entrada" ? "text-emerald-600" : "text-destructive"}`}>
                          {l.tipo === "entrada" ? "Entrada" : "Saída"}
                        </span>
                      </td>
                      <td className={`px-3 py-3 text-[12px] ${atrasado ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                        {vencFmt}{atrasado && " ⚠"}
                      </td>
                      <td className="px-3 py-3 text-right num">R$ {Number(l.valor).toLocaleString("pt-BR",{minimumFractionDigits:2})}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[12px] ${STATUS_COLOR[l.status] ?? "text-muted-foreground"}`}>{l.status}</span>
                      </td>
                      <td className="px-3 py-3 text-right flex items-center justify-end gap-1">
                        {l.status !== "pago" && (
                          <button
                            title="Marcar como pago"
                            onClick={async () => {
                              try {
                                await updateLancamento(l.id, { status: "pago", pago_em: new Date().toISOString() });
                                toast.success("Marcado como pago!");
                                load();
                              } catch { toast.error("Erro ao atualizar"); }
                            }}
                            className="text-emerald-600 hover:text-emerald-700 opacity-0 group-hover:opacity-100 transition p-1 rounded"
                          >
                            <CheckCircle2 className="size-4" />
                          </button>
                        )}
                        <LancRowMenu lanc={l} onEdit={() => setEditando(l)} onDeleted={load} />
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Surface>
        </>
      )}
    </>
  );
}
