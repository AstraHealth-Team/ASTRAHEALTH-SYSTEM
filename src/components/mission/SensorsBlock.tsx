import { BatteryFull, BatteryLow, BatteryMedium, Watch } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate } from "@/lib/mission";
import type { MissionSim } from "@/hooks/use-mission-sim";
import { BlockFrame, Node } from "./kit";

function Battery({ pct }: { pct: number }) {
  const Icon = pct > 60 ? BatteryFull : pct > 25 ? BatteryMedium : BatteryLow;
  return (
    <span className={cn("telemetry flex items-center gap-1 text-[0.7rem]", pct > 25 ? "text-muted-foreground" : "text-caution")}>
      <Icon className="size-3.5" />
      {pct}%
    </span>
  );
}

function Device({ name, pct, cert }: { name: string; pct: number; cert?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5 text-xs">
      <span className="flex items-center gap-1.5">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full rounded-full bg-nominal animate-soft-pulse" />
          <span className="relative inline-flex size-2 rounded-full bg-nominal" />
        </span>
        {name}
        {cert && <span className="label-caps rounded border border-sensors/40 px-1 text-[0.55rem] text-sensors">CERT</span>}
      </span>
      <Battery pct={pct} />
    </div>
  );
}

export function SensorsBlock({ sim }: { sim: MissionSim }) {
  const v = sim.vitals;
  const drain = (start: number, rate: number) => Math.max(5, Math.round(start - sim.tick * rate));
  return (
    <BlockFrame block="sensors">
      <div className="grid gap-2.5">
        <Node title="CSA Bio-Monitor" sub="(ECG, PA, HRV)" right={<span className="telemetry text-sm text-foreground">{v.hr} bpm</span>}>
          <Device name="Astroskin (camiseta)" pct={drain(86, 0.01)} cert />
          <Device name="CSA Bio-Analyzer" pct={drain(74, 0.004)} cert />
          <p className="telemetry mt-1 text-[0.7rem] text-muted-foreground">
            PA {v.sys}/{v.dia} · HRV {v.hrv} ms · SpO2 {v.spo2}%
          </p>
        </Node>
        <Node title="Actiwatch / Oura" sub="(Sueño, Luz)" right={<span className="telemetry text-sm text-foreground">{v.sleepEff}%</span>}>
          <Device name="Actiwatch Spectrum Plus" pct={drain(62, 0.006)} cert />
          <Device name="Oura Ring" pct={drain(48, 0.008)} />
        </Node>
        <Node
          title="ISS-RAD + CANS"
          sub="(Radiación Neutrones)"
          right={
            <span className={cn("telemetry text-sm", v.radRateUSvH > 150000 ? "text-emergency" : "text-foreground")}>
              {formatRate(v.radRateUSvH)}
              {v.radRateUSvH < 1000 && <span className="text-[0.65rem] text-muted-foreground"> µSv/h</span>}
            </span>
          }
        >
          <Device name="ISS-RAD" pct={100} cert />
          <Device name="CANS (neutrones CSA)" pct={100} cert />
          <Device name="Radi-N2 (burbujas)" pct={100} cert />
        </Node>
        <Node title="OCT / Telemetría" sub="(Síndrome SANS)" right={<span className="telemetry text-sm text-foreground">+{v.refractiveShiftD.toFixed(2)} D</span>}>
          <p className="telemetry text-[0.7rem] text-muted-foreground">
            RNFL {v.rnfl} µm · PIO {v.iop} mmHg
          </p>
        </Node>
        <div className="rounded-md border border-dashed border-sensors/35 p-2.5">
          <p className="label-caps mb-1 flex items-center gap-1.5 text-sensors">
            <Watch className="size-3" /> Wearables comerciales validados
          </p>
          <Device name="Garmin Fenix" pct={drain(71, 0.007)} />
          <Device name="BioButton" pct={drain(93, 0.003)} />
        </div>
      </div>
    </BlockFrame>
  );
}
