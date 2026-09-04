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

> **Gates 0.1 y 0.3 firmados el 2026-08-25** por Patricio Millán (dueño del modelo). Las entradas 1,
> 2, 3 y 4 (arquitectura multi-repo) y la 6 (Cortex) están en `accepted` y autorizan la ejecución de
> `contracts/rollout-multirepo.md`. La entrada **5 (arquitectura por capacidades) sigue en
> `proposed`**: se firma aparte, y el rollout pide pilotear sus puntos 5.3 y 5.5 en una feature antes
> de fijarlos.
>
> **Estado de ejecución al momento de la firma.** Las entradas 3 y 4 ya estaban parcialmente
> ejecutadas como spike, por pedido explícito del dueño del modelo: `--root` y el CHECK 0 en
> `scripts/sdd-audit.mjs`, `.claude/VERSION` y `.claude/skills/VERSION` en `1.2.0`, los tres
> contratos de `contracts/` y la sección `1.2.0` del `CHANGELOG.md`. La firma las convierte de spike
> reversible en decisión vigente. Lo que falta está listado en `contracts/rollout-multirepo.md`; los
> CHECK 7, 8 y 9 y `.claude/MANIFEST.sha256` todavía no existen.
>
> **Enmendadas el 2026-08-19, antes de la firma:** las entradas 1, 2 y 4 se reescribieron después de
> leer `discovery-model/contracts/handoff.md`, `contracts/ids.md` y `registry/capabilities.yaml`. La
> versión anterior proponía un catálogo de negocio compartido y un espacio de IDs local; las dos
> cosas estaban resueltas aguas arriba y de otra forma. Se enmiendan en lugar de marcarse
> `superseded` porque nunca estuvieron vigentes. **Lo firmado es cada entrada con su enmienda
> incluida.** Cada entrada afectada declara qué cambió.

---

## 2026-08-27 Mecanismo de distribución de la capa A: materialización verificada por manifiesto

**feature_id:** global
**command_origin:** ejecución del ítem 4.1 de `contracts/rollout-multirepo.md`
**status:** accepted

**Gap o motivo:** la capa A estaba definida (`contracts/framework.md`) y listada
(`contracts/framework-files.txt`) pero no había con qué distribuirla ni con qué probar que una
instalación fuera íntegra. El ítem 4.2 del rollout advierte que no se puede distribuir a un segundo
repo antes del 4.1: sin manifiesto, una edición dentro del bloque `SDD:FRAMEWORK` de `CLAUDE.md` no
la detecta nada. En la práctica el modelo se copiaba con `cp`, que es exactamente el modo de falla
que el CHECK 8 diagnostica después como "instalación parcial".

**Alternativas consideradas:**
(a) Materializar la capa A en la raíz del repo destino y verificarla contra un manifiesto de hashes
que viaja con la distribución.
(b) Montar el framework en una subcarpeta (`.sdd/`) y apuntar los comandos ahí, sin copiar.
(c) Symlinks o junctions desde `.claude/` hacia la carpeta del framework.
(d) Dejar la verificación en manos del auditor (`pnpm audit:sdd`) en lugar de un script aparte.

**Por qué se descartaron:** (b) no funciona: la CLI de Claude lee `.claude/commands/`,
`.claude/skills/` y `.claude/hooks/` desde la raíz del proyecto, sin punto de configuración, y el
bloque `SDD:FRAMEWORK` de `CLAUDE.md` tendría que referenciar rutas distintas según dónde esté
montado el framework — con lo que deja de ser idéntico byte a byte y su hash no cierra en ningún
lado. (c) falla en Windows, que es el entorno del equipo: git checkoutea symlinks como archivos de
texto salvo `core.symlinks=true`, y las junctions no las versiona git. (d) rompe la separación de
`contracts/framework.md` §5: el auditor contesta consistencia interna y está definido como offline
y sin IA; la integridad es una pregunta distinta, con otro insumo (el manifiesto) y otro dueño
(DevOps / CI).

**Decisión:** (a). El transporte —submódulo, paquete, clone— deja los bytes en algún lado;
`sdd-install` los materializa en las rutas que `contracts/paths.md` fija, y `sdd-verify` prueba
contra `.claude/MANIFEST.sha256` que son los de esa versión. Consecuencias:

- **El transporte deja de ser una decisión de arquitectura.** Cualquiera de los tres produce el
  mismo árbol y el mismo manifiesto. Se elige por ergonomía.
- **Los hashes se calculan sobre contenido normalizado** (CRLF→LF, sin BOM), así que `.gitattributes`
  deja de ser prerequisito del ítem 4.1.
- **`sdd-install` se niega a pisar drift.** Si el destino tiene capa A editada localmente, aborta y
  la lista. Pisarlo en silencio borraría la evidencia de que alguien editó capa A en destino, que es
  justo lo que el modelo prohíbe.
- **El control de versión entre repos es un gate en el CI de cada consumidor**
  (`.github/workflows/sdd-version.yml`), no un inventario centralizado: un submódulo o un paquete no
  le dan a upstream ninguna forma de saber quién lo consume. Atrás por MINOR/PATCH avisa; atrás por
  un MAJOR rompe el build. Que un repo se quede atrás es una opción legítima; lo que no puede pasar
  es que se quede atrás sin enterarse.
- **`pmillanmc/sdd-model-v1.1` queda como repo canónico** — el que publica los releases que el gate
  consulta. Cierra el ítem 0.2 del rollout para la capa A. El README documenta `patohed/sdd-model` y
  hay que corregirlo.

**Artefactos modificados:** `scripts/sdd-manifest.mjs`, `scripts/sdd-install.mjs`,
`scripts/sdd-verify.mjs`, `scripts/lib/framework.mjs` y `.github/workflows/sdd-version.yml` (nuevos);
`contracts/framework-files.txt`, `package.json`, `.github/workflows/sdd-audit.yml`, `CHANGELOG.md`,
`.claude/VERSION`, `.claude/skills/VERSION` y el marcador de `CLAUDE.md` (bump a 1.3.0);
`.claude/MANIFEST.sha256` (generado).

**Decidido por:** Patricio Millán (dueño del modelo).

---

## 2026-08-19 Esquema de features.yaml para multi-repo: registro local, identidad de negocio por referencia

**feature_id:** global
**command_origin:** análisis de arquitectura (un producto en N codebases)
**status:** accepted
**Enmendada:** 2026-08-19 — se cae el catálogo compartido. Ver **Enmienda** al final de la entrada.

**Gap o motivo:** `specs/_registry/features.yaml` mezcla en una misma entrada identidad de negocio
(`discovery_id`, `epic`, `release`, `size`) con estado local del repo (`status`, `owner`, `sprint`,
`touches`, `domain`, `closed`) — ver `specs/_registry/features.template.yaml:8-26`. Por eso el
archivo no puede ser ni compartido (el estado local de un repo no aplica al otro) ni puramente
local (la identidad de negocio queda duplicada y deriva). Hoy se resolvía copiándolo con `cp`, que
propagaba estado ajeno.

**Alternativas consideradas:**
(a) `features.yaml` queda local y `discovery_id`/`epic`/`release`/`size` son la única referencia
hacia arriba.
(b) Partir el registro en dos archivos: catálogo de negocio compartido + registro local que lo
referencia.
(c) Un único registro compartido con un campo `repo:` por entrada.
(d) Vendorear un `catalog/product.yaml` read-only a cada repo, generado aguas arriba.

**Por qué se descartaron:** (c) es el problema actual con otro nombre: un archivo compartido y
mutable donde el `status` y los `touches` de un repo viajan al otro; además rompe el CHECK 2 de
colisiones (`scripts/sdd-audit.mjs:187-203`), que cruza `touches` de features `OPEN` asumiendo un
solo filesystem, y haría fallar el CHECK 1 (`:155-159`), que exige `specs/<id>/` para toda entrada
del registro. (b) y (d) crean una segunda copia sincronizada del `registry/features.yaml` de
Discovery: es exactamente lo que el contrato hermano advierte —*"dos logs sincronizados divergen;
dos logs referenciados no"* (`discovery-model/contracts/handoff.md`)— y obligan a mantener un
transporte que puede quedar viejo, con lo cual el chequeo miente en las dos direcciones.

**Decisión tomada:** se adopta (a), reforzada. Se parten los **tipos de registro**, no el archivo:

1. `specs/_registry/features.yaml` **queda local, uno por repo, y conserva su forma actual**. Todos
   los campos existentes mantienen su significado. Ningún repo de un solo codebase cambia.
2. Se agrega un bloque opcional `meta:` al tope del registro. El auditor ya lee
   `registry.features ?? []` (`scripts/sdd-audit.mjs:144-145`), así que una clave hermana es
   retrocompatible:
   ```yaml
   meta:
     repo: <nombre-del-codebase>   # identidad autodeclarada; no se deduce del repo git
   features: [...]
   ```
3. **No se crea ningún archivo de capa B en el repo.** El payload de la capa B es el
   `drafts/brief.md` que entrega el handoff de Discovery, con su frontmatter versionado
   (`contract_version`, `discovery_id`, `feature_id`, `domain`, `size`, `epic`, `release`,
   `capability`, `users`, `proyecto_id`, `vision_ref`, `decisions`). Ese mecanismo **ya existe y ya
   está contratado** en `discovery-model/contracts/handoff.md`, con gate de exportación de 7
   condiciones. La identidad de negocio se **referencia por ID**, no se copia.
4. `epic`, `release` y `size` en el registro local son **registro de lo que llegó**, no caché a
   reconciliar contra una fuente presente en el repo. Nadie los "sincroniza": son evidencia del
   handoff que ocurrió.
5. `/sdd-generate` propaga `discovery_id` y `contract_version` a `specs/<id>/feature.status.md`.
   Es el único registro **durable por feature**: `drafts/brief.md` e `input.md` tienen nombre fijo y
   la feature siguiente los sobreescribe. `feature.status.md` ya existe, es por feature, y el
   auditor ya lo parsea con `parseStatusMd` (`scripts/sdd-audit.mjs:42-49`), que extrae cualquier
   `campo: valor`. Cero parser nuevo, cero archivo nuevo.
6. La vista de producto ("¿dónde se implementó F031?") **no vive en ningún repo de código**: es el
   `registry/features.yaml` de Discovery, que ya guarda el `feature_id` de SDD calculado en el
   handoff.

**Motivo:** el catálogo de negocio no es un artefacto del modelo SDD — es la salida del
discovery-model, que ya es dueño de `F001`/`EP001`/`R1`/`BC01`. SDD debe consumir el mensaje del
handoff y guardar constancia de lo que llegó, no mantener una réplica del registro ajeno. La
partición correcta es por tipo de registro (identidad de negocio vs. estado de implementación); el
archivo del registro es y sigue siendo local.

**Artefactos modificados:** `specs/_registry/features.template.yaml` (bloque `meta` con `repo`; nota
de que `epic`/`release`/`size` son constancia del handoff), `contracts/paths.md`, `CLAUDE.md`.
Comandos a tocar: `/sdd-generate` (escribe `meta.repo`; propaga `discovery_id` y `contract_version` a
`feature.status.md`), `/sdd-refine` (ya valida `contract_version`; agrega que un `contract_version`
desconocido no bloquea pero se avisa), `/sdd-fix` (los fixes nacen sin `discovery_id`, declararlo
explícito), `/sdd-health` (lee el CHECK 7 sin recalcularlo). Auditor: **CHECK 7 nuevo**, de
consistencia interna (ver entrada del layout).

**Enmienda 2026-08-19:** la versión original de esta entrada adoptaba (b) y creaba
`catalog/product.yaml` como capa B vendoreada, con `meta.catalog` en el registro y un CHECK 7 de
integridad referencial contra ese catálogo. Se cae por evidencia: el handoff de Discovery ya entrega
la identidad de negocio por feature, versionada y con gate, y un catálogo replicado habría sido la
segunda copia mutable que causó el incidente original. Efecto neto: un directorio menos, tres
archivos menos, un campo menos en el registro, un transporte menos para DevOps y una rama
condicional menos en el auditor.

**Decidido por:** Patricio Millán — dueño del modelo (2026-08-25)

---

## 2026-08-19 Espacio de IDs entre repos: dos regímenes según el origen de la feature

**feature_id:** global
**command_origin:** análisis de arquitectura (un producto en N codebases)
**status:** accepted
**Enmendada:** 2026-08-19 — refutada la premisa. Ver **Enmienda** al final de la entrada.

**Gap o motivo:** hoy `id` es simultáneamente nombre de carpeta (`specs/<id>/`), clave del registro
y prefijo del archivo de métricas (`metrics/<id>-metrics.md`) — `scripts/sdd-audit.mjs:155`,
`:178-184`, `:207`. El modelo no dice qué pasa cuando la misma feature de negocio se implementa en
dos repos.

**Alternativas consideradas:**
(i) La feature lleva el **mismo `id`** en los dos repos, con `plan.md`/`tasks.md` distintos.
(ii) Cada repo asigna su propio `id` y ambos llevan el mismo `discovery_id`.
(iii) Dos regímenes según el origen: derivado aguas arriba si vino de Discovery, local si nació en
el repo.

**Por qué se descartaron:** (ii) rompe la trazabilidad que Discovery ya garantiza: su
`contracts/ids.md` declara que el `feature_id` de SDD *"se calcula al hacer el handoff y a partir de
ahí es inmutable: es la única forma de seguir el hilo entre los dos modelos"*. Renumerar localmente
lo invalida. (i) es correcta para las features de Discovery pero no dice nada de las que nacen en el
repo, que siguen necesitando un número y no tienen `discovery_id` del cual derivarlo.

**Decisión tomada:** se adopta (iii).

1. **Feature originada en Discovery:** el `id` **se deriva y es idéntico en todos los repos** que la
   implementen. La regla de derivación ya está contratada:
   `F031-sso-login` → `031-sso-login` — quitar el prefijo `F`, conservar el slug
   (`discovery-model/contracts/ids.md`). El número lo asigna el contador atómico de
   `registry/ids.yaml` de Discovery, que solo sube y nunca se reutiliza. **No hace falta ningún
   asignador nuevo ni coordinación entre repos.**
2. **Feature nacida en el repo** (deuda técnica, un fix que creció): el `id` es local y usa el
   **rango reservado `9nn-`** (`901-refactor-cache`, `902-migrar-orm`). Cero código: nada en el
   modelo parsea el número — el `id` es nombre de carpeta, clave del registro, prefijo del archivo
   de métricas y atributo del DOM en el kanban. Parte el espacio de numeración en dos y evita que
   una feature local bloquee para siempre la llegada de la feature de Discovery con el mismo
   número, que es lo que haría hoy el gate #5 del handoff ("el `feature_id` ya existe en el repo
   destino → se rechaza") combinado con la regla de Discovery de no renumerar jamás.
3. `discovery_id` es la **clave de join entre repos** a nivel feature. Puede aparecer en varios
   registros.
4. `domain` (el `sdd_domain` de `registry/capabilities.yaml`) es la **clave de join entre repos a
   nivel módulo**: dos repos que declaran `domain: reservas` hablan de la misma capacidad de
   negocio, sin compartir ningún archivo, porque el nombre lo asignó Discovery.
5. Dentro de un mismo repo, dos features `OPEN` con el mismo `discovery_id` son **WARN**: trabajo
   duplicado o feature partida sin registrar. No es FAIL — partir una feature en dos slices es
   legítimo.
6. **El rango `9nn` se verifica**: el CHECK 7 emite **WARN** cuando `id` está en `9nn-` y la entrada
   declara `discovery_id`, o cuando declara `discovery_id` y el `id` está fuera del rango sin derivar
   de él. Es una comparación de strings, cero costo. Una convención que nada verifica contradice la
   tesis del modelo —*lo que el auditor verifica, los agentes no lo recalculan*— y se degrada en la
   tercera feature: o se promueve a check, o no es una regla.
   Límite aceptado: un proyecto con más de 900 features de Discovery volvería a colisionar.
7. El costo de **no** tener esta regla es diferido y lo paga otro: una feature local `031-*` bloquea
   para siempre el handoff de `F031`, el gate #5 de Discovery rechaza la exportación, Discovery no
   renumera nunca, y renombrar la feature local toca cuatro lugares (`specs/`, `metrics/`, la clave
   del registro y las referencias en `DECISIONS.md`). Si la feature ya está `CLOSED`, además hay que
   reescribir evidencia de auditoría. El WARN aparece meses antes que el bloqueo.

**Motivo:** el modelo no tiene ni debe tener coordinación entre repos en tiempo de
`/sdd-generate`. La resolución no era elegir entre "mismo id" y "dos ids": era darse cuenta de que
para las features de Discovery la decisión ya estaba tomada aguas arriba, y que lo único que faltaba
era una regla para las features que no vienen de ahí.

**Artefactos modificados:** `contracts/paths.md` §5, `CLAUDE.md`,
`specs/_registry/features.template.yaml`. Comando a tocar: `/sdd-generate` (dos regímenes al
proponer `feature_id`: derivar del `discovery_id` si el brief lo trae —hoy ya lo hace—, y usar el
rango `9nn` si la feature nace en el repo). Auditor: el CHECK 7 verifica la derivación
`discovery_id` → `id` y el WARN de `discovery_id` duplicado entre features `OPEN`.

**Enmienda 2026-08-19:** la versión original decidía que el `id` era local en todos los casos y que
*"nadie puede asumir que el mismo `id` significa lo mismo en otro repo"*, con el argumento de que
igualar números exigiría un asignador compartido. El argumento es falso: el asignador compartido ya
existe (`registry/ids.yaml` de Discovery, con reserva atómica), y la regla de derivación
`F031` → `031-slug` ya está contratada. Para features de Discovery, el mismo `id` en los dos repos
es lo correcto y no requiere nada nuevo.

**Decidido por:** Patricio Millán — dueño del modelo (2026-08-25)

---

## 2026-08-19 Definición y versionado de la capa A (framework)

**feature_id:** global
**command_origin:** análisis de arquitectura (un producto en N codebases)
**status:** accepted

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
   comando/skill/CHECK nuevo (arrancando en WARN o condicionado a un campo nuevo opcional), flag nuevo
   con default equivalente, campo opcional nuevo. PATCH = redacción y bugfixes sin cambio observable.
   Detalle en `contracts/framework.md` §4.
4. **El auditor no compara contra upstream.** Verifica consistencia interna (existe `.claude/VERSION`
   y coincide con `.claude/skills/VERSION`; los marcadores `SDD:FRAMEWORK` de `CLAUDE.md` aparecen
   exactamente una vez y en orden) e imprime versión + `DATA_ROOT` en la cabecera del reporte.
   "¿Estoy atrás del último release?" y "¿la instalación está íntegra?" son de DevOps: requieren red y
   un manifiesto firmado, dos cosas ajenas a un auditor offline y sin IA.
5. Queda registrado como **riesgo conocido, sin resolver**: `scripts/sync-skills.mjs:20,45-49` copia
   los skills a `~/.claude/skills/` con `force: true` — destino usuario, no repo. Con dos repos en
   versiones distintas en la misma máquina, el último `pnpm skills:sync` gana. Las dos salidas
   posibles están en `contracts/framework.md` §6; se decide junto con el mecanismo de distribución.
6. **Los MCP no son capa A.** `.mcp.json` y `.cursor/mcp.json` contienen rutas de máquina y quedan
   fuera del manifiesto. La consecuencia operativa está en la entrada de arquitectura por
   capacidades: ninguna verificación puede depender de que un MCP esté instalado.
7. **Restricción de secuencia: no distribuir la capa A a un segundo repo antes de que exista
   `.claude/MANIFEST.sha256` (ítem 4.1).** El CHECK 8 detecta marcadores duplicados o en orden
   inverso, pero **no detecta que alguien edite adentro del bloque** de `CLAUDE.md` — eso solo lo ve
   el hash del manifiesto. Entre la firma y el 4.1, la capa A de `CLAUDE.md` está declarada
   no-editable y completamente indefensa: editar `CLAUDE.md` es lo más natural del mundo para un dev
   y el comentario del marcador es fácil de saltear. Después, o la siguiente distribución pisa un
   cambio local del que alguien dependía, o se niega a pisarlo y el repo queda derivado. Es el único
   riesgo de este paquete que **se cierra solo** cuando 4.1 aterriza, y no requiere código: requiere
   no adelantarse.

**Motivo:** DevOps no puede verificar lo que no está enumerado, y no puede empaquetar lo que está
definido por glob sobre carpetas que mezclan capas. La lista explícita además convierte "agregamos un
comando" en un diff visible con su bump correspondiente.

**Artefactos modificados:** `contracts/framework.md` (nuevo), `contracts/framework-files.txt` (nuevo),
`.claude/VERSION` (nuevo), `CLAUDE.md` (bloque con marcadores). Auditor: CHECK 8 nuevo (versión +
integridad de marcadores).

**Decidido por:** Patricio Millán — dueño del modelo (2026-08-25)

---

## 2026-08-19 El layout es interfaz: contrato de rutas y separación DATA_ROOT / FRAMEWORK_ROOT

**feature_id:** global
**command_origin:** análisis de arquitectura (un producto en N codebases)
**status:** accepted
**Enmendada:** 2026-08-19 — cambia el objeto del CHECK 7 (punto 5).

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
5. **CHECK 7 — consistencia interna de la trazabilidad de Discovery.** No valida contra ningún archivo
   compartido: cruza artefactos que ya están commiteados en el repo.
   - `discovery_id: F031` y el `id` no arranca con `031-` → **FAIL** (alguien renumeró y cortó el hilo
     entre los dos modelos).
   - `size: XL` en el registro o en el brief → **FAIL** (el gate del handoff lo prohíbe; si apareció,
     algo se salteó).
   - `epic`/`release`/`size`/`domain` del registro divergen del frontmatter del brief presente →
     **WARN**.
   - `contract_version` desconocido → **WARN** (avisar en vez de interpretar mal; la regla ya existe
     en `/sdd-refine`).
   - dos features `OPEN` con el mismo `discovery_id` → **WARN**.
   - entrada que declara `discovery_id` sin brief ni `feature.status.md` que lo respalde → **WARN**.
   - `id` en el rango `9nn-` **y** con `discovery_id` declarado, o `discovery_id` declarado con un
     `id` que no deriva de él → **WARN** (los dos regímenes de la entrada de IDs, cruzados).
   - feature sin `discovery_id` → no se emite nada; `type: fix` se saltea entero.

**Motivo:** un contrato de rutas sirve para que romperlo sea un acto deliberado y visible en el diff,
no un accidente de orden. Y un auditor que puede apuntar a un root explícito es el prerrequisito para
que DevOps lo corra en CI sobre cualquier layout de instalación — hoy no puede.

**Artefactos modificados:** `contracts/paths.md` (nuevo), `CLAUDE.md`, `scripts/sdd-audit.mjs`,
`scripts/gen-kanban.mjs`, `package.json` (script `audit:sdd:demo`), `README.md` (Opción C hoy
documenta una instalación que no funciona).

**Enmienda 2026-08-19:** el punto 5 decía *"el auditor sí valida `discovery_id` contra el catálogo
(CHECK 7), condicionado a que el catálogo exista"*, con FAIL si el `discovery_id` no figuraba en
`catalog/product.yaml`. Al caerse el catálogo (ver primera entrada), el CHECK 7 cambia de objeto: pasa
de integridad referencial contra un archivo transportado a consistencia interna entre artefactos
locales. Se pierde un caso —un `discovery_id` inventado que no existe upstream queda en WARN en vez de
FAIL— y se gana no mantener un archivo compartido que puede quedar viejo y mentir sobre casos
frecuentes.

**Decidido por:** Patricio Millán — dueño del modelo (2026-08-25)

---

## 2026-08-19 Arquitectura por capacidades: fronteras de módulo declaradas y verificadas

**feature_id:** global
**command_origin:** análisis de arquitectura (principios de codebase + rol de Cortex)
**status:** proposed

**Gap o motivo:** el modelo pide agrupar por capacidad de negocio —`/sdd-scan` ordena identificar
*"dominios de negocio… no carpetas técnicas"* (`.claude/commands/sdd-scan.md:146`)— y el slicing
vertical de `tasks.md` rechaza las fases horizontales por capa técnica
(`.claude/commands/sdd-generate.md:74`). Pero nada de eso llega a ser una frontera verificable:

1. `graph/domain.yaml` **no distingue superficie pública de implementación interna**. Todo archivo
   listado es igual de visible.
2. `depends_on` es **descriptivo, no normativo**: nadie compara los imports reales contra él.
3. No existe detección de violación arquitectónica. El CHECK 4 solo verifica que los archivos del
   grafo existan (`scripts/sdd-audit.mjs:302-307`).
4. El CHECK 2 detecta que **dos personas** toquen el mismo archivo (concurrencia), nunca que **un
   dominio** toque un archivo que no le corresponde (permiso).
5. `tasks.md` prohíbe nombrar funciones —*"eso se decide al implementar"*
   (`.claude/commands/sdd-generate.md:75`)—. Correcto para la implementación interna, **incorrecto
   para la interfaz pública**, que es el artefacto más estable del módulo y es del humano.

**Alternativas consideradas:**
(1) Dejarlo como convención en `constitution.md`, sin verificación.
(2) Delegar la detección de violaciones al MCP `cortex` (`analyze_graph` devuelve ciclos y métricas
de grafo).
(3) Declarar la frontera en el grafo y verificarla en el auditor, offline, con cortex solo como
asistente de autoría.

**Por qué se descartaron:** (1) es el estado actual: una convención que nadie mide se pierde en la
tercera feature. (2) hace que la severidad de un check dependa de qué ejecutable tiene cada máquina
—`.mcp.json` apunta a `C:\tools\cortex-mcp.exe` y `CLAUDE.md` documenta que sin el exe el server
*"falla en silencio"*—: el mismo repo pasaría en una máquina y fallaría en otra. Es el patrón del
falso verde otra vez.

**Decisión tomada:**

1. **El grafo declara la frontera.** `graph/domain.yaml` gana, por dominio:
   `capability: [BC03, BC04]` (ids de `discovery-model/registry/capabilities.yaml`; la relación es
   muchos a uno: un dominio es dueño de una o más capacidades), `module:` (la raíz física del
   módulo), `public:` (la superficie expuesta), `internal:` (todo lo demás), y `depends_on` pasa de
   descripción a **lista de permisos**. `meta.aliases` declara los alias de path del repo
   (`@/` → `src/`), sin los cuales cualquier verificación de imports es ciega en un repo con
   `tsconfig.paths`.
2. **`public:` e `internal:` son opt-in por dominio.** Un dominio que no los declara se comporta
   exactamente como hoy y el CHECK 9 no lo mira. Es lo que permite adoptar fronteras módulo por
   módulo y mantener el bump en MINOR: ningún CI hoy verde se pone rojo retroactivamente.
3. **CHECK 9 en el auditor, determinista y offline.** Ningún archivo de afuera del dominio X importa
   una ruta listada en el `internal:` de X → **FAIL**. Se implementa leyendo las líneas
   `import`/`from`/`require` de los archivos que el grafo ya declara —el mismo conjunto acotado que
   la regla de routing obliga a leer— y resolviendo `meta.aliases`. Cero dependencias npm.
4. **El CHECK 9 se llama por lo que hace, no por lo que aspira a garantizar.** La etiqueta en el
   reporte es `imports`, nunca "fronteras arquitectónicas", y **declara su cobertura en la misma
   línea**:
   ```
   [imports] Sin imports directos a rutas internal: ajenas — 143 imports en 38 archivos
             no cubre: re-exports por barrel · imports dinámicos · acoplamiento no-import
   ```
   El riesgo de este check no es el falso FAIL —un import a una ruta `internal:` declarada es
   inequívoco— sino el **falso PASS**: que alguien lea el verde y concluya que las fronteras están
   respetadas mientras un dominio alcanza los internos de otro por un re-export de barrel, una
   llamada HTTP, un nombre de evento o una tabla compartida. En un codebase TypeScript real los
   barrels son ubicuos, así que el hueco se va a ejercitar. Un checkbox verde que promete más de lo
   que mide es la misma falla que el auditor imprimiendo `AUDIT PASA` sin auditar nada. El nombre
   honesto y la cobertura declarada cuestan cero y son la única mitigación real.
5. **La regla de nombres de funciones se parte en dos.** Las firmas de la interfaz pública se fijan
   aguas arriba (en `plan.md`) y el agente no las inventa ni las cambia; los nombres internos no se
   fijan nunca. `plan.md` declara módulo + interfaz pública **antes** de que `tasks.md` exista.
6. **Cortex participa en la autoría, nunca en la verificación.** Con cortex disponible, `/sdd-scan`
   usa `scan_repo`, `extract_spec` y `analyze_graph` como insumo —capas, flujos, gaps, `arch_role`,
   `fan_in`/`fan_out` para inferir público vs. interno, y ciclos ya detectados— y se queda con lo que
   es suyo: nombrar capacidades, el check de secretos, la doble confirmación humana y escribir el
   artefacto durable con `meta.commit`. Sin cortex hace lo de hoy y **anuncia la degradación**
   ("inferí la superficie pública por heurística, revisá antes de confirmar"). El grafo registra qué
   lo asistió: `meta.generated_by: sdd-scan+cortex@<versión>`.
7. **Desempate de routing.** Las instrucciones del server de cortex declaran `get_context_pack` como
   *"the primary tool, call it before asking any question about the codebase"*, en conflicto directo
   con la regla de `CLAUDE.md` de consultar primero `graph/domain.yaml`. **Gana el grafo**: es una
   lectura de YAML y es la arquitectura *acordada*. Cortex entra cuando el grafo no cubre el dominio,
   como ya dice `CLAUDE.md` para `/sdd-implement` y `/sdd-fix`. Queda escrito porque las
   instrucciones del MCP entran al contexto solas y empujan lo contrario.
8. **`CONTRACT.md`** (generado por `scm_generate`/`scm_update` de cortex) es la superficie pública del
   repo hacia otros repos: capa C, se commitea, y su `scm_diff` es lo que se revisa cuando cambia el
   contrato entre la API y la web. No lo verifica el auditor.
9. **La cadena de capacidad queda escrita:**
   `BC (Discovery) → sdd_domain → dominio del grafo → módulo físico → interfaz pública → plan.md →
   tasks.md → código → test de integración en la interfaz`. La identificación de capacidades **no es
   un paso nuevo del modelo**: la hace Discovery en `registry/capabilities.yaml`, que ya mapea
   `BC01 → sdd_domain`. Lo que faltaba son los dos eslabones finales (dominio → módulo físico, y
   módulo → interfaz pública).
10. **Testing en la frontera.** `/sdd-implement` prioriza tests de integración contra la interfaz
   pública del módulo por sobre tests unitarios archivo por archivo. Los unitarios se conservan
   donde aportan (algoritmos, validadores). No cambia el gate: `tests: PASS` sigue siendo el
   contrato del bloque `## Implement`.

**Motivo:** sin frontera declarada, "arquitectura por capacidades" es una preferencia estética que se
degrada en la tercera feature. Con frontera declarada y verificada, el agente tiene un espacio
delimitado dentro del cual puede producir libremente — que es el punto: el modelo no describe solo
qué código producir, describe la arquitectura dentro de la cual está permitido producirlo. Y la
verificación tiene que ser offline y determinista o no es verificación: es una sugerencia que depende
de qué herramientas tenga instalada cada máquina.

**Artefactos modificados:** `graph/domain.template.yaml` (claves nuevas), `contracts/paths.md`,
`CLAUDE.md`, `.claude/commands/sdd-generate.md` (interfaz pública en `plan.md`; corte de la regla de
nombres), `.claude/commands/sdd-scan.md` (delegación a cortex + anuncio de degradación),
`.claude/commands/sdd-implement.md` (tests en la frontera). Auditor: **CHECK 9 nuevo**.

**Nota de firma — pilotear antes de firmar, y firmar aparte de las otras cinco.**
Es la única entrada que no arregla un defecto verificado en el código: las otras cinco salen de algo
medido, esta sale de principios de arquitectura. Y toca `plan.md` y `tasks.md`, que es el camino más
transitado del modelo: si declarar la interfaz pública antes de las tasks resulta incómodo, cada
feature paga el impuesto y no hay métrica previa contra la cual comparar.
La reversibilidad es **asimétrica**, y es la razón de fondo para pilotear:
- el **schema del grafo** es reversible — las claves son opt-in, si molestan se ignoran;
- las **reglas de generación** son pegajosas — cuando cinco features tengan su `plan.md` escrito bajo
  la regla nueva, revertir deja artefactos inconsistentes entre features, que es exactamente lo que
  el modelo existe para evitar.
Camino sugerido: firmar las otras cinco (son las que desbloquean a DevOps), aplicar los puntos 1-4
—schema del grafo y CHECK 9, ambos opt-in y reversibles— y pilotear los puntos 5 y 10 —interfaz
pública en `plan.md` y tests en la frontera— en **una** feature antes de firmarlos. Esta entrada no
bloquea a nadie.

**Decidido por:** _PENDIENTE DE FIRMA — dueño del modelo_

---

## 2026-08-19 Detección e instalación de Cortex: opcional, verificable y por máquina

**feature_id:** global
**command_origin:** análisis de arquitectura (rol de Cortex en el ciclo)
**status:** accepted

**Gap o motivo:** Cortex se está instalando con el mismo patrón que este trabajo eliminó del modelo:
copia manual de un binario de ~48 MB a una ruta fija, sin versión, sin manifiesto, con la
configuración commiteada apuntando a una ruta de máquina, y degradación silenciosa cuando falta.
Concretamente:

1. `.mcp.json` trae `"cortex": { "command": "C:\tools\cortex-mcp.exe" }` — ruta absoluta de una
   máquina, en un archivo que se distribuye. `CLAUDE.md` admite el efecto: sin el exe en esa ruta,
   el cliente *"intentará levantar el server y fallará en silencio"*.
2. `/sdd-setup` **no menciona Cortex ni una vez**, aunque `CLAUDE.md` diga "corré `/sdd-setup`, te
   guía paso a paso" en la sección que lo lista.
3. `README.md` tampoco lo menciona: el agente sabe que Cortex existe porque está en `CLAUDE.md`; el
   humano que lee la documentación, no.
4. `.cursor/mcp.json` no tiene la entrada: los devs en Cursor no lo tienen y nadie se lo dice.
5. No hay versión pineada en ninguna parte. Dos devs pueden autorizar grafos generados con builds
   distintos.

**Alternativas consideradas:**
(1) Dejar la entrada commiteada con la ruta fija y documentar que cada dev copie el exe ahí.
(2) Usar una variable de entorno con default en el `command` del `.mcp.json` commiteado.
(3) No commitear la entrada: `/sdd-setup` detecta el estado y la registra con la ruta que el dev
confirme.

**Por qué se descartaron:** (1) es el estado actual, y su modo de falla es el peor posible —
silencioso y con la causa oculta. (2) depende de que el cliente expanda variables en `command`, lo
que varía por cliente y versión; si no expande, queda peor que hoy, porque el `command` pasa a ser
una ruta literalmente inexistente en vez de una plausible.

**Decisión tomada:** se adopta (3).

1. **La entrada `cortex` no viaja en el repo.** Se saca del `.mcp.json` commiteado. La escribe
   `/sdd-setup` en la config del cliente detectado, con la ruta que el dev confirma. Antes de
   escribir en un archivo versionado, el comando avisa la consecuencia y deja elegir entre config
   local (recomendado) y commiteada (solo si todo el equipo comparte la ruta).
2. **`/sdd-setup` gana un paso opcional al final**, después de la activación manual de servers y
   antes del resumen. Se ofrece **solo si el repo tiene código** — en un repo vacío es ruido.
3. **La verificación tiene tres capas y una sola es autoritativa:** que las tools `mcp__cortex__*`
   estén disponibles. Si no lo están, el diagnóstico se completa mirando la config y el filesystem,
   y clasifica en cuatro estados con remedios distintos: `CORTEX_OK`, `CORTEX_NOT_LOADED` (falta
   reiniciar el cliente), `CORTEX_BIN_MISSING` (la ruta no existe en esta máquina — el caso de la
   ruta ajena), `CORTEX_ABSENT` (no hay entrada). El vocabulario sigue el de la Regla de Resiliencia
   de `CLAUDE.md`.
4. **Nunca verificar ejecutando el binario.** Es un server stdio: lanzado a mano se queda esperando
   entrada y cuelga la terminal. Se verifica que el archivo exista; la prueba real es que las tools
   aparezcan tras reiniciar el cliente.
5. **El agente no descarga ni copia el binario.** El repo de Cortex es privado: el dev consigue el
   archivo (`gh release download --repo pmillanmc/cortex`, o pidiéndolo a quien tenga acceso) y pasa
   la ruta. Es el mismo patrón que `/sdd-e2e` Paso 0 usa con la CLI de ProGuide.
6. **Dos caminos de instalación, elegidos con una pregunta:** ejecutable autocontenido (el habitual,
   sin Python) o `pip install git+…` (para quien vaya a modificar Cortex; requiere Python 3.11+ y
   acceso al repo). Los tres formatos de config de cliente difieren y el comando usa el del IDE
   detectado.
7. **Fallback silencioso, con una excepción.** En `/sdd-implement` y `/sdd-fix` la ausencia de Cortex
   no se reporta: solo cambia cómo el agente encuentra archivos, no el artefacto. En `/sdd-scan`
   **sí se declara**, porque produce artefactos durables que un humano firma: el grafo registra
   `meta.generated_by: sdd-scan+cortex` o `sdd-scan`, y el comando dice en una línea si la inferencia
   fue por análisis estático o por heurística antes de pedir la confirmación. La regla general queda
   así: **si el humano firma el resultado, la degradación se declara; si el resultado es intermedio,
   el fallback es silencioso.**
8. **Ninguna verificación depende de Cortex** (ya en la decisión de arquitectura por capacidades).
   Es lo que hace tolerable una instalación best-effort: instalarlo mal cuesta velocidad, no
   corrección.
9. **`README.md` documenta Cortex**, incluido el hueco de acceso: repo privado, hay que pedir el
   binario o el acceso.

**Motivo:** un MCP opcional cuyo modo de falla es el silencio no es opcional, es una trampa. Y una
ruta de máquina en un archivo distribuido es la misma clase de error que el `cp` de artefactos que
originó todo este trabajo: algo que funciona en la máquina donde se escribió y falla sin explicación
en las demás.

**Artefactos modificados:** `.claude/commands/sdd-setup.md` (paso opcional de Cortex: detección de
los cuatro estados + instalación guiada por los dos caminos + registro con confirmación),
`.claude/commands/sdd-scan.md` (procedencia en `meta.generated_by` y declaración antes del gate de
confirmación), `CLAUDE.md` (tabla de estados, prohibición de verificar ejecutando el binario, límite
explícito). A cargo de DevOps: sacar la entrada `cortex` del `.mcp.json` commiteado y documentar la
distribución del binario con versión y hash, igual que la capa A.

**Decidido por:** Patricio Millán — dueño del modelo (2026-08-25)

---

## 2026-09-03 Atribución de tokens por feature (no por sesión): ledger multi-sesión + total al cerrar en /sdd-review

**feature_id:** global
**command_origin:** sdd-metrics
**status:** accepted

**Gap o motivo:** DX_MET_006 (medición real de tokens vía `ccusage`, decidida y validada en
la rama `feature/sdd-metrics-token-counting` con la feature `002-expense-categories`, ciclo
completo = 7.303.554 tokens, 98,2% cache_read) leía un único `session_id` — la última línea
de `metrics/sessions.jsonl` — y reportaba el consumo de **esa sesión**. Una feature real casi
nunca se hace en una sola sesión: `/sdd-refine`, `/sdd-generate`, `/sdd-validate`,
`/sdd-implement` (o varias corridas de `/sdd-task`, sumadas después de que este comando se
creó) y `/sdd-review` pueden ser sesiones distintas, de días o devs distintos — y el número
que se necesita no es "cuánto costó esta sesión" sino "cuánto costó cerrar esta feature".
Esa rama nunca se mergeó a `main`, que mientras tanto sumó gate override, evidencia E2E,
calidad estructural y `/sdd-task`, así que portarla exigía adaptar los puntos de inserción,
no solo aplicar los commits.

**Alternativas consideradas:**
(a) Ledger append-only por feature (`metrics/[feature_id].sessions`): cada comando del ciclo
anexa su `CLAUDE_CODE_SESSION_ID` al terminar; `/sdd-metrics` lee el archivo, deduplica con
`sort -u` y suma tokens reales por `sessionId` único vía `ccusage`.
(b) Resolver la atribución sesión→feature dentro del hook `SessionStart`
(`sdd-session-capture.mjs`), que ya escribe `metrics/sessions.jsonl` en cada sesión.
(c) Dejar que el humano pase los `session_id` a mano al correr `/sdd-metrics`.
(d) No perseguir el total exacto: aceptar que DX_MET_006 mida solo la última sesión y
documentar la limitación.

**Por qué se descartaron:** (b) no es viable porque en el momento de `SessionStart` todavía
no se sabe con certeza qué feature se va a trabajar en esa sesión — el hook no tiene ese dato,
solo `session_id`, `transcript_path` y `cwd`; la atribución solo puede resolverse en el plano
de los comandos, que sí conocen `feature_id` y `session_id` a la vez. (c) reintroduce el mismo
problema que motivó automatizar DX_MET_006 en primer lugar: depender de que el humano recuerde
y transcriba IDs de sesión sin errores. (d) deja el número de la telemetría central del modelo
—el que responde "cuánto costó esta feature"— estructuralmente mal calculado en cualquier
feature de más de una sesión, que es el caso normal.

**Decisión tomada:** (a), con dos reglas que no estaban en la versión original de la rama:
1. **El ledger es obligatorio en los seis comandos del ciclo**, no en cinco: se agrega
   `/sdd-task` (no existía cuando se escribió la rama) porque repartir tasks entre devs o
   retomarlas en otro momento son, en los hechos, sesiones adicionales de la misma feature.
2. **El total con `feature_total: true` se fija en `/sdd-review`**, no en `/sdd-implement`.
   Antes de escribirlo, `/sdd-review` anexa su propio `session_id` al ledger y recién ahí corre
   DX_MET_006: en ese punto el ledger ya contiene refine + generate + validate +
   implement/task + review, así que la suma es el costo end-to-end real. Cualquier corrida de
   `/sdd-metrics` en un punto anterior del ciclo sigue siendo válida pero queda marcada
   `feature_total: false` — un corte parcial, no el número de cierre. Si el resultado de
   `/sdd-review` es PENDIENTE, no se escribe ese bloque: la feature sigue abierta y va a
   volver a pasar por review.
`metrics/sessions.jsonl` (el hook `SessionStart`) pasa a ser fuente de **reconciliación**
(confirmar que cada `session_id` del ledger existió), nunca de atribución.

**Motivo:** la pregunta que un Tech Lead hace al cerrar una feature es "¿cuánto costó
construir esto?", no "¿cuánto costó el último `/sdd-implement`?". Atar el número definitivo al
gate que efectivamente cierra la feature (`/sdd-review` con `APROBADO`) es lo único que hace
que la respuesta sea completa y quede en el mismo lugar donde el modelo ya certifica el cierre.

**Artefactos modificados:** `.claude/commands/sdd-metrics.md` (Paso 0.5 reescrito: la variante
depende del agente, no del editor; Variante A reescrita para leer el ledger y derivar el slug
de proyecto desde el `cwd` del hook en vez de `CLAUDE_PROJECT_DIR`; campo `feature_total`
nuevo), `.claude/commands/sdd-refine.md`, `sdd-generate.md`, `sdd-validate.md`,
`sdd-implement.md` y `sdd-task.md` (hook de registro de sesión al ledger, al finalizar),
`.claude/commands/sdd-review.md` (hook de registro de sesión + paso nuevo que recalcula
DX_MET_006 sobre el ledger completo y lo marca `feature_total: true` antes de cerrar),
`metrics/README.md` (documenta el ledger y que el total de cierre vive en `/sdd-review`).

**Decidido por:** kevinbelmon
