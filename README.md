# 🚀 AstraHealth System — Plataforma de Procesamiento de Información Médica y Soporte Clínico Espacial

**Simulación Web Interactiva en Vivo:** [https://www.astrahealth.earth/](https://www.astrahealth.earth/)

---

## Descripción General

**AstraHealth System** es una plataforma integral de software de Interfaz Hombre-Máquina (HMI) aeroespacial, procesamiento biomédico autónomo y soporte a decisiones clínicas proyectada para misiones espaciales de exploración profunda y larga duración. 

Durante el vuelo espacial, la tripulación está expuesta a estresores fisiológicos severos —como microgravedad, radiación ionizante, descarga mecánica prolongada y desincronización circadiana—. Ante el retardo en las comunicaciones con la Tierra, la telemedicina tradicional en tiempo real resulta inviable. **AstraHealth** resuelve esta limitación mediante una arquitectura computacional autónoma de dos niveles impulsada por inteligencia artificial, algoritmos de decisión clínica semiológica y una interfaz multimodular orientada a prevenir la sobrecarga cognitiva y eliminar falsos positivos de diagnóstico y tratamiento.

---

## Documentación Técnica y Científica (Carpeta `docs/`)

> **UBICACIÓN DE LA DOCUMENTACIÓN TÉCNICA:**  
> Al navegar por este repositorio, notarás que el código fuente ejecutable de la interfaz HMI (`src/`) se encuentra ubicado en el directorio raíz para facilitar la compilación, empaquetado y despliegue del sistema. Sin embargo, toda la fundamentación científica, matemática, clínica, de redes y de algoritmos que sustenta la lógica de AstraHealth se encuentra preservada en la carpeta `docs/`. Se recomienda revisar los archivos de `docs/` para comprender el marco fisiopatológico, la matriz de riesgos y la arquitectura computacional del sistema.

### Estructura y Contenido de `docs/`:

```text
docs/
├── DOC_Clinical_Decision_Algorithms.pdf         # Algoritmos de decisión clínica, reglas de vuelo y manejo por niveles de severidad.
├── DOC_Mechanism_and_information_processing.pdf # Mecanismos de procesamiento en 2 niveles (Reglas + Redes Neuronales Metamodelo/PTRS).
├── DOC_Networks_and_connections.pdf             # Arquitectura de redes, topología de controladores (Body, Suit, Analysis Center) e interconexión.
├── DOC_risks_indicators_and_devices.pdf         # Matriz de 7 fenómenos espaciales, riesgos fisiológicos, indicadores biomédicos y catálogo de dispositivos.
├── FINAL_REPORT.pdf                             # Reporte técnico final e integral del proyecto AstraHealth.
├── README.md                                    # Documentación detallada del acervo científico del sistema.
└── REPORTE_INTERFACE_INGLES.docx.pdf            # Especificación y diseño de la interfaz de usuario multimodular (reporte en inglés).
```

---

## Arquitectura del Sistema y Fundamentos Técnicos

### 1. Matriz Operativa de Riesgos y Dispositivos Biomédicos

El sistema categoriza los estresores espaciales en **7 dominios críticos** (microgravedad y desplazamiento de fluidos, radiación ionizante espacial, descarga mecánica en cero-G, aislamiento y desincronización circadiana, estrés inmunológico, variación atmosférica/hipoxia en EVA y retardo telemétrico), distribuyendo la captura biomédica en tres escenarios tecnológicos:

* **Dispositivos en Traje (EVA):** Dosímetros MOSFET EVARM, microcapnógrafos de casco y sensores ópticos de pulso y $\text{SpO}_2$.
* **Dispositivos Vestibles sin Traje (IVA):** Camiseta inteligente Astroskin, monitores de actigrafía digital ARCHER y oclusores venosos de muslo (*Thigh Cuffs*).
* **Centro de Análisis (Estación Espacial):** Tomografía de Coherencia Óptica (OCT), citómetro de flujo miniaturizado rHEALTH One, laboratorio microfluídico MicroPREP y ultrasonido Doppler vascular 3D.

### 2. Mecanismo de Procesamiento de Información en Dos Niveles

* **Secuencia Funcional de Diagnóstico:**
  * **Nivel 01:** Evaluación analítica paralela mediante motor de reglas médicas condicionales, modelos estadísticos, probabilísticos y análisis temporal respecto a la línea base (*baseline*) del astronauta.
  * **Nivel 02:** Integración mediante una Red Neuronal Metamodelo que genera una hipótesis diagnóstica priorizada. Si detecta incertidumbre crítica, activa un módulo de interrogatorio interactivo que retroalimenta el sistema antes de confirmar el resultado final.

* **Secuencia Funcional de Tratamiento:**
  * **Nivel 01:** Generación de alternativas y protocolos clínicos elegibles.
  * **Filtro Operativo:** Incorporación del perfil biológico individual, complicaciones activas de vuelo e inventario real de medicamentos a bordo.
  * **Nivel 02:** Priorización por Red Neuronal PTRS (*Personalized Treatment Recommendation System*) para emitir un plan de acción interactivo guiado en tiempo real.

### 3. Topología de Redes e Interconexión de Hardware

* **Entorno IVA (Intravehicular):**  
  Sensores vestibles $\rightarrow$ Red Inalámbrica Corporal (WBN) $\rightarrow$ Body Controller $\rightarrow$ Red Local (LAN) $\rightarrow$ Computadora de la Estación $\rightarrow$ Enlace telemétrico a la Tierra.
* **Entorno EVA (Extravehicular):**  
  Sensores del traje $\rightarrow$ Suit Network $\rightarrow$ Suit Controller (alojado en la mochila del traje, con almacenamiento local autónomo de hasta 1 mes) $\rightarrow$ Red local tolerante a intermitencias $\rightarrow$ Computadora de la Estación $\rightarrow$ Tierra.
* **Centro de Análisis:**  
  Equipamiento médico complejo $\rightarrow$ Analysis Center Network $\rightarrow$ Analysis Center Controller $\rightarrow$ Computadora de la Estación $\rightarrow$ Tierra.

### 4. Interfaz de Usuario Multimodular (HMI)

Diseñada bajo el principio de simplificación cognitiva para evitar la saturación de información en tripulantes:

* **Conmutador Automático de Momentos Temporales:** Detecta dinámicamente la fase del vuelo (Entrada en microgravedad, Adaptación en vuelo y Retorno) para ajustar los umbrales biomédicos y eliminar falsos positivos de diagnóstico y tratamiento.
* **Tres Modos de Acceso:**
  1. **Modo Astronauta:** Autogestión intuitiva mediante cartografía anatómica semaforizada (Verde, Amarillo, Rojo), seguimiento de contramedidas diarias e interrogatorio interactivo en vivo.
  2. **Modo Médico:** Monitoreo clínico profundo, trazados biomédicos, arquitectura del sueño y curvas de tendencias temporales.
  3. **Modo Sistemas:** Diagnóstico técnico del hardware, estado de baterías, deriva de sensores y salud de la infraestructura de red.
* **Modalidad de Presentación e Interacción:**
  * **Sin Traje (IVA):** Proyección holográfica en lentes de contacto o pantalla monitor en la estación.
  * **Con Traje (EVA):** Proyección holográfica en el visor del casco.
  * **Control Operativo:** 100% mediante comandos por voz en todas las modalidades (operación manos libres).

---

## Estructura del Repositorio

```text
ASTRAHEALTH-SYSTEM/
├── .lovable/                 # Configuración del entorno de desarrollo Lovable
├── docs/                     # Documentación técnica, investigación clínica y reportes científicos del sistema
├── public/                   # Recursos estáticos, modelos 3D e iconografía
├── src/                      # Código fuente principal (HMI aeroespacial y lógica de la aplicación)
├── .gitignore                # Archivos e itinerarios excluidos de Git
├── .prettierignore           # Exclusiones de formateo de código para Prettier
├── .prettierrc               # Reglas de estilo y formateo de código (Prettier)
├── AGENTS.md                 # Instrucciones y directrices para agentes de Inteligencia Artificial
├── README.md                 # Documentación principal del repositorio
├── bun.lock                  # Lockfile de dependencias del runtime Bun
├── bunfig.toml               # Configuración del motor de ejecución Bun
├── components.json           # Configuración de componentes de interfaz (Shadcn/UI)
├── eslint.config.js          # Configuración del linter estático (ESLint)
├── package-lock.json         # Lockfile de dependencias de npm
└── package.json              # Metadatos, dependencias del proyecto y scripts de desarrollo
```

---

## Tecnologías y Stack

* **Runtime & Package Manager:** Bun
* **Frontend Framework:** React 18 + TypeScript + Vite
* **UI & Styling:** Tailwind CSS + Shadcn/UI + Lucide Icons
* **Simulación Web:** [https://www.astrahealth.earth/](https://www.astrahealth.earth/)

---

## Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd ASTRAHEALTH-SYSTEM
   ```

2. **Instalar dependencias:**
   ```bash
   bun install
   # o utilizando npm:
   # npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   bun dev
   # o utilizando npm:
   # npm run dev
   ```

4. **Abrir en el navegador:**  
   Navega a `http://localhost:8080` para interactuar con la plataforma HMI localmente.

---

**Simulación Web Interactiva:** Prueba el sistema en vivo en [https://www.astrahealth.earth/](https://www.astrahealth.earth/)
