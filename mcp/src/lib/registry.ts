import { existsSync, readFileSync, writeFileSync } from "node:fs";
import YAML from "yaml";
import { z } from "zod";

// ---------- Schemas ----------

export const FeatureSchema = z.object({
  id: z.string(),
  type: z.enum(["feature", "fix"]).default("feature"),
  status: z.enum(["OPEN", "CLOSED"]),
  domain: z.string(),
  owner: z.string().nullable().optional(),
  sprint: z.string().nullable().optional(),
  created: z.string(),
  closed: z.string().nullable().optional(),
  touches: z.array(z.string()).default([]),
  decisions: z.array(z.string()).default([]),
  jira_ticket: z.string().nullable().optional(),
});

export type Feature = z.infer<typeof FeatureSchema>;

export const RegistrySchema = z.object({
  features: z.array(FeatureSchema).default([]),
});

// ---------- Helpers ----------

export function loadRegistry(path: string): Feature[] {
  if (!existsSync(path)) return [];
  try {
    const raw = YAML.parse(readFileSync(path, "utf8")) ?? {};
    const parsed = RegistrySchema.safeParse(raw);
    if (!parsed.success) return [];
    return parsed.data.features;
  } catch {
    return [];
  }
}

export function saveRegistry(path: string, features: Feature[]): void {
  const content = YAML.stringify({ features });
  writeFileSync(path, content, "utf8");
}

/** Returns true if two touch paths overlap (exact match or one is prefix of the other) */
export function pathsOverlap(a: string, b: string): boolean {
  const na = a.replace(/\\/g, "/").replace(/\/+$/, "");
  const nb = b.replace(/\\/g, "/").replace(/\/+$/, "");
  return na === nb || na.startsWith(nb + "/") || nb.startsWith(na + "/");
}

export interface Collision {
  feature_id: string;
  owner: string | null;
  shared_touches: string[];
  same_owner: boolean;
}

export function checkCollisions(
  touches: string[],
  features: Feature[],
  excludeId?: string
): Collision[] {
  const open = features.filter(
    (f) => f.status === "OPEN" && f.id !== excludeId
  );
  const collisions: Collision[] = [];
  for (const f of open) {
    const shared = touches.filter((t) =>
      (f.touches ?? []).some((ft) => pathsOverlap(t, ft))
    );
    if (shared.length) {
      collisions.push({
        feature_id: f.id,
        owner: f.owner ?? null,
        shared_touches: shared,
        same_owner: false, // caller resolves with requester's owner
      });
    }
  }
  return collisions;
}
