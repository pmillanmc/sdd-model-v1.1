Sincronizá el estado entre `jira-map.yaml` y Jira en ambas direcciones.

**Uso:** `/sdd-jira-sync [feature_id]`

Si se pasa un `feature_id`, operá sobre esa feature específica.
Si no se pasa, resolvé el feature_id activo así:
- Llamá a `sdd_list_features` con `status: "OPEN"`
- Si hay exactamente una → usala sin preguntar
- Si hay más de una → mostrá la lista y preguntá al usuario cuál sincronizar antes de continuar
- Si no hay ninguna → avisá: "No hay features OPEN en el registro." y PARÁ

**Prerequisito de configuración:** este comando requiere el Atlassian MCP activo
(`https://mcp.atlassian.com/v1/mcp`) y el mcp-proguide con `SDD_PROJECT_ROOT`
apuntando al proyecto. Si alguno no está disponible, avisá y PARÁ.

**Gate de prerequisitos (no negociable):**
- Debe existir `specs/[feature_id]/jira-map.yaml`. Si no existe avisá:
  "No hay jira-map.yaml para esta feature — corré /sdd-generate primero." y PARÁ.
- Debe existir `specs/[feature_id]/tasks.md`. Si no existe avisá:
  "No hay tasks.md para esta feature — corré /sdd-generate primero." y PARÁ.

---

## Paso 1 — Relevamiento

Leé en paralelo:
- `specs/[feature_id]/jira-map.yaml` — estado actual del mapa
- `specs/[feature_id]/tasks.md` — tasks definidas por SDD
- Atlassian MCP → traé todos los tickets del sprint activo que tengan `label: sdd-generated` O que estén vinculados al `jira_ticket` de la feature en el mapa

Con esos tres insumos, construí internamente cuatro listas:

**Lista A — Tasks SDD sin ticket:**
Tasks en `tasks.md` con `jira_ticket: null` en el mapa.

**Lista B — Cambios de estado pendientes:**
Tasks donde el status en `jira-map.yaml` difiere del estado real del ticket en Jira
(ej. task en `open` pero ticket en Jira ya está `IN PROGRESS`).

**Lista C — Tickets de PO sin vincular:**
Tickets en Jira sin `label: sdd-generated` que no están en el mapa.

**Lista D — Posibles duplicados:**
Cruces entre Lista A y Lista C donde similitud de título es alta.
Para cada par, calculá similitud semántica por título y marcalo como candidato a unificación.

---

## Paso 2 — Resolución de duplicados (Lista D)

Si la Lista D no está vacía, mostrá al dev los candidatos antes de continuar:

```
🔍 Posibles duplicados encontrados:

  SCRUM-12 "Crear formulario de login"  [PO]
  └── ¿Es la misma cosa que T-003 "Implementar pantalla de login"?
      [sí — unificar] [no — mantener separados] [ignorar por ahora]

  SCRUM-14 "Fix validación de contraseña"  [PO]
  └── Sin match claro en tasks.md
      [agregar como task nueva] [ignorar por ahora]
```

Esperá respuesta del dev para cada uno antes de continuar.

Resoluciones posibles:
- **unificar** → el ticket de PO toma el `task_id` de la task SDD. La task SDD toma el `jira_ticket` del PO. Se marca `source: merged` en el mapa. La task sale de Lista A y Lista C.
- **mantener separados** → conviven como entradas independientes en el mapa.
- **ignorar** → no entra al mapa en esta sesión.

---

## Paso 3 — Tasks SDD sin ticket (Lista A)

Si la Lista A no está vacía tras resolver duplicados, mostrá la propuesta:

```
📋 Tasks sin ticket en Jira — ¿las creamos?

  T-001 · implementación · "Crear componente AlertPanel"
  T-004 · test           · "Tests unitarios AlertPanel"

¿Confirmás, editás o descartás alguno?
```

Esperá confirmación. Para cada task aprobada:
- Creá el ticket en Jira con `title: "[T-NNN] [título]"`, `label: sdd-generated`, y tipo inferido.
- Actualizá `jira-map.yaml` con el `jira_ticket` asignado.

---

## Paso 4 — Tickets de PO sin vincular (Lista C)

Si la Lista C no está vacía tras resolver duplicados, mostrá la lista al dev:

```
📥 Tickets de PO sin vincular al mapa SDD:

  SCRUM-15 · "Revisar diseño mobile del panel"
  SCRUM-16 · "Agregar tooltip en mapa"

¿Los agregamos al mapa como tasks de PO, o los ignoramos?
```

Para cada ticket aprobado, agregá al mapa:

```yaml
- task_id: null
  title: "[título del ticket]"
  type: po
  jira_ticket: [KEY-NNN]
  source: po
  status: [estado actual en Jira]
```

---

## Paso 5 — Cambios de estado (Lista B)

Si la Lista B no está vacía, mostrá las diferencias detectadas:

```
🔄 Diferencias de estado detectadas:

  T-002 "Conectar con endpoint de alertas"
  └── jira-map.yaml: open → Jira: IN PROGRESS
      ¿Actualizamos el mapa? [sí / no]

  T-003 "Configurar variables de entorno"
  └── jira-map.yaml: open → Jira: FINALIZADO
      ¿Actualizamos el mapa y marcamos la task como cerrada? [sí / no]
```

Para cada cambio aprobado por el dev:
- Actualizá el `status` en `jira-map.yaml`.
- Si el nuevo estado es equivalente a "cerrado" (`FINALIZADO`, `Done`, `Closed`),
  marcá `status: closed` en el mapa.

**Regla importante:** este comando actualiza el mapa en base a Jira, no al revés.
Si el dev quiere actualizar Jira en base al estado SDD, debe hacerlo manualmente
o mediante `/sdd-jira-close` al cerrar la feature completa.

---

## Paso 6 — Confirmar y escribir

Mostrá un resumen de todos los cambios que se van a aplicar al mapa:

```
📝 Cambios a aplicar en jira-map.yaml:

  + T-001 → SCRUM-17 (ticket creado)
  ~ T-002 → status: open → in_progress
  + SCRUM-15 agregado como task de PO
  ↔ T-003 unificado con SCRUM-12 (source: merged)

¿Confirmás y escribimos el mapa actualizado?
```

Esperá confirmación final antes de escribir el archivo.

---

## Reglas estrictas

- Nunca escribir `jira-map.yaml` sin confirmación final del dev.
- Nunca crear tickets en Jira sin confirmación explícita por cada uno.
- Nunca actualizar estados en Jira desde este comando — solo actualiza el mapa local.
- Si cualquier llamada al Atlassian MCP falla, reportá el error exacto y continuá con el resto del sync. No abortes por un error parcial.
- Si las cuatro listas están vacías al finalizar el Paso 1, avisá:
  "Todo sincronizado — no hay diferencias entre jira-map.yaml y Jira." y PARÁ.

**Hook de métricas (obligatorio al finalizar):**
Agregá al archivo `metrics/[feature_id]-metrics.md` el siguiente bloque:

```
## Jira-Sync — [timestamp]
- command_origin: sdd-jira-sync
- tasks_sin_ticket: [N de Lista A]
- tickets_po_nuevos: [N de Lista C]
- duplicados_resueltos: [N unificados]
- cambios_estado: [N de Lista B aprobados]
```