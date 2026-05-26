import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import { ChevronLeft, ChevronRight, Loader2, Calendar, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { getEmpresaAtual, getOrcamentos, getProjetos, getCalendarioEventos, createCalendarioEvento, deleteCalendarioEvento } from "@/lib/db";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/app/calendario")({
  component: Calendario,
});

type Event = {
  id: string;
  title: string;
  date: Date;
  type: "orcamento" | "projeto" | "evento";
  status: string;
  cor?: string;
};

type CalEvento = {
  id: string; titulo: string; descricao: string | null;
  data_inicio: string; data_fim: string | null;
  tipo: string; cor: string | null; created_at: string;
};

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const TYPE_TONE: Record<string, "amber"|"green"|"blue"|"neutral"> = {
  aprovado: "green", analise: "amber", rascunho: "neutral",
  em_andamento: "blue", concluido: "green", cancelado: "neutral",
  evento: "blue", reuniao: "amber", visita: "green", prazo: "neutral",
};

const TIPO_COR: Record<string, string> = {
  evento: "#3b82f6",
  reuniao: "#f59e0b",
  visita: "#10b981",
  prazo: "#ef4444",
};

function NovoEventoModal({ empresaId, diaInicial, onClose, onSaved }: {
  empresaId: string; diaInicial: Date; onClose: () => void; onSaved: () => void;
}) {
  const toLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}T09:00`;
  };

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    data_inicio: toLocal(diaInicial),
    data_fim: "",
    tipo: "evento",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error("Título obrigatório"); return; }
    setSaving(true);
    try {
      await createCalendarioEvento(empresaId, {
        titulo: form.titulo,
        descricao: form.descricao || null,
        data_inicio: new Date(form.data_inicio).toISOString(),
        data_fim: form.data_fim ? new Date(form.data_fim).toISOString() : null,
        tipo: form.tipo,
        cor: TIPO_COR[form.tipo] ?? "#3b82f6",
      });
      toast.success("Evento criado!");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar evento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.15 }}
        className="relative w-full max-w-md bg-surface border border-border rounded-lg shadow-xl p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Novo evento</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>

        <label className="block">
          <div className="text-[11.5px] text-muted-foreground mb-1">Título *</div>
          <input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            placeholder="Ex: Reunião com cliente" className="input" autoFocus />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <div className="text-[11.5px] text-muted-foreground mb-1">Tipo</div>
            <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} className="input">
              <option value="evento">Evento</option>
              <option value="reuniao">Reunião</option>
              <option value="visita">Visita técnica</option>
              <option value="prazo">Prazo/Entrega</option>
            </select>
          </label>
          <label className="block">
            <div className="text-[11.5px] text-muted-foreground mb-1">Início</div>
            <input type="datetime-local" value={form.data_inicio}
              onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))} className="input" />
          </label>
        </div>

        <label className="block">
          <div className="text-[11.5px] text-muted-foreground mb-1">Fim (opcional)</div>
          <input type="datetime-local" value={form.data_fim}
            onChange={(e) => setForm((f) => ({ ...f, data_fim: e.target.value }))} className="input" />
        </label>

        <label className="block">
          <div className="text-[11.5px] text-muted-foreground mb-1">Descrição</div>
          <textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            rows={2} className="input h-auto resize-none py-2" placeholder="Detalhes do evento..." />
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="h-8 px-4 rounded-md border border-border text-[12.5px] hover:bg-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="h-8 px-4 rounded-md bg-foreground text-background text-[12.5px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-1.5">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : null} Criar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Calendario() {
  const [today] = useState(new Date());
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Date | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalDia, setModalDia] = useState<Date>(new Date());

  const load = async () => {
    try {
      const empresa = await getEmpresaAtual();
      if (!empresa) return;
      const eid = (empresa as { id: string }).id;
      setEmpresaId(eid);

      const [orcs, projs, evts] = await Promise.all([
        getOrcamentos(eid),
        getProjetos(eid),
        getCalendarioEventos(eid).catch(() => [] as CalEvento[]),
      ]);

      type OrcRow = { id: string; numero: string | null; status: string; created_at: string; clientes: { nome: string } | null };
      type ProjRow = { id: string; nome: string; status: string; created_at: string };
      const evs: Event[] = [
        ...(orcs as unknown as OrcRow[]).map((o) => ({
          id: o.id,
          title: `Orç ${o.numero ?? "—"} · ${o.clientes?.nome ?? "—"}`,
          date: new Date(o.created_at),
          type: "orcamento" as const,
          status: o.status,
        })),
        ...(projs as unknown as ProjRow[]).map((p) => ({
          id: p.id,
          title: p.nome,
          date: new Date(p.created_at),
          type: "projeto" as const,
          status: p.status,
        })),
        ...(evts as CalEvento[]).map((e) => ({
          id: e.id,
          title: e.titulo,
          date: new Date(e.data_inicio),
          type: "evento" as const,
          status: e.tipo,
          cor: e.cor ?? TIPO_COR[e.tipo] ?? "#3b82f6",
        })),
      ];
      setEvents(evs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 });

  const eventsOnDay = (day: number) =>
    events.filter((e) => e.date.getFullYear() === year && e.date.getMonth() === month && e.date.getDate() === day);

  const selectedEvents = selected
    ? events.filter((e) =>
        e.date.getFullYear() === selected.getFullYear() &&
        e.date.getMonth() === selected.getMonth() &&
        e.date.getDate() === selected.getDate()
      )
    : [];

  const prev = () => setCurrent(new Date(year, month - 1, 1));
  const next = () => setCurrent(new Date(year, month + 1, 1));

  const handleDeleteEvento = async (id: string) => {
    try {
      await deleteCalendarioEvento(id);
      toast.success("Evento excluído");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir evento");
    }
  };

  const openModal = (dia: Date) => {
    setModalDia(dia);
    setShowModal(true);
  };

  return (
    <>
      <AnimatePresence>
        {showModal && empresaId && (
          <NovoEventoModal
            empresaId={empresaId}
            diaInicial={modalDia}
            onClose={() => setShowModal(false)}
            onSaved={() => { load(); }}
          />
        )}
      </AnimatePresence>

      <PageHeader
        eyebrow="Agenda"
        title="Calendário"
        description="Orçamentos, projetos e eventos ao longo do tempo."
        actions={
          <button
            onClick={() => openModal(new Date())}
            className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <Plus className="size-3.5" /> Novo evento
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando...
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_280px] gap-4">
          <Surface padded={false}>
            {/* Nav */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <button onClick={prev} className="size-8 grid place-items-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-[14px] font-semibold">{MONTHS[month]} {year}</span>
              <button onClick={next} className="size-8 grid place-items-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Grid header */}
            <div className="grid grid-cols-7 border-b border-border">
              {DAYS.map((d) => (
                <div key={d} className="px-2 py-2 text-center text-[11.5px] font-medium text-muted-foreground uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid cells */}
            <div className="grid grid-cols-7">
              {cells.map((_, i) => {
                const day = i - firstDay + 1;
                const isValid = day >= 1 && day <= daysInMonth;
                const isToday = isValid && day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const isSelected = isValid && selected?.getDate() === day && selected?.getMonth() === month && selected?.getFullYear() === year;
                const dayEvs = isValid ? eventsOnDay(day) : [];

                return (
                  <div
                    key={i}
                    onClick={() => isValid && setSelected(new Date(year, month, day))}
                    onDoubleClick={() => isValid && openModal(new Date(year, month, day))}
                    className={`min-h-[80px] p-1.5 border-b border-r border-border cursor-pointer transition-colors
                      ${isValid ? "hover:bg-secondary/40" : "bg-surface-2/40"}
                      ${isSelected ? "bg-accent/8 border-accent/30" : ""}
                      ${i % 7 === 6 ? "border-r-0" : ""}
                    `}
                  >
                    {isValid && (
                      <>
                        <div className={`text-[12.5px] font-medium w-6 h-6 rounded-full grid place-items-center mb-1 ${
                          isToday ? "bg-accent text-white" : "text-foreground"
                        }`}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvs.slice(0, 2).map((ev) => (
                            <div
                              key={ev.id}
                              className={`text-[10.5px] truncate rounded px-1 py-0.5 ${
                                ev.type === "orcamento"
                                  ? "bg-blue-500/12 text-blue-600 dark:text-blue-400"
                                  : ev.type === "projeto"
                                  ? "bg-violet-500/12 text-violet-600 dark:text-violet-400"
                                  : "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                              }`}
                              style={ev.type === "evento" && ev.cor ? { backgroundColor: ev.cor + "22", color: ev.cor } : undefined}
                            >
                              {ev.title}
                            </div>
                          ))}
                          {dayEvs.length > 2 && (
                            <div className="text-[10px] text-muted-foreground pl-1">+{dayEvs.length - 2} mais</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </Surface>

          {/* Side panel */}
          <div className="space-y-3">
            <Surface>
              <div className="text-[12.5px] font-semibold mb-3 flex items-center gap-2">
                <Calendar className="size-3.5 text-muted-foreground" />
                {selected
                  ? selected.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
                  : "Selecione um dia"}
              </div>
              {selected && (
                <button
                  onClick={() => openModal(selected)}
                  className="mb-3 w-full h-8 rounded-md border border-dashed border-border text-[12px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Plus className="size-3.5" /> Novo evento neste dia
                </button>
              )}
              {selected && selectedEvents.length === 0 && (
                <div className="text-[12.5px] text-muted-foreground">Sem eventos neste dia.</div>
              )}
              <div className="space-y-2">
                {selectedEvents.map((ev) => (
                  <div key={ev.id} className="rounded-md border border-border p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[12.5px] font-medium truncate">{ev.title}</div>
                      {ev.type === "evento" && (
                        <button
                          onClick={() => handleDeleteEvento(ev.id)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10.5px] rounded-sm px-1.5 py-0.5 font-medium ${
                        ev.type === "orcamento" ? "bg-blue-500/10 text-blue-600"
                        : ev.type === "projeto" ? "bg-violet-500/10 text-violet-600"
                        : "bg-emerald-500/10 text-emerald-600"
                      }`}>
                        {ev.type === "orcamento" ? "Orçamento" : ev.type === "projeto" ? "Projeto" : ev.status}
                      </span>
                      {ev.type !== "evento" && (
                        <Pill tone={TYPE_TONE[ev.status] ?? "neutral"}>{ev.status}</Pill>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface>
              <div className="text-[12.5px] font-semibold mb-3">Próximos 7 dias</div>
              <div className="space-y-2">
                {events
                  .filter((e) => {
                    const diff = (e.date.getTime() - today.getTime()) / 86400000;
                    return diff >= 0 && diff <= 7;
                  })
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .slice(0, 5)
                  .map((ev) => (
                    <div key={ev.id} className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
                      <div className="text-[10.5px] text-muted-foreground shrink-0 mt-0.5 w-14">
                        {ev.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </div>
                      <div className="text-[12px] truncate">{ev.title}</div>
                    </div>
                  ))}
                {events.filter((e) => {
                  const diff = (e.date.getTime() - today.getTime()) / 86400000;
                  return diff >= 0 && diff <= 7;
                }).length === 0 && (
                  <div className="text-[12.5px] text-muted-foreground">Sem eventos próximos.</div>
                )}
              </div>
            </Surface>
          </div>
        </div>
      )}
    </>
  );
}
