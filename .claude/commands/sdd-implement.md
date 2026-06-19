**Gate de prerequisitos (no negociable):**
Antes de leer nada, verificá en orden:
1. Existen los 4 artefactos (`constitution.md`, `spec.md`, `plan.md`, `tasks.md`) en `specs/[feature_id]/`.
   Si falta alguno: "Faltan artefactos — corré /sdd-generate primero." y PARÁ.
2. Existe el bloque `## Validate` en `metrics/[feature_id]-metrics.md` (evidencia de que /sdd-validate corrió).
   Si no existe: "No hay evidencia de validación — corré /sdd-validate primero." y PARÁ.
   El humano puede forzar el salto SOLO con confirmación explícita, y en ese caso registralo con /sdd-log.
3. La feature figura `OPEN` en `specs/_registry/features.yaml`. Si figura `CLOSED` o no existe, avisá y PARÁ.
4. **Colisiones (equipo):** intersectá los `touches` de esta feature con los de toda otra feature `OPEN` de otro owner. Si hay intersección, reportá la colisión y preguntá antes de tocar esos archivos.

Leé estos cuatro archivos en orden:
1. constitution.md
2. spec.md — prestá atención especial a la sección `## Fuera de scope (v1)` si existe: ningún ítem listado ahí puede implementarse, aunque aparezca mencionado en `drafts/`, en comentarios del código o en el contexto de la conversación. Si detectás que una tarea de `tasks.md` implementa algo fuera de scope, avisá y pedí confirmación antes de continuar.
3. plan.md
4. tasks.md

Si existe `existing-arch.md` en la raíz, leélo TAMBIÉN antes de tocar código.

**Si hay archivos `.html` en `drafts/` y la feature tiene componentes de UI:** leélos ANTES de implementar cualquier componente visual. Para cada elemento que vayas a implementar, resolvé la cascada CSS completa:
1. Identificá las variables CSS (`--var`) y resolvé su valor final (no uses el nombre de la variable como valor)
2. Seguí la herencia: si un color o font-size viene del padre, usá el valor computado
3. Verificá especificidad: si una clase sobreescribe a otra, usá el valor que realmente gana
4. Priorizá el valor efectivo del HTML por sobre cualquier descripción textual en spec.md o plan.md que pueda haber quedado imprecisa

Si `input.md` tiene una sección de especificación visual con valores explícitos (colores hex, px, etc.), esos valores son la fuente de verdad definitiva para los estilos.
En modo brownfield:
- Trabajá dentro del `source_root` declarado (NO crees una carpeta `app/` nueva).
- Usá el gestor de paquetes declarado en `existing-arch.md` (puede no ser pnpm).
- Respetá los patrones inquebrantables — no introduzcas convenciones nuevas sin que estén en `plan.md`.
- Antes de crear un archivo nuevo, verificá si ya existe uno con responsabilidad equivalente; si lo hay, modificalo en vez de duplicarlo.

Cuando termines, implementá todas las tareas de tasks.md en orden,
respetando los principios de constitution.md.
Usá pnpm como gestor de paquetes salvo que `existing-arch.md` indique otro.
Empezá directamente, sin pedir confirmación.


**Gobernanza de Cierre:** Antes de dar por terminada la implementación, debes generar obligatoriamente el reporte de métricas en la carpeta `metrics/` basándote en la estructura definida en `sdd-metrics.md`.