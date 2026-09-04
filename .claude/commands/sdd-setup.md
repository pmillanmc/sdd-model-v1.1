Configurá el entorno para usar el modelo SDD con integración Jira.

Este comando es el punto de entrada para cualquier dev que clone el repo por primera vez. La conversación fluye natural, sin exponer numeración interna al usuario.

**No ejecutes ninguna operación que escriba archivos o corra comandos de sistema sin confirmación explícita del dev.**

---

## Flujo interno (no mostrar al usuario)

Etapas secuenciales que el agente debe ejecutar, en este orden, sin anunciar los nombres ni el progreso explícito:

1. Bienvenida + confirmación de inicio.
2. Detección de IDE (preguntar, no heurística).
3. Confirmación de directorio + checklist de estado inicial.
4. Creación del archivo de configuración MCP (path + schema según IDE).
5. Validación de `.claude/settings.json`.
6. Captura de credenciales Atlassian + escritura de `.env`.
7. Validación del token vía REST `/myself`.
8. Compilación de `mcp-proguide` si falta.
9. Guía manual para que el usuario active los servers MCP (varía por IDE).
10. Cortex (MCP opcional): detección de estado + instalación guiada si el dev la pide.
11. Verificación final + resumen.

---

## Bienvenida

Mensaje exacto al iniciar:

```
👋 Hola! Voy a ayudarte a configurar el entorno para usar el modelo SDD.

Esto son 3 cosas: detectar tu entorno, pedirte credenciales de Jira,
y dejar todo verificado. Tarda unos 5 minutos y solo lo hacés una
vez por proyecto.

¿Arrancamos?
```

Esperá confirmación antes de continuar.

---

## Detección de IDE

Preguntá explícitamente. No uses heurística (presencia de `.vscode/`, variables de entorno) — históricamente da falsos positivos.

```
¿Desde qué herramienta estás corriendo este comando?
  1. Cursor
  2. VS Code (sin Cursor)
  3. Claude Code
```

Guardá la respuesta como `entorno`. Todo el flujo siguiente depende de este valor — path del archivo MCP, schema JSON, instrucciones de activación manual.

---

## Confirmación de directorio + estado inicial

Mostrá ruta actual + checklist en un solo bloque. El path del archivo MCP que se muestra depende del IDE detectado:

- Cursor → `.cursor/mcp.json`
- VS Code → `.vscode/mcp.json`
- Claude Code → registro vía CLI / config global (`~/.claude/mcp.json` según versión)

```
📁 Estoy viendo que tu proyecto está en:
   [ruta actual]

📋 Estado actual:
   [path-mcp-según-ide]   → [existe / no existe]
   .claude/settings.json  → [existe / no existe]
   .env                   → [existe / no existe]
   mcp-proguide           → [compilado / sin compilar / sin clonar]

¿La ruta del proyecto es correcta? Si sí, voy resolviendo cada cosa.
```

Si el usuario dice que no, pedile navegar al directorio correcto y reejecutar el comando.

**Idempotencia:** si el checklist está todo en verde y los servers MCP ya estaban activos en una corrida previa, saltá directo a la verificación final (sección "Resumen") con mensaje *"Ya tenés todo configurado. Verifico que siga operativo."*

---

## Crear archivo de configuración MCP

**Solo si no existe.** Pedí confirmación con un mensaje específico:

```
📄 Voy a crear el archivo de configuración MCP para [IDE detectado]:
   [path-según-ide]

Este archivo le dice a [IDE] qué servidores MCP usar — son los
"puentes" que conectan el modelo SDD con tu proyecto y con Jira.

¿Lo creo ahora?
```

Contenido según IDE:

### Cursor → `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "sdd": {
      "command": "node",
      "args": ["${workspaceFolder}/mcp/dist/index.js"],
      "env": {
        "SDD_PROJECT_ROOT": "${workspaceFolder}"
      }
    },
    "atlassian": {
      "url": "https://mcp.atlassian.com/v1/mcp"
    }
  }
}
```

### VS Code → `.vscode/mcp.json`

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
      "type": "http",
      "url": "https://mcp.atlassian.com/v1/mcp"
    }
  }
}
```

### Claude Code → registro vía CLI

En lugar de escribir un archivo, registrá los servers con el CLI de Claude Code (pedí confirmación antes de ejecutar):

```bash
claude mcp add atlassian --url https://mcp.atlassian.com/v1/mcp
claude mcp add sdd --command "node ${workspaceFolder}/mcp/dist/index.js"
```

*(Sintaxis aproximada — los comandos exactos pueden variar entre versiones. Si fallan, sugerí al usuario verificar con `claude mcp --help`.)*

Confirmación post-creación, específica al IDE:

- Cursor → `✅ .cursor/mcp.json listo. Después vamos a activar los servers a mano.`
- VS Code → `✅ .vscode/mcp.json listo. Después vamos a habilitar los servers.`
- Claude Code → `✅ MCPs registrados. Después verificamos que estén corriendo.`

---

## Validar `.claude/settings.json`

Si existe, parseá:
```bash
cat .claude/settings.json | jq .
```

- Si parsea OK → continuá silenciosamente.
- Si falla → mostrá:
  ```
  ⚠️ El archivo .claude/settings.json tiene un error de formato.
     Abrilo en tu editor o pedime que lo revise y lo corrija.
  ```

Si no existe, avisá que debería venir con el repo y pedile verificar el clone.

---

## Capturar credenciales Atlassian

Pedí URL, email y token uno por uno. Mantené los textos del comando original (la UX de captura no cambia, solo desaparecen los "Paso N").

### ATLASSIAN_SITE_URL

```
🔐 Vamos a crear un archivo .env con tus credenciales de Atlassian.
   Es solo tuyo, vive en tu computadora y nunca se sube al repositorio.

🌐 Primero, la URL de tu workspace de Jira.
   Se ve así: https://nombre-empresa.atlassian.net
   ¿Cuál es la tuya?
```

Validá formato `https://[algo].atlassian.net`. Si no matchea, explicá y pedí de nuevo.

### ATLASSIAN_USER_EMAIL

```
📧 Ahora el email con el que entrás a Jira. ¿Cuál es?
```

### ATLASSIAN_API_TOKEN

```
🔑 Por último, un "token de API" de Atlassian (no es tu contraseña).

Para obtenerlo:
   1. Abrí: https://id.atlassian.com/manage-profile/security/api-tokens
   2. Iniciá sesión si te lo pide.
   3. Clic en "Create API token".
   4. Label: sdd-model (o lo que recuerdes).
   5. Clic en "Create".

   ⚠️ El token con permisos read:jira-work + write:jira-work activados.
   ⚠️ Solo lo vas a poder ver una vez — copialo apenas aparezca.

¿Ya lo tenés? Pegalo acá.
```

Una vez con los 3 valores, escribí `.env`:

```
ATLASSIAN_SITE_URL=https://...atlassian.net
ATLASSIAN_USER_EMAIL=...
ATLASSIAN_API_TOKEN=...
```

Confirmá sin mostrar el token:
```
✅ .env creado con tus credenciales. No se sube al repo.
```

---

## Validar el token contra Jira (vía REST)

Inmediatamente después de escribir `.env`, ejecutá:

```bash
# Credencial vía config temporal de curl — nunca en argv (visible en `ps`)
# ni en archivos world-readable de /tmp.
CURL_CFG=$(mktemp) && chmod 600 "$CURL_CFG"
RESP_FILE=$(mktemp) && chmod 600 "$RESP_FILE"
printf 'user = "%s:%s"\n' "$ATLASSIAN_USER_EMAIL" "$ATLASSIAN_API_TOKEN" > "$CURL_CFG"
HTTP_CODE=$(curl -s -o "$RESP_FILE" -w "%{http_code}" \
  --config "$CURL_CFG" \
  -H "Accept: application/json" \
  "$ATLASSIAN_SITE_URL/rest/api/3/myself")
rm -f "$CURL_CFG"
echo "$HTTP_CODE"
```

En Windows/PowerShell:

```powershell
$pair  = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("$env:ATLASSIAN_USER_EMAIL`:$env:ATLASSIAN_API_TOKEN"))
try {
  $r = Invoke-WebRequest -Uri "$env:ATLASSIAN_SITE_URL/rest/api/3/myself" -Headers @{ Authorization = "Basic $pair"; Accept = "application/json" } -UseBasicParsing
  $r.StatusCode; $r.Content
} catch { $_.Exception.Response.StatusCode.value__ }
```

Clasificá por código de respuesta:

- **200** → leé el campo `emailAddress` de `$RESP_FILE` (o del body PowerShell) y mostrá: `✅ Token válido — acceso a Jira confirmado como [emailFromResponse].`
- **401** → `❌ El token no es válido o el email no coincide. Revisá los 3 valores y volvé a correr este comando.`
- **403** → `⚠️ El token es válido pero le faltan permisos. Creá uno nuevo con read:jira-work + write:jira-work activados.`
- **Timeout / DNS / sin respuesta** → `⚠️ No puedo contactar a Jira. Verificá ATLASSIAN_SITE_URL y tu conectividad.`

Si falla, ofrecé reintentar o seguir marcando token como "no validado". Si el usuario decide seguir, anotá esa decisión para mencionarla en el resumen final.
**Nota de diseño:** esta validación usa REST por necesidad — el MCP de Atlassian recién se autentica después de que el usuario active el server en la UI del IDE, lo cual ocurre más adelante en este mismo flujo. No registres esta llamada como "fallback" en `DECISIONS.md`: es uso legítimo de REST documentado en el propio diseño del comando.

---

## Compilar `mcp-proguide` si falta

Tres casos según el estado del directorio `mcp/`:

### Caso A: `mcp/` no existe

```
⚠️ No encuentro el directorio mcp/ en este proyecto. mcp-proguide
   es un repo separado (pmillanmc/mcp-proguide).

   Para continuar:
   1. Cloná mcp-proguide dentro de este proyecto como mcp/.
   2. Agregá "mcp/" a tu .gitignore.
   3. Volvé a correr este comando.
```

Pausá el setup acá. El usuario tiene que resolverlo manualmente.

### Caso B: `mcp/` existe, `mcp/dist/index.js` no

```
⚙️ Encontré mcp-proguide pero no está compilado. ¿Lo compilo ahora?
   (Tarda menos de 30s.)
```

Si acepta:
```bash
cd mcp && pnpm install && pnpm build
```

Si falla, reportá el error en lenguaje simple. No pegues el stacktrace completo.

### Caso C: ya está compilado

Silencioso, no anuncies nada.

---

## Activación manual de servers MCP

El agente **no puede activar los toggles por su cuenta** — esto es una limitación real de los IDEs, no del modelo SDD. El usuario tiene que hacerlo a mano y el agente lo acompaña paso a paso.

Mostrá la guía correspondiente al IDE detectado:

### Cursor

```
✅ Configuración en disco lista. Ahora activá los servers MCP a mano
   (Cursor no permite que lo haga el agente):

   1. Abrí Cursor Settings (Ctrl+Shift+J o clic en el ícono ⚙ arriba
      a la derecha) → solapa "Tools" → solapa de tu workspace
      (la que tiene el nombre de este proyecto).

   2. Bajá hasta "Workspace MCP Servers":
      • atlassian: si dice "Needs authentication", clic en "Connect"
        y completá el flujo OAuth que se abre en el navegador.
      • sdd: asegurate de que el toggle de la derecha esté en verde.

   3. (Recomendado) Más arriba, en la sección "Authentication", activá
      "Wait for MCP Authentication". Sin esto, el popup de OAuth se
      cierra solo a los 30s y podés perdértelo.

   Avisame cuando ambos servers estén activos (atlassian en "Connected"
   y sdd con el toggle verde) para hacer la verificación final.
```

### VS Code

```
✅ Configuración en disco lista. Ahora habilitá los servers MCP a mano:

   1. Ctrl+Shift+P → escribí "MCP" → seleccioná "MCP: List Servers".

   2. Para cada server (atlassian, sdd):
      • Si aparece como "Disabled" → seleccionalo → "Enable".
      • Si aparece con error → "Show Output" para ver el log,
        después "Restart".

   3. La primera vez que atlassian arranque, VS Code va a abrir
      el flujo OAuth en el navegador. Completalo.

   Comandos exactos pueden variar entre versiones de VS Code.
   Si "MCP: List Servers" no existe, andá a Extensions view
   (Ctrl+Shift+X) → sección "MCP SERVERS - INSTALLED" → clic
   derecho sobre el server para habilitarlo.

   Avisame cuando ambos servers estén activos.
```

### Claude Code

```
✅ MCPs registrados. Verificá que estén operativos:

   1. En tu terminal: claude mcp list
      Deberías ver atlassian y sdd como "running" o "connected".

   2. Si atlassian aparece como no autenticado:
      claude mcp authenticate atlassian
      (Se abre OAuth en el navegador.)

   3. Si alguno aparece con error:
      claude mcp restart [nombre-del-server]

   La sintaxis exacta puede variar entre versiones de Claude Code.
   Si algún comando no existe, corré: claude mcp --help

   Avisame cuando atlassian y sdd estén ambos operativos.
```

**Esperá confirmación humana antes de pasar al resumen.** No asumas que está hecho.

---

## Cortex — MCP opcional (análisis estático del codebase)

Cortex acelera `/sdd-scan`, `/sdd-implement` y `/sdd-fix` leyendo el codebase sin gastar tokens de
razonamiento. **Es opcional: ningún comando lo requiere y ninguna verificación depende de él.**
Si el dev dice que no, seguí y no vuelvas a ofrecerlo en esta corrida.

**Ofrecelo solo si el repo tiene código** (hay `existing-arch.md`, o `src/`, o algo más que los
artefactos del modelo). En un repo vacío es ruido.

### Detectar el estado (antes de preguntar nada)

En este orden, y **sin ejecutar el binario**:

1. **¿Tenés disponibles las tools `mcp__cortex__*`?** Es la única verificación que prueba que
   *funciona*. Si están → `CORTEX_OK`. Decí una línea ("Cortex está conectado") y pasá al resumen.
2. Si no están, buscá la entrada `cortex` en la config del IDE detectado: `.mcp.json` (Claude Code),
   `.cursor/mcp.json` (Cursor), `.vscode/mcp.json` (VS Code).
3. Si hay entrada, resolvé su `command`:
   - es una **ruta a archivo** (ej. `...\cortex-mcp.exe`) → verificá que el archivo exista.
   - es `python` / una ruta a intérprete → corré `cortex --help` y `python --version` (necesita 3.11+).

Con eso clasificá:

| Estado | tools | entrada | binario | Qué le decís al dev |
|---|---|---|---|---|
| `CORTEX_OK` | sí | — | — | está listo, nada que hacer |
| `CORTEX_NOT_LOADED` | no | sí | sí | está todo instalado pero el cliente no lo levantó: reiniciar el IDE, y en Cursor además activar el toggle del server |
| `CORTEX_BIN_MISSING` | no | sí | **no** | la config apunta a una ruta que en esta máquina no existe. Mostrá la ruta exacta que figura |
| `CORTEX_ABSENT` | no | no | no | no está instalado: ofrecé la instalación guiada |

**No ejecutes el ejecutable para probarlo.** Es un server stdio: lanzado a mano se queda esperando
entrada y deja la terminal colgada. Verificá que el archivo exista, nada más. La prueba real es que
las tools aparezcan después de reiniciar el cliente.

### Instalación guiada (solo si el dev la pide)

Preguntá una sola cosa para elegir el camino:

```
¿Vas a modificar el código de Cortex, o solo usarlo?

  • Solo usarlo   → ejecutable autocontenido, no necesita Python
  • Modificarlo   → instalación con pip (requiere Python 3.11+ y acceso al repo)
```

**Camino A — ejecutable (el habitual).** El repo de Cortex es privado, así que el binario lo
consigue el dev, no vos:

```
Cortex se distribuye como un ejecutable autocontenido (~48 MB, no necesita Python).

1. Conseguí el binario. Con GitHub CLI y acceso al repo:

     gh release download --repo pmillanmc/cortex --pattern "cortex-mcp.exe"

   Si no tenés acceso (el repo es privado), pedile el archivo a quien lo tenga.

2. Copialo donde quieras — fuera de este repo. No lo pongas dentro del proyecto:
   pesa 48 MB y no es parte del framework.

3. Decime la ruta completa donde quedó y yo registro el server.
```

**PARÁ hasta que el dev te pase la ruta.** No la inventes, no asumas `C:\tools\cortex-mcp.exe`, y
no copies ni descargues el archivo vos.

**Camino B — pip.** Requiere Python 3.11+ y acceso al repo privado con token personal de scope
`repo`:

```
1. pip install git+https://github.com/pmillanmc/cortex.git
2. Verificá:  cortex --help     (deberías ver scan, graph, context, spec)
3. Avisame cuando termine.
```

Si usa entorno virtual, el `command` del server tiene que ser la ruta completa al intérprete del
venv, no `python` pelado.

### Registrar el server

Pedí confirmación antes de escribir, y avisá dónde vas a escribir. **Los tres formatos difieren** —
usá el del IDE detectado:

```json
// Claude Code → .mcp.json          |  Cursor → .cursor/mcp.json
{ "mcpServers": { "cortex": { "command": "<ruta-que-dio-el-dev>" } } }

// VS Code → .vscode/mcp.json
{ "servers": { "cortex": { "type": "stdio", "command": "<ruta-que-dio-el-dev>" } } }
```

Con el camino B, el `command` es el intérprete y los args son `["-m", "cortex.mcp"]`.

**Antes de escribir en un archivo que se commitea (`.mcp.json`), avisá la consecuencia y dejá
elegir:**

```
La ruta del ejecutable es de tu máquina. Si la escribo en .mcp.json, va al repo
y a los demás no les va a servir: el cliente va a intentar levantar un server
que en su máquina no existe y va a fallar sin decir nada.

  a) La dejo fuera del repo (recomendado) — te muestro el JSON y la pegás en tu
     config local; cada dev corre /sdd-setup y registra su propia ruta.
  b) La escribo en .mcp.json — solo si todo el equipo usa la misma ruta.

¿Cuál preferís?
```

### Cerrar

Después de registrar: **reiniciar el cliente** (Cursor: además activar el toggle del server en
Settings → Tools). Recién ahí las tools aparecen.

Decile que puede volver a correr `/sdd-setup` para verificar: es idempotente y, si ya está todo,
lo reporta y sigue de largo.

Y dejá claro el límite, para que nadie espere de más:

```
Cortex acelera el descubrimiento del codebase. No cambia ningún gate:
`pnpm audit:sdd` no lo usa nunca, y sin Cortex todos los comandos funcionan igual
—leyendo el código— solo más lento.
```

---

## Resumen final

Cuando el usuario confirme que los servers están activos:

```
🎉 ¡Todo listo! Tu entorno está configurado para usar el modelo SDD.

📋 Lo que quedó configurado:
   ✅ [path-mcp-según-ide]
   ✅ .claude/settings.json
   ✅ .env (token validado contra Jira: [✅/⚠️ no validado])
   ✅ mcp-proguide compilado en mcp/dist/index.js
   ✅ Servers MCP activos en [IDE]

🚀 Próximos pasos:
   Inspeccioná .sdd/specs/ para decidir el siguiente comando:
   • Sin specs todavía → /sdd-refine
   • Con input.md sin spec.md → /sdd-generate <feature_id>
   • Con spec.md sin validar → /sdd-validate <feature_id>
   • Todo al día → /sdd-implement <feature_id>

⚠️ Si el MCP de Atlassian falla en runtime:
   El agente está instruido (ver CLAUDE.md, "Regla de Resiliencia")
   para invocar /sdd-log antes de caer a REST. Te va a pedir tu
   nombre/rol y dejar la entrada en DECISIONS.md vía el flujo
   estándar del modelo. Sin /sdd-log no hay fallback.
```

**Inspección de `.sdd/specs/`** para próximos pasos: leé el directorio y mostrá solo la sugerencia que corresponda al estado real del proyecto, no las 4 opciones genéricas. Si `.sdd/specs/` no existe, recomendá `/sdd-refine`.

---

## Reglas estrictas

- Nunca crear ni modificar archivos sin confirmación explícita del dev.
- Nunca mostrar el API token en pantalla después de recibirlo.
- Errores en lenguaje simple, sin stacktraces crudos.
- Idempotencia: si todo está en orden al re-correr, anunciá "está todo configurado" y andá directo a verificación final.
- Las claves de `.env` son case-sensitive, siempre mayúsculas: `ATLASSIAN_SITE_URL`, `ATLASSIAN_USER_EMAIL`, `ATLASSIAN_API_TOKEN`.
- Credenciales SIEMPRE en `.env`, NUNCA en `.claude/settings.json` ni en el archivo MCP.
- Sin numeración visible: no muestres "Paso N — ..." al usuario. La numeración del flujo interno es solo para el agente.

---

## Changelog

### v1.2 — [pendiente, completar al mergear]
- Detección de IDE explícita (Cursor / VS Code / Claude Code) por pregunta directa al usuario. Eliminada heurística no confiable. Ref: bug 3.1 del handoff.
- Path y schema correctos según IDE: `.cursor/mcp.json` con `mcpServers` (Cursor), `.vscode/mcp.json` con `servers` (VS Code), CLI para Claude Code. Ref: bugs 3.2, 3.3.
- Mensaje de cierre específico al IDE detectado. Ref: bug 3.5.
- Validación del token Atlassian vía REST `/myself` inmediatamente después de escribir `.env`. Ref: "Mejora — Validar token" del handoff.
- Guía manual paso a paso para que el usuario active los servers MCP en su IDE (limitación: el agente no puede manipular toggles de la UI del IDE).
- Próximos pasos del resumen final basados en estado real de `.sdd/specs/` en lugar de hardcoded `/sdd-jira-start`. Ref: bug 1.
- Numeración visible de pasos eliminada del output al usuario. Numeración interna conservada para el agente. Ref: bug 2.
- Documentación cruzada con `CLAUDE.md`: el setup deja claro que el fallback MCP→REST en runtime queda gobernado por la regla de `CLAUDE.md` y se registra invocando `/sdd-log` (no escribiendo en `DECISIONS.md` directamente).

### v1.1 — versión inicial con integración Jira

Ref handoff: "Robustecer comando /sdd-setup del modelo SDD v1.1".
Ref Jira: [TICKET-KEY pendiente de crear].