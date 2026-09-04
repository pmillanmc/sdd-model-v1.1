# Constitution — 901-calculadora-react

## MUST

- La app es 100% frontend: no hay servidor, API propia, ni llamadas de red.
- El estado de la calculadora vive en memoria (`useState`) y se pierde al
  recargar la página — no hay persistencia de ningún tipo.
- Toda operación aritmética debe manejar división por cero mostrando un
  estado de error visible en pantalla, sin romper la UI ni dejarla en un
  estado inconsistente.
- El componente de calculadora es único y autocontenido: sin routing, sin
  librerías de estado global.
- El código debe ser legible y sin errores de consola — esta demo es una
  prueba técnica evaluada por un revisor.
- Los botones numéricos, operadores, `=` y `C` son accesibles por click de
  mouse únicamente.

## PROHIBITED

- No agregar backend, API, ni base de datos (SQL, NoSQL, localStorage,
  IndexedDB) bajo ningún pretexto.
- No implementar memoria (M+, M-, MR), porcentaje (%), ni paréntesis /
  precedencia de operadores.
- No agregar soporte de teclado físico en esta versión.
- No agregar routing ni pantallas adicionales.
- No agregar dependencias más allá de React y su tooling estándar de
  scaffold (Vite) — sin librerías de UI, animación ni gestión de estado.
- No dejar código muerto, `console.log` de debug, ni TODOs sin resolver en
  el entregable final.
