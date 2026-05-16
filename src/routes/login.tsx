import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/planne/Logo";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      throw redirect({ to: "/app" });
    }
  },
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/app",
            data: { company_name: company },
          },
        });
        if (error) throw error;
        setSuccessMsg("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/app" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de autenticação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background text-foreground">
      {/* Left: form */}
      <div className="flex flex-col p-6 md:p-10">
        <Link to="/"><Logo /></Link>
        <div className="flex-1 grid place-items-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm"
          >
            <h1 className="text-[26px] font-semibold tracking-tight">
              {mode === "signin" ? "Entrar no Planne" : "Criar conta"}
            </h1>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">
              {mode === "signin" ? "Acesse o painel da sua marcenaria." : "Comece a operar em poucos minutos."}
            </p>

            <form onSubmit={onSubmit} className="mt-7 space-y-3">
              {mode === "signup" && (
                <Field label="Nome da empresa">
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Marcenaria Atelier"
                    className="planne-input"
                    required
                    autoComplete="organization"
                  />
                </Field>
              )}
              <Field label="E-mail corporativo">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com.br"
                  className="planne-input"
                  required
                  autoComplete="email"
                />
              </Field>
              <Field label="Senha">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="planne-input"
                  required
                  minLength={8}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
              </Field>

              {error && (
                <div className="text-[12.5px] text-destructive border border-destructive/20 bg-destructive/5 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="text-[12.5px] text-success border border-success/20 bg-success/5 rounded-md px-3 py-2">
                  {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-md bg-foreground text-background text-[13.5px] font-medium inline-flex items-center justify-center gap-1.5 hover:opacity-90 transition disabled:opacity-60"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : (
                  <>{mode === "signin" ? "Entrar" : "Criar conta"} <ArrowRight className="size-3.5" /></>
                )}
              </button>
            </form>

            <div className="mt-5 text-[12.5px] text-muted-foreground">
              {mode === "signin" ? (
                <>Ainda não tem conta? <button onClick={() => { setMode("signup"); setError(null); setSuccessMsg(null); }} className="text-foreground hover:underline">Criar conta</button></>
              ) : (
                <>Já tem conta? <button onClick={() => { setMode("signin"); setError(null); setSuccessMsg(null); }} className="text-foreground hover:underline">Entrar</button></>
              )}
            </div>
          </motion.div>
        </div>
        <div className="text-[11.5px] text-muted-foreground">© {new Date().getFullYear()} Planne</div>
      </div>

      {/* Right: visual */}
      <div className="hidden lg:block relative border-l border-border bg-surface-2 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        <div className="relative h-full grid place-items-center p-10">
          <div className="max-w-md">
            <blockquote className="text-[22px] leading-snug font-display tracking-tight text-balance">
              "Substituímos quatro planilhas, dois grupos de WhatsApp e um software antigo.
              Agora o orçamento sai em minutos."
            </blockquote>
            <div className="mt-5 text-[13px] text-muted-foreground">
              <div className="font-medium text-foreground">Ricardo Camargo</div>
              <div>Diretor · Atelier Marcenaria, Chapecó</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .planne-input {
          width: 100%;
          height: 38px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--surface);
          padding: 0 10px;
          font-size: 13.5px;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
          color: var(--foreground);
        }
        .planne-input:focus {
          border-color: var(--border-strong);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 18%, transparent);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11.5px] font-medium text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}
