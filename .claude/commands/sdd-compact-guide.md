# Comando: Guía de Compactación Estratégica para SDD

**Descripción:** Indica al operador en qué transiciones del ciclo SDD conviene ejecutar `/compact` y en cuáles no, para preservar contexto útil y descartar contexto desechable.

## Instrucciones para el Agente

Cuando se invoca este comando, mostrá al usuario la tabla de decisión y sugerí, según la fase activa detectada, si conviene compactar ahora o no. NO ejecutes `/compact` automáticamente — la decisión final es del operador.

### Tabla de decisión

| Transición SDD | Compactar | Razón |
|---|---|---|
| Post-`/sdd-refine` → `/sdd-generate` | Sí | El brief grilling cerró en `input.md`. El chat de clarificación es desechable. |
| Post-`/sdd-generate` → `/sdd-validate` | No | Validate necesita los 4 artefactos frescos para comparar contra brief. |
| Post-`/sdd-validate` (con gaps) → `/sdd-log` → re-validate | No | El gap detectado y la decisión están en chat hasta loggearlos. Compactar perdería el gap. |
| Post-`/sdd-log` → `/sdd-implement` | Sí | El registro quedó en `DECISIONS.md`. El código no necesita el contexto de discusión. |
| Mid-`/sdd-implement` | No | Pierde nombres de variables, paths parciales, decisiones intermedias. |
| Post-`/sdd-implement` → `/sdd-checklist` | Sí | Tests pasaron, código en disco. El contexto de implementación es desechable. |
| Post-`/sdd-review` (cierre de feature) | Sí | Feature cerrada. El próximo trabajo arranca con contexto limpio. |

### Detección de fase activa

Identificá la fase actual leyendo qué archivos existen:
- `drafts/` con contenido y sin `input.md` → Fase 1
- `input.md` sin `specs/` → Fase 2 cerrada, Fase 3 no iniciada
- `specs/[feature]/` con los 4 artefactos → Fase 3 cerrada
- Código en `app/` o `source_root` y tests pasando → Fase 4 en curso
- `checklist.md` presente → Fase 4 cerrada o por cerrar

### Output esperado

1. Mostrar la tabla completa.
2. Identificar la transición más probable según el estado del repo.
3. Recomendar Sí / No con una línea de justificación específica al estado actual.
4. Recordar: la decisión de correr `/compact` es del operador.

### Reglas

- No ejecutar `/compact` automáticamente.
- No modificar ningún artefacto.
- Si la fase no es determinable, pedí al usuario que la confirme manualmente.
