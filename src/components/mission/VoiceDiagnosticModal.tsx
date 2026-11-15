import { useEffect, useRef, useState, type FormEvent } from "react";
import { AudioLines, Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import type { Triage } from "@/hooks/use-triage";
import type { VoiceAssistant } from "@/hooks/use-voice-assistant";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATE_LABEL = {
  idle: "En espera",
  listening: "Escuchando",
  processing: "Analizando",
  speaking: "ASTRA está hablando",
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
            <p className="label-caps text-voice-glow">ASTRA · Asistente clínico a bordo</p>
            <DialogTitle className="text-xl leading-snug sm:text-2xl">
              NECESITO HACERTE PREGUNTAS PARA TU DIAGNÓSTICO
            </DialogTitle>
            <DialogDescription>
              Responde hablando o escribiendo. Este triaje es una ayuda a bordo y no sustituye la
              evaluación del Oficial Médico.
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
                  aria-label={`Orbe de ASTRA: ${STATE_LABEL[assistant.state]}`}
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
                    ? "Micrófono conectado"
                    : assistant.micStatus === "denied"
                      ? "Micrófono denegado · puedes responder por texto"
                      : assistant.micStatus === "unsupported"
                        ? "Micrófono no disponible · puedes responder por texto"
                        : assistant.sttSupported
                          ? "Micrófono listo"
                          : "Reconocimiento de voz no disponible"}
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
                    ? "Finalizar consulta"
                    : assistant.finished
                      ? "Nueva consulta"
                      : "Iniciar consulta"}
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
                  Voz {assistant.voiceOut ? "activada" : "silenciada"}
                </button>
              </div>
            </div>

            <div className="grid min-h-40 content-start gap-3">
              {assistant.question ? (
                <div className="rounded-xl border border-voice-glow/30 bg-background/25 p-4">
                  <p className="label-caps mb-2 text-voice-glow">
                    Pregunta {assistant.step + 1} · {assistant.question.system}
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
                  <p className="label-caps mb-2 text-muted-foreground">Consulta</p>
                  <p className="text-sm leading-relaxed">
                    {assistant.finished
                      ? "La evaluación guiada ha terminado. Puedes iniciar una nueva consulta."
                      : "Escribe un síntoma o inicia la consulta guiada."}
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
                  <p className="label-caps mb-1 text-muted-foreground">Última respuesta de ASTRA</p>
                  <p className="text-sm leading-relaxed">{assistant.lastAi}</p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={submit} className="flex gap-2">
            <label htmlFor="voice-diagnostic-text" className="sr-only">
              Responder por texto
            </label>
            <input
              id="voice-diagnostic-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Escribe cómo te sientes…"
              className="min-h-12 min-w-0 flex-1 rounded-lg border border-input bg-background/50 px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-voice-glow"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="grid min-h-12 min-w-12 place-items-center rounded-lg bg-voice px-3 text-voice-foreground transition-opacity hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Enviar respuesta"
            >
              <Send className="size-4" />
            </button>
          </form>

          {triage.transcript.length > 0 && (
            <details className="rounded-lg border border-border bg-background/20 px-3 py-2">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                Transcripción de la consulta · {triage.transcript.length} mensajes
              </summary>
              <ol className="mt-2 grid max-h-32 gap-2 overflow-y-auto text-xs">
                {triage.transcript.slice(-6).map((entry, index) => (
                  <li
                    key={`${entry.at}-${index}`}
                    className={entry.role === "ia" ? "text-voice-glow" : "text-foreground"}
                  >
                    <span className="font-semibold">{entry.role === "ia" ? "ASTRA" : "Tú"}:</span>{" "}
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
