# SDD Workflow — Guía de uso

Este modelo funciona con cualquier agente de IA que soporte comandos o prompts en archivos `.md`.
Los ejemplos usan Claude Code (`/comando`), pero los archivos de comandos son portables a Copilot, Cursor u otros.

---

## Grafo del ciclo

```mermaid
flowchart TD
    subgraph F0["FASE 0 — DISCOVERY  🤖 IA + gate 👤 humano (solo brownfield)"]
        Z1["/sdd-scan\nlee codebase: manifests, configs,\nestructura, CI, README"]
        Z2{"¿Todo detectado?"}
        Z3["✅ existing-arch.md\n(doble confirmación humana)\n+ SHA para drift tracking"]
        Z1 --> Z2
        Z2 -- "⚠️ ambiguo / ❓ no detectable\npregunta UNA cosa por vez" --> Z1
        Z2 -- "✅ todo claro" --> Z3
    end

    subgraph F1["FASE 1 — BRIEF  👤 humano (sin comandos)"]
        A1["Kickoff del equipo\nPO + Tech Lead + Devs"]
        A2["📁 drafts/\nPoner acá: notas, wireframes,\nrestricciones, contexto de negocio\n\n⬇ PRIMER COMANDO: /sdd-refine"]
        A1 --> A2
    end

    subgraph F2["FASE 2 — CLARIFICACIÓN  👤↔️🤖 humano + IA"]
        B1["/sdd-refine"]
        B2{"¿Todo claro?"}
        B3["✅ input.md confirmado\n(doble confirmación humana)"]
        B1 --> B2
        B2 -- "⚠️ ambiguo / ❌ faltante\npregunta UNA cosa por vez" --> B1
        B2 -- "✅ todo claro" --> B3
    end

    subgraph F3["FASE 3 — ESPECIFICACIÓN  🤖 IA  |  gate 👤 humano"]
        C1["/sdd-generate\nconstitution · spec · plan · tasks"]
        C2["/sdd-validate"]
        C3{"¿Brief cubierto?"}
        C4["👤 humano ajusta artefactos\n+ /sdd-log → DECISIONS.md"]
        C5["✅ 4 artefactos + DECISIONS.md"]
        C1 --> C2
        C2 --> C3
        C3 -- "⚠️ parcial / ❌ gap\nIA avisa y para" --> C4
        C4 --> C2
        C3 -- "✅ cubierto" --> C5
    end

    subgraph F4["FASE 4 — CÓDIGO  🤖 IA  |  gate 👤 humano"]
        D1["/sdd-implement\napp/ + tests unitarios"]
        D2["/sdd-checklist\nchecklist.md\n(lo completa el humano)"]
        D3["/sdd-review\ncruce spec + UI + código"]
        D4{"¿Aprobado?"}
        D5["👤 dev resuelve gaps\n+ /sdd-log → DECISIONS.md"]
        D6["✅ OUTPUT\ncódigo terminado con tests"]
        D1 --> D2
        D2 --> D3
        D3 --> D4
        D4 -- "PENDIENTE\nIA avisa y para" --> D5
        D5 --> D3
        D4 -- "APROBADO" --> D6
    end

    A2 --> B1
    B3 --> C1
    C5 --> D1
    Z3 -.->|activa modo brownfield| B1

    style F0 fill:#3a2a1e,stroke:#fbbf24,color:#e2e8f0
    style F1 fill:#1e293b,stroke:#64748b,color:#e2e8f0
    style F2 fill:#1e3a2f,stroke:#4ade80,color:#e2e8f0
    style F3 fill:#1e2a3a,stroke:#60a5fa,color:#e2e8f0
    style F4 fill:#2a1e3a,stroke:#a78bfa,color:#e2e8f0
```

---

## El ciclo completo

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FASE 0 — DISCOVERY (solo brownfield) [lidera: IA, gate humano]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /sdd-scan
  Lee el codebase existente (manifests, configs, estructura)
  Clasifica: ✅ detectado / ⚠️ ambiguo / ❓ no detectable
  Grilling humano para resolver ambigüedades
  Doble confirmación antes de guardar
  Output: existing-arch.md (raíz, ≤120 líneas, descriptivo)
  → Activa modo brownfield en todos los comandos siguientes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FASE 1 — BRIEF                [lidera: humano]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Kickoff del equipo (PO + Tech Lead + Devs)
  El equipo escribe borradores crudos:
    notas de reunión, wireframes en texto,
    restricciones técnicas, contexto de negocio
  Output: archivos en drafts/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FASE 2 — CLARIFICACIÓN        [lidera: humano + IA]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /sdd-refine
  IA analiza borradores e identifica:
    ✅ claro / ⚠️ ambiguo / ❌ faltante
  Loop de grilling: pregunta UNA cosa por vez
  y repite hasta que todo esté en estado CLARO.
  La IA nunca toma decisiones de negocio sola.
  Requiere confirmación humana antes de cerrar.
  Output: input.md confirmado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FASE 3 — ESPECIFICACIÓN       [lidera: IA]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /sdd-generate
  Lee input.md y genera los 4 artefactos:
    • constitution.md  (principios MUST/PROHIBITED)
    • spec.md          (user stories + Given/When/Then)
    • plan.md          (arquitectura + estructura)
    • tasks.md         (tareas TDD ordenadas)

  /sdd-validate  [gate de gobernanza]
  Compara input.md vs los 4 artefactos.
  Reporta: ✅ cubierto / ⚠️ parcial / ❌ sin cobertura
  Si hay gaps → avisa, espera, NO modifica solo.
  El humano ajusta los artefactos y corre /sdd-log.

  /sdd-log  [trazabilidad]
  Registra en DECISIONS.md cada decisión que
  desvía o amplía el brief original.
  Output: constitution.md + spec.md + plan.md
        + tasks.md + DECISIONS.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FASE 4 — CÓDIGO               [lidera: IA]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /sdd-implement
  Lee los 4 artefactos e implementa todas las
  tareas de tasks.md en orden (TDD).
  Genera código + tests unitarios.

  /sdd-checklist  [verificación manual]
  Lee spec.md + plan.md + tasks.md.
  Genera checklist.md con criterios que los tests
  no pueden cubrir: UX, accesibilidad, seguridad.
  Lo completa un humano antes del review final.

  /sdd-review  [gate de gobernanza]
  Lee spec.md + código generado.
  Verifica que cada Given/When/Then tiene test.
  Si hay gaps → avisa, espera, NO agrega código solo.
  Output: app/ + checklist.md + reporte APROBADO/PENDIENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MANTENIMIENTO — cada sprint     [👤 Tech Lead]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /sdd-health
  Audita todos los artefactos activos.
  Detecta: archivos sobredimensionados, principios
  contradictorios, tasks completadas no archivadas,
  user stories canceladas o sin código.
  Solo reporta — no modifica nada solo.
  Si el equipo aprueba el archivado → /sdd-log.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 OUTPUT: código terminado con tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

<!-- NUEVO [sdd-handoff]: sección transversal agregada al ciclo, igual que /sdd-log -->
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TRANSVERSAL — disponible en cualquier fase
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /sdd-handoff [propósito]
  Comprime el estado de la sesión actual en un documento
  para que otra sesión o agente pueda continuar el trabajo.

  TIPO OPERATIVO — sesión paralela, prototipo, bug fix fuera de scope.
  Destino: directorio temporal del OS (/tmp). Desechable.

  TIPO GATE — transición formal entre fases (ej: Fase 3 → Fase 4).
  Destino: handoffs/ en el repo. Versionado y auditable.

  Regla de trazabilidad (no salteable):
  DECISIONS.md debe estar al día antes de generar el handoff.
  Si hay decisiones sin loggear → para y exige /sdd-log primero.

  El handoff no reemplaza a DECISIONS.md.
  Es un snapshot de navegación, no el registro canónico.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
<!-- FIN NUEVO -->

---

## Estructura de archivos

```
── PLANTILLA (archivos del template) ──────────────────────
sdd-model/
├── README.md                    ← descripción pública del modelo
├── CLAUDE.md                    ← contexto automático para Claude
├── WORKFLOW.md                  ← este archivo
├── AGENT-HANDOFF.md             ← contexto de sesión para onboarding de agentes
├── graph-render.html            ← HTML para renderizar el grafo como PNG
├── drafts/
│   └── README.md                ← instrucciones de qué poner en drafts/
└── .claude/
    ├── settings.json            ← permisos para Claude Code
    └── commands/
        ├── sdd-explain.md       ← ONBOARDING: explica el modelo completo
        ├── sdd-scan.md          ← FASE 0: codebase existente → existing-arch.md
        ├── sdd-refine.md        ← FASE 2: grilling → input.md
        ├── sdd-generate.md      ← FASE 3: input.md → 4 artefactos
        ├── sdd-validate.md      ← FASE 3: quality gate
        ├── sdd-log.md           ← FASE 3/4: registrar decisiones
        ├── sdd-implement.md     ← FASE 4: artefactos → código
        ├── sdd-checklist.md     ← FASE 4: checklist verificación manual
        ├── sdd-review.md        ← FASE 4: verificación final
        ├── sdd-health.md        ← MANTENIMIENTO: auditoría por sprint
        └── sdd-handoff.md       ← TRANSVERSAL: snapshot de sesión para handoff
```
<!-- NUEVO [sdd-handoff]: línea agregada arriba en la lista de comandos -->
<!-- FIN NUEVO -->

```
── RUNTIME (se crean al usar el modelo) ───────────────────
existing-arch.md                 ← FASE 0: solo brownfield, generado por /sdd-scan (≤ 120 líneas)
constitution.md                  ← global del proyecto (≤ 60 líneas)
DECISIONS.md                     ← trazabilidad global via /sdd-log
specs/
└── 001-[nombre-feature]/
    ├── input.md                 ← FASE 2: output de /sdd-refine
    ├── spec.md                  ← FASE 3: generado (≤ 80 líneas)
    ├── plan.md                  ← FASE 3: generado (≤ 50 líneas)
    ├── tasks.md                 ← FASE 3: generado (≤ 40 líneas activas)
    └── checklist.md             ← FASE 4: generado por /sdd-checklist
app/                             ← FASE 4: greenfield, generado por /sdd-implement
(en brownfield: el código se genera dentro del source_root de existing-arch.md)
handoffs/                        ← TRANSVERSAL: snapshots de gate, versionados
```
<!-- NUEVO [sdd-handoff]: línea handoffs/ agregada arriba en runtime -->
<!-- FIN NUEVO -->

---

## Quién hace qué

| Fase | Responsable humano | Responsable IA |
|---|---|---|
| **0 — Discovery** (brownfield) | Tech Lead (responder grilling, confirmar) | Claude (`/sdd-scan`) |
| **1 — Brief** | PO + Tech Lead (kickoff, borradores) | — |
| **2 — Clarificación** | PO + Tech Lead (responder, confirmar) | Claude (`/sdd-refine`) |
| **3 — Especificación** | Tech Lead (revisar, resolver gaps, firmar) | Claude (`/sdd-generate`, `/sdd-validate`, `/sdd-log`) |
| **4 — Código** | Dev / Tech Lead (completar checklist + review final) | Claude (`/sdd-implement`, `/sdd-checklist`, `/sdd-review`) |
| **Mantenimiento** | Tech Lead (cada sprint, aprobar archivado) | Claude (`/sdd-health`) |
<!-- NUEVO [sdd-handoff]: fila transversal agregada -->
| **Transversal** | Quien detecta el momento de handoff (declarar propósito) | Claude (`/sdd-handoff`) |
<!-- FIN NUEVO -->

---

## Requisitos

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) instalado
- `pnpm` instalado (`npm install -g pnpm`)
- Node.js 18+
