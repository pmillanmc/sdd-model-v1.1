Leé input.md y luego leé constitution.md, spec.md, plan.md y tasks.md.

Verificá que los artefactos generados cubren el brief original. Para cada punto del input.md, chequeá:

1. ¿Hay al menos una user story en spec.md que lo cubra?
2. ¿Hay al menos una tarea en tasks.md que lo implemente?
3. ¿Hay algún principio en constitution.md que lo proteja si es una restricción?

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
