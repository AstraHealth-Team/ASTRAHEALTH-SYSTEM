import { Droplets, HeartPulse, Thermometer, Wind } from "lucide-react";
import type { HealthLevel, Vitals } from "@/lib/mission";
import type { TriageState } from "@/lib/triage";
import { cn } from "@/lib/utils";
import { LEVEL_SOFT, LEVEL_TEXT, LevelIcon } from "./kit";

const TRIAGE_TONE = {
  green: "nominal",
  yellow: "warning",
  red: "emergency",
} as const;

const LEVEL_RANK: Record<HealthLevel, number> = {
  nominal: 0,
  advisory: 1,
  caution: 2,
  warning: 3,
  emergency: 4,
};

function higherLevel(a: HealthLevel, b: HealthLevel): HealthLevel {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b;
}

export function VitalKpis({
  vitals,
  systems,
  overallLevel,
}: {
  vitals: Vitals;
  systems: TriageState;
  overallLevel: HealthLevel;
}) {
  const cardioLevel = TRIAGE_TONE[systems.cardio.level];
  const respLevel = TRIAGE_TONE[systems.resp.level];
  const overallTriageLevel = Object.values(systems).reduce<HealthLevel>(
    (level, assessment) => higherLevel(level, TRIAGE_TONE[assessment.level]),
    overallLevel,
  );

  const metrics = [
    {
      label: "Frecuencia cardíaca",
      value: `${vitals.hr}`,
      unit: "lat/min",
      icon: HeartPulse,
      level: cardioLevel,
    },
    {
      label: "Presión arterial",
      value: `${vitals.sys}/${vitals.dia}`,
      unit: "mmHg",
      icon: HeartPulse,
      level: cardioLevel,
    },
    {
      label: "Frecuencia respiratoria",
      value: `${vitals.rr}`,
      unit: "resp/min",
      icon: Wind,
      level: respLevel,
    },
    {
      label: "Temperatura corporal",
      value: vitals.temp.toFixed(1),
      unit: "°C",
      icon: Thermometer,
      level: overallTriageLevel,
    },
    {
      label: "Saturación de oxígeno / SpO2",
      value: `${vitals.spo2}`,
      unit: "%",
      icon: Droplets,
      level: respLevel,
    },
  ];

  return (
    <div
      className="grid h-fit min-w-0 self-start content-start items-start grid-cols-2 gap-2 sm:grid-cols-3"
      aria-label="Signos vitales en tiempo real"
    >
      {metrics.map((metric) => (
        <article
          key={metric.label}
          aria-label={`${metric.label}: ${metric.value} ${metric.unit}`}
          className={cn(
            "panel h-fit min-w-0 self-start bg-background/80 p-3.5 sm:p-4",
            LEVEL_SOFT[metric.level],
          )}
        >
          <p className="flex items-start gap-2 text-[0.68rem] font-semibold leading-tight text-muted-foreground sm:text-xs">
            <metric.icon className={cn("size-4 shrink-0", LEVEL_TEXT[metric.level])} aria-hidden />
            <span>{metric.label}</span>
          </p>
          <p className="telemetry mt-2 whitespace-nowrap text-2xl font-bold tracking-tight sm:text-3xl">
            {metric.value}
            <span className="ml-1 text-[0.65rem] font-medium text-muted-foreground sm:text-xs">
              {metric.unit}
            </span>
          </p>
          <span className="sr-only">
            Estado: <LevelIcon level={metric.level} /> {metric.level}
          </span>
        </article>
      ))}
    </div>
  );
}
