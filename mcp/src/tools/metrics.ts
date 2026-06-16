import { existsSync, readFileSync, appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { metricsPath } from "../lib/paths.js";

export type MetricsPhase = "refine" | "validate" | "implement" | "review" | "fix";

export interface MetricsData {
  [key: string]: string | number | null;
}

export function writeMetrics(
  projectRoot: string,
  featureId: string,
  phase: MetricsPhase,
  data: MetricsData
): void {
  const path = metricsPath(projectRoot, featureId);
  mkdirSync(dirname(path), { recursive: true });

  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  const phaseLabel = phase.charAt(0).toUpperCase() + phase.slice(1);

  const lines = [
    `\n## ${phaseLabel} — ${timestamp}`,
    `- command_origin: sdd-${phase}`,
    ...Object.entries(data).map(([k, v]) => `- ${k}: ${v ?? "null"}`),
  ];

  appendFileSync(path, lines.join("\n") + "\n", "utf8");
}

export interface ParsedMetrics {
  feature_id: string;
  phases: Array<{ phase: string; timestamp: string; data: MetricsData }>;
  raw: string;
}

export function getMetrics(
  projectRoot: string,
  featureId: string
): ParsedMetrics | null {
  const path = metricsPath(projectRoot, featureId);
  if (!existsSync(path)) return null;

  const raw = readFileSync(path, "utf8");
  const phases: ParsedMetrics["phases"] = [];

  // Split by ## headers
  const blocks = raw.split(/^## /m).filter(Boolean);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const header = lines[0] ?? "";
    const match = header.match(/^(\w+)\s+—\s+(.+)$/);
    if (!match) continue;

    const phase = match[1].toLowerCase();
    const timestamp = match[2].trim();
    const data: MetricsData = {};

    for (const line of lines.slice(1)) {
      const m = line.match(/^-\s+([\w_]+):\s+(.+)$/);
      if (m) data[m[1]] = m[2].trim();
    }

    phases.push({ phase, timestamp, data });
  }

  return { feature_id: featureId, phases, raw };
}
