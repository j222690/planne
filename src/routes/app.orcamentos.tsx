import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import { Plus, Filter, Loader2, AlertCircle, X, Trash2, Sparkles, ChevronRight, FileUp, Printer, Pencil } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getOrcamentos, getClientes, getMateriais, getEmpresaAtual, upsertOrcamento, getOrcamentoItens, updateOrcamentoStatus, deleteOrcamento, updateOrcamento, replaceOrcamentoItens } from "@/lib/db";
import { askAI } from "@/lib/ai";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/app/orcamentos")({
  component: Orcamentos,
});

type Orc = {
  id: string; numero: string | null; status: string;
  total: number; created_at: string;
  clientes: { nome: string } | null;
  projetos: { nome: string } | null;
};

const STATUS_TONE: Record<string, "amber"|"green"|"blue"|"neutral"> = {
  rascunho: "neutral", analise: "amber", aprovado: "green", recusado: "neutral",
};
const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho", analise: "Em análise", aprovado: "Aprovado", recusado: "Recusado",
};

const itemSchema = z.object({
  descricao: z.string().min(1, "Descrição obrigatória"),
  quantidade: z.coerce.number().min(0.001),
  unidade: z.string().default("un"),
  preco_custo: z.coerce.number().min(0),
  preco_unitario: z.coerce.number().min(0),
});

const schema = z.object({
  cliente_id: z.string().min(1, "Selecione um cliente"),
  status: z.string().default("rascunho"),
  margem_pct: z.coerce.number().min(0).max(100).default(35),
  observacoes: z.string().optional(),
  itens: z.array(itemSchema).min(1, "Adicione ao menos um item"),
});
type FormData = z.infer<typeof schema>;

function OrcamentoModal({ onClose, onSaved, editOrc }: { onClose: () => void; onSaved: () => void; editOrc?: Orc & { itens?: OrcItem[] } }) {
  const [clientes, setClientes] = useState<{id:string;nome:string}[]>([]);
  const [materiais, setMateriais] = useState<{id:string;nome:string;preco_custo:number;unidade:string}[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [empresaId, setEmpresaId] = useState<string|null>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const isEdit = !!editOrc;

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "rascunho", margem_pct: 35, itens: [{ descricao: "", quantidade: 1, unidade: "un", preco_custo: 0, preco_unitario: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });
  const itens = watch("itens");
  const margem = watch("margem_pct");

  const subtotal = itens.reduce((s, i) => s + (Number(i.preco_unitario) || 0) * (Number(i.quantidade) || 0), 0);
  const total = subtotal;

  useEffect(() => {
    async function load() {
      const empresa = await getEmpresaAtual();
      if (!empresa) return;
      const eid = (empresa as {id:string}).id;
      setEmpresaId(eid);
      const [c, m] = await Promise.all([getClientes(eid), getMateriais(eid)]);
      setClientes(c as {id:string;nome:string}[]);
      setMateriais(m as {id:string;nome:string;preco_custo:number;unidade:string}[]);

      // Pré-popula se é edição
      if (editOrc) {
        setValue("cliente_id", editOrc.cliente_id ?? "");
        setValue("status", editOrc.status);
        setValue("margem_pct", editOrc.margem_pct ?? 35);
        const itensExistentes = editOrc.itens ?? await getOrcamentoItens(editOrc.id) as OrcItem[];
        if (itensExistentes.length > 0) {
          setValue("itens", itensExistentes.map((it) => ({
            descricao: it.descricao,
            quantidade: Number(it.quantidade),
            unidade: it.unidade,
            preco_custo: Number(it.preco_custo),
            preco_unitario: Number(it.preco_unitario),
          })));
        }
      }
    }
    load();
  }, []);

  const applyMargem = (custo: number) => {
    const m = Number(margem) || 35;
    return parseFloat((custo / (1 - m / 100)).toFixed(2));
  };

  const handleMaterialSelect = (idx: number, matId: string) => {
    const mat = materiais.find((m) => m.id === matId);
    if (!mat) return;
    setValue(`itens.${idx}.descricao`, mat.nome);
    setValue(`itens.${idx}.unidade`, mat.unidade || "un");
    setValue(`itens.${idx}.preco_custo`, mat.preco_custo);
    setValue(`itens.${idx}.preco_unitario`, applyMargem(mat.preco_custo));
  };

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfLoading(true);
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/pdf-orcamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdf_b64: b64, tipo_mime: file.type || "image/jpeg" }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.itens?.length) {
        setValue("itens", data.itens);
        if (data.margem_detectada) setValue("margem_pct", data.margem_detectada);
        toast.success(`${data.itens.length} itens importados do PDF!`);
      } else {
        toast.error("Nenhum item encontrado no documento.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao processar PDF");
    } finally {
      setPdfLoading(false);
      if (pdfRef.current) pdfRef.current.value = "";
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const system = `Você é um especialista em marcenaria planejada. O usuário vai descrever um móvel.
Responda APENAS com um JSON válido (sem markdown, sem explicações) no formato:
{"itens":[{"descricao":"string","quantidade":number,"unidade":"string","preco_custo":number,"preco_unitario":number}]}
Calcule custos realistas para Chapecó/SC 2025. Use margem de ${margem}%. Unidades: chapa, par, un, metro.`;

      const { text } = await askAI({
        system,
        messages: [{ role: "user", content: aiPrompt }],
        max_tokens: 800,
        temperature: 0.2,
      });

      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (parsed.itens?.length) {
        setValue("itens", parsed.itens);
        toast.success(`${parsed.itens.length} itens gerados pela IA!`);
        setAiPrompt("");
      }
    } catch {
      toast.error("Erro ao gerar itens com IA. Verifique as chaves de API no .env.local.");
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!empresaId) return;
    try {
      if (isEdit && editOrc) {
        await updateOrcamento(editOrc.id, {
          cliente_id: data.cliente_id,
          status: data.status,
          margem_pct: data.margem_pct,
          observacoes: data.observacoes,
          subtotal,
          total,
        });
        await replaceOrcamentoItens(editOrc.id, data.itens.map((it) => ({
          orcamento_id: editOrc.id,
          descricao: it.descricao,
          quantidade: it.quantidade,
          unidade: it.unidade,
          preco_custo: it.preco_custo,
          preco_unitario: it.preco_unitario,
        })));
        toast.success("Orçamento atualizado!");
      } else {
        const orc = await upsertOrcamento(empresaId, {
          cliente_id: data.cliente_id,
          status: data.status,
          margem_pct: data.margem_pct,
          observacoes: data.observacoes,
          subtotal,
          total,
        });
        await supabase.from("orcamento_itens").insert(data.itens.map((it) => ({
          orcamento_id: orc.id,
          descricao: it.descricao,
          quantidade: it.quantidade,
          unidade: it.unidade,
          preco_custo: it.preco_custo,
          preco_unitario: it.preco_unitario,
        })));
        toast.success(`Orçamento ${orc.numero} criado!`);
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-2xl bg-surface border border-border rounded-lg shadow-xl my-4"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-[15px] font-semibold">{isEdit ? `Editar orçamento ${editOrc?.numero ?? ""}` : "Novo orçamento"}</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Preencha manualmente ou use a IA para gerar os itens</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-5 space-y-4">
            {/* IA prompt + PDF import */}
            <div className="rounded-md border border-accent/30 bg-accent/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-accent">
                  <Sparkles className="size-3.5" /> Gerar itens com IA
                </div>
                <button
                  type="button"
                  onClick={() => pdfRef.current?.click()}
                  disabled={pdfLoading}
                  className="text-[11.5px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 disabled:opacity-60 transition-colors"
                >
                  {pdfLoading ? <Loader2 className="size-3 animate-spin" /> : <FileUp className="size-3" />}
                  Importar PDF/imagem
                </button>
                <input ref={pdfRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handlePdfImport} />
              </div>
              <div className="flex gap-2">
                <input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleAIGenerate())}
                  placeholder='Ex: "Cozinha em L 3,8m × 2,6m MDF branco com torre de forno"'
                  className="flex-1 h-8 rounded-md border border-border bg-surface px-2.5 text-[13px] outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="h-8 px-3 rounded-md bg-accent text-white text-[12.5px] font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {aiLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                  Gerar
                </button>
              </div>
            </div>

            {/* Header fields */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>Cliente *</Label>
                <select
                  {...register("cliente_id")}
                  className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong text-foreground"
                >
                  <option value="">Selecione...</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                {errors.cliente_id && <div className="text-[11px] text-destructive mt-1">{errors.cliente_id.message}</div>}
              </div>
              <div>
                <Label>Margem (%)</Label>
                <input
                  {...register("margem_pct")}
                  type="number"
                  min={0} max={100}
                  className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong"
                />
              </div>
            </div>

            {/* Itens */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Itens do orçamento</Label>
                <button
                  type="button"
                  onClick={() => append({ descricao: "", quantidade: 1, unidade: "un", preco_custo: 0, preco_unitario: 0 })}
                  className="text-[12px] text-accent hover:text-accent/80 inline-flex items-center gap-1"
                >
                  <Plus className="size-3" /> Adicionar item
                </button>
              </div>

              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-[12.5px]">
                  <thead className="bg-surface-2">
                    <tr className="border-b border-border">
                      <th className="text-left font-medium px-3 py-2 text-muted-foreground w-[34%]">Descrição</th>
                      <th className="text-right font-medium px-2 py-2 text-muted-foreground w-[10%]">Qtd</th>
                      <th className="text-left font-medium px-2 py-2 text-muted-foreground w-[8%]">Un</th>
                      <th className="text-right font-medium px-2 py-2 text-muted-foreground w-[14%]">Custo R$</th>
                      <th className="text-right font-medium px-2 py-2 text-muted-foreground w-[14%]">Preço R$</th>
                      <th className="text-right font-medium px-2 py-2 text-muted-foreground w-[14%]">Total R$</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, idx) => {
                      const linha = itens[idx];
                      const tot = (Number(linha?.preco_unitario)||0) * (Number(linha?.quantidade)||0);
                      return (
                        <tr key={field.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-1.5">
                            {materiais.length > 0 ? (
                              <div className="flex gap-1">
                                <input
                                  {...register(`itens.${idx}.descricao`)}
                                  placeholder="Descrição"
                                  className="flex-1 h-7 rounded border border-border bg-surface-2 px-2 text-[12px] outline-none focus:border-border-strong min-w-0"
                                />
                                <select
                                  onChange={(e) => handleMaterialSelect(idx, e.target.value)}
                                  className="w-6 h-7 rounded border border-border bg-surface-2 text-[10px] outline-none"
                                  title="Selecionar do catálogo"
                                >
                                  <option value="">↓</option>
                                  {materiais.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                </select>
                              </div>
                            ) : (
                              <input
                                {...register(`itens.${idx}.descricao`)}
                                placeholder="Descrição"
                                className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[12px] outline-none focus:border-border-strong"
                              />
                            )}
                          </td>
                          <td className="px-2 py-1.5">
                            <input {...register(`itens.${idx}.quantidade`)} type="number" step="0.01" min="0"
                              className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[12px] outline-none text-right" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input {...register(`itens.${idx}.unidade`)}
                              className="w-full h-7 rounded border border-border bg-surface-2 px-1 text-[12px] outline-none" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input {...register(`itens.${idx}.preco_custo`)} type="number" step="0.01" min="0"
                              className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[12px] outline-none text-right" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input {...register(`itens.${idx}.preco_unitario`)} type="number" step="0.01" min="0"
                              className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[12px] outline-none text-right" />
                          </td>
                          <td className="px-2 py-1.5 text-right num text-muted-foreground">
                            {tot.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-2 py-1.5">
                            <button type="button" onClick={() => remove(idx)} className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {errors.itens?.root && <div className="text-[11px] text-destructive mt-1">{errors.itens.root.message}</div>}
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="min-w-[200px] space-y-1 text-[13px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="num">R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-border pt-1">
                  <span>Total</span>
                  <span className="num">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div>
              <Label>Observações / Condições comerciais</Label>
              <textarea
                {...register("observacoes")}
                rows={2}
                placeholder="Prazo de entrega, condições de pagamento, garantias..."
                className="w-full rounded-md border border-border bg-surface-2 px-2.5 py-2 text-[13px] outline-none focus:border-border-strong resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-5 py-4 border-t border-border">
            <div>
              <select
                {...register("status")}
                className="h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none"
              >
                <option value="rascunho">Salvar como rascunho</option>
                <option value="analise">Enviar para análise</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-secondary transition-colors">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
                {isEdit ? "Salvar alterações" : "Criar orçamento"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function Orcamentos() {
  const [orcs, setOrcs] = useState<Orc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [showModal, setShowModal] = useState(false);
  const [detalhe, setDetalhe] = useState<Orc | null>(null);
  const [editando, setEditando] = useState<Orc | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const empresa = await getEmpresaAtual();
      if (!empresa) throw new Error("Empresa não encontrada");
      const data = await getOrcamentos((empresa as {id:string}).id);
      setOrcs(data as Orc[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const statuses = ["todos", "rascunho", "analise", "aprovado", "recusado"];
  const filtered = orcs.filter((o) => {
    const q = search.toLowerCase();
    return (q === "" || (o.numero ?? "").toLowerCase().includes(q) || (o.clientes?.nome ?? "").toLowerCase().includes(q))
      && (statusFilter === "todos" || o.status === statusFilter);
  });

  const totalPipeline = orcs.filter((o) => ["analise","aprovado"].includes(o.status)).reduce((s,o) => s+(o.total??0), 0);

  return (
    <>
      <AnimatePresence>
        {showModal && <OrcamentoModal onClose={() => setShowModal(false)} onSaved={load} />}
        {editando && <OrcamentoModal onClose={() => setEditando(null)} onSaved={() => { load(); setDetalhe(null); }} editOrc={editando} />}
        {detalhe && !editando && (
          <OrcDetalheModal orc={detalhe} onClose={() => setDetalhe(null)} onChanged={load} onEdit={() => setEditando(detalhe)} />
        )}
      </AnimatePresence>

      <PageHeader
        eyebrow="Comercial"
        title="Orçamentos"
        description="Gere, aprove e acompanhe propostas com cálculo automático de chapas, ferragens e margem."
        actions={
          <>
            <button className="h-9 px-3 rounded-md border border-border text-[13px] font-medium hover:bg-secondary inline-flex items-center gap-1.5">
              <Filter className="size-3.5" /> Filtros
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5"
            >
              <Plus className="size-3.5" /> Novo orçamento
            </button>
          </>
        }
      />

      <div className="grid md:grid-cols-4 gap-3 mb-5">
        {[
          { l: "Em análise", v: orcs.filter((o) => o.status === "analise").length },
          { l: "Aprovados",  v: orcs.filter((o) => o.status === "aprovado").length },
          { l: "Total",      v: orcs.length },
          { l: "Pipeline (R$)", v: "R$ " + totalPipeline.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) },
        ].map((s) => (
          <Surface key={s.l} padded={false} className="p-4">
            <div className="text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground">{s.l}</div>
            <div className="mt-1.5 text-[20px] font-semibold num">{loading ? "—" : s.v}</div>
          </Surface>
        ))}
      </div>

      <Surface padded={false}>
        <div className="border-b border-border p-3 flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="h-8 flex-1 min-w-[180px] max-w-sm rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong"
          />
          <div className="flex gap-1 flex-wrap">
            {statuses.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`text-[12px] px-2 py-1 rounded-sm border transition-colors ${statusFilter === s ? "border-border-strong bg-secondary text-foreground" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                {STATUS_LABEL[s] ?? "Todos"}
              </button>
            ))}
          </div>
          {!loading && <div className="ml-auto text-[12px] text-muted-foreground">{filtered.length} resultados</div>}
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
                  <th className="text-left font-medium px-5 py-2.5">Nº</th>
                  <th className="text-left font-medium px-5 py-2.5">Cliente</th>
                  <th className="text-right font-medium px-5 py-2.5">Total (R$)</th>
                  <th className="text-left font-medium px-5 py-2.5">Status</th>
                  <th className="text-left font-medium px-5 py-2.5">Data</th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                      {orcs.length === 0
                        ? <span>Nenhum orçamento. <button onClick={() => setShowModal(true)} className="text-foreground underline">Criar o primeiro →</button></span>
                        : "Nenhum resultado."}
                    </td>
                  </tr>
                ) : filtered.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setDetalhe(o)}
                    className="border-b border-border last:border-0 hover:bg-secondary/40 cursor-pointer group"
                  >
                    <td className="px-5 py-3 font-mono text-[12px] text-muted-foreground">{o.numero ?? "—"}</td>
                    <td className="px-5 py-3 font-medium">{o.clientes?.nome ?? "—"}</td>
                    <td className="px-5 py-3 text-right num">{(o.total??0).toLocaleString("pt-BR",{minimumFractionDigits:2})}</td>
                    <td className="px-5 py-3"><Pill tone={STATUS_TONE[o.status]??'neutral'}>{STATUS_LABEL[o.status]??o.status}</Pill></td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}</td>
                    <td className="px-5 py-3 text-right">
                      <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
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

type OrcItem = {
  id: string; descricao: string; quantidade: number; unidade: string;
  preco_custo: number; preco_unitario: number;
};

const STATUS_NEXT: Record<string, string[]> = {
  rascunho: ["analise"],
  analise: ["aprovado", "recusado"],
  aprovado: [],
  recusado: ["rascunho"],
};

function OrcDetalheModal({ orc, onClose, onChanged, onEdit }: { orc: Orc; onClose: () => void; onChanged: () => void; onEdit: () => void }) {
  const [itens, setItens] = useState<OrcItem[]>([]);
  const [loadingItens, setLoadingItens] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [empresaNome, setEmpresaNome] = useState("");

  useEffect(() => {
    getOrcamentoItens(orc.id)
      .then((data) => setItens(data as OrcItem[]))
      .finally(() => setLoadingItens(false));
    getEmpresaAtual().then((e) => {
      if (e) {
        setEmpresaNome((e as { nome: string }).nome ?? "");
        setLogoUrl((e as { logo_url?: string | null }).logo_url ?? null);
      }
    });
  }, [orc.id]);

  const handleStatus = async (newStatus: string) => {
    setChangingStatus(true);
    try {
      await updateOrcamentoStatus(orc.id, newStatus);
      toast.success(`Status atualizado para ${STATUS_LABEL[newStatus]}`);
      onChanged();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar status");
    } finally {
      setChangingStatus(false);
    }
  };

  const handleDelete = () => {
    toast(`Excluir orçamento ${orc.numero ?? ""}?`, {
      action: {
        label: "Excluir",
        onClick: async () => {
          try {
            await deleteOrcamento(orc.id);
            toast.success("Orçamento excluído");
            onChanged();
            onClose();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao excluir");
          }
        },
      },
      cancel: { label: "Cancelar", onClick: () => {} },
    });
  };

  const nextStatuses = STATUS_NEXT[orc.status] ?? [];
  const totalItens = itens.reduce((s, i) => s + Number(i.preco_unitario) * Number(i.quantidade), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-xl bg-surface border border-border rounded-lg shadow-xl max-h-[85vh] flex flex-col"
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12px] text-muted-foreground">{orc.numero ?? "—"}</span>
              <Pill tone={STATUS_TONE[orc.status] ?? "neutral"}>{STATUS_LABEL[orc.status] ?? orc.status}</Pill>
            </div>
            <div className="text-[15px] font-semibold mt-0.5">{orc.clientes?.nome ?? "—"}</div>
            <div className="text-[12px] text-muted-foreground">{new Date(orc.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-1"><X className="size-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Itens */}
          <div>
            <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground mb-2">Itens do orçamento</div>
            {loadingItens ? (
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground py-4">
                <Loader2 className="size-4 animate-spin" /> Carregando itens...
              </div>
            ) : itens.length === 0 ? (
              <div className="text-[13px] text-muted-foreground py-4 text-center">Nenhum item registrado.</div>
            ) : (
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-[11px] uppercase tracking-wider">
                    <th className="text-left py-1.5">Descrição</th>
                    <th className="text-right py-1.5 pr-2">Qtd</th>
                    <th className="text-right py-1.5">Custo unit.</th>
                    <th className="text-right py-1.5">Preço unit.</th>
                    <th className="text-right py-1.5">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((it) => (
                    <tr key={it.id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-2">{it.descricao}</td>
                      <td className="py-2 pr-2 text-right num text-muted-foreground">{it.quantidade} {it.unidade}</td>
                      <td className="py-2 text-right num text-muted-foreground">{Number(it.preco_custo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 text-right num">{Number(it.preco_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 text-right num font-medium">{(Number(it.preco_unitario) * Number(it.quantidade)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="pt-3 text-right text-muted-foreground text-[12px]">Total</td>
                    <td className="pt-3 text-right num font-semibold">R$ {totalItens.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Mudança de status */}
          {nextStatuses.length > 0 && (
            <div>
              <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground mb-2">Alterar status</div>
              <div className="flex gap-2 flex-wrap">
                {nextStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatus(s)}
                    disabled={changingStatus}
                    className={`h-8 px-3 rounded-md border text-[12.5px] font-medium transition-colors disabled:opacity-60 ${
                      s === "aprovado" ? "border-emerald-500 text-emerald-600 hover:bg-emerald-500/10"
                      : s === "recusado" ? "border-destructive text-destructive hover:bg-destructive/10"
                      : "border-amber-500 text-amber-600 hover:bg-amber-500/10"
                    }`}
                  >
                    {changingStatus ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border flex items-center justify-between shrink-0 flex-wrap gap-2">
          <button onClick={handleDelete} className="flex items-center gap-1.5 text-[12.5px] text-destructive hover:opacity-80">
            <Trash2 className="size-3.5" /> Excluir
          </button>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onEdit}
              className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary inline-flex items-center gap-1.5"
            >
              <Pencil className="size-3.5" /> Editar
            </button>
            <button
              onClick={() => {
                const printWin = window.open("", "_blank");
                if (!printWin) return;
                const rows = itens.map((it) => `
                  <tr>
                    <td>${it.descricao}</td>
                    <td style="text-align:center">${it.quantidade} ${it.unidade}</td>
                    <td style="text-align:right">R$ ${Number(it.preco_unitario).toLocaleString("pt-BR",{minimumFractionDigits:2})}</td>
                    <td style="text-align:right">R$ ${(Number(it.preco_unitario)*Number(it.quantidade)).toLocaleString("pt-BR",{minimumFractionDigits:2})}</td>
                  </tr>`).join("");
                const logoHtml = logoUrl
                  ? `<img src="${logoUrl}" style="height:48px;object-fit:contain;margin-bottom:8px" /><br>`
                  : "";
                printWin.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
                  <title>Orçamento ${orc.numero ?? ""}</title>
                  <style>
                    body{font-family:sans-serif;padding:40px;color:#111;max-width:800px;margin:0 auto}
                    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;border-bottom:2px solid #111;padding-bottom:16px}
                    .empresa{font-size:11px;color:#666;margin-top:4px}
                    .orc-num{font-size:12px;color:#666;text-align:right}
                    .orc-title{font-size:22px;font-weight:700;text-align:right}
                    .cliente-box{background:#f5f5f5;border-radius:6px;padding:12px 16px;margin-bottom:24px;font-size:13px}
                    table{width:100%;border-collapse:collapse;font-size:13px}
                    th{text-align:left;border-bottom:2px solid #ddd;padding:8px;font-size:11px;text-transform:uppercase;color:#666;letter-spacing:.06em}
                    td{padding:8px;border-bottom:1px solid #eee}
                    tfoot td{font-weight:700;border-top:2px solid #111;padding-top:12px}
                    .footer{margin-top:40px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:12px}
                    @media print{body{padding:20px}}
                  </style></head><body>
                  <div class="header">
                    <div>${logoHtml}<div style="font-size:16px;font-weight:700">${empresaNome}</div><div class="empresa">Proposta comercial</div></div>
                    <div><div class="orc-num">Orçamento</div><div class="orc-title">${orc.numero ?? "—"}</div><div class="orc-num">${new Date(orc.created_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})}</div></div>
                  </div>
                  <div class="cliente-box"><strong>Cliente:</strong> ${orc.clientes?.nome ?? "—"}</div>
                  <table>
                    <thead><tr><th>Descrição</th><th style="text-align:center">Qtd</th><th style="text-align:right">Preço unit.</th><th style="text-align:right">Total</th></tr></thead>
                    <tbody>${rows}</tbody>
                    <tfoot><tr><td colspan="3" style="text-align:right">Total</td><td style="text-align:right">R$ ${totalItens.toLocaleString("pt-BR",{minimumFractionDigits:2})}</td></tr></tfoot>
                  </table>
                  <div class="footer">Documento gerado pelo Planne ERP · ${new Date().toLocaleDateString("pt-BR")}</div>
                  <script>window.onload=()=>window.print()</script></body></html>`);
                printWin.document.close();
              }}
              className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary inline-flex items-center gap-1.5"
            >
              <Printer className="size-3.5" /> Imprimir
            </button>
            <button onClick={onClose} className="h-8 px-4 rounded-md border border-border text-[12.5px] hover:bg-secondary">
              Fechar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11.5px] text-muted-foreground mb-1">{children}</div>;
}
