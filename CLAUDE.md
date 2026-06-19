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
    ↓  /sdd-checklist
checklist.md (lo completa el humano)
    ↓  /sdd-review
verificación final: lógica + UI
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
El archivo `.vscode/mcp.json` ya incluye ambos servidores. Cursor los levanta
automáticamente al abrir el proyecto. La primera vez te va a pedir autenticar
tu cuenta de Atlassian — seguí el flujo OAuth que aparece en el panel MCP.

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
