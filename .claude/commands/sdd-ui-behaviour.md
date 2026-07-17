Leé `input.md` y los artefactos de la feature en `specs/[feature_id]/`.

**Gate de prerequisitos (no negociable):**
- Debe existir `specs/[feature_id]/` con `spec.md` y `plan.md` (generados por /sdd-generate).
- Si no existen: "Faltan spec.md/plan.md — corré /sdd-generate primero." y PARÁ.
- Si la feature no tiene UI (backend-only, servicio, job), este comando no aplica:
  avisale al usuario y no generes el artefacto. Esa decisión la chequea /sdd-validate.

**Paso previo — Confirmar feature_id:**
Determiná el `feature_id` (carpeta existente en `specs/`). Si hay más de una, preguntá cuál.
Mostralo y confirmá.

**Scope estricto (leé antes de empezar):**
Este comando especifica el COMPORTAMIENTO funcional de la UI, no su diseño visual.
SÍ: qué pantallas hay, qué datos muestran, qué acciones permiten, qué validaciones corren,
qué estados tienen (vacío/carga/error/éxito), cómo se navega. NO: colores, tipografía,
espaciado, layout — eso queda para la etapa de diseño. Si el usuario empuja a lo visual, redirigí.

## Fase 1 — Contexto
Leé `input.md`, `spec.md` y `plan.md`. Si hay un `drafts/brief-*.md`, leélo para contexto
de negocio. Identificá las user stories de `spec.md` que implican UI.

## Fase 2 — Inventario de pantallas
Derivá las pantallas necesarias para cubrir las user stories con UI. Mostralas y confirmá
antes de detallar: "Estas son las pantallas que veo: [lista]. ¿Falta o sobra alguna?"
No inventes pantallas que no traccionen a una user story de `spec.md`.

## Fase 3 — GAP de comportamiento
Por cada pantalla, chequeá internamente si está claro: datos que muestra, acciones,
validaciones, qué pasa en vacío/carga/error, navegación. Por cada hueco, UNA pregunta
concreta y esperá respuesta. No preguntes todo junto.

## Fase 4 — Spec por pantalla
Cuando no queden huecos, redactá. Por cada pantalla: datos, acciones, validaciones
(client/server, obligatorias), estados (vacío/carga/error/éxito), navegación, casos borde.

## Fase 5 — Mapa de flujos
Documentá los flujos que cruzan pantallas (ej: alta → confirmación → listado).

## Fase 6 — Validación y escritura
Mostrá el artefacto completo y pedí confirmación. Al confirmar, escribí
`specs/[feature_id]/ui-behaviour.md` con esta estructura (los headers `## Pantallas` y
`## Flujos` son obligatorios — el audit los verifica):

```markdown
# UI Behaviour: [feature_id]

## Pantallas

### [Nombre de pantalla] — US-[N]
- **Datos:** [...]
- **Acciones:** [...]
- **Validaciones:** [...]
- **Estados:**
  - Vacío: [...]
  - Carga: [...]
  - Error: [...]
  - Éxito: [...]
- **Navegación:** [...]
- **Casos borde:** [...]

## Flujos

### [Nombre del flujo]
[secuencia de pantallas y transiciones]
```

Actualizá `specs/[feature_id]/feature.status.md`: `last_command: sdd-ui-behaviour`.

**Hook de métricas (obligatorio al finalizar):**
Agregá a `metrics/[feature_id]-metrics.md` (creándolo si no existe):
```
## UI-Behaviour — [timestamp]
- command_origin: sdd-ui-behaviour
- pantallas: [número de pantallas especificadas]
- flujos: [número de flujos documentados]
```

## Reglas estrictas
- Comportamiento, no diseño visual. Sin colores, tipografía ni layout.
- No inventes pantallas fuera de las user stories de `spec.md`.
- Los estados vacío/carga/error/éxito son obligatorios en cada pantalla que los admita.
- No escribas el artefacto hasta tener confirmación del usuario.
- No modifiques `spec.md`, `plan.md` ni `tasks.md`.
