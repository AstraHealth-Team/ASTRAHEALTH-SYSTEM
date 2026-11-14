import { Activity, Radio, Sun, Sunrise } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  MARS_LATENCY_MAX,
  MARS_LATENCY_MIN,
  PROFILE_META,
  SCENARIOS,
  type MissionProfile,
  type ScenarioId,
} from "@/lib/mission";
import type { MissionSim } from "@/hooks/use-mission-sim";

const PROFILES: MissionProfile[] = ["leo", "lunar", "mars"];
const SCENARIO_ICON: Record<ScenarioId, typeof Sun> = { nominal: Sunrise, eva: Activity, spe: Sun };
const SCENARIO_TONE: Record<ScenarioId, string> = {
  nominal: "data-[active=true]:border-nominal data-[active=true]:bg-nominal/12 data-[active=true]:text-nominal",
  eva: "data-[active=true]:border-warning data-[active=true]:bg-warning/12 data-[active=true]:text-warning",
  spe: "data-[active=true]:border-emergency data-[active=true]:bg-emergency/12 data-[active=true]:text-emergency",
};

export function SimulatorBar({ sim }: { sim: MissionSim }) {
  const idx = PROFILES.indexOf(sim.profile);
  return (
    <section className="panel grid gap-4 p-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]" aria-label="Mission Telemetry Simulator">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="label-caps flex items-center gap-2 text-muted-foreground">
            <Radio className="size-3.5 text-dtn" /> Mission Telemetry Simulator · Perfil y latencia
          </h2>
          <span
            className={cn(
              "telemetry rounded-md border px-2 py-0.5 text-xs",
              sim.link.localAutonomy ? "border-dtn/60 bg-dtn/10 text-dtn" : "border-nominal/50 bg-nominal/10 text-nominal",
            )}
          >
            {sim.link.modeLabel}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Slider
              min={0}
              max={2}
              step={1}
              value={[idx]}
              onValueChange={([v]) => sim.setProfile(PROFILES[v ?? 0] ?? "leo")}
              aria-label="Perfil de misión"
              className="py-3"
            />
            <div className="mt-1 grid grid-cols-3 text-xs">
              {PROFILES.map((p, i) => (
                <button
                  key={p}
                  onClick={() => sim.setProfile(p)}
                  className={cn(
                    "min-h-10 rounded-md px-1 transition-colors",
                    i === 0 ? "text-left" : i === 1 ? "text-center" : "text-right",
                    sim.profile === p ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {PROFILE_META[p].label}
                  <span className="telemetry block text-[0.68rem] opacity-70">
                    {p === "leo" ? "~0 s · TDRSS" : p === "lunar" ? "1.3 s" : "4–24 min"}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex min-w-36 flex-col items-start justify-center rounded-lg border border-dtn/40 bg-dtn/8 px-3 py-2 sm:items-end">
            <span className="label-caps text-dtn">Latencia 1 vía</span>
            <span className="telemetry text-2xl font-semibold">{sim.link.latencyLabel}</span>
            <span className="text-[0.7rem] text-muted-foreground">{sim.link.linkName}</span>
          </div>
        </div>
        {sim.profile === "mars" && (
          <div className="mt-3 rounded-lg border border-dtn/40 bg-dtn/8 p-3 animate-in fade-in slide-in-from-top-1">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-dtn">Distancia Tierra–Marte → retardo de luz</span>
              <span className="telemetry">{sim.marsMinutes} min</span>
            </div>
            <Slider
              min={MARS_LATENCY_MIN}
              max={MARS_LATENCY_MAX}
              step={1}
              value={[sim.marsMinutes]}
              onValueChange={([v]) => sim.setMarsMinutes(v ?? 12)}
              aria-label="Latencia a Marte en minutos"
            />
          </div>
        )}
      </div>

      <div>
        <h2 className="label-caps mb-3 text-muted-foreground">Escenarios operacionales · 1 clic</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(SCENARIOS) as ScenarioId[]).map((id) => {
            const s = SCENARIOS[id];
            const Icon = SCENARIO_ICON[id];
            return (
              <button
                key={id}
                data-active={sim.scenario === id}
                onClick={() => sim.setScenario(id)}
                className={cn(
                  "flex min-h-20 flex-col items-start gap-1 rounded-lg border border-border bg-muted/40 p-3 text-left transition-all hover:bg-accent",
                  SCENARIO_TONE[id],
                )}
              >
                <span className="flex items-center gap-2 text-xs font-semibold">
                  <Icon className="size-4" /> Escenario {s.index}
                </span>
                <span className="text-sm font-medium leading-tight text-foreground">{s.title}</span>
                <span className="telemetry text-[0.68rem] text-muted-foreground">{s.time}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
