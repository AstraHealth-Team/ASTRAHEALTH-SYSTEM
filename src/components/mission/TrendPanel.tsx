import { useMemo, useState } from "react";
import { LineChart as LineIcon } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { trendSeries, type ScenarioId, type TrendRange } from "@/lib/mission";
import { Panel } from "./kit";

const RANGES: { id: TrendRange; label: string }[] = [
  { id: "1h", label: "1 Hora" },
  { id: "24h", label: "24 Horas" },
  { id: "30d", label: "30 Días" },
];

const METRICS = [
  { key: "hr", label: "FC (bpm)", color: "var(--sensors)" },
  { key: "hrv", label: "HRV (ms)", color: "var(--edge)" },
  { key: "dose", label: "Dosis (mSv)", color: "var(--hmi)" },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

export function TrendPanel({ scenario, title = "Tendencias" }: { scenario: ScenarioId; title?: string }) {
  const [range, setRange] = useState<TrendRange>("24h");
  const [metric, setMetric] = useState<MetricKey>("hr");
  const data = useMemo(() => trendSeries(range, scenario), [range, scenario]);
  const m = METRICS.find((x) => x.key === metric)!;
  return (
    <Panel
      title={title}
      icon={<LineIcon className="size-3.5 text-hmi" />}
      aside={
        <div className="flex gap-1 rounded-lg bg-muted/60 p-0.5" role="tablist" aria-label="Rango temporal">
          {RANGES.map((r) => (
            <button
              key={r.id}
              role="tab"
              aria-selected={range === r.id}
              onClick={() => setRange(r.id)}
              className={cn(
                "min-h-8 rounded-md px-2.5 text-xs font-medium transition-colors",
                range === r.id ? "bg-hmi text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="mb-2 flex flex-wrap gap-1.5">
        {METRICS.map((x) => (
          <button
            key={x.key}
            onClick={() => setMetric(x.key)}
            className={cn(
              "flex min-h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors",
              metric === x.key ? "border-foreground/40 bg-accent text-foreground" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="size-2 rounded-full" style={{ background: x.color }} />
            {x.label}
          </button>
        ))}
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="var(--hairline)" vertical={false} />
            <XAxis dataKey="t" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "var(--muted-foreground)" }}
            />
            <Line type="monotone" dataKey={metric} name={m.label} stroke={m.color} strokeWidth={2} dot={false} isAnimationActive animationDuration={600} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
