# GDE-GAPS.md — Gaps detectados en la documentación funcional

> Análisis basado en: D5_documento.pdf v1.0 (02-06-2026) + HLD_Reingenieria_GDE_v3.pdf (21-03-2026)
> Un agente de implementación NO puede avanzar sin resolución de los gaps marcados como BLOQUEANTE.

---

## Clasificación de severidad

| Nivel | Significado |
|---|---|
| 🔴 BLOQUEANTE | Sin esto, el agente inventa decisiones de diseño. No implementar. |
| 🟡 RIESGO | Implementable con asunciones explícitas registradas en DECISIONS.md. |
| 🟢 MENOR | No bloquea, pero genera deuda documental. |

---

## Gaps de D5 — Formularios, Workflow y Reglas

### GAP-D5-001 — Error de template: headers D4 en documento D5
**Severidad**: 🟢 MENOR
**Descripción**: Páginas 2–7 del D5_documento.pdf tienen el encabezado "D4 – Gestión del Expediente"
y la sección 5 ("Capacidades que expone al ecosistema") abre con "Lo que D4 le ofrece" cuando
claramente describe D5.
**Riesgo**: Un agente sin la regla explícita puede indexar mal el contenido y atribuir
capacidades de D5 al dominio D4.
**Acción requerida**: Corregir el template del documento. Mientras tanto, `gde-scan.md`
ya incluye la regla de ignorar ese header.
**Owner**: Juan Ignacio Rivera / Proguide

---

### GAP-D5-002 — Sin contratos de servicio (interfaces de los 5 servicios expuestos)
**Severidad**: 🔴 BLOQUEANTE
**Descripción**: Los 5 servicios que D5 expone están nombrados y tienen descripción funcional,
pero carecen de:
- Esquema de request/response
- Endpoint o tipo de contrato (REST, evento, RPC)
- Versión del contrato
- Comportamiento en error

Servicios afectados:
- Servicio de motor de formularios
- Servicio de ejecución de proceso
- Servicio de validación de condiciones
- Servicio de formularios dinámicos
- Servicio de estado de proceso

**Impacto en implementación**: Un agente no puede escribir una sola línea de integración
entre D1↔D5, D3↔D5 o D4↔D5 sin estos contratos.
**Resolución esperada**: LLD de D5 — contratos OpenAPI / AsyncAPI.
**Acción requerida**: No implementar integraciones hasta tener el LLD. Registrar en DECISIONS.md
si se decide avanzar con contratos preliminares.

---

### GAP-D5-003 — Sin modelo de datos de las entidades propias
**Severidad**: 🔴 BLOQUEANTE
**Descripción**: Las 6 entidades de las que D5 es owner están listadas pero sin esquema:
- Definición de proceso
- Instancia de proceso ejecutado
- Definición de formulario
- Instancia de formulario ejecutado
- Reglas de validación
- Log de ejecución del proceso

**Impacto en implementación**: Sin esquema, cualquier decisión de modelo de datos
es una asunción. El log de ejecución en particular ("append-only") tiene implicancias
de diseño de persistencia que requieren decisión explícita.
**Resolución esperada**: LLD de D5 — modelo de datos.

---

### GAP-D5-004 — Unificación FFCC/TAD sin detalle de migración
**Severidad**: 🔴 BLOQUEANTE
**Descripción**: El documento declara "TAD y FFCC se unifican bajo un único motor de formularios —
hoy son dos mundos separados". Esta es una decisión de negocio con implicancias de:
- Migración de formularios existentes
- Compatibilidad de esquemas
- Gestión del rollout (¿big bang o progresivo?)

Ninguno de esos aspectos está definido.
**Impacto en implementación**: Implementar el motor unificado sin este detalle implica
asumir una estrategia de migración que puede invalidar todo el trabajo posterior.
**Resolución esperada**: Documento de estrategia de migración FFCC→D5 o decisión
explícita en DECISIONS.md antes de iniciar implementación.

---

### GAP-D5-005 — Backlog de alta prioridad sin done criteria
**Severidad**: 🟡 RIESGO
**Descripción**: Los 3 ítems marcados como Alta prioridad en el backlog carecen de
criterios de aceptación:

| Ítem | Capacidad | Vacío |
|---|---|---|
| Pre-carga de datos en formularios | Motor de Formularios | Sin definición de qué datos, desde qué dominio, bajo qué condición |
| Workflow Designer (WFD) visual | Motor de WF | Sin especificación de UX, actores, restricciones de configuración |
| Motor de plazos y vencimientos | Motor de WF | Sin definición de tipos de plazo, reglas de escalado, notificaciones |

**Acción requerida**: Correr `/sdd-refine` sobre cada ítem antes de implementar.
Son candidatos directos a una primera feature SDD de D5.

---

### GAP-D5-006 — Contrato del evento D4→D5 vacío
**Severidad**: 🔴 BLOQUEANTE
**Descripción**: El documento menciona: "D4: cuando un evento del expediente (pase, subsanación
completada) dispara el avance al siguiente paso del proceso". Pero no define:
- Tipo de evento (sincrónico/asincrónico)
- Payload del evento
- Quién es el productor formal (D4 o D6)
- Qué hace D5 si el evento llega fuera de orden o duplicado

**Impacto en implementación**: Sin este contrato no se puede implementar la integración
D4→D5 que es el corazón de la orquestación.
**Resolución esperada**: LLD de integración D4↔D5 o sección de eventos en el LLD de D5.

---

### GAP-D5-007 — Sin AS-IS técnico de EE-WEB y TAD-Core
**Severidad**: 🟡 RIESGO
**Descripción**: El documento dice "Migra desde: Lógica de actividades de EE-WEB + TAD-Core
(flujos de trámite)". No hay descripción de:
- Qué lógica existe hoy en EE-WEB
- Qué patrones usa TAD-Core para los flujos
- Qué hay que conservar vs. reemplazar

**Impacto en implementación**: Un agente de migración no tiene punto de partida.
Puede duplicar lógica o romper comportamientos existentes.
**Resolución esperada**: Relevamiento AS-IS de EE-WEB + TAD-Core. Puede generarse
con `/sdd-scan` si hay acceso al código fuente.

---

## Gaps del HLD relevantes para D5

### GAP-HLD-001 — Decisiones de plataforma diferidas al LLD
**Severidad**: 🟡 RIESGO
**Descripción**: El HLD declara que las siguientes decisiones están diferidas al LLD
y no deben asumirse en implementación:
- Configuración detallada de OpenShift
- Contratos OpenAPI detallados
- Manifiestos Kubernetes
- Sizing definitivo
- Estrategia de deployment de componentes de orquestación

**Acción requerida**: `gde-context.md` ya lista estos ítems en "Decisiones diferidas al LLD".
El agente debe bloquearse si una task los toca.

---

### GAP-HLD-002 — Sin asignación de tecnología al motor de orquestación
**Severidad**: 🟡 RIESGO
**Descripción**: El HLD describe la capa de orquestación (sección 24) pero no nombra
ninguna tecnología concreta (ni Camunda, ni Temporal, ni Flowable, ni custom).
Esta decisión tiene impacto directo en cómo se implementa D5.
**Resolución esperada**: LLD de orquestación o decisión registrada en DECISIONS.md.

---

## Resumen ejecutivo

| ID | Dominio | Severidad | Estado |
|---|---|---|---|
| GAP-D5-001 | D5 | 🟢 MENOR | Mitigado en gde-scan.md |
| GAP-D5-002 | D5 | 🔴 BLOQUEANTE | Pendiente LLD |
| GAP-D5-003 | D5 | 🔴 BLOQUEANTE | Pendiente LLD |
| GAP-D5-004 | D5 | 🔴 BLOQUEANTE | Pendiente decisión migración |
| GAP-D5-005 | D5 | 🟡 RIESGO | Requiere /sdd-refine por ítem |
| GAP-D5-006 | D5 | 🔴 BLOQUEANTE | Pendiente LLD integración D4↔D5 |
| GAP-D5-007 | D5 | 🟡 RIESGO | Requiere relevamiento AS-IS |
| GAP-HLD-001 | HLD | 🟡 RIESGO | Mitigado en gde-context.md |
| GAP-HLD-002 | HLD | 🟡 RIESGO | Pendiente decisión tecnológica |

**4 gaps BLOQUEANTES** — El modelo no puede avanzar a implementación hasta resolverlos.
El ciclo correcto: resolver GAP-D5-002/003/004/006 en el LLD → correr `/gde-scan` actualizado
→ recién entonces `/sdd-refine` sobre los ítems del backlog.
