Configurá el entorno para usar el modelo SDD con integración Jira.

Este comando es el punto de entrada para cualquier dev que clone el repo por primera vez.
Guía paso a paso, en lenguaje simple, sin asumir conocimiento técnico previo.

**No ejecutes nada sin confirmación explícita del dev en cada paso.**

---

## Paso 1 — Bienvenida y contexto

Presentate con este mensaje exacto:

```
👋 Hola! Voy a ayudarte a configurar el entorno para usar el modelo SDD.

Este proceso tarda unos 5 minutos y solo tenés que hacerlo una vez por proyecto.
Te voy a pedir algunos datos sobre tu cuenta de Atlassian/Jira — si no los tenés
a mano, no te preocupes, te explico cómo obtenerlos en cada paso.

¿Arrancamos?
```

Esperá confirmación antes de continuar.

---

## Paso 2 — Detectar entorno

Detectá en qué herramienta estás corriendo este comando:
- Si hay señales de Cursor (`.vscode/` presente, variables de entorno de Cursor) → `entorno: cursor`
- Si hay señales de Claude Code → `entorno: claude-code`
- Si no podés determinarlo con certeza → preguntá:

```
¿Desde qué herramienta estás trabajando?
  1. Cursor
  2. Claude Code
  3. Claude.ai
```

Usá el entorno detectado/confirmado para todos los pasos siguientes.

---

## Paso 3 — Detectar directorio del proyecto

Mostrá el directorio actual y pedí confirmación:

```
📁 Estoy viendo que tu proyecto está en:
   [ruta actual]

¿Es correcto? Este es el proyecto donde vamos a configurar el modelo SDD.
```

Si el dev dice que no, pedile que navegue al directorio correcto y corran el comando de nuevo.

---

## Paso 4 — Verificar archivos requeridos

Chequeá la existencia de cada archivo necesario y construí internamente este checklist:

| Archivo | Estado |
|---|---|
| `.vscode/mcp.json` | existe / no existe |
| `.claude/settings.json` | existe / no existe |
| `.env` | existe / no existe |
| `mcp/dist/index.js` | existe / no existe |

Mostrá el resultado al dev:

```
📋 Estado de tu configuración:

  .vscode/mcp.json       → [estado]
  .claude/settings.json  → [estado]
  .env                   → [estado]
  mcp-proguide           → [compilado / sin compilar]

Vamos a resolver cada uno juntos.
```

---

## Paso 5 — Configurar `.vscode/mcp.json` (Cursor)

**Solo si el entorno es Cursor y el archivo no existe.**

Explicá:

```
📄 Necesito crear el archivo .vscode/mcp.json
   Este archivo le dice a Cursor qué servidores MCP usar — son los
   "puentes" que conectan el modelo SDD con tu proyecto y con Jira.
   ¿Lo creo ahora?
```

Esperá confirmación. Si acepta, creá el archivo:

```json
{
  "servers": {
    "sdd": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/mcp/dist/index.js"],
      "env": {
        "SDD_PROJECT_ROOT": "${workspaceFolder}"
      }
    },
    "atlassian": {
      "type": "sse",
      "url": "https://mcp.atlassian.com/v1/mcp"
    }
  }
}
```

Confirmá:
```
✅ .vscode/mcp.json listo.
   La próxima vez que abras Cursor, va a pedirte autenticar tu cuenta
   de Atlassian — es un proceso de un clic, como entrar con Google.
```

---

## Paso 6 — Verificar `.claude/settings.json`

Este archivo ya viene en el repo y no requiere modificaciones — las credenciales
se cargan desde `.env` automáticamente.

Si existe, validá que el JSON esté bien formado ejecutando:
```bash
cat .claude/settings.json | jq .
```

Si el comando devuelve error, avisá en lenguaje simple:
```
⚠️ El archivo .claude/settings.json tiene un error de formato.
   Probablemente le sobra o le falta una llave { } o una coma.
   Abrilo en tu editor y buscá la línea que indica el error, o pedime
   que lo revise y lo corrija.
```
Y ofrecé revisarlo y corregirlo.

Si no existe por algún motivo, avisá:
```
⚠️ No encontré .claude/settings.json — este archivo debería venir incluido
   en el repo. Verificá que clonaste el repo correctamente e intentá de nuevo.
```

---

## Paso 7 — Crear `.env` con credenciales de Atlassian

Explicá primero qué es el archivo:

```
🔐 Vamos a crear un archivo llamado .env donde vamos a guardar tus
   credenciales de Atlassian de forma segura.

   Este archivo es SOLO tuyo — vive en tu computadora y nunca
   se sube al repositorio. Podés estar tranquilo/a.

   Voy a pedirte tres datos. Te explico cómo obtener cada uno.
```

Pedí cada credencial por separado. No sigas al siguiente hasta que el dev confirme que tiene el valor.

### ATLASSIAN_SITE_URL

```
🌐 Primero necesito la URL de tu workspace de Jira.

   Es la dirección que usás para entrar a Jira todos los días.
   Se ve así: https://nombre-de-tu-empresa.atlassian.net

   Abrí Jira en tu navegador y fijate en la barra de direcciones.
   ¿Cuál es tu URL? (solo la parte de "https://...atlassian.net")
```

Esperá que el dev pegue la URL. Validá que tenga el formato correcto
(`https://[algo].atlassian.net`). Si no es correcta, explicá amablemente
qué está mal y pedila de nuevo.

### ATLASSIAN_USER_EMAIL

```
📧 Ahora necesito el email con el que entrás a Jira.

   Es el mismo que usás para iniciar sesión en Atlassian.
   ¿Cuál es?
```

### ATLASSIAN_API_TOKEN

```
🔑 Por último, necesito un "token de API" de Atlassian.
   No es tu contraseña — es una clave especial que le permite al modelo
   hablar con Jira sin que tengas que escribir tu contraseña cada vez.

Para obtenerlo, seguí estos pasos:

   1. Abrí este link en tu navegador:
      https://id.atlassian.com/manage-profile/security/api-tokens

   2. Iniciá sesión si te lo pide.

   3. Hacé clic en el botón "Create API token".

   4. En "Label" escribí: sdd-model (o cualquier nombre que recuerdes)

   5. Hacé clic en "Create".

   6. ⚠️ IMPORTANTE: Antes de cerrar, asegurate de que el token
      tenga estos permisos activados:
      - read:jira-work  (para leer tickets)
      - write:jira-work (para crear y actualizar tickets)
      Si no ves esa opción, el token clásico incluye estos permisos
      por defecto — podés continuar.

   7. Copiá el token que aparece — es una cadena larga de letras y números.
      ⚠️ Solo lo vas a poder ver una vez, así que copialo ahora.

¿Ya tenés el token? Pegalo acá.
```

Una vez que tengas los tres valores, creá el archivo `.env` en la raíz del proyecto:

```
ATLASSIAN_SITE_URL=https://tu-org.atlassian.net
ATLASSIAN_USER_EMAIL=tu@email.com
ATLASSIAN_API_TOKEN=tu-api-token
```

Confirmá:
```
✅ Archivo .env creado con tus credenciales.
   Este archivo es solo tuyo — nunca se va a subir al repositorio.
```

---

## Paso 8 — Verificar dependencias y compilar mcp-proguide

### Verificar @anthropic-ai/mcp-server-atlassian

Antes de compilar, verificá que el servidor de Atlassian esté disponible:

```bash
npx @anthropic-ai/mcp-server-atlassian --version
```

Si el comando falla, explicá en lenguaje simple:
```
⚙️ Necesito instalar un componente que conecta el modelo con Jira.
   ¿Lo instalo ahora? (tarda menos de 1 minuto)
```

Si acepta, ejecutá:
```bash
npm install -g @anthropic-ai/mcp-server-atlassian
```

### Compilar mcp-proguide

Verificá que existe `mcp/dist/index.js`. Si no existe:

```
⚙️ El servidor mcp-proguide no está compilado todavía.
   Necesito correr un comando para construirlo. ¿Lo hago ahora?
   (Esto tarda menos de 30 segundos)
```

Si acepta, ejecutá:
```bash
cd mcp && pnpm install && pnpm build
```

Mostrá el output y confirmá si fue exitoso. Si falla, reportá el error
en lenguaje simple sin mostrar el stacktrace completo.

---

## Paso 9 — Verificar conectividad y resumen final

### Verificar que el JSON de settings es válido

Si el entorno es Claude Code, corré:
```bash
cat .claude/settings.json | jq .
```

Si parsea sin errores, continuá. Si falla, ofrecé corregirlo antes de seguir.

### Resumen final

```
🎉 ¡Todo listo! Tu entorno está configurado para usar el modelo SDD.

📋 Resumen de lo que configuramos:
   ✅ .vscode/mcp.json — servidores MCP para Cursor
   ✅ .claude/settings.json — permisos y MCPs para Claude Code
   ✅ .env — credenciales de Atlassian (solo en tu máquina)
   ✅ @anthropic-ai/mcp-server-atlassian — servidor Atlassian disponible
   ✅ mcp-proguide — servidor de gobernanza SDD compilado

🚀 Próximos pasos:
   1. Reiniciá Cursor (o Claude Code) para que tome los cambios
   2. Si usás Cursor: vas a ver un popup para autenticar Atlassian — hacé clic en "Conectar"
   3. Una vez reiniciado, probá con: /sdd-jira-start [KEY de tu primer ticket]

⚠️ Si algo no funciona después de reiniciar:
   - Revisá los logs en: ~/.claude/logs/mcp-*.log
   - Verificá que las claves en .env estén escritas exactamente así:
     ATLASSIAN_SITE_URL, ATLASSIAN_USER_EMAIL, ATLASSIAN_API_TOKEN
     (mayúsculas, sin espacios, sin comillas)

¿Tenés alguna duda antes de arrancar?
```

---

## Reglas estrictas

- Nunca crear ni modificar archivos sin confirmación explícita del dev.
- Nunca mostrar el API token en pantalla después de recibirlo — confirmá recepción y continuá.
- Si algo falla, explicá el error en lenguaje simple (sin stacktraces crudos) y ofrecé alternativas.
- Si el dev dice que no entiende algo, explicalo de otra manera — nunca asumas conocimiento técnico.
- Si el dev ya tiene todo configurado, mostrá el checklist en verde y sugerí correr `/sdd-jira-start` directamente.
- Nunca escribir credenciales en `.claude/settings.json` — siempre van en `.env`.
- Las claves de `.env` son case-sensitive — siempre en mayúsculas: `ATLASSIAN_SITE_URL`, `ATLASSIAN_USER_EMAIL`, `ATLASSIAN_API_TOKEN`.
