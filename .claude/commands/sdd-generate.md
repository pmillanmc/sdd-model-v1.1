Leé input.md.

**Gate de prerequisitos (no negociable):**
- `input.md` debe existir y estar confirmado (generado por /sdd-refine o el skill equivalente).
- Si no existe: "Falta input.md — corré /sdd-refine primero." y PARÁ.
- Si existe pero parece borrador crudo (sin secciones, sin confirmación), preguntá antes de seguir.

**Paso previo obligatorio — Confirmar feature_id:**
Antes de generar cualquier artefacto, determiná el `feature_id` de esta feature:
- Si existe una carpeta en `specs/`, usá su nombre (ej. `001-login`).
- Si no existe, proponé el siguiente número disponible y un nombre corto basado en `input.md` (ej. `002-dashboard`).
- Mostrá el `feature_id` propuesto al usuario y pedí confirmación con una sola línea: "¿El feature_id `[valor]` es correcto?"
- Usá ese `feature_id` como nombre de carpeta destino para los artefactos (`specs/[feature_id]/`) y en el encabezado de `tasks.md`.
- Al crear la carpeta, escribiá también `specs/[feature_id]/feature.status.md` con este contenido exacto:

```
status: OPEN
feature_id: [valor]
created: [fecha ISO 8601]
last_command: sdd-generate
```

**Registro de gobernanza (obligatorio):**
Agregá (o actualizá) la entrada de esta feature en `specs/_registry/features.yaml`:
- `id`, `status: OPEN`, `domain` (consultá `graph/domain.yaml`; si el dominio no existe, proponé uno nuevo y avisá), `owner` (preguntá si no es deducible), `sprint` (el sprint activo en `specs/_registry/sprints/`, o `null`), `created`, `touches` (las rutas que `tasks.md` declara tocar/crear) y `decisions: []`.
Si `specs/_registry/features.yaml` no existe, creálo con esta feature como primera entrada.

**Chequeo de colisiones (obligatorio en equipo):**
Al registrar `touches`, intersectalos con los `touches` de toda otra feature `OPEN`
del registro. Si hay intersección con una feature de OTRO owner:
```
⚠️ COLISIÓN: esta feature toca [archivos], también en curso en [feature_id]
(owner: [nombre], sprint: [sprint]).
```
Preguntá al humano cómo proceder (coordinar, secuenciar, o dividir la feature)
antes de continuar. Registrá la resolución con /sdd-log.

**Actualización del grafo de dominio (obligatorio):**
Actualizá (o creá) `graph/domain.yaml` con la información de esta feature:
- Si el archivo no existe, creálo copiando la estructura de `graph/domain.template.yaml` (sin los comentarios de ejemplo) y completá `meta.updated` con la fecha de hoy y `meta.generated_by: sdd-generate`.
- Identificá el dominio de esta feature (el campo `domain` ya determinado para el registro).
- Si el dominio ya existe en el grafo, agregá el `feature_id` al array `features` y los `touches` a los arrays de `files` correspondientes (mapeá por tipo: types, services, components, tests, según la extensión o carpeta del archivo).
- Si el dominio NO existe, creá una entrada nueva con:
  - `description`: inferida del nombre del dominio
  - `features`: [[feature_id]]
  - `files`: mapeá los `touches` a las claves semánticas correctas
  - `depends_on`: [] (el humano puede completarlo después)
Esto garantiza el routing de contexto en proyectos greenfield desde la primera feature.

**Routing de contexto (si existe `graph/domain.yaml`):**
Antes de leer código del proyecto, consultá el grafo para identificar el dominio
afectado y leé SOLO los archivos listados en su sección `files`. No escanees
el codebase completo.

Si existe `existing-arch.md` en la raíz, leélo TAMBIÉN. Estás en modo brownfield:
- El stack, `source_root`, y patrones inquebrantables de `existing-arch.md` son input fijo.
- `constitution.md` NO puede contradecir `existing-arch.md`; agrega principios sobre lo existente.
- `plan.md` debe usar el stack real y el `source_root` declarado — no scaffoldear un proyecto nuevo.
- `tasks.md` empieza en T001 con "validar entorno existente" (ej. `pnpm install`, correr tests existentes), no con scaffold.
- Marcá explícitamente en cada tarea qué archivos del codebase existente toca y cuáles crea.

A partir de esos archivos generá estos cuatro archivos en orden:
1. constitution.md — principios MUST/PROHIBITED del proyecto
2. spec.md — user stories con criterios Given/When/Then, uno por feature de UI, más una sección obligatoria `## Fuera de scope (v1)` con los ítems del campo OUT OF SCOPE de `input.md` (uno por línea, con la razón de rechazo si fue mencionada). Esta sección es el contrato negativo de la feature: lo que el equipo se comprometió a NO construir en v1.
3. plan.md — stack técnico, estructura de carpetas y lista de componentes a crear
4. tasks.md — una tarea por componente o feature (T001 = scaffold, T002 = un componente, etc.), siguiendo estas tres reglas:
   - **Tracer bullets (slicing vertical)**: cada tarea atraviesa todas las capas necesarias para que ese user story funcione de punta a punta (backend + UI + integración). No hagas fases horizontales por capa tecnológica (ej: "toda la DB en T001, toda la UI en T002") — eso no da feedback hasta el final y genera diseños que no se integran. Preferí "T002 = user puede ver su revenue con filtro 30d" sobre "T002 = analytics service completo".
   - **Sin nombres de funciones**: las tareas describen QUÉ construir, no CÓMO. No nombres funciones, métodos ni variables específicas — eso se decide al implementar y se vuelve stale inmediatamente si algo cambia.
   - **Trazabilidad**: cada tarea referencia el número de user story de `spec.md` que implementa (ej: `US-3`). Si una tarea no corresponde a ningún user story (ej: scaffold, setup), marcala con `US: —`.

En modo greenfield (sin `existing-arch.md`), incluí en plan.md el comando exacto de scaffold: pnpm create vite@latest app -- --template react-ts
En modo brownfield, omití el scaffold y referenciá la estructura de `existing-arch.md`.
Límites de tamaño (obligatorios):
- constitution.md: máximo 60 líneas
- spec.md: máximo 80 líneas
- plan.md: máximo 50 líneas
- tasks.md: máximo 40 líneas

Cada archivo tiene que ser corto y directo. Sin placeholders.
Si el contenido no entra en el límite, priorizá claridad sobre completitud
y avisá qué quedó afuera para que el humano lo revise.
Empezá directamente, sin pedir confirmación.
Usá pnpm como instalador de paquetes.

Asegúrate de incluir SIEMPRE una sección de **Measurable Process Outcomes (DX)** en la especificación, con estas dos métricas obligatorias:
* **DX-001**: El agente debe completar la implementación con menos de [X] ciclos de autocorrección (Rework).
* **DX-002**: Mantener la densidad de ambigüedad en 0 (sin consultas de aclaración para la IA).

## Paso 5 — Sincronización con Jira (requiere Atlassian MCP)

Si el Atlassian MCP no está activo, avisá y salteá este paso:
"Atlassian MCP no disponible — jira-map.yaml quedará pendiente. Podés sincronizar después con /sdd-jira-sync."

Si está activo, construí la propuesta de tickets a partir de `tasks.md`.
Para cada task, inferí su tipo según estas reglas (alineadas con slicing vertical):
- `feature` — slice vertical completo que entrega un user story de punta a punta (backend + UI + integración). Es el tipo más común con slicing vertical.
- `setup` — configuración de entorno, instalación de dependencias, scaffold. Siempre `US: —`.
- `test` — tasks de testing que van como entrega separada (e2e, integración cross-feature).
- `fix` — correcciones sobre código existente.

Mostrá la propuesta al usuario antes de crear nada en Jira:

```
📋 Tasks listas para crear en Jira:

  T-001 · [tipo] · "[título]"
  T-002 · [tipo] · "[título]"
  ...

¿Confirmás, editás o descartás alguno antes de crear en Jira?
```

Esperá confirmación. El dev puede:
- Aprobar todo → continuar con todos
- Editar un título → actualizar y continuar
- Descartar una task → no crear ese ticket, marcarlo como `jira_ticket: null` en el mapa

Una vez confirmado, creá cada ticket en Jira con:
- `title`: `[T-NNN] [título de la task]`
- `description`: inferida de la descripción de la task en `tasks.md`, incluyendo la referencia al user story (`US-N`)
- `label`: `sdd-generated` (obligatorio en todos los tickets creados por este comando)
- `type`: el tipo inferido de la task

**Generá `specs/[feature_id]/jira-map.yaml`** con el resultado:

```yaml
feature_id: [feature_id]
jira_ticket: [ticket de la feature, si existe — ver /sdd-jira-start]
generated_by: sdd-generate
updated: [fecha ISO 8601]
tasks:
  - task_id: T-001
    title: "[título]"
    type: [tipo]
    user_story: [US-N o —]
    jira_ticket: [KEY-NNN]
    source: sdd
    status: open
  - task_id: T-002
    title: "[título]"
    type: [tipo]
    user_story: [US-N o —]
    jira_ticket: null   # descartado por el dev o Atlassian MCP no disponible
    source: sdd
    status: pending
```

**Reglas estrictas del Paso 5:**
- Nunca crear tickets en Jira sin confirmación del dev.
- El label `sdd-generated` es obligatorio — identifica el origen SDD en el board.
- Si un ticket falla al crearse, marcá `jira_ticket: null` en el mapa y avisá al dev con el error. No abortes la creación del resto.
- `jira-map.yaml` debe generarse siempre, aunque todos los `jira_ticket` sean `null`.
- No modificar `tasks.md` — el mapa vive únicamente en `jira-map.yaml`.
- Incluir `user_story` en el mapa para mantener trazabilidad US-N → task → ticket.

## Hook de métricas (obligatorio al finalizar)

---
**Registro de sesión para atribución de tokens (obligatorio):**
Obtené el session_id actual ejecutando `!echo $CLAUDE_CODE_SESSION_ID`. Si el valor NO
está vacío, agregá ese session_id como una línea nueva (append — nunca sobrescribir) al
archivo `metrics/[feature_id].sessions`, creándolo si no existe. Si el valor está vacío
(entorno que no es Claude Code), no escribas nada. Este archivo es un ledger append-only:
puede acumular el mismo session_id varias veces y session_ids de días distintos; la
deduplicación ocurre en la lectura (`/sdd-metrics`), no acá.
---
