# Rollout multi-repo — lista de cambios ordenada por dependencia

**Estado:** propuesto. `DECISIONS.md` tiene **seis** entradas del 2026-08-19, todas en `proposed`,
y no comparten gate: las **cuatro** de arquitectura se firman juntas en el 0.1 y habilitan las Fases
1, 2 y 4; la **quinta** (arquitectura por capacidades) se firma aparte en la Fase 5; la **sexta**
(detección e instalación de Cortex) se firma en el 0.3 y habilita el 2.17 y el 4.8.

**Nada se ejecuta antes de la firma del gate que le corresponde.**

> Los ítems marcados **✅ hecho** se ejecutaron antes de la firma, por pedido explícito del dueño
> del modelo. Quedan como spike reversible hasta que el 0.1 se firme.

Documento transitorio (capa C): se borra cuando el rollout cierra.
Leyenda de columnas: **Dueño** = quién lo hace · **Bloquea a** = qué no puede empezar sin esto.

---

## Fase 0 — Firma (bloquea todo)

| # | Qué | Dueño | Bloquea a |
|---|---|---|---|
| 0.1 | Firmar las 4 entradas de `DECISIONS.md`: esquema de registro, espacio de IDs, capa A + versionado, layout como interfaz | **Dueño del modelo** | Todo |
| 0.2 | Decidir **cuál copia queda autoritativa** por capa: capa A → este repo (`sdd-model`); capa C → la copia que vive dentro de cada repo de código, **no** la raíz | IA Eng define, DevOps ejecuta | 1.x, 4.x |
| 0.3 | Firmar la **6ª entrada** (detección e instalación de Cortex). Gate propio: no entra con el 0.1 porque toca `.mcp.json`, un archivo que hoy lleva una ruta de máquina | **Dueño del modelo** | 2.17, 4.8 |

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
| 1.4 | `.claude/VERSION` con `1.2.0` y `.claude/skills/VERSION` alineado a ese valor | IA Eng **✅ hecho** | 2.4, 4.1 |

---

## Fase 2 — Modelo: código (en este orden; cada paso deja el auditor verde)

| # | Qué | Archivo | Dueño | Depende de |
|---|---|---|---|---|
| 2.1 | **`--root` en el auditor.** `DATA_ROOT = --root ? resolve(cwd, arg) : process.cwd()`. Reemplaza `resolve(dirname(fileURLToPath(import.meta.url)), "..")` en `scripts/sdd-audit.mjs:19`. Imprimir el root resuelto + versión del framework en la cabecera del reporte | `scripts/sdd-audit.mjs` | IA Eng **✅ hecho** | 0.1 |
| 2.2 | **Matar el falso verde.** Si el root resuelto no contiene ninguna de `specs/`, `metrics/`, `graph/` → FAIL "layout SDD no encontrado en `<root>`". El caso "registro ausente pero layout presente" sigue siendo el PASS actual de `:138-143` | `scripts/sdd-audit.mjs` | IA Eng **✅ hecho** | 2.1 |
| 2.3 | **CHECK 7 — consistencia interna de la trazabilidad.** Sin archivos compartidos: `discovery_id: F031` con `id` que no arranca en `031-` → **FAIL**; `size: XL` → **FAIL**; `epic`/`release`/`size`/`domain` del registro divergentes del frontmatter del brief presente → **WARN**; `contract_version` desconocido → **WARN**; dos `OPEN` con el mismo `discovery_id` → **WARN**; declara `discovery_id` sin brief ni `feature.status.md` que lo respalde → **WARN**; `id` del rango `9nn-` con `discovery_id` declarado, o `discovery_id` que no deriva en el `id` → **WARN**. Feature sin `discovery_id` o `type: fix` → no emite nada | `scripts/sdd-audit.mjs` | IA Eng | 2.1 |
| 2.4 | **CHECK 8 — versión e integridad de marcadores.** `.claude/VERSION` ausente → WARN; distinto de `.claude/skills/VERSION` → **FAIL** (instalación parcial). Marcadores `SDD:FRAMEWORK` en `CLAUDE.md`: ninguno → WARN; más de uno de cada tipo, o cierre antes de apertura → **FAIL** (parte el bloque que hashea el manifiesto). Sin comparación contra upstream | `scripts/sdd-audit.mjs` | IA Eng | 1.4 |
| 2.5 | **Unificar el default de `--root`.** `gen-kanban.mjs:19` pasa de `join(__dirname,'..')` a `process.cwd()`; `--out` se sigue resolviendo contra `cwd` (`:21`) para que `pnpm kanban` y `pnpm kanban:demo` escriban donde escriben hoy. `kanban-server.mjs:26` ya está bien | `scripts/gen-kanban.mjs` | IA Eng **✅ hecho** | 2.1 |
| 2.6 | `package.json`: agregar `audit:sdd:demo` → `node scripts/sdd-audit.mjs --root demo`. Hoy `demo/` no se puede auditar y es el fixture de `/sdd-test` | `package.json` | IA Eng | 2.1 |
| 2.7 | `specs/_registry/features.template.yaml`: bloque `meta:` con `repo` + nota de que `epic`/`release`/`size` son **constancia del handoff**, no caché a reconciliar | plantilla | IA Eng | 0.1 |
| 2.8 | `/sdd-generate` propaga `discovery_id` y `contract_version` a `specs/<id>/feature.status.md` — único registro durable por feature (`brief.md` e `input.md` tienen nombre fijo y se sobreescriben). `parseStatusMd` ya lo parsea, sin parser nuevo | `.claude/commands/sdd-generate.md` | IA Eng | 2.3 |
| 2.9 | `/sdd-generate`: escribe `meta.repo`; **dos regímenes de `feature_id`** — derivar del `discovery_id` si el brief lo trae (`F031` → `031-slug`), rango `9nn-` si la feature nace en el repo | `.claude/commands/sdd-generate.md` | IA Eng | 2.7 |
| 2.10 | `/sdd-refine`: reforzar que un `contract_version` desconocido avisa y no bloquea (la regla ya existe), y que el frontmatter se conserva al tope de `input.md` para que 2.8 pueda propagarlo | `.claude/commands/sdd-refine.md` | IA Eng | 2.8 |
| 2.11 | `/sdd-fix`: los fixes nacen sin `discovery_id` — declararlo explícito para que el CHECK 7 no los marque | `.claude/commands/sdd-fix.md` | IA Eng | 2.3 |
| 2.12 | `/sdd-health`: leer la salida del auditor incluyendo CHECK 7 y 8, sin recalcularlos | `.claude/commands/sdd-health.md` | IA Eng | 2.3, 2.4 |
| 2.13 | `/sdd-scan`: dejar dicho que `existing-arch.md` y `graph/domain.yaml` describen **este** codebase y nunca se copian | `.claude/commands/sdd-scan.md` | IA Eng | 0.1 |
| 2.14 | `README.md`: corregir la Opción C (submódulo). Hoy documenta una instalación en la que el auditor pasa en verde sin auditar. Con `--root` pasa a ser `node .sdd/scripts/sdd-audit.mjs --root .` | `README.md` | IA Eng | 2.1 |
| 2.15 | `/sdd-test`: agregar al smoke test los dos casos que hoy no cubre — auditar con `--root` apuntando a otro árbol, y un layout anidado que debe fallar | `.claude/commands/sdd-test.md` | IA Eng | 2.2, 2.6 |
| 2.17 | **Paso opcional de Cortex en `/sdd-setup`**: detección de los cuatro estados (`CORTEX_OK`, `CORTEX_NOT_LOADED`, `CORTEX_BIN_MISSING`, `CORTEX_ABSENT`), instalación guiada por los dos caminos (exe / pip), registro con la ruta que da el dev y con confirmación antes de tocar un archivo versionado. Más procedencia en `/sdd-scan` (`meta.generated_by`) | `.claude/commands/sdd-setup.md`, `.claude/commands/sdd-scan.md`, `CLAUDE.md` | IA Eng | 0.1 |
| 2.16 | `CLAUDE.md`: dejar escrito el desempate de routing — **primero `graph/domain.yaml`**, cortex cuando el grafo no cubre. Las instrucciones del server de cortex declaran `get_context_pack` como *"the primary tool"* y entran al contexto solas | `CLAUDE.md` | IA Eng | 0.1 |

---

## Fase 3 — ~~DevOps: transporte de la capa B~~ · **ELIMINADA**

No hay nada que construir. El transporte de la capa B es el handoff que el discovery-model ya
implementa y contrata (`contracts/handoff.md`): `/dsc-handoff --target <repo>` escribe
`<repo>/drafts/brief.md` con frontmatter versionado y un gate de exportación de 7 condiciones,
incluido el escaneo de secretos **antes** de que el secreto cruce.

La numeración de la Fase 4 se conserva para no invalidar las referencias `4.x` de este documento.

---

## Fase 4 — DevOps: distribución de la capa A

| # | Qué | Dueño | Depende de |
|---|---|---|---|
| 4.1 | Generar `.claude/MANIFEST.sha256` a partir de `contracts/framework-files.txt`: hash por archivo `EXACT`, hash del bloque `SDD:FRAMEWORK` de `CLAUDE.md`, verificación de claves para `package.json` | DevOps | **1.2, 1.4** |
| 4.2 | Elegir e implementar el mecanismo de distribución (submódulo, paquete, o generador). Requisito: al terminar, el árbol cumple `contracts/paths.md` y el manifiesto valida. **No distribuir a un segundo repo antes de 4.1**: hasta que exista el manifiesto, una edición dentro del bloque `SDD:FRAMEWORK` de `CLAUDE.md` no la detecta nada | DevOps | **4.1**, 1.1 |
| 4.3 | Check de integridad en CI de cada repo de código: manifiesto + versión instalada vs. último release upstream | DevOps | 4.1, 4.2 |
| 4.4 | Correr `pnpm audit:sdd --root .` en el CI de **cada repo de código** (hoy el auditor solo corre en el CI del repo del modelo) | DevOps | 2.1 |
| 4.5 | `.gitattributes` con normalización de fin de línea en los tres repos. Es la causa de que archivos idénticos parecieran distintos; hoy no existe el archivo | DevOps | — |
| 4.6 | Resolver el conflicto de skills globales: `scripts/sync-skills.mjs` copia a `~/.claude/skills/` con `force: true`, destino usuario y no repo — con dos repos en versiones distintas, el último sync gana. Opciones en `contracts/framework.md` §6 | DevOps decide, IA Eng valida | 4.2 |
| 4.7 | Ejecutar 0.2: archivar la capa C de la raíz y dejar de sincronizar con `cp` | DevOps | 0.2, 4.2 |
| 4.8 | Sacar la entrada `cortex` del `.mcp.json` commiteado (hoy lleva una ruta de máquina, `C:\tools\cortex-mcp.exe`, y falla en silencio en cualquier otra) y documentar la distribución del binario con **versión y hash**, igual que la capa A. Cortex es la cuarta cosa que viaja entre repos y hoy viaja peor que las otras tres | DevOps | 2.17 |

---

## Fase 5 — Arquitectura por capacidades (requiere firma de la 5ª decisión)

Es una fase aparte porque cambia el schema del grafo y cómo se generan `plan.md` y `tasks.md`.
Entra como **MINOR** solo si el punto 5.1 se respeta: `public:` / `internal:` son opt-in por dominio.

**Se firma y se ejecuta aparte de las otras cinco decisiones, y en dos tandas:** 5.1 y 5.2 son
reversibles (claves opt-in, un check nuevo) y pueden entrar directo; 5.3 y 5.5 cambian cómo se
generan los artefactos y se **pilotean en una feature** antes de firmarse — cuando cinco features
tengan su `plan.md` escrito bajo la regla nueva, revertir deja artefactos inconsistentes entre
features. Esta fase no bloquea a DevOps.

| # | Qué | Archivo | Dueño | Depende de |
|---|---|---|---|---|
| 5.1 | **Schema del grafo**: `capability: [BCnn]`, `module:`, `public:`, `internal:`, `depends_on` como permisos, `meta.aliases` (alias de path del repo). **Opt-in por dominio**: un dominio sin `internal:` se comporta como hoy | `graph/domain.template.yaml` | IA Eng | firma de la decisión 5 |
| 5.2 | **CHECK 9**: ningún archivo de afuera del dominio X importa una ruta del `internal:` de X → FAIL. Regex sobre `import`/`from`/`require` en los archivos que el grafo declara, resolviendo `meta.aliases`. Cero dependencias. **Etiqueta `imports`, nunca "fronteras arquitectónicas", y la línea del reporte declara su cobertura** (`N imports en M archivos · no cubre: re-exports por barrel · imports dinámicos · acoplamiento no-import`). El riesgo del check es el falso PASS, no el falso FAIL | `scripts/sdd-audit.mjs` | IA Eng | 5.1 |
| 5.3 | **`plan.md` declara módulo + interfaz pública antes de `tasks.md`**, y la regla de nombres de funciones se parte: firmas públicas se fijan aguas arriba, nombres internos nunca | `.claude/commands/sdd-generate.md` | IA Eng | 5.1 |
| 5.4 | **`/sdd-scan` delega la medición a cortex** cuando está (`scan_repo`, `extract_spec`, `analyze_graph`) y se queda con nombrar capacidades, el check de secretos, la confirmación humana y `meta.commit`. Sin cortex: **anuncia la degradación**. El grafo registra `meta.generated_by: sdd-scan+cortex@<versión>` | `.claude/commands/sdd-scan.md` | IA Eng | 5.1 |
| 5.5 | **`/sdd-implement`**: priorizar tests de integración contra la interfaz pública del módulo por sobre unitarios archivo por archivo. No cambia el gate (`tests: PASS`) | `.claude/commands/sdd-implement.md` | IA Eng | 5.3 |
| 5.6 | **`CONTRACT.md`** (cortex `scm_generate` / `scm_update`) como superficie pública del repo hacia otros repos. Capa C, se commitea; lo que se revisa entre repos es su `scm_diff`. No lo verifica el auditor | por repo | DevOps ejecuta, IA Eng define el uso | 5.1 |

---

## Lo que este rollout NO resuelve

- **El acoplamiento que no es un import.** Llamadas HTTP entre módulos, nombres de evento, tablas
  compartidas, contenedores de DI resolviendo por string: ningún analizador estático los detecta, ni
  cortex. Se cubren con el campo `contracts` del dominio y con los tests de integración del 5.5.
- **La deriva del contrato entre codebases en tiempo real.** El 5.6 da el artefacto
  (`CONTRACT.md`) y el diff, pero nadie corre ese diff automáticamente en los otros
  codebases. Que uno cambie de forma y otro asuma la anterior sigue siendo coordinación humana +
  `DECISIONS.md`.
- **La versión de cortex no está pineada en ninguna parte.** `.mcp.json` nombra una ruta
  (`C:\tools\cortex-mcp.exe`), no una versión, y el exe se copia a mano. Dos devs pueden autorizar
  grafos con builds distintos. Mitigado —no resuelto— por el 5.4 (`meta.generated_by` con versión) y
  por la regla de que cortex nunca participa en la verificación.
