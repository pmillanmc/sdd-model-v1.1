import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { auditScriptPath } from "../lib/paths.js";

export interface AuditCheck {
  check: string;
  msg: string;
}

export interface AuditResult {
  status: "PASS" | "FAIL";
  date: string;
  fails: AuditCheck[];
  warns: AuditCheck[];
  passes: AuditCheck[];
  raw_output: string;
}

export async function runAudit(projectRoot: string): Promise<AuditResult> {
  const scriptPath = auditScriptPath(projectRoot);

  if (!existsSync(scriptPath)) {
    return {
      status: "FAIL",
      date: new Date().toISOString().slice(0, 10),
      fails: [{ check: "setup", msg: "scripts/sdd-audit.mjs no existe en el proyecto" }],
      warns: [],
      passes: [],
      raw_output: "",
    };
  }

  return new Promise((resolve) => {
    const proc = spawn("node", [scriptPath], { cwd: projectRoot });
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));

    proc.on("close", (code) => {
      const raw = stdout + stderr;
      resolve({
        status: code === 0 ? "PASS" : "FAIL",
        date: new Date().toISOString().slice(0, 10),
        ...parseAuditOutput(raw),
        raw_output: raw,
      });
    });
  });
}

function parseAuditOutput(output: string): Pick<AuditResult, "fails" | "warns" | "passes"> {
  const fails: AuditCheck[] = [];
  const warns: AuditCheck[] = [];
  const passes: AuditCheck[] = [];

  // Lines look like:   [check] message
  const lineRe = /^\s+\[([^\]]+)\]\s+(.+)$/;
  let section: "passes" | "warns" | "fails" | null = null;

  for (const line of output.split("\n")) {
    if (/✅\s+OK/i.test(line)) { section = "passes"; continue; }
    if (/⚠️\s+WARN/i.test(line)) { section = "warns"; continue; }
    if (/❌\s+FAIL/i.test(line)) { section = "fails"; continue; }

    if (section) {
      const m = line.match(lineRe);
      if (m) {
        const entry: AuditCheck = { check: m[1], msg: m[2].trim() };
        if (section === "passes") passes.push(entry);
        else if (section === "warns") warns.push(entry);
        else fails.push(entry);
      }
    }
  }

  return { fails, warns, passes };
}
