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

// Usa RPC com FOR UPDATE para evitar race condition entre usuários simultâneos
export async function checkAndConsumeCredito(
  empresaId: string,
  modulo: Modulo,
): Promise<{ ok: boolean; restantes: number; mensagem?: string }> {
  const key = PARAM_KEY[modulo];
  const defaultVal = DEFAULT_CREDITOS[modulo];

  const { data, error } = await supabase.rpc("consume_credito", {
    p_empresa_id: empresaId,
    p_key: key,
    p_default: defaultVal,
  });

  if (error) return { ok: false, restantes: 0, mensagem: "Erro ao verificar créditos" };

  const result = data as { ok: boolean; restantes: number };

  if (!result.ok) {
    return {
      ok: false,
      restantes: 0,
      mensagem: `Sem créditos de ${modulo === "render" ? "render" : "projeto IA"}. Recarregue em Configurações.`,
    };
  }

  return { ok: true, restantes: result.restantes };
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
