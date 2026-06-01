# /sdd-explain

Sos un AI Engineer explicando el modelo SDD a alguien que acaba de llegar al proyecto.

Lee estos archivos antes de responder:
- `AGENT-HANDOFF.md` — contexto completo de diseño y decisiones
- `WORKFLOW.md` — ciclo de fases y estructura
- `CLAUDE.md` — reglas de sesión
- `README.md` — descripción pública

---

## Tu objetivo

Dar una explicación clara de cómo funciona el modelo y cómo conecta cada parte con las demás.
No resumís — conectás. Cada elemento tiene un por qué y un "viene antes de / habilita a".

---

## Estructura de la explicación

### 1. El problema que resuelve
Explicá en 3-4 líneas qué pasa cuando un equipo usa IA sin este modelo (prompts aislados, contexto inventado, código que diverge del brief, sin trazabilidad).

### 2. La idea central
Una sola frase que capture la propuesta de valor del modelo.

### 3. Las 5 fases y cómo se encadenan
Para cada fase:
- **Nombre y responsable**
- **Qué entra** (input)
- **Qué sale** (output)
- **Por qué existe** (qué problema resolvería si no estuviera)
- **Qué comando(s) la ejecutan**

Mostralo como cadena explícita:
```
drafts/ → [/sdd-refine] → input.md → [/sdd-generate] → 4 artefactos → ...
```

### 4. Los artefactos y sus relaciones
Explicá cada artefacto en relación con los demás:
- ¿Qué lo genera?
- ¿Qué lo consume?
- ¿Qué pasa si falta o está desactualizado?

### 5. El principio de gobernanza
Explicá concretamente qué significa que "la IA avisa y para":
- Qué pasa en cada gate
- Qué NO puede hacer la IA sola
- Dónde vive el registro de decisiones y para qué sirve

### 6. Los límites de tamaño y por qué importan
Explicá qué pasa con el contexto del agente cuando los artefactos crecen sin control. Conectá esto con `/sdd-health`.

### 7. Cómo empezar en un proyecto nuevo
Pasos concretos: qué hacer primero, qué archivo leer, qué comando correr.

### 8. Modo brownfield (proyecto con código existente)
Explicá qué cambia cuando se introduce SDD en un repo que ya tiene código:
- El primer comando es `/sdd-scan` — genera `existing-arch.md` con el estado real del codebase.
- `existing-arch.md` es DESCRIPTIVO; `constitution.md` agrega principios encima sin contradecirlo.
- Todos los comandos detectan automáticamente la existencia de `existing-arch.md` y entran en modo brownfield.
- `/sdd-implement` trabaja dentro del `source_root` declarado, no crea `app/`.
- `/sdd-health` detecta drift entre `existing-arch.md` y el HEAD actual del repo.

---

## Reglas de esta explicación

- Usá ejemplos concretos, no abstractos
- Si algo tiene un diseño no obvio, explicá la decisión (consultá `AGENT-HANDOFF.md` sección 5)
- Al final preguntá: "¿Querés que profundice en alguna fase, comando o decisión de diseño en particular?"
- Tono: directo, técnico, sin relleno
