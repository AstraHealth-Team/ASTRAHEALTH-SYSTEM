import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMissionSim } from "@/hooks/use-mission-sim";
import { useVoiceAssistant } from "@/hooks/use-voice-assistant";
import { TopBar } from "@/components/mission/TopBar";
import { SimulatorBar } from "@/components/mission/SimulatorBar";
import { SensorsBlock } from "@/components/mission/SensorsBlock";
import { DtnBlock } from "@/components/mission/DtnBlock";
import { EdgeBlock } from "@/components/mission/EdgeBlock";
import { HmiBlock } from "@/components/mission/HmiBlock";
import { FlowConnector } from "@/components/mission/kit";
import { ArchitectureDialog } from "@/components/mission/ArchitectureDialog";
import { ReferencesDialog } from "@/components/mission/ReferencesDialog";
import { VoiceDiagnosticModal } from "@/components/mission/VoiceDiagnosticModal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ASTRA Health HMI · Monitoreo de salud para astronautas" },
      {
        name: "description",
        content:
          "Consola médica aeroespacial NASA-STD-3001: sensores IEEE 11073, red DTN, Edge AI + FHIR R4 y alertas duales para misiones LEO, Luna y Marte.",
      },
      { property: "og:title", content: "ASTRA Health HMI · NASA Space Apps 2026" },
      {
        property: "og:description",
        content:
          "Prototipo interactivo de monitoreo de salud de astronautas con simulador de latencia y escenarios de emergencia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const sim = useMissionSim();
  const [archOpen, setArchOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const voice = useVoiceAssistant({ triage: sim.triage, vitals: sim.vitals });

  return (
    <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 px-3 pb-6 pt-2 sm:px-5">
      <TopBar
        sim={sim}
        onOpenArchitecture={() => setArchOpen(true)}
        onOpenReferences={() => setRefOpen(true)}
        onStartVoice={() => {
          setVoiceOpen(true);
          void voice.start();
        }}
      />
      <SimulatorBar sim={sim} />

      <main className="grid items-start gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* Blocks 1 → 2 → 3 feed block 4, in the order of the official diagram */}
        <div className="order-2 flex flex-col xl:order-1">
          <SensorsBlock sim={sim} />
          <FlowConnector from="sensors" to="dtn" />
          <DtnBlock sim={sim} />
          <FlowConnector from="dtn" to="edge" />
          <EdgeBlock sim={sim} />
        </div>
        <div className="order-1 xl:order-2">
          <HmiBlock sim={sim} triage={sim.triage} />
        </div>
      </main>

      <footer className="panel flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs text-muted-foreground">
        <p>
          Basado en NASA-STD-3001 Vol. 2 · NASA NPR 7150.2D · NASA HRP (ExMC) · Canadian Space
          Agency (CSA) · IEEE 11073 · HL7 FHIR R4 · RFC 9171
        </p>
        <button
          onClick={() => setRefOpen(true)}
          className="min-h-10 rounded-md border border-border px-3 font-medium text-foreground hover:border-hmi/60 hover:text-hmi"
        >
          Ver rigor científico
        </button>
      </footer>

      <ArchitectureDialog open={archOpen} onOpenChange={setArchOpen} sim={sim} />
      <ReferencesDialog open={refOpen} onOpenChange={setRefOpen} />
      <VoiceDiagnosticModal
        open={voiceOpen}
        onOpenChange={(open) => {
          setVoiceOpen(open);
          if (!open) voice.stop();
        }}
        assistant={voice}
        triage={sim.triage}
      />
    </div>
  );
}
