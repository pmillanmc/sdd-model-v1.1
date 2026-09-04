Leé input.md, spec.md y luego revisá el código generado.

**Gate de prerequisitos:** si no existe código en el `source_root` o no hay evidencia
de implementación en `metrics/[feature_id]-metrics.md` (bloque `## Implement` de
/sdd-implement, o bloques `## Task T00X` de /sdd-task cubriendo TODAS las tasks de
`tasks.md`), avisá:
"No hay evidencia de implementación — corré /sdd-implement (o completá las tasks
pendientes con /sdd-task) primero." y PARÁ.

No alcanza con que el bloque exista: leé sus valores. Si hay varios `## Implement`, tomá
**solo el último**, y exigí `tasks_completadas: m/m` con `m` = total de tasks de `tasks.md`
y `tests: PASS`. Si está parcial, mal formado o con tests en rojo, reportá el contrato
inválido y PARÁ. Un `### 📊 Reporte de Esfuerzo SDD` es telemetría y no habilita este gate.

Si el último `## Implement` declara `gate_override: true`, buscá el bloque `## Gate Override`
correspondiente y mencionalo explícitamente en el reporte final: esta feature llegó a review
con gaps de validación aceptados por decisión humana, y eso tiene que quedar visible en el gate.

La carpeta a revisar es `app/` por defecto.
Si existe `existing-arch.md` en la raíz, usá el `source_root` declarado allí en su lugar.

## Parte 1 — Criterios de aceptación (lógica)

Para cada criterio Given/When/Then en spec.md, verificá:

1. ¿Existe un test que lo cubra explícitamente?
2. ¿El test pasa? (si podés correrlo, hacelo con pnpm test)
3. ¿El comportamiento está implementado en el código?

## Parte 1b — Evidencia E2E (ProGuide)

Si existe un bloque `## E2E` en `metrics/[feature_id]-metrics.md` (lo escribe `/sdd-e2e`),
leélo e incorporá su evidencia funcional contra la app corriendo. El bloque puede provenir de
distintas fuentes (`fuente: spec | jira | doc | api | regresion`); para este gate importa
mapear los `requisitos_cubiertos` contra los `Given/When/Then` de la spec:

1. Un criterio Given/When/Then con un caso E2E `passed` (ver `requisitos_cubiertos`) cuenta como
   **cubierto con verificación funcional**, además de lo que digan los tests unitarios.
2. Un caso E2E `failed` es un **hallazgo bloqueante**: el elemento existe pero la aserción de
   comportamiento no se cumple. Reportalo en `❌ Sin implementar` / hallazgos y el resultado
   NO puede ser APROBADO hasta resolverlo.
3. Un caso `needs_calibration` **no es un bug**: es un selector/texto que no resolvió en
   runtime. No lo cuentes como criterio cubierto ni como hallazgo; anotalo como pendiente de
   calibración.

Si la feature tiene criterios Given/When/Then E2E-verificables (flujos de UI o API) y **no**
hay bloque `## E2E`, avisá: "No hay evidencia E2E — corré /sdd-e2e para verificar los flujos
contra la app corriendo." No bloquees por esto si el equipo decide cubrir esos criterios solo
con tests de integración, pero dejalo explícito en el reporte.

## Parte 2 — Requisitos de UI (visual y flujo)

Para cada descripción visual o de flujo en input.md (sección "Cómo se ve la interfaz"
o equivalente), verificá:

1. ¿Hay un criterio en spec.md que lo cubra?
2. ¿Hay código en el `source_root` que lo implemente?

**Si hay archivos `.html` en `drafts/`:** la verificación visual es más estricta. Para cada componente con estilos, comparás el valor efectivo del HTML original (color hex, px, font-stack) contra el valor implementado en el código. Una clase correcta con una variable mal resuelta es un gap. Chequeá específicamente:
- Variables CSS: ¿el código usa el valor resuelto o el nombre de variable?
- Herencia de color/tipografía: ¿el componente hereda bien del padre o rompe la cascada?
- Estados interactivos (hover, focus, disabled): ¿están implementados si el HTML los tenía?

Si un requisito visual de input.md no tiene criterio en spec.md ni código → es un gap
que no fue trackeado en ningún artefacto.

## Parte 3 — Calidad estructural

Para cada archivo tocado por la feature, verificá:

1. ¿Hay lógica duplicada entre dos o más archivos del `source_root`?
2. ¿Alguna función, variable o componente tiene un nombre que contradice o no refleja su comportamiento real?
3. ¿Hay abstracción prematura — código que implementa casos que ningún user story de `spec.md` pide?

No es un criterio estético: cada ítem negativo es un gap estructural que el dev debe decidir si corrige o acepta explícitamente.

Al terminar, generá un reporte con este formato:

## Review de implementación

### ✅ Criterios cubiertos con test
- [lista de criterios con su test correspondiente]

### ⚠️ Implementado pero sin test
- [criterios que funcionan pero no tienen test automatizado]

### ❌ Sin implementar
- [criterios que no están cubiertos ni en código ni en tests]

### 🧪 Hallazgos E2E (ProGuide)
- [casos `failed`: bug real, elemento encontrado pero aserción no cumplida — bloqueante]
- [casos `needs_calibration`: pendientes de calibración, NO son bugs]

### 🎨 Gaps de UI (en input.md pero no en spec ni en código)
- [requisitos visuales o de flujo que nunca fueron trackeados]

### 🏗️ Calidad estructural
- [duplicación encontrada, nombres engañosos, abstracciones prematuras — o "Sin observaciones" si no hay]

### Resultado
[APROBADO / PENDIENTE — con resumen de qué falta si no está aprobado]

Si el resultado es PENDIENTE: mostrá el reporte y esperá.
No agregues tests ni código por tu cuenta. El dev decide cómo resolver cada gap.
Una vez que el dev resuelva los gaps, recordale que corra /sdd-log para registrar la decisión en DECISIONS.md.

Empezá directamente, sin pedir confirmación.

**Hook de métricas (obligatorio al finalizar):**
Al terminar el reporte, agregá al archivo `metrics/[feature_id]-metrics.md` el siguiente bloque:

```
## Review — [timestamp]
- command_origin: sdd-review
- resultado: APROBADO
- criterios_sin_test: [número de ⚠️]
- criterios_sin_implementar: [número de ❌]
- gaps_ui: [número de gaps de UI]
- hallazgos_e2e: [número de casos E2E `failed` — si > 0, resultado NO puede ser APROBADO]
- structural_issues: [número de ítems en 🏗️ Calidad estructural — 0 si "Sin observaciones"]
```

> **Contrato con el auditor:** el campo `resultado:` debe contener literalmente `APROBADO` o `PENDIENTE`.
> El script `pnpm audit:sdd` verifica la presencia de `resultado:.*APROBADO` para certificar el cierre.
> No uses sinónimos ni emojis como valor principal — el valor debe ser la palabra exacta.

---
**Registro de sesión para atribución de tokens (obligatorio, con o sin APROBADO):**
Obtené el session_id actual ejecutando `!echo $CLAUDE_CODE_SESSION_ID`. Si el valor NO
está vacío, agregá ese session_id como una línea nueva (append — nunca sobrescribir) al
archivo `metrics/[feature_id].sessions`, creándolo si no existe. Si el valor está vacío
(entorno que no es Claude Code), no escribas nada. Este archivo es un ledger append-only:
puede acumular el mismo session_id varias veces y session_ids de días distintos; la
deduplicación ocurre en la lectura (`/sdd-metrics`), no acá.
---

**Total de tokens de la feature (obligatorio si el resultado es APROBADO):**
Antes de cerrar, corré una vez más el procedimiento de DX_MET_006 de `/sdd-metrics`
(Paso 0.5 + Variante A o B) — DESPUÉS de haber anexado el session_id de esta sesión al
ledger arriba. En ese momento el ledger `metrics/[feature_id].sessions` ya contiene
todas las sesiones del ciclo completo (refine + generate + validate + implement/task +
review), así que el total que devuelve es el **costo end-to-end de la feature**, no el
de una sesión. Agregá el resultado como un nuevo bloque `### 📊 Reporte de Esfuerzo SDD`
en `metrics/[feature_id]-metrics.md` con `command_origin: sdd-review` y `feature_total: true`,
y mostralo en el reporte final que le devolvés al dev — no alcanza con dejarlo solo en
el archivo, es la respuesta a "cuánto costó esta feature".

Si el resultado es PENDIENTE, no generes este bloque: la feature sigue abierta y va a
volver a pasar por review, así que el total todavía no es definitivo.

**Cierre de feature (solo si resultado es APROBADO):**
Actualizá `specs/[feature_id]/feature.status.md` con:

```
status: CLOSED
feature_id: [valor]
created: [fecha original, no cambiar]
closed: [fecha ISO 8601]
last_command: sdd-review
```

Si el archivo no existe, creálo con estos campos. Si el resultado es PENDIENTE, no modifiqués el status.

Además, en `specs/_registry/features.yaml` actualizá la entrada de la feature:
`status: CLOSED`, `closed: [fecha ISO 8601]`, y completá `decisions` con las
entradas de DECISIONS.md generadas durante esta feature. Si la feature tocó
archivos no listados en `graph/domain.yaml`, avisá: "El grafo de dominio quedó
desactualizado — agregá los archivos nuevos o corré /sdd-scan."
