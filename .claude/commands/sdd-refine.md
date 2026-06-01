Leé todos los archivos dentro de la carpeta drafts/.

Si existe `existing-arch.md` en la raíz del proyecto, leélo TAMBIÉN antes de empezar.
En ese caso estás en modo brownfield: el stack y las restricciones técnicas
de `existing-arch.md` son no negociables y tienen prioridad sobre cualquier
deseo que aparezca en los borradores. Si un borrador pide algo incompatible
con `existing-arch.md`, marcalo como AMBIGUO y preguntá al humano cómo resolverlo
(adaptarse al existente vs. registrar una decisión de refactor con /sdd-log).

Tu objetivo es generar un input.md que esté 100% claro y sin ambigüedad en estas 6 categorías:

1. PROBLEMA — ¿Qué duele hoy? ¿Qué resuelve esta feature?
2. USUARIO — ¿Quién lo usa y qué necesita lograr?
3. DONE CRITERIA — ¿Qué tiene que ser verdad para que esté terminado?
4. OUT OF SCOPE — ¿Qué queda explícitamente afuera de esta versión?
5. RESTRICCIONES TÉCNICAS — Stack, integraciones, limitaciones no negociables
6. UI / FLUJO — Cómo se ve o cómo funciona, aunque sea en palabras

## Proceso de grilling

Paso 1 — Analizá los borradores e identificá el estado de cada categoría:
- CLARO: está definido sin ambigüedad en los borradores
- AMBIGUO: hay algo pero genera dudas o puede interpretarse de más de una manera
- FALTANTE: no está mencionado en ningún borrador

Paso 2 — Mostrá al usuario un resumen del análisis con este formato:
  ✅ CLARO: [categorías claras y por qué]
  ⚠️ AMBIGUO: [categorías ambiguas y qué genera duda]
  ❌ FALTANTE: [categorías que no están en los borradores]

Paso 3 — Por cada categoría AMBIGUA o FALTANTE, hacé UNA pregunta concreta y esperá la respuesta antes de pasar a la siguiente. No hagas todas las preguntas juntas.

Paso 4 — Con cada respuesta, verificá si la categoría quedó CLARA. Si la respuesta sigue siendo ambigua, reformulá la pregunta y volvé a preguntar. No avances si algo no quedó claro.

Paso 5 — Cuando todas las categorías estén en estado CLARO, informale al usuario:
  "Tengo todo lo necesario para generar input.md. ¿Confirmás que puedo proceder?"
  Esperá la confirmación antes de escribir el archivo.

Paso 6 — Generá input.md consolidando borradores + respuestas del usuario.
Mostrá el contenido al usuario antes de guardarlo y pedí confirmación final.

## Reglas estrictas

- Nunca tomés decisiones de negocio por tu cuenta. Si algo requiere una decisión, preguntá.
- No asumas que una categoría está clara si hay más de una interpretación posible.
- No generés input.md hasta tener confirmación explícita del usuario.
- Si el usuario da una respuesta vaga, reformulá la pregunta con un ejemplo concreto.
- El input.md final tiene que poder ser leído por alguien que no participó del proceso
  y entender exactamente qué construir, cómo y con qué restricciones. Sin placeholders.
