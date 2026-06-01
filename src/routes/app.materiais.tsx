import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import { Upload, Sparkles, Search, Loader2, AlertCircle, Plus, X, MoreHorizontal, Pencil, Trash2, ImageOff, PackageX } from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  ativo: boolean; fornecedor_id: string | null; categoria_id: string | null;
  cor: string | null; espessura_mm: number | null; imagem_url: string | null;
  largura_mm: number | null; comprimento_mm: number | null;
  fornecedores: { nome: string } | null;
  estoque?: number | null;
  estoque_minimo?: number | null;
};

function getCategoria(nome: string): string {
  const prefix = nome.split(" - ")[0].split(" ")[0];
  const rules: [string, string][] = [
    ["MDF", "MDF"], ["MDP", "MDP"],
    ["Chapa", "Chapas"],
    ["Puxador", "Puxadores"],
    ["Corrediça", "Ferragens"], ["Dobradiça", "Ferragens"], ["Dobradica", "Ferragens"],
    ["Parafuso", "Acessórios"], ["Minifix", "Acessórios"], ["Cavilha", "Acessórios"],
    ["Cola", "Acessórios"], ["Fundo", "Acessórios"], ["Perfil de", "Acessórios"],
    ["Furador", "Acessórios"], ["Pino", "Acessórios"],
    ["Vidro", "Vidros"], ["Espelho", "Vidros"],
    ["Acabamento", "Acabamentos"], ["Fita de Borda", "Acabamentos"],
    ["Fita LED", "Acessórios"],
  ];
  for (const [k, v] of rules) {
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
  imagem_url: z.string().optional(),
  espessura_mm: z.coerce.number().optional(),
  fornecedor_id: z.string().optional(),
  estoque_atual: z.coerce.number().optional(),
  estoque_minimo: z.coerce.number().optional(),
});
type MatForm = z.infer<typeof matSchema>;

const CATEGORIAS_OPCOES = ["MDF", "MDP", "Chapas", "Puxadores", "Ferragens", "Vidros", "Acabamentos", "Acessórios", "Outros"];
const UNIDADES = ["un", "chapa", "m", "m2", "par", "peça", "kg", "l", "hr", "vb", "rolo", "kit"];

// Palavras de cor/acabamento que variam entre variantes do mesmo material
const COR_PALAVRAS = [
  "branco", "preto", "cinza", "grafite", "bege", "off white", "offwhite", "creme",
  "carvalho", "freijo", "freijó", "nogueira", "imbuia", "amendoa", "amêndoa", "mogno",
  "wenge", "teca", "pinheiro", "eucalipto", "madeira", "rústico", "natural",
  "verde", "azul", "vermelho", "amarelo", "marrom", "laranja", "roxo", "rosa",
  "tx", "fosco", "brilhante", "acetinado", "laca", "melamínico", "bp",
  "claro", "escuro", "médio", "light", "dark",
];

function extrairBase(nome: string): string {
  let base = nome.toLowerCase();
  for (const palavra of COR_PALAVRAS) {
    base = base.replace(new RegExp(`\\b${palavra}\\b`, "gi"), "");
  }
  return base.replace(/\s+/g, " ").trim();
}

interface PrecoSugestao {
  custo: number;
  venda: number;
  fonte: string;
  total: number;
}

function buscarPrecoSimilar(nome: string, espessura: number | undefined, unidade: string, todos: Material[], editandoId?: string): PrecoSugestao | null {
  if (!nome || nome.length < 3) return null;
  const base = extrairBase(nome);
  if (!base) return null;

  const candidatos = todos.filter((m) => {
    if (m.id === editandoId) return false;
    if (m.preco_custo === 0 && m.preco_venda === 0) return false;
    const mBase = extrairBase(m.nome);
    // Mesmo tipo base E (mesma espessura OU mesma unidade+base próxima)
    const mesmaTipoBase = base.length > 3 && (mBase.includes(base.slice(0, Math.min(6, base.length))) || base.includes(mBase.slice(0, Math.min(6, mBase.length))));
    const mesmaEsp = espessura && m.espessura_mm === espessura;
    const mesmaUnidade = m.unidade === unidade;
    return (mesmaTipoBase || mesmaEsp) && mesmaUnidade;
  });

  if (!candidatos.length) return null;

  const avgCusto = Math.round(candidatos.reduce((s, m) => s + m.preco_custo, 0) / candidatos.length * 100) / 100;
  const avgVenda = Math.round(candidatos.reduce((s, m) => s + m.preco_venda, 0) / candidatos.length * 100) / 100;

  return {
    custo: avgCusto,
    venda: avgVenda,
    fonte: candidatos.length === 1 ? candidatos[0].nome : `${candidatos.length} similares`,
    total: candidatos.length,
  };
}

function MaterialModal({ onClose, onSaved, empresaId, initialData, todosOsMateriais }: {
  onClose: () => void; onSaved: () => void; empresaId: string | null; initialData?: Material; todosOsMateriais: Material[];
}) {
  const [fornecedores, setFornecedores] = useState<{ id: string; nome: string }[]>([]);
  const [sugestao, setSugestao] = useState<PrecoSugestao | null>(null);

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
      cor: initialData.cor ?? "", imagem_url: initialData.imagem_url ?? "",
      espessura_mm: initialData.espessura_mm ?? undefined,
      fornecedor_id: initialData.fornecedor_id ?? "",
      estoque_atual: initialData.estoque ?? undefined,
      estoque_minimo: initialData.estoque_minimo ?? undefined,
    } : { unidade: "un", preco_custo: 0, preco_venda: 0 },
  });

  const corValue = watch("cor");
  const nomeValue = watch("nome");
  const espessuraValue = watch("espessura_mm");
  const unidadeValue = watch("unidade");

  // Sugestão de preço baseada em similares (só para novos materiais)
  const editandoId = initialData?.id;
  useEffect(() => {
    if (editandoId) { setSugestao(null); return; }
    const t = setTimeout(() => {
      const s = buscarPrecoSimilar(nomeValue ?? "", espessuraValue ? Number(espessuraValue) : undefined, unidadeValue ?? "un", todosOsMateriais, editandoId);
      setSugestao(s);
    }, 400);
    return () => clearTimeout(t);
  }, [nomeValue, espessuraValue, unidadeValue, todosOsMateriais, editandoId]);

  const aplicarSugestao = useCallback(() => {
    if (!sugestao) return;
    setValue("preco_custo", sugestao.custo);
    setValue("preco_venda", sugestao.venda);
    setSugestao(null);
  }, [sugestao, setValue]);

  const custo = watch("preco_custo");
  // multiplicador: 300 = 3× o custo (padrão), 200 = 2×, 250 = 2.5×, 350 = 3.5×
  const applyMargem = (pct: number) => {
    const c = Number(custo) || 0;
    if (!c) return;
    setValue("preco_venda", parseFloat((c * (pct / 100)).toFixed(2)));
  };

  const onSubmit = async (data: MatForm) => {
    try {
      const payload = {
        nome: data.nome, codigo: data.codigo || null, unidade: data.unidade,
        preco_custo: data.preco_custo, preco_venda: data.preco_venda,
        cor: data.cor || null, espessura_mm: data.espessura_mm || null,
        fornecedor_id: data.fornecedor_id || null,
        imagem_url: data.imagem_url || null,
        estoque_atual: data.estoque_atual ?? null,
        estoque_minimo: data.estoque_minimo ?? null,
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
          {/* Sugestão de preço baseada em similares */}
          {sugestao && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2">
              <div className="flex-1 min-w-0">
                <div className="text-[11.5px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Preço encontrado em {sugestao.fonte}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-500">
                  Custo: R$ {sugestao.custo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · Venda: R$ {sugestao.venda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <button
                type="button"
                onClick={aplicarSugestao}
                className="h-7 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-semibold shrink-0"
              >
                Aplicar
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
            Aplicar multiplicador:
            {[{ label: "2×", val: 200 }, { label: "2.5×", val: 250 }, { label: "3×", val: 300 }, { label: "3.5×", val: 350 }].map(({ label, val }) => (
              <button key={val} type="button" onClick={() => applyMargem(val)}
                className="px-2 py-0.5 rounded border border-border hover:bg-secondary text-[11px]">{label}</button>
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
              <div className="text-[11.5px] text-muted-foreground mb-1">Cor (hex)</div>
              <div className="flex gap-1.5">
                <input
                  type="color"
                  value={corValue?.match(/^#[0-9A-Fa-f]{6}$/) ? corValue : "#cccccc"}
                  onChange={(e) => setValue("cor", e.target.value)}
                  className="h-9 w-10 rounded-md border border-border bg-surface-2 p-0.5 cursor-pointer shrink-0"
                />
                <input {...register("cor")} placeholder="#F2EDE8"
                  className="flex-1 h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[12px] font-mono outline-none focus:border-border-strong min-w-0" />
              </div>
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Esp. (mm)</div>
              <input {...register("espessura_mm")} type="number" step="0.1" min="0"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Fornecedor</div>
              <select {...register("fornecedor_id")}
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground">
                <option value="">Sem fornecedor</option>
                {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">URL da imagem</div>
              <input {...register("imagem_url")} placeholder="https://..."
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Estoque atual</div>
              <input {...register("estoque_atual")} type="number" step="0.1" min="0" placeholder="Ex: 10"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Estoque mínimo (alerta)</div>
              <input {...register("estoque_minimo")} type="number" step="0.1" min="0" placeholder="Ex: 3"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
            </div>
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
            todosOsMateriais={materiais}
          />
        )}
      </AnimatePresence>

      {/* Feature 12: Stock alerts */}
      {(() => {
        const baixos = materiais.filter((m) => m.estoque != null && m.estoque_minimo != null && m.estoque <= m.estoque_minimo);
        if (baixos.length === 0) return null;
        return (
          <div className="mb-4 p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 flex items-start gap-2.5">
            <PackageX className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-amber-700 dark:text-amber-400">
                {baixos.length} material(is) abaixo do estoque mínimo
              </div>
              <div className="text-[11.5px] text-amber-600 mt-0.5">
                {baixos.map((m) => m.nome).join(", ")}
              </div>
            </div>
            <button onClick={() => setShowModal(true)}
              className="h-7 px-2.5 rounded border border-amber-500 text-amber-700 text-[11.5px] font-medium hover:bg-amber-500/10 shrink-0">
              Repor
            </button>
          </div>
        );
      })()}

      <PageHeader
        eyebrow="Operação"
        title="Central de materiais"
        description="Catálogo unificado de chapas, ferragens, fitas e acessórios. Mão de obra é gerenciada separadamente."
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
                <div className="aspect-square relative overflow-hidden"
                  style={{ background: !m.imagem_url && m.cor?.startsWith("#") ? m.cor : undefined }}>
                  {m.imagem_url ? (
                    <img src={m.imagem_url} alt={m.nome}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : m.cor?.startsWith("#") ? null : (
                    <div className="flex items-center justify-center h-full bg-secondary">
                      <ImageOff className="size-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition">
                    <MatRowMenu material={m} onEdit={() => setEditando(m)} onDeleted={load} />
                  </div>
                  {m.espessura_mm && (
                    <div className="absolute bottom-1.5 left-1.5">
                      <span className="text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded-full">{m.espessura_mm}mm</span>
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
                      ) : m.cor?.startsWith("#") ? (
                        <div className="size-8 rounded border border-border/40" style={{ background: m.cor }} />
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
                      <div className="flex items-center gap-1.5">
                        {m.cor?.startsWith("#") && (
                          <div className="size-3 rounded-full shrink-0 border border-border/30" style={{ background: m.cor }} />
                        )}
                        <span>{m.espessura_mm ? `${m.espessura_mm}mm` : m.cor && !m.cor.startsWith("#") ? m.cor : "—"}</span>
                      </div>
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
