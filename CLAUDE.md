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
   /sdd-refine
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
```

## Comandos disponibles

| Comando | Fase | Qué hace |
|---|---|---|
| `/sdd-explain` | Onboarding | Explica el modelo completo y cómo conecta cada parte |
| `/sdd-scan` | 0 (brownfield) | Lee el código existente y genera `existing-arch.md` |
| `/sdd-refine` | 2 | Lee `drafts/` (+ `existing-arch.md`) y genera `input.md` pulido |
| `/sdd-generate` | 3 | Lee `input.md` y genera los 4 artefactos SDD |
| `/sdd-validate` | 3 | Verifica que los artefactos cubren el brief |
| `/sdd-log` | 3/4 | Registra decisiones que desvían el brief en `DECISIONS.md` |
| `/sdd-implement` | 4 | Implementa todas las tareas de `tasks.md` con TDD |
| `/sdd-checklist` | 4 | Genera criterios de verificación no automatizables |
| `/sdd-review` | 4 | Gate final: lógica (spec + tests) + UI |
| `/sdd-health` | Mant. | Auditoría por sprint — detecta deuda documental y drift |

## Reglas generales

- Usá `pnpm` como gestor de paquetes (salvo que `existing-arch.md` declare otro)
- Los tests van antes de la implementación (TDD)
- No inventés arquitectura que no esté en `plan.md`
- Si existe `existing-arch.md`, sus restricciones son no negociables salvo decisión registrada en `DECISIONS.md`
- Si algo del brief es ambiguo, preguntá antes de implementar


### Regla de Observabilidad (Telemetría DX)
**Metrics Mandatory**: Al completar la ejecución de `/sdd-implement` o finalizar una tarea grande, el agente DEBE autoevaluarse ejecutando el comando `/sdd-metrics` (o leyendo `.claude/commands/sdd-metrics.md`) para generar el reporte de retrabajo y ambigüedad.