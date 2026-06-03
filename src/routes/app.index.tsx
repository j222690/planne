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
  const [metas, setMetas] = useState<{meta_faturamento:number;meta_margem:number}|null>(null);

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
        setOrcs(allOrcs as unknown as typeof orcs);
        setMarginData(margem);
        // Feature 4: load goals
        const p = (empresa as {parametros?: Record<string,unknown>}).parametros ?? {};
        const mf = Number(p.meta_faturamento ?? 0);
        const mm = Number(p.meta_margem ?? 0);
        if (mf > 0 || mm > 0) setMetas({ meta_faturamento: mf, meta_margem: mm });
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

  const aprovados = orcs.filter((o) => o.status === "aprovado");
  const elegíveis = orcs.filter((o) => ["aprovado", "recusado", "analise"].includes(o.status));
  const conversaoPct = elegíveis.length > 0 ? Math.round(aprovados.length / elegíveis.length * 100) : 0;
  const ticketMedio = aprovados.length > 0 ? aprovados.reduce((s, o) => s + (o.total ?? 0), 0) / aprovados.length : 0;

  const topClientes = (() => {
    const map: Record<string, { nome: string; total: number; qtd: number }> = {};
    for (const o of aprovados) {
      const nome = o.clientes?.nome ?? "—";
      if (!map[nome]) map[nome] = { nome, total: 0, qtd: 0 };
      map[nome].total += o.total ?? 0;
      map[nome].qtd++;
    }
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  })();

  const alertas = orcs.filter((o) => {
    if (o.status !== "analise") return false;
    const dias = (Date.now() - new Date(o.created_at).getTime()) / 86400000;
    return dias >= 5;
  });

  return (
    <>
      <PageHeader
        eyebrow="Visão geral"
        title="Bom dia."
        description="Panorama da operação."
        actions={
          <>
            <button
              onClick={() => {
                const rows = [["Número","Cliente","Projeto","Total","Status","Data"]]
                  .concat(orcs.map((o) => [
                    (o as {numero?:string|null}).numero ?? "",
                    o.clientes?.nome ?? "",
                    (o as {projetos:{nome:string}|null}).projetos?.nome ?? "",
                    String(o.total ?? 0),
                    o.status,
                    new Date(o.created_at).toLocaleDateString("pt-BR"),
                  ]));
                const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
                a.download = `orcamentos_${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
              }}
              className="h-9 px-3 rounded-md border border-border text-[13px] font-medium hover:bg-secondary inline-flex items-center gap-1.5"
            >
              <Download className="size-3.5" /> Exportar CSV
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
            <StatCard label="Conversão" value={`${conversaoPct}%`} hint={`${aprovados.length} de ${elegíveis.length} fechados`} />
            <StatCard label="Ticket médio" value={fmt(ticketMedio)} hint="orçamentos aprovados" />
          </div>

          {/* Feature 4: Monthly goals */}
          {metas && (metas.meta_faturamento > 0 || metas.meta_margem > 0) && (
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {metas.meta_faturamento > 0 && (() => {
                const cur = stats?.faturamentoMes ?? 0;
                const pct = Math.min(100, Math.round(cur / metas.meta_faturamento * 100));
                return (
                  <div className="bg-surface border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[12px] font-medium">Meta de faturamento</div>
                      <div className="text-[11.5px] text-muted-foreground">{pct}%</div>
                    </div>
                    <div className="text-[11.5px] text-muted-foreground mb-2">{fmt(cur)} de {fmt(metas.meta_faturamento)}</div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })()}
              {metas.meta_margem > 0 && (() => {
                const cur = stats?.margemMedia ?? 0;
                const pct = Math.min(100, Math.round(cur / metas.meta_margem * 100));
                return (
                  <div className="bg-surface border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[12px] font-medium">Meta de margem</div>
                      <div className="text-[11.5px] text-muted-foreground">{pct}%</div>
                    </div>
                    <div className="text-[11.5px] text-muted-foreground mb-2">{cur.toFixed(1)}% de {metas.meta_margem}%</div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

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
              <div className="text-[12.5px] font-medium mb-1">Top clientes</div>
              <div className="text-[11.5px] text-muted-foreground mb-3">Por receita aprovada</div>
              {topClientes.length === 0 ? (
                <div className="text-[12.5px] text-muted-foreground text-center py-4">Nenhum orçamento aprovado ainda.</div>
              ) : topClientes.map((c, i) => (
                <div key={c.nome} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                  <span className="text-[10px] text-muted-foreground w-4 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-medium truncate">{c.nome}</div>
                    <div className="text-[10.5px] text-muted-foreground">{c.qtd} orç.</div>
                  </div>
                  <span className="text-[12px] num font-medium text-emerald-600 shrink-0">{fmt(c.total)}</span>
                </div>
              ))}

              {alertas.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="text-[11px] font-medium text-amber-600 mb-2">⚠ Em análise há +5 dias</div>
                  {alertas.map((o) => {
                    const dias = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 86400000);
                    return (
                      <div key={o.id} className="flex justify-between text-[11.5px] py-1 border-b border-border/50 last:border-0">
                        <span className="truncate text-muted-foreground">{o.clientes?.nome ?? "—"}</span>
                        <span className="shrink-0 text-amber-600 ml-2">{dias}d</span>
                      </div>
                    );
                  })}
                </div>
              )}
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
