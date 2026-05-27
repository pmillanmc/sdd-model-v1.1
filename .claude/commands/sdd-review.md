Leé input.md, spec.md y luego revisá el código generado en la carpeta app/.

## Parte 1 — Criterios de aceptación (lógica)

Para cada criterio Given/When/Then en spec.md, verificá:

1. ¿Existe un test que lo cubra explícitamente?
2. ¿El test pasa? (si podés correrlo, hacelo con pnpm test)
3. ¿El comportamiento está implementado en el código?

## Parte 2 — Requisitos de UI (visual y flujo)

Para cada descripción visual o de flujo en input.md (sección "Cómo se ve la interfaz"
o equivalente), verificá:

1. ¿Hay un criterio en spec.md que lo cubra?
2. ¿Hay código en app/ que lo implemente?

Si un requisito visual de input.md no tiene criterio en spec.md ni código → es un gap
que no fue trackeado en ningún artefacto.

Al terminar, generá un reporte con este formato:

## Review de implementación

### ✅ Criterios cubiertos con test
- [lista de criterios con su test correspondiente]

### ⚠️ Implementado pero sin test
- [criterios que funcionan pero no tienen test automatizado]

### ❌ Sin implementar
- [criterios que no están cubiertos ni en código ni en tests]

### 🎨 Gaps de UI (en input.md pero no en spec ni en código)
- [requisitos visuales o de flujo que nunca fueron trackeados]

### Resultado
[APROBADO / PENDIENTE — con resumen de qué falta si no está aprobado]

Si el resultado es PENDIENTE: mostrá el reporte y esperá.
No agregues tests ni código por tu cuenta. El dev decide cómo resolver cada gap.
Una vez que el dev resuelva los gaps, recordale que corra /sdd-log para registrar la decisión en DECISIONS.md.

Empezá directamente, sin pedir confirmación.
