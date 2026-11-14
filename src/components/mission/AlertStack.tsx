import { BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALERT_LABEL, type Alert } from "@/lib/mission";
import { LEVEL_SOFT, LEVEL_TEXT, LevelIcon } from "./kit";

export function AlertStack({
  alerts,
  suppressed,
  criticalPhase,
}: {
  alerts: Alert[];
  suppressed: Alert[];
  criticalPhase: boolean;
}) {
  return (
    <div className="grid gap-2" aria-live="polite">
      {alerts.map((a) => (
        <div
          key={a.id}
          role={a.level === "emergency" || a.level === "warning" ? "alert" : "status"}
          className={cn(
            "flex items-center gap-3 rounded-lg border px-3 py-2.5 animate-in fade-in slide-in-from-top-1",
            LEVEL_SOFT[a.level],
            a.level === "emergency" && "animate-emergency",
          )}
        >
          <LevelIcon level={a.level} className="size-6 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className={cn("label-caps font-bold", LEVEL_TEXT[a.level])}>{ALERT_LABEL[a.level]}</span>
              <span className="text-sm font-semibold">{a.title}</span>
            </p>
            <p className="telemetry truncate text-xs text-muted-foreground">
              {a.detail} · {a.source}
            </p>
          </div>
        </div>
      ))}
      {suppressed.length > 0 && (
        <p className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          <BellOff className="size-3.5" />
          {suppressed.length} alerta(s) Caution/Advisory silenciadas ·{" "}
          {criticalPhase ? "Fase Crítica activa" : "Emergencia en curso"}
        </p>
      )}
    </div>
  );
}
