# Qué es el framework SDD (capa A) y qué significa una versión

**Estado:** propuesto (pendiente de firma del dueño del modelo — ver `DECISIONS.md`).
**Audiencia:** DevOps (construye el manifiesto de integridad y el check de CI) y quien
mantenga el modelo.

La lista canónica y legible por máquina está en `contracts/framework-files.txt`.
Este documento explica **qué significa** esa lista.

---

## 1. Definición

El **framework** (capa A) es el conjunto de archivos que hacen funcionar el modelo SDD y que son
**idénticos byte a byte en todos los repos donde el modelo está instalado**.

Criterio de inclusión, en una línea: *si dos repos legítimamente pueden tener contenido distinto
en ese archivo, no es capa A.*

De ahí se sigue lo que **no** es framework, aunque viva en las mismas carpetas:

| No es capa A | Por qué |
|---|---|
| `existing-arch.md`, `graph/domain.yaml`, `specs/**`, `metrics/**`, `drafts/**`, `handoffs/**` | Capa C: describen *este* codebase |
| `catalog/product.yaml` | Capa B: se genera aguas arriba, no lo versiona el framework |
| `.mcp.json`, `.cursor/mcp.json`, `.claude/settings.json`, `.claude/settings.local.json` | Contienen rutas de máquina y permisos por repo (`C:\tools\cortex-mcp.exe`) — DevOps |
| `.gitattributes`, `.gitleaks.toml`, `.env*` | Política de repo — DevOps |
| `README.md` | Documenta *un* repo. La versión del modelo tiene la suya, los repos de código tienen otra |
| `*.html`, `demo/KANBAN-DEMO.md`, `*.docx` | Material de comunicación y salidas derivadas |
| `node_modules/`, `pnpm-lock.yaml` | Dependencias, no framework |

## 2. Los tres tipos de archivo de capa A

DevOps necesita esta distinción porque **no todos se pueden verificar igual**.

### 2.1 `EXACT` — hash exacto, no editables en destino

El manifiesto guarda un SHA-256 por archivo. Cualquier diferencia es **drift** y falla el check.
Son todos los comandos, skills, hooks, scripts, contratos y plantillas.

Regla operativa: un cambio local en un archivo `EXACT` no se arregla en destino. Se hace upstream,
se bumpea la versión y se redistribuye.

### 2.2 `BLOCK` — solo un bloque marcado se verifica

`CLAUDE.md` es híbrido: el framework aporta reglas comunes, cada repo agrega las suyas. Para poder
verificarlo, las reglas del framework van entre marcadores literales:

```
<!-- SDD:FRAMEWORK BEGIN v1.2.0 -->
...reglas del modelo, distribuidas, no editar...
<!-- SDD:FRAMEWORK END -->
```

El manifiesto hashea **únicamente** el contenido entre marcadores (marcadores incluidos). Todo lo
que esté afuera es del repo y no se toca. Sin los marcadores presentes, el check es FAIL
("instalación incompleta"), no PASS.

**Cada marcador debe aparecer exactamente una vez.** Una segunda aparición literal de la cadena
—incluso dentro de un comentario que la menciona— parte el bloque y hace que el manifiesto hashee
un fragmento. Es un modo de falla silencioso: el hash da distinto y el diagnóstico apunta al lugar
equivocado. El auditor lo verifica (CHECK 8): `0` marcadores → WARN, más de uno de cada tipo o el
cierre antes de la apertura → FAIL.

### 2.3 `MERGE` — se aporta, no se reemplaza

`package.json`: el framework aporta las claves `scripts.audit:sdd`, `scripts.kanban`,
`scripts.kanban:demo`, `scripts.kanban:serve`, `scripts.kanban:serve:demo`, `scripts.skills:sync`,
`scripts.skills:sync:dry` y `devDependencies.yaml`. El resto del archivo es del repo.
El check verifica **presencia y valor de esas claves**, nunca el archivo completo.

## 3. Dónde se declara la versión

| Archivo | Qué declara | Quién lo escribe |
|---|---|---|
| `.claude/VERSION` | **Nuevo.** Versión del framework instalado en este repo. Fuente única | Framework (viaja en la distribución) |
| `.claude/skills/VERSION` | Versión de los skills. Debe **coincidir** con `.claude/VERSION` | Framework |
| `.claude/MANIFEST.sha256` | Hashes de los archivos `EXACT` + el bloque `BLOCK` de la versión instalada | **DevOps** (generado al empaquetar) |

`.claude/skills/VERSION` se conserva porque `scripts/sync-skills.mjs:26-27` ya lo lee y lo imprime.
Pasa a ser derivado: la fuente es `.claude/VERSION` y una divergencia entre los dos significa
instalación parcial — exactamente el síntoma del `cp` a mano.

## 4. Qué significa cada bump (semver del framework)

**MAJOR** — cambia un contrato. Artefactos o auditorías que hoy pasan pueden dejar de pasar.
Exige nota de migración en `DECISIONS.md` y actualización de `contracts/paths.md` en el mismo commit:
- se mueve, renombra o anida una ruta del §4 de `contracts/paths.md`;
- cambia el contrato de un bloque de métricas que el auditor lee (`## Implement`,
  `tasks_completadas`, `tests`, `## Gate Override`, `resultado: APROBADO`);
- se quita o se renombra un campo del registro que ya se usa;
- un WARN del auditor pasa a FAIL (rompe CI en repos que hoy están verdes);
- cambia el formato de `feature.status.md` o el patrón de tasks (`T\d{3}`).

**MINOR** — agrega capacidad sin invalidar nada previo:
- comando, skill o referencia nueva;
- CHECK nuevo que arranca en WARN, o que solo aplica si existe un archivo opcional
  (`catalog/product.yaml`);
- flag nuevo con default equivalente al comportamiento anterior (`--root`);
- campo opcional nuevo en el registro (`meta.repo`, `catalog`).

**PATCH** — no cambia contratos ni comportamiento observable:
- redacción de prompts, ejemplos, mensajes de error;
- bugfix de script cuya salida correcta ya era la esperada.

**Regla de oro:** si un repo instalado tiene que **tocar** algún artefacto para volver a pasar el
auditor, era MAJOR. Si solo tiene que actualizar archivos de capa A, era MINOR o PATCH.

## 5. Qué verifica quién

| Pregunta | Quién responde | Cómo |
|---|---|---|
| ¿La instalación está íntegra? | **DevOps** (CI) | `.claude/MANIFEST.sha256` vs el árbol |
| ¿Este repo quedó atrás respecto del último release? | **DevOps** (CI) | `.claude/VERSION` vs el tag upstream |
| ¿La instalación es internamente consistente? | **Auditor** (`pnpm audit:sdd`) | `.claude/VERSION` existe y coincide con `.claude/skills/VERSION`; imprime la versión y el `DATA_ROOT` en la cabecera del reporte |
| ¿Qué es una versión? | **Este documento** (modelo) | §4 |

El auditor **no** compara contra upstream: no tiene forma determinista de saber cuál es el último
release, y sería una llamada de red dentro de un script que se define como offline y sin IA.

## 6. Consecuencia abierta: los skills son globales, no del repo

`scripts/sync-skills.mjs:20,45-49` copia `.claude/skills/*` a `~/.claude/skills/` con
`force: true`. El destino es **el usuario, no el repo**. Con dos repos instalados en la misma
máquina y versiones distintas del framework, el último `pnpm skills:sync` gana y el otro repo
queda corriendo skills que no son los suyos. `proguide update skills` escribe en el mismo lugar
(`CLAUDE.md` → sección QA funcional E2E).

Esto no lo resuelve el versionado por sí solo. Queda declarado como riesgo conocido con dos salidas
posibles, a decidir cuando se cierre el mecanismo de distribución (DevOps):
1. que `sync-skills` estampe la versión sincronizada y falle si otro repo pisó una distinta, o
2. mover los skills a scope de proyecto y dejar de sincronizar a `HOME`.
