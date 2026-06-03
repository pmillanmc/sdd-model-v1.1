# /gde-scan — Ingesta de dominio GDE

Este comando se corre UNA VEZ al iniciar el desarrollo de un dominio GDE.
Lee el documento funcional del dominio (D-N) y las secciones relevantes del HLD,
y genera `gde-context.md` en la raíz del proyecto.

Si el proyecto ya tiene código, corré `/sdd-scan` PRIMERO para generar `existing-arch.md`,
y luego este comando para generar `gde-context.md`. Ambos coexisten.

## Reglas de gobernanza

- Solo lectura — nunca modifiques los documentos fuente ni el código.
- Doble confirmación humana antes de guardar `gde-context.md`.
- Si hay contradicciones entre D-N y el HLD, reportalas; no las resuelvas.
- El encabezado repetido "D4 – Gestión del Expediente" en documentos D5 es un error conocido
  de template — ignorarlo, usar el contenido real del documento.

## Proceso

### Paso 1 — Localizar documentos fuente
Buscá en el proyecto:
- Documento de dominio: `D[N]_documento.pdf` o `.md` (el documento funcional del dominio a implementar)
- HLD: `HLD_*.pdf` o `.md` (documento de arquitectura de alto nivel)

Si no encontrás alguno, preguntá al humano la ubicación antes de continuar.

### Paso 2 — Extraer del documento de dominio
Leé el D-N y extraé:
1. ID y nombre del dominio (ej. D5 — Formularios, Workflow y Reglas)
2. Pregunta clasificatoria (¿qué pregunta determina si algo pertenece a este dominio?)
3. Definición funcional (qué hace el dominio en una oración)
4. Lo que el dominio NO es (tabla de exclusiones explícitas del documento)
5. Capacidades internas (motores, subsistemas propios)
6. Servicios que expone al ecosistema (con sus consumidores declarados)
7. Datos propios (entidades de las que el dominio es dueño exclusivo)
8. Backlog de mejoras con prioridades

### Paso 3 — Extraer del HLD (solo secciones relevantes)
Del HLD leé ÚNICAMENTE:
- Sección de dominios funcionales (la que describe los 7 macrodominios)
- Sección de orquestación de procesos y reglas (si aplica al dominio)
- Sección de principios rectores
- Sección de restricciones preliminares

NO leer el HLD completo. Son 60+ páginas — solo las secciones listadas arriba.

Extraé:
1. Restricciones de plataforma (OpenShift, Oracle, etc.)
2. Principios arquitectónicos no negociables
3. Capacidades transversales que aplican (seguridad, observabilidad, auditoría)
4. Qué queda diferido al LLD (para no asumir decisiones no tomadas)

### Paso 4 — Clasificación y grilling
Para cada dimensión, clasificá:
- **DETECTADO** — surge claro de los documentos
- **AMBIGUO** — hay señales contradictorias o información incompleta
- **NO DETECTABLE** — requiere confirmar con el equipo

Mostrá el reporte y hacé UNA pregunta por vez para cada ⚠️ y ❓.

### Paso 5 — Primera confirmación
Mostrá el contenido propuesto de `gde-context.md` completo y preguntá:
"¿Refleja esto el dominio tal como fue acordado en las mesas de trabajo? ¿Falta o sobra algo?"

### Paso 6 — Segunda confirmación y guardado
Preguntá: "¿Confirmás que puedo guardar `gde-context.md` en la raíz?"
Solo si responde sí, escribilo.

## Formato obligatorio del archivo

```markdown
# gde-context.md — Contexto de dominio GDE

> Generado por /gde-scan el [FECHA]
> Dominio: D[N] — [Nombre]
> Fuente: [nombre del archivo D-N] + [nombre del HLD]
> Este archivo es DESCRIPTIVO. Las restricciones son no negociables
> salvo decisión registrada en DECISIONS.md.

## Identidad del dominio

- **ID**: D[N]
- **Nombre**: [Nombre completo]
- **Pregunta clasificatoria**: [Texto exacto del documento]
- **Definición en una oración**: [Qué hace el dominio]

## Fronteras (lo que este dominio NO es)

| No es | Por qué | Dónde corresponde |
|---|---|---|
| [exclusión 1] | [razón] | [dominio] |

## Capacidades internas

- [Capacidad A]: [descripción breve]
- [Capacidad B]: [descripción breve]

## Servicios que expone

| Servicio | Qué hace | Quién lo consume |
|---|---|---|
| [servicio] | [descripción] | [D1, D3, D4...] |

## Datos propios (owner exclusivo)

- [Entidad A]: [descripción]
- [Entidad B]: [descripción]

## Restricciones arquitectónicas (HLD)

- Plataforma: [OpenShift/Oracle/etc.]
- Principios no negociables: [lista]
- Capacidades transversales obligatorias: [seguridad, auditoría, observabilidad...]
- Decisiones diferidas al LLD: [lista — no asumir estas]

## Backlog de mejoras

| Descripción | Capacidad | Prioridad |
|---|---|---|
| [item] | [capacidad interna] | Alta/Media/Baja |
```

## Límite
`gde-context.md` debe ser ≤ 150 líneas. Si no entra, priorizá las secciones
Identidad + Fronteras + Capacidades + Restricciones HLD. Dejá Backlog en segunda pasada.

## Salida
Al terminar: "✅ gde-context.md generado. El proyecto está listo para `/sdd-refine`."
