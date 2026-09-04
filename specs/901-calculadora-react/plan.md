# Plan — 901-calculadora-react

## Stack técnico

- React + TypeScript, scaffolded con Vite
- Estado local con `useState` (sin librerías de estado global)
- Sin backend, sin API, sin base de datos, sin persistencia

## Scaffold (greenfield)

```bash
pnpm create vite@latest app -- --template react-ts
cd app
pnpm install
```

## Estructura de carpetas

```
app/
  src/
    components/
      Calculator.tsx      # componente único, autocontenido
      Calculator.css      # estilos del grid y la pantalla
    App.tsx                # renderiza <Calculator />
    main.tsx
  index.html
```

## Componentes a crear

- **`Calculator.tsx`**: componente único que contiene:
  - Estado de pantalla (valor actual / resultado / error)
  - Estado de operación pendiente (operando previo + operador elegido)
  - Grid de botones: dígitos `0-9`, `.`, `+`, `−`, `×`, `÷`, `=`, `C`
  - Lógica de cálculo (suma, resta, multiplicación, división) incluyendo
    el caso de división por cero → estado de error
- **`App.tsx`**: monta `<Calculator />` como único contenido de la app

## Fuera del plan

- Sin rutas, sin páginas adicionales, sin llamadas HTTP, sin persistencia.
- Sin librerías de UI (Tailwind, MUI, etc.) — CSS plano en
  `Calculator.css`.
