import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/planne/primitives";
import { TrendingUp, TrendingDown, Minus, Loader2, Search, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { getEmpresaAtual } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app/historico-precos")({
  component: HistoricoPrecos,
});

type HistoricoItem = {
  id: string;
  material_id: string;
  preco_anterior: number;
  preco_novo: number;
  variacao_pct: number | null;
  motivo: string | null;
  created_at: string;
  materiais: { nome: string; unidade: string } | null;
};

function HistoricoPrecos() {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const empresa = await getEmpresaAtual();
      if (!empresa) return;
      const { data } = await supabase
        .from("materiais_historico_preco")
        .select("*,materiais(nome,unidade)")
        .eq("empresa_id", (empresa as { id: string }).id)
        .order("created_at", { ascending: false })
        .limit(300);
      setHistorico(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = historico.filter((h) =>
    search === "" || (h.materiais?.nome ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalAltas = historico.filter((h) => {
    const v = h.variacao_pct ?? ((h.preco_novo - h.preco_anterior) / Math.max(h.preco_anterior, 0.01) * 100);
    return v > 0;
  }).length;

  const mediaVariacao = historico.length === 0 ? 0 :
    historico.reduce((s, h) => {
      const v = h.variacao_pct ?? ((h.preco_novo - h.preco_anterior) / Math.max(h.preco_anterior, 0.01) * 100);
      return s + v;
    }, 0) / historico.length;

  return (
    <>
      <PageHeader
        eyebrow="Operação"
        title="Histórico de preços"
        description="Acompanhe a variação de preço dos materiais ao longo do tempo."
      />

      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <Surface padded={false} className="p-4">
          <div className="text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground">Registros</div>
          <div className="mt-1.5 text-[20px] font-semibold num">{loading ? "—" : historico.length}</div>
        </Surface>
        <Surface padded={false} className="p-4">
          <div className="text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground">Altas de preço</div>
          <div className="mt-1.5 text-[20px] font-semibold num text-destructive">{loading ? "—" : totalAltas}</div>
        </Surface>
        <Surface padded={false} className="p-4">
          <div className="text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground">Variação média</div>
          <div className={`mt-1.5 text-[20px] font-semibold num ${mediaVariacao > 0 ? "text-destructive" : mediaVariacao < 0 ? "text-emerald-600" : ""}`}>
            {loading ? "—" : `${mediaVariacao > 0 ? "+" : ""}${mediaVariacao.toFixed(1)}%`}
          </div>
        </Surface>
      </div>

      <Surface padded={false}>
        <div className="border-b border-border p-3 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar material..."
              className="w-full h-8 pl-8 pr-3 rounded-md border border-border bg-surface-2 text-[13px] outline-none focus:border-border-strong"
            />
          </div>
          {!loading && (
            <div className="ml-auto text-[12px] text-muted-foreground">{filtered.length} registros</div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[640px]">
              <thead className="text-[11.5px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">Material</th>
                  <th className="text-right font-medium px-5 py-2.5">Preço anterior</th>
                  <th className="text-right font-medium px-5 py-2.5">Preço novo</th>
                  <th className="text-right font-medium px-5 py-2.5">Variação</th>
                  <th className="text-left font-medium px-5 py-2.5">Motivo</th>
                  <th className="text-left font-medium px-5 py-2.5">Data</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Package className="size-8 opacity-30" />
                        <span className="text-[13px]">
                          {historico.length === 0
                            ? "Nenhuma variação de preço registrada ainda. As alterações são salvas automaticamente ao editar materiais."
                            : "Nenhum resultado."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((h) => {
                  const variacao = h.variacao_pct ??
                    ((h.preco_novo - h.preco_anterior) / Math.max(h.preco_anterior, 0.01) * 100);
                  const up = variacao > 0.01;
                  const down = variacao < -0.01;
                  return (
                    <tr key={h.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                      <td className="px-5 py-3">
                        <div className="font-medium">{h.materiais?.nome ?? "—"}</div>
                        <div className="text-[11.5px] text-muted-foreground">{h.materiais?.unidade}</div>
                      </td>
                      <td className="px-5 py-3 text-right num text-muted-foreground">
                        R$ {Number(h.preco_anterior).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-right num font-medium">
                        R$ {Number(h.preco_novo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded-full ${
                          up ? "bg-destructive/10 text-destructive"
                          : down ? "bg-emerald-500/10 text-emerald-600"
                          : "text-muted-foreground"
                        }`}>
                          {up ? <TrendingUp className="size-3" /> : down ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
                          {up ? "+" : ""}{variacao.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-[12px]">
                        {h.motivo ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-[12px]">
                        {new Date(h.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
    </>
  );
}
