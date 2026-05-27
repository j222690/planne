import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import {
  Plus, Filter, Loader2, AlertCircle, X, Trash2, Sparkles,
  ChevronRight, FileUp, Printer, Pencil, ImageUp, FolderPlus,
  ChevronDown, ChevronUp, Info, Search,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getOrcamentos, getClientes, getMateriais, getEmpresaAtual,
  upsertOrcamento, getOrcamentoItens, updateOrcamentoStatus,
  deleteOrcamento, updateOrcamento, replaceOrcamentoItens, upsertProjeto,
} from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/app/orcamentos")({
  component: Orcamentos,
});

// ─── Types ─────────────────────────────────────────────────────────────────

type Orc = {
  id: string; numero: string | null; status: string;
  total: number; created_at: string;
  clientes: { nome: string } | null;
  projetos: { nome: string } | null;
};

type OrcItem = {
  id: string; movel?: string; justificativa?: string;
  descricao: string; quantidade: number; unidade: string;
  preco_custo: number; preco_unitario: number;
};

type Parede = {
  id: string;
  descricao: string;
  largura_cm: number;
  espaco_util_cm: number;
  obstaculos?: string | null;
};

type PlantaInfo = {
  paredes: Parede[];
  largura_cm: number;
  profundidade_cm: number;
  altura_cm: number;
  observacoes?: string;
};

type MovelConfig = {
  id: string;
  tipo: string;
  nome: string;
  largura_cm: number;
  profundidade_cm: number;
  altura_cm: number;
  portas: number;
  tipo_porta: "abrir" | "correr" | "sem";
  gavetas: number;
  prateleiras: number;
  tem_fundo?: boolean;
  tem_rodape?: boolean;
  tem_pes?: boolean;
  tem_roda_teto?: boolean;
  altura_teto_cm?: number;
  parede_id?: string;
  mdf_caixa_id?: string;
  mdf_externo_id?: string;
  fundo_id?: string;
  dobradica_id?: string;
  corrediça_porta_id?: string;
  corrediça_gaveta_id?: string;
  puxador_id?: string;
};

type MatCatalog = {
  id: string; nome: string; unidade: string;
  preco_custo: number; preco_venda: number; categoria: string | null;
};

// ─── Móveis por ambiente ────────────────────────────────────────────────────

const MOVEIS_POR_AMBIENTE: Record<string, Omit<MovelConfig, "id">[]> = {
  "Quarto": [
    { tipo: "cabeceira", nome: "Cabeceira", largura_cm: 160, profundidade_cm: 5, altura_cm: 120, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 0 },
    { tipo: "roupeiro", nome: "Roupeiro", largura_cm: 200, profundidade_cm: 60, altura_cm: 230, portas: 4, tipo_porta: "abrir", gavetas: 2, prateleiras: 3 },
    { tipo: "comoda", nome: "Cômoda", largura_cm: 120, profundidade_cm: 50, altura_cm: 80, portas: 0, tipo_porta: "sem", gavetas: 4, prateleiras: 0 },
    { tipo: "criado-mudo", nome: "Criado-mudo", largura_cm: 45, profundidade_cm: 40, altura_cm: 60, portas: 1, tipo_porta: "abrir", gavetas: 1, prateleiras: 0 },
    { tipo: "escrivaninha", nome: "Escrivaninha", largura_cm: 140, profundidade_cm: 65, altura_cm: 75, portas: 0, tipo_porta: "sem", gavetas: 2, prateleiras: 1 },
    { tipo: "estante", nome: "Estante", largura_cm: 100, profundidade_cm: 35, altura_cm: 200, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 5 },
    { tipo: "ripado", nome: "Ripado / Painel", largura_cm: 160, profundidade_cm: 5, altura_cm: 240, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 0 },
  ],
  "Cozinha": [
    { tipo: "arm-sup", nome: "Armários Superiores", largura_cm: 300, profundidade_cm: 35, altura_cm: 70, portas: 6, tipo_porta: "abrir", gavetas: 0, prateleiras: 2 },
    { tipo: "arm-inf", nome: "Armários Inferiores", largura_cm: 300, profundidade_cm: 60, altura_cm: 85, portas: 4, tipo_porta: "abrir", gavetas: 3, prateleiras: 0 },
    { tipo: "bancada", nome: "Bancada / Tampo", largura_cm: 300, profundidade_cm: 60, altura_cm: 5, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 0 },
    { tipo: "torre", nome: "Torre Forno / Micro", largura_cm: 70, profundidade_cm: 60, altura_cm: 230, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 2 },
    { tipo: "despenseiro", nome: "Despenseiro", largura_cm: 40, profundidade_cm: 60, altura_cm: 230, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 5 },
  ],
  "Sala": [
    { tipo: "rack", nome: "Rack / Painel TV", largura_cm: 200, profundidade_cm: 45, altura_cm: 50, portas: 2, tipo_porta: "correr", gavetas: 0, prateleiras: 2 },
    { tipo: "estante-sala", nome: "Estante", largura_cm: 150, profundidade_cm: 35, altura_cm: 220, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 5 },
    { tipo: "buffet", nome: "Buffet / Aparador", largura_cm: 150, profundidade_cm: 45, altura_cm: 85, portas: 2, tipo_porta: "abrir", gavetas: 2, prateleiras: 1 },
    { tipo: "painel-tv", nome: "Painel TV (ripado)", largura_cm: 200, profundidade_cm: 5, altura_cm: 220, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 0 },
  ],
  "Escritório": [
    { tipo: "mesa-trab", nome: "Mesa de Trabalho", largura_cm: 160, profundidade_cm: 75, altura_cm: 75, portas: 0, tipo_porta: "sem", gavetas: 2, prateleiras: 0 },
    { tipo: "estante-escr", nome: "Estante / Prateleiras", largura_cm: 150, profundidade_cm: 35, altura_cm: 220, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 5 },
    { tipo: "armario-escr", nome: "Armário", largura_cm: 100, profundidade_cm: 50, altura_cm: 200, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 3 },
    { tipo: "gaveteiro", nome: "Gaveteiro", largura_cm: 40, profundidade_cm: 50, altura_cm: 70, portas: 0, tipo_porta: "sem", gavetas: 4, prateleiras: 0 },
  ],
  "Closet": [
    { tipo: "prateleiras-cl", nome: "Prateleiras", largura_cm: 100, profundidade_cm: 45, altura_cm: 220, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 6 },
    { tipo: "cabideiro", nome: "Cabideiro", largura_cm: 100, profundidade_cm: 55, altura_cm: 120, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 1 },
    { tipo: "gavetas-cl", nome: "Gaveteiro", largura_cm: 80, profundidade_cm: 55, altura_cm: 100, portas: 0, tipo_porta: "sem", gavetas: 4, prateleiras: 0 },
    { tipo: "sapateira", nome: "Sapateira", largura_cm: 100, profundidade_cm: 35, altura_cm: 60, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 3 },
  ],
  "Banheiro": [
    { tipo: "gabinete", nome: "Gabinete", largura_cm: 80, profundidade_cm: 45, altura_cm: 55, portas: 2, tipo_porta: "abrir", gavetas: 1, prateleiras: 0 },
    { tipo: "espelheira", nome: "Espelheira / Nicho", largura_cm: 80, profundidade_cm: 15, altura_cm: 60, portas: 1, tipo_porta: "abrir", gavetas: 0, prateleiras: 2 },
    { tipo: "nicho-ban", nome: "Nicho Decorativo", largura_cm: 60, profundidade_cm: 15, altura_cm: 30, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 1 },
  ],
  "Área gourmet": [
    { tipo: "bancada-gourmet", nome: "Bancada", largura_cm: 200, profundidade_cm: 60, altura_cm: 85, portas: 2, tipo_porta: "abrir", gavetas: 2, prateleiras: 0 },
    { tipo: "armario-gourmet", nome: "Armário", largura_cm: 150, profundidade_cm: 60, altura_cm: 85, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 2 },
  ],
  "Lavanderia": [
    { tipo: "arm-lav", nome: "Armário", largura_cm: 100, profundidade_cm: 45, altura_cm: 200, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 3 },
    { tipo: "bancada-lav", nome: "Bancada", largura_cm: 150, profundidade_cm: 60, altura_cm: 85, portas: 0, tipo_porta: "sem", gavetas: 0, prateleiras: 0 },
  ],
  "Garagem": [
    { tipo: "arm-gar", nome: "Armário de Garagem", largura_cm: 120, profundidade_cm: 50, altura_cm: 200, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 4 },
    { tipo: "bancada-gar", nome: "Bancada de Trabalho", largura_cm: 180, profundidade_cm: 70, altura_cm: 85, portas: 0, tipo_porta: "sem", gavetas: 2, prateleiras: 0 },
  ],
  "Outro": [
    { tipo: "armario-gen", nome: "Armário", largura_cm: 120, profundidade_cm: 50, altura_cm: 200, portas: 2, tipo_porta: "abrir", gavetas: 0, prateleiras: 3 },
    { tipo: "bancada-gen", nome: "Bancada / Balcão", largura_cm: 150, profundidade_cm: 60, altura_cm: 85, portas: 2, tipo_porta: "abrir", gavetas: 2, prateleiras: 0 },
  ],
};

const AMBIENTES = Object.keys(MOVEIS_POR_AMBIENTE);

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_TONE: Record<string, "amber" | "green" | "blue" | "neutral"> = {
  rascunho: "neutral", analise: "amber", aprovado: "green", recusado: "neutral",
};
const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho", analise: "Em análise", aprovado: "Aprovado", recusado: "Recusado",
};

// ─── Schemas ────────────────────────────────────────────────────────────────

const itemSchema = z.object({
  movel: z.string().optional(),
  justificativa: z.string().optional(),
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
  mao_de_obra: z.coerce.number().min(0).default(0),
  observacoes: z.string().optional(),
  itens: z.array(itemSchema).min(1, "Adicione ao menos um item"),
});
type FormData = z.infer<typeof schema>;

// ─── Modal ──────────────────────────────────────────────────────────────────

function OrcamentoModal({ onClose, onSaved, editOrc }: {
  onClose: () => void; onSaved: () => void; editOrc?: Orc & { itens?: OrcItem[] };
}) {
  const isEdit = !!editOrc;
  const [fase, setFase] = useState<"configurar" | "moveis" | "revisar">(isEdit ? "revisar" : "configurar");
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [catalogo, setCatalogo] = useState<MatCatalog[]>([]);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  // Configurar
  const [clienteId, setClienteId] = useState("");
  const [margemPct, setMargemPct] = useState(35);
  const [ambiente, setAmbiente] = useState("Quarto");
  const [plantaB64, setPlantaB64] = useState<string | null>(null);
  const [plantaNome, setPlantaNome] = useState<string | null>(null);
  const [medidas, setMedidas] = useState({ largura: 0, profundidade: 0, altura: 2.7 });
  const [descricao, setDescricao] = useState("");

  // Planta analisada
  const [plantaInfo, setPlantaInfo] = useState<PlantaInfo | null>(null);
  const [analisandoPlanta, setAnalisandoPlanta] = useState(false);

  // Móveis
  const [moveis, setMoveis] = useState<MovelConfig[]>([]);
  const [expandedMovel, setExpandedMovel] = useState<string | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const plantaRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "rascunho", margem_pct: 35,
      itens: [{ descricao: "", quantidade: 1, unidade: "un", preco_custo: 0, preco_unitario: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "itens" });
  const itens = watch("itens");
  const subtotal = itens.reduce((s, i) => s + (Number(i.preco_unitario) || 0) * (Number(i.quantidade) || 0), 0);

  useEffect(() => {
    async function load() {
      const empresa = await getEmpresaAtual();
      if (!empresa) return;
      const eid = (empresa as { id: string }).id;
      setEmpresaId(eid);
      const [c, m] = await Promise.all([getClientes(eid), getMateriais(eid)]);
      setClientes(c as { id: string; nome: string }[]);
      const raw = m as { id: string; nome: string; unidade: string; preco_custo: number; preco_venda: number }[];
      setCatalogo(raw.map((r) => ({
        id: r.id, nome: r.nome, unidade: r.unidade,
        preco_custo: r.preco_custo, preco_venda: r.preco_venda,
        categoria: r.nome.split(" ")[0] || "Geral",
      })));

      if (editOrc) {
        setValue("cliente_id", (editOrc as unknown as { cliente_id?: string }).cliente_id ?? "");
        setValue("status", editOrc.status);
        setValue("margem_pct", (editOrc as unknown as { margem_pct?: number }).margem_pct ?? 35);
        const itensExistentes = editOrc.itens ?? await getOrcamentoItens(editOrc.id) as OrcItem[];
        if (itensExistentes.length > 0) {
          setValue("itens", itensExistentes.map((it) => ({
            movel: (it as OrcItem).movel ?? "",
            justificativa: (it as OrcItem).justificativa ?? "",
            descricao: it.descricao, quantidade: Number(it.quantidade),
            unidade: it.unidade, preco_custo: Number(it.preco_custo), preco_unitario: Number(it.preco_unitario),
          })));
        }
      }
    }
    load();
  }, []);

  // Filtros do catálogo por tipo de material
  const mdfCatalog = useMemo(() => catalogo.filter((m) => /^MDF|^MDP/i.test(m.nome)), [catalogo]);
  const fundoCatalog = useMemo(() => catalogo.filter((m) => /6mm|fundo/i.test(m.nome)), [catalogo]);
  const dobCatalog = useMemo(() => catalogo.filter((m) => /dobrad/i.test(m.nome)), [catalogo]);
  const corrPortaCatalog = useMemo(() => catalogo.filter((m) => /corredi/i.test(m.nome) && !/gaveta|telesc/i.test(m.nome)), [catalogo]);
  const corrGavCatalog = useMemo(() => catalogo.filter((m) => /corredi/i.test(m.nome) && /gaveta|telesc/i.test(m.nome)), [catalogo]);
  const puxadorCatalog = useMemo(() => catalogo.filter((m) => /^puxador/i.test(m.nome)), [catalogo]);

  // Tipos que normalmente NÃO têm fundo
  const TIPOS_SEM_FUNDO = new Set(["cabeceira", "ripado", "bancada", "painel-tv", "bancada-gourmet", "bancada-lav", "bancada-gar", "bancada-gen"]);

  // Móveis helpers
  const toggleMovel = (template: Omit<MovelConfig, "id">) => {
    setMoveis((prev) => {
      const exists = prev.find((m) => m.tipo === template.tipo);
      if (exists) return prev.filter((m) => m.tipo !== template.tipo);
      const novo: MovelConfig = {
        ...template,
        id: Math.random().toString(36).slice(2),
        tem_fundo: !TIPOS_SEM_FUNDO.has(template.tipo),
      };
      setExpandedMovel(novo.id);
      return [...prev, novo];
    });
  };

  const updateMovel = (id: string, updates: Partial<MovelConfig>) => {
    setMoveis((prev) => prev.map((m) => m.id === id ? { ...m, ...updates } : m));
  };

  const handlePlantaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setPlantaB64(b64);
    setPlantaNome(file.name);
    setPlantaInfo(null);
    if (plantaRef.current) plantaRef.current.value = "";

    setAnalisandoPlanta(true);
    try {
      const res = await fetch("/api/analisar-planta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planta_b64: b64, ambiente }),
      });
      if (res.ok) {
        const info = await res.json() as PlantaInfo;
        setPlantaInfo(info);
        const dims = `${(info.largura_cm / 100).toFixed(1)}m × ${(info.profundidade_cm / 100).toFixed(1)}m × ${(info.altura_cm / 100).toFixed(1)}m`;
        toast.success(`Planta analisada: ${dims} — ${info.paredes.length} paredes detectadas`);
      } else {
        toast.error("Não foi possível analisar a planta automaticamente");
      }
    } catch {
      toast.error("Erro ao analisar planta");
    } finally {
      setAnalisandoPlanta(false);
    }
  };

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
        setFase("revisar");
        toast.success(`${data.itens.length} itens importados do PDF!`);
      } else {
        toast.error("Nenhum item encontrado no documento.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao processar PDF");
    } finally {
      if (pdfRef.current) pdfRef.current.value = "";
    }
  };

  const handleGerarIA = async () => {
    if (!clienteId) { toast.error("Selecione um cliente."); return; }
    if (moveis.length === 0) { toast.error("Selecione ao menos um móvel."); return; }

    setAiLoading(true);
    try {
      const body = {
        ambiente, descricao, margem_pct: margemPct,
        moveis,
        materiais: catalogo,
        ...(plantaB64 ? { planta_b64: plantaB64 } : {}),
        ...(!plantaB64 && (medidas.largura || medidas.profundidade) ? { medidas } : {}),
        ...(plantaInfo ? { restricoes_espaciais: plantaInfo } : {}),
      };
      const res = await fetch("/api/calcular-orcamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (!data.itens?.length) throw new Error("A IA não retornou itens.");
      setValue("itens", data.itens);
      setValue("cliente_id", clienteId);
      setValue("margem_pct", margemPct);
      if (data.resumo) setValue("observacoes", data.resumo);
      setFase("revisar");
      toast.success(`${data.itens.length} itens calculados pela IA!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao calcular orçamento");
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!empresaId) return;
    try {
      const itensPayload = (orcId: string) => data.itens.map((it) => ({
        orcamento_id: orcId,
        movel: it.movel || null,
        justificativa: it.justificativa || null,
        descricao: it.descricao,
        quantidade: it.quantidade,
        unidade: it.unidade,
        preco_custo: it.preco_custo,
        preco_unitario: it.preco_unitario,
        total: it.quantidade * it.preco_unitario,
      }));

      if (isEdit && editOrc) {
        await updateOrcamento(editOrc.id, {
          cliente_id: data.cliente_id, status: data.status, margem_pct: data.margem_pct,
          observacoes: data.observacoes, subtotal, total: subtotal,
          ...(moveis.length ? { moveis_config: moveis } : {}),
        });
        await replaceOrcamentoItens(editOrc.id, itensPayload(editOrc.id));
        toast.success("Orçamento atualizado!");
      } else {
        const orc = await upsertOrcamento(empresaId, {
          cliente_id: data.cliente_id, status: data.status, margem_pct: data.margem_pct,
          observacoes: data.observacoes, subtotal, total: subtotal,
          ...(moveis.length ? { moveis_config: moveis } : {}),
        });
        const { error: insErr } = await supabase.from("orcamento_itens").insert(itensPayload(orc.id));
        if (insErr) throw new Error(insErr.message);
        toast.success(`Orçamento ${orc.numero} criado!`);
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const moveisDaFase = MOVEIS_POR_AMBIENTE[ambiente] ?? [];

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
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-[15px] font-semibold">
              {isEdit ? `Editar orçamento ${editOrc?.numero ?? ""}` :
                fase === "configurar" ? "Novo orçamento" :
                fase === "moveis" ? `Móveis — ${ambiente}` : "Revisar itens"}
            </h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {isEdit ? "Edite os itens e salve" :
                fase === "configurar" ? "Ambiente, cliente e planta baixa" :
                fase === "moveis" ? "Selecione e configure cada móvel" :
                "Confira e ajuste antes de salvar"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Step indicator */}
            {!isEdit && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {["configurar", "moveis", "revisar"].map((f, i) => (
                  <span key={f} className={`flex items-center gap-1.5 ${fase === f ? "text-foreground font-medium" : ""}`}>
                    {i > 0 && <span className="text-muted-foreground/40">›</span>}
                    {i + 1}
                  </span>
                ))}
              </div>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
          </div>
        </div>

        {/* ── FASE 1: CONFIGURAR ── */}
        {fase === "configurar" && (
          <div className="p-5 space-y-4">
            {/* Cliente + Margem */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>Cliente *</Label>
                <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground">
                  <option value="">Selecione...</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <Label>Margem (%)</Label>
                <input type="number" min={0} max={100} value={margemPct}
                  onChange={(e) => setMargemPct(Number(e.target.value))}
                  className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none" />
              </div>
            </div>

            {/* Ambiente */}
            <div>
              <Label>Ambiente</Label>
              <div className="flex gap-1.5 flex-wrap">
                {AMBIENTES.map((a) => (
                  <button key={a} type="button" onClick={() => setAmbiente(a)}
                    className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors ${ambiente === a ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Planta baixa */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Planta baixa (opcional)</Label>
                {plantaNome && (
                  <button type="button" onClick={() => { setPlantaB64(null); setPlantaNome(null); setPlantaInfo(null); }}
                    className="text-[11px] text-destructive hover:opacity-70">remover</button>
                )}
              </div>
              {plantaNome ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-emerald-500/40 bg-emerald-500/5 text-[13px] text-emerald-700 dark:text-emerald-400">
                    <ImageUp className="size-3.5" /> {plantaNome}
                    {analisandoPlanta
                      ? <span className="text-[11px] ml-auto text-emerald-600/70 flex items-center gap-1"><Loader2 className="size-3 animate-spin" /> Analisando...</span>
                      : plantaInfo
                        ? <span className="text-[11px] ml-auto text-emerald-600/70">✓ {plantaInfo.paredes.length} paredes · {(plantaInfo.largura_cm / 100).toFixed(1)}m × {(plantaInfo.profundidade_cm / 100).toFixed(1)}m × {(plantaInfo.altura_cm / 100).toFixed(1)}m</span>
                        : <span className="text-[11px] ml-auto text-emerald-600/70">Medidas extraídas automaticamente</span>
                    }
                  </div>
                  {plantaInfo?.observacoes && (
                    <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground px-1">
                      <Info className="size-3 shrink-0 mt-0.5" /><span>{plantaInfo.observacoes}</span>
                    </div>
                  )}
                </div>
              ) : (
                <button type="button" onClick={() => plantaRef.current?.click()}
                  className="flex items-center gap-2 h-9 px-3 w-full rounded-md border border-dashed border-border text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                  <ImageUp className="size-3.5" /> Adicionar planta baixa — a IA extrai as medidas automaticamente
                </button>
              )}
              <input ref={plantaRef} type="file" accept="image/*" className="hidden" onChange={handlePlantaUpload} />
            </div>

            {/* Medidas manuais — só mostra se não tiver planta */}
            {!plantaB64 && (
              <div>
                <Label>Medidas do ambiente (opcional)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["largura", "profundidade", "altura"] as const).map((dim) => (
                    <div key={dim} className="relative">
                      <input type="number" step="0.01" min="0"
                        placeholder={dim === "largura" ? "Larg m" : dim === "profundidade" ? "Prof m" : "Alt m"}
                        value={medidas[dim] || ""}
                        onChange={(e) => setMedidas((prev) => ({ ...prev, [dim]: Number(e.target.value) }))}
                        className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Descrição */}
            <div>
              <Label>Observações do projeto (opcional)</Label>
              <input type="text" placeholder="Ex: roupeiro com espelho, cozinha em L, portas sem puxador..."
                value={descricao} onChange={(e) => setDescricao(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none" />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => pdfRef.current?.click()}
                  className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
                  <FileUp className="size-3.5" /> Importar PDF existente
                </button>
                <input ref={pdfRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handlePdfImport} />
                <span className="text-muted-foreground text-[11px]">·</span>
                <button type="button" onClick={() => { setValue("cliente_id", clienteId); setFase("revisar"); }}
                  className="text-[12px] text-muted-foreground hover:text-foreground">
                  Preencher manualmente
                </button>
              </div>
              <button type="button" onClick={() => {
                if (!clienteId) { toast.error("Selecione um cliente."); return; }
                setFase("moveis");
              }}
                className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5">
                Selecionar Móveis <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── FASE 2: MÓVEIS ── */}
        {fase === "moveis" && (
          <div className="p-5 space-y-4">
            <button type="button" onClick={() => setFase("configurar")}
              className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              ← Voltar
            </button>

            {/* Chips de seleção */}
            <div>
              <Label>Selecione os móveis de {ambiente}:</Label>
              <div className="flex gap-2 flex-wrap">
                {moveisDaFase.map((template) => {
                  const sel = moveis.find((m) => m.tipo === template.tipo);
                  return (
                    <button key={template.tipo} type="button" onClick={() => toggleMovel(template)}
                      className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors ${sel ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                      {template.nome}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Configuração de cada móvel selecionado */}
            {moveis.length > 0 && (
              <div className="space-y-2">
                <Label>Configure cada móvel:</Label>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 -mt-1 mb-1">
                  <Info className="size-3" />
                  Corrediças e dobradiças são calculadas automaticamente com base nas portas
                </div>
                {moveis.map((m) => (
                  <div key={m.id} className="border border-border rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedMovel(expandedMovel === m.id ? null : m.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-2 hover:bg-secondary text-[13px] font-medium text-left"
                    >
                      <span>{m.nome}</span>
                      <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground font-normal">
                        <span>{m.largura_cm}×{m.profundidade_cm}×{m.altura_cm}cm</span>
                        {m.portas > 0 && <span>{m.portas} porta{m.portas > 1 ? "s" : ""} ({m.tipo_porta})</span>}
                        {m.gavetas > 0 && <span>{m.gavetas} gav.</span>}
                        {expandedMovel === m.id ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </div>
                    </button>

                    {expandedMovel === m.id && (() => {
                      // Limites espaciais para validação
                      const paredeAtual = plantaInfo?.paredes.find((p) => p.id === m.parede_id);
                      const limLargura = paredeAtual
                        ? paredeAtual.espaco_util_cm
                        : plantaInfo
                          ? Math.max(...plantaInfo.paredes.map((p) => p.espaco_util_cm))
                          : medidas.largura > 0 ? Math.round(medidas.largura * 100) : null;
                      const limAltura = plantaInfo
                        ? plantaInfo.altura_cm
                        : medidas.altura > 0 ? Math.round(medidas.altura * 100) : null;
                      const limProfundidade = plantaInfo
                        ? plantaInfo.profundidade_cm
                        : medidas.profundidade > 0 ? Math.round(medidas.profundidade * 100) : null;

                      const avisos: string[] = [];
                      if (limLargura && m.largura_cm > limLargura)
                        avisos.push(`Largura ${m.largura_cm}cm excede o espaço disponível (${limLargura}cm)`);
                      if (limAltura && m.altura_cm > limAltura)
                        avisos.push(`Altura ${m.altura_cm}cm excede o pé-direito do ambiente (${limAltura}cm)`);
                      if (limProfundidade && m.profundidade_cm > limProfundidade)
                        avisos.push(`Profundidade ${m.profundidade_cm}cm excede a profundidade do ambiente (${limProfundidade}cm)`);

                      return (
                      <div className="px-3 py-3 space-y-3 bg-surface">
                        {/* Nome */}
                        <div>
                          <div className="text-[11px] text-muted-foreground mb-1">Nome no orçamento</div>
                          <input value={m.nome} onChange={(e) => updateMovel(m.id, { nome: e.target.value })}
                            className="w-full h-8 rounded border border-border bg-surface-2 px-2 text-[12.5px] outline-none" />
                        </div>

                        {/* Seletor de parede (quando planta analisada) */}
                        {plantaInfo && plantaInfo.paredes.length > 0 && (
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-1">Parede de instalação</div>
                            <select
                              value={m.parede_id ?? ""}
                              onChange={(e) => {
                                const pid = e.target.value;
                                const parede = plantaInfo.paredes.find((p) => p.id === pid);
                                updateMovel(m.id, {
                                  parede_id: pid || undefined,
                                  ...(parede ? { largura_cm: parede.espaco_util_cm } : {}),
                                });
                              }}
                              className="w-full h-8 rounded border border-border bg-surface-2 px-2 text-[12px] outline-none text-foreground"
                            >
                              <option value="">— Escolher parede —</option>
                              {plantaInfo.paredes.map((p) => (
                                <option key={p.id} value={p.id}>
                                  Parede {p.id}: {p.descricao} — {p.espaco_util_cm}cm úteis
                                  {p.obstaculos ? ` (${p.obstaculos})` : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Avisos de limite */}
                        {avisos.length > 0 && (
                          <div className="space-y-1">
                            {avisos.map((av, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[11.5px] text-destructive bg-destructive/10 rounded px-2.5 py-1.5">
                                <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                                <span>{av}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Dimensões */}
                        <div>
                          <div className="text-[11px] text-muted-foreground mb-1">Dimensões (cm)</div>
                          <div className="grid grid-cols-3 gap-2">
                            {(["largura_cm", "profundidade_cm", "altura_cm"] as const).map((dim) => {
                              const lim = dim === "largura_cm" ? limLargura : dim === "altura_cm" ? limAltura : limProfundidade;
                              const excede = lim !== null && m[dim] > lim;
                              return (
                              <div key={dim}>
                                <div className="text-[10px] text-muted-foreground mb-0.5">
                                  {dim === "largura_cm" ? "Largura" : dim === "profundidade_cm" ? "Profund." : "Altura"}
                                  {lim && <span className="ml-1 text-muted-foreground/70">máx {lim}cm</span>}
                                </div>
                                <input type="number" min={0} value={m[dim]}
                                  onChange={(e) => updateMovel(m.id, { [dim]: Number(e.target.value) })}
                                  className={`w-full h-8 rounded border px-2 text-[12.5px] outline-none bg-surface-2 ${excede ? "border-destructive text-destructive" : "border-border"}`} />
                              </div>
                            )})}
                          </div>
                        </div>

                        {/* Portas + tipo */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-1">Número de portas</div>
                            <input type="number" min={0} max={20} value={m.portas}
                              onChange={(e) => updateMovel(m.id, { portas: Number(e.target.value) })}
                              className="w-full h-8 rounded border border-border bg-surface-2 px-2 text-[12.5px] outline-none" />
                          </div>
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-1">Tipo de abertura</div>
                            <div className="flex gap-1.5 h-8 items-center">
                              {(["abrir", "correr", "sem"] as const).map((tipo) => (
                                <button key={tipo} type="button"
                                  onClick={() => updateMovel(m.id, { tipo_porta: tipo })}
                                  disabled={m.portas === 0}
                                  className={`text-[11px] px-2.5 py-1 rounded border transition-colors disabled:opacity-40 ${m.tipo_porta === tipo && m.portas > 0 ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:bg-secondary"}`}>
                                  {tipo === "abrir" ? "Abrir" : tipo === "correr" ? "Correr" : "Sem"}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Gavetas + Prateleiras */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-1">Gavetas</div>
                            <input type="number" min={0} max={20} value={m.gavetas}
                              onChange={(e) => updateMovel(m.id, { gavetas: Number(e.target.value) })}
                              className="w-full h-8 rounded border border-border bg-surface-2 px-2 text-[12.5px] outline-none" />
                          </div>
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-1">Prateleiras</div>
                            <input type="number" min={0} max={20} value={m.prateleiras}
                              onChange={(e) => updateMovel(m.id, { prateleiras: Number(e.target.value) })}
                              className="w-full h-8 rounded border border-border bg-surface-2 px-2 text-[12.5px] outline-none" />
                          </div>
                        </div>

                        {/* Extras */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={m.tem_fundo ?? true}
                              onChange={(e) => updateMovel(m.id, { tem_fundo: e.target.checked })}
                              className="rounded" />
                            <span className="text-[12px]">Tem fundo (chapa 6mm)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={m.tem_rodape ?? false}
                              onChange={(e) => updateMovel(m.id, { tem_rodape: e.target.checked })}
                              className="rounded" />
                            <span className="text-[12px]">Rodapé (faixa 15cm)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={m.tem_pes ?? false}
                              onChange={(e) => updateMovel(m.id, { tem_pes: e.target.checked })}
                              className="rounded" />
                            <span className="text-[12px]">Pés reguláveis</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={m.tem_roda_teto ?? false}
                              onChange={(e) => updateMovel(m.id, { tem_roda_teto: e.target.checked })}
                              className="rounded" />
                            <span className="text-[12px]">Roda-teto</span>
                          </label>
                        </div>
                        {m.tem_roda_teto && (
                          <div className="w-44">
                            <div className="text-[11px] text-muted-foreground mb-1">Altura do teto (cm)</div>
                            <input type="number" min={200} max={400} value={m.altura_teto_cm ?? 270}
                              onChange={(e) => updateMovel(m.id, { altura_teto_cm: Number(e.target.value) })}
                              className="w-full h-8 rounded border border-border bg-surface-2 px-2 text-[12.5px] outline-none" />
                          </div>
                        )}

                        {/* Seleção de materiais */}
                        <div className="border-t border-border pt-3 space-y-2">
                          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Materiais</div>

                          {/* MDF caixa (interior) */}
                          <MatSelect label="MDF caixa — interior (Branco TX)" value={m.mdf_caixa_id}
                            options={mdfCatalog} onChange={(v) => updateMovel(m.id, { mdf_caixa_id: v })} />

                          {/* MDF envelope (faces externas) */}
                          <MatSelect label="MDF envelope — faces externas (cor do cliente)" value={m.mdf_externo_id}
                            options={mdfCatalog} onChange={(v) => updateMovel(m.id, { mdf_externo_id: v })} />

                          {/* Fundo 6mm */}
                          {(m.tem_fundo ?? true) && (
                            <MatSelect label="Chapa fundo (6mm)" value={m.fundo_id}
                              options={fundoCatalog} onChange={(v) => updateMovel(m.id, { fundo_id: v })} />
                          )}

                          {/* Dobradiças */}
                          {m.portas > 0 && m.tipo_porta === "abrir" && (
                            <MatSelect label={`Dobradiça (${m.portas * (m.altura_cm > 150 ? 3 : 2)} unid. auto)`}
                              value={m.dobradica_id} options={dobCatalog}
                              onChange={(v) => updateMovel(m.id, { dobradica_id: v })} />
                          )}

                          {/* Corrediça de porta */}
                          {m.portas > 0 && m.tipo_porta === "correr" && (
                            <MatSelect label={`Corrediça de porta (${Math.ceil(m.portas / 2)} par(es) + trilho)`}
                              value={m.corrediça_porta_id} options={corrPortaCatalog}
                              onChange={(v) => updateMovel(m.id, { corrediça_porta_id: v })} />
                          )}

                          {/* Corrediça de gaveta */}
                          {m.gavetas > 0 && (
                            <MatSelect label={`Corrediça de gaveta (${m.gavetas} par(es))`}
                              value={m.corrediça_gaveta_id} options={corrGavCatalog}
                              onChange={(v) => updateMovel(m.id, { corrediça_gaveta_id: v })} />
                          )}

                          {/* Puxador */}
                          {(m.portas > 0 || m.gavetas > 0) && (
                            <MatSelect label={`Puxador (${m.portas + m.gavetas} unid.)`}
                              value={m.puxador_id} options={puxadorCatalog}
                              onChange={(v) => updateMovel(m.id, { puxador_id: v })} />
                          )}
                        </div>

                        <button type="button" onClick={() => setMoveis((prev) => prev.filter((x) => x.id !== m.id))}
                          className="text-[11.5px] text-destructive hover:opacity-70 inline-flex items-center gap-1">
                          <Trash2 className="size-3" /> Remover este móvel
                        </button>
                      </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="text-[12px] text-muted-foreground">
                {moveis.length === 0 ? "Nenhum móvel selecionado" : `${moveis.length} móvel(is) configurado(s)`}
              </div>
              <button type="button" onClick={handleGerarIA} disabled={aiLoading || moveis.length === 0}
                className="h-9 px-4 rounded-md bg-accent text-white text-[13px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2">
                {aiLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {aiLoading ? "Calculando..." : "Gerar Orçamento com IA"}
              </button>
            </div>
          </div>
        )}

        {/* ── FASE 3: REVISAR / EDIÇÃO ── */}
        {(fase === "revisar" || isEdit) && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-5 space-y-4">
              {!isEdit && (
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setFase("moveis")}
                    className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    ← Voltar aos móveis
                  </button>
                  <div className="text-[12px] text-muted-foreground">{fields.length} itens gerados</div>
                </div>
              )}

              {/* Cliente + Margem (modo manual ou edição) */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label>Cliente *</Label>
                  <select {...register("cliente_id")}
                    className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none text-foreground">
                    <option value="">Selecione...</option>
                    {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                  {errors.cliente_id && <div className="text-[11px] text-destructive mt-1">{errors.cliente_id.message}</div>}
                </div>
                <div>
                  <Label>Margem (%)</Label>
                  <input {...register("margem_pct")} type="number" min={0} max={100}
                    className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none" />
                </div>
              </div>

              {/* Itens agrupados por móvel */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Itens do orçamento</Label>
                  <button type="button"
                    onClick={() => append({ movel: "", justificativa: "", descricao: "", quantidade: 1, unidade: "un", preco_custo: 0, preco_unitario: 0 })}
                    className="text-[12px] text-accent hover:text-accent/80 inline-flex items-center gap-1">
                    <Plus className="size-3" /> Adicionar item
                  </button>
                </div>
                <ItemTable fields={fields} itens={itens} register={register} remove={remove} />
                {errors.itens?.root && <div className="text-[11px] text-destructive mt-1">{errors.itens.root.message}</div>}
              </div>

              {/* Mão de obra + resumo financeiro */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mão de obra / Instalação (R$)</Label>
                  <input {...register("mao_de_obra")} type="number" step="0.01" min="0"
                    placeholder="0,00"
                    className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none" />
                  <div className="text-[10.5px] text-muted-foreground mt-0.5">Cobrado separadamente — não entra na margem</div>
                </div>
                <div className="text-[12.5px] space-y-1 pt-5">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Materiais</span>
                    <span className="num">R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {(() => {
                    const custo = itens.reduce((s, i) => s + (Number(i.preco_custo) || 0) * (Number(i.quantidade) || 0), 0);
                    const lucro = subtotal - custo;
                    const margemReal = subtotal > 0 ? (lucro / subtotal * 100) : 0;
                    return (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Lucro (~{margemReal.toFixed(0)}%)</span>
                        <span className="num">R$ {lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    );
                  })()}
                  <div className="flex justify-between font-semibold border-t border-border pt-1">
                    <span>Total</span>
                    <span className="num">R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Justificativa / Observações</Label>
                <textarea {...register("observacoes")} rows={3}
                  placeholder="A IA explica aqui o que foi calculado e por quê cada valor foi aplicado..."
                  className="w-full rounded-md border border-border bg-surface-2 px-2.5 py-2 text-[13px] outline-none resize-none" />
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-t border-border">
              <select {...register("status")}
                className="h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none">
                <option value="rascunho">Salvar como rascunho</option>
                <option value="analise">Enviar para análise</option>
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={onClose}
                  className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5">
                  {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                  {isEdit ? "Salvar alterações" : "Criar orçamento"}
                </button>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// Tabela de itens separada para manter o código organizado
function ItemTable({ fields, itens, register, remove }: {
  fields: ReturnType<typeof useFieldArray<FormData, "itens">>["fields"];
  itens: FormData["itens"];
  register: ReturnType<typeof useForm<FormData>>["register"];
  remove: (index: number) => void;
}) {
  // Agrupa por móvel para display
  const groups = useMemo(() => {
    const map: Record<string, number[]> = {};
    itens.forEach((it, idx) => {
      const key = it.movel || "Geral";
      if (!map[key]) map[key] = [];
      map[key].push(idx);
    });
    return map;
  }, [itens]);

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <table className="w-full text-[12px]">
        <thead className="bg-surface-2 border-b border-border">
          <tr>
            <th className="text-left font-medium px-3 py-2 text-muted-foreground w-[28%]">Descrição</th>
            <th className="text-left font-medium px-2 py-2 text-muted-foreground w-[13%]">Móvel</th>
            <th className="text-right font-medium px-2 py-2 text-muted-foreground w-[10%]">Qtd</th>
            <th className="text-left font-medium px-2 py-2 text-muted-foreground w-[6%]">Un</th>
            <th className="text-right font-medium px-2 py-2 text-muted-foreground w-[12%]">Custo R$</th>
            <th className="text-right font-medium px-2 py-2 text-muted-foreground w-[12%]">Preço R$</th>
            <th className="text-right font-medium px-2 py-2 text-muted-foreground w-[13%]">Total R$</th>
            <th className="w-7"></th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groups).map(([groupName, indices]) => (
            <>
              {Object.keys(groups).length > 1 && (
                <tr key={`g-${groupName}`} className="bg-secondary/30">
                  <td colSpan={8} className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {groupName}
                  </td>
                </tr>
              )}
              {indices.map((idx) => {
                const field = fields[idx];
                const linha = itens[idx];
                const tot = (Number(linha?.preco_unitario) || 0) * (Number(linha?.quantidade) || 0);
                return (
                  <tr key={field.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-1.5">
                      <input {...register(`itens.${idx}.descricao`)} placeholder="Descrição"
                        className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[11.5px] outline-none focus:border-border-strong" />
                      {linha?.justificativa && (
                        <div className="text-[10px] text-muted-foreground mt-0.5 px-1 flex items-start gap-0.5">
                          <Info className="size-2.5 mt-0.5 shrink-0" />
                          <span>{linha.justificativa}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <input {...register(`itens.${idx}.movel`)} placeholder="Móvel"
                        className="w-full h-7 rounded border border-border bg-surface-2 px-1.5 text-[11.5px] outline-none" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input {...register(`itens.${idx}.quantidade`)} type="number" step="0.01" min="0"
                        className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[11.5px] outline-none text-right" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input {...register(`itens.${idx}.unidade`)}
                        className="w-full h-7 rounded border border-border bg-surface-2 px-1 text-[11.5px] outline-none" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input {...register(`itens.${idx}.preco_custo`)} type="number" step="0.01" min="0"
                        className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[11.5px] outline-none text-right" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input {...register(`itens.${idx}.preco_unitario`)} type="number" step="0.01" min="0"
                        className="w-full h-7 rounded border border-border bg-surface-2 px-2 text-[11.5px] outline-none text-right" />
                    </td>
                    <td className="px-2 py-1.5 text-right num text-muted-foreground text-[11.5px]">
                      {tot.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-1.5">
                      <button type="button" onClick={() => remove(idx)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Página de orçamentos ───────────────────────────────────────────────────

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
      const data = await getOrcamentos((empresa as { id: string }).id);
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

  const totalPipeline = orcs.filter((o) => ["analise", "aprovado"].includes(o.status)).reduce((s, o) => s + (o.total ?? 0), 0);

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
            <button onClick={() => setShowModal(true)}
              className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5">
              <Plus className="size-3.5" /> Novo orçamento
            </button>
          </>
        }
      />

      <div className="grid md:grid-cols-4 gap-3 mb-5">
        {[
          { l: "Em análise", v: orcs.filter((o) => o.status === "analise").length },
          { l: "Aprovados", v: orcs.filter((o) => o.status === "aprovado").length },
          { l: "Total", v: orcs.length },
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..."
            className="h-8 flex-1 min-w-[180px] max-w-sm rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong" />
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
                  <tr key={o.id} onClick={() => setDetalhe(o)}
                    className="border-b border-border last:border-0 hover:bg-secondary/40 cursor-pointer group">
                    <td className="px-5 py-3 font-mono text-[12px] text-muted-foreground">{o.numero ?? "—"}</td>
                    <td className="px-5 py-3 font-medium">{o.clientes?.nome ?? "—"}</td>
                    <td className="px-5 py-3 text-right num">{(o.total ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-5 py-3"><Pill tone={STATUS_TONE[o.status] ?? "neutral"}>{STATUS_LABEL[o.status] ?? o.status}</Pill></td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</td>
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

// ─── Modal de detalhe ───────────────────────────────────────────────────────

const STATUS_NEXT: Record<string, string[]> = {
  rascunho: ["analise"],
  analise: ["aprovado", "recusado"],
  aprovado: [],
  recusado: ["rascunho"],
};

type PecaCorte = {
  movel: string; peca: string; material: string;
  largura_mm: number; comprimento_mm: number; quantidade: number;
  fita_l: boolean; fita_r: boolean; fita_t: boolean; fita_b: boolean;
  observacao?: string;
};
type ListaCorteResult = {
  pecas: PecaCorte[];
  resumo: { total_pecas: number; chapas_estimadas: number; metros_fita: number };
};

function OrcDetalheModal({ orc, onClose, onChanged, onEdit }: {
  orc: Orc; onClose: () => void; onChanged: () => void; onEdit: () => void;
}) {
  const navigate = useNavigate();
  const [itens, setItens] = useState<OrcItem[]>([]);
  const [loadingItens, setLoadingItens] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [criandoProjeto, setCriandoProjeto] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [empresaNome, setEmpresaNome] = useState("");
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [listaCorte, setListaCorte] = useState<ListaCorteResult | null>(null);
  const [listaCorteLoading, setListaCorteLoading] = useState(false);
  const [showCorte, setShowCorte] = useState(false);

  useEffect(() => {
    getOrcamentoItens(orc.id)
      .then((data) => setItens(data as OrcItem[]))
      .finally(() => setLoadingItens(false));
    getEmpresaAtual().then((e) => {
      if (e) {
        setEmpresaNome((e as { nome: string }).nome ?? "");
        setLogoUrl((e as { logo_url?: string | null }).logo_url ?? null);
        setEmpresaId((e as { id: string }).id);
      }
    });
  }, [orc.id]);

  // Agrupa itens por móvel
  const grupos = useMemo(() => {
    const map: Record<string, OrcItem[]> = {};
    for (const it of itens) {
      const key = it.movel || "Geral";
      if (!map[key]) map[key] = [];
      map[key].push(it);
    }
    return map;
  }, [itens]);

  const handleCriarProjeto = async () => {
    if (!empresaId) { toast.error("Empresa não encontrada"); return; }
    const orcTyped = orc as unknown as { cliente_id?: string };
    setCriandoProjeto(true);
    try {
      const projeto = await upsertProjeto(empresaId, {
        nome: `Projeto — ${orc.clientes?.nome ?? "Cliente"} (${orc.numero ?? ""})`,
        descricao: `Gerado a partir do orçamento ${orc.numero ?? ""}`,
        status: "briefing",
        cliente_id: orcTyped.cliente_id ?? null,
      });
      toast.success("Projeto criado com sucesso!");
      onClose();
      navigate({ to: "/app/projetos", search: { destaque: (projeto as { id: string }).id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar projeto");
    } finally {
      setCriandoProjeto(false);
    }
  };

  const handleStatus = async (newStatus: string) => {
    setChangingStatus(true);
    try {
      await updateOrcamentoStatus(orc.id, newStatus);
      toast.success(`Status atualizado para ${STATUS_LABEL[newStatus]}`);
      onChanged(); onClose();
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
            onChanged(); onClose();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao excluir");
          }
        },
      },
      cancel: { label: "Cancelar", onClick: () => {} },
    });
  };

  const handleGerarCorte = async () => {
    const orcTyped = orc as unknown as { moveis_config?: MovelConfig[] };
    const moveisCfg = orcTyped.moveis_config;
    if (!moveisCfg?.length) {
      toast.error("Este orçamento não tem configuração de móveis salva. Edite e salve novamente para gerar o plano de corte.");
      return;
    }
    setListaCorteLoading(true);
    setShowCorte(true);
    try {
      const res = await fetch("/api/lista-corte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moveis: moveisCfg }),
      });
      if (!res.ok) throw new Error(await res.text());
      setListaCorte(await res.json() as ListaCorteResult);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar plano de corte");
      setShowCorte(false);
    } finally {
      setListaCorteLoading(false);
    }
  };

  const nextStatuses = STATUS_NEXT[orc.status] ?? [];
  const totalItens = itens.reduce((s, i) => s + Number(i.preco_unitario) * Number(i.quantidade), 0);
  const multiGrupo = Object.keys(grupos).length > 1;

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
          {/* Itens agrupados por móvel */}
          <div>
            <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground mb-2">Itens do orçamento</div>
            {loadingItens ? (
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground py-4">
                <Loader2 className="size-4 animate-spin" /> Carregando itens...
              </div>
            ) : itens.length === 0 ? (
              <div className="text-[13px] text-muted-foreground py-4 text-center">Nenhum item registrado.</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(grupos).map(([grupo, gItens]) => (
                  <div key={grupo}>
                    {multiGrupo && (
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-0.5 border-b border-border pb-1">
                        {grupo}
                      </div>
                    )}
                    <table className="w-full text-[12.5px]">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-[11px] uppercase tracking-wider">
                          <th className="text-left py-1.5">Descrição</th>
                          <th className="text-right py-1.5 pr-2">Qtd</th>
                          <th className="text-right py-1.5">Preço unit.</th>
                          <th className="text-right py-1.5">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gItens.map((it) => (
                          <tr key={it.id} className="border-b border-border last:border-0">
                            <td className="py-1.5 pr-2">
                              <div>{it.descricao}</div>
                              {it.justificativa && (
                                <div className="text-[10.5px] text-muted-foreground mt-0.5 flex items-start gap-0.5">
                                  <Info className="size-2.5 mt-0.5 shrink-0" />
                                  <span>{it.justificativa}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-1.5 pr-2 text-right num text-muted-foreground">{it.quantidade} {it.unidade}</td>
                            <td className="py-1.5 text-right num">{Number(it.preco_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-1.5 text-right num font-medium">{(Number(it.preco_unitario) * Number(it.quantidade)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
                <div className="flex justify-end pt-1">
                  <div className="text-[13px]">
                    <span className="text-muted-foreground mr-3">Total</span>
                    <span className="font-semibold num">R$ {totalItens.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Plano de corte */}
          {showCorte && (
            <div>
              <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground mb-2">Plano de corte</div>
              {listaCorteLoading ? (
                <div className="flex items-center gap-2 py-4 text-[12.5px] text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Calculando peças com IA...
                </div>
              ) : listaCorte ? (
                <div>
                  <div className="text-[11px] text-muted-foreground mb-2">
                    {listaCorte.resumo.total_pecas} peças · {listaCorte.resumo.chapas_estimadas} chapas · {listaCorte.resumo.metros_fita}m fita de borda
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11.5px] min-w-[600px]">
                      <thead className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                        <tr>
                          <th className="text-left py-1.5 px-1">Móvel</th>
                          <th className="text-left py-1.5 px-1">Peça</th>
                          <th className="text-left py-1.5 px-1">Material</th>
                          <th className="text-right py-1.5 px-1">L mm</th>
                          <th className="text-right py-1.5 px-1">C mm</th>
                          <th className="text-center py-1.5 px-1">Qtd</th>
                          <th className="text-center py-1.5 px-1">Fita</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listaCorte.pecas.map((p, i) => (
                          <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-secondary/20">
                            <td className="py-1 px-1 text-muted-foreground truncate max-w-[90px]">{p.movel}</td>
                            <td className="py-1 px-1 font-medium">{p.peca}</td>
                            <td className="py-1 px-1 text-muted-foreground text-[10.5px]">{p.material}</td>
                            <td className="py-1 px-1 text-right tabular-nums">{p.largura_mm}</td>
                            <td className="py-1 px-1 text-right tabular-nums">{p.comprimento_mm}</td>
                            <td className="py-1 px-1 text-center">{p.quantidade}</td>
                            <td className="py-1 px-1 text-center text-[10px] font-mono text-muted-foreground">
                              {[p.fita_t && "T", p.fita_b && "B", p.fita_l && "L", p.fita_r && "R"].filter(Boolean).join("") || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {nextStatuses.length > 0 && (
            <div>
              <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground mb-2">Alterar status</div>
              <div className="flex gap-2 flex-wrap">
                {nextStatuses.map((s) => (
                  <button key={s} onClick={() => handleStatus(s)} disabled={changingStatus}
                    className={`h-8 px-3 rounded-md border text-[12.5px] font-medium transition-colors disabled:opacity-60 ${s === "aprovado" ? "border-emerald-500 text-emerald-600 hover:bg-emerald-500/10"
                      : s === "recusado" ? "border-destructive text-destructive hover:bg-destructive/10"
                      : "border-amber-500 text-amber-600 hover:bg-amber-500/10"}`}>
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
            {orc.status === "aprovado" && (
              <button onClick={handleCriarProjeto} disabled={criandoProjeto}
                className="h-8 px-3 rounded-md bg-emerald-600 text-white text-[12.5px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5">
                {criandoProjeto ? <Loader2 className="size-3.5 animate-spin" /> : <FolderPlus className="size-3.5" />}
                Criar Projeto
              </button>
            )}
            <button onClick={handleGerarCorte} disabled={listaCorteLoading}
              className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary disabled:opacity-60 inline-flex items-center gap-1.5">
              {listaCorteLoading ? <Loader2 className="size-3.5 animate-spin" /> : <ChevronRight className="size-3.5" />}
              Plano de Corte
            </button>
            <button onClick={onEdit}
              className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary inline-flex items-center gap-1.5">
              <Pencil className="size-3.5" /> Editar
            </button>
            <button
              onClick={() => {
                const printWin = window.open("", "_blank");
                if (!printWin) return;
                const rows = Object.entries(grupos).map(([grupo, gItens]) => {
                  const groupHeader = multiGrupo
                    ? `<tr><td colspan="4" style="padding:8px 8px 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#999;border-top:2px solid #ddd">${grupo}</td></tr>`
                    : "";
                  const itemRows = gItens.map((it) => `
                    <tr>
                      <td>${it.descricao}${it.justificativa ? `<br><span style="font-size:10px;color:#999">${it.justificativa}</span>` : ""}</td>
                      <td style="text-align:center">${it.quantidade} ${it.unidade}</td>
                      <td style="text-align:right">R$ ${Number(it.preco_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style="text-align:right">R$ ${(Number(it.preco_unitario) * Number(it.quantidade)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>`).join("");
                  return groupHeader + itemRows;
                }).join("");
                const logoHtml = logoUrl ? `<img src="${logoUrl}" style="height:48px;object-fit:contain;margin-bottom:8px" /><br>` : "";
                printWin.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
                  <title>Orçamento ${orc.numero ?? ""}</title>
                  <style>
                    body{font-family:sans-serif;padding:40px;color:#111;max-width:800px;margin:0 auto}
                    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;border-bottom:2px solid #111;padding-bottom:16px}
                    .cliente-box{background:#f5f5f5;border-radius:6px;padding:12px 16px;margin-bottom:24px;font-size:13px}
                    table{width:100%;border-collapse:collapse;font-size:13px}
                    th{text-align:left;border-bottom:2px solid #ddd;padding:8px;font-size:11px;text-transform:uppercase;color:#666;letter-spacing:.06em}
                    td{padding:8px;border-bottom:1px solid #eee}
                    tfoot td{font-weight:700;border-top:2px solid #111;padding-top:12px}
                    .footer{margin-top:40px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:12px}
                    @media print{body{padding:20px}}
                  </style></head><body>
                  <div class="header">
                    <div>${logoHtml}<div style="font-size:16px;font-weight:700">${empresaNome}</div><div style="font-size:11px;color:#666">Proposta comercial</div></div>
                    <div><div style="font-size:12px;color:#666">Orçamento</div><div style="font-size:22px;font-weight:700">${orc.numero ?? "—"}</div><div style="font-size:12px;color:#666">${new Date(orc.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div></div>
                  </div>
                  <div class="cliente-box"><strong>Cliente:</strong> ${orc.clientes?.nome ?? "—"}</div>
                  <table>
                    <thead><tr><th>Descrição</th><th style="text-align:center">Qtd</th><th style="text-align:right">Preço unit.</th><th style="text-align:right">Total</th></tr></thead>
                    <tbody>${rows}</tbody>
                    <tfoot><tr><td colspan="3" style="text-align:right">Total</td><td style="text-align:right">R$ ${totalItens.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr></tfoot>
                  </table>
                  <div class="footer">Documento gerado pelo Planne ERP · ${new Date().toLocaleDateString("pt-BR")}</div>
                  <script>window.onload=()=>window.print()</script></body></html>`);
                printWin.document.close();
              }}
              className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary inline-flex items-center gap-1.5">
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

function MatSelect({ label, value, options, onChange }: {
  label: string;
  value?: string;
  options: { id: string; nome: string; preco_custo: number; preco_venda: number }[];
  onChange: (id: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (options.length === 0) return null;

  const selected = options.find((o) => o.id === value);
  const filtered = query.trim()
    ? options.filter((o) => o.nome.toLowerCase().includes(query.toLowerCase()))
    : options;

  const fmt = (v: number) => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleOpen = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const dropH = Math.min(filtered.length * 32 + 56, 260);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= dropH
      ? rect.bottom + 4
      : rect.top - dropH - 4;
    setDropStyle({ position: "fixed", top, left: rect.left, width: rect.width, zIndex: 9999 });
    setOpen((v) => !v);
  };

  return (
    <div className="relative">
      <div className="text-[10.5px] text-muted-foreground mb-0.5">{label}</div>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="w-full h-8 rounded border border-border bg-surface-2 px-2 text-[11.5px] outline-none text-foreground flex items-center justify-between gap-1"
      >
        <span className="truncate text-left">
          {selected ? `${selected.nome} — R$ ${fmt(selected.preco_venda)}` : "Deixar IA escolher"}
        </span>
        <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
      </button>

      {open && createPortal(
        <div ref={dropRef} style={dropStyle} className="rounded border border-border bg-popover shadow-xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border">
            <Search className="size-3 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar..."
              className="flex-1 bg-transparent text-[11.5px] outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")}>
                <X className="size-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <div className="max-h-52 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(undefined); setOpen(false); setQuery(""); }}
              className={`w-full text-left px-2.5 py-1.5 text-[11.5px] hover:bg-secondary transition-colors ${!value ? "bg-primary/10 text-primary font-medium" : ""}`}
            >
              Deixar IA escolher
            </button>
            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => { onChange(o.id); setOpen(false); setQuery(""); }}
                className={`w-full text-left px-2.5 py-1.5 text-[11.5px] hover:bg-secondary transition-colors ${value === o.id ? "bg-primary/10 text-primary font-medium" : ""}`}
              >
                {o.nome} — R$ {fmt(o.preco_venda)}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-2.5 py-2 text-[11px] text-muted-foreground">Nenhum resultado</div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
