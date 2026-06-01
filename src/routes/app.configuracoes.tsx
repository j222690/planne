import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/planne/primitives";
import { Save, Loader2, Upload, Image as ImageIcon, Palette, CheckCircle2, Users, User, Mail, X, Receipt, Eye, EyeOff, ChevronDown, ChevronUp, ExternalLink, FileText, CreditCard, Info, Map, Trash2 } from "lucide-react";
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
  parametros: Record<string, unknown> | null;
};

type Membro = { user_id: string; role: string; perfis: { nome: string; email: string; cargo: string | null } | null };

function TutorialBox({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-blue-200 dark:border-blue-900 rounded-lg overflow-hidden mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/60 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-[12px] font-semibold text-blue-700 dark:text-blue-400">
          <Info className="size-3.5 shrink-0" />
          {titulo}
        </span>
        {open
          ? <ChevronUp className="size-3.5 text-blue-500 shrink-0" />
          : <ChevronDown className="size-3.5 text-blue-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-3 py-3 bg-blue-50/50 dark:bg-blue-950/20 text-[12px] text-foreground/80 space-y-2.5">
          {children}
        </div>
      )}
    </div>
  );
}

function Passo({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 items-start">
      <span className="size-5 rounded-full bg-blue-600 text-white text-[10px] font-bold grid place-items-center shrink-0 mt-0.5">{n}</span>
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}

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
    mdf_custo_chapa: 85, mao_obra_hora: 45, margem_padrao: 35,
    meta_faturamento: 0, meta_margem: 0,
  });

  const [fiscal, setFiscal] = useState({
    focus_nfe_token: "",
    focus_nfe_ambiente: "homologacao" as "homologacao" | "producao",
    regime_tributario: "1" as "1" | "2" | "3",
    asaas_token: "",
    asaas_ambiente: "sandbox" as "sandbox" | "producao",
  });
  const [showTokens, setShowTokens] = useState(false);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Plantas baixas
  type PlantaInfo = { nome: string; paredes: {id:string;lado:string;descricao:string;largura_cm:number;espaco_util_cm:number;obstaculos:string}[]; porta_principal?: {parede:string;x_pct:number;largura_cm:number}; janelas?: {parede:string;x_pct:number;largura_cm:number;descricao?:string}[]; largura_cm: number; profundidade_cm: number; altura_cm: number; observacoes?: string; analisado_em?: string };
  const [plantas, setPlantas] = useState<Record<string, PlantaInfo>>({});
  const [plantaAnalisando, setPlantaAnalisando] = useState<string | null>(null);
  const [novoAmbiente, setNovoAmbiente] = useState("");

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
        mdf_custo_chapa: Number(p.mdf_custo_chapa ?? 85),
        mao_obra_hora: Number(p.mao_obra_hora ?? 45),
        margem_padrao: Number(p.margem_padrao ?? 300),
        meta_faturamento: Number(p.meta_faturamento ?? 0),
        meta_margem: Number(p.meta_margem ?? 0),
      });
      setFiscal({
        focus_nfe_token: String(p.focus_nfe_token ?? ""),
        focus_nfe_ambiente: (p.focus_nfe_ambiente as "homologacao" | "producao") ?? "homologacao",
        regime_tributario: (p.regime_tributario as "1" | "2" | "3") ?? "1",
        asaas_token: String(p.asaas_token ?? ""),
        asaas_ambiente: (p.asaas_ambiente as "sandbox" | "producao") ?? "sandbox",
      });
      setLogoUrl(emp.logo_url ?? null);
      const pb = (emp.parametros as Record<string, unknown> | null)?.plantas_baixas;
      if (pb && typeof pb === "object") setPlantas(pb as Record<string, PlantaInfo>);
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
      parametros: { ...params, ...fiscal, plantas_baixas: Object.keys(plantas).length > 0 ? plantas : undefined },
    }).eq("id", empresa.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Configurações salvas!");
  };

  const handleAnalisarPlanta = async (ambiente: string, file: File) => {
    if (!empresa) return;
    setPlantaAnalisando(ambiente);
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          res(result.split(",")[1] ?? "");
        };
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      const resp = await fetch("/api/analisar-planta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagem_b64: b64, ambiente }),
      });
      if (!resp.ok) throw new Error(`API error: ${resp.statusText}`);
      const json = await resp.json() as PlantaInfo;
      json.nome = ambiente;
      json.analisado_em = new Date().toISOString();

      const novasPlantas = { ...plantas, [ambiente]: json };
      setPlantas(novasPlantas);

      // Salva imediatamente
      await supabase.from("empresas").update({
        parametros: { ...params, ...fiscal, plantas_baixas: novasPlantas },
      }).eq("id", empresa.id);

      toast.success(`Planta de ${ambiente} analisada e salva!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao analisar planta");
    } finally {
      setPlantaAnalisando(null);
    }
  };

  const handleRemoverPlanta = async (ambiente: string) => {
    if (!empresa) return;
    const novas = { ...plantas };
    delete novas[ambiente];
    setPlantas(novas);
    await supabase.from("empresas").update({
      parametros: { ...params, ...fiscal, plantas_baixas: Object.keys(novas).length > 0 ? novas : null },
    }).eq("id", empresa.id);
    toast.success("Planta removida");
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
                { label: "Multiplicador padrão (300 = 3× o custo)", key: "margem_padrao", step: "10" },
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

          {/* Feature 4: Metas mensais */}
          <Surface>
            <div className="text-[12.5px] font-semibold mb-4">Metas mensais</div>
            <div className="space-y-3">
              <label className="block">
                <div className="text-[11.5px] text-muted-foreground mb-1">Meta de faturamento (R$)</div>
                <input
                  type="number"
                  value={params.meta_faturamento}
                  onChange={(e) => setParam("meta_faturamento", e.target.value)}
                  className="input"
                  min={0}
                  step={1000}
                  placeholder="0"
                />
              </label>
              <label className="block">
                <div className="text-[11.5px] text-muted-foreground mb-1">Meta de margem (%)</div>
                <input
                  type="number"
                  value={params.meta_margem}
                  onChange={(e) => setParam("meta_margem", e.target.value)}
                  className="input"
                  min={0}
                  max={100}
                  step={0.5}
                  placeholder="0"
                />
              </label>
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

      {/* Fiscal & Pagamentos */}
      <Surface className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="size-3.5 text-muted-foreground" />
            <div className="text-[12.5px] font-semibold">Fiscal & Pagamentos</div>
          </div>
          <button
            type="button"
            onClick={() => setShowTokens((v) => !v)}
            className="flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-foreground"
          >
            {showTokens ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            {showTokens ? "Ocultar tokens" : "Mostrar tokens"}
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Focus NFe */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="size-3.5 text-muted-foreground" />
              <div className="text-[11.5px] font-medium text-muted-foreground uppercase tracking-wider">NF-e — Focus NFe</div>
            </div>

            <TutorialBox titulo="O que é e como configurar a NF-e?">
              <p className="text-muted-foreground leading-relaxed">
                A <strong className="text-foreground">Focus NFe</strong> é uma plataforma que permite emitir Notas Fiscais Eletrônicas (NF-e) diretamente do Planne, sem precisar abrir outro sistema.
                Após um orçamento ser aprovado, você pode gerar a nota fiscal com um clique.
              </p>
              <div className="font-semibold text-foreground pt-1">Como configurar:</div>
              <Passo n={1}>
                Acesse{" "}
                <a href="https://focusnfe.com.br" target="_blank" rel="noopener" className="text-blue-600 underline inline-flex items-center gap-0.5">
                  focusnfe.com.br <ExternalLink className="size-2.5" />
                </a>{" "}
                e crie uma conta (plano gratuito disponível para testes).
              </Passo>
              <Passo n={2}>
                No painel Focus NFe, vá em <strong>Configurações → Empresa</strong> e cadastre o CNPJ da sua marcenaria.
              </Passo>
              <Passo n={3}>
                Faça upload do <strong>Certificado Digital A1</strong> (arquivo .pfx) da sua empresa — ele é obrigatório para assinar as notas.
              </Passo>
              <Passo n={4}>
                Em <strong>Configurações → Tokens de Acesso</strong>, copie o token gerado e cole no campo abaixo.
              </Passo>
              <Passo n={5}>
                Escolha <strong>Homologação</strong> para fazer testes sem valor fiscal real.
                Quando estiver pronto, troque para <strong>Produção</strong>.
              </Passo>
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-2 text-[11.5px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Dica:</strong> Em homologação as notas não têm validade jurídica — use para testar o processo antes de emitir de verdade.
              </div>
            </TutorialBox>

            <label className="block">
              <div className="text-[11.5px] text-muted-foreground mb-1">Token de acesso</div>
              <input
                type={showTokens ? "text" : "password"}
                value={fiscal.focus_nfe_token}
                onChange={(e) => setFiscal((f) => ({ ...f, focus_nfe_token: e.target.value }))}
                placeholder="Token gerado em focusnfe.com.br"
                className="input font-mono text-[12px]"
              />
            </label>
            <label className="block">
              <div className="text-[11.5px] text-muted-foreground mb-1">Ambiente</div>
              <select
                value={fiscal.focus_nfe_ambiente}
                onChange={(e) => setFiscal((f) => ({ ...f, focus_nfe_ambiente: e.target.value as "homologacao" | "producao" }))}
                className="input"
              >
                <option value="homologacao">Homologação (testes)</option>
                <option value="producao">Produção</option>
              </select>
            </label>
            <label className="block">
              <div className="text-[11.5px] text-muted-foreground mb-1">Regime tributário</div>
              <select
                value={fiscal.regime_tributario}
                onChange={(e) => setFiscal((f) => ({ ...f, regime_tributario: e.target.value as "1" | "2" | "3" }))}
                className="input"
              >
                <option value="1">Simples Nacional</option>
                <option value="2">Lucro Presumido</option>
                <option value="3">Lucro Real</option>
              </select>
            </label>
            <div className="text-[11px] text-muted-foreground bg-secondary rounded-md p-2.5 leading-relaxed">
              NCM padrão: 94036000 (móveis de madeira) · CFOP 5102 (venda interna).<br/>
              O CNPJ e o certificado digital devem estar configurados na conta Focus NFe.
            </div>
          </div>

          {/* Asaas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="size-3.5 text-muted-foreground" />
              <div className="text-[11.5px] font-medium text-muted-foreground uppercase tracking-wider">Boleto / PIX — Asaas</div>
            </div>

            <TutorialBox titulo="O que é e como configurar boleto e PIX?">
              <p className="text-muted-foreground leading-relaxed">
                O <strong className="text-foreground">Asaas</strong> é uma fintech brasileira que permite gerar cobranças (boleto, PIX, cartão) diretamente pelo Planne.
                Quando um orçamento é aprovado, você pode enviar o link de pagamento ao cliente sem precisar acessar outro sistema.
              </p>
              <div className="font-semibold text-foreground pt-1">Como configurar:</div>
              <Passo n={1}>
                Acesse{" "}
                <a href="https://asaas.com" target="_blank" rel="noopener" className="text-blue-600 underline inline-flex items-center gap-0.5">
                  asaas.com <ExternalLink className="size-2.5" />
                </a>{" "}
                e crie uma conta gratuita (sem mensalidade — Asaas cobra apenas por transação).
              </Passo>
              <Passo n={2}>
                Complete o cadastro com CNPJ ou CPF e aguarde a aprovação da conta (geralmente em minutos).
              </Passo>
              <Passo n={3}>
                No painel Asaas, vá em <strong>Minha Conta → Integrações → API</strong> e copie o <code className="bg-secondary px-1 rounded">access_token</code>.
              </Passo>
              <Passo n={4}>
                Cole o token no campo abaixo. Use <strong>Sandbox</strong> para testar sem movimentar dinheiro real.
              </Passo>
              <Passo n={5}>
                Para receber confirmações de pagamento automáticas, configure o webhook no painel Asaas em{" "}
                <strong>Configurações → Webhooks</strong>, apontando para a URL abaixo:
                <code className="block mt-1 bg-secondary px-2 py-1 rounded text-[11px] break-all">https://seu-dominio.vercel.app/api/webhook-asaas</code>
              </Passo>
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-2 text-[11.5px] text-green-800 dark:text-green-300 leading-relaxed">
                <strong>Gratuito para começar:</strong> Asaas não cobra mensalidade. A taxa por boleto pago é de cerca de R$ 1,99 e PIX é gratuito.
              </div>
            </TutorialBox>

            <label className="block">
              <div className="text-[11.5px] text-muted-foreground mb-1">API Key (access_token)</div>
              <input
                type={showTokens ? "text" : "password"}
                value={fiscal.asaas_token}
                onChange={(e) => setFiscal((f) => ({ ...f, asaas_token: e.target.value }))}
                placeholder="$aact_... (painel.asaas.com)"
                className="input font-mono text-[12px]"
              />
            </label>
            <label className="block">
              <div className="text-[11.5px] text-muted-foreground mb-1">Ambiente</div>
              <select
                value={fiscal.asaas_ambiente}
                onChange={(e) => setFiscal((f) => ({ ...f, asaas_ambiente: e.target.value as "sandbox" | "producao" }))}
                className="input"
              >
                <option value="sandbox">Sandbox (testes)</option>
                <option value="producao">Produção</option>
              </select>
            </label>
            <div className="text-[11px] text-muted-foreground bg-secondary rounded-md p-2.5 leading-relaxed">
              Para receber notificações de pagamento automáticas, configure o webhook no painel Asaas:<br/>
              <span className="font-mono">https://seu-dominio.vercel.app/api/webhook-asaas</span>
            </div>
          </div>
        </div>
      </Surface>

      {/* Plantas Baixas */}
      <Surface className="mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Map className="size-3.5 text-muted-foreground" />
          <div className="text-[12.5px] font-semibold">Plantas Baixas dos Ambientes</div>
        </div>
        <p className="text-[12px] text-muted-foreground mb-4">
          Envie a planta baixa de cada ambiente (sala, cozinha, quarto…). A IA extrai paredes, dimensões, portas e janelas automaticamente para usar nos orçamentos.
        </p>

        {/* Adicionar ambiente */}
        <div className="flex gap-2 mb-5">
          <input
            value={novoAmbiente}
            onChange={(e) => setNovoAmbiente(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && novoAmbiente.trim() && !plantas[novoAmbiente.trim()]) {
                setPlantas((p) => ({ ...p, [novoAmbiente.trim()]: { nome: novoAmbiente.trim(), paredes: [], largura_cm: 0, profundidade_cm: 0, altura_cm: 0 } }));
                setNovoAmbiente("");
              }
            }}
            placeholder="Nome do ambiente (ex: Cozinha, Sala de estar)"
            className="flex-1 h-8 rounded-md border border-border bg-surface-2 px-2.5 text-[12.5px] outline-none focus:border-border-strong"
          />
          <button
            type="button"
            onClick={() => {
              const nome = novoAmbiente.trim();
              if (!nome || plantas[nome]) return;
              setPlantas((p) => ({ ...p, [nome]: { nome, paredes: [], largura_cm: 0, profundidade_cm: 0, altura_cm: 0 } }));
              setNovoAmbiente("");
            }}
            className="h-8 px-3 rounded-md border border-border text-[12.5px] hover:bg-secondary shrink-0 transition-colors"
          >
            Adicionar
          </button>
        </div>

        {Object.keys(plantas).length === 0 && (
          <div className="text-[12px] text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
            Nenhum ambiente cadastrado. Adicione um nome acima para começar.
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(plantas).map(([amb, planta]) => {
            const analisando = plantaAnalisando === amb;
            const temDados = planta.largura_cm > 0 || planta.profundidade_cm > 0;
            return (
              <div key={amb} className="border border-border rounded-lg overflow-hidden">
                {/* Cabeçalho do ambiente */}
                <div className="flex items-center justify-between px-4 py-3 bg-surface-2">
                  <div className="flex items-center gap-2">
                    <Map className="size-3.5 text-muted-foreground" />
                    <span className="text-[13px] font-medium">{amb}</span>
                    {temDados && (
                      <span className="text-[11px] text-muted-foreground">
                        {planta.largura_cm}×{planta.profundidade_cm} cm · {planta.altura_cm > 0 ? `h: ${planta.altura_cm} cm` : ""}
                      </span>
                    )}
                    {planta.analisado_em && (
                      <span className="text-[10.5px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                        analisado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const inp = document.getElementById(`planta-upload-${amb}`) as HTMLInputElement;
                        inp?.click();
                      }}
                      disabled={analisando}
                      className="h-7 px-2.5 rounded-md border border-border text-[12px] hover:bg-secondary inline-flex items-center gap-1.5 disabled:opacity-60 transition-colors"
                    >
                      {analisando
                        ? <><Loader2 className="size-3 animate-spin" /> Analisando…</>
                        : <><Upload className="size-3" /> {temDados ? "Atualizar planta" : "Enviar planta"}</>}
                    </button>
                    <input
                      id={`planta-upload-${amb}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAnalisarPlanta(amb, file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoverPlanta(amb)}
                      className="size-7 rounded-md border border-border text-muted-foreground hover:text-red-500 hover:border-red-300 grid place-items-center transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Dados analisados */}
                {temDados && (
                  <div className="px-4 py-3 space-y-3">
                    {/* Paredes */}
                    {planta.paredes?.length > 0 && (
                      <div>
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Paredes</div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                          {planta.paredes.map((p) => (
                            <div key={p.id} className="bg-surface-2 rounded-md p-2 text-[11.5px]">
                              <div className="font-medium">{p.descricao || p.lado}</div>
                              <div className="text-muted-foreground">{p.largura_cm} cm útil</div>
                              {p.obstaculos && <div className="text-[10.5px] text-amber-600 mt-0.5">{p.obstaculos}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Porta + Janelas */}
                    <div className="flex flex-wrap gap-2">
                      {planta.porta_principal && (
                        <div className="bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-md px-2.5 py-1.5 text-[11.5px]">
                          Porta principal · parede {planta.porta_principal.parede} · {planta.porta_principal.largura_cm} cm
                        </div>
                      )}
                      {planta.janelas?.map((j, i) => (
                        <div key={i} className="bg-sky-500/10 text-sky-700 dark:text-sky-400 rounded-md px-2.5 py-1.5 text-[11.5px]">
                          Janela {i + 1} · parede {j.parede} · {j.largura_cm} cm{j.descricao ? ` · ${j.descricao}` : ""}
                        </div>
                      ))}
                    </div>

                    {/* Observações */}
                    {planta.observacoes && (
                      <div className="text-[11.5px] text-muted-foreground bg-secondary rounded-md px-3 py-2">
                        {planta.observacoes}
                      </div>
                    )}
                  </div>
                )}

                {!temDados && (
                  <div className="px-4 py-4 text-[12px] text-muted-foreground text-center">
                    Envie uma foto ou imagem da planta baixa para analisar automaticamente.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Surface>

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
