import { describe, expect, it } from "vitest";
import {
  SCENARIOS,
  buildAlerts,
  filterAlerts,
  getLinkState,
  overallLevel,
  systemLevel,
} from "./mission";

describe("mission latency profiles", () => {
  it("LEO has ~0 s latency over a real-time TDRSS link", () => {
    const l = getLinkState("leo");
    expect(l.latencySeconds).toBe(0);
    expect(l.realtime).toBe(true);
    expect(l.localAutonomy).toBe(false);
  });

  it("Lunar orbit has 1.3 s latency", () => {
    expect(getLinkState("lunar").latencySeconds).toBe(1.3);
  });

  it("Mars transit clamps latency to 4–24 min and enables local autonomy + DTN queue", () => {
    expect(getLinkState("mars", 1).latencySeconds).toBe(4 * 60);
    expect(getLinkState("mars", 40).latencySeconds).toBe(24 * 60);
    const l = getLinkState("mars", 12);
    expect(l.localAutonomy).toBe(true);
    expect(l.realtime).toBe(false);
  });
});

describe("operational scenarios", () => {
  const leo = getLinkState("leo");

  it("routine scenario reads as nominal", () => {
    const { visible } = filterAlerts(buildAlerts(SCENARIOS.nominal.vitals, leo), { criticalPhase: false });
    expect(overallLevel(visible)).toBe("nominal");
  });

  it("EVA arrhythmia (PVCs > 6/min) raises a WARNING", () => {
    expect(SCENARIOS.eva.vitals.pvcPerMin).toBeGreaterThan(6);
    const alerts = buildAlerts(SCENARIOS.eva.vitals, leo);
    expect(alerts.find((a) => a.id === "pvc")?.level).toBe("warning");
    expect(systemLevel("cardio", SCENARIOS.eva.vitals)).toBe("warning");
  });

  it("solar storm above 150 mSv/h raises an EMERGENCY", () => {
    const alerts = buildAlerts(SCENARIOS.spe.vitals, leo);
    expect(alerts[0]?.level).toBe("emergency");
    expect(systemLevel("radiation", SCENARIOS.spe.vitals)).toBe("emergency");
  });
});

describe("contextual alert suppression", () => {
  const mars = getLinkState("mars", 12);

  it("critical phase silences Caution and Advisory but keeps Warning", () => {
    const alerts = buildAlerts(SCENARIOS.eva.vitals, mars);
    const { visible, suppressed } = filterAlerts(alerts, { criticalPhase: true });
    expect(visible.every((a) => a.level === "warning" || a.level === "emergency")).toBe(true);
    expect(suppressed.length).toBeGreaterThan(0);
    expect(visible.some((a) => a.level === "warning")).toBe(true);
  });

  it("an active EMERGENCY suppresses secondary alerts even outside critical phase", () => {
    const alerts = buildAlerts(SCENARIOS.spe.vitals, mars);
    const { visible } = filterAlerts(alerts, { criticalPhase: false });
    expect(visible.some((a) => a.level === "advisory" || a.level === "caution")).toBe(false);
  });

  it("without critical phase or emergency, advisories are shown", () => {
    const { visible } = filterAlerts(buildAlerts(SCENARIOS.nominal.vitals, mars), { criticalPhase: false });
    expect(visible.some((a) => a.level === "advisory")).toBe(true);
  });
});
