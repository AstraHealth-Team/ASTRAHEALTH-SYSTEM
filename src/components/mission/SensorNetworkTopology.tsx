import { Activity, BatteryFull, Network, Signal } from "lucide-react";
import type { SensorNetworkScenarioId } from "@/lib/sensor-network";
import {
  getBiomedicalSensorTelemetry,
  getControllerTelemetry,
  SENSOR_NETWORK_SCENARIOS,
} from "@/lib/sensor-network";
import { cn } from "@/lib/utils";

const CONNECTIVITY_LABEL = {
  connected: "Connected",
  standby: "Standby",
  disconnected: "Disconnected",
} as const;

export function SensorNetworkTopology({
  tick,
  selectedScenario,
  onScenarioChange,
}: {
  tick: number;
  selectedScenario: SensorNetworkScenarioId;
  onScenarioChange: (scenario: SensorNetworkScenarioId) => void;
}) {
  const sensors = getBiomedicalSensorTelemetry(tick);
  const operationalCount = sensors.filter((sensor) => sensor.online).length;
  const connectedCount = sensors.filter((sensor) => sensor.connectivity === "connected").length;
  const averageBattery = Math.round(
    sensors.reduce((total, sensor) => total + sensor.batteryPercent, 0) / sensors.length,
  );
  const controllers = getControllerTelemetry(selectedScenario, tick);

  return (
    <section
      className="panel grid min-w-0 gap-4 p-4 sm:p-5"
      aria-label="Biomedical network topology"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="label-caps flex items-center gap-2 text-foreground">
            <Network className="size-4 text-sensors" aria-hidden />
            Sensor and Controller Topology
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Select an active route; status is synchronized with the Astronaut profile.
          </p>
        </div>
      </header>

      <section className="grid gap-2" aria-label="Overall sensor status">
        <h3 className="label-caps text-muted-foreground">Overall Sensor Status</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <article className="rounded-lg border border-border bg-background/35 p-3">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="size-3.5 text-sensors" aria-hidden />
              Operational Status
            </p>
            <p
              className={cn(
                "mt-1 text-sm font-bold",
                operationalCount === sensors.length ? "text-nominal" : "text-emergency",
              )}
            >
              {operationalCount === sensors.length
                ? "All Operational"
                : `${operationalCount}/${sensors.length} Operational`}
            </p>
          </article>
          <article className="rounded-lg border border-border bg-background/35 p-3">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <BatteryFull className="size-3.5 text-sensors" aria-hidden />
              Average Battery
            </p>
            <p className="telemetry mt-1 text-sm font-bold">{averageBattery}%</p>
          </article>
          <article className="rounded-lg border border-border bg-background/35 p-3">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Signal className="size-3.5 text-sensors" aria-hidden />
              Local Network Connectivity
            </p>
            <p
              className={cn(
                "mt-1 text-sm font-bold",
                connectedCount === sensors.length ? "text-nominal" : "text-warning",
              )}
            >
              {connectedCount}/{sensors.length} Connected
            </p>
          </article>
        </div>
      </section>

      <div
        className="grid gap-2 md:grid-cols-3"
        role="group"
        aria-label="Biomedical Network Scenarios"
      >
        {SENSOR_NETWORK_SCENARIOS.map((scenario) => {
          const selected = selectedScenario === scenario.id;
          return (
            <button
              key={scenario.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onScenarioChange(scenario.id)}
              className={cn(
                "grid min-h-24 content-start gap-2 rounded-lg border p-3 text-left transition-colors",
                selected
                  ? "border-sensors bg-sensors/10 ring-1 ring-sensors/40"
                  : "border-border bg-background/30 hover:border-sensors/50",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="telemetry rounded bg-muted px-1.5 py-0.5 text-[0.65rem] font-bold">
                  {scenario.number}
                </span>
                <span className="text-xs font-semibold">{scenario.astronaut}</span>
              </span>
              <span className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[0.65rem] leading-relaxed text-muted-foreground">
                <span>Sensor</span>
                <span aria-hidden="true">→</span>
                <span>{scenario.network} (Controller)</span>
                <span aria-hidden="true">→</span>
                <span>Local Network</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid min-w-0 gap-3 lg:grid-cols-3">
        {controllers.map((controller) => (
          <article
            key={controller.id}
            className={cn(
              "grid min-w-0 content-start gap-3 rounded-xl border p-4",
              controller.selected
                ? "border-sensors/60 bg-sensors/8 shadow-[0_0_20px_-14px_var(--sensors)]"
                : "border-border bg-background/25",
            )}
            aria-label={`Controller ${controller.number}, Scenario ${controller.number}, ${controller.network}`}
            aria-current={controller.selected ? "true" : undefined}
          >
            <header>
              <h3 className="text-sm font-bold">
                Controller {controller.number} / Scenario {controller.number}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{controller.network}</p>
            </header>
            <dl className="grid gap-2">
              <div className="flex items-center justify-between gap-2 rounded-md bg-background/40 px-3 py-2">
                <dt className="text-xs text-muted-foreground">Battery</dt>
                <dd className="telemetry text-sm font-bold">{controller.batteryPercent}%</dd>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-md bg-background/40 px-3 py-2">
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd
                  className={cn(
                    "text-xs font-bold uppercase",
                    controller.state === "on" ? "text-nominal" : "text-muted-foreground",
                  )}
                >
                  {controller.state.toUpperCase()}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-md bg-background/40 px-3 py-2">
                <dt className="text-xs text-muted-foreground">Local Network Connectivity</dt>
                <dd
                  className={cn(
                    "text-right text-xs font-bold",
                    controller.connectivity === "connected"
                      ? "text-nominal"
                      : controller.connectivity === "standby"
                        ? "text-warning"
                        : "text-emergency",
                  )}
                >
                  {CONNECTIVITY_LABEL[controller.connectivity]}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
