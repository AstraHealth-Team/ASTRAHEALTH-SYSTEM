/**
 * Voice-triage clinical engine (pure, testable).
 * Classifies the 3 body systems shown on the anatomical avatar
 * (Neurológico, Cardiaco, Respiratorio) as green / yellow / red from
 * the astronaut's spoken or typed answers fused with live vitals.
 */
import type { Vitals } from "./mission";

export type TriageSystem = "neuro" | "cardio" | "resp";
export type TriageLevel = "green" | "yellow" | "red";
export type TriageSource = "voz" | "texto" | "telemetria" | "simulacion" | "reinicio";

export const TRIAGE_SYSTEMS: TriageSystem[] = ["neuro", "cardio", "resp"];

export const TRIAGE_RANK: Record<TriageLevel, number> = { green: 0, yellow: 1, red: 2 };

export const TRIAGE_META: Record<TriageSystem, { title: string; zone: string }> = {
  neuro: { title: "Neurológico", zone: "Cabeza · cerebro" },
  cardio: { title: "Cardiaco", zone: "Tórax central-izquierdo" },
  resp: { title: "Respiratorio", zone: "Pulmones · tórax bilateral" },
};

export const LEVEL_NAME: Record<TriageLevel, string> = {
  green: "Verde · Nominal",
  yellow: "Amarillo · Precaución",
  red: "Rojo · Crítico",
};

export interface SystemAssessment {
  level: TriageLevel;
  finding: string;
}

export type TriageState = Record<TriageSystem, SystemAssessment>;

export const ALL_GREEN: TriageState = {
  neuro: { level: "green", finding: "Consciente y orientado · sin hallazgos" },
  cardio: { level: "green", finding: "Sin dolor torácico · ritmo estable" },
  resp: { level: "green", finding: "Respiración normal · SpO2 estable" },
};

export function maxLevel(a: TriageLevel, b: TriageLevel): TriageLevel {
  return TRIAGE_RANK[a] >= TRIAGE_RANK[b] ? a : b;
}

/* ------------------------------------------------------------------ */
/* Questions                                                           */
/* ------------------------------------------------------------------ */

export const TRIAGE_QUESTIONS: { system: TriageSystem; text: string; quick: string[] }[] = [
  {
    system: "neuro",
    text: "Primero, tu estado de conciencia. ¿Estás orientado y alerta? ¿Tienes dolor de cabeza, mareo, confusión o visión borrosa?",
    quick: ["Estoy bien y orientado", "Tengo dolor de cabeza y mareo", "Me siento confundido"],
  },
  {
    system: "cardio",
    text: "Ahora tu corazón. ¿Sientes dolor u opresión en el pecho, palpitaciones o latidos irregulares?",
    quick: ["Sin dolor en el pecho", "Tengo palpitaciones", "Opresión fuerte en el pecho"],
  },
  {
    system: "resp",
    text: "Por último, tu respiración. ¿Tienes dificultad para respirar, falta de aire o sensación de ahogo?",
    quick: ["Respiro con normalidad", "Me falta un poco el aire", "No puedo respirar bien"],
  },
];

/* ------------------------------------------------------------------ */
/* Keyword rules                                                       */
/* ------------------------------------------------------------------ */

interface Rule {
  system: TriageSystem;
  level: TriageLevel;
  finding: string;
  /** normalized (lowercase, no accents) phrases */
  terms: string[];
}

const RULES: Rule[] = [
  // Neurológico
  { system: "neuro", level: "red", finding: "Alteración del estado de conciencia", terms: ["inconsciente", "desmay", "perdi el conocimiento", "perdida de conocimiento", "convuls"] },
  { system: "neuro", level: "red", finding: "Confusión / desorientación", terms: ["confundid", "confusion", "desorientad", "no se donde estoy"] },
  { system: "neuro", level: "red", finding: "Déficit neurológico focal", terms: ["no puedo hablar", "no puedo mover", "paralisis", "entumecid", "hormigueo en la cara"] },
  { system: "neuro", level: "yellow", finding: "Cefalea referida", terms: ["dolor de cabeza", "cefalea", "me duele la cabeza", "migrana", "jaqueca"] },
  { system: "neuro", level: "yellow", finding: "Mareo / vértigo", terms: ["mareo", "marea", "vertigo", "nausea"] },
  { system: "neuro", level: "yellow", finding: "Alteración visual (posible SANS)", terms: ["vision borrosa", "borros", "veo mal", "presion en los ojos", "dolor en los ojos"] },
  // Cardiaco
  { system: "cardio", level: "red", finding: "Dolor torácico opresivo", terms: ["opresion", "dolor fuerte en el pecho", "dolor intenso", "me aprieta el pecho", "brazo izquierdo", "aplast"] },
  { system: "cardio", level: "yellow", finding: "Palpitaciones / ritmo irregular", terms: ["palpitacion", "irregular", "taquicardia", "corazon acelerado", "latidos fuertes", "se me acelera"] },
  { system: "cardio", level: "yellow", finding: "Molestia torácica leve", terms: ["dolor en el pecho", "molestia en el pecho", "me duele el pecho", "dolor toracico"] },
  // Respiratorio
  { system: "resp", level: "red", finding: "Disnea severa / sensación de ahogo", terms: ["no puedo respirar", "ahog", "asfixi", "labios azules", "cianosis"] },
  { system: "resp", level: "yellow", finding: "Disnea leve / falta de aire", terms: ["falta el aire", "falta de aire", "me falta", "dificultad para respirar", "cuesta respirar", "respiro rapido", "agitad"] },
  { system: "resp", level: "yellow", finding: "Tos / irritación respiratoria", terms: ["tos", "me pica la garganta", "flema"] },
];

const NEGATORS = ["no", "sin", "ningun", "ninguna", "nunca", "tampoco", "nada"];

const NEGATIVE_ANSWER = [
  "estoy bien", "me siento bien", "todo bien", "normal", "orientad", "alerta", "consciente",
  "sin dolor", "no tengo", "ninguno", "ninguna", "nada", "respiro bien", "estable", "tranquilo", "no siento",
];

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when a negator appears within the 3 words before `index` */
function isNegated(norm: string, index: number): boolean {
  const before = norm.slice(0, index).trim().split(" ").slice(-3);
  return before.some((w) => NEGATORS.includes(w));
}

function findTerm(norm: string, term: string): number {
  // whole-word start match
  const re = new RegExp(`(^|\\s)${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  const m = re.exec(norm);
  return m ? m.index + m[1].length : -1;
}

/** Physiological floor per system from the live vitals */
export function vitalsTriage(v: Vitals): TriageState {
  const neuro: SystemAssessment =
    v.refractiveShiftD >= 0.75 || v.iop > 21
      ? { level: "yellow", finding: `Telemetría neuro-ocular: +${v.refractiveShiftD.toFixed(2)} D · PIO ${v.iop} mmHg` }
      : ALL_GREEN.neuro;

  let cardio: SystemAssessment = ALL_GREEN.cardio;
  if (v.hr > 150 || v.pvcPerMin > 15) cardio = { level: "red", finding: `Telemetría: FC ${v.hr} bpm · PVCs ${v.pvcPerMin}/min` };
  else if (v.pvcPerMin > 6 || v.hr > 110) cardio = { level: "yellow", finding: `Telemetría: PVCs ${v.pvcPerMin}/min · FC ${v.hr} bpm` };

  let resp: SystemAssessment = ALL_GREEN.resp;
  if (v.spo2 < 90) resp = { level: "red", finding: `Telemetría: SpO2 ${v.spo2}% (< 90%)` };
  else if (v.spo2 < 94 || v.rr > 22 || v.co2 > 3 || v.suitO2 < 80)
    resp = { level: "yellow", finding: `Telemetría: FR ${v.rr}/min · ppCO2 ${v.co2.toFixed(1)} mmHg · O2 traje ${v.suitO2}%` };

  return { neuro, cardio, resp };
}

export interface Evaluation {
  /** Updated per-system assessment for systems the answer informs */
  updates: Partial<TriageState>;
  /** Human-readable matched findings */
  findings: string[];
}

/**
 * Evaluate one answer. `focus` is the system the question was about:
 * a reassuring answer sets it to green (never below the vitals floor);
 * other systems are only escalated when the answer mentions them.
 */
export function evaluateAnswer(text: string, focus: TriageSystem | null, vitals: Vitals | null): Evaluation {
  const norm = normalize(text);
  const best: Partial<Record<TriageSystem, SystemAssessment>> = {};
  const findings: string[] = [];

  for (const rule of RULES) {
    for (const term of rule.terms) {
      const at = findTerm(norm, term);
      if (at < 0) continue;
      // "no puedo respirar" contains its own negator; only check words before the phrase
      if (isNegated(norm, at)) continue;
      const prev = best[rule.system];
      if (!prev || TRIAGE_RANK[rule.level] > TRIAGE_RANK[prev.level]) {
        best[rule.system] = { level: rule.level, finding: rule.finding };
      }
      findings.push(rule.finding);
      break;
    }
  }

  const floor = vitals ? vitalsTriage(vitals) : ALL_GREEN;

  // Clinical correlation: reported palpitations + ectopy on telemetry → critical
  if (vitals && best.cardio?.level === "yellow" && vitals.pvcPerMin > 6) {
    best.cardio = { level: "red", finding: `${best.cardio.finding} + PVCs ${vitals.pvcPerMin}/min en telemetría` };
  }
  // Reported dyspnea + low saturation → critical
  if (vitals && best.resp?.level === "yellow" && vitals.spo2 < 92) {
    best.resp = { level: "red", finding: `${best.resp.finding} + SpO2 ${vitals.spo2}%` };
  }

  const updates: Partial<TriageState> = {};
  for (const sys of TRIAGE_SYSTEMS) {
    const reported = best[sys];
    if (reported) {
      updates[sys] =
        TRIAGE_RANK[floor[sys].level] > TRIAGE_RANK[reported.level] ? floor[sys] : reported;
    } else if (sys === focus && NEGATIVE_ANSWER.some((t) => norm.includes(t))) {
      updates[sys] = floor[sys];
    }
  }
  return { updates, findings };
}

/* ------------------------------------------------------------------ */
/* Recommendations                                                     */
/* ------------------------------------------------------------------ */

export const RECOMMENDATIONS: Record<TriageSystem, Record<TriageLevel, string[]>> = {
  neuro: {
    green: ["Sin hallazgos neurológicos. Continuar rutina y control neuro-ocular semanal (OCT)."],
    yellow: [
      "Evaluar con escala AVPU / Glasgow y examen neuro-ocular (OCT, fondo de ojo, tonometría).",
      "Reposo en el saco de dormir sujeto y suspender tareas de precisión.",
      "Hidratación oral 500 mL y analgesia (paracetamol 500 mg) según ISS Medical Checklist.",
      "Reevaluar en 30 min; si empeora, escalar al Oficial Médico (CMO).",
    ],
    red: [
      "Activar emergencia neurológica: el CMO debe acudir junto al tripulante de inmediato.",
      "Asegurar vía aérea y posición lateral de seguridad con sujeción en 0g.",
      "Glucemia capilar, oxígeno 2–4 L/min y registro continuo de signos vitales.",
      "Conferencia médica privada (PMC) con el Cirujano de Vuelo; valorar retorno de emergencia.",
    ],
  },
  cardio: {
    green: ["Ritmo estable. Mantener ejercicio ARED/T2 programado y telemetría estándar."],
    yellow: [
      "ECG de 12 derivaciones con el CSA Bio-Monitor y conteo de PVCs.",
      "Suspender ejercicio y reducir la tasa metabólica; si está en EVA, pausar la caminata.",
      "Revisar electrolitos (K+, Mg2+) e hidratación.",
      "Telemetría continua y reevaluación en 15 min.",
    ],
    red: [
      "Activar protocolo ACLS a bordo: preparar desfibrilador (AED) y kit cardíaco.",
      "Aspirina 325 mg masticable si hay dolor torácico y no hay contraindicación.",
      "Oxígeno suplementario y monitorización ECG continua.",
      "Notificar al Cirujano de Vuelo (MCC) de inmediato; evaluar regreso de emergencia.",
    ],
  },
  resp: {
    green: ["Respiración normal. Mantener ppCO2 de cabina < 2.0 mmHg (ECLSS)."],
    yellow: [
      "Medir SpO2 y frecuencia respiratoria; verificar ppCO2 de cabina (ECLSS).",
      "Reducir el esfuerzo y aumentar la ventilación del módulo.",
      "Si está en EVA: verificar O2 y depurador de CO2 del traje (EMU).",
      "Reevaluar en 10 min.",
    ],
    red: [
      "Oxígeno al 100 % por mascarilla de inmediato.",
      "Si está en EVA: abortar la caminata y regresar a la esclusa.",
      "Descartar neumotórax o descompresión: revisar presión de cabina.",
      "Notificar al Cirujano de Vuelo y preparar ventilación asistida (Ambu).",
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Simulation presets (test menu)                                      */
/* ------------------------------------------------------------------ */

export const SIM_ALERTS: Record<TriageSystem, SystemAssessment> = {
  neuro: { level: "red", finding: "Confusión y cefalea intensa referidas" },
  cardio: { level: "red", finding: "Dolor torácico opresivo + PVCs" },
  resp: { level: "yellow", finding: "Disnea leve · FR 26/min" },
};

/* ------------------------------------------------------------------ */
/* Spoken diagnosis + report                                           */
/* ------------------------------------------------------------------ */

export function worstLevel(state: TriageState): TriageLevel {
  return TRIAGE_SYSTEMS.reduce<TriageLevel>((acc, s) => maxLevel(acc, state[s].level), "green");
}

export function diagnosisSummary(state: TriageState): string {
  const affected = TRIAGE_SYSTEMS.filter((s) => state[s].level !== "green");
  if (affected.length === 0) {
    return "Diagnóstico preliminar: los tres sistemas están en verde. No detecto signos de alarma. Continúa tu rutina; volveré a evaluarte en el próximo control.";
  }
  const parts = affected.map(
    (s) => `${TRIAGE_META[s].title} en ${state[s].level === "red" ? "rojo" : "amarillo"}, por ${state[s].finding.toLowerCase()}`,
  );
  const worst = worstLevel(state);
  const first = RECOMMENDATIONS[affected.sort((a, b) => TRIAGE_RANK[state[b].level] - TRIAGE_RANK[state[a].level])[0]][worst][0];
  return `Diagnóstico preliminar: ${parts.join("; ")}. ${worst === "red" ? "Es urgente." : "Requiere vigilancia."} Primera acción: ${first} Revisa la consola de notificaciones para el protocolo completo.`;
}

export interface TranscriptEntry {
  role: "ia" | "usuario";
  text: string;
  at: string; // ISO
}

export interface HistoryEntry {
  id: string;
  at: string; // ISO
  system: TriageSystem;
  level: TriageLevel;
  finding: string;
  source: TriageSource;
}

export function buildReport(opts: {
  state: TriageState;
  transcript: TranscriptEntry[];
  history: HistoryEntry[];
  now: Date;
  mission?: string;
}): string {
  const { state, transcript, history, now } = opts;
  const t = (iso: string) => new Date(iso).toISOString().slice(11, 19);
  const lines: string[] = [];
  lines.push("REPORTE CLÍNICO · ASTRA Health HMI");
  lines.push("=".repeat(44));
  lines.push(`Fecha/hora (UTC): ${now.toISOString().replace("T", " ").slice(0, 19)}`);
  if (opts.mission) lines.push(`Misión: ${opts.mission}`);
  lines.push(`Estado global: ${LEVEL_NAME[worstLevel(state)]}`);
  lines.push("");
  lines.push("ESTADO DE LOS SISTEMAS");
  for (const s of TRIAGE_SYSTEMS) {
    lines.push(`- ${TRIAGE_META[s].title}: ${LEVEL_NAME[state[s].level]} — ${state[s].finding}`);
  }
  lines.push("");
  lines.push("HALLAZGOS");
  const findings = history.filter((h) => h.level !== "green");
  if (findings.length === 0) lines.push("- Sin hallazgos de alarma.");
  for (const h of findings) lines.push(`- [${t(h.at)}] ${TRIAGE_META[h.system].title} · ${LEVEL_NAME[h.level]} · ${h.finding} (${h.source})`);
  lines.push("");
  lines.push("RECOMENDACIONES");
  for (const s of TRIAGE_SYSTEMS) {
    const lvl = state[s].level;
    lines.push(`${TRIAGE_META[s].title} (${LEVEL_NAME[lvl]}):`);
    for (const r of RECOMMENDATIONS[s][lvl]) lines.push(`  • ${r}`);
  }
  lines.push("");
  lines.push("TRANSCRIPCIÓN DE LA CONSULTA");
  if (transcript.length === 0) lines.push("- Sin consulta por voz registrada.");
  for (const e of transcript) lines.push(`[${t(e.at)}] ${e.role === "ia" ? "IA" : "Tripulante"}: ${e.text}`);
  lines.push("");
  lines.push("Sugerencia no vinculante generada a bordo · decisión final del CMO / Cirujano de Vuelo.");
  return lines.join("\n");
}

/** Short spoken acknowledgement after an answer */
export function acknowledge(
  focus: TriageSystem | null,
  updates: Partial<TriageState>,
  merged: TriageState,
): string {
  const word = (l: TriageLevel) => (l === "red" ? "rojo" : l === "yellow" ? "amarillo" : "verde");
  const parts: string[] = [];
  if (focus) {
    const a = merged[focus];
    const title = TRIAGE_META[focus].title.toLowerCase();
    if (!updates[focus]) parts.push(`Sin síntomas claros; mantengo el sistema ${title} en ${word(a.level)}.`);
    else if (a.level === "green") parts.push(`Entendido, sistema ${title} en verde.`);
    else parts.push(`Registro ${a.finding.toLowerCase()}: sistema ${title} en ${word(a.level)}.`);
  }
  for (const s of TRIAGE_SYSTEMS) {
    if (s === focus) continue;
    const u = updates[s];
    if (u && u.level !== "green") parts.push(`También anoto ${u.finding.toLowerCase()}: ${TRIAGE_META[s].title.toLowerCase()} en ${word(u.level)}.`);
  }
  return parts.join(" ");
}
