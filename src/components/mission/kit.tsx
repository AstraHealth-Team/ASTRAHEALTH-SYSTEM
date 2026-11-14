import type { ReactNode } from "react";
import { CircleCheck, Diamond, Info, OctagonAlert, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HealthLevel } from "@/lib/mission";

export type BlockKey = "sensors" | "dtn" | "edge" | "hmi";

export const BLOCKS: Record<BlockKey, { n: number; title: string; cls: string }> = {
  sensors: { n: 1, title: "Sensores (IEEE 11073)", cls: "block-sensors" },
  dtn: { n: 2, title: "Red Espacial (DTN)", cls: "block-dtn" },
  edge: { n: 3, title: "Edge AI + FHIR R4", cls: "block-edge" },
  hmi: { n: 4, title: "Interfaz HMI (NASA-STD-3001)", cls: "block-hmi" },
};

export function BlockFrame({
  block,
  children,
  aside,
  hideHeader,
  className,
}: {
  block: BlockKey;
  children: ReactNode;
  aside?: ReactNode;
  hideHeader?: boolean;
  className?: string;
}) {
  const b = BLOCKS[block];
  return (
    <section className={cn(b.cls, "block-frame p-4 sm:p-5", className)} aria-label={`${b.n}. ${b.title}`}>
      {!hideHeader && (
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="label-caps flex items-center gap-2 text-foreground">
            <span className="grid size-6 place-items-center rounded-md bg-block text-[0.7rem] font-bold text-background">
              {b.n}
            </span>
            <span className="text-block">
              {b.n}. {b.title}
            </span>
          </h2>
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

/** Node box mirroring the diagram's inner rectangles */
export function Node({
  title,
  sub,
  children,
  className,
  right,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
  className?: string;
  right?: ReactNode;
}) {
  return (
    <div className={cn("node-box p-3", className)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="telemetry text-sm font-semibold leading-tight">{title}</p>
          {sub && <p className="telemetry text-xs opacity-80">{sub}</p>}
        </div>
        {right}
      </div>
      {children && <div className="mt-2 text-foreground">{children}</div>}
    </div>
  );
}

export const LEVEL_TEXT: Record<HealthLevel, string> = {
  emergency: "text-emergency",
  warning: "text-warning",
  caution: "text-caution",
  advisory: "text-advisory",
  nominal: "text-nominal",
};
export const LEVEL_BG: Record<HealthLevel, string> = {
  emergency: "bg-emergency",
  warning: "bg-warning",
  caution: "bg-caution",
  advisory: "bg-advisory",
  nominal: "bg-nominal",
};
export const LEVEL_SOFT: Record<HealthLevel, string> = {
  emergency: "bg-emergency/12 border-emergency/60",
  warning: "bg-warning/12 border-warning/60",
  caution: "bg-caution/10 border-caution/50",
  advisory: "bg-advisory/10 border-advisory/50",
  nominal: "bg-nominal/10 border-nominal/45",
};

export function LevelIcon({ level, className }: { level: HealthLevel; className?: string }) {
  const cls = cn(LEVEL_TEXT[level], className);
  switch (level) {
    case "emergency":
      return <OctagonAlert className={cls} aria-hidden />;
    case "warning":
      return <TriangleAlert className={cls} aria-hidden />;
    case "caution":
      return <Diamond className={cls} aria-hidden />;
    case "advisory":
      return <Info className={cls} aria-hidden />;
    default:
      return <CircleCheck className={cls} aria-hidden />;
  }
}

export function Panel({
  title,
  icon,
  children,
  className,
  aside,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  aside?: ReactNode;
}) {
  return (
    <div className={cn("panel p-4", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="label-caps flex items-center gap-2 text-muted-foreground">
          {icon}
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </div>
  );
}

export function FlowConnector({ from, to }: { from: BlockKey; to: BlockKey }) {
  return (
    <div className="flex h-7 items-center justify-center" aria-hidden>
      <svg width="20" height="28" viewBox="0 0 20 28" className="overflow-visible">
        <defs>
          <linearGradient id={`g-${from}-${to}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`var(--${from})`} />
            <stop offset="100%" stopColor={`var(--${to})`} />
          </linearGradient>
        </defs>
        <line x1="10" y1="0" x2="10" y2="22" stroke={`url(#g-${from}-${to})`} strokeWidth="2" className="animate-flow" />
        <path d="M4 18 L10 26 L16 18" fill="none" stroke={`var(--${to})`} strokeWidth="2" />
      </svg>
    </div>
  );
}
