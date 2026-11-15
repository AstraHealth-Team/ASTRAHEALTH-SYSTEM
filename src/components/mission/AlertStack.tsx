import { BellOff, Download, RotateCcw, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALERT_LABEL, SCENARIOS, type Alert, type ScenarioId } from "@/lib/mission";
import {
  buildReport,
  LEVEL_NAME,
  RECOMMENDATIONS,
  TRIAGE_META,
  TRIAGE_SYSTEMS,
  type TriageSystem,
} from "@/lib/triage";
import type { Triage } from "@/hooks/use-triage";
import { LEVEL_SOFT, LEVEL_TEXT, LevelIcon } from "./kit";

const SYSTEMS: TriageSystem[] = ["neuro", "cardio", "resp"];

export function AlertStack({
  alerts,
  suppressed,
  criticalPhase,
  triage,
  mission,
}: {
  alerts: Alert[];
  suppressed: Alert[];
  criticalPhase: boolean;
  triage: Triage;
  mission: ScenarioId;
}) {
  const downloadReport = () => {
    const report = buildReport({
      state: triage.systems,
      transcript: triage.transcript,
      history: triage.history,
      now: new Date(),
      mission: SCENARIOS[mission].title,
    });
    const url = URL.createObjectURL(new Blob([report], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-clinico-astra-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="grid gap-3" aria-live="polite">
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
              <span className={cn("label-caps font-bold", LEVEL_TEXT[a.level])}>
                {ALERT_LABEL[a.level]}
              </span>
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

      <section className="panel grid gap-4 p-4" aria-label="Consola clínica de notificaciones">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="label-caps flex items-center gap-2 text-foreground">
            <Stethoscope className="size-4 text-hmi" />
            CONSOLA – MODO NOTIFICACIONES
          </h2>
          <button
            type="button"
            onClick={downloadReport}
            className="flex min-h-10 items-center gap-2 rounded-lg border border-hmi/50 bg-hmi/10 px-3 text-xs font-semibold text-hmi transition-colors hover:bg-hmi/20"
          >
            <Download className="size-4" />
            Generar Reporte Clínico
          </button>
        </header>

        <div className="grid gap-2 md:grid-cols-3">
          {TRIAGE_SYSTEMS.map((system) => {
            const assessment = triage.systems[system];
            const badgeTone =
              assessment.level === "red"
                ? "emergency"
                : assessment.level === "yellow"
                  ? "warning"
                  : "nominal";
            return (
              <article key={system} className={cn("rounded-lg border p-3", LEVEL_SOFT[badgeTone])}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{TRIAGE_META[system].title}</h3>
                  <span
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-[0.65rem] font-bold",
                      LEVEL_TEXT[badgeTone],
                    )}
                  >
                    {LEVEL_NAME[assessment.level]}
                  </span>
                </div>
                <p className="mt-1 min-h-10 text-xs leading-relaxed text-muted-foreground">
                  {assessment.finding}
                </p>
                <button
                  type="button"
                  onClick={() => triage.simulate(system)}
                  className="mt-2 min-h-9 w-full rounded-md border border-border bg-background/40 px-2 text-xs font-medium hover:border-hmi/50 hover:text-hmi"
                >
                  Probar {TRIAGE_META[system].title}
                </button>
              </article>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="label-caps mb-2 text-muted-foreground">
              Recomendaciones clínicas activas
            </h3>
            <div className="grid gap-2">
              {SYSTEMS.map((system) => {
                const assessment = triage.systems[system];
                return (
                  <div
                    key={system}
                    className="rounded-lg border border-hairline bg-background/30 p-3"
                  >
                    <p className="mb-1 text-xs font-semibold">
                      {TRIAGE_META[system].title} · {LEVEL_NAME[assessment.level]}
                    </p>
                    <ul className="grid gap-1 text-xs leading-relaxed text-muted-foreground">
                      {RECOMMENDATIONS[system][assessment.level].map((recommendation) => (
                        <li key={recommendation}>• {recommendation}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid content-start gap-3">
            <div>
              <h3 className="label-caps mb-2 text-muted-foreground">Historial de cambios</h3>
              {triage.history.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
                  Sin cambios registrados; telemetría nominal.
                </p>
              ) : (
                <ol className="grid max-h-52 gap-1 overflow-y-auto pr-1">
                  {triage.history.slice(0, 10).map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-start gap-2 rounded-md bg-background/30 px-2 py-1.5 text-xs"
                    >
                      <span
                        className={cn(
                          "mt-0.5 size-2 shrink-0 rounded-full",
                          entry.level === "red"
                            ? "bg-emergency"
                            : entry.level === "yellow"
                              ? "bg-warning"
                              : "bg-nominal",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="font-semibold">{TRIAGE_META[entry.system].title}</span> ·{" "}
                        {LEVEL_NAME[entry.level]} — {entry.finding}
                      </span>
                      <time className="telemetry shrink-0 text-[0.65rem] text-muted-foreground">
                        {new Date(entry.at).toLocaleTimeString("es", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={triage.resetAll}
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-nominal/50 bg-nominal/10 px-3 text-xs font-semibold text-nominal transition-colors hover:bg-nominal/20 sm:col-span-2"
              >
                <RotateCcw className="size-4" />
                Restablecer Todo a Verde
              </button>
            </div>
            <p className="text-[0.68rem] leading-relaxed text-muted-foreground">
              Reporte descargable con fecha/hora, estado por sistema, recomendaciones, historial y
              transcripción de la consulta.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
