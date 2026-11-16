import { cn } from "@/lib/utils";
import {
  LEVEL_NAME,
  TRIAGE_META,
  TRIAGE_SYSTEMS,
  type TriageState,
  type TriageSystem,
} from "@/lib/triage";

const FILL = {
  red: "fill-emergency",
  yellow: "fill-warning",
  green: "fill-nominal",
} as const;
const STROKE = {
  red: "stroke-emergency",
  yellow: "stroke-warning",
  green: "stroke-nominal",
} as const;

const HOTSPOTS: Record<
  TriageSystem,
  { cx: number; cy: number; r: number; cardX: number; cardY: number }
> = {
  neuro: { cx: 100, cy: 46, r: 11, cardX: 163, cardY: 10 },
  cardio: { cx: 112, cy: 132, r: 13, cardX: 164, cardY: 112 },
  resp: { cx: 89, cy: 164, r: 12, cardX: 164, cardY: 180 },
};

const SHORT: Record<TriageSystem, string> = {
  neuro: "Neurological",
  cardio: "Cardiac",
  resp: "Respiratory",
};

export function BodyAvatar({
  systems,
  selected,
  onSelect,
}: {
  systems: TriageState;
  selected: TriageSystem;
  onSelect: (system: TriageSystem) => void;
}) {
  return (
    <svg
      viewBox="-30 0 310 420"
      className="mx-auto h-full max-h-[440px] w-full"
      role="group"
      aria-label="Anatomical triage avatar"
    >
      <defs>
        <radialGradient id="body-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="var(--hmi)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--hmi)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="210" rx="120" ry="210" fill="url(#body-glow)" />

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
      <g className="stroke-muted-foreground/25" fill="none" strokeWidth="1">
        <path d="M100 100 L100 250" />
        <path d="M74 120 Q100 130 126 120" />
        <path d="M70 140 Q84 132 94 145 Q100 155 94 180 Q82 183 74 168 Z" />
        <path d="M126 140 Q112 132 102 145 Q96 155 102 180 Q114 183 122 168 Z" />
      </g>

      {TRIAGE_SYSTEMS.map((system) => {
        const hotspot = HOTSPOTS[system];
        const assessment = systems[system];
        const level = assessment.level;
        const active = selected === system;
        const flagged = level !== "green";
        return (
          <g
            key={system}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            aria-label={`${TRIAGE_META[system].title}: ${LEVEL_NAME[level]}`}
            onClick={() => onSelect(system)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(system);
              }
            }}
            className="cursor-pointer outline-none [&:focus-visible_circle.ring]:stroke-foreground"
          >
            <line
              x1={hotspot.cx}
              y1={hotspot.cy}
              x2={hotspot.cardX}
              y2={hotspot.cardY + 22}
              className={cn(
                STROKE[level],
                flagged ? "opacity-90" : active ? "opacity-80" : "opacity-30",
              )}
              strokeWidth="1"
            />
            <circle
              cx={hotspot.cx}
              cy={hotspot.cy}
              r={hotspot.r + 8}
              className={cn(FILL[level], (flagged || active) && "animate-soft-pulse")}
              style={{ transformOrigin: "center", transformBox: "fill-box" }}
              opacity={flagged ? "0.5" : "0.2"}
            />
            <circle
              cx={hotspot.cx}
              cy={hotspot.cy}
              r={hotspot.r}
              className={cn(FILL[level], level === "red" && "animate-emergency")}
              opacity="0.9"
            />
            <circle
              className="ring fill-none"
              cx={hotspot.cx}
              cy={hotspot.cy}
              r={hotspot.r + 4}
              stroke="transparent"
              strokeWidth="2"
            />
            {active && (
              <circle
                cx={hotspot.cx}
                cy={hotspot.cy}
                r={hotspot.r + 4}
                className="fill-none stroke-foreground"
                strokeWidth="2"
              />
            )}
            {flagged ? (
              <g aria-label={`${SHORT[system]}: ${LEVEL_NAME[level]}. ${assessment.finding}`}>
                <rect
                  x={hotspot.cardX}
                  y={hotspot.cardY}
                  width="126"
                  height="58"
                  rx="7"
                  className={cn(
                    "fill-background",
                    level === "red" ? "stroke-emergency" : "stroke-warning",
                  )}
                  strokeWidth="1.5"
                />
                <text
                  x={hotspot.cardX + 7}
                  y={hotspot.cardY + 14}
                  className={cn(
                    "text-[9px] font-bold",
                    level === "red" ? "fill-emergency" : "fill-warning",
                  )}
                >
                  {SHORT[system]} · {level === "red" ? "CRITICAL" : "CAUTION"}
                </text>
                <foreignObject x={hotspot.cardX + 6} y={hotspot.cardY + 18} width="114" height="37">
                  <p
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="line-clamp-2 text-[8px] leading-tight text-foreground"
                  >
                    {assessment.finding}
                  </p>
                </foreignObject>
              </g>
            ) : (
              <text
                x={hotspot.cardX + 3}
                y={hotspot.cardY + 26}
                className={cn(
                  "text-[10px] font-semibold",
                  active ? "fill-foreground" : "fill-muted-foreground",
                )}
              >
                {SHORT[system]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
