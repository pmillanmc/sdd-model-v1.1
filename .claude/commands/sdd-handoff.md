## Argumentos

Este comando recibe un argumento obligatorio: el propósito del handoff.
Ejemplo: `/sdd-handoff "prototipo de sistema de pagos para validar antes de spec"`

Si no recibís argumento, preguntá:
"¿Cuál es el propósito de este handoff? (qué va a hacer la próxima sesión o agente)"
Esperá la respuesta antes de continuar. No podés escribir un handoff útil sin saber su foco.

---

## Paso 1 — Verificación de trazabilidad (obligatorio, no salteable)

Antes de generar cualquier documento, verificá si hay decisiones en la sesión actual
que no estén registradas en `DECISIONS.md`.

Señales de decisiones no loggeadas:
- Artefactos modificados después de su último registro en DECISIONS.md
- Desvíos del brief discutidos en el chat pero no formalizados
- Acuerdos tomados en esta sesión que afectan constitution.md, spec.md, plan.md o tasks.md

Si detectás decisiones sin loggear:
**PARÁ. No generes el handoff.**
Avisá al usuario:
"Hay decisiones en esta sesión que no están en DECISIONS.md: [listar].
Corré /sdd-log para registrarlas antes de continuar con el handoff."

Solo avanzá al Paso 2 cuando DECISIONS.md esté al día.

---

## Paso 2 — Detección de fase y artefactos

Detectá automáticamente el estado del proyecto leyendo qué archivos existen:

- `existing-arch.md` → modo brownfield activo
- `drafts/` con contenido → Fase 1 en curso
- `input.md` sin artefactos de spec → Fase 2 completada / Fase 3 no iniciada
- `specs/[feature]/` con constitution + spec + plan + tasks → Fase 3 completada
- `app/` o código en `source_root` → Fase 4 en curso o completada
- `checklist.md` → Fase 4 avanzada

Reportá internamente qué fase está activa. Esto determina qué incluir en el documento.

---

## Paso 3 — Determiná el tipo de handoff

Según el propósito declarado, determiná el tipo:

**TIPO OPERATIVO** — sesión paralela, prototipo, bug fix fuera de scope, tarea aislada.
Condición: el propósito es trabajo acotado que no cruza un gate formal del ciclo.
Destino: directorio temporal del OS (`$TMPDIR` en macOS/Linux, `%TEMP%` en Windows).
Nombre: `sdd-handoff-[slug-del-proposito]-[YYYYMMDD].md`

**TIPO GATE** — transición formal entre fases (Fase 3 → Fase 4, cierre de sprint post-health).
Condición: el propósito implica entregar el estado del proyecto a la siguiente fase.
Destino: `handoffs/` en la raíz del repo (crear la carpeta si no existe).
Nombre: `handoffs/[YYYYMMDD]-[fase]-[slug-del-proposito].md`

Si tenés dudas sobre el tipo, preguntá al usuario antes de continuar.

---

## Paso 4 — Generá el documento

Escribí el handoff con este formato exacto:

```
# Handoff — [propósito declarado]
Fecha: [YYYY-MM-DD]
Tipo: [OPERATIVO | GATE]
Sesión de origen: [fase activa detectada]
Próximo comando sugerido: [el comando SDD más lógico para continuar]

---

## Contexto del proyecto
[2-3 líneas máximo. Qué se está construyendo y para qué.
No duplicar lo que ya está en constitution.md o input.md — referenciarlos.]
→ Ver: [artefactos relevantes con su ruta]

## Estado al momento del handoff
[Qué se completó, qué está en curso, qué está bloqueado.
Una línea por ítem. Sin narrativa larga.]

✅ Completado:
- [ítem]

🔄 En curso:
- [ítem + estado específico]

🚧 Bloqueado / pendiente de decisión:
- [ítem + razón del bloqueo]

## Foco de la próxima sesión
[Qué debe hacer exactamente la próxima sesión o agente.
Concreto y acotado al propósito declarado.
Si es OPERATIVO: describí la tarea específica.
Si es GATE: describí el punto de entrada de la siguiente fase.]

## Decisiones relevantes
[Solo las decisiones que impactan directamente el foco de la próxima sesión.
No repetir DECISIONS.md — referenciar entradas específicas si aplica.]
→ Ver: DECISIONS.md — entradas: [fechas o títulos relevantes]

## Skills / comandos sugeridos para la próxima sesión
[Qué comandos SDD o skills debería invocar el próximo agente al arrancar.]
- [comando o skill + razón]

## Decisiones a loggear al reintegrarse
[SOLO para handoffs OPERATIVOS con sesión hijo que vuelve al padre.]
[Si es GATE, eliminá esta sección.]
Al reintegrarse al flujo principal, registrar en DECISIONS.md:
- [decisión esperada 1]
- [decisión esperada 2]
(Correr /sdd-log antes de continuar con el flujo principal.)

## Información redactada
[Listar qué se omitió por seguridad: API keys, tokens, credenciales, PII.]
[Si no hay nada que redactar, escribir: "Ninguna."]
```

---

## Paso 5 — Confirmación y guardado

Mostrá el documento completo al usuario antes de guardarlo.
Pedí confirmación: "¿Guardamos este handoff en [destino]?"

No guardés sin confirmación explícita.

---

## Reglas estrictas

- **Nunca generés el handoff si DECISIONS.md no está al día.** Sin excepciones.
- No duplicar contenido que ya está en artefactos existentes — usá referencias.
- Redactá cualquier API key, token, contraseña o PII antes de guardar.
- Los handoffs OPERATIVOS van a `/tmp` — son desechables, no documentación del proyecto.
- Los handoffs GATE van al repo — son artefactos auditables y deben estar bajo control de versiones.
- El handoff no reemplaza a DECISIONS.md. Es un snapshot de navegación, no el registro canónico.
- Si el propósito no está claro, no asumas — preguntá.
