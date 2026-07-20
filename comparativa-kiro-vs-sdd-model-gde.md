# Kiro (AWS) vs `sdd-model-v1.1` — Análisis comparativo para GDE

*Analista técnico senior · Metodologías de desarrollo asistido por IA y governance de software público*
*Fecha del análisis: 16-jul-2026*

---

## Nota metodológica (fuentes y confiabilidad)

**`sdd-model-v1.1`** — Leído directamente del repo privado `pmillanmc/sdd-model-v1.1`, branch `main` (producción), vía MCP de GitHub. Archivos efectivamente leídos: `README.md`, `CLAUDE.md`, `scripts/sdd-audit.mjs`, `.claude/commands/*` (22 comandos), `.claude/commands/sdd-implement.md` y `sdd-review.md` en detalle, `.github/workflows/sdd-audit.yml`, y el árbol de `specs/`. Todo lo afirmado sobre SDD es **verificado sobre `main`**.

Aclaraciones sobre lo que **NO existe en `main`** (para no asumir):
- **`DECISIONS.md`** no está en el repo del modelo: es un artefacto *generado* por feature en los proyectos consumidores. En `main` solo viven plantillas (`specs/_registry/*.template.yaml`, `graph/domain.template.yaml`).
- **`jira-map.yaml`** tampoco existe como archivo real en `main`; se genera por feature (`/sdd-generate` Paso 5). Confirmado por `README` y `sdd-review.md`, no por un archivo presente.
- **`run-state.yaml`** (el cursor de orquestación multi-agente) **no está mergeado a `main`**. Es un diseño de branch (Opción A file-state mediated). Cualquier afirmación sobre orquestación multi-agente por `run-state.yaml` es *diseño*, no producción.
- `specs/` en `main` solo contiene `_registry/` (plantillas). No hay features reales versionadas en el repo del modelo.

**Kiro** — Investigado con navegador en vivo (16-jul-2026). Fuentes citadas:
- Precios y créditos: `https://kiro.dev/pricing/` — **verificado**.
- Modelo de specs: `https://kiro.dev/docs/specs/` (actualizada 25-jun-2026) — **verificado**.
- Steering: `https://kiro.dev/docs/steering/` — **verificado**.
- Privacidad y seguridad (Autopilot vs Supervised, PrivateLink, IAM, compliance): `https://kiro.dev/docs/privacy-and-security/` — **verificado**.
- Kiro está en **IDE 1.0** (fuera de preview) y tiene oferta en **AWS GovCloud (US)** — verificado en pricing y navegación de docs.

Marcas usadas abajo: **[V]** = verificado en fuente citada · **[I]** = inferencia del analista (no confirmada en fuente directa).

---

## 1. Tabla comparativa resumen por eje

| Eje | Kiro (AWS) | `sdd-model-v1.1` | Ganador / Observación |
|---|---|---|---|
| **1. Modelo conceptual y flujo** | 3 fases (Requirements → Design → Tasks) sobre `.kiro/specs/`; modos Spec vs Vibe; Feature/Bugfix specs; Quick Plan sin gates **[V]** | 8 fases (scan→refine→generate→validate→implement→checklist→review→health) + Jira + fix + handoff; 22 comandos de texto plano **[V]** | **SDD** en granularidad y cobertura del ciclo; **Kiro** en simplicidad y onboarding |
| **2. Trazabilidad** | requirement→design→task en 3 `.md` + task status en IDE; grafo de dependencias entre tasks **[V]**. Dependiente de LLM; sin firma **[I]** | requerimiento→spec (US-N)→task→código→review, más `features.yaml`, `jira-map.yaml`, `DECISIONS.md`, `metrics/*`; auditado por script sin IA **[V]** | **SDD**: trazabilidad más rica y **verificada deterministamente** en CI |
| **3. Gobernanza y gates** | Gates de aprobación humana entre fases (Requirements-First/Design-First); Supervised mode = review de diff. Kiro aclara: "review workflow, **no** un control de seguridad" **[V]**. Sin auditor de proceso en CI **[I]** | Gate humano por convención de prompt ("avisá, pará, esperá") **+** auditor determinista `sdd-audit.mjs` en GitHub Action que bloquea el merge **[V]** | **SDD**: único con enforcement determinista del *proceso* en CI. (Ambos: el artefacto de aprobación lo escribe el LLM) |
| **4. Extensibilidad / integración** | IDE + CLI + Web + Mobile + IDEs ACP; MCP; hooks; steering; custom agents; CI/CD **[V]** | Agnóstico de IDE (texto plano `.md`); Claude Code/Cursor/Copilot/Windsurf; MCP Atlassian + mcp-proguide; Jira nativo; multi-repo por sparse-checkout/submódulo **[V]** | **Empate con matices**: Kiro más producto integrado; SDD más portable y sin plataforma propietaria |
| **5. Costo operativo / lock-in** | Créditos: Free 50 / Pro $20·1000 / Pro+ $40·2000 / Pro Max $100·5000 / Power $200·10000; add-on $0.04/crédito; **no roll-over mensual**; procesamiento en la nube de AWS **[V]**. Lock-in AWS alto **[I]** | Tokens de tu propia suscripción Claude/API; sin plataforma intermedia; ahorro de tokens por routing con `graph/domain.yaml`; medición propia (DX_MET_006) **[V]** | **SDD** en reproducibilidad y ausencia de lock-in; **Kiro** en previsibilidad de costo por crédito |
| **6. Curva de aprendizaje / madurez** | IDE 1.0, docs pulidas, changelog, comunidad, respaldo AWS **[V]** | Docs internas fuertes (README+CLAUDE), pero proyecto de un autor, sin comunidad externa, versionado propio (v1.1) **[V]** | **Kiro** en madurez de producto y soporte; **SDD** en control total y ajuste a medida |
| **7. Fit para GDE** | GovCloud (US) + compliance AWS fuerte, pero es **US-gov**, no aplica a gobierno argentino; datos por AWS commercial; Windows OK **[V/I]** | Brownfield nativo (`/sdd-scan`, `existing-arch.md`, grafo), audit determinista, Windows/PowerShell/Cursor probado, stack-agnóstico Java/Oracle/OpenShift **[V]** | **SDD** para requisitos de auditoría y brownfield de sector público argentino |

---

## 2. Análisis por eje

### Eje 1 — Modelo conceptual y flujo de trabajo

**Kiro [V].** Kiro formaliza el desarrollo en *specs* dentro de `.kiro/specs/<feature>/` con tres artefactos: `requirements.md` (user stories + criterios de aceptación en notación estructurada tipo EARS), `design.md` (arquitectura, diagramas de secuencia, manejo de errores) y `tasks.md` (tareas discretas y trackeables). El flujo es de **tres fases** (Requirements/Bug Analysis → Design → Tasks) con dos variantes para features (Requirements-First y Design-First) y un **Quick Plan** que autogenera los tres artefactos *sin gates de aprobación*. Existen *Bugfix Specs* específicos y un modo *Vibe* para exploración sin estructura. La ejecución de tareas soporta paralelismo automático: Kiro arma un grafo de dependencias y corre olas (waves) de tareas independientes en paralelo.

**SDD [V].** El modelo cubre un ciclo mucho más largo y explícito: `/sdd-scan` (Fase 0, brownfield) → `/sdd-refine` (grilling dinámico → `input.md`) → `/sdd-generate` (4 artefactos: `constitution.md`, `spec.md`, `plan.md`, `tasks.md` + `jira-map.yaml`) → `/sdd-validate` (quality gate) → `/sdd-implement` (TDD Red-Green-Refactor) → `/sdd-checklist` (criterios manuales) → `/sdd-review` (gate final en 3 pasadas) → `/sdd-health` (auditoría por sprint). Suma comandos transversales (`/sdd-handoff`, `/sdd-fix`, `/sdd-log`, `/sdd-task`), telemetría (`/sdd-metrics`, `/sdd-metrics-summary`) e integración Jira (`/sdd-jira-*`). Los 22 comandos son *markdown de texto plano*: el prompt **es** el comando.

**Fortalezas/debilidades.** Kiro gana en simplicidad conceptual y en la UX de ejecución (paralelismo automático, status en vivo, botones). SDD gana en cobertura del ciclo real de un equipo: incorpora explícitamente discovery brownfield, un *contrato negativo* (`## Fuera de scope (v1)` que `/sdd-implement` no puede violar), registro de decisiones tipo ADR, colisiones entre features, y salud por sprint — cosas que Kiro deja al criterio del equipo. La debilidad de SDD es que esa riqueza tiene costo cognitivo y disciplina de proceso; la de Kiro es que su flujo corto puede quedar corto para governance de sector público.

### Eje 2 — Trazabilidad

**Kiro [V/I].** Vincula requirement → design → task dentro de la carpeta del spec, con status de tareas actualizado en tiempo real en el IDE. Es trazabilidad *legible y navegable*, pero **[I]** los artefactos son markdown generados por LLM, sin identificadores de trazabilidad obligatorios entre criterio de aceptación y task, sin firma ni verificación externa de que el vínculo se mantenga. La persistencia es el filesystem del workspace.

**SDD [V].** La cadena es más completa y **verificada por código**: `spec.md` obliga user stories `US-N`; `tasks.md` exige que *cada tarea* referencie su `US-N` (el auditor lo chequea con regex, `CHECK 6`); `jira-map.yaml` mantiene `US-N → task → ticket` como *única* fuente de vínculo con Jira; `DECISIONS.md` registra cada desvío del brief tipo ADR; `metrics/[feature_id]-metrics.md` guarda evidencia por fase; `features.yaml` indexa status/owner/sprint/`touches`. Lo decisivo: **`pnpm audit:sdd` verifica la consistencia de esta cadena sin IA** (registro↔specs, huérfanos, gates de cierre, grafo↔filesystem). Es *determinístico*.

**Veredicto.** SDD tiene trazabilidad estructuralmente superior y, sobre todo, la única de las dos que es **auditable deterministamente**. Matiz honesto: la evidencia de cierre (`resultado: APROBADO` en `metrics/`) la escribe el propio agente al correr `/sdd-review` — el script verifica que *exista y sea consistente*, no que un humano haya firmado (ver Eje 3).

### Eje 3 — Gobernanza y gates (el eje más decisivo para GDE)

**Kiro [V].** Las variantes Requirements-First/Design-First introducen **gates de aprobación humana entre fases** (el usuario aprueba antes de avanzar). El *Supervised mode* muestra un diff para aceptar/rechazar cambios antes de aplicarlos. Pero Kiro es explícito en su doc de seguridad: *"Supervised mode es un workflow de code review, **no** un control de seguridad… no funciona como sandbox, límite de aislamiento ni control de acceso"* (`kiro.dev/docs/privacy-and-security`). Además, *Quick Plan* saltea los gates por diseño. **[I]** No hay un auditor de *proceso* del lado de CI que bloquee un merge si un spec se cerró sin pasar por sus fases: el enforcement vive dentro del IDE, a nivel de sesión.

**SDD [V].** Defensa en profundidad de dos capas realmente presentes en `main`:
1. **Convención de prompt** — cada comando abre con un "Gate de prerequisitos (no negociable)": `/sdd-implement` verifica los 4 artefactos, el bloque `## Validate` en métricas, status `OPEN` y colisiones, y **PARÁ** si falta algo; saltarlo requiere confirmación humana explícita **+** entrada en `DECISIONS.md`. `/sdd-review` no cierra si el resultado no es `APROBADO`.
2. **Auditor determinista en CI** — `scripts/sdd-audit.mjs` corre como GitHub Action en cada push/PR a `main` (`.github/workflows/sdd-audit.yml`). Si una feature figura `CLOSED` sin `metrics/<id>-metrics.md` conteniendo `resultado:.*APROBADO`, es **FAIL** y no se mergea. Es "el linter del proceso: el cumplimiento no depende de buena voluntad".

**¿Se puede saltear un gate?** En ambos, sí, pero distinto. En Kiro, con Quick Plan o Autopilot el humano decide reducir fricción y no queda rastro de proceso en CI **[I]**. En SDD, saltar un gate exige confirmación humana **+** registro en `DECISIONS.md`, y el auditor detecta inconsistencias de cierre.

**Límite honesto compartido.** En los dos, el *artefacto* de aprobación lo produce el LLM (Kiro genera el diff/estado; SDD escribe `resultado: APROBADO`). Ninguno, **en producción**, prueba criptográficamente que un humano aprobó. SDD *diseñó* artefactos de aprobación firmados con SHA256 (defense-in-depth), pero eso vive en una branch de orquestación **no mergeada a `main`** — hoy no es enforcement real. Para GDE, esta es la brecha a cerrar (ver Preguntas abiertas).

**Veredicto.** SDD es el único de los dos con enforcement determinista del proceso en CI. Para gobernanza de sector público con requisito de auditoría, es una ventaja de fondo.

### Eje 4 — Extensibilidad e integración

**Kiro [V].** Producto integrado: Kiro IDE, CLI, Web (preview), Mobile e IDEs compatibles con ACP; soporte MCP; *hooks* de agente (que consumen créditos); *steering* (`.kiro/steering/`, con scope workspace/global y *team steering* distribuible por MDM/Group Policy); *custom agents*; y uso en automatización CI/CD. Los foundational steering (`product.md`, `tech.md`, `structure.md`) son el equivalente a la `constitution.md` + `plan.md` + `existing-arch.md` de SDD.

**SDD [V].** Es *agnóstico de IDE por diseño*: los comandos son markdown que funcionan en Claude Code (nativo), Cursor (`@archivo`), Copilot y Windsurf (copiar/pegar). Integra Jira vía Atlassian MCP con fallback a REST API (registrado obligatoriamente por `/sdd-log`), y un `mcp-proguide` propio para governance local. Multi-repo se resuelve por sparse-checkout / submódulo. El skill `coding-standards` usa progressive disclosure para no inflar contexto.

**Veredicto.** Empate con perfiles distintos. Kiro ofrece una superficie de integración de producto (Web, Mobile, ACP, team steering por MDM) que SDD no tiene. SDD ofrece portabilidad total y cero dependencia de una plataforma propietaria — cualquier agente que acepte un prompt lo corre. Para un entorno multi-repo interconectado y multi-IDE como el de tu equipo, la portabilidad de SDD encaja mejor; para estandarizar herramienta y distribuir políticas por MDM a muchos devs, Kiro tiene ventaja operativa.

### Eje 5 — Costo operativo, lock-in y reproducibilidad

**Kiro [V].** Modelo de **créditos**: Free ($0, 50 créditos, Sonnet 4.6 + open-weight con rate limits), Pro ($20, 1000), Pro+ ($40, 2000), Pro Max ($100, 5000), Power ($200, 10000). Add-on a $0.04/crédito (roll-over 12 meses); **los créditos mensuales de plan NO se acumulan**. Un crédito es "una unidad de trabajo": correr un spec task o un hook consume créditos, y usar Sonnet 4.6 directo cuesta ~1.3× lo que el modo Auto. El procesamiento ocurre en la nube de AWS (IDE, CLI o Web consumen del mismo pool). **[I]** Esto implica lock-in alto: la unidad de costo, el ruteo de modelos (Auto) y el backend son de AWS; migrar afuera pierde el modelo de créditos y la infra.

**SDD [V].** No hay plataforma intermedia: consume **tokens de tu propia suscripción/API de Claude**. Reduce costo con routing por `graph/domain.yaml` (leer solo los archivos del dominio afectado, no escanear el repo entero) y mide su propio consumo con la telemetría DX (DX_MET_006, medición vía `ccusage`). Reproducibilidad alta: los artefactos son texto versionado y el auditor es código sin IA (0 tokens, salida determinista, exit code 0/1).

**Veredicto.** Para tus prioridades (costo en tokens + reproducibilidad + evitar lock-in), SDD es claramente superior: costo trazable a tu propia cuenta, sin intermediario propietario, y verificación de proceso a costo cero. Kiro ofrece *previsibilidad* (presupuesto fijo por crédito/mes) a cambio de lock-in AWS y de que el consumo real depende del ruteo opaco de "Auto".

### Eje 6 — Curva de aprendizaje y madurez

**Kiro [V].** IDE **1.0** (fuera de preview), documentación pulida y navegable, changelog público, comunidad (Discord, ambassadors, showcase), y respaldo de AWS con roadmap y soporte. Curva de entrada baja: botones, generación de foundational steering, Quick Plan.

**SDD [V].** Documentación interna sólida y honesta (`README` de 20 KB + `CLAUDE.md` de 13 KB, con notas de diseño y troubleshooting por IDE), y un smoke test propio (`/sdd-test`, 22 checkpoints). Pero es un proyecto de **un autor**, sin comunidad externa ni soporte de terceros; el versionado (v1.1) y la evolución dependen del equipo. La curva es más alta por la cantidad de comandos y disciplina de proceso.

**Veredicto.** Kiro gana en madurez de producto, soporte y estabilidad institucional. SDD gana en control total, ausencia de caja negra y capacidad de ajustar cualquier regla a medida — con el riesgo de bus-factor 1.

### Eje 7 — Fit específico para GDE

**Contexto GDE:** brownfield, sector público argentino, requisitos de auditoría, stack Java 25 / Helidon / Oracle 19c / Angular 21 / OpenShift, Windows/PowerShell + Cursor + Claude Code, multi-repo.

**Kiro [V/I].** A favor: postura de compliance fuerte (programas de compliance AWS, IAM, VPC PrivateLink, data perimeters) y **disponibilidad en AWS GovCloud (US)**. Pero atención: GovCloud es **US-gov, no aplica a gobierno argentino** — para GDE, Kiro procesaría vía AWS *commercial regions*, lo que abre una pregunta de **residencia/soberanía de datos** no trivial para una plataforma documental estatal **[I]**. El stack Java/Oracle/OpenShift es soportable (Kiro es stack-agnóstico vía steering), y Windows está soportado. El modelo brownfield de Kiro pasa por steering (`structure.md`) generado, menos formal que un scan+grafo.

**SDD [V].** Diseñado alrededor de tus prioridades: brownfield nativo (`/sdd-scan` → `existing-arch.md` + `graph/domain.yaml`, "patrones inquebrantables" no negociables), auditoría determinista en CI (clave para requisitos de trazabilidad estatal), telemetría de costo, y ya probado en tu entorno real (Windows/PowerShell/Cursor, multi-repo por sparse-checkout, y de hecho ya aplicado al diseño de la reingeniería GDE). Es stack-agnóstico: no impone gestor de paquetes ni arquitectura, respeta `existing-arch.md`. El procesamiento ocurre donde vos elijas (tu cuenta Claude/API), sin backend propietario intermediando datos del Estado.

**Veredicto.** Para GDE, SDD encaja mejor en los tres criterios que más pesan (auditoría determinista, reproducibilidad/soberanía de datos, brownfield). Kiro aporta madurez de producto y controles de infra AWS, pero su valor de GovCloud no traslada a Argentina y agrega una pregunta de residencia de datos.

---

## 3. Riesgos y trade-offs por opción

### Adoptar Kiro
- **Lock-in AWS** [I]: unidad de costo (créditos), ruteo de modelos y backend son propietarios; salida costosa.
- **Residencia/soberanía de datos** [I]: sin GovCloud aplicable a Argentina, el código y specs de una plataforma estatal se procesarían en AWS commercial. Riesgo regulatorio/político para GDE.
- **Gate ≠ control** [V]: el propio Kiro aclara que Supervised no es control de seguridad; Quick Plan/Autopilot saltean gates. No hay auditor de proceso en CI.
- **Costo variable opaco** [V]: "Auto" rutea a modelos no explícitos; el consumo real de créditos por spec task es difícil de presupuestar con precisión.
- **Trade-off positivo**: madurez, soporte, UX, paralelismo de tasks, distribución de políticas por MDM.

### Adoptar `sdd-model-v1.1`
- **Bus-factor 1** [V]: autor único, sin comunidad ni soporte externo; la continuidad depende del equipo.
- **Enforcement de gate incompleto en `main`** [V]: la aprobación la escribe el LLM; los artefactos firmados SHA256 son diseño en branch, no producción. Para auditoría estatal fuerte, hay que cerrarlo.
- **Disciplina de proceso** [V]: 22 comandos y convenciones exigen adopción y training; sin disciplina, el proceso se erosiona (aunque el auditor mitiga).
- **Sin UX de producto** [V]: no hay IDE, dashboards nativos (más allá del Kanban HTML), ni ejecución paralela de tasks *out of the box*.
- **Trade-off positivo**: reproducibilidad, cero lock-in, auditoría determinista, control total, ya probado en GDE/Windows.

### Híbrido
- **Riesgo de doble fuente de verdad** [I]: dos modelos de artefactos (`.kiro/specs/` vs `specs/`) pueden divergir; hay que definir cuál es autoritativo.
- **Riesgo de costo duplicado** [V]: pagar créditos Kiro *y* tokens Claude propios.
- **Trade-off positivo**: usar Kiro como IDE/ejecución y SDD como capa de governance/auditoría en CI puede combinar UX + enforcement — si se define bien el límite.

---

## 4. Recomendación final — tres escenarios

### Escenario A — Adoptar Kiro (preferible si…)
- GDE prioriza **time-to-adoption y soporte institucional** sobre control fino de proceso.
- El equipo crece rápido con devs no técnicos y se necesita **estandarizar herramienta** y distribuir políticas por MDM/Group Policy.
- Se resuelve la pregunta de **residencia de datos** (acuerdo legal con AWS, o el organismo acepta procesamiento en regiones commercial).
- Se acepta el **lock-in AWS** y el modelo de créditos como costo previsible.
> No recomendado como opción principal para GDE *hoy* por la brecha de soberanía de datos y la ausencia de auditor de proceso en CI.

### Escenario B — Adoptar `sdd-model-v1.1` (recomendado como base)
- GDE prioriza **auditoría determinista, reproducibilidad y soberanía de datos** — que es tu caso declarado.
- El entorno es **brownfield** y multi-repo sobre Windows/Cursor/Claude Code — ya probado.
- Condiciones para que sea sólido en producción estatal:
  1. **Cerrar el gate de aprobación humana**: promover a `main` los artefactos de aprobación firmados (SHA256) que hoy son diseño de branch, para que "APROBADO" implique una firma humana verificable y no solo texto escrito por el LLM.
  2. **Mitigar bus-factor**: documentar, versionar y sumar al menos un segundo mantenedor.
  3. Extender el auditor a chequear los gates específicos de GDE (Java/Oracle/OpenShift) si aplica.
> **Es la recomendación primaria.** Encaja con las cinco prioridades del proyecto.

### Escenario C — Híbrido (preferible si el equipo quiere UX de Kiro sin perder governance)
- **Kiro como IDE y motor de ejecución** (specs, paralelismo de tasks, hooks, steering para onboarding) **+ SDD como capa de governance y auditoría en CI**.
- Regla de límite: los artefactos SDD (`features.yaml`, `DECISIONS.md`, `metrics/`, `jira-map.yaml`) y `pnpm audit:sdd` son la **fuente de verdad de proceso**; los `.kiro/specs/` son artefactos de trabajo que se mapean a la spec SDD antes del cierre.
- Preferible si se valida que el mapeo `.kiro/specs/*` → `specs/*` puede automatizarse sin doble mantenimiento, y si el presupuesto tolera créditos Kiro + tokens propios.
> Viable como transición, pero exige definir el mapeo autoritativo para no crear doble fuente de verdad.

**Síntesis:** para GDE, empezar por **Escenario B** (SDD como base) cerrando el gate firmado; evaluar **Escenario C** solo si el equipo demanda la UX de Kiro y se resuelve el mapeo. Kiro puro (A) queda supeditado a resolver soberanía de datos.

---

## 5. Preguntas abiertas / información que falta para cerrar la decisión

**Sobre GDE / requisitos:**
1. ¿Qué exige exactamente la normativa de auditoría del sector público argentino para GDE? ¿Basta trazabilidad en repo, o se requiere firma humana verificable (no repudio) en cada gate?
2. ¿Hay restricción legal de **residencia/soberanía de datos** que impida procesar código/specs de GDE en AWS commercial (fuera del país)?
3. ¿Cuántos devs y qué perfil van a usar el modelo? (define el peso de "onboarding" vs "control fino").

**Sobre SDD:**
4. ¿Cuál es el estado real de los **artefactos de aprobación firmados SHA256**? ¿Cuándo/si se mergean a `main`? (Hoy no están en producción — es la brecha de gobernanza a cerrar).
5. ¿El auditor debe cubrir gates específicos de GDE (p. ej., cobertura Oracle/OpenShift, contratos de messaging/cache que aparecen en el diseño de multi-tenancy)?
6. Plan de mitigación de **bus-factor**: ¿segundo mantenedor, tests del propio modelo más allá de `/sdd-test`?

**Sobre Kiro (a verificar antes de decidir):**
7. ¿Kiro ofrece un **audit log / export de aprobaciones** consumible por CI o por un sistema de compliance externo? (No lo confirmé en las páginas leídas).
8. ¿Los `.kiro/specs/` incluyen IDs de trazabilidad obligatorios criterio↔task, o el vínculo es solo narrativo? (La doc no lo especifica).
9. ¿Cuál es el costo *real* en créditos de una feature GDE típica bajo "Auto"? (Presupuesto difícil de estimar sin piloto).
10. ¿Kiro soporta CI/CD sobre **OpenShift** y ejecución no interactiva reproducible para pipelines estatales?

**Sobre el híbrido:**
11. ¿Es automatizable el mapeo `.kiro/specs/*` → artefactos SDD sin doble mantenimiento? Un piloto de 1 feature GDE lo respondería.
