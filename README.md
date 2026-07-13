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
restricciones del codebase. Además genera `graph/domain.yaml`, el **grafo de dominio**
que mapea dominios → entidades, servicios, componentes y rutas exactas de archivos.
Doble confirmación humana antes de guardarlos. Todos los comandos posteriores detectan
su presencia y entran en modo brownfield automáticamente.

### Fase 1 — Brief `👤 humano`
El equipo (PO + Tech Lead + Devs) genera borradores funcionales y técnicos en `drafts/`: notas, wireframes, restricciones, contexto de negocio.

### Fase 2 — Clarificación `👤↔️🤖`
`/sdd-refine` detecta gaps, aclara restricciones y consolida un `input.md` como **fuente única de verdad** del proyecto. Requiere doble confirmación humana antes de cerrar.

Antes del grilling, detecta automáticamente el tipo de feature (dashboard/reporte, formulario, lista, permisos, integración externa) y agrega preguntas específicas de dominio a su análisis — aunque el borrador no las mencione. Ejemplo: si la feature es un dashboard, pregunta sobre dimensión temporal, granularidad y si el estado debe persistir en la URL. Esto evita que decisiones críticas queden sin definir hasta que aparecen durante la implementación.

### Fase 3 — Especificación `🤖 IA | gate 👤 humano`
Desde `input.md`, los agentes generan cuatro artefactos operativos:

| Artefacto | Qué es | Límite |
|---|---|---|
| `constitution.md` | Principios inmutables del proyecto (MUST / PROHIBITED) | ≤ 60 líneas |
| `spec.md` | User stories con criterios Given/When/Then verificables + sección obligatoria `## Fuera de scope (v1)` con los ítems rechazados durante el grilling y la razón de rechazo. Es el **contrato negativo** de la feature: lo que el equipo se comprometió a NO construir en v1. `/sdd-implement` no puede implementar nada listado ahí aunque aparezca en drafts o en el contexto. | ≤ 80 líneas |
| `plan.md` | Stack, arquitectura y estructura de archivos concreta | ≤ 50 líneas |
| `tasks.md` | Lista TDD con IDs únicos. Tres reglas de calidad: **(1) slicing vertical** — cada tarea entrega una slice completa y testeable de un user story (backend + UI + integración), no capas tecnológicas separadas; **(2) sin nombres de funciones** — las tareas describen QUÉ construir, no CÓMO, para no volverse stale si la implementación previa cambia; **(3) trazabilidad** — cada tarea referencia el `US-N` de `spec.md` que implementa. | ≤ 40 activas |

`/sdd-validate` verifica que los artefactos cubran el brief. Si hay gaps, **avisa y para** — no modifica nada solo. Cada decisión que desvía el brief queda registrada en `DECISIONS.md` vía `/sdd-log`.

### Fase 4 — Código `🤖 IA | gate 👤 humano`
`/sdd-implement` ejecuta las tareas en orden con un **loop TDD explícito por tarea**: Red → Green → Refactor. El paso de refactor verifica duplicación, nombres que no reflejan su intención y abstracciones prematuras antes de pasar a la siguiente tarea. `/sdd-checklist` genera los criterios no automatizables (UX, accesibilidad, seguridad, negocio) que el equipo humano completa. `/sdd-review` hace el gate final en tres pasadas: lógica (spec + tests), UI (input.md → spec → código) y **calidad estructural** (duplicación, nombres engañosos, abstracciones prematuras acumuladas en toda la feature).

### Mantenimiento — cada sprint `👤 Tech Lead`
`/sdd-health` audita todos los artefactos activos: detecta archivos sobredimensionados, principios contradictorios, tasks completadas no archivadas y user stories sin código. Solo reporta — nunca modifica solo.

---

## Artefactos globales

| Archivo | Rol |
|---|---|
| `existing-arch.md` | (solo brownfield) Estado descriptivo del codebase — raíz |
| `graph/domain.yaml` | Grafo de dominio: routing de contexto para ahorrar tokens — generado por `/sdd-scan` |
| `specs/_registry/features.yaml` | Registro maestro: status, dominio, owner, sprint y archivos que toca cada feature |
| `specs/_registry/sprints/` | Un archivo por sprint: scope, owners y gate de cierre |
| `constitution.md` | Principios del proyecto — global, vive en la raíz |
| `DECISIONS.md` | Registro tipo ADR de cada desvío del brief — global, versionado |
| `specs/[feature_id]/` | Una carpeta por feature con sus 4 artefactos + checklist |
| `specs/[feature_id]/feature.status.md` | Estado del ciclo de vida: `OPEN` (en progreso) o `CLOSED` (aprobada) |
| `specs/[feature_id]/jira-map.yaml` | Mapa de trazabilidad task ↔ ticket Jira — generado por `/sdd-generate` Paso 5 |
| `metrics/[feature_id]-metrics.md` | Métricas de esfuerzo y calidad por feature — generado automáticamente |
| `handoffs/` | Snapshots de gate entre fases — versionados, referenciados en `DECISIONS.md` |

---

## Comandos

| Comando | Fase | Qué hace |
|---|---|---|
| `/sdd-setup` | Setup | Configura entorno, MCPs y credenciales — guiado paso a paso para cualquier perfil de dev |
| `/sdd-explain` | Onboarding | Explica el modelo completo y cómo conecta cada parte |
| `/sdd-scan` | 0 (brownfield) | Lee el código existente y genera `existing-arch.md` + `graph/domain.yaml` |
| `/sdd-refine` | 2 | Grilling dinámico → `input.md` |
| `/sdd-generate` | 3 | `input.md` → 4 artefactos + crea tickets en Jira + genera `jira-map.yaml` |
| `/sdd-validate` | 3 | Quality gate: brief vs artefactos |
| `/sdd-log` | 3/4 | Registra decisiones en `DECISIONS.md` |
| `/sdd-handoff` | Transversal | Comprime el estado de sesión para continuar en otra sesión o agente. Requiere DECISIONS.md al día. |
| `/sdd-fix` | Transversal | Ruta corta para bugs/hotfixes: ≤3 archivos, test reproductor obligatorio, chequeo de colisiones |
| `/sdd-implement` | 4 | Artefactos → código con TDD (gate: requiere validación previa) |
| `/sdd-task` | 4 | Implementa una task puntual: `/sdd-task [feature_id] [task_id]`. Cierre automático al completar la última task |
| `/sdd-checklist` | 4 | Genera criterios de verificación manual |
| `/sdd-review` | 4 | Gate final: lógica + UI. Cierra la feature en el registro |
| `/sdd-health` | Mant. | Auditoría por sprint: drift de `existing-arch.md` y del grafo, consistencia del registro, colisiones entre features OPEN |
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

### Diseño de trazabilidad

- `jira-map.yaml` es el único archivo que vincula tasks con tickets — `tasks.md` y `features.yaml` no se modifican.
- Los tickets creados por el modelo llevan `label: sdd-generated` — distinguibles de tickets de PO en el board.
- El campo `source` en el mapa indica el origen: `sdd` (creado por el modelo), `po` (creado por el PO), `merged` (unificados).
- El campo `user_story` en el mapa mantiene trazabilidad `US-N → task → ticket`.

### Configuración del Atlassian MCP

> Si es tu primera vez, corré `/sdd-setup` — te guía por todo esto automáticamente.

**Cursor** — `.vscode/mcp.json` ya incluye ambos servidores. Cursor los levanta automáticamente. La primera vez pedirá autenticar tu cuenta de Atlassian vía OAuth.

**Claude Code** — `.claude/settings.json` ya incluye ambos servidores. Las credenciales van en `.env` en la raíz del proyecto (nunca en el repo):
```bash
ATLASSIAN_SITE_URL=https://tu-org.atlassian.net
ATLASSIAN_USER_EMAIL=tu@email.com
ATLASSIAN_API_TOKEN=tu-api-token
```
Generás el API token en: https://id.atlassian.com/manage-profile/security/api-tokens

**Claude.ai** — conectar manualmente desde la UI: Atlassian desde el conector oficial, mcp-proguide como servidor MCP remoto.

---

## Telemetría DX

El modelo captura automáticamente métricas de esfuerzo y calidad en cada fase:

| Fase | Qué se registra |
|---|---|
| `/sdd-refine` | Rondas de grilling, categorías faltantes y ambiguas al inicio |
| `/sdd-validate` | Cobertura inicial del brief, gaps encontrados |
| `/sdd-implement` | Ciclos de autocorrección, consultas de clarificación, tokens estimados |
| `/sdd-review` | Resultado final, criterios sin test, gaps de UI, issues de calidad estructural (`structural_issues`) |
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

Para ver el estado del proyecto de un vistazo: `/sdd-metrics-summary`.

---

## Principio de gobernanza

Los agentes no reemplazan decisiones técnicas ni de negocio. En cada gate, la IA avisa, para y espera aprobación humana explícita antes de continuar.

---

## Trabajo en equipo

El modelo está diseñado para equipos con múltiples personas (y agentes) trabajando en paralelo:

- **Registro maestro** (`specs/_registry/features.yaml`): toda feature y fix queda indexado con status, owner, sprint y archivos que toca (`touches`).
- **Detección de colisiones**: antes de planificar (`/sdd-generate`), implementar (`/sdd-implement`) o fixear (`/sdd-fix`), se intersectan los `touches` con toda otra feature `OPEN` de otro owner. Si hay solapamiento, la IA reporta y espera decisión humana — nunca pisa trabajo ajeno en silencio.
- **Gates de prerequisitos**: cada comando verifica que el paso anterior ocurrió (artefactos existen, validación corrió) antes de ejecutar. Saltarse un gate requiere confirmación explícita + entrada en `DECISIONS.md`.
- **Audit determinista en CI**: `pnpm audit:sdd` verifica con código (sin IA) la consistencia del modelo: registro↔specs, colisiones entre features OPEN, gates de cierre, archivos del grafo y sprints vencidos. Corre como GitHub Action en cada PR — si falla, no se mergea. Es el linter del proceso: el cumplimiento no depende de buena voluntad.
- **Ruta de escape controlada**: los bugs chicos van por `/sdd-fix` (registro + test reproductor + colisiones), no por fuera del modelo. Si un fix crece, se promueve a feature.

---

## Routing de contexto (ahorro de tokens)

Ante cualquier tarea, los agentes consultan PRIMERO `graph/domain.yaml` para identificar
el dominio afectado y leen SOLO los archivos listados — no escanean el codebase completo.
El grafo lo genera `/sdd-scan` y `/sdd-health` detecta su drift.

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

## Skills

### ¿Qué es un skill?

Un skill es un archivo `SKILL.md` (o carpeta con ese archivo) que el agente carga **bajo demanda**, solo cuando la tarea lo requiere. A diferencia de `CLAUDE.md` que se carga en cada turno, un skill no infla el contexto a menos que sea relevante.

Estructura de un skill en este repo:

```
.claude/skills/
  VERSION                          ← versión del pack
  coding-standards/
    SKILL.md                       ← punto de entrada: descripción (routing) + índice
    references/
      sdd-lifecycle.md             ← flujo y comandos SDD
      team-governance.md           ← registro, colisiones, trabajo en equipo
      implementation-review.md     ← reglas de implementación y review
      deterministic-audit.md       ← contrato con el auditor
```

El campo `description` del frontmatter de `SKILL.md` es lo que el agente usa para decidir **cuándo activarlo automáticamente**. Las referencias se cargan solo si la tarea las necesita (progressive disclosure).

---

### Skill incluido: `coding-standards`

**Para qué sirve:** steering del agente cuando implementa, revisa o toma decisiones de proceso. Orienta al LLM hacia las convenciones y restricciones del modelo SDD sin duplicar lo que ya valida el auditor.

**Cuándo se activa:** al implementar código, hacer code review, resolver colisiones o dudas de convenciones.

**Qué hace y qué NO hace:**

| Hace | No hace |
|---|---|
| Guía contexto con progressive disclosure | Reemplazar comandos SDD |
| Apuntar a la fuente de verdad correcta | Inventar reglas nuevas |
| Recordar qué es determinista vs. qué requiere juicio | Ejecutar checks del auditor |

**Cómo encaja en el modelo completo:**

```
CLAUDE.md         → políticas globales mínimas (siempre en contexto)
     ↓ apunta a
coding-standards  → steering de convenciones (carga bajo demanda)
     ↓ apunta a
references/       → detalle específico por área (progressive disclosure)

comandos SDD      → orquestación del flujo (refine, generate, implement...)
pnpm audit:sdd    → enforcement determinista (CI, sin IA)
```

---

### Distribución al equipo

El pack está versionado en `.claude/skills/VERSION`. Para instalar o actualizar en la máquina local:

```bash
pnpm skills:sync        # instala/actualiza en ~/.claude/skills
pnpm skills:sync:dry    # previsualiza sin aplicar cambios
```

Esto copia `.claude/skills/*` a `~/.claude/skills/` (Windows: `%USERPROFILE%\.claude\skills`), donde Claude y otros agentes los encuentran automáticamente.

**Flujo de rollout para equipo:**
1. Se actualiza el skill en el repo (commit + bump de `VERSION`)
2. Cada dev ejecuta `pnpm skills:sync` desde el repo del modelo
3. Todos quedan homogéneos en la misma versión

Regla de diseño:
- El skill **guía** (contexto, convenciones)
- Los comandos SDD **orquestan** (flujo, gates)
- `pnpm audit:sdd` + CI **verifican** (enforcement determinista)

---

## Cómo adoptar el modelo en tu proyecto

### Qué archivos conforman el modelo

Este repo **es** el modelo. No hay un paquete separado que instalar. Lo que se lleva a cada proyecto es:

```
.claude/
  commands/         ← los comandos /sdd-* (el workflow completo)
  skills/
    VERSION
    coding-standards/
      SKILL.md
      references/   ← guías de implementación, gobernanza y auditoría
  settings.json
CLAUDE.md           ← contexto global que el agente carga en cada turno
.vscode/
  mcp.json          ← configuración de MCPs para Cursor
scripts/
  sdd-audit.mjs     ← auditor determinista (CI, sin IA)
  sync-skills.mjs   ← instalador de skills en ~/.claude/skills/
package.json        ← scripts: audit:sdd, skills:sync
.github/
  workflows/
    sdd-audit.yml   ← GitHub Action que corre el auditor en cada PR
graph/
  domain.template.yaml          ← plantilla del grafo de dominio
specs/
  _registry/
    features.template.yaml      ← plantilla del registro maestro
    sprints/_template.yaml      ← plantilla de sprint
drafts/
  README.md         ← instrucciones para el equipo (dónde poner los borradores)
metrics/
  README.md         ← guía de telemetría DX
```

> Los archivos como `input.md`, `constitution.md`, `spec.md`, `plan.md`, `tasks.md`,
> `jira-map.yaml` y carpetas como `specs/001-*/`, `metrics/001-*` son **artefactos generados**
> por el modelo durante el ciclo de una feature — no pertenecen al modelo en sí.

---

### Pasos para llevar el modelo a un proyecto nuevo

#### Opción A — Clonar como base

```bash
git clone https://github.com/patohed/sdd-model.git mi-proyecto
cd mi-proyecto
rm -rf .git                     # desvincularlo del repo del modelo
git init && git remote add origin <tu-repo>
pnpm install
pnpm skills:sync                # instala coding-standards en ~/.claude/skills
```

Una vez clonado, corré `/sdd-setup` para configurar el entorno y los MCPs.

#### Opción B — Copiar solo los archivos del modelo

Copiá las carpetas listadas arriba a la raíz de tu proyecto existente.
Si el proyecto ya tiene `package.json`, mergeá los scripts y devDependencies manualmente.

```bash
pnpm install
pnpm skills:sync
```

Una vez copiados los archivos, corré `/sdd-setup` para configurar el entorno y los MCPs.

#### Opción C — Agregar como submódulo (equipos grandes)

```bash
git submodule add https://github.com/patohed/sdd-model.git .sdd
# Agregar los scripts a tu package.json raíz apuntando a .sdd/scripts/
```

Una vez configurado el submódulo, corré `/sdd-setup` para configurar el entorno y los MCPs.

---

### Verificar que todo funciona

```bash
pnpm audit:sdd          # debe terminar sin FAILs (solo WARNs en repo vacío)
pnpm skills:sync:dry    # previsualizá qué skills se instalan sin aplicar
```

En Claude Code, escribí `/sdd-setup` para configurar el entorno completo, o `/sdd-explain` para ver el modelo en contexto.

---

### Estructura esperada al arrancar una feature nueva

```
/sdd-jira-start [TICKET-KEY]  ← (opcional) vinculá un ticket de Jira antes de arrancar
drafts/          ← el equipo pone acá sus notas y borradores
/sdd-refine      ← primer comando: genera input.md desde los drafts
/sdd-generate    ← genera constitution.md, spec.md, plan.md, tasks.md + jira-map.yaml
/sdd-validate    ← quality gate antes de implementar
/sdd-implement   ← implementación TDD
/sdd-jira-sync   ← (opcional) reconciliá tasks con Jira durante el desarrollo
/sdd-jira-close  ← (opcional) cerrá el ticket en Jira al finalizar
```

---

## Requisitos

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- `pnpm` ≥ 9.x (`npm install -g pnpm`)
- Node.js 18+
