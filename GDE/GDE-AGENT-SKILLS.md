# GDE-AGENT-SKILLS.md — Skills recomendadas para desarrollo asistido por el modelo GDE

> Skills que un agente necesita para operar eficientemente dentro del pipeline SDD-GDE.
> Organizadas por nivel de necesidad: ESENCIAL (bloquea sin ella) / IMPORTANTE / DESEABLE.

---

## Nivel ESENCIAL

### SKILL-01 — Boundary Enforcement
**Qué es**: Capacidad de comparar el contenido de un brief o una tarea contra la tabla de fronteras
del `gde-context.md` y clasificar automáticamente si algo pertenece al dominio actual
o a otro dominio.

**Por qué es crítica**: El error más recurrente en las mesas de trabajo de GDE fue la
confusión D4/D5. Sin esta skill, el agente implementa capacidades del dominio equivocado
sin advertir al equipo.

**Comportamiento esperado**:
- Al leer una tarea, contrasta cada capacidad requerida contra la tabla "Fronteras"
- Si detecta un cruce: bloquea, indica el dominio correcto, y propone cómo reformular
- No asume que el brief está bien delimitado — siempre valida

**Señal de ausencia**: El agente implementa sin preguntar y luego el review detecta
que la tarea pertenecía a otro dominio.

---

### SKILL-02 — Contract-First Integration
**Qué es**: Capacidad de negarse a implementar una integración entre dominios hasta tener
el contrato de servicio (schema, endpoint, error handling). Si el contrato no existe,
el agente lo declara como bloqueante y detiene la implementación de esa tarea.

**Por qué es crítica**: GDE tiene 7 dominios con integraciones explícitas.
Sin contratos, cada integración es una asunción que genera deuda técnica y riesgo de
rotura cuando el LLD llegue.

**Comportamiento esperado**:
- Al escribir una task que consume un servicio de otro dominio, busca el contrato
  en `gde-context.md` § "Servicios que expone"
- Si el contrato está vacío o ausente → registra GAP en el reporte y saltea la tarea
- No inventa endpoints ni schemas

**Señal de ausencia**: El agente hardcodea URLs, inventa payloads o asume REST
cuando el contrato podría ser un evento asincrónico.

---

### SKILL-03 — LLD Deferral Awareness
**Qué es**: Capacidad de reconocer ítems marcados como "diferidos al LLD" en
`gde-context.md` y bloquearse proactivamente antes de implementarlos.

**Por qué es crítica**: El HLD de GDE difiere explícitamente configuración de plataforma,
contratos OpenAPI, manifiestos Kubernetes y tecnología de orquestación. Un agente
que no reconoce esto introduce decisiones de arquitectura que luego el LLD puede
invalidar, forzando refactors completos.

**Comportamiento esperado**:
- Al procesar `tasks.md`, identifica qué tasks tocan ítems diferidos
- Los marca como `[BLOCKED - pending LLD]` en lugar de implementarlos
- Informa al humano exactamente qué documento se necesita para desbloquear

---

### SKILL-04 — Configuration vs. Code Discrimination
**Qué es**: Capacidad de distinguir cuándo una capacidad debe ser configurable por
un administrador funcional (sin código) versus cuándo debe ser implementada en código.

**Por qué es crítica**: D5 es explícito: "el administrador funcional configura sin
necesidad de programar". Un agente que hardcodea reglas de workflow o esquemas de
formulario en código viola un principio central del dominio.

**Comportamiento esperado**:
- Al diseñar el motor de formularios, propone un schema de configuración (JSON/YAML/DB)
  que el administrador puede editar, no constantes en código
- Al diseñar workflow, propone definiciones de proceso como datos, no como lógica cableada
- Si el brief pide algo que "debería ser configurable", lo señala y propone el mecanismo

**Señal de ausencia**: El agente escribe `if (tipoProceso === 'habilitacion') { ... }`
en lugar de leer la definición de proceso de una fuente de datos.

---

## Nivel IMPORTANTE

### SKILL-05 — AS-IS Archaeology
**Qué es**: Capacidad de analizar código legado (EE-WEB, TAD-Core) para extraer
comportamientos implícitos, patrones de datos y reglas de negocio no documentadas.
Equivale a un `/sdd-scan` sobre código legado orientado a migración.

**Por qué es importante**: Los GAP-D5-004 y GAP-D5-007 no se pueden resolver sin
entender qué existe hoy. Sin esta skill, el agente migra "hacia adelante" sin punto
de partida validado.

**Comportamiento esperado**:
- Lee el código fuente de los sistemas AS-IS
- Genera un inventario de capacidades: qué hace, cómo lo hace, qué datos maneja
- Identifica qué puede migrarse 1:1 y qué requiere rediseño
- Detecta comportamientos no documentados que el equipo funcional puede no conocer

---

### SKILL-06 — Domain Event Modeling
**Qué es**: Capacidad de diseñar y especificar eventos entre dominios: productor,
consumidor, payload, garantías de entrega, idempotencia, ordenamiento.

**Por qué es importante**: La integración D4→D5 (evento que dispara avance de proceso)
es el núcleo del workflow. Sin esta skill el agente no puede cerrar GAP-D5-006.

**Comportamiento esperado**:
- Propone el contrato del evento con producer/consumer/payload/version
- Considera casos borde: evento duplicado, evento fuera de orden, evento con estado inconsistente
- Propone estrategia de dead letter / retry

---

### SKILL-07 — State Machine Reasoning
**Qué es**: Capacidad de modelar y razonar sobre máquinas de estado finito:
identificar estados, transiciones, condiciones de guarda y acciones.

**Por qué es importante**: El motor de workflow de D5 es fundamentalmente una máquina
de estados. Un agente que no razona en estos términos va a implementar un workflow
frágil y difícil de auditar.

**Comportamiento esperado**:
- Al implementar una definición de proceso, produce un diagrama de estados implícito
  (o explícito si se pide)
- Identifica estados terminales, transiciones inválidas y condiciones de bloqueo
- Verifica que el log de ejecución captura cada transición

---

### SKILL-08 — Multi-Actor Workflow Awareness
**Qué es**: Capacidad de razonar sobre flujos donde múltiples actores intervienen
en distintos pasos: ciudadano (TAD), agente (EU), administrador funcional, sistemas externos.

**Por qué es importante**: D5 sirve a múltiples canales con el mismo motor. Un agente
que asume un solo actor va a generar formularios y flujos que rompen cuando otro actor
intenta usarlos.

**Comportamiento esperado**:
- Al especificar un formulario, identifica explícitamente quién lo completa
- Al especificar una transición, identifica quién puede ejecutarla y bajo qué condiciones
- Distingue entre asignación de tarea (a quién le toca) y permiso de ejecución (quién puede)

---

## Nivel DESEABLE

### SKILL-09 — Audit Trail Design
**Qué es**: Capacidad de diseñar desde el inicio un log de auditoría append-only
que capture cada decisión del proceso, con trazabilidad completa.

**Por qué es deseable**: El documento D5 declara "Log de ejecución del proceso:
historial append-only de cada paso ejecutado". Sin diseño explícito de este log,
la auditoría se convierte en un afterthought.

---

### SKILL-10 — Schema Migration Planning
**Qué es**: Capacidad de planificar migraciones de esquema con estrategias de
compatibilidad (expand/contract, versioning, feature flags).

**Por qué es deseable**: La unificación FFCC/TAD (GAP-D5-004) va a requerir
migración de esquemas existentes. Un agente con esta skill puede proponer un
plan de migración progresivo en lugar de un big bang.

---

## Resumen de skills por comando del modelo

| Comando | Skills necesarias |
|---|---|
| `/gde-scan` | SKILL-05 (AS-IS), SKILL-03 (LLD deferral) |
| `/sdd-refine` | SKILL-01 (boundaries), SKILL-04 (config vs code) |
| `/sdd-generate` | SKILL-01, SKILL-02 (contracts), SKILL-07 (state machine), SKILL-08 (multi-actor) |
| `/sdd-validate` | SKILL-01, SKILL-02, SKILL-03 |
| `/sdd-implement` | SKILL-02, SKILL-04, SKILL-06 (events), SKILL-07, SKILL-09 (audit) |
| `/sdd-health` | SKILL-05 (detectar drift en AS-IS), SKILL-03 |

---

## Gap de skills vs. estado actual del modelo

| Skill | Cobertura actual en los comandos |
|---|---|
| SKILL-01 Boundary enforcement | ✅ Parcial — `sdd-validate` + `sdd-refine` GDE lo verifican |
| SKILL-02 Contract-first | ⚠️ Solo en validate — falta en generate e implement |
| SKILL-03 LLD deferral | ✅ En `gde-context.md` como lista — falta bloqueo activo en implement |
| SKILL-04 Config vs. code | ❌ No hay regla en ningún comando |
| SKILL-05 AS-IS archaeology | ⚠️ `/sdd-scan` cubre código existente, no legado GDE específico |
| SKILL-06 Event modeling | ❌ No cubierto |
| SKILL-07 State machine | ❌ No cubierto |
| SKILL-08 Multi-actor | ⚠️ Parcial — spec.md pide actores pero no razonamiento de asignación |
| SKILL-09 Audit trail | ❌ No cubierto |
| SKILL-10 Schema migration | ❌ No cubierto |
