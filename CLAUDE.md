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
    ↓  /sdd-checklist
checklist.md (lo completa el humano)
    ↓  /sdd-review
verificación final: lógica + UI
    ↓  cada sprint
/sdd-health → auditoría de artefactos + drift de existing-arch

[TRANSVERSAL — disponible en cualquier momento]
/sdd-handoff [propósito] → snapshot de sesión para continuar en otro agente o sesión
```
<!-- NUEVO [sdd-handoff]: línea transversal agregada al diagrama del ciclo -->
<!-- FIN NUEVO -->

## Comandos disponibles

| Comando | Fase | Qué hace |
|---|---|---|
| `/sdd-explain` | Onboarding | Explica el modelo completo y cómo conecta cada parte |
| `/sdd-scan` | 0 (brownfield) | Lee el código existente y genera `existing-arch.md` |
| `/sdd-refine` | 2 | Lee `drafts/` (+ `existing-arch.md`) y genera `input.md` pulido. **Equivalente al skill `business-clarifier` — usar uno u otro, no ambos.** |
| `/sdd-generate` | 3 | Lee `input.md` y genera los 4 artefactos SDD |
| `/sdd-validate` | 3 | Verifica que los artefactos cubren el brief |
| `/sdd-log` | 3/4 | Registra decisiones que desvían el brief en `DECISIONS.md` |
| `/sdd-implement` | 4 | Implementa todas las tareas de `tasks.md` con TDD |
| `/sdd-fix` | Transversal | Ruta corta para bugs/hotfixes (≤3 archivos, test reproductor obligatorio, chequeo de colisiones) |
| `/sdd-checklist` | 4 | Genera criterios de verificación no automatizables |
| `/sdd-review` | 4 | Gate final: lógica (spec + tests) + UI |
| `/sdd-health` | Mant. | Auditoría por sprint — detecta deuda documental y drift |
| `/sdd-metrics` | Mant. | Genera reporte de esfuerzo y tokens de la sesión actual |
| `/sdd-metrics-summary` | Mant. | Agrega métricas de todas las features y muestra totales del proyecto |
| `/sdd-handoff` | Transversal | Comprime el estado de sesión para continuar en otra sesión o agente. Requiere `DECISIONS.md` al día. |

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


### Regla de Observabilidad (Telemetría DX)
**Metrics Mandatory**: Al completar la ejecución de `/sdd-implement` o finalizar una tarea grande, el agente DEBE autoevaluarse ejecutando el comando `/sdd-metrics` (o leyendo `.claude/commands/sdd-metrics.md`) para generar el reporte de retrabajo y ambigüedad.
Para ver el resumen agregado de todas las features, corré `/sdd-metrics-summary`.
