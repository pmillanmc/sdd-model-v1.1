# Demo Script — SDD Model completo

> Instructivo paso a paso para probar los 9 comandos en orden.
> Usa `drafts/ejemplo-borrador.md` como input de prueba.
> Antes de empezar: tener Claude Code CLI instalado y `pnpm` disponible.

---

## Preparación

```
1. Copiar sdd-model/ a una carpeta nueva (no trabajar sobre el template)
2. Abrir Claude Code en esa carpeta
3. Verificar que drafts/ejemplo-borrador.md existe
```

---

## Paso 0 — Entender el modelo

```
/sdd-explain
```

**Qué hace**: Claude lee todos los archivos del modelo y explica cómo conecta cada parte.

**Qué esperar**:
- Descripción de las 5 fases encadenadas
- Por qué existen los artefactos y qué pasa si falta uno
- Al final te pregunta si querés profundizar en algo

**Gate**: ninguno. Seguir cuando tengas el panorama claro.

---

## Paso 1 — Clarificar el brief

```
/sdd-refine
```

**Qué hace**: Lee `drafts/ejemplo-borrador.md` e identifica qué está claro, ambiguo o faltante.

**Qué esperar**:
- Claude va a preguntar sobre **"responsable"** de una tarea — el borrador dice que cada tarea tiene un responsable pero no especifica si es texto libre o una lista del equipo. Decidí una opción.
- Puede preguntar también sobre la estructura del formulario de creación de proyecto.
- Pregunta UNA cosa por vez. Responder hasta que todo esté claro.
- Antes de generar `input.md`: Claude muestra el resumen y pide confirmación.
- Segunda confirmación antes de guardar.

**Output**: `specs/001-panel-proyectos/input.md`

**Gate**: leer `input.md` y confirmar que captura todo lo del borrador incluyendo los 5 comportamientos de UI.

---

## Paso 2 — Generar los artefactos

```
/sdd-generate
```

**Qué hace**: Lee `input.md` y genera los 4 artefactos SDD.

**Qué esperar**:
- `constitution.md` con principios MUST/PROHIBITED del proyecto
- `spec.md` con user stories y criterios Given/When/Then
- `plan.md` con arquitectura React + TypeScript + localStorage
- `tasks.md` con tareas TDD ordenadas

**Observar**: ¿llegó la "animación sutil al completar tarea" a algún criterio Given/When/Then en spec.md? Es probable que no — está descrita vagamente en el brief. Ese gap aparece en el paso siguiente.

**Output**: los 4 archivos en `specs/001-panel-proyectos/`

---

## Paso 3 — Validar cobertura

```
/sdd-validate
```

**Qué hace**: Compara `input.md` punto por punto contra los 4 artefactos.

**Qué esperar**:
- Reporte con ✅ / ⚠️ / ❌ por cada punto del brief
- **Gap esperado**: "animación sutil al completar tarea" → marcado como ⚠️ o ❌ porque no tiene criterio formal en spec.md
- Claude avisa y **para** — no modifica nada solo

**Decisión humana**: la animación es un nice-to-have. Decidir: ¿entra en v1 o se descarta?

Si se descarta → siguiente paso. Si entra → agregar criterio a spec.md y volver a `/sdd-validate`.

---

## Paso 4 — Registrar la decisión

```
/sdd-log
```

**Qué hace**: Registra en `DECISIONS.md` que la animación fue descartada para v1.

**Qué esperar**: Claude pregunta 4 cosas una por vez:
1. ¿Qué cambió? → "La animación al completar tarea se descarta para v1"
2. ¿Por qué? → "Es un nice-to-have, no afecta funcionalidad core"
3. ¿Qué artefacto afecta? → "spec.md"
4. ¿Quién decidió? → tu nombre / rol

**Output**: `DECISIONS.md` creado en la raíz con la entrada registrada.

---

## Paso 5 — Implementar

```
/sdd-implement
```

**Qué hace**: Lee los 4 artefactos e implementa todas las tareas en orden con TDD.

**Qué esperar**:
- Arranca directo, sin pedir confirmación
- Tests primero, implementación después (TDD)
- Usa `pnpm` para todo
- Genera `app/` con el código completo

**Gate**: esperar a que termine todas las tareas de `tasks.md`.

---

## Paso 6 — Generar el checklist manual

```
/sdd-checklist
```

**Qué hace**: Genera criterios de verificación que los tests no pueden cubrir.

**Qué esperar** (categorías probables para este proyecto):
- **UX**: ¿los empty states se ven bien en pantallas pequeñas?
- **Accesibilidad**: ¿las cards de proyecto tienen aria-labels? ¿el checkbox de tarea es navegable por teclado?
- **Seguridad**: ¿el nombre del proyecto se sanitiza antes de guardar en localStorage?

Claude muestra el listado y pide confirmación antes de guardar.

**Output**: `specs/001-panel-proyectos/checklist.md`

**Gate**: completar el checklist manualmente antes de seguir.

---

## Paso 7 — Review final

```
/sdd-review
```

**Qué hace**: Dos pasadas — lógica y UI.

**Qué esperar**:

**Pasada 1 — Lógica**: verifica que cada criterio Given/When/Then tiene test y código. Si algo falta → Claude para y avisa.

**Pasada 2 — UI**: cruza `input.md` vs `spec.md` vs código.
- **Gap esperado**: "cuando se crea un proyecto nuevo, la card aparece al tope de la lista" — está en el brief, es fácil que no haya llegado al código como comportamiento explícito.
- Claude reporta el gap en la sección 🎨 Gaps de UI y **para**.

**Decisión humana**: resolver el gap en el código y volver a `/sdd-review`. O documentarlo como pendiente con `/sdd-log`.

---

## Paso 8 — Registrar el gap de UI

```
/sdd-log
```

Segundo uso de `/sdd-log`, contexto diferente al anterior:
- ¿Qué cambió? → "Se agrega ordenamiento al crear proyecto (nuevo al tope)"
- ¿Por qué? → "Gap detectado en /sdd-review, estaba en el brief pero no llegó al código"
- ¿Qué artefacto? → "spec.md + app/"
- ¿Quién decidió? → tu nombre

**Resultado**: `DECISIONS.md` ahora tiene 2 entradas — una decisión de descarte y una corrección de gap.

---

## Paso 9 — Auditoría del sprint

```
/sdd-health
```

**Qué hace**: Audita todos los artefactos activos.

**Qué esperar al final del demo**:
- Tasks completadas no archivadas → Claude pregunta si archivar
- Verificación de límites de tamaño (constitution ≤60, spec ≤80, etc.)
- Si todo está en orden → "sprint limpio ✅"

Si aprobás el archivado → Claude lo hace y recuerda correr `/sdd-log`.

---

## Resultado final

Al terminar los 9 pasos tenés:

| Artefacto | Generado por |
|---|---|
| `specs/001-panel-proyectos/input.md` | `/sdd-refine` |
| `specs/001-panel-proyectos/spec.md` | `/sdd-generate` |
| `specs/001-panel-proyectos/plan.md` | `/sdd-generate` |
| `specs/001-panel-proyectos/tasks.md` | `/sdd-generate` |
| `specs/001-panel-proyectos/checklist.md` | `/sdd-checklist` |
| `DECISIONS.md` | `/sdd-log` (×2) |
| `app/` | `/sdd-implement` |

Y todos los comandos participaron con triggers naturales — ninguno forzado.
