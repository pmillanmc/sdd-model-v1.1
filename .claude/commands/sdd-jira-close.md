Cerrá la feature activa en el registro SDD y actualizá el ticket en Jira.

**Argumento opcional:** `/sdd-jira-close [feature_id]`
Si se pasa un `feature_id`, operá sobre esa feature específica.
Si no se pasa, resolvé el feature_id activo así:
- Llamá a `sdd_list_features` con `status: "OPEN"`
- Si hay exactamente una → usala sin preguntar
- Si hay más de una → mostrá la lista y preguntá al usuario cuál cerrar antes de continuar
- Si no hay ninguna → avisá: "No hay features OPEN en el registro." y PARÁ

**Gate de prerequisitos (no negociable):**
- Debe existir un bloque `## Review` en `metrics/[feature_id]-metrics.md`
  con `resultado: APROBADO`. Si no existe o dice `PENDIENTE`, avisá:
  "No hay review aprobado — corré /sdd-review primero." y PARÁ.
- Debe existir la key del ticket Jira en el registro (`jira_ticket` en `features.yaml`).
  Si no está, preguntá la key al usuario antes de continuar.
- Requiere el Atlassian MCP activo. Si no está disponible, avisá y PARÁ.

## Paso 1 — Cerrar en mcp-proguide

Llamá a `sdd_close_feature` con el `feature_id` resuelto.

Si la feature tocó archivos que no están en `graph/domain.yaml`, llamá también a
`sdd_update_domain_graph` para mantener el grafo actualizado.

## Paso 2 — Construir el resumen de cierre

Leé `metrics/[feature_id]-metrics.md` y construí un resumen ejecutivo:

```
Feature [feature_id] — Cierre
──────────────────────────────
Resultado review: APROBADO
Criterios sin test: [N de ⚠️ en sdd-review]
Decisiones registradas: [N entradas en DECISIONS.md]
Ciclos de rework: [campo rework_cycles de métricas si existe]
```

## Paso 3 — Actualizar Jira

Con el Atlassian MCP:

1. `transition_issue([jira_ticket], "Done")` — mover al estado final del board.
2. `add_comment([jira_ticket], resumen)` — agregar el resumen de cierre como comentario
   en el ticket para trazabilidad.

Confirmá al usuario:

```
✅ Feature [feature_id] cerrada en el registro SDD
✅ Ticket [KEY-NNN] movido a Done
✅ Comentario de cierre agregado en Jira

Próximo paso: /sdd-jira-start para continuar con el siguiente ticket.
```

## Reglas estrictas

- Nunca llamés a `sdd_close_feature` sin el gate de APROBADO cumplido.
- El comentario en Jira debe ser legible por un humano que no conoce SDD —
  no pongas términos internos del modelo sin explicarlos.
- Si `transition_issue` falla (estado inválido para el board), avisá al usuario
  con el error exacto y pedile que mueva el ticket manualmente. No abortes el
  cierre en SDD por un error de Jira — son operaciones independientes.

**Hook de métricas (obligatorio al finalizar):**
Al completar el paso 3, agregá al archivo `metrics/[feature_id]-metrics.md`
el siguiente bloque:

```
## Jira-Close — [timestamp]
- command_origin: sdd-jira-close
- jira_ticket: [KEY-NNN]
- transicion_exitosa: [true/false]
- comentario_agregado: [true/false]
```
