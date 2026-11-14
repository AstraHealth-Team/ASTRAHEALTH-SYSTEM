import { cn } from "@/lib/utils";
import { SYSTEM_META, systemLevel, type HealthLevel, type SystemId, type Vitals } from "@/lib/mission";

const FILL: Record<HealthLevel, string> = {
  emergency: "fill-emergency",
  warning: "fill-warning",
  caution: "fill-caution",
  advisory: "fill-advisory",
  nominal: "fill-nominal",
};
const STROKE: Record<HealthLevel, string> = {
  emergency: "stroke-emergency",
  warning: "stroke-warning",
  caution: "stroke-caution",
  advisory: "stroke-advisory",
  nominal: "stroke-nominal",
};

const HOTSPOTS: { id: SystemId; cx: number; cy: number; r: number; lx: number; ly: number; anchor: "start" | "end" }[] = [
  { id: "neuro", cx: 100, cy: 46, r: 11, lx: 168, ly: 40, anchor: "start" },
  { id: "cardio", cx: 112, cy: 134, r: 13, lx: 168, ly: 128, anchor: "start" },
  { id: "radiation", cx: 100, cy: 205, r: 15, lx: 32, ly: 196, anchor: "end" },
  { id: "msk", cx: 83, cy: 310, r: 12, lx: 32, ly: 306, anchor: "end" },
];

const SHORT: Record<SystemId, string> = {
  neuro: "Neuro-Ocular",
  cardio: "Cardiovascular",
  radiation: "Radiación",
  msk: "Sueño · MSK",
};

export function BodyAvatar({
  vitals,
  selected,
  onSelect,
}: {
  vitals: Vitals;
  selected: SystemId;
  onSelect: (s: SystemId) => void;
}) {
  const radLevel = systemLevel("radiation", vitals);
  return (
    <svg viewBox="-30 0 260 420" className="mx-auto h-full max-h-[440px] w-full" role="group" aria-label="Avatar anatómico interactivo">
      <defs>
        <radialGradient id="body-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="var(--hmi)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--hmi)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="210" rx="120" ry="210" fill="url(#body-glow)" />
      {radLevel !== "nominal" && (
        <ellipse
          cx="100"
          cy="210"
          rx="92"
          ry="200"
          className={cn("fill-none animate-emergency", STROKE[radLevel])}
          strokeWidth="2"
          strokeDasharray="4 6"
        />
      )}

      {/* Silhouette */}
      <g className="fill-muted stroke-muted-foreground/40" strokeWidth="1.2">
        <ellipse cx="100" cy="46" rx="25" ry="30" />
        <rect x="91" y="72" width="18" height="20" rx="6" />
        <path d="M62 96 Q100 84 138 96 Q152 102 152 120 L145 200 Q142 238 132 254 L68 254 Q58 238 55 200 L48 120 Q48 102 62 96Z" />
      </g>
      <g className="stroke-muted" strokeLinecap="round" fill="none">
        <path d="M54 108 Q36 150 32 200 Q30 232 28 258" strokeWidth="18" />
        <path d="M146 108 Q164 150 168 200 Q170 232 172 258" strokeWidth="18" />
        <path d="M84 248 Q79 320 82 404" strokeWidth="25" />
        <path d="M116 248 Q121 320 118 404" strokeWidth="25" />
      </g>
      {/* anatomical hints */}
      <g className="stroke-muted-foreground/25" fill="none" strokeWidth="1">
        <path d="M100 100 L100 250" />
        <path d="M74 120 Q100 130 126 120" />
        <path d="M70 140 Q100 152 130 140" />
        <path d="M70 160 Q100 172 130 160" />
      </g>

      {HOTSPOTS.map((h) => {
        const level = systemLevel(h.id, vitals);
        const active = selected === h.id;
        return (
          <g
            key={h.id}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            aria-label={`${SYSTEM_META[h.id].title}: ${level}`}
            onClick={() => onSelect(h.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(h.id)}
            className="cursor-pointer outline-none [&:focus-visible_circle.ring]:stroke-foreground"
          >
            <line
              x1={h.cx}
              y1={h.cy}
              x2={h.anchor === "start" ? h.lx - 4 : h.lx + 4}
              y2={h.ly}
              className={cn(STROKE[level], active ? "opacity-90" : "opacity-40")}
              strokeWidth="1"
            />
            <circle cx={h.cx} cy={h.cy} r={h.r + 8} className={cn(FILL[level], "animate-soft-pulse")} style={{ transformOrigin: `${h.cx}px ${h.cy}px`, transformBox: "view-box" }} opacity="0.35" />
            <circle cx={h.cx} cy={h.cy} r={h.r} className={cn(FILL[level], level === "emergency" && "animate-emergency")} opacity="0.9" />
            <circle className="ring fill-none" cx={h.cx} cy={h.cy} r={h.r + 4} stroke="transparent" strokeWidth="2" />
            {active && <circle cx={h.cx} cy={h.cy} r={h.r + 4} className="fill-none stroke-foreground" strokeWidth="2" />}
            <text
              x={h.lx}
              y={h.ly + 4}
              textAnchor={h.anchor}
              className={cn("text-[11px] font-semibold", active ? "fill-foreground" : "fill-muted-foreground")}
            >
              {SHORT[h.id]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
