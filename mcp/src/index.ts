#!/usr/bin/env node
/**
 * sdd-mcp — MCP server for Spec-Driven Development
 *
 * Exposes deterministic tools for registry, audit, graph and metrics
 * so agents never manipulate governance files directly.
 *
 * Transport: stdio (local)
 *
 * Configuration:
 *   SDD_PROJECT_ROOT — path to the project using the SDD model
 *                      Defaults to the parent folder of this mcp/ directory.
 *
 * Usage in .vscode/mcp.json or claude_desktop_config.json:
 *   {
 *     "servers": {
 *       "sdd": {
 *         "type": "stdio",
 *         "command": "node",
 *         "args": ["/abs/path/to/sdd-model/mcp/dist/index.js"],
 *         "env": { "SDD_PROJECT_ROOT": "/abs/path/to/your-project" }
 *       }
 *     }
 *   }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { getProjectRoot } from "./lib/paths.js";
import { runAudit } from "./tools/audit.js";
import {
  listFeatures,
  getFeature,
  checkCollisionsForTouches,
  registerFeature,
  closeFeature,
  RegisterFeatureInput,
} from "./tools/registry.js";
import {
  getDomainFiles,
  listDomains,
  updateDomainGraph,
} from "./tools/graph.js";
import { writeMetrics, getMetrics } from "./tools/metrics.js";

const server = new McpServer({
  name: "sdd-mcp",
  version: "0.1.0",
});

const root = getProjectRoot();

// ─────────────────────────────────────────────
// AUDIT
// ─────────────────────────────────────────────

server.tool(
  "sdd_run_audit",
  "Runs the deterministic SDD audit (sdd-audit.mjs) and returns structured results. " +
    "Returns fails, warns and passes. Agents MUST call this instead of re-checking governance files manually.",
  {},
  async () => {
    const result = await runAudit(root);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ─────────────────────────────────────────────
// REGISTRY — Read
// ─────────────────────────────────────────────

server.tool(
  "sdd_list_features",
  "Lists all features in the registry, optionally filtered by status (OPEN, CLOSED, all).",
  {
    status: z
      .enum(["OPEN", "CLOSED", "all"])
      .optional()
      .describe("Filter by status. Defaults to 'all'."),
  },
  async ({ status }) => {
    const features = listFeatures(root, status);
    return {
      content: [{ type: "text", text: JSON.stringify(features, null, 2) }],
    };
  }
);

server.tool(
  "sdd_get_feature",
  "Returns a single feature by id from the registry.",
  {
    id: z.string().describe("The feature_id (e.g. '001-panel-proyectos')"),
  },
  async ({ id }) => {
    const feature = getFeature(root, id);
    if (!feature) {
      return {
        content: [{ type: "text", text: `Feature "${id}" no encontrada en el registro.` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(feature, null, 2) }],
    };
  }
);

server.tool(
  "sdd_check_collisions",
  "Checks if the given touches overlap with any OPEN feature in the registry. " +
    "Call this BEFORE registering a new feature or fix. Returns an array of collisions (empty = no conflicts).",
  {
    touches: z
      .array(z.string())
      .describe("Array of file/folder paths the new feature/fix intends to touch."),
    exclude_id: z
      .string()
      .optional()
      .describe("Feature id to exclude from the collision check (use when updating an existing feature)."),
  },
  async ({ touches, exclude_id }) => {
    const collisions = checkCollisionsForTouches(root, touches, exclude_id);
    return {
      content: [{ type: "text", text: JSON.stringify(collisions, null, 2) }],
    };
  }
);

// ─────────────────────────────────────────────
// REGISTRY — Write
// ─────────────────────────────────────────────

server.tool(
  "sdd_register_feature",
  "Registers a new feature or fix in specs/_registry/features.yaml and creates feature.status.md. " +
    "Also checks for collisions automatically. Throws if the id already exists.",
  {
    id: z.string().regex(/^[a-z0-9-]+$/).describe("kebab-case id, e.g. '002-auth'"),
    type: z.enum(["feature", "fix"]).default("feature"),
    domain: z.string().describe("Domain name from graph/domain.yaml"),
    owner: z.string().nullable().optional(),
    sprint: z.string().nullable().optional(),
    touches: z.array(z.string()).default([]).describe("Paths this feature/fix will modify"),
    jira_ticket: z.string().nullable().optional().describe("Jira ticket key, e.g. 'PROJ-123'"),
  },
  async (input) => {
    try {
      const { feature, collisions } = registerFeature(root, input as RegisterFeatureInput);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ feature, collisions }, null, 2),
          },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: String(e) }],
        isError: true,
      };
    }
  }
);

server.tool(
  "sdd_close_feature",
  "Marks a feature as CLOSED in the registry and updates feature.status.md. " +
    "Only call after sdd-review returns APROBADO.",
  {
    id: z.string().describe("The feature_id to close"),
  },
  async ({ id }) => {
    try {
      const feature = closeFeature(root, id);
      return {
        content: [{ type: "text", text: JSON.stringify(feature, null, 2) }],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: String(e) }],
        isError: true,
      };
    }
  }
);

// ─────────────────────────────────────────────
// GRAPH
// ─────────────────────────────────────────────

server.tool(
  "sdd_list_domains",
  "Returns all domain names from graph/domain.yaml. Use to identify which domain a task belongs to.",
  {},
  async () => {
    const domains = listDomains(root);
    return {
      content: [{ type: "text", text: JSON.stringify(domains, null, 2) }],
    };
  }
);

server.tool(
  "sdd_get_domain_files",
  "Returns the exact file paths for a domain from graph/domain.yaml. " +
    "Agents MUST call this before reading code — only read the files returned here, not the full codebase.",
  {
    domain: z.string().describe("Domain name, e.g. 'auth', 'projects', 'tasks'"),
  },
  async ({ domain }) => {
    const files = getDomainFiles(root, domain);
    return {
      content: [{ type: "text", text: JSON.stringify(files, null, 2) }],
    };
  }
);

server.tool(
  "sdd_update_domain_graph",
  "Creates or updates a domain entry in graph/domain.yaml with the files touched by a feature. " +
    "Call after registering a feature to keep the graph current.",
  {
    domain: z.string(),
    description: z.string().optional(),
    feature_id: z.string(),
    files_map: z
      .record(z.array(z.string()))
      .describe(
        "Map of file type → paths. Keys: types, services, components, tests, stores, etc."
      ),
    depends_on: z.array(z.string()).optional(),
  },
  async ({ domain, description, feature_id, files_map, depends_on }) => {
    const graph = updateDomainGraph(root, {
      domain,
      description,
      feature_id,
      files_map,
      depends_on,
    });
    return {
      content: [{ type: "text", text: JSON.stringify(graph.domains[domain], null, 2) }],
    };
  }
);

// ─────────────────────────────────────────────
// METRICS
// ─────────────────────────────────────────────

server.tool(
  "sdd_write_metrics",
  "Appends a metrics block to metrics/[feature_id]-metrics.md. " +
    "Call at the end of each sdd command (refine, validate, implement, review, fix).",
  {
    feature_id: z.string(),
    phase: z.enum(["refine", "validate", "implement", "review", "fix"]),
    data: z
      .record(z.union([z.string(), z.number(), z.null()]))
      .describe("Key-value pairs for the metrics block"),
  },
  async ({ feature_id, phase, data }) => {
    writeMetrics(root, feature_id, phase, data);
    return {
      content: [{ type: "text", text: `Métricas escritas en metrics/${feature_id}-metrics.md (fase: ${phase})` }],
    };
  }
);

server.tool(
  "sdd_get_metrics",
  "Reads and parses metrics/[feature_id]-metrics.md. Returns structured phase data.",
  {
    feature_id: z.string(),
  },
  async ({ feature_id }) => {
    const metrics = getMetrics(root, feature_id);
    if (!metrics) {
      return {
        content: [{ type: "text", text: `No existe metrics/${feature_id}-metrics.md` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(metrics, null, 2) }],
    };
  }
);

// ─────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
