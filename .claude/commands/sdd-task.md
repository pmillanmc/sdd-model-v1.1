# Comando: /sdd-task [feature_id] [task_id] — Implementar una task específica

**Uso:** `/sdd-task 001-login T003`
Ambos argumentos son obligatorios. Si falta alguno, pedilo y PARÁ.
`task_id` acepta `T003` o `3` (normalizá a formato `T00X`).

`sdd-implement` sigue siendo el camino default para implementar una feature completa.
Este comando es para iteración incremental: avanzar de a una task, retomar una task
bloqueada, o repartir tasks de una misma feature entre devs.

**Fuera de scope (v1):** rangos de tasks (`T002-T004`), múltiples tasks en una
invocación, y chequeo bloqueante de colisiones a nivel task.

## Gate de prerequisitos (no negociable)

Antes de leer nada, verificá en orden — idéntico a `sdd-implement`:

1. Existen los 4 artefactos (`constitution.md`, `spec.md`, `plan.md`, `tasks.md`) en `specs/[feature_id]/`.
   Si falta alguno: "Faltan artefactos — corré /sdd-generate primero." y PARÁ.
2. Existe el bloque `## Validate` en `metrics/[feature_id]-metrics.md`.
   Si no existe: "No hay evidencia de validación — corré /sdd-validate primero." y PARÁ.
   El humano puede forzar el salto SOLO con confirmación explícita + registro vía /sdd-log.
3. La feature figura `OPEN` en `specs/_registry/features.yaml`. Si figura `CLOSED` o no existe, avisá y PARÁ.
4. La task `[task_id]` existe en `tasks.md`. Si no existe, listá las tasks disponibles y PARÁ.
5. La task NO está ya marcada `[x]`. Si lo está: "T00X ya está completada." y PARÁ.

## Gate de dependencias (específico de este comando)

Verificá que TODAS las tasks anteriores a `[task_id]` estén marcadas `[x]` en `tasks.md`.

Si alguna anterior está pendiente:
```
⚠️ DEPENDENCIAS PENDIENTES: las tasks [lista] no están completadas.
Implementar T00X fuera de orden puede asumir código que no existe.
¿Confirmás que querés saltarlas?
```
- Si el humano NO confirma → PARÁ.
- Si confirma → invocá /sdd-log para registrar el salto (qué task se adelantó,
  cuáles quedaron pendientes, quién lo decidió) y recién después continuá.

## Advertencia de colisiones (informativa, no bloqueante en v1)

Intersectá los archivos que esta task va a tocar con:
- los `touches` de toda otra feature `OPEN` de otro owner en `specs/_registry/features.yaml`
Si hay intersección, mostrá la advertencia con feature/owner afectado y continuá
(el humano decide si coordina).

## Contexto de implementación

Leé en orden — el contexto completo de principios es obligatorio aunque implementes una sola task:
1. `constitution.md`
2. `spec.md` — incluida la sección `## Fuera de scope (v1)`: nada de esa lista puede implementarse.
3. `plan.md`
4. `tasks.md` — la task objetivo y su user story asociado (`US-X`).
5. `existing-arch.md` si existe (modo brownfield: mismas reglas que sdd-implement —
   `source_root` declarado, gestor de paquetes declarado, patrones inquebrantables).
6. Si existe `graph/domain.yaml`, usá el routing de contexto: leé SOLO los archivos
   del dominio afectado.
7. Si hay archivos `.html` en `drafts/` y la task tiene componentes de UI: resolvé la
   cascada CSS completa (mismas reglas que sdd-implement — valores efectivos, no
   nombres de variables).

## Loop TDD (obligatorio, mismo orden que sdd-implement)

1. **Red** — escribí el test que describe el comportamiento esperado (debe fallar).
2. **Green** — implementá el mínimo código para que el test pase.
3. **Refactor** — revisá el código que acabás de escribir:
   - ¿Lógica duplicada respecto a tasks anteriores ya implementadas?
   - ¿Nombres que no reflejan lo que hacen?
   - ¿Abstracción prematura que la spec no pide?
   Corregí sin agregar comportamiento. Corré los tests de nuevo.
   Si el refactor requiere tocar más de 3 archivos o cambiar contratos, avisá antes.

**Regresión:** al terminar la task, corré TODOS los tests del proyecto (no solo los
de esta task). Si un test de una task o feature anterior rompe, arreglalo antes de
marcar la task como completada.

## Cierre de la task

1. Marcá la task como `[x]` en `tasks.md`.
2. Agregá al archivo `metrics/[feature_id]-metrics.md` un bloque:
   ```
   ## Task [task_id] — [timestamp ISO 8601]
   - command_origin: sdd-task
   - task: [task_id] ([descripción corta])
   - us_ref: [US-X o —]
   - tests: [N pasando / N total del proyecto]
   - archivos_tocados: [lista]
   ```
   Este bloque es evidencia válida de implementación parcial para el gate de `sdd-review`.

## Cierre de feature (solo si esta era la última task)

Si después de marcar `[x]` TODAS las tasks de `tasks.md` quedaron completadas:
1. Generá el reporte completo de métricas según `sdd-metrics.md` (DX_MET_001–006),
   igual que la Gobernanza de Cierre de `sdd-implement`. Los bloques `## Task` previos
   cuentan para reconstruir iteraciones y retrabajo.
2. Avisá: "Todas las tasks de [feature_id] están completadas. La feature está lista
   para /sdd-checklist y /sdd-review."
No cambies el status a CLOSED — eso lo hace /sdd-review al aprobar el gate final.
