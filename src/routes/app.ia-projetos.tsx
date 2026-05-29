import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/planne/primitives";
import {
  Sparkles, Upload, X, ChevronRight, ChevronLeft, Loader2,
  ImageIcon, Wand2, Building2, LayoutGrid, FileText,
  CheckCircle2, Zap, AlertCircle, DollarSign, Package, Scissors,
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

interface WizardState {
  step: 1 | 2 | 3 | 4 | 5;
  projetoId: string | null;
  form: {
    nome: string;
    ambiente: string;
    estilo: string;
    largura: string;
    profundidade: string;
    altura: string;
    descricao: string;
    cor_mdf: string;
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
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProjects() {
      const empresa = await getEmpresaAtual();
      if (!empresa) return;
      const { data } = await supabase
        .from("room_projects")
        .select("id,nome,ambiente,estilo,created_at,render_url")
        .eq("empresa_id", (empresa as { id: string }).id)
        .order("created_at", { ascending: false })
        .limit(6);
      setSavedProjects(data ?? []);
      setLoadingProjects(false);
    }
    loadProjects();
  }, []);

  const initWizard = () =>
    setWizard({
      step: 1,
      projetoId: null,
      form: { nome: "", ambiente: "Sala de estar", estilo: "Moderno Minimalista", largura: "4", profundidade: "3", altura: "2.7", descricao: "", cor_mdf: "#f5f3f0" },
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
          planta_b64,
          referencias_b64: referencias_b64.length ? referencias_b64 : undefined,
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

      update({ analisando: false, analise, moveis: analise.moveis ?? [], step: 4, projetoId });
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

      if (!res.ok) throw new Error("Erro ao iniciar render");

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
            const r = await fetch(`/api/render-status?job_id=${data.job_id}`);
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

  const criarOrcamentoFormal = useCallback(async () => {
    if (!wizard?.analise) return;
    try {
      const empresa = await getEmpresaAtual();
      if (!empresa) throw new Error("Empresa não encontrada");
      const eid = (empresa as { id: string }).id;
      const clientes = await getClientes(eid);
      const clienteId = clientes[0]?.id ?? null;

      const orc = await upsertOrcamento(eid, {
        status: "rascunho",
        margem_pct: wizard.analise.orcamento.margem_pct,
        subtotal: wizard.analise.orcamento.subtotal,
        total: wizard.analise.orcamento.total,
        observacoes: wizard.analise.descricao_comercial,
        cliente_id: clienteId,
      });

      const itensData = (wizard.analise.moveis ?? []).map((m) => ({
        orcamento_id: orc.id,
        descricao: m.nome,
        quantidade: 1,
        unidade: "un",
        preco_custo: Math.round(m.preco_estimado * (1 - wizard.analise!.orcamento.margem_pct / 100)),
        preco_unitario: m.preco_estimado,
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
          {wizard.step === 1 && <Step1Form wizard={wizard} update={update} />}
          {wizard.step === 2 && <Step2Upload wizard={wizard} update={update} />}
          {wizard.step === 3 && <Step3Analyzing wizard={wizard} analisar={analisar} />}
          {wizard.step === 4 && <Step4Layout wizard={wizard} update={update} gerarRender={gerarRender} criarOrcamento={criarOrcamentoFormal} gerarListaCorte={gerarListaCorte} />}
          {wizard.step === 5 && <Step5Render wizard={wizard} update={update} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Step 1: Ambiente & Medidas ───────────────────────────────────────────────

function Step1Form({ wizard, update }: { wizard: WizardState; update: (p: Partial<WizardState>) => void }) {
  const f = wizard.form;
  const set = (k: keyof typeof f, v: string) => update({ form: { ...f, [k]: v } });
  const valid = f.nome.trim().length > 0;

  return (
    <Surface className="space-y-5 max-w-2xl">
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
          <Label>Medidas do ambiente</Label>
          <div className="grid grid-cols-3 gap-3">
            {[["largura", "Largura (m)"], ["profundidade", "Profundidade (m)"], ["altura", "Pé-direito (m)"]].map(([k, lbl]) => (
              <div key={k}>
                <div className="text-[11px] text-muted-foreground mb-1">{lbl}</div>
                <input
                  type="number"
                  step="0.1"
                  value={f[k as keyof typeof f]}
                  onChange={(e) => set(k as keyof typeof f, e.target.value)}
                  className="input text-center"
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

// ─── Step 2: Upload ───────────────────────────────────────────────────────────

function Step2Upload({ wizard, update }: { wizard: WizardState; update: (p: Partial<WizardState>) => void }) {
  return (
    <Surface className="space-y-5 max-w-2xl">
      <div className="grid gap-4">
        <div>
          <Label>Planta baixa <span className="text-muted-foreground font-normal">(opcional, mas melhora muito o resultado)</span></Label>
          <DropZone
            label="Envie a planta baixa do ambiente"
            accept="image/*"
            onFile={(f) => update({ planta: f as File })}
            files={wizard.planta ? [wizard.planta] : undefined}
          />
          {wizard.planta && (
            <div className="flex items-center gap-2 mt-1.5 text-[12px] text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              {wizard.planta.name}
              <button onClick={() => update({ planta: null })} className="ml-auto hover:text-destructive">
                <X className="size-3" />
              </button>
            </div>
          )}
        </div>

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

function Step4Layout({ wizard, update, gerarRender, criarOrcamento, gerarListaCorte }: {
  wizard: WizardState;
  update: (p: Partial<WizardState>) => void;
  gerarRender: (mode?: "schnell" | "pro") => void;
  criarOrcamento: () => void;
  gerarListaCorte: () => void;
}) {
  const { analise, moveis } = wizard;
  if (!analise) return null;
  const { orcamento, descricao_comercial, observacoes_tecnicas } = analise;

  const linhasOrc = [
    { label: "MDF (chapas + desperdício)", value: orcamento.mdf_custo },
    { label: "Ferragens", value: orcamento.ferragens_custo },
    { label: "Puxadores e acabamentos", value: orcamento.puxadores_custo },
    { label: "Fita de borda", value: orcamento.fita_borda_custo },
    { label: "Mão de obra", value: orcamento.mao_de_obra },
  ];

  return (
    <div className="space-y-5">
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
          <span>{wizard.renderMode === "schnell" ? "Gerando preview rápido (Flux Schnell)…" : "Gerando render premium (Flux Pro)… pode levar até 60s"}</span>
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
        <div className="p-2">
          <RoomCanvas
            moveis={moveis}
            medidas={{
              largura: parseFloat(wizard.form.largura) || 4,
              profundidade: parseFloat(wizard.form.profundidade) || 3,
            }}
            onChange={(updated) => update({ moveis: updated as Movel[] })}
            onExport={() => {}}
          />
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
      </Surface>

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

      {/* Actions */}
      <Surface className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[14px] font-semibold">Próximas ações</div>
          <div className="text-[12px] text-muted-foreground mt-0.5">
            Crie o orçamento formal ou gere o render cinematográfico
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={criarOrcamento}
            className="h-10 px-4 rounded-md border border-border text-[13px] font-medium hover:bg-secondary inline-flex items-center gap-2"
          >
            <FileText className="size-4" /> Criar orçamento
          </button>

          <button
            onClick={() => gerarRender("schnell")}
            disabled={wizard.renderLoading}
            className="h-10 px-4 rounded-md border border-violet-400 text-violet-700 dark:text-violet-300 text-[13px] font-medium hover:bg-violet-50 dark:hover:bg-violet-950/30 disabled:opacity-60 inline-flex items-center gap-2"
            title="Flux Schnell — preview rápido ~10s, sem consumir crédito premium"
          >
            {wizard.renderLoading && wizard.renderMode === "schnell"
              ? <><Loader2 className="size-4 animate-spin" /> Gerando preview…</>
              : <><Zap className="size-4" /> Preview rápido</>}
          </button>

          <button
            onClick={() => gerarRender("pro")}
            disabled={wizard.renderLoading}
            className="h-10 px-5 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2 shadow-lg shadow-violet-500/20"
            title="Flux Pro 1.1 — render premium 1440×960px, consome 1 crédito"
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

function Step5Render({ wizard, update }: {
  wizard: WizardState;
  update: (p: Partial<WizardState>) => void;
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
            <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground mb-2">Próximos passos</div>
            <div className="space-y-1.5">
              {["Apresentar proposta ao cliente", "Gerar PDF com render + orçamento", "Criar orçamento formal no sistema"].map((s) => (
                <div key={s} className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                  <ChevronRight className="size-3.5 shrink-0" /> {s}
                </div>
              ))}
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
