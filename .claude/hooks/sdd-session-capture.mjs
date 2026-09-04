#!/usr/bin/env node
// .claude/hooks/sdd-session-capture.mjs
// Hook SessionStart de Claude Code. Captura la metadata de cada sesión y la
// agrega a metrics/sessions.jsonl. Es el "ancla" sobre la que /sdd-metrics
// atribuye tokens a una slice.
//
// Claude Code invoca este script pasando un JSON por stdin con, entre otros,
// los campos comunes: session_id, transcript_path, cwd. El evento SessionStart
// agrega `source` (startup | resume | clear | compact).
//
// Config (settings.json del proyecto):
//   {
//     "hooks": {
//       "SessionStart": [
//         { "hooks": [
//           { "type": "command",
//             "command": "node \"${CLAUDE_PROJECT_DIR}/.claude/hooks/sdd-session-capture.mjs\"" }
//         ]}
//       ]
//     }
//   }
//
// Best-effort: si algo falla, sale 0 y no bloquea la sesión.

import fs from "node:fs";
import path from "node:path";

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8");
}

try {
  const raw = await readStdin();
  const evt = raw ? JSON.parse(raw) : {};
  const projectDir = process.env.CLAUDE_PROJECT_DIR || evt.cwd || process.cwd();
  const metricsDir = path.join(projectDir, "metrics");
  fs.mkdirSync(metricsDir, { recursive: true });

  const entry = {
    session_id: evt.session_id ?? null,
    transcript_path: evt.transcript_path ?? null,
    cwd: evt.cwd ?? null,
    source: evt.source ?? null, // startup | resume | clear | compact
    captured_at: new Date().toISOString(),
  };

  fs.appendFileSync(
    path.join(metricsDir, "sessions.jsonl"),
    JSON.stringify(entry) + "\n"
  );
} catch {
  // nunca bloquear el arranque de la sesión por un fallo de captura
}
process.exit(0);
