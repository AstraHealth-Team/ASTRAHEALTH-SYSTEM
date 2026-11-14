import { cn } from "@/lib/utils";
import { SYSTEM_META, systemComparison, systemLevel, type SystemId, type Vitals } from "@/lib/mission";
import { LEVEL_SOFT, LEVEL_TEXT, LevelIcon } from "./kit";

const NOTES: Record<SystemId, string> = {
  cardio: "En 0g ~1.8 L de fluido se desplazan hacia la cabeza (cefalización), elevando el volumen sistólico inicial y reduciendo la HRV.",
  neuro: "SANS: edema del disco óptico y pliegues coroideos. Se vigila hiperopía ≥ +0.75 D con OCT y tonometría a bordo.",
  radiation: "Integración ISS-RAD (partículas cargadas), Radi-N2 (burbujas) y CANS (espectrómetro canadiense de neutrones).",
  msk: "Pérdida ósea de 1–1.5 %/mes en zonas de carga. El ejercicio ARED/T2 y el sueño regulan la recuperación cognitiva.",
};

const LEVEL_WORD = { nominal: "Nominal", advisory: "Advisory", caution: "Caution", warning: "Warning", emergency: "Emergency" } as const;

export function SystemDetail({ system, vitals }: { system: SystemId; vitals: Vitals }) {
  const level = systemLevel(system, vitals);
  const rows = systemComparison(system, vitals);
  return (
    <div key={system} className="animate-in fade-in slide-in-from-right-2 duration-300">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold leading-tight">{SYSTEM_META[system].title}</h3>
          <p className="text-xs text-muted-foreground">{SYSTEM_META[system].subtitle}</p>
        </div>
        <span className={cn("flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold", LEVEL_SOFT[level], LEVEL_TEXT[level])}>
          <LevelIcon level={level} className="size-3.5" /> {LEVEL_WORD[level]}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="label-caps text-muted-foreground">
            <th className="pb-2 text-left font-normal">Parámetro</th>
            <th className="pb-2 text-right font-normal">Tierra 1g</th>
            <th className="pb-2 text-right font-normal">Órbita 0g</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-hairline">
              <td className="py-2 pr-2">
                {r.label} <span className="text-[0.7rem] text-muted-foreground">{r.unit}</span>
              </td>
              <td className="telemetry py-2 text-right text-muted-foreground">{r.earth}</td>
              <td className={cn("telemetry py-2 text-right font-semibold", r.flag ? LEVEL_TEXT[r.flag] : "text-foreground")}>
                {r.space}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{NOTES[system]}</p>
    </div>
  );
}
