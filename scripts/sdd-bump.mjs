#!/usr/bin/env node
/**
 * sdd-bump — Sube la versión del framework en todas sus superficies, de una.
 *
 * La versión vive en cinco lugares que tienen que decir lo mismo. Hacerlo a mano
 * es el origen del error que el CHECK 8 diagnostica después como "instalación
 * parcial": alguien actualiza .claude/VERSION y se olvida del resto.
 *
 *   .claude/VERSION            fuente única (contracts/framework.md §3)
 *   .claude/skills/VERSION     derivado, tiene que coincidir
 *   CLAUDE.md                  el marcador <!-- SDD:FRAMEWORK BEGIN vX.Y.Z -->
 *   package.json               version — es lo que se publica al registry
 *   .claude/MANIFEST.sha256    se regenera: los tres de arriba son entradas hasheadas
 *
 * Qué significa cada bump (MAJOR / MINOR / PATCH): contracts/framework.md §4.
 * Regla de oro: si un repo instalado tiene que TOCAR un artefacto para volver a
 * pasar el auditor, era MAJOR.
 *
 * Uso:  node scripts/sdd-bump.mjs 1.4.0
 *       node scripts/sdd-bump.mjs minor        calcula el siguiente
 *       node scripts/sdd-bump.mjs major --dry-run
 *
 * Exit 0 = bumpeado · Exit 1 = abortado.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { norm, parseArgs } from "./lib/framework.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const { flags } = parseArgs(argv);
const DRY = flags.has("dry-run");
const target = argv.find((a) => !a.startsWith("--"));

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

if (!target) {
  console.error(`Uso: node scripts/sdd-bump.mjs <1.4.0 | major | minor | patch> [--dry-run]`);
  process.exit(1);
}

// ---------- versión actual ----------
const VERSION_FILE = join(ROOT, ".claude", "VERSION");
if (!existsSync(VERSION_FILE)) {
  console.error(`FAIL  no existe .claude/VERSION — no hay desde dónde bumpear.`);
  process.exit(1);
}
const current = norm(readFileSync(VERSION_FILE, "utf8")).trim();
const cur = current.match(SEMVER);
if (!cur) {
  console.error(`FAIL  .claude/VERSION dice "${current}", que no es un semver MAJOR.MINOR.PATCH.`);
  process.exit(1);
}

// ---------- versión nueva ----------
let next;
if (SEMVER.test(target)) {
  next = target;
} else {
  const [, ma, mi, pa] = cur.map(Number);
  const step = { major: `${ma + 1}.0.0`, minor: `${ma}.${mi + 1}.0`, patch: `${ma}.${mi}.${pa + 1}` };
  next = step[target];
  if (!next) {
    console.error(`FAIL  "${target}" no es ni un semver ni major/minor/patch.`);
    process.exit(1);
  }
}

const [, nma, nmi, npa] = next.match(SEMVER).map(Number);
const [, cma, cmi, cpa] = cur.map(Number);
if (nma * 1e6 + nmi * 1e3 + npa <= cma * 1e6 + cmi * 1e3 + cpa) {
  console.error(`FAIL  ${next} no es posterior a ${current}. Las versiones no retroceden.`);
  process.exit(1);
}

const kind = nma > cma ? "MAJOR" : nmi > cmi ? "MINOR" : "PATCH";
console.log(`sdd-bump · ${current} → ${next}  (${kind})${DRY ? "  (dry-run)" : ""}\n`);

// ---------- las superficies ----------
const touched = [];
const put = (rel, content) => {
  if (!DRY) writeFileSync(join(ROOT, rel), content, "utf8");
  touched.push(rel);
};

put(".claude/VERSION", `${next}\n`);
put(".claude/skills/VERSION", `${next}\n`);

// El marcador del bloque lleva la versión: cambiarlo cambia el hash del BLOCK,
// que es justamente lo que obliga a los repos instalados a reinstalar.
const claudeMd = join(ROOT, "CLAUDE.md");
const md = norm(readFileSync(claudeMd, "utf8"));
const marker = /<!--\s*SDD:FRAMEWORK BEGIN[^>]*-->/;
if (!marker.test(md)) {
  console.error(`FAIL  CLAUDE.md no tiene el marcador SDD:FRAMEWORK BEGIN.`);
  process.exit(1);
}
put("CLAUDE.md", md.replace(marker, `<!-- SDD:FRAMEWORK BEGIN v${next} -->`));

const pkgPath = join(ROOT, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.version = next;
put("package.json", JSON.stringify(pkg, null, 2) + "\n");

// ---------- manifiesto ----------
if (DRY) {
  console.log(`DRY   tocaría: ${touched.join(", ")}`);
  console.log(`DRY   y regeneraría .claude/MANIFEST.sha256`);
  process.exit(0);
}

execFileSync(process.execPath, [join(ROOT, "scripts", "sdd-manifest.mjs")], { stdio: "inherit" });

// ---------- qué falta ----------
console.log(`\nPASS  ${touched.length} superficies actualizadas: ${touched.join(", ")}\n`);
console.log(`      Falta, y no lo puede hacer un script:`);
console.log(`      1. CHANGELOG.md — sección ## ${next}, qué gana el que actualiza`);
if (kind === "MAJOR") {
  console.log(`         Es MAJOR: la nota de migración es obligatoria. Sin ella,`);
  console.log(`         un repo instalado se entera de que rompió cuando ya rompió.`);
}
console.log(`      2. DECISIONS.md — entrada vía /sdd-log si el bump cambia un contrato`);
console.log(`      3. node scripts/sdd-manifest.mjs   ← CHANGELOG.md es entrada EXACT:`);
console.log(`         si lo editás después de este bump, su hash queda viejo`);
console.log(`      4. git tag -a v${next} -m "framework ${next}" && git push --follow-tags`);
