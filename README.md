# SDD Model — Spec-Driven Development

Un workflow estructurado para desarrollo asistido por IA donde el foco no es únicamente generar código, sino construir **contexto consistente**, **trazabilidad** y **gobernanza** durante todo el ciclo de desarrollo.

---

## ¿Qué es?

SDD propone reemplazar workflows basados en prompts aislados por un sistema con fases definidas, artefactos versionables y gates de aprobación humana. El código es la consecuencia de un proceso estructurado, no el punto de partida.

---

## El ciclo

### Fase 0 — Discovery (solo brownfield) `🤖 IA | gate 👤 humano`
Si el proyecto ya tiene código, `/sdd-scan` recorre el repo y genera `existing-arch.md`:
un documento descriptivo del stack real, `source_root`, patrones inquebrantables y
restricciones del codebase. Doble confirmación humana antes de guardarlo. Todos los
comandos posteriores detectan su presencia y entran en modo brownfield automáticamente.

### Fase 1 — Brief `👤 humano`
El equipo (PO + Tech Lead + Devs) genera borradores funcionales y técnicos en `drafts/`: notas, wireframes, restricciones, contexto de negocio.

### Fase 2 — Clarificación `👤↔️🤖`
`/sdd-refine` detecta gaps, aclara restricciones y consolida un `input.md` como **fuente única de verdad** del proyecto. Requiere doble confirmación humana antes de cerrar.

### Fase 3 — Especificación `🤖 IA | gate 👤 humano`
Desde `input.md`, los agentes generan cuatro artefactos operativos:

| Artefacto | Qué es | Límite |
|---|---|---|
| `constitution.md` | Principios inmutables del proyecto (MUST / PROHIBITED) | ≤ 60 líneas |
| `spec.md` | User stories con criterios Given/When/Then verificables | ≤ 80 líneas |
| `plan.md` | Stack, arquitectura y estructura de archivos concreta | ≤ 50 líneas |
| `tasks.md` | Lista TDD ordenada con IDs únicos y marcas de paralelismo | ≤ 40 activas |

`/sdd-validate` verifica que los artefactos cubran el brief. Si hay gaps, **avisa y para** — no modifica nada solo. Cada decisión que desvía el brief queda registrada en `DECISIONS.md` vía `/sdd-log`.

### Fase 4 — Código `🤖 IA | gate 👤 humano`
`/sdd-implement` ejecuta las tareas en orden con TDD usando `pnpm`. `/sdd-checklist` genera los criterios no automatizables (UX, accesibilidad, seguridad, negocio) que el equipo humano completa. `/sdd-review` hace el gate final en dos pasadas: lógica (spec + tests) y UI (input.md → spec → código).

### Mantenimiento — cada sprint `👤 Tech Lead`
`/sdd-health` audita todos los artefactos activos: detecta archivos sobredimensionados, principios contradictorios, tasks completadas no archivadas y user stories sin código. Solo reporta — nunca modifica solo.

---

## Artefactos globales

| Archivo | Rol |
|---|---|
| `existing-arch.md` | (solo brownfield) Estado descriptivo del codebase — raíz |
| `constitution.md` | Principios del proyecto — global, vive en la raíz |
| `DECISIONS.md` | Registro tipo ADR de cada desvío del brief — global, versionado |
| `specs/001-[feature]/` | Una carpeta por feature con sus 4 artefactos + checklist |
<!-- NUEVO [sdd-handoff]: agregado artefacto handoffs/ como destino de snapshots de gate -->
| `handoffs/` | Snapshots de gate entre fases — versionados, referenciados en `DECISIONS.md` |
<!-- FIN NUEVO -->

---

## Comandos

| Comando | Fase | Qué hace |
|---|---|---|
| `/sdd-explain` | Onboarding | Explica el modelo completo y cómo conecta cada parte |
| `/sdd-scan` | 0 (brownfield) | Lee el código existente y genera `existing-arch.md` |
| `/sdd-refine` | 2 | Grilling dinámico → `input.md` |
| `/sdd-generate` | 3 | `input.md` → 4 artefactos |
| `/sdd-validate` | 3 | Quality gate: brief vs artefactos |
| `/sdd-log` | 3/4 | Registra decisiones en `DECISIONS.md` |
<!-- NUEVO [sdd-handoff]: agregado comando transversal de handoff -->
| `/sdd-handoff` | Transversal | Comprime el estado de sesión para continuar en otra sesión o agente. Requiere DECISIONS.md al día. |
<!-- FIN NUEVO -->
| `/sdd-implement` | 4 | Artefactos → código con TDD |
| `/sdd-checklist` | 4 | Genera criterios de verificación manual |
| `/sdd-review` | 4 | Gate final: lógica + UI |
| `/sdd-health` | Mant. | Auditoría por sprint + drift de `existing-arch.md` |

---

## Principio de gobernanza

Los agentes no reemplazan decisiones técnicas ni de negocio. En cada gate, la IA avisa, para y espera aprobación humana explícita antes de continuar.

---

## Compatibilidad con otras herramientas

La metodología y los artefactos son agnósticos al IDE. Lo que varía es cómo se invocan los comandos:

| Herramienta | Cómo usar los comandos |
|---|---|
| **Claude Code** | `/sdd-refine` — invocación directa (uso nativo) |
| **Cursor** | `@.claude/commands/sdd-refine.md` como contexto del chat |
| **Copilot (VS Code)** | Pegar el contenido del `.md` como prompt en el chat |
| **Windsurf / cualquier agente** | El contenido de cada `.md` es el prompt — copiar y pegar |

Los archivos en `.claude/commands/` son instrucciones en texto plano. Funcionan en cualquier herramienta que acepte un prompt en markdown.

---

## Requisitos

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- `pnpm` ≥ 9.x (`npm install -g pnpm`)
- Node.js 18+
