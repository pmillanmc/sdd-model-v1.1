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
- Archivos `.html` con diseños de referencia (ver guía abajo)

## Qué NO va acá

- Los artefactos SDD (constitution.md, spec.md, etc.) — esos se generan automáticamente

---

## Guía: cómo especificar estilos CSS correctamente

### El problema más común

Pasar un HTML de referencia sin documentar los valores CSS efectivos. El agente lee
el HTML pero puede no resolver correctamente variables, herencia o especificidad, y
los estilos llegan incompletos o incorrectos a la implementación.

### Qué hace el modelo automáticamente

Cuando hay un `.html` en `drafts/`, `/sdd-refine` resuelve la cascada CSS y escribe
los valores computados en `input.md`. Eso garantiza que `sdd-implement` y `sdd-review`
trabajen con valores exactos, no con nombres de clase.

### Cómo ayudar al modelo (mejores resultados)

**Opción A — HTML con variables CSS bien nombradas (recomendado)**

Si tu HTML usa variables CSS, definilas al principio con nombres semánticos:

```html
<style>
  :root {
    --color-primary: #2563EB;
    --color-surface: #F8FAFC;
    --text-heading: #0F172A;
    --radius-card: 8px;
    --space-md: 16px;
  }
</style>
```

El modelo puede resolver la cascada a partir de `:root` sin ambigüedad.

**Opción B — Anotaciones explícitas en el HTML**

Si el HTML viene de un diseñador o herramienta externa, agregá un bloque de comentarios
con los valores que considerás críticos:

```html
<!--
  SPEC VISUAL (valores efectivos que deben respetarse):
  - Botón primario: fondo #2563EB, texto #FFFFFF, hover #1D4ED8, border-radius 6px
  - Card: fondo #FFFFFF, sombra 0 1px 3px rgba(0,0,0,0.1), padding 24px
  - Tipografía base: Inter 14px/1.5, color #374151
  - Estado disabled: opacity 0.4, cursor not-allowed
-->
```

**Opción C — Archivo `.md` complementario**

Agregá un archivo `[nombre]-visual-spec.md` junto al HTML con la tabla de tokens:

```markdown
## Tokens visuales críticos

| Elemento | Propiedad | Valor |
|---|---|---|
| Botón primario | background | #2563EB |
| Botón primario | hover background | #1D4ED8 |
| Card | border-radius | 8px |
| Texto body | font-size | 14px |
| Texto body | line-height | 1.5 |
```

### Qué evitar

- **No pases solo el HTML sin estilos inline o `<style>`** — el agente no puede inferir valores desde clases de frameworks externos (Tailwind, Bootstrap) si no tiene acceso al CSS compilado.
- **No describas estilos con palabras** si tenés el valor exacto: decir "azul primario" es ambiguo, `#2563EB` no lo es.
- **No uses `@import` a URLs externas** en el HTML de referencia — el agente no puede hacer fetch de Google Fonts ni de CDNs, usá los valores de fallback.

### Señal de que tu spec visual está bien

Cuando `/sdd-refine` termina, la sección `UI / FLUJO` de `input.md` debe tener
valores numéricos y hexadecimales, no descripciones como "botón azul" o "clase btn-primary".
Si ves solo descripciones textuales, pedile al agente que resuelva la cascada antes de confirmar.
- El input.md final — ese es el output de /sdd-refine, no un borrador
- `existing-arch.md` — va en la raíz del repo, no acá; lo genera /sdd-scan
