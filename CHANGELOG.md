# Changelog — framework SDD

Una sección por versión de `.claude/VERSION`. La semántica de los bumps
(MAJOR / MINOR / PATCH) está en `contracts/framework.md` §4.

Regla de oro: **si un repo instalado tiene que tocar algún artefacto para volver
a pasar el auditor, era MAJOR.**

---

## 1.3.0 — 2026-08-27

**MINOR.** Agrega la maquinaria de distribución de la capa A. Ningún repo instalado
tiene que tocar un artefacto para seguir pasando el auditor.

### Agrega

- **`scripts/sdd-manifest.mjs`** — genera `.claude/MANIFEST.sha256` desde
  `contracts/framework-files.txt`. Corre upstream, al preparar un release. Los hashes son
  SHA-256 sobre contenido normalizado (CRLF→LF, sin BOM), así que Windows y el CI de Linux
  dan lo mismo. Con `--check` no escribe: falla si el manifiesto quedó desactualizado.
- **`scripts/sdd-install.mjs`** — materializa la capa A en un repo destino, con las tres
  semánticas de `contracts/framework.md` §2: `EXACT` copia el archivo entero, `BLOCK`
  reemplaza solo el bloque `SDD:FRAMEWORK` de `CLAUDE.md`, `MERGE` escribe solo las claves
  declaradas del `package.json` y preserva el resto. Se **niega a pisar drift**: si el destino
  tiene capa A editada localmente, aborta y la lista (`--force` para descartarla).
- **`scripts/sdd-verify.mjs`** — verifica el árbol contra el manifiesto instalado. No necesita
  la fuente ni la red: corre en el CI de cualquier repo consumidor.
- **`scripts/lib/framework.mjs`** — las primitivas compartidas por los tres.
- **`.github/workflows/sdd-version.yml`** — gate de versión: compara `.claude/VERSION` contra
  el último tag upstream. Atrás por MINOR/PATCH avisa; atrás por un MAJOR rompe el build.
  Es la única verificación del framework que sale a la red.

### Cambia

- `.github/workflows/sdd-audit.yml` corre `sdd-verify` antes del auditor.
- `package.json` aporta `sdd:manifest` y `sdd:verify`. `sdd:install` **no** es clave de capa A:
  su comando depende del transporte (`.sdd/scripts/…` o `node_modules/…`), y las rutas que
  cambian según el transporte están excluidas por `contracts/framework.md` §1.
- El fixture `demo/**` está declarado como opcional en repos de código: si no está, no falta;
  si está, se verifica como cualquier otra entrada de capa A.

### Nota

`.gitattributes` deja de ser prerequisito del manifiesto: la normalización de fin de línea
ocurre dentro del hash. Sigue siendo buena higiene de repo.

---

## 1.2.0 — 2026-08-25

> **Nota de versionado, pendiente de decisión.** Por la regla de `contracts/framework.md` §4
> este release es **MAJOR** y debería ser `2.0.0`: el contrato de gates agrega FAILs nuevos y
> la guarda de layout convierte un PASS en FAIL. Se etiqueta `1.2.0` porque **el radio de
> impacto es cero** — ningún repo instalado corrió el modelo todavía, así que no hay artefacto
> ajeno que haya que tocar. Si eso deja de ser cierto, el próximo cambio de contrato va a
> `2.0.0` sin excepción.

### Rompe (comportamiento que antes pasaba y ahora falla)

- **El auditor ya no pasa en verde apuntando a un árbol equivocado.** Nuevo CHECK 0: si el
  `DATA_ROOT` resuelto no contiene ninguna de `specs/`, `metrics/` o `graph/`, falla y nombra
  la ruta. Antes tomaba el camino "modelo sin correr, nada que auditar" y salía con exit 0 —
  el caso de la instalación como submódulo, donde auditaba el framework en lugar del repo.
- **Contrato de gates de métricas.** El auditor exige, y `/sdd-implement` y `/sdd-review`
  producen y verifican:
  - bloque `## Implement` con `tasks_completadas: m/m` y `tests: PASS` para habilitar review;
  - bloque `## Gate Override` con `authorized: true` y `validate_iteration` para implementar
    con gaps de validación abiertos;
  - una feature `CLOSED` sin `## Implement` ni `## Task T00X` es FAIL.

### Agrega

- **`--root <path>` en `scripts/sdd-audit.mjs`**, con default `process.cwd()`. Separa
  `DATA_ROOT` (el codebase auditado) de `FRAMEWORK_ROOT` (donde está instalado el framework):
  ningún script deriva el primero de su propia ubicación en disco. `gen-kanban.mjs` unifica su
  default con el de `kanban-server.mjs`.
- **Cabecera del reporte** con el `root:` resuelto y la versión del framework. Auditar el árbol
  equivocado deja de ser invisible.
- **`.claude/VERSION`** como fuente única de la versión instalada, alineada con
  `.claude/skills/VERSION`.
- **`contracts/`**: `paths.md` (contrato de rutas, las tres capas, el layout como interfaz),
  `framework.md` (qué es la capa A y qué significa un bump), `framework-files.txt` (lista
  canónica de 52 archivos con su tipo de verificación: `EXACT` / `BLOCK` / `MERGE`).
- **Marcadores `SDD:FRAMEWORK`** en `CLAUDE.md` para delimitar la parte distribuida de la
  parte propia de cada repo.
- **Trazabilidad con Discovery** (los tres parches del contrato de handoff): campos
  `discovery_id`, `epic`, `release`, `size` en el registro; `/sdd-refine` saltea el grilling
  cuando el brief trae las 6 secciones, verificando `contract_version`; `/sdd-generate` usa el
  `feature_id` y el `domain` del brief en vez de proponerlos.
- **Cortex como acelerador opcional**: fallback de exploración en `/sdd-implement` y
  `/sdd-fix`, insumo de descubrimiento en `/sdd-scan` con la procedencia registrada en
  `meta.generated_by`, y un paso opcional en `/sdd-setup` que detecta los cuatro estados
  (`CORTEX_OK`, `CORTEX_NOT_LOADED`, `CORTEX_BIN_MISSING`, `CORTEX_ABSENT`) e instala guiado.
  **Ningún gate ni check depende de él.**
- **`DECISIONS.md`** con seis entradas en `status: proposed` — la propuesta de arquitectura
  multi-codebase, sin firmar.

### Corrige

- **`iteration_number` en `/sdd-metrics`** se contaba sobre archivos `*-metrics.md` de
  `metrics/`, que siempre daba `1` porque hay uno por feature. Ahora cuenta bloques dentro del
  archivo. La telemetría de retrabajo entre iteraciones estaba inutilizada.
- **`/sdd-implement` es reanudable**: arranca en la primera task `- [ ]` y marca una por vez,
  recién cuando sus tests pasan.
- **El kanban no se auto-levanta.** `/sdd-generate` pregunta una vez; `/sdd-validate` y
  `/sdd-implement` solo dejan un recordatorio pasivo. Revierte el comportamiento introducido
  en `b8ccc19`.

### Saca del repo (sigue en disco, deja de viajar)

Telemetría local con rutas absolutas (`metrics/sessions.jsonl`), salidas generadas
(`kanban*.html`), basura de herramientas (`.playwright-mcp/`, `.qodo/`), config de cliente MCP
con rutas de máquina (`.cursor/mcp.json`) y material de comunicación (`*.docx`, `*.pdf`, los
`.html` de presentación). 21 archivos, ~460 KB.

### Deuda declarada, no cerrada

- El fixture `demo/` no pasa el auditor (9 FAIL): el registro declara 10 features y existen 2
  carpetas. Por eso **no** se agregó `audit:sdd:demo`.
- `meta.repo`, `capability`, `module`, `meta.aliases` y `CONTRACT.md` están definidos en los
  contratos y todavía **no los lee nadie**.
- El hook de sesión escribe en `CLAUDE_PROJECT_DIR/metrics`, no en el `DATA_ROOT`: en un
  monorepo con un root por app, la telemetría cae en el árbol equivocado.
- El CHECK 4 verifica existencia solo de las rutas bajo `files:`; las de `public:` e
  `internal:` no las mira nadie.
- No hay check de completitud del manifiesto: agregar un comando y olvidar su línea en
  `framework-files.txt` no falla.
- Falta la explicación para el dev (`/sdd-explain` no tiene sección multi-codebase, y el
  `README.md` no menciona el caso).

---

## 1.1.0 y anteriores

Sin changelog. `.claude/skills/VERSION` era la única versión declarada y solo la leía
`scripts/sync-skills.mjs`.
