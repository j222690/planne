import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/planne/primitives";
import { Save, Loader2, Upload, Image as ImageIcon, Palette, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getEmpresaAtual } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/app/configuracoes")({
  component: Configuracoes,
});

type Empresa = {
  id: string; nome: string; cnpj: string | null; cidade: string | null;
  estado: string | null; endereco: string | null; telefone: string | null;
  email: string | null; cor_primaria: string | null; logo_url: string | null;
  parametros: Record<string, number> | null;
};

function Configuracoes() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nome: "", cnpj: "", cidade: "", estado: "", endereco: "",
    telefone: "", email: "", cor_primaria: "#3B82F6",
  });

  const [params, setParams] = useState({
    mdf_custo_chapa: 85, mao_obra_hora: 45, margem_padrao: 35, creditos_render: 10,
  });

  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    getEmpresaAtual().then((e) => {
      if (!e) return;
      const emp = e as Empresa;
      setEmpresa(emp);
      setForm({
        nome: emp.nome ?? "",
        cnpj: emp.cnpj ?? "",
        cidade: emp.cidade ?? "",
        estado: emp.estado ?? "",
        endereco: emp.endereco ?? "",
        telefone: emp.telefone ?? "",
        email: emp.email ?? "",
        cor_primaria: emp.cor_primaria ?? "#3B82F6",
      });
      const p = emp.parametros ?? {};
      setParams({
        mdf_custo_chapa: p.mdf_custo_chapa ?? 85,
        mao_obra_hora: p.mao_obra_hora ?? 45,
        margem_padrao: p.margem_padrao ?? 35,
        creditos_render: p.creditos_render ?? 10,
      });
      setLogoUrl(emp.logo_url ?? null);
    });
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !empresa) return;
    setLogoUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${empresa.id}/logo.${ext}`;
      const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("logos").getPublicUrl(path);
      await supabase.from("empresas").update({ logo_url: publicUrl }).eq("id", empresa.id);
      setLogoUrl(publicUrl + "?t=" + Date.now());
      toast.success("Logo atualizado!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar logo");
    } finally {
      setLogoUploading(false);
      if (logoRef.current) logoRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!empresa) return;
    setSaving(true);
    const { error } = await supabase.from("empresas").update({
      nome: form.nome,
      cnpj: form.cnpj || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      endereco: form.endereco || null,
      telefone: form.telefone || null,
      email: form.email || null,
      cor_primaria: form.cor_primaria || null,
      parametros: params,
    }).eq("id", empresa.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Configurações salvas!");
  };

  const setParam = (key: keyof typeof params, val: string) =>
    setParams((p) => ({ ...p, [key]: parseFloat(val) || 0 }));

  return (
    <>
      <PageHeader
        eyebrow="Sistema"
        title="Configurações"
        description="Empresa, integrações e parâmetros de precificação."
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Salvar alterações
          </button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Dados da empresa */}
        <Surface className="lg:col-span-2">
          <div className="text-[12.5px] font-semibold mb-4">Dados da empresa</div>

          {/* Logo upload */}
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border">
            <div className="size-16 rounded-lg border border-border bg-surface-2 overflow-hidden grid place-items-center shrink-0">
              {logoUrl
                ? <img src={logoUrl} alt="Logo" className="size-full object-contain" />
                : <ImageIcon className="size-6 text-muted-foreground" />}
            </div>
            <div>
              <button
                onClick={() => logoRef.current?.click()}
                disabled={logoUploading}
                className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary inline-flex items-center gap-1.5 disabled:opacity-60 transition-colors"
              >
                {logoUploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                {logoUrl ? "Trocar logo" : "Enviar logo"}
              </button>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <div className="text-[11px] text-muted-foreground mt-1">PNG, SVG ou JPG · máx. 1 MB</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Nome / Razão social", key: "nome", col: 2 },
              { label: "CNPJ", key: "cnpj" },
              { label: "Telefone", key: "telefone" },
              { label: "E-mail", key: "email" },
              { label: "Cidade", key: "cidade" },
              { label: "Estado (UF)", key: "estado" },
              { label: "Endereço", key: "endereco", col: 2 },
            ].map(({ label, key, col }) => (
              <label key={key} className={`block ${col === 2 ? "col-span-2" : ""}`}>
                <div className="text-[11.5px] text-muted-foreground mb-1">{label}</div>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="input"
                />
              </label>
            ))}
          </div>

          <div className="mt-3">
            <div className="text-[11.5px] text-muted-foreground mb-1 flex items-center gap-1.5">
              <Palette className="size-3" /> Cor primária da marca
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.cor_primaria}
                onChange={(e) => setForm((f) => ({ ...f, cor_primaria: e.target.value }))}
                className="h-9 w-16 rounded-md border border-border bg-surface-2 cursor-pointer p-0.5"
              />
              <span className="text-[12.5px] font-mono text-muted-foreground">{form.cor_primaria}</span>
            </div>
          </div>
        </Surface>

        <div className="space-y-4">
          {/* Parâmetros de precificação */}
          <Surface>
            <div className="text-[12.5px] font-semibold mb-4">Precificação padrão</div>
            <div className="space-y-3">
              {[
                { label: "MDF — custo por chapa (R$)", key: "mdf_custo_chapa", step: "1" },
                { label: "Mão de obra — custo/hora (R$)", key: "mao_obra_hora", step: "1" },
                { label: "Margem padrão (%)", key: "margem_padrao", step: "0.5" },
                { label: "Créditos de render", key: "creditos_render", step: "1" },
              ].map(({ label, key, step }) => (
                <label key={key} className="block">
                  <div className="text-[11.5px] text-muted-foreground mb-1">{label}</div>
                  <input
                    type="number"
                    value={params[key as keyof typeof params]}
                    onChange={(e) => setParam(key as keyof typeof params, e.target.value)}
                    className="input"
                    min={0}
                    step={step}
                  />
                </label>
              ))}
            </div>
          </Surface>

          {/* Status da infraestrutura */}
          <Surface>
            <div className="text-[12.5px] font-semibold mb-3">Infraestrutura</div>
            {[
              "Autenticação", "Row Level Security", "Multi-empresa", "Trigger número ORC",
            ].map((n) => (
              <div key={n} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-[12.5px]">
                <span>{n}</span>
                <span className="flex items-center gap-1.5 text-emerald-600 text-[11.5px]">
                  <CheckCircle2 className="size-3.5" /> Ativo
                </span>
              </div>
            ))}
          </Surface>
        </div>
      </div>
    </>
  );
}
