Preguntale al usuario lo siguiente, una pregunta por vez, y esperá la respuesta antes de continuar:

1. ¿Qué cambió? (describí el gap encontrado o la decisión que tomaste)
2. ¿Qué alternativas consideraste antes de decidirte? (listá al menos una; si no había alternativas reales, decí "ninguna evaluada")
3. ¿Por qué descartaste cada alternativa? (una razón por alternativa)
4. ¿Por qué tomaste esa decisión? (contexto de negocio, restricción técnica, etc.)
5. ¿Qué artefactos modificaste? (constitution.md / spec.md / plan.md / tasks.md)
6. ¿Quién tomó la decisión? (nombre o rol)

Con esas respuestas, agregá una nueva entrada al final de DECISIONS.md con este formato exacto:

---
## [FECHA] [título breve de la decisión]

**feature_id:** [nombre de la carpeta en specs/ o "global"]
**command_origin:** [comando desde el que se detectó el gap]
**status:** accepted
**Gap o motivo:** [respuesta 1]
**Alternativas consideradas:** [respuesta 2]
**Por qué se descartaron:** [respuesta 3]
**Decisión tomada:** [resumen claro de qué se cambió]
**Motivo:** [respuesta 4]
**Artefactos modificados:** [respuesta 5]
**Decidido por:** [respuesta 6]

Si DECISIONS.md no existe, crealo con este encabezado antes de la primera entrada:

# Registro de decisiones — SDD

Este archivo registra cada vez que una decisión humana desvía o amplía
lo establecido en el brief original (input.md).
Sirve como trazabilidad entre lo que se pidió y lo que se implementó.

---

## Reglas de status

El campo `status` arranca como `accepted` por defecto. Los valores válidos son:
- **accepted** — decisión vigente y aplicada
- **proposed** — decisión en discusión, no implementada todavía
- **deprecated** — decisión ya no aplica (feature removida, contexto obsoleto)
- **superseded by [FECHA del reemplazo]** — una decisión posterior la invalidó. Siempre referenciar la fecha de la decisión que la reemplaza.

Cuando se invalida una decisión vieja: editar SOLO el campo `status` de la entrada vieja a `superseded by [FECHA]` y agregar una entrada nueva con `status: accepted` que describa el reemplazo.

Confirmá al usuario que la entrada fue registrada y recordale que este archivo
debe estar bajo control de versiones para que el equipo pueda consultarlo.
