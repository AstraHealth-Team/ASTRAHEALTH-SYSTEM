import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ALERT_LABEL, SCENARIOS, type AlertLevel } from "@/lib/mission";
import type { MissionSim } from "@/hooks/use-mission-sim";
import { BLOCKS, type BlockKey } from "./kit";

/* ---------- Diagram geometry (mirrors "Arquitectura para el NSA.png", 1920×476) ---------- */

type Box = { x: number; y: number; w: number; h: number; lines: string[]; id: string };

const FRAMES: { block: BlockKey; x: number; y: number; w: number; h: number; title: string }[] = [
  { block: "sensors", x: 8, y: 8, w: 289, h: 460, title: "1. SENSORES (IEEE 11073)" },
  { block: "dtn", x: 328, y: 160, w: 465, h: 155, title: "2. RED ESPACIAL (DTN)" },
  { block: "edge", x: 850, y: 181, w: 668, h: 114, title: "3. EDGE AI + FHIR R4" },
  { block: "hmi", x: 1552, y: 52, w: 360, h: 371, title: "4. INTERFAZ HMI (NASA-STD-3001)" },
];

const NODES: Record<BlockKey, Box[]> = {
  sensors: [
    { id: "biomon", x: 70, y: 45, w: 158, h: 60, lines: ["CSA Bio-Monitor", "(ECG, PA, HRV)"] },
    { id: "acti", x: 64, y: 153, w: 164, h: 60, lines: ["Actiwatch / Oura", "(Sueño, Luz)"] },
    { id: "rad", x: 67, y: 262, w: 161, h: 80, lines: ["ISS-RAD + CANS", "(Radiación", "Neutrones)"] },
    { id: "oct", x: 62, y: 391, w: 167, h: 60, lines: ["OCT / Telemetría", "(Síndrome SANS)"] },
  ],
  dtn: [
    { id: "gw", x: 361, y: 226, w: 167, h: 44, lines: ["Gateway A Bordo"] },
    { id: "queue", x: 586, y: 197, w: 174, h: 102, lines: ["Cola", "Store-and-Forward", "(0s LEO -> 24m", "Marte)"] },
  ],
  edge: [
    { id: "wavelet", x: 882, y: 226, w: 174, h: 44, lines: ["Filtro Wavelet-LMS"] },
    { id: "tinyml", x: 1114, y: 217, w: 169, h: 62, lines: ["TinyML (1D-CNN +", "Autoencoder)"] },
    { id: "xai", x: 1340, y: 217, w: 145, h: 62, lines: ["Motor XAI", "(Explicabilidad)"] },
  ],
  hmi: [
    { id: "astro", x: 1653, y: 89, w: 164, h: 80, lines: ["Modo Astronauta", "(Semáforo +", "Gamificación)"] },
    { id: "cmo", x: 1649, y: 218, w: 182, h: 60, lines: ["Modo CMO", "(Ondas + Guía EVA)"] },
    { id: "alerts", x: 1649, y: 327, w: 143, h: 80, lines: ["Alertas Duales", "(Emergency /", "Warning)"] },
  ],
};

const r = (y1: number, y2: number, x: number) => {
  const d = y2 > y1 ? 8 : -8;
  return `V${y2 - d} Q${x} ${y2} ${x + 8} ${y2}`;
};

const PATHS: { d: string; from: BlockKey }[] = [
  { d: `M228 75 H296 Q304 75 304 83 ${r(75, 238, 304)} H356`, from: "sensors" },
  { d: `M228 183 H288 Q296 183 296 191 ${r(183, 244, 296)} H356`, from: "sensors" },
  { d: `M228 302 H288 Q296 302 296 294 ${r(302, 252, 296)} H356`, from: "sensors" },
  { d: `M229 421 H296 Q304 421 304 413 ${r(421, 258, 304)} H356`, from: "sensors" },
  { d: "M528 248 H582", from: "dtn" },
  { d: "M760 248 H876", from: "dtn" },
  { d: "M1056 248 H1108", from: "edge" },
  { d: "M1283 248 H1334", from: "edge" },
  { d: "M1485 240 H1538 Q1546 240 1546 232 V137 Q1546 129 1554 129 H1646", from: "edge" },
  { d: "M1485 248 H1643", from: "edge" },
  { d: "M1485 256 H1538 Q1546 256 1546 264 V359 Q1546 367 1554 367 H1643", from: "edge" },
];

function activeNodes(sim: MissionSim): Set<string> {
  const s = new Set<string>(["biomon", "gw", "wavelet", "tinyml", "xai"]);
  if (sim.view === "astronaut") s.add("astro");
  if (sim.view === "cmo") s.add("cmo");
  if (sim.scenario === "eva") ["cmo", "alerts"].forEach((x) => s.add(x));
  if (sim.scenario === "spe") ["rad", "alerts"].forEach((x) => s.add(x));
  if (sim.link.localAutonomy) s.add("queue");
  return s;
}

function Diagram({ sim }: { sim: MissionSim }) {
  const active = activeNodes(sim);
  return (
    <svg viewBox="0 0 1920 476" className="h-auto w-full min-w-[960px]" role="img" aria-label="Diagrama de arquitectura oficial: Sensores, Red DTN, Edge AI + FHIR R4, Interfaz HMI">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10" fill="none" stroke="var(--foreground)" strokeWidth="1.6" />
        </marker>
      </defs>
      <rect x="0" y="0" width="1920" height="476" rx="14" className="fill-background" />

      {FRAMES.map((f) => (
        <g key={f.block}>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} className="fill-none stroke-foreground/70" strokeWidth="1.5" />
          <text x={f.x + f.w / 2} y={f.y + 24} textAnchor="middle" className="fill-foreground font-mono text-[16px]" style={{ letterSpacing: "0.04em" }}>
            {f.title}
          </text>
        </g>
      ))}

      {PATHS.map((p, i) => (
        <g key={i}>
          <path d={p.d} className="fill-none stroke-foreground/80" strokeWidth="1.5" markerEnd="url(#arrow)" />
          <circle r="4" style={{ fill: `var(--${p.from})` }}>
            <animateMotion dur={`${p.from === "dtn" && sim.link.localAutonomy ? 3.6 : 1.8}s`} begin={`${(i % 4) * 0.35}s`} repeatCount="indefinite" path={p.d} />
          </circle>
        </g>
      ))}

      {(Object.keys(NODES) as BlockKey[]).map((b) =>
        NODES[b].map((n) => {
          const on = active.has(n.id);
          const lh = 20;
          const startY = n.y + n.h / 2 - ((n.lines.length - 1) * lh) / 2 + 6;
          return (
            <g key={n.id}>
              {on && (
                <rect x={n.x - 4} y={n.y - 4} width={n.w + 8} height={n.h + 8} rx="4" fill="none" style={{ stroke: `var(--${b})` }} strokeOpacity="0.45" strokeWidth="6" className={n.id === "alerts" && sim.level === "emergency" ? "animate-emergency" : undefined} />
              )}
              <rect x={n.x} y={n.y} width={n.w} height={n.h} style={{ stroke: `var(--${b})`, fill: `color-mix(in oklab, var(--${b}) ${on ? 16 : 6}%, transparent)` }} strokeWidth="1.8" />
              {n.lines.map((l, i) => (
                <text key={i} x={n.x + n.w / 2} y={startY + i * lh} textAnchor="middle" className="font-mono text-[15px]" style={{ fill: `var(--${b})` }}>
                  {l}
                </text>
              ))}
            </g>
          );
        }),
      )}
    </svg>
  );
}

/* ---------- Live payloads ---------- */

const HEX: Record<AlertLevel, string> = { emergency: "#EF4444", warning: "#F59E0B", caution: "#EAB308", advisory: "#06B6D4" };
const ICON: Record<AlertLevel, string> = { emergency: "octagon", warning: "triangle", caution: "diamond", advisory: "circle-info" };

function usePayloads(sim: MissionSim) {
  return useMemo(() => {
    const v = sim.vitals;
    const now = new Date();
    const iso = now.toISOString();
    const dtnEpoch = Date.UTC(2000, 0, 1);
    const ieee = {
      apdu: "PrstApdu · DataApdu (IEEE 11073-20601)",
      "invoke-id": sim.tick % 65536,
      "event-type": "MDC_NOTI_SCAN_REPORT_FIXED",
      agent: "CSA Bio-Monitor / Astroskin · sys-id 0x00A0C9FFFE0011B3",
      observations: [
        { handle: 1, type: "MDC_ECG_HEART_RATE (147842)", value: v.hr, unit: "MDC_DIM_BEAT_PER_MIN (264864)" },
        { handle: 2, type: "MDC_PRESS_BLD_NONINV_SYS (150021)", value: v.sys, unit: "MDC_DIM_MMHG (266016)" },
        { handle: 3, type: "MDC_PRESS_BLD_NONINV_DIA (150022)", value: v.dia, unit: "MDC_DIM_MMHG (266016)" },
        { handle: 4, type: "MDC_PULS_OXIM_SAT_O2 (150456)", value: v.spo2, unit: "MDC_DIM_PERCENT (262688)" },
        { handle: 5, type: "MDC_RESP_RATE (151562)", value: v.rr, unit: "MDC_DIM_RESP_PER_MIN (264928)" },
      ],
    };
    const bundle = {
      primaryBlock: {
        version: 7,
        bundleProcessingFlags: "0x0044 (status reports · no fragment)",
        crcType: "CRC-32C",
        destination: "ipn:399.1 (MCC · Cirujano de Vuelo)",
        source: "ipn:1001.7 (Gateway a bordo)",
        reportTo: "ipn:1001.0",
        creationTimestamp: [now.getTime() - dtnEpoch, sim.dtn.generated],
        lifetime_ms: 86_400_000,
      },
      extensionBlocks: [
        { type: "Bundle Age (7)", value_ms: 0 },
        { type: "Hop Count (10)", limit: 16, count: 1 },
      ],
      payloadBlock: {
        encapsulation: "CCSDS Space Packet Protocol · APID 0x1A4",
        contentType: "application/fhir+json",
        bytes: 1432,
      },
      convergenceLayer: {
        link: sim.link.realtime ? `AOS · ${sim.link.linkName}` : "LOS · enlace con Tierra interrumpido",
        oneWayLightTime_s: sim.link.latencySeconds,
        action: sim.link.realtime ? "forward" : "store (custodia) · forward en próxima ventana de contacto",
        queued: sim.dtn.queued,
      },
    };
    const fhir = {
      resourceType: "Observation",
      id: `hr-${sim.dtn.generated}`,
      status: "final",
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs" }] }],
      code: {
        coding: [
          { system: "http://loinc.org", code: "8867-4", display: "Heart rate" },
          { system: "urn:iso:std:iso:11073:10101", code: "147842", display: "MDC_ECG_HEART_RATE" },
        ],
      },
      subject: { reference: "Patient/crew-cdr-01" },
      effectiveDateTime: iso,
      valueQuantity: { value: v.hr, unit: "/min", system: "http://unitsofmeasure.org", code: "/min" },
      device: { reference: "Device/csa-bio-monitor-01" },
      interpretation: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
              code: v.pvcPerMin > 6 ? "A" : "N",
              display: v.pvcPerMin > 6 ? "Abnormal" : "Normal",
            },
          ],
        },
      ],
      note: [{ text: `XAI ${sim.xai.classifier}: ${sim.xai.label} (${Math.round(sim.xai.confidence * 100)}%)` }],
    };
    const deviceMetric = {
      resourceType: "DeviceMetric",
      id: "csa-bio-monitor-01-hr",
      type: { coding: [{ system: "urn:iso:std:iso:11073:10101", code: "147842", display: "MDC_ECG_HEART_RATE" }] },
      unit: { coding: [{ system: "urn:iso:std:iso:11073:10101", code: "264864", display: "MDC_DIM_BEAT_PER_MIN" }] },
      source: { reference: "Device/csa-bio-monitor-01" },
      operationalStatus: "on",
      category: "measurement",
      measurementPeriod: { repeat: { frequency: 1, period: 1, periodUnit: "s" } },
    };
    const top = sim.alerts[0];
    const hmi = {
      standard: "NASA-STD-3001 Vol. 2 · Dual Coding",
      view: sim.view === "astronaut" ? "Modo Astronauta" : sim.view === "cmo" ? "Modo CMO" : "Cirujano de Vuelo (MCC)",
      scenario: SCENARIOS[sim.scenario].title,
      activeAlert: top
        ? { level: ALERT_LABEL[top.level], color: HEX[top.level], icon: ICON[top.level], label: top.title, blink: top.level === "emergency" }
        : null,
      criticalPhase: sim.criticalPhase,
      suppressed: sim.suppressed.map((a) => `${ALERT_LABEL[a.level]}: ${a.title}`),
    };
    return { ieee, bundle, fhir: { observation: fhir, deviceMetric }, hmi };
  }, [sim]);
}

const TABS: { key: "ieee" | "bundle" | "fhir" | "hmi"; block: BlockKey; label: string }[] = [
  { key: "ieee", block: "sensors", label: "IEEE 11073 · captura" },
  { key: "bundle", block: "dtn", label: "DTN Bundle · RFC 9171" },
  { key: "fhir", block: "edge", label: "HL7 FHIR R4 · Observation / DeviceMetric" },
  { key: "hmi", block: "hmi", label: "Alerta HMI · NASA-STD-3001" },
];

export function ArchitectureDialog({ open, onOpenChange, sim }: { open: boolean; onOpenChange: (o: boolean) => void; sim: MissionSim }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("fhir");
  const payloads = usePayloads(sim);
  const current = TABS.find((t) => t.key === tab)!;
  const live: Record<BlockKey, string> = {
    sensors: `FC ${sim.vitals.hr} bpm · PA ${sim.vitals.sys}/${sim.vitals.dia} · SpO2 ${sim.vitals.spo2}%`,
    dtn: `${sim.link.latencyLabel} · ${sim.dtn.queued.toLocaleString("es")} en cola · ${sim.link.realtime ? "AOS" : "LOS"}`,
    edge: `${sim.xai.classifier} ${Math.round(sim.xai.confidence * 100)}% · ${sim.xai.label}`,
    hmi: sim.alerts[0] ? `${ALERT_LABEL[sim.alerts[0].level]} · ${sim.alerts[0].title}` : "Sin alertas",
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[min(96vw,1280px)] overflow-y-auto border-hairline bg-popover p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl">Arquitectura técnica · flujo de datos en tiempo real</DialogTitle>
          <DialogDescription>
            Diagrama oficial: Sensores IEEE 11073 → Red Espacial DTN → Edge AI + FHIR R4 → Interfaz HMI NASA-STD-3001.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto rounded-xl border border-hairline">
          <Diagram sim={sim} />
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(BLOCKS) as BlockKey[]).map((b) => (
            <div key={b} className={cn(BLOCKS[b].cls, "rounded-lg border border-block/50 bg-block/8 p-2.5")}>
              <p className="label-caps text-block">
                {BLOCKS[b].n}. {BLOCKS[b].title}
              </p>
              <p className="telemetry mt-1 truncate text-xs text-foreground">{live[b]}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 flex flex-wrap gap-1.5" role="tablist" aria-label="Recurso inspeccionado">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  BLOCKS[t.block].cls,
                  "flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors",
                  tab === t.key ? "border-block bg-block/15 text-block" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="grid size-5 place-items-center rounded bg-block text-[0.65rem] font-bold text-background">{BLOCKS[t.block].n}</span>
                {t.label}
              </button>
            ))}
          </div>
          <pre className={cn(BLOCKS[current.block].cls, "telemetry max-h-80 overflow-auto rounded-xl border border-block/40 bg-background/70 p-4 text-[0.72rem] leading-relaxed text-foreground")}>
            {JSON.stringify(payloads[tab], null, 2)}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
