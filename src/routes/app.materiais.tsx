import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import { Upload, Search, Loader2, AlertCircle, Plus, X, MoreHorizontal, Pencil, Trash2, ImageOff, PackageX, ShoppingCart, Send, CheckCircle2, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  getMateriais, getEmpresaAtual, getFornecedores, upsertMaterial, updateMaterial, deleteMaterial,
  getMovimentacoesEstoque, registrarMovimentacaoEstoque, type MovimentacaoEstoque,
  criarPedidoCompra, getPedidosCompra, atualizarStatusPedidoCompra, receberPedidoCompra,
} from "@/lib/db";
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
  estoque_atual?: number | null;
  estoque_minimo?: number | null;
  /** Fase 6 (motor 3D paramétrico) — liga este material a um TipoFerragem do motor. */
  tipo_ferragem_motor?: string | null;
};

type PedidoCompra = {
  id: string; numero: string | null; status: "rascunho" | "enviado" | "recebido" | "cancelado";
  observacoes: string | null; criado_em: string; enviado_em: string | null; recebido_em: string | null;
  fornecedor_id: string | null;
  fornecedores: { nome: string } | null;
  pedido_compra_item: {
    id: string; material_id: string; quantidade: number; preco_custo_unitario: number | null;
    recebido: boolean; materiais: { nome: string; unidade: string } | null;
  }[];
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
  unidade: z.string(),
  preco_custo: z.coerce.number().min(0),
  preco_venda: z.coerce.number().min(0),
  categoria: z.string().optional(),
  cor: z.string().optional(),
  imagem_url: z.string().optional(),
  espessura_mm: z.coerce.number().optional(),
  fornecedor_id: z.string().optional(),
  estoque_atual: z.coerce.number().optional(),
  estoque_minimo: z.coerce.number().optional(),
  tipo_ferragem_motor: z.string().optional(),
});

// Fase 6 (motor 3D paramétrico): rótulos em PT-BR dos 21 tipos de ferragem
// que o motor conhece (src/lib/motor-parametrico/tipos.ts, TipoFerragem) —
// ligar um material a um desses tipos faz o motor usar o preço real
// cadastrado aqui em vez do preço de referência de mercado.
const TIPOS_FERRAGEM_MOTOR: { valor: string; label: string }[] = [
  { valor: "dobradica_35mm_110grau", label: "Dobradiça 35mm 110°" },
  { valor: "dobradica_35mm_165grau", label: "Dobradiça 35mm 165°" },
  { valor: "dobradica_push_open", label: "Dobradiça push-open" },
  { valor: "corredicao_tandem_300mm", label: "Corrediça tandem 300mm" },
  { valor: "corredicao_tandem_400mm", label: "Corrediça tandem 400mm" },
  { valor: "corredicao_tandem_500mm", label: "Corrediça tandem 500mm" },
  { valor: "corredicao_lateral_porta", label: "Corrediça porta de correr" },
  { valor: "puxador_perfil_alu_1200mm", label: "Puxador perfil alumínio (1200mm)" },
  { valor: "puxador_alu_128mm", label: "Puxador alumínio 128mm" },
  { valor: "puxador_push_open", label: "Puxador push-open" },
  { valor: "ajustador_pe_100mm", label: "Pé regulável 100mm" },
  { valor: "ajustador_pe_150mm", label: "Pé regulável 150mm" },
  { valor: "rodape_pvc_100mm", label: "Rodapé PVC 100mm" },
  { valor: "cabideiro_simples", label: "Cabideiro simples" },
  { valor: "perfil_led_1m", label: "Perfil LED 1m" },
  { valor: "amortecedor_soft_close", label: "Amortecedor soft-close" },
  { valor: "minifix_15mm", label: "Minifix 15mm" },
  { valor: "cavilha_8x30mm", label: "Cavilha 8×30mm" },
  { valor: "cesto_aramado_porta_temperos", label: "Cesto aramado porta-temperos" },
  { valor: "suporte_basculante", label: "Suporte basculante" },
  { valor: "perfil_aluminio_porta_1m", label: "Perfil alumínio de porta (1m)" },
  { valor: "usinagem_provencal", label: "Usinagem provençal" },
];
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
      estoque_atual: initialData.estoque_atual ?? undefined,
      estoque_minimo: initialData.estoque_minimo ?? undefined,
      tipo_ferragem_motor: initialData.tipo_ferragem_motor ?? "",
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
        tipo_ferragem_motor: data.tipo_ferragem_motor || null,
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
          <div>
            <div className="text-[11.5px] text-muted-foreground mb-1">
              Tipo no motor 3D <span className="text-muted-foreground/60">(opcional — pra ferragens)</span>
            </div>
            <select {...register("tipo_ferragem_motor")}
              className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground">
              <option value="">Não é ferragem / não ligado ao motor</option>
              {TIPOS_FERRAGEM_MOTOR.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
            </select>
            <div className="text-[10.5px] text-muted-foreground mt-1">
              Ligando, o motor paramétrico usa o custo cadastrado aqui em vez do preço de referência de mercado nos projetos gerados.
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
          {initialData && (
            <MovimentacaoEstoquePanel
              materialId={initialData.id}
              unidade={watch("unidade") || "un"}
              onRegistrado={(delta) => setValue("estoque_atual", Math.max(0, (Number(watch("estoque_atual")) || 0) + delta))}
            />
          )}
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

/** Histórico de movimentação de estoque + ajuste manual (entrada/saída avulsa). */
function MovimentacaoEstoquePanel({ materialId, unidade, onRegistrado }: {
  materialId: string; unidade: string; onRegistrado: (delta: number) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [historico, setHistorico] = useState<MovimentacaoEstoque[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [quantidade, setQuantidade] = useState("");
  const [motivo, setMotivo] = useState("");
  const [registrando, setRegistrando] = useState(false);

  const carregarHistorico = async () => {
    setCarregando(true);
    try {
      setHistorico(await getMovimentacoesEstoque(materialId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar histórico");
    } finally {
      setCarregando(false);
    }
  };

  const toggle = () => {
    const abrir = !aberto;
    setAberto(abrir);
    if (abrir && historico === null) carregarHistorico();
  };

  const handleRegistrar = async () => {
    const q = Number(quantidade);
    if (!q || q <= 0) { toast.error("Informe uma quantidade válida"); return; }
    setRegistrando(true);
    try {
      await registrarMovimentacaoEstoque({ material_id: materialId, tipo, quantidade: q, motivo: motivo || undefined });
      toast.success(`${tipo === "entrada" ? "Entrada" : "Saída"} de ${q} ${unidade} registrada.`);
      onRegistrado(tipo === "entrada" ? q : -q);
      setQuantidade(""); setMotivo("");
      carregarHistorico();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao registrar movimentação");
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <div className="border border-border rounded-md">
      <button type="button" onClick={toggle}
        className="w-full flex items-center justify-between px-3 py-2 text-[12.5px] font-medium hover:bg-secondary/40">
        <span>Movimentação de estoque</span>
        <span className="text-muted-foreground">{aberto ? "▲" : "▼"}</span>
      </button>
      {aberto && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-border pt-2.5">
          <div className="flex items-end gap-2">
            <div>
              <div className="text-[10.5px] text-muted-foreground mb-1">Tipo</div>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as "entrada" | "saida")}
                className="h-8 rounded border border-border bg-surface-2 px-2 text-[12.5px] outline-none">
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>
            <div className="w-24">
              <div className="text-[10.5px] text-muted-foreground mb-1">Qtd ({unidade})</div>
              <input type="number" step="0.1" min="0" value={quantidade} onChange={(e) => setQuantidade(e.target.value)}
                className="h-8 w-full rounded border border-border bg-surface-2 px-2 text-[12.5px] outline-none" />
            </div>
            <div className="flex-1">
              <div className="text-[10.5px] text-muted-foreground mb-1">Motivo (opcional)</div>
              <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex: uso na ordem #42"
                className="h-8 w-full rounded border border-border bg-surface-2 px-2 text-[12.5px] outline-none" />
            </div>
            <button type="button" disabled={registrando} onClick={handleRegistrar}
              className="h-8 px-3 rounded bg-foreground text-background text-[12px] font-medium hover:opacity-90 disabled:opacity-50 shrink-0">
              {registrando ? "..." : "Registrar"}
            </button>
          </div>
          <div className="max-h-40 overflow-auto space-y-1">
            {carregando && <div className="text-[11.5px] text-muted-foreground">Carregando…</div>}
            {historico && historico.length === 0 && !carregando && (
              <div className="text-[11.5px] text-muted-foreground">Nenhuma movimentação registrada ainda.</div>
            )}
            {historico?.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-[11.5px] border-b border-border/40 last:border-0 py-1">
                <span className={m.tipo === "entrada" ? "text-emerald-600" : "text-red-600"}>
                  {m.tipo === "entrada" ? "+" : "−"}{m.quantidade} {unidade}
                  {m.motivo ? ` · ${m.motivo}` : ""}
                </span>
                <span className="text-muted-foreground shrink-0 ml-2">
                  {new Date(m.criado_em).toLocaleDateString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Gera 1 pedido de compra por fornecedor a partir dos materiais abaixo do
 * mínimo — quantidade sugerida = mínimo - atual (arredondado pra cima, min 1),
 * editável antes de criar. Materiais sem fornecedor cadastrado ficam à parte
 * (não dá pra montar um pedido sem saber pra quem mandar). */
function PedidoCompraModal({ onClose, onCriado, empresaId, materiaisBaixos }: {
  onClose: () => void; onCriado: () => void; empresaId: string;
  materiaisBaixos: Material[];
}) {
  const [quantidades, setQuantidades] = useState<Record<string, number>>(() =>
    Object.fromEntries(materiaisBaixos.map((m) => [
      m.id, Math.max(1, Math.ceil((m.estoque_minimo ?? 0) - (m.estoque_atual ?? 0))),
    ])),
  );
  const [criando, setCriando] = useState(false);

  const comFornecedor = materiaisBaixos.filter((m) => m.fornecedor_id);
  const semFornecedor = materiaisBaixos.filter((m) => !m.fornecedor_id);
  const porFornecedor = useMemo(() => {
    const grupos = new Map<string, { nome: string; itens: Material[] }>();
    for (const m of comFornecedor) {
      const key = m.fornecedor_id!;
      if (!grupos.has(key)) grupos.set(key, { nome: m.fornecedores?.nome ?? "Fornecedor", itens: [] });
      grupos.get(key)!.itens.push(m);
    }
    return grupos;
  }, [comFornecedor]);

  const handleCriar = async () => {
    setCriando(true);
    try {
      for (const [fornecedorId, grupo] of porFornecedor) {
        await criarPedidoCompra(
          empresaId, fornecedorId,
          grupo.itens.map((m) => ({ material_id: m.id, quantidade: quantidades[m.id] ?? 1 })),
          "Gerado automaticamente — materiais abaixo do estoque mínimo.",
        );
      }
      toast.success(`${porFornecedor.size} pedido(s) de compra criado(s) (rascunho).`);
      onCriado();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar pedido(s) de compra");
    } finally {
      setCriando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-auto bg-surface border border-border rounded-lg shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-[15px] font-semibold inline-flex items-center gap-1.5"><ShoppingCart className="size-4 text-accent" /> Gerar pedido de compra</div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>

        {porFornecedor.size === 0 && semFornecedor.length === 0 && (
          <div className="text-[13px] text-muted-foreground">Nenhum material abaixo do estoque mínimo.</div>
        )}

        {Array.from(porFornecedor.entries()).map(([fid, grupo]) => (
          <div key={fid} className="border border-border rounded-md p-3 space-y-2">
            <div className="text-[12.5px] font-semibold">{grupo.nome}</div>
            {grupo.itens.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                <span className="truncate flex-1">{m.nome}</span>
                <span className="text-muted-foreground shrink-0">atual {m.estoque_atual ?? 0} / mín {m.estoque_minimo ?? 0}</span>
                <input type="number" min="1" step="0.1" value={quantidades[m.id] ?? 1}
                  onChange={(e) => setQuantidades((q) => ({ ...q, [m.id]: Number(e.target.value) || 1 }))}
                  className="w-16 h-7 rounded border border-border bg-surface-2 px-1.5 text-[12px] outline-none shrink-0" />
                <span className="text-muted-foreground shrink-0 w-8">{m.unidade}</span>
              </div>
            ))}
          </div>
        ))}

        {semFornecedor.length > 0 && (
          <div className="border border-amber-500/40 bg-amber-500/10 rounded-md p-3 space-y-1">
            <div className="text-[12px] font-semibold text-amber-700 dark:text-amber-400">
              Sem fornecedor cadastrado (não entram no pedido)
            </div>
            <div className="text-[11.5px] text-amber-600">
              {semFornecedor.map((m) => m.nome).join(", ")} — cadastre o fornecedor no material pra incluir aqui.
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-secondary">Cancelar</button>
          <button type="button" disabled={criando || porFornecedor.size === 0} onClick={handleCriar}
            className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5">
            {criando && <Loader2 className="size-3.5 animate-spin" />} Criar {porFornecedor.size > 1 ? `${porFornecedor.size} pedidos` : "pedido"} (rascunho)
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/** 1 linha da lista de pedidos de compra — mostra itens + ações conforme status. */
function PedidoCompraRow({ pedido, onAtualizado }: { pedido: PedidoCompra; onAtualizado: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [processando, setProcessando] = useState(false);

  const statusCor: Record<PedidoCompra["status"], string> = {
    rascunho: "bg-secondary text-muted-foreground",
    enviado: "bg-blue-500/10 text-blue-600",
    recebido: "bg-emerald-500/10 text-emerald-600",
    cancelado: "bg-red-500/10 text-red-600",
  };
  const statusLabel: Record<PedidoCompra["status"], string> = {
    rascunho: "Rascunho", enviado: "Enviado", recebido: "Recebido", cancelado: "Cancelado",
  };

  const handleEnviar = async () => {
    setProcessando(true);
    try {
      await atualizarStatusPedidoCompra(pedido.id, "enviado");
      toast.success("Pedido marcado como enviado.");
      onAtualizado();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar pedido");
    } finally {
      setProcessando(false);
    }
  };

  const handleReceber = async () => {
    setProcessando(true);
    try {
      await receberPedidoCompra(pedido.id);
      toast.success("Pedido recebido — estoque atualizado.");
      onAtualizado();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao receber pedido");
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="px-3.5 py-2.5">
      {/* O toggle fica só no botão de texto (nome+status) — os botões de ação
          (Marcar enviado/Receber) são irmãos, não filhos, pra não aninhar
          elemento interativo dentro de outro (inválido e quebra accessible name). */}
      <div className="w-full flex items-center justify-between gap-2">
        <button type="button" onClick={() => setAberto((v) => !v)} className="min-w-0 text-left flex-1">
          <div className="text-[12.5px] font-medium truncate">
            {pedido.fornecedores?.nome ?? "Sem fornecedor"}
            <span className={`ml-2 text-[10.5px] px-1.5 py-0.5 rounded-full ${statusCor[pedido.status]}`}>{statusLabel[pedido.status]}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {pedido.pedido_compra_item.length} item(ns) · {new Date(pedido.criado_em).toLocaleDateString("pt-BR")}
          </div>
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          {pedido.status === "rascunho" && (
            <button type="button" disabled={processando} onClick={handleEnviar}
              className="h-7 px-2 rounded border border-border text-[11px] hover:bg-secondary inline-flex items-center gap-1 disabled:opacity-50">
              <Send className="size-3" /> Marcar enviado
            </button>
          )}
          {(pedido.status === "rascunho" || pedido.status === "enviado") && (
            <button type="button" disabled={processando} onClick={handleReceber}
              className="h-7 px-2 rounded border border-emerald-500 text-emerald-700 text-[11px] hover:bg-emerald-500/10 inline-flex items-center gap-1 disabled:opacity-50">
              <CheckCircle2 className="size-3" /> Receber
            </button>
          )}
          <button type="button" onClick={() => setAberto((v) => !v)} aria-label={aberto ? "Recolher" : "Expandir"}>
            <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${aberto ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
      {aberto && (
        <div className="mt-2 space-y-1 pl-1">
          {pedido.pedido_compra_item.map((it) => (
            <div key={it.id} className="flex items-center justify-between text-[11.5px] text-muted-foreground">
              <span>{it.materiais?.nome ?? it.material_id}</span>
              <span>{it.quantidade} {it.materiais?.unidade ?? "un"} {it.recebido ? "· recebido" : ""}</span>
            </div>
          ))}
        </div>
      )}
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
  const [showPedidoModal, setShowPedidoModal] = useState(false);
  const [pedidos, setPedidos] = useState<PedidoCompra[]>([]);
  const [mostrarPedidos, setMostrarPedidos] = useState(false);

  const carregarPedidos = async (eid: string) => {
    try {
      setPedidos(await getPedidosCompra(eid) as unknown as PedidoCompra[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar pedidos de compra");
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const empresa = await getEmpresaAtual();
      const eid = empresa ? (empresa as { id: string }).id : undefined;
      if (eid) { setEmpresaId(eid); carregarPedidos(eid); }
      const data = await getMateriais(eid);
      setMateriais(data as unknown as Material[]);
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

      <AnimatePresence>
        {showPedidoModal && empresaId && (
          <PedidoCompraModal
            onClose={() => setShowPedidoModal(false)}
            onCriado={() => { setShowPedidoModal(false); load(); setMostrarPedidos(true); }}
            empresaId={empresaId}
            materiaisBaixos={materiais.filter((m) => m.estoque_atual != null && m.estoque_minimo != null && m.estoque_atual <= m.estoque_minimo)}
          />
        )}
      </AnimatePresence>

      {/* Feature 12: Stock alerts */}
      {(() => {
        const baixos = materiais.filter((m) => m.estoque_atual != null && m.estoque_minimo != null && m.estoque_atual <= m.estoque_minimo);
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
            <button onClick={() => setShowPedidoModal(true)}
              className="h-7 px-2.5 rounded border border-amber-500 text-amber-700 text-[11.5px] font-medium hover:bg-amber-500/10 shrink-0 inline-flex items-center gap-1">
              <ShoppingCart className="size-3.5" /> Gerar pedido de compra
            </button>
          </div>
        );
      })()}

      {pedidos.length > 0 && (
        <div className="mb-4 rounded-lg border border-border">
          <button onClick={() => setMostrarPedidos((v) => !v)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-medium hover:bg-secondary/40">
            <span className="inline-flex items-center gap-1.5"><ShoppingCart className="size-4 text-accent" /> Pedidos de compra ({pedidos.length})</span>
            <ChevronDown className={`size-4 text-muted-foreground transition-transform ${mostrarPedidos ? "rotate-180" : ""}`} />
          </button>
          {mostrarPedidos && (
            <div className="border-t border-border divide-y divide-border">
              {pedidos.map((p) => (
                <PedidoCompraRow key={p.id} pedido={p} onAtualizado={load} />
              ))}
            </div>
          )}
        </div>
      )}

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
