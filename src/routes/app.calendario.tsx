import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Surface, Pill } from "@/components/planne/primitives";
import { ChevronLeft, ChevronRight, Loader2, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { getEmpresaAtual, getOrcamentos, getProjetos } from "@/lib/db";

export const Route = createFileRoute("/app/calendario")({
  component: Calendario,
});

type Event = {
  id: string;
  title: string;
  date: Date;
  type: "orcamento" | "projeto";
  status: string;
};

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const TYPE_TONE: Record<string, "amber"|"green"|"blue"|"neutral"> = {
  aprovado: "green", analise: "amber", rascunho: "neutral",
  em_andamento: "blue", concluido: "green", cancelado: "neutral",
};

function Calendario() {
  const [today] = useState(new Date());
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Date | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const empresa = await getEmpresaAtual();
        if (!empresa) return;
        const eid = (empresa as { id: string }).id;
        const [orcs, projs] = await Promise.all([getOrcamentos(eid), getProjetos(eid)]);

        const evs: Event[] = [
          ...(orcs as { id: string; numero: string | null; status: string; created_at: string; clientes: { nome: string } | null }[]).map((o) => ({
            id: o.id,
            title: `Orç ${o.numero ?? "—"} · ${o.clientes?.nome ?? "—"}`,
            date: new Date(o.created_at),
            type: "orcamento" as const,
            status: o.status,
          })),
          ...(projs as { id: string; nome: string; status: string; created_at: string }[]).map((p) => ({
            id: p.id,
            title: p.nome,
            date: new Date(p.created_at),
            type: "projeto" as const,
            status: p.status,
          })),
        ];
        setEvents(evs);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

  return (
    <>
      <PageHeader eyebrow="Agenda" title="Calendário" description="Orçamentos e projetos ao longo do tempo." />

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
                                ev.type === "orcamento" ? "bg-blue-500/12 text-blue-600 dark:text-blue-400" : "bg-violet-500/12 text-violet-600 dark:text-violet-400"
                              }`}
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
              {selected && selectedEvents.length === 0 && (
                <div className="text-[12.5px] text-muted-foreground">Sem eventos neste dia.</div>
              )}
              <div className="space-y-2">
                {selectedEvents.map((ev) => (
                  <div key={ev.id} className="rounded-md border border-border p-2.5">
                    <div className="text-[12.5px] font-medium truncate">{ev.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10.5px] rounded-sm px-1.5 py-0.5 font-medium ${ev.type === "orcamento" ? "bg-blue-500/10 text-blue-600" : "bg-violet-500/10 text-violet-600"}`}>
                        {ev.type === "orcamento" ? "Orçamento" : "Projeto"}
                      </span>
                      <Pill tone={TYPE_TONE[ev.status] ?? "neutral"}>{ev.status}</Pill>
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
