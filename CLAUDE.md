# SDD Model — Contexto del proyecto

## Qué es esto

Este es un modelo de trabajo para Spec-Driven Development (SDD).
El objetivo es generar código a partir de un brief inicial estructurado,
pasando por artefactos intermedios que guían la implementación.

## Ciclo de trabajo

```
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

[TRANSVERSAL — disponible en cualquier momento]
/sdd-handoff [propósito] → snapshot de sesión para continuar en otro agente o sesión
/sdd-compact-guide → ¿conviene compactar ahora? tabla de decisión por fase
/sdd-context-budget → auditoría del peso en tokens del framework
```

## Comandos disponibles

Cargá el `.md` del comando solo cuando el trigger aparezca en la conversación o el usuario lo invoque explícitamente.

| Trigger keywords | Comando | Cuándo cargar el .md |
|---|---|---|
| explain, qué es, cómo funciona, onboarding | `/sdd-explain` | Primer contacto con el modelo |
| scan, codebase, código existente, brownfield | `/sdd-scan` | Proyecto con código previo |
| refine, clarifica, grilling, ambigüedad, brief | `/sdd-refine` | Hay `drafts/` sin pulir |
| generate, spec, constitution, plan, tasks | `/sdd-generate` | `input.md` listo |
| validate, gap, cobertura, brief vs spec | `/sdd-validate` | Spec generada, querés verificar |
| log, decisión, ADR, alternativas | `/sdd-log` | Hay un desvío que registrar |
| implement, código, TDD, tareas | `/sdd-implement` | `tasks.md` listo |
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


### Regla de Observabilidad (Telemetría DX)
**Metrics Mandatory**: Al completar la ejecución de `/sdd-implement` o finalizar una tarea grande, el agente DEBE autoevaluarse ejecutando el comando `/sdd-metrics` (o leyendo `.claude/commands/sdd-metrics.md`) para generar el reporte de retrabajo y ambigüedad.
Para ver el resumen agregado de todas las features, corré `/sdd-metrics-summary`.
