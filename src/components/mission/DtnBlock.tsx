import { Earth, Package, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MissionSim } from "@/hooks/use-mission-sim";
import { BlockFrame, Node } from "./kit";

export function DtnBlock({ sim }: { sim: MissionSim }) {
  const { link, dtn } = sim;
  const cut = !link.realtime;
  return (
    <BlockFrame block="dtn" aside={<span className="telemetry text-[0.7rem] text-muted-foreground">BPv7 · RFC 9171</span>}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
        <Node title="Gateway A Bordo" sub="CCSDS Space Packet">
          <p className="telemetry text-xs">
            {dtn.generated.toLocaleString("es")} <span className="text-muted-foreground">bundles</span>
          </p>
        </Node>
        <div className="flex items-center text-dtn" aria-hidden>
          →
        </div>
        <Node title="Cola Store-and-Forward" sub="(0s LEO -> 24m Marte)">
          <p className={cn("telemetry text-xs", dtn.queued > 0 ? "text-dtn" : "text-muted-foreground")}>
            {dtn.queued.toLocaleString("es")} en custodia
          </p>
        </Node>
      </div>

      <div className="mt-3 rounded-lg border border-hairline bg-background/40 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <Rocket className="size-4 text-dtn" /> Nave
          </span>
          <span className={cn("telemetry", cut ? "text-dtn" : "text-nominal")}>
            {cut ? "LOS · enlace cortado" : `AOS · ${link.latencyLabel}`}
          </span>
          <span className="flex items-center gap-1.5">
            Tierra <Earth className="size-4 text-sensors" />
          </span>
        </div>
        <div className="relative mt-2 h-5">
          <div className={cn("absolute inset-x-0 top-1/2 h-px", cut ? "border-t border-dashed border-dtn/60" : "bg-dtn/50")} />
          {!cut &&
            [0, 0.8, 1.6].map((d) => (
              <Package
                key={d}
                className="animate-packet absolute top-0 size-4 -translate-x-1/2 text-dtn"
                style={{ animationDelay: `${d}s`, animationDuration: link.latencySeconds > 0 ? "3.4s" : "2.4s" }}
              />
            ))}
          {cut && (
            <span className="label-caps absolute left-1/2 top-0 -translate-x-1/2 rounded bg-background px-1.5 text-dtn">
              ✕
            </span>
          )}
        </div>
        <div className="telemetry mt-2 grid grid-cols-3 gap-2 text-center text-[0.7rem] text-muted-foreground">
          <span>
            <b className="block text-sm text-foreground">{dtn.delivered.toLocaleString("es")}</b>entregados
          </span>
          <span>
            <b className="block text-sm text-foreground">{dtn.inFlight}</b>en vuelo
          </span>
          <span>
            <b className={cn("block text-sm", dtn.queued ? "text-dtn" : "text-foreground")}>{dtn.queued.toLocaleString("es")}</b>en cola
          </span>
        </div>
      </div>
    </BlockFrame>
  );
}
