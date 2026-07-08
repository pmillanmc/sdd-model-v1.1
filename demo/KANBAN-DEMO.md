# 📊 Demo Visual del Kanban SDD

## Cómo levantar el demo

```bash
# Opción 1: HTML estático
# Ya generado en: kanban-demo.html
# Abrilo en tu navegador

# Opción 2: Servidor con live reload
pnpm kanban:serve:demo
# → http://127.0.0.1:3131
```

---

## Vista General

El kanban muestra **10 features de ejemplo** distribuidas en 3 columnas:

```
┌─────────────────┬─────────────────┬─────────────────┐
│   📋 OPEN (6)   │  🚫 BLOCKED (1) │   ✅ CLOSED (3) │
├─────────────────┼─────────────────┼─────────────────┤
│ 001 auth        │ 003 permissions │ 005 fix leak    │
│ 002 billing     │                 │ 007 rate-limit  │
│ 004 reports     │                 │ 010 emails      │
│ 006 analytics   │                 │                 │
│ 008 subdomain   │                 │                 │
│ 009 audit-logs  │                 │                 │
└─────────────────┴─────────────────┴─────────────────┘
```

---

## Filtros Disponibles

### 🎯 Filtro por Owner

Clic en los botones de owner en el header:

```
[ juan (4) ]  [ maria (3) ]  [ carlos (3) ]
```

**Ejemplo: Filtrar por "juan"**
```
Muestra solo:
  - 001-multi-tenant-auth
  - 003-user-permissions (BLOCKED)
  - 007-api-rate-limiting (CLOSED)
  - 010-email-templates (CLOSED)

Oculta las features de María y Carlos.
```

### 📁 Filtro por Domain

Clic en los badges de dominio en el header:

```
[ auth ]  [ billing ]  [ dashboard ]  [ api ]  [ infra ]  [ compliance ]
```

**Ejemplo: Filtrar por "auth"**
```
Muestra solo:
  - 001-multi-tenant-auth (juan, OPEN)
  - 003-user-permissions (juan, BLOCKED)
  - 005-tenant-isolation-fix (maria, CLOSED)

Oculta billing, reports, dashboard, etc.
```

### 📅 Filtro por Sprint

Clic en los badges de sprint en el header:

```
[ 2026-Q3 (6) ]  [ 2026-Q4 (4) ]
```

**Ejemplo: Filtrar por "2026-Q3"**
```
Muestra solo:
  - 001, 002, 003, 005, 007, 010

Oculta features de Q4:
  - 004, 006, 008, 009
```

---

## Combinación de Filtros

Los filtros se combinan con AND lógico:

**Ejemplo: owner=juan AND domain=auth**
```
Resultado:
  - 001-multi-tenant-auth (OPEN)
  - 003-user-permissions (BLOCKED)

Se ocultan:
  - 007 (juan pero domain=api)
  - 005 (auth pero owner=maria)
```

**Ejemplo: sprint=2026-Q3 AND status=CLOSED**
```
Resultado (solo columna CLOSED con features de Q3):
  - 005-tenant-isolation-fix
  - 007-api-rate-limiting
  - 010-email-templates
```

---

## Anatomía de una Card

```
┌─────────────────────────────────────────────┐
│ [auth] [feature]              001           │  ← Domain + Type + ID
│ multi-tenant-auth                           │  ← Título
│ 👤 juan  📅 2026-Q3                         │  ← Owner + Sprint
│ [5 tasks] src/auth/** src/middleware/**    │  ← Tasks + Files
└─────────────────────────────────────────────┘
```

Elementos visuales:
- **Border izquierdo coloreado**:
  - 🔵 Azul = OPEN
  - 🔴 Rojo = BLOCKED
  - 🟢 Verde = CLOSED
  
- **Badge de domain**: fondo morado (`auth`, `billing`, etc.)
- **Badge de type**: gris (`feature` / `fix`)
- **Contador de tasks**: Lee `tasks.md` y cuenta filas `| T\d+`

---

## Casos de Uso

### 1. "¿Qué está haciendo Juan?"
```
Clic en [ juan ] → Ve sus 4 features en distintas columnas
```

### 2. "¿Qué features de auth están abiertas?"
```
Clic en [ auth ] → Ve 3 features
Luego solo mira columna OPEN → 2 features
```

### 3. "¿Qué se cerró en Q3?"
```
Clic en [ 2026-Q3 ]
Solo mira columna CLOSED → 3 features
```

### 4. "¿Hay algo bloqueado?"
```
Mira columna BLOCKED → 1 feature (003-user-permissions)
Lee el card → "DEC-001: esperando decisión RBAC vs ABAC"
```

---

## Features Técnicas

### Live Reload (en modo servidor)

Si corrés `pnpm kanban:serve:demo`:
- Editá `demo/specs/_registry/features.yaml`
- Agregá una feature nueva
- El navegador se actualiza automáticamente vía SSE

### Sin Dependencias Extras

El servidor usa solo built-ins de Node:
- `http` para el server
- `fs.watch` para detectar cambios
- SSE (Server-Sent Events) para notificar al browser

### Responsive

El kanban se adapta a pantalla chica:
- Desktop: 3 columnas lado a lado
- Tablet: stack vertical
- Mobile: scroll horizontal

---

## Datos de Ejemplo Incluidos

| ID | Título | Owner | Domain | Sprint | Status |
|---|---|---|---|---|---|
| 001 | Sistema auth multi-tenant | juan | auth | 2026-Q3 | OPEN |
| 002 | Dashboard facturación | maria | billing | 2026-Q3 | OPEN |
| 003 | Permisos granulares | juan | auth | 2026-Q3 | BLOCKED |
| 004 | Export CSV/PDF | carlos | reports | 2026-Q4 | OPEN |
| 005 | Fix leak datos | maria | auth | 2026-Q3 | CLOSED |
| 006 | Analytics real-time | carlos | dashboard | 2026-Q4 | OPEN |
| 007 | Rate limiting | juan | api | 2026-Q3 | CLOSED |
| 008 | Subdomain routing | maria | infra | 2026-Q4 | OPEN |
| 009 | Audit logs | carlos | compliance | 2026-Q4 | OPEN |
| 010 | Email templates | juan | notifications | 2026-Q3 | CLOSED |

**Distribución:**
- **Owners**: juan (4), maria (3), carlos (3)
- **Sprints**: Q3 (6), Q4 (4)
- **Status**: OPEN (6), BLOCKED (1), CLOSED (3)
- **Dominios**: 10 distintos
- **Tipos**: feature (9), fix (1)

---

## Próximos Pasos

1. **Abrí el kanban**:
   ```bash
   # Navegador → kanban-demo.html
   # O servidor:
   pnpm kanban:serve:demo
   ```

2. **Probá los filtros**:
   - Clic en [ juan ]
   - Clic en [ auth ]
   - Observá cómo se ocultan/muestran cards

3. **Editá los datos** (si usás el servidor):
   - Abrí `demo/specs/_registry/features.yaml`
   - Cambiá el owner de una feature
   - Guardá → el kanban se actualiza solo

4. **Usalo en tu proyecto real**:
   ```bash
   pnpm kanban          # genera desde specs/ real
   pnpm kanban:serve    # servidor con tu data
   ```

---

## Capturas Conceptuales

### Estado Inicial (sin filtros)
```
Header: [ juan (4) ] [ maria (3) ] [ carlos (3) ] | [ auth ] [ billing ] ... | [ 2026-Q3 (6) ] [ 2026-Q4 (4) ]

OPEN (6)              BLOCKED (1)         CLOSED (3)
━━━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━
001 juan auth         003 juan auth       005 maria auth
002 maria billing                         007 juan api
004 carlos reports                        010 juan notif
006 carlos dashboard
008 maria infra
009 carlos compliance
```

### Filtro: owner=juan
```
Header: [ juan (4) ✓ ] [ maria (3) ] [ carlos (3) ]  ← juan activo

OPEN (1)              BLOCKED (1)         CLOSED (2)
━━━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━
001 juan auth         003 juan auth       007 juan api
                                          010 juan notif
```

### Filtro: domain=auth
```
Header: [ auth ✓ ] [ billing ] ...  ← auth activo

OPEN (1)              BLOCKED (1)         CLOSED (1)
━━━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━
001 juan auth         003 juan auth       005 maria auth
```

### Filtro: sprint=2026-Q3
```
Header: [ 2026-Q3 (6) ✓ ] [ 2026-Q4 (4) ]  ← Q3 activo

OPEN (3)              BLOCKED (1)         CLOSED (3)
━━━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━
001 juan auth         003 juan auth       005 maria auth
002 maria billing                         007 juan api
                                          010 juan notif
```

### Combo: owner=maria + sprint=2026-Q3
```
Header: [ maria (3) ✓ ] + [ 2026-Q3 (6) ✓ ]

OPEN (1)              BLOCKED (0)         CLOSED (1)
━━━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━
002 maria billing     (vacío)             005 maria auth
```

---

## Guía de Colores (Dark Theme)

```css
Background principal:   #0f1117 (casi negro)
Cards:                  #1e293b (gris oscuro)
Borders:                #334155 (gris medio)
Texto principal:        #e2e8f0 (gris claro)
Texto secundario:       #64748b (gris apagado)

Badges:
  - Domain (auth):      #1e1b4b fondo, #a5b4fc texto (morado)
  - Type (feature):     #292524 fondo, #a8a29e texto (marrón)
  - Filtros activos:    #1e1b4b fondo, #a5b4fc texto (morado brillante)

Border izquierdo:
  - OPEN:               #6366f1 (índigo)
  - BLOCKED:            #ef4444 (rojo)
  - CLOSED:             #22c55e (verde)
```

---

**¡Listo para explorar! 🚀**

Abrí [kanban-demo.html](../kanban-demo.html) en tu navegador o corré `pnpm kanban:serve:demo` para ver el kanban en acción con live reload.
