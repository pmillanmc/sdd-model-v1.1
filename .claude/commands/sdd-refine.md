Leé todos los archivos dentro de la carpeta drafts/.

**Si hay archivos `.html` en drafts/:** antes de analizar las 6 categorías, resolvé la cascada CSS completa del HTML. Para cada componente visual relevante extraé los valores efectivos computados (no nombres de clase):
- Colores: hex o rgb resuelto (siguiendo variables CSS `--var` hasta su valor final)
- Tipografía: font-family, font-size en px, font-weight, line-height
- Espaciado: padding/margin en px o rem resueltos
- Layout: tipo de layout (flex/grid), gaps, alineación
- Estados: hover, focus, disabled si los hay

Estos valores van a ir explícitamente en la sección UI/FLUJO de `input.md` — nunca como nombres de clase.
Ejemplo correcto: `"botón primario: fondo #2563EB, texto #FFFFFF, border-radius 6px, padding 8px 16px"`
Ejemplo incorrecto: `"botón primario: clase btn-primary"`

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

## Detección de tipo de feature (antes del grilling)

Antes de clasificar las categorías, determiná si la feature pertenece a uno o más de estos tipos. Si aplica, agregá las preguntas específicas a tu análisis de FALTANTES/AMBIGUOS en el Paso 1 — aunque no estén mencionadas en los borradores.

**Métricas / reportes / dashboards**
- Dimensión temporal: ¿total histórico, ventana fija o rango seleccionable por el usuario?
- Granularidad: ¿los datos se agrupan por día, semana, mes?
- Estado en URL: ¿el rango/filtro seleccionado debe ser bookmarkable (parámetro en URL)?

**Formularios / flujos de carga de datos**
- Validaciones: ¿client-side, server-side, o ambas? ¿cuáles son obligatorias?
- Estados intermedios: ¿hay borrador, autoguardado, o es todo-o-nada?
- Abandono: ¿qué pasa si el usuario cierra el formulario a mitad?

**Listas / tablas**
- Ordenamiento: ¿por qué columnas? ¿cuál es el orden por defecto?
- Paginación o scroll infinito: ¿cuántos ítems se muestran a la vez?
- Filtros: ¿quién puede filtrar por qué criterios?

**Autenticación / permisos**
- Roles: ¿qué puede ver/hacer cada rol? ¿están definidos en el sistema o son nuevos?
- Acceso no autorizado: ¿redirige, muestra error, o oculta el elemento?

**Integraciones externas (APIs, servicios de terceros)**
- Fallo del servicio: ¿qué ve el usuario si la integración no responde?
- Retry: ¿hay reintentos automáticos o el usuario debe actuar?
- Estado visible: ¿el usuario puede saber si la integración está en proceso?

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

**Hook de métricas (obligatorio al finalizar):**
Cuando input.md quede confirmado y guardado, agregá al archivo `metrics/[feature_id]-metrics.md` (creándolo si no existe) el siguiente bloque:

```
## Refine — [timestamp]
- command_origin: sdd-refine
- rondas_de_preguntas: [número de turnos de grilling hasta llegar a CLARO en todas las categorías]
- categorias_faltantes: [número de categorías que estaban FALTANTE al inicio]
- categorias_ambiguas: [número de categorías que estaban AMBIGUO al inicio]
```
