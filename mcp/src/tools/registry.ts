import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import {
  checkCollisions,
  Collision,
  Feature,
  loadRegistry,
  pathsOverlap,
  saveRegistry,
} from "../lib/registry.js";
import { registryPath } from "../lib/paths.js";

// ---------- Read tools ----------

export function listFeatures(
  projectRoot: string,
  status?: "OPEN" | "CLOSED" | "all"
): Feature[] {
  const features = loadRegistry(registryPath(projectRoot));
  if (!status || status === "all") return features;
  return features.filter((f) => f.status === status);
}

export function getFeature(
  projectRoot: string,
  id: string
): Feature | null {
  const features = loadRegistry(registryPath(projectRoot));
  return features.find((f) => f.id === id) ?? null;
}

export function checkCollisionsForTouches(
  projectRoot: string,
  touches: string[],
  excludeId?: string
): Collision[] {
  const features = loadRegistry(registryPath(projectRoot));
  return checkCollisions(touches, features, excludeId);
}

// ---------- Write tools ----------

export const RegisterFeatureInput = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "id debe ser kebab-case"),
  type: z.enum(["feature", "fix"]).default("feature"),
  domain: z.string().min(1),
  owner: z.string().nullable().optional(),
  sprint: z.string().nullable().optional(),
  touches: z.array(z.string()).default([]),
  jira_ticket: z.string().nullable().optional(),
});

export type RegisterFeatureInput = z.infer<typeof RegisterFeatureInput>;

export function registerFeature(
  projectRoot: string,
  input: RegisterFeatureInput
): { feature: Feature; collisions: Collision[] } {
  const regPath = registryPath(projectRoot);
  const features = loadRegistry(regPath);

  // Check for duplicate id
  if (features.some((f) => f.id === input.id)) {
    throw new Error(`Feature "${input.id}" ya existe en el registro`);
  }

  const collisions = checkCollisions(input.touches, features);

  const feature: Feature = {
    id: input.id,
    type: input.type ?? "feature",
    status: "OPEN",
    domain: input.domain,
    owner: input.owner ?? null,
    sprint: input.sprint ?? null,
    created: new Date().toISOString().slice(0, 10),
    touches: input.touches,
    decisions: [],
    jira_ticket: input.jira_ticket ?? null,
  };

  features.push(feature);
  ensureDir(regPath);
  saveRegistry(regPath, features);

  // Also create feature.status.md
  const statusPath = resolve(projectRoot, `specs/${input.id}/feature.status.md`);
  ensureDir(statusPath);
  writeFileSync(
    statusPath,
    `status: OPEN\nfeature_id: ${input.id}\ncreated: ${feature.created}\nlast_command: sdd-register\n`,
    "utf8"
  );

  return { feature, collisions };
}

export function closeFeature(
  projectRoot: string,
  id: string
): Feature {
  const regPath = registryPath(projectRoot);
  const features = loadRegistry(regPath);

  const idx = features.findIndex((f) => f.id === id);
  if (idx === -1) throw new Error(`Feature "${id}" no encontrada en el registro`);

  const closed = new Date().toISOString().slice(0, 10);
  features[idx] = { ...features[idx], status: "CLOSED", closed };
  saveRegistry(regPath, features);

  // Update feature.status.md
  const statusPath = resolve(projectRoot, `specs/${id}/feature.status.md`);
  if (existsSync(statusPath)) {
    let content = readFileSync(statusPath, "utf8");
    content = content
      .replace(/^status:.*$/m, "status: CLOSED")
      .replace(/^last_command:.*$/m, "last_command: sdd-close");
    if (!/^closed:/m.test(content)) content += `closed: ${closed}\n`;
    writeFileSync(statusPath, content, "utf8");
  }

  return features[idx];
}

function ensureDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}
