# GDE Model — Contexto del proyecto

## Qué es esto

Este es el SDD Model adaptado para el ecosistema GDE (Gestión Documental Electrónica).
El modelo agrega una capa de contexto de dominio sobre el SDD base: `gde-context.md`.

## Arquitectura de dominios GDE

El ecosistema GDE se organiza en 7 macrodominios:

| ID | Nombre | Responsabilidad |
|---|---|---|
| D1 | Experiencia y canales | Portales, UI, renderizado |
| D2 | Identidad, acceso y seguridad | Auth, SSO, roles, permisos |
| D3 | Gestión documental digital | Generación, firma, guarda de documentos |
| D4 | Expedientes y tramitación | Caratulación, pases, estados de expediente |
| D5 | Formularios, Workflow y Reglas | Formularios, flujos, reglas de negocio |
| D6 | Integración e Interoperabilidad | APIs, eventos, conectores, sistemas externos |
| D7 | Soluciones Verticales de Negocio | Capacidades específicas por organismo |

**Regla de oro**: Cada dominio tiene ownership exclusivo de sus datos.
Ningún dominio accede directamente a los datos de otro — siempre a través de servicios expuestos.

## Ciclo de trabajo GDE

```
[FASE 0]
/gde-scan  →  gde-context.md  (identidad, fronteras, servicios, restricciones HLD)

[FASE 0-BIS — solo si hay código existente]
/sdd-scan  →  existing-arch.md  (stack, source_root, patrones actuales)

    ↓ PREPARACIÓN
  borradores en drafts/

    ↓ /sdd-refine  (lee gde-context + existing-arch + drafts)
  input.md

    ↓ /sdd-generate  (genera artefactos con fronteras de dominio)
  constitution.md + spec.md + plan.md + tasks.md

    ↓ /sdd-validate  (verifica fronteras + brief + brownfield)
  gap → humano ajusta → /sdd-log → DECISIONS.md

    ↓ /sdd-implement
  código + tests

    ↓ /sdd-checklist
  checklist.md

    ↓ /sdd-review
  verificación final

    ↓ cada sprint
  /sdd-health  (drift de gde-context + existing-arch)
```

## Comandos disponibles

| Comando | Qué hace |
|---|---|
| `/gde-scan` | Lee D-N documento + HLD → genera `gde-context.md` |
| `/sdd-scan` | Lee codebase → genera `existing-arch.md` (brownfield only) |
| `/sdd-refine` | Grilling del brief respetando fronteras de dominio |
| `/sdd-generate` | Genera artefactos con sección "Fronteras del dominio" obligatoria |
| `/sdd-validate` | Valida brief + fronteras + integracones gobernadas |
| `/sdd-implement` | Implementa tasks.md con TDD |
| `/sdd-metrics` | Telemetría DX al cerrar implementación |
| `/sdd-health` | Auditoría por sprint — drift de gde-context y existing-arch |

## Reglas no negociables

- `gde-context.md` es la restricción de mayor prioridad. Va por encima de `existing-arch.md`.
- Las fronteras declaradas en `gde-context.md` no se cruzan sin decisión en `DECISIONS.md`.
- Todas las integraciones entre dominios van por los servicios expuestos, nunca por acceso directo a datos.
- Las decisiones diferidas al LLD en `gde-context.md` no se implementan hasta tener el LLD.
- Plataforma objetivo: OpenShift + Oracle (según HLD). No introducir otra plataforma sin decisión registrada.
- Usá `pnpm` como gestor de paquetes en el frontend.
