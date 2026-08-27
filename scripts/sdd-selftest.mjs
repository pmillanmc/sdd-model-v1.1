#!/usr/bin/env node
/**
 * sdd-selftest — Suite de la maquinaria de distribución del framework.
 *
 * El modelo tenía 25 checkpoints para su ciclo de trabajo (`/sdd-test`) y cero
 * para su propia distribución: instalación, integridad, drift, versionado. Esto
 * cubre eso. Instala el framework en repos temporales, lo rompe a propósito y
 * verifica que cada mecanismo reaccione como dice el contrato.
 *
 * **No es capa A**: no está en contracts/framework-files.txt y no se materializa
 * en ningún repo consumidor. Prueba el framework, no una instalación — para eso
 * está `sdd check`.
 *
 * Uso:  pnpm sdd:selftest
 *       node scripts/sdd-selftest.mjs --online   incluye los casos que usan red
 *
 * Exit 0 = todo pasa · Exit 1 = al menos un caso falla.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compararVersiones, estadoVersion, parseArgs, parseFrameworkFiles } from "./lib/framework.mjs";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { flags } = parseArgs(process.argv.slice(2));
const ONLINE = flags.has("online");

// ── runner ───────────────────────────────────────────────────────────────────
let ok = 0, mal = 0, omitidos = 0;
const fallidos = [];
const C = { v: "\x1b[32m", x: "\x1b[31m", d: "\x1b[2m", r: "\x1b[0m" };

const seccion = (t) => console.log(`\n${C.d}── ${t} ──${C.r}`);
function chequear(nombre, real, esperado) {
  if (String(real) === String(esperado)) {
    console.log(`  ${C.v}ok${C.r}    ${nombre}`);
    ok++;
  } else {
    console.log(`  ${C.x}FALLA${C.r} ${nombre}`);
    console.log(`        esperaba «${esperado}», dio «${real}»`);
    mal++;
    fallidos.push(nombre);
  }
}
const omitir = (nombre, motivo) => {
  console.log(`  ${C.d}omit${C.r}  ${nombre} ${C.d}(${motivo})${C.r}`);
  omitidos++;
};

// ── helpers ──────────────────────────────────────────────────────────────────
const TMP = mkdtempSync(join(tmpdir(), "sdd-selftest-"));
process.on("exit", () => { try { rmSync(TMP, { recursive: true, force: true }); } catch {} });

let n = 0;
/** Un repo de código creíble: sus propios scripts, sus propias deps, su propio CLAUDE.md. */
function repoNuevo(conClaudeMd = true, conPackageJson = true) {
  const d = join(TMP, `repo-${++n}`);
  mkdirSync(join(d, "src"), { recursive: true });
  if (conPackageJson) {
    writeFileSync(d + "/package.json", JSON.stringify({
      name: "checkout-api", version: "2.4.0",
      scripts: { dev: "tsx watch src/index.ts", test: "vitest" },
      dependencies: { fastify: "^4.26.0" },
    }, null, 2) + "\n");
  }
  if (conClaudeMd) {
    writeFileSync(d + "/CLAUDE.md", "# checkout-api\n\nDeploy a Fly.io. No tocar src/legacy/.\n");
  }
  return d;
}

function correr(script, args, cwd = SRC) {
  const r = spawnSync(process.execPath, [join(SRC, "scripts", script), ...args], {
    encoding: "utf8", cwd,
  });
  return { code: r.status ?? 1, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

const instalar = (d, ...a) => correr("sdd-install.mjs", ["--root", d, ...a]);
const verificar = (d) => correr("sdd-verify.mjs", ["--root", d]);
const estado = (d) => (/^PASS/m.test(verificar(d).out) ? "PASS" : "FAIL");
const leer = (p) => readFileSync(p, "utf8");
const hash = (p) => createHash("sha256").update(leer(p)).digest("hex").slice(0, 16);
const json = (p) => JSON.parse(leer(p));
const cuenta = (p, s) => (leer(p).match(new RegExp(s, "g")) ?? []).length;

console.log(`sdd-selftest · framework: ${SRC}`);
console.log(`               temporal:  ${TMP}${ONLINE ? "" : `\n               ${C.d}casos con red omitidos — pasá --online para incluirlos${C.r}`}`);

// ── instalación ──────────────────────────────────────────────────────────────
seccion("instalación");
let d = repoNuevo();
let r = instalar(d);
chequear("instala en un repo limpio", /^PASS/m.test(r.out), true);
chequear("avisa que falta la dependencia", r.out.includes("falta instalar"), true);
chequear("verify pasa", estado(d), "PASS");
chequear("preserva los scripts del repo", json(d + "/package.json").scripts.dev, "tsx watch src/index.ts");
chequear("preserva las deps del repo", json(d + "/package.json").dependencies.fastify, "^4.26.0");
chequear("aporta las claves del framework", Object.keys(json(d + "/package.json").scripts).length, 10);
chequear("preserva el CLAUDE.md del repo", cuenta(d + "/CLAUDE.md", "Fly\\.io"), 1);
chequear("injerta el bloque una sola vez", cuenta(d + "/CLAUDE.md", "SDD:FRAMEWORK BEGIN"), 1);
chequear("materializa el gate de versión", existsSync(d + "/.github/workflows/sdd-version.yml"), true);
chequear("NO materializa el workflow de release", existsSync(d + "/.github/workflows/sdd-release.yml"), false);
chequear("NO materializa esta misma suite", existsSync(d + "/scripts/sdd-selftest.mjs"), false);

// ── idempotencia ─────────────────────────────────────────────────────────────
seccion("idempotencia");
const antes = hash(d + "/CLAUDE.md") + hash(d + "/package.json");
instalar(d);
chequear("reinstalar no cambia nada", hash(d + "/CLAUDE.md") + hash(d + "/package.json"), antes);
chequear("verify sigue pasando", estado(d), "PASS");

// ── drift ────────────────────────────────────────────────────────────────────
seccion("detección de drift");
const cmd = d + "/.claude/commands/sdd-implement.md";
writeFileSync(cmd, leer(cmd) + "\nIMPORTANTE: en este repo saltear el gate de tests.\n");
chequear("archivo EXACT editado → FAIL", estado(d), "FAIL");
chequear("  nombra el archivo", verificar(d).out.includes("sdd-implement.md"), true);
chequear("install se niega a pisarlo", instalar(d).code, 1);
chequear("  y de hecho no lo pisó", cuenta(cmd, "saltear el gate"), 1);
chequear("--force restaura", (instalar(d, "--force"), estado(d)), "PASS");

const pkg = json(d + "/package.json");
pkg.scripts["audit:sdd"] = "echo skip";
writeFileSync(d + "/package.json", JSON.stringify(pkg, null, 2));
chequear("clave MERGE saboteada → FAIL", estado(d), "FAIL");
chequear("  nombra la clave", verificar(d).out.includes("scripts.audit:sdd"), true);
instalar(d, "--force");

// ── frontera del bloque ──────────────────────────────────────────────────────
seccion("frontera del bloque BLOCK");
writeFileSync(d + "/CLAUDE.md", leer(d + "/CLAUDE.md").replace("No tocar", "No toquen"));
chequear("editar FUERA del bloque → PASS", estado(d), "PASS");
writeFileSync(d + "/CLAUDE.md", leer(d + "/CLAUDE.md").replace("## Qué es esto", "## Otra cosa"));
chequear("editar DENTRO del bloque → FAIL", estado(d), "FAIL");
instalar(d, "--force");
writeFileSync(d + "/CLAUDE.md", leer(d + "/CLAUDE.md") + "\n<!-- SDD:FRAMEWORK BEGIN v9 -->\n<!-- SDD:FRAMEWORK END -->\n");
chequear("marcadores duplicados → FAIL", estado(d), "FAIL");
chequear("  lo explica una sola vez", cuenta(d + "/CLAUDE.md", "x") >= 0 && (verificar(d).out.match(/repetidos/g) ?? []).length, 1);

// ── casos borde ──────────────────────────────────────────────────────────────
seccion("casos borde");
d = repoNuevo(false);
instalar(d);
chequear("sin CLAUDE.md previo → lo crea", existsSync(d + "/CLAUDE.md"), true);
chequear("  y verify pasa", estado(d), "PASS");

d = repoNuevo(true, false);
instalar(d);
chequear("sin package.json → lo crea", json(d + "/package.json").scripts["audit:sdd"], "node scripts/sdd-audit.mjs");

d = repoNuevo();
const dryOut = instalar(d, "--dry-run").out;
chequear("--dry-run no escribe nada", existsSync(d + "/.claude"), false);
chequear("  pero dice qué haría", /DRY\s+EXACT/.test(dryOut), true);
chequear("instalar sobre sí mismo → falla", instalar(SRC).code, 1);
chequear("verify sin manifiesto → falla", verificar(d).code, 1);

// colisiones: un repo que ya tiene archivos en rutas del framework
d = repoNuevo();
mkdirSync(d + "/scripts/lib", { recursive: true });
writeFileSync(d + "/scripts/lib/framework.mjs", "// mi helper\n");
writeFileSync(d + "/scripts/sync-skills.mjs", "// mi deploy\n");
const colOut = instalar(d, "--dry-run").out;
chequear("dry-run detecta colisiones", colOut.includes("scripts/lib/framework.mjs") && colOut.includes("scripts/sync-skills.mjs"), true);
chequear("  y no las pisó", leer(d + "/scripts/lib/framework.mjs"), "// mi helper\n");

// ── seguridad ────────────────────────────────────────────────────────────────
seccion("seguridad");
for (const ruta of ["../../.ssh/authorized_keys", "/etc/cron.d/pwn", "C:/Windows/x.dll", "a/../../../b"]) {
  let rechazada = false;
  try {
    parseFrameworkFiles(`EXACT  ${ruta}\n`);
  } catch (e) {
    rechazada = e.message.includes("ruta rechazada");
  }
  chequear(`rechaza la ruta ${JSON.stringify(ruta)}`, rechazada, true);
}

// ── versionado ───────────────────────────────────────────────────────────────
seccion("veredicto del gate de versión");
chequear("misma versión → al día", estadoVersion("1.5.2", "1.5.2"), "al-dia");
chequear("atrás por PATCH → opcional", estadoVersion("1.5.1", "1.5.2"), "opcional");
chequear("atrás por MINOR → opcional", estadoVersion("1.4.9", "1.5.0"), "opcional");
chequear("atrás por MAJOR → frena", estadoVersion("1.5.2", "2.0.0"), "major-pendiente");
chequear("adelantado → no frena", estadoVersion("1.6.0", "1.5.2"), "adelantado");
chequear("1.5.10 es posterior a 1.5.2", compararVersiones("1.5.10", "1.5.2"), 1);

seccion("sdd-bump");
const bump = (a) => correr("sdd-bump.mjs", [a, "--dry-run"]);
const actual = readFileSync(join(SRC, ".claude", "VERSION"), "utf8").trim();
const [ma, mi, pa] = actual.split(".").map(Number);
chequear("patch", /→ (\S+)\s+\(PATCH\)/.exec(bump("patch").out)?.[1], `${ma}.${mi}.${pa + 1}`);
chequear("minor", /→ (\S+)\s+\(MINOR\)/.exec(bump("minor").out)?.[1], `${ma}.${mi + 1}.0`);
chequear("major", /→ (\S+)\s+\(MAJOR\)/.exec(bump("major").out)?.[1], `${ma + 1}.0.0`);
chequear("rechaza retroceder", bump("1.0.0").code, 1);
chequear("rechaza basura", bump("abc").code, 1);
chequear("dry-run no tocó la versión", readFileSync(join(SRC, ".claude", "VERSION"), "utf8").trim(), actual);

// ── CLI ──────────────────────────────────────────────────────────────────────
seccion("sdd CLI");
const cli = (...a) => correr("sdd-cli.mjs", a);
d = repoNuevo();
chequear("init --no-install deja verde", (cli("init", "--root", d, "--no-install"), estado(d)), "PASS");
const h = hash(d + "/CLAUDE.md");
cli("check", "--root", d);
chequear("check no escribe", hash(d + "/CLAUDE.md"), h);
chequear("init --dry-run no escribe", (() => {
  const limpio = repoNuevo();
  cli("init", "--root", limpio, "--dry-run");
  return existsSync(limpio + "/.claude");
})(), false);
rmSync(d + "/.claude", { recursive: true, force: true });
chequear("version sin instalar → falla", cli("version", "--root", d).code, 1);
chequear("help sale limpio", cli("help").code, 0);
chequear("comando inventado → falla", cli("fubar").code, 1);
chequear("bin declarados", Object.keys(json(join(SRC, "package.json")).bin).join(","), "sdd,sdd-framework,sdd-install,sdd-verify");

// ── upstream ─────────────────────────────────────────────────────────────────
seccion("upstream");
chequear("manifiesto al día", correr("sdd-manifest.mjs", ["--check"]).code, 0);
chequear("verify del repo del modelo", verificar(SRC).code, 0);
chequear("auditor verde", correr("sdd-audit.mjs", ["--root", SRC]).code, 0);
const pack = spawnSync("npm", ["pack", "--dry-run", "--json"], { cwd: SRC, encoding: "utf8", shell: process.platform === "win32" });
if (pack.status === 0) {
  const archivos = JSON.parse(pack.stdout)[0].files.map((f) => f.path);
  chequear("el paquete no lleva config local ni secretos",
    archivos.filter((p) => /settings|\.env|sessions\.jsonl|\.lock$/.test(p)).length, 0);
  chequear("el paquete no lleva el workflow de release",
    archivos.some((p) => p.includes("sdd-release")), false);
  chequear("el paquete no lleva esta suite",
    archivos.some((p) => p.includes("selftest")), false);
} else {
  omitir("contenido del paquete", "npm pack no disponible");
}

if (ONLINE) {
  const tags = spawnSync("git", ["ls-remote", "--tags", "--refs", "--sort=-v:refname",
    "https://github.com/pmillanmc/sdd-model-v1.1", "v*"], { encoding: "utf8" });
  const ultimo = /refs\/tags\/v(.+)/.exec((tags.stdout ?? "").split("\n")[0] ?? "")?.[1]?.trim();
  chequear("el patrón del gate extrae la versión del tag", /^\d+\.\d+\.\d+$/.test(ultimo ?? ""), true);
} else {
  omitir("el patrón del gate contra el tag real", "necesita red");
}

// ── resumen ──────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(56)}`);
if (mal) console.log(`Fallaron: ${fallidos.join(" · ")}\n`);
console.log(`${mal ? C.x : C.v}${ok} ok · ${mal} fallas${omitidos ? ` · ${omitidos} omitidos` : ""}${C.r}`);
process.exit(mal ? 1 : 0);
