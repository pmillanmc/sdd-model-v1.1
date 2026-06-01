# Borradores del proyecto

Esta carpeta contiene los borradores crudos que el equipo genera antes de
tener un brief formal. Pueden ser notas de reuniones, wireframes en texto,
emails, comentarios de Slack — cualquier cosa que capture la intención inicial.

## Cómo usarla

### Greenfield (proyecto nuevo)
1. Copiá acá todos los documentos previos al brief (uno por archivo .md o .txt)
2. Corré `/sdd-refine` en Claude Code
3. El comando te va a hacer 6 preguntas y generar `input.md` con todo consolidado

### Brownfield (proyecto con código existente)
1. Primero corré `/sdd-scan` desde la raíz del repo — genera `existing-arch.md`
2. Copiá los borradores de la NUEVA feature en esta carpeta
3. Corré `/sdd-refine` — va a leer tanto los drafts como `existing-arch.md`
4. Las restricciones del codebase existente quedan como input fijo del proceso

## Qué puede ir acá

- Notas de reunión con el cliente
- Descripción informal del problema
- Wireframes en texto
- Requisitos técnicos preliminares
- Contexto de negocio relevante

## Qué NO va acá

- Los artefactos SDD (constitution.md, spec.md, etc.) — esos se generan automáticamente
- El input.md final — ese es el output de /sdd-refine, no un borrador
- `existing-arch.md` — va en la raíz del repo, no acá; lo genera /sdd-scan
