import { useState } from "react";
import {
  Activity,
  Boxes,
  ClipboardList,
  Database,
  Gauge,
  HeartPulse,
  ListChecks,
  Moon,
  Radiation,
  Wind,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  OVERALL_LABEL,
  SCENARIOS,
  formatRate,
  type SystemId,
} from "@/lib/mission";
import type { MissionSim } from "@/hooks/use-mission-sim";
import { AlertStack } from "./AlertStack";
import { BodyAvatar } from "./BodyAvatar";
import { Countermeasures } from "./Countermeasures";
import { BlockFrame, LEVEL_SOFT, LEVEL_TEXT, LevelIcon, Panel } from "./kit";
import { SystemDetail } from "./SystemDetail";
import { TrendPanel } from "./TrendPanel";
import { WaveCanvas } from "./WaveCanvas";

const MODE_NODES = [
  { id: "astronaut", title: "Modo Astronauta", sub: "(Semáforo + Gamificación)" },
  { id: "cmo", title: "Modo CMO", sub: "(Ondas + Guía EVA)" },
  { id: "surgeon", title: "Modo Cirujano MCC", sub: "(Tendencias + LSAH)" },
] as const;

const PLAIN: Record<string, string> = {
  nominal: "Todo está en orden. Puedes seguir tu rutina.",
  caution: "Hay un valor que estamos vigilando. No necesitas hacer nada aún.",
  warning: "Tu cuerpo necesita atención. Sigue los pasos de abajo.",
  emergency: "Peligro inmediato. Sigue la orden de abajo ahora.",
  advisory: "Todo está en orden.",
};

function AvatarExplorer({ sim }: { sim: MissionSim }) {
  const [system, setSystem] = useState<SystemId>("cardio");
  const active = sim.scenario === "spe" ? "radiation" : system;
  return (
    <div className="panel grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="min-h-[340px]">
        <p className="label-caps mb-1 text-muted-foreground">Avatar anatómico · toca un sistema</p>
        <BodyAvatar vitals={sim.vitals} selected={active} onSelect={setSystem} />
      </div>
      <SystemDetail system={active} vitals={sim.vitals} />
    </div>
  );
}

function Instructions({ sim, big }: { sim: MissionSim; big?: boolean }) {
  const s = SCENARIOS[sim.scenario];
  const [done, setDone] = useState<Record<string, boolean>>({});
  const urgent = sim.level === "warning" || sim.level === "emergency";
  return (
    <div className={cn("rounded-xl border p-4", urgent ? LEVEL_SOFT[sim.level] : "border-border bg-muted/30")}>
      <p className={cn("label-caps mb-2 flex items-center gap-2", urgent ? LEVEL_TEXT[sim.level] : "text-muted-foreground")}>
        <ListChecks className="size-3.5" />
        {sim.scenario === "spe" ? "Orden de evacuación" : sim.scenario === "eva" ? "Instrucciones inmediatas" : "Guía de autocuidado"}
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
                    done[key] ? "border-nominal bg-nominal text-background" : "border-foreground/40",
                  )}
                >
                  {done[key] ? "✓" : i + 1}
                </span>
                <span className={cn(big ? "text-base" : "text-sm", "font-medium", done[key] && "line-through")}>{step}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function AstronautView({ sim }: { sim: MissionSim }) {
  const v = sim.vitals;
  const cards = [
    { label: "Corazón", value: `${v.hr}`, unit: "lat/min", icon: HeartPulse, warn: v.pvcPerMin > 6 },
    { label: "Oxígeno en sangre", value: `${v.spo2}`, unit: "%", icon: Wind, warn: v.spo2 < 94 },
    { label: "Radiación", value: formatRate(v.radRateUSvH), unit: v.radRateUSvH >= 1000 ? "" : "µSv/h", icon: Radiation, warn: v.radRateUSvH > 150000 },
    { label: "Sueño anoche", value: `${v.sleepEff}`, unit: "%", icon: Moon, warn: false },
  ];
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
                    l === "emergency" ? "bg-emergency" : l === "warning" ? "bg-warning" : "bg-nominal",
                    (sim.level === l || (l === "warning" && sim.level === "caution")) ? "opacity-100" : "opacity-15",
                  )}
                />
              ))}
            </div>
            <div>
              <p className="label-caps text-muted-foreground">Semáforo de salud</p>
              <p className={cn("flex items-center gap-2 text-3xl font-bold tracking-tight", LEVEL_TEXT[sim.level])}>
                <LevelIcon level={sim.level} className="size-7" />
                {OVERALL_LABEL[sim.level]}
              </p>
            </div>
          </div>
          <p className="text-base">{PLAIN[sim.level]}</p>
        </div>
        <Instructions sim={sim} big />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={cn("panel p-4", c.warn && LEVEL_SOFT[sim.level])}>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <c.icon className={cn("size-4", c.warn ? LEVEL_TEXT[sim.level] : "text-hmi")} />
              {c.label}
            </p>
            <p className="telemetry mt-1 text-3xl font-semibold">
              {c.value}
              <span className="ml-1 text-sm font-normal text-muted-foreground">{c.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <AvatarExplorer sim={sim} />
      <Countermeasures sim={sim} />
    </div>
  );
}

const DIFFERENTIAL: Record<string, { dx: string; p: number }[]> = {
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

function CmoView({ sim }: { sim: MissionSim }) {
  const v = sim.vitals;
  return (
    <div className="grid gap-4">
      <Panel title="Formas de onda bioeléctricas · Wavelet-LMS" icon={<Activity className="size-3.5 text-hmi" />}
        aside={<span className="telemetry text-xs text-muted-foreground">25 mm/s · 10 mm/mV</span>}>
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_9rem]">
          <div className="grid gap-1 divide-y divide-hairline rounded-lg bg-background/50">
            <WaveCanvas label="ECG II" hr={v.hr} pvcPerMin={v.pvcPerMin} className="text-nominal" height={110} />
            <WaveCanvas label="Pleth SpO2" kind="pleth" hr={v.hr} className="text-advisory" height={60} />
            <WaveCanvas label="Resp" kind="resp" hr={v.hr} rr={v.rr} className="text-caution" height={52} />
          </div>
          <div className="telemetry grid grid-cols-3 gap-2 text-center md:grid-cols-1 md:text-right">
            <div><p className="label-caps text-nominal">FC</p><p className="text-3xl font-semibold text-nominal">{v.hr}</p></div>
            <div><p className="label-caps text-advisory">SpO2</p><p className="text-2xl font-semibold text-advisory">{v.spo2}</p></div>
            <div><p className="label-caps text-caution">FR</p><p className="text-2xl font-semibold text-caution">{v.rr}</p></div>
            <div className="col-span-3 md:col-span-1"><p className="label-caps text-muted-foreground">PA · PVC</p><p className="text-sm">{v.sys}/{v.dia} · {v.pvcPerMin}/min</p></div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Diagnóstico diferencial asistido (IA)" icon={<ClipboardList className="size-3.5 text-hmi" />}>
          <ul className="grid gap-2">
            {DIFFERENTIAL[sim.scenario].map((d) => (
              <li key={d.dx} className="text-sm">
                <div className="flex justify-between gap-2">
                  <span>{d.dx}</span>
                  <span className="telemetry text-muted-foreground">{Math.round(d.p * 100)}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-hmi transition-all duration-700" style={{ width: `${d.p * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.7rem] text-muted-foreground">Sugerencia no vinculante · decisión final del CMO.</p>
        </Panel>
        <Panel title="Guía EVA" icon={<ListChecks className="size-3.5 text-hmi" />}>
          <Instructions sim={{ ...sim, scenario: sim.scenario === "nominal" ? "eva" : sim.scenario }} />
          {sim.scenario === "nominal" && (
            <p className="mt-2 text-[0.7rem] text-muted-foreground">Vista previa del protocolo de contingencia EVA.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AvatarExplorer sim={sim} />
        <Panel title="Inventario médico a bordo" icon={<Boxes className="size-3.5 text-hmi" />}>
          <ul className="grid gap-1.5 text-sm">
            {INVENTORY.map((i) => {
              const low = i.qty < i.min;
              return (
                <li key={i.item} className="flex items-center justify-between gap-2 border-b border-hairline py-1.5">
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
      </div>
      <TrendPanel scenario={sim.scenario} title="Tendencias clínicas" />
    </div>
  );
}

function SurgeonView({ sim }: { sim: MissionSim }) {
  const v = sim.vitals;
  const env = [
    { label: "ppCO2", value: v.co2.toFixed(1), unit: "mmHg", lim: "< 2.0", warn: v.co2 > 2 },
    { label: "ppO2", value: v.o2.toFixed(1), unit: "kPa", lim: "19.5–23.1", warn: false },
    { label: "Presión cabina", value: v.cabinPressure.toFixed(1), unit: "kPa", lim: "101.3", warn: false },
    { label: "Radiación cabina", value: formatRate(v.radRateUSvH), unit: v.radRateUSvH >= 1000 ? "" : "µSv/h", lim: "< 50 µSv/h", warn: v.radRateUSvH > 50 },
    { label: "Temperatura", value: "22.4", unit: "°C", lim: "18–27", warn: false },
    { label: "Humedad", value: "46", unit: "%", lim: "25–75", warn: false },
  ];
  const day = 142;
  return (
    <div className="grid gap-4">
      <Panel title="Vista longitudinal de la misión" icon={<Gauge className="size-3.5 text-hmi" />}
        aside={<span className="telemetry text-xs text-muted-foreground">Día {day} / 180</span>}>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-hmi" style={{ width: `${(day / 180) * 100}%` }} />
        </div>
        <div className="telemetry mt-2 flex justify-between text-[0.7rem] text-muted-foreground">
          <span>Lanzamiento</span><span>EVA #3 · D128</span><span>Hoy · D{day}</span><span>Retorno</span>
        </div>
      </Panel>
      <TrendPanel scenario={sim.scenario} title="Evolución crónica de la tripulación" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel title="Métricas ambientales de cabina (ECLSS)" icon={<Wind className="size-3.5 text-hmi" />}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {env.map((e) => (
              <div key={e.label} className={cn("rounded-lg border p-3", e.warn ? LEVEL_SOFT[sim.level === "emergency" ? "emergency" : "caution"] : "border-hairline bg-background/40")}>
                <p className="text-xs text-muted-foreground">{e.label}</p>
                <p className="telemetry text-xl font-semibold">
                  {e.value} <span className="text-xs font-normal text-muted-foreground">{e.unit}</span>
                </p>
                <p className="telemetry text-[0.65rem] text-muted-foreground">Límite {e.lim}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Sincronización con LSAH" icon={<Database className="size-3.5 text-hmi" />}>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Estado</dt>
              <dd className={cn("font-semibold", sim.link.realtime ? "text-nominal" : "text-dtn")}>
                {sim.link.realtime ? "Sincronizado" : "En cola DTN"}
              </dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Último lote</dt><dd className="telemetry">06:12 UTC</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Bundles entregados</dt><dd className="telemetry">{sim.dtn.delivered.toLocaleString("es")}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Pendientes</dt><dd className={cn("telemetry", sim.dtn.queued && "text-dtn")}>{sim.dtn.queued.toLocaleString("es")}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Latencia</dt><dd className="telemetry">{sim.link.latencyLabel}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Formato</dt><dd className="telemetry">HL7 FHIR R4 Bundle</dd></div>
          </dl>
        </Panel>
      </div>
    </div>
  );
}

export function HmiBlock({ sim }: { sim: MissionSim }) {
  return (
    <BlockFrame
      block="hmi"
      aside={
        <div className="hidden flex-wrap gap-1.5 md:flex">
          {MODE_NODES.map((m) => (
            <button
              key={m.id}
              onClick={() => sim.setView(m.id)}
              className={cn(
                "node-box px-2.5 py-1 text-left transition-opacity",
                sim.view === m.id ? "opacity-100" : "opacity-45 hover:opacity-80",
              )}
            >
              <span className="telemetry block text-xs font-semibold">{m.title}</span>
              <span className="telemetry block text-[0.62rem] opacity-80">{m.sub}</span>
            </button>
          ))}
          <span className="node-box px-2.5 py-1">
            <span className="telemetry block text-xs font-semibold">Alertas Duales</span>
            <span className="telemetry block text-[0.62rem] opacity-80">(Emergency / Warning)</span>
          </span>
        </div>
      }
    >
      <div className="grid gap-4">
        <AlertStack alerts={sim.alerts} suppressed={sim.suppressed} criticalPhase={sim.criticalPhase} />
        <div key={sim.view} className="animate-in fade-in duration-300">
          {sim.view === "astronaut" && <AstronautView sim={sim} />}
          {sim.view === "cmo" && <CmoView sim={sim} />}
          {sim.view === "surgeon" && <SurgeonView sim={sim} />}
        </div>
      </div>
    </BlockFrame>
  );
}
