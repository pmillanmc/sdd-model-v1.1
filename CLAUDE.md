# SDD Model — Contexto del proyecto

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

## Gobernanza y routing de contexto

- **Registro maestro**: `specs/_registry/features.yaml` indexa toda feature
  (status, dominio, owner, sprint, archivos que toca, decisiones).
  `/sdd-generate` registra, `/sdd-review` cierra, `/sdd-health` audita.
- **Sprints**: un archivo por sprint en `specs/_registry/sprints/` con scope
  y gate de cierre. El humano define el scope; los comandos no lo modifican.
- **Grafo de dominio**: `graph/domain.yaml` mapea dominios → entidades,
  servicios, componentes y rutas exactas de archivos. Lo genera `/sdd-scan`.
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
  gates de cierre, grafo y sprints. Corre en CI en cada PR. Lo que el
  script ya verifica, los agentes NO lo recalculan — leen su salida.
- **Bugs chicos van por /sdd-fix**, no por el ciclo completo ni por fuera
  del modelo. Si un fix crece (>3 archivos, contratos nuevos), se promueve
  a feature con /sdd-refine.

## Configuración de MCPs

Los comandos `/sdd-jira-start`, `/sdd-jira-sync` y `/sdd-jira-close` requieren dos servidores MCP activos:
- **mcp-proguide** — gobernanza SDD local (registry, audit, graph, metrics)
- **Atlassian MCP** — integración con Jira

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