Leé input.md, spec.md y luego revisá el código generado.

**Gate de prerequisitos:** si no existe código en el `source_root` o no hay bloque
`## Implement`/reporte en `metrics/[feature_id]-metrics.md`, avisá:
"No hay evidencia de implementación — corré /sdd-implement primero." y PARÁ.

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

---
**Registro de sesión para atribución de tokens (obligatorio):**
Obtené el session_id actual ejecutando `!echo $CLAUDE_CODE_SESSION_ID`. Si el valor NO
está vacío, agregá ese session_id como una línea nueva (append — nunca sobrescribir) al
archivo `metrics/[feature_id].sessions`, creándolo si no existe. Si el valor está vacío
(entorno que no es Claude Code), no escribas nada. Este archivo es un ledger append-only:
puede acumular el mismo session_id varias veces y session_ids de días distintos; la
deduplicación ocurre en la lectura (`/sdd-metrics`), no acá.
---
