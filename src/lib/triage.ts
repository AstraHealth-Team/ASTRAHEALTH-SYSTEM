/**
 * Voice-triage clinical engine (pure, testable).
 * Classifies the 3 body systems shown on the anatomical avatar
 * (Neurological, Cardiac, Respiratory) as green / yellow / red from
 * the astronaut's spoken or typed answers fused with live vitals.
 */
import type { Vitals } from "./mission";

export type TriageSystem = "neuro" | "cardio" | "resp";
export type TriageLevel = "green" | "yellow" | "red";
export type TriageSource = "voice" | "text" | "telemetry" | "simulation" | "reset";

export const TRIAGE_SYSTEMS: TriageSystem[] = ["neuro", "cardio", "resp"];

export const TRIAGE_RANK: Record<TriageLevel, number> = { green: 0, yellow: 1, red: 2 };

export const TRIAGE_META: Record<TriageSystem, { title: string; zone: string }> = {
  neuro: { title: "Neurological", zone: "Head · brain" },
  cardio: { title: "Cardiac", zone: "Central-left chest" },
  resp: { title: "Respiratory", zone: "Lungs · bilateral chest" },
};

export const LEVEL_NAME: Record<TriageLevel, string> = {
  green: "Green · Nominal",
  yellow: "Yellow · Caution",
  red: "Red · Critical",
};

export interface SystemAssessment {
  level: TriageLevel;
  finding: string;
}

export type TriageState = Record<TriageSystem, SystemAssessment>;

export const ALL_GREEN: TriageState = {
  neuro: { level: "green", finding: "Alert and oriented · no findings" },
  cardio: { level: "green", finding: "No chest pain · stable rhythm" },
  resp: { level: "green", finding: "Normal breathing · stable SpO2" },
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
    text: "First, your level of consciousness. Are you alert and oriented? Do you have a headache, dizziness, confusion, or blurred vision?",
    quick: ["I feel well and oriented", "I have a headache and dizziness", "I feel confused"],
  },
  {
    system: "cardio",
    text: "Now, your heart. Are you experiencing chest pain or pressure, palpitations, or an irregular heartbeat?",
    quick: ["No chest pain", "I have palpitations", "Severe chest pressure"],
  },
  {
    system: "resp",
    text: "Finally, your breathing. Are you having difficulty breathing, shortness of breath, or a sensation of suffocation?",
    quick: ["I am breathing normally", "I am slightly short of breath", "I cannot breathe well"],
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
  // Neurological
  { system: "neuro", level: "red", finding: "Altered level of consciousness", terms: ["unconscious", "faint", "passed out", "lost consciousness", "seizure", "convulsion"] },
  { system: "neuro", level: "red", finding: "Confusion / disorientation", terms: ["confused", "confusion", "disoriented", "do not know where i am"] },
  { system: "neuro", level: "red", finding: "Focal neurological deficit", terms: ["cannot speak", "cannot move", "paralysis", "numb", "facial tingling"] },
  { system: "neuro", level: "yellow", finding: "Reported headache", terms: ["headache", "migraine", "my head hurts"] },
  { system: "neuro", level: "yellow", finding: "Dizziness / vertigo", terms: ["dizzy", "dizziness", "vertigo", "nausea"] },
  { system: "neuro", level: "yellow", finding: "Visual disturbance (possible SANS)", terms: ["blurred vision", "blurry", "cannot see clearly", "eye pressure", "eye pain"] },
  // Cardiac
  { system: "cardio", level: "red", finding: "Pressure-like chest pain", terms: ["pressure", "severe chest pain", "intense pain", "chest feels tight", "left arm", "crushing"] },
  { system: "cardio", level: "yellow", finding: "Palpitations / irregular rhythm", terms: ["palpitation", "irregular", "tachycardia", "racing heart", "pounding heartbeat", "heart is racing"] },
  { system: "cardio", level: "yellow", finding: "Mild chest discomfort", terms: ["chest pain", "chest discomfort", "my chest hurts"] },
  // Respiratory
  { system: "resp", level: "red", finding: "Severe dyspnea / sensation of suffocation", terms: ["cannot breathe", "can t breathe", "cannot catch my breath", "choking", "suffocating", "blue lips", "cyanosis"] },
  { system: "resp", level: "yellow", finding: "Mild dyspnea / shortness of breath", terms: ["short of breath", "shortness of breath", "difficulty breathing", "hard to breathe", "breathing fast", "breathless"] },
  { system: "resp", level: "yellow", finding: "Cough / respiratory irritation", terms: ["cough", "sore throat", "phlegm"] },
];

const NEGATORS = ["no", "not", "without", "never", "neither", "none", "don"];

const NEGATIVE_ANSWER = [
  "i am fine", "i feel fine", "i feel well", "all good", "normal", "oriented", "alert",
  "conscious", "no pain", "i have no", "none", "nothing", "breathing well", "stable", "comfortable", "i do not feel",
  "no chest pain", "don t have chest pain", "no palpitations", "no shortness of breath", "breathing normally",
];

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
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
  return m ? m.index + (m[1] ?? "").length : -1;
}

/** Physiological floor per system from the live vitals */
export function vitalsTriage(v: Vitals): TriageState {
  const neuro: SystemAssessment =
    v.refractiveShiftD >= 0.75 || v.iop > 21
      ? { level: "yellow", finding: `Neuro-ocular telemetry: +${v.refractiveShiftD.toFixed(2)} D · IOP ${v.iop} mmHg` }
      : ALL_GREEN.neuro;

  let cardio: SystemAssessment = ALL_GREEN.cardio;
  if (v.hr > 150 || v.pvcPerMin > 15) cardio = { level: "red", finding: `Telemetry: HR ${v.hr} bpm · PVCs ${v.pvcPerMin}/min` };
  else if (v.pvcPerMin > 6 || v.hr > 110) cardio = { level: "yellow", finding: `Telemetry: PVCs ${v.pvcPerMin}/min · HR ${v.hr} bpm` };

  let resp: SystemAssessment = ALL_GREEN.resp;
  if (v.spo2 < 90) resp = { level: "red", finding: `Telemetry: SpO2 ${v.spo2}% (< 90%)` };
  else if (v.spo2 < 94 || v.rr > 22 || v.co2 > 3 || v.suitO2 < 80)
    resp = { level: "yellow", finding: `Telemetry: RR ${v.rr}/min · ppCO2 ${v.co2.toFixed(1)} mmHg · suit O2 ${v.suitO2}%` };

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
    best.cardio = { level: "red", finding: `${best.cardio.finding} + PVCs ${vitals.pvcPerMin}/min on telemetry` };
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
    green: ["No neurological findings. Continue routine activities and weekly neuro-ocular monitoring (OCT)."],
    yellow: [
      "Assess using the AVPU / Glasgow scale and perform a neuro-ocular examination (OCT, funduscopy, tonometry).",
      "Rest in a restrained sleeping bag and suspend precision tasks.",
      "Administer 500 mL oral fluids and analgesia (acetaminophen 500 mg) per the ISS Medical Checklist.",
      "Reassess in 30 minutes; escalate to the Flight Surgeon (CMO) if symptoms worsen.",
    ],
    red: [
      "Activate the neurological emergency response; the CMO should attend the crewmember immediately.",
      "Secure the airway and position the crewmember laterally with 0-g restraints.",
      "Check capillary blood glucose, administer oxygen at 2–4 L/min, and continuously monitor vital signs.",
      "Initiate a private medical conference (PMC) with the Flight Surgeon; consider emergency return.",
    ],
  },
  cardio: {
    green: ["Stable rhythm. Maintain scheduled ARED/T2 exercise and standard telemetry."],
    yellow: [
      "Obtain a 12-lead ECG using the CSA Bio-Monitor and quantify PVCs.",
      "Stop exercise and reduce metabolic demand; if on EVA, pause the spacewalk.",
      "Assess electrolytes (K+, Mg2+) and hydration.",
      "Continue telemetry and reassess in 15 minutes.",
    ],
    red: [
      "Activate the onboard ACLS protocol; prepare the automated external defibrillator (AED) and cardiac kit.",
      "Administer chewable aspirin 325 mg for chest pain if not contraindicated.",
      "Administer supplemental oxygen and maintain continuous ECG monitoring.",
      "Notify the Flight Surgeon (MCC) immediately; assess the need for emergency return.",
    ],
  },
  resp: {
    green: ["Normal breathing. Maintain cabin ppCO2 below 2.0 mmHg (ECLSS)."],
    yellow: [
      "Measure SpO2 and respiratory rate; verify cabin ppCO2 (ECLSS).",
      "Reduce exertion and increase module ventilation.",
      "If on EVA, verify suit O2 and the EMU CO2 scrubber.",
      "Reassess in 10 minutes.",
    ],
    red: [
      "Administer 100% oxygen by mask immediately.",
      "If on EVA, terminate the spacewalk and return to the airlock.",
      "Assess for pneumothorax or decompression illness; check cabin pressure.",
      "Notify the Flight Surgeon and prepare assisted ventilation (bag-valve mask).",
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Simulation presets (test menu)                                      */
/* ------------------------------------------------------------------ */

export const SIM_ALERTS: Record<TriageSystem, SystemAssessment> = {
  neuro: { level: "red", finding: "Reported confusion and severe headache" },
  cardio: { level: "red", finding: "Pressure-like chest pain + PVCs" },
  resp: { level: "yellow", finding: "Mild dyspnea · RR 26/min" },
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
    return "Preliminary assessment: all three systems are nominal. No warning signs detected. Continue your routine; I will reassess you at the next check.";
  }
  const parts = affected.map(
    (s) => `${TRIAGE_META[s].title} ${state[s].level === "red" ? "critical" : "caution"}: ${state[s].finding.toLowerCase()}`,
  );
  const worst = worstLevel(state);
  const top = [...affected].sort((a, b) => TRIAGE_RANK[state[b].level] - TRIAGE_RANK[state[a].level])[0] ?? "neuro";
  const first = RECOMMENDATIONS[top][worst][0] ?? "";
  return `Preliminary assessment: ${parts.join("; ")}. ${worst === "red" ? "This is urgent." : "Monitoring is required."} First action: ${first} See the notification console for the complete protocol.`;
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
  lines.push("CLINICAL REPORT · ASTRA Health HMI");
  lines.push("=".repeat(44));
  lines.push(`Date/time (UTC): ${now.toISOString().replace("T", " ").slice(0, 19)}`);
  if (opts.mission) lines.push(`Mission: ${opts.mission}`);
  lines.push(`Overall status: ${LEVEL_NAME[worstLevel(state)]}`);
  lines.push("");
  lines.push("SYSTEM STATUS");
  for (const s of TRIAGE_SYSTEMS) {
    lines.push(`- ${TRIAGE_META[s].title}: ${LEVEL_NAME[state[s].level]} — ${state[s].finding}`);
  }
  lines.push("");
  lines.push("FINDINGS");
  const findings = history.filter((h) => h.level !== "green");
  if (findings.length === 0) lines.push("- No alert-level findings.");
  for (const h of findings) lines.push(`- [${t(h.at)}] ${TRIAGE_META[h.system].title} · ${LEVEL_NAME[h.level]} · ${h.finding} (${h.source})`);
  lines.push("");
  lines.push("RECOMMENDATIONS");
  for (const s of TRIAGE_SYSTEMS) {
    const lvl = state[s].level;
    lines.push(`${TRIAGE_META[s].title} (${LEVEL_NAME[lvl]}):`);
    for (const r of RECOMMENDATIONS[s][lvl]) lines.push(`  • ${r}`);
  }
  lines.push("");
  lines.push("CONSULTATION TRANSCRIPT");
  if (transcript.length === 0) lines.push("- No voice consultation recorded.");
  for (const e of transcript) lines.push(`[${t(e.at)}] ${e.role === "ia" ? "ASTRA" : "Crewmember"}: ${e.text}`);
  lines.push("");
  lines.push("Onboard decision support only · final decision rests with the CMO / Flight Surgeon.");
  return lines.join("\n");
}

/** Short spoken acknowledgement after an answer */
export function acknowledge(
  focus: TriageSystem | null,
  updates: Partial<TriageState>,
  merged: TriageState,
): string {
  const word = (l: TriageLevel) => (l === "red" ? "critical" : l === "yellow" ? "caution" : "nominal");
  const parts: string[] = [];
  if (focus) {
    const a = merged[focus];
    const title = TRIAGE_META[focus].title.toLowerCase();
    if (!updates[focus]) parts.push(`No clear symptoms reported; the ${title} system remains ${word(a.level)}.`);
    else if (a.level === "green") parts.push(`Understood. The ${title} system is nominal.`);
    else parts.push(`Recorded ${a.finding.toLowerCase()}: ${title} system is ${word(a.level)}.`);
  }
  for (const s of TRIAGE_SYSTEMS) {
    if (s === focus) continue;
    const u = updates[s];
    if (u && u.level !== "green") parts.push(`Also noted ${u.finding.toLowerCase()}: ${TRIAGE_META[s].title.toLowerCase()} system is ${word(u.level)}.`);
  }
  return parts.join(" ");
}
