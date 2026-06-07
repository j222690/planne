import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/planne/primitives";
import {
  Sparkles, Upload, X, ChevronRight, ChevronLeft, Loader2,
  ImageIcon, Wand2, Building2, LayoutGrid, FileText,
  CheckCircle2, Zap, AlertCircle, DollarSign, Package, Scissors,
  Settings2, Palette, Map, Factory, Download, RefreshCw, Layers, Plus,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getEmpresaAtual, getClientes, upsertOrcamento } from "@/lib/db";
import { checkAndConsumeCredito } from "@/lib/credits";
import { useNavigate } from "@tanstack/react-router";
import { RoomCanvas, exportSvgToPng, type MovelCanvas } from "@/components/planne/RoomCanvas";

export const Route = createFileRoute("/app/ia-projetos")({
  component: IAProjetoPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface Movel extends MovelCanvas {
  altura_cm: number;
  preco_estimado: number;
  chapas_mdf: number;
  nota: string;
  // Interior config (Promob-like)
  tipo_porta?: "dobradica" | "correr" | "aberta" | "basculante";
  num_portas?: number;
  num_prateleiras?: number;
  num_gavetas?: number;
  divisorias?: number;
  ferragem?: "nacional" | "blum" | "hafele";
  espelho?: boolean;
}

interface AnaliseIA {
  resumo: string;
  descricao_comercial: string;
  estilo_detectado: string;
  moveis: Movel[];
  orcamento: {
    mdf_custo: number;
    ferragens_custo: number;
    puxadores_custo: number;
    fita_borda_custo: number;
    mao_de_obra: number;
    desperdicio_pct: number;
    subtotal: number;
    margem_pct: number;
    total: number;
  };
  observacoes_tecnicas: string[];
}

interface PecaCorte {
  movel: string;
  peca: string;
  material: string;
  largura_mm: number;
  comprimento_mm: number;
  quantidade: number;
  fita_l: boolean;
  fita_r: boolean;
  fita_t: boolean;
  fita_b: boolean;
  observacao?: string;
}

interface ListaCorteResult {
  pecas: PecaCorte[];
  resumo: { total_pecas: number; chapas_estimadas: number; metros_fita: number };
}

const MDF_CORES = [
  { nome: "Branco TX", hex: "#f5f3f0" },
  { nome: "Off White", hex: "#f0ebe0" },
  { nome: "Cinza Claro", hex: "#d4d0cc" },
  { nome: "Cinza Grafite", hex: "#5a5a5a" },
  { nome: "Preto Fosco", hex: "#2c2c2c" },
  { nome: "Carvalho Natural", hex: "#c8a87a" },
  { nome: "Freijó", hex: "#b8824a" },
  { nome: "Nogueira", hex: "#8b6340" },
  { nome: "Imbuia", hex: "#7a5530" },
  { nome: "Verde Musgo", hex: "#5a6a4a" },
  { nome: "Azul Petróleo", hex: "#2a4a5a" },
  { nome: "Terracota", hex: "#b56a4a" },
];

type PardeType = "top" | "bottom" | "left" | "right";

type PlantaSalva = {
  nome: string; largura_cm: number; profundidade_cm: number; altura_cm: number;
  porta_principal?: { parede: string }; janelas?: { parede: string }[];
};

interface ComodoWizard {
  id: string;
  nome: string;   // instância nomeada: "Cozinha", "Quarto Maria"
  tipo: string;   // tipo de ambiente
  feito: boolean; // já gerou projeto?
}

interface WizardState {
  step: 1 | 2 | 3 | 4 | 5;
  projetoId: string | null;
  comodos: ComodoWizard[];
  comodoAtivoId: string | null;
  form: {
    nome: string;
    ambiente: string;
    estilo: string;
    largura: string;
    profundidade: string;
    altura: string;
    descricao: string;
    cor_mdf: string;
    porta_parede: PardeType;
    janelas: PardeType[];
  };
  planta: File | null;
  referencias: File[];
  analisando: boolean;
  analise: AnaliseIA | null;
  moveis: Movel[];
  renderUrl: string | null;
  renderLoading: boolean;
  renderJobId: string | null;
  listaCorte: ListaCorteResult | null;
  listaCorteLoading: boolean;
  renderMode: "schnell" | "pro";
  previewUrl: string | null;
  error: string | null;
  clienteId: string | null;
  clienteNome: string | null;
  criandoOrdem: boolean;
}

type SavedProject = {
  id: string; nome: string; ambiente: string; estilo: string;
  created_at: string; render_url: string | null;
};

const AMBIENTES = ["Sala de estar", "Quarto casal", "Quarto solteiro", "Cozinha", "Home office", "Closet", "Banheiro", "Área gourmet", "Escritório"];
const ESTILOS = ["Moderno Minimalista", "Contemporâneo", "Clássico", "Industrial", "Escandinavo", "Boho Chic", "Rústico", "Luxo"];

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DropZone({
  label, accept, onFile, preview, multiple, files,
}: {
  label: string; accept: string; onFile: (f: File | File[]) => void;
  preview?: string; multiple?: boolean; files?: File[];
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (files?.length) {
      const urls = files.map((f) => URL.createObjectURL(f));
      setPreviews(urls);
      return () => { urls.forEach((u) => URL.revokeObjectURL(u)); };
    }
    setPreviews(preview ? [preview] : []);
  }, [files, preview]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (!dropped.length) return;
    onFile(multiple ? dropped : dropped[0]);
  };

  return (
    <div
      className={`relative rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
        dragOver ? "border-accent bg-accent/5" : "border-border hover:border-border-strong"
      }`}
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const fs = Array.from(e.target.files ?? []);
          if (!fs.length) return;
          onFile(multiple ? fs : fs[0]);
        }}
      />
      {previews.length > 0 ? (
        <div className={`p-2 ${multiple ? "flex flex-wrap gap-2" : ""}`}>
          {previews.map((p, i) => (
            <img key={i} src={p} alt="" className="h-28 w-auto rounded object-cover max-w-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <ImageIcon className="size-8 text-muted-foreground/50 mb-2" />
          <div className="text-[13px] font-medium text-muted-foreground">{label}</div>
          <div className="text-[11.5px] text-muted-foreground/70 mt-1">Arraste ou clique para selecionar</div>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  const steps = [
    { n: 1, label: "Ambiente" },
    { n: 2, label: "Arquivos" },
    { n: 3, label: "Análise IA" },
    { n: 4, label: "Layout" },
    { n: 5, label: "Render" },
  ];
  return (
    <div className="flex items-center gap-1 mb-6">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
            s.n === step
              ? "bg-foreground text-background"
              : s.n < step
              ? "bg-accent/20 text-accent"
              : "text-muted-foreground"
          }`}>
            {s.n < step ? <CheckCircle2 className="size-3" /> : <span>{s.n}</span>}
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight className="size-3.5 text-muted-foreground/40 mx-0.5" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function IAProjetoPage() {
  const [wizard, setWizard] = useState<WizardState | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [plantasSalvas, setPlantasSalvas] = useState<Record<string, PlantaSalva>>({});
  const [empresaParams, setEmpresaParams] = useState({ mdf_custo_chapa: 85, mao_obra_hora: 45, margem_padrao: 300 });
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProjects() {
      const empresa = await getEmpresaAtual();
      if (!empresa) return;
      const eid = (empresa as { id: string }).id;
      const { data } = await supabase
        .from("room_projects")
        .select("id,nome,ambiente,estilo,created_at,render_url")
        .eq("empresa_id", eid)
        .order("created_at", { ascending: false })
        .limit(6);
      setSavedProjects(data ?? []);
      setLoadingProjects(false);

      // Load plantas, params and clientes
      const emp = empresa as { parametros?: Record<string, unknown> };
      const p = emp.parametros ?? {};
      setEmpresaParams({
        mdf_custo_chapa: Number(p.mdf_custo_chapa ?? 85),
        mao_obra_hora: Number(p.mao_obra_hora ?? 45),
        margem_padrao: Number(p.margem_padrao ?? 300),
      });
      if (p.plantas_baixas && typeof p.plantas_baixas === "object") {
        setPlantasSalvas(p.plantas_baixas as Record<string, PlantaSalva>);
      }
      const cls = await getClientes(eid);
      setClientes((cls as { id: string; nome: string }[]) ?? []);
    }
    loadProjects();
  }, []);

  const initWizard = () =>
    setWizard({
      step: 1,
      projetoId: null,
      comodos: [],
      comodoAtivoId: null,
      form: { nome: "", ambiente: "Sala de estar", estilo: "Moderno Minimalista", largura: "4", profundidade: "3", altura: "2.7", descricao: "", cor_mdf: "#f5f3f0", porta_parede: "bottom", janelas: [] },
      planta: null,
      referencias: [],
      analisando: false,
      analise: null,
      moveis: [],
      renderUrl: null,
      renderLoading: false,
      renderJobId: null,
      listaCorte: null,
      listaCorteLoading: false,
      renderMode: "pro",
      previewUrl: null,
      clienteId: null,
      clienteNome: null,
      criandoOrdem: false,
      error: null,
    });

  const update = (patch: Partial<WizardState>) => setWizard((w) => w ? { ...w, ...patch } : w);

  // ── Step 3: Analyze ──────────────────────────────────────────────────────

  const analisar = useCallback(async () => {
    if (!wizard) return;
    update({ analisando: true, error: null });

    try {
      const planta_b64 = wizard.planta ? await fileToBase64(wizard.planta) : undefined;
      const referencias_b64 = await Promise.all(wizard.referencias.map(fileToBase64));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ambiente: wizard.form.ambiente,
          medidas: {
            largura: parseFloat(wizard.form.largura) || 4,
            profundidade: parseFloat(wizard.form.profundidade) || 3,
            altura: parseFloat(wizard.form.altura) || 2.7,
          },
          estilo: wizard.form.estilo,
          descricao: wizard.form.descricao,
          cor_mdf: wizard.form.cor_mdf,
          porta_parede: wizard.form.porta_parede,
          janelas: wizard.form.janelas,
          planta_b64,
          referencias_b64: referencias_b64.length ? referencias_b64 : undefined,
          custo_chapa: empresaParams.mdf_custo_chapa,
          mao_obra_hora: empresaParams.mao_obra_hora,
          margem_padrao: empresaParams.margem_padrao,
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error ?? "Erro na análise");
      }

      const { analise } = await res.json() as { analise: AnaliseIA };

      // Persist to room_projects
      let projetoId: string | null = null;
      try {
        const empresa = await getEmpresaAtual();
        if (empresa) {
          const { data: proj } = await supabase.from("room_projects").insert({
            empresa_id: (empresa as { id: string }).id,
            nome: wizard.form.nome,
            ambiente: wizard.form.ambiente,
            estilo: wizard.form.estilo,
            medidas: { largura: parseFloat(wizard.form.largura) || 4, profundidade: parseFloat(wizard.form.profundidade) || 3, altura: parseFloat(wizard.form.altura) || 2.7 },
            analise_ia: analise,
            moveis_layout: analise.moveis ?? [],
            orcamento_ia: analise.orcamento,
            orcamento_base_texto: analise.descricao_comercial,
          }).select("id").single();
          projetoId = proj?.id ?? null;
        }
      } catch {
        // persist failure is non-blocking
      }

      // Marcar o cômodo ativo como concluído (multi-cômodo)
      const comodosAtualizados = (wizard.comodos ?? []).map((c) =>
        c.id === wizard.comodoAtivoId ? { ...c, feito: true } : c,
      );
      update({ analisando: false, analise, moveis: analise.moveis ?? [], step: 4, projetoId, comodos: comodosAtualizados });
    } catch (e) {
      update({ analisando: false, error: e instanceof Error ? e.message : "Erro" });
    }
  }, [wizard]);

  // ── Step 5: Generate render ──────────────────────────────────────────────

  const gerarRender = useCallback(async (mode: "schnell" | "pro" = "pro") => {
    if (!wizard?.analise) return;

    // Crédito apenas para render premium
    if (mode === "pro") {
      try {
        const empresa = await getEmpresaAtual();
        if (empresa) {
          const result = await checkAndConsumeCredito((empresa as { id: string }).id, "render");
          if (!result.ok) { toast.error(result.mensagem ?? "Sem créditos de render."); return; }
          toast.info(`Crédito utilizado. Restam ${result.restantes} créditos de render.`);
        }
      } catch { /* não bloqueia */ }
    }

    update({ renderLoading: true, renderMode: mode, error: null });

    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          ambiente: wizard.form.ambiente,
          estilo: wizard.form.estilo,
          estilo_detectado: wizard.analise.estilo_detectado,
          moveis: wizard.analise.moveis.map((m) => ({
            nome: m.nome,
            categoria: m.categoria,
            cor_hex: m.cor_hex,
            largura_cm: m.largura_cm,
            profundidade_cm: m.profundidade_cm,
            altura_cm: m.altura_cm,
          })),
          descricao: wizard.analise.resumo,
          descricao_comercial: wizard.analise.descricao_comercial,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}) as Record<string, unknown>) as { error?: string };
        throw new Error(errBody.error ?? `Erro ao iniciar render (HTTP ${res.status})`);
      }

      const data = await res.json() as { provider: string; url?: string; job_id?: string; status: string };

      const saveRenderUrl = async (url: string, jobId?: string) => {
        if (wizard.projetoId) {
          await supabase.from("room_projects").update({ render_url: url }).eq("id", wizard.projetoId);
        }
        if (jobId) {
          await supabase.from("render_jobs").update({ render_url: url, status: "completed" }).eq("id", jobId);
        }
      };

      if (data.status === "completed" && data.url) {
        await saveRenderUrl(data.url);
        if (mode === "schnell") {
          update({ previewUrl: data.url, renderLoading: false });
          toast.success("Preview gerado!");
        } else {
          update({ renderUrl: data.url, renderLoading: false, step: 5 });
        }
        return;
      }

      if (data.job_id) {
        update({ renderJobId: data.job_id });
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          try {
            const r = await fetch(`/api/render?job_id=${data.job_id}`);
            if (!r.ok) {
              const errText = await r.text();
              clearInterval(poll);
              update({ renderLoading: false, error: `Erro ao consultar render: ${errText.slice(0, 200)}` });
              return;
            }
            const s = await r.json() as { status: string; url?: string; error?: string };
            if (s.status === "completed" && s.url) {
              clearInterval(poll);
              await saveRenderUrl(s.url, data.job_id);
              if (mode === "schnell") {
                update({ previewUrl: s.url, renderLoading: false });
                toast.success("Preview rápido gerado!");
              } else {
                update({ renderUrl: s.url, renderLoading: false, step: 5 });
                toast.success("Render premium gerado!");
              }
            } else if (s.status === "error" || s.error) {
              clearInterval(poll);
              update({ renderLoading: false, error: s.error ?? "Erro no render. Tente novamente." });
            } else if (attempts > 40) {
              clearInterval(poll);
              update({ renderLoading: false, error: "Tempo limite excedido (120s). Tente novamente." });
            }
          } catch (pollErr) {
            clearInterval(poll);
            update({ renderLoading: false, error: pollErr instanceof Error ? pollErr.message : "Erro ao verificar render" });
          }
        }, 3000);
      }
    } catch (e) {
      update({ renderLoading: false, error: e instanceof Error ? e.message : "Erro" });
    }
  }, [wizard]);

  const gerarListaCorte = useCallback(async () => {
    if (!wizard?.analise?.moveis?.length) return;
    update({ listaCorteLoading: true });
    try {
      const res = await fetch("/api/lista-corte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moveis: wizard.analise.moveis.map((m) => ({
            nome: m.nome,
            categoria: m.categoria,
            largura_cm: m.largura_cm,
            profundidade_cm: m.profundidade_cm,
            altura_cm: m.altura_cm,
          })),
        }),
      });
      if (!res.ok) throw new Error("Erro ao gerar lista de corte");
      const data = await res.json() as ListaCorteResult;
      update({ listaCorte: data, listaCorteLoading: false });
      if (wizard.projetoId) {
        await supabase.from("room_projects").update({
          analise_ia: { ...wizard.analise, lista_corte: data },
        }).eq("id", wizard.projetoId);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar lista de corte");
      update({ listaCorteLoading: false });
    }
  }, [wizard]);

  const criarOrcamentoFormal = useCallback(async (clienteIdOverride?: string) => {
    if (!wizard?.analise) return;
    const cid = clienteIdOverride ?? wizard.clienteId;
    try {
      const empresa = await getEmpresaAtual();
      if (!empresa) throw new Error("Empresa não encontrada");
      const eid = (empresa as { id: string }).id;

      const orc = await upsertOrcamento(eid, {
        status: "rascunho",
        margem_pct: wizard.analise.orcamento.margem_pct,
        subtotal: wizard.analise.orcamento.subtotal,
        total: wizard.analise.orcamento.total,
        observacoes: wizard.analise.descricao_comercial,
        cliente_id: cid ?? null,
      });

      const itensData = (wizard.analise.moveis ?? [])
        .filter((m) => m.customizado !== false && m.tipo_elemento !== "porta" && m.tipo_elemento !== "janela" && m.preco_estimado > 0)
        .map((m) => ({
          orcamento_id: orc.id,
          descricao: m.nome,
          quantidade: 1,
          unidade: "un",
          preco_custo: Math.round(m.preco_estimado / (wizard.analise!.orcamento.margem_pct / 100)),
          preco_unitario: m.preco_estimado,
          total: m.preco_estimado,
        }));

      if (itensData.length > 0) {
        await supabase.from("orcamento_itens").insert(itensData);
      }

      toast.success(`Orçamento ${orc.numero} criado com sucesso!`);
      navigate({ to: "/app/orcamentos" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar orçamento");
    }
  }, [wizard, navigate]);

  const criarOrdemProducao = useCallback(async () => {
    if (!wizard?.listaCorte || !wizard.analise) return;
    update({ criandoOrdem: true });
    try {
      const empresa = await getEmpresaAtual();
      if (!empresa) throw new Error("Empresa não encontrada");
      const eid = (empresa as { id: string }).id;
      const { data: ordem } = await supabase.from("ordens_producao").insert({
        empresa_id: eid,
        status: "aberta",
        observacoes: `Gerado por IA Projetos — ${wizard.form.nome || wizard.form.ambiente}. ${wizard.listaCorte.resumo.total_pecas} peças · ${wizard.listaCorte.resumo.chapas_estimadas} chapas · ${wizard.listaCorte.resumo.metros_fita}m fita.`,
      }).select("id,numero").single();
      if (!ordem) throw new Error("Erro ao criar ordem");

      // Salvar peças como cortes na ordem
      const pecas = wizard.listaCorte.pecas.map((p) => ({
        ordem_producao_id: ordem.id,
        descricao_peca: `${p.peca} (${p.movel})`,
        material: p.material,
        largura_mm: p.largura_mm,
        comprimento_mm: p.comprimento_mm,
        quantidade: p.quantidade,
        fita_borda: [p.fita_l && "E", p.fita_r && "D", p.fita_t && "T", p.fita_b && "B"].filter(Boolean).join("|") || null,
        observacao: p.observacao ?? null,
      }));
      if (pecas.length > 0) {
        await supabase.from("pecas_corte").insert(pecas).throwOnError();
      }
      toast.success(`Ordem de produção #${ordem.numero ?? ""} criada com ${pecas.length} peças!`);
      update({ criandoOrdem: false });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar ordem");
      update({ criandoOrdem: false });
    }
  }, [wizard]);

  if (!wizard) return <LandingPage onStart={initWizard} savedProjects={savedProjects} loading={loadingProjects} />;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <PageHeader
          eyebrow="IA Premium"
          title={wizard.form.nome || "Novo Projeto IA"}
          description="Interpretação de planta • Layout 2D • Orçamento automático • Render"
        />
        <button
          onClick={() => setWizard(null)}
          className="text-muted-foreground hover:text-foreground ml-4"
        >
          <X className="size-5" />
        </button>
      </div>

      <StepIndicator step={wizard.step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={wizard.step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
        >
          {wizard.step === 1 && <Step1Form wizard={wizard} update={update} plantasSalvas={plantasSalvas} />}
          {wizard.step === 2 && <Step2Upload wizard={wizard} update={update} />}
          {wizard.step === 3 && <Step3Analyzing wizard={wizard} analisar={analisar} />}
          {wizard.step === 4 && <Step4Layout wizard={wizard} update={update} gerarRender={gerarRender} criarOrcamento={criarOrcamentoFormal} gerarListaCorte={gerarListaCorte} criarOrdem={criarOrdemProducao} clientes={clientes} />}
          {wizard.step === 5 && <Step5Render wizard={wizard} update={update} criarOrcamento={() => criarOrcamentoFormal(wizard.clienteId ?? undefined)} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Step 1: Ambiente & Medidas ───────────────────────────────────────────────

const WALL_LABELS: Record<string, string> = {
  top: "Parede de cima", bottom: "Parede de baixo", left: "Parede esquerda", right: "Parede direita",
};
const WALL_ICON: Record<string, string> = { top: "↑", bottom: "↓", left: "←", right: "→" };

function Step1Form({ wizard, update, plantasSalvas }: {
  wizard: WizardState;
  update: (p: Partial<WizardState>) => void;
  plantasSalvas: Record<string, PlantaSalva>;
}) {
  const f = wizard.form;
  const set = (k: keyof typeof f, v: string) => update({ form: { ...f, [k]: v } });

  const toggleJanela = (wall: PardeType) => {
    const has = f.janelas.includes(wall);
    update({ form: { ...f, janelas: has ? f.janelas.filter((w) => w !== wall) : [...f.janelas, wall] } });
  };

  const usarPlanta = (planta: PlantaSalva) => {
    const toParede = (s?: string): PardeType => (["top", "bottom", "left", "right"].includes(s ?? "") ? (s as PardeType) : "bottom");
    update({
      form: {
        ...f,
        largura: String(planta.largura_cm / 100),
        profundidade: String(planta.profundidade_cm / 100),
        altura: planta.altura_cm ? String(planta.altura_cm / 100) : f.altura,
        porta_parede: toParede(planta.porta_principal?.parede),
        janelas: (planta.janelas ?? []).map((j) => toParede(j.parede)).filter((w, i, a) => a.indexOf(w) === i),
      },
    });
    toast.success(`Medidas de "${planta.nome}" aplicadas`);
  };

  const valid = f.nome.trim().length > 0;
  const temPlantas = Object.keys(plantasSalvas).length > 0;

  const comodos = wizard.comodos ?? [];
  const [novoComodoTipo, setNovoComodoTipo] = useState("");

  const addComodo = (tipo: string) => {
    if (!tipo) return;
    const mesmoTipo = comodos.filter((c) => c.tipo === tipo).length;
    const nome = mesmoTipo > 0 ? `${tipo} ${mesmoTipo + 1}` : tipo;
    const novo: ComodoWizard = { id: Math.random().toString(36).slice(2), nome, tipo, feito: false };
    update({
      comodos: [...comodos, novo],
      comodoAtivoId: novo.id,
      form: { ...f, nome: nome, ambiente: tipo },
    });
    setNovoComodoTipo("");
  };

  const selecionarComodo = (c: ComodoWizard) => {
    update({ comodoAtivoId: c.id, form: { ...f, nome: c.nome, ambiente: c.tipo } });
  };

  const removerComodo = (id: string) => {
    update({
      comodos: comodos.filter((c) => c.id !== id),
      comodoAtivoId: wizard.comodoAtivoId === id ? null : wizard.comodoAtivoId,
    });
  };

  return (
    <Surface className="space-y-5 max-w-2xl">

      {/* ── Cômodos do projeto — escolher quais ambientes terão móveis ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label>Cômodos do projeto <span className="text-muted-foreground font-normal">— cada um tem sua medida/planta</span></Label>
          {comodos.length > 0 && <span className="text-[11px] text-muted-foreground">{comodos.length} cômodo(s)</span>}
        </div>
        {comodos.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {comodos.map((c) => (
              <div key={c.id}
                className={`group inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-md border text-[12px] font-medium transition-colors cursor-pointer ${wizard.comodoAtivoId === c.id ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-secondary"}`}
                onClick={() => selecionarComodo(c)}>
                {c.feito && <CheckCircle2 className="size-3 text-emerald-500" />}
                {c.nome}
                <button type="button" onClick={(e) => { e.stopPropagation(); removerComodo(c.id); }}
                  className="text-muted-foreground/60 hover:text-destructive"><X className="size-3" /></button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <select value={novoComodoTipo} onChange={(e) => setNovoComodoTipo(e.target.value)}
            className="flex-1 h-8 rounded-md border border-border bg-surface-2 px-2.5 text-[12.5px] outline-none text-foreground">
            <option value="">Adicionar cômodo...</option>
            {AMBIENTES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button type="button" onClick={() => addComodo(novoComodoTipo)} disabled={!novoComodoTipo}
            className="h-8 px-3 rounded-md border border-border text-[12.5px] font-medium hover:bg-secondary disabled:opacity-50 inline-flex items-center gap-1.5">
            <Plus className="size-3.5" /> Adicionar
          </button>
        </div>
        {comodos.length > 0 && (
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Trabalhe um cômodo por vez: selecione um chip acima, preencha medidas/planta e gere o projeto. Depois volte e faça o próximo.
          </p>
        )}
      </div>

      {/* ── Planta baixa — PRIMEIRO para extrair medidas e layout ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label>
            Planta baixa do ambiente
            <span className="ml-1 text-accent font-medium">(recomendado — a IA lê medidas, portas, janelas e vigas)</span>
          </Label>
          {wizard.planta && (
            <button
              type="button"
              onClick={() => update({ planta: null })}
              className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1"
            >
              <X className="size-3" /> remover
            </button>
          )}
        </div>
        <DropZone
          label="Envie a planta baixa — a IA vai ler automaticamente medidas, onde ficam porta, janelas e vigas"
          accept="image/*"
          onFile={(f) => update({ planta: f as File })}
          files={wizard.planta ? [wizard.planta] : undefined}
        />
        {wizard.planta && (
          <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-emerald-600">
            <CheckCircle2 className="size-3.5" /> {wizard.planta.name} — a IA vai analisar esta planta
          </div>
        )}
        {!wizard.planta && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {temPlantas && Object.values(plantasSalvas).map((p) => (
              <button
                key={p.nome}
                type="button"
                onClick={() => usarPlanta(p)}
                className="h-7 px-2.5 rounded-md border border-accent/40 text-[11.5px] font-medium hover:bg-accent/10 transition-colors inline-flex items-center gap-1.5"
              >
                <Map className="size-3 text-accent" /> {p.nome}
                <span className="text-muted-foreground font-normal">{p.largura_cm / 100}×{p.profundidade_cm / 100}m</span>
              </button>
            ))}
            {!temPlantas && (
              <span className="text-[11px] text-muted-foreground italic">
                Sem planta? Preencha as medidas abaixo manualmente.
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4">
        <div>
          <Label>Nome do projeto *</Label>
          <input
            value={f.nome}
            onChange={(e) => set("nome", e.target.value)}
            placeholder="Ex: Suite Master – Família Mendes"
            className="input"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Tipo de ambiente</Label>
            <select value={f.ambiente} onChange={(e) => set("ambiente", e.target.value)} className="input">
              {AMBIENTES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <Label>Estilo desejado</Label>
            <select value={f.estilo} onChange={(e) => set("estilo", e.target.value)} className="input">
              {ESTILOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Label>Medidas do ambiente</Label>
            {wizard.planta && (
              <span className="text-[11px] text-accent font-medium bg-accent/10 px-1.5 py-0.5 rounded">
                Será lido da planta — confirme se necessário
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[["largura", "Largura (m)"], ["profundidade", "Profundidade (m)"], ["altura", "Pé-direito (m)"]].map(([k, lbl]) => (
              <div key={k}>
                <div className="text-[11px] text-muted-foreground mb-1">{lbl}</div>
                <input
                  type="number"
                  step="0.1"
                  value={f[k as keyof typeof f]}
                  onChange={(e) => set(k as keyof typeof f, e.target.value)}
                  placeholder={wizard.planta ? "da planta" : ""}
                  className={`input text-center ${wizard.planta ? "border-accent/40 bg-accent/5" : ""}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Cor / acabamento do MDF</Label>
          <div className="flex flex-wrap gap-2">
            {MDF_CORES.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.nome}
                onClick={() => set("cor_mdf", c.hex)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[12px] transition-all ${f.cor_mdf === c.hex ? "border-accent ring-1 ring-accent font-medium" : "border-border hover:border-border-strong"}`}
              >
                <span className="size-3.5 rounded-sm shrink-0 border border-black/10" style={{ background: c.hex }} />
                {c.nome}
              </button>
            ))}
          </div>
        </div>

        {/* Porta + Janelas — layout do cômodo */}
        <div className={`grid grid-cols-2 gap-4 p-3 rounded-lg border ${wizard.planta ? "bg-accent/5 border-accent/30" : "bg-secondary/40 border-border"}`}>
          {wizard.planta && (
            <div className="col-span-2 flex items-center gap-1.5 text-[11.5px] text-accent mb-1">
              <CheckCircle2 className="size-3.5" />
              <span>Com planta enviada, a IA vai detectar porta e janelas automaticamente. Preencha só se quiser sobrescrever.</span>
            </div>
          )}
          {/* Porta */}
          <div>
            <Label>Porta principal {wizard.planta && <span className="text-muted-foreground font-normal">(opcional)</span>}</Label>
            <div className="text-[11px] text-muted-foreground mb-2">Em qual parede fica?</div>
            <div className="grid grid-cols-2 gap-1.5">
              {(["top", "bottom", "left", "right"] as PardeType[]).map((wall) => (
                <button
                  key={wall}
                  type="button"
                  onClick={() => update({ form: { ...f, porta_parede: wall } })}
                  className={`h-8 text-[12px] rounded-md border transition-colors ${
                    f.porta_parede === wall
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {WALL_ICON[wall]} {WALL_LABELS[wall].split(" ")[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Janelas */}
          <div>
            <Label>Janelas {wizard.planta && <span className="text-muted-foreground font-normal">(opcional)</span>}</Label>
            <div className="text-[11px] text-muted-foreground mb-2">Em quais paredes?</div>
            <div className="grid grid-cols-2 gap-1.5">
              {(["top", "bottom", "left", "right"] as PardeType[]).map((wall) => (
                <button
                  key={wall}
                  type="button"
                  onClick={() => toggleJanela(wall)}
                  className={`h-8 text-[12px] rounded-md border transition-colors ${
                    f.janelas.includes(wall)
                      ? "bg-sky-500/15 text-sky-700 border-sky-400"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {WALL_ICON[wall]} {WALL_LABELS[wall].split(" ")[1]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label>O que o cliente quer — descreva em detalhes</Label>
          <textarea
            value={f.descricao}
            onChange={(e) => set("descricao", e.target.value)}
            rows={4}
            placeholder="Descreva tudo que o cliente quer: móveis específicos, iluminação LED, espelhos, detalhes de nicho, ripado, tipo de porta, estilo da decoração, materiais especiais, etc. Quanto mais detalhes, melhor o projeto gerado."
            className="w-full rounded-md border border-border bg-surface-2 px-2.5 py-2 text-[13px] outline-none focus:border-border-strong resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-border">
        <button
          onClick={() => update({ step: 2 })}
          disabled={!valid}
          className="h-9 px-5 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          Próximo <ChevronRight className="size-4" />
        </button>
      </div>
    </Surface>
  );
}

// ─── Step 2: Referências visuais ─────────────────────────────────────────────

function Step2Upload({ wizard, update }: { wizard: WizardState; update: (p: Partial<WizardState>) => void }) {
  return (
    <Surface className="space-y-5 max-w-2xl">
      {/* Resumo da planta se já enviada */}
      {wizard.planta && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5 text-[12.5px] text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-3.5 shrink-0" />
          <span>Planta enviada: <strong>{wizard.planta.name}</strong> — a IA vai ler as medidas e o layout.</span>
          <button onClick={() => update({ planta: null })} className="ml-auto text-muted-foreground hover:text-destructive">
            <X className="size-3" />
          </button>
        </div>
      )}
      {!wizard.planta && (
        <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-[12.5px] text-amber-700 dark:text-amber-400">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>Você não enviou a planta baixa. A IA usará apenas as medidas digitadas. <button onClick={() => update({ step: 1 })} className="underline font-medium">Voltar para adicionar</button>.</span>
        </div>
      )}

      <div className="grid gap-4">
        <div>
          <Label>Referências visuais <span className="text-muted-foreground font-normal">(até 3 fotos de estilo/inspiração)</span></Label>
          <DropZone
            label="Adicione fotos de referência do estilo desejado"
            accept="image/*"
            multiple
            onFile={(files) => {
              const arr = (Array.isArray(files) ? files : [files]).slice(0, 3);
              update({ referencias: arr });
            }}
            files={wizard.referencias}
          />
          {wizard.referencias.length > 0 && (
            <div className="flex items-center gap-2 mt-1.5 text-[12px] text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              {wizard.referencias.length} referência(s) adicionada(s)
              <button onClick={() => update({ referencias: [] })} className="ml-auto hover:text-destructive">
                <X className="size-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-[12.5px] text-amber-700 dark:text-amber-400 flex items-start gap-2">
        <Sparkles className="size-3.5 mt-0.5 shrink-0" />
        <span>A IA analisará planta + referências + medidas para gerar um projeto completo. Quanto mais informações, melhor o resultado.</span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button onClick={() => update({ step: 1 })} className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-secondary inline-flex items-center gap-1.5">
          <ChevronLeft className="size-4" /> Voltar
        </button>
        <button
          onClick={() => update({ step: 3 })}
          className="h-9 px-5 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5"
        >
          Analisar com IA <Wand2 className="size-4" />
        </button>
      </div>
    </Surface>
  );
}

// ─── Step 3: Analyzing ────────────────────────────────────────────────────────

function Step3Analyzing({ wizard, analisar }: { wizard: WizardState; analisar: () => void }) {
  useEffect(() => {
    if (!wizard.analisando && !wizard.analise && !wizard.error) {
      analisar();
    }
  }, []);

  return (
    <Surface className="max-w-2xl">
      {wizard.analisando ? (
        <div className="flex flex-col items-center py-16 gap-4">
          <div className="relative">
            <div className="size-16 rounded-full bg-accent/10 grid place-items-center">
              <Sparkles className="size-8 text-accent" />
            </div>
            <Loader2 className="size-5 text-accent animate-spin absolute -right-1 -bottom-1" />
          </div>
          <div className="text-center">
            <div className="text-[15px] font-semibold">Analisando com GPT-4o Vision…</div>
            <div className="text-[13px] text-muted-foreground mt-1">Interpretando planta, sugerindo móveis e calculando orçamento</div>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {["Interpretando planta", "Dimensionando móveis", "Calculando MDF", "Estimando orçamento"].map((s, i) => (
              <motion.span
                key={s}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.5 + 0.5 }}
                className="text-[11.5px] bg-secondary px-2.5 py-1 rounded-full text-muted-foreground"
              >
                {s}
              </motion.span>
            ))}
          </div>
        </div>
      ) : wizard.error ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <AlertCircle className="size-10 text-destructive" />
          <div className="text-[14px] font-medium">Erro na análise</div>
          <div className="text-[13px] text-muted-foreground text-center max-w-sm">{wizard.error}</div>
          <button
            onClick={analisar}
            className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}
    </Surface>
  );
}

// ─── Step 4: Layout + Orçamento ───────────────────────────────────────────────

const MDF_CORES_COMPLETO = [
  { nome: "Branco TX", hex: "#f5f3f0" },
  { nome: "Off White", hex: "#f0ebe0" },
  { nome: "Cinza Claro", hex: "#d4d0cc" },
  { nome: "Cinza Grafite", hex: "#5a5a5a" },
  { nome: "Preto Fosco", hex: "#2c2c2c" },
  { nome: "Carvalho Natural", hex: "#c8a87a" },
  { nome: "Freijó", hex: "#b8824a" },
  { nome: "Nogueira", hex: "#8b6340" },
  { nome: "Imbuia", hex: "#7a5530" },
  { nome: "Verde Musgo", hex: "#5a6a4a" },
  { nome: "Azul Petróleo", hex: "#2a4a5a" },
  { nome: "Terracota", hex: "#b56a4a" },
];

// ─── Detecção de mismatch de ambiente ────────────────────────────────────────

const AMBIENTE_KEYWORDS: Record<string, string[]> = {
  "Cozinha":       ["bancada", "arm-sup", "arm-inf", "armário superior", "armário inferior", "geladeira", "fogão", "cooktop", "pia", "despenseiro", "paneleiro"],
  "Sala de estar": ["rack", "painel tv", "sofá", "estante", "aparador", "home theater"],
  "Quarto casal":  ["roupeiro", "cama", "criado", "cabeceira", "cômoda", "guarda-roupa"],
  "Quarto solteiro":["roupeiro", "cama solteiro", "escrivaninha", "estante", "guarda-roupa"],
  "Home office":   ["escrivaninha", "mesa de trabalho", "estante", "arquivo", "cadeira"],
  "Banheiro":      ["gabinete", "espelheira", "nicho", "cuba", "armário banheiro"],
  "Closet":        ["roupeiro", "cabideiro", "nicho", "gavetas", "sapatos"],
};

function detectarMismatch(ambienteSelecionado: string, moveis: { nome: string; categoria: string }[]): string | null {
  const texto = moveis.map((m) => (m.nome + " " + m.categoria).toLowerCase()).join(" ");
  for (const [amb, kws] of Object.entries(AMBIENTE_KEYWORDS)) {
    if (amb === ambienteSelecionado) continue;
    const matches = kws.filter((kw) => texto.includes(kw.toLowerCase()));
    if (matches.length >= 2) return amb;
  }
  return null;
}

// ─── Helpers de cálculo (Promob-like) ────────────────────────────────────────

function calcChapasPorConfig(largura: number, altura: number, profundidade: number, cfg: {
  num_portas: number; num_prateleiras: number; num_gavetas: number; divisorias: number;
}): number {
  const A_CHAPA = 2.75 * 1.83; // m²
  const lat = (profundidade / 100) * (altura / 100) * 2;
  const horiz = (largura / 100) * (profundidade / 100) * (2 + cfg.num_prateleiras);
  const portas = cfg.num_portas * ((largura / cfg.num_portas) / 100) * (altura / 100);
  const gavetas = cfg.num_gavetas * (largura / 100) * 0.22;
  const divis = cfg.divisorias * (profundidade / 100) * (altura / 100) * 0.5;
  return Math.max(1, Math.ceil((lat + horiz + portas + gavetas + divis) * 1.12 / A_CHAPA));
}

function calcPrecoPorMovel(chapas: number, cfg: { ferragem?: string }, custoChapa = 85, margem = 3): number {
  const ferragemMult = cfg.ferragem === "blum" ? 1.5 : cfg.ferragem === "hafele" ? 2.0 : 1.0;
  const mdf = chapas * custoChapa * 1.15;
  const ferr = mdf * 0.28 * ferragemMult;
  const mao = mdf * 0.4;
  return Math.round((mdf + ferr + mao) * margem);
}

const NOME_COR: Record<string, string> = {
  "#f5f3f0": "Branco TX", "#f0ebe0": "Off White", "#d4d0cc": "Cinza Claro",
  "#5a5a5a": "Cinza Grafite", "#2c2c2c": "Preto Fosco", "#c8a87a": "Carvalho Natural",
  "#b8824a": "Freijó", "#8b6340": "Nogueira", "#7a5530": "Imbuia",
  "#5a6a4a": "Verde Musgo", "#2a4a5a": "Azul Petróleo", "#b56a4a": "Terracota",
};

// ─── Vista de Elevação por Parede ─────────────────────────────────────────────

function WallElevationSection({ wizard }: { wizard: WizardState }) {
  const [paredeAtiva, setParedeAtiva] = useState<"bottom" | "top" | "left" | "right">("bottom");
  const largM = parseFloat(wizard.form.largura) || 4;
  const profM = parseFloat(wizard.form.profundidade) || 3;
  const altM = parseFloat(wizard.form.altura) || 2.7;
  const { moveis } = wizard;

  const paredeW = (paredeAtiva === "top" || paredeAtiva === "bottom") ? largM : profM;
  const customMoveis = moveis.filter(m => m.tipo_elemento === "movel" && m.customizado !== false);

  const moveisDaParede = customMoveis.filter(m => {
    const limiar = 0.45;
    switch (paredeAtiva) {
      case "top":    return m.y_pct * profM < limiar;
      case "bottom": return (m.y_pct + m.profundidade_cm / 100 / profM) > 1 - limiar / profM;
      case "left":   return m.x_pct * largM < limiar;
      case "right":  return (m.x_pct + m.largura_cm / 100 / largM) > 1 - limiar / largM;
    }
  });

  const SVG_W = 880; const SVG_H = 310;
  const ML = 52; const MR = 16; const MT = 16; const MB = 44;
  const drawW = SVG_W - ML - MR;
  const drawH = SVG_H - MT - MB;
  const scaleX = drawW / (paredeW * 100);
  const scaleY = drawH / (altM * 100);

  const paredeLabels: Record<string, string> = {
    bottom: "Parede frontal (entrada)", top: "Parede de fundo", left: "Parede esquerda", right: "Parede direita"
  };

  return (
    <Surface>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-accent" />
          <span className="text-[14px] font-semibold">Vistas de elevação</span>
          <span className="text-[12px] text-muted-foreground">{paredeLabels[paredeAtiva]}</span>
        </div>
        <div className="flex gap-1">
          {([["bottom", "Frente"], ["top", "Fundo"], ["left", "Esquerda"], ["right", "Direita"]] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setParedeAtiva(k)}
              className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${
                paredeAtiva === k ? "bg-foreground text-background" : "border border-border hover:bg-secondary text-muted-foreground"
              }`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="bg-secondary/20 rounded-lg border border-border overflow-hidden">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ maxHeight: 310 }}>
          {/* Chão */}
          <line x1={ML} y1={MT + drawH} x2={ML + drawW} y2={MT + drawH} stroke="#374151" strokeWidth="2.5" />
          {/* Teto (tracejado) */}
          <line x1={ML} y1={MT} x2={ML + drawW} y2={MT} stroke="#9ca3af" strokeWidth="1" strokeDasharray="6 4" />
          {/* Paredes laterais */}
          <line x1={ML} y1={MT} x2={ML} y2={MT + drawH} stroke="#374151" strokeWidth="2.5" />
          <line x1={ML + drawW} y1={MT} x2={ML + drawW} y2={MT + drawH} stroke="#374151" strokeWidth="2.5" />
          {/* Cota largura total */}
          <line x1={ML} y1={MT + drawH + 22} x2={ML + drawW} y2={MT + drawH + 22} stroke="#9ca3af" strokeWidth="0.8" markerEnd="url(#arr)" />
          <line x1={ML} y1={MT + drawH + 16} x2={ML} y2={MT + drawH + 28} stroke="#9ca3af" strokeWidth="0.8" />
          <line x1={ML + drawW} y1={MT + drawH + 16} x2={ML + drawW} y2={MT + drawH + 28} stroke="#9ca3af" strokeWidth="0.8" />
          <text x={ML + drawW / 2} y={MT + drawH + 38} textAnchor="middle" fontSize="11" fill="#6b7280">{paredeW.toFixed(1)}m</text>
          {/* Cota altura */}
          <text x={ML - 8} y={MT + drawH / 2 + 4} textAnchor="middle" fontSize="11" fill="#6b7280"
            transform={`rotate(-90,${ML - 8},${MT + drawH / 2})`}>{altM}m</text>

          {/* Grade horizontal */}
          {[0.25, 0.5, 0.75].map(f => (
            <line key={f} x1={ML} y1={MT + drawH * (1 - f)} x2={ML + drawW} y2={MT + drawH * (1 - f)}
              stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="3 4" />
          ))}

          {/* Móveis */}
          {moveisDaParede.map((m) => {
            const posAlong_cm = (paredeAtiva === "left" || paredeAtiva === "right")
              ? m.y_pct * profM * 100 : m.x_pct * largM * 100;
            const wCm = (paredeAtiva === "left" || paredeAtiva === "right") ? m.profundidade_cm : m.largura_cm;
            const hCm = m.altura_cm || 220;
            const rx = ML + posAlong_cm * scaleX;
            const ry = MT + drawH - hCm * scaleY;
            const rw = wCm * scaleX;
            const rh = hCm * scaleY;
            const textColor = parseInt((m.cor_hex || "#f5f3f0").slice(1), 16) > 0x888888 ? "#374151" : "#f9fafb";

            return (
              <g key={m.id}>
                <rect x={rx} y={ry} width={rw} height={rh} fill={m.cor_hex || "#f5f3f0"}
                  stroke="#6b7280" strokeWidth="0.8" rx="1" />
                {/* Nome */}
                {rw > 45 && (
                  <text x={rx + rw / 2} y={ry + 14} textAnchor="middle" fontSize="9.5" fill={textColor}>
                    {m.nome.length > 14 ? m.nome.slice(0, 13) + "…" : m.nome}
                  </text>
                )}
                {/* Largura */}
                {rw > 40 && (
                  <text x={rx + rw / 2} y={ry + rh - 5} textAnchor="middle" fontSize="9" fill={textColor} opacity="0.75">
                    {wCm}cm
                  </text>
                )}
                {/* Cotas externas */}
                <line x1={rx} y1={MT + drawH + 8} x2={rx + rw} y2={MT + drawH + 8} stroke="#d1d5db" strokeWidth="0.6" />
                <line x1={rx} y1={MT + drawH + 4} x2={rx} y2={MT + drawH + 13} stroke="#d1d5db" strokeWidth="0.6" />
                <line x1={rx + rw} y1={MT + drawH + 4} x2={rx + rw} y2={MT + drawH + 13} stroke="#d1d5db" strokeWidth="0.6" />
                {/* Cota altura à esquerda */}
                {rh > 40 && (
                  <text x={rx - 3} y={ry + rh / 2 + 3} textAnchor="end" fontSize="8.5" fill="#9ca3af">
                    {hCm}cm
                  </text>
                )}
              </g>
            );
          })}

          {moveisDaParede.length === 0 && (
            <text x={SVG_W / 2} y={MT + drawH / 2 + 4} textAnchor="middle" fontSize="13" fill="#9ca3af">
              Nenhum móvel nesta parede
            </text>
          )}
        </svg>
      </div>
    </Surface>
  );
}

// ─── Resumo de Materiais ──────────────────────────────────────────────────────

function MateriaisResumo({ moveis, custoChapa }: { moveis: Movel[]; custoChapa: number }) {
  const custom = moveis.filter(m => m.tipo_elemento === "movel" && m.customizado !== false);

  const porCor: Record<string, { hex: string; nome: string; chapas: number }> = {};
  let totalChapas = 0, totalFita = 0;
  const ferragens: Record<string, number> = { nacional: 0, blum: 0, hafele: 0 };

  for (const m of custom) {
    const hex = m.cor_hex || "#f5f3f0";
    const nome = NOME_COR[hex] ?? "Cor personalizada";
    if (!porCor[hex]) porCor[hex] = { hex, nome, chapas: 0 };
    porCor[hex].chapas += m.chapas_mdf;
    totalChapas += m.chapas_mdf;
    totalFita += m.chapas_mdf * 22;
    ferragens[(m.ferragem ?? "nacional")] += (m.num_portas ?? 2) + (m.num_gavetas ?? 0) * 2;
  }

  const valorTotal = totalChapas * custoChapa;

  return (
    <Surface>
      <div className="flex items-center gap-2 mb-4">
        <Package className="size-4 text-accent" />
        <span className="text-[14px] font-semibold">Resumo de materiais</span>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {/* Chapas por cor */}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">MDF por cor/acabamento</div>
          <div className="space-y-1.5">
            {Object.values(porCor).map(c => (
              <div key={c.hex} className="flex items-center gap-2 text-[12.5px]">
                <span className="size-3.5 rounded shrink-0 border border-black/10" style={{ background: c.hex }} />
                <span className="flex-1 text-muted-foreground truncate">{c.nome}</span>
                <span className="font-medium tabular-nums">{c.chapas} chp</span>
              </div>
            ))}
            <div className="flex justify-between text-[12.5px] font-semibold pt-1 border-t border-border">
              <span>Total</span>
              <span>{totalChapas} chapas</span>
            </div>
            <div className="text-[11.5px] text-muted-foreground">
              ≈ R$ {valorTotal.toLocaleString("pt-BR")} em MDF
            </div>
          </div>
        </div>

        {/* Fita de borda */}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Fita de borda</div>
          <div className="space-y-1.5">
            {Object.values(porCor).map(c => (
              <div key={c.hex} className="flex items-center gap-2 text-[12.5px]">
                <span className="size-3.5 rounded shrink-0 border border-black/10" style={{ background: c.hex }} />
                <span className="flex-1 text-muted-foreground truncate">{c.nome}</span>
                <span className="font-medium tabular-nums">{Math.round(c.chapas * 22)}m</span>
              </div>
            ))}
            <div className="flex justify-between text-[12.5px] font-semibold pt-1 border-t border-border">
              <span>Total</span>
              <span>{Math.round(totalFita)}m</span>
            </div>
          </div>
        </div>

        {/* Ferragens */}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Ferragens estimadas</div>
          <div className="space-y-1.5 text-[12.5px]">
            {ferragens.nacional > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Nacional</span><span>{ferragens.nacional} peças</span></div>
            )}
            {ferragens.blum > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Blum (premium)</span><span>{ferragens.blum} peças</span></div>
            )}
            {ferragens.hafele > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Häfele (superior)</span><span>{ferragens.hafele} peças</span></div>
            )}
            <div className="text-[11px] text-muted-foreground pt-1 border-t border-border leading-relaxed">
              Inclui dobradiças, corrediças, puxadores e ajustadores de pé.
            </div>
          </div>
        </div>
      </div>
    </Surface>
  );
}

function MovelConfigPanel({ movel, onChange, onClose }: {
  movel: Movel;
  onChange: (patch: Partial<Movel>) => void;
  onClose: () => void;
}) {
  const isCustom = movel.customizado !== false && movel.tipo_elemento === "movel";

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="size-4 text-accent" />
          <span className="text-[13px] font-semibold">{movel.nome}</span>
          <span className="text-[11px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">
            {movel.largura_cm}×{movel.profundidade_cm}{movel.altura_cm ? `×${movel.altura_cm}` : ""}cm
          </span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      {isCustom && (
        <>
          {/* Cor do MDF */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Palette className="size-3.5 text-muted-foreground" />
              <span className="text-[11.5px] font-medium text-muted-foreground uppercase tracking-wide">Cor / acabamento</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MDF_CORES_COMPLETO.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.nome}
                  onClick={() => onChange({ cor_hex: c.hex })}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] transition-all ${
                    movel.cor_hex === c.hex
                      ? "border-accent ring-1 ring-accent font-medium"
                      : "border-border hover:border-border-strong"
                  }`}
                >
                  <span className="size-3 rounded-sm shrink-0 border border-black/10" style={{ background: c.hex }} />
                  {c.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Acabamentos */}
          <div>
            <div className="text-[11.5px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Acabamentos</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "rodape", label: "Rodapé", desc: "Painel inferior de 10cm" },
                { key: "pes_regulaveis", label: "Pés reguláveis", desc: "Pés de nível 15cm" },
                { key: "roda_teto", label: "Roda-teto", desc: "Acabamento superior à laje" },
              ].map(({ key, label, desc }) => {
                const ativo = movel[key as keyof Movel] as boolean | undefined;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onChange({ [key]: !ativo } as Partial<Movel>)}
                    className={`text-left rounded-md border p-2.5 transition-all ${
                      ativo
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border hover:border-border-strong text-muted-foreground"
                    }`}
                  >
                    <div className="text-[12px] font-medium">{label}</div>
                    <div className="text-[10.5px] mt-0.5 opacity-70">{desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tipo de porta */}
          <div>
            <div className="text-[11.5px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Tipo de portas</div>
            <div className="grid grid-cols-2 gap-1.5">
              {([
                { v: "dobradica", l: "Dobradiça" },
                { v: "correr", l: "Corrediça" },
                { v: "basculante", l: "Basculante" },
                { v: "aberta", l: "Aberto / Nicho" },
              ] as const).map(({ v, l }) => (
                <button key={v} type="button" onClick={() => onChange({ tipo_porta: v })}
                  className={`h-8 rounded-md border text-[12px] transition-colors ${
                    movel.tipo_porta === v
                      ? "bg-accent/15 border-accent text-accent font-medium"
                      : "border-border hover:border-border-strong text-muted-foreground"
                  }`}>{l}</button>
              ))}
            </div>
          </div>

          {/* Interior do móvel */}
          <div>
            <div className="text-[11.5px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Interior do móvel</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {([
                { k: "num_portas" as const, l: "Portas", min: 1, max: 6 },
                { k: "num_prateleiras" as const, l: "Prateleiras", min: 0, max: 8 },
                { k: "num_gavetas" as const, l: "Gavetas", min: 0, max: 6 },
                { k: "divisorias" as const, l: "Divisórias", min: 0, max: 4 },
              ]).map(({ k, l, min, max }) => {
                const val = (movel[k] ?? (k === "num_portas" ? 2 : 0)) as number;
                return (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground">{l}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => onChange({ [k]: Math.max(min, val - 1) })}
                        className="size-6 rounded border border-border hover:bg-secondary text-[14px] text-muted-foreground grid place-items-center">−</button>
                      <span className="w-6 text-center text-[13px] font-medium tabular-nums">{val}</span>
                      <button type="button" onClick={() => onChange({ [k]: Math.min(max, val + 1) })}
                        className="size-6 rounded border border-border hover:bg-secondary text-[14px] text-muted-foreground grid place-items-center">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dimensões editáveis */}
          <div>
            <div className="text-[11.5px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Dimensões (cm)</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { k: "largura_cm", label: "Largura" },
                { k: "profundidade_cm", label: "Prof." },
                { k: "altura_cm", label: "Altura" },
              ].map(({ k, label }) => (
                <div key={k}>
                  <div className="text-[10.5px] text-muted-foreground mb-1">{label}</div>
                  <input
                    type="number"
                    value={(movel as unknown as Record<string, unknown>)[k] as number || ""}
                    onChange={(e) => onChange({ [k]: parseInt(e.target.value) || 0 } as Partial<Movel>)}
                    className="w-full rounded-md border border-border bg-surface-2 px-2 py-1 text-[12px] text-center outline-none focus:border-accent"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Ferragens */}
          <div>
            <div className="text-[11.5px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Ferragens</div>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { v: "nacional" as const, l: "Nacional", sub: "Padrão" },
                { v: "blum" as const, l: "Blum", sub: "+50% custo" },
                { v: "hafele" as const, l: "Häfele", sub: "+100% custo" },
              ]).map(({ v, l, sub }) => (
                <button key={v} type="button" onClick={() => onChange({ ferragem: v })}
                  className={`rounded-md border p-2 text-left transition-all ${
                    (movel.ferragem ?? "nacional") === v
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-border-strong"
                  }`}>
                  <div className="text-[12px] font-medium">{l}</div>
                  <div className="text-[10.5px] text-muted-foreground">{sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Espelho + Recalcular */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button type="button"
              onClick={() => onChange({ espelho: !movel.espelho })}
              className={`h-8 px-3 rounded-md border text-[12px] transition-colors ${
                movel.espelho
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border hover:bg-secondary text-muted-foreground"
              }`}>
              Espelho interno {movel.espelho ? "✓" : ""}
            </button>
            <button type="button"
              onClick={() => {
                const chapas = calcChapasPorConfig(
                  movel.largura_cm, movel.altura_cm || 220, movel.profundidade_cm,
                  {
                    num_portas: movel.num_portas ?? 2,
                    num_prateleiras: movel.num_prateleiras ?? 0,
                    num_gavetas: movel.num_gavetas ?? 0,
                    divisorias: movel.divisorias ?? 0,
                  }
                );
                const preco = calcPrecoPorMovel(chapas, { ferragem: movel.ferragem });
                onChange({ chapas_mdf: chapas, preco_estimado: preco });
                toast.success(`Recalculado: ${chapas} chapas · ${BRL(preco)}`);
              }}
              className="h-8 px-3 rounded-md border border-accent/40 bg-accent/5 text-accent text-[12px] font-medium hover:bg-accent/10 inline-flex items-center gap-1.5 transition-colors">
              <RefreshCw className="size-3.5" /> Recalcular chapas e preço
            </button>
          </div>

          {/* Nota */}
          <div>
            <div className="text-[11.5px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Observação</div>
            <input
              type="text"
              value={movel.nota ?? ""}
              onChange={(e) => onChange({ nota: e.target.value })}
              placeholder="Ex: 6 portas de correr, perfil fosco..."
              className="w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-[12px] outline-none focus:border-accent"
            />
          </div>
        </>
      )}

      {!isCustom && (
        <div className="text-[12.5px] text-muted-foreground">
          {movel.tipo_elemento === "porta" && "Porta — arraste no canvas para reposicionar."}
          {movel.tipo_elemento === "janela" && "Janela — arraste no canvas para reposicionar."}
          {movel.tipo_elemento === "existente" && "Móvel existente (comprado) — não incluso no orçamento de marcenaria."}
        </div>
      )}
    </div>
  );
}

function Step4Layout({ wizard, update, gerarRender, criarOrcamento, gerarListaCorte, criarOrdem, clientes }: {
  wizard: WizardState;
  update: (p: Partial<WizardState>) => void;
  gerarRender: (mode?: "schnell" | "pro") => void;
  criarOrcamento: (clienteId?: string) => void;
  gerarListaCorte: () => void;
  criarOrdem: () => void;
  clientes: { id: string; nome: string }[];
}) {
  const [selectedMovelId, setSelectedMovelId] = useState<string | null>(null);
  const [motorAberto, setMotorAberto] = useState(false);
  const [motorLoading, setMotorLoading] = useState(false);
  const [motorParede, setMotorParede] = useState<"top" | "bottom" | "left" | "right">("top");
  const [motorFerragem, setMotorFerragem] = useState<"nacional" | "blum" | "hafele">("nacional");

  const { analise, moveis } = wizard;
  if (!analise) return null;
  const { orcamento, descricao_comercial, observacoes_tecnicas } = analise;

  const selectedMovel = selectedMovelId ? moveis.find((m) => m.id === selectedMovelId) ?? null : null;

  const updateMovel = (id: string, patch: Partial<Movel>) => {
    update({ moveis: moveis.map((m) => m.id === id ? { ...m, ...patch } : m) });
  };

  const linhasOrc = [
    { label: "MDF (chapas + desperdício)", value: orcamento.mdf_custo },
    { label: "Ferragens", value: orcamento.ferragens_custo },
    { label: "Puxadores e acabamentos", value: orcamento.puxadores_custo },
    { label: "Fita de borda", value: orcamento.fita_borda_custo },
    { label: "Mão de obra", value: orcamento.mao_de_obra },
  ];

  const ambienteDetectado = detectarMismatch(wizard.form.ambiente, moveis);

  return (
    <div className="space-y-5">
      {/* Mismatch banner */}
      {ambienteDetectado && (
        <div className="flex items-start gap-3 rounded-md border border-amber-500/40 bg-amber-500/8 px-4 py-3 text-[12.5px] text-amber-800 dark:text-amber-300">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Possível ambiente incorreto.</span>{" "}
            A IA identificou elementos típicos de <strong>{ambienteDetectado}</strong>, mas o projeto foi criado como <strong>{wizard.form.ambiente}</strong>.
            {" "}Verifique se o tipo de ambiente está correto antes de prosseguir.
            <button
              onClick={() => update({ form: { ...wizard.form, ambiente: ambienteDetectado as typeof wizard.form.ambiente }, step: 1 })}
              className="ml-2 underline font-medium hover:opacity-80"
            >
              Corrigir para "{ambienteDetectado}"
            </button>
          </div>
        </div>
      )}

      {/* Error banner */}
      {wizard.error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-[12.5px] text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{wizard.error}</span>
          <button onClick={() => update({ error: null })} className="ml-auto shrink-0 hover:opacity-70"><X className="size-3.5" /></button>
        </div>
      )}

      {/* Render loading indicator */}
      {wizard.renderLoading && (
        <div className="flex items-center gap-3 rounded-md border border-violet-400/30 bg-violet-50 dark:bg-violet-950/20 px-4 py-3 text-[12.5px] text-violet-700 dark:text-violet-300">
          <Loader2 className="size-4 animate-spin shrink-0" />
          <span>{wizard.renderMode === "schnell" ? "Gerando preview rápido… aguarde ~10s" : "Gerando render premium… pode levar até 60s"}</span>
        </div>
      )}

      {/* Canvas 2D */}
      <Surface padded={false}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div>
            <div className="text-[14px] font-semibold">Layout 2D — Vista superior</div>
            <div className="text-[12px] text-muted-foreground mt-0.5">
              {wizard.form.ambiente} · {wizard.form.largura}m × {wizard.form.profundidade}m · {moveis.length} móveis
            </div>
          </div>
          <div className="text-[11.5px] text-muted-foreground">Arraste para reposicionar</div>
        </div>
        <div className="p-2 space-y-3">
          <RoomCanvas
            moveis={moveis}
            medidas={{
              largura: parseFloat(wizard.form.largura) || 4,
              profundidade: parseFloat(wizard.form.profundidade) || 3,
            }}
            onChange={(updated) => update({ moveis: updated as Movel[] })}
            onSelect={setSelectedMovelId}
            onExport={() => {}}
          />
          {/* Painel de configuração do móvel selecionado */}
          {selectedMovel && (
            <MovelConfigPanel
              movel={selectedMovel}
              onChange={(patch) => updateMovel(selectedMovel.id, patch)}
              onClose={() => setSelectedMovelId(null)}
            />
          )}
          {!selectedMovel && (
            <div className="text-center text-[11.5px] text-muted-foreground py-1">
              Clique em um móvel para configurar cor, acabamentos e dimensões
            </div>
          )}
        </div>
      </Surface>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Orçamento */}
        <Surface>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="size-4 text-accent" />
            <span className="text-[14px] font-semibold">Orçamento estimado</span>
            <span className="ml-auto text-[11.5px] text-muted-foreground">Margem: {orcamento.margem_pct}%</span>
          </div>
          <div className="space-y-2">
            {linhasOrc.map((l) => (
              <div key={l.label} className="flex items-center justify-between text-[12.5px]">
                <span className="text-muted-foreground">{l.label}</span>
                <span className="font-medium tabular-nums">{BRL(l.value)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 mt-2 flex justify-between text-[12.5px]">
              <span className="text-muted-foreground">Subtotal (custo)</span>
              <span className="tabular-nums">{BRL(orcamento.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[15px] font-bold">
              <span>Total ao cliente</span>
              <span className="text-accent tabular-nums">{BRL(orcamento.total)}</span>
            </div>
          </div>
        </Surface>

        {/* Lista de móveis */}
        <Surface>
          <div className="flex items-center gap-2 mb-4">
            <Package className="size-4 text-accent" />
            <span className="text-[14px] font-semibold">Móveis sugeridos</span>
          </div>
          <div className="space-y-2 max-h-64 overflow-auto">
            {moveis.map((m) => (
              <div key={m.id} className="flex items-start gap-2 text-[12px]">
                <div className="size-3 rounded-sm shrink-0 mt-0.5" style={{ background: m.cor_hex || "#ccc" }} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{m.nome}</div>
                  <div className="text-muted-foreground">{m.largura_cm}×{m.profundidade_cm}×{m.altura_cm}cm · {m.chapas_mdf} chapas</div>
                </div>
                <div className="shrink-0 tabular-nums text-muted-foreground">{BRL(m.preco_estimado)}</div>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      {/* Lista de corte */}
      <Surface>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Scissors className="size-4 text-accent" />
            <span className="text-[14px] font-semibold">Lista de corte</span>
            {wizard.listaCorte && (
              <span className="text-[11.5px] text-muted-foreground">
                {wizard.listaCorte.resumo.total_pecas} peças · {wizard.listaCorte.resumo.chapas_estimadas} chapas · {wizard.listaCorte.resumo.metros_fita}m fita
              </span>
            )}
          </div>
          {!wizard.listaCorte && (
            <button
              onClick={gerarListaCorte}
              disabled={wizard.listaCorteLoading}
              className="h-8 px-3 rounded-md border border-border text-[12.5px] font-medium hover:bg-secondary disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {wizard.listaCorteLoading
                ? <><Loader2 className="size-3.5 animate-spin" /> Gerando…</>
                : <><Scissors className="size-3.5" /> Gerar lista</>}
            </button>
          )}
        </div>

        {wizard.listaCorteLoading && (
          <div className="flex items-center gap-2 py-6 justify-center text-[13px] text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Calculando peças com GPT-4o mini…
          </div>
        )}

        {wizard.listaCorte && (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] min-w-[680px]">
              <thead className="text-[10.5px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left font-medium px-2 py-1.5">Móvel</th>
                  <th className="text-left font-medium px-2 py-1.5">Peça</th>
                  <th className="text-left font-medium px-2 py-1.5">Material</th>
                  <th className="text-right font-medium px-2 py-1.5">L (mm)</th>
                  <th className="text-right font-medium px-2 py-1.5">C (mm)</th>
                  <th className="text-center font-medium px-2 py-1.5">Qtd</th>
                  <th className="text-center font-medium px-2 py-1.5">Fita</th>
                </tr>
              </thead>
              <tbody>
                {wizard.listaCorte.pecas.map((p, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-secondary/30">
                    <td className="px-2 py-1.5 text-muted-foreground truncate max-w-[120px]">{p.movel}</td>
                    <td className="px-2 py-1.5 font-medium">{p.peca}</td>
                    <td className="px-2 py-1.5 text-muted-foreground">{p.material}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{p.largura_mm}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{p.comprimento_mm}</td>
                    <td className="px-2 py-1.5 text-center tabular-nums">{p.quantidade}</td>
                    <td className="px-2 py-1.5 text-center text-[10px] font-mono text-muted-foreground">
                      {[p.fita_l && "E", p.fita_r && "D", p.fita_t && "T", p.fita_b && "B"].filter(Boolean).join("·") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!wizard.listaCorte && !wizard.listaCorteLoading && (
          <div className="py-6 text-center text-[12.5px] text-muted-foreground">
            Clique em "Gerar lista" para calcular peças, chapas e fita de borda automaticamente.
          </div>
        )}

        {wizard.listaCorte && (
          <div className="flex items-center justify-between pt-2 border-t border-border gap-2">
            <button
              onClick={() => {
                const rows = [
                  ["Móvel", "Peça", "Material", "Largura(mm)", "Comprimento(mm)", "Qtd", "Fita"],
                  ...wizard.listaCorte!.pecas.map((p) => [
                    p.movel, p.peca, p.material, p.largura_mm, p.comprimento_mm, p.quantidade,
                    [p.fita_l && "E", p.fita_r && "D", p.fita_t && "T", p.fita_b && "B"].filter(Boolean).join("|") || "",
                  ]),
                ];
                const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
                const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "lista-corte-planne.csv"; a.click();
                URL.revokeObjectURL(url);
              }}
              className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary inline-flex items-center gap-1.5"
            >
              <Download className="size-3.5" /> Exportar CSV
            </button>
            <button
              onClick={criarOrdem}
              disabled={wizard.criandoOrdem}
              className="h-8 px-3 rounded-md bg-emerald-600 text-white text-[12.5px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {wizard.criandoOrdem
                ? <><Loader2 className="size-3.5 animate-spin" /> Criando…</>
                : <><Factory className="size-3.5" /> Criar ordem de produção</>}
            </button>
          </div>
        )}
      </Surface>

      {/* Vistas de elevação */}
      <WallElevationSection wizard={wizard} />

      {/* Resumo de materiais */}
      <MateriaisResumo moveis={wizard.moveis} custoChapa={85} />

      {/* Preview rápido (Schnell) */}
      {wizard.previewUrl && (
        <Surface padded={false}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-violet-500" />
              <span className="text-[14px] font-semibold">Preview rápido — Flux Schnell</span>
              <span className="text-[11.5px] text-muted-foreground">Qualidade de visualização — use Render Premium para o cliente</span>
            </div>
            <button onClick={() => update({ previewUrl: null })} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <img src={wizard.previewUrl} alt="Preview" className="w-full object-cover max-h-[400px]" />
        </Surface>
      )}

      {/* Texto comercial */}
      <Surface>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="size-4 text-accent" />
          <span className="text-[14px] font-semibold">Descrição comercial gerada pela IA</span>
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-line">{descricao_comercial}</p>

        {observacoes_tecnicas?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-[11.5px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Observações técnicas</div>
            <ul className="space-y-1">
              {observacoes_tecnicas.map((o, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[12.5px] text-muted-foreground">
                  <ChevronRight className="size-3.5 shrink-0 mt-0.5 text-muted-foreground/50" /> {o}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Surface>

      {/* Motor Paramétrico — disponível para cozinha */}
      {wizard.form.ambiente === "Cozinha" && (
        <Surface className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="size-4 text-emerald-500" />
              <span className="text-[14px] font-semibold">Motor Paramétrico</span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium">
                100% determinístico · sem IA · &lt;100ms
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMotorAberto(v => !v)}
              className="text-[12px] text-muted-foreground hover:text-foreground"
            >
              {motorAberto ? "Fechar" : "Configurar"}
            </button>
          </div>

          <p className="text-[12.5px] text-muted-foreground">
            Gere a cozinha linear automaticamente com módulos padrão de mercado.
            O resultado substitui os móveis sugeridos pela IA.
          </p>

          {motorAberto && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11.5px] text-muted-foreground mb-1.5">Parede principal</div>
                  <div className="grid grid-cols-2 gap-1">
                    {(["top", "bottom", "left", "right"] as const).map(p => (
                      <button key={p} type="button" onClick={() => setMotorParede(p)}
                        className={`h-8 text-[12px] rounded-md border transition-colors ${motorParede === p ? "bg-foreground text-background border-foreground" : "border-border hover:bg-secondary"}`}>
                        {p === "top" ? "↑ Fundo" : p === "bottom" ? "↓ Entrada" : p === "left" ? "← Esq." : "→ Dir."}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11.5px] text-muted-foreground mb-1.5">Qualidade das ferragens</div>
                  <div className="space-y-1">
                    {([["nacional", "Nacional", "Padrão"], ["blum", "Blum", "+50% custo"], ["hafele", "Häfele", "+100% custo"]] as const).map(([v, l, sub]) => (
                      <button key={v} type="button" onClick={() => setMotorFerragem(v)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border text-[12px] transition-all ${motorFerragem === v ? "border-accent bg-accent/10" : "border-border hover:border-border-strong"}`}>
                        <span className="font-medium">{l}</span>
                        <span className="text-muted-foreground text-[11px]">{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={motorLoading}
                onClick={async () => {
                  setMotorLoading(true);
                  try {
                    const res = await fetch("/api/motor?action=gerar", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "gerar",
                        medidas: {
                          largura_cm: parseFloat(wizard.form.largura) * 100 || 400,
                          profundidade_cm: parseFloat(wizard.form.profundidade) * 100 || 300,
                          altura_cm: parseFloat(wizard.form.altura) * 100 || 270,
                          porta_parede: wizard.form.porta_parede,
                          janelas_paredes: wizard.form.janelas,
                        },
                        preferencias: {
                          parede_principal: motorParede,
                          cor_mdf_hex: wizard.form.cor_mdf,
                          ferragem: motorFerragem,
                          tipo_porta_base: "dobradica",
                          tipo_porta_aereo: "dobradica",
                          versao_comercial: "intermediaria",
                        },
                      }),
                    });
                    if (!res.ok) throw new Error((await res.json() as { error: string }).error);
                    const data = await res.json() as { projeto: { modulos: Movel[] }; resultado: { avisos: string[]; aproveitamento_pct: number; num_modulos_base: number; num_modulos_aereo: number } };
                    update({ moveis: data.projeto.modulos as unknown as Movel[] });
                    setMotorAberto(false);
                    const r = data.resultado;
                    toast.success(`Motor gerou ${r.num_modulos_base} bases + ${r.num_modulos_aereo} aéreos · ${r.aproveitamento_pct}% aproveitamento`);
                    if (r.avisos?.length) r.avisos.forEach(a => toast.info(a));
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Erro no motor paramétrico");
                  } finally {
                    setMotorLoading(false);
                  }
                }}
                className="w-full h-10 rounded-md bg-emerald-600 text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-opacity"
              >
                {motorLoading
                  ? <><Loader2 className="size-4 animate-spin" /> Gerando layout…</>
                  : <><Settings2 className="size-4" /> Gerar cozinha linear automaticamente</>}
              </button>
            </div>
          )}
        </Surface>
      )}

      {/* Actions */}
      <Surface className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[14px] font-semibold">Próximas ações</div>
            <div className="text-[12px] text-muted-foreground mt-0.5">
              Crie o orçamento formal ou gere o render cinematográfico
            </div>
          </div>
        </div>

        {/* Client picker */}
        {clientes.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-[11.5px] text-muted-foreground shrink-0">Cliente do orçamento:</label>
            <select
              value={wizard.clienteId ?? ""}
              onChange={(e) => {
                const found = clientes.find((c) => c.id === e.target.value);
                update({ clienteId: e.target.value || null, clienteNome: found?.nome ?? null });
              }}
              className="flex-1 h-8 rounded-md border border-border bg-surface-2 px-2.5 text-[12.5px] outline-none"
            >
              <option value="">Sem cliente (rascunho)</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => criarOrcamento(wizard.clienteId ?? undefined)}
            className="h-10 px-4 rounded-md border border-border text-[13px] font-medium hover:bg-secondary inline-flex items-center gap-2"
          >
            <FileText className="size-4" /> {wizard.clienteNome ? `Criar orçamento — ${wizard.clienteNome}` : "Criar orçamento"}
          </button>

          <button
            onClick={() => gerarRender("schnell")}
            disabled={wizard.renderLoading}
            className="h-10 px-4 rounded-md border border-violet-400 text-violet-700 dark:text-violet-300 text-[13px] font-medium hover:bg-violet-50 dark:hover:bg-violet-950/30 disabled:opacity-60 inline-flex items-center gap-2"
            title="Preview rápido — gerado em ~10s, sem consumir crédito premium"
          >
            {wizard.renderLoading && wizard.renderMode === "schnell"
              ? <><Loader2 className="size-4 animate-spin" /> Gerando preview…</>
              : <><Zap className="size-4" /> Preview rápido</>}
          </button>

          <button
            onClick={() => gerarRender("pro")}
            disabled={wizard.renderLoading}
            className="h-10 px-5 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2 shadow-lg shadow-violet-500/20"
            title="Render premium — alta qualidade 1792×1024px, consome 1 crédito"
          >
            {wizard.renderLoading && wizard.renderMode === "pro"
              ? <><Loader2 className="size-4 animate-spin" /> Renderizando…</>
              : <><Sparkles className="size-4" /> Render Premium</>}
          </button>
        </div>
      </Surface>
    </div>
  );
}

// ─── Step 5: Render ───────────────────────────────────────────────────────────

function Step5Render({ wizard, update, criarOrcamento }: {
  wizard: WizardState;
  update: (p: Partial<WizardState>) => void;
  criarOrcamento: () => void;
}) {
  return (
    <div className="space-y-5">
      <Surface padded={false}>
        <div className="px-5 py-3 border-b border-border">
          <div className="text-[14px] font-semibold">Render Premium</div>
          <div className="text-[12px] text-muted-foreground mt-0.5">
            {wizard.form.ambiente} · {wizard.form.estilo}
          </div>
        </div>
        {wizard.renderUrl ? (
          <div>
            <img
              src={wizard.renderUrl}
              alt="Render do projeto"
              className="w-full object-cover max-h-[520px]"
            />
            <div className="p-4 flex items-center gap-3">
              <a
                href={wizard.renderUrl}
                download="render-planne.jpg"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5"
              >
                <ImageIcon className="size-3.5" /> Baixar render
              </a>
              <button
                onClick={() => update({ step: 4 })}
                className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-secondary inline-flex items-center gap-1.5"
              >
                <ChevronLeft className="size-3.5" /> Voltar ao layout
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="size-8 animate-spin text-accent" />
            <div className="text-[14px] font-medium">Gerando render cinematográfico…</div>
            <div className="text-[13px] text-muted-foreground">Pode levar até 60 segundos</div>
          </div>
        )}
      </Surface>

      {wizard.renderUrl && wizard.analise && (
        <div className="grid md:grid-cols-2 gap-4">
          <Surface padded={false} className="p-4">
            <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground mb-2">Total do projeto</div>
            <div className="text-[28px] font-bold text-accent tabular-nums">
              {BRL(wizard.analise.orcamento.total)}
            </div>
            <div className="text-[12px] text-muted-foreground mt-1">
              Margem: {wizard.analise.orcamento.margem_pct}% · {wizard.moveis.length} móveis
            </div>
          </Surface>
          <Surface padded={false} className="p-4">
            <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground mb-3">Próximos passos</div>
            <div className="space-y-2">
              {["Apresentar proposta ao cliente", "Gerar PDF com render + orçamento"].map((s) => (
                <div key={s} className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                  <ChevronRight className="size-3.5 shrink-0" /> {s}
                </div>
              ))}
              <button
                onClick={criarOrcamento}
                className="mt-2 w-full h-9 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center justify-center gap-1.5"
              >
                <FileText className="size-3.5" /> Criar orçamento formal
              </button>
              <button
                onClick={() => update({ step: 4 })}
                className="w-full h-8 rounded-md border border-border text-[12.5px] hover:bg-secondary inline-flex items-center justify-center gap-1.5"
              >
                <ChevronLeft className="size-3.5" /> Voltar ao layout
              </button>
            </div>
          </Surface>
        </div>
      )}
    </div>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function LandingPage({ onStart, savedProjects, loading }: {
  onStart: () => void;
  savedProjects: SavedProject[];
  loading: boolean;
}) {
  return (
    <>
      <PageHeader
        eyebrow="IA Premium"
        title="IA Projetos"
        description="Interprete plantas, gere layouts 2D e orçamentos automaticamente com OpenAI Vision."
      />
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {[
          { icon: Building2, title: "Planta → Projeto", desc: "Envie a planta baixa e a IA entende medidas, circulação e espaço" },
          { icon: LayoutGrid, title: "Layout 2D automático", desc: "Móveis posicionados automaticamente no canvas. Ajuste com drag & drop" },
          { icon: Zap, title: "Render cinematográfico", desc: "Gere imagens fotorrealistas com Flux Pro ou DALL-E 3 sob aprovação" },
        ].map((c) => (
          <Surface key={c.title} className="flex flex-col gap-2">
            <div className="size-9 rounded-md bg-accent/10 grid place-items-center">
              <c.icon className="size-4.5 text-accent" />
            </div>
            <div className="text-[14px] font-semibold">{c.title}</div>
            <div className="text-[12.5px] text-muted-foreground leading-relaxed">{c.desc}</div>
          </Surface>
        ))}
      </div>

      <Surface className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[15px] font-semibold">Criar novo projeto com IA</div>
          <div className="text-[12.5px] text-muted-foreground mt-0.5">
            Upload da planta + referências → análise GPT-4o Vision → layout + orçamento + render
          </div>
        </div>
        <button
          onClick={onStart}
          className="h-10 px-5 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[13px] font-semibold hover:opacity-90 inline-flex items-center gap-2 shadow-lg shadow-violet-500/20"
        >
          <Sparkles className="size-4" /> Criar projeto IA
        </button>
      </Surface>

      {/* Saved projects */}
      {!loading && savedProjects.length > 0 && (
        <Surface>
          <div className="text-[13px] font-semibold mb-4">Projetos salvos</div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {savedProjects.map((p) => (
              <div key={p.id} className="rounded-lg border border-border overflow-hidden hover:border-border-strong transition-colors">
                <div className="h-28 bg-surface-2 grid place-items-center overflow-hidden">
                  {p.render_url
                    ? <img src={p.render_url} alt={p.nome} className="size-full object-cover" />
                    : <Sparkles className="size-6 text-muted-foreground/40" />}
                </div>
                <div className="p-2.5">
                  <div className="text-[12.5px] font-medium truncate">{p.nome}</div>
                  <div className="text-[11.5px] text-muted-foreground">{p.ambiente} · {p.estilo}</div>
                  <div className="text-[10.5px] text-muted-foreground/60 mt-0.5">
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      )}
    </>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11.5px] text-muted-foreground mb-1">{children}</div>;
}

// Tailwind shorthand (must be in component)
declare module "react" {
  interface HTMLAttributes<T> {
    class?: string;
  }
}
