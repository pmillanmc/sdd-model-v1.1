Leé estos archivos del proyecto:
- constitution.md
- DECISIONS.md
- Todos los archivos dentro de specs/ (si existe la carpeta)
- spec.md, plan.md, tasks.md (si están en la raíz)
- La carpeta app/ para verificar qué está implementado

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
