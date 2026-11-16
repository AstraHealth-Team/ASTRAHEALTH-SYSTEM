import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SCENARIOS } from "@/lib/mission";
import { ALL_GREEN } from "@/lib/triage";
import { VitalKpis } from "./VitalKpis";

describe("VitalKpis", () => {
  it("shows exactly the five requested live vital indicators with units", () => {
    render(
      <VitalKpis vitals={SCENARIOS.nominal.vitals} systems={ALL_GREEN} overallLevel="nominal" />,
    );

    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(5);
    expect(within(cards[0]).getByText("68")).toBeInTheDocument();
    expect(within(cards[0]).getByText("bpm")).toBeInTheDocument();
    expect(screen.getByLabelText("Blood Pressure: 116/74 mmHg")).toBeInTheDocument();
    expect(screen.getByLabelText("Respiratory Rate: 14 breaths/min")).toBeInTheDocument();
    expect(screen.getByLabelText("Body Temperature: 36.8 °C")).toBeInTheDocument();
    expect(screen.getByLabelText("Oxygen Saturation / SpO2: 98 %")).toBeInTheDocument();
  });
});
