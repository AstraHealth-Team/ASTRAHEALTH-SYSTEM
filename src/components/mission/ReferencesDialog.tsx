export const REFERENCES = [
  { org: "NASA", ref: "NASA-STD-3001 Vol. 2", desc: "Human Factors, Habitability, and Environmental Health — alert coding, legibility, and control ergonomics." },
  { org: "NASA", ref: "NASA-STD-3001 Vol. 1", desc: "Crew Health — radiation exposure limits and crew health standards." },
  { org: "NASA", ref: "NPR 7150.2D", desc: "NASA Software Engineering Requirements — classification and assurance of safety-critical software." },
  { org: "NASA HRP", ref: "Exploration Medical Capability (ExMC)", desc: "Medical autonomy for exploration missions with communications latency." },
  { org: "NASA HRP", ref: "SANS · Spaceflight Associated Neuro-ocular Syndrome", desc: "OCT-based RNFL monitoring and hyperopic shift." },
  { org: "NASA", ref: "LSAH · Lifetime Surveillance of Astronaut Health", desc: "Longitudinal repository of astronaut medical data." },
  { org: "CSA", ref: "Bio-Monitor / Astroskin · Bio-Analyzer", desc: "Continuous physiological monitoring and onboard biological analysis by the Canadian Space Agency." },
  { org: "IEEE", ref: "IEEE 11073 (PHD · 20601 / 10101)", desc: "Personal health device communication and MDC nomenclature." },
  { org: "HL7", ref: "FHIR R4 · Observation / DeviceMetric", desc: "Interoperable clinical resources for vital signs and device metrics." },
  { org: "IETF", ref: "RFC 9171 · Bundle Protocol v7", desc: "Delay-Tolerant Networking store-and-forward with custody transfer." },
  { org: "CCSDS", ref: "Space Packet Protocol", desc: "Space telemetry encapsulation for spacecraft-to-Earth links." },
];

export function ReferencesPanel() {
  return (
    <section className="panel grid gap-3 p-4" aria-labelledby="scientific-references-heading">
      <header>
        <h2 id="scientific-references-heading" className="label-caps text-foreground">
          SCIENTIFIC BASIS · REFERENCES
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Standards and programs underpinning the system modules.
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
        Evaluation prototype. Values are simulated and do not constitute a medical diagnosis.
      </p>
    </section>
  );
}
