import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SENSOR_NETWORK_SCENARIOS } from "@/lib/sensor-network";
import { SensorNetworkTopology } from "./SensorNetworkTopology";

describe("SensorNetworkTopology", () => {
  it("shows three operational routes and selected/standby controller telemetry", () => {
    const onScenarioChange = vi.fn();
    render(
      <SensorNetworkTopology
        tick={0}
        selectedScenario="suit"
        onScenarioChange={onScenarioChange}
      />,
    );

    expect(screen.getByText("All Operational")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getByText("4/4 Connected")).toBeInTheDocument();

    const scenarioSelector = screen.getByRole("group", { name: "Biomedical Network Scenarios" });
    expect(within(scenarioSelector).getAllByRole("button")).toHaveLength(3);
    for (const scenario of SENSOR_NETWORK_SCENARIOS) {
      expect(
        within(scenarioSelector).getByRole("button", { name: new RegExp(scenario.astronaut) }),
      ).toHaveTextContent(scenario.network);
    }

    const selectedController = screen.getByRole("article", {
      name: "Controller 02, Scenario 02, Suit Network",
    });
    expect(within(selectedController).getByText("89%")).toBeInTheDocument();
    expect(within(selectedController).getByText("ON")).toBeInTheDocument();
    expect(within(selectedController).getByText("Connected")).toBeInTheDocument();

    const standbyController = screen.getByRole("article", {
      name: "Controller 01, Scenario 01, Body Area Network",
    });
    expect(within(standbyController).getByText("OFF")).toBeInTheDocument();
    expect(within(standbyController).getByText("Standby")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Scenario 03: Analysis Center/ }));
    expect(onScenarioChange).toHaveBeenCalledWith("analysis");
  });
});
