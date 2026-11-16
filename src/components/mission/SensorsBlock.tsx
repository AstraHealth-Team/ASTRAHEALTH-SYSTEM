import { BatteryFull, BatteryLow, BatteryMedium } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MissionSim } from "@/hooks/use-mission-sim";
import { getBiomedicalSensorTelemetry } from "@/lib/sensor-network";
import { BlockFrame } from "./kit";

function Battery({ pct }: { pct: number }) {
  const Icon = pct > 60 ? BatteryFull : pct > 25 ? BatteryMedium : BatteryLow;
  return (
    <span
      className={cn(
        "telemetry flex shrink-0 items-center gap-1 text-[0.7rem]",
        pct > 25 ? "text-muted-foreground" : "text-caution",
      )}
    >
      <Icon className="size-3.5" />
      {pct}%
    </span>
  );
}

function Sensor({ name, pct }: { name: string; pct: number }) {
  const online = pct > 0;
  return (
    <li className="flex min-h-12 items-center justify-between gap-2 rounded-lg border border-border bg-background/35 px-3 py-2">
      <span className="min-w-0 truncate text-xs font-semibold">{name}</span>
      <span className="flex shrink-0 items-center gap-3">
        <span
          className={cn(
            "flex items-center gap-1.5 text-[0.65rem] font-bold uppercase",
            online ? "text-nominal" : "text-emergency",
          )}
          role="status"
          aria-label={`${name}: ${online ? "Operativo" : "Fallo o desconectado"}`}
        >
          <span className={cn("size-2 rounded-full", online ? "bg-nominal" : "bg-emergency")} />
          {online ? "Operativo" : "Sin conexión"}
        </span>
        <Battery pct={pct} />
      </span>
    </li>
  );
}

export function SensorsBlock({ sim }: { sim: MissionSim }) {
  const sensors = getBiomedicalSensorTelemetry(sim.tick);

  return (
    <BlockFrame block="sensors" className="min-w-0">
      <ul className="grid gap-2">
        {sensors.map((sensor) => (
          <Sensor key={sensor.id} name={sensor.name} pct={sensor.batteryPercent} />
        ))}
      </ul>
    </BlockFrame>
  );
}
