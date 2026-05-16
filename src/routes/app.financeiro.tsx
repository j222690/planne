import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, StatCard } from "@/components/planne/primitives";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useState, useEffect } from "react";
import { getEmpresaAtual } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/financeiro")({
  component: Financeiro,
});

type MonthData = { m: string; entrada: number; saida: number; margem: number };

function Financeiro() {
  const [chartData, setChartData] = useState<MonthData[]>([]);
  const [totais, setTotais] = useState({ receita: 0, custo: 0, margem: 0, aReceber: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const empresa = await getEmpresaAtual();
        if (!empresa) return;

        const { data: orcs } = await supabase
          .from("orcamentos")
          .select("total, subtotal, margem_pct, status, created_at")
          .eq("empresa_id", empresa.id);

        const all = orcs ?? [];

        // Build last 6 months chart
        const months: MonthData[] = [];
        for (let i = 5; i >= 0; i--) {
          const ref = subMonths(new Date(), i);
          const start = startOfMonth(ref);
          const end = endOfMonth(ref);
          const label = format(ref, "MMM", { locale: ptBR });

          const mes = all.filter((o) => {
            const d = new Date(o.created_at);
            return d >= start && d <= end && o.status === "aprovado";
          });

          const entrada = mes.reduce((s, o) => s + (o.total ?? 0), 0);
          const saida = mes.reduce((s, o) => s + ((o.total ?? 0) - ((o.total ?? 0) * (o.margem_pct ?? 0) / 100)), 0);
          const margem = entrada > 0 ? ((entrada - saida) / entrada) * 100 : 0;

          months.push({ m: label, entrada: Math.round(entrada / 1000), saida: Math.round(saida / 1000), margem: parseFloat(margem.toFixed(1)) });
        }
        setChartData(months);

        // Totais
        const aprovados = all.filter((o) => o.status === "aprovado");
        const receita = aprovados.reduce((s, o) => s + (o.total ?? 0), 0);
        const custoTotal = aprovados.reduce((s, o) => s + ((o.total ?? 0) * (1 - (o.margem_pct ?? 0) / 100)), 0);
        const margemMedia = receita > 0 ? ((receita - custoTotal) / receita) * 100 : 0;
        const aReceber = all.filter((o) => o.status === "analise").reduce((s, o) => s + (o.total ?? 0), 0);

        setTotais({ receita, custo: custoTotal, margem: margemMedia, aReceber });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const fmt = (n: number) => n >= 1000
    ? "R$ " + (n / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "k"
    : "R$ " + n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

  return (
    <>
      <PageHeader
        eyebrow="Inteligência"
        title="Financeiro"
        description="Faturamento, margem real e fluxo de caixa por projeto."
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground text-[13px]">
          <Loader2 className="size-4 animate-spin" /> Carregando dados financeiros...
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <StatCard label="Receita acumulada" value={fmt(totais.receita)} hint="orçamentos aprovados" />
            <StatCard label="Custo direto" value={fmt(totais.custo)} hint={`${(100 - totais.margem).toFixed(1)}% da receita`} />
            <StatCard label="Margem média" value={`${totais.margem.toFixed(1)}%`} delta={{ value: totais.margem > 30 ? "acima da meta" : "abaixo da meta", positive: totais.margem > 30 }} />
            <StatCard label="A receber" value={fmt(totais.aReceber)} hint="em análise / pipeline" />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Surface className="lg:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="text-[12.5px] font-medium">Fluxo de caixa</div>
                  <div className="text-[11.5px] text-muted-foreground">Últimos 6 meses · R$ mil</div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-accent inline-block" />Entrada</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-muted-foreground/40 inline-block" />Saída</span>
                </div>
              </div>
              <div className="h-[240px] mt-3 -mx-2">
                <ResponsiveContainer>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="entrada" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="saida" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--muted-foreground)" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="var(--muted-foreground)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={32} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} cursor={{ stroke: "var(--border-strong)" }} />
                    <Area type="monotone" dataKey="entrada" name="Entrada" stroke="var(--accent)" strokeWidth={1.5} fill="url(#entrada)" />
                    <Area type="monotone" dataKey="saida" name="Saída" stroke="var(--muted-foreground)" strokeWidth={1.5} fill="url(#saida)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Surface>

            <Surface>
              <div className="text-[12.5px] font-medium mb-4">Margem por mês</div>
              <div className="space-y-3">
                {chartData.map((d) => (
                  <div key={d.m}>
                    <div className="flex items-center justify-between text-[12.5px] mb-1">
                      <span className="capitalize text-muted-foreground">{d.m}</span>
                      <span className="num font-medium">{d.margem.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${Math.min(d.margem, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {chartData.length === 0 && (
                  <div className="text-[13px] text-muted-foreground text-center py-4">
                    Nenhum dado ainda. Crie orçamentos aprovados para ver a margem.
                  </div>
                )}
              </div>
            </Surface>
          </div>
        </>
      )}
    </>
  );
}
