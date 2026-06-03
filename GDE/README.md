# SDD Model — GDE Flavor

Adaptación del SDD Model para proyectos del ecosistema GDE (Gestión Documental Electrónica).

## Qué agrega este flavor sobre el SDD base

| SDD base | GDE Flavor |
|---|---|
| `existing-arch.md` (codebase) | + `gde-context.md` (dominio funcional) |
| Fronteras técnicas | + Fronteras de dominio GDE (D1–D7) |
| Stack constraints | + Restricciones HLD (OpenShift, Oracle, capacidades transversales) |
| `sdd-refine` genérico | `sdd-refine` que detecta cruces de frontera |
| `constitution.md` genérico | `constitution.md` con sección "Fronteras del dominio" obligatoria |
| `sdd-validate` genérico | `sdd-validate` con 5 validaciones GDE adicionales |

## Cómo exportar a un proyecto GDE

### Paso 1 — Copiar archivos al proyecto destino

```
# Crear carpeta .claude en el proyecto si no existe
mkdir <proyecto>/.claude/commands

# Copiar comandos GDE
cp GDE/commands/gde-scan.md     <proyecto>/.claude/commands/
cp GDE/commands/sdd-refine.md   <proyecto>/.claude/commands/
cp GDE/commands/sdd-generate.md <proyecto>/.claude/commands/
cp GDE/commands/sdd-validate.md <proyecto>/.claude/commands/

# Copiar comandos base (no modificados por este flavor)
cp .claude/commands/sdd-scan.md       <proyecto>/.claude/commands/
cp .claude/commands/sdd-implement.md  <proyecto>/.claude/commands/
cp .claude/commands/sdd-metrics.md    <proyecto>/.claude/commands/
cp .claude/commands/sdd-health.md     <proyecto>/.claude/commands/
cp .claude/commands/sdd-log.md        <proyecto>/.claude/commands/
cp .claude/commands/sdd-checklist.md  <proyecto>/.claude/commands/
cp .claude/commands/sdd-review.md     <proyecto>/.claude/commands/

# Copiar contexto automático
cp GDE/CLAUDE.md <proyecto>/CLAUDE.md
```

### Paso 2 — Copiar el documento de dominio y el HLD

Copiá al proyecto:
- El documento funcional del dominio (ej. `D5_documento.pdf`)
- El HLD (`HLD_Reingenieria_GDE_v3.pdf`)

Podés ponerlos en una carpeta `docs/` en la raíz del proyecto.

### Paso 3 — Arrancar el ciclo

```
# En Claude / Copilot, dentro del proyecto:
/gde-scan       ← genera gde-context.md (siempre primero)
/sdd-scan       ← genera existing-arch.md (solo si hay código existente)

# Poner borradores en drafts/
/sdd-refine     ← genera input.md respetando fronteras GDE
/sdd-generate   ← genera los 4 artefactos con sección de fronteras
/sdd-validate   ← verifica brief + fronteras + integraciones
/sdd-implement  ← implementa con TDD
/sdd-metrics    ← telemetría DX al cerrar
```

## Estructura esperada del proyecto GDE

```
<proyecto>/
  CLAUDE.md              ← contexto auto (copiado de GDE/CLAUDE.md)
  gde-context.md         ← generado por /gde-scan
  existing-arch.md       ← generado por /sdd-scan (si hay código)
  input.md               ← generado por /sdd-refine
  constitution.md        ← generado por /sdd-generate
  spec.md
  plan.md
  tasks.md
  DECISIONS.md           ← decisiones que desvían fronteras o restricciones
  drafts/
  docs/
    D5_documento.pdf     ← o el D-N que corresponda
    HLD_Reingenieria_GDE_v3.pdf
  metrics/               ← reportes DX por feature
  .claude/
    commands/            ← todos los comandos copiados
```

## Compatibilidad con sdd-model base

Este flavor es 100% compatible hacia atrás. Los proyectos GDE pueden correr cualquier
comando del sdd-model base. Los tres comandos sobreescritos (sdd-refine, sdd-generate,
sdd-validate) son supersets — si no hay `gde-context.md`, se comportan igual que el base.

## Documentos fuente

- `HLD_Reingenieria_GDE_v3.pdf` — arquitectura de alto nivel del ecosistema GDE
- `D5_documento.pdf` — dominio Formularios, Workflow y Reglas (caso de uso original)
