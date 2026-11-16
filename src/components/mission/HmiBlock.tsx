import { useState } from "react";
import { Activity, Boxes, ClipboardList, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getInformationDeliveryStatus,
  OVERALL_LABEL,
  SCENARIOS,
  type ScenarioId,
} from "@/lib/mission";
import type { MissionSim } from "@/hooks/use-mission-sim";
import type { Triage } from "@/hooks/use-triage";
import type { TriageSystem } from "@/lib/triage";
import { AlertStack } from "./AlertStack";
import { BodyAvatar } from "./BodyAvatar";
import { Countermeasures } from "./Countermeasures";
import { ArchitectureView } from "./ArchitectureDialog";
import { BlockFrame, LEVEL_SOFT, LEVEL_TEXT, LevelIcon, Panel } from "./kit";
import { ReferencesPanel } from "./ReferencesDialog";
import { SensorNetworkTopology } from "./SensorNetworkTopology";
import { TrendPanel } from "./TrendPanel";
import { VitalKpis } from "./VitalKpis";
import { WaveCanvas } from "./WaveCanvas";
import { getControllerTelemetry } from "@/lib/sensor-network";

const PLAIN: Record<string, string> = {
  nominal: "Todo está en orden. Puedes seguir tu rutina.",
  caution: "Hay un valor que estamos vigilando. No necesitas hacer nada aún.",
  warning: "Tu cuerpo necesita atención. Sigue los pasos de abajo.",
  emergency: "Peligro inmediato. Sigue la orden de abajo ahora.",
  advisory: "Todo está en orden.",
};

function AvatarExplorer({ sim, triage }: { sim: MissionSim; triage: Triage }) {
  const [system, setSystem] = useState<TriageSystem>("cardio");
  return (
    <div className="panel grid min-w-0 items-start gap-4 p-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="min-h-[340px]">
        <p className="label-caps mb-1 text-muted-foreground">
          Avatar anatómico · 3 sistemas de triaje
        </p>
        <BodyAvatar systems={triage.systems} selected={system} onSelect={setSystem} />
      </div>
      <VitalKpis vitals={sim.vitals} systems={triage.systems} overallLevel={sim.level} />
    </div>
  );
}

function Instructions({ sim, big }: { sim: MissionSim; big?: boolean }) {
  const s = SCENARIOS[sim.scenario];
  const [done, setDone] = useState<Record<string, boolean>>({});
  const urgent = sim.level === "warning" || sim.level === "emergency";
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        urgent ? LEVEL_SOFT[sim.level] : "border-border bg-muted/30",
      )}
    >
      <p
        className={cn(
          "label-caps mb-2 flex items-center gap-2",
          urgent ? LEVEL_TEXT[sim.level] : "text-muted-foreground",
        )}
      >
        <ListChecks className="size-3.5" />
        {sim.scenario === "spe"
          ? "Orden de evacuación"
          : sim.scenario === "eva"
            ? "Instrucciones inmediatas"
            : "Guía de autocuidado"}
      </p>
      <ol className="grid gap-2">
        {s.instructions.map((step, i) => {
          const key = `${sim.scenario}-${i}`;
          return (
            <li key={key}>
              <button
                onClick={() => setDone((d) => ({ ...d, [key]: !d[key] }))}
                className={cn(
                  "flex min-h-12 w-full items-center gap-3 rounded-lg bg-background/40 px-3 text-left transition-colors hover:bg-background/70",
                  done[key] && "opacity-55",
                )}
              >
                <span
                  className={cn(
                    "telemetry grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold",
                    done[key]
                      ? "border-nominal bg-nominal text-background"
                      : "border-foreground/40",
                  )}
                >
                  {done[key] ? "✓" : i + 1}
                </span>
                <span
                  className={cn(
                    big ? "text-base" : "text-sm",
                    "font-medium",
                    done[key] && "line-through",
                  )}
                >
                  {step}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function AstronautView({ sim, triage }: { sim: MissionSim; triage: Triage }) {
  const selectedController = getControllerTelemetry(sim.networkScenario, sim.tick).find(
    (controller) => controller.selected,
  );
  const delivery = getInformationDeliveryStatus(
    sim.scenario,
    sim.link,
    selectedController?.state === "on",
    selectedController?.earthUplink,
  );
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div
          className={cn(
            "flex flex-col justify-center gap-2 rounded-2xl border p-5",
            LEVEL_SOFT[sim.level],
            sim.level === "emergency" && "animate-emergency",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1.5 rounded-full bg-background/60 p-1.5" aria-hidden>
              {(["emergency", "warning", "nominal"] as const).map((l) => (
                <span
                  key={l}
                  className={cn(
                    "size-4 rounded-full transition-opacity",
                    l === "emergency"
                      ? "bg-emergency"
                      : l === "warning"
                        ? "bg-warning"
                        : "bg-nominal",
                    sim.level === l || (l === "warning" && sim.level === "caution")
                      ? "opacity-100"
                      : "opacity-15",
                  )}
                />
              ))}
            </div>
            <div>
              <p className="label-caps text-muted-foreground">Semáforo de salud</p>
              <p
                className={cn(
                  "flex items-center gap-2 text-3xl font-bold tracking-tight",
                  LEVEL_TEXT[sim.level],
                )}
              >
                <LevelIcon level={sim.level} className="size-7" />
                {OVERALL_LABEL[sim.level]}
              </p>
            </div>
          </div>
          <p className="text-base">{PLAIN[sim.level]}</p>
        </div>
        <Instructions sim={sim} big />
      </div>

      <AvatarExplorer sim={sim} triage={triage} />
      <section className="panel grid gap-3 p-4" aria-label="Envío de información">
        <h2 className="label-caps text-muted-foreground">ENVÍO DE INFORMACIÓN</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { label: "Envío a Red Local", on: delivery.localNetwork },
            { label: "Enlace Estación → Tierra", on: delivery.stationToEarth },
          ].map((item) => (
            <div
              key={item.label}
              className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-border bg-background/35 px-3 py-2"
              role="status"
              aria-label={`${item.label}: ${item.on ? "ON" : "OFF"}`}
            >
              <span className="text-sm font-medium">{item.label}</span>
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2 py-1 text-[0.65rem] font-bold",
                  item.on
                    ? "border-nominal/50 bg-nominal/10 text-nominal"
                    : "border-emergency/50 bg-emergency/10 text-emergency",
                )}
              >
                <span
                  className={cn("size-2 rounded-full", item.on ? "bg-nominal" : "bg-emergency")}
                />
                {item.on ? "ON" : "OFF"}
              </span>
            </div>
          ))}
        </div>
      </section>
      <Countermeasures sim={sim} />
      <TrendPanel scenario={sim.scenario} title="Tendencias Fisiológicas Dinámicas" />
    </div>
  );
}

const DIFFERENTIAL: Record<ScenarioId, { dx: string; p: number }[]> = {
  nominal: [
    { dx: "Ritmo sinusal normal", p: 0.98 },
    { dx: "Arritmia sinusal respiratoria", p: 0.02 },
  ],
  eva: [
    { dx: "Extrasistolia ventricular por estrés metabólico", p: 0.71 },
    { dx: "Hipercapnia por CO2 del traje", p: 0.17 },
    { dx: "Hipopotasemia (déficit electrolítico)", p: 0.08 },
    { dx: "Isquemia miocárdica", p: 0.04 },
  ],
  spe: [
    { dx: "Exposición aguda a radiación (pre-ARS)", p: 0.62 },
    { dx: "Respuesta de estrés agudo", p: 0.31 },
    { dx: "Sin daño clínico detectable", p: 0.07 },
  ],
};

const INVENTORY = [
  { item: "Amiodarona 150 mg IV", qty: 6, min: 4 },
  { item: "Desfibrilador AED", qty: 1, min: 1 },
  { item: "Epinefrina 1 mg", qty: 10, min: 6 },
  { item: "Yoduro de potasio 130 mg", qty: 24, min: 20 },
  { item: "Ondansetrón 8 mg", qty: 9, min: 10 },
  { item: "Suero salino 500 mL", qty: 5, min: 4 },
];

function CmoView({ sim, triage }: { sim: MissionSim; triage: Triage }) {
  const v = sim.vitals;
  return (
    <div className="grid gap-4">
      <Panel
        title="Formas de onda bioeléctricas · Wavelet-LMS"
        icon={<Activity className="size-3.5 text-hmi" />}
        aside={<span className="telemetry text-xs text-muted-foreground">25 mm/s · 10 mm/mV</span>}
      >
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_9rem]">
          <div className="grid gap-1 divide-y divide-hairline rounded-lg bg-background/50">
            <WaveCanvas
              label="ECG II"
              hr={v.hr}
              pvcPerMin={v.pvcPerMin}
              className="text-nominal"
              height={110}
            />
            <WaveCanvas
              label="Pleth SpO2"
              kind="pleth"
              hr={v.hr}
              className="text-advisory"
              height={60}
            />
            <WaveCanvas
              label="Resp"
              kind="resp"
              hr={v.hr}
              rr={v.rr}
              className="text-caution"
              height={52}
            />
          </div>
          <div className="telemetry grid grid-cols-3 gap-2 text-center md:grid-cols-1 md:text-right">
            <div>
              <p className="label-caps text-nominal">FC</p>
              <p className="text-3xl font-semibold text-nominal">{v.hr}</p>
            </div>
            <div>
              <p className="label-caps text-advisory">SpO2</p>
              <p className="text-2xl font-semibold text-advisory">{v.spo2}</p>
            </div>
            <div>
              <p className="label-caps text-caution">FR</p>
              <p className="text-2xl font-semibold text-caution">{v.rr}</p>
            </div>
            <div className="col-span-3 md:col-span-1">
              <p className="label-caps text-muted-foreground">PA · PVC</p>
              <p className="text-sm">
                {v.sys}/{v.dia} · {v.pvcPerMin}/min
              </p>
            </div>
          </div>
        </div>
      </Panel>

      <AvatarExplorer sim={sim} triage={triage} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Diagnóstico diferencial asistido (IA)"
          icon={<ClipboardList className="size-3.5 text-hmi" />}
        >
          <ul className="grid gap-2">
            {DIFFERENTIAL[sim.scenario].map((d) => (
              <li key={d.dx} className="text-sm">
                <div className="flex justify-between gap-2">
                  <span>{d.dx}</span>
                  <span className="telemetry text-muted-foreground">{Math.round(d.p * 100)}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-hmi transition-all duration-700"
                    style={{ width: `${d.p * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.7rem] text-muted-foreground">
            Sugerencia no vinculante · decisión final del CMO.
          </p>
        </Panel>
        <Panel title="Guía EVA" icon={<ListChecks className="size-3.5 text-hmi" />}>
          <Instructions
            sim={{ ...sim, scenario: sim.scenario === "nominal" ? "eva" : sim.scenario }}
          />
          {sim.scenario === "nominal" && (
            <p className="mt-2 text-[0.7rem] text-muted-foreground">
              Vista previa del protocolo de contingencia EVA.
            </p>
          )}
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Panel title="Inventario médico a bordo" icon={<Boxes className="size-3.5 text-hmi" />}>
          <ul className="grid gap-1.5 text-sm">
            {INVENTORY.map((i) => {
              const low = i.qty < i.min;
              return (
                <li
                  key={i.item}
                  className="flex items-center justify-between gap-2 border-b border-hairline py-1.5"
                >
                  <span className="flex items-center gap-2">
                    {low && <LevelIcon level="caution" className="size-3.5" />}
                    {i.item}
                  </span>
                  <span className={cn("telemetry", low ? "text-caution" : "text-muted-foreground")}>
                    {i.qty} <span className="text-[0.7rem]">/ mín {i.min}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>
        <TrendPanel scenario={sim.scenario} title="Tendencias clínicas" />
      </div>
    </div>
  );
}

function SystemsView({ sim }: { sim: MissionSim }) {
  return (
    <div className="grid min-w-0 gap-4">
      <SensorNetworkTopology
        tick={sim.tick}
        selectedScenario={sim.networkScenario}
        onScenarioChange={sim.setNetworkScenario}
      />
      <ArchitectureView sim={sim} />
      <ReferencesPanel />
    </div>
  );
}

export function HmiBlock({ sim, triage }: { sim: MissionSim; triage: Triage }) {
  return (
    <BlockFrame block="hmi" hideHeader>
      <div className="grid min-w-0 gap-4">
        <AlertStack
          alerts={sim.alerts}
          suppressed={sim.suppressed}
          criticalPhase={sim.criticalPhase}
          triage={triage}
          mission={sim.scenario}
        />
        <div key={sim.view} className="min-w-0 animate-in fade-in duration-300">
          {sim.view === "astronaut" && <AstronautView sim={sim} triage={triage} />}
          {sim.view === "cmo" && <CmoView sim={sim} triage={triage} />}
          {sim.view === "systems" && <SystemsView sim={sim} />}
        </div>
      </div>
    </BlockFrame>
  );
}
