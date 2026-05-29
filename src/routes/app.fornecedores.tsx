import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import { Plus, Upload, Globe, Loader2, AlertCircle, X, Pencil, Trash2, MessageCircle, Phone, Package, CheckSquare, Square } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getEmpresaAtual, updateFornecedor, deleteFornecedor, getOrcamentos } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/app/fornecedores")({
  component: Fornecedores,
});

type Fornecedor = {
  id: string;
  nome: string;
  categoria: string | null;
  modo_sync: string | null;
  ativo: boolean;
  created_at: string;
  telefone: string | null;
};

interface ChapaMaterial {
  material: string;
  chapas_otimizadas: number;
  chapas_com_folga: number;
}

interface ListaCorteResult {
  resumo: {
    chapas_por_material?: ChapaMaterial[];
  };
}

const SYNC_TONE: Record<string, "green" | "amber" | "blue" | "neutral"> = {
  api: "green", xlsx: "blue", pdf: "amber", manual: "neutral",
};
const SYNC_LABEL: Record<string, string> = { api: "API", xlsx: "Planilha", pdf: "PDF · OCR", manual: "Manual" };

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  categoria: z.string().optional(),
  modo_sync: z.string().optional(),
  telefone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const FORNECEDORES_PADRAO = [
  { nome: "Arauco", categoria: "Chapas MDF / MDP", modo_sync: "xlsx" },
  { nome: "Berneck", categoria: "Chapas MDF", modo_sync: "xlsx" },
  { nome: "Duratex", categoria: "Chapas / Pisos", modo_sync: "pdf" },
  { nome: "Hettich", categoria: "Ferragens", modo_sync: "manual" },
  { nome: "Blum", categoria: "Ferragens premium", modo_sync: "manual" },
  { nome: "GMAD", categoria: "Ferragens / Puxadores", modo_sync: "manual" },
  { nome: "Acasel Chapecó", categoria: "Distribuidor regional", modo_sync: "manual" },
  { nome: "Guararapes", categoria: "Chapas", modo_sync: "xlsx" },
];

function formatWhatsAppNumber(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  return "55" + digits;
}

function parseMoveis(raw: unknown): Record<string, unknown>[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const obj = raw as { moveis?: Record<string, unknown>[] };
  return obj.moveis ?? [];
}

// ─── Modal WhatsApp ────────────────────────────────────────────────────────────

function WhatsAppPedidoModal({
  fornecedor, empresaId, onClose,
}: {
  fornecedor: Fornecedor; empresaId: string; onClose: () => void;
}) {
  type OrcRow = { id: string; numero: number; clientes?: { nome?: string } | null; moveis_config: unknown };
  const [orcamentos, setOrcamentos] = useState<OrcRow[]>([]);
  const [selectedOrcId, setSelectedOrcId] = useState<string>("");
  const [listaCorte, setListaCorte] = useState<ChapaMaterial[]>([]);
  const [selectedMateriais, setSelectedMateriais] = useState<Set<string>>(new Set());
  const [loadingOrcs, setLoadingOrcs] = useState(true);
  const [loadingLista, setLoadingLista] = useState(false);

  useEffect(() => {
    getOrcamentos(empresaId)
      .then((data) => {
        setOrcamentos((data as OrcRow[]).slice(0, 20));
        setLoadingOrcs(false);
      })
      .catch(() => setLoadingOrcs(false));
  }, [empresaId]);

  useEffect(() => {
    if (!selectedOrcId) { setListaCorte([]); setSelectedMateriais(new Set()); return; }
    const orc = orcamentos.find((o) => o.id === selectedOrcId);
    if (!orc) return;
    const moveis = parseMoveis(orc.moveis_config);
    if (!moveis.length) { setListaCorte([]); return; }
    setLoadingLista(true);
    fetch("/api/lista-corte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moveis }),
    })
      .then((r) => r.json())
      .then((data: ListaCorteResult) => {
        const chapas = data.resumo?.chapas_por_material ?? [];
        setListaCorte(chapas);
        setSelectedMateriais(new Set(chapas.map((c) => c.material)));
      })
      .catch(() => toast.error("Erro ao carregar lista de corte"))
      .finally(() => setLoadingLista(false));
  }, [selectedOrcId, orcamentos]);

  const toggleMaterial = (material: string) => {
    setSelectedMateriais((prev) => {
      const next = new Set(prev);
      next.has(material) ? next.delete(material) : next.add(material);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedMateriais.size === listaCorte.length) {
      setSelectedMateriais(new Set());
    } else {
      setSelectedMateriais(new Set(listaCorte.map((c) => c.material)));
    }
  };

  const abrirWhatsApp = () => {
    const tel = formatWhatsAppNumber(fornecedor.telefone ?? "");
    if (!tel || tel.length < 12) { toast.error("Número de telefone inválido"); return; }

    const orc = orcamentos.find((o) => o.id === selectedOrcId);
    const clienteNome = (orc?.clientes as { nome?: string } | null)?.nome ?? "";
    const orcLabel = orc ? `Orçamento #${orc.numero}${clienteNome ? ` – ${clienteNome}` : ""}` : "";

    const chapasText = listaCorte
      .filter((c) => selectedMateriais.has(c.material))
      .map((c) => `• ${c.material}: *${c.chapas_com_folga} chapas* (2750×1830mm)`)
      .join("\n");

    const msg = [
      `Olá ${fornecedor.nome}! 👋`,
      "",
      "Preciso fazer um pedido de materiais.",
      orcLabel ? `📋 *${orcLabel}*` : "",
      "",
      "📦 *Chapas necessárias:*",
      chapasText || "_(ver lista anexa)_",
      "",
      "Aguardo disponibilidade, valores e prazo de entrega. Obrigado!",
    ].filter((l) => l !== null && l !== undefined && !(l === "" && false)).join("\n");

    const url = `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const selectedChapas = listaCorte.filter((c) => selectedMateriais.has(c.material));
  const podeEnviar = fornecedor.telefone && selectedChapas.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative w-full max-w-lg bg-surface border border-border rounded-lg shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-[#25D366]/10 grid place-items-center">
              <MessageCircle className="size-4 text-[#25D366]" />
            </div>
            <div>
              <div className="text-[14px] font-semibold">Fazer pedido via WhatsApp</div>
              <div className="text-[11.5px] text-muted-foreground">{fornecedor.nome}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Telefone */}
          {fornecedor.telefone ? (
            <div className="flex items-center gap-2 rounded-md bg-[#25D366]/5 border border-[#25D366]/20 px-3 py-2">
              <Phone className="size-3.5 text-[#25D366] shrink-0" />
              <span className="text-[12.5px] font-medium">{fornecedor.telefone}</span>
              <span className="text-[11px] text-muted-foreground ml-auto">WhatsApp</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md bg-amber-500/5 border border-amber-500/20 px-3 py-2 text-[12.5px] text-amber-600">
              <AlertCircle className="size-3.5 shrink-0" />
              Nenhum telefone cadastrado — edite o fornecedor para adicionar.
            </div>
          )}

          {/* Seleção de orçamento */}
          <div>
            <div className="text-[11.5px] text-muted-foreground mb-1.5">Selecionar orçamento</div>
            {loadingOrcs ? (
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Carregando...
              </div>
            ) : (
              <select
                value={selectedOrcId}
                onChange={(e) => setSelectedOrcId(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground"
              >
                <option value="">— Selecione um orçamento —</option>
                {orcamentos.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.numero} {(o.clientes as { nome?: string } | null)?.nome ? `– ${(o.clientes as { nome?: string }).nome}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Lista de materiais */}
          {selectedOrcId && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                  <Package className="size-3.5" /> Chapas da lista de corte
                </div>
                {listaCorte.length > 0 && (
                  <button onClick={toggleAll} className="text-[11px] text-accent hover:underline">
                    {selectedMateriais.size === listaCorte.length ? "Desmarcar todas" : "Selecionar todas"}
                  </button>
                )}
              </div>

              {loadingLista ? (
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-3">
                  <Loader2 className="size-3.5 animate-spin" /> Calculando lista de corte...
                </div>
              ) : listaCorte.length === 0 ? (
                <div className="text-[12px] text-muted-foreground py-3 text-center border border-dashed border-border rounded-md">
                  Nenhuma chapa encontrada neste orçamento.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {listaCorte.map((c) => {
                    const sel = selectedMateriais.has(c.material);
                    return (
                      <button
                        key={c.material}
                        onClick={() => toggleMaterial(c.material)}
                        className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2 border text-left transition-colors ${
                          sel ? "bg-[#25D366]/5 border-[#25D366]/25" : "bg-surface-2 border-border"
                        }`}
                      >
                        {sel
                          ? <CheckSquare className="size-3.5 text-[#25D366] shrink-0" />
                          : <Square className="size-3.5 text-muted-foreground shrink-0" />
                        }
                        <span className="text-[12px] flex-1 truncate">{c.material}</span>
                        <span className={`text-[11px] font-medium shrink-0 ${sel ? "text-[#25D366]" : "text-muted-foreground"}`}>
                          {c.chapas_com_folga} chapas
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-2/50">
          <div className="text-[11.5px] text-muted-foreground">
            {selectedChapas.length > 0
              ? `${selectedChapas.length} material(is) · ${selectedChapas.reduce((s, c) => s + c.chapas_com_folga, 0)} chapas`
              : "Nenhum item selecionado"}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-9 px-3.5 rounded-md border border-border text-[13px] hover:bg-secondary">
              Fechar
            </button>
            <button
              onClick={abrirWhatsApp}
              disabled={!podeEnviar}
              className="h-9 px-4 rounded-md bg-[#25D366] text-white text-[13px] font-medium hover:bg-[#20BD5C] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="size-3.5" />
              Abrir WhatsApp
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal de Formulário ───────────────────────────────────────────────────────

function FornecedorModal({
  onClose, onSaved, empresaId, initialData,
}: {
  onClose: () => void; onSaved: () => void; empresaId: string; initialData?: Fornecedor;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          nome: initialData.nome,
          categoria: initialData.categoria ?? "",
          modo_sync: initialData.modo_sync ?? "manual",
          telefone: initialData.telefone ?? "",
        }
      : { modo_sync: "manual" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (initialData) {
        await updateFornecedor(initialData.id, {
          nome: data.nome,
          categoria: data.categoria || null,
          modo_sync: data.modo_sync,
          telefone: data.telefone || null,
        });
        toast.success("Fornecedor atualizado!");
      } else {
        const { error } = await supabase.from("fornecedores").insert({
          empresa_id: empresaId,
          nome: data.nome,
          categoria: data.categoria || null,
          modo_sync: data.modo_sync,
          telefone: data.telefone || null,
        });
        if (error) throw new Error(error.message);
        toast.success("Fornecedor adicionado!");
      }
      onSaved(); onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const importarPadrao = async () => {
    const rows = FORNECEDORES_PADRAO.map((f) => ({ ...f, empresa_id: empresaId, ativo: true }));
    const { error } = await supabase.from("fornecedores").insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} fornecedores importados!`);
    onSaved(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative w-full max-w-md bg-surface border border-border rounded-lg shadow-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[15px] font-semibold">{initialData ? "Editar fornecedor" : "Adicionar fornecedor"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {!initialData && (
            <>
              <button onClick={importarPadrao}
                className="w-full h-10 rounded-md border border-dashed border-border text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center justify-center gap-2">
                <Upload className="size-4" /> Importar fornecedores padrão (Arauco, Berneck, Hettich…)
              </button>
              <div className="relative flex items-center gap-2 text-[11.5px] text-muted-foreground">
                <div className="flex-1 border-t border-border" /> ou adicionar manualmente <div className="flex-1 border-t border-border" />
              </div>
            </>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Nome *</div>
              <input {...register("nome")} placeholder="Ex: Arauco"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
              {errors.nome && <div className="text-[11px] text-destructive mt-1">{errors.nome.message}</div>}
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Categoria</div>
              <input {...register("categoria")} placeholder="Chapas MDF / Ferragens / Puxadores..."
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1 flex items-center gap-1.5">
                <Phone className="size-3 text-[#25D366]" /> WhatsApp / Telefone
              </div>
              <input
                {...register("telefone")}
                placeholder="(49) 9 9999-9999"
                type="tel"
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong"
              />
              <div className="text-[10.5px] text-muted-foreground mt-0.5">Usado para enviar pedidos via WhatsApp</div>
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground mb-1">Modo de sincronização</div>
              <select {...register("modo_sync")}
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground">
                <option value="manual">Manual</option>
                <option value="xlsx">Planilha (XLSX/CSV)</option>
                <option value="pdf">PDF com OCR</option>
                <option value="api">API (planejado)</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-border">
              <button type="button" onClick={onClose} className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-secondary">Cancelar</button>
              <button type="submit" disabled={isSubmitting}
                className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5">
                {isSubmitting && <Loader2 className="size-3.5 animate-spin" />} {initialData ? "Salvar alterações" : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Página Principal ──────────────────────────────────────────────────────────

function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [whatsappFornecedor, setWhatsappFornecedor] = useState<Fornecedor | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const empresa = await getEmpresaAtual();
      if (!empresa) throw new Error("Empresa não encontrada");
      const eid = (empresa as { id: string }).id;
      setEmpresaId(eid);
      const { data, error } = await supabase.from("fornecedores")
        .select("id,nome,categoria,modo_sync,ativo,created_at,telefone")
        .eq("empresa_id", eid)
        .order("nome");
      if (error) throw error;
      setFornecedores(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleAtivo = async (f: Fornecedor) => {
    await supabase.from("fornecedores").update({ ativo: !f.ativo }).eq("id", f.id);
    toast.success(f.ativo ? "Fornecedor desativado" : "Fornecedor ativado");
    setFornecedores((fs) => fs.map((x) => x.id === f.id ? { ...x, ativo: !f.ativo } : x));
  };

  const handleDelete = (f: Fornecedor) => {
    toast(`Excluir "${f.nome}"?`, {
      action: {
        label: "Excluir",
        onClick: async () => {
          try {
            await deleteFornecedor(f.id);
            toast.success("Fornecedor excluído");
            load();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao excluir");
          }
        },
      },
      cancel: { label: "Cancelar", onClick: () => {} },
    });
  };

  return (
    <>
      <AnimatePresence>
        {(showModal || editando) && empresaId && (
          <FornecedorModal
            onClose={() => { setShowModal(false); setEditando(null); }}
            onSaved={load}
            empresaId={empresaId}
            initialData={editando ?? undefined}
          />
        )}
        {whatsappFornecedor && empresaId && (
          <WhatsAppPedidoModal
            fornecedor={whatsappFornecedor}
            empresaId={empresaId}
            onClose={() => setWhatsappFornecedor(null)}
          />
        )}
      </AnimatePresence>

      <PageHeader
        eyebrow="Operação"
        title="Fornecedores"
        description="Gerencie catálogos e sincronize preços de chapas, ferragens e acessórios."
        actions={
          <button onClick={() => setShowModal(true)}
            className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5">
            <Plus className="size-3.5" /> Adicionar
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground text-[13px]">
          <Loader2 className="size-4 animate-spin" /> Carregando...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 gap-2 text-destructive text-[13px]">
          <AlertCircle className="size-4" /> {error}
        </div>
      ) : fornecedores.length === 0 ? (
        <Surface className="text-center py-12">
          <Globe className="size-8 text-muted-foreground mx-auto mb-3" />
          <div className="text-[14px] font-medium mb-1">Nenhum fornecedor cadastrado</div>
          <div className="text-[13px] text-muted-foreground mb-4">Importe os fornecedores padrão ou adicione manualmente.</div>
          <button onClick={() => setShowModal(true)}
            className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5 mx-auto">
            <Plus className="size-3.5" /> Adicionar fornecedor
          </button>
        </Surface>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {fornecedores.map((f) => (
            <Surface key={f.id} padded={false} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="size-9 rounded-md border border-border bg-surface-2 grid place-items-center text-[11px] font-bold text-muted-foreground shrink-0">
                  {f.nome.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium truncate">{f.nome}</div>
                  <div className="text-[11.5px] text-muted-foreground truncate">{f.categoria ?? "—"}</div>
                  {f.telefone && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone className="size-2.5 text-[#25D366]" />
                      <span className="text-[11px] text-muted-foreground">{f.telefone}</span>
                    </div>
                  )}
                </div>
                <button onClick={() => toggleAtivo(f)}
                  className={`size-2 rounded-full shrink-0 mt-1.5 ${f.ativo ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
                  title={f.ativo ? "Ativo — clique para desativar" : "Inativo — clique para ativar"}
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Pill tone={SYNC_TONE[f.modo_sync ?? "manual"] ?? "neutral"}>
                  {SYNC_LABEL[f.modo_sync ?? "manual"] ?? f.modo_sync}
                </Pill>
                <div className="flex items-center gap-1">
                  {/* WhatsApp */}
                  <button
                    onClick={() => setWhatsappFornecedor(f)}
                    className="p-1.5 rounded text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
                    title={f.telefone ? "Fazer pedido via WhatsApp" : "Adicione um telefone para usar o WhatsApp"}
                  >
                    <MessageCircle className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setEditando(f)}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title="Editar"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(f)}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </>
  );
}
