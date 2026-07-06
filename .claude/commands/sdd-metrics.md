# Comando: Generar Reporte de Métricas (Telemetría SDD)

**Descripción:** Este comando audita la eficiencia de la sesión actual y la claridad de la especificación. Se corre **al final de la sesión de implementación**, dentro de esa misma sesión, para que el agente pueda auto-reportar su comportamiento (DX_MET_001–005).

## Instrucciones para el Agente

### Paso 0 — Determinar feature_id e iteration_number
Antes de escribir el reporte:
1. El `feature_id` es el nombre de la carpeta dentro de `specs/` (ej. `001-login`). Si no existe carpeta, usá el nombre del artefacto principal (ej. nombre del `input.md`).
2. Contá cuántos archivos `*-metrics.md` existen ya en `metrics/` para esa feature. Ese número + 1 es el `iteration_number`.
3. El `command_origin` es el comando que disparó este reporte (ej. `sdd-implement`, `sdd-validate`, `manual`).

### Paso 0.5 — Detección de entorno (solo afecta a DX_MET_006)
La variante depende de QUÉ AGENTE hace la llamada a la API, no de qué editor se usa.
Lo que habilita la Variante A es que ejecute Claude Code, porque es quien escribe los
logs JSONL que ccusage lee. El editor que lo hospede es irrelevante.

Señal primaria: la variable de entorno `CLAUDECODE` (la fija Claude Code cuando es él
quien corre; confirmar con `echo $CLAUDECODE`). Señal secundaria: `~/.claude/projects/`
con logs de esta sesión.

- Agente = **Claude Code** → **Variante A (ccusage, tokens reales)**, sin importar el
  editor. Claude Code dentro de Cursor ES Variante A (verificado 2026-07-06: escribe
  JSONL y dispara el hook igual que standalone; la extensión de IDE puede fallar sin
  afectar la captura).
- Agente = **nativo del IDE** (p. ej. Composer/Chat de Cursor, que rutea por sus
  servidores sin escribir logs de usage) o entorno que solo carga el `.md` sin ejecutar
  Claude Code → **Variante B (bytes÷4, vigente)**.

Regla: NO decidir por identidad del IDE (`IDE: Cursor` en el status NO implica Variante
B). Decidir por `CLAUDECODE` / presencia de logs de Claude Code de esta sesión.

**El resto del reporte (DX_MET_001–005, Rework Ratio, estructura, contexto) es idéntico en ambos entornos.**

---

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

- [ ] DX_MET_006 **Token Budget** — usar la variante según el entorno detectado en Paso 0.5:

  <!-- ─────────────── VARIANTE A · Claude Code (ccusage, tokens REALES) ─────────────── -->
  **Consumo real de la sesión de implementación**, observado (no estimado). Es el
  bloque `usage` que devuelve Anthropic, leído de los logs locales por ccusage.

  Procedimiento:
  1. Obtener el `session_id` de esta sesión: leer la **última** línea de
     `metrics/sessions.jsonl` (la escribe el hook SessionStart). Si el archivo no
     existe, avisar que falta instalar el hook y tomar la sesión activa más reciente
     que reporte ccusage.
  2. Ejecutar:
     ```bash
     !npx ccusage@latest claude session --no-cost --json
     ```
     (`--no-cost` porque el objetivo es tokens, no plata.)
  3. De `sessions[]`, filtrar por **dos** criterios (defensa en profundidad):
     - `sessionId` = el/los `session_id` de esta slice, **y**
     - `projectPath` = el de este proyecto. Ojo: ccusage transforma la ruta a un
       slug reemplazando separadores por `-` (ej. `C:\Users\...\expense-splitter`
       → `C--Users-FacundoFernandez-Desktop-Proyectos-expense-splitter`). Derivar el
       slug esperado desde el `cwd` de la última línea del hook en
       `metrics/sessions.jsonl` (NO desde `CLAUDE_PROJECT_DIR`, que no está seteada en
       el entorno de Claude Code — verificado 2026-07-06, devuelve vacío). Ese `cwd`
       viene como ruta Windows (`C:\...\proyecto`); la transformación al slug es
       `C:\` → `C--` y cada `\` restante → `-`. Matchear ese slug contra `projectPath`.
     El filtro por `sessionId` ya basta, pero `ccusage claude session` devuelve TODAS
     tus sesiones de Claude Code (de cualquier proyecto y fecha); el segundo filtro
     evita cualquier chance de tomar una sesión ajena. NO usar el bloque `totals` del
     JSON: agrega todos los proyectos.
     - Multi-sesión: si esta slice abarcó varias sesiones (resume/compact, o cortes
       en distintos días), sumar también esos ids. Pasarlos explícitos o tomarlos de
       `metrics/sessions.jsonl`. Los tokens de compactación cuentan (son costo real de la slice).
  4. Reportar la suma por componente. Mapeo de campos del JSON de ccusage (por
     objeto de `sessions[]`; **confirmado** contra ccusage 20.0.14):

    | Fila del reporte | Campo en el JSON de ccusage |
    |---|---|
    | input_tokens | `inputTokens` |
    | output_tokens | `outputTokens` |
    | cache_creation_input_tokens | `cacheCreationTokens` |
    | cache_read_input_tokens | `cacheReadTokens` |
    | **TOTAL** | `totalTokens` (o la suma de los cuatro) |

    - `session_ids`: [lista de sesiones atribuidas a esta slice/feature]
    - `source`: `ccusage`
    - Nota: `cacheReadTokens` es el mejor proxy del "contexto releído" (artefactos
      SDD + código) y suele ser el componente dominante: en implementaciones reales
      `inputTokens` es marginal (unidades) y el peso vive en cache. La API no lo
      separa más fino que esto.
    - **Cota conocida:** como el reporte corre dentro de la misma sesión, el turno
      actual de `/sdd-metrics` puede no estar aún flusheado al log, así que su propio
      overhead queda parcial o totalmente afuera del número. Es despreciable frente a
      una sesión de implementación entera y se acepta a cambio de poder auto-reportar
      DX_MET_001–005 in-session.

  <!-- ─────────────── VARIANTE B · Otros IDEs (bytes÷4, VIGENTE) ─────────────── -->
  Para cada artefacto leído durante la sesión, reportá su tamaño en bytes y la estimación de tokens (bytes ÷ 4). Sumá el total.
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
  Nota: este número es el input mínimo garantizado (artefactos SDD). El costo real de sesión puede ser 3–10× mayor por contexto acumulado. La reducción más efectiva es iniciar sesión nueva por fase.

**Rework Ratio (calculado)**
- **Tareas totales en tasks.md**: [N]
- **DX_MET_001 acumulado (todas las iteraciones de esta feature)**: [suma de los DX_MET_001 de archivos previos + esta sesión]
- **Entradas en DECISIONS.md para esta feature**: [N]
- **Rework Ratio estimado**: `(DX_MET_001_acumulado + entradas_DECISIONS) ÷ tareas_totales`
