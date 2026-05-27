# Borradores del proyecto

Esta carpeta contiene los borradores crudos que el equipo genera antes de
tener un brief formal. Pueden ser notas de reuniones, wireframes en texto,
emails, comentarios de Slack — cualquier cosa que capture la intención inicial.

## Cómo usarla

1. Copiá acá todos los documentos previos al brief (uno por archivo .md o .txt)
2. Corré `/sdd-refine` en Claude Code
3. El comando te va a hacer 6 preguntas y generar `input.md` con todo consolidado

## Qué puede ir acá

- Notas de reunión con el cliente
- Descripción informal del problema
- Wireframes en texto
- Requisitos técnicos preliminares
- Contexto de negocio relevante

## Qué NO va acá

- Los artefactos SDD (constitution.md, spec.md, etc.) — esos se generan automáticamente
- El input.md final — ese es el output de /sdd-refine, no un borrador
