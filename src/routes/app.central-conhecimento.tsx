import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import { Search, BookOpen, ChevronDown, ChevronUp, ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import type { AtomoConhecimento } from "@/lib/base-conhecimento";

// Import dinâmico: a base (~470KB de JSON) só carrega quando esta página é
// visitada, em vez de inflar o bundle principal do app.
type BaseConhecimentoModule = typeof import("@/lib/base-conhecimento");

export const Route = createFileRoute("/app/central-conhecimento")({
  component: CentralConhecimento,
});

const TIPO_LABEL: Record<AtomoConhecimento["tipo"], string> = {
  regra_obrigatoria: "Regra obrigatória",
  recomendacao: "Recomendação",
  boa_pratica: "Boa prática",
  alerta: "Alerta",
  restricao: "Restrição",
};

const TIPO_COR: Record<AtomoConhecimento["tipo"], string> = {
  regra_obrigatoria: "text-destructive border-destructive/30 bg-destructive/5",
  alerta: "text-amber-600 border-amber-500/30 bg-amber-500/5 dark:text-amber-400",
  restricao: "text-amber-600 border-amber-500/30 bg-amber-500/5 dark:text-amber-400",
  recomendacao: "text-accent border-accent/30 bg-accent/5",
  boa_pratica: "text-emerald-600 border-emerald-500/30 bg-emerald-500/5 dark:text-emerald-400",
};

function AtomoCard({ atomo }: { atomo: AtomoConhecimento }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="border border-border rounded-md p-3.5 hover:border-border-strong transition-colors">
      <button type="button" onClick={() => setAberto((v) => !v)} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <Pill>{atomo.categoria}</Pill>
              <span className={`text-[10.5px] px-1.5 py-0.5 rounded border ${TIPO_COR[atomo.tipo]}`}>
                {TIPO_LABEL[atomo.tipo]}
              </span>
              {atomo.fabricante && (
                <span className="text-[10.5px] text-muted-foreground">· {atomo.fabricante}</span>
              )}
            </div>
            <div className="text-[13.5px] font-medium">{atomo.titulo}</div>
            {!aberto && (
              <div className="text-[12.5px] text-muted-foreground mt-0.5 line-clamp-2">
                {atomo.descricao.replace(/\s*\[cf\.[^\]]*\]/g, "").trim()}
              </div>
            )}
          </div>
          {aberto ? (
            <ChevronUp className="size-3.5 text-muted-foreground shrink-0 mt-1" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground shrink-0 mt-1" />
          )}
        </div>
      </button>
      {aberto && (
        <div className="mt-2.5 pt-2.5 border-t border-border space-y-2 text-[12.5px]">
          <p className="text-foreground/90">{atomo.descricao.replace(/\s*\[cf\.[^\]]*\]/g, "").trim()}</p>
          {atomo.condicoes.quando_aplicar && (
            <p><span className="font-medium">Quando aplicar: </span>
              <span className="text-muted-foreground">{atomo.condicoes.quando_aplicar}</span>
            </p>
          )}
          {atomo.restricoes.quando_nao_aplicar && (
            <p className="flex gap-1.5">
              <AlertTriangle className="size-3.5 shrink-0 mt-0.5 text-amber-500" />
              <span>
                <span className="font-medium">Quando NÃO aplicar: </span>
                <span className="text-muted-foreground">{atomo.restricoes.quando_nao_aplicar}</span>
              </span>
            </p>
          )}
          {atomo.motivo_tecnico && (
            <p><span className="font-medium">Motivo técnico: </span>
              <span className="text-muted-foreground">{atomo.motivo_tecnico}</span>
            </p>
          )}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {atomo.tags.map((t) => (
              <span key={t} className="text-[10.5px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <ShieldCheck className="size-3" />
            Confiança {atomo.confianca.score}/100 · {atomo.fonte}
          </div>
        </div>
      )}
    </div>
  );
}

function CentralConhecimento() {
  const [mod, setMod] = useState<BaseConhecimentoModule | null>(null);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");

  useEffect(() => {
    import("@/lib/base-conhecimento").then(setMod);
  }, []);

  const cats = useMemo(() => (mod ? mod.categorias() : []), [mod]);

  const resultados = useMemo(() => {
    if (!mod || (!busca.trim() && !categoria)) return [];
    return mod.buscarAtomos({ texto: busca.trim() || undefined, categoria: categoria || undefined });
  }, [mod, busca, categoria]);

  return (
    <>
      <PageHeader
        eyebrow="Inteligência"
        title="Central de Conhecimento"
        description={
          mod
            ? `Base técnica de marcenaria (${mod.TOTAL_ATOMOS} itens rastreáveis por fonte) — pesquise por dúvida técnica, ferragem, material ou processo.`
            : "Base técnica de marcenaria — pesquise por dúvida técnica, ferragem, material ou processo."
        }
      />

      <Surface padded={false}>
        <div className="border-b border-border p-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder='Ex.: "qual broca usar no minifix", dobradiça, empenamento...'
              className="w-full h-8 pl-8 pr-3 rounded-md border border-border bg-surface-2 text-[13px] outline-none focus:border-border-strong"
            />
          </div>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="h-8 px-2.5 rounded-md border border-border bg-surface-2 text-[12.5px] outline-none focus:border-border-strong"
          >
            <option value="">Todas as categorias</option>
            {cats.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {(busca || categoria) && (
            <div className="ml-auto text-[12px] text-muted-foreground">
              {resultados.length} resultado{resultados.length === 1 ? "" : "s"}
            </div>
          )}
        </div>

        <div className="p-3.5 space-y-2">
          {!mod ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-16">
              <Loader2 className="size-4 animate-spin" /> Carregando base de conhecimento...
            </div>
          ) : !busca.trim() && !categoria ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground py-16">
              <BookOpen className="size-8 opacity-30" />
              <span className="text-[13px] text-center max-w-sm">
                Digite uma pergunta ou termo técnico (ex.: "espessura de fundo", "empenamento",
                "corrediça telescópica") ou escolha uma categoria para começar.
              </span>
            </div>
          ) : resultados.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground py-16">
              <BookOpen className="size-8 opacity-30" />
              <span className="text-[13px]">Nenhum resultado para essa busca.</span>
            </div>
          ) : (
            resultados.slice(0, 60).map((a) => <AtomoCard key={a.id} atomo={a} />)
          )}
        </div>
      </Surface>
    </>
  );
}
