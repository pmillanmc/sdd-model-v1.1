# SDD lifecycle

Fuente principal: `CLAUDE.md` y `README.md`.

## Flujo operativo

1. `/sdd-scan` (solo brownfield)
2. `/sdd-refine`
3. `/sdd-generate`
4. `/sdd-validate`
5. `/sdd-implement`
6. `/sdd-checklist`
7. `/sdd-review`
8. `/sdd-health` (mantenimiento)

## Comandos transversales (disponibles en cualquier fase)

- `/sdd-fix` — bugs/hotfixes ≤3 archivos; no bypasea gates ni colisiones
- `/sdd-log` — registra en `DECISIONS.md` cualquier desvío del brief
- `/sdd-handoff` — snapshot de sesión para continuar en otro agente
- `/sdd-metrics` / `/sdd-metrics-summary` — telemetría de esfuerzo y rework

## Política

- No saltar fases sin confirmación humana explícita y registro en `DECISIONS.md`.
- El modelo privilegia trazabilidad y decisiones explícitas sobre velocidad ciega.
- Para cambios chicos urgentes, usar `/sdd-fix`; si crece (>3 archivos), promover a feature.
