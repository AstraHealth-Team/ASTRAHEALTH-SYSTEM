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

    expect(screen.getByText("Todos operativos")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getByText("4/4 conectados")).toBeInTheDocument();

    const scenarioSelector = screen.getByRole("group", { name: "Escenarios de red biomédica" });
    expect(within(scenarioSelector).getAllByRole("button")).toHaveLength(3);
    for (const scenario of SENSOR_NETWORK_SCENARIOS) {
      expect(
        within(scenarioSelector).getByRole("button", { name: new RegExp(scenario.astronaut) }),
      ).toHaveTextContent(scenario.network);
    }

    const selectedController = screen.getByRole("article", {
      name: "Controlador 02, Escenario 02, Red del Traje",
    });
    expect(within(selectedController).getByText("89%")).toBeInTheDocument();
    expect(within(selectedController).getByText("ON")).toBeInTheDocument();
    expect(within(selectedController).getByText("Conectado")).toBeInTheDocument();

    const standbyController = screen.getByRole("article", {
      name: "Controlador 01, Escenario 01, Red Corporal",
    });
    expect(within(standbyController).getByText("OFF")).toBeInTheDocument();
    expect(within(standbyController).getByText("En espera")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Centro de análisis/ }));
    expect(onScenarioChange).toHaveBeenCalledWith("analysis");
  });
});
