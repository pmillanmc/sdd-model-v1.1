Leé la idea que te da el usuario. Este es el comando de discovery: convierte una
idea cruda en un brief de negocio estructurado que queda en `drafts/` como insumo
para /sdd-refine. NO reemplaza a /sdd-refine ni genera artefactos canónicos.

**Naturaleza (importante):**
- Comando OPERATIVO, sin gate. Escribe un borrador en `drafts/`, nada más.
- Corre ANTES de que exista un `feature_id`. No toca `specs/`, ni el registro, ni métricas.
- Su salida es un insumo más de `drafts/`: /sdd-refine la consolida con el resto.

**Regla de oro:**
Si detectás algo ambiguo, faltante o riesgoso → preguntá antes de continuar.
No supongas, no rellenes con criterio propio.

## Fase 1 — Escucha
Pedí al usuario que describa su idea en sus palabras. No interrumpas. Registrá qué
mencionó, qué no (gaps), qué es ambiguo y qué supone sin decirlo.

## Fase 2 — Análisis de completitud (interno)
Antes de preguntar, evaluá internamente estas dimensiones y priorizá el interrogatorio
con esta escala INTERNA (no la muestres en el brief final, es solo para ordenar preguntas):
- 🔴 Bloqueante — no se puede cerrar el brief sin esto
- 🟡 Importante — afecta alcance o arquitectura
- 🟢 Deseable — mejora la claridad, no bloquea

Dimensiones: problema, usuario final, objetivo medible, alcance (incluye/excluye),
restricciones (tiempo/presupuesto/regulación/stack obligatorio), dependencias externas.

## Fase 3 — Preguntas priorizadas
Preguntá primero los 🔴, después los 🟡. Máximo 3 por ronda. Esperá respuesta antes de
seguir. Con cada respuesta verificá si cerró el gap o abrió otros. No avances con 🔴 o 🟡 abiertos.

## Fase 4 — Riesgos
Antes de escribir, chequeá señales: alcance sin límite ("y también podría..."), usuario
difuso ("cualquiera"), éxito no medible ("que ande bien"), dependencia oculta, restricción
legal (datos personales, pagos, salud). Si aparece alguna, preguntá.

## Fase 5 — Slug y confirmación de nombre
Proponé un `slug` corto en inglés, kebab-case (2-4 palabras). Mostrá el nombre final y confirmá:
"Voy a guardar el brief como `drafts/brief-[YYYY-MM-DD]-[slug].md`. ¿El slug `[slug]` te representa la idea?"
Usá la fecha de hoy en ISO 8601.

## Fase 6 — Escritura del brief
Solo cuando no queden 🔴 ni 🟡 abiertos, mostrá el brief completo y pedí confirmación
final antes de guardar. Formato:

```markdown
# Brief de Negocio: [nombre]

## Problema
[2-3 oraciones]

## Objetivo
[medible y concreto]

## Usuarios
[perfil específico]

## Alcance
### Incluye
- [...]
### Excluye explícitamente
- [...]

## Restricciones
- [tiempo, presupuesto, regulación, stack obligatorio]

## Dependencias externas
- [sistemas, APIs, terceros]

## Criterios de éxito
- [métricas concretas]

## Riesgos identificados
| Riesgo | Impacto | Mitigación sugerida |
|--------|---------|---------------------|
| ... | ... | ... |
```

Guardá en `drafts/brief-[YYYY-MM-DD]-[slug].md`. No escribas en `specs/` ni en `metrics/`.

## Transición
Al guardar, cerrá con:
```
✅ Brief guardado en drafts/brief-[YYYY-MM-DD]-[slug].md
➡️  Próximo paso: /sdd-refine — consolida este brief junto con el resto de drafts/ en input.md.
```

## Reglas estrictas
- Nunca decidas cuestiones de negocio por tu cuenta. Preguntá.
- La escala 🔴🟡🟢 es mecánica interna de priorización: NO aparece en el brief final.
- Ningún secreto (API key, token, password) entra al brief — referencialo como variable
  de entorno. `drafts/` es versionado y /sdd-refine lo escanea como input no confiable.
- No generes artefactos canónicos (`specs/`, registro, grafo). Eso es de /sdd-generate.
- No escribas el brief hasta tener confirmación explícita del usuario.
