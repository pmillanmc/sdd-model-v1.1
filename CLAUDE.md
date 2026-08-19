# SDD Model — Contexto del proyecto

<!-- SDD:FRAMEWORK BEGIN v1.2.0-proposed -->
<!-- Todo lo que está entre estos marcadores es capa A (framework): se distribuye igual a
     todos los repos y NO se edita en destino. Ver contracts/framework.md.
     Las reglas propias de este repo van después del marcador de cierre, al final del archivo.
     Cada marcador aparece EXACTAMENTE UNA VEZ en este archivo: el manifiesto de integridad
     hashea lo que hay entre ellos, así que una segunda aparición literal parte el bloque. -->

## Qué es esto

Este es un modelo de trabajo para Spec-Driven Development (SDD).
El objetivo es generar código a partir de un brief inicial estructurado,
pasando por artefactos intermedios que guían la implementación.

## Ciclo de trabajo

```
[SETUP — primera vez en el proyecto]
/sdd-setup → configura entorno, MCPs y credenciales guiado paso a paso

[FASE 0 — SOLO BROWNFIELD]
Si el repo ya tiene código: corré /sdd-scan UNA vez
    ↓
existing-arch.md (estado descriptivo del codebase)

[PREPARACIÓN — sin comandos]
El equipo pone borradores en drafts/
(notas, wireframes, restricciones, contexto)

    ↓  PRIMER COMANDO
   /sdd-refine   ← o usar el skill `business-clarifier` de Claude (equivalentes, no usar ambos)
        ↓
input.md (brief pulido)
    ↓  /sdd-generate
constitution.md + spec.md + plan.md + tasks.md
    ↓  /sdd-validate
    gap → humano ajusta → /sdd-log → DECISIONS.md
    ↓  /sdd-implement
código + tests
    ↓  /sdd-e2e
QA funcional E2E contra la app corriendo (ProGuide) → evidencia
    ↓  /sdd-checklist
checklist.md (lo completa el humano)
    ↓  /sdd-review
verificación final: lógica + evidencia E2E + UI
    ↓  cada sprint
/sdd-health → auditoría de artefactos + drift de existing-arch

[INTEGRACIÓN JIRA — requiere Atlassian MCP]
/sdd-jira-start → trae ticket de Jira, registra feature, mueve a In Progress
/sdd-jira-sync  → reconcilia jira-map.yaml con Jira durante el desarrollo
/sdd-jira-close → cierra feature en SDD, mueve ticket a Done + comentario

[TRANSVERSAL — disponible en cualquier momento]
/sdd-handoff [propósito] → snapshot de sesión para continuar en otro agente o sesión
/sdd-compact-guide → ¿conviene compactar ahora? tabla de decisión por fase
/sdd-context-budget → auditoría del peso en tokens del framework
```

## Comandos disponibles

<!-- DECISIÓN DE DISEÑO: se usa trigger-table con lazy loading en lugar de tabla simple.
     Motivo: esta etapa prioriza onboarding y adopción de devs no técnicos — el agente
     sugiere comandos proactivamente sin que el dev los conozca de memoria.
     Cuando se paralelice con agentes, evaluar switch a tabla simple (más eficiente en tokens). -->

Cargá el `.md` del comando solo cuando el trigger aparezca en la conversación o el usuario lo invoque explícitamente.

| Trigger keywords | Comando | Cuándo cargar el .md |
|---|---|---|
| setup, configurar, primera vez, instalar, mcp | `/sdd-setup` | Primera vez en el proyecto o entorno sin configurar |
| explain, qué es, cómo funciona, onboarding | `/sdd-explain` | Primer contacto con el modelo |
| scan, codebase, código existente, brownfield | `/sdd-scan` | Proyecto con código previo |
| refine, clarifica, grilling, ambigüedad, brief | `/sdd-refine` | Hay `drafts/` sin pulir |
| generate, spec, constitution, plan, tasks | `/sdd-generate` | `input.md` listo |
| validate, gap, cobertura, brief vs spec | `/sdd-validate` | Spec generada, querés verificar |
| log, decisión, ADR, alternativas | `/sdd-log` | Hay un desvío que registrar |
| implement, código, TDD, tareas | `/sdd-implement` | `tasks.md` listo |
| task, una tarea, task específica, incremental | `/sdd-task` | Querés implementar UNA task puntual de una feature |
| e2e, qa, prueba funcional, test case, regresión, proguide | `/sdd-e2e` | Verificar flujos contra la app corriendo (desde spec, doc, Jira, API o una suite de regresión) |
| fix, bug, hotfix | `/sdd-fix` | Bug puntual (≤3 archivos) |
| checklist, criterios manuales, UX | `/sdd-checklist` | Implementación cerrada |
| review, gate final, UI vs spec | `/sdd-review` | Listo para gate final |
| health, drift, auditoría, sprint | `/sdd-health` | Cierre de sprint o sospechás drift |
| metrics, tokens, retrabajo | `/sdd-metrics` | Querés ver costo de esta feature |
| metrics-summary, proyecto, agregado | `/sdd-metrics-summary` | Querés ver costo del proyecto completo |
| handoff, continuar, próxima sesión, snapshot | `/sdd-handoff` | Cerrás sesión o pasás a otro agente |
| compact, contexto, fase, transición | `/sdd-compact-guide` | No sabés si conviene compactar ahora |
| context budget, overhead, peso framework | `/sdd-context-budget` | Querés saber cuánto pesa el framework |
| test, smoke, fixture | `/sdd-test` | Validás cambios al propio modelo SDD |
| jira start, arrancar feature, ticket | `/sdd-jira-start` | Arrancás una feature desde Jira |
| jira sync, sincronizar, reconciliar tickets | `/sdd-jira-sync` | Sincronizás tasks con Jira durante el desarrollo |
| jira close, cerrar ticket, feature terminada | `/sdd-jira-close` | Cerrás feature y actualizás Jira |

## Reglas generales

- Usá `pnpm` como gestor de paquetes (salvo que `existing-arch.md` declare otro)
- Los tests van antes de la implementación (TDD)
- No inventés arquitectura que no esté en `plan.md`
- Si existe `existing-arch.md`, sus restricciones son no negociables salvo decisión registrada en `DECISIONS.md`
- Si algo del brief es ambiguo, preguntá antes de implementar
- **No muevas ni renombres carpetas del modelo.** El layout es interfaz — ver
  "El layout es interfaz" más abajo y `contracts/paths.md`
- **No edites archivos de capa A en destino** (comandos, skills, hooks,
  scripts, contratos). Se cambian upstream y se redistribuyen: un cambio local
  es drift y el manifiesto de integridad lo va a marcar

## QA funcional E2E (ProGuide)

- La verificación funcional contra la **app corriendo** se hace con `/sdd-e2e`, que usa el
  MCP `proguide-test` y la skill `qa-test-cases` de ProGuide (Playwright + LLM).
- Tres capas que NO se pisan: `pnpm test` (unit/integración, TDD en `/sdd-implement`) ·
  `/sdd-e2e` (flujos UI/API contra la app) · `/sdd-checklist` (juicio humano/manual).
- **La fuente NO es solo `spec.md`.** QA parte de lo que tenga: spec, documentación, ticket de
  Jira, contrato de API o —en regresión— una suite ya congelada. `/sdd-e2e` es fuente-agnóstico;
  cada caso referencia su origen (`US-N`, `JIRA-xxxx`, `doc §x`). Cuando la feature es SDD, los
  casos viven en `specs/[feature_id]/e2e/` y la evidencia queda en el bloque `## E2E` de
  `metrics/[feature_id]-metrics.md`, que `/sdd-review` lee para el gate final. En apps sin SDD
  (o regresión suelta) no se genera esa estructura.
- El QA solo corre `/sdd-e2e`: su **Paso 0** verifica la CLI con `proguide --version` y, si
  falta, le pide al usuario que la instale a mano desde el repo
  (https://github.com/molivera-proguide/proguide-test, último release vía `gh`) y espera; luego
  confirma el MCP `proguide-test` (`.mcp.json` / `.cursor/mcp.json`) y corre
  `proguide update skills` (scope global de usuario, `~/.claude/skills`). Recién ahí pide el
  contexto y arma los casos.
  Detalle de roles en `.claude/skills/coding-standards/references/e2e-qa.md`.
- No confundir con `/sdd-test`, que es el smoke test del **propio modelo SDD**.

## Steering skill

- Skill recomendado: `.claude/skills/coding-standards/SKILL.md`
- Usalo para implementación/review y dudas de convenciones con progressive disclosure.
- El skill NO reemplaza comandos SDD ni `pnpm audit:sdd`.

## Las tres capas (obligatorio antes de copiar cualquier archivo del modelo)

El modelo distingue tres capas con reglas de propiedad distintas. El contrato completo, ruta por
ruta, está en **`contracts/paths.md`** — leelo antes de mover, copiar o crear carpetas del modelo.

| Capa | Contenido | Regla |
|---|---|---|
| **A · Framework** | `.claude/commands/`, `.claude/skills/`, `.claude/hooks/`, `scripts/`, `contracts/`, plantillas `*.template.*`, scripts de `package.json` | Idéntico en todos los repos. Una sola fuente, versionada en `.claude/VERSION`. **No editable en destino** |
| **B · Negocio** | `catalog/product.yaml`: catálogo de features de Discovery (`discovery_id`, título, épica, release, talle, criterios de aceptación de negocio) | Compartido entre repos, **read-only**. Lo genera el discovery-model aguas arriba |
| **C · Implementación** | `specs/`, `graph/domain.yaml`, `existing-arch.md`, `metrics/`, `drafts/`, `handoffs/`, y en el registro: `status`, `owner`, `sprint`, `touches`, `domain`, `closed` | **Por repo.** Se commitea con el código. **Nunca se comparte** |

**Nunca copies capa C entre repos.** No es una preferencia de proceso: `graph/domain.yaml` lista
rutas exactas de código y la regla de routing obliga a leer solo esos archivos, así que un grafo
ajeno enruta a archivos que no existen; los `touches` se cruzan para detectar colisiones dentro de
un filesystem; `existing-arch.md` describe un codebase concreto; `metrics/` es evidencia de una
ejecución. Si dos árboles de capa C "derivan", es porque no debían ser iguales.

## Multi-repo: un producto, varios codebases

Cuando el mismo producto se implementa en repos separados (ej. una API y una web), cada repo corre
su propio ciclo SDD completo y **no comparte estado**:

- **Un registro por repo.** `specs/_registry/features.yaml` es local. Puede declarar un bloque
  `meta:` con `repo:` (identidad del codebase) y `catalog:` (ruta al catálogo de negocio, o `null`).
- **`id` es local al repo.** Es el nombre de carpeta en `specs/`, la clave del registro y el prefijo
  de `metrics/<id>-metrics.md`. **No asumas que el mismo `id` significa lo mismo en otro repo**: el
  número lo asigna cada repo por su cuenta. Convención: se conserva el slug y varía el número
  (`vulnops: 012-sso-login` ↔ `web-vulnops: 007-sso-login`).
- **`discovery_id` es la única clave de join entre repos.** Puede aparecer en varios registros.
  `epic`, `release` y `size` en el registro local son **caché** del catálogo: si divergen, manda el
  catálogo.
- **Sin `catalog/`, el repo es standalone** y todo funciona exactamente como antes: multi-repo es
  aditivo, no cambia nada en un repo de un solo codebase.
- **Las colisiones son intra-repo.** Dos personas trabajando en API y web no colisionan: son
  filesystems distintos. Lo que sí puede romperse es el **contrato** entre los dos (la API cambia de
  forma y la web asume la anterior); eso no lo detecta el auditor y va por coordinación humana.

## El layout es interfaz

Estas rutas son **contrato**, no organización. `specs/`, `metrics/` y `graph/` son **hermanos de la
raíz**, nunca subcarpetas de `specs/`:

```
specs/  specs/_registry/  specs/_registry/sprints/  specs/<id>/
metrics/  graph/  drafts/  handoffs/  catalog/  contracts/
input.md  existing-arch.md  DECISIONS.md
```

`scripts/sdd-audit.mjs`, los scripts de kanban y el hook de sesión las leen por ruta fija. Anidar
`metrics/` o `graph/` dentro de `specs/` no las "ordena": rompe los checks de gates y hace que el
routing de contexto desaparezca degradado a un WARN.

**Mover, renombrar o anidar cualquiera de esas rutas exige, en el mismo commit:** entrada en
`DECISIONS.md` vía `/sdd-log` + actualización de `contracts/paths.md` + bump **MAJOR** de
`.claude/VERSION`.

**Los agentes no reorganizan estas carpetas**, ni cuando el pedido llega de pasada dentro de otra
tarea. Avisá que es un cambio de contrato y pedí la decisión.

## Gobernanza y routing de contexto

- **Registro maestro**: `specs/_registry/features.yaml` indexa toda feature
  (status, dominio, owner, sprint, archivos que toca, decisiones).
  `/sdd-generate` registra, `/sdd-review` cierra, `/sdd-health` audita.
  Es **local al repo** (capa C) y nunca se copia a otro repo.
- **Catálogo de negocio (opcional)**: `catalog/product.yaml` es la capa B —
  read-only, generada aguas arriba por el discovery-model. Da la identidad de
  negocio (`discovery_id`, épica, release, talle, criterios de aceptación).
  El registro local la referencia por `discovery_id`; `epic`, `release` y
  `size` locales son caché y el catálogo manda. Si no existe, el repo es
  standalone y nada cambia.
- **Sprints**: un archivo por sprint en `specs/_registry/sprints/` con scope
  y gate de cierre. El humano define el scope; los comandos no lo modifican.
- **Grafo de dominio**: `graph/domain.yaml` mapea dominios → entidades,
  servicios, componentes y rutas exactas de archivos. Lo genera `/sdd-scan`
  sobre **este** codebase. Es capa C: un grafo traído de otro repo enruta a
  archivos inexistentes y rompe el routing en silencio.
- **Regla de routing (ahorro de tokens)**: ante cualquier tarea, consultá
  PRIMERO `graph/domain.yaml` para identificar el dominio afectado y leé
  SOLO los archivos listados en `files`. No escanees el codebase completo
  salvo que el grafo no exista o no cubra el dominio (en ese caso, avisá).

## Reglas de trabajo en equipo

- **Colisiones**: antes de tocar archivos, intersectá los `touches` de la
  feature/fix actual con los de toda otra feature `OPEN` de otro owner en
  `specs/_registry/features.yaml`. Si hay intersección, reportala y esperá
  decisión humana. Nunca pises trabajo ajeno en silencio.
- **Gates de prerequisitos**: cada comando verifica que el paso anterior
  ocurrió (artefactos existen, validación corrió) antes de ejecutar.
  Saltarse un gate requiere confirmación humana explícita + entrada en
  `DECISIONS.md` vía /sdd-log.
- **Audit determinista**: `pnpm audit:sdd` (script `scripts/sdd-audit.mjs`)
  verifica consistencia del modelo sin IA: registro↔specs, colisiones,
  gates de cierre, grafo, sprints, `discovery_id` contra el catálogo (si
  existe) y consistencia de versión del framework. Corre en CI en cada PR.
  Lo que el script ya verifica, los agentes NO lo recalculan — leen su salida.
- **El auditor audita un `--root`**: por defecto `process.cwd()`, es decir el
  repo desde el que se lo invoca — nunca la carpeta donde está instalado el
  script. Siempre imprime el root resuelto y la versión del framework en la
  cabecera; si el root no tiene layout SDD, falla en vez de pasar en verde.
  Antes de creerle a un reporte, verificá que el root de la cabecera es el
  repo que querías auditar.
- **Colisiones cross-repo no existen para el auditor**: los `touches` se
  cruzan dentro de un filesystem. Un cambio de contrato entre la API y la web
  no lo detecta ningún script; se coordina entre personas y se registra en
  `DECISIONS.md`.
- **Bugs chicos van por /sdd-fix**, no por el ciclo completo ni por fuera
  del modelo. Si un fix crece (>3 archivos, contratos nuevos), se promueve
  a feature con /sdd-refine.

## Configuración de MCPs

Los comandos `/sdd-jira-start`, `/sdd-jira-sync` y `/sdd-jira-close` requieren dos servidores MCP activos:
- **mcp-proguide** — gobernanza SDD local (registry, audit, graph, metrics)
- **Atlassian MCP** — integración con Jira

Hay un tercer MCP **opcional** (ningún comando lo requiere para funcionar):
- **cortex** — compresión de contexto de código vía análisis estático (grafo de dependencias, PageRank). Útil en brownfield (insumo de `/sdd-scan`) y como fallback de exploración en `/sdd-implement`/`/sdd-fix` cuando `graph/domain.yaml` no cubre el archivo o dominio en cuestión. Se distribuye como ejecutable standalone (`cortex-mcp.exe`, no requiere Python) — repo fuente: `pmillanmc/cortex`.

Si es tu primera vez configurando el entorno, corré `/sdd-setup` — te guía paso a paso.

La configuración varía según el entorno:

### Cursor
El archivo `.cursor/mcp.json` (creado por `/sdd-setup`) incluye ambos servidores.
Cursor los detecta al abrir el proyecto, pero NO los activa automáticamente.

Después del setup tenés que entrar a Cursor Settings → solapa "Tools" →
solapa de tu workspace → sección "Workspace MCP Servers":
- atlassian: si dice "Needs authentication", clic en "Connect" para iniciar
  el flujo OAuth.
- sdd: activá el toggle si está apagado.

Recomendado: en la sección "Authentication", activá "Wait for MCP Authentication"
para que el popup de OAuth no se cierre solo a los 30 segundos.

### Claude Code
El archivo `.claude/settings.json` ya incluye ambos servidores. Las credenciales
van en `.env` en la raíz del proyecto (nunca en el repo):
```
ATLASSIAN_SITE_URL=https://tu-org.atlassian.net
ATLASSIAN_USER_EMAIL=tu@email.com
ATLASSIAN_API_TOKEN=tu-api-token
```
Generás el API token en: https://id.atlassian.com/manage-profile/security/api-tokens

**Cortex (opcional):** `.mcp.json` ya trae la entrada `cortex` apuntando a una ruta fija del ejecutable:
```json
"cortex": { "command": "C:\\tools\\cortex-mcp.exe" }
```
Requiere que cada dev copie `cortex-mcp.exe` a esa misma ruta (`C:\tools\cortex-mcp.exe`) en su máquina —
la ruta es local, no viaja con el repo. Si tu copia vive en otro lado, ajustá el `command` en tu
`.mcp.json` local (no lo commitees así salvo que todo el equipo use la misma ruta). Sin el exe en esa
ruta, Claude Code intentará levantar el server y fallará en silencio — los comandos SDD que no dependen
de Cortex siguen funcionando igual.

### Claude.ai
Los MCPs se conectan manualmente desde la UI de Claude.ai:
- mcp-proguide: conectar como servidor MCP remoto con la URL de tu instancia
- Atlassian: conectar desde el conector oficial de Atlassian en la UI

### Regla de Observabilidad (Telemetría DX)
**Metrics Mandatory**: Al completar la ejecución de `/sdd-implement` o finalizar una tarea grande, el agente DEBE autoevaluarse ejecutando el comando `/sdd-metrics` (o leyendo `.claude/commands/sdd-metrics.md`) para generar el reporte de retrabajo y ambigüedad.
Para ver el resumen agregado de todas las features, corré `/sdd-metrics-summary`.

### Regla de Resiliencia (Fallback MCP → REST)

**Fallback Mandatory**: cuando un comando SDD necesite hablar con Jira, el MCP de Atlassian es el camino default y mandatorio. Si el MCP falla, el agente puede caer a la REST API de Jira, pero SOLO con trazabilidad obligatoria vía `/sdd-log`.

Flujo cuando el MCP falla:

1. Clasificá el error con uno de estos códigos:
   - `MCP_UNAUTHENTICATED` — el server existe pero no tiene sesión OAuth viva.
   - `MCP_UNREACHABLE` — no se pudo contactar al server (timeout, DNS, red).
   - `MCP_FORBIDDEN` — el server respondió pero rechazó la operación (scopes, permisos).
   - `MCP_DISABLED` — el server está apagado en la UI del IDE.
   - `MCP_OTHER` — cualquier otro error. Pegá el mensaje original.

2. Antes de caer a REST, avisá al humano y pedile autorización:
   ```
   El MCP de Atlassian falló (código: [CÓDIGO_DEL_PASO_1]).

   Para mantener trazabilidad voy a invocar /sdd-log antes de continuar
   vía REST. Te va a pedir tu nombre o rol. ¿Procedo?
   ```

3. Si el humano confirma, invocá `/sdd-log` y pre-rellená las primeras 5 respuestas (el humano solo aporta la 6, "decidido por"):

   - **¿Qué cambió?** → `"Fallback MCP → REST en [/comando-sdd] por falla del MCP de Atlassian (código: [CÓDIGO])."`
   - **¿Qué alternativas consideraste?** → `"Abortar la operación y pedir al usuario que resuelva el MCP antes de continuar."`
   - **¿Por qué descartaste cada alternativa?** → `"Bloquearía al usuario sin necesidad: la operación es válida y REST cumple el mismo contrato con trazabilidad explícita."`
   - **¿Por qué tomaste esa decisión?** → `"El MCP es default mandatorio pero REST es fallback aceptado del modelo cuando hay registro. Ver CLAUDE.md → Regla de Resiliencia."`
   - **¿Qué artefactos modificaste?** → `"Ninguno — fallback de infraestructura, no de artefactos SDD."`
   - **¿Quién tomó la decisión?** → respuesta del humano.

4. Una vez que `/sdd-log` confirme la entrada en `DECISIONS.md`, ejecutá la operación vía REST API de Jira con basic auth (`ATLASSIAN_USER_EMAIL` + `ATLASSIAN_API_TOKEN` del `.env`).

**Sin `/sdd-log` no hay fallback.** Si por cualquier razón `/sdd-log` falla o el humano no responde, abortá la operación y reportá el problema. No completes el trabajo vía REST sin registro.

**Excepción documentada:** la validación de token vía REST `/myself` que ocurre dentro de `/sdd-setup` NO se registra como fallback. Es uso legítimo de REST por diseño del setup — en ese momento el MCP todavía no está disponible.

## Troubleshooting MCP de Atlassian

Cuando el MCP de Atlassian falle (o el usuario reporte que comandos `/sdd-jira-*` no funcionan), guiá al usuario para diagnosticar antes de cualquier fallback. Mostrá solo la guía del IDE que esté usando.

### Cursor

```
Verificá los servers MCP en Cursor:

  1. Cursor Settings (Ctrl+Shift+J o ícono ⚙) → solapa "Tools" →
     solapa de tu workspace.

  2. Sección "Workspace MCP Servers":
     • atlassian: si dice "Needs authentication", clic en "Connect".
       Si dice "Disabled", prendé el toggle.
     • sdd: el toggle debe estar en verde.

  3. (Recomendado) En la sección "Authentication", activá
     "Wait for MCP Authentication". Sin esto, el popup de OAuth
     se cierra solo a los 30 segundos.
```

### VS Code

```
Verificá los servers MCP en VS Code:

  1. Ctrl+Shift+P → "MCP: List Servers" → seleccioná atlassian →
     "Enable" o "Restart" según corresponda.

  2. Si "MCP: List Servers" no existe, abrí Extensions view
     (Ctrl+Shift+X) → sección "MCP SERVERS - INSTALLED" → clic
     derecho sobre atlassian → habilitalo.

  3. Para ver logs: clic derecho sobre el server → "Show Output".

  (Comandos exactos pueden variar entre versiones de VS Code.)
```

### Claude Code

```
Verificá los servers MCP en Claude Code:

  1. claude mcp list           # debería mostrar atlassian y sdd
  2. claude mcp authenticate atlassian   # si no está autenticado
  3. claude mcp restart atlassian        # si está con error

  Si algún comando no existe en tu versión: claude mcp --help

  (Sintaxis aproximada — los comandos exactos pueden variar entre
   versiones de Claude Code.)
```

<!-- SDD:FRAMEWORK END -->
<!-- Las reglas propias de este repo van a partir de acá. El framework no las toca. -->
