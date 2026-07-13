Leé input.md, spec.md y luego revisá el código generado.

**Gate de prerequisitos:** si no existe código en el `source_root` o no hay evidencia
de implementación en `metrics/[feature_id]-metrics.md` (bloque `## Implement` de
/sdd-implement, o bloques `## Task T00X` de /sdd-task cubriendo TODAS las tasks de
`tasks.md`), avisá:
"No hay evidencia de implementación — corré /sdd-implement (o completá las tasks
pendientes con /sdd-task) primero." y PARÁ.

La carpeta a revisar es `app/` por defecto.
Si existe `existing-arch.md` en la raíz, usá el `source_root` declarado allí en su lugar.

## Parte 1 — Criterios de aceptación (lógica)

Para cada criterio Given/When/Then en spec.md, verificá:

1. ¿Existe un test que lo cubra explícitamente?
2. ¿El test pasa? (si podés correrlo, hacelo con pnpm test)
3. ¿El comportamiento está implementado en el código?

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
- structural_issues: [número de ítems en 🏗️ Calidad estructural — 0 si "Sin observaciones"]
```

> **Contrato con el auditor:** el campo `resultado:` debe contener literalmente `APROBADO` o `PENDIENTE`.
> El script `pnpm audit:sdd` verifica la presencia de `resultado:.*APROBADO` para certificar el cierre.
> No uses sinónimos ni emojis como valor principal — el valor debe ser la palabra exacta.

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
