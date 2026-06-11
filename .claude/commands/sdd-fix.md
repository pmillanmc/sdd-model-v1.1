# /sdd-fix — Ruta corta para bugs y hotfixes

Ruta liviana para cambios chicos (bugs, hotfixes, ajustes menores) que NO justifican
el ciclo completo refine → generate → validate → implement → review.
Mantiene la gobernanza mínima: registro, colisiones y trazabilidad — sin burocracia.

## Cuándo usar esta ruta (criterio de elegibilidad)

Antes de empezar, evaluá el pedido contra estos límites. Si CUALQUIERA se supera,
avisá: "Esto excede un fix — corresponde el ciclo completo (/sdd-refine)" y pará.

- Toca ≤ 3 archivos de producción
- No agrega entidades, rutas, ni dependencias nuevas
- No cambia contratos públicos (APIs, tipos exportados, esquemas de storage)
- No contradice `constitution.md` ni `existing-arch.md` de ninguna feature

## Proceso

### Paso 1 — Identificar alcance vía grafo
Consultá `graph/domain.yaml` para identificar el dominio afectado y leé SOLO
los archivos listados en `files`. No escanees el codebase.

### Paso 2 — Chequeo de colisiones (obligatorio en equipo)
Leé `specs/_registry/features.yaml`. Para cada feature con `status: OPEN`,
intersectá sus `touches` con los archivos que este fix va a tocar.

Si hay intersección:
```
⚠️ COLISIÓN: este fix toca [archivo], que está siendo trabajado por
la feature [id] (owner: [nombre], sprint: [sprint]).
```
Preguntá al humano: "¿Coordinaste con [owner]? ¿Procedo igual, espero, o lo escalo?"
NO procedas sin respuesta explícita.

### Paso 3 — Registro previo
Agregá la entrada del fix a `specs/_registry/features.yaml`:

```yaml
- id: fix-[NNN]-[slug-corto]
  type: fix
  status: OPEN
  domain: [del grafo]
  owner: [preguntá si no es deducible]
  sprint: [sprint activo o null]
  created: [fecha ISO]
  touches: [archivos exactos]
  decisions: []
```

### Paso 4 — Test primero, fix después (TDD mínimo)
1. Escribí un test que reproduzca el bug (debe fallar)
2. Aplicá el fix mínimo que lo haga pasar
3. Corré la suite completa del dominio afectado — no solo el test nuevo

### Paso 5 — Cierre
1. Actualizá la entrada del registro: `status: CLOSED`, `closed: [fecha ISO]`
2. Si el fix revela un problema de spec (la spec decía otra cosa, o no decía nada):
   avisá: "Este fix desvía/completa la spec de [feature] — corré /sdd-log para registrarlo"
3. Si el fix tocó archivos no listados en `graph/domain.yaml`, actualizá el grafo o avisá
4. Agregá a `metrics/fix-[NNN]-metrics.md`:

```
## Fix — [timestamp]
- command_origin: sdd-fix
- archivos_tocados: [N]
- test_reproductor: [ruta]
- colisiones_detectadas: [N]
```

## Reglas

- NUNCA uses esta ruta para features encubiertas. Si el "fix" crece a mitad de
  camino y supera los límites de elegibilidad, pará y avisá.
- El test reproductor es obligatorio — sin test, no hay fix.
- En equipo: el chequeo de colisiones del Paso 2 nunca se saltea.

Empezá directamente, sin pedir confirmación.
