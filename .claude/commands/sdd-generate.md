Leé input.md.

A partir de ese archivo generá estos cuatro archivos en orden:
1. constitution.md — principios MUST/PROHIBITED del proyecto
2. spec.md — user stories con criterios Given/When/Then, uno por feature de UI
3. plan.md — stack técnico, estructura de carpetas y lista de componentes a crear
4. tasks.md — una tarea por componente o feature (T001 = scaffold, T002 = un componente, etc.)

En plan.md incluí el comando exacto para inicializar el proyecto: pnpm create vite@latest app -- --template react-ts
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
