# Spec — 901-calculadora-react

## User Stories

### US-1 — Ver y construir una operación
**Given** la calculadora recién cargada, con la pantalla en `0`
**When** el usuario hace click en dígitos y en un operador (+, −, ×, ÷)
**Then** la pantalla muestra el número en construcción y luego la
operación acumulada, sin llamadas de red ni persistencia.

### US-2 — Obtener un resultado
**Given** una operación válida construida en pantalla (ej. `8 × 4`)
**When** el usuario hace click en `=`
**Then** la pantalla muestra el resultado numérico correcto, soportando
decimales cuando corresponda.

### US-3 — División por cero no rompe la app
**Given** una operación de división con divisor `0` (ej. `5 ÷ 0`)
**When** el usuario hace click en `=`
**Then** la pantalla muestra un estado de error (ej. `"Error"`) y la
calculadora sigue operativa para la siguiente entrada.

### US-4 — Limpiar la calculadora
**Given** cualquier estado de la calculadora (número parcial, operación
pendiente, resultado o error)
**When** el usuario hace click en `C`
**Then** la pantalla vuelve a `0` y el estado interno se resetea por
completo.

## Fuera de scope (v1)

- **Backend / base de datos / persistencia**: la demo es solo frontend, sin
  servidor ni almacenamiento (ni siquiera `localStorage`) — así lo pidió el
  cliente vía la prueba técnica.
- **Memoria (M+, M-, MR)**: no forma parte del set mínimo de operaciones
  acordado.
- **Porcentaje (%)**: no forma parte del set mínimo de operaciones
  acordado.
- **Paréntesis / precedencia de operadores**: se prioriza simplicidad sobre
  un parser de expresiones completo.
- **Soporte de teclado físico**: se prioriza simplicidad; solo interacción
  por mouse.
- **Routing / múltiples pantallas**: la calculadora es un único componente.

## Measurable Process Outcomes (DX)

- **DX-001**: El agente debe completar la implementación con menos de 2
  ciclos de autocorrección (Rework).
- **DX-002**: Mantener la densidad de ambigüedad en 0 (sin consultas de
  aclaración para la IA) — toda la ambigüedad se resolvió en `/sdd-refine`.
