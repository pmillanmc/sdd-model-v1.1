# /sdd-scan — FASE 0 (solo brownfield)

Este comando se corre UNA SOLA VEZ al introducir SDD en un proyecto que ya tiene código.
Si el repo está vacío (greenfield), este comando NO aplica — saltá directo a `/sdd-refine`.

## Objetivo

Generar `existing-arch.md` en la raíz del proyecto: un documento descriptivo
(no prescriptivo) que captura la realidad del codebase actual. Este archivo
actúa como contexto base para todos los comandos siguientes — restringe lo
que la IA puede proponer en `constitution.md`, `plan.md` y la implementación.

## Reglas de gobernanza (igual que /sdd-refine)

- Nunca asumas patrones; si algo no está claro en el código, preguntá al humano.
- Doble confirmación humana antes de guardar `existing-arch.md`.
- Nunca modifiques código del proyecto en este comando — es solo lectura + documentación.
- Si encontrás contradicciones internas en el código (ej. dos patrones de routing distintos), reportalas; no las resuelvas.

## Proceso

### Paso 1 — Inventario automático
Recorré la raíz del repo y leé:
- Archivos de manifest: `package.json`, `pnpm-lock.yaml`, `pyproject.toml`, `Cargo.toml`, `go.mod`, etc.
- Archivos de config: `tsconfig.json`, `vite.config.*`, `next.config.*`, `tailwind.config.*`, `.eslintrc*`, `vitest.config.*`
- Estructura de carpetas (3 niveles máximo desde la raíz, ignorando `node_modules`, `dist`, `.git`, `build`, `coverage`)
- README del proyecto si existe
- Archivos de CI: `.github/workflows/`, `.gitlab-ci.yml`

Capturá el SHA actual con el equivalente de `git rev-parse HEAD` (si hay git).

### Paso 2 — Análisis y clasificación
Para cada dimensión, clasificá el estado:
- **DETECTADO** — surge claro del código/manifests
- **AMBIGUO** — hay señales contradictorias o múltiples opciones
- **NO DETECTABLE** — requiere preguntar al humano

Dimensiones obligatorias:
1. Stack principal (lenguaje, framework, runtime, versiones)
2. `source_root` — carpeta raíz del código de producción (ej. `src/`, `app/`, `packages/web/src/`)
3. Estructura de módulos (cómo se organizan features/componentes/servicios)
4. Gestor de paquetes (pnpm / npm / yarn / poetry / etc.)
5. Framework de tests y su ubicación
6. Persistencia / data layer (DB, ORM, localStorage, API externa)
7. Manejo de estado (si aplica al stack)
8. Estilos / sistema de diseño
9. Patrones inquebrantables (convenciones que el equipo respeta y NO se deben romper)
10. Integraciones externas (auth, pagos, analytics, etc.)
11. Restricciones de deploy / entorno

### Paso 3 — Reporte y grilling
Mostrá al humano:
```
✅ DETECTADO: [dimensiones claras con el valor inferido]
⚠️ AMBIGUO: [dimensión + opciones detectadas + qué decidir]
❓ NO DETECTABLE: [dimensión + por qué hay que preguntar]
```

Para cada ⚠️ y ❓: hacé UNA pregunta concreta por vez. Esperá respuesta antes de seguir.

### Paso 4 — Primera confirmación
Cuando todo esté DETECTADO o respondido, mostrá el contenido propuesto de `existing-arch.md` y preguntá:
"¿Refleja esto la realidad del codebase? ¿Falta o sobra algo?"

Iterá hasta que el humano apruebe el contenido.

### Paso 5 — Segunda confirmación y guardado
Preguntá: "¿Confirmás que puedo guardar `existing-arch.md` en la raíz?"
Solo si responde sí, escribilo.

## Formato obligatorio del archivo

```markdown
# existing-arch.md — Estado del codebase

> Generado por /sdd-scan el [FECHA]
> Commit base: [SHA corto]
> Este archivo es DESCRIPTIVO (qué hay), no PRESCRIPTIVO (qué debería haber).
> Las restricciones acá son no negociables salvo decisión registrada en DECISIONS.md.

## Stack
- Lenguaje: ...
- Framework: ...
- Runtime: ...
- Gestor de paquetes: ...

## source_root
`src/` (o la ruta que corresponda)

## Estructura
[árbol de carpetas relevante, máximo 3 niveles]

## Patrones inquebrantables
- [convención 1 que el equipo respeta]
- [convención 2]

## Tests
- Framework: ...
- Ubicación: ...
- Comando: ...

## Persistencia / Data
...

## Estado / Estilos / Integraciones
...

## Restricciones de deploy / entorno
...

## Drift tracking
- Generado contra commit: [SHA]
- Re-scan sugerido si: cambian dependencias mayores, se agregan/eliminan carpetas top-level, o pasan >2 sprints.
```

## Límite
`existing-arch.md` debe ser ≤ 120 líneas. Si no entra, priorizá las primeras 8 secciones y dejá las integraciones/deploy en una segunda pasada (avisá al humano).

## Salida
Al terminar:
1. Confirmá la ruta del archivo guardado
2. Recordá al humano: "A partir de ahora, todos los comandos SDD entran en modo brownfield automáticamente al detectar `existing-arch.md`."
3. Sugerí: "Si esto representa un cambio frente al brief original, corré `/sdd-log` para registrarlo."
