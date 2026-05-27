Preguntale al usuario lo siguiente, una pregunta por vez, y esperá la respuesta antes de continuar:

1. ¿Qué cambió? (describí el gap encontrado o la decisión que tomaste)
2. ¿Por qué tomaste esa decisión? (contexto de negocio, pedido del cliente, restricción técnica, etc.)
3. ¿Qué artefactos modificaste? (constitution.md / spec.md / plan.md / tasks.md)
4. ¿Quién tomó la decisión? (nombre o rol)

Con esas respuestas, agregá una nueva entrada al final de DECISIONS.md con este formato exacto:

---
## [FECHA] [título breve de la decisión]

**Gap o motivo:** [respuesta 1]
**Decisión tomada:** [resumen claro de qué se cambió]
**Motivo:** [respuesta 2]
**Artefactos modificados:** [respuesta 3]
**Decidido por:** [respuesta 4]

Si DECISIONS.md no existe, crealo con este encabezado antes de la primera entrada:

# Registro de decisiones — SDD

Este archivo registra cada vez que una decisión humana desvía o amplía
lo establecido en el brief original (input.md).
Sirve como trazabilidad entre lo que se pidió y lo que se implementó.

---

Confirmá al usuario que la entrada fue registrada y recordale que este archivo
debe estar bajo control de versiones para que el equipo pueda consultarlo.
