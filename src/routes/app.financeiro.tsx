import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, StatCard } from "@/components/planne/primitives";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useState, useEffect } from "react";
import { getEmpresaAtual, getFinanceiroMeses } from "@/lib/db";
import { Loader2, Plus } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/app/financeiro")({
  component: Financeiro,
});

type Lancamento = {
  id: string; tipo: string; descricao: string; valor: number;
  status: string; vencimento: string | null; pago_em: string | null;
  categoria: string | null;
};

function Financeiro() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [totais, setTotais] = useState({ receita: 0, despesa: 0, aReceber: 0, aPagar: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const empresa = await getEmpresaAtual();
        if (!empresa) return;

        const { data: lancs } = await supabase
          .from("financeiro")
          .select("*")
          .eq("empresa_id", empresa.id)
          .order("created_at", { ascending: false })
          .limit(50);

        const all = lancs ?? [];
        setLancamentos(all as Lancamento[]);

        // Totais
        const receita   = all.filter(l => l.tipo === "entrada" && l.status === "pago").reduce((s,l) => s + Number(l.valor), 0);
        const despesa   = all.filter(l => l.tipo === "saida"   && l.status === "pago").reduce((s,l) => s + Number(l.valor), 0);
        const aReceber  = all.filter(l => l.tipo === "entrada" && l.status !== "pago").reduce((s,l) => s + Number(l.valor), 0);
        const aPagar    = all.filter(l => l.tipo === "saida"   && l.status !== "pago").reduce((s,l) => s + Number(l.valor), 0);
        setTotais({ receita, despesa, aReceber, aPagar });

        // Gráfico 6 meses
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
    }
    load();
  }, []);

  const fmt = (n: number) => "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const STATUS_COLOR: Record<string, string> = {
    pago: "text-emerald-600", pendente: "text-amber-600", atrasado: "text-destructive",
  };

  return (
    <>
      <PageHeader
        eyebrow="Inteligência"
        title="Financeiro"
        description="Entradas, saídas e fluxo de caixa da operação."
        actions={
          <button className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5">
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

          {/* Tabela completa */}
          <Surface padded={false}>
            <div className="p-4 border-b border-border text-[12.5px] font-medium">Todos os lançamentos</div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] min-w-[600px]">
                <thead className="text-[11.5px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="text-left font-medium px-5 py-2.5">Descrição</th>
                    <th className="text-left font-medium px-5 py-2.5">Categoria</th>
                    <th className="text-left font-medium px-5 py-2.5">Tipo</th>
                    <th className="text-right font-medium px-5 py-2.5">Valor</th>
                    <th className="text-left font-medium px-5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground text-[13px]">
                      Nenhum lançamento. Clique em "Lançamento" para adicionar.
                    </td></tr>
                  ) : lancamentos.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                      <td className="px-5 py-3 font-medium">{l.descricao}</td>
                      <td className="px-5 py-3 text-muted-foreground">{l.categoria ?? "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[12px] font-medium ${l.tipo === "entrada" ? "text-emerald-600" : "text-destructive"}`}>
                          {l.tipo === "entrada" ? "Entrada" : "Saída"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right num">R$ {Number(l.valor).toLocaleString("pt-BR",{minimumFractionDigits:2})}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[12px] ${STATUS_COLOR[l.status] ?? "text-muted-foreground"}`}>{l.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Surface>
        </>
      )}
    </>
  );
}
