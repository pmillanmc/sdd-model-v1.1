## [2026-07-05] Medición de tokens: ccusage sobre Claude Code, no proxy ni bytes/4

**Decisión:** DX_MET_006 mide el consumo real de tokens vía `ccusage` (que lee los
logs locales de Claude Code) cuando el ciclo corre en Claude Code; cae a `bytes/4`
en otros IDEs (detector en Paso 0.5 de `/sdd-metrics`).

**Alternativas descartadas:**
- **Proxy propio + API key:** exige API key porque Claude Code no rutea el login de
  suscripción a un host que no sea `api.anthropic.com`. Implica costo por token y no
  aplica al plan Team (tarifa plana).
- **CCFlare con OAuth de suscripción:** rodea esa restricción por diseño, con riesgo
  de violar los ToS del asiento. Descartado por riesgo sobre la cuenta.
- **bytes/4 como medida real:** solo estima el peso del texto. La validación mostró
  input directo = 109 tokens vs 7.17 M de cache_read en un ciclo completo — el peso
  del texto es irrelevante frente al contexto releído.

**Restricción heredada:** la medición solo funciona en Claude Code (ccusage no lee
Cursor u otros IDEs). Es una capacidad Claude-Code-only, aislada tras el detector; el
core del modelo sigue siendo IDE-agnóstico.

**Validación:** feature `002-expense-categories`, ciclo completo = 7.303.554 tokens,
98,2% cache_read. Ver `metrics/002-expense-categories-metrics.md`.

## [2026-07-06] Medición de tokens con Claude Code dentro de Cursor + fuente del slug de proyecto (DX_MET_006 / Paso 0.5)

**Decisión:** Claude Code corriendo dentro de Cursor es medible vía Variante A (ccusage),
sin cambios en la fuente de datos. Regla de detección del Paso 0.5: decidir la variante
por qué agente hace la llamada a la API (señal `CLAUDECODE` / presencia de logs de Claude
Code), NUNCA por identidad del IDE. Corrección en Variante A: el slug de proyecto para
matchear `projectPath` se deriva del `cwd` del hook (`metrics/sessions.jsonl`), NO de
`CLAUDE_PROJECT_DIR`.

**Hallazgos (verificación empírica 2026-07-06):**
- Sesión de prueba `4cc382bc-fb18-497d-a4ca-64c2cba19ae4` sobre expense-splitter (cuenta
  Team, org Proguide).
- El CLI escribió su JSONL en `~/.claude/projects/` igual que standalone; el hook
  SessionStart disparó y capturó `session_id` + `transcript_path` + `cwd`; ccusage
  reportó los cuatro componentes con `cache_read` dominante (57.829 = ~64% de la sesión
  de prueba; 98,2% en la sesión grande contigua). El perfil de cache es la firma de que
  son tokens reales, no estimación bytes÷4.
- La extensión de IDE de Cursor puede fallar al instalarse ("cursor.cmd not found") sin
  afectar la captura de tokens.
- `CLAUDE_PROJECT_DIR` devuelve vacío en el entorno de Claude Code (verificado
  2026-07-06). El shell por defecto de Claude Code en este setup Windows es bash, no
  PowerShell.

**Restricción de alcance:** la limitación "Cursor no medible" aplica únicamente al agente
nativo de Cursor (Composer/Chat propio). NO aplica a Claude Code dentro del editor.
`IDE: Cursor` en el status no implica Variante B.
