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

| Trigger keywords | Comando | Cuándo cargar el .md |
|---|---|---|
| explain, qué es, cómo funciona, onboarding | `/sdd-explain` | Primer contacto con el modelo |
| scan, codebase, código existente, brownfield | `/sdd-scan` | Proyecto con código previo |
| refine, clarifica, grilling, ambigüedad, brief | `/sdd-refine` | Hay `drafts/` sin pulir |
| generate, spec, constitution, plan, tasks | `/sdd-generate` | `input.md` listo |
| validate, gap, cobertura, brief vs spec | `/sdd-validate` | Spec generada, querés verificar |
| log, decisión, ADR, alternativas | `/sdd-log` | Hay un desvío que registrar |
| implement, código, TDD, tareas | `/sdd-implement` | `tasks.md` listo |
| checklist, criterios manuales, UX | `/sdd-checklist` | Implementación cerrada |
| review, gate final, UI vs spec | `/sdd-review` | Listo para gate final |
| health, drift, auditoría, sprint | `/sdd-health` | Cierre de sprint o sospechás drift |
| metrics, tokens, retrabajo | `/sdd-metrics` | Querés ver costo de esta feature |
| metrics-summary, proyecto, agregado | `/sdd-metrics-summary` | Querés ver costo del proyecto completo |
| handoff, continuar, próxima sesión, snapshot | `/sdd-handoff` | Cerrás sesión o pasás a otro agente |
| compact, contexto, fase, transición | `/sdd-compact-guide` | No sabés si conviene compactar ahora |
| context budget, overhead, peso framework | `/sdd-context-budget` | Querés saber cuánto pesa el framework |
| test, smoke, fixture | `/sdd-test` | Validás cambios al propio modelo SDD |

Para invocar cualquier comando, el `.md` se carga sólo cuando el trigger aparece en la conversación o el usuario lo invoca explícitamente. Esta tabla es la única que se carga al inicio de sesión.

## Reglas generales

- Usá `pnpm` como gestor de paquetes (salvo que `existing-arch.md` declare otro)
- Los tests van antes de la implementación (TDD)
- No inventés arquitectura que no esté en `plan.md`
- Si existe `existing-arch.md`, sus restricciones son no negociables salvo decisión registrada en `DECISIONS.md`
- Si algo del brief es ambiguo, preguntá antes de implementar


### Regla de Observabilidad (Telemetría DX)
**Metrics Mandatory**: Al completar la ejecución de `/sdd-implement` o finalizar una tarea grande, el agente DEBE autoevaluarse ejecutando el comando `/sdd-metrics` (o leyendo `.claude/commands/sdd-metrics.md`) para generar el reporte de retrabajo y ambigüedad.
Para ver el resumen agregado de todas las features, corré `/sdd-metrics-summary`.
