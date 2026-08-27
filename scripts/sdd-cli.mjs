#!/usr/bin/env node
/**
 * sdd — Un comando para instalar, actualizar y revisar el modelo SDD.
 *
 * No agrega capacidad: orquesta los scripts que ya hacen el trabajo
 * (sdd-install, sdd-verify, sdd-audit) para que instalar el framework sea
 * un comando y no cinco.
 *
 * Sin nada instalado, desde cualquier repo:
 *
 *   npx github:pmillanmc/sdd-model-v1.1#v1.4.0 init
 *
 * El repo del modelo es público, así que eso no necesita token ni registry.
 * Con el paquete ya agregado:  pnpm exec sdd init
 *
 * Comandos:
 *   init      materializa el framework, instala dependencias, verifica y audita
 *   update    lo mismo — el nombre existe porque es lo que se busca al actualizar
 *   check     verifica integridad y consistencia, sin escribir nada
 *   version   qué versión corre este repo y cuál es la última publicada
 *
 * Exit 0 = todo bien · Exit 1 = algo falló.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { estadoVersion, norm, parseArgs } from "./lib/framework.mjs";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const { flags, opts } = parseArgs(argv);
const cmd = argv.find((a) => !a.startsWith("--")) ?? "help";
const ROOT = opts.root ? resolve(process.cwd(), opts.root) : process.cwd();

const UPSTREAM = "https://github.com/pmillanmc/sdd-model-v1.1";
const script = (n) => join(SRC, "scripts", n);
const readTrim = (p) => (existsSync(p) ? norm(readFileSync(p, "utf8")).trim() : null);

/** Corre un script del framework mostrando su salida. Devuelve el exit code. */
function run(file, args, cwd = process.cwd()) {
  const r = spawnSync(process.execPath, [file, ...args], { stdio: "inherit", cwd });
  return r.status ?? 1;
}

function step(n, total, texto) {
  console.log(`\n[1m[${n}/${total}] ${texto}[0m`);
}

/** El gestor que usa este repo, deducido del lockfile. */
function gestor(root) {
  if (existsSync(join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(root, "yarn.lock"))) return "yarn";
  if (existsSync(join(root, "package-lock.json"))) return "npm";
  return "pnpm"; // el default del modelo (CLAUDE.md → Reglas generales)
}

/** Dependencias que el framework aporta y todavía no están en node_modules. */
function faltanDeps(root) {
  const pkgPath = join(root, "package.json");
  if (!existsSync(pkgPath)) return [];
  const dev = JSON.parse(readFileSync(pkgPath, "utf8")).devDependencies ?? {};
  return Object.keys(dev).filter((n) => !existsSync(join(root, "node_modules", n)));
}

/** El último tag publicado upstream, o null si no se puede consultar. */
function ultimoTag() {
  try {
    const out = execFileSync(
      "git",
      ["ls-remote", "--tags", "--refs", "--sort=-v:refname", UPSTREAM, "v*"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 15000 }
    );
    const first = out.split("\n")[0] ?? "";
    const m = first.match(/refs\/tags\/v(.+)$/);
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

if (cmd === "init" || cmd === "update") {
  // En un repo con historia, la primera pregunta es qué va a tocar. Se contesta
  // sin escribir nada: --dry-run corta después del paso 1.
  if (flags.has("dry-run")) {
    console.log(`\n[1m[1/1] Qué haría en ${ROOT}[0m`);
    const c = run(script("sdd-install.mjs"), ["--root", ROOT, "--dry-run"]);
    console.log(`\n   Nada de esto se escribió. Para hacerlo: sdd ${cmd}`);
    process.exit(c);
  }

  const total = 4;

  step(1, total, "Materializando el framework");
  if (run(script("sdd-install.mjs"), ["--root", ROOT, "--no-next", ...(flags.has("force") ? ["--force"] : [])]) !== 0) {
    process.exit(1);
  }

  const pendientes = faltanDeps(ROOT);
  if (flags.has("no-install") || pendientes.length === 0) {
    step(2, total, pendientes.length ? "Dependencias — omitido (--no-install)" : "Dependencias — ya están");
    if (pendientes.length) console.log(`      Corré "${gestor(ROOT)} install" antes de auditar.`);
  } else {
    const g = gestor(ROOT);
    step(2, total, `Instalando dependencias con ${g} (${pendientes.join(", ")})`);
    const r = spawnSync(g, ["install"], { stdio: "inherit", cwd: ROOT, shell: process.platform === "win32" });
    if (r.status !== 0) {
      console.error(`\nFAIL  "${g} install" falló. Resolvelo y volvé a correr: sdd ${cmd}`);
      process.exit(1);
    }
  }

  step(3, total, "Verificando integridad");
  if (run(script("sdd-verify.mjs"), ["--root", ROOT]) !== 0) process.exit(1);

  step(4, total, "Auditando consistencia");
  const auditor = join(ROOT, "scripts", "sdd-audit.mjs");
  const codigo = existsSync(auditor) ? run(auditor, [], ROOT) : 1;
  if (codigo !== 0) process.exit(1);

  const v = readTrim(join(ROOT, ".claude", "VERSION"));
  console.log(`\n[32m✓[0m  framework ${v} instalado en ${ROOT}\n`);
  console.log(`   Commiteá:  git add .claude scripts contracts CLAUDE.md package.json`);
  console.log(`   Después:   /sdd-setup   (configura los MCPs y engancha el hook de sesión)`);
  process.exit(0);
}

if (cmd === "check") {
  let malo = 0;
  step(1, 2, "Integridad (manifiesto vs. árbol)");
  malo |= run(script("sdd-verify.mjs"), ["--root", ROOT]);
  step(2, 2, "Consistencia del modelo");
  const auditor = join(ROOT, "scripts", "sdd-audit.mjs");
  malo |= existsSync(auditor) ? run(auditor, [], ROOT) : 1;
  process.exit(malo ? 1 : 0);
}

if (cmd === "version") {
  const local = readTrim(join(ROOT, ".claude", "VERSION"));
  if (!local) {
    console.error(`FAIL  no hay .claude/VERSION en ${ROOT} — el framework no está instalado.`);
    console.error(`      Instalalo con:  sdd init`);
    process.exit(1);
  }
  const latest = ultimoTag();
  console.log(`instalado  ${local}`);
  if (!latest) {
    console.log(`upstream   (no se pudo consultar — sin red o sin tags)`);
    process.exit(0);
  }
  console.log(`upstream   ${latest}`);
  switch (estadoVersion(local, latest)) {
    case "al-dia":
      console.log(`
[32m✓[0m  al día`);
      break;
    case "adelantado":
      // Pasa mientras se prepara un release: el bump ya ocurrió, el tag todavía no.
      console.log(`
[32m✓[0m  adelantado respecto del último tag publicado`);
      break;
    case "major-pendiente":
      console.log(`
[31m✗[0m  hay un MAJOR pendiente — leé la nota de migración del CHANGELOG antes de actualizar`);
      process.exit(1);
    default:
      console.log(`
   actualización opcional — corré:  sdd update`);
  }
  process.exit(0);
}

console.log(`sdd — instalar y mantener el modelo SDD en un repo

  sdd init      materializa el framework, instala dependencias, verifica y audita
  sdd update    igual que init: es lo que corrés al cambiar de versión
  sdd check     verifica integridad y consistencia, sin escribir nada
  sdd version   qué versión corre este repo y cuál es la última publicada

  --root <path>   sobre qué repo operar (default: el directorio actual)
  --dry-run       mostrar qué haría, sin escribir nada
  --no-install    no correr el gestor de paquetes
  --force         pisar archivos de capa A editados en destino (descarta el diff)

Sin nada instalado:  npx github:pmillanmc/sdd-model-v1.1 init`);
process.exit(cmd === "help" ? 0 : 1);
