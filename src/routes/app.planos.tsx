import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/planne/primitives";
import { Check, Loader2, Sparkles, ExternalLink, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getEmpresaAtual, getPlanos, getAssinatura, iniciarCheckout, type Plano, type Assinatura } from "@/lib/db";
import { toast } from "sonner";

export const Route = createFileRoute("/app/planos")({
  component: Planos,
});

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function Planos() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutPlano, setCheckoutPlano] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [ps, empresa] = await Promise.all([getPlanos(), getEmpresaAtual()]);
        setPlanos(ps);
        if (empresa) setAssinatura(await getAssinatura((empresa as { id: string }).id));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao carregar planos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const assinar = async (planoId: string) => {
    setCheckoutPlano(planoId);
    try {
      const { payment_url } = await iniciarCheckout(planoId);
      if (payment_url) {
        window.open(payment_url, "_blank");
        toast.success("Cobrança gerada! Conclua o pagamento na aba que abriu.");
        const empresa = await getEmpresaAtual();
        if (empresa) setAssinatura(await getAssinatura((empresa as { id: string }).id));
      } else {
        toast.info("Assinatura criada. Aguarde o link de pagamento por e-mail.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao iniciar checkout");
    } finally {
      setCheckoutPlano(null);
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center h-64">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Planos e assinatura" description="Escolha o plano da sua marcenaria. Cobrança recorrente mensal via Asaas (boleto, PIX ou cartão)." />

      {/* Status da assinatura atual */}
      {assinatura && (
        <Surface>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium px-2.5 py-1 rounded-full ${
                assinatura.status === "ativa" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : assinatura.status === "atrasada" ? "bg-red-500/10 text-red-700 dark:text-red-400"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400"}`}>
                {assinatura.status === "ativa" && <CheckCircle2 className="size-3.5" />}
                Plano {planos.find((p) => p.id === assinatura.plano_id)?.nome ?? assinatura.plano_id} · {assinatura.status}
              </span>
              {assinatura.proximo_vencimento && (
                <span className="text-[12px] text-muted-foreground">
                  próximo vencimento {new Date(assinatura.proximo_vencimento).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
            {assinatura.status !== "ativa" && assinatura.asaas_payment_url && (
              <a href={assinatura.asaas_payment_url} target="_blank" rel="noreferrer"
                className="h-8 px-3 rounded-md bg-foreground text-background text-[12.5px] font-medium inline-flex items-center gap-1.5 hover:opacity-90">
                Pagar agora <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        </Surface>
      )}

      {/* Cards de planos */}
      <div className="grid md:grid-cols-3 gap-4">
        {planos.map((plano) => {
          const atual = assinatura?.plano_id === plano.id && assinatura.status === "ativa";
          const carregando = checkoutPlano === plano.id;
          return (
            <Surface key={plano.id}
              className={`relative flex flex-col ${plano.destaque ? "ring-2 ring-accent" : ""}`}>
              {plano.destaque && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                  <Sparkles className="size-3" /> Mais escolhido
                </span>
              )}
              <div className="text-[15px] font-semibold">{plano.nome}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-[28px] font-bold tracking-tight">{BRL(plano.preco_mensal)}</span>
                <span className="text-[12.5px] text-muted-foreground">/mês</span>
              </div>

              <div className="mt-1 text-[11.5px] text-muted-foreground">
                {plano.limite_orcamentos ? `${plano.limite_orcamentos} orçamentos/mês` : "Orçamentos ilimitados"}
                {" · "}
                {plano.limite_usuarios ? `${plano.limite_usuarios} usuários` : "Usuários ilimitados"}
              </div>

              <ul className="mt-4 space-y-2 flex-1">
                {plano.recursos.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px]">
                    <Check className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={atual || carregando}
                onClick={() => assinar(plano.id)}
                className={`mt-5 h-10 rounded-md text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-60 ${
                  plano.destaque ? "bg-accent text-accent-foreground hover:opacity-90" : "bg-foreground text-background hover:opacity-90"
                }`}>
                {atual ? <><CheckCircle2 className="size-4" /> Plano atual</>
                  : carregando ? <><Loader2 className="size-4 animate-spin" /> Gerando cobrança…</>
                  : "Assinar"}
              </button>
            </Surface>
          );
        })}
      </div>

      <p className="text-[11.5px] text-muted-foreground">
        Pagamento processado pela Asaas. Você pode cancelar a qualquer momento. A assinatura é ativada
        automaticamente após a confirmação do pagamento.
      </p>
    </div>
  );
}
