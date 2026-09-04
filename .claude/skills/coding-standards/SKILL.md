---
name: coding-standards
description: Steering skill para aplicar convenciones del modelo SDD. Usar al implementar, refactorizar, revisar código o resolver conflictos de proceso. Carga referencias por contexto (gobernanza, comandos, auditoría, trabajo en equipo) para evitar inflar el contexto en cada turno.
---

# coding-standards

Este skill enruta al agente hacia las reglas correctas sin duplicar el modelo.
No reemplaza comandos SDD ni checks deterministas.

## Uso

Activar cuando la tarea incluya:
- implementación de código
- revisión de PR o code review
- dudas sobre convenciones del repo
- decisiones de proceso (gates, colisiones, cierre)
- QA funcional / E2E de una feature (verificar flujos contra la app corriendo)

## Reglas de oro

1. Si una regla ya la verifica `pnpm audit:sdd`, no la recalcules con juicio del LLM.
2. Si hay conflicto entre una sugerencia y el modelo, manda el modelo (`CLAUDE.md` + comandos SDD).
3. No introducir nuevos procesos sin registrarlo en artefactos versionados.

## Progressive disclosure

Leé solo la referencia que aplique:

- Flujo y fases SDD: `references/sdd-lifecycle.md`
- Gobernanza y equipo: `references/team-governance.md`
- Implementación y review: `references/implementation-review.md`
- Auditoría determinista y CI: `references/deterministic-audit.md`
- QA E2E con ProGuide: `references/e2e-qa.md`

Si la tarea cruza varias áreas, cargá múltiples referencias pero evitá leer archivos no necesarios.
