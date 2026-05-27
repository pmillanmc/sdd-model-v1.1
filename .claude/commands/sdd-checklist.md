Leé spec.md, plan.md y tasks.md.

A partir de esos artefactos, generá un checklist de verificación manual para criterios
que los tests automatizados no pueden cubrir.

Organizá el checklist en categorías según lo que encuentres en la spec.
Categorías posibles (solo incluí las que apliquen al proyecto):

- Accesibilidad: navegación por teclado, aria-labels, contraste de color, lectores de pantalla
- UX: estados vacíos, mensajes de error claros, feedback visual, flujos edge case
- Seguridad: sanitización de inputs, datos sensibles, permisos, exposición de información
- Performance: renders innecesarios, operaciones costosas en el hilo principal
- Compatibilidad: browsers, dispositivos, tamaños de pantalla si aplica
- Negocio: criterios de aceptación que requieren validación humana subjetiva

Formato de cada ítem:
- [ ] CHK001 [acción concreta y verificable en primera persona]

Reglas:
- Solo incluí ítems que NO pueden verificarse con un test unitario o de integración
- Cada ítem tiene que ser accionable: alguien tiene que poder marcarlo ✅ o ❌
- No repitas criterios que ya están cubiertos en sdd-review
- Numerá los ítems secuencialmente (CHK001, CHK002...)
- Guardá el resultado en checklist.md

Mostrá el checklist al usuario antes de guardarlo y pedí confirmación.
Empezá directamente, sin pedir confirmación previa.
