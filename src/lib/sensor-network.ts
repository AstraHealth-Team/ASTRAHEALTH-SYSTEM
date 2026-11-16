export type SensorNetworkScenarioId = "body" | "suit" | "analysis";
export type ControllerConnectivity = "connected" | "standby" | "disconnected";

export interface BiomedicalSensorTelemetry {
  id: string;
  name: string;
  batteryPercent: number;
  online: boolean;
  connectivity: "connected" | "disconnected";
}

export interface SensorNetworkScenario {
  id: SensorNetworkScenarioId;
  number: "01" | "02" | "03";
  astronaut: string;
  network: string;
  earthUplink: boolean;
  batteryStart: number;
  batteryDrainPerTick: number;
}

export interface ControllerTelemetry extends SensorNetworkScenario {
  batteryPercent: number;
  selected: boolean;
  state: "on" | "off";
  connectivity: ControllerConnectivity;
}

export const SENSOR_NETWORK_SCENARIOS: SensorNetworkScenario[] = [
  {
    id: "body",
    number: "01",
    astronaut: "Scenario 01: Unsuited Astronaut",
    network: "Body Area Network",
    earthUplink: true,
    batteryStart: 94,
    batteryDrainPerTick: 0.003,
  },
  {
    id: "suit",
    number: "02",
    astronaut: "Scenario 02: Suited Astronaut",
    network: "Suit Network",
    earthUplink: true,
    batteryStart: 89,
    batteryDrainPerTick: 0.002,
  },
  {
    id: "analysis",
    number: "03",
    astronaut: "Scenario 03: Analysis Center",
    network: "Analysis Center Network",
    earthUplink: false,
    batteryStart: 100,
    batteryDrainPerTick: 0.001,
  },
];

const SENSOR_BATTERY: {
  id: string;
  name: string;
  start: number;
  drainPerTick: number;
}[] = [
  { id: "cardiac", name: "Cardiac Monitor", start: 86, drainPerTick: 0.01 },
  { id: "oximeter", name: "Oximeter / Sleep", start: 62, drainPerTick: 0.006 },
  { id: "radiation", name: "Radiation Dosimeter", start: 100, drainPerTick: 0 },
  { id: "suit", name: "Suit Biometrics", start: 93, drainPerTick: 0.003 },
];

export function getBiomedicalSensorTelemetry(tick: number): BiomedicalSensorTelemetry[] {
  return SENSOR_BATTERY.map((sensor) => {
    const batteryPercent = Math.max(0, Math.round(sensor.start - tick * sensor.drainPerTick));
    const online = batteryPercent > 0;
    return {
      id: sensor.id,
      name: sensor.name,
      batteryPercent,
      online,
      connectivity: online ? "connected" : "disconnected",
    };
  });
}

export function getControllerTelemetry(
  selectedScenario: SensorNetworkScenarioId,
  tick: number,
): ControllerTelemetry[] {
  return SENSOR_NETWORK_SCENARIOS.map((scenario) => {
    const batteryPercent = Math.max(
      0,
      Math.round(scenario.batteryStart - tick * scenario.batteryDrainPerTick),
    );
    const selected = scenario.id === selectedScenario;
    const state = batteryPercent > 0 && selected ? "on" : "off";
    return {
      ...scenario,
      batteryPercent,
      selected,
      state,
      connectivity: batteryPercent === 0 ? "disconnected" : selected ? "connected" : "standby",
    };
  });
}
