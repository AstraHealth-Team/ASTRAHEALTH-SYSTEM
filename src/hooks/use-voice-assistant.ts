import { useCallback, useEffect, useRef, useState } from "react";
import {
  TRIAGE_META,
  TRIAGE_QUESTIONS,
  TRIAGE_SYSTEMS,
  acknowledge,
  diagnosisSummary,
  evaluateAnswer,
  vitalsTriage,
  type TriageState,
} from "@/lib/triage";
import { queryExternalLLM } from "@/lib/llm";
import type { Vitals } from "@/lib/mission";
import type { Triage } from "./use-triage";

export type VoiceState = "idle" | "listening" | "processing" | "speaking";
export type MicStatus = "unknown" | "on" | "denied" | "unsupported";

/* Minimal Web Speech API typings (not in lib.dom for all targets) */
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function speechLang(): string {
  const l = typeof navigator !== "undefined" ? navigator.language : "";
  return l?.toLowerCase().startsWith("es") ? l : "es-ES";
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("es"));
  if (voices.length === 0) return null;
  const order = [lang.toLowerCase(), "es-pe", "es-419", "es-us", "es-mx", "es-es"];
  const score = (v: SpeechSynthesisVoice) => {
    const i = order.indexOf(v.lang.toLowerCase().replace("_", "-"));
    return (i < 0 ? 10 : i) - (/google|natural|neural/i.test(v.name) ? 0.5 : 0);
  };
  return [...voices].sort((a, b) => score(a) - score(b))[0] ?? null;
}

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

/**
 * Bidirectional voice triage: Web Speech recognition in, speechSynthesis out,
 * Web Audio AnalyserNode for the orb. Works offline with the on-board rule engine.
 */
export function useVoiceAssistant({ triage, vitals }: { triage: Triage; vitals: Vitals }) {
  const [state, setStateS] = useState<VoiceState>("idle");
  const [active, setActive] = useState(false);
  const [finished, setFinished] = useState(false);
  const [step, setStep] = useState(0);
  const [interim, setInterim] = useState("");
  const [lastAi, setLastAi] = useState("");
  const [micStatus, setMicStatus] = useState<MicStatus>("unknown");
  const [sttSupported, setSttSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [voiceOut, setVoiceOutS] = useState(true);

  const stateRef = useRef<VoiceState>("idle");
  const activeRef = useRef(false);
  const stepRef = useRef(0);
  const tokenRef = useRef(0);
  const unclearRef = useRef(0);
  const restartsRef = useRef(0);
  const sttBlockedRef = useRef(false);
  const voiceOutRef = useRef(true);
  const levelRef = useRef(0);
  const kickRef = useRef(0);
  const sessionRef = useRef<TriageState | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const triageRef = useRef(triage);
  triageRef.current = triage;
  const vitalsRef = useRef(vitals);
  vitalsRef.current = vitals;

  const setState = (s: VoiceState) => {
    stateRef.current = s;
    setStateS(s);
  };

  useEffect(() => {
    setSttSupported(Boolean(getRecognitionCtor()));
    setTtsSupported("speechSynthesis" in window);
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
  }, []);

  // Orb amplitude loop (0..1) — mic RMS while listening, synthetic rhythm while speaking
  useEffect(() => {
    let raf = 0;
    let buf: Uint8Array<ArrayBuffer> | null = null;
    const loop = (t: number) => {
      const s = stateRef.current;
      let target: number;
      const an = analyserRef.current;
      if (s === "listening" && an) {
        if (!buf || buf.length !== an.fftSize) buf = new Uint8Array(an.fftSize);
        an.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = ((buf[i] ?? 128) - 128) / 128;
          sum += v * v;
        }
        target = Math.min(1, Math.sqrt(sum / buf.length) * 5);
      } else if (s === "listening") {
        target = 0.12 + 0.06 * Math.sin(t / 420);
      } else if (s === "speaking") {
        kickRef.current *= 0.92;
        target = 0.38 + 0.16 * Math.sin(t / 85) + 0.1 * Math.sin(t / 31) + kickRef.current * 0.45;
      } else if (s === "processing") {
        target = 0.18 + 0.12 * Math.sin(t / 260);
      } else {
        target = 0.06 + 0.04 * Math.sin(t / 900);
      }
      levelRef.current += (Math.max(0, target) - levelRef.current) * 0.22;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  function stopRecognition() {
    const rec = recRef.current;
    recRef.current = null;
    if (rec) {
      rec.onend = null;
      rec.onresult = null;
      try {
        rec.abort();
      } catch {
        /* already stopped */
      }
    }
  }

  function releaseMic() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    void audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
  }

  async function ensureMic(): Promise<boolean> {
    if (streamRef.current) return true;
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicStatus("unsupported");
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.6;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      setMicStatus("on");
      return true;
    } catch {
      setMicStatus("denied");
      sttBlockedRef.current = true;
      return false;
    }
  }

  function speak(text: string): Promise<void> {
    triageRef.current.say("ia", text);
    setLastAi(text);
    setState("speaking");
    return new Promise<void>((resolve) => {
      let done = false;
      const useVoice = voiceOutRef.current && "speechSynthesis" in window;
      const finish = () => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        resolve();
      };
      const timer = window.setTimeout(
        finish,
        useVoice ? Math.min(30000, 4000 + text.length * 70) : Math.min(4500, 700 + text.length * 25),
      );
      if (!useVoice) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const lang = speechLang();
      const voice = pickVoice(lang);
      // One utterance per sentence avoids Chrome cutting long utterances
      const sentences = text.split(/(?<=[.?!:;])\s+/).filter(Boolean);
      sentences.forEach((sentence, i) => {
        const u = new SpeechSynthesisUtterance(sentence);
        u.lang = voice?.lang ?? lang;
        if (voice) u.voice = voice;
        u.rate = 1.03;
        u.onstart = () => (kickRef.current = 1);
        u.onboundary = () => (kickRef.current = 1);
        u.onerror = finish;
        if (i === sentences.length - 1) u.onend = finish;
        synth.speak(u);
      });
    });
  }

  function listen(token: number) {
    if (!activeRef.current || token !== tokenRef.current) return;
    setInterim("");
    setState("listening");
    const Ctor = getRecognitionCtor();
    if (!Ctor || sttBlockedRef.current) return; // text / quick replies only
    const rec = new Ctor();
    rec.lang = speechLang();
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let gotFinal = false;
    rec.onresult = (e) => {
      let live = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (!r) continue;
        if (r.isFinal) final += r[0].transcript;
        else live += r[0].transcript;
      }
      if (live) setInterim(live);
      if (final.trim()) {
        gotFinal = true;
        restartsRef.current = 0;
        void handleAnswer(final.trim(), "voz");
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "audio-capture") {
        sttBlockedRef.current = true;
      }
    };
    rec.onend = () => {
      if (recRef.current === rec) recRef.current = null;
      if (gotFinal || sttBlockedRef.current) return;
      if (!activeRef.current || token !== tokenRef.current || stateRef.current !== "listening") return;
      if (restartsRef.current++ > 25) return; // give up silently; text input stays available
      window.setTimeout(() => {
        if (token === tokenRef.current && stateRef.current === "listening") listen(token);
      }, 250);
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      /* start() throws if already running */
    }
  }

  function finishSession() {
    activeRef.current = false;
    setActive(false);
    setFinished(true);
    stopRecognition();
    releaseMic();
    setState("idle");
  }

  async function handleAnswer(text: string, source: "voz" | "texto") {
    const token = ++tokenRef.current;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    stopRecognition();
    setInterim("");
    triageRef.current.say("usuario", text);
    setState("processing");

    const inSession = activeRef.current;
    const q = inSession ? TRIAGE_QUESTIONS[stepRef.current] : null;
    const focus = q?.system ?? null;
    const ev = evaluateAnswer(text, focus, vitalsRef.current);
    const base = sessionRef.current ?? triageRef.current.systems;
    const merged: TriageState = { ...base, ...ev.updates };
    sessionRef.current = merged;

    const [external] = await Promise.all([
      queryExternalLLM(text, {
        system: "Asistente médico de triaje a bordo. Responde en español, breve y clínico.",
        history: triageRef.current.transcript.map((t) => ({ role: t.role, text: t.text })),
      }).catch(() => null),
      wait(750),
    ]);
    if (token !== tokenRef.current) return;
    triageRef.current.apply(ev.updates, source);

    if (!inSession || !q) {
      const reply =
        external ??
        (Object.keys(ev.updates).length > 0
          ? `${acknowledge(null, ev.updates, merged)} ${diagnosisSummary(merged)}`
          : "No identifiqué síntomas en tu mensaje. Pulsa Iniciar consulta para una evaluación guiada.");
      await speak(reply);
      if (token === tokenRef.current) setState("idle");
      return;
    }

    const understood = Boolean(ev.updates[q.system]);
    if (!understood && unclearRef.current < 1) {
      unclearRef.current++;
      await speak(external ?? `No te entendí bien. ${q.text}`);
      listen(token);
      return;
    }
    unclearRef.current = 0;
    const ack = acknowledge(q.system, ev.updates, merged);
    const next = stepRef.current + 1;
    if (next < TRIAGE_QUESTIONS.length) {
      stepRef.current = next;
      setStep(next);
      await speak(external ?? `${ack} ${TRIAGE_QUESTIONS[next]?.text ?? ""}`);
      listen(token);
    } else {
      await speak(external ?? `${ack} ${diagnosisSummary(merged)}`);
      if (token === tokenRef.current) finishSession();
    }
  }

  const start = useCallback(async () => {
    const token = ++tokenRef.current;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    stopRecognition();
    activeRef.current = true;
    setActive(true);
    setFinished(false);
    stepRef.current = 0;
    setStep(0);
    unclearRef.current = 0;
    restartsRef.current = 0;
    sttBlockedRef.current = false;
    sessionRef.current = { ...triageRef.current.systems };
    triageRef.current.clearTranscript();
    setState("processing");
    await ensureMic();
    if (token !== tokenRef.current) return;
    const floor = vitalsTriage(vitalsRef.current);
    const flagged = TRIAGE_SYSTEMS.filter((s) => floor[s].level !== "green");
    const tele = flagged.length
      ? ` La telemetría ya marca alerta en el sistema ${flagged.map((s) => TRIAGE_META[s].title.toLowerCase()).join(" y ")}.`
      : "";
    await speak(`Hola, soy ASTRA, tu asistente médico a bordo. Necesito hacerte preguntas para tu diagnóstico.${tele} ${TRIAGE_QUESTIONS[0]?.text ?? ""}`);
    listen(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = useCallback(() => {
    tokenRef.current++;
    activeRef.current = false;
    setActive(false);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    stopRecognition();
    releaseMic();
    setInterim("");
    setState("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitText = (text: string) => {
    const t = text.trim();
    if (t) void handleAnswer(t, "texto");
  };

  const setVoiceOut = (on: boolean) => {
    voiceOutRef.current = on;
    setVoiceOutS(on);
    if (!on && "speechSynthesis" in window) window.speechSynthesis.cancel();
  };

  useEffect(() => () => stop(), [stop]);

  return {
    state,
    active,
    finished,
    step,
    question: active ? TRIAGE_QUESTIONS[step] : null,
    interim,
    lastAi,
    micStatus,
    sttSupported,
    ttsSupported,
    voiceOut,
    setVoiceOut,
    levelRef,
    start,
    stop,
    submitText,
  };
}

export type VoiceAssistant = ReturnType<typeof useVoiceAssistant>;
