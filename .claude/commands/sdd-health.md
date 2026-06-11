Leé estos archivos del proyecto:
- constitution.md
- DECISIONS.md
- existing-arch.md (si existe — modo brownfield)
- graph/domain.yaml (si existe)
- specs/_registry/features.yaml y specs/_registry/sprints/ (si existen)
- Todos los archivos dentro de specs/ (si existe la carpeta)
- spec.md, plan.md, tasks.md (si están en la raíz)
- La carpeta de código (`app/` por defecto, o el `source_root` declarado en `existing-arch.md`)

Analizá la salud del modelo y generá un reporte con este formato:

## SDD Health Report — [FECHA]

### 📏 Tamaño de artefactos
Para cada artefacto, indicá cantidad de líneas y si supera el límite recomendado:
- constitution.md: recomendado ≤ 60 líneas
- spec.md: recomendado ≤ 80 líneas por feature
- plan.md: recomendado ≤ 50 líneas
- tasks.md: recomendado ≤ 40 líneas activas (sin contar completadas)

### 🗓️ Artefactos desactualizados
- Principios en constitution.md que contradicen entradas en DECISIONS.md
- User stories en spec.md cuyo código ya no existe o fue reemplazado en app/
- Tareas en tasks.md marcadas como pendientes pero ya implementadas en app/

### 🗃️ Contenido para archivar
- Tareas completadas en tasks.md que deberían moverse a un historial
- Decisiones en DECISIONS.md que ya fueron absorbidas por constitution.md

### 🧭 Drift de existing-arch.md (solo brownfield)
Si `existing-arch.md` existe, compará el SHA registrado en su sección "Drift tracking"
contra el HEAD actual del repo. Reportá:
- Commits transcurridos desde la última pasada de /sdd-scan
- Cambios en archivos de manifest (`package.json`, etc.) desde ese SHA
- Cambios en carpetas top-level desde ese SHA
Si hay drift significativo, recomendá correr /sdd-scan nuevamente.

### � Estado de features

Buscá todos los archivos `specs/*/feature.status.md` en el proyecto.
Para cada uno, leé el campo `status`.

Mostrá:

**Features OPEN (en progreso):**
- [feature_id] — creada: [fecha]

**Features CLOSED (terminadas):**
- [feature_id] — cerrada: [fecha]

Si no existe ningún `feature.status.md`, indicá: "Sin features registradas. Corré `/sdd-generate` para iniciar una feature."

### 🗂️ Consistencia del registro (specs/_registry/)
Si existe `specs/_registry/features.yaml`, verificá:
- Cada `feature.status.md` tiene su entrada en el registro y los status coinciden
- Cada entrada del registro tiene su carpeta en `specs/` (los fixes `type: fix` están exentos)
- Features OPEN cuyo sprint ya terminó (comparar contra `specs/_registry/sprints/`)
- Features sin `owner` o sin `touches`
Reportá cada inconsistencia como ⚠️.

### 💥 Colisiones entre features OPEN (equipo)
Intersectá los `touches` de todas las features `OPEN` entre sí.
Para cada par con archivos en común, reportá:
```
⚠️ [feature-A] (owner: X) y [feature-B] (owner: Y) tocan ambas: [archivos]
```
Si los owners son distintos, marcalo como prioridad alta — requiere coordinación
antes de que ambas avancen.

### 🕸️ Drift del grafo de dominio (graph/domain.yaml)
Si existe `graph/domain.yaml`, verificá:
- `meta.commit` vs HEAD actual: ¿cuántos commits pasaron?
- Archivos listados en `files` que ya no existen en el codebase
- Carpetas/módulos nuevos en el `source_root` que ningún dominio cubre
Si hay drift, recomendá: "Corré /sdd-scan para regenerar el grafo."

### �📊 Resumen de métricas (si existe carpeta `metrics/`)

Leé todos los archivos dentro de `metrics/`. Para cada feature encontrada, extraé:
- `feature_id`
- Total de `iteration_number` (cuántas veces se ejecutó sdd-implement)
- Último `DX_MET_006 TOTAL INPUT estimado` (tokens)
- Último `Rework Ratio estimado`
- `cobertura_inicial` del bloque Validate (si existe)

Mostrá la tabla:

| feature_id | Iteraciones | Tokens estimados | Rework Ratio | Cobertura inicial |
|---|---|---|---|---|
| [valor] | [N] | [N] | [N] | [%] |
| **TOTAL PROYECTO** | — | [suma tokens] | — | — |

Si no existe la carpeta `metrics/` o está vacía, indicá: "Sin métricas registradas aún."

### ✅ Estado general
[SALUDABLE / REQUIERE ATENCIÓN / CRÍTICO]
Resumen de qué hacer antes del próximo sprint.

---

Reglas:
- No modifiques ningún archivo. Solo reportá.
- Si algo requiere decisión del equipo, marcalo explícitamente.
- Al terminar, preguntá: "¿Querés que archive las tareas completadas de tasks.md?"
  Si el usuario dice sí, hacelo y registrá la acción con /sdd-log.

Empezá directamente, sin pedir confirmación.
