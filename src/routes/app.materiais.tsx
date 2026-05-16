import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import { Upload, Sparkles, Search, AlertTriangle, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { getMateriais, getEmpresaAtual } from "@/lib/db";

export const Route = createFileRoute("/app/materiais")({
  component: Materiais,
});

type Material = {
  id: string; codigo: string | null; nome: string;
  unidade: string; preco_custo: number; preco_venda: number;
  ativo: boolean;
  fornecedores: { nome: string } | null;
  categorias_material: { nome: string } | null;
};

function Materiais() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const empresa = await getEmpresaAtual();
        if (!empresa) throw new Error("Empresa não encontrada");
        const data = await getMateriais(empresa.id);
        setMateriais(data as Material[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = materiais.filter((m) =>
    search === "" ||
    m.nome.toLowerCase().includes(search.toLowerCase()) ||
    (m.codigo ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (m.fornecedores?.nome ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        eyebrow="Operação"
        title="Central de materiais"
        description="Catálogo unificado de chapas, ferragens, fitas e acessórios."
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
          {!loading && <div className="ml-auto text-[12px] text-muted-foreground">{filtered.length} itens</div>}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-[13px]">
            <Loader2 className="size-4 animate-spin" /> Carregando...
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
                  <th className="text-left font-medium px-5 py-2.5">Código</th>
                  <th className="text-left font-medium px-5 py-2.5">Material</th>
                  <th className="text-left font-medium px-5 py-2.5">Categoria</th>
                  <th className="text-left font-medium px-5 py-2.5">Fornecedor</th>
                  <th className="text-right font-medium px-5 py-2.5">Custo (R$)</th>
                  <th className="text-right font-medium px-5 py-2.5">Venda (R$)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                      {materiais.length === 0
                        ? "Nenhum material cadastrado. Use 'Importar catálogo' para começar."
                        : "Nenhum resultado encontrado."}
                    </td>
                  </tr>
                ) : filtered.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                    <td className="px-5 py-3 font-mono text-[12px] text-muted-foreground">{m.codigo ?? "—"}</td>
                    <td className="px-5 py-3 font-medium">{m.nome}</td>
                    <td className="px-5 py-3"><Pill>{m.categorias_material?.nome ?? "—"}</Pill></td>
                    <td className="px-5 py-3 text-muted-foreground">{m.fornecedores?.nome ?? "—"}</td>
                    <td className="px-5 py-3 text-right num">
                      {Number(m.preco_custo ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-right num">
                      {Number(m.preco_venda ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
