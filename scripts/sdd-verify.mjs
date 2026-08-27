#!/usr/bin/env node
/**
 * sdd-verify — Verifica la integridad de una instalación del framework.
 *
 * Contesta UNA pregunta: ¿los bytes de capa A que hay en este repo son los de
 * la versión que dice tener? Compara el árbol contra el .claude/MANIFEST.sha256
 * que vino con la instalación.
 *
 * No necesita la fuente ni la red: por eso corre en el CI de cualquier repo
 * consumidor. Las otras dos preguntas tienen otros dueños —la consistencia
 * interna la contesta `pnpm audit:sdd`, y si el repo quedó atrás respecto de
 * upstream lo contesta el gate de versión, que sí sale a la red.
 *
 * Uso:  node scripts/sdd-verify.mjs --root .
 *       ... --quiet     solo el resumen
 *
 * Exit 0 = íntegra (puede haber WARN) · Exit 1 = al menos un FAIL.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { extractBlock, hashEntry, isOptional, norm, parseArgs, parseManifest } from "./lib/framework.mjs";

const { flags, opts } = parseArgs(process.argv.slice(2));
const ROOT = opts.root ? resolve(process.cwd(), opts.root) : process.cwd();
const QUIET = flags.has("quiet");

const fails = [];
const warns = [];

const readTrim = (p) => (existsSync(p) ? norm(readFileSync(p, "utf8")).trim() : null);

const installed = readTrim(join(ROOT, ".claude", "VERSION"));
console.log(`sdd-verify · root: ${ROOT}`);
console.log(`             framework instalado: ${installed ?? "(sin declarar)"}\n`);

// ---------- el manifiesto ----------
const manifestPath = join(ROOT, ".claude", "MANIFEST.sha256");
if (!existsSync(manifestPath)) {
  console.error(`FAIL  no hay .claude/MANIFEST.sha256 en este árbol.`);
  console.error(`      Sin manifiesto no se puede probar integridad: una edición dentro`);
  console.error(`      del bloque SDD:FRAMEWORK de CLAUDE.md no la detectaría nada.`);
  console.error(`      Reinstalá desde una fuente que lo traiga.`);
  process.exit(1);
}

const { version: declared, entries } = parseManifest(readFileSync(manifestPath, "utf8"));
if (!entries.length) {
  console.error(`FAIL  el manifiesto no tiene entradas — está vacío o corrupto.`);
  process.exit(1);
}

// ---------- 1. integridad, entrada por entrada ----------
let ok = 0;
let skipped = 0;
for (const e of entries) {
  const { sha, error } = hashEntry(ROOT, e);
  const label = `${e.path}${e.key ? ` [${e.key}]` : ""}`;
  if (error) {
    // El fixture de demo no se instala en repos de código: ausente no es faltante.
    if (isOptional(e.path) && error === "el archivo no existe") { skipped++; continue; }
    fails.push(`${label} — ${error}`);
    continue;
  }
  if (sha !== e.sha) {
    fails.push(
      e.type === "BLOCK"
        ? `${label} — el bloque SDD:FRAMEWORK fue editado en destino`
        : e.type === "MERGE"
          ? `${label} — la clave tiene un valor distinto al del framework`
          : `${label} — el archivo fue editado en destino (drift)`
    );
    continue;
  }
  ok++;
}

// ---------- 2. coherencia de la versión declarada ----------
if (installed && declared && installed !== declared) {
  fails.push(
    `.claude/VERSION dice ${installed} pero el manifiesto describe ${declared} — instalación mezclada`
  );
}
if (!installed) warns.push(`.claude/VERSION no está — no se puede saber qué versión corre este repo`);

const skillsVersion = readTrim(join(ROOT, ".claude", "skills", "VERSION"));
if (installed && skillsVersion && installed !== skillsVersion) {
  fails.push(
    `.claude/VERSION (${installed}) ≠ .claude/skills/VERSION (${skillsVersion}) — instalación parcial`
  );
}

// ---------- 3. marcadores del bloque ----------
const claudeMd = join(ROOT, "CLAUDE.md");
if (existsSync(claudeMd)) {
  const r = extractBlock(readFileSync(claudeMd, "utf8"));
  if (!r.ok) fails.push(`CLAUDE.md — ${r.reason}`);
} else {
  warns.push(`no hay CLAUDE.md en la raíz — el agente no va a cargar las reglas del modelo`);
}

// ---------- reporte ----------
if (!QUIET && fails.length) {
  console.log(`FAIL  ${fails.length} problema(s) de integridad:\n`);
  for (const f of fails) console.log(`      ${f}`);
  console.log("");
}
if (!QUIET && warns.length) {
  for (const w of warns) console.log(`WARN  ${w}`);
  console.log("");
}

console.log(
  `${fails.length ? "FAIL" : "PASS"}  ${ok}/${entries.length - skipped} entradas íntegras` +
  `${skipped ? ` · ${skipped} opcionales ausentes` : ""}` +
  `${warns.length ? ` · ${warns.length} warn` : ""}` +
  `${declared ? ` · versión ${declared}` : ""}`
);

if (fails.length) {
  console.log(`
      La capa A no se edita en destino. Un cambio local es drift: se hace
      upstream, se bumpea la versión y se redistribuye (contracts/framework.md §2.1).
      Para volver al estado limpio, reinstalá el framework.`);
  process.exit(1);
}
