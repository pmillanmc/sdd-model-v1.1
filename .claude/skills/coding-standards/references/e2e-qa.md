# QA E2E con ProGuide

Fuente principal del "cómo": la skill `qa-test-cases` de ProGuide (SKILL.md + TEMPLATE.md +
references) y el comando `.claude/commands/sdd-e2e.md`. Esta referencia solo fija los **roles**
dentro del modelo SDD para que el agente no confunda las tres capas de verificación.

## Bootstrap de la herramienta

El QA solo ejecuta `/sdd-e2e`. En el **Paso 0** del comando: `proguide --version` → si falta,
**el agente NO lo instala**: le pide al usuario que lo instale a mano desde el repositorio
(https://github.com/molivera-proguide/proguide-test), bajando el **último release** con
`gh release download --repo molivera-proguide/proguide-test --pattern "*.tgz"` +
`npm install -g ./proguide-test-*.tgz`, y espera hasta que confirme. Con la CLI ya disponible:
`proguide doctor --json` para el entorno y confirmar el MCP. **Después de toda instalación o
actualización nueva de la CLI, correr `proguide update skills`** — es el paso que carga la skill
`qa-test-cases` en Claude Code, en el scope global de usuario (`~/.claude/skills`), visible en
cualquier workspace. Recién ahí se pide el contexto (feature_id, base_url, credenciales,
criterios a cubrir) y se arman los casos.

## La fuente no es solo la spec

`/sdd-e2e` es **fuente-agnóstico**. QA parte de lo que tenga: `spec.md` (cuando la feature es
SDD), documentación funcional, un ticket de Jira/issue donde vive la info, un contrato de API,
o —en **regresión**— una suite ya congelada que solo se re-ejecuta. Cada caso referencia su
origen (`US-N`, `JIRA-xxxx`, `doc §x`). Los artefactos SDD (registro, `## E2E` en métricas,
`## Fuera de scope`, `/sdd-review`) aplican **solo cuando la feature es SDD-managed**; en apps
sin SDD o regresión suelta no se fuerza esa estructura.

## Tres capas de verificación (no se pisan)

| Capa | Herramienta | Verifica | Cuándo |
|---|---|---|---|
| Unit / integración (TDD) | `pnpm test` (o el gestor del proyecto) | lógica interna, contratos de módulo | `/sdd-implement` |
| **Funcional E2E** | **ProGuide (`proguide-test` MCP + `qa-test-cases`)** | **flujos reales de UI/API contra la app corriendo** | **`/sdd-e2e`** |
| Manual / juicio humano | checklist | UX, accesibilidad, negocio subjetivo | `/sdd-checklist` |

Regla: un criterio `Given/When/Then` de `spec.md` que describe un **flujo** contra la app se
verifica con `/sdd-e2e`; uno de lógica interna, con tests unitarios; uno de juicio humano, con
el checklist. No dupliques el mismo criterio en las tres capas.

## Gates bloqueantes de ProGuide (heredados)

Al derivar/ejecutar casos E2E, respetá los gates de la skill `qa-test-cases`:

1. **Evidencia del target:** nada de `click`/`fill`/`expect` sin haber visto el target en una
   fuente real (`inspect_route`, `explore_map`/`product_map.json`, `dom_context.json`, código
   o captura). Las heurísticas de QA no son evidencia. Sin evidencia: inspeccioná, preguntá u
   omití el paso y decilo — nunca inventes.
2. **`grounding: not_found` no se ejecuta.**
3. **`execute_run` con el `run_id` del dry-run** (no re-enviar casos con `run_cases`).
4. **No inventar verificaciones** que el spec/usuario no pidió.

## Clasificación de resultados (no la relajes)

- `passed` → criterio cubierto por E2E.
- `needs_calibration` → selector/texto no resolvió en runtime. **No es bug**: recalibrar o
  dejar pendiente.
- `failed` → aserción de comportamiento no cumplida con el elemento presente. **Es un hallazgo
  real**: reportar, nunca "arreglar" aflojando el assert ni tocando la app para pasar el caso.

## Trazabilidad y artefactos

- Casos E2E: `specs/[feature_id]/e2e/cases.md`, cada caso referencia su `US-N`.
- Suite congelada de regresión: `proguide_tests/suite/[feature_id]/` (versionada con la app).
- Evidencia en métricas: bloque `## E2E` en `metrics/[feature_id]-metrics.md`, que
  `/sdd-review` lee en su Parte 1b.
- Sumá `specs/[feature_id]/e2e/` y `proguide_tests/suite/[feature_id]/` a los `touches` de la
  feature en el registro (para colisiones).
