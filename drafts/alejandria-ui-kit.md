# Sistema de diseño — Alejandria UI Kit

> Fuente: https://github.com/molivera-proguide/alejandria-ui-kit (repo público)
> Paquete: `@alejandria/ui-kit` (monorepo pnpm — `packages/ui`)
> Este archivo es la FUENTE DE VERDAD para estilos. Reemplaza cualquier
> especificación visual previa (paleta indigo/Inter/shadcn del brief funcional).

## Cómo se consume

`@alejandria/ui-kit` es una librería de componentes React ya construida, no un set
de tokens sueltos. Se consume de una de estas dos formas (decidir en /sdd-refine):

- **Opción A (recomendada)** — instalar el paquete desde git como dependencia
  workspace y usar sus componentes (`Button`, `Card`, `TaskCard`, etc.) + importar
  su `styles.css`. La estética viene resuelta.
- **Opción B** — replicar los tokens y clases `.ds-*` en el proyecto si no se puede
  instalar el paquete. En ese caso, los valores efectivos de abajo son la referencia.

Los componentes usan clases con prefijo `.ds-*` y variables CSS con prefijo `--ds-*`
declaradas en un `@layer ds.tokens`.

## Tokens efectivos (valores resueltos)

### Tipografía
- Body: `Montserrat`, weights 300/400/500/700
- Display / Mono: `Source Code Pro`, weights 400/600/700
- Ambas de Google Fonts (`@import` en styles.css)
- Rasgo distintivo: títulos y labels en MAYÚSCULAS (`text-transform: uppercase`)

### Colores — tema oscuro
| Token | Valor | Uso |
|---|---|---|
| `--ds-color-surface` | `#101315` | Background principal |
| `--ds-color-surface-strong` | `#171b1d` | Superficie elevada |
| `--ds-color-surface-glass` | `rgb(16 19 21 / 0.82)` | Cards con glass |
| `--ds-color-ink` | `#f4f7f5` | Texto principal |
| `--ds-color-ink-soft` | `#a9b3b0` | Texto secundario |
| `--ds-color-ink-muted` | `#6f7977` | Texto terciario / labels |
| `--ds-color-line` | `rgb(226 239 234 / 0.18)` | Bordes |
| `--ds-color-line-strong` | `rgb(226 239 234 / 0.34)` | Bordes fuertes |
| `--ds-color-teal` | `#6ce0c7` | Accent / CTA primario |
| `--ds-color-teal-dark` | `#1b8f7d` | Accent gradiente/hover |
| `--ds-color-coral` | `#ff5a52` | Alerta suave |
| `--ds-color-amber` | `#d7b24a` | Warning / "pagó" |
| `--ds-color-blue` | `#62b8d7` | Info |
| `--ds-color-green` | `#85d66f` | Success / "saldado" |
| `--ds-color-danger` | `#ff3d48` | Error / "debe" |

### Radios (filosos)
- `--ds-radius-xs`: 2px · `--ds-radius-sm`: 4px · `--ds-radius-md`: 6px

### Sombras
- `--ds-shadow-sm`: `0 1px 2px rgb(0 0 0 / 0.22), 0 14px 36px rgb(17 25 28 / 0.16)...`
- `--ds-shadow-md`: `0 22px 64px rgb(17 25 28 / 0.28)...`
- `--ds-focus-ring`: `0 0 0 3px rgb(108 224 199 / 0.24)` (teal)

## Componentes disponibles (mapeo al Expense Splitter)

| Componente Alejandria | Uso en Expense Splitter |
|---|---|
| `Button` (primary/secondary/ghost/danger, sm/md/lg) | CTAs: Continuar, Agregar gasto, Saldado |
| `TextField` | Input de nombre y descripción de gasto |
| `SelectField` | Selección de pagador |
| `Switch` / `SegmentedControl` | Navegación entre pasos / toggles |
| `Card` (header/body/footer, eyebrow/title) | Tarjetas de gasto |
| `Badge` (neutral/info/success/warning/danger) | Estado "Saldado" (success), "Debe" (danger) |
| `TaskCard` | Alternativa rica para cada gasto (código, estado, progreso) |
| `MetricCard` | KPIs del resumen: total gastos, promedio por persona |
| `ProgressRing` | % de deudas saldadas |
| `DataTable` | Tabla de transferencias de liquidación |
| `AlertBanner` | Estado vacío / mensaje de todos saldados |

## Consecuencias sobre el brief funcional

Al adoptar Alejandria, estos puntos del brief cambian:
- ❌ shadcn/ui → ✅ `@alejandria/ui-kit`
- ❌ Paleta indigo `#6366f1` / Inter → ✅ teal `#6ce0c7` / Montserrat + Source Code Pro
- ❌ Radios redondeados → ✅ radios filosos 2-6px, estética técnica en MAYÚSCULAS
- La celebración con `canvas-confetti` se mantiene (no la cubre el kit)
- El algoritmo de simplificación de deudas NO cambia (es lógica pura, agnóstica a UI)

## Restricción técnica derivada

- El stack del kit es Vite + React + TS (no Next.js). Si el brief mantiene Next.js 15,
  verificar en /sdd-refine que `@alejandria/ui-kit` (client components, `styles.css`
  global) sea compatible con App Router. Los componentes son client-side.
