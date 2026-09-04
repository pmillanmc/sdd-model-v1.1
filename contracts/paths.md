# Contrato de rutas — modelo SDD

**Estado:** vigente desde 2026-08-25 — firmado por Patricio Millán (dueño del modelo) en el gate 0.1.
Ver la entrada *"El layout es interfaz"* del 2026-08-19 en `DECISIONS.md`.
**Consumidores mecánicos de este contrato:** `scripts/sdd-audit.mjs`, `scripts/gen-kanban.mjs`,
`scripts/kanban-server.mjs`, `.claude/hooks/sdd-session-capture.mjs`, `.github/workflows/sdd-audit.yml`.

Este documento declara, por carpeta y por archivo: **quién lo escribe**, **a qué capa pertenece**
(local / distribuida / compartida) y **si el auditor lo lee**. Existe para que nadie "ordene"
carpetas y rompa el layout sin darse cuenta: el layout es interfaz, no preferencia estética.

---

## 0. Alcance y vocabulario

Este contrato no habla de repositorios: habla de **DATA_ROOT**. La distinción es lo que hace que el
modelo sirva para uno, dos o siete codebases sin cambiar ninguna regla.

| Término | Qué es | Cuántos |
|---|---|---|
| **producto** | la unidad de negocio. Sus capacidades (`BC*`) y features (`F*`) viven en el discovery-model | 1 |
| **codebase** | un árbol de código con su propio ciclo SDD: `specs/` + `metrics/` + `graph/` hermanos de una misma raíz | **N ≥ 1** por producto |
| **DATA_ROOT** | la raíz de ese árbol. **Es la unidad del modelo**: todo comando y todo script opera sobre exactamente uno | 1 por codebase |
| **repositorio** | la unidad de git. **No es la unidad del modelo** | contiene 1..N DATA_ROOT |

Consecuencias, todas verificables contra el código:

- **El modelo no conoce roles.** No sabe ni le importa si un codebase es una API, una web, un
  worker, una app móvil o infraestructura. Ninguna regla, ningún check y ningún artefacto se
  ramifica por eso. Si en algún lugar aparece un rol, es un ejemplo, no una definición.
- **N = 1 es el caso normal.** Un producto en un solo codebase usa exactamente las mismas reglas.
  No hay un "modo multi-codebase" que se prenda: lo que cambia con N > 1 es cuántas veces se
  instancia lo mismo.
- **Un monorepo puede tener uno o varios DATA_ROOT.** Un `specs/` en la raíz —un registro para todo
  el monorepo, donde las colisiones de `touches` **sí** son reales porque es un solo filesystem— o
  uno por app (`apps/<x>/specs/…`). Las dos formas son válidas: se **declara** con `--root`, no se
  infiere. CI corre el auditor una vez por DATA_ROOT.
- **Un DATA_ROOT nunca abarca dos repositorios.** Si `specs/` vive en un repo y el código en otro,
  las rutas de `graph/domain.yaml` apuntan afuera del árbol y el CHECK 4 falla. Es la misma falla
  del incidente con otra forma.
- **La identidad de un codebase es autodeclarada** en `meta.repo` del registro. El modelo no la
  deduce del nombre del repositorio, de la carpeta ni del stack.

Los nombres concretos que aparezcan en `contracts/rollout-multirepo.md` son **la instancia que
motivó este contrato**, no su definición.

---

## 1. Los dos roots

El modelo venía conflando dos raíces distintas. Se separan explícitamente:

| Root | Qué es | Cómo se resuelve |
|---|---|---|
| `DATA_ROOT` | El codebase auditado: dónde viven `specs/`, `metrics/`, `graph/`, `drafts/`, `handoffs/` y los archivos raíz | `--root <path>` si se pasa; si no, `process.cwd()` |
| `FRAMEWORK_ROOT` | Dónde vive el framework instalado: `.claude/commands/`, `.claude/skills/`, `scripts/`, `contracts/` | `resolve(dirname(import.meta.url), "..")` — la ubicación del propio script |

**Regla:** ningún script del modelo puede derivar `DATA_ROOT` de su propia ubicación en disco.
En una instalación como submódulo (`README.md` → Opción C, `.sdd/scripts/`) esa derivación apunta
al framework en lugar del repo anfitrión, y el auditor **pasa en verde sin auditar nada**
(`scripts/sdd-audit.mjs:19` + `:138-143`). Verificado empíricamente.

**Regla:** todo script del modelo imprime el `DATA_ROOT` resuelto en la primera línea de su salida.
Sin eso, auditar el árbol equivocado es invisible.

---

## 2. Las tres capas

| Capa | Qué contiene | Regla de propiedad | ¿Editable en destino? |
|---|---|---|---|
| **A · Framework** | Comandos, skills, hooks, scripts, este contrato, plantillas | Una sola fuente. Se distribuye. Versionado en `.claude/VERSION` | **No.** Un cambio local es drift; se hace upstream y se redistribuye |
| **B · Negocio** | Identidad de negocio de la feature: `discovery_id`, épica, release, talle, capacidad, criterios de aceptación. **No es un archivo compartido: es el `drafts/brief.md` que entrega el handoff de Discovery**, versionado con `contract_version` | Generada aguas arriba (discovery-model). Llega por handoff, se referencia por ID | **No.** El brief es constancia de lo que cruzó, no un artefacto a editar |
| **C · Implementación** | Registro local, specs, plan, tasks, grafo, `existing-arch.md`, métricas, evidencia E2E, status/owner/sprint/touches | Del repo. Se commitea con el código | **Sí.** Es el trabajo |

**La capa C nunca se comparte entre `DATA_ROOT`.** No es una recomendación de proceso: es una consecuencia
del código. Ver §6.

---

## 3. Carpetas (relativas a `DATA_ROOT`)

| Ruta | Capa | Quién escribe | Auditor la lee | Distribución |
|---|---|---|---|---|
| `specs/_registry/features.yaml` | C | `/sdd-generate` (alta), `/sdd-review` (cierre), `/sdd-fix` (fixes) | **Sí** — CHECK 1, 2, 3, 4, 5 | Local. Uno por `DATA_ROOT`. Nunca se copia |
| `specs/_registry/features.template.yaml` | A | framework (distribución) | No | Idéntica en todos los repos |
| `specs/_registry/sprints/*.yaml` | C | humano (scope), nadie más | **Sí** — CHECK 5 | Local |
| `specs/_registry/sprints/_template.yaml` | A | framework | No | Idéntica |
| `specs/<id>/spec.md` | C | `/sdd-generate` | **Sí** — CHECK 6 (`## Fuera de scope`) | Local. Deriva de capa B, no la reemplaza |
| `specs/<id>/constitution.md` | C | `/sdd-generate` | No | Local (principios del codebase) |
| `specs/<id>/plan.md` | C | `/sdd-generate` | No | Local (stack real de este repo) |
| `specs/<id>/tasks.md` | C | `/sdd-generate`, `/sdd-implement` (marca `[x]`) | **Sí** — CHECK 3 (conteo `T\d{3}`), CHECK 6 (`US-N`) | Local |
| `specs/<id>/feature.status.md` | C | `/sdd-generate`, `/sdd-review` | **Sí** — CHECK 1 (status vs registro). CHECK 7 (trazabilidad) está especificado y **no implementado** (rollout 2.3) | Local. **Único registro durable por feature** de `discovery_id` y `contract_version`: `drafts/brief.md` e `input.md` tienen nombre fijo y se sobreescriben |
| `specs/<id>/checklist.md` | C | `/sdd-checklist` + humano | No | Local |
| `specs/<id>/e2e/cases.md` | C | `/sdd-e2e` | No | Local (corre contra *esta* app) |
| `specs/<id>/jira-map.yaml` | C | `/sdd-generate` Paso 5, `/sdd-jira-sync` | No | Local |
| `metrics/<id>-metrics.md` | C | `/sdd-validate`, `/sdd-implement`, `/sdd-e2e`, `/sdd-review`, `/sdd-metrics` | **Sí** — CHECK 3 (gates) | Local. Es evidencia de *esta* ejecución |
| `metrics/sessions.jsonl` | C | `.claude/hooks/sdd-session-capture.mjs` (append) | No | Local. Nunca se copia (append-only por máquina) |
| `metrics/README.md` | A | framework | No | Idéntica |
| `graph/domain.yaml` | C | `/sdd-scan`, `/sdd-generate` | **Sí** — CHECK 4 (cada `files:` debe existir). CHECK 9 (`internal:` no importado desde afuera) está especificado y **no implementado** (rollout 5.2) | **Local, no negociable.** Ver §6. Declara además `capability`, `module`, `public`, `internal`, `depends_on` (permisos) y `meta.aliases` |
| `graph/domain.template.yaml` | A | framework | No | Idéntica |
| `drafts/**` | C | humano | No | Local |
| `drafts/brief.md` | **B** (payload) | `/dsc-handoff` del discovery-model, con `--target` a este repo | **No hoy.** CHECK 7 lo cubriría si estuviera presente — especificado y **no implementado** (rollout 2.3) | Llega por handoff, no se copia entre repos de código. **Nombre fijo: la feature siguiente lo sobreescribe** |
| `drafts/README.md` | A | framework | No | Idéntica |
| `handoffs/*.md` | C | `/sdd-handoff` | No | Local |
| `CONTRACT.md` | C | `scm_generate` / `scm_update` de cortex (opcional) | No | Superficie pública de **este** repo hacia otros. Se commitea; lo que se revisa entre repos es su `scm_diff` |
| `contracts/paths.md`, `contracts/framework.md`, `contracts/framework-files.txt` | A | framework | No | Idéntica |
| `contracts/rollout-multirepo.md` | C (transitorio) | quien conduce la migración | No | Plan de una sola vez. Se borra al cerrarse |
| `.claude/commands/*.md` | A | framework | No | Idéntica |
| `.claude/skills/**` | A | framework | No | Idéntica (ver §7) |
| `.claude/hooks/*.mjs` | A | framework | No | Idéntica |
| `scripts/*.mjs` | A | framework | No | Idéntica |
| `demo/**` | A | framework (fixture) | Solo con `--root demo` | Idéntica |

### Archivos en la raíz de `DATA_ROOT`

| Archivo | Capa | Quién escribe | Auditor | Distribución |
|---|---|---|---|---|
| `input.md` | C | `/sdd-refine` | No | Local |
| `existing-arch.md` | C | `/sdd-scan` (doble confirmación humana) | No (lo leen 14 comandos) | **Local.** Describe *un* codebase |
| `DECISIONS.md` | C | `/sdd-log` | **Sí** — CHECK 3 (override de gate) | Local |
| `CLAUDE.md` | A + C (híbrido) | framework (bloque marcado) + repo (el resto) | No | Base distribuida, extendible localmente (§7) |
| `package.json` | A + C (híbrido) | framework aporta `scripts` + `yaml`; el repo, todo lo demás | No | Merge, no reemplazo |
| `.mcp.json`, `.cursor/mcp.json`, `.claude/settings*.json`, `.gitleaks.toml`, `.gitattributes` | **DevOps** | DevOps / `/sdd-setup` | No | Fuera del framework. Rutas locales por máquina |
| `kanban.html`, `kanban-demo.html` | derivado | `pnpm kanban` | No | Regenerable. No es fuente |

---

## 4. El layout es interfaz

Las siguientes rutas son **contrato**, no organización:

```
specs/  specs/_registry/  specs/_registry/sprints/  specs/<id>/
metrics/  graph/  drafts/  handoffs/  contracts/
input.md  existing-arch.md  DECISIONS.md
```

`specs/`, `metrics/` y `graph/` son **hermanos de `DATA_ROOT`**, no subcarpetas de `specs/`.

**Prohibido** mover, renombrar o anidar cualquiera de esas rutas sin:
1. entrada en `DECISIONS.md` vía `/sdd-log`,
2. actualización de este archivo **en el mismo commit**,
3. bump **MAJOR** de `.claude/VERSION` (ver `contracts/framework.md`).

Los agentes **no reorganizan** estas carpetas ni cuando el usuario lo pide de pasada: primero
avisan que es un cambio de contrato y piden la decisión.

### Qué pasa exactamente si se anida (verificado)

Mover `metrics/`, `graph/`, `drafts/` y `handoffs/` dentro de `specs/` produce, contra ese árbol:

```
FAIL [registro↔specs] specs/drafts/ existe pero no figura en features.yaml
FAIL [registro↔specs] specs/graph/ existe pero no figura en features.yaml
FAIL [registro↔specs] specs/handoffs/ existe pero no figura en features.yaml
FAIL [registro↔specs] specs/metrics/ existe pero no figura en features.yaml
FAIL [gates] <id>: CLOSED sin archivo de métricas (metrics/<id>-metrics.md)
WARN [grafo] No existe graph/domain.yaml — sin routing de contexto
```

Dos cosas para notar. Primero: los cuatro FAILs **mienten sobre la causa** — acusan a las carpetas
de ser features no registradas (`scripts/sdd-audit.mjs:177-185`, que solo exceptúa nombres con `_`).
Segundo, y peor: la pérdida del grafo degrada a **WARN** (`scripts/sdd-audit.mjs:296-297`), así que
el routing de contexto desaparece sin bloquear nada y los agentes vuelven a escanear el codebase
completo.

---

## 5. Espacio de IDs entre codebases

`id` es a la vez nombre de carpeta (`specs/<id>/`), clave del registro y prefijo del archivo de
métricas (`metrics/<id>-metrics.md`). Hay **dos regímenes**, según de dónde vino la feature.

**Feature originada en Discovery — el `id` es idéntico en todos los repos.**
El brief manda `discovery_id: F031` y `feature_id: 031-sso-login` como **campos separados**: el
slug pertenece al nombre de archivo, no al ID (`discovery-model/contracts/ids.md` §4, regla 4).
SDD no deriva el slug, lo lee del frontmatter; lo verificable es que el `id` arranque con el
número del `discovery_id`. El número sale del contador atómico de
`registry/ids.yaml` de Discovery, que solo sube y nunca se reutiliza. No hace falta ningún
asignador nuevo: la misma feature de negocio lleva el mismo `id` en cada codebase que la
implemente, con
`spec.md`, `plan.md`, `tasks.md` y métricas distintos en cada repo.

**Feature nacida en el repo — `id` local, rango reservado `9nn-`.**
`901-refactor-cache`, `902-migrar-orm`. Parte el espacio de numeración para que una feature local
no bloquee la llegada futura de la feature de Discovery con el mismo número: el gate #5 del handoff
rechaza si el `feature_id` ya existe en el destino, y Discovery no renumera jamás. **El CHECK 7
está especificado para verificarlo** (WARN cuando un `id` del rango `9nn` declara `discovery_id`,
o cuando un `discovery_id` declarado no deriva en el `id`) — ítem 2.3 de `rollout-multirepo.md`,
**todavía no implementado**: hoy no lo verifica nada. Límite aceptado: un proyecto con más de 900
features de Discovery volvería a colisionar.

**Claves de join entre codebases** — las dos son referencias, nunca copias:

| Nivel | Clave | Quién la asigna |
|---|---|---|
| feature | `discovery_id` (`F031`) | `registry/ids.yaml` de Discovery |
| módulo / dominio | `domain` (`reservas`) | `registry/capabilities.yaml` de Discovery, vía `sdd_domain` |

Dos repos que declaran `domain: reservas` hablan de la misma capacidad de negocio sin compartir
ningún archivo, porque el nombre lo asignó Discovery.

Dentro de **un mismo repo**, dos features `OPEN` con el mismo `discovery_id` son WARN: alguien
duplicó trabajo o partió la feature sin registrarlo.

La vista de producto ("¿dónde se implementó F031?") **no vive en ningún repo de código**: es el
`registry/features.yaml` de Discovery, que ya guarda el `feature_id` de SDD calculado en el handoff.

---

## 6. Por qué la capa C no se comparte (evidencia)

| Artefacto | Por qué es intransferible |
|---|---|
| `graph/domain.yaml` | Declara rutas exactas de código (`src/services/token.ts`) y `meta.commit` para drift (`graph/domain.template.yaml:7,20-24`). La regla de routing obliga al agente a leer **solo** lo que el grafo lista: un grafo generado sobre otro codebase enruta a archivos inexistentes. El auditor lo confirma como FAIL (`scripts/sdd-audit.mjs:302-307`) |
| `touches` | Se cruzan entre features `OPEN` para detectar colisiones (`scripts/sdd-audit.mjs:187-203`). dos personas en DATA_ROOT distintos no colisionan: son filesystems distintos. En un monorepo con un solo DATA_ROOT sí colisionan, y el check es correcto ahí |
| `existing-arch.md` | Describe **un** codebase (stack, `source_root`, patrones inquebrantables). Lo leen 14 comandos y `/sdd-validate` lo usa como input fijo contra `plan.md` |
| `metrics/<id>-metrics.md` | Evidencia de ejecución: tests que corrieron, tasks marcadas, E2E contra **esta** app |
| `status` / `owner` / `sprint` | Estado de trabajo local. Compartirlo es lo que produjo `feature.status.md` contradiciendo a la fuente |

**Corolario:** la sincronización manual no estaba mal ejecutada. Estaba propagando datos que
nunca debieron viajar. Los archivos "derivaban" porque no debían ser iguales.

---

## 7. Qué es la capa A y cómo se versiona

Ver `contracts/framework.md` (semántica de versión) y `contracts/framework-files.txt`
(lista canónica, legible por máquina, insumo del manifiesto de integridad de DevOps).

---

## 8. Frontera con DevOps

Este contrato declara **qué rutas existen y quién las escribe**. No declara **cómo llegan ahí**.
El mecanismo de distribución de la capa A, el transporte de la capa B, el fin de línea
(`.gitattributes`), los secretos y las rutas de MCP son de DevOps.
El modelo solo exige que, cuando el mecanismo termine, el árbol cumpla este documento.
