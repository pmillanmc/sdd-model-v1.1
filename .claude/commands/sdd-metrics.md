# Comando: Generar Reporte de Métricas (Telemetría SDD)

**Descripción:** Este comando audita la eficiencia de la sesión actual y la claridad de la especificación.

## Instrucciones para el Agente

### Paso 0 — Determinar feature_id e iteration_number

Antes de escribir el reporte:
1. El `feature_id` es el nombre de la carpeta dentro de `specs/` (ej. `001-login`). Si no existe carpeta, usá el nombre del artefacto principal (ej. nombre del `input.md`).
2. Contá cuántos archivos `*-metrics.md` existen ya en `metrics/` para esa feature. Ese número + 1 es el `iteration_number`.
3. El `command_origin` es el comando que disparó este reporte (ej. `sdd-implement`, `sdd-validate`, `manual`).

### Paso 0.5 — Medición de tokens (asimétrica honesta)

Detectá el entorno y elegí la fuente de medición más precisa disponible. Las tres ramas son mutuamente excluyentes — solo una aplica por sesión.

#### Rama A — Claude Code nativo con acceso a transcripts

1. Verificá si existe alguna de estas rutas:
   - macOS/Linux: `~/.claude/projects/`
   - Windows: `%USERPROFILE%\.claude\projects\`
2. Identificá el subdirectorio que corresponde al proyecto actual (suele ser un hash del path del repo).
3. Encontrá el archivo `.jsonl` más reciente — ese es el transcript de esta sesión.
4. Leé el archivo línea por línea. Cada línea es un JSON con un campo `usage` que contiene `input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`.
5. Agregá los valores. El total exacto de input es: `input_tokens + cache_read_input_tokens + cache_creation_input_tokens`.
6. Marcá la fuente como `transcript_exacto`.

#### Rama B — Claude Code sin acceso a transcripts

1. Si la Rama A falla por permisos, archivo no encontrado, o transcript ilegible: caés al método de estimación bytes ÷ 4 sobre los artefactos leídos durante la sesión.
2. Marcá la fuente como `estimacion_bytes`.

#### Rama C — IDE distinto (Cursor, Copilot, Windsurf, etc.)

1. Misma estimación que Rama B.
2. Marcá la fuente como `estimacion_bytes_no_claude_code`.
3. Agregá al pie del reporte la nota:
   > Medición exacta no disponible en este IDE. Para Cursor consultá `cursor.com/settings/usage` y reemplazá el valor de DX_MET_006 manualmente con el delta del día.

Creá (o actualizá si ya existe) el archivo `metrics/[feature_id]-metrics.md` con la siguiente estructura exacta:

### 📊 Reporte de Esfuerzo SDD

**Contexto de ejecución**
- **feature_id**: [valor detectado en Paso 0]
- **command_origin**: [comando que disparó este reporte]
- **iteration_number**: [número de ejecución para esta feature]
- **timestamp**: [fecha y hora ISO 8601]

**Eficiencia de la IA (DX)**
- [ ] DX_MET_001 **Ciclos de Autocorrección**: [Número de veces que un test falló y tuviste que arreglar el código por tu cuenta].
- [ ] DX_MET_002 **Consultas de Clarificación**: [Número de veces que tuviste que preguntarle al usuario por falta de detalles en la spec].
- [ ] DX_MET_003 **Interacciones Totales**: [Cantidad de prompts/turnos usados].

**Análisis de Retrabajo**
- [ ] DX_MET_004 **Causa Raíz**: [Si hubo errores, explica brevemente si fue culpa técnica o por ambigüedad de la Spec].
- [ ] DX_MET_005 **Resiliencia**: [¿Alcanzaste algún límite de rate-limit o tokens durante la tarea?].
- [ ] DX_MET_006 **Token Budget**
  - **Fuente de medición**: [transcript_exacto | estimacion_bytes | estimacion_bytes_no_claude_code]
  - **Total tokens input**: [N]
  - **Si Rama A — desglose exacto del transcript:**
    - input_tokens (nuevos): N
    - cache_read_input_tokens: N
    - cache_creation_input_tokens: N
  - **Si Rama B o C — tabla de artefactos leídos:**

    | Artefacto | Bytes | Tokens estimados |
    |---|---|---|
    | `existing-arch.md` | — | — |
    | `input.md` | — | — |
    | `constitution.md` | — | — |
    | `spec.md` | — | — |
    | `plan.md` | — | — |
    | `tasks.md` | — | — |
    | archivos de código leídos | — | — |
    | **TOTAL INPUT estimado** | — | — |

    Nota: este número es el input mínimo garantizado. El costo real puede ser 3–10× mayor por contexto acumulado. La forma más efectiva de reducirlo es iniciar sesión nueva por fase.

**Rework Ratio (calculado)**
- **Tareas totales en tasks.md**: [N]
- **DX_MET_001 acumulado (todas las iteraciones de esta feature)**: [suma de los DX_MET_001 de archivos previos + esta sesión]
- **Entradas en DECISIONS.md para esta feature**: [N]
- **Rework Ratio estimado**: `(DX_MET_001_acumulado + entradas_DECISIONS) ÷ tareas_totales`