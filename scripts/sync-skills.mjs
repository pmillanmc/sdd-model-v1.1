#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const sourceDir = join(root, ".claude", "skills");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

const homeArg = args.find((a) => a.startsWith("--home="));
const home = homeArg ? homeArg.split("=")[1] : process.env.USERPROFILE || process.env.HOME;
if (!home) {
  console.error("No se pudo resolver HOME/USERPROFILE. Usa --home=<ruta>.");
  process.exit(1);
}

const targetDir = join(home, ".claude", "skills");
if (!existsSync(sourceDir)) {
  console.error(`No existe directorio fuente: ${sourceDir}`);
  process.exit(1);
}

const versionFile = join(sourceDir, "VERSION");
const version = existsSync(versionFile) ? readFileSync(versionFile, "utf8").trim() : "unknown";

const skills = readdirSync(sourceDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

console.log(`Sync de skills SDD v${version}`);
console.log(`source: ${sourceDir}`);
console.log(`target: ${targetDir}`);
console.log(`skills: ${skills.join(", ") || "(ninguno)"}`);

if (dryRun) {
  console.log("[dry-run] Sin cambios aplicados.");
  process.exit(0);
}

mkdirSync(targetDir, { recursive: true });

for (const skill of skills) {
  const src = join(sourceDir, skill);
  const dst = join(targetDir, skill);
  cpSync(src, dst, { recursive: true, force: true });
  console.log(`OK ${skill}`);
}

console.log("Sync completado.");
