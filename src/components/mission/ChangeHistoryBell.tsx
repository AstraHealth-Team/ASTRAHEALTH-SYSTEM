import { useState } from "react";
import { Bell, RotateCcw } from "lucide-react";
import { LEVEL_NAME, TRIAGE_META, type HistoryEntry } from "@/lib/triage";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function ChangeHistoryBell({
  history,
  onReset,
}: {
  history: HistoryEntry[];
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const eventCount = history.length === 1 ? "1 event" : `${history.length} events`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Change History: ${eventCount}`}
          className="relative grid size-10 shrink-0 place-items-center rounded-full border border-border bg-background/60 text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voice-glow"
        >
          <Bell className="size-4" aria-hidden />
          {history.length > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-emergency px-1 text-[0.6rem] font-bold leading-4 text-white"
            >
              {history.length > 9 ? "9+" : history.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden p-0"
      >
        <section aria-label="Change History">
          <header className="border-b border-border px-4 py-3">
            <h2 className="label-caps text-foreground">Change History</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {history.length} {history.length === 1 ? "recent event" : "recent events"}
            </p>
          </header>
          {history.length === 0 ? (
            <p className="px-4 py-5 text-sm text-muted-foreground">
              No changes recorded; telemetry nominal.
            </p>
          ) : (
            <ol className="grid max-h-72 gap-1 overflow-y-auto p-3">
              {history.slice(0, 10).map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start gap-2 rounded-md bg-background/40 px-2 py-2 text-xs"
                >
                  <span
                    className={cn(
                      "mt-1 size-2 shrink-0 rounded-full",
                      entry.level === "red"
                        ? "bg-emergency"
                        : entry.level === "yellow"
                          ? "bg-warning"
                          : "bg-nominal",
                    )}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{TRIAGE_META[entry.system].title}</span>
                    {" · "}
                    {LEVEL_NAME[entry.level]} — {entry.finding}
                  </span>
                  <time className="telemetry shrink-0 text-[0.65rem] text-muted-foreground">
                    {new Date(entry.at).toLocaleTimeString("en", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </li>
              ))}
            </ol>
          )}
          <footer className="border-t border-border p-3">
            <button
              type="button"
              onClick={() => {
                onReset();
                setOpen(false);
              }}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-nominal/50 bg-nominal/10 px-3 text-xs font-semibold text-nominal transition-colors hover:bg-nominal/20"
            >
              <RotateCcw className="size-4" aria-hidden />
              Reset All to Nominal
            </button>
          </footer>
        </section>
      </PopoverContent>
    </Popover>
  );
}
