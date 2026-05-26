import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import { Upload, Sparkles, Search, Loader2, AlertCircle, Plus, X, MoreHorizontal, Pencil, Trash2, ImageOff } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { getMateriais, getEmpresaAtual, getFornecedores, upsertMaterial, updateMaterial, deleteMaterial } from "@/lib/db";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/app/materiais")({
  component: Materiais,
});

type Material = {
  id: string; codigo: string | null; nome: string;
  unidade: string; preco_custo: number; preco_venda: number;
  ativo: boolean; fornecedor_id: string | null;
  cor: string | null; espessura_mm: number | null; imagem_url: string | null;
  fornecedores: { nome: string } | null;
  categorias_material: { nome: string } | null;
};

function getCategoria(nome: string): string {
  const prefix = nome.split(" - ")[0].split(" ")[0];
  const map: Record<string, string> = {
    MDF: "MDF", Chapa: "Chapas", Puxador: "Puxadores", Corrediça: "Ferragens",
    Dobradiça: "Ferragens", Dobradica: "Ferragens", Corredi: "Ferragens",
    Parafuso: "Acessórios", Cola: "Acessórios", Furador: "Acessórios", Pino: "Acessórios",
    Vidro: "Vidros", Espelho: "Vidros", Acabamento: "Acabamentos", Fita: "Acabamentos",
  };
  for (const [k, v] of Object.entries(map)) {
    if (nome.startsWith(k)) return v;
  }
  return prefix || "Outros";
}

const matSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  codigo: z.string().optional(),
  unidade: z.string().default("un"),
  preco_custo: z.coerce.number().min(0).default(0),
  preco_venda: z.coerce.number().min(0).default(0),
  categoria: z.string().optional(),
  cor: z.string().optional(),
  espessura_mm: z.coerce.number().optional(),
  fornecedor_id: z.string().optional(),
});
type MatForm = z.infer<typeof matSchema>;

const CATEGORIAS_OPCOES = ["MDF", "Chapas", "Puxadores", "Ferragens", "Vidros", "Acabamentos", "Acessórios", "Outros"];
const UNIDADES = ["un", "chapa", "metro", "par", "caixa", "kg", "m²"];

function MaterialModal({ onClose, onSaved, empresaId, initialData }: {
  onClose: () => void; onSaved: () => void; empresaId: string | null; initialData?: Material;
}) {
  const [fornecedores, setFornecedores] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    if (empresaId) getFornecedores(empresaId).then((f) => setFornecedores(f as { id: string; nome: string }[]));
  }, [empresaId]);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<MatForm>({
    resolver: zodResolver(matSchema),
    defaultValues: initialData ? {
      nome: initialData.nome, codigo: initialData.codigo ?? "",
      unidade: initialData.unidade, preco_custo: initialData.preco_custo,
      preco_venda: initialData.preco_venda,
      categoria: getCategoria(initialData.nome),
      cor: initialData.cor ?? "", espessura_mm: initialData.espessura_mm ?? undefined,
      fornecedor_id: initialData.fornecedor_id ?? "",
    } : { unidade: "un", preco_custo: 0, preco_venda: 0 },
  });

  const custo = watch("preco_custo");
  const applyMargem = (pct: number) => {
    const c = Number(custo) || 0;
    if (!c) return;
    setValue("preco_venda", parseFloat((c / (1 - pct / 100)).toFixed(2)));
  };

  const onSubmit = async (data: MatForm) => {
    try {
      const payload = {
        nome: data.nome, codigo: data.codigo || null, unidade: data.unidade,
        preco_custo: data.preco_custo, preco_venda: data.preco_venda,
        cor: data.cor || null, espessura_mm: data.espessura_mm || null,
        fornecedor_id: data.fornecedor_id || null,
      };
      if (initialData) {
        await updateMaterial(initialData.id, payload);
        toast.success("Material atualizado!");
      } else {
        if (!empresaId) { toast.error("Empresa não encontrada"); return; }
        await upsertMaterial(empresaId, payload);
        toast.success("Material cadastrado!");
      }
      onSaved(); onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.18 }}
        className="relative w-full max-w-lg bg-surface border border-border rounded-lg shadow-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[15px] font-semibold">{initialData ? "Editar material" : "Novo material"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <div className="text-[11.5px] text-muted-foreground mb-1">Nome *</div>
              <input {...register("nome")} placeholder="MDF 15mm Branco TX"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
              {errors.nome && <div className="text-[11px] text-destructive mt-1">{errors.nome.message}</div>}
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Código</div>
              <input {...register("codigo")} placeholder="MDF-15-BR"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Unidade</div>
              <select {...register("unidade")}
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground">
                {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Custo (R$)</div>
              <input {...register("preco_custo")} type="number" step="0.01" min="0"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Preço venda (R$)</div>
              <input {...register("preco_venda")} type="number" step="0.01" min="0"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
            Aplicar margem:
            {[30, 35, 40, 50].map((pct) => (
              <button key={pct} type="button" onClick={() => applyMargem(pct)}
                className="px-2 py-0.5 rounded border border-border hover:bg-secondary text-[11px]">{pct}%</button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Categoria</div>
              <select {...register("categoria")}
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground">
                <option value="">Selecione...</option>
                {CATEGORIAS_OPCOES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Cor</div>
              <input {...register("cor")} placeholder="Branco TX"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Esp. (mm)</div>
              <input {...register("espessura_mm")} type="number" step="0.1" min="0"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
            </div>
          </div>
          <div>
            <div className="text-[11.5px] text-muted-foreground mb-1">Fornecedor</div>
            <select {...register("fornecedor_id")}
              className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground">
              <option value="">Sem fornecedor</option>
              {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting}
              className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5">
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />} {initialData ? "Salvar alterações" : "Salvar material"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function MatRowMenu({ material, onEdit, onDeleted }: { material: Material; onEdit: () => void; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const handleDelete = () => {
    setOpen(false);
    toast(`Desativar "${material.nome}"?`, {
      action: { label: "Desativar", onClick: async () => {
        try { await deleteMaterial(material.id); toast.success("Material desativado"); onDeleted(); }
        catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
      }},
      cancel: { label: "Cancelar", onClick: () => {} },
    });
  };
  return (
    <div ref={ref} className="relative">
      <button onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-foreground p-1 rounded">
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
            <Trash2 className="size-3.5" /> Desativar
          </button>
        </div>
      )}
    </div>
  );
}

function Materiais() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Todos");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Material | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      // Carrega empresa em paralelo (opcional — apenas para operações de escrita)
      const [empresaResult, data] = await Promise.allSettled([
        getEmpresaAtual(),
        getMateriais(),
      ]);
      if (empresaResult.status === "fulfilled" && empresaResult.value) {
        setEmpresaId((empresaResult.value as { id: string }).id);
      }
      if (data.status === "rejected") throw data.reason;
      setMateriais(data.value as Material[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar materiais");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !empresaId) { toast.error("Empresa não vinculada"); return; }
    setCsvImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) { toast.error("CSV vazio ou inválido"); return; }
      const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase());
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(",").map((v) => v.replace(/^"|"$/g, "").trim());
        return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
      });
      const payload = rows.filter((r) => r.nome).map((r) => ({
        nome: r.nome, codigo: r.codigo || null, unidade: r.unidade || "un",
        preco_custo: parseFloat(r.preco_custo || r["preço_custo"] || r.custo || "0") || 0,
        preco_venda: parseFloat(r.preco_venda || r["preço_venda"] || r.venda || "0") || 0,
        categoria: r.categoria || null, empresa_id: empresaId, ativo: true,
      }));
      if (!payload.length) { toast.error("Nenhuma linha válida"); return; }
      const { error: err } = await supabase.from("materiais").insert(payload);
      if (err) throw err;
      toast.success(`${payload.length} materiais importados!`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao importar");
    } finally {
      setCsvImporting(false);
      if (csvRef.current) csvRef.current.value = "";
    }
  };

  const categorias = useMemo(() => {
    const cats = new Set(materiais.map((m) => getCategoria(m.nome)));
    return ["Todos", ...Array.from(cats).sort()];
  }, [materiais]);

  const filtered = useMemo(() => materiais.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.nome.toLowerCase().includes(q) || (m.codigo ?? "").toLowerCase().includes(q) || (m.cor ?? "").toLowerCase().includes(q);
    const matchCat = catFilter === "Todos" || getCategoria(m.nome) === catFilter;
    return matchSearch && matchCat;
  }), [materiais, search, catFilter]);

  return (
    <>
      <AnimatePresence>
        {(showModal || editando) && (
          <MaterialModal
            onClose={() => { setShowModal(false); setEditando(null); }}
            onSaved={load}
            empresaId={empresaId}
            initialData={editando ?? undefined}
          />
        )}
      </AnimatePresence>

      <PageHeader
        eyebrow="Operação"
        title="Central de materiais"
        description="Catálogo unificado de chapas, ferragens, fitas e acessórios."
        actions={
          <>
            <button onClick={() => csvRef.current?.click()} disabled={csvImporting}
              className="h-9 px-3 rounded-md border border-border text-[13px] font-medium hover:bg-secondary inline-flex items-center gap-1.5 disabled:opacity-60">
              {csvImporting ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              Importar CSV
            </button>
            <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvImport} />
            <button onClick={() => setShowModal(true)}
              className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5">
              <Plus className="size-3.5" /> Novo material
            </button>
            <button className="h-9 px-3 rounded-md border border-border text-[13px] font-medium hover:bg-secondary inline-flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> Padronizar com IA
            </button>
          </>
        }
      />

      <Surface padded={false}>
        {/* Search + category chips + view toggle */}
        <div className="border-b border-border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, código, cor..."
                className="w-full h-8 pl-8 pr-3 rounded-md border border-border bg-surface-2 text-[13px] outline-none focus:border-border-strong" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              {!loading && <span className="text-[12px] text-muted-foreground">{filtered.length} itens</span>}
              <button onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
                className="h-8 px-2.5 rounded-md border border-border text-[12px] hover:bg-secondary text-muted-foreground">
                {viewMode === "grid" ? "Tabela" : "Grade"}
              </button>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {categorias.map((cat) => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className={`text-[12px] px-2.5 py-1 rounded-full border transition-colors ${catFilter === cat ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground text-[13px]">
            <Loader2 className="size-4 animate-spin" /> Carregando catálogo...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 gap-2 text-destructive text-[13px]">
            <AlertCircle className="size-4" /> {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-muted-foreground">
            {materiais.length === 0
              ? <span>Nenhum material. <button onClick={() => setShowModal(true)} className="text-foreground underline">Cadastrar primeiro →</button></span>
              : "Nenhum resultado."}
          </div>
        ) : viewMode === "grid" ? (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map((m) => (
              <motion.div key={m.id} layout
                className="group relative bg-surface-2 border border-border rounded-lg overflow-hidden hover:border-border-strong hover:shadow-sm transition-all cursor-pointer"
                onClick={() => setEditando(m)}
              >
                <div className="aspect-square bg-secondary relative overflow-hidden">
                  {m.imagem_url ? (
                    <img src={m.imagem_url} alt={m.nome}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageOff className="size-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition">
                    <MatRowMenu material={m} onEdit={() => setEditando(m)} onDeleted={load} />
                  </div>
                  {m.cor && (
                    <div className="absolute bottom-1.5 left-1.5">
                      <span className="text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded-full">{m.cor}</span>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <div className="text-[12px] font-medium leading-tight line-clamp-2">{m.nome}</div>
                  {m.espessura_mm && <div className="text-[10.5px] text-muted-foreground mt-0.5">{m.espessura_mm}mm</div>}
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{m.unidade}</span>
                    <span className="text-[12px] font-semibold num">R$ {Number(m.preco_venda).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[720px]">
              <thead className="text-[11.5px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left font-medium px-4 py-2.5 w-10"></th>
                  <th className="text-left font-medium px-4 py-2.5">Material</th>
                  <th className="text-left font-medium px-4 py-2.5">Categoria</th>
                  <th className="text-left font-medium px-4 py-2.5">Cor / Esp.</th>
                  <th className="text-left font-medium px-4 py-2.5">Fornecedor</th>
                  <th className="text-right font-medium px-4 py-2.5">Custo</th>
                  <th className="text-right font-medium px-4 py-2.5">Venda</th>
                  <th className="w-8 px-2 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} onClick={() => setEditando(m)}
                    className="border-b border-border last:border-0 hover:bg-secondary/40 cursor-pointer group">
                    <td className="px-4 py-2">
                      {m.imagem_url ? (
                        <img src={m.imagem_url} alt="" className="size-8 rounded object-cover bg-secondary"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className="size-8 rounded bg-secondary flex items-center justify-center">
                          <ImageOff className="size-3.5 text-muted-foreground/40" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium text-[13px]">{m.nome}</div>
                      {m.codigo && <div className="text-[11px] text-muted-foreground font-mono">{m.codigo}</div>}
                    </td>
                    <td className="px-4 py-2">
                      <Pill tone="neutral">{getCategoria(m.nome)}</Pill>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-[12.5px]">
                      {[m.cor, m.espessura_mm ? `${m.espessura_mm}mm` : null].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-[12.5px]">{m.fornecedores?.nome ?? "—"}</td>
                    <td className="px-4 py-2 text-right num text-muted-foreground">R$ {Number(m.preco_custo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2 text-right num font-medium">R$ {Number(m.preco_venda).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <MatRowMenu material={m} onEdit={() => setEditando(m)} onDeleted={load} />
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
