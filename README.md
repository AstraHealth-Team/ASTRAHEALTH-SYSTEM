# 🚀 AstraHealth System — Medical Information Processing & Space Clinical Support Platform

**Live Interactive Web Simulation:** <https://www.astrahealth.earth/>

## Overview

**AstraHealth System** is a comprehensive aerospace Human-Machine Interface (HMI) software platform, autonomous biomedical processing, and clinical decision support system designed for deep-space and long-duration exploration missions.

During spaceflight, the crew is exposed to severe physiological stressors—such as microgravity, ionizing radiation, prolonged mechanical unloading, and circadian desynchronization. Due to communication delays with Earth, traditional real-time telemedicine becomes unfeasible. **AstraHealth** overcomes this limitation through an autonomous two-tier computational architecture powered by artificial intelligence, semiological clinical decision algorithms, and a multi-modular interface aimed at preventing cognitive overload and eliminating diagnostic and treatment false positives.

## Technical and Scientific Documentation (`docs/` Folder)

> **LOCATION OF TECHNICAL DOCUMENTATION:**
>
> When browsing this repository, you will notice that the executable source code for the HMI interface (`src/`) is located in the root directory to facilitate building, packaging, and deploying the system. However, all the scientific, mathematical, clinical, networking, and algorithmic foundations supporting AstraHealth's logic are preserved in the `docs/` folder. Reviewing the files inside `docs/` is recommended to understand the pathophysiological framework, risk matrix, and computational architecture of the system.

### Structure and Contents of `docs/`:

```text
docs/
├── DOC_Clinical_Decision_Algorithms.pdf         # Clinical decision algorithms, flight rules, and severity-level management.
├── DOC_Mechanism_and_information_processing.pdf # 2-tier processing mechanisms (Rules + Metamodel/PTRS Neural Networks).
├── DOC_Networks_and_connections.pdf             # Network architecture, controller topology (Body, Suit, Analysis Center), and interconnection.
├── DOC_risks_indicators_and_devices.pdf         # Matrix of 7 space phenomena, physiological risks, biomedical indicators, and device catalog.
├── FINAL_REPORT.pdf                             # Final and comprehensive technical report of the AstraHealth project.
├── README.md                                    # Detailed documentation of the system's scientific repository.
└── REPORTE_INTERFACE_INGLES.docx.pdf            # Multi-modular user interface specification and design (English report).
```

## System Architecture and Technical Foundations

### 1. Operational Matrix of Risks and Biomedical Devices

The system categorizes space stressors into **7 critical domains** (microgravity and fluid shift, space ionizing radiation, zero-G mechanical unloading, isolation and circadian desynchronization, immunological stress, atmospheric variation/hypoxia during EVA, and telemetry delay), distributing biomedical data capture across three technological scenarios:

* **In-Suit Devices (EVA):** MOSFET EVARM dosimeters, helmet micro-capnographs, and optical pulse and $\text{SpO}_2$ sensors.
* **Suitless Wearable Devices (IVA):** Astroskin smart shirt, ARCHER digital actigraphy monitors, and venous thigh cuffs (*Thigh Cuffs*).
* **Analysis Center (Space Station):** Optical Coherence Tomography (OCT), miniaturized flow cytometer rHEALTH One, MicroPREP microfluidic laboratory, and 3D vascular Doppler ultrasound.

### 2. Two-Tier Information Processing Mechanism

* **Diagnostic Functional Sequence:**
  * **Tier 01:** Parallel analytical evaluation using a conditional medical rules engine, statistical and probabilistic models, and temporal analysis against the astronaut's baseline.
  * **Tier 02:** Integration via a Metamodel Neural Network that generates a prioritized diagnostic hypothesis. If critical uncertainty is detected, it triggers an interactive questioning module that feeds back into the system before confirming the final result.
* **Treatment Functional Sequence:**
  * **Tier 01:** Generation of eligible clinical alternatives and protocols.
  * **Operational Filter:** Incorporation of the individual biological profile, active in-flight complications, and real-time onboard medication inventory.
  * **Tier 02:** Prioritization via the PTRS (*Personalized Treatment Recommendation System*) Neural Network to issue a real-time, guided interactive action plan.

### 3. Network Topology and Hardware Interconnection

* **IVA Environment (Intravehicular):**
  Wearable sensors $\rightarrow$ Wireless Body Network (WBN) $\rightarrow$ Body Controller $\rightarrow$ Local Area Network (LAN) $\rightarrow$ Station Computer $\rightarrow$ Telemetry link to Earth.
* **EVA Environment (Extravehicular):**
  Suit sensors $\rightarrow$ Suit Network $\rightarrow$ Suit Controller (housed in the suit backpack, with up to 1 month of autonomous local storage) $\rightarrow$ Delay/disruption-tolerant local network $\rightarrow$ Station Computer $\rightarrow$ Earth.
* **Analysis Center:**
  Complex medical equipment $\rightarrow$ Analysis Center Network $\rightarrow$ Analysis Center Controller $\rightarrow$ Station Computer $\rightarrow$ Earth.

### 4. Multi-Modular User Interface (HMI)

Designed under the principle of cognitive simplification to prevent crew information overload:

* **Automatic Flight-Phase Switcher:** Dynamically detects the mission phase (Microgravity entry, In-flight adaptation, and Return) to adjust biomedical thresholds and eliminate diagnostic and treatment false positives.
* **Three Access Modes:**
  1. **Astronaut Mode:** Intuitive self-management via color-coded anatomical mapping (Green, Yellow, Red), daily countermeasures tracking, and live interactive questioning.
  2. **Medical Mode:** Deep clinical monitoring, biomedical waveforms, sleep architecture, and temporal trend curves.
  3. **Systems Mode:** Technical hardware diagnostics, battery status, sensor drift, and network infrastructure health.
* **Presentation and Interaction Modalities:**
  * **Suitless (IVA):** Holographic projection on contact lenses or station display monitor.
  * **Suited (EVA):** Holographic projection on the helmet visor.
  * **Operational Control:** 100% voice-command operated across all modalities (hands-free operation).

## Repository Structure

```text
ASTRAHEALTH-SYSTEM/
├── .lovable/                 # Lovable development environment configuration
├── docs/                     # Technical documentation, clinical research, and scientific reports
├── public/                   # Static assets, 3D models, and iconography
├── src/                      # Main source code (aerospace HMI and application logic)
├── .gitignore                # Files and paths excluded from Git
├── .prettierignore           # Code formatting exclusions for Prettier
├── .prettierrc               # Code style and formatting rules (Prettier)
├── AGENTS.md                 # Instructions and guidelines for Artificial Intelligence agents
├── README.md                 # Main repository documentation
├── bun.lock                  # Bun runtime dependency lockfile
├── bunfig.toml               # Bun runtime configuration
├── components.json           # UI component configuration (Shadcn/UI)
├── eslint.config.js          # Static linter configuration (ESLint)
├── package-lock.json         # npm dependency lockfile
└── package.json              # Project metadata, dependencies, and development scripts
```

## Technologies and Stack

* **Runtime & Package Manager:** Bun
* **Frontend Framework:** React 18 + TypeScript + Vite
* **UI & Styling:** Tailwind CSS + Shadcn/UI + Lucide Icons
* **Web Simulation:** <https://www.astrahealth.earth/>

## Local Installation and Execution

1. **Clone the repository:**
   ```bash
   git clone <REPOSITORY_URL>
   cd ASTRAHEALTH-SYSTEM
   ```

2. **Install dependencies:**
   ```bash
   bun install
   # or using npm:
   # npm install
   ```

3. **Start the development server:**
   ```bash
   bun dev
   # or using npm:
   # npm run dev
   ```

4. **Open in the browser:**
   Navigate to `http://localhost:8080` to interact with the HMI platform locally.

**Interactive Web Simulation:** Test the live system at <https://www.astrahealth.earth/>