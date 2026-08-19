# Contrato de rutas — modelo SDD

**Estado:** propuesto (pendiente de firma del dueño del modelo — ver `DECISIONS.md`).
**Consumidores mecánicos de este contrato:** `scripts/sdd-audit.mjs`, `scripts/gen-kanban.mjs`,
`scripts/kanban-server.mjs`, `.claude/hooks/sdd-session-capture.mjs`, `.github/workflows/sdd-audit.yml`.

Este documento declara, por carpeta y por archivo: **quién lo escribe**, **a qué capa pertenece**
(local / distribuida / compartida) y **si el auditor lo lee**. Existe para que nadie "ordene"
carpetas y rompa el layout sin darse cuenta: el layout es interfaz, no preferencia estética.

---

## 1. Los dos roots

El modelo venía conflando dos raíces distintas. Se separan explícitamente:

| Root | Qué es | Cómo se resuelve |
|---|---|---|
| `DATA_ROOT` | El repo de código auditado: dónde viven `specs/`, `metrics/`, `graph/`, `drafts/`, `handoffs/` y los archivos raíz | `--root <path>` si se pasa; si no, `process.cwd()` |
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
| **B · Negocio** | Catálogo de features de Discovery: `discovery_id`, título, épica, release, talle, criterios de aceptación de negocio | Generado aguas arriba (discovery-model). Se vendorea read-only | **No.** Editar acá es editar una copia |
| **C · Implementación** | Registro local, specs, plan, tasks, grafo, `existing-arch.md`, métricas, evidencia E2E, status/owner/sprint/touches | Del repo. Se commitea con el código | **Sí.** Es el trabajo |

**La capa C nunca se comparte entre repos.** No es una recomendación de proceso: es una consecuencia
del código. Ver §6.

---

## 3. Carpetas (relativas a `DATA_ROOT`)

| Ruta | Capa | Quién escribe | Auditor la lee | Multi-repo |
|---|---|---|---|---|
| `specs/_registry/features.yaml` | C | `/sdd-generate` (alta), `/sdd-review` (cierre), `/sdd-fix` (fixes) | **Sí** — CHECK 1, 2, 3, 4, 5 | Local. Uno por repo. Nunca se copia |
| `specs/_registry/features.template.yaml` | A | framework (distribución) | No | Idéntica en todos los repos |
| `specs/_registry/sprints/*.yaml` | C | humano (scope), nadie más | **Sí** — CHECK 5 | Local |
| `specs/_registry/sprints/_template.yaml` | A | framework | No | Idéntica |
| `specs/<id>/spec.md` | C | `/sdd-generate` | **Sí** — CHECK 6 (`## Fuera de scope`) | Local. Deriva de capa B, no la reemplaza |
| `specs/<id>/constitution.md` | C | `/sdd-generate` | No | Local (principios del codebase) |
| `specs/<id>/plan.md` | C | `/sdd-generate` | No | Local (stack real de este repo) |
| `specs/<id>/tasks.md` | C | `/sdd-generate`, `/sdd-implement` (marca `[x]`) | **Sí** — CHECK 3 (conteo `T\d{3}`), CHECK 6 (`US-N`) | Local |
| `specs/<id>/feature.status.md` | C | `/sdd-generate`, `/sdd-review` | **Sí** — CHECK 1 (status vs registro) | Local |
| `specs/<id>/checklist.md` | C | `/sdd-checklist` + humano | No | Local |
| `specs/<id>/e2e/cases.md` | C | `/sdd-e2e` | No | Local (corre contra *esta* app) |
| `specs/<id>/jira-map.yaml` | C | `/sdd-generate` Paso 5, `/sdd-jira-sync` | No | Local |
| `metrics/<id>-metrics.md` | C | `/sdd-validate`, `/sdd-implement`, `/sdd-e2e`, `/sdd-review`, `/sdd-metrics` | **Sí** — CHECK 3 (gates) | Local. Es evidencia de *esta* ejecución |
| `metrics/sessions.jsonl` | C | `.claude/hooks/sdd-session-capture.mjs` (append) | No | Local. Nunca se copia (append-only por máquina) |
| `metrics/README.md` | A | framework | No | Idéntica |
| `graph/domain.yaml` | C | `/sdd-scan`, `/sdd-generate` | **Sí** — CHECK 4 (cada `files:` debe existir) | **Local, no negociable.** Ver §6 |
| `graph/domain.template.yaml` | A | framework | No | Idéntica |
| `drafts/**` | C | humano | No | Local |
| `drafts/README.md` | A | framework | No | Idéntica |
| `handoffs/*.md` | C | `/sdd-handoff` | No | Local |
| `catalog/product.yaml` | **B** | discovery-model (upstream) — vendoreado por DevOps | **Sí** (nuevo CHECK 7, solo si existe) | **Compartida, read-only** |
| `catalog/README.md` | B | DevOps | No | Compartida |
| `contracts/paths.md`, `contracts/framework.md`, `contracts/framework-files.txt` | A | framework | No | Idéntica |
| `contracts/rollout-multirepo.md` | C (transitorio) | quien conduce la migración | No | Plan de una sola vez. Se borra al cerrarse |
| `.claude/commands/*.md` | A | framework | No | Idéntica |
| `.claude/skills/**` | A | framework | No | Idéntica (ver §7) |
| `.claude/hooks/*.mjs` | A | framework | No | Idéntica |
| `scripts/*.mjs` | A | framework | No | Idéntica |
| `demo/**` | A | framework (fixture) | Solo con `--root demo` | Idéntica |

### Archivos en la raíz de `DATA_ROOT`

| Archivo | Capa | Quién escribe | Auditor | Multi-repo |
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
metrics/  graph/  drafts/  handoffs/  catalog/  contracts/
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

## 5. Espacio de IDs entre repos

- `id` es **local al repo**. Es simultáneamente nombre de carpeta (`specs/<id>/`), clave del
  registro y prefijo del archivo de métricas (`metrics/<id>-metrics.md`).
- **Dos repos NO comparten `id`, ni siquiera para la misma feature de negocio.** El número lo
  asigna `/sdd-generate` con el siguiente libre *de ese repo*; forzar igualdad exigiría un
  asignador compartido — el acoplamiento que estamos removiendo.
- **`discovery_id` es la única clave de join entre repos.** Puede aparecer en varios registros.
- Convención (no verificada por el auditor): el slug se mantiene, el número es local.
  `vulnops: 012-sso-login` ↔ `web-vulnops: 007-sso-login`, ambos con `discovery_id: F031`.
- Dentro de **un mismo repo**, dos features `OPEN` con el mismo `discovery_id` son WARN: alguien
  duplicó trabajo o partió la feature sin registrarlo.
- La vista cross-repo ("¿dónde se implementó F031?") **no vive en ningún repo**: se computa
  uniendo registros, o se declara en `catalog/product.yaml` → `implemented_in`.

---

## 6. Por qué la capa C no se comparte (evidencia)

| Artefacto | Por qué es intransferible |
|---|---|
| `graph/domain.yaml` | Declara rutas exactas de código (`src/services/token.ts`) y `meta.commit` para drift (`graph/domain.template.yaml:7,20-24`). La regla de routing obliga al agente a leer **solo** lo que el grafo lista: un grafo de la API dentro del repo web enruta a archivos inexistentes. El auditor lo confirma como FAIL (`scripts/sdd-audit.mjs:302-307`) |
| `touches` | Se cruzan entre features `OPEN` para detectar colisiones (`scripts/sdd-audit.mjs:187-203`). Dos personas no colisionan entre API y web: son filesystems distintos |
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
