# Borrador de ejemplo — Panel de control de proyectos

> Este archivo es un ejemplo de cómo el equipo debería documentar
> la intención inicial antes de correr /sdd-refine.
> Borrarlo o reemplazarlo cuando arranques un proyecto real.

---

## Contexto del negocio

Somos un equipo de 4 devs. Necesitamos un panel interno para hacer
seguimiento de proyectos activos: ver el estado de cada uno, quién
está asignado y qué tareas tiene pendientes.

Hoy lo hacemos en una hoja de cálculo y es un desastre — nadie la
actualiza y la info siempre está desactualizada.

## Qué queremos que haga

- Ver una lista de proyectos con su estado (activo / pausado / terminado)
- Entrar a un proyecto y ver sus tareas con estado y responsable
- Poder crear proyectos y agregar tareas desde la misma pantalla
- Marcar tareas como completadas
- Filtrar proyectos por estado

## Cómo lo vemos visualmente

- Una pantalla de inicio con cards de proyectos
- Al hacer click en una card se abre el detalle con las tareas
- Sin login por ahora — acceso directo sin autenticación
- Diseño funcional, no necesita ser bonito, pero tiene que ser usable

## Restricciones técnicas

- React + TypeScript, sin backend todavía
- Los datos se guardan en localStorage (no tenemos servidor aún)
- Sin librerías de estado externas

## Comportamiento en casos borde

- Si no hay proyectos todavía, la pantalla de inicio muestra un mensaje
  "Todavía no hay proyectos" con un botón para crear el primero
- Si un proyecto no tiene tareas, el detalle muestra "Este proyecto no tiene
  tareas aún" en lugar de una lista vacía
- Si el usuario intenta crear un proyecto sin nombre, el campo se marca en rojo
  y aparece "El nombre es obligatorio" — no se cierra el formulario
- Cuando se marca una tarea como completada, se tacha visualmente y se mueve
  al final de la lista con una animación sutil
- Cuando se crea un proyecto nuevo, la card aparece al tope de la lista
  (no al final)

## Lo que NO entra ahora

- Login / usuarios
- Notificaciones
- Integraciones con Jira, GitHub ni nada externo
- App mobile
