import { resolve } from "node:path";

/**
 * Resolves the project root for the SDD model.
 *
 * Priority:
 * 1. SDD_PROJECT_ROOT env var (allows using the MCP with any project)
 * 2. Default: parent directory of the mcp/ folder (i.e. the sdd-model root itself)
 *
 * When exporting the MCP to another project, set SDD_PROJECT_ROOT to that
 * project's root in the MCP config (see .vscode/mcp.json or claude_desktop_config.json).
 */
export function getProjectRoot(): string {
  if (process.env.SDD_PROJECT_ROOT) {
    return resolve(process.env.SDD_PROJECT_ROOT);
  }
  // Default: two levels up from dist/lib/paths.js → mcp/src/lib → mcp/ → project root
  return resolve(new URL("../../..", import.meta.url).pathname);
}

export function registryPath(root: string): string {
  return resolve(root, "specs/_registry/features.yaml");
}

export function graphPath(root: string): string {
  return resolve(root, "graph/domain.yaml");
}

export function metricsPath(root: string, featureId: string): string {
  return resolve(root, `metrics/${featureId}-metrics.md`);
}

export function sprintsDir(root: string): string {
  return resolve(root, "specs/_registry/sprints");
}

export function auditScriptPath(root: string): string {
  return resolve(root, "scripts/sdd-audit.mjs");
}
