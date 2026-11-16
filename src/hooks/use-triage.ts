import { useCallback, useEffect, useRef, useState } from "react";
import {
  ALL_GREEN,
  SIM_ALERTS,
  TRIAGE_SYSTEMS,
  vitalsTriage,
  type HistoryEntry,
  type SystemAssessment,
  type TranscriptEntry,
  type TriageSource,
  type TriageState,
  type TriageSystem,
} from "@/lib/triage";
import type { ScenarioId, Vitals } from "@/lib/mission";

let seq = 0;
const nextId = () => `n${Date.now().toString(36)}${(seq++).toString(36)}`;

/** Triage state for the 3 avatar systems, shared by the avatar, console and voice assistant. */
export function useTriage(scenario: ScenarioId, baseVitals: Vitals) {
  const [systems, setSystems] = useState<TriageState>(ALL_GREEN);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [highlight, setHighlight] = useState<TriageSystem | null>(null);
  const systemsRef = useRef(systems);
  systemsRef.current = systems;

  const apply = useCallback((updates: Partial<TriageState>, source: TriageSource) => {
    const prev = systemsRef.current;
    const next = { ...prev };
    const entries: HistoryEntry[] = [];
    for (const s of TRIAGE_SYSTEMS) {
      const u: SystemAssessment | undefined = updates[s];
      if (!u) continue;
      if (u.level === prev[s].level && u.finding === prev[s].finding) continue;
      next[s] = u;
      entries.push({ id: nextId(), at: new Date().toISOString(), system: s, level: u.level, finding: u.finding, source });
    }
    if (entries.length === 0) return;
    systemsRef.current = next;
    setSystems(next);
    setHistory((h) => [...entries.reverse(), ...h].slice(0, 60));
  }, []);

  // Telemetry seeds the triage whenever the mission scenario changes
  useEffect(() => {
    apply(vitalsTriage(baseVitals), "telemetry");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  const simulate = useCallback((s: TriageSystem) => {
    apply({ [s]: SIM_ALERTS[s] }, "simulation");
    setHighlight(s);
  }, [apply]);

  const resetAll = useCallback(() => {
    apply(ALL_GREEN, "reset");
    setHighlight(null);
  }, [apply]);

  const say = useCallback((role: TranscriptEntry["role"], text: string) => {
    setTranscript((t) => [...t, { role, text, at: new Date().toISOString() }]);
  }, []);

  const clearTranscript = useCallback(() => setTranscript([]), []);

  return { systems, history, transcript, highlight, setHighlight, apply, simulate, resetAll, say, clearTranscript };
}

export type Triage = ReturnType<typeof useTriage>;
