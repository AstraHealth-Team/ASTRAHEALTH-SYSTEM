import { describe, expect, it } from "vitest";
import { SCENARIOS } from "./mission";
import { ALL_GREEN, buildReport, evaluateAnswer } from "./triage";

describe("English voice triage", () => {
  it("classifies reported palpitations and severe chest pressure", () => {
    const vitals = SCENARIOS.nominal.vitals;

    expect(evaluateAnswer("I have palpitations", "cardio", vitals).updates.cardio?.level).toBe(
      "yellow",
    );
    expect(
      evaluateAnswer("I have severe chest pressure", "cardio", vitals).updates.cardio?.level,
    ).toBe("red");
  });

  it("recognizes an urgent breathing complaint phrased as a contraction", () => {
    const assessment = evaluateAnswer("I can't breathe", "resp", SCENARIOS.nominal.vitals);

    expect(assessment.updates.resp?.level).toBe("red");
  });

  it("keeps a denied symptom at the telemetry baseline", () => {
    const assessment = evaluateAnswer("No chest pain", "cardio", SCENARIOS.nominal.vitals);
    const contraction = evaluateAnswer(
      "I don't have chest pain",
      "cardio",
      SCENARIOS.nominal.vitals,
    );

    expect(assessment.updates.cardio).toEqual(ALL_GREEN.cardio);
    expect(contraction.updates.cardio).toEqual(ALL_GREEN.cardio);
  });

  it("generates an English clinical report", () => {
    const report = buildReport({
      state: ALL_GREEN,
      transcript: [],
      history: [],
      now: new Date("2026-11-15T18:00:00.000Z"),
    });

    expect(report).toContain("CLINICAL REPORT");
    expect(report).toContain("SYSTEM STATUS");
    expect(report).toContain("CONSULTATION TRANSCRIPT");
    expect(report).not.toContain("REPORTE CLÍNICO");
  });
});
