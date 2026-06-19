# SDD Model — Spec-Driven Development

Un workflow estructurado para desarrollo asistido por IA donde el foco no es únicamente generar código, sino construir **contexto consistente**, **trazabilidad** y **gobernanza** durante todo el ciclo de desarrollo.

---

## ¿Qué es?

SDD propone reemplazar workflows basados en prompts aislados por un sistema con fases definidas, artefactos versionables y gates de aprobación humana. El código es la consecuencia de un proceso estructurado, no el punto de partida.

---

## Primeros pasos — Instalación en tu proyecto

### 1. Qué archivos copiar

El modelo SDD vive en este repo. Para usarlo en tu proyecto, copiá estos archivos y carpetas en la raíz del repo donde vas a desarrollar:

| Archivo / carpeta | Qué es | Obligatorio |
|---|---|---|
| `.claude/commands/` | Todos los comandos del modelo | ✅ Sí |
| `.claude/settings.json` | Configuración de permisos y MCPs para Claude Code | ✅ Sí |
| `.vscode/mcp.json` | Configuración de MCPs para Cursor | ✅ Sí |
| `mcp/` | Servidor mcp-proguide (gobernanza SDD local) | ✅ Sí |
| `CLAUDE.md` | Contexto del modelo — se carga automáticamente | ✅ Sí |
| `graph/domain.template.yaml` | Template del grafo de dominio | Recomendado |
| `specs/_registry/features.template.yaml` | Template del registro de features | Recomendado |
| `scripts/sdd-audit.mjs` | Script de auditoría automática | Recomendado |
| `.github/workflows/sdd-audit.yml` | Workflow CI para auditoría | Opcional |

### 2. Orden de ejecución — primera vez

Una vez copiados los archivos, seguí este orden:

```
1. /sdd-setup
   Configura el entorno, los MCPs y las credenciales de Atlassian.
   Guía paso a paso — no requiere conocimiento técnico previo.
   Solo se corre una vez por proyecto.
        ↓
2. /sdd-explain  (opcional)
   Si es tu primer contacto con el modelo, este comando te explica
   cómo funciona todo antes de arrancar.
        ↓
3. /sdd-scan  (solo si el proyecto ya tiene código)
   Lee el codebase existente y genera existing-arch.md.
   Salteá este paso si es un proyecto nuevo.
        ↓
4. Poné tus borradores en drafts/
   Notas, wireframes, restricciones, contexto de negocio.
        ↓
5. /sdd-jira-start [TICKET-KEY]  (si usás integración Jira)
   Vinculá el primer ticket con una feature SDD.
   O arrancá directamente con /sdd-refine si no usás Jira.
        ↓
6. Flujo SDD normal:
   /sdd-refine → /sdd-generate → /sdd-validate → /sdd-implement → /sdd-review
```

### 3. Compilar mcp-proguide

Después de copiar la carpeta `mcp/`, compilá el servidor:

```bash
cd mcp
pnpm install
pnpm build
```

> Si corrés `/sdd-setup`, este paso se hace automáticamente.

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
| `specs/[feature_id]/` | Una carpeta por feature con sus 4 artefactos + checklist |
| `specs/[feature_id]/feature.status.md` | Estado del ciclo de vida: `OPEN` (en progreso) o `CLOSED` (aprobada) |
| `specs/[feature_id]/jira-map.yaml` | Mapa de trazabilidad task ↔ ticket Jira — generado por `/sdd-generate` |
| `metrics/[feature_id]-metrics.md` | Métricas de esfuerzo y calidad por feature — generado automáticamente |
| `handoffs/` | Snapshots de gate entre fases — versionados, referenciados en `DECISIONS.md` |

---

## Comandos

| Comando | Fase | Qué hace |
|---|---|---|
| `/sdd-setup` | Setup | Configura entorno, MCPs y credenciales — guiado paso a paso |
| `/sdd-explain` | Onboarding | Explica el modelo completo y cómo conecta cada parte |
| `/sdd-scan` | 0 (brownfield) | Lee el código existente y genera `existing-arch.md` |
| `/sdd-refine` | 2 | Grilling dinámico → `input.md` |
| `/sdd-generate` | 3 | `input.md` → 4 artefactos + crea tickets en Jira + genera `jira-map.yaml` |
| `/sdd-validate` | 3 | Quality gate: brief vs artefactos |
| `/sdd-log` | 3/4 | Registra decisiones en `DECISIONS.md` |
| `/sdd-handoff` | Transversal | Comprime el estado de sesión para continuar en otra sesión o agente. Requiere DECISIONS.md al día. |
| `/sdd-compact-guide` | Mant. | Indica si conviene correr `/compact` según la fase SDD actual |
| `/sdd-context-budget` | Mant. | Audita el peso en tokens del framework SDD antes del trabajo |
| `/sdd-implement` | 4 | Artefactos → código con TDD |
| `/sdd-checklist` | 4 | Genera criterios de verificación manual |
| `/sdd-review` | 4 | Gate final: lógica + UI |
| `/sdd-health` | Mant. | Auditoría por sprint + drift de `existing-arch.md` + resumen de métricas |
| `/sdd-metrics` | Mant. | Reporte de esfuerzo, tokens y rework de la sesión actual |
| `/sdd-metrics-summary` | Mant. | Tabla agregada de métricas de todas las features del proyecto |
| `/sdd-test` | QA | Smoke test del modelo sobre un fixture sintético (22 checkpoints) |
| `/sdd-jira-start` | Jira | Conecta un ticket de Jira con una feature SDD y lo mueve a IN PROGRESS |
| `/sdd-jira-sync` | Jira | Reconcilia `jira-map.yaml` con el estado real de Jira en ambas direcciones |
| `/sdd-jira-close` | Jira | Cierra la feature en SDD y mueve el ticket principal a FINALIZADO |

---

## Integración con Jira

Los comandos `/sdd-jira-*` conectan el modelo SDD con Jira para mantener trazabilidad completa entre tasks y tickets. Requieren el **Atlassian MCP** activo.

### Ciclo de vida de la integración

```
/sdd-jira-start [TICKET-KEY]   → vincula ticket de Jira con feature SDD (vínculo grueso: 1 ticket ↔ 1 feature)
/sdd-generate                  → genera tasks + crea tickets en Jira + genera jira-map.yaml (vínculo fino: 1 ticket ↔ 1 task)
/sdd-jira-sync                 → reconcilia ambos lados durante el desarrollo (bidireccional, gate humano)
/sdd-jira-close                → cierra feature en SDD y mueve ticket principal a FINALIZADO
```

### Configuración del Atlassian MCP por entorno

> Si es tu primera vez, corré `/sdd-setup` — te guía por todo esto automáticamente.

**Cursor** — el archivo `.vscode/mcp.json` ya incluye ambos servidores (`sdd` + `atlassian`). Cursor los levanta automáticamente al abrir el proyecto. La primera vez pedirá autenticar tu cuenta de Atlassian vía OAuth.

**Claude Code** — el archivo `.claude/settings.json` ya incluye ambos servidores. Para el Atlassian MCP definí estas variables de entorno antes de abrir la sesión:
```bash
export ATLASSIAN_SITE_URL=https://tu-org.atlassian.net
export ATLASSIAN_USER_EMAIL=tu@email.com
export ATLASSIAN_API_TOKEN=tu-api-token
```
Generás el API token en: https://id.atlassian.com/manage-profile/security/api-tokens

**Claude.ai** — conectar manualmente desde la UI: Atlassian desde el conector oficial, mcp-proguide como servidor MCP remoto con la URL de tu instancia.

---

## Telemetría DX

El modelo captura automáticamente métricas de esfuerzo y calidad en cada fase:

| Fase | Qué se registra |
|---|---|
| `/sdd-refine` | Rondas de grilling, categorías faltantes y ambiguas al inicio |
| `/sdd-validate` | Cobertura inicial del brief, gaps encontrados |
| `/sdd-implement` | Ciclos de autocorrección, consultas de clarificación, tokens estimados |
| `/sdd-review` | Resultado final, criterios sin test, gaps de UI |
| `/sdd-jira-*` | Tickets creados, sincronizados, estados actualizados, duplicados resueltos |

Todos los datos se acumulan en `metrics/[feature_id]-metrics.md` con `iteration_number` para detectar retrabajo entre sesiones.

**Rework Ratio** por feature:
$$\text{Rework Ratio} = \frac{\text{autocorrecciones} + \text{entradas DECISIONS.md}}{\text{tareas totales}}$$

### ¿Cuándo usar cada comando?

| Comando | Nivel | Cuándo usarlo | Output esperado |
|---|---|---|---|
| `/sdd-metrics` | Feature / sesión | Al terminar una implementación o una iteración puntual | Detalle completo de la feature actual (DX_MET_001..006, tokens estimados, rework ratio) |
| `/sdd-metrics-summary` | Proyecto | En sync de equipo, cierre de sprint o reporte para PM/Lead | Tabla agregada de todas las features + totales + señales de alerta |

Regla rápida: si querés entender **qué pasó en una feature**, usá `/sdd-metrics`; si querés entender **cómo va el proyecto completo**, usá `/sdd-metrics-summary`.

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
