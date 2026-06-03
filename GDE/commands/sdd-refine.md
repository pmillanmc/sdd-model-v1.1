# sdd-refine — GDE flavor

Leé todos los archivos dentro de la carpeta `drafts/`.

## Jerarquía de contexto (orden de prioridad)

Cargá los archivos de contexto en este orden antes de empezar:

1. **`gde-context.md`** (si existe) — fronteras del dominio GDE. Máxima prioridad.
   Las fronteras declaradas (lo que el dominio NO es) son no negociables.
   Si el brief pide algo que el `gde-context.md` excluye explícitamente → AMBIGUO inmediato.

2. **`existing-arch.md`** (si existe) — stack y patrones del codebase actual.
   Restricciones no negociables sobre qué stack usar, cómo estructurar el código.
   Si hay conflicto entre `existing-arch.md` y el brief → AMBIGUO → preguntar al humano.

3. **`drafts/`** — los borradores del equipo. Input principal.

Si existe `gde-context.md`, antes de analizar los borradores verificá que el brief no cruce fronteras:
- ¿Pide algo que la tabla "Lo que este dominio NO es" excluye? → AMBIGUO + señalar el dominio correcto.
- ¿Pide integrar directamente con un dominio externo sin pasar por los servicios expuestos? → AMBIGUO.
- ¿Pide almacenar datos que pertenecen a otro dominio? → AMBIGUO.

## Objetivo

Generar un `input.md` 100% claro y sin ambigüedad en estas 6 categorías:

1. PROBLEMA — ¿Qué duele hoy? ¿Qué resuelve esta feature dentro del dominio?
2. USUARIO — ¿Quién lo usa: ciudadano (TAD), agente (EU), administrador funcional?
3. DONE CRITERIA — ¿Qué tiene que ser verdad para que esté terminado?
4. OUT OF SCOPE — ¿Qué queda explícitamente afuera? (incluir qué dominio lo resuelve si aplica)
5. RESTRICCIONES TÉCNICAS — Stack, integraciones con otros dominios vía servicios expuestos, HLD constraints
6. UI / FLUJO — Cómo funciona, aunque sea en palabras

## Proceso de grilling

Paso 1 — Chequeá fronteras (`gde-context.md`) y analizá los borradores. Clasificá cada categoría:
- CLARO: definido sin ambigüedad
- AMBIGUO: genera dudas, cruza fronteras, o tiene más de una interpretación
- FALTANTE: no está en ningún borrador

Paso 2 — Mostrá al usuario el resumen:
  ✅ CLARO: [categorías claras]
  ⚠️ AMBIGUO: [categorías ambiguas — si cruza frontera, indicar a qué dominio pertenece]
  ❌ FALTANTE: [categorías ausentes]

Paso 3 — Por cada AMBIGUO o FALTANTE: UNA pregunta concreta. Esperá respuesta antes de seguir.

Paso 4 — Con cada respuesta, verificá que la categoría quedó CLARA. Si no, reformulá.

Paso 5 — Cuando todo esté CLARO:
  "Tengo todo lo necesario para generar input.md. ¿Confirmás que puedo proceder?"

Paso 6 — Generá `input.md`. Mostrá el contenido antes de guardar y pedí confirmación final.

## Reglas estrictas

- Nunca tomes decisiones de negocio por tu cuenta.
- No asumas que una categoría está clara si hay más de una interpretación posible.
- No generés `input.md` hasta tener confirmación explícita.
- Si el usuario da una respuesta vaga, reformulá con un ejemplo concreto.
- El `input.md` final debe poder ser leído por alguien que no participó del proceso
  y entender exactamente qué construir, cómo y con qué restricciones. Sin placeholders.
- Las integraciones con otros dominios siempre se hacen a través de los servicios expuestos
  declarados en `gde-context.md`, nunca por acceso directo a datos de otro dominio.
