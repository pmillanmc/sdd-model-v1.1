# Deterministic audit

Fuente principal: `scripts/sdd-audit.mjs` y `.github/workflows/sdd-audit.yml`.

## Principio

Todo lo determinista se valida por script, no por opinión del LLM.

## Contrato

- Ejecutar `pnpm audit:sdd` para verificar consistencia del modelo.
- Si el audit falla, priorizar corregir el estado del repositorio antes de seguir.
- El CI es la autoridad final de cumplimiento para merge.

## Qué NO hacer

- No inventar checks alternativos que contradigan el script.
- No declarar "aprobado" sin evidencia verificable.
