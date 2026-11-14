/**
 * Mission domain model for the astronaut health HMI.
 * Pure functions only (no React) so the rules can be unit tested.
 */

export type MissionProfile = "leo" | "lunar" | "mars";
export type ScenarioId = "nominal" | "eva" | "spe";
export type AlertLevel = "emergency" | "warning" | "caution" | "advisory";
export type HealthLevel = AlertLevel | "nominal";
export type ViewMode = "astronaut" | "cmo" | "surgeon";
export type SystemId = "cardio" | "neuro" | "radiation" | "msk";

export const ALERT_PRIORITY: Record<AlertLevel, number> = {
  emergency: 0,
  warning: 1,
  caution: 2,
  advisory: 3,
};

export const ALERT_LABEL: Record<AlertLevel, string> = {
  emergency: "EMERGENCY",
  warning: "WARNING",
  caution: "CAUTION",
  advisory: "ADVISORY",
};

/* ------------------------------------------------------------------ */
/* Mission profile & latency                                           */
/* ------------------------------------------------------------------ */

export const MARS_LATENCY_MIN = 4;
export const MARS_LATENCY_MAX = 24;

export interface LinkState {
  profile: MissionProfile;
  /** One-way light-time latency in seconds */
  latencySeconds: number;
  latencyLabel: string;
  linkName: string;
  /** Real-time link with Earth available */
  realtime: boolean;
  /** "Autonomía Médica Local + Cola DTN Store-and-Forward" */
  localAutonomy: boolean;
  modeLabel: string;
}

export const PROFILE_META: Record<MissionProfile, { label: string; short: string }> = {
  leo: { label: "Órbita Baja (ISS / LEO)", short: "LEO" },
  lunar: { label: "Órbita Lunar (Artemis)", short: "Luna" },
  mars: { label: "Tránsito a Marte", short: "Marte" },
};

export function clampMarsMinutes(minutes: number): number {
  return Math.min(MARS_LATENCY_MAX, Math.max(MARS_LATENCY_MIN, minutes));
}

export function getLinkState(profile: MissionProfile, marsMinutes = 12): LinkState {
  if (profile === "leo") {
    return {
      profile,
      latencySeconds: 0,
      latencyLabel: "~0 s",
      linkName: "TDRSS · tiempo real",
      realtime: true,
      localAutonomy: false,
      modeLabel: "Enlace TDRSS activo en tiempo real",
    };
  }
  if (profile === "lunar") {
    return {
      profile,
      latencySeconds: 1.3,
      latencyLabel: "1.3 s",
      linkName: "DSN / LunaNet",
      realtime: true,
      localAutonomy: false,
      modeLabel: "Triaje biomédico semi-autónomo",
    };
  }
  const m = clampMarsMinutes(marsMinutes);
  return {
    profile,
    latencySeconds: m * 60,
    latencyLabel: `${m} min`,
    linkName: "DSN · enlace interrumpido",
    realtime: false,
    localAutonomy: true,
    modeLabel: "Autonomía Médica Local + Cola DTN Store-and-Forward",
  };
}

/* ------------------------------------------------------------------ */
/* Vitals per scenario                                                 */
/* ------------------------------------------------------------------ */

export interface Vitals {
  hr: number;
  sys: number;
  dia: number;
  hrv: number; // RMSSD ms
  spo2: number;
  rr: number; // resp/min
  temp: number;
  pvcPerMin: number;
  radRateUSvH: number; // instantaneous µSv/h
  cumDoseMSv: number;
  neutronFlux: number; // CANS n/cm²/s
  rnfl: number; // µm
  iop: number; // mmHg
  refractiveShiftD: number; // diopters (hyperopic shift)
  sleepEff: number; // %
  pupilFatigue: number; // index 0-100
  boneLossPct: number; // % per month
  co2: number; // mmHg
  o2: number; // kPa
  cabinPressure: number; // kPa
  suitO2: number; // % EVA suit
}

/** 1g (Earth baseline) reference values for the clinical comparison */
export const EARTH_BASELINE: Vitals = {
  hr: 62,
  sys: 120,
  dia: 78,
  hrv: 58,
  spo2: 98,
  rr: 14,
  temp: 36.7,
  pvcPerMin: 0,
  radRateUSvH: 0.3,
  cumDoseMSv: 0,
  neutronFlux: 0.002,
  rnfl: 98,
  iop: 15,
  refractiveShiftD: 0,
  sleepEff: 90,
  pupilFatigue: 18,
  boneLossPct: 0,
  co2: 0.3,
  o2: 21.2,
  cabinPressure: 101.3,
  suitO2: 100,
};

export interface Scenario {
  id: ScenarioId;
  index: number;
  title: string;
  time: string;
  summary: string;
  vitals: Vitals;
  instructions: string[];
}

const NOMINAL_VITALS: Vitals = {
  hr: 68,
  sys: 116,
  dia: 74,
  hrv: 52,
  spo2: 98,
  rr: 14,
  temp: 36.8,
  pvcPerMin: 0,
  radRateUSvH: 18,
  cumDoseMSv: 42.6,
  neutronFlux: 0.011,
  rnfl: 101,
  iop: 17,
  refractiveShiftD: 0.4,
  sleepEff: 88,
  pupilFatigue: 24,
  boneLossPct: 1.1,
  co2: 1.8,
  o2: 21.0,
  cabinPressure: 101.2,
  suitO2: 100,
};

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  nominal: {
    id: "nominal",
    index: 1,
    title: "Rutina Nominal",
    time: "06:30 UTC",
    summary: "Signos estables, sincronización nocturna completada y rutina diaria lista.",
    vitals: NOMINAL_VITALS,
    instructions: [
      "Desayuno y suplementación de Vitamina B (prevención ocular).",
      "Sesión ARED de resistencia a las 09:00 (60 min).",
      "Hidratación: 500 mL antes del bloque de experimentos.",
    ],
  },
  eva: {
    id: "eva",
    index: 2,
    title: "Contingencia en EVA (Arritmia)",
    time: "EVA +02:14",
    summary: "Extrasístoles ventriculares (PVCs > 6/min) durante caminata espacial.",
    vitals: {
      ...NOMINAL_VITALS,
      hr: 132,
      sys: 148,
      dia: 92,
      hrv: 21,
      spo2: 95,
      rr: 24,
      temp: 37.4,
      pvcPerMin: 9,
      co2: 3.1,
      suitO2: 71,
    },
    instructions: [
      "Reducir tasa metabólica.",
      "Pausar caminata EVA.",
      "Verificar O2 del traje.",
    ],
  },
  spe: {
    id: "spe",
    index: 3,
    title: "Tormenta Solar / SPE",
    time: "SPE · T+00:03",
    summary: "Pico de protones solares > 150 mSv/h detectado por ISS-RAD / CANS.",
    vitals: {
      ...NOMINAL_VITALS,
      hr: 94,
      sys: 128,
      dia: 82,
      hrv: 38,
      radRateUSvH: 162_000,
      cumDoseMSv: 51.9,
      neutronFlux: 4.8,
    },
    instructions: [
      "Evacuar de inmediato al refugio blindado (Storm Shelter).",
      "Colocar dosímetro personal y cerrar escotilla del módulo.",
      "Permanecer hasta que ISS-RAD reporte < 0.5 mSv/h.",
    ],
  },
};

/** PVC threshold that triggers a WARNING (brief: PVCs > 6/min) */
export const PVC_WARNING_THRESHOLD = 6;
/** Radiation rate that triggers EMERGENCY: 150 mSv/h expressed in µSv/h */
export const SPE_EMERGENCY_USVH = 150_000;

/* ------------------------------------------------------------------ */
/* Alerts                                                              */
/* ------------------------------------------------------------------ */

export interface Alert {
  id: string;
  level: AlertLevel;
  title: string;
  detail: string;
  source: string;
}

export function buildAlerts(vitals: Vitals, link: LinkState): Alert[] {
  const alerts: Alert[] = [];

  if (vitals.radRateUSvH > SPE_EMERGENCY_USVH) {
    alerts.push({
      id: "spe",
      level: "emergency",
      title: "Evento de partículas solares",
      detail: `Tasa ${(vitals.radRateUSvH / 1000).toFixed(0)} mSv/h · Evacuar al Storm Shelter`,
      source: "ISS-RAD + CANS",
    });
  }

  if (vitals.pvcPerMin > PVC_WARNING_THRESHOLD) {
    alerts.push({
      id: "pvc",
      level: "warning",
      title: "Extrasístoles ventriculares",
      detail: `PVCs ${vitals.pvcPerMin}/min · FC ${vitals.hr} bpm`,
      source: "CSA Bio-Monitor · 1D-CNN",
    });
  }

  if (vitals.suitO2 < 80) {
    alerts.push({
      id: "suit-o2",
      level: "warning",
      title: "Reserva O2 del traje",
      detail: `EMU O2 ${vitals.suitO2}% · verificar consumo`,
      source: "Telemetría EMU",
    });
  }

  if (vitals.refractiveShiftD >= 0.75) {
    alerts.push({
      id: "sans",
      level: "warning",
      title: "Desplazamiento hiperópico SANS",
      detail: `+${vitals.refractiveShiftD.toFixed(2)} D ≥ +0.75 D`,
      source: "OCT / Telemetría",
    });
  } else if (vitals.refractiveShiftD >= 0.5) {
    alerts.push({
      id: "sans-trend",
      level: "caution",
      title: "Tendencia refractiva SANS",
      detail: `+${vitals.refractiveShiftD.toFixed(2)} D · vigilar (umbral +0.75 D)`,
      source: "OCT / Telemetría",
    });
  }

  if (vitals.co2 > 2.0) {
    alerts.push({
      id: "co2",
      level: "caution",
      title: "CO2 de cabina elevado",
      detail: `ppCO2 ${vitals.co2.toFixed(1)} mmHg · objetivo < 2.0`,
      source: "ECLSS",
    });
  }

  alerts.push({
    id: "sync",
    level: "advisory",
    title: "Sincronización nocturna completada",
    detail: "Bio-Monitor y Actiwatch → LSAH",
    source: "Red DTN",
  });

  if (link.localAutonomy) {
    alerts.push({
      id: "autonomy",
      level: "advisory",
      title: "Autonomía Médica Local activa",
      detail: `Latencia ${link.latencyLabel} · Cola DTN Store-and-Forward`,
      source: "Gateway a bordo",
    });
  }

  return alerts.sort((a, b) => ALERT_PRIORITY[a.level] - ALERT_PRIORITY[b.level]);
}

/**
 * Contextual suppression (NASA-STD-3001): during a critical phase (EVA / docking)
 * or while an EMERGENCY is active, Caution and Advisory alerts are silenced.
 */
export function filterAlerts(
  alerts: Alert[],
  opts: { criticalPhase: boolean },
): { visible: Alert[]; suppressed: Alert[] } {
  const hasEmergency = alerts.some((a) => a.level === "emergency");
  const suppress = opts.criticalPhase || hasEmergency;
  if (!suppress) return { visible: alerts, suppressed: [] };
  const minor = (a: Alert) => a.level === "caution" || a.level === "advisory";
  return {
    visible: alerts.filter((a) => !minor(a)),
    suppressed: alerts.filter(minor),
  };
}

export function overallLevel(visible: Alert[]): HealthLevel {
  if (visible.some((a) => a.level === "emergency")) return "emergency";
  if (visible.some((a) => a.level === "warning")) return "warning";
  if (visible.some((a) => a.level === "caution")) return "caution";
  return "nominal";
}

export const OVERALL_LABEL: Record<HealthLevel, string> = {
  nominal: "ESTADO NOMINAL",
  advisory: "ESTADO NOMINAL",
  caution: "VIGILANCIA",
  warning: "ACCIÓN RÁPIDA",
  emergency: "EMERGENCIA",
};

/* ------------------------------------------------------------------ */
/* Body systems                                                        */
/* ------------------------------------------------------------------ */

export function systemLevel(system: SystemId, v: Vitals): HealthLevel {
  switch (system) {
    case "cardio":
      if (v.pvcPerMin > PVC_WARNING_THRESHOLD) return "warning";
      if (v.hr > 110 || v.sys > 140) return "caution";
      return "nominal";
    case "neuro":
      if (v.refractiveShiftD >= 0.75) return "warning";
      if (v.refractiveShiftD >= 0.5 || v.iop > 21) return "caution";
      return "nominal";
    case "radiation":
      if (v.radRateUSvH > SPE_EMERGENCY_USVH) return "emergency";
      if (v.radRateUSvH > 50) return "caution";
      return "nominal";
    case "msk":
      if (v.sleepEff < 75 || v.boneLossPct > 1.5) return "caution";
      return "nominal";
  }
}

export const SYSTEM_META: Record<SystemId, { title: string; subtitle: string }> = {
  cardio: { title: "Cardiovascular", subtitle: "FC · PA · HRV · cefalización" },
  neuro: { title: "Neuro-Ocular (SANS)", subtitle: "RNFL · PIO · hiperopía" },
  radiation: { title: "Radiación Ionizante", subtitle: "ISS-RAD · Radi-N2 · CANS" },
  msk: { title: "Sueño, Cognición y Musculoesquelético", subtitle: "Sueño · fatiga · DMO" },
};

export interface ComparisonRow {
  label: string;
  unit: string;
  earth: string;
  space: string;
  flag?: HealthLevel;
}

export function systemComparison(system: SystemId, v: Vitals): ComparisonRow[] {
  const e = EARTH_BASELINE;
  switch (system) {
    case "cardio":
      return [
        { label: "Frecuencia cardíaca", unit: "bpm", earth: `${e.hr}`, space: `${v.hr}`, flag: v.hr > 110 ? "caution" : undefined },
        { label: "Presión arterial", unit: "mmHg", earth: `${e.sys}/${e.dia}`, space: `${v.sys}/${v.dia}`, flag: v.sys > 140 ? "caution" : undefined },
        { label: "HRV (RMSSD)", unit: "ms", earth: `${e.hrv}`, space: `${v.hrv}`, flag: v.hrv < 25 ? "caution" : undefined },
        { label: "Extrasístoles (PVC)", unit: "/min", earth: "0", space: `${v.pvcPerMin}`, flag: v.pvcPerMin > PVC_WARNING_THRESHOLD ? "warning" : undefined },
        { label: "Cefalización de fluidos", unit: "L", earth: "0.0", space: "~1.8", flag: "advisory" },
      ];
    case "neuro":
      return [
        { label: "Espesor RNFL", unit: "µm", earth: `${e.rnfl}`, space: `${v.rnfl}` },
        { label: "Presión intraocular", unit: "mmHg", earth: `${e.iop}`, space: `${v.iop}`, flag: v.iop > 21 ? "caution" : undefined },
        { label: "Desplazamiento hiperópico", unit: "D", earth: "+0.00", space: `+${v.refractiveShiftD.toFixed(2)}`, flag: v.refractiveShiftD >= 0.75 ? "warning" : v.refractiveShiftD >= 0.5 ? "caution" : undefined },
        { label: "Umbral SANS", unit: "D", earth: "—", space: "≥ +0.75" },
      ];
    case "radiation":
      return [
        { label: "Tasa instantánea", unit: "µSv/h", earth: `${e.radRateUSvH}`, space: formatRate(v.radRateUSvH), flag: v.radRateUSvH > SPE_EMERGENCY_USVH ? "emergency" : undefined },
        { label: "Dosis acumulada", unit: "mSv", earth: "2.4/año", space: v.cumDoseMSv.toFixed(1) },
        { label: "Flujo neutrones (CANS)", unit: "n/cm²·s", earth: `${e.neutronFlux}`, space: v.neutronFlux.toFixed(3), flag: v.neutronFlux > 1 ? "emergency" : undefined },
        { label: "Límite carrera NASA", unit: "mSv", earth: "—", space: "600" },
      ];
    case "msk":
      return [
        { label: "Eficiencia de sueño", unit: "%", earth: `${e.sleepEff}`, space: `${v.sleepEff}` },
        { label: "Fatiga pupilar", unit: "idx", earth: `${e.pupilFatigue}`, space: `${v.pupilFatigue}` },
        { label: "Pérdida densidad ósea", unit: "%/mes", earth: "0.0", space: v.boneLossPct.toFixed(1) },
        { label: "Masa muscular (cuádriceps)", unit: "%", earth: "100", space: "96.8" },
      ];
  }
}

export function formatRate(uSvH: number): string {
  if (uSvH >= 1000) return `${(uSvH / 1000).toFixed(0)} mSv/h`;
  return `${uSvH.toFixed(0)}`;
}

/* ------------------------------------------------------------------ */
/* Edge AI explanation (TinyML + XAI)                                  */
/* ------------------------------------------------------------------ */

export interface XaiResult {
  classifier: string;
  label: string;
  confidence: number;
  reconstructionError: number;
  threshold: number;
  factors: { name: string; weight: number; detail: string }[];
}

export function explain(scenario: ScenarioId, v: Vitals): XaiResult {
  if (scenario === "eva") {
    return {
      classifier: "1D-CNN",
      label: "Extrasistolia ventricular (PVC)",
      confidence: 0.96,
      reconstructionError: 0.21,
      threshold: 0.08,
      factors: [
        { name: "Elevación de PVCs", weight: 0.48, detail: `${v.pvcPerMin}/min (> ${PVC_WARNING_THRESHOLD})` },
        { name: "Frecuencia cardíaca", weight: 0.27, detail: `${v.hr} bpm (+${v.hr - NOMINAL_VITALS.hr})` },
        { name: "QRS ensanchado", weight: 0.15, detail: "0.14 s en latidos ectópicos" },
        { name: "Carga metabólica EVA", weight: 0.1, detail: `FR ${v.rr}/min · O2 traje ${v.suitO2}%` },
      ],
    };
  }
  if (scenario === "spe") {
    return {
      classifier: "Fusión dosimétrica",
      label: "Evento de partículas solares (SPE)",
      confidence: 0.99,
      reconstructionError: 0.34,
      threshold: 0.08,
      factors: [
        { name: "Tasa ISS-RAD", weight: 0.55, detail: `${formatRate(v.radRateUSvH)} (> 150 mSv/h)` },
        { name: "Neutrones CANS", weight: 0.3, detail: `${v.neutronFlux.toFixed(1)} n/cm²·s` },
        { name: "Radi-N2 burbujas", weight: 0.1, detail: "Saturación de detectores" },
        { name: "FC por estrés", weight: 0.05, detail: `${v.hr} bpm` },
      ],
    };
  }
  return {
    classifier: "1D-CNN",
    label: "Ritmo sinusal normal",
    confidence: 0.98,
    reconstructionError: 0.012,
    threshold: 0.08,
    factors: [
      { name: "Intervalo RR estable", weight: 0.45, detail: `FC ${v.hr} bpm` },
      { name: "HRV (RMSSD)", weight: 0.3, detail: `${v.hrv} ms dentro de línea base` },
      { name: "Sin ectopia", weight: 0.2, detail: "0 PVC/min" },
      { name: "Morfología QRS", weight: 0.05, detail: "0.09 s" },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Deterministic trend series                                          */
/* ------------------------------------------------------------------ */

export type TrendRange = "1h" | "24h" | "30d";

function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function trendSeries(range: TrendRange, scenario: ScenarioId) {
  const points = range === "1h" ? 30 : range === "24h" ? 48 : 30;
  const v = SCENARIOS[scenario].vitals;
  const out: { t: string; hr: number; hrv: number; dose: number }[] = [];
  for (let i = 0; i < points; i++) {
    const p = i / (points - 1);
    const n = seeded(i + (range === "1h" ? 1 : range === "24h" ? 101 : 301));
    let label: string;
    if (range === "1h") label = `-${Math.round((1 - p) * 60)}m`;
    else if (range === "24h") label = `${String(Math.floor(p * 23.5)).padStart(2, "0")}h`;
    else label = `D${i + 1}`;

    // Acute scenarios only affect the most recent part of short ranges
    const acute = range !== "30d" && p > 0.8 ? (p - 0.8) / 0.2 : 0;
    const baseHr = NOMINAL_VITALS.hr + Math.sin(p * Math.PI * 2) * 5 + (n - 0.5) * 4;
    const hr = baseHr + (v.hr - NOMINAL_VITALS.hr) * acute;
    const hrv = NOMINAL_VITALS.hrv - Math.sin(p * Math.PI * 2) * 4 + (n - 0.5) * 5 + (v.hrv - NOMINAL_VITALS.hrv) * acute;
    const doseBase = range === "30d" ? 30 + p * 12.6 : NOMINAL_VITALS.cumDoseMSv - (1 - p) * (range === "1h" ? 0.02 : 0.4);
    const dose = doseBase + (v.cumDoseMSv - NOMINAL_VITALS.cumDoseMSv) * acute;
    out.push({ t: label, hr: Math.round(hr), hrv: Math.round(hrv), dose: Number(dose.toFixed(2)) });
  }
  return out;
}
