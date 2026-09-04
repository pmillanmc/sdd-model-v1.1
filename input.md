# Input — Calculadora simple (prueba técnica)

## PROBLEMA
Se necesita una pequeña demo de calidad para una prueba técnica dirigida a un
cliente: una calculadora simple que sirva como muestra del nivel de trabajo
(código limpio, funcional, sin errores).

## USUARIO
Un evaluador técnico del lado del cliente, que va a revisar tanto el
funcionamiento en el navegador como el código.

## DONE CRITERIA
- Operaciones básicas: suma, resta, multiplicación, división
- Soporta números decimales
- Manejo de división por cero: muestra un estado de error (ej. "Error") sin
  romper la aplicación ni quedar en un estado inconsistente
- Botón de limpiar (C / AC) que resetea la calculadora
- No incluye memoria, historial, porcentaje ni paréntesis (ver OUT OF SCOPE)

## OUT OF SCOPE
- Sin backend, sin API, sin llamadas de red
- Sin base de datos ni persistencia de ningún tipo (ni localStorage: no hay
  historial ni estado guardado entre sesiones)
- Sin memoria (M+, M-, MR)
- Sin porcentaje (%)
- Sin paréntesis ni precedencia de operadores (operaciones simples en
  secuencia, como una calculadora física básica)
- Sin soporte de teclado físico (solo click con mouse)
- Sin routing, sin múltiples pantallas/vistas

## RESTRICCIONES TÉCNICAS
- Stack: React
- Solo frontend — sin backend, sin base de datos
- Estado local con `useState` (sin estado global, sin librerías de manejo de
  estado)
- Proyecto greenfield (no hay `existing-arch.md` ni código previo)

## UI / FLUJO
- Un solo componente de calculadora, sin routing
- Pantalla arriba mostrando el valor actual / resultado
- Grid de botones debajo: dígitos 0-9, punto decimal (.), operadores (+, −,
  ×, ÷), botón igual (=), botón limpiar (C)
- Interacción exclusivamente por click de mouse
- Flujo esperado: el usuario hace click en dígitos y operadores para
  construir una operación, ve el valor acumulado en la pantalla, y al hacer
  click en "=" ve el resultado. "C" resetea todo a cero.
