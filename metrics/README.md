# Métricas SDD — Guía para empezar

> Si llegás acá por primera vez, esta guía te explica cómo el modelo mide
> cuánto costó construir una feature y si el proceso fue eficiente.

---

## La idea en una línea

Cada vez que usás un comando SDD, el modelo anota automáticamente qué pasó.
Al final tenés un historial por feature que te dice si la spec era buena,
cuánto retrabajo hubo y cuántos tokens consumiste.

---

## ¿Dónde se guardan los datos?

En esta carpeta (`metrics/`), un archivo por feature:

```
metrics/
├── 001-login-metrics.md
├── 002-dashboard-metrics.md
└── README.md  ← este archivo
```

**No tenés que crear ni editar esos archivos.** Los comandos los escriben solos.

---

## ¿Qué anota cada comando?

Cuando corrés un comando SDD, al terminar escribe un bloque en el archivo de métricas de tu feature:

| Comando | Qué anota |
|---|---|
| `/sdd-refine` | Cuántas rondas de preguntas necesitó. Si el brief tenía categorías faltantes o ambiguas. |
| `/sdd-validate` | Qué porcentaje del brief quedó cubierto. Cuántos gaps encontró. |
| `/sdd-implement` | Cuántas veces el código falló y tuvo que corregirse solo. Tokens estimados consumidos. |
| `/sdd-review` | Si la implementación fue aprobada o quedó pendiente. Criterios sin test. |

---

## ¿Cómo se ve un archivo de métricas?

```markdown
## Refine — 2026-06-08T10:30:00
- rondas_de_preguntas: 3
- categorias_faltantes: 2
- categorias_ambiguas: 1

## Validate — 2026-06-08T11:00:00
- gaps_encontrados: 1
- cobertura_inicial: 87%

## Reporte completo — 2026-06-08T14:20:00
- feature_id: 001-login
- iteration_number: 1
- DX_MET_001 autocorrecciones: 0
- DX_MET_002 consultas clarificación: 1
- DX_MET_006 tokens estimados: 3.800
- Rework Ratio estimado: 0.12

## Review — 2026-06-08T15:00:00
- resultado: APROBADO
- criterios_sin_test: 0
- gaps_ui: 0
```

---

## ¿Cómo consulto las métricas?

Tenés tres comandos, según lo que necesites:

### Ver la sesión actual
```
/sdd-metrics
```
Úsalo justo después de terminar un `/sdd-implement`.
Te muestra el detalle de esa sesión: tokens, autocorrecciones, rework.

### Ver todas las features de golpe
```
/sdd-metrics-summary
```
Te muestra una tabla con todas las features del proyecto y señales de alerta.
Ejemplo de lo que ves:

```
| feature_id    | Iteraciones | Tokens est. | Rework Ratio | Cobertura inicial |
|---------------|-------------|-------------|--------------|-------------------|
| 001-login     | 1           | 3.800       | 0.12         | 87%               |
| 002-dashboard | 3           | 9.200       | 0.44         | 60%               |
| TOTAL         | —           | 13.000      | —            | —                 |

🔴 Features con Rework Ratio > 0.3: 002-dashboard
🟡 Features con cobertura inicial < 80%: 002-dashboard
```

### Ver métricas en el reporte de sprint
```
/sdd-health
```
Si tu equipo ya usa `/sdd-health` cada sprint, las métricas aparecen ahí también.
No necesitás correr un comando extra.

---

## ¿Qué significan las alertas?

| Alerta | Qué significa | Qué hacer |
|---|---|---|
| 🔴 Rework Ratio > 0.3 | Más del 30% del trabajo fue corrección | Revisá si la spec era clara antes de implementar |
| 🟡 Cobertura inicial < 80% | El brief llegó incompleto a validate | La próxima vez dedicá más tiempo a `/sdd-refine` |
| 🟡 Más de 2 iteraciones | La feature se implementó varias veces | Puede ser retrabajo o funcionalidad que creció |

---

## ¿Qué es el Rework Ratio?

Es la métrica central del modelo. Mide qué proporción del trabajo fue corrección:

$$\text{Rework Ratio} = \frac{\text{autocorrecciones} + \text{decisiones en DECISIONS.md}}{\text{tareas totales de la feature}}$$

- **0.0** — sin retrabajo, la spec estaba perfecta
- **0.1 – 0.2** — normal, algo de ajuste esperado
- **> 0.3** — señal de que algo en el proceso anterior falló

---

## ¿Cómo sé si el modelo funciona bien?

Corré el smoke test:

```
/sdd-test
```

Crea un ejemplo sintético, ejecuta el ciclo completo y verifica 22 checkpoints.
Al final te dice cuántos pasaron y cuáles fallaron con detalle.
Útil cuando incorporás el modelo a un proyecto nuevo o después de cambios en los comandos.

---

## Flujo completo de una feature

```
1. /sdd-refine      → genera input.md
                      escribe: bloque Refine en metrics/

2. /sdd-generate    → genera los 4 artefactos
                      te pide confirmar el feature_id

3. /sdd-validate    → verifica cobertura del brief
                      escribe: bloque Validate en metrics/

4. /sdd-implement   → genera el código
                      escribe: reporte completo en metrics/

5. /sdd-review      → gate final
                      escribe: bloque Review en metrics/

6. /sdd-metrics     → consultás el resultado de esta feature
   /sdd-metrics-summary → consultás el estado de todo el proyecto
```

---

## Preguntas frecuentes

**¿Tengo que hacer algo para activar las métricas?**
No. Los comandos las escriben solos. Solo asegurate de confirmar el `feature_id`
cuando `/sdd-generate` te lo pida.

**¿Se sobreescriben los datos si corro el mismo comando dos veces?**
No. Cada ejecución agrega un nuevo bloque con `iteration_number` incrementado.
El historial queda completo.

**¿Los archivos de métricas van al repo?**
Sí, commitealos junto con los artefactos SDD. Son parte de la trazabilidad del proyecto.

**¿Puedo ignorar las métricas si no me interesan?**
Sí. El modelo funciona igual sin leerlas. Son información extra, no un requisito.
