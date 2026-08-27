#!/usr/bin/env node
/**
 * sdd-install — Materializa la capa A en un repo de destino.
 *
 * El framework llega a un repo por algún transporte (paquete, submódulo, clone).
 * Ese transporte deja los bytes en algún lado; este script los pone donde el
 * modelo y la CLI de Claude los leen: .claude/, scripts/, contracts/ y las
 * plantillas, todo relativo a la raíz del repo.
 *
 * Hace las tres cosas que contracts/framework.md §2 distingue:
 *   EXACT  copia el archivo entero
 *   BLOCK  reemplaza SOLO el bloque SDD:FRAMEWORK de CLAUDE.md
 *   MERGE  escribe SOLO las claves declaradas del package.json, preserva el resto
 *
 * Se niega a pisar drift: si el destino ya tiene una instalación y algún archivo
 * EXACT fue editado ahí, aborta y lo lista. Pisarlo en silencio borraría la
 * evidencia de que alguien editó capa A en destino.
 *
 * Uso:  node scripts/sdd-install.mjs --root .            instala en el cwd
 *       node scripts/sdd-install.mjs --root ../otro-repo
 *       ... --dry-run          muestra qué haría, no escribe
 *       ... --force            pisa drift (requiere decisión humana)
 *       ... --profile model    incluye demo/** (solo para el repo del modelo)
 *
 * Exit 0 = instalado · Exit 1 = abortado.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractBlock, getPath, hashEntry, injectBlock, norm, parseArgs,
  parseFrameworkFiles, parseManifest, setPath,
} from "./lib/framework.mjs";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { flags, opts } = parseArgs(process.argv.slice(2));
const DEST = opts.root ? resolve(process.cwd(), opts.root) : process.cwd();
const DRY = flags.has("dry-run");
const FORCE = flags.has("force");
const PROFILE = opts.profile ?? "repo";

console.log(`sdd-install · fuente: ${SRC}`);
console.log(`              destino: ${DEST}${DRY ? "  (dry-run)" : ""}`);

if (SRC === DEST) {
  console.error(`\nFAIL  fuente y destino son el mismo árbol. Pasá --root <repo-destino>.`);
  process.exit(1);
}

const LIST = join(SRC, "contracts", "framework-files.txt");
if (!existsSync(LIST)) {
  console.error(`\nFAIL  la fuente no tiene contracts/framework-files.txt — no es un árbol de framework.`);
  process.exit(1);
}

const version = existsSync(join(SRC, ".claude", "VERSION"))
  ? norm(readFileSync(join(SRC, ".claude", "VERSION"), "utf8")).trim()
  : "(sin declarar)";
console.log(`              versión: ${version}\n`);

let entries = parseFrameworkFiles(readFileSync(LIST, "utf8"));
const skippedDemo = PROFILE === "repo" ? entries.filter((e) => e.path.startsWith("demo/")).length : 0;
if (PROFILE === "repo") entries = entries.filter((e) => !e.path.startsWith("demo/"));

// ---------- pre-flight: no pisar drift ----------
const destManifest = join(DEST, ".claude", "MANIFEST.sha256");
if (existsSync(destManifest) && !FORCE) {
  const { entries: known } = parseManifest(readFileSync(destManifest, "utf8"));
  const drifted = [];
  for (const e of known) {
    if (e.type === "MERGE") continue; // el repo es dueño del resto del package.json
    const { sha, error } = hashEntry(DEST, e);
    if (error) continue;             // ausente o roto: reinstalar lo arregla
    if (sha !== e.sha) drifted.push(e.path);
  }
  if (drifted.length) {
    console.error(`FAIL  el destino tiene ${drifted.length} archivo(s) de capa A editados localmente:\n`);
    for (const p of drifted) console.error(`      ${p}`);
    console.error(`
      Eso es drift: la capa A no se edita en destino. Los cambios se hacen
      upstream y se redistribuyen (contracts/framework.md §2.1).

      Guardá el diff antes de perderlo:  git -C "${DEST}" diff -- ${drifted[0]}
      Y si ya decidiste descartarlo:     --force`);
    process.exit(1);
  }
}

// ---------- ejecución ----------
const done = { EXACT: 0, BLOCK: 0, MERGE: 0, created: [] };
const write = (abs, content) => {
  if (DRY) return;
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, "utf8");
};

// EXACT
for (const e of entries.filter((x) => x.type === "EXACT")) {
  const from = join(SRC, e.path);
  if (!existsSync(from)) {
    console.error(`FAIL  la fuente declara ${e.path} pero el archivo no está.`);
    process.exit(1);
  }
  const to = join(DEST, e.path);
  if (!existsSync(to)) done.created.push(e.path);
  write(to, norm(readFileSync(from, "utf8")));
  done.EXACT++;
}

// BLOCK
for (const e of entries.filter((x) => x.type === "BLOCK")) {
  const from = join(SRC, e.path);
  const src = extractBlock(readFileSync(from, "utf8"));
  if (!src.ok) {
    console.error(`FAIL  la fuente ${e.path} no tiene un bloque válido: ${src.reason}`);
    process.exit(1);
  }
  const to = join(DEST, e.path);
  const current = existsSync(to) ? readFileSync(to, "utf8") : "";
  if (!existsSync(to)) done.created.push(e.path);
  try {
    write(to, injectBlock(current, src.block));
  } catch (err) {
    console.error(`FAIL  ${e.path}: ${err.message}`);
    process.exit(1);
  }
  done.BLOCK++;
}

// MERGE
const merges = entries.filter((x) => x.type === "MERGE");
if (merges.length) {
  const byFile = merges.reduce((acc, e) => ((acc[e.path] ??= []).push(e), acc), {});
  for (const [relPath, list] of Object.entries(byFile)) {
    const from = join(SRC, relPath);
    const to = join(DEST, relPath);
    const source = JSON.parse(readFileSync(from, "utf8"));

    let target;
    if (existsSync(to)) {
      target = JSON.parse(readFileSync(to, "utf8"));
    } else {
      target = { name: basename(DEST), private: true, type: "module", scripts: {}, devDependencies: {} };
      done.created.push(relPath);
    }

    for (const e of list) {
      const value = getPath(source, e.key);
      if (value === undefined) {
        console.error(`FAIL  la fuente ${relPath} no tiene la clave "${e.key}" que declara la lista canónica.`);
        process.exit(1);
      }
      setPath(target, e.key, value);
      done.MERGE++;
    }
    write(to, JSON.stringify(target, null, 2) + "\n");
  }
}

// El manifiesto viaja con la instalación: es lo que sdd-verify lee después,
// sin necesitar la fuente ni la red.
const srcManifest = join(SRC, ".claude", "MANIFEST.sha256");
let manifestCopied = false;
if (existsSync(srcManifest)) {
  if (!DRY) {
    mkdirSync(join(DEST, ".claude"), { recursive: true });
    copyFileSync(srcManifest, destManifest);
  }
  manifestCopied = true;
}

// ---------- reporte ----------
console.log(`${DRY ? "DRY " : "PASS"}  EXACT ${done.EXACT} · BLOCK ${done.BLOCK} · MERGE ${done.MERGE} clave(s)`);
if (skippedDemo) console.log(`      ${skippedDemo} entrada(s) demo/** omitidas (--profile repo)`);
if (done.created.length) {
  console.log(`      creados: ${done.created.slice(0, 6).join(", ")}${done.created.length > 6 ? ` y ${done.created.length - 6} más` : ""}`);
}
if (!manifestCopied) {
  console.log(`WARN  la fuente no trae .claude/MANIFEST.sha256 — sdd-verify no va a poder`);
  console.log(`      probar integridad. Generalo upstream con: pnpm sdd:manifest`);
}
if (!DRY) console.log(`\n      Siguiente: node scripts/sdd-verify.mjs --root "${DEST}"`);
