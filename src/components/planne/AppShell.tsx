import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FileText, Users, Boxes, Truck, Sparkles,
  Hammer, Wallet, Settings, Search, Bell, Command, ChevronsUpDown,
  Folder, LogOut, Menu, X, Sun, Moon, UserSearch, Wand2,
  CalendarDays, GitBranch, BarChart3,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

const nav = [
  { group: "Visão geral", items: [
    { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { group: "Comercial", items: [
    { to: "/app/orcamentos", label: "Orçamentos", icon: FileText },
    { to: "/app/clientes", label: "Clientes", icon: Users },
    { to: "/app/busca-lead", label: "Busca Lead", icon: UserSearch },
    { to: "/app/projetos", label: "Projetos", icon: Folder },
    { to: "/app/pipeline", label: "Pipeline", icon: GitBranch },
    { to: "/app/calendario", label: "Calendário", icon: CalendarDays },
  ]},
  { group: "Operação", items: [
    { to: "/app/materiais", label: "Central de materiais", icon: Boxes },
    { to: "/app/fornecedores", label: "Fornecedores", icon: Truck },
    { to: "/app/producao", label: "Produção", icon: Hammer },
  ]},
  { group: "Inteligência", items: [
    { to: "/app/ia-projetos", label: "IA Projetos", icon: Wand2 },
    { to: "/app/ia", label: "Grat — Assistente", icon: Sparkles },
    { to: "/app/dashboard-ia", label: "Dashboard IA", icon: BarChart3 },
    { to: "/app/financeiro", label: "Financeiro", icon: Wallet },
  ]},
];

function NavContent({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState<{nome:string;cidade:string|null}|null>(null);

  useEffect(() => {
    import("@/lib/db").then(({ getEmpresaAtual }) =>
      getEmpresaAtual().then((e) => e && setEmpresa(e))
    );
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate({ to: "/login" });
  };

  return (
    <>
      {/* Workspace switcher */}
      <button className="mx-3 mt-3 flex items-center justify-between gap-2 rounded-md border border-sidebar-border bg-surface px-2.5 py-1.5 text-left text-[13px] hover:bg-sidebar-accent transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-6 rounded bg-foreground text-background grid place-items-center text-[10px] font-semibold shrink-0">
            {empresa?.nome?.slice(0,1).toUpperCase() ?? "P"}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium text-[12.5px]">{empresa?.nome ?? "Planne"}</div>
            <div className="truncate text-[11px] text-muted-foreground">{empresa?.cidade ?? "Plano Pro"}</div>
          </div>
        </div>
        <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0" />
      </button>

      <nav className="mt-4 px-2 flex-1 overflow-auto">
        {nav.map((g) => (
          <div key={g.group} className="mb-4">
            <div className="px-2 mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
              {g.group}
            </div>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const active = path === item.to || (item.to !== "/app" && path.startsWith(item.to));
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className={cn("size-[15px] shrink-0", active ? "text-accent" : "text-muted-foreground group-hover:text-foreground")} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-0.5">
        <Link
          to="/app/configuracoes"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-sidebar-foreground/85 hover:bg-sidebar-accent transition-colors"
        >
          <Settings className="size-[15px] text-muted-foreground" />
          Configurações
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-sidebar-foreground/85 hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="size-[15px] text-muted-foreground" />
          Sair da conta
        </button>
      </div>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const path = location.pathname;
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const [userInitial, setUserInitial] = useState("P");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<{ type: string; label: string; sub: string; to: string }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const email = session.user.email ?? "";
        setUserEmail(email);
        setUserInitial((email[0] ?? "P").toUpperCase());
      }
    });
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: membros } = await supabase.from("empresa_membros").select("empresa_id").eq("user_id", session.user.id).single();
      if (!membros) return;
      const eid = membros.empresa_id;
      const like = `%${q}%`;

      const [{ data: clientes }, { data: orcs }, { data: projs }] = await Promise.all([
        supabase.from("clientes").select("id,nome,email").eq("empresa_id", eid).ilike("nome", like).limit(3),
        supabase.from("orcamentos").select("id,numero,clientes(nome)").eq("empresa_id", eid).ilike("numero", like).limit(3),
        supabase.from("projetos").select("id,nome").eq("empresa_id", eid).ilike("nome", like).limit(3),
      ]);

      const results = [
        ...(clientes ?? []).map((c: { id: string; nome: string; email: string | null }) => ({ type: "Cliente", label: c.nome, sub: c.email ?? "", to: "/app/clientes" })),
        ...(orcs ?? []).map((o: { id: string; numero: string | null; clientes: { nome: string } | null }) => ({ type: "Orçamento", label: o.numero ?? o.id, sub: (o.clientes as { nome: string } | null)?.nome ?? "", to: "/app/orcamentos" })),
        ...(projs ?? []).map((p: { id: string; nome: string }) => ({ type: "Projeto", label: p.nome, sub: "", to: "/app/projetos" })),
      ];
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchQ), 300);
    return () => clearTimeout(timer);
  }, [searchQ, doSearch]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-background/60 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex w-[244px] shrink-0 flex-col border-r border-border bg-sidebar h-screen sticky top-0">
          <div className="h-14 px-4 flex items-center border-b border-sidebar-border">
            <Logo />
          </div>
          <NavContent path={path} />
        </aside>

        {/* Sidebar — mobile drawer */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-[244px] flex flex-col border-r border-border bg-sidebar transition-transform duration-200 md:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="h-14 px-4 flex items-center justify-between border-b border-sidebar-border">
            <Logo />
            <button onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <NavContent path={path} onNavigate={() => setMobileOpen(false)} />
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 flex flex-col min-h-screen">
          {/* Topbar */}
          <header className="h-14 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10 flex items-center px-4 md:px-6 gap-3">
            <button
              className="md:hidden size-8 grid place-items-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="size-4" />
            </button>

            <div className="flex-1 max-w-xl relative">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  ref={searchRef}
                  value={searchQ}
                  onChange={(e) => { setSearchQ(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                  placeholder="Buscar projetos, clientes, orçamentos…"
                  className="w-full h-8 rounded-md border border-border bg-surface-2 pl-8 pr-16 text-[13px] outline-none focus:border-border-strong focus:ring-2 focus:ring-ring/15 transition"
                />
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-[10.5px] text-muted-foreground border border-border rounded px-1 py-0.5">
                  <Command className="size-2.5" /> K
                </kbd>
              </div>
              {searchOpen && searchQ.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                  {searching ? (
                    <div className="px-4 py-3 text-[12.5px] text-muted-foreground">Buscando…</div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-[12.5px] text-muted-foreground">Nenhum resultado para "{searchQ}"</div>
                  ) : (
                    <div className="py-1">
                      {searchResults.map((r, i) => (
                        <button
                          key={i}
                          onMouseDown={() => { navigate({ to: r.to }); setSearchQ(""); setSearchOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-secondary text-left"
                        >
                          <span className="text-[10.5px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded shrink-0">{r.type}</span>
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium truncate">{r.label}</div>
                            {r.sub && <div className="text-[11.5px] text-muted-foreground truncate">{r.sub}</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="size-8 grid place-items-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              aria-label={theme === "dark" ? "Mudar para claro" : "Mudar para escuro"}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <button className="size-8 grid place-items-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" aria-label="Notificações">
              <Bell className="size-4" />
            </button>

            <div
              title={userEmail ?? ""}
              className="size-8 rounded-full bg-foreground text-background grid place-items-center text-[11px] font-semibold cursor-default"
            >
              {userInitial}
            </div>
          </header>

          <motion.div
            key={path}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex-1 p-5 md:p-7"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
