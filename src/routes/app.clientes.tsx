import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface } from "@/components/planne/primitives";
import { Plus, Mail, Phone, MoreHorizontal, Search, Loader2, AlertCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getClientes, getEmpresaAtual, upsertCliente } from "@/lib/db";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/app/clientes")({
  component: Clientes,
});

type Cliente = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  origem: string | null;
  cidade: string | null;
  observacoes: string | null;
};

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido").or(z.literal("")).optional(),
  telefone: z.string().optional(),
  cidade: z.string().optional(),
  origem: z.string().optional(),
  observacoes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const origens = ["Indicação", "Instagram", "Google", "Facebook", "Direto", "Arquiteto parceiro", "Outro"];

function ClienteModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const empresa = await getEmpresaAtual();
      if (!empresa) throw new Error("Empresa não encontrada");
      await upsertCliente(empresa.id, data);
      toast.success("Cliente cadastrado com sucesso!");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar cliente");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-lg bg-surface border border-border rounded-lg shadow-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-[15px] font-semibold">Novo cliente</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Preencha os dados do cliente</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome completo / Razão social *</Label>
              <Input {...register("nome")} placeholder="Família Mendes" error={errors.nome?.message} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input {...register("email")} type="email" placeholder="contato@email.com" error={errors.email?.message} />
            </div>
            <div>
              <Label>Telefone / WhatsApp</Label>
              <Input {...register("telefone")} placeholder="+55 49 99999-9999" />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input {...register("cidade")} placeholder="Chapecó" />
            </div>
            <div>
              <Label>Como nos conheceu</Label>
              <select
                {...register("origem")}
                className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong text-foreground"
              >
                <option value="">Selecione...</option>
                {origens.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <Label>Observações</Label>
              <textarea
                {...register("observacoes")}
                rows={2}
                placeholder="Preferências, restrições, referências..."
                className="w-full rounded-md border border-border bg-surface-2 px-2.5 py-2 text-[13px] outline-none focus:border-border-strong resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-md border border-border text-[13px] hover:bg-secondary transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Salvar cliente
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const empresa = await getEmpresaAtual();
      if (!empresa) throw new Error("Empresa não encontrada");
      const data = await getClientes(empresa.id);
      setClientes(data as Cliente[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = clientes.filter((c) =>
    search === "" ||
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.cidade ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.origem ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <AnimatePresence>
        {showModal && <ClienteModal onClose={() => setShowModal(false)} onSaved={load} />}
      </AnimatePresence>

      <PageHeader
        eyebrow="CRM"
        title="Clientes"
        description="Histórico unificado de clientes, projetos, comunicações e financeiro."
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <Plus className="size-3.5" /> Novo cliente
          </button>
        }
      />

      <Surface padded={false}>
        <div className="border-b border-border p-3 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full h-8 pl-8 pr-3 rounded-md border border-border bg-surface-2 text-[13px] outline-none focus:border-border-strong"
            />
          </div>
          {!loading && <div className="ml-auto text-[12px] text-muted-foreground">{filtered.length} clientes</div>}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-[13px]">
            <Loader2 className="size-4 animate-spin" /> Carregando...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 gap-2 text-destructive text-[13px]">
            <AlertCircle className="size-4" /> {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[560px]">
              <thead className="text-[11.5px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left font-medium px-5 py-2.5">Cliente</th>
                  <th className="text-left font-medium px-5 py-2.5">Contato</th>
                  <th className="text-left font-medium px-5 py-2.5">Cidade</th>
                  <th className="text-left font-medium px-5 py-2.5">Origem</th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                      {clientes.length === 0
                        ? <span>Nenhum cliente ainda. <button onClick={() => setShowModal(true)} className="text-foreground underline">Cadastrar primeiro cliente →</button></span>
                        : "Nenhum resultado encontrado."}
                    </td>
                  </tr>
                ) : filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/40 cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-md bg-secondary text-foreground/70 grid place-items-center text-[11.5px] font-semibold shrink-0">
                          {c.nome.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                        </div>
                        <div className="font-medium truncate max-w-[180px]">{c.nome}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                          <Mail className="size-3 shrink-0" /><span className="truncate max-w-[160px]">{c.email}</span>
                        </a>
                      )}
                      {c.telefone && (
                        <a href={`tel:${c.telefone}`} className="flex items-center gap-1.5 mt-0.5 hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                          <Phone className="size-3 shrink-0" />{c.telefone}
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{c.cidade ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{c.origem ?? "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <button className="text-muted-foreground hover:text-foreground" aria-label="Mais opções">
                        <MoreHorizontal className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11.5px] text-muted-foreground mb-1">{children}</div>;
}
function Input({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <input
        {...props}
        className="w-full h-9 rounded-md border border-border bg-surface-2 px-2.5 text-[13px] outline-none focus:border-border-strong transition-colors"
      />
      {error && <div className="text-[11px] text-destructive mt-1">{error}</div>}
    </div>
  );
}
