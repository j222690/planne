import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/planne/primitives";
import { Save, Loader2, Upload, Image as ImageIcon, Palette, CheckCircle2, Users, User, Mail, X } from "lucide-react";
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

type Membro = { user_id: string; role: string; perfis: { nome: string; email: string; cargo: string | null } | null };

function Configuracoes() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  // Perfil do usuário
  const [perfil, setPerfil] = useState({ nome: "", cargo: "" });
  const [savingPerfil, setSavingPerfil] = useState(false);

  // Membros
  const [membros, setMembros] = useState<Membro[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "membro">("membro");
  const [inviting, setInviting] = useState(false);

  const [form, setForm] = useState({
    nome: "", cnpj: "", cidade: "", estado: "", endereco: "",
    telefone: "", email: "", cor_primaria: "#3B82F6",
  });

  const [params, setParams] = useState({
    mdf_custo_chapa: 85, mao_obra_hora: 45, margem_padrao: 35, creditos_render: 10,
  });

  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const loadMembros = async (eid: string) => {
    const { data } = await supabase.from("empresa_membros")
      .select("user_id, role, perfis(nome, email, cargo)")
      .eq("empresa_id", eid);
    setMembros((data ?? []) as Membro[]);
  };

  useEffect(() => {
    // Carrega perfil do usuário logado
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.from("perfis").select("nome, email, cargo").eq("id", session.user.id).single()
        .then(({ data }) => {
          if (data) setPerfil({ nome: data.nome ?? "", cargo: data.cargo ?? "" });
          else setPerfil({ nome: session.user.email?.split("@")[0] ?? "", cargo: "" });
        });
    });

    getEmpresaAtual().then((e) => {
      if (!e) return;
      const emp = e as Empresa;
      setEmpresa(emp);
      loadMembros(emp.id);
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
      // Cria o bucket caso não exista
      await supabase.storage.createBucket("logos", { public: true }).catch(() => {});
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

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { toast.error("Informe o email"); return; }
    setInviting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sessão expirada"); return; }
      const res = await fetch("/api/invite-membro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole, userToken: session.access_token }),
      });
      const json = await res.json() as { ok?: boolean; error?: string; message?: string };
      if (!res.ok) { toast.error(json.error ?? "Erro ao convidar"); return; }
      toast.success(json.message ?? `Convite enviado para ${inviteEmail}`);
      setInviteEmail("");
      if (empresa) loadMembros(empresa.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao convidar");
    } finally {
      setInviting(false);
    }
  };

  const setParam = (key: keyof typeof params, val: string) =>
    setParams((p) => ({ ...p, [key]: parseFloat(val) || 0 }));

  const handleSavePerfil = async () => {
    setSavingPerfil(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.from("perfis").upsert({
        id: session.user.id, empresa_id: empresa?.id,
        email: session.user.email, nome: perfil.nome, cargo: perfil.cargo,
      }, { onConflict: "id" });
      toast.success("Perfil salvo!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setSavingPerfil(false); }
  };

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

      {/* Perfil + Membros */}
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        {/* Meu perfil */}
        <Surface>
          <div className="flex items-center gap-2 mb-4">
            <User className="size-3.5 text-muted-foreground" />
            <div className="text-[12.5px] font-semibold">Meu perfil</div>
          </div>
          <div className="space-y-3">
            <label className="block">
              <div className="text-[11.5px] text-muted-foreground mb-1">Nome de exibição</div>
              <input value={perfil.nome} onChange={(e) => setPerfil((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Seu nome" className="input" />
            </label>
            <label className="block">
              <div className="text-[11.5px] text-muted-foreground mb-1">Cargo</div>
              <input value={perfil.cargo} onChange={(e) => setPerfil((p) => ({ ...p, cargo: e.target.value }))}
                placeholder="Ex: Diretor, Vendedor, Designer..." className="input" />
            </label>
            <button onClick={handleSavePerfil} disabled={savingPerfil}
              className="h-8 px-4 rounded-md bg-foreground text-background text-[12.5px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5">
              {savingPerfil ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />} Salvar perfil
            </button>
          </div>
        </Surface>

        {/* Membros da equipe */}
        <Surface>
          <div className="flex items-center gap-2 mb-4">
            <Users className="size-3.5 text-muted-foreground" />
            <div className="text-[12.5px] font-semibold">Equipe</div>
          </div>
          <div className="space-y-2 mb-3">
            {membros.length === 0 ? (
              <div className="text-[12.5px] text-muted-foreground">Nenhum membro cadastrado.</div>
            ) : membros.map((m) => (
              <div key={m.user_id} className="flex items-center gap-2.5 py-2 border-b border-border last:border-0">
                <div className="size-7 rounded-md bg-secondary grid place-items-center text-[11px] font-semibold shrink-0">
                  {(m.perfis?.nome ?? m.perfis?.email ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-medium truncate">{m.perfis?.nome ?? m.perfis?.email ?? "Usuário"}</div>
                  <div className="text-[11px] text-muted-foreground">{m.perfis?.cargo ?? m.role}</div>
                </div>
                <span className="text-[11px] text-muted-foreground px-2 py-0.5 rounded-full border border-border">{m.role}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-1">
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              placeholder="email@empresa.com"
              type="email"
              className="flex-1 h-8 rounded-md border border-border bg-surface-2 px-2.5 text-[12.5px] outline-none focus:border-border-strong"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "admin" | "membro")}
              className="h-8 rounded-md border border-border bg-surface-2 px-2 text-[12.5px] outline-none"
            >
              <option value="membro">Membro</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary shrink-0 inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              {inviting ? <Loader2 className="size-3 animate-spin" /> : <Mail className="size-3" />}
              Convidar
            </button>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1.5">
            O convidado receberá um link de acesso por email.
          </div>
        </Surface>
      </div>
    </>
  );
}
