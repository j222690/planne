import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, FileCheck2, Boxes, LineChart, Shield, Workflow, Hammer } from "lucide-react";
import { Logo } from "@/components/planne/Logo";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="h-14 border-b border-border sticky top-0 z-20 bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-7xl h-full px-6 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-7 text-[13px] text-muted-foreground">
            <a href="#produto" className="hover:text-foreground transition-colors">Produto</a>
            <a href="#modulos" className="hover:text-foreground transition-colors">Módulos</a>
            <a href="#ia" className="hover:text-foreground transition-colors">Inteligência</a>
            <a href="#seguranca" className="hover:text-foreground transition-colors">Segurança</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-[13px] text-muted-foreground hover:text-foreground px-3 py-1.5">Entrar</Link>
            <Link to="/app" className="text-[13px] font-medium bg-foreground text-background rounded-md px-3 py-1.5 inline-flex items-center gap-1.5 hover:opacity-90 transition">
              Acessar Planne <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 grid-bg opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
        <div className="mx-auto max-w-7xl px-6 pt-20 pb-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-1.5 text-[11.5px] uppercase tracking-[0.1em] text-muted-foreground border border-border rounded-sm px-2 py-1">
              <span className="size-1.5 rounded-full bg-accent" /> Plataforma operacional para marcenarias
            </div>
            <h1 className="mt-5 text-[44px] md:text-[60px] leading-[1.02] font-semibold tracking-[-0.03em] text-balance">
              O sistema operacional dos móveis planejados.
            </h1>
            <p className="mt-5 text-[16px] md:text-[17px] text-muted-foreground max-w-2xl leading-relaxed">
              Planne unifica orçamento, projeto, materiais, produção e CRM com inteligência artificial nativa.
              Construído para marcenarias premium que tratam software como infraestrutura — não como acessório.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/app" className="inline-flex items-center gap-1.5 bg-foreground text-background rounded-md px-4 py-2.5 text-[13.5px] font-medium hover:opacity-90 transition">
                Abrir o sistema <ArrowRight className="size-3.5" />
              </Link>
              <a href="#produto" className="inline-flex items-center gap-1.5 border border-border rounded-md px-4 py-2.5 text-[13.5px] font-medium hover:bg-secondary transition">
                Ver demonstração
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-[12px] text-muted-foreground">
              <div className="flex items-center gap-1.5"><Shield className="size-3.5" /> Multiempresa com RLS</div>
              <div className="flex items-center gap-1.5"><Sparkles className="size-3.5" /> IA Grok / OpenAI integrada</div>
              <div className="flex items-center gap-1.5"><FileCheck2 className="size-3.5" /> Assinatura digital nativa</div>
            </div>
          </motion.div>

          {/* Mock UI */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
            className="mt-14 rounded-lg border border-border bg-surface overflow-hidden hairline"
          >
            <div className="h-9 border-b border-border bg-surface-2 flex items-center gap-1.5 px-3">
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <div className="ml-3 text-[11.5px] text-muted-foreground">planne.app / dashboard</div>
            </div>
            <div className="grid grid-cols-12 min-h-[360px]">
              <div className="col-span-3 border-r border-border p-4 hidden md:block">
                <div className="h-3 w-20 rounded bg-muted mb-4" />
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5">
                    <div className="size-3 rounded-sm bg-muted" />
                    <div className={`h-2 ${i % 3 === 0 ? "w-24" : "w-16"} rounded bg-muted`} />
                  </div>
                ))}
              </div>
              <div className="col-span-12 md:col-span-9 p-5">
                <div className="grid grid-cols-3 gap-3">
                  {["Faturamento", "Margem média", "Projetos ativos"].map((l, i) => (
                    <div key={l} className="rounded-md border border-border p-3">
                      <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{l}</div>
                      <div className="mt-2 text-[18px] font-semibold num">
                        {["R$ 482.310", "37,4%", "24"][i]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-md border border-border p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-[12px] font-medium">Funil comercial</div>
                    <div className="text-[11px] text-muted-foreground">Últimos 30 dias</div>
                  </div>
                  <div className="space-y-2">
                    {[["Lead", 92], ["Qualificado", 71], ["Proposta", 48], ["Aprovado", 31]].map(([k, v]) => (
                      <div key={k as string} className="flex items-center gap-3 text-[12px]">
                        <div className="w-20 text-muted-foreground">{k}</div>
                        <div className="flex-1 h-2 rounded-sm bg-secondary overflow-hidden">
                          <div className="h-full bg-accent/80" style={{ width: `${v}%` }} />
                        </div>
                        <div className="w-8 text-right num">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modules */}
      <section id="modulos" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground mb-3">Módulos</div>
            <h2 className="text-[32px] font-semibold tracking-tight">Uma plataforma. Todo o ciclo.</h2>
            <p className="mt-3 text-muted-foreground">
              Do primeiro contato comercial à entrega na obra — todos os módulos compartilham o mesmo
              modelo de dados, o mesmo catálogo e a mesma inteligência.
            </p>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-px bg-border rounded-md overflow-hidden border border-border">
            {[
              { i: Workflow, t: "Comercial & CRM", d: "Pipeline, propostas, histórico de cliente, WhatsApp e assinatura digital." },
              { i: FileCheck2, t: "Orçamento inteligente", d: "Cálculo automático de chapas, ferragens, desperdício e margem ideal." },
              { i: Boxes, t: "Central de materiais", d: "Catálogo unificado com importação por planilha, PDF, OCR e API." },
              { i: Sparkles, t: "Assistente IA", d: "Gera pré-projetos, listas de materiais e descrições comerciais." },
              { i: Hammer, t: "Produção", d: "Lista de corte, separação, checklist e acompanhamento de montagem." },
              { i: LineChart, t: "Financeiro", d: "Faturamento, margem real, fluxo de caixa por projeto." },
            ].map(({ i: Icon, t, d }) => (
              <div key={t} className="bg-background p-6">
                <Icon className="size-4 text-accent mb-4" />
                <div className="font-medium tracking-tight">{t}</div>
                <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IA */}
      <section id="ia" className="border-b border-border bg-surface-2/40">
        <div className="mx-auto max-w-7xl px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground mb-3">Inteligência</div>
            <h2 className="text-[32px] font-semibold tracking-tight">Pré-projetos em segundos. Não em dias.</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Descreva o ambiente em linguagem natural. A IA do Planne interpreta medidas, sugere
              estrutura, calcula chapas e ferragens, estima desperdício e propõe a margem ideal —
              tudo ancorado no seu catálogo real de fornecedores.
            </p>
            <ul className="mt-6 space-y-3 text-[13.5px]">
              {[
                "Padroniza nomes técnicos entre fornecedores diferentes",
                "Detecta inconsistências de orçamento antes do envio",
                "Gera descrição comercial e proposta em PDF assinável",
              ].map((s) => (
                <li key={s} className="flex gap-2">
                  <span className="mt-2 size-1 rounded-full bg-accent" />
                  <span className="text-foreground/85">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5 font-mono text-[12.5px] leading-relaxed">
            <div className="text-muted-foreground">você</div>
            <div className="mt-1">Guarda-roupa casal 2,40m, 6 portas, MDF amadeirado.</div>
            <div className="mt-4 text-muted-foreground">planne</div>
            <div className="mt-1 text-foreground/85">
              Estrutura: 3 módulos (80cm), 2 chapas MDF 18mm Itapuã (1,4m²),
              corrediças telescópicas Hettich · 12un, dobradiças caneco · 12un.
              Custo estimado <span className="text-accent">R$ 3.482</span> · margem
              recomendada <span className="text-accent">42%</span>.
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-[12.5px] text-muted-foreground">
        <div className="flex items-center gap-2"><Logo size={18} /> <span className="text-muted-foreground/70">© {new Date().getFullYear()}</span></div>
        <div>Chapecó · Santa Catarina</div>
      </footer>
    </div>
  );
}
