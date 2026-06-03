# sdd-validate — GDE flavor

Leé `input.md` y luego leé `constitution.md`, `spec.md`, `plan.md` y `tasks.md`.

## Jerarquía de contexto

Cargá también:
1. **`gde-context.md`** (si existe) — fronteras, capacidades, servicios expuestos del dominio
2. **`existing-arch.md`** (si existe) — stack y patrones del codebase (modo brownfield)

---

## Validaciones base (siempre)

Para cada punto del `input.md`, chequeá:
1. ¿Hay al menos una user story en `spec.md` que lo cubra?
2. ¿Hay al menos una tarea en `tasks.md` que lo implemente?
3. ¿Hay algún principio en `constitution.md` que lo proteja si es una restricción?

## Validaciones brownfield (si existe `existing-arch.md`)

4. ¿`plan.md` usa el `source_root` y el stack declarado en `existing-arch.md`?
5. ¿`constitution.md` evita contradecir patrones inquebrantables de `existing-arch.md`?
6. ¿`tasks.md` distingue entre archivos a crear y archivos existentes a modificar?

## Validaciones GDE (si existe `gde-context.md`)

7. **Fronteras del dominio**: ¿`spec.md` implementa alguna capacidad que `gde-context.md` declara como
   perteneciente a otro dominio? Si sí → ❌ con indicación del dominio correcto.

8. **Constitution de fronteras**: ¿`constitution.md` incluye la sección "Fronteras del dominio"
   con los MUST/PROHIBITED derivados de `gde-context.md`? Si no → ❌ faltante.

9. **Integraciones gobernadas**: ¿Todas las integraciones con otros dominios en `tasks.md` y `plan.md`
   usan los servicios expuestos declarados en `gde-context.md`? Si alguna accede directo a datos
   de otro dominio → ❌.

10. **Restricciones HLD**: ¿`plan.md` incluye y respeta las restricciones de plataforma de
    `gde-context.md` (OpenShift, Oracle, capacidades transversales)? Si no → ⚠️.

11. **LLD diferido**: ¿Alguna tarea en `tasks.md` implementa algo marcado como "diferido al LLD"
    en `gde-context.md`? Si sí → ❌ — no se puede implementar sin el diseño de bajo nivel.

---

## Reporte de salida

```
## Validación de artefactos — Dominio [ID]

### ✅ Cubierto
- [lista de puntos con cobertura completa]

### ⚠️ Cobertura parcial
- [puntos mencionados pero sin criterio de aceptación claro]

### ❌ Sin cobertura / Violación
- [gaps del brief]
- [violaciones de fronteras de dominio — indicar a qué dominio pertenece cada ítem]
- [accesos directos no gobernados a datos de otros dominios]

### Recomendación
[qué ajustar antes de implementar]
```

Si hay ⚠️ o ❌: indicá exactamente qué archivos hay que editar y esperá.
No modifiques ningún artefacto por tu cuenta.
Una vez que el humano resuelva los gaps, recordale que corra `/sdd-log`.

Si todo está cubierto: "Brief cubierto al 100%. Listo para implementar."
Empezá directamente, sin pedir confirmación.
