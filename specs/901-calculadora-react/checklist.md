# Checklist manual — 901-calculadora-react

Criterios que los tests automatizados (`Calculator.test.tsx`) no cubren.
El humano completa este archivo marcando ✅ o ❌ en cada ítem.

## Accesibilidad

- [ ] CHK001 Verifico que cada botón tiene foco visible al navegar con Tab
  (aunque el flujo de cálculo esté out-of-scope para teclado, los
  elementos no deben quedar inaccesibles por default del navegador).
- [ ] CHK002 Verifico que el contraste de color entre la pantalla, los
  botones y el fondo es legible a simple vista (pantalla oscura, texto
  claro, botón de operador y `C` diferenciados del resto).

## UX

- [ ] CHK003 Verifico que el resultado y el estado "Error" se leen
  completos en la pantalla sin recortarse, incluyendo números largos con
  muchos decimales.
- [ ] CHK004 Verifico que encadenar una nueva operación después de un
  estado de error (clickear un dígito tras "Error") se siente intuitivo y
  no dejo al usuario confundido sobre qué pasó.
- [ ] CHK005 Verifico que el feedback visual al pasar el mouse (`hover`)
  sobre los botones se ve natural, sin parpadeos ni saltos de layout.

## Compatibilidad

- [ ] CHK006 Verifico que la calculadora se ve y funciona correctamente en
  al menos dos navegadores distintos (ej. Chrome y Firefox/Edge).
- [ ] CHK007 Verifico que el layout no se rompe al angostar la ventana del
  navegador (simulando una pantalla chica).

## Negocio

- [ ] CHK008 Confirmo que el nivel de pulido visual y de código es
  adecuado para presentarse como prueba técnica ante el cliente
  (impresión general prolija, sin errores visibles a simple vista).
