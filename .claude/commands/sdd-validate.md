Leé input.md y luego leé constitution.md, spec.md, plan.md y tasks.md.
Si existe `specs/[feature_id]/ui-behaviour.md`, leélo TAMBIÉN.
Si existe `existing-arch.md` en la raíz, leélo TAMBIÉN (modo brownfield).

Verificá que los artefactos generados cubren el brief original. Para cada punto del input.md, chequeá:

1. ¿Hay al menos una user story en spec.md que lo cubra?
2. ¿Hay al menos una tarea en tasks.md que lo implemente?
3. ¿Hay algún principio en constitution.md que lo proteja si es una restricción?

En modo brownfield, validá ADEMÁS:
4. ¿`plan.md` usa el `source_root` y el stack declarado en `existing-arch.md`?
5. ¿`constitution.md` evita contradecir patrones inquebrantables de `existing-arch.md`?
6. ¿`tasks.md` distingue entre archivos a crear y archivos existentes a modificar?
Cualquier contradicción frente a `existing-arch.md` es un ❌ y debe registrarse vía /sdd-log si el humano decide ignorarla.

**Cobertura de comportamiento de UI (regla crear-o-loguear):**
Si la sección UI/FLUJO de `input.md` describe comportamiento no trivial Y no existe
`specs/[feature_id]/ui-behaviour.md`, marcalo como ⚠️ y NO lo dejes pasar en silencio:

    ⚠️ La feature tiene comportamiento de UI en input.md pero no hay ui-behaviour.md.
       → Corré /sdd-ui-behaviour para especificarlo, o registrá la omisión con /sdd-log.

El humano decide: producir el artefacto o registrar un ADR. No cierres la validación con
este punto irresuelto por una de las dos vías.

Si `ui-behaviour.md` existe, incluílo en la cobertura: cada pantalla/flujo debe traccionar
a una user story de `spec.md`, y cada punto de UI de `input.md` debe estar cubierto por
alguna pantalla.

Al terminar, generá un reporte con este formato:

## Validación de artefactos

### ✅ Cubierto
- [lista de puntos del brief que tienen cobertura completa]

### ⚠️ Cobertura parcial
- [puntos del brief que están mencionados pero sin criterio de aceptación claro]

### ❌ Sin cobertura
- [puntos del brief que no aparecen en ningún artefacto]

### Recomendación
[qué ajustar en los artefactos antes de implementar, si hay gaps]

Si hay ⚠️ o ❌: mostrá el reporte, indicá exactamente qué archivos hay que editar y esperá.
No modifiques ningún artefacto por tu cuenta. El humano decide cómo resolver los gaps.
Una vez que el humano resuelva los gaps, recordale que corra /sdd-log para registrar la decisión en DECISIONS.md.

Si todo está cubierto, indicá: "Brief cubierto al 100%. Listo para implementar."
Empezá directamente, sin pedir confirmación.

**Hook de métricas (obligatorio al finalizar):**
Al terminar el reporte de validación, agregá al archivo `metrics/[feature_id]-metrics.md` (creándolo si no existe) un bloque de cierre:

```
## Validate — [timestamp]
- command_origin: sdd-validate
- gaps_encontrados: [número de ❌ + número de ⚠️]
- cobertura_inicial: [% cubiertos sobre total de puntos del brief]
- iteration_number: [mismo criterio que sdd-metrics Paso 0]
```

Si el archivo de métricas no existe aún, crealo con solo ese bloque. El reporte completo se genera al final de `sdd-implement`.
