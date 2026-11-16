import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MissionSim } from "@/hooks/use-mission-sim";

const PHASES = [
  { id: "microgravity-entry", label: "ENTRADA EN MICROGRAVEDAD" },
  { id: "in-flight-adaptation", label: "ADAPTACIÓN DURANTE EL VUELO" },
  { id: "return", label: "RETORNO" },
] as const;

const MISSION_DAY = 142;
const MISSION_DURATION = 180;

export function MissionOverview({ sim }: { sim: MissionSim }) {
  return (
    <section
      className="block-hmi block-frame grid gap-3 p-3 sm:p-4"
      aria-label="Estado longitudinal de la misión"
    >
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="label-caps text-muted-foreground">
            MOMENTOS DE CAMBIO FISIOLÓGICOS
          </h2>
          {sim.criticalPhase && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emergency/50 bg-emergency/10 px-2.5 py-1 text-[0.65rem] font-semibold text-emergency">
              <AlertTriangle className="size-3.5" />
              FASE CRÍTICA ACTIVA
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {PHASES.map((phase) => {
            const active = sim.missionPhase === phase.id;
            return (
              <button
                key={phase.id}
                type="button"
                aria-pressed={active}
                onClick={() => sim.setMissionPhase(phase.id)}
                className={cn(
                  "flex min-h-12 items-center justify-center rounded-lg border px-1.5 text-center text-[0.68rem] font-semibold leading-tight transition-colors sm:px-3 sm:text-xs",
                  active
                    ? "border-hmi/70 bg-hmi/15 text-hmi shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--hmi)_20%,transparent)]"
                    : "border-border bg-background/30 text-muted-foreground hover:bg-background/60 hover:text-foreground",
                )}
              >
                {phase.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-hairline pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="label-caps text-muted-foreground">VISTA LONGITUDINAL DE LA MISIÓN</h2>
          <span className="telemetry shrink-0 text-xs font-semibold text-hmi">
            Día {MISSION_DAY} / {MISSION_DURATION}
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Progreso de la misión"
          aria-valuemin={0}
          aria-valuemax={MISSION_DURATION}
          aria-valuenow={MISSION_DAY}
        >
          <div
            className="h-full rounded-full bg-hmi transition-[width]"
            style={{ width: `${(MISSION_DAY / MISSION_DURATION) * 100}%` }}
          />
        </div>
        <div className="mt-2 grid grid-cols-4 items-start text-[0.64rem] text-muted-foreground sm:text-xs">
          <span className="text-left">Lanzamiento</span>
          <span className="text-center">EVA #3 · D128</span>
          <span className="text-center">Hoy · D{MISSION_DAY}</span>
          <span className="text-right">Retorno</span>
        </div>
      </div>
    </section>
  );
}
