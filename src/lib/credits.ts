import { supabase } from "./supabase";

type Modulo = "projeto_ia" | "render";

const PARAM_KEY: Record<Modulo, string> = {
  projeto_ia: "creditos_projeto_ia",
  render: "creditos_render",
};

const DEFAULT_CREDITOS: Record<Modulo, number> = {
  projeto_ia: 20,
  render: 5,
};

export async function checkAndConsumeCredito(
  empresaId: string,
  modulo: Modulo,
): Promise<{ ok: boolean; restantes: number; mensagem?: string }> {
  const { data, error } = await supabase
    .from("empresas")
    .select("parametros")
    .eq("id", empresaId)
    .single();

  if (error) return { ok: false, restantes: 0, mensagem: "Erro ao verificar créditos" };

  const params = ((data?.parametros ?? {}) as Record<string, number>);
  const key = PARAM_KEY[modulo];
  const creditos = params[key] ?? DEFAULT_CREDITOS[modulo];

  if (creditos <= 0) {
    return {
      ok: false,
      restantes: 0,
      mensagem: `Sem créditos de ${modulo === "render" ? "render" : "projeto IA"}. Recarregue em Configurações.`,
    };
  }

  const novos = creditos - 1;
  await supabase
    .from("empresas")
    .update({ parametros: { ...params, [key]: novos } })
    .eq("id", empresaId);

  return { ok: true, restantes: novos };
}

export async function getCreditosDisponiveis(
  empresaId: string,
  modulo: Modulo,
): Promise<number> {
  const { data } = await supabase
    .from("empresas")
    .select("parametros")
    .eq("id", empresaId)
    .single();

  const params = ((data?.parametros ?? {}) as Record<string, number>);
  return params[PARAM_KEY[modulo]] ?? DEFAULT_CREDITOS[modulo];
}
