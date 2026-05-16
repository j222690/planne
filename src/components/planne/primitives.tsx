import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-border mb-6", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground mb-1.5 font-medium">
            {eyebrow}
          </div>
        )}
        <h1 className="text-[22px] md:text-[26px] font-semibold tracking-tight leading-tight">{title}</h1>
        {description && (
          <p className="mt-1.5 text-[13.5px] text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Surface({
  className,
  children,
  padded = true,
}: {
  className?: string;
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface",
        padded && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string;
  delta?: { value: string; positive?: boolean };
  hint?: string;
}) {
  return (
    <Surface padded={false} className="p-5">
      <div className="text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground font-medium">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-[26px] font-semibold tracking-tight num">{value}</div>
        {delta && (
          <span
            className={cn(
              "text-[11.5px] font-medium px-1.5 py-0.5 rounded-sm border",
              delta.positive
                ? "text-success border-success/20 bg-success/5"
                : "text-destructive border-destructive/20 bg-destructive/5",
            )}
          >
            {delta.positive ? "▲" : "▼"} {delta.value}
          </span>
        )}
      </div>
      {hint && <div className="mt-1 text-[12px] text-muted-foreground">{hint}</div>}
    </Surface>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "blue" | "green" | "amber" | "red";
}) {
  const map: Record<string, string> = {
    neutral: "bg-secondary text-secondary-foreground border-border",
    blue: "bg-accent/10 text-accent border-accent/20",
    green: "bg-success/10 text-success border-success/20",
    amber: "bg-warning/10 text-warning border-warning/20",
    red: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium", map[tone])}>
      {children}
    </span>
  );
}
