import { AudioLines, Cpu, Rocket, Stethoscope, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/lib/mission";
import type { MissionSim } from "@/hooks/use-mission-sim";
import { ChangeHistoryBell } from "./ChangeHistoryBell";

const VIEWS: { id: ViewMode; label: string; icon: typeof User }[] = [
  { id: "astronaut", label: "Astronauta", icon: User },
  { id: "cmo", label: "Médico", icon: Stethoscope },
  { id: "systems", label: "Sistemas", icon: Cpu },
];

export function TopBar({ sim, onStartVoice }: { sim: MissionSim; onStartVoice: () => void }) {
  return (
    <header className="panel sticky top-2 z-30 flex min-h-16 flex-nowrap items-center justify-between gap-2 px-2 py-2 sm:gap-4 sm:px-4">
      <div className="flex min-w-0 shrink items-center gap-2">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-hmi/15 text-hmi sm:size-9">
          <Rocket className="size-4 sm:size-5" />
        </div>
        <p className="hidden truncate text-xs font-semibold tracking-tight min-[420px]:block sm:text-sm">
          ASTRA Health HMI
        </p>
      </div>

      <nav
        role="tablist"
        aria-label="Vista de la misión"
        className="flex min-w-0 shrink items-center gap-0.5 rounded-xl bg-muted/60 p-1 sm:gap-1"
      >
        {VIEWS.map((view) => {
          const active = sim.view === view.id;
          return (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => sim.setView(view.id)}
              className={cn(
                "flex min-h-10 items-center justify-center gap-1 whitespace-nowrap rounded-lg px-1.5 text-[0.68rem] font-semibold transition-colors sm:gap-2 sm:px-3 sm:text-sm",
                active
                  ? "bg-hmi text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <view.icon className="hidden size-4 shrink-0 sm:block" />
              <span>{view.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onStartVoice}
          aria-label="Iniciar Consulta IA por Voz"
          className="flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-voice px-2.5 text-xs font-semibold text-voice-foreground shadow-[0_0_24px_-8px_var(--voice-glow)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voice-glow sm:px-4 sm:text-sm"
        >
          <AudioLines className="size-4" />
          <span className="hidden lg:inline">Iniciar Consulta IA por Voz</span>
          <span className="hidden min-[420px]:inline lg:hidden">Consulta IA</span>
        </button>
        <ChangeHistoryBell history={sim.triage.history} onReset={sim.triage.resetAll} />
      </div>
    </header>
  );
}
