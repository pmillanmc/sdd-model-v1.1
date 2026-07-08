# Expense Splitter — Borrador funcional

## Contexto del proyecto

App para dividir gastos entre un grupo de personas.
Caso de uso típico: viaje con amigos, cena en grupo, gastos compartidos de depto.
No requiere cuenta ni login — todo en memoria de sesión (sin persistencia inicial).

Stack elegido: **Next.js 15 (App Router) + TypeScript + Tailwind CSS v3 + shadcn/ui + React Hook Form + Zod + Vitest**

---

## Problema que resuelve

Cuando un grupo comparte gastos, calcular manualmente quién le debe cuánto a quién
es tedioso y propenso a errores. La app calcula las deudas simplificadas:
en vez de N transacciones, muestra el mínimo de transferencias para saldar todo.

---

## Flujo de la app (3 pasos lineales)

### Paso 1 — Participantes
El usuario crea el grupo ingresando los nombres de las personas.
Mínimo 2 personas. Sin límite superior práctico.
Se puede agregar/eliminar mientras no haya gastos cargados.

### Paso 2 — Gastos
El usuario carga cada gasto con:
- Descripción (ej: "Cena", "Hotel noche 1")
- Monto total
- Quién pagó (un solo pagador por gasto)
- Quiénes participan del gasto (subset del grupo, todos por defecto)

El split es siempre equitativo entre los participantes del gasto.
Split desigual está fuera de scope v1.

### Paso 3 — Resumen / Liquidación
Muestra las transferencias mínimas para saldar todas las deudas.
Formato: "[Persona A] le debe $X a [Persona B]"
Un botón "Marcar como saldado" elimina esa deuda de la lista.
Cuando todas las deudas están saldadas: pantalla de celebración.

---

## Wireframes en texto

### Vista: Participantes

```
┌─────────────────────────────────────────────┐
│  💸 Expense Splitter                        │
│                                             │
│  ¿Quiénes participan?                       │
│                                             │
│  ┌─────────────────────┐  ┌──────────────┐  │
│  │  Nombre...          │  │  + Agregar   │  │
│  └─────────────────────┘  └──────────────┘  │
│                                             │
│  ● Ana              [×]                     │
│  ● Bruno            [×]                     │
│  ● Carla            [×]                     │
│                                             │
│              [ Continuar → ]               │
└─────────────────────────────────────────────┘
```

### Vista: Gastos

```
┌─────────────────────────────────────────────┐
│  💸 Expense Splitter       [← Participantes]│
│                                             │
│  [ + Agregar gasto ]                        │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 🍕 Cena                             │    │
│  │ $90  · Pagó: Ana  · Todos           │    │
│  │ Ana: -$60 | Bruno: +$30 | Carla: +$30│   │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 🏨 Hotel                            │    │
│  │ $150 · Pagó: Bruno · Ana, Bruno     │    │
│  │ Ana: +$75 | Bruno: -$75             │    │
│  └─────────────────────────────────────┘    │
│                                             │
│              [ Ver liquidación → ]         │
└─────────────────────────────────────────────┘
```

### Vista: Liquidación

```
┌─────────────────────────────────────────────┐
│  💸 Expense Splitter          [← Gastos]   │
│                                             │
│  Transferencias para saldar todo            │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Bruno → Ana          $45            │    │
│  │                    [ ✓ Saldado ]    │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Carla → Ana          $30            │    │
│  │                    [ ✓ Saldado ]    │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Total de gastos: $240                      │
│  Gastos por persona (promedio): $80         │
└─────────────────────────────────────────────┘
```

### Modal: Agregar gasto

```
┌─────────────────────────────────────────────┐
│  Nuevo gasto                           [×]  │
│                                             │
│  Descripción                                │
│  ┌─────────────────────────────────────┐    │
│  │  Cena...                            │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Monto                                      │
│  ┌─────────────────────────────────────┐    │
│  │  $ 90                               │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ¿Quién pagó?                               │
│  ○ Ana   ● Bruno   ○ Carla                  │
│                                             │
│  ¿Quiénes participan?                       │
│  ☑ Ana   ☑ Bruno   ☑ Carla                  │
│                                             │
│  Split: $30 por persona                     │
│                                             │
│  [ Cancelar ]           [ Agregar gasto ]   │
└─────────────────────────────────────────────┘
```

---

## Especificación visual (fuente de verdad para estilos)

### Paleta
- Background principal: `#0f0f0f` (casi negro)
- Card background: `#1a1a1a`
- Card border: `#2a2a2a`
- Accent / CTA: `#6366f1` (indigo-500 de Tailwind)
- Accent hover: `#4f46e5` (indigo-600)
- Texto principal: `#f5f5f5`
- Texto secundario: `#a3a3a3`
- Verde (saldado): `#22c55e`
- Rojo (debe): `#f87171`
- Amarillo (pagó): `#fbbf24`

### Tipografía
- Font: Inter (Google Fonts o variable CSS)
- Título app: 20px, weight 600
- Card title: 15px, weight 500
- Monto grande: 28px, weight 700, tabular-nums
- Texto secundario: 13px, weight 400

### Componentes shadcn a usar
- `Button` (default, outline, ghost)
- `Input`
- `Card`, `CardHeader`, `CardContent`
- `Dialog` (modal de nuevo gasto)
- `Checkbox`
- `RadioGroup`
- `Badge` (para el estado "saldado")
- `Separator`

### Estados visuales clave
- Deuda pendiente: border-left `4px solid #f87171`, badge rojo
- Deuda saldada: opacity 0.4, badge verde "Saldado", texto tachado
- Estado vacío (sin participantes): ilustración + texto guía
- Estado vacío (sin gastos): card con call to action centrado
- Todos saldados: pantalla full con confetti (librería `canvas-confetti`) y mensaje

---

## Lógica de negocio (algoritmo central)

### Simplificación de deudas
No mostrar deudas brutas ("A le debe a B, B le debe a C") sino el mínimo de
transferencias. Algoritmo:

1. Calcular balance neto de cada persona (lo que pagó - lo que consumió)
2. Separar en deudores (balance negativo) y acreedores (balance positivo)
3. Emparejar greedy: el mayor deudor paga al mayor acreedor hasta saldar uno de los dos
4. Repetir hasta que todos los balances sean 0

Este algoritmo es puro (sin side effects), ideal para TDD.

### Edge cases a cubrir
- Una persona pagó todo y el resto le debe
- Split que no da número exacto → redondear a 2 decimales, absorber diferencia en el primer participante
- Gasto donde solo participa una persona → no genera deuda
- Todos pagaron exactamente lo mismo → no hay deudas

---

## Out of scope v1

- Persistencia (localStorage, DB)
- Login / usuarios
- Split desigual (porcentajes o montos manuales)
- Múltiples grupos simultáneos
- Export a PDF / compartir por link
- Historial de grupos anteriores
- Monedas múltiples

---

## Restricciones técnicas

- Next.js 15 con App Router, TypeScript strict
- Tailwind CSS v3
- shadcn/ui (componentes copiados, no instalados como paquete)
- React Hook Form + Zod para todos los formularios (agregar persona, agregar gasto)
- Vitest + Testing Library para tests (configurado sobre Next.js)
- Sin backend — todo en memoria (useState / useReducer en un Context global)
- Sin librerías de estado externas (no Zustand, no Redux)
- Sin Server Components para lógica de estado — todo Client Components
- `canvas-confetti` solo para la pantalla de celebración

---

## Criterio de éxito

Un usuario puede crear un grupo, cargar 3 gastos con distintos pagadores,
ver las transferencias mínimas calculadas correctamente y marcar todas como
saldadas — en menos de 2 minutos desde que abre la app.
