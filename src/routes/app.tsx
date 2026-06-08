import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/planne/AppShell";
import { CommandSearch } from "@/components/planne/CommandSearch";
import { supabase } from "@/lib/supabase";
import { garantirEmpresa } from "@/lib/db";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    // Garante que a marcenaria tenha empresa (fallback do trigger SQL de onboarding)
    try { await garantirEmpresa(); } catch { /* trigger SQL é o caminho principal */ }
  },
  component: () => (
    <AppShell>
      <CommandSearch />
      <Outlet />
    </AppShell>
  ),
});
