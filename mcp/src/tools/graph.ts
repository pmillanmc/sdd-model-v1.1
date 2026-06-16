import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import YAML from "yaml";
import { graphPath } from "../lib/paths.js";

export interface DomainEntry {
  description?: string;
  entities?: string[];
  services?: string[];
  components?: string[];
  storage?: string;
  features?: string[];
  depends_on?: string[];
  files?: Record<string, string[]>;
}

export interface DomainGraph {
  meta: {
    generated_by: string;
    commit: string | null;
    updated: string;
  };
  domains: Record<string, DomainEntry>;
}

function loadGraph(projectRoot: string): DomainGraph {
  const path = graphPath(projectRoot);
  if (!existsSync(path)) {
    return {
      meta: { generated_by: "sdd-mcp", commit: null, updated: "" },
      domains: {},
    };
  }
  try {
    return YAML.parse(readFileSync(path, "utf8")) ?? { meta: {}, domains: {} };
  } catch {
    return { meta: { generated_by: "sdd-mcp", commit: null, updated: "" }, domains: {} };
  }
}

function saveGraph(projectRoot: string, graph: DomainGraph): void {
  const path = graphPath(projectRoot);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, YAML.stringify(graph), "utf8");
}

export function getDomainFiles(
  projectRoot: string,
  domain: string
): Record<string, string[]> {
  const graph = loadGraph(projectRoot);
  return graph.domains[domain]?.files ?? {};
}

export function listDomains(projectRoot: string): string[] {
  const graph = loadGraph(projectRoot);
  return Object.keys(graph.domains);
}

export interface UpdateDomainInput {
  domain: string;
  description?: string;
  files_map: Record<string, string[]>;
  feature_id: string;
  depends_on?: string[];
}

export function updateDomainGraph(
  projectRoot: string,
  input: UpdateDomainInput
): DomainGraph {
  const graph = loadGraph(projectRoot);
  const today = new Date().toISOString().slice(0, 10);

  const existing = graph.domains[input.domain] ?? {};

  // Merge files: add new entries, avoid duplicates
  const mergedFiles: Record<string, string[]> = { ...existing.files };
  for (const [key, paths] of Object.entries(input.files_map)) {
    const current = mergedFiles[key] ?? [];
    mergedFiles[key] = Array.from(new Set([...current, ...paths]));
  }

  // Merge features array
  const features = Array.from(
    new Set([...(existing.features ?? []), input.feature_id])
  );

  graph.domains[input.domain] = {
    ...existing,
    description: input.description ?? existing.description,
    features,
    depends_on: input.depends_on ?? existing.depends_on ?? [],
    files: mergedFiles,
  };

  graph.meta.updated = today;
  graph.meta.generated_by = "sdd-mcp";

  saveGraph(projectRoot, graph);
  return graph;
}
