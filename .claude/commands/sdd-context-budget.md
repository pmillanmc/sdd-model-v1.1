# Comando: Auditoría de Token Budget del Framework SDD

**Descripción:** Reporta el peso en tokens estimados de cada componente del framework SDD para identificar qué consume contexto al inicio de sesión, antes de cualquier trabajo de implementación.

## Instrucciones para el Agente

### Paso 1 — Detectar componentes del framework

Listá y medí los siguientes archivos si existen:
- `CLAUDE.md` — siempre cargado al inicio de sesión
- `WORKFLOW.md` — referenciado por CLAUDE.md
- `AGENT-HANDOFF.md` — handoff actual si existe
- Todos los archivos en `.claude/commands/*.md`
- Artefactos de la feature activa si existe `specs/[feature_id]/`
- `existing-arch.md` si está presente (modo brownfield)
- `DECISIONS.md` global

### Paso 2 — Clasificar cada componente

| Bucket | Criterio |
|---|---|
| Always loaded | Se carga automáticamente al iniciar una sesión |
| Loaded by reference | Comandos en `.claude/commands/` que sólo se cargan al invocarlos |
| Conditionally loaded | Artefactos de feature, DECISIONS.md, existing-arch.md — según fase del ciclo |

### Paso 3 — Reportar

Formato del reporte:

## SDD Context Budget — [FECHA]

### Always loaded
| Archivo | Bytes | Tokens estimados |
|---|---|---|
| CLAUDE.md | — | — |
| WORKFLOW.md | — | — |
| **Subtotal** | — | — |

### Loaded by reference
| Archivo | Bytes | Tokens estimados |
|---|---|---|
| (uno por comando en `.claude/commands/`) | — | — |
| **Subtotal** | — | — |

### Conditionally loaded (estado actual del repo)
| Archivo | Bytes | Tokens estimados |
|---|---|---|
| (los que existan ahora) | — | — |
| **Subtotal** | — | — |

### Total
- Baseline (siempre cargado): [N] tokens
- Si invocás todos los comandos en la sesión: +[N] tokens
- Si trabajás sobre la feature activa: +[N] tokens
- Total peor caso: [N] tokens

### Recomendaciones
- Si baseline > 3000 tokens: revisar CLAUDE.md.
- Si un comando individual > 500 tokens: considerar dividirlo.
- Si DECISIONS.md > 5000 tokens: archivar entradas viejas o superseded.

### Método de estimación

Tokens estimados = ceil(bytes / 4). Misma heurística que `/sdd-metrics` para `DX_MET_006`. La diferencia: `/sdd-context-budget` audita el OVERHEAD del framework antes del trabajo; `/sdd-metrics` audita el COSTO de una sesión específica.

### Reglas

- Solo reportá, no modifiques.
- Si un archivo listado no existe, marcalo como "no presente" y omitilo del subtotal.
