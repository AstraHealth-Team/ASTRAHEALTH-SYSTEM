import { useEffect, useRef } from "react";
import { beatSample, isEctopicBeat } from "@/lib/ecg";
import { cn } from "@/lib/utils";

type WaveKind = "ecg" | "resp" | "pleth";

/**
 * Sweep-style bio-signal monitor (canvas). Color comes from the element's CSS `color`,
 * so pass a semantic text-* class.
 */
export function WaveCanvas({
  kind = "ecg",
  hr,
  rr = 14,
  pvcPerMin = 0,
  className,
  height = 96,
  label,
}: {
  kind?: WaveKind;
  hr: number;
  rr?: number;
  pvcPerMin?: number;
  className?: string;
  height?: number;
  label?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const params = useRef({ hr, rr, pvcPerMin });
  params.current = { hr, rr, pvcPerMin };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let last = performance.now();
    let x = 0;
    let prevY: number | null = null;
    let phase = 0;
    let beat = 0;
    let respPhase = 0;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const w = canvas.clientWidth;
      canvas.width = w * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, height);
      x = 0;
      prevY = null;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const color = getComputedStyle(canvas).color;
    const grid = "rgba(255,255,255,0.05)";
    const speed = 90; // px per second

    const sample = () => {
      const p = params.current;
      const ectopic = isEctopicBeat(beat, p.hr, p.pvcPerMin);
      if (kind === "ecg") return beatSample(phase, ectopic);
      if (kind === "pleth") {
        const t = (phase + 0.75) % 1;
        return Math.exp(-((t - 0.25) ** 2) / 0.012) * 0.9 + Math.exp(-((t - 0.5) ** 2) / 0.006) * 0.25;
      }
      return Math.sin(respPhase * Math.PI * 2) * 0.7;
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = canvas.clientWidth;
      const steps = Math.max(1, Math.round(dt * speed));
      const p = params.current;
      for (let i = 0; i < steps; i++) {
        const sdt = 1 / speed;
        const ectopicNow = isEctopicBeat(beat, p.hr, p.pvcPerMin);
        // PVC beats come early (short coupling) and are followed by a compensatory pause
        const rate = (p.hr / 60) * (ectopicNow ? 1.25 : 1);
        phase += sdt * rate;
        if (phase >= 1) {
          phase -= 1;
          beat++;
        }
        respPhase = (respPhase + sdt * (p.rr / 60)) % 1;

        const y = height * 0.62 - sample() * height * 0.42;
        // clear ahead of the sweep
        ctx.clearRect(x, 0, 14, height);
        ctx.fillStyle = grid;
        if (Math.round(x) % 24 === 0) ctx.fillRect(x, 0, 1, height);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.lineJoin = "round";
        if (prevY !== null) {
          ctx.beginPath();
          ctx.moveTo(x - 1, prevY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        prevY = y;
        x += 1;
        if (x > w) {
          x = 0;
          prevY = null;
        }
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [kind, height]);

  return (
    <div className="relative">
      {label && <span className="label-caps absolute left-2 top-1 text-muted-foreground">{label}</span>}
      <canvas ref={ref} className={cn("block w-full", className)} style={{ height }} aria-label={label ?? "Forma de onda"} role="img" />
    </div>
  );
}
