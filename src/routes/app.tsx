import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/planne/AppShell";
import { CommandSearch } from "@/components/planne/CommandSearch";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <AppShell>
      <CommandSearch />
      <Outlet />
    </AppShell>
  ),
});
