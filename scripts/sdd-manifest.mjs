#!/usr/bin/env node
/**
 * sdd-manifest — Genera .claude/MANIFEST.sha256 desde contracts/framework-files.txt.
 *
 * Corre UPSTREAM, en el repo del modelo, al preparar un release. El manifiesto
 * viaja con la distribución: es lo que después permite probar, en cualquier repo
 * instalado y sin red, que los bytes que hay son los de esa versión.
 *
 * Opera sobre FRAMEWORK_ROOT (el árbol fuente donde vive este script), no sobre
 * un DATA_ROOT: el manifiesto describe al framework, no al codebase auditado.
 * Ver contracts/paths.md §1.
 *
 * Uso:  pnpm sdd:manifest
 *       node scripts/sdd-manifest.mjs --check    no escribe; falla si está desactualizado
 *
 * Exit 0 = manifiesto escrito (o al día con --check) · Exit 1 = no se pudo generar.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  hashEntry, norm, parseArgs, parseFrameworkFiles, serializeManifest,
} from "./lib/framework.mjs";

const FRAMEWORK_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { flags } = parseArgs(process.argv.slice(2));
const CHECK_ONLY = flags.has("check");

const LIST = join(FRAMEWORK_ROOT, "contracts", "framework-files.txt");
const VERSION_FILE = join(FRAMEWORK_ROOT, ".claude", "VERSION");
const OUT = join(FRAMEWORK_ROOT, ".claude", "MANIFEST.sha256");

console.log(`sdd-manifest · framework_root: ${FRAMEWORK_ROOT}`);

if (!existsSync(LIST)) {
  console.error(`FAIL  no existe ${LIST} — sin lista canónica no hay manifiesto.`);
  process.exit(1);
}
if (!existsSync(VERSION_FILE)) {
  console.error(`FAIL  no existe .claude/VERSION — el manifiesto necesita declarar qué versión describe.`);
  process.exit(1);
}

const version = norm(readFileSync(VERSION_FILE, "utf8")).trim();
const entries = parseFrameworkFiles(readFileSync(LIST, "utf8"));

const hashed = [];
const problems = [];

for (const entry of entries) {
  const { sha, error } = hashEntry(FRAMEWORK_ROOT, entry);
  if (error) {
    problems.push(`${entry.type.padEnd(5)} ${entry.path}${entry.key ? ` [${entry.key}]` : ""} — ${error}`);
    continue;
  }
  hashed.push({ ...entry, sha });
}

if (problems.length) {
  console.error(`\nFAIL  ${problems.length} entrada(s) de la lista canónica no se pudieron hashear:\n`);
  for (const p of problems) console.error(`      ${p}`);
  console.error(`\n      El manifiesto no se escribió. Corregí la lista o los archivos y volvé a correr.`);
  process.exit(1);
}

const content = serializeManifest({ version, entries: hashed });

if (CHECK_ONLY) {
  const current = existsSync(OUT) ? norm(readFileSync(OUT, "utf8")) : null;
  if (current === norm(content)) {
    console.log(`PASS  manifiesto al día · ${hashed.length} entradas · versión ${version}`);
    process.exit(0);
  }
  console.error(`FAIL  el manifiesto está desactualizado. Corré: pnpm sdd:manifest`);
  process.exit(1);
}

writeFileSync(OUT, content, "utf8");

const byType = hashed.reduce((acc, e) => ((acc[e.type] = (acc[e.type] ?? 0) + 1), acc), {});
console.log(`PASS  .claude/MANIFEST.sha256 escrito · versión ${version}`);
console.log(
  `      ${hashed.length} entradas · ` +
  Object.entries(byType).map(([t, n]) => `${t} ${n}`).join(" · ")
);
