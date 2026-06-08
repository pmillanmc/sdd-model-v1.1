# Comando: Generar Reporte de Métricas (Telemetría SDD)

**Descripción:** Este comando audita la eficiencia de la sesión actual y la claridad de la especificación.

## Instrucciones para el Agente

### Paso 0 — Determinar feature_id e iteration_number

Antes de escribir el reporte:
1. El `feature_id` es el nombre de la carpeta dentro de `specs/` (ej. `001-login`). Si no existe carpeta, usá el nombre del artefacto principal (ej. nombre del `input.md`).
2. Contá cuántos archivos `*-metrics.md` existen ya en `metrics/` para esa feature. Ese número + 1 es el `iteration_number`.
3. El `command_origin` es el comando que disparó este reporte (ej. `sdd-implement`, `sdd-validate`, `manual`).

Creá (o actualizá si ya existe) el archivo `metrics/[feature_id]-metrics.md` con la siguiente estructura exacta:

### 📊 Reporte de Esfuerzo SDD

**Contexto de ejecución**
- **feature_id**: [valor detectado en Paso 0]
- **command_origin**: [comando que disparó este reporte]
- **iteration_number**: [número de ejecución para esta feature]
- **timestamp**: [fecha y hora ISO 8601]

**Eficiencia de la IA (DX)**
- [ ] DX_MET_001 **Ciclos de Autocorrección**: [Número de veces que un test falló y tuviste que arreglar el código por tu cuenta].
- [ ] DX_MET_002 **Consultas de Clarificación**: [Número de veces que tuviste que preguntarle al usuario por falta de detalles en la spec].
- [ ] DX_MET_003 **Interacciones Totales**: [Cantidad de prompts/turnos usados].

**Análisis de Retrabajo**
- [ ] DX_MET_004 **Causa Raíz**: [Si hubo errores, explica brevemente si fue culpa técnica o por ambigüedad de la Spec].
- [ ] DX_MET_005 **Resiliencia**: [¿Alcanzaste algún límite de rate-limit o tokens durante la tarea?].
- [ ] DX_MET_006 **Token Budget Estimado**: Para cada artefacto leído durante la sesión, reportá su tamaño en bytes y la estimación de tokens (bytes ÷ 4). Sumá el total.

  | Artefacto | Bytes | Tokens estimados |
  |---|---|---|
  | `existing-arch.md` | — | — |
  | `input.md` | — | — |
  | `constitution.md` | — | — |
  | `spec.md` | — | — |
  | `plan.md` | — | — |
  | `tasks.md` | — | — |
  | archivos de código leídos | — | — |
  | **TOTAL INPUT estimado** | — | — |

  Nota: este número es el input mínimo garantizado (artefactos SDD). El costo real de sesión puede ser 3–10× mayor por contexto acumulado. La reducción más efectiva es iniciar sesión nueva por fase.

**Rework Ratio (calculado)**
- **Tareas totales en tasks.md**: [N]
- **DX_MET_001 acumulado (todas las iteraciones de esta feature)**: [suma de los DX_MET_001 de archivos previos + esta sesión]
- **Entradas en DECISIONS.md para esta feature**: [N]
- **Rework Ratio estimado**: `(DX_MET_001_acumulado + entradas_DECISIONS) ÷ tareas_totales`