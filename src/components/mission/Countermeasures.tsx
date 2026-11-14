import { Droplets, Dumbbell, Moon, Pill, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MissionSim } from "@/hooks/use-mission-sim";
import { Panel } from "./kit";

function Ring({ pct, done, children }: { pct: number; done: boolean; children: React.ReactNode }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-20">
      <svg viewBox="0 0 76 76" className="size-full -rotate-90">
        <circle cx="38" cy="38" r={r} className="fill-none stroke-muted" strokeWidth="7" />
        <circle
          cx="38"
          cy="38"
          r={r}
          className={cn("fill-none transition-all duration-700", done ? "stroke-nominal" : "stroke-hmi")}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, pct))}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function Countermeasures({ sim, compact }: { sim: MissionSim; compact?: boolean }) {
  const c = sim.counter;
  const set = sim.setCounter;
  const items = [
    {
      key: "ex",
      label: "Ejercicio ARED / T2",
      value: `${c.exerciseMin}/120 min`,
      pct: c.exerciseMin / 120,
      icon: Dumbbell,
      action: "+15 min",
      onClick: () => set((s) => ({ ...s, exerciseMin: Math.min(120, s.exerciseMin + 15) })),
    },
    {
      key: "vb",
      label: "Vitamina B",
      value: c.vitaminB ? "Tomada" : "Pendiente",
      pct: c.vitaminB,
      icon: Pill,
      action: c.vitaminB ? "Hecho" : "Registrar",
      onClick: () => set((s) => ({ ...s, vitaminB: 1 })),
    },
    {
      key: "hy",
      label: "Hidratación",
      value: `${(c.hydrationMl / 1000).toFixed(2)}/2.5 L`,
      pct: c.hydrationMl / 2500,
      icon: Droplets,
      action: "+250 mL",
      onClick: () => set((s) => ({ ...s, hydrationMl: Math.min(2500, s.hydrationMl + 250) })),
    },
    {
      key: "sl",
      label: "Eficiencia de sueño",
      value: `${c.sleepEff}%`,
      pct: c.sleepEff / 90,
      icon: Moon,
      action: null,
      onClick: undefined,
    },
  ];
  const completed = items.filter((i) => i.pct >= 1).length;
  return (
    <Panel
      title="Contramedidas espaciales · hoy"
      icon={<Trophy className="size-3.5 text-hmi" />}
      aside={
        <span className="telemetry text-xs text-hmi">
          {completed}/4 metas · racha 12 días
        </span>
      }
    >
      <div className={cn("grid gap-3", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
        {items.map((i) => {
          const done = i.pct >= 1;
          return (
            <div key={i.key} className="flex flex-col items-center gap-1.5 text-center">
              <Ring pct={i.pct} done={done}>
                <i.icon className={cn("size-5", done ? "text-nominal" : "text-hmi")} />
              </Ring>
              <p className="text-xs font-medium leading-tight">{i.label}</p>
              <p className="telemetry text-[0.7rem] text-muted-foreground">{i.value}</p>
              {i.action && (
                <button
                  onClick={i.onClick}
                  disabled={done}
                  className="min-h-9 rounded-md border border-hmi/40 px-3 text-xs font-medium text-hmi transition-colors hover:bg-hmi/10 disabled:border-nominal/40 disabled:text-nominal"
                >
                  {done ? "✓ Meta" : i.action}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
