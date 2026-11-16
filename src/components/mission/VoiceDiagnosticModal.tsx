import { useEffect, useRef, useState, type FormEvent } from "react";
import { AudioLines, Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import type { Triage } from "@/hooks/use-triage";
import type { VoiceAssistant } from "@/hooks/use-voice-assistant";
import { TRIAGE_META } from "@/lib/triage";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATE_LABEL = {
  idle: "Standby",
  listening: "Listening",
  processing: "Processing",
  speaking: "ASTRA is speaking",
} as const;

export function VoiceDiagnosticModal({
  open,
  onOpenChange,
  assistant,
  triage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: VoiceAssistant;
  triage: Triage;
}) {
  const [text, setText] = useState("");
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let frame = 0;
    const animate = () => {
      const level = assistant.levelRef.current;
      const orb = orbRef.current;
      if (orb) {
        orb.style.transform = `scale(${1 + level * 0.22})`;
        orb.style.setProperty("--orb-level", `${0.3 + level * 0.7}`);
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [assistant.levelRef, open]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim()) return;
    assistant.submitText(text);
    setText("");
  };

  const submitQuick = (answer: string) => {
    assistant.submitText(answer);
    setText("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto border-voice-glow/30 bg-[var(--gradient-voice-panel)] p-0 text-foreground sm:rounded-2xl">
        <div className="grid gap-5 p-5 sm:p-7">
          <DialogHeader className="pr-8 text-left">
            <p className="label-caps text-voice-glow">ASTRA · Onboard Clinical Assistant</p>
            <DialogTitle className="text-xl leading-snug sm:text-2xl">
              I NEED TO ASK YOU A FEW QUESTIONS
            </DialogTitle>
            <DialogDescription>
              Respond by speaking or typing. This triage is an onboard decision-support tool and
              does not replace evaluation by the Flight Surgeon.
            </DialogDescription>
          </DialogHeader>

          <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="grid justify-items-center gap-3">
              <div className="relative grid size-40 place-items-center sm:size-48">
                <div className="orb-ring absolute inset-1 rounded-full opacity-50" />
                <div className="orb-ring absolute inset-4 rounded-full opacity-35" />
                <div
                  ref={orbRef}
                  className={cn(
                    "orb-surface relative grid size-28 place-items-center rounded-full transition-transform duration-100 sm:size-36",
                    assistant.state === "processing" && "animate-orb-processing",
                  )}
                  style={{ opacity: "var(--orb-level, 1)" }}
                  role="img"
                  aria-label={`ASTRA orb: ${STATE_LABEL[assistant.state]}`}
                >
                  <span className="orb-blob left-4 top-5 size-10 opacity-70" />
                  <span className="orb-blob bottom-4 right-3 size-8 opacity-60 [animation-delay:-3s]" />
                  <AudioLines className="relative z-10 size-9 text-voice-deep drop-shadow sm:size-11" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-voice-glow">
                  {STATE_LABEL[assistant.state]}
                </p>
                <p className="telemetry mt-1 text-[0.68rem] text-muted-foreground">
                  {assistant.micStatus === "on"
                    ? "Microphone connected"
                    : assistant.micStatus === "denied"
                      ? "Microphone access denied · you can respond by text"
                      : assistant.micStatus === "unsupported"
                        ? "Microphone unavailable · you can respond by text"
                        : assistant.sttSupported
                          ? "Microphone ready"
                          : "Speech recognition unavailable"}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => (assistant.active ? assistant.stop() : void assistant.start())}
                  className="flex min-h-10 items-center gap-2 rounded-full bg-voice px-4 text-xs font-semibold text-voice-foreground hover:brightness-110"
                >
                  {assistant.active ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                  {assistant.active
                    ? "End consultation"
                    : assistant.finished
                      ? "New consultation"
                      : "Start consultation"}
                </button>
                <button
                  type="button"
                  onClick={() => assistant.setVoiceOut(!assistant.voiceOut)}
                  aria-pressed={assistant.voiceOut}
                  className="flex min-h-10 items-center gap-2 rounded-full border border-border bg-background/40 px-3 text-xs font-medium hover:bg-background/70"
                >
                  {assistant.voiceOut ? (
                    <Volume2 className="size-4" />
                  ) : (
                    <VolumeX className="size-4" />
                  )}
                  Voice {assistant.voiceOut ? "on" : "muted"}
                </button>
              </div>
            </div>

            <div className="grid min-h-40 content-start gap-3">
              {assistant.question ? (
                <div className="rounded-xl border border-voice-glow/30 bg-background/25 p-4">
                  <p className="label-caps mb-2 text-voice-glow">
                    Question {assistant.step + 1} · {TRIAGE_META[assistant.question.system].title}
                  </p>
                  <p className="text-sm leading-relaxed">{assistant.question.text}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {assistant.question.quick.map((answer) => (
                      <button
                        key={answer}
                        type="button"
                        onClick={() => submitQuick(answer)}
                        className="min-h-9 rounded-full border border-voice-glow/30 bg-voice/10 px-3 text-xs text-voice-glow transition-colors hover:bg-voice/20"
                      >
                        {answer}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-background/25 p-4">
                  <p className="label-caps mb-2 text-muted-foreground">Consultation</p>
                  <p className="text-sm leading-relaxed">
                    {assistant.finished
                      ? "The guided assessment is complete. You may start a new consultation."
                      : "Enter a symptom or start the guided consultation."}
                  </p>
                </div>
              )}
              {assistant.interim && (
                <p
                  className="rounded-lg border border-dashed border-voice-glow/40 px-3 py-2 text-sm italic text-voice-glow"
                  aria-live="polite"
                >
                  {assistant.interim}
                </p>
              )}
              {assistant.lastAi && (
                <div className="rounded-lg border border-border bg-background/35 px-3 py-2.5">
                  <p className="label-caps mb-1 text-muted-foreground">Latest ASTRA Response</p>
                  <p className="text-sm leading-relaxed">{assistant.lastAi}</p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={submit} className="flex gap-2">
            <label htmlFor="voice-diagnostic-text" className="sr-only">
              Respond by text
            </label>
            <input
              id="voice-diagnostic-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Describe how you are feeling…"
              className="min-h-12 min-w-0 flex-1 rounded-lg border border-input bg-background/50 px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-voice-glow"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="grid min-h-12 min-w-12 place-items-center rounded-lg bg-voice px-3 text-voice-foreground transition-opacity hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Submit response"
            >
              <Send className="size-4" />
            </button>
          </form>

          {triage.transcript.length > 0 && (
            <details className="rounded-lg border border-border bg-background/20 px-3 py-2">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                Consultation transcript · {triage.transcript.length} messages
              </summary>
              <ol className="mt-2 grid max-h-32 gap-2 overflow-y-auto text-xs">
                {triage.transcript.slice(-6).map((entry, index) => (
                  <li
                    key={`${entry.at}-${index}`}
                    className={entry.role === "ia" ? "text-voice-glow" : "text-foreground"}
                  >
                    <span className="font-semibold">{entry.role === "ia" ? "ASTRA" : "You"}:</span>{" "}
                    {entry.text}
                  </li>
                ))}
              </ol>
            </details>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
