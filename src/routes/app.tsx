import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/planne/AppShell";
import { CommandSearch } from "@/components/planne/CommandSearch";
import { supabase, isConnectionError } from "@/lib/supabase";
import { garantirEmpresa } from "@/lib/db";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    // Garante que a marcenaria tenha empresa (fallback do trigger SQL de onboarding)
    let empresa: unknown = null;
    try { empresa = await garantirEmpresa(); } catch { /* trigger SQL é o caminho principal */ }

    // Sem empresa pode ser onboarding pendente OU backend fora do ar. getSession
    // lê do cache (não bate na rede), então validamos a conexão com getUser (que
    // consulta o servidor). Se o backend estiver inalcançável, sinalizamos para o
    // errorComponent mostrar uma tela clara em vez de um painel vazio.
    if (!empresa) {
      const { error } = await supabase.auth.getUser();
      if (error) {
        // Backend fora do ar → tela clara; token inválido/expirado → volta ao login.
        if (isConnectionError(error)) throw new Error("CONEXAO_INDISPONIVEL");
        throw redirect({ to: "/login" });
      }
    }
  },
  component: () => (
    <AppShell>
      <CommandSearch />
      <Outlet />
    </AppShell>
  ),
});
