# Comando: Resumen de Métricas del Proyecto

**Descripción:** Agrega todas las métricas registradas en `metrics/` y muestra el consumo total por feature y por proyecto.

## Instrucciones para el Agente

### Paso 1 — Leer todos los archivos de métricas

Leé todos los archivos dentro de `metrics/`. Si la carpeta no existe o está vacía, informá:
"No hay métricas registradas todavía. Ejecutá al menos un ciclo completo de sdd-implement para generar datos."
Y terminá.

### Paso 2 — Extraer datos por feature

Para cada archivo `metrics/[feature_id]-metrics.md`, extraé:

| Campo | Dónde está en el archivo |
|---|---|
| `feature_id` | Header del archivo o campo explícito |
| `iteraciones` | Valor máximo de `iteration_number` encontrado |
| `tokens_estimados` | Último valor de `TOTAL INPUT estimado` en DX_MET_006 |
| `rework_ratio` | Último valor de `Rework Ratio estimado` |
| `cobertura_inicial` | `cobertura_inicial` del bloque Validate (si existe) |
| `autocorrecciones` | Suma de todos los valores DX_MET_001 del archivo |
| `consultas_clarificacion` | Suma de todos los valores DX_MET_002 del archivo |

### Paso 3 — Generar reporte

Mostrá el siguiente reporte en consola (no escribas ningún archivo):

---

## 📊 SDD Metrics Summary — [FECHA]

### Por feature

| feature_id | Iteraciones | Tokens est. | Rework Ratio | Cobertura inicial | Autocorr. | Consultas |
|---|---|---|---|---|---|---|
| [valor] | [N] | [N] | [ratio] | [%] | [N] | [N] |

### Totales del proyecto

| Métrica | Valor |
|---|---|
| Features medidas | [N] |
| Tokens estimados totales | [suma] |
| Autocorrecciones totales | [suma DX_MET_001] |
| Consultas de clarificación totales | [suma DX_MET_002] |
| Promedio Rework Ratio | [promedio] |
| Promedio cobertura inicial | [promedio %] |

### Señales de alerta
- 🔴 Features con Rework Ratio > 0.3: [lista o "ninguna"]
- 🟡 Features con cobertura inicial < 80%: [lista o "ninguna"]
- 🟡 Features con más de 2 iteraciones de implement: [lista o "ninguna"]

### Recomendación
[1-2 líneas: qué mejorar en el próximo ciclo basándose en los datos]

---

## Reglas

- No modifiques ningún archivo. Solo reportá en consola.
- Si un campo no está presente en el archivo de métricas, usá `—` en la tabla.
- Si hay features sin bloque Validate, indicalo como nota al pie.
- Empezá directamente, sin pedir confirmación.
