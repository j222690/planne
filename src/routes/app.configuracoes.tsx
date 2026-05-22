import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/planne/primitives";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { getEmpresaAtual } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app/configuracoes")({
  component: Configuracoes,
});

function Configuracoes() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [form, setForm] = useState({ nome: "", cnpj: "", cidade: "" });

  useEffect(() => {
    getEmpresaAtual().then((e) => {
      if (e) {
        setEmpresa(e);
        setForm({ nome: e.nome ?? "", cnpj: e.cnpj ?? "", cidade: e.cidade ?? "" });
      }
    });
  }, []);

  const handleSave = async () => {
    if (!empresa) return;
    setSaving(true); setError(null);
    const { error } = await supabase
      .from("empresas")
      .update({ nome: form.nome, cnpj: form.cnpj, cidade: form.cidade })
      .eq("id", empresa.id);
    setSaving(false);
    if (error) { setError(error.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      <PageHeader
        eyebrow="Sistema"
        title="Configurações"
        description="Empresa, equipe, integrações e segurança."
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin"/> : <Save className="size-3.5"/>}
            {saved ? "Salvo!" : "Salvar"}
          </button>
        }
      />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/8 px-3.5 py-2.5 text-[13px] text-destructive">
          <AlertCircle className="size-4 shrink-0"/> {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Surface>
          <div className="text-[12.5px] font-medium mb-4">Empresa</div>
          {[
            { label: "Razão social", key: "nome" },
            { label: "CNPJ", key: "cnpj" },
            { label: "Cidade", key: "cidade" },
          ].map(({ label, key }) => (
            <label key={key} className="block mb-3">
              <div className="text-[11.5px] text-muted-foreground mb-1">{label}</div>
              <input
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong"
              />
            </label>
          ))}
        </Surface>

        <Surface>
          <div className="text-[12.5px] font-medium mb-1">Integrações de IA</div>
          <div className="text-[11.5px] text-muted-foreground mb-4">Configure as chaves no arquivo <code className="font-mono bg-secondary px-1 rounded">.env</code></div>
          {[
            { n: "Groq (Llama 3.3 · primário)", key: "GROQ_API_KEY", color: "text-violet-500" },
            { n: "OpenAI GPT-4o mini (fallback)", key: "OPENAI_API_KEY", color: "text-emerald-600" },
          ].map(({ n, key, color }) => (
            <div key={key} className="py-2.5 border-b border-border last:border-0">
              <div className={`text-[12.5px] font-medium ${color}`}>{n}</div>
              <div className="text-[11.5px] text-muted-foreground font-mono mt-0.5">{key}</div>
            </div>
          ))}
        </Surface>

        <Surface>
          <div className="text-[12.5px] font-medium mb-1">Supabase</div>
          <div className="text-[11.5px] text-muted-foreground mb-4">Banco de dados conectado</div>
          {[
            { n: "Autenticação", s: "Ativo" },
            { n: "Row Level Security", s: "Ativo" },
            { n: "Multi-empresa", s: "Ativo" },
            { n: "Trigger auto-empresa", s: "Ativo" },
          ].map(({ n, s }) => (
            <div key={n} className="flex items-center justify-between py-2.5 border-b border-border last:border-0 text-[13px]">
              <div>{n}</div>
              <div className="text-[11.5px] flex items-center gap-1.5 text-emerald-600">
                <span className="size-1.5 rounded-full bg-emerald-500 inline-block"/> {s}
              </div>
            </div>
          ))}
        </Surface>
      </div>
    </>
  );
}
