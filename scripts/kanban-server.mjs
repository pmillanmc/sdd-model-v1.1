/**
 * kanban-server.mjs — Dev server del kanban SDD con live reload via SSE
 *
 * Uso:  node scripts/kanban-server.mjs [--root <path>] [--port <number>]
 *
 * Endpoints:
 *   GET /           HTML con datos embebidos (carga sin flash)
 *   GET /api/data   JSON del estado actual (para re-render en vivo)
 *   GET /api/events SSE stream — notifica 'update' cuando cambia un archivo
 *
 * Sin dependencias extra: usa http, fs, path built-ins + yaml (ya instalado).
 */
import { createServer } from 'http';
import { readFileSync, existsSync, readdirSync, watch } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = join(__dirname, '..');

// ── CLI args ─────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const arg  = (flag, fallback) => { const i = argv.indexOf(flag); return i !== -1 ? argv[i + 1] : fallback; };

const ROOT = resolve(process.cwd(), arg('--root', '.'));
const PORT = parseInt(arg('--port', '3131'), 10);

// ── SSE clients ───────────────────────────────────────────────────────────────
const clients = new Set();

function broadcast(payload) {
  const msg = `data: ${JSON.stringify(payload)}\n\n`;
  clients.forEach(res => { try { res.write(msg); } catch { clients.delete(res); } });
}

// ── File watcher ──────────────────────────────────────────────────────────────
const specsDir = join(ROOT, 'specs');
if (existsSync(specsDir)) {
  let debounce = null;
  watch(specsDir, { recursive: true }, (_, filename) => {
    if (!filename) return;
    if (!filename.endsWith('.yaml') && !filename.endsWith('.md')) return;
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const rel = filename.replace(/\\/g, '/');
      console.log(`  ↻  ${rel}`);
      broadcast({ type: 'update', file: rel, ts: Date.now() });
    }, 300);
  });
  console.log(`👁  Watching  ${specsDir}`);
} else {
  console.warn(`⚠   specs/ no encontrado en ${ROOT} — live reload desactivado`);
}

// ── Data loader ───────────────────────────────────────────────────────────────
function loadData() {
  const featuresPath = join(ROOT, 'specs/_registry/features.yaml');
  if (!existsSync(featuresPath)) throw new Error(`No encontré ${featuresPath}`);
  const { features: raw = [] } = parseYaml(readFileSync(featuresPath, 'utf8'));

  const sprintsDir = join(ROOT, 'specs/_registry/sprints');
  const sprints = existsSync(sprintsDir)
    ? readdirSync(sprintsDir)
        .filter(f => f.endsWith('.yaml') && !f.startsWith('_'))
        .map(f => parseYaml(readFileSync(join(sprintsDir, f), 'utf8')))
    : [];

  const features = raw.map(f => {
    const base = join(ROOT, 'specs', f.id);

    const tasksPath = join(base, 'tasks.md');
    const tasks = existsSync(tasksPath) ? parseTasks(readFileSync(tasksPath, 'utf8')) : [];

    let lastCommand = null;
    const statusPath = join(base, 'feature.status.md');
    if (existsSync(statusPath)) {
      const m = readFileSync(statusPath, 'utf8').match(/last_command:\s*(.+)/);
      lastCommand = m?.[1]?.trim() ?? null;
    }

    return { ...f, tasks, taskCount: tasks.length, lastCommand };
  });

  return { features, sprints, generatedAt: new Date().toISOString() };
}

// ── Task parser ───────────────────────────────────────────────────────────────
// Soporta dos formatos:
//   Tabla:     | T001 | descripción | ... |       → done: null
//   Checkbox:  - [x] T001 descripción             → done: true/false
function parseTasks(content) {
  const tasks = [];
  let section = 'General';

  for (const line of content.split('\n')) {
    const sec = line.match(/^#{2,3} (.+)/);
    if (sec) { section = sec[1].trim(); continue; }

    const tbl = line.match(/^\|\s*(T\d+)\s*\|\s*(.+?)\s*\|/);
    if (tbl) {
      tasks.push({ id: tbl[1], desc: tbl[2].replace(/`/g, '').trim(), section, done: null });
      continue;
    }

    const chk = line.match(/^- \[(x| )\] (.+)/);
    if (chk) {
      const done = chk[1] === 'x';
      const raw  = chk[2].trim();
      const id   = raw.match(/^(T\d+)\s+(.+)/);
      tasks.push(id
        ? { id: id[1], desc: id[2].replace(/`/g, '').trim(), section, done }
        : { id: null,  desc: raw.replace(/`/g, '').trim(),   section, done });
    }
  }
  return tasks;
}

// ── HTTP server ───────────────────────────────────────────────────────────────
createServer((req, res) => {
  const path = new URL(req.url, `http://localhost:${PORT}`).pathname;

  if (path === '/api/events') {
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    });
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  if (path === '/api/data') {
    try {
      const data = loadData();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  if (path === '/') {
    try {
      const data = loadData();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(buildHTML(data));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error: ${e.message}`);
    }
    return;
  }

  res.writeHead(404);
  res.end();

}).listen(PORT, '127.0.0.1', () => {
  console.log(`\n🚀  SDD Kanban → http://localhost:${PORT}`);
  console.log(`    Root: ${ROOT}\n`);
});

// ── HTML builder ──────────────────────────────────────────────────────────────
function buildHTML(data) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SDD Kanban — Live</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:        #0f1117;
      --surface:   #1e293b;
      --surface-2: #0f172a;
      --border:    #334155;
      --border-2:  #1e293b;
      --text:      #e2e8f0;
      --muted:     #64748b;
      --secondary: #94a3b8;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* ── Header ─────────────────────────────── */
    header {
      padding: 11px 20px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 14px;
      flex-shrink: 0;
    }
    header h1 { font-size: 0.93rem; font-weight: 700; color: #f8fafc; }
    header p  { font-size: 0.68rem; color: var(--muted); margin-top: 1px; }

    .live-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 9999px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      font-size: 0.65rem;
      color: var(--muted);
      user-select: none;
    }
    #live-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #475569;
      flex-shrink: 0;
      transition: background 0.4s;
    }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .is-live #live-dot   { background: #22c55e; animation: pulse 1.8s ease-in-out infinite; }
    .is-dead #live-dot   { background: #ef4444; animation: none; }
    .is-live #live-label { color: #86efac; }
    .is-dead #live-label { color: #fca5a5; }

    @keyframes flash { 0% { opacity: 0.4; } 100% { opacity: 1; } }
    .flash { animation: flash 0.35s ease-out; }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
    }
    .filter-label { font-size: 0.67rem; color: var(--muted); }

    .filter-btn {
      padding: 4px 11px;
      border-radius: 9999px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--secondary);
      font-size: 0.67rem;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s;
    }
    .filter-btn:hover  { border-color: #6366f1; color: #a5b4fc; }
    .filter-btn.active { background: #1e1b4b; border-color: #6366f1; color: #a5b4fc; font-weight: 600; }

    .ts-badge {
      font-size: 0.62rem;
      color: var(--muted);
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* ── Layout ─────────────────────────────── */
    .workspace { display: flex; flex: 1; overflow: hidden; }

    /* ── Board ──────────────────────────────── */
    .board {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      padding: 16px;
      flex: 1;
      overflow: hidden;
      min-width: 0;
    }

    .column {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .col-header {
      padding: 11px 14px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .col-dot   { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .col-title { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .col-count {
      margin-left: auto;
      padding: 1px 8px;
      border-radius: 9999px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      font-size: 0.62rem;
      color: var(--muted);
    }

    .col-body {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .col-empty {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #334155;
      font-size: 0.75rem;
      text-align: center;
      padding: 24px;
    }

    /* ── Cards ──────────────────────────────── */
    .card {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 14px;
      cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
      border-left: 3px solid transparent;
    }
    .card:hover    { border-color: #475569; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
    .card.selected { border-color: #6366f1 !important; }
    .card[data-status="OPEN"]    { border-left-color: #6366f1; }
    .card[data-status="BLOCKED"] { border-left-color: #ef4444; }
    .card[data-status="CLOSED"]  { border-left-color: #22c55e; }

    .card-top {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 7px;
      flex-wrap: wrap;
    }
    .domain-badge {
      font-size: 0.6rem;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 4px;
      background: #1e1b4b;
      color: #a5b4fc;
      border: 1px solid #3730a3;
    }
    .type-badge {
      font-size: 0.6rem;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 4px;
      background: #292524;
      color: #a8a29e;
      border: 1px solid #44403c;
    }
    .card-id {
      font-size: 0.78rem;
      font-weight: 700;
      color: #f1f5f9;
      font-family: "SF Mono", Consolas, monospace;
      margin-bottom: 7px;
      word-break: break-word;
    }
    .card-meta {
      display: flex;
      gap: 10px;
      font-size: 0.67rem;
      color: var(--muted);
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .task-pill {
      font-size: 0.62rem;
      padding: 2px 8px;
      border-radius: 9999px;
      background: var(--surface);
      color: var(--muted);
      border: 1px solid var(--border);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .task-pill-progress {
      font-size: 0.62rem;
      padding: 2px 8px;
      border-radius: 9999px;
      background: #052e16;
      color: #86efac;
      border: 1px solid #166534;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .touch-hint {
      font-size: 0.62rem;
      color: #475569;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    /* ── Pipeline de fases SDD ─────────────── */
    .pipeline {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 8px;
    }
    .ph {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #334155;
      flex-shrink: 0;
    }
    .ph.done    { background: #22c55e; }
    .ph.current { background: #6366f1; animation: pulse 1.6s ease-in-out infinite; }
    .ph-label {
      font-size: 0.58rem;
      color: var(--muted);
      margin-left: 3px;
      font-family: "SF Mono", Consolas, monospace;
      white-space: nowrap;
    }
    .ph-label.closed { color: #86efac; }

    /* ── Sidebar ─────────────────────────────── */
    #sidebar {
      width: 310px;
      flex-shrink: 0;
      background: var(--surface);
      border-left: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .sidebar-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #334155;
      font-size: 0.8rem;
      text-align: center;
      padding: 32px;
    }
    #sidebar-content {
      flex: 1;
      overflow-y: auto;
      padding: 18px;
    }

    .detail-status {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 0.63rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      margin-bottom: 10px;
    }
    .detail-status.OPEN    { background: #1e1b4b; color: #a5b4fc; border: 1px solid #3730a3; }
    .detail-status.BLOCKED { background: #450a0a; color: #fca5a5; border: 1px solid #991b1b; }
    .detail-status.CLOSED  { background: #052e16; color: #86efac; border: 1px solid #166534; }

    .detail-id {
      font-size: 0.9rem;
      font-weight: 700;
      color: #f8fafc;
      font-family: "SF Mono", Consolas, monospace;
      margin-bottom: 4px;
      line-height: 1.4;
      word-break: break-all;
    }

    .detail-section {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid var(--border-2);
    }
    .detail-section h4 {
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #475569;
      margin-bottom: 8px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
      font-size: 0.73rem;
      padding: 4px 0;
      border-bottom: 1px solid var(--border-2);
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-row .key { color: var(--muted); flex-shrink: 0; }
    .detail-row .val {
      color: var(--text);
      font-family: "SF Mono", Consolas, monospace;
      font-size: 0.68rem;
      text-align: right;
      word-break: break-all;
    }
    .touch-chip {
      display: block;
      font-size: 0.67rem;
      color: var(--secondary);
      padding: 4px 8px;
      background: var(--surface-2);
      border-radius: 4px;
      font-family: "SF Mono", Consolas, monospace;
      margin-bottom: 4px;
      word-break: break-all;
    }
    .decision-chip {
      display: block;
      font-size: 0.7rem;
      color: #fde68a;
      padding: 5px 8px;
      background: #1c1709;
      border-radius: 4px;
      border-left: 2px solid #d97706;
      margin-bottom: 4px;
      line-height: 1.45;
    }
    .sprint-goal {
      font-size: 0.73rem;
      color: var(--secondary);
      line-height: 1.55;
      padding: 8px;
      background: var(--surface-2);
      border-radius: 6px;
      border-left: 3px solid #6366f1;
    }

    /* ── Task list en sidebar ───────────────── */
    .task-section-name {
      font-size: 0.58rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: #475569;
      margin: 10px 0 4px;
    }
    .task-section-name:first-child { margin-top: 0; }
    .task-item {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      padding: 4px 6px;
      border-radius: 4px;
      margin-bottom: 2px;
      background: var(--surface-2);
    }
    .task-tid {
      font-family: "SF Mono", Consolas, monospace;
      font-size: 0.6rem;
      color: #6366f1;
      flex-shrink: 0;
      padding-top: 1px;
      min-width: 30px;
    }
    .task-desc {
      font-size: 0.7rem;
      color: var(--secondary);
      line-height: 1.4;
    }
    .task-done .task-desc { text-decoration: line-through; color: #475569; }
    .task-chk  { font-size: 0.65rem; flex-shrink: 0; padding-top: 1px; }
    .task-progress-bar {
      height: 3px;
      background: var(--border);
      border-radius: 99px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .task-progress-fill {
      height: 100%;
      background: #22c55e;
      border-radius: 99px;
      transition: width 0.4s ease;
    }
    .task-progress-label {
      font-size: 0.62rem;
      color: var(--muted);
      margin-bottom: 8px;
    }

    /* ── Scrollbar ───────────────────────────── */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #475569; }
  </style>
</head>
<body>

<header>
  <div>
    <h1>SDD Model — Kanban</h1>
    <p>Spec-Driven Development · live</p>
  </div>
  <div class="live-badge" id="live-badge">
    <span id="live-dot"></span>
    <span id="live-label">Conectando...</span>
  </div>
  <div class="filter-group" id="sprint-filters">
    <span class="filter-label">Sprint:</span>
  </div>
  <span class="ts-badge" id="ts-badge">—</span>
</header>

<div class="workspace">
  <div class="board" id="board"></div>

  <div id="sidebar">
    <div class="sidebar-empty" id="sidebar-empty">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
      <span>Hacé clic en una feature para ver el detalle</span>
    </div>
    <div id="sidebar-content" style="display:none"></div>
  </div>
</div>

<script>
// ── Datos iniciales (server-side render) ───────────────────────────────────
let DATA = ${JSON.stringify(data).replace(/</g, '\\u003c')};

// ── Escape de HTML — todo dato de YAML/MD es input no confiable ────────────
const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const COLUMNS = [
  { status: 'OPEN',    label: 'Open',    color: '#6366f1' },
  { status: 'BLOCKED', label: 'Blocked', color: '#ef4444' },
  { status: 'CLOSED',  label: 'Closed',  color: '#22c55e' },
];

let activeSprint = 'ALL';
let selectedId   = null;

// ── Sprint filters ─────────────────────────────────────────────────────────
function renderFilters() {
  const container = document.getElementById('sprint-filters');
  container.querySelectorAll('.filter-btn').forEach(b => b.remove());
  const ids = ['ALL', ...DATA.sprints.map(s => s.sprint).filter(Boolean).sort()];
  ids.forEach(id => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (id === activeSprint ? ' active' : '');
    btn.textContent = id === 'ALL' ? 'Todos' : id;
    btn.onclick = () => {
      activeSprint = id;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderBoard();
    };
    container.appendChild(btn);
  });
}

// ── Board ──────────────────────────────────────────────────────────────────
function renderBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  const pool = activeSprint === 'ALL'
    ? DATA.features
    : DATA.features.filter(f => f.sprint === activeSprint);

  COLUMNS.forEach(col => {
    const items = pool.filter(f => (f.status || 'OPEN').toUpperCase() === col.status);
    const column = document.createElement('div');
    column.className = 'column';
    column.innerHTML = \`
      <div class="col-header">
        <span class="col-dot" style="background:\${col.color}"></span>
        <span class="col-title" style="color:\${col.color}">\${col.label}</span>
        <span class="col-count">\${items.length}</span>
      </div>
      <div class="col-body" id="col-\${col.status}"></div>
    \`;
    board.appendChild(column);
    const body = column.querySelector('.col-body');
    if (!items.length) {
      body.innerHTML = '<div class="col-empty">Sin features</div>';
    } else {
      items.forEach(f => body.appendChild(buildCard(f)));
    }
  });
}
// ── Pipeline de fases SDD ─────────────────────────────────────────────
const PHASES = ['refine', 'generate', 'validate', 'implement', 'review'];

function pipelineInfo(f) {
  const status = (f.status || 'OPEN').toUpperCase();
  if (status === 'CLOSED') return { done: 5, current: -1, label: 'ciclo completo ✓', closed: true };

  const cmd = (f.lastCommand || '').split('sdd-').pop();
  let done = PHASES.indexOf(cmd) + 1;           // fases completadas según last_command
  if (done < 0) done = 0;

  // Si hay tareas marcadas [x], implement está en curso aunque last_command sea anterior
  const anyTaskDone = f.tasks?.some(t => t.done === true);
  if (anyTaskDone && done < 4) done = 3;

  const current = done < 5 ? done : -1;
  return { done, current, label: current >= 0 ? PHASES[current] : '—', closed: false };
}

function buildPipelineHtml(f) {
  const pi = pipelineInfo(f);
  return \`
    <div class="pipeline" title="Fases SDD: \${PHASES.join(' → ')}">
      \${PHASES.map((p, i) => \`<span class="ph \${i < pi.done ? 'done' : i === pi.current ? 'current' : ''}" title="\${p}"></span>\`).join('')}
      <span class="ph-label \${pi.closed ? 'closed' : ''}">\${pi.label}</span>
    </div>
  \`;
}
// ── Card ───────────────────────────────────────────────────────────────────
function buildCard(f) {
  const card = document.createElement('div');
  card.className = 'card' + (f.id === selectedId ? ' selected' : '');
  card.dataset.status = (f.status || 'OPEN').toUpperCase();
  card.dataset.id = f.id;

  // Task progress pill
  const done     = f.tasks?.filter(t => t.done === true).length ?? 0;
  const hasDone  = f.tasks?.some(t => t.done !== null) ?? false;
  const total    = f.taskCount ?? 0;
  const taskHtml = total === 0 ? '' :
    hasDone
      ? \`<span class="task-pill-progress">\${done}/\${total} done</span>\`
      : \`<span class="task-pill">\${total} tareas</span>\`;

  const firstTouch = f.touches?.[0] ?? null;
  const extra      = (f.touches?.length ?? 0) - 1;

  card.innerHTML = \`
    <div class="card-top">
      \${f.domain ? \`<span class="domain-badge">\${esc(f.domain)}</span>\` : ''}
      \${f.type && f.type !== 'feature' ? \`<span class="type-badge">\${esc(f.type)}</span>\` : ''}
    </div>
    <div class="card-id">\${esc(f.id)}</div>
    \${buildPipelineHtml(f)}
    <div class="card-meta">
      <span>👤 \${esc(f.owner || '—')}</span>
      <span>📅 \${esc(f.sprint || '—')}</span>
    </div>
    <div class="card-footer">
      \${firstTouch ? \`<span class="touch-hint">📁 \${esc(firstTouch)}\${extra > 0 ? ' +' + extra : ''}</span>\` : '<span></span>'}
      \${taskHtml}
    </div>
  \`;
  card.addEventListener('click', () => selectFeature(f.id));
  return card;
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function selectFeature(id) {
  selectedId = id;
  document.querySelectorAll('.card').forEach(c => c.classList.toggle('selected', c.dataset.id === id));
  const f = DATA.features.find(x => x.id === id);
  if (!f) return;

  const statusNorm = (f.status || 'OPEN').toUpperCase();
  const sprint     = DATA.sprints.find(s => s.sprint === f.sprint);

  const done  = f.tasks?.filter(t => t.done === true).length  ?? 0;
  const total = f.taskCount ?? 0;
  const hasDone = f.tasks?.some(t => t.done !== null) ?? false;

  // Group tasks by section
  const sections = [];
  let current = null;
  for (const t of (f.tasks || [])) {
    if (!current || current.name !== t.section) {
      current = { name: t.section, tasks: [] };
      sections.push(current);
    }
    current.tasks.push(t);
  }

  document.getElementById('sidebar-empty').style.display = 'none';
  const content = document.getElementById('sidebar-content');
  content.style.display = 'block';

  const rows = [
    ['Dominio',   f.domain      || '—'],
    ['Owner',     f.owner       || '—'],
    ['Sprint',    f.sprint      || '—'],
    ['Fase SDD',  pipelineInfo(f).label],
    ['Creado',    f.created     || '—'],
    ...(f.closed      ? [['Cerrado',    f.closed]]                : []),
    ...(f.lastCommand ? [['Último cmd', '/' + f.lastCommand]]     : []),
    ...(total > 0     ? [['Tareas',     hasDone ? \`\${done}/\${total} completadas\` : \`\${total} total\`]] : []),
  ];

  content.innerHTML = \`
    <span class="detail-status \${esc(statusNorm)}">\${esc(statusNorm)}</span>
    <div class="detail-id">\${esc(f.id)}</div>

    <div class="detail-section">
      <h4>Información</h4>
      \${rows.map(([k, v]) => \`
        <div class="detail-row">
          <span class="key">\${k}</span>
          <span class="val">\${esc(v)}</span>
        </div>
      \`).join('')}
    </div>

    \${sprint?.goal ? \`
    <div class="detail-section">
      <h4>Objetivo del sprint</h4>
      <div class="sprint-goal">\${esc(sprint.goal)}</div>
    </div>
    \` : ''}

    \${total > 0 ? \`
    <div class="detail-section">
      <h4>Tareas (\${total})</h4>
      \${hasDone ? \`
        <div class="task-progress-bar">
          <div class="task-progress-fill" style="width:\${Math.round(done / total * 100)}%"></div>
        </div>
        <div class="task-progress-label">\${done} de \${total} completadas (\${Math.round(done / total * 100)}%)</div>
      \` : ''}
      \${sections.map(sec => \`
        \${sections.length > 1 ? \`<div class="task-section-name">\${esc(sec.name)}</div>\` : ''}
        \${sec.tasks.map(t => \`
          <div class="task-item \${t.done === true ? 'task-done' : ''}">
            \${t.done !== null ? \`<span class="task-chk">\${t.done ? '✓' : '·'}</span>\` : ''}
            \${t.id ? \`<span class="task-tid">\${esc(t.id)}</span>\` : ''}
            <span class="task-desc">\${esc(t.desc)}</span>
          </div>
        \`).join('')}
      \`).join('')}
    </div>
    \` : ''}

    \${f.touches?.length ? \`
    <div class="detail-section">
      <h4>Archivos tocados (\${f.touches.length})</h4>
      \${f.touches.map(t => \`<span class="touch-chip">\${esc(t)}</span>\`).join('')}
    </div>
    \` : ''}

    \${f.decisions?.length ? \`
    <div class="detail-section">
      <h4>Decisiones</h4>
      \${f.decisions.map(d => \`<span class="decision-chip">\${esc(d)}</span>\`).join('')}
    </div>
    \` : ''}
  \`;
}

// ── Live status indicator ──────────────────────────────────────────────────
function setLive(status) {
  const badge = document.getElementById('live-badge');
  const label = document.getElementById('live-label');
  badge.className = 'live-badge ' + (status === 'live' ? 'is-live' : status === 'dead' ? 'is-dead' : '');
  label.textContent = status === 'live' ? 'En vivo' : status === 'dead' ? 'Desconectado' : 'Conectando...';
}

// ── SSE client ─────────────────────────────────────────────────────────────
async function fetchAndRender() {
  try {
    const res  = await fetch('/api/data');
    if (!res.ok) throw new Error(res.statusText);
    DATA = await res.json();
    renderFilters();
    renderBoard();
    if (selectedId) selectFeature(selectedId);
    document.getElementById('ts-badge').textContent =
      'Actualizado: ' + new Date(DATA.generatedAt).toLocaleTimeString('es');
    // Flash the board to signal the update
    document.getElementById('board').classList.remove('flash');
    void document.getElementById('board').offsetWidth; // force reflow
    document.getElementById('board').classList.add('flash');
  } catch (e) {
    console.error('[kanban] fetch error:', e);
  }
}

function connectSSE() {
  const es = new EventSource('/api/events');
  es.onopen    = () => setLive('live');
  es.onerror   = () => { setLive('dead'); setTimeout(connectSSE, 3000); es.close(); };
  es.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'update') fetchAndRender();
  };
}

// ── Init ───────────────────────────────────────────────────────────────────
const d = new Date(DATA.generatedAt);
document.getElementById('ts-badge').textContent =
  'Cargado: ' + d.toLocaleTimeString('es');

renderFilters();
renderBoard();
connectSSE();
</script>
</body>
</html>`;
}
