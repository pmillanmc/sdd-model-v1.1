# sdd-mcp — Servidor MCP para Spec-Driven Development

Servidor MCP local que expone las operaciones determinísticas del modelo SDD.
El agente llama a estas tools en lugar de leer/escribir archivos de gobernanza directamente.

## Tools disponibles

### Auditoría
| Tool | Qué hace |
|---|---|
| `sdd_run_audit` | Corre `sdd-audit.mjs` y retorna resultado estructurado (fails/warns/passes) |

### Registro — Lectura
| Tool | Qué hace |
|---|---|
| `sdd_list_features` | Lista features, filtro opcional por status (OPEN/CLOSED/all) |
| `sdd_get_feature` | Retorna una feature por id |
| `sdd_check_collisions` | Verifica si un conjunto de touches colisiona con features OPEN |

### Registro — Escritura
| Tool | Qué hace |
|---|---|
| `sdd_register_feature` | Registra feature/fix en `features.yaml` + crea `feature.status.md` |
| `sdd_close_feature` | Cierra una feature (CLOSED) en registro y status file |

### Grafo de dominio
| Tool | Qué hace |
|---|---|
| `sdd_list_domains` | Lista dominios del grafo |
| `sdd_get_domain_files` | Retorna archivos exactos de un dominio (routing de contexto) |
| `sdd_update_domain_graph` | Crea/actualiza dominio en `graph/domain.yaml` |

### Métricas
| Tool | Qué hace |
|---|---|
| `sdd_write_metrics` | Agrega bloque de métricas al archivo del feature |
| `sdd_get_metrics` | Lee y parsea el archivo de métricas de un feature |

## Instalación

```bash
cd mcp
pnpm install
pnpm build
```

## Configuración

### VS Code (ya incluido en .vscode/mcp.json)
Listo — usa `${workspaceFolder}` como `SDD_PROJECT_ROOT`.

### Claude Desktop
Agregá a `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "sdd": {
      "command": "node",
      "args": ["/ruta/absoluta/a/sdd-model/mcp/dist/index.js"],
      "env": {
        "SDD_PROJECT_ROOT": "/ruta/absoluta/a/sdd-model"
      }
    }
  }
}
```

### Exportar a otro proyecto
Apuntá `SDD_PROJECT_ROOT` a la raíz del proyecto que usa el modelo SDD:
```json
{
  "env": { "SDD_PROJECT_ROOT": "/ruta/a/mi-otro-proyecto" }
}
```
El MCP funciona con cualquier proyecto que tenga la estructura SDD
(`specs/_registry/`, `graph/`, `metrics/`, `scripts/sdd-audit.mjs`).

## Integración con Atlassian MCP

El agente puede tener ambos MCPs activos simultáneamente:
- `sdd-mcp` → operaciones de gobernanza SDD (este servidor)
- Atlassian Rovo MCP → Jira, Confluence (`https://mcp.atlassian.com/v1/mcp`)

Flujo ejemplo — ticket Jira → feature SDD:
```
1. [Atlassian MCP] get_issue("PROJ-123")         → datos del ticket
2. [sdd-mcp] sdd_check_collisions(touches)        → sin conflictos
3. [sdd-mcp] sdd_register_feature(...)            → feature registrada
4. [sdd-mcp] sdd_update_domain_graph(...)         → grafo actualizado
5. [Atlassian MCP] update_issue("PROJ-123", ...)  → label sdd-registered
```

Flujo ejemplo — review APROBADO → cierra Jira:
```
1. [sdd-mcp] sdd_write_metrics(..., "review", { resultado: "APROBADO" })
2. [sdd-mcp] sdd_close_feature("001-panel")
3. [Atlassian MCP] transition_issue("PROJ-123", "Done")
4. [Atlassian MCP] add_comment("PROJ-123", "Feature cerrada por sdd-review")
```
