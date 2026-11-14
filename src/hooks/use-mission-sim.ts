import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SCENARIOS,
  buildAlerts,
  explain,
  filterAlerts,
  getLinkState,
  overallLevel,
  type MissionProfile,
  type ScenarioId,
  type Vitals,
  type ViewMode,
} from "@/lib/mission";

export interface DtnStats {
  generated: number;
  delivered: number;
  queued: number;
  inFlight: number;
}

export interface Countermeasures {
  exerciseMin: number;
  vitaminB: number;
  hydrationMl: number;
  sleepEff: number;
}

function jitter(v: Vitals, tick: number): Vitals {
  const w = (k: number) => Math.sin(tick * 0.7 + k) * 0.5 + Math.sin(tick * 1.9 + k * 2) * 0.5;
  return {
    ...v,
    hr: Math.round(v.hr + w(1) * 2),
    sys: Math.round(v.sys + w(2) * 1.5),
    dia: Math.round(v.dia + w(3)),
    hrv: Math.max(5, Math.round(v.hrv + w(4) * 2)),
    spo2: Math.min(100, Math.round(v.spo2 + w(5) * 0.6)),
    rr: Math.round(v.rr + w(6) * 0.8),
    radRateUSvH: Math.max(0.1, v.radRateUSvH * (1 + w(7) * 0.04)),
    co2: Number((v.co2 + w(8) * 0.05).toFixed(2)),
    cumDoseMSv: v.cumDoseMSv,
  };
}

export function useMissionSim() {
  const [profile, setProfile] = useState<MissionProfile>("leo");
  const [marsMinutes, setMarsMinutes] = useState(12);
  const [scenario, setScenarioState] = useState<ScenarioId>("nominal");
  const [view, setView] = useState<ViewMode>("astronaut");
  const [criticalPhase, setCriticalPhase] = useState(false);
  const [tick, setTick] = useState(0);
  const [dtn, setDtn] = useState<DtnStats>({ generated: 1284, delivered: 1284, queued: 0, inFlight: 0 });
  const [counter, setCounter] = useState<Countermeasures>({
    exerciseMin: 84,
    vitaminB: 0,
    hydrationMl: 1750,
    sleepEff: 88,
  });

  const link = useMemo(() => getLinkState(profile, marsMinutes), [profile, marsMinutes]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  // DTN bundle flow: ~4 bundles/s from the on-board gateway
  useEffect(() => {
    if (tick === 0) return;
    setDtn((d) => {
      const generated = d.generated + 4;
      if (link.realtime && link.latencySeconds === 0) {
        return { generated, delivered: generated, queued: 0, inFlight: 0 };
      }
      if (link.realtime) {
        // Lunar: ~1.3 s of bundles in flight, backlog drains
        const inFlight = 5;
        const delivered = Math.min(generated - inFlight, d.delivered + 4 + Math.ceil(d.queued / 2));
        return { generated, delivered, queued: Math.max(0, generated - delivered - inFlight), inFlight };
      }
      // Mars: link with Earth cut → custody storage, store-and-forward
      return { generated, delivered: d.delivered, queued: d.queued + 4, inFlight: 0 };
    });
  }, [tick, link.realtime, link.latencySeconds]);

  const setScenario = useCallback((id: ScenarioId) => {
    setScenarioState(id);
    setCriticalPhase(id === "eva");
    if (id === "eva") setView((v) => (v === "surgeon" ? "astronaut" : v));
  }, []);

  const vitals = useMemo(() => jitter(SCENARIOS[scenario].vitals, tick), [scenario, tick]);
  const baseVitals = SCENARIOS[scenario].vitals;
  const alerts = useMemo(() => buildAlerts(baseVitals, link), [baseVitals, link]);
  const { visible, suppressed } = useMemo(
    () => filterAlerts(alerts, { criticalPhase }),
    [alerts, criticalPhase],
  );
  const level = overallLevel(visible);
  const xai = useMemo(() => explain(scenario, baseVitals), [scenario, baseVitals]);

  return {
    profile,
    setProfile,
    marsMinutes,
    setMarsMinutes,
    scenario,
    setScenario,
    view,
    setView,
    criticalPhase,
    setCriticalPhase,
    tick,
    link,
    dtn,
    vitals,
    alerts: visible,
    suppressed,
    level,
    xai,
    counter,
    setCounter,
  };
}

export type MissionSim = ReturnType<typeof useMissionSim>;
