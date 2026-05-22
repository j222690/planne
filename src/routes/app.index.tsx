import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, StatCard, Surface, Pill } from "@/components/planne/primitives";
import { useState, useEffect } from "react";
import { Plus, Download, Loader2 } from "lucide-react";
import { getEmpresaAtual, getDashboardStats, getOrcamentos, getMargemSemanal } from "@/lib/db";
import {
  ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const STATUS_TONE: Record<string, "amber"|"green"|"blue"|"neutral"> = {
  rascunho: "neutral", analise: "amber", aprovado: "green", recusado: "neutral",
};
const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho", analise: "Em análise", aprovado: "Aprovado", recusado: "Recusado",
};

function Dashboard() {
  const [stats, setStats] = useState<{faturamentoMes:number;margemMedia:number;projetosAtivos:number;emAnalise:number}|null>(null);
  const [orcs, setOrcs] = useState<{id:string;status:string;total:number;created_at:string;clientes:{nome:string}|null;projetos:{nome:string}|null}[]>([]);
  const [marginData, setMarginData] = useState<{m:string;real:number;est:number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const empresa = await getEmpresaAtual();
        if (!empresa) return;
        const eid = (empresa as {id:string}).id;
        const [s, allOrcs, margem] = await Promise.all([
          getDashboardStats(eid),
          getOrcamentos(eid),
          getMargemSemanal(eid),
        ]);
        setStats(s);
        setOrcs(allOrcs as typeof orcs);
        setMarginData(margem);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const fmt = (n: number) =>
    n >= 1000
      ? "R$ " + (n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "k"
      : "R$ " + n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

  return (
    <>
      <PageHeader
        eyebrow="Visão geral"
        title="Bom dia."
        description="Panorama da operação."
        actions={
          <>
            <button className="h-9 px-3 rounded-md border border-border text-[13px] font-medium hover:bg-secondary inline-flex items-center gap-1.5">
              <Download className="size-3.5" /> Exportar
            </button>
            <Link to="/app/orcamentos" className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5">
              <Plus className="size-3.5" /> Novo orçamento
            </Link>
          </>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground text-[13px]">
          <Loader2 className="size-4 animate-spin" /> Carregando dados...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Faturamento (mês)" value={fmt(stats?.faturamentoMes ?? 0)} hint="orçamentos aprovados" />
            <StatCard label="Margem média" value={`${(stats?.margemMedia ?? 0).toFixed(1)}%`} hint="todos os orçamentos" />
            <StatCard label="Projetos ativos" value={String(stats?.projetosAtivos ?? 0)} hint="em andamento" />
            <StatCard label="Em análise" value={String(stats?.emAnalise ?? 0)} hint="aguardando aprovação" />
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Surface className="lg:col-span-2">
              <div className="text-[12.5px] font-medium">Margem real vs. estimada</div>
              <div className="text-[11.5px] text-muted-foreground mb-3">Últimas 4 semanas · % de margem</div>
              <div className="flex items-center gap-3 mb-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-accent inline-block"/>Real (aprovados)</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-muted-foreground/35 inline-block"/>Estimada (todos)</span>
              </div>
              {marginData.every((d) => d.real === 0 && d.est === 0) ? (
                <div className="h-[220px] flex items-center justify-center text-[13px] text-muted-foreground">
                  Nenhum orçamento nas últimas 4 semanas.
                </div>
              ) : (
                <div className="h-[220px] -mx-2">
                  <ResponsiveContainer>
                    <BarChart data={marginData} barCategoryGap={20}>
                      <CartesianGrid stroke="var(--border)" vertical={false}/>
                      <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false}/>
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={28}/>
                      <Tooltip contentStyle={{background:"var(--popover)",border:"1px solid var(--border)",borderRadius:6,fontSize:12}} cursor={{fill:"var(--secondary)"}}/>
                      <Bar dataKey="real" name="Real" fill="var(--accent)" radius={[2,2,0,0]}/>
                      <Bar dataKey="est" name="Estimada" fill="var(--muted-foreground)" opacity={0.35} radius={[2,2,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Surface>

            <Surface>
              <div className="text-[12.5px] font-medium mb-1">Status dos orçamentos</div>
              <div className="text-[11.5px] text-muted-foreground mb-4">Distribuição total</div>
              {["rascunho","analise","aprovado","recusado"].map((s) => {
                const count = orcs.filter((o) => o.status === s).length;
                return (
                  <div key={s} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-[13px]">
                    <Pill tone={STATUS_TONE[s]}>{STATUS_LABEL[s]}</Pill>
                    <span className="num text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </Surface>
          </div>

          <Surface padded={false} className="mt-5">
            <div className="flex items-center justify-between p-5 pb-3">
              <div className="text-[12.5px] font-medium">Orçamentos recentes</div>
              <Link to="/app/orcamentos" className="text-[12px] text-muted-foreground hover:text-foreground">Ver todos →</Link>
            </div>
            <div className="border-t border-border overflow-x-auto">
              <table className="w-full text-[13px] min-w-[560px]">
                <thead className="text-[11.5px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="text-left font-medium px-5 py-2.5">Cliente</th>
                    <th className="text-left font-medium px-5 py-2.5">Projeto</th>
                    <th className="text-right font-medium px-5 py-2.5">Total (R$)</th>
                    <th className="text-left font-medium px-5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orcs.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-[13px]">Nenhum orçamento ainda.</td></tr>
                  ) : orcs.slice(0, 5).map((o) => (
                    <tr key={o.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                      <td className="px-5 py-3 font-medium">{o.clientes?.nome ?? "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground">{(o as {projetos:{nome:string}|null}).projetos?.nome ?? "—"}</td>
                      <td className="px-5 py-3 text-right num">{(o.total??0).toLocaleString("pt-BR",{minimumFractionDigits:2})}</td>
                      <td className="px-5 py-3"><Pill tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]??o.status}</Pill></td>
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
