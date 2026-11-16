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

export function ReferencesPanel() {
  return (
    <section className="panel grid gap-3 p-4" aria-labelledby="scientific-references-heading">
      <header>
        <h2 id="scientific-references-heading" className="label-caps text-foreground">
          RIGOR CIENTÍFICO · REFERENCIAS
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Normas y programas que fundamentan los módulos del sistema.
        </p>
      </header>
      <ul className="grid gap-2 sm:grid-cols-2">
        {REFERENCES.map((reference) => (
          <li key={reference.ref} className="rounded-lg border border-hairline bg-background/40 p-3">
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="label-caps text-hmi">{reference.org}</span>
              <span className="text-sm font-semibold">{reference.ref}</span>
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{reference.desc}</p>
          </li>
        ))}
      </ul>
      <p className="text-[0.7rem] text-muted-foreground">
        Prototipo MVP de evaluación. Los valores son simulados y no constituyen diagnóstico médico.
      </p>
    </section>
  );
}
