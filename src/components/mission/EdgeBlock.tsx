import { toast } from "sonner";
import { BrainCircuit, Check, FileJson, UserCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MissionSim } from "@/hooks/use-mission-sim";
import { BlockFrame, Node } from "./kit";
import { WaveCanvas } from "./WaveCanvas";

export function EdgeBlock({ sim }: { sim: MissionSim }) {
  const { xai, vitals } = sim;
  const anomaly = xai.reconstructionError > xai.threshold;
  const fhirCount = 38_400 + sim.tick * 3;
  return (
    <BlockFrame
      block="edge"
      aside={
        <span className="telemetry flex items-center gap-1 text-[0.7rem] text-muted-foreground">
          <FileJson className="size-3" /> {fhirCount.toLocaleString("es")} FHIR
        </span>
      }
    >
      <div className="grid gap-2.5">
        <Node title="Filtro Wavelet-LMS" sub="ECG derivación II · ruido EMG suprimido">
          <WaveCanvas hr={vitals.hr} pvcPerMin={vitals.pvcPerMin} className="text-edge" height={64} />
        </Node>

        <Node title="TinyML (1D-CNN + Autoencoder)" sub="Inferencia local · 38 kB int8">
          <div className="text-xs">
            <div className="mb-1 flex justify-between">
              <span className="text-muted-foreground">Error de reconstrucción</span>
              <span className={cn("telemetry", anomaly ? "text-warning" : "text-edge")}>
                {xai.reconstructionError.toFixed(3)} / {xai.threshold}
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all duration-700", anomaly ? "bg-warning" : "bg-edge")}
                style={{ width: `${Math.min(100, (xai.reconstructionError / 0.4) * 100)}%` }}
              />
              <div className="absolute inset-y-0 w-px bg-foreground/70" style={{ left: `${(xai.threshold / 0.4) * 100}%` }} />
            </div>
          </div>
        </Node>

        <Node title="Motor XAI" sub="(Explicabilidad)" right={<BrainCircuit className="size-4" />}>
          <p className="text-sm leading-snug">
            Clasificación {xai.classifier}:{" "}
            <b className="text-edge">{Math.round(xai.confidence * 100)}% confianza</b> — {xai.label}
          </p>
          <ul className="mt-2 grid gap-1.5">
            {xai.factors.map((f) => (
              <li key={f.name} className="text-xs">
                <div className="flex justify-between gap-2">
                  <span>{f.name}</span>
                  <span className="telemetry text-muted-foreground">{f.detail}</span>
                </div>
                <div className="mt-0.5 h-1 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-edge transition-all duration-700" style={{ width: `${f.weight * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-1.5 border-t border-edge/25 pt-2">
            <UserCheck className="size-3.5 text-edge" />
            <span className="mr-auto text-[0.7rem] text-muted-foreground">Human-in-the-Loop</span>
            <button
              onClick={() => toast.success("Diagnóstico confirmado por la tripulación", { description: xai.label })}
              className="flex min-h-9 items-center gap-1 rounded-md bg-edge/15 px-2.5 text-xs font-medium text-edge hover:bg-edge/25"
            >
              <Check className="size-3.5" /> Confirmar
            </button>
            <button
              onClick={() => toast("Clasificación descartada", { description: "Se registra como retroalimentación para el modelo." })}
              className="flex min-h-9 items-center gap-1 rounded-md bg-muted px-2.5 text-xs font-medium hover:bg-accent"
            >
              <X className="size-3.5" /> Descartar
            </button>
          </div>
        </Node>
      </div>
    </BlockFrame>
  );
}
