Leé input.md.

**Paso previo obligatorio — Confirmar feature_id:**
Antes de generar cualquier artefacto, determiná el `feature_id` de esta feature:
- Si existe una carpeta en `specs/`, usá su nombre (ej. `001-login`).
- Si no existe, proponé el siguiente número disponible y un nombre corto basado en `input.md` (ej. `002-dashboard`).
- Mostrá el `feature_id` propuesto al usuario y pedí confirmación con una sola línea: "¿El feature_id `[valor]` es correcto?"
- Usá ese `feature_id` como nombre de carpeta destino para los artefactos (`specs/[feature_id]/`) y en el encabezado de `tasks.md`.
- Al crear la carpeta, escribiá también `specs/[feature_id]/feature.status.md` con este contenido exacto:

```
status: OPEN
feature_id: [valor]
created: [fecha ISO 8601]
last_command: sdd-generate
```

Si existe `existing-arch.md` en la raíz, leélo TAMBIÉN. Estás en modo brownfield:
- El stack, `source_root`, y patrones inquebrantables de `existing-arch.md` son input fijo.
- `constitution.md` NO puede contradecir `existing-arch.md`; agrega principios sobre lo existente.
- `plan.md` debe usar el stack real y el `source_root` declarado — no scaffoldear un proyecto nuevo.
- `tasks.md` empieza en T001 con "validar entorno existente" (ej. `pnpm install`, correr tests existentes), no con scaffold.
- Marcá explícitamente en cada tarea qué archivos del codebase existente toca y cuáles crea.

A partir de esos archivos generá estos cuatro archivos en orden:
1. constitution.md — principios MUST/PROHIBITED del proyecto
2. spec.md — user stories con criterios Given/When/Then, uno por feature de UI
3. plan.md — stack técnico, estructura de carpetas y lista de componentes a crear
4. tasks.md — una tarea por componente o feature (T001 = scaffold, T002 = un componente, etc.)

En modo greenfield (sin `existing-arch.md`), incluí en plan.md el comando exacto de scaffold: pnpm create vite@latest app -- --template react-ts
En modo brownfield, omití el scaffold y referenciá la estructura de `existing-arch.md`.
Límites de tamaño (obligatorios):
- constitution.md: máximo 60 líneas
- spec.md: máximo 80 líneas
- plan.md: máximo 50 líneas
- tasks.md: máximo 40 líneas

Cada archivo tiene que ser corto y directo. Sin placeholders.
Si el contenido no entra en el límite, priorizá claridad sobre completitud
y avisá qué quedó afuera para que el humano lo revise.
Empezá directamente, sin pedir confirmación.
Usá pnpm como instalador de paquetes.

Asegúrate de incluir SIEMPRE una sección de **Measurable Process Outcomes (DX)** en la especificación, con estas dos métricas obligatorias:
* **DX-001**: El agente debe completar la implementación con menos de [X] ciclos de autocorrección (Rework).
* **DX-002**: Mantener la densidad de ambigüedad en 0 (sin consultas de aclaración para la IA).
