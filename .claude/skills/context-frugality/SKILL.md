---
name: context-frugality
description: Reduce el crecimiento innecesario del contexto durante loops de implementación SDD sin reducir la correctitud, calidad del código, cobertura de requisitos, tests, arquitectura, seguridad ni mantenibilidad. Usar durante trabajo de implementación agéntica — especialmente en /sdd-implement, /sdd-task y /sdd-fix —, al leer artefactos, editar archivos o ejecutar comandos.
---

# Frugalidad de Contexto

## Uso

Activar cuando la tarea incluya:
- ejecutar `/sdd-implement`, `/sdd-task` o `/sdd-fix` (loops de implementación con TDD)
- leer `constitution.md`, `spec.md`, `plan.md`, `tasks.md`, `existing-arch.md` o código fuente
- correr tests, lint, build, o cualquier comando cuyo output pueda ser largo
- releer un artefacto después de haberlo editado

No reemplaza a `coding-standards` (convenciones, gates, gobernanza) ni a `graph/domain.yaml`
(qué archivos son del dominio). Los complementa: `graph/domain.yaml` ya decide QUÉ archivos son
relevantes (routing por dominio); esta skill decide CUÁNTO de esos archivos y de la salida de
cada comando hace falta cargar para tomar la siguiente decisión correctamente.

## Por qué importa en este modelo puntualmente

`/sdd-metrics` (DX_MET_006, Variante A) ya mide esto en producción: en un ciclo real,
`cache_read_input_tokens` — el contexto que se relee turno tras turno — es típicamente el
componente dominante del costo total de una feature (>90% en los ciclos medidos), muy por
encima de `input_tokens`. Esta skill ataca directamente esa cifra: cada lectura evitada, cada
output filtrado y cada archivo no recargado sin necesidad es contexto que nunca entra a cache
y que `/sdd-review` no va a tener que sumar al cerrar la feature (`feature_total: true`). No es
una skill de estilo — es la contraparte de implementación de lo que el modelo ya mide.

## Propósito

Reducir el crecimiento innecesario del contexto durante la implementación agéntica sin reducir la calidad de la implementación.

El principio central es:

> El token más barato es el que nunca cargás.

Esto es una **regla de prioridad**, no una instrucción para leer siempre menos.

Cuando existen dos formas igualmente suficientes para obtener un resultado correcto, preferir la que introduce menos información en el contexto.

**La correctitud y la calidad de la implementación siempre tienen prioridad sobre el ahorro de contexto.**

---

# Regla central

Antes de cargar o producir contexto adicional, evaluar:

1. ¿Esta información es necesaria para la decisión o implementación actual?
2. ¿La información necesaria ya está disponible en el contexto actual?
3. ¿Existe una representación más pequeña que proporcione la misma información necesaria?
4. ¿Usar la representación más pequeña podría reducir la confianza o la correctitud?

Si la representación más pequeña es igualmente suficiente, preferirla.

Si existe un riesgo significativo para la correctitud, cargar la información adicional.

---

# Eje 1 — Frugalidad de lectura

Leer únicamente la información necesaria para realizar la operación actual cuando hacerlo preserve la correctitud.

## Preferir lecturas dirigidas

Cuando solamente se necesita una sección de un archivo:

* localizar primero la sección relevante;
* utilizar búsqueda o rangos específicos cuando estén disponibles;
* leer el contexto circundante necesario para comprenderla;
* evitar cargar un archivo grande completo cuando no sea necesario.

Ejemplo:

```text
Necesitamos:
criterios de aceptación de US-07

Preferir:
buscar → localizar US-07 → leer el rango relevante

En lugar de:
leer una especificación completa de cientos de líneas
```

La lectura dirigida es una optimización, no una restricción.

Si el archivo completo es necesario para comprender una invariante, arquitectura, dependencia o interacción, leer el archivo completo. `spec.md` con su sección `## Fuera de scope (v1)`, `constitution.md` completo y las reglas de slicing vertical de `tasks.md` son ejemplos típicos de "hace falta entero": son contratos negativos o transversales, no información posicional.

---

## No volver a cargar contexto estable innecesariamente

Asumir que el contenido previamente leído continúa disponible y puede utilizarse mientras no exista una razón para considerarlo:

* obsoleto;
* incompleto;
* invalidado por un cambio;
* afectado por compactación;
* insuficiente para la decisión actual.

No releer un artefacto simplemente porque es importante.

El hecho de que un archivo sea importante no justifica por sí mismo volver a leerlo. `constitution.md`, `plan.md` y `existing-arch.md` no cambian durante un loop de `/sdd-implement` o `/sdd-task` — leerlos una vez al principio del comando alcanza.

---

## Guardrail para archivos modificados

La confianza por defecto en contenido previamente leído solamente aplica mientras el archivo no haya cambiado.

Si el agente:

* editó un archivo durante la sesión actual; o
* ejecutó una herramienta que pudo modificarlo;

el contenido previamente cargado de ese archivo no debe considerarse automáticamente actualizado.

Antes de volver a confiar en él:

1. identificar la sección afectada;
2. releer la sección afectada;
3. utilizar el nuevo contenido como fuente de verdad.

Ejemplo:

```text
Leer archivo
    ↓
Editar archivo
    ↓
El contexto anterior puede estar obsoleto
    ↓
Releer sección afectada
    ↓
Continuar
```

No releer el archivo completo salvo que el cambio o la tarea lo requieran. En el loop TDD de
`/sdd-implement` y `/sdd-task` esto aplica directamente al checkbox recién marcado en `tasks.md`:
releer esa línea para confirmar que quedó bien escrita, no el archivo entero.

---

## Cambios externos

La skill no puede detectar de forma confiable cambios realizados fuera del flujo observable del agente.

Por ejemplo:

* un desarrollador modifica manualmente el archivo desde el IDE;
* otro proceso modifica el archivo;
* un generador externo modifica un archivo dependiente.

No afirmar que estos cambios pueden detectarse automáticamente.

Cuando exista una indicación razonable de que pudieron producirse cambios externos, actualizar el contenido relevante antes de continuar.

Como práctica de workflow, evitar editar manualmente en paralelo archivos que el agente está modificando activamente.

---

# Eje 2 — Frugalidad de salida

Evitar introducir output innecesario de comandos y herramientas en el contexto.

El output de una herramienta forma parte del contexto y puede ser releído durante los turnos posteriores.

Preferir producir el resultado útil más pequeño posible.

## Filtrar output ruidoso

Cuando un comando produce una cantidad grande de output pero solamente una pequeña parte es relevante:

* redirigir output innecesario;
* filtrar el resultado;
* utilizar un reporter compacto;
* inspeccionar solamente las líneas relevantes.

Ejemplo:

```text
Output grande de tests
       ↓
redirigir / filtrar
       ↓
error o resumen relevante
       ↓
contexto
```

Por ejemplo:

```bash
comando 2>&1 | grep "FAIL"
```

cuando solamente se necesitan los errores. En este modelo aplica en particular a `pnpm test`,
`pnpm build`, y a `!npx ccusage@latest claude session --no-cost --json` (Paso de DX_MET_006 en
`/sdd-metrics`): ese JSON puede traer todas las sesiones de Claude Code de cualquier proyecto y
fecha — filtrar antes de volcarlo, nunca pegar la respuesta cruda completa en el contexto.

No aplicar filtros cuando el output omitido sea necesario para diagnosticar correctamente el problema.

---

## Preferir reporters silenciosos o compactos

Cuando una herramienta permita diferentes niveles de output, preferir el modo más compacto que conserve la información necesaria para tomar la siguiente decisión.

Por ejemplo:

```text
Reporter verbose
      ↓
cientos de líneas

Reporter compacto
      ↓
resumen pequeño
```

El objetivo no es ocultar información.

El objetivo es evitar introducir información en el contexto cuando no sea necesaria.

---

## No volcar output grande sin necesidad

No colocar deliberadamente en el contexto:

* logs enormes;
* archivos generados completos;
* árboles de dependencias;
* reportes completos;
* output verboso de tests;
* resultados extensos de comandos;

cuando exista una representación más pequeña que permita tomar la misma decisión correctamente.

Si el output completo es necesario para investigar un problema, inspeccionarlo de manera deliberada y dirigida.

---

# Guardrail de correctitud

La frugalidad de contexto nunca debe imponerse sobre la correctitud de la implementación.

Nunca sacrificar información necesaria únicamente para reducir tokens.

El agente debe preservar:

* correctitud funcional;
* cobertura de requisitos;
* criterios de aceptación;
* consistencia arquitectónica;
* convenciones del proyecto;
* seguridad de tipos;
* seguridad;
* mantenibilidad;
* legibilidad;
* cobertura de tests;
* prevención de regresiones.

Cuando exista un conflicto:

```text
Correctitud
    ↓
Calidad del código
    ↓
Requisitos
    ↓
Eficiencia de contexto
```

La eficiencia de contexto es una capa de optimización, no el objetivo principal. En términos de
este modelo: nunca a costa de lo que `/sdd-review` audita (Partes 1, 1b, 2 y 3) ni de lo que
`pnpm audit:sdd` verifica.

---

# Implementación dentro de SDD

Durante la implementación SDD, la frugalidad de contexto aplica especialmente a:

* `constitution.md`;
* `spec.md`, `plan.md`, `tasks.md`;
* `existing-arch.md` (brownfield);
* `graph/domain.yaml` y los archivos que su `routing` señala como del dominio afectado;
* código fuente existente en el `source_root`;
* tests y su output (`pnpm test`, lint, build);
* feedback de implementación (loop Red-Green-Refactor de `/sdd-implement` y `/sdd-task`);
* output de comandos (`ccusage`, `curl` al kanban, MCPs como `cortex` o `proguide-test`);
* artefactos generados (`metrics/[feature_id]-metrics.md`, `jira-map.yaml`).

El agente debe mantener suficiente contexto para comprender el requisito actual y sus restricciones.

No recargar repetidamente artefactos SDD que ya están disponibles y no cambiaron.

No cargar parcialmente un artefacto cuando una invariante o regla global requiere comprenderlo completo.

**Routing de dominio, no reemplazo.** `graph/domain.yaml` ya resuelve la pregunta "¿qué archivos
son de este dominio?" (regla de `CLAUDE.md` → Gobernanza y routing de contexto). Esta skill no
repite esa decisión: una vez que el routing dio la lista de archivos, esta skill decide cuánto de
cada uno hace falta leer y cuánto del output de cada comando hace falta conservar.

---

# Flujo de implementación

Durante la implementación utilizar el siguiente comportamiento:

```text
Comprender el requisito
        ↓
Revisar contexto existente
        ↓
¿Ya está disponible?
   ┌────┴────┐
  SÍ         NO
   │          │
Usarlo    Cargar solamente
          lo suficiente
   │          │
   └────┬─────┘
        ↓
Implementar
        ↓
¿El agente o una herramienta
modificó un archivo?
        │
       SÍ
        ↓
Actualizar la sección afectada
        ↓
Ejecutar validaciones/tests
        ↓
Mantener el output compacto cuando sea posible
        ↓
Evaluar el resultado
```

---

# No optimizar prematuramente

No introducir comportamiento de ahorro de contexto únicamente porque parezca más barato en teoría.

La prioridad siempre es producir una implementación correcta, completa y de calidad.

Si una lectura completa, una salida detallada o una repetición de información es necesaria para comprender, implementar, verificar o depurar correctamente, realizarla.

La optimización solamente aplica cuando existe una alternativa igualmente suficiente.

---

# Calidad del código

La skill no debe producir una degradación de la calidad del código a cambio de reducir tokens.

El código generado debe mantener los estándares establecidos por el proyecto y por SDD.

La skill no justifica:

* eliminar validaciones necesarias;
* omitir tests;
* reducir cobertura;
* ignorar errores;
* simplificar arquitectura incorrectamente;
* evitar revisar dependencias;
* saltarse criterios de aceptación;
* reutilizar contexto potencialmente obsoleto;
* implementar basándose en información insuficiente.

Una reducción de contexto solamente es válida si el resultado final mantiene una calidad equivalente o superior.

---

# Evaluación

Cuando se evalúe la efectividad de esta skill, comparar un escenario con la skill activada contra el mismo escenario sin la skill.

Mantener, en la medida de lo posible, las mismas:

* tareas;
* condiciones iniciales;
* versión del repositorio;
* modelo;
* herramientas;
* restricciones;
* criterios de aceptación.

Medir tanto eficiencia como calidad.

## Métricas de eficiencia

Cuando estén disponibles:

* `cacheReadTokens`;
* input tokens;
* output tokens;
* cantidad de tool calls;
* cantidad de turns;
* duración.

En este modelo, la fuente de estas métricas ya existe: `/sdd-metrics` (DX_MET_006, Variante A)
reporta exactamente `cache_read_input_tokens`, `input_tokens`, `output_tokens` y el `TOTAL` por
sesión, vía `ccusage`. Comparar dos corridas de la misma feature (una con esta skill activa y
otra sin ella) es comparar dos bloques `### 📊 Reporte de Esfuerzo SDD` — no hace falta
instrumentación nueva.

## Métricas de calidad

Evaluar:

* correctitud;
* tests;
* requisitos cumplidos;
* calidad del código;
* consistencia arquitectónica;
* seguridad;
* mantenibilidad;
* ausencia de regresiones.

En este modelo, el gate que certifica esto es `/sdd-review`: `resultado: APROBADO` sin
`hallazgos_e2e` ni `structural_issues` es la señal de que la frugalidad no comió calidad.

## Criterio de éxito

La skill es efectiva cuando reduce el costo de contexto **sin degradar la calidad de implementación**.

Una reducción de tokens acompañada de menor correctitud, tests fallidos, requisitos omitidos, regresiones o peor calidad de código no debe considerarse una mejora.

```text
Menor contexto
      +
Misma o mejor calidad
      =
Mejora válida
```

```text
Menor contexto
      +
Peor calidad
      =
Optimización inválida
```

---

# Gestión de sesiones

No implementar handoff automático en esta versión.

Cuando el contexto acumulado haga conveniente cambiar de sesión, el developer puede utilizar el mecanismo de handoff existente (`/sdd-handoff`).

La compactación permanece como mecanismo secundario.

Las estrategias son independientes:

```text
Cambio de sesión
    ↓
handoff manual (/sdd-handoff)
    ↓
nueva sesión
```

o:

```text
Permanecer en la sesión
    ↓
contexto demasiado largo
    ↓
/compact
```

La skill no debe automatizar esta decisión. Si se cambia de sesión a mitad de una feature, cada
comando del ciclo sigue anexando su propia sesión al ledger de atribución de tokens
(`metrics/[feature_id].sessions`) — el corte de sesión no pierde ni duplica el total que
`/sdd-review` va a sumar al cerrar.

---

# Principio final

La frugalidad de contexto no significa hacer menos trabajo.

Significa evitar cargar o producir información que no sea necesaria **cuando existe una alternativa igualmente correcta**.

La regla definitiva es:

> **Primero correctitud y calidad. Después, entre alternativas igualmente correctas, elegir la que consuma menos contexto.**
