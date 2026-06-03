import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/planne/primitives";
import { Loader2, Search, Package, TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { getEmpresaAtual } from "@/lib/db";

export const Route = createFileRoute("/app/historico-precos")({
  component: HistoricoPrecos,
});

type HistoricoItem = {
  id: string;
  material_id: string;
  preco_custo: number;
  preco_venda: number;
  fonte: string | null;
  vigente_em: string;
  materiais: { nome: string; unidade: string } | null;
};

function HistoricoPrecos() {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    async function load() {
      const empresa = await getEmpresaAtual();
      const empresaId = empresa ? (empresa as { id: string }).id : null;

      let query = supabase
        .from("materiais_historico_preco")
        .select("id,material_id,preco_custo,preco_venda,fonte,vigente_em,materiais(nome,unidade)")
        .order("vigente_em", { ascending: false })
        .limit(500);

      if (empresaId) {
        // materiais globais (empresa_id IS NULL) ou da empresa
        query = query.or(`empresa_id.is.null,empresa_id.eq.${empresaId}`);
      }

      const { data } = await query;
      setHistorico((data ?? []) as unknown as HistoricoItem[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return historico.filter((h) => {
      if (search && !(h.materiais?.nome ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      if (dataInicio && h.vigente_em < dataInicio) return false;
      if (dataFim && h.vigente_em > dataFim + "T23:59:59") return false;
      return true;
    });
  }, [historico, search, dataInicio, dataFim]);

  // Group by material_id to compute price variation
  const variacaoMap = useMemo(() => {
    const map: Record<string, HistoricoItem[]> = {};
    for (const h of historico) {
      if (!map[h.material_id]) map[h.material_id] = [];
      map[h.material_id].push(h);
    }
    const result: Record<string, number | null> = {};
    for (const [matId, items] of Object.entries(map)) {
      const sorted = [...items].sort((a, b) => a.vigente_em.localeCompare(b.vigente_em));
      if (sorted.length < 2) { result[matId + sorted[0]?.id] = null; continue; }
      // For each item, find the previous entry for the same material
      for (let i = 0; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        if (!prev) { result[sorted[i].id] = null; continue; }
        const pct = prev.preco_custo > 0
          ? ((sorted[i].preco_custo - prev.preco_custo) / prev.preco_custo) * 100
          : null;
        result[sorted[i].id] = pct;
      }
    }
    return result;
  }, [historico]);

  return (
    <>
      <PageHeader
        eyebrow="Operação"
        title="Histórico de preços"
        description="Snapshots de custo e preço de venda registrados ao atualizar materiais."
      />

      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <Surface padded={false} className="p-4">
          <div className="text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground">Registros</div>
          <div className="mt-1.5 text-[20px] font-semibold num">{loading ? "—" : filtered.length}</div>
        </Surface>
        <Surface padded={false} className="p-4">
          <div className="text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground">Materiais únicos</div>
          <div className="mt-1.5 text-[20px] font-semibold num">
            {loading ? "—" : new Set(filtered.map((h) => h.material_id)).size}
          </div>
        </Surface>
      </div>

      <Surface padded={false}>
        <div className="border-b border-border p-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[160px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar material..."
              className="w-full h-8 pl-8 pr-3 rounded-md border border-border bg-surface-2 text-[13px] outline-none focus:border-border-strong"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-muted-foreground">De</span>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="h-8 px-2 rounded-md border border-border bg-surface-2 text-[12px] outline-none focus:border-border-strong"
            />
            <span className="text-[12px] text-muted-foreground">até</span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="h-8 px-2 rounded-md border border-border bg-surface-2 text-[12px] outline-none focus:border-border-strong"
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
                  <th className="text-right font-medium px-5 py-2.5">Custo</th>
                  <th className="text-right font-medium px-5 py-2.5">Variação</th>
                  <th className="text-right font-medium px-5 py-2.5">Venda</th>
                  <th className="text-left font-medium px-5 py-2.5">Fonte</th>
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
                            ? "Nenhum registro ainda. Snapshots são salvos automaticamente ao alterar preços de materiais."
                            : "Nenhum resultado."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((h) => {
                  const variacao = variacaoMap[h.id] ?? null;
                  return (
                    <tr key={h.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                      <td className="px-5 py-3">
                        <div className="font-medium">{h.materiais?.nome ?? "—"}</div>
                        <div className="text-[11.5px] text-muted-foreground">{h.materiais?.unidade}</div>
                      </td>
                      <td className="px-5 py-3 text-right num text-muted-foreground">
                        R$ {Number(h.preco_custo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {variacao === null ? (
                          <span className="text-[11.5px] text-muted-foreground">—</span>
                        ) : (
                          <span className={`inline-flex items-center gap-0.5 text-[12px] font-medium num ${variacao > 0 ? "text-destructive" : variacao < 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                            {variacao > 0 ? <TrendingUp className="size-3" /> : variacao < 0 ? <TrendingDown className="size-3" /> : null}
                            {variacao > 0 ? "+" : ""}{variacao.toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right num font-medium">
                        R$ {Number(h.preco_venda).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-[12px]">{h.fonte ?? "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground text-[12px]">
                        {new Date(h.vigente_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
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
