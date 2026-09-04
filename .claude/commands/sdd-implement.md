**Gate de prerequisitos (no negociable):**
Antes de leer nada, verificá en orden:
1. Existen los 4 artefactos (`constitution.md`, `spec.md`, `plan.md`, `tasks.md`) en `specs/[feature_id]/`.
   Si falta alguno: "Faltan artefactos — corré /sdd-generate primero." y PARÁ.
2. Existe el bloque `## Validate` en `metrics/[feature_id]-metrics.md` (evidencia de que /sdd-validate corrió).
   Si no existe: "No hay evidencia de validación — corré /sdd-validate primero." y PARÁ.
   Si hay varios bloques `## Validate`, leé **solo el último** (el físicamente más abajo en el archivo).
   Verificá su campo `gaps_encontrados`:
   - `0` → el gate está abierto, seguí.
   - `> 0` → buscá un bloque `## Gate Override` **posterior** a ese Validate, con
     `gate: Validate`, `authorized: true` y `validate_iteration` igual al `iteration_number`
     de ese mismo Validate. Si existe y es válido, seguí sin volver a preguntar.
     Si no existe: mostrá los gaps pendientes y PARÁ.
   El humano puede forzar el salto SOLO con confirmación explícita. En ese caso, antes de tocar
   código: (a) registralo con /sdd-log, y (b) escribí este bloque al final de
   `metrics/[feature_id]-metrics.md`:

   ```markdown
   ## Gate Override — [timestamp ISO 8601]
   - gate: Validate
   - authorized: true
   - validate_iteration: [iteration_number del último Validate]
   - gaps_encontrados: [valor del último Validate]
   - autorizado_por: [nombre o rol del humano]
   ```

   Sin ese bloque no hay override: la confirmación conversacional sola no abre el gate,
   porque no queda verificable para `/sdd-review` ni para `pnpm audit:sdd`.
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
  Para esa verificación, si el MCP `cortex` está conectado, invocá `get_context_pack(repo_path, query)` describiendo la responsabilidad buscada (ej. "componente de configuración de perfil de usuario") — es más preciso que buscar a mano. Si la tool no existe, falla, o no responde, hacé la búsqueda manual (grep/glob) como venías haciendo; es un fallback silencioso, no lo reportes como error.

Cuando termines, implementá todas las tareas de tasks.md en orden,
respetando los principios de constitution.md.
Usá pnpm como gestor de paquetes salvo que `existing-arch.md` indique otro.
Empezá directamente, sin pedir confirmación.

**Reanudación:** arrancá desde la primera task marcada `- [ ]`. Las que ya están `- [x]` no se
rehacen. Esto hace que `/sdd-implement` sea reanudable después de una interrupción o un compact.

**Loop TDD por tarea (obligatorio, en este orden):**
1. **Red** — escribí el test que describe el comportamiento esperado (debe fallar).
2. **Green** — implementá el mínimo código para que el test pase.
3. **Refactor** — antes de pasar a la siguiente tarea, revisá el código que acabás de escribir:
   - ¿Hay lógica duplicada respecto a una tarea anterior?
   - ¿Algún nombre (variable, función, componente) no refleja lo que hace?
   - ¿Hay abstracción prematura — código que anticipa casos que la spec no pide?
   Si encontrás algo, corregilo. No agregues comportamiento nuevo. Corré los tests de nuevo antes de continuar.
   Si el refactor requiere tocar más de 3 archivos o cambiar contratos, avisá antes de proceder.
4. Corré de nuevo los tests afectados por esta task.
5. **Solo si pasan**, cambiá esa línea de `- [ ] TNNN` a `- [x] TNNN` en `tasks.md`.
   Marcá una task por vez, recién terminada. No marques todas al final ni por adelantado:
   los checkboxes son el estado de progreso que leen el kanban, `/sdd-task` y `/sdd-review`.

Si la ejecución se interrumpe o un test no queda verde, dejá los checkboxes ya completados como
están, la task actual en `- [ ]`, y NO escribas el bloque `## Implement` de cierre.


**Gobernanza de Cierre:** Antes de dar por terminada la implementación, debes generar obligatoriamente el reporte de métricas en la carpeta `metrics/` basándote en la estructura definida en `sdd-metrics.md`.

---

## Evidencia de cierre (obligatorio — es el gate de /sdd-review)

Cuando **todas** las tasks de `tasks.md` estén en `- [x]`:

1. Corré los comandos de verificación del proyecto: test, y lint/build si el proyecto los tiene
   (`existing-arch.md` manda sobre el gestor de paquetes; por defecto `pnpm test`).
2. Si alguno de los que aplican falla: reportalo, NO escribas el bloque `## Implement` y PARÁ.
   Una implementación con tests rojos no habilita review.
3. Generá el reporte de métricas (`### 📊 Reporte de Esfuerzo SDD`) con `command_origin: sdd-implement`.
4. **Después** del reporte, agregá al final de `metrics/[feature_id]-metrics.md` este bloque:

```markdown
## Implement — [timestamp ISO 8601]
- command_origin: sdd-implement
- tasks_completadas: [m]/[m]
- tests: PASS
- lint: [PASS o N/A]
- build: [PASS o N/A]
- gate_override: [true si el humano forzó el gate de Validate; false en caso contrario]
```

Reglas del bloque:

- `tasks_completadas` debe ser `m/m` con `m` = total de tasks canónicas de `tasks.md`.
  Si es `n/m` con `n < m`, la implementación está parcial y el bloque NO se escribe.
- El reporte `### 📊 Reporte de Esfuerzo SDD` es **telemetría**, no evidencia de gate.
  No habilita `/sdd-review` por sí solo: `/sdd-review` y `/sdd-e2e` exigen este bloque `## Implement`.
- Si ya hay bloques `## Implement` de iteraciones anteriores, agregá uno nuevo al final;
  los consumidores leen siempre el último.

---
**Registro de sesión para atribución de tokens (obligatorio):**
Obtené el session_id actual ejecutando `!echo $CLAUDE_CODE_SESSION_ID`. Si el valor NO
está vacío, agregá ese session_id como una línea nueva (append — nunca sobrescribir) al
archivo `metrics/[feature_id].sessions`, creándolo si no existe. Si el valor está vacío
(entorno que no es Claude Code), no escribas nada. Este archivo es un ledger append-only:
puede acumular el mismo session_id varias veces y session_ids de días distintos; la
deduplicación ocurre en la lectura (`/sdd-metrics`), no acá.
---

## Kanban de estado (al finalizar)

Una vez generado el reporte de métricas, verificá si el kanban ya está corriendo:

```bash
curl -s http://localhost:3131 > /dev/null 2>&1 && echo "running" || echo "stopped"
```

- Si responde `running` → mostrá al dev: `📊 Kanban activo en http://localhost:3131`
- Si responde `stopped` → no preguntes de nuevo (esa decisión ya se ofreció en `/sdd-generate`). Mostrá solo un recordatorio pasivo: `💡 Kanban apagado — podés levantarlo con: node scripts/kanban-server.mjs`

No abras el browser automáticamente. El dev decide si lo abre.