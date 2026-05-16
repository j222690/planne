import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import { Upload, Sparkles, Search, AlertTriangle, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { getMateriais, getEmpresaAtual } from "@/lib/db";

export const Route = createFileRoute("/app/materiais")({
  component: Materiais,
});

type Material = {
  id: string;
  codigo: string | null;
  nome: string;
  categoria: string | null;
  custo: number;
  estoque: number;
  unidade: string;
  fornecedores: { nome: string } | null;
};

const categorias = ["Todas", "chapas", "ferragens", "fitas", "puxadores", "vidro", "acessorios"];
const catLabel: Record<string, string> = {
  chapas: "Chapas", ferragens: "Ferragens", fitas: "Fitas",
  puxadores: "Puxadores", vidro: "Vidro", acessorios: "Acessórios",
};
const ESTOQUE_MINIMO = 5;

function Materiais() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Todas");

  useEffect(() => {
    async function load() {
      try {
        const empresa = await getEmpresaAtual();
        if (!empresa) throw new Error("Empresa não encontrada");
        const data = await getMateriais(empresa.id);
        setMateriais(data as Material[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar materiais");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = materiais.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      q === "" ||
      m.nome.toLowerCase().includes(q) ||
      (m.codigo ?? "").toLowerCase().includes(q) ||
      (m.fornecedores?.nome ?? "").toLowerCase().includes(q);
    const matchCat = catFilter === "Todas" || m.categoria === catFilter;
    return matchSearch && matchCat;
  });

  const lowStock = materiais.filter((m) => (m.estoque ?? 0) <= ESTOQUE_MINIMO).length;

  return (
    <>
      <PageHeader
        eyebrow="Operação"
        title="Central de materiais"
        description="Catálogo unificado de chapas, ferragens, fitas e acessórios — sincronizado com fornecedores."
        actions={
          <>
            <button className="h-9 px-3 rounded-md border border-border text-[13px] font-medium hover:bg-secondary inline-flex items-center gap-1.5">
              <Upload className="size-3.5" /> Importar catálogo
            </button>
            <button className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> Padronizar com IA
            </button>
          </>
        }
      />

      {lowStock > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/8 px-3.5 py-2.5 text-[13px] text-amber-600">
          <AlertTriangle className="size-4 shrink-0" />
          <span><strong>{lowStock}</strong> {lowStock === 1 ? "material está" : "materiais estão"} abaixo do estoque mínimo.</span>
        </div>
      )}

      <Surface padded={false}>
        <div className="border-b border-border p-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar material, código ou fornecedor..."
              className="w-full h-8 pl-8 pr-3 rounded-md border border-border bg-surface-2 text-[13px] outline-none focus:border-border-strong"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {categorias.map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={`text-[12px] px-2 py-1 rounded-sm border transition-colors ${
                  catFilter === c
                    ? "border-border-strong bg-secondary text-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                {catLabel[c] ?? c}
              </button>
            ))}
          </div>
          {!loading && <div className="ml-auto text-[12px] text-muted-foreground">{filtered.length} itens</div>}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-[13px]">
            <Loader2 className="size-4 animate-spin" /> Carregando materiais...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 gap-2 text-destructive text-[13px]">
            <AlertCircle className="size-4" /> {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[640px]">
              <thead className="text-[11.5px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <Th>Código</Th><Th>Material</Th><Th>Categoria</Th><Th>Fornecedor</Th>
                  <Th className="text-right">Custo (R$)</Th><Th className="text-right">Estoque</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                      {materiais.length === 0 ? "Nenhum material cadastrado. Importe um catálogo para começar." : "Nenhum resultado encontrado."}
                    </td>
                  </tr>
                ) : filtered.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                    <td className="px-5 py-3 font-mono text-[12px] text-muted-foreground">{m.codigo ?? "—"}</td>
                    <td className="px-5 py-3 font-medium">{m.nome}</td>
                    <td className="px-5 py-3"><Pill>{catLabel[m.categoria ?? ""] ?? m.categoria ?? "—"}</Pill></td>
                    <td className="px-5 py-3 text-muted-foreground">{m.fornecedores?.nome ?? "—"}</td>
                    <td className="px-5 py-3 text-right num">
                      {(m.custo ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`num ${(m.estoque ?? 0) <= ESTOQUE_MINIMO ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                        {m.estoque ?? 0}
                      </span>
                      {(m.estoque ?? 0) <= ESTOQUE_MINIMO && (
                        <AlertTriangle className="size-3 text-amber-500 inline-block ml-1" />
                      )}
                      <span className="text-[11px] text-muted-foreground ml-0.5">{m.unidade}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
    </>
  );
}
function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`text-left font-medium px-5 py-2.5 ${className}`}>{children}</th>;
}
