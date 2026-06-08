# AGENT HANDOFF — SDD Model
> Contexto completo de sesión para onboarding de agente en proyecto derivado.
> Leer completo antes de tocar cualquier archivo.

---

## 1. Qué es este modelo y por qué existe

`sdd-model/` es una **plantilla portable de Spec-Driven Development** para desarrollo asistido por IA. No es una app — es el workflow que se copia a proyectos reales.

**Problema que resuelve**: los equipos que usan IA para codear trabajan con prompts aislados → el agente no tiene contexto acumulado, inventa arquitectura, no tiene trazabilidad y el código diverge del brief.

**Solución**: 4 fases con artefactos versionables que acumulan contexto. El código es la consecuencia de ese proceso, nunca el punto de partida.

**Principio de gobernanza (invariante, no negociable)**:
> La IA avisa, para y espera aprobación humana en cada gate. Nunca modifica artefactos ni código sin aprobación explícita. Nunca toma decisiones de negocio sola.

---

## 2. Las 4 fases + Mantenimiento

```
FASE 0 — DISCOVERY      🤖 /sdd-scan (solo brownfield, una vez)
FASE 1 — BRIEF          👤 humano puro
FASE 2 — CLARIFICACIÓN  👤↔️🤖 loop hasta claridad 100%
FASE 3 — ESPECIFICACIÓN 🤖 genera | 👤 valida y firma
FASE 4 — CÓDIGO         🤖 implementa | 👤 completa checklist + review final
MANTENIMIENTO           👤 Tech Lead cada sprint | 🤖 solo reporta
```

---

## 3. Estructura del modelo (plantilla)

```
sdd-model/
├── README.md                    ← descripción pública del modelo
├── CLAUDE.md                    ← contexto que Claude lee al abrir sesión
├── WORKFLOW.md                  ← guía IDE-agnóstica con Mermaid graph
├── graph-render.html            ← HTML para renderizar el Mermaid como PNG
├── drafts/
│   └── README.md                ← instrucciones de qué poner en drafts/
└── .claude/
    ├── settings.json            ← permisos pnpm, sin paths hardcodeados
    └── commands/
        ├── sdd-explain.md
        ├── sdd-scan.md          ← FASE 0 brownfield
        ├── sdd-refine.md
        ├── sdd-generate.md
        ├── sdd-validate.md
        ├── sdd-log.md
        ├── sdd-implement.md
        ├── sdd-checklist.md
        ├── sdd-review.md
        ├── sdd-health.md
        ├── sdd-metrics.md
        └── sdd-metrics-summary.md
```

**Artefactos de runtime** — se crean al usar el modelo, NO son parte del template:
```
existing-arch.md         ← raíz, solo brownfield, descriptivo (≤ 120 líneas)
constitution.md          ← raíz del proyecto, global (≤ 60 líneas)
DECISIONS.md             ← raíz del proyecto, global
specs/
└── 001-[feature]/
    ├── input.md
    ├── spec.md          ← (≤ 80 líneas)
    ├── plan.md          ← (≤ 50 líneas)
    ├── tasks.md         ← (≤ 40 activas)
    └── checklist.md
metrics/
└── [feature_id]-metrics.md  ← generado por sdd-metrics / sdd-validate
app/ (greenfield)        ← código generado
source_root declarado en existing-arch.md (brownfield)
```

---

## 4. Contratos de comportamiento por comando

### `/sdd-scan` — FASE 0 (solo brownfield)
- Se corre UNA vez al introducir SDD en un repo que ya tiene código
- Lee manifests, configs, estructura de carpetas (3 niveles), CI, README
- Clasifica cada dimensión como DETECTADO / AMBIGUO / NO DETECTABLE
- Hace grilling humano UNA pregunta por vez para resolver AMBIGUO y NO DETECTABLE
- Doble confirmación antes de guardar `existing-arch.md` en la raíz
- Registra el SHA de git contra el que fue generado para drift tracking
- Límite: ≤ 120 líneas
- **NUNCA modifica código del proyecto** — es solo lectura + documentación

### `/sdd-explain` — ONBOARDING
- Lee `AGENT-HANDOFF.md`, `WORKFLOW.md`, `CLAUDE.md` y `README.md`
- Explica cómo conecta cada parte del modelo (no resume — conecta)
- Cubre: problema que resuelve, las 5 fases encadenadas, relaciones entre artefactos, gobernanza, límites de tamaño
- Al final pregunta si el usuario quiere profundizar en alguna fase, comando o decisión de diseño
- **Tono**: directo, técnico, con ejemplos concretos

### `/sdd-refine` — FASE 2
- Lee todo lo que haya en `drafts/`
- Si existe `existing-arch.md`, lo lee también como restricción no negociable
- Clasifica cada punto del brief como CLARO / AMBIGUO / FALTANTE por categoría (funcional, técnico, UX, restricciones, integraciones)
- Pregunta UNA SOLA COSA por vez en el chat — nunca una lista de preguntas
- Loop: sigue preguntando hasta que TODO esté CLARO
- Antes de generar `input.md`: muestra resumen y pide confirmación humana
- Antes de guardar: segunda confirmación
- **NUNCA decide ambigüedades de negocio sola**

### `/sdd-generate` — FASE 3
- Lee `input.md` (debe existir)
- Si existe `existing-arch.md`: modo brownfield — `plan.md` usa el `source_root` y stack reales; `tasks.md` no incluye scaffold; `constitution.md` no contradice patrones existentes
- Si NO existe: modo greenfield — `plan.md` incluye `pnpm create vite@latest app -- --template react-ts`
- Genera los 4 artefactos en `specs/[N]-[feature]/`
- Respeta límites: constitution ≤60 líneas, spec ≤80, plan ≤50, tasks ≤40 activas
- Si no entra en el límite: prioriza claridad y avisa qué quedó afuera — NO excede el límite
- Spec incluye un criterio Given/When/Then por user story

### `/sdd-validate` — FASE 3
- Compara `input.md` vs los 4 artefactos
- En brownfield: valida además que `plan.md` use `source_root`/stack de `existing-arch.md` y que `constitution.md` no lo contradiga
- Reporta cada punto del brief como ✅ / ⚠️ parcial / ❌ gap
- Si hay ⚠️ o ❌: avisa, para, NO modifica nada
- Recuerda al humano correr `/sdd-log` después de resolver gaps

### `/sdd-log` — FASE 3/4
- Pregunta 4 cosas una por vez: (1) qué cambió, (2) por qué, (3) qué artefacto afecta, (4) quién decidió
- Crea `DECISIONS.md` en la raíz si no existe, con encabezado explicativo tipo ADR
- Confirma el registro al usuario y recuerda poner bajo control de versiones

### `/sdd-implement` — FASE 4
- Lee los 4 artefactos de `specs/[feature]/`
- Si existe `existing-arch.md`: trabaja dentro del `source_root` declarado, usa el gestor de paquetes declarado, respeta patrones inquebrantables, evita duplicar archivos con responsabilidad equivalente
- Si NO existe: usa `pnpm` y crea `app/`
- **Empieza directo, sin pedir confirmación**
- Implementa TODAS las tareas en el orden de `tasks.md`
- Usa TDD: test primero, luego implementación
- No inventa arquitectura que no esté en `plan.md`

### `/sdd-checklist` — FASE 4
- Genera `checklist.md` con criterios NO automatizables
- Solo incluye categorías relevantes al proyecto (no genera ítems vacíos)
- Formato: `CHK001` — descripción — categoría
- Categorías posibles: UX, Accesibilidad, Seguridad, Performance, Compatibilidad, Negocio
- Muestra al usuario antes de guardar, pide confirmación

### `/sdd-review` — FASE 4
- **Pasada 1 — Lógica**: verifica que cada criterio Given/When/Then de `spec.md` tenga test y código correspondiente
- **Pasada 2 — UI**: lee descripción visual de `input.md` → ¿llegó a criterio en `spec.md`? → ¿llegó al código?
- Carpeta a revisar: `app/` por defecto, o `source_root` de `existing-arch.md` si existe
- Sección `🎨 Gaps de UI` para lo que nadie convirtió en criterio formal
- Si hay PENDIENTE: para y avisa, NO agrega código solo
- Recuerda `/sdd-log` después de resolver

### `/sdd-health` — MANTENIMIENTO
- Detecta: archivos sobredimensionados, principios contradictorios, tasks completadas no archivadas, user stories canceladas o sin código
- En brownfield: detecta drift entre el SHA registrado en `existing-arch.md` y el HEAD actual (cambios en manifests, top-level folders, commits transcurridos)
- Límites: constitution ≤60, spec ≤80, plan ≤50, tasks ≤40 activas, existing-arch ≤120
- **Solo reporta — nunca modifica nada solo**
- Al final pregunta si archivar tasks completadas; si sí → lo hace y recuerda `/sdd-log`

---

## 5. Decisiones de diseño tomadas en sesión (y por qué)

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| `specs/` por feature, no archivos globales | Un solo `spec.md` en raíz | Los archivos globales crecen sin control con cada feature |
| `constitution.md` y `DECISIONS.md` son globales | Por feature | Son contratos del proyecto completo, no de una feature |
| Límites de líneas en artefactos | Sin límites | Previene deuda documental que degrada el contexto del agente |
| `/sdd-refine` como loop dinámico | Lista fija de preguntas | Las preguntas fijas no capturan lo que ya está claro y abruman |
| `/sdd-review` con 2 pasadas (lógica + UI) | Solo lógica | Los gaps de UI nunca llegan a criterio formal si nadie los cruza |
| `/sdd-health` solo reporta, nunca modifica | Autorreparación | El mantenimiento requiere decisión humana; la IA no sabe qué archivar |
| `settings.json` solo con permisos pnpm | Permisos amplios | Principio de mínimo privilegio; paths hardcodeados rompen portabilidad |
| Claude arranca sin pedir confirmación en `/sdd-implement` | Confirmación inicial | Ya hay gate humano en Fase 3; pedir confirmación de nuevo es ruido |

---

## 6. Convenciones del modelo (invariantes)

- Gestor de paquetes: **`pnpm` siempre** — nunca npm ni yarn
- Naming de carpetas: `specs/001-[kebab-case-feature]/`
- Naming de branches (sugerido): `feat/001-[feature]`
- Checklist items: formato `CHK001`
- Límites de artefactos son **hard limits**, no sugerencias
- `DECISIONS.md` es el único registro válido de desvíos del brief

---

## 7. Qué hay en cada archivo de la plantilla

### `CLAUDE.md`
Contexto que Claude Code lee automáticamente al iniciar sesión. Lista los 9 comandos con descripción de una línea. Define reglas generales: usar pnpm, no inventar arquitectura, no modificar sin aprobación.

### `WORKFLOW.md`
Guía IDE-agnóstica. Contiene:
- Mermaid flowchart de las 5 fases
- Diagrama de texto ASCII del ciclo completo
- Estructura de archivos con límites
- Tabla de responsables por fase

### `graph-render.html`
HTML standalone con Mermaid.js (CDN) + panel de glosario lateral. Renderiza el workflow completo como grafo visual. Para generar PNG: abrir en Chrome → Ctrl+Shift+P → "Captura de pantalla de página completa".

### `drafts/README.md`
Instrucciones para el equipo de qué poner en `drafts/` antes de correr `/sdd-refine`. Incluye ejemplos de formato.

### `.claude/settings.json`
Solo permisos pnpm (create, install, add, test, dev, build). Sin paths hardcodeados. Portable a cualquier máquina.

---

## 8. Pendiente (no implementado en esta sesión)

| Item | Estado | Notas |
|---|---|---|
| Skills repo para Copilot | ❌ Deferred | Skills organizadas por fase del workflow, formato `.md` compatible con Copilot. Mencionado 4+ veces, siempre pospuesto. |
| Publicar como repo separado | ❌ Pendiente | `sdd-model/` está lista para ser el contenido de un repo standalone. |
| Mermaid graph 100% sincronizado con comandos | ⚠️ Gap menor | El graph puede tener pequeñas desincronías con el último estado de los comandos. |

---

## 9. Cómo usar este modelo en un proyecto nuevo

```
1. Copiar sdd-model/ a la raíz del proyecto nuevo
2. Instalar Claude Code CLI: npm install -g @anthropic-ai/claude-code
3. Instalar pnpm: npm install -g pnpm
4. Poner borradores en drafts/
5. Abrir Claude Code en la raíz del proyecto
6. Correr: /sdd-refine
```

El modelo lee CLAUDE.md automáticamente al iniciar. No hay configuración adicional.

## 9-bis. Cómo usar este modelo en un proyecto brownfield

```
1. Copiar sdd-model/ a la raíz del proyecto existente
2. Instalar Claude Code CLI y pnpm (igual que greenfield)
3. Abrir Claude Code en la raíz del proyecto
4. Correr: /sdd-scan  → genera existing-arch.md con doble confirmación humana
5. Poner borradores de la NUEVA feature en drafts/
6. Correr: /sdd-refine  → ya entra en modo brownfield automáticamente
7. Seguir el ciclo normal: /sdd-generate → /sdd-validate → /sdd-implement
```

La presencia de `existing-arch.md` en la raíz activa el modo brownfield en TODOS los comandos.

---

## 10. Repo de origen

- **Repo**: `pmillanmc/sdd-lab-proguide`
- **Branch activo**: `master`
- **Branch default**: `main`
- **Ruta del modelo**: `sdd-proguidemc/sdd-model/`
