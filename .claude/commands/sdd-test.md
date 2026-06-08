# Comando: Smoke Test del modelo SDD

**Descripción:** Verifica que el modelo SDD funciona correctamente usando un fixture de ejemplo.
Úsalo después de cambios en los comandos o al incorporar el modelo a un proyecto nuevo.

---

## Instrucciones para el Agente

Este comando ejecuta un ciclo SDD completo sobre un fixture sintético y verifica
que cada comando produce el output esperado. **No genera código real ni toca
archivos del proyecto fuera de `test-fixture/`.**

---

## Paso 1 — Crear fixture de prueba

Creá la carpeta `test-fixture/drafts/` y escribí el siguiente archivo de borrador:

**`test-fixture/drafts/borrador.md`**
```
Necesitamos un formulario de contacto simple para nuestra web.
El usuario escribe su nombre, email y mensaje y lo envía.
Nos llega un email con los datos.
No necesita base de datos.
Stack: React + TypeScript.
```

---

## Paso 2 — Ejecutar y verificar cada comando

Para cada paso, ejecutá el comando sobre el fixture y verificá el criterio. 
Mostrá ✅ o ❌ con una línea de detalle.

### Checkpoint A — sdd-refine
Ejecutá `/sdd-refine` apuntando a `test-fixture/drafts/`.

Verificar:
- [ ] A1: Produjo un análisis CLARO / AMBIGUO / FALTANTE de las 6 categorías
- [ ] A2: Hizo al menos una pregunta antes de generar input.md
- [ ] A3: Generó `test-fixture/input.md` con las 6 secciones completas
- [ ] A4: Creó (o intentó crear) `metrics/test-fixture-metrics.md` con bloque `## Refine`
- [ ] A5: El bloque Refine contiene `rondas_de_preguntas`, `categorias_faltantes`, `categorias_ambiguas`

### Checkpoint B — sdd-generate
Ejecutá `/sdd-generate` con `test-fixture/input.md` como input.

Verificar:
- [ ] B1: Preguntó por el `feature_id` antes de generar artefactos
- [ ] B2: Generó los 4 artefactos: constitution.md, spec.md, plan.md, tasks.md
- [ ] B3: Ningún artefacto supera su límite de líneas (60 / 80 / 50 / 40)
- [ ] B4: spec.md contiene al menos un criterio Given/When/Then
- [ ] B5: tasks.md contiene el `feature_id` en el encabezado

### Checkpoint C — sdd-validate
Ejecutá `/sdd-validate` sobre los artefactos generados.

Verificar:
- [ ] C1: Reportó secciones ✅ Cubierto / ⚠️ Parcial / ❌ Sin cobertura
- [ ] C2: Agregó bloque `## Validate` en `metrics/[feature_id]-metrics.md`
- [ ] C3: El bloque contiene `gaps_encontrados` y `cobertura_inicial`

### Checkpoint D — sdd-metrics
Ejecutá `/sdd-metrics` al final.

Verificar:
- [ ] D1: Detectó `feature_id` correctamente (Paso 0)
- [ ] D2: `iteration_number` es 1 (primera ejecución)
- [ ] D3: Tabla DX_MET_006 tiene al menos constitution.md, spec.md, plan.md, tasks.md
- [ ] D4: Sección `Rework Ratio estimado` está presente

### Checkpoint E — sdd-metrics-summary
Ejecutá `/sdd-metrics-summary`.

Verificar:
- [ ] E1: Encontró el archivo de métricas del fixture
- [ ] E2: Mostró la tabla por feature con todos los campos
- [ ] E3: Mostró la fila de Totales del proyecto
- [ ] E4: Evaluó las señales de alerta

---

## Paso 3 — Reporte final

Al terminar todos los checkpoints, mostrá:

```
## Smoke Test SDD — [timestamp]

Checkpoints pasados: [N] / 22
Checkpoints fallidos: [lista de IDs, ej. A4, C2]

Estado: [PASS / FAIL]

Gaps detectados en el modelo:
- [descripción de cada checkpoint fallido y por qué falló]
```

---

## Paso 4 — Limpieza

Preguntá: "¿Querés que elimine la carpeta `test-fixture/`?"
Si el usuario dice sí, eliminala. Si dice no, dejala como ejemplo.

---

## Reglas

- Todos los artefactos generados van dentro de `test-fixture/`, nunca en la raíz.
- No modifiques ningún comando ni archivo del modelo durante el test.
- Si un checkpoint falla, registrá el detalle pero continuá con el siguiente.
- Empezá directamente, sin pedir confirmación.
