/**
 * framework.mjs — primitivas compartidas de la capa A.
 *
 * Las usan sdd-manifest.mjs (genera), sdd-install.mjs (materializa) y
 * sdd-verify.mjs (verifica). Un solo lugar donde se define qué significa
 * "el hash de un archivo del framework", para que los tres coincidan.
 *
 * Semántica de EXACT / BLOCK / MERGE: contracts/framework.md §2.
 * Lista canónica de archivos: contracts/framework-files.txt.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// ---------- normalización ----------
// Los hashes se calculan sobre contenido normalizado: CRLF→LF y sin BOM.
// Sin esto, el mismo commit da hashes distintos en Windows y en el CI de Linux
// y el manifiesto falla sin que nadie haya editado nada.
export const norm = (s) => s.replace(/^﻿/, "").replace(/\r\n/g, "\n");
export const sha256 = (s) => createHash("sha256").update(norm(s), "utf8").digest("hex");

// ---------- lista canónica ----------

/**
 * El fixture de demo es opcional en un repo de código y requerido en el repo
 * del modelo (contracts/framework-files.txt, sección "Fixture de demo").
 * Si está, es capa A y se verifica como cualquier otra. Si no está, no falta.
 */
export const isOptional = (path) => path.startsWith("demo/");

/**
 * Toda ruta de la lista canónica se resuelve contra la raíz del repo destino.
 * Una con `..` o absoluta escribiría afuera del árbol. La lista es capa A, así
 * que explotarla exige ya controlar el framework — pero un `../../` escondido en
 * una lista de rutas pasa una revisión que el mismo ataque en código no pasaría.
 * Se rechaza acá, donde los tres scripts la leen.
 */
function rutaSegura(path, linea) {
  const malo =
    path.startsWith("/") ||
    path.includes("\\") ||
    /^[A-Za-z]:/.test(path) ||
    path.split("/").includes("..");
  if (malo) {
    throw new Error(
      `framework-files.txt:${linea} — ruta rechazada "${path}". ` +
      `Deben ser relativas a la raíz, con "/", y sin "..".`
    );
  }
}

/**
 * Parsea contracts/framework-files.txt.
 * @returns {Array<{type:'EXACT'|'BLOCK'|'MERGE', path:string, key:string|null, line:number}>}
 */
export function parseFrameworkFiles(text) {
  const out = [];
  norm(text).split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const [type, path, key] = line.split(/\s+/);
    if (!["EXACT", "BLOCK", "MERGE"].includes(type)) {
      throw new Error(`framework-files.txt:${i + 1} — tipo desconocido "${type}"`);
    }
    if (!path) throw new Error(`framework-files.txt:${i + 1} — falta la ruta`);
    rutaSegura(path, i + 1);
    if (type === "MERGE" && !key) {
      throw new Error(`framework-files.txt:${i + 1} — MERGE requiere una tercera columna (la clave)`);
    }
    out.push({ type, path, key: key ?? null, line: i + 1 });
  });
  return out;
}

// ---------- bloque SDD:FRAMEWORK ----------

const RE_BEGIN = /<!--\s*SDD:FRAMEWORK BEGIN[^>]*-->/g;
const RE_END = /<!--\s*SDD:FRAMEWORK END[^>]*-->/g;

/**
 * Extrae el bloque del framework de un CLAUDE.md, marcadores incluidos.
 * Cada marcador debe aparecer exactamente una vez: una segunda aparición
 * literal parte el bloque y hace que se hashee un fragmento (contracts/framework.md §2.2).
 * @returns {{ok:boolean, reason:string|null, block:string|null, start:number, stop:number}}
 */
export function extractBlock(text) {
  const t = norm(text);
  const begins = [...t.matchAll(RE_BEGIN)];
  const ends = [...t.matchAll(RE_END)];

  if (begins.length === 0 && ends.length === 0) {
    return { ok: false, reason: "los marcadores SDD:FRAMEWORK no están presentes", block: null, start: -1, stop: -1 };
  }
  if (begins.length !== 1 || ends.length !== 1) {
    return {
      ok: false,
      reason: `marcadores repetidos (BEGIN×${begins.length}, END×${ends.length}) — el bloque queda partido`,
      block: null, start: -1, stop: -1,
    };
  }
  const start = begins[0].index;
  const stop = ends[0].index + ends[0][0].length;
  if (stop <= start) {
    return { ok: false, reason: "el marcador de cierre aparece antes que el de apertura", block: null, start: -1, stop: -1 };
  }
  return { ok: true, reason: null, block: t.slice(start, stop), start, stop };
}

/** Injerta `block` en `text`, reemplazando el bloque existente o agregándolo al final. */
export function injectBlock(text, block) {
  const t = norm(text);
  const found = extractBlock(t);
  if (found.ok) return t.slice(0, found.start) + block + t.slice(found.stop);
  if (found.reason && !found.reason.includes("no están presentes")) {
    throw new Error(`no se puede injertar: ${found.reason}. Arreglá los marcadores a mano primero.`);
  }
  const sep = t.trim() === "" ? "" : t.replace(/\n+$/, "") + "\n\n";
  return sep + block + "\n";
}

// ---------- claves con notación de puntos (MERGE) ----------

export function getPath(obj, dotted) {
  return dotted.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function setPath(obj, dotted, value) {
  const keys = dotted.split(".");
  const last = keys.pop();
  let cur = obj;
  for (const k of keys) {
    if (typeof cur[k] !== "object" || cur[k] === null) cur[k] = {};
    cur = cur[k];
  }
  cur[last] = value;
}

// ---------- hash de una entrada contra un árbol ----------

/**
 * Calcula el hash de una entrada en el árbol `root`.
 * @returns {{sha:string|null, error:string|null}}
 */
export function hashEntry(root, entry) {
  const abs = join(root, entry.path);
  if (!existsSync(abs)) return { sha: null, error: "el archivo no existe" };

  if (entry.type === "EXACT") {
    return { sha: sha256(readFileSync(abs, "utf8")), error: null };
  }

  if (entry.type === "BLOCK") {
    const r = extractBlock(readFileSync(abs, "utf8"));
    if (!r.ok) return { sha: null, error: r.reason };
    return { sha: sha256(r.block), error: null };
  }

  if (entry.type === "MERGE") {
    let json;
    try {
      json = JSON.parse(readFileSync(abs, "utf8"));
    } catch {
      return { sha: null, error: "JSON inválido" };
    }
    const value = getPath(json, entry.key);
    if (value === undefined) return { sha: null, error: `falta la clave "${entry.key}"` };
    return { sha: sha256(JSON.stringify(value)), error: null };
  }

  return { sha: null, error: `tipo desconocido "${entry.type}"` };
}

// ---------- manifiesto ----------

export function serializeManifest({ version, entries }) {
  return [
    "# .claude/MANIFEST.sha256 — generado por scripts/sdd-manifest.mjs. No editar a mano.",
    "# SHA-256 sobre contenido normalizado (CRLF→LF, sin BOM).",
    "# EXACT: archivo completo · BLOCK: solo el bloque SDD:FRAMEWORK · MERGE: el valor de la clave.",
    `# framework_version: ${version}`,
    `# entries: ${entries.length}`,
    "",
    ...entries.map((e) =>
      e.type === "MERGE"
        ? `MERGE  ${e.sha}  ${e.path}  ${e.key}`
        : `${e.type}  ${e.sha}  ${e.path}`
    ),
    "",
  ].join("\n");
}

export function parseManifest(text) {
  const entries = [];
  let version = null;
  for (const raw of norm(text).split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      const m = line.match(/framework_version:\s*(\S+)/);
      if (m) version = m[1];
      continue;
    }
    const [type, sha, path, key] = line.split(/\s+/);
    entries.push({ type, sha, path, key: key ?? null });
  }
  return { version, entries };
}

// ---------- comparación de versiones ----------

/** -1 si a < b, 0 si iguales, 1 si a > b. */
export function compararVersiones(a, b) {
  const [A, B] = [a, b].map((v) => v.split(".").map(Number));
  for (let i = 0; i < 3; i++) {
    const d = (A[i] ?? 0) - (B[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

/**
 * El veredicto del gate: qué significa que este repo esté en `local` y upstream
 * en `latest`. Es la única lógica que decide entre avisar y frenar, y por eso
 * vive acá y no duplicada en el CLI y en el workflow.
 *
 * @returns {'al-dia'|'adelantado'|'opcional'|'major-pendiente'}
 */
export function estadoVersion(local, latest) {
  if (local === latest) return "al-dia";
  if (compararVersiones(local, latest) > 0) return "adelantado";
  return Number(local.split(".")[0]) < Number(latest.split(".")[0])
    ? "major-pendiente"
    : "opcional";
}

// ---------- utilidades de reporte ----------

export const readIfExists = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);

export function parseArgs(argv) {
  const out = { flags: new Set(), opts: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const name = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      out.opts[name] = next;
      i++;
    } else {
      out.flags.add(name);
    }
  }
  return out;
}
