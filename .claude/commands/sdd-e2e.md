# Comando: QA E2E de la feature (ProGuide Test)

**Descripción:** Deriva casos de prueba E2E desde **la fuente de verdad de la feature —
cualquiera que sea** (spec.md, documentación funcional, ticket de Jira/issue, contrato de
API, o una suite de regresión ya existente), los ejecuta contra la app corriendo con ProGuide
(Playwright + LLM vía el MCP `proguide-test`) y produce evidencia real de comportamiento. Es la
verificación **funcional contra la app viva** — complementa, no reemplaza, los tests
unitarios/integración de `/sdd-implement` (`pnpm test`) ni el checklist manual de
`/sdd-checklist`.

**No se acopla a `spec.md`.** El QA rara vez tiene solo una spec: a veces trabaja desde
documentación, desde un ticket de Jira donde vive la info, o —sobre todo en **regresión**—
desde una suite que ya existe y solo hay que re-ejecutar. `spec.md` es *una* fuente preferida
**cuando la feature es SDD-managed**, no un requisito.

Fase: 4 (Código), pero también sirve **transversalmente** para regresión en cualquier momento.
En el flujo SDD se corre después de `/sdd-implement` y antes/junto a `/sdd-review`.

> No confundir con `/sdd-test`, que es el smoke test del **propio modelo SDD** sobre un
> fixture sintético. `/sdd-e2e` prueba el **producto** de la feature.

---

## Gate de prerequisitos

Antes de leer nada, verificá en orden:

1. **Hay una fuente de verdad.** Al menos una de: `spec.md` (SDD), documentación funcional,
   ticket de Jira/issue, contrato de API, capturas del usuario, o una **suite de regresión ya
   existente**. Si no hay ninguna y el QA no la aporta, pedila y PARÁ. **No exijas `spec.md`
   en particular** — es una fuente más, no el requisito.
2. **Herramienta disponible:** ProGuide (CLI + MCP + skill) está instalado. El **Paso 0** lo
   verifica; si falta, le pide al usuario que lo instale a mano (con la URL del repo) y espera.

### Gates SDD (aplican SOLO si la feature es SDD-managed: existe `specs/[feature_id]/`)

Si la fuente es un ticket, documentación o una regresión sobre una app sin SDD, **saltá estos
gates** — no hay registro ni artefactos que verificar.

3. Hay evidencia de implementación: código en el `source_root` y un bloque `## Implement` en
   `metrics/[feature_id]-metrics.md`. Si no: "No hay evidencia de implementación — corré
   /sdd-implement primero." y PARÁ (salvo que sea regresión de algo ya entregado).
4. La feature figura `OPEN` en `specs/_registry/features.yaml`. Si está `CLOSED`, para QA de
   regresión está OK; para casos nuevos avisá y pedí decisión humana + `/sdd-log`.
5. **Colisiones (equipo):** los casos/evidencia viven en `specs/[feature_id]/e2e/` y la suite
   congelada en `proguide_tests/suite/[feature_id]/`. Sumá esas rutas a `touches` de la feature;
   si intersectan con otra feature `OPEN` de otro owner, reportá y esperá decisión humana.

---

## Paso 0 — Verificar ProGuide (bootstrap)

Antes de trabajar, asegurate de que la herramienta esté disponible. El agente **verifica**; la
instalación, si hace falta, la hace el usuario a mano (Paso 1 abajo).

1. **Detectar la CLI:** ejecutá `proguide --version`.
   - **Devuelve una versión** → ProGuide ya está instalado. Seguí al Paso 0.5.
   - **El comando no existe / falla** → **no lo instales vos**. Todavía **no está publicado en
     npm**; pedile al usuario que lo instale a mano desde el repositorio y esperá. Pasale la
     URL del repo y el comando `gh` para bajar el **último release**:

     > Repositorio: https://github.com/molivera-proguide/proguide-test
     >
     > Instalá ProGuide desde el último release (requiere [GitHub CLI](https://cli.github.com/)):
     >
     > ```bash
     > gh release download --repo molivera-proguide/proguide-test --pattern "*.tgz"
     > npm install -g ./proguide-test-*.tgz
     > ```
     >
     > (o descargá el `.tgz` del último release desde
     > https://github.com/molivera-proguide/proguide-test/releases/latest y corré
     > `npm install -g <archivo>.tgz`)

     PARÁ hasta que el usuario confirme la instalación. Cuando confirme, volvé a correr
     `proguide --version`; si sigue sin resolver, mostrá el error y no sigas sin la CLI.
2. **Entorno:** corré `proguide doctor --json` y verificá Node ≥ 20 y `ANTHROPIC_API_KEY`.
   Reportá lo que falte antes de seguir.
3. **MCP registrado:** confirmá que el MCP `proguide-test` esté en `.mcp.json` (Claude Code) o
   `.cursor/mcp.json` (Cursor). Si falta, avisá cómo agregarlo (los templates viven en la raíz
   del modelo).
4. **Skill de casos instalada — `proguide update skills`.** Este es el paso que **carga la
   skill `qa-test-cases` en Claude Code**, y hay que correrlo **después de toda instalación o
   actualización nueva de la CLI** (si en el paso 1 el usuario acaba de instalar ProGuide, este
   es el paso siguiente). Es idempotente, se puede correr siempre.

   Instala en el scope **global** (de usuario: `~/.claude/skills`, Windows:
   `%USERPROFILE%\.claude\skills`), así Claude Code la ve en **cualquier** workspace. Trae
   `TEMPLATE.md` y las referencias (`writing-rules.md`, `api-cases.md`, `troubleshooting.md`).

## Paso 0.5 — Modo, fuente y contexto

Con ProGuide disponible, definí con el QA **qué está haciendo** y **de dónde sale la info**.

**Modo:**
- **Casos nuevos / calibración** → hay que redactar casos desde una fuente (Paso 1) y calibrarlos.
- **Regresión** → ya existe una suite congelada (`proguide_tests/suite/<módulo>/`): el trabajo
  es re-ejecutarla (`proguide regress <módulo>` / `execute_run` con `frozen: true`) y, si la UI
  cambió, recalibrar solo los casos afectados. No necesita spec ni fuente nueva — la fuente de
  verdad es la suite existente. Saltá directo al Paso 4/5.

**Fuente de verdad (para casos nuevos, la que aplique — pueden ser varias):**
- `spec.md` de la feature SDD (criterios `Given/When/Then`).
- **Documentación funcional** / manual / historia de usuario.
- **Ticket de Jira / issue** (pegá el contenido o la referencia; ahí suele vivir la info real).
- **Contrato de API** (OpenAPI/Swagger, colección) para casos REST.
- **Capturas o descripción** que aporte el QA.

Anotá **de qué fuente sale cada caso** para la trazabilidad (Paso 3): `US-N` si es spec,
`JIRA-1234` si es un ticket, `doc §X` si es documentación, etc.

**Contexto operativo (siempre):**
- **base_url** de la app corriendo (ej. `http://localhost:3000`).
- **Credenciales** si hay rutas protegidas (email/username/password) — por MCP/CLI, nunca
  literales en los casos.
- **Qué cubrir** — el alcance que pida el QA; por defecto todo lo E2E-verificable de la fuente.
- **feature_id / módulo** para saber dónde guardar (ver Paso 3) — o el nombre del módulo de
  regresión.
- **Rutas/pantallas** relevantes que conozca (mejora el grounding de selectores).

## Paso 1 — Leer la fuente de verdad (la que sea)

Leé la fuente que definiste en el Paso 0.5 y extraé de ahí los criterios de aceptación /
comportamientos esperados. Según el caso:

- **Si es `spec.md` (SDD):** cada `Given/When/Then` es un candidato a caso E2E; anotá el `US-N`.
  Leé además la sección `## Fuera de scope (v1)` — **contrato negativo**: ningún caso puede
  verificar algo listado ahí. Complementá con `input.md`/`plan.md` (rutas, URLs, stack) y con
  `existing-arch.md` si existe (`source_root`, gestor).
- **Si es documentación / ticket de Jira / historia:** extraé los criterios de aceptación,
  flujos y reglas de negocio del texto. Si el ticket no define el resultado esperado de forma
  verificable, **preguntá al QA** antes de inventarlo.
- **Si es un contrato de API (OpenAPI/colección):** los endpoints, métodos, statuses y schemas
  son la fuente; van a casos estructurados `request`/`requests` + `assertions`.

En todos los casos, distinguí qué criterios son **E2E-verificables** (flujo de UI o API contra
la app corriendo) de los de juicio humano/subjetivo — esos NO son E2E (van a `/sdd-checklist`
si la feature es SDD, o se reportan como fuera del alcance automatizable). Reportá esa
clasificación al usuario antes de redactar. Si la fuente pide algo que sabés que está fuera de
scope (en SDD, el `## Fuera de scope`), no lo cubras.

---

## Paso 2 — Delegar la mecánica QA a la skill `qa-test-cases`

**No reimplementes el flujo de QA en este comando.** La skill `qa-test-cases` de ProGuide
es la fuente de verdad de CÓMO explorar la app, redactar, hacer dry-run, ejecutar e iterar.
Activala/leela y seguí sus **gates bloqueantes** al pie de la letra:

- **Evidencia del target:** ningún `click`/`fill`/`expect` sin haber visto el target en una
  fuente real (`inspect_route`, `explore_map`/`product_map.json`, `dom_context.json`, código
  o captura del usuario). Las heurísticas genéricas de QA **no son evidencia**. Sin evidencia,
  inspeccioná, preguntá u **omití el paso y decilo en el reporte** — nunca inventes un dato.
- **`grounding: not_found` no se ejecuta:** corregí con evidencia real o eliminá el paso
  antes de `execute_run`.
- **`execute_run` con el `run_id` del dry-run:** no re-envíes casos con `run_cases`.
- **No inventes verificaciones que el usuario/spec no pidió.**

Este comando solo aporta el **encuadre SDD**: qué casos derivar (desde los GWT), dónde
guardarlos y cómo reportar el resultado en los artefactos del modelo.

---

## Paso 3 — Redactar los casos E2E con trazabilidad

Redactá los casos en formato ProGuide (`TEMPLATE.md` de la skill). **Dónde guardarlos:**
- Feature SDD-managed → `specs/[feature_id]/e2e/cases.md`.
- App sin SDD (ticket/doc/regresión) → junto a la app, en `proguide_tests/` (o donde el equipo
  versione sus casos). No fuerces la estructura de `specs/` si el repo no usa SDD.

Reglas:
- **Un criterio ⇒ uno o más casos.** Cada caso declara **de qué fuente sale**, en su encabezado
  o en una línea de referencia, para cerrar la trazabilidad `fuente → caso E2E → evidencia`:
  `US: US-N` (spec), `Ref: JIRA-1234` (ticket), `Ref: doc §X` (documentación), etc.
- Para UI usá `references/writing-rules.md` de la skill (DSL explícito, selectores estables,
  `Route`). Para API usá `references/api-cases.md` (casos estructurados `request`/`requests` +
  `assertions`, idempotencia).
- En features SDD, no cubras nada del `## Fuera de scope (v1)`.

---

## Paso 4 — Dry-run, ejecución e iteración

Seguí el flujo de la skill:

1. **Dry-run:** `create_run` (crea sin ejecutar) → revisá `executable_steps`,
   `confidence` y el `grounding`. Resolvé todo `not_found` antes de seguir.
2. **Ejecutar:** `execute_run` con el `run_id` del dry-run, `base_url` y
   `open_browser: true` (+ credenciales si la ruta es protegida).
3. **Iterar (calibración):** la primera pasada de un caso nuevo es calibración, no
   regresión. Clasificá cada caso:
   - **`passed`** → verde. Un `review_note` es informativo, no es falla.
   - **`needs_calibration`** → un selector/texto no resolvió en runtime. **No es un bug de
     la app**: recalibrá con evidencia o dejalo pendiente y decilo. No cuenta como hallazgo.
   - **`failed`** → el elemento se encontró pero la aserción no se cumplió. **Es un hallazgo
     real (bug):** reportalo, NO lo "arregles" relajando la verificación.

Regla de gobernanza: un `failed` por bug real de la app se reporta como hallazgo para que
lo decida el humano; nunca se enmascara aflojando el assert.

---

## Paso 5 — (Opcional) Congelar suite de regresión

Cuando los casos pasan estable, congelalos como suite versionable:
`proguide promote <run_id> --module [feature_id]` → deja la suite en
`proguide_tests/suite/[feature_id]/` (se commitea junto a la app). Regresiones futuras:
`proguide regress [feature_id]` (determinista, sin LLM ni pre-pass). Ante drift de UI,
recalibrá solo los casos afectados y volvé a `promote`.

---

## Paso 6 — Reporte y hook de métricas

Mostrá al usuario: estado de cada caso (con su `US-N`), el `run_url` del viewer, qué se
corrigió en cada iteración, y la lista de **hallazgos** (`failed`) separada de los
**pendientes de calibración** (`needs_calibration`).

**Hook de métricas (solo si la feature es SDD-managed):** si existe `specs/[feature_id]/`,
agregá al archivo `metrics/[feature_id]-metrics.md` este bloque. Si es una app sin SDD
(ticket/doc/regresión suelta), omitilo — no inventes estructura SDD donde no la hay.

```
## E2E — [timestamp]
- command_origin: sdd-e2e
- fuente: [spec | jira | doc | api | regresion]
- run_url: [url del viewer]
- casos_totales: [N]
- passed: [N]
- needs_calibration: [N]
- failed: [N]
- requisitos_cubiertos: [lista de refs con caso passed — US-N / JIRA-xxxx / doc §x]
- requisitos_sin_cobertura: [refs E2E-verificables sin caso passed]
- suite_congelada: [ruta de proguide_tests/suite/... o —]
```

> **Contrato con /sdd-review:** cuando la fuente es la spec SDD, el bloque `## E2E` es la
> evidencia que `/sdd-review` lee en su Parte 1b. Un requisito con caso `passed` cuenta como
> cubierto por E2E; un `failed` es un hallazgo bloqueante que el review debe reportar.

---

## Reglas

- Empezá directamente, sin pedir confirmación.
- No modifiqués código de la app para "hacer pasar" un caso: un `failed` real es un hallazgo,
  lo resuelve el humano (o `/sdd-fix`), no este comando.
- No inventes textos, selectores ni pasos (gate de evidencia de la skill). Si la fuente
  (ticket/doc) no define el resultado esperado de forma verificable, preguntá al QA.
- No te acoples a `spec.md`: la fuente puede ser doc, Jira, contrato de API o una suite de
  regresión existente. Aplicá el contrato negativo `## Fuera de scope (v1)` solo si la feature
  es SDD.
- Si un criterio no es E2E-verificable (juicio humano, subjetivo), mandalo a `/sdd-checklist`
  (en SDD) o reportalo como fuera del alcance automatizable.
- Los artefactos SDD (registro, métricas, DECISIONS) solo aplican a features SDD-managed. En QA
  de regresión o sobre apps sin SDD, no generes esa estructura.
- Cualquier desvío del brief detectado en una feature SDD se registra con `/sdd-log`.
