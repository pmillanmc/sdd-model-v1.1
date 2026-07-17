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
 * Uso:  pnpm audit:sdd   (o: node scripts/sdd-audit.mjs)
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const failures = [];
const warnings = [];
const passes = [];
const fail = (check, msg) => failures.push({ check, msg });
const warn = (check, msg) => warnings.push({ check, msg });
const pass = (check, msg) => passes.push({ check, msg });

// ---------- helpers ----------
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const exists = (p) => existsSync(join(ROOT, p));

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
  console.log(`\nSDD AUDIT — ${new Date().toISOString().slice(0, 10)}\n${line}`);

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
  for (const entry of readdirSync(join(ROOT, "specs"))) {
    if (entry.startsWith("_")) continue;
    if (!statSync(join(ROOT, "specs", entry)).isDirectory()) continue;
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
  for (const file of readdirSync(join(ROOT, SPRINTS_DIR)).filter((f) => /\.ya?ml$/.test(f))) {
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

  // ui-behaviour.md (opcional): si existe, debe tener las secciones ancla.
  // No se exige su existencia — features sin UI no lo generan (ver /sdd-validate,
  // regla crear-o-loguear). Solo se valida el schema cuando el archivo está presente.
  const uiFile = `${dir}/ui-behaviour.md`;
  if (exists(uiFile)) {
    const uiContent = read(uiFile);
    const hasPantallas = /^##\s+pantallas/im.test(uiContent);
    const hasFlujos = /^##\s+flujos/im.test(uiContent);
    if (!hasPantallas || !hasFlujos) {
      warn(
        "schema",
        `${f.id}: ui-behaviour.md incompleto (falta ${!hasPantallas ? '"## Pantallas"' : '"## Flujos"'}) — regenerá con /sdd-ui-behaviour`
      );
    } else {
      pass("schema", `${f.id}: ui-behaviour.md tiene estructura mínima (Pantallas + Flujos)`);
    }
  }
}

report();
