# Rollout multi-repo — lista de cambios ordenada por dependencia

**Estado:** propuesto. **Nada de esto se ejecuta antes de que las cuatro entradas de
`DECISIONS.md` (2026-08-19) pasen de `proposed` a `accepted` con firma.**

Documento transitorio (capa C): se borra cuando el rollout cierra.
Leyenda de columnas: **Dueño** = quién lo hace · **Bloquea a** = qué no puede empezar sin esto.

---

## Fase 0 — Firma (bloquea todo)

| # | Qué | Dueño | Bloquea a |
|---|---|---|---|
| 0.1 | Firmar las 4 entradas de `DECISIONS.md`: esquema de registro, espacio de IDs, capa A + versionado, layout como interfaz | **Dueño del modelo** | Todo |
| 0.2 | Decidir **cuál copia queda autoritativa** por capa: capa A → este repo (`sdd-model`); capa C → la copia que vive dentro de cada repo de código, **no** la raíz | IA Eng define, DevOps ejecuta | 1.x, 4.x |

Sobre 0.2: la raíz autoritativa deja de ser autoritativa **para capa C**. Su capa C actual
(`specs/`, `metrics/`, `graph/` con datos de features reales) es residuo de haber usado el repo del
modelo como repo de trabajo. Se archiva o se borra; no se migra a ningún lado.

---

## Fase 1 — Modelo: contratos (ya escrito, entra con la firma)

| # | Qué | Dueño | Bloquea a |
|---|---|---|---|
| 1.1 | `contracts/paths.md` — contrato de rutas | IA Eng ✅ escrito | 2.x, 3.x, 4.x |
| 1.2 | `contracts/framework.md` + `contracts/framework-files.txt` — qué es la capa A y qué es una versión | IA Eng ✅ escrito | **4.1 (manifiesto de DevOps)** |
| 1.3 | `CLAUDE.md` — capas, multi-repo, layout como interfaz, marcadores `SDD:FRAMEWORK` | IA Eng ✅ escrito | 2.5 |
| 1.4 | `.claude/VERSION` con `1.2.0` y `.claude/skills/VERSION` alineado a ese valor | IA Eng | 2.4, 4.1 |

---

## Fase 2 — Modelo: código (en este orden; cada paso deja el auditor verde)

| # | Qué | Archivo | Dueño | Depende de |
|---|---|---|---|---|
| 2.1 | **`--root` en el auditor.** `DATA_ROOT = --root ? resolve(cwd, arg) : process.cwd()`. Reemplaza `resolve(dirname(fileURLToPath(import.meta.url)), "..")` en `scripts/sdd-audit.mjs:19`. Imprimir el root resuelto + versión del framework en la cabecera del reporte | `scripts/sdd-audit.mjs` | IA Eng | 0.1 |
| 2.2 | **Matar el falso verde.** Si el root resuelto no contiene ninguna de `specs/`, `metrics/`, `graph/` → FAIL "layout SDD no encontrado en `<root>`". El caso "registro ausente pero layout presente" sigue siendo el PASS actual de `:138-143` | `scripts/sdd-audit.mjs` | IA Eng | 2.1 |
| 2.3 | **CHECK 7 — catálogo.** Solo si existe `catalog/product.yaml` (o `meta.catalog`): `discovery_id` inexistente en el catálogo → **FAIL**; `epic`/`release`/`size` locales divergentes → **WARN**; feature sin `discovery_id` (salvo `type: fix`) → **WARN**; dos features `OPEN` con el mismo `discovery_id` → **WARN**. Sin catálogo, el check no emite nada | `scripts/sdd-audit.mjs` | IA Eng | 2.1, 3.1 |
| 2.4 | **CHECK 8 — versión e integridad de marcadores.** `.claude/VERSION` ausente → WARN; distinto de `.claude/skills/VERSION` → **FAIL** (instalación parcial). Marcadores `SDD:FRAMEWORK` en `CLAUDE.md`: ninguno → WARN; más de uno de cada tipo, o cierre antes de apertura → **FAIL** (parte el bloque que hashea el manifiesto). Sin comparación contra upstream | `scripts/sdd-audit.mjs` | IA Eng | 1.4 |
| 2.5 | **Unificar el default de `--root`.** `gen-kanban.mjs:19` pasa de `join(__dirname,'..')` a `process.cwd()`; `--out` se sigue resolviendo contra `cwd` (`:21`) para que `pnpm kanban` y `pnpm kanban:demo` escriban donde escriben hoy. `kanban-server.mjs:26` ya está bien | `scripts/gen-kanban.mjs` | IA Eng | 2.1 |
| 2.6 | `package.json`: agregar `audit:sdd:demo` → `node scripts/sdd-audit.mjs --root demo`. Hoy `demo/` no se puede auditar y es el fixture de `/sdd-test` | `package.json` | IA Eng | 2.1 |
| 2.7 | `specs/_registry/features.template.yaml`: bloque `meta:` (`repo`, `catalog`) + nota de que `epic`/`release`/`size` son caché del catálogo | plantilla | IA Eng | 0.1 |
| 2.8 | `catalog/product.template.yaml` + `catalog/README.md` ("generado aguas arriba, no editar acá") | nuevo | IA Eng | 2.7 |
| 2.9 | `/sdd-generate`: escribe `meta.repo`; si hay catálogo, toma los campos de negocio de ahí en vez de copiarlos del brief; deja explícito que el número del `id` es local y no se coordina entre repos | `.claude/commands/sdd-generate.md` | IA Eng | 2.7, 2.8 |
| 2.10 | `/sdd-refine`: si hay catálogo, valida el `discovery_id` del frontmatter del brief contra él antes de escribir `input.md` | `.claude/commands/sdd-refine.md` | IA Eng | 2.8 |
| 2.11 | `/sdd-fix`: los fixes nacen sin `discovery_id` — declararlo explícito para que el CHECK 7 no los marque | `.claude/commands/sdd-fix.md` | IA Eng | 2.3 |
| 2.12 | `/sdd-health`: leer la salida del auditor incluyendo CHECK 7 y 8, sin recalcularlos | `.claude/commands/sdd-health.md` | IA Eng | 2.3, 2.4 |
| 2.13 | `/sdd-scan`: dejar dicho que `existing-arch.md` y `graph/domain.yaml` describen **este** codebase y nunca se copian | `.claude/commands/sdd-scan.md` | IA Eng | 0.1 |
| 2.14 | `README.md`: corregir la Opción C (submódulo). Hoy documenta una instalación en la que el auditor pasa en verde sin auditar. Con `--root` pasa a ser `node .sdd/scripts/sdd-audit.mjs --root .` | `README.md` | IA Eng | 2.1 |
| 2.15 | `/sdd-test`: agregar al smoke test los dos casos que hoy no cubre — auditar con `--root` apuntando a otro árbol, y un layout anidado que debe fallar | `.claude/commands/sdd-test.md` | IA Eng | 2.2, 2.6 |

---

## Fase 3 — DevOps: transporte de la capa B

| # | Qué | Dueño | Depende de |
|---|---|---|---|
| 3.1 | Mecanismo de vendoreo de `catalog/product.yaml` desde el discovery-model a cada repo, **read-only** y con marca de origen y fecha en `meta` | DevOps | 1.1, 2.8 |
| 3.2 | Garantizar que el catálogo llega igual a los dos repos y que nadie lo edita en destino (permisos, o check en CI) | DevOps | 3.1 |

---

## Fase 4 — DevOps: distribución de la capa A

| # | Qué | Dueño | Depende de |
|---|---|---|---|
| 4.1 | Generar `.claude/MANIFEST.sha256` a partir de `contracts/framework-files.txt`: hash por archivo `EXACT`, hash del bloque `SDD:FRAMEWORK` de `CLAUDE.md`, verificación de claves para `package.json` | DevOps | **1.2, 1.4** |
| 4.2 | Elegir e implementar el mecanismo de distribución (submódulo, paquete, o generador). Requisito: al terminar, el árbol cumple `contracts/paths.md` y el manifiesto valida | DevOps | 4.1, 1.1 |
| 4.3 | Check de integridad en CI de cada repo de código: manifiesto + versión instalada vs. último release upstream | DevOps | 4.1, 4.2 |
| 4.4 | Correr `pnpm audit:sdd --root .` en el CI de **cada repo de código** (hoy el auditor solo corre en el CI del repo del modelo) | DevOps | 2.1 |
| 4.5 | `.gitattributes` con normalización de fin de línea en los tres repos. Es la causa de que archivos idénticos parecieran distintos; hoy no existe el archivo | DevOps | — |
| 4.6 | Resolver el conflicto de skills globales: `scripts/sync-skills.mjs` copia a `~/.claude/skills/` con `force: true`, destino usuario y no repo — con dos repos en versiones distintas, el último sync gana. Opciones en `contracts/framework.md` §6 | DevOps decide, IA Eng valida | 4.2 |
| 4.7 | Ejecutar 0.2: archivar la capa C de la raíz y dejar de sincronizar con `cp` | DevOps | 0.2, 4.2 |

---

## Lo que este rollout NO resuelve

- **El contrato entre la API y la web.** Los `touches` detectan colisiones dentro de un filesystem;
  que la API cambie de forma y la web asuma la anterior no lo ve ningún script. Queda en
  coordinación humana + `DECISIONS.md`. Si se quiere mecanizar, el MCP `cortex` ya declarado en
  `.mcp.json` genera un `CONTRACT.md` de superficie pública por servicio (`scm_generate` /
  `scm_diff`) — evaluarlo es trabajo aparte, no parte de este rollout.
- **El estado de una feature de negocio a nivel producto** ("F031 está lista"). Requiere unir los
  registros de los dos repos. Es un reporte, no un artefacto: no debe vivir en ninguno de los dos.
