import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/planne/primitives";
import { Loader2, Sparkles, Image as ImageIcon, FolderOpen, TrendingUp, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { getEmpresaAtual } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app/dashboard-ia")({
  component: DashboardIA,
});

type AIStats = {
  totalProjetos: number;
  totalRenders: number;
  rendersCompletos: number;
  totalTokens: number;
  custoTotal: number;
  temUsoRegistrado: boolean;
  projetosRecentes: { id: string; nome: string; ambiente: string; created_at: string; render_url: string | null }[];
  rendersRecentes: { id: string; status: string; created_at: string; url_resultado: string | null }[];
};

function DashboardIA() {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const empresa = await getEmpresaAtual();
      if (!empresa) return;
      const eid = (empresa as { id: string }).id;

      // BUG corrigido: renders liam de "render_jobs" (tabela legada, nunca
      // recebe INSERT) — o job real de render 3D vive em "render3d_job".
      // "ai_usage" existe mas também nunca era escrita em lugar nenhum do
      // sistema (dashboard sempre mostrava 0/$0 mesmo com IA sendo usada de
      // verdade) — instrumentamos a escrita real em api/agent.ts.
      const [{ data: projetos }, { data: renders }, { data: usage }] = await Promise.all([
        supabase.from("room_projects").select("id,nome,ambiente,created_at,render_url").eq("empresa_id", eid).order("created_at", { ascending: false }).limit(10),
        supabase.from("render3d_job").select("id,status,created_at,image_path").eq("empresa_id", eid).order("created_at", { ascending: false }).limit(20),
        supabase.from("ai_usage").select("tokens_input,tokens_output,custo_usd").eq("empresa_id", eid),
      ]);

      const totalTokens = (usage ?? []).reduce(
        (s: number, u: { tokens_input: number; tokens_output: number }) =>
          s + (Number(u.tokens_input) || 0) + (Number(u.tokens_output) || 0),
        0,
      );
      const custoTotal = (usage ?? []).reduce((s: number, u: { custo_usd: number }) => s + (Number(u.custo_usd) || 0), 0);

      const rendersConvertidos = (renders ?? []).map((r: { id: string; status: string; created_at: string; image_path: string | null }) => ({
        id: r.id,
        status: r.status,
        created_at: r.created_at,
        url_resultado: r.image_path
          ? supabase.storage.from("renders3d").getPublicUrl(r.image_path).data.publicUrl
          : null,
      }));

      setStats({
        totalProjetos: projetos?.length ?? 0,
        totalRenders: rendersConvertidos.length,
        rendersCompletos: rendersConvertidos.filter((r) => r.status === "completed").length,
        totalTokens,
        custoTotal,
        temUsoRegistrado: (usage ?? []).length > 0,
        projetosRecentes: projetos ?? [],
        rendersRecentes: rendersConvertidos,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Carregando...
      </div>
    );
  }

  const s = stats!;
  const fmtUsd = (v: number) => v < 0.01 ? "< $0.01" : `$${v.toFixed(2)}`;

  return (
    <>
      <PageHeader
        eyebrow="Inteligência"
        title="Dashboard IA"
        description="Uso, custos e projetos gerados pela inteligência artificial."
      />

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Projetos IA", value: s.totalProjetos, icon: FolderOpen, color: "text-violet-500" },
          { label: "Renders gerados", value: s.totalRenders, icon: ImageIcon, color: "text-blue-500" },
          { label: "Renders prontos", value: s.rendersCompletos, icon: Sparkles, color: "text-emerald-500" },
          { label: "Tokens usados", value: s.totalTokens.toLocaleString("pt-BR"), icon: Zap, color: "text-amber-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Surface key={label} padded={false} className="p-4 flex items-start gap-3">
            <div className={`mt-0.5 ${color}`}><Icon className="size-4" /></div>
            <div>
              <div className="text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
              <div className="mt-1 text-[20px] font-semibold num">{value}</div>
            </div>
          </Surface>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Projetos recentes */}
        <Surface>
          <div className="text-[12.5px] font-semibold mb-3 flex items-center gap-2">
            <FolderOpen className="size-3.5 text-muted-foreground" /> Projetos IA recentes
          </div>
          {s.projetosRecentes.length === 0 ? (
            <div className="text-[12.5px] text-muted-foreground py-4 text-center">
              Nenhum projeto IA criado ainda.<br />
              <span className="text-[11.5px]">Use o módulo <strong>IA Projetos</strong> para começar.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {s.projetosRecentes.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="size-10 rounded-md bg-surface-2 border border-border overflow-hidden shrink-0 grid place-items-center">
                    {p.render_url
                      ? <img src={p.render_url} alt="" className="size-full object-cover" />
                      : <Sparkles className="size-4 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-medium truncate">{p.nome}</div>
                    <div className="text-[11.5px] text-muted-foreground">{p.ambiente} · {new Date(p.created_at).toLocaleDateString("pt-BR")}</div>
                  </div>
                  {p.render_url && (
                    <a href={p.render_url} target="_blank" rel="noreferrer"
                      className="shrink-0 text-[11.5px] text-accent hover:underline">Ver render</a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Surface>

        {/* Custo e renders */}
        <div className="space-y-4">
          <Surface>
            <div className="text-[12.5px] font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="size-3.5 text-muted-foreground" /> Custo de API
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-[12.5px]">Custo total (OpenAI + Groq)</span>
                <span className="text-[13px] font-semibold num">{fmtUsd(s.custoTotal)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-[12.5px]">Tokens processados</span>
                <span className="text-[13px] font-semibold num">{s.totalTokens.toLocaleString("pt-BR")}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[12.5px]">Custo médio por projeto</span>
                <span className="text-[13px] font-semibold num">
                  {s.totalProjetos > 0 ? fmtUsd(s.custoTotal / s.totalProjetos) : "—"}
                </span>
              </div>
            </div>
            {!s.temUsoRegistrado && (
              <div className="mt-3 text-[11px] text-muted-foreground border-t border-border pt-2">
                Sem uso registrado ainda — hoje só o chat do Grat grava custo real. Análise de
                planta/foto e outros pontos de IA ainda não instrumentam essa métrica.
              </div>
            )}
          </Surface>

          <Surface>
            <div className="text-[12.5px] font-semibold mb-3 flex items-center gap-2">
              <ImageIcon className="size-3.5 text-muted-foreground" /> Renders recentes
            </div>
            {s.rendersRecentes.length === 0 ? (
              <div className="text-[12.5px] text-muted-foreground">Nenhum render gerado ainda.</div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {s.rendersRecentes.slice(0, 6).map((r) => (
                  <div key={r.id} className="aspect-square rounded-md bg-surface-2 border border-border overflow-hidden">
                    {r.url_resultado
                      ? <img src={r.url_resultado} alt="" className="size-full object-cover" />
                      : (
                        <div className="size-full grid place-items-center">
                          <span className={`text-[10px] ${r.status === "completed" || r.status === "Ready" ? "text-emerald-500" : "text-muted-foreground"}`}>
                            {r.status}
                          </span>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </Surface>
        </div>
      </div>
    </>
  );
}
