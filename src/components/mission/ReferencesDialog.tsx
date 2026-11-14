import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const REFERENCES = [
  { org: "NASA", ref: "NASA-STD-3001 Vol. 2", desc: "Human Factors, Habitability, and Environmental Health — codificación de alertas, legibilidad y ergonomía de controles." },
  { org: "NASA", ref: "NASA-STD-3001 Vol. 1", desc: "Crew Health — límites de exposición a radiación y estándares de salud de la tripulación." },
  { org: "NASA", ref: "NPR 7150.2D", desc: "NASA Software Engineering Requirements — clasificación y aseguramiento de software crítico." },
  { org: "NASA HRP", ref: "Exploration Medical Capability (ExMC)", desc: "Autonomía médica para misiones de exploración con latencia de comunicaciones." },
  { org: "NASA HRP", ref: "SANS · Spaceflight Associated Neuro-ocular Syndrome", desc: "Seguimiento de RNFL por OCT y desplazamiento hiperópico." },
  { org: "NASA", ref: "LSAH · Lifetime Surveillance of Astronaut Health", desc: "Repositorio longitudinal de datos médicos de astronautas." },
  { org: "CSA", ref: "Bio-Monitor / Astroskin · Bio-Analyzer", desc: "Monitorización fisiológica continua y análisis biológico a bordo de la Agencia Espacial Canadiense." },
  { org: "IEEE", ref: "IEEE 11073 (PHD · 20601 / 10101)", desc: "Comunicación de dispositivos médicos personales y nomenclatura MDC." },
  { org: "HL7", ref: "FHIR R4 · Observation / DeviceMetric", desc: "Recursos clínicos interoperables para signos vitales y métricas de dispositivos." },
  { org: "IETF", ref: "RFC 9171 · Bundle Protocol v7", desc: "Delay-Tolerant Networking store-and-forward con custodia." },
  { org: "CCSDS", ref: "Space Packet Protocol", desc: "Encapsulado de telemetría espacial para enlaces nave–Tierra." },
];

export function ReferencesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto border-hairline bg-popover">
        <DialogHeader>
          <DialogTitle>Rigor científico y referencias</DialogTitle>
          <DialogDescription>Normas y programas que fundamentan cada módulo del prototipo.</DialogDescription>
        </DialogHeader>
        <ul className="grid gap-2">
          {REFERENCES.map((r) => (
            <li key={r.ref} className="rounded-lg border border-hairline bg-background/40 p-3">
              <p className="flex items-baseline gap-2">
                <span className="label-caps text-hmi">{r.org}</span>
                <span className="text-sm font-semibold">{r.ref}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p>
            </li>
          ))}
        </ul>
        <p className="text-[0.7rem] text-muted-foreground">
          Prototipo MVP de evaluación. Los valores son simulados y no constituyen diagnóstico médico.
        </p>
      </DialogContent>
    </Dialog>
  );
}
