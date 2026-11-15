import { useEffect, useState } from "react";
import {
  AudioLines,
  BookOpen,
  Network,
  Rocket,
  ShieldAlert,
  Stethoscope,
  User,
  Satellite,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/lib/mission";
import type { MissionSim } from "@/hooks/use-mission-sim";

const VIEWS: { id: ViewMode; label: string; sub: string; icon: typeof User }[] = [
  { id: "astronaut", label: "Astronauta", sub: "Vista principal", icon: User },
  { id: "cmo", label: "Oficial Médico", sub: "CMO a bordo", icon: Stethoscope },
  { id: "surgeon", label: "Cirujano de Vuelo", sub: "Control Tierra · MCC", icon: Satellite },
];

function UtcClock() {
  const [now, setNow] = useState<string>("--:--:--");
  useEffect(() => {
    const f = () => setNow(new Date().toISOString().slice(11, 19));
    f();
    const id = window.setInterval(f, 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="telemetry">{now} UTC</span>;
}

export function TopBar({
  sim,
  onOpenArchitecture,
  onOpenReferences,
  onStartVoice,
}: {
  sim: MissionSim;
  onOpenArchitecture: () => void;
  onOpenReferences: () => void;
  onStartVoice: () => void;
}) {
  return (
    <header className="panel sticky top-2 z-30 flex flex-wrap items-center gap-3 px-3 py-2.5 sm:px-4">
      <div className="flex items-center gap-3 pr-2">
        <div className="grid size-10 place-items-center rounded-lg bg-hmi/15 text-hmi">
          <Rocket className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">ASTRA · Health HMI</p>
          <p className="label-caps text-muted-foreground">
            NASA Space Apps 2026 · <UtcClock />
          </p>
        </div>
      </div>

      <nav
        role="tablist"
        aria-label="Perfil de usuario"
        className="order-last flex w-full gap-1 rounded-xl bg-muted/60 p-1 lg:order-none lg:w-auto"
      >
        {VIEWS.map((v) => {
          const active = sim.view === v.id;
          return (
            <button
              key={v.id}
              role="tab"
              aria-selected={active}
              onClick={() => sim.setView(v.id)}
              className={cn(
                "flex min-h-12 flex-1 items-center gap-2 rounded-lg px-3 text-left transition-all lg:flex-none",
                active
                  ? "bg-hmi text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <v.icon className="size-4 shrink-0" />
              <span className="leading-tight">
                <span className="block text-sm font-semibold">{v.label}</span>
                <span
                  className={cn(
                    "hidden text-[0.7rem] sm:block",
                    active ? "opacity-80" : "opacity-70",
                  )}
                >
                  {v.sub}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button
          onClick={onStartVoice}
          className="flex min-h-12 items-center gap-2 rounded-full bg-voice px-4 text-sm font-semibold text-voice-foreground shadow-[0_0_24px_-8px_var(--voice-glow)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voice-glow"
        >
          <AudioLines className="size-4" />
          <span className="hidden sm:inline">Iniciar Consulta IA por Voz</span>
          <span className="sm:hidden">Consulta IA</span>
        </button>
        <label
          className={cn(
            "flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3 transition-colors",
            sim.criticalPhase ? "border-warning/60 bg-warning/10" : "border-border bg-muted/40",
          )}
        >
          <ShieldAlert
            className={cn("size-4", sim.criticalPhase ? "text-warning" : "text-muted-foreground")}
          />
          <span className="leading-tight">
            <span className="block text-xs font-semibold">Fase Crítica</span>
            <span className="block text-[0.68rem] text-muted-foreground">EVA / Acoplamiento</span>
          </span>
          <Switch
            checked={sim.criticalPhase}
            onCheckedChange={sim.setCriticalPhase}
            aria-label="Fase crítica EVA / Acoplamiento"
          />
        </label>
        <button
          onClick={onOpenArchitecture}
          className="flex min-h-12 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-sm font-medium transition-colors hover:border-hmi/60 hover:text-hmi"
        >
          <Network className="size-4" /> Arquitectura
        </button>
        <button
          onClick={onOpenReferences}
          className="flex min-h-12 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-sm font-medium transition-colors hover:border-hmi/60 hover:text-hmi"
          aria-label="Rigor científico y referencias"
        >
          <BookOpen className="size-4" /> <span className="hidden sm:inline">Referencias</span>
        </button>
      </div>
    </header>
  );
}
