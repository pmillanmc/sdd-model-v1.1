#!/usr/bin/env node
/**
 * sdd-audit — Auditor determinista del modelo SDD.
 *
 * Lee los mismos archivos que los agentes (registro, specs, grafo, métricas,
 * sprints) y verifica consistencia. Sin IA, sin tokens.
 *
 * Salida: reporte por consola.
 * Exit code 0 = OK (puede haber WARN) · Exit code 1 = al menos un FAIL.
 *
 * Uso:  pnpm audit:sdd                      audita el cwd
 *       node scripts/sdd-audit.mjs --root <path>   audita otro árbol
 *
 * El árbol auditado (DATA_ROOT) nunca se deriva de la ubicación de este script:
 * es `--root` si se pasa, y `process.cwd()` si no. Ver contracts/paths.md §2.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

// ---------- roots (contracts/paths.md §2) ----------
// DATA_ROOT      el codebase auditado: donde viven specs/, metrics/, graph/.
// FRAMEWORK_ROOT donde vive el framework instalado: .claude/, scripts/, contracts/.
// Regla: ningún script del modelo deriva DATA_ROOT de su propia ubicación en disco.
const argv = process.argv.slice(2);
const rootArg = argv.indexOf("--root");
const DATA_ROOT =
  rootArg !== -1 && argv[rootArg + 1]
    ? resolve(process.cwd(), argv[rootArg + 1])
    : process.cwd();
const FRAMEWORK_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Versión del framework instalado, o null si no está declarada */
function frameworkVersion() {
  const p = join(FRAMEWORK_ROOT, ".claude", "VERSION");
  return existsSync(p) ? readFileSync(p, "utf8").trim() : null;
}

const failures = [];
const warnings = [];
const passes = [];
const fail = (check, msg) => failures.push({ check, msg });
const warn = (check, msg) => warnings.push({ check, msg });
const pass = (check, msg) => passes.push({ check, msg });

// ---------- helpers ----------
const read = (p) => readFileSync(join(DATA_ROOT, p), "utf8");
const exists = (p) => existsSync(join(DATA_ROOT, p));

function loadYaml(p) {
  try {
    return YAML.parse(read(p));
  } catch (e) {
    fail("parse", `${p}: YAML inválido — ${e.message}`);
    return null;
  }
}

/** Extrae "campo: valor" de un feature.status.md */
function parseStatusMd(p) {
  const out = {};
  for (const line of read(p).split(/\r?\n/)) {
    const m = line.match(/^(\w[\w_]*):\s*(.+)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

/** ¿Dos rutas de `touches` se solapan? (igual o una es prefijo-carpeta de otra) */
function pathsOverlap(a, b) {
  const na = a.replace(/\\/g, "/").replace(/\/+$/, "");
  const nb = b.replace(/\\/g, "/").replace(/\/+$/, "");
  return na === nb || na.startsWith(nb + "/") || nb.startsWith(na + "/");
}

/**
 * Devuelve los bloques `## <tipo> — ...` de un archivo de métricas, en orden de aparición.
 * Un bloque termina donde empieza el próximo heading de nivel 2 (`### ...` no corta).
 */
function metricsBlocks(content, tipo) {
  const re = new RegExp(`^##[ \\t]+${tipo}\\b.*$`, "gim");
  const starts = [];
  let m;
  while ((m = re.exec(content)) !== null) starts.push(m.index);
  return starts.map((start) => {
    const next = content.indexOf("\n## ", start + 1);
    return { start, body: content.slice(start, next === -1 ? content.length : next) };
  });
}

/** Último bloque físico de un tipo (el que decide el gate), o null */
function lastBlock(content, tipo) {
  const all = metricsBlocks(content, tipo);
  return all.length ? all[all.length - 1] : null;
}

/** Extrae el valor de `- campo: valor` dentro del cuerpo de un bloque */
function blockField(body, field) {
  const m = body.match(new RegExp(`^[ \\t]*[-*]?[ \\t]*${field}[ \\t]*:[ \\t]*(.+)$`, "im"));
  return m ? m[1].trim() : null;
}

/** Cuenta tasks canónicas `- [ ] TNNN` / `- [x] TNNN` de una feature */
function taskCounts(id) {
  const p = `specs/${id}/tasks.md`;
  if (!exists(p)) return null;
  let total = 0, done = 0;
  for (const line of read(p).split(/\r?\n/)) {
    const m = line.match(/^[ \t]*[-*][ \t]*\[([ xX])\][ \t]*T\d{3}/);
    if (m) {
      total++;
      if (m[1].toLowerCase() === "x") done++;
    }
  }
  return { total, done };
}

/** Junta todas las strings hoja de un objeto/array anidado */
function collectStrings(node, acc = []) {
  if (typeof node === "string") acc.push(node);
  else if (Array.isArray(node)) node.forEach((n) => collectStrings(n, acc));
  else if (node && typeof node === "object")
    Object.values(node).forEach((n) => collectStrings(n, acc));
  return acc;
}

// ---------- reporte ----------
function report() {
  const line = "─".repeat(60);
  const fw = frameworkVersion();
  console.log(`\nSDD AUDIT — ${new Date().toISOString().slice(0, 10)}`);
  console.log(`root:      ${DATA_ROOT}`);
  console.log(`framework: ${fw ?? "sin declarar (.claude/VERSION ausente)"}`);
  console.log(line);

  if (passes.length) {
    console.log("\n✅ OK");
    for (const p of passes) console.log(`   [${p.check}] ${p.msg}`);
  }
  if (warnings.length) {
    console.log("\n⚠️  WARN (no bloquea, requiere atención)");
    for (const w of warnings) console.log(`   [${w.check}] ${w.msg}`);
  }
  if (failures.length) {
    console.log("\n❌ FAIL (bloquea)");
    for (const f of failures) console.log(`   [${f.check}] ${f.msg}`);
  }

  console.log(`\n${line}`);
  console.log(
    `Resultado: ${failures.length} FAIL · ${warnings.length} WARN · ${passes.length} OK — ${
      failures.length ? "❌ AUDIT FALLIDO" : "✅ AUDIT PASA"
    }\n`
  );
  process.exit(failures.length ? 1 : 0);
}

// ---------- CHECK 0: layout SDD presente en DATA_ROOT ----------
// Sin esto el auditor pasa en verde apuntando a cualquier carpeta del disco:
// "registro ausente" es indistinguible de "root equivocado". Ver contracts/paths.md §3.
const LAYOUT_DIRS = ["specs", "metrics", "graph"];
const layoutPresent = LAYOUT_DIRS.filter((d) => exists(d));
if (!layoutPresent.length) {
  fail(
    "layout",
    `layout SDD no encontrado en ${DATA_ROOT} — se esperaba al menos una de: ` +
      LAYOUT_DIRS.map((d) => `${d}/`).join(", ") +
      ". Si el codebase está en otro lado, pasá --root <path>"
  );
  report();
}
pass("layout", `layout SDD presente (${layoutPresent.map((d) => `${d}/`).join(", ")})`);

// ---------- carga del registro ----------
const REGISTRY = "specs/_registry/features.yaml";
if (!exists(REGISTRY)) {
  // El registro lo genera el modelo al correr (/sdd-generate).
  // Si no existe, el modelo aún no se usó en este repo: nada que auditar.
  pass("registro", `${REGISTRY} no existe — modelo sin correr, nada que auditar`);
  report();
}
const registry = loadYaml(REGISTRY) ?? { features: [] };
const features = registry.features ?? [];

// ---------- CHECK 1: registro ↔ specs ----------
for (const f of features) {
  if (!f.id) { fail("registro", "Entrada sin `id` en features.yaml"); continue; }
  if (!f.owner) warn("registro", `${f.id}: sin owner asignado`);
  if (!f.touches?.length) warn("registro", `${f.id}: sin \`touches\` declarados`);

  if (f.type === "fix") continue; // los fixes no tienen carpeta de spec

  const dir = `specs/${f.id}`;
  if (!exists(dir)) {
    fail("registro↔specs", `${f.id}: figura en el registro pero no existe ${dir}/`);
    continue;
  }
  const statusFile = `${dir}/feature.status.md`;
  if (!exists(statusFile)) {
    warn("registro↔specs", `${f.id}: falta ${statusFile} (corré /sdd-generate para crearlo)`);
  } else {
    const st = parseStatusMd(statusFile);
    if (st.status && st.status !== f.status) {
      fail(
        "registro↔specs",
        `${f.id}: status divergente — registro dice ${f.status}, ${statusFile} dice ${st.status}`
      );
    } else {
      pass("registro↔specs", `${f.id}: status consistente (${f.status})`);
    }
  }
}

// specs/ huérfanas (carpeta sin entrada en el registro)
if (exists("specs")) {
  for (const entry of readdirSync(join(DATA_ROOT, "specs"))) {
    if (entry.startsWith("_")) continue;
    if (!statSync(join(DATA_ROOT, "specs", entry)).isDirectory()) continue;
    if (!features.some((f) => f.id === entry)) {
      fail("registro↔specs", `specs/${entry}/ existe pero no figura en features.yaml`);
    }
  }
}

// ---------- CHECK 2: colisiones entre features OPEN ----------
const open = features.filter((f) => f.status === "OPEN");
for (let i = 0; i < open.length; i++) {
  for (let j = i + 1; j < open.length; j++) {
    const a = open[i], b = open[j];
    const shared = (a.touches ?? []).filter((ta) =>
      (b.touches ?? []).some((tb) => pathsOverlap(ta, tb))
    );
    if (shared.length) {
      const sameOwner = a.owner && a.owner === b.owner;
      const msg = `${a.id} (${a.owner ?? "?"}) y ${b.id} (${b.owner ?? "?"}) tocan: ${shared.join(", ")}`;
      sameOwner ? warn("colisiones", msg) : warn("colisiones", `⚡ DISTINTO OWNER — ${msg}`);
    }
  }
}
if (open.length > 1 && !warnings.some((w) => w.check === "colisiones"))
  pass("colisiones", "Sin solapamiento de touches entre features OPEN");

// ---------- CHECK 3: gates (evidencia en metrics/) ----------
for (const f of features) {
  const metricsFile = `metrics/${f.id}-metrics.md`;
  const hasMetrics = exists(metricsFile);
  const content = hasMetrics ? read(metricsFile) : "";

  if (f.status === "CLOSED") {
    if (f.type === "fix") {
      if (!hasMetrics) warn("gates", `${f.id}: fix cerrado sin ${metricsFile}`);
      continue;
    }
    if (!hasMetrics) {
      fail("gates", `${f.id}: CLOSED sin archivo de métricas (${metricsFile})`);
    } else if (!/resultado:.*APROBADO/i.test(content)) {
      // Contrato: sdd-review debe escribir una línea que contenga "resultado:" y "APROBADO"
      // Ejemplo válido: "- resultado: APROBADO" o "- resultado: ✅ APROBADO"
      // Ejemplo inválido: "resultado: PENDIENTE" o ausencia del bloque ## Review
      fail("gates", `${f.id}: CLOSED sin evidencia de "resultado: APROBADO" en ${metricsFile}`);
    } else {
      pass("gates", `${f.id}: cierre con review APROBADO verificado`);
    }
  }

  if (f.status === "OPEN" && f.type !== "fix" && hasMetrics) {
    if (!/##\s*Validate/i.test(content))
      warn("gates", `${f.id}: tiene métricas pero sin bloque Validate — ¿se corrió /sdd-validate?`);
  }

  // --- Contrato del bloque ## Implement (productor: /sdd-implement) ---
  if (f.type !== "fix" && hasMetrics) {
    const impl = lastBlock(content, "Implement");
    const counts = taskCounts(f.id);

    if (impl) {
      const declaradas = blockField(impl.body, "tasks_completadas");
      const tests = blockField(impl.body, "tests");

      if (!declaradas || !/^\d+\s*\/\s*\d+$/.test(declaradas)) {
        fail("gates", `${f.id}: bloque ## Implement sin "tasks_completadas: m/m" válido`);
      } else {
        const [n, m] = declaradas.split("/").map((x) => parseInt(x.trim(), 10));
        if (n !== m)
          fail("gates", `${f.id}: ## Implement declara implementación parcial (${declaradas}) — no habilita /sdd-review`);
        else if (counts && counts.total !== m)
          fail("gates", `${f.id}: ## Implement declara ${declaradas} pero tasks.md tiene ${counts.total} tasks canónicas`);
        else if (counts && counts.done !== counts.total)
          fail("gates", `${f.id}: ## Implement dice ${declaradas} pero tasks.md tiene ${counts.total - counts.done} task(s) sin marcar [x]`);
        else pass("gates", `${f.id}: evidencia de implementación completa (${declaradas})`);
      }

      if (!tests) fail("gates", `${f.id}: bloque ## Implement sin campo "tests"`);
      else if (!/^PASS$/i.test(tests))
        fail("gates", `${f.id}: ## Implement con "tests: ${tests}" — un rojo no habilita /sdd-review`);
    } else if (counts && counts.total > 0 && counts.done === counts.total) {
      warn("gates", `${f.id}: todas las tasks están [x] pero falta el bloque ## Implement — /sdd-review va a rechazar el gate`);
    }

    if (f.status === "CLOSED" && !impl && !/##\s*Task\s+T\d{3}/i.test(content))
      fail("gates", `${f.id}: CLOSED sin bloque ## Implement ni ## Task T00X en ${metricsFile}`);
  }

  // --- Contrato del override de gate (productor: /sdd-implement, autoriza el humano) ---
  if (hasMetrics) {
    const val = lastBlock(content, "Validate");
    const ovr = lastBlock(content, "Gate Override");
    const gaps = val ? parseInt(blockField(val.body, "gaps_encontrados") ?? "", 10) : NaN;

    if (ovr) {
      const authorized = blockField(ovr.body, "authorized");
      const iter = blockField(ovr.body, "validate_iteration");
      const valIter = val ? blockField(val.body, "iteration_number") : null;

      if (!/^true$/i.test(authorized ?? ""))
        fail("gates", `${f.id}: ## Gate Override sin "authorized: true"`);
      else if (val && ovr.start < val.start)
        fail("gates", `${f.id}: ## Gate Override es anterior al último ## Validate — no lo autoriza`);
      else if (valIter && iter && iter !== valIter)
        fail("gates", `${f.id}: ## Gate Override apunta a validate_iteration ${iter} pero el último Validate es ${valIter}`);
      else pass("gates", `${f.id}: override de gate Validate autorizado y trazable`);

      if (exists("DECISIONS.md") && !read("DECISIONS.md").includes(f.id))
        warn("gates", `${f.id}: tiene override de gate pero no aparece en DECISIONS.md — corré /sdd-log`);
    }

    if (Number.isInteger(gaps) && gaps > 0 && lastBlock(content, "Implement") && !ovr)
      fail("gates", `${f.id}: se implementó con ${gaps} gap(s) de validación abiertos y sin ## Gate Override`);
  }
}

// ---------- CHECK 4: grafo vs filesystem ----------
const GRAPH = "graph/domain.yaml";
if (!exists(GRAPH)) {
  warn("grafo", `No existe ${GRAPH} — sin routing de contexto. Corré /sdd-scan.`);
} else {
  const graph = loadYaml(GRAPH);
  const domains = graph?.domains ?? {};
  let graphOk = true;
  for (const [name, d] of Object.entries(domains)) {
    for (const p of collectStrings(d.files ?? {})) {
      if (!exists(p)) {
        fail("grafo", `dominio "${name}": ${p} listado en el grafo pero no existe`);
        graphOk = false;
      }
    }
    for (const featId of d.features ?? []) {
      if (!features.some((f) => f.id === featId)) {
        warn("grafo", `dominio "${name}": referencia feature ${featId} que no está en el registro`);
      }
    }
  }
  if (graphOk && Object.keys(domains).length) pass("grafo", "Todos los archivos del grafo existen");
}

// ---------- CHECK 5: sprints ----------
const SPRINTS_DIR = "specs/_registry/sprints";
if (exists(SPRINTS_DIR)) {
  const today = new Date().toISOString().slice(0, 10);
  for (const file of readdirSync(join(DATA_ROOT, SPRINTS_DIR)).filter((f) => /\.ya?ml$/.test(f))) {
    const sprint = loadYaml(`${SPRINTS_DIR}/${file}`);
    if (!sprint) continue;
    const ended = sprint.end && String(sprint.end) < today;
    if (ended && sprint.retro && sprint.retro.cerrado === false)
      warn("sprints", `${sprint.sprint}: terminó (${sprint.end}) pero la retro no está cerrada`);
    if (ended) {
      for (const item of sprint.scope ?? []) {
        const f = features.find((x) => x.id === item.feature);
        if (f?.status === "OPEN")
          warn("sprints", `${f.id}: sigue OPEN pero su sprint ${sprint.sprint} terminó el ${sprint.end}`);
      }
    }
  }
}

// ---------- CHECK 6: schema de artefactos ----------
// Verifica que spec.md y tasks.md de cada feature cumplen
// el esquema mínimo requerido por el modelo (no requiere IA).
for (const f of features) {
  if (f.type === "fix") continue;
  const dir = `specs/${f.id}`;
  if (!exists(dir)) continue;

  // spec.md: debe tener sección "## Fuera de scope"
  const specFile = `${dir}/spec.md`;
  if (exists(specFile)) {
    const specContent = read(specFile);
    if (!/^##\s+fuera de scope/im.test(specContent)) {
      warn(
        "schema",
        `${f.id}: spec.md no tiene sección "## Fuera de scope (v1)" — regenerá con /sdd-generate`
      );
    } else {
      pass("schema", `${f.id}: spec.md tiene sección Fuera de scope`);
    }
  }

  // tasks.md: cada línea de tarea (T\d+) debe tener referencia US-N o "US: —"
  const tasksFile = `${dir}/tasks.md`;
  if (exists(tasksFile)) {
    const lines = read(tasksFile).split(/\r?\n/);
    const taskLines = lines.filter((l) => /^\s*[-*]\s+\*{0,2}T\d+/.test(l));
    const missingUS = taskLines.filter((l) => !/US[-:]\s*[\d—–-]/.test(l));
    if (missingUS.length) {
      warn(
        "schema",
        `${f.id}: ${missingUS.length} tarea(s) en tasks.md sin referencia US-N — regenerá con /sdd-generate`
      );
    } else if (taskLines.length > 0) {
      pass("schema", `${f.id}: tasks.md tiene trazabilidad US-N en todas las tareas`);
    }
  }
}

report();
