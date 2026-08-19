# Registro de decisiones — SDD

Este archivo registra cada vez que una decisión humana desvía o amplía
lo establecido en el brief original (input.md).
Sirve como trazabilidad entre lo que se pidió y lo que se implementó.

---

## Reglas de status

El campo `status` arranca como `accepted` por defecto. Los valores válidos son:
- **accepted** — decisión vigente y aplicada
- **proposed** — decisión en discusión, no implementada todavía
- **deprecated** — decisión ya no aplica (feature removida, contexto obsoleto)
- **superseded by [FECHA del reemplazo]** — una decisión posterior la invalidó. Siempre referenciar la fecha de la decisión que la reemplaza.

Cuando se invalida una decisión vieja: editar SOLO el campo `status` de la entrada vieja a `superseded by [FECHA]` y agregar una entrada nueva con `status: accepted` que describa el reemplazo.

---

> **Las cuatro entradas que siguen están en `status: proposed`.** Son la propuesta de arquitectura
> multi-repo redactada para la firma del dueño del modelo. Ninguna está implementada. Al firmar:
> cambiar `status` a `accepted`, completar **Decidido por** con nombre y rol, y recién entonces
> ejecutar la lista de cambios de código.

---

## 2026-08-19 Esquema de features.yaml para multi-repo: registro local + catálogo de negocio compartido

**feature_id:** global
**command_origin:** análisis de arquitectura (multi-repo vulnops / web-vulnops)
**status:** proposed

**Gap o motivo:** `specs/_registry/features.yaml` mezcla en una misma entrada identidad de negocio
(`discovery_id`, `epic`, `release`, `size`) con estado local del repo (`status`, `owner`, `sprint`,
`touches`, `domain`, `closed`) — ver `specs/_registry/features.template.yaml:8-26`. Por eso el
archivo no puede ser ni compartido (el estado local de un repo no aplica al otro) ni puramente
local (la identidad de negocio queda duplicada y deriva). Hoy se resolvía copiándolo con `cp`, que
propagaba estado ajeno.

**Alternativas consideradas:**
(a) `features.yaml` queda local y `discovery_id`/`epic`/`release`/`size` son la única referencia
hacia arriba, sin catálogo.
(b) Partir el registro en dos archivos: catálogo de negocio compartido + registro local que lo
referencia.
(c) Un único registro compartido con un campo `repo:` por entrada.

**Por qué se descartaron:** (a) no da una fuente única para la identidad de negocio: `epic`,
`release` y `size` quedan copiados en N repos, sin nada contra qué validarlos, y un `discovery_id`
mal tipeado es indetectable. (c) es el problema actual con otro nombre: un archivo compartido y
mutable donde el `status` y los `touches` de un repo viajan al otro; además rompe el CHECK 2 de
colisiones (`scripts/sdd-audit.mjs:187-203`), que cruza `touches` de features `OPEN` asumiendo un
solo filesystem, y haría fallar el CHECK 1 (`:155-159`), que exige `specs/<id>/` para toda entrada
del registro.

**Decisión tomada:** se adopta (b), pero **partiendo tipos de registro, no partiendo el archivo del
registro**:

1. `specs/_registry/features.yaml` **queda local, uno por repo, y conserva su forma actual**. Todos
   los campos existentes mantienen su significado. Ningún repo de un solo codebase cambia.
2. Se agrega un bloque opcional `meta:` al tope del registro. El auditor ya lee
   `registry.features ?? []` (`scripts/sdd-audit.mjs:144-145`), así que una clave hermana es
   retrocompatible:
   ```yaml
   meta:
     repo: vulnops                    # identidad de este codebase
     catalog: catalog/product.yaml     # o null si el repo es standalone
   features: [...]
   ```
3. Se agrega **un** archivo de capa B: `catalog/product.yaml`, top-level (no dentro de `specs/`),
   read-only, generado aguas arriba por el discovery-model y vendoreado por DevOps:
   ```yaml
   meta:
     source: discovery-model
     generated: YYYY-MM-DD
   features:
     - discovery_id: F031
       title: SSO con Google Workspace
       epic: EP004
       release: R2
       size: M
       acceptance:                      # criterios de negocio, no US-N de un repo
         - El usuario entra con su cuenta corporativa sin crear password
       implemented_in: [vulnops, web-vulnops]
   ```
   Sin `status`, sin `owner`, sin `touches`, sin `domain`. Esos campos no existen en capa B.
4. `epic`, `release` y `size` en el registro local pasan a ser **caché derivada**: se permiten por
   retrocompatibilidad, pero manda el catálogo. Divergencia = WARN.
5. **Si `catalog/` no existe, el repo es standalone y todos los chequeos de catálogo se saltean sin
   WARN.** El comportamiento de un repo de un solo codebase es idéntico al de hoy.

**Motivo:** el catálogo de negocio no es un artefacto nuevo del modelo SDD — es la salida del
discovery-model, que ya es dueño de `F001`/`EP001`/`R1`. SDD debe *consumir una proyección*
read-only, no inventar una segunda fuente de verdad ni volver a compartir estado mutable. La
partición correcta es por tipo de registro (identidad de negocio vs. estado de implementación), no
por archivo: el archivo del registro es y sigue siendo local.

**Artefactos modificados:** `specs/_registry/features.template.yaml` (bloque `meta` + nota de que
`epic`/`release`/`size` son caché), `contracts/paths.md` (nuevo), `CLAUDE.md`.
Comandos a tocar: `/sdd-generate` (escribe `meta.repo`, lee el catálogo para completar los campos de
negocio en lugar de copiarlos del brief), `/sdd-refine` (si hay catálogo, valida el `discovery_id`
del brief contra él antes de generar `input.md`), `/sdd-health` (reporta features locales sin
`discovery_id` cuando el repo declara catálogo), `/sdd-fix` (fixes nacen sin `discovery_id`, hay que
decirlo explícito para que el CHECK 7 no los marque). Auditor: **CHECK 7 nuevo** (ver entrada del
layout) y CHECK 1 pasa a leer `meta` sin romperse.

**Decidido por:** _PENDIENTE DE FIRMA — dueño del modelo_

---

## 2026-08-19 Espacio de IDs entre repos: `id` es local, `discovery_id` es la única clave de join

**feature_id:** global
**command_origin:** análisis de arquitectura (multi-repo vulnops / web-vulnops)
**status:** proposed

**Gap o motivo:** hoy `id` es simultáneamente nombre de carpeta (`specs/<id>/`), clave del registro
y prefijo del archivo de métricas (`metrics/<id>-metrics.md`) — `scripts/sdd-audit.mjs:155`, `:178-184`,
`:207`. El modelo no dice qué pasa cuando la misma feature de negocio se implementa en dos repos.

**Alternativas consideradas:**
(i) La feature lleva el **mismo `id`** en los dos repos, con `plan.md`/`tasks.md` distintos.
(ii) Cada repo asigna su propio `id` y ambos llevan el mismo `discovery_id`.

**Por qué se descartaron:** (i) exige un asignador de números compartido entre repos — `/sdd-generate`
propone "el siguiente número disponible" mirando solo `specs/` local
(`.claude/commands/sdd-generate.md:16`), así que las secuencias de vulnops y web-vulnops divergen
desde la primera feature. Forzar la igualdad reintroduce exactamente el acoplamiento que se está
removiendo. Peor: crea identidad falsa — `007-sso-login` en la API y en la web tienen scope, tasks y
evidencia distintos, y tratarlos como "lo mismo" es el mecanismo que ya produjo
`feature.status.md` contradiciendo a la fuente.

**Decisión tomada:** se adopta (ii).
- `id` es **local al repo** y único dentro de él. **Nadie puede asumir que el mismo `id` significa lo
  mismo en otro repo.**
- `discovery_id` es la **única** clave de join cross-repo. Puede aparecer en varios registros.
- Convención no verificada: se conserva el slug y varía el número —
  `vulnops: 012-sso-login` ↔ `web-vulnops: 007-sso-login`, ambos `discovery_id: F031`.
- Dentro de un mismo repo, dos features `OPEN` con el mismo `discovery_id` son **WARN** (trabajo
  duplicado o feature partida sin registrar). No es FAIL: partir una feature grande en dos slices es
  legítimo.
- La vista cross-repo no vive en ningún repo. Se computa uniendo registros, o se lee del
  `implemented_in` del catálogo.

**Motivo:** el modelo no tiene —ni debe tener— un mecanismo de coordinación entre repos en tiempo de
`/sdd-generate`. Cualquier regla que exija igualdad de `id` es una regla que se va a violar en
silencio la primera vez que dos personas generen features el mismo día en repos distintos.

**Artefactos modificados:** `contracts/paths.md` §5, `CLAUDE.md`,
`specs/_registry/features.template.yaml`. Comando a tocar: `/sdd-generate` (dejar explícito que el
número es local y no se coordina). Auditor: CHECK 7 agrega el WARN de `discovery_id` duplicado
entre features `OPEN`.

**Decidido por:** _PENDIENTE DE FIRMA — dueño del modelo_

---

## 2026-08-19 Definición y versionado de la capa A (framework)

**feature_id:** global
**command_origin:** análisis de arquitectura (multi-repo vulnops / web-vulnops)
**status:** proposed

**Gap o motivo:** existe `.claude/skills/VERSION` (`1.1.0`), leído solo por
`scripts/sync-skills.mjs:26-27`, y nada más. No hay lista de qué archivos componen el framework, así
que DevOps no puede construir el manifiesto de integridad ni el check de CI, y no hay forma de
distinguir "instalación vieja" de "instalación editada a mano". Es la dependencia crítica que bloquea
el mecanismo de distribución.

**Alternativas consideradas:**
(1) Versionar solo los skills, como hoy.
(2) Definir la capa A por globs (`.claude/**`, `scripts/**`).
(3) Lista explícita de archivos con tipos de verificación + semver con reglas escritas.

**Por qué se descartaron:** (1) deja fuera comandos, scripts y hooks, que es donde vive la mayor
parte del comportamiento. (2) arrastra archivos que **no** son framework y que legítimamente difieren
por repo: `.claude/settings.json` (permisos y hook del repo), `.claude/settings.local.json` (ignorado
por git), `.mcp.json` (contiene la ruta de máquina `C:\tools\cortex-mcp.exe`); además un glob hace
que agregar un comando sea invisible en el diff.

**Decisión tomada:**
1. La capa A queda definida por **lista explícita** en `contracts/framework-files.txt`, con tres tipos
   de verificación: `EXACT` (hash del archivo completo), `BLOCK` (solo el contenido entre
   `<!-- SDD:FRAMEWORK BEGIN -->` y `<!-- SDD:FRAMEWORK END -->`, para `CLAUDE.md`) y `MERGE` (claves
   declaradas, para `package.json`). Criterio de inclusión: *si dos repos pueden legítimamente tener
   contenido distinto en ese archivo, no es capa A.*
2. Se crea `.claude/VERSION` como **fuente única** de la versión del framework instalado.
   `.claude/skills/VERSION` se conserva (ya lo lee `sync-skills`) pero pasa a ser derivado y debe
   coincidir: una divergencia es instalación parcial.
3. Semántica de bump — regla de oro: **si un repo instalado tiene que tocar algún artefacto para
   volver a pasar el auditor, era MAJOR.** MAJOR = cambia el layout, el contrato de un bloque de
   métricas que el auditor lee, el formato de `feature.status.md`, o un WARN pasa a FAIL. MINOR =
   comando/skill/CHECK nuevo (arrancando en WARN o condicionado a un archivo opcional), flag nuevo con
   default equivalente, campo opcional nuevo. PATCH = redacción y bugfixes sin cambio observable.
   Detalle en `contracts/framework.md` §4.
4. **El auditor no compara contra upstream.** Verifica consistencia interna (existe `.claude/VERSION`
   y coincide con `.claude/skills/VERSION`) e imprime versión + `DATA_ROOT` en la cabecera del
   reporte. "¿Estoy atrás del último release?" y "¿la instalación está íntegra?" son de DevOps:
   requieren red y un manifiesto firmado, dos cosas ajenas a un auditor offline y sin IA.
5. Queda registrado como **riesgo conocido, sin resolver**: `scripts/sync-skills.mjs:20,45-49` copia
   los skills a `~/.claude/skills/` con `force: true` — destino usuario, no repo. Con dos repos en
   versiones distintas en la misma máquina, el último `pnpm skills:sync` gana. Las dos salidas
   posibles están en `contracts/framework.md` §6; se decide junto con el mecanismo de distribución.

**Motivo:** DevOps no puede verificar lo que no está enumerado, y no puede empaquetar lo que está
definido por glob sobre carpetas que mezclan capas. La lista explícita además convierte "agregamos un
comando" en un diff visible con su bump correspondiente.

**Artefactos modificados:** `contracts/framework.md` (nuevo), `contracts/framework-files.txt` (nuevo),
`.claude/VERSION` (nuevo), `CLAUDE.md` (bloque con marcadores). Auditor: CHECK 8 nuevo (versión).

**Decidido por:** _PENDIENTE DE FIRMA — dueño del modelo_

---

## 2026-08-19 El layout es interfaz: contrato de rutas y separación DATA_ROOT / FRAMEWORK_ROOT

**feature_id:** global
**command_origin:** análisis de arquitectura (multi-repo vulnops / web-vulnops)
**status:** proposed

**Gap o motivo:** el modelo no tiene contrato de rutas (el discovery-model hermano sí:
`contracts/paths.md`). Dos consecuencias verificadas contra el código:

1. **Reorganizar rompe el auditor entero.** Mover `metrics/`, `graph/`, `drafts/` y `handoffs/`
   adentro de `specs/` —que es lo que se hizo en las copias— produce 5 FAIL cuya causa real queda
   oculta: cuatro acusan a las carpetas de ser features no registradas
   (`scripts/sdd-audit.mjs:177-185`, que solo exceptúa nombres con `_`) y uno acusa a la feature
   cerrada de no tener métricas. Y lo más grave: la pérdida del grafo de dominio degrada a **WARN**
   (`:296-297`), así que el routing de contexto desaparece sin bloquear nada.
2. **El auditor no puede apuntar a otro root, y falla en verde.** `ROOT` se deriva de la ubicación
   del script (`scripts/sdd-audit.mjs:19`) y no lee `process.argv`. En la instalación como submódulo
   que el propio `README.md` documenta (Opción C, `.sdd/scripts/`), audita el submódulo y no el repo
   anfitrión; como no encuentra registro, toma el camino "modelo sin correr, nada que auditar"
   (`:138-143`) e **imprime AUDIT PASA con exit 0**. Verificado empíricamente. El patrón `--root` ya
   existe en `scripts/gen-kanban.mjs:15-19`, pero con default distinto al de
   `scripts/kanban-server.mjs:26`: mismo flag, semántica distinta.

**Alternativas consideradas:** dejar el layout como convención documentada en el `README.md`; o
hacer los scripts tolerantes al layout (buscar `specs/` hacia arriba y hacia abajo).

**Por qué se descartaron:** la convención no documentada en un contrato es exactamente lo que ya
falló — la raíz quedó intacta y el problema fue invisible hasta que alguien auditó una copia.
Auto-descubrir el layout esconde el error en lugar de reportarlo: un auditor que "encuentra" el árbol
equivocado es peor que uno que falla.

**Decisión tomada:**
1. Se adopta `contracts/paths.md` como contrato: por carpeta y archivo, quién escribe, a qué capa
   pertenece y si el auditor la lee.
2. **El layout es interfaz.** Mover, renombrar o anidar cualquiera de las rutas de su §4 exige, en el
   mismo commit: entrada en `DECISIONS.md` vía `/sdd-log`, actualización de `contracts/paths.md`, y
   bump **MAJOR** de `.claude/VERSION`. Los agentes no reorganizan esas carpetas ni cuando se les pide
   de pasada: avisan que es cambio de contrato y piden la decisión.
3. **Dos roots explícitos.** `DATA_ROOT` (el repo auditado) se resuelve por `--root <path>` y por
   defecto `process.cwd()` — **nunca** desde la ubicación del script. `FRAMEWORK_ROOT` (dónde está
   instalado el framework) sí se resuelve desde la ubicación del script. `sdd-audit.mjs` acepta
   `--root`; `gen-kanban.mjs` cambia su default a `process.cwd()` para unificar semántica con
   `kanban-server.mjs`, manteniendo `--out` resuelto contra `cwd` para que `pnpm kanban` y
   `pnpm kanban:demo` sigan escribiendo donde escriben hoy.
4. **Se elimina el falso verde:** si el `DATA_ROOT` resuelto no contiene ninguna de `specs/`,
   `metrics/` o `graph/`, el auditor FALLA ("layout no encontrado en `<DATA_ROOT>`") en lugar de pasar.
   Y todo script imprime el `DATA_ROOT` resuelto en la cabecera.
5. **El auditor sí valida `discovery_id` contra el catálogo (CHECK 7), condicionado a que el catálogo
   exista.** `discovery_id` inexistente en el catálogo = **FAIL** (es un typo en una clave de join,
   determinista y baratísimo de detectar — el caso de uso central del auditor). `epic`/`release`/`size`
   locales que divergen del catálogo = **WARN** (son caché). Feature local sin `discovery_id` en un
   repo que declara catálogo = **WARN**, y se saltea para `type: fix`. Sin `catalog/`, el CHECK 7 no
   corre y no emite nada.

**Motivo:** un contrato de rutas sirve para que romperlo sea un acto deliberado y visible en el diff,
no un accidente de orden. Y un auditor que puede apuntar a un root explícito es el prerrequisito para
que DevOps lo corra en CI sobre cualquier layout de instalación — hoy no puede.

**Artefactos modificados:** `contracts/paths.md` (nuevo), `CLAUDE.md`, `scripts/sdd-audit.mjs`,
`scripts/gen-kanban.mjs`, `package.json` (script `audit:sdd:demo`), `README.md` (Opción C hoy
documenta una instalación que no funciona).

**Decidido por:** _PENDIENTE DE FIRMA — dueño del modelo_
