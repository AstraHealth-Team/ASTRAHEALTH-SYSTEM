import { describe, expect, it } from "vitest";
import {
  getBiomedicalSensorTelemetry,
  getControllerTelemetry,
  SENSOR_NETWORK_SCENARIOS,
} from "./sensor-network";

describe("biomedical sensor telemetry", () => {
  it("reports all four simplified sensors with battery and connectivity", () => {
    const sensors = getBiomedicalSensorTelemetry(0);

    expect(sensors.map((sensor) => sensor.name)).toEqual([
      "Cardiac Monitor",
      "Oximeter / Sleep",
      "Radiation Dosimeter",
      "Suit Biometrics",
    ]);
    expect(sensors.every((sensor) => sensor.online && sensor.connectivity === "connected")).toBe(
      true,
    );
    expect(
      sensors.every((sensor) => sensor.batteryPercent >= 0 && sensor.batteryPercent <= 100),
    ).toBe(true);
  });

  it("marks an exhausted sensor disconnected", () => {
    const sensor = getBiomedicalSensorTelemetry(100_000).find((item) => item.id === "cardiac");

    expect(sensor).toMatchObject({
      batteryPercent: 0,
      online: false,
      connectivity: "disconnected",
    });
  });
});

describe("controller telemetry", () => {
  it("activates only the selected controller and places the others on standby", () => {
    for (const scenario of SENSOR_NETWORK_SCENARIOS) {
      const controllers = getControllerTelemetry(scenario.id, 0);
      expect(controllers.filter((controller) => controller.state === "on")).toHaveLength(1);
      expect(controllers.find((controller) => controller.selected)).toMatchObject({
        state: "on",
        connectivity: "connected",
      });
      expect(controllers.find((controller) => controller.selected)?.network).toBe(scenario.network);
      expect(
        controllers.filter((controller) => controller.connectivity === "standby"),
      ).toHaveLength(2);
    }
  });

  it("reports a selected controller with an exhausted battery as disconnected", () => {
    const controllers = getControllerTelemetry("body", 100_000);

    expect(controllers[0]).toMatchObject({
      batteryPercent: 0,
      state: "off",
      connectivity: "disconnected",
    });
  });
});
