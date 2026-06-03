# sdd-generate — GDE flavor

Leé `input.md`.

## Jerarquía de contexto

Cargá en este orden:
1. **`gde-context.md`** (si existe) — fronteras, capacidades y restricciones HLD del dominio
2. **`existing-arch.md`** (si existe) — stack y source_root del codebase actual (modo brownfield)
3. **`input.md`** — brief validado

## Modo brownfield
Si existe `existing-arch.md`:
- `constitution.md` NO puede contradecir `existing-arch.md`; agrega principios sobre lo existente.
- `plan.md` usa el stack real y el `source_root` declarado — no scaffoldear un proyecto nuevo.
- `tasks.md` empieza con "validar entorno existente", no con scaffold.
- Marcá en cada tarea qué archivos toca (existentes) y cuáles crea (nuevos).

## Modo greenfield
Sin `existing-arch.md`, incluí en `plan.md` el comando exacto de scaffold:
`pnpm create vite@latest app -- --template react-ts`

---

Generá estos cuatro artefactos en orden:

### 1. constitution.md

Principios MUST/PROHIBITED del proyecto.

**Si existe `gde-context.md`, SIEMPRE incluir la sección obligatoria:**

```
## Fronteras del dominio [ID] — [Nombre]

MUST:
- Solo implementar capacidades declaradas en gde-context.md § "Capacidades internas"
- Exponer integraciones únicamente a través de los servicios declarados en gde-context.md § "Servicios que expone"
- Los datos de otros dominios se obtienen vía sus servicios — nunca por acceso directo

PROHIBITED:
- [Copiar las exclusiones de la tabla "Fronteras" de gde-context.md como PROs específicos]
- Almacenar datos cuyo owner sea otro dominio
- Lógica de negocio que pertenezca a otro dominio (ver tabla de fronteras)
```

Límite: 60 líneas.

### 2. spec.md

User stories con criterios Given/When/Then, uno por feature.
Actores GDE válidos: ciudadano (TAD), agente (EU), administrador funcional, sistema externo (D6).
Ninguna historia puede implementar capacidades de otro dominio — si el input las pide, marcalas
como "FUERA DE ALCANCE: pertenece a D[N]" y no las especificés.

Incluir SIEMPRE sección **Measurable Process Outcomes (DX)**:
- **DX-001**: El agente debe completar la implementación con menos de [X] ciclos de autocorrección.
- **DX-002**: Mantener la densidad de ambigüedad en 0.

Límite: 80 líneas.

### 3. plan.md

Stack técnico, estructura de carpetas, lista de componentes a crear.
Si hay `gde-context.md`, agregar sección:
```
## Restricciones HLD
- Plataforma objetivo: [del gde-context.md § "Restricciones arquitectónicas"]
- Capacidades transversales requeridas: [seguridad, auditoría, observabilidad del gde-context.md]
- Decisiones diferidas al LLD: [lista — no implementar estas]
```
Límite: 50 líneas.

### 4. tasks.md

Una tarea por componente o feature (T001, T002...).
Si hay `gde-context.md`, cada tarea que integre con otro dominio debe declarar:
`Integra con: [servicio del dominio externo] via [endpoint/evento]`

Límite: 40 líneas.

---

Todos los archivos deben ser cortos y directos. Sin placeholders.
Si el contenido no entra, priorizá claridad y avisá qué quedó afuera.
Empezá directamente, sin pedir confirmación.
Usá pnpm como gestor de paquetes.
