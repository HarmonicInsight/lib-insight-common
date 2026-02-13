#!/usr/bin/env node
/**
 * Product Catalog Editor — product-catalog.ts の GUI 編集ツール
 *
 * 起動: node scripts/catalog-editor.mjs
 * ブラウザで http://localhost:3456 を開く
 */

import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = resolve(__dirname, '../config/product-catalog.ts');
const PORT = 3456;

// =============================================================================
// File I/O
// =============================================================================

function findArrayBounds(text) {
  const marker = 'export const PRODUCT_CATALOG: CatalogEntry[] = [';
  const idx = text.indexOf(marker);
  if (idx === -1) throw new Error('PRODUCT_CATALOG not found in file');
  const openBracket = idx + marker.length - 1;

  let depth = 0;
  let inStr = false;
  let strCh = '';
  let esc = false;

  for (let i = openBracket; i < text.length; i++) {
    const ch = text[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; continue; }
    if (inStr) { if (ch === strCh) inStr = false; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { inStr = true; strCh = ch; continue; }
    if (ch === '[') depth++;
    if (ch === ']') { depth--; if (depth === 0) return { start: openBracket, end: i }; }
  }
  throw new Error('Matching bracket not found');
}

function readCatalog() {
  const text = readFileSync(CATALOG_PATH, 'utf8');
  const { start, end } = findArrayBounds(text);
  const arrayText = text.substring(start, end + 1);
  try {
    return new Function(`return ${arrayText}`)();
  } catch (e) {
    throw new Error(`Failed to parse PRODUCT_CATALOG: ${e.message}`);
  }
}

function q(s) {
  return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

function serializeI18n(obj, indent) {
  return `{ en: ${q(obj.en)}, ja: ${q(obj.ja)}, zh: ${q(obj.zh)} }`;
}

function serializeI18nMultiline(obj, indent) {
  const pad = ' '.repeat(indent);
  return `{\n${pad}  en: ${q(obj.en)},\n${pad}  ja: ${q(obj.ja)},\n${pad}  zh: ${q(obj.zh)},\n${pad}}`;
}

function serializeI18nArray(obj, indent) {
  const pad = ' '.repeat(indent);
  const inner = ' '.repeat(indent + 4);
  const serArr = (arr) => arr.map(s => `${inner}${q(s)},`).join('\n');
  return `{\n${pad}  en: [\n${serArr(obj.en)}\n${pad}  ],\n${pad}  ja: [\n${serArr(obj.ja)}\n${pad}  ],\n${pad}  zh: [\n${serArr(obj.zh)}\n${pad}  ],\n${pad}}`;
}

function serializeEntry(entry) {
  const I = '    ';
  const lines = [];
  lines.push('  {');
  lines.push(`${I}code: ${q(entry.code)},`);
  lines.push(`${I}slug: ${q(entry.slug)},`);
  lines.push(`${I}status: ${q(entry.status)},`);
  lines.push(`${I}displayOrder: ${entry.displayOrder},`);
  lines.push(`${I}category: ${q(entry.category)},`);
  lines.push(`${I}svgIcon: ${q(entry.svgIcon)},`);
  lines.push(`${I}colorGradient: ${q(entry.colorGradient)},`);
  lines.push(`${I}platforms: [${entry.platforms.map(q).join(', ')}],`);
  lines.push(`${I}name: ${serializeI18n(entry.name, 4)},`);
  lines.push(`${I}tagline: ${serializeI18nMultiline(entry.tagline, 4)},`);
  lines.push(`${I}description: ${serializeI18nMultiline(entry.description, 4)},`);
  lines.push(`${I}features: ${serializeI18nArray(entry.features, 4)},`);
  lines.push(`${I}useCases: ${serializeI18nArray(entry.useCases, 4)},`);

  // releases
  const relKeys = Object.keys(entry.releases || {});
  if (relKeys.length === 0) {
    lines.push(`${I}releases: {},`);
  } else {
    lines.push(`${I}releases: {`);
    for (const pk of relKeys) {
      const r = entry.releases[pk];
      const parts = [`version: ${q(r.version)}`, `tag: ${q(r.tag)}`, `fileName: ${q(r.fileName)}`];
      if (r.releaseDate) parts.push(`releaseDate: ${q(r.releaseDate)}`);
      lines.push(`${I}  ${pk}: { ${parts.join(', ')} },`);
    }
    lines.push(`${I}},`);
  }

  // screenshots
  if (entry.screenshots && entry.screenshots.length > 0) {
    lines.push(`${I}screenshots: [`);
    for (const ss of entry.screenshots) {
      lines.push(`${I}  { file: ${q(ss.file)}, label: ${serializeI18n(ss.label, 6)} },`);
    }
    lines.push(`${I}],`);
  }

  lines.push('  },');
  return lines.join('\n');
}

function serializeCatalog(entries) {
  const catComments = {
    rpa: 'カテゴリ: Automation & Delivery (rpa)',
    consulting: 'カテゴリ: Business Analysis & Strategy (consulting)',
    content: 'カテゴリ: Content Creation (content)',
    utility: 'カテゴリ: Utility Apps (utility)',
  };
  const groups = {};
  for (const e of entries) {
    if (!groups[e.category]) groups[e.category] = [];
    groups[e.category].push(e);
  }
  const parts = [];
  for (const cat of ['rpa', 'consulting', 'content', 'utility']) {
    if (!groups[cat] || groups[cat].length === 0) continue;
    parts.push('');
    parts.push('  // ===========================================================================');
    parts.push(`  // ${catComments[cat]}`);
    parts.push('  // ===========================================================================');
    parts.push('');
    for (const entry of groups[cat]) {
      parts.push(serializeEntry(entry));
    }
  }
  return `[\n${parts.join('\n')}\n]`;
}

function writeCatalog(entries) {
  const text = readFileSync(CATALOG_PATH, 'utf8');
  const { start, end } = findArrayBounds(text);
  const newArray = serializeCatalog(entries);
  const newText = text.substring(0, start) + newArray + text.substring(end + 1);
  writeFileSync(CATALOG_PATH, newText, 'utf8');
}

// =============================================================================
// HTTP Server
// =============================================================================

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/catalog' && req.method === 'GET') {
    try {
      const data = readCatalog();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  if (url.pathname === '/api/catalog' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const entries = JSON.parse(body);
        writeCatalog(entries);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML);
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════════════╗`);
  console.log(`  ║   Product Catalog Editor                 ║`);
  console.log(`  ║   http://localhost:${PORT}                  ║`);
  console.log(`  ║   Ctrl+C to stop                         ║`);
  console.log(`  ╚══════════════════════════════════════════╝\n`);
});

// =============================================================================
// HTML UI
// =============================================================================

const HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Product Catalog Editor</title>
<style>
:root {
  --gold: #B8942F;
  --gold-dark: #8C711E;
  --gold-light: #D4B84A;
  --ivory: #FAF8F5;
  --ivory-dark: #F3F0EB;
  --text: #1C1917;
  --text2: #57534E;
  --border: #E7E2DA;
  --success: #16A34A;
  --warning: #CA8A04;
  --error: #DC2626;
  --dev-bg: #FEF3C7;
  --dev-text: #92400E;
  --hidden-bg: #F3F4F6;
  --hidden-text: #6B7280;
  --pub-bg: #DCFCE7;
  --pub-text: #166534;
}
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: -apple-system, 'Segoe UI', sans-serif; background: var(--ivory); color: var(--text); height:100vh; display:flex; flex-direction:column; }

/* Header */
.header { background:#fff; border-bottom:1px solid var(--border); padding:0 20px; height:56px; display:flex; align-items:center; gap:16px; flex-shrink:0; }
.header h1 { font-size:16px; color:var(--gold-dark); font-weight:700; }
.header .spacer { flex:1; }
.header .status-msg { font-size:13px; color:var(--text2); }
.header .status-msg.saved { color:var(--success); }
.btn { padding:7px 16px; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; border:none; transition:all .15s; }
.btn-primary { background:var(--gold); color:#fff; }
.btn-primary:hover { background:var(--gold-dark); }
.btn-primary:disabled { background:#ccc; cursor:default; }
.btn-outline { background:transparent; border:1px solid var(--border); color:var(--text2); }
.btn-outline:hover { background:var(--ivory-dark); }
.btn-danger { background:var(--error); color:#fff; }
.btn-danger:hover { background:#B91C1C; }

/* Layout */
.main { display:flex; flex:1; overflow:hidden; }
.sidebar { width:300px; border-right:1px solid var(--border); background:#fff; display:flex; flex-direction:column; flex-shrink:0; }
.sidebar-header { padding:12px 16px; border-bottom:1px solid var(--border); display:flex; gap:8px; flex-wrap:wrap; }
.sidebar-header select, .sidebar-header input { font-size:12px; padding:5px 8px; border:1px solid var(--border); border-radius:4px; background:#fff; }
.sidebar-header input { flex:1; min-width:80px; }
.product-list { flex:1; overflow-y:auto; }
.product-item { padding:10px 16px; border-bottom:1px solid var(--border); cursor:pointer; display:flex; align-items:center; gap:10px; transition:background .1s; }
.product-item:hover { background:var(--ivory); }
.product-item.active { background:var(--ivory-dark); border-left:3px solid var(--gold); }
.product-item .icon-preview { width:32px; height:32px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.product-item .icon-preview svg { width:16px; height:16px; }
.product-item .info { flex:1; min-width:0; }
.product-item .info .name { font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.product-item .info .code { font-size:11px; color:var(--text2); }
.badge { font-size:10px; padding:2px 8px; border-radius:10px; font-weight:600; white-space:nowrap; }
.badge-published { background:var(--pub-bg); color:var(--pub-text); }
.badge-development { background:var(--dev-bg); color:var(--dev-text); }
.badge-hidden { background:var(--hidden-bg); color:var(--hidden-text); }

/* Editor */
.editor { flex:1; overflow-y:auto; padding:24px; }
.editor-empty { display:flex; align-items:center; justify-content:center; height:100%; color:var(--text2); font-size:15px; }
.section { background:#fff; border:1px solid var(--border); border-radius:10px; padding:20px; margin-bottom:16px; }
.section h2 { font-size:14px; font-weight:700; color:var(--gold-dark); margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid var(--border); }
.form-row { display:flex; gap:12px; margin-bottom:10px; align-items:flex-start; }
.form-group { display:flex; flex-direction:column; gap:4px; }
.form-group.flex1 { flex:1; }
.form-group label { font-size:11px; font-weight:600; color:var(--text2); text-transform:uppercase; letter-spacing:.5px; }
.form-group input, .form-group select, .form-group textarea { font-size:13px; padding:7px 10px; border:1px solid var(--border); border-radius:5px; background:#fff; font-family:inherit; }
.form-group textarea { resize:vertical; min-height:80px; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline:none; border-color:var(--gold); box-shadow:0 0 0 2px rgba(184,148,47,.15); }
.checkbox-group { display:flex; gap:12px; flex-wrap:wrap; }
.checkbox-group label { font-size:13px; font-weight:400; text-transform:none; display:flex; align-items:center; gap:4px; cursor:pointer; }
.checkbox-group input[type=checkbox] { accent-color:var(--gold); }

/* Language tabs */
.lang-tabs { display:flex; gap:2px; margin-bottom:10px; }
.lang-tab { padding:5px 14px; font-size:12px; font-weight:600; border:1px solid var(--border); background:#fff; cursor:pointer; border-radius:5px 5px 0 0; color:var(--text2); }
.lang-tab.active { background:var(--gold); color:#fff; border-color:var(--gold); }

/* List editor */
.list-editor { display:flex; flex-direction:column; gap:4px; }
.list-editor .list-item { display:flex; gap:6px; align-items:center; }
.list-editor .list-item input { flex:1; font-size:13px; padding:5px 8px; border:1px solid var(--border); border-radius:4px; }
.list-editor .list-item button { width:24px; height:24px; border:none; background:none; cursor:pointer; color:var(--error); font-size:16px; border-radius:4px; }
.list-editor .list-item button:hover { background:#FEE2E2; }
.list-editor .add-btn { font-size:12px; color:var(--gold-dark); cursor:pointer; background:none; border:1px dashed var(--border); padding:4px 10px; border-radius:4px; margin-top:4px; align-self:flex-start; }
.list-editor .add-btn:hover { background:var(--ivory); }

/* Release editor */
.release-row { display:flex; gap:8px; align-items:center; margin-bottom:8px; padding:10px; background:var(--ivory); border-radius:6px; flex-wrap:wrap; }
.release-row .platform-label { font-size:12px; font-weight:600; color:var(--text2); width:70px; flex-shrink:0; }
.release-row input { font-size:12px; padding:5px 8px; border:1px solid var(--border); border-radius:4px; }
.release-row .ver { width:70px; }
.release-row .tag { width:140px; }
.release-row .fname { flex:1; min-width:150px; }

/* Icon preview */
.icon-display { width:48px; height:48px; border-radius:10px; display:flex; align-items:center; justify-content:center; }
.icon-display svg { width:24px; height:24px; }

/* Add product */
.sidebar-footer { padding:10px 16px; border-top:1px solid var(--border); }

/* Responsive */
@media (max-width:900px) { .sidebar { width:240px; } }
</style>
</head>
<body>

<div class="header">
  <h1>Product Catalog Editor</h1>
  <span class="spacer"></span>
  <span id="statusMsg" class="status-msg"></span>
  <button class="btn btn-outline" onclick="loadData()">Reload</button>
  <button class="btn btn-primary" id="saveBtn" onclick="saveData()" disabled>Save</button>
</div>

<div class="main">
  <div class="sidebar">
    <div class="sidebar-header">
      <select id="filterStatus" onchange="renderList()">
        <option value="">All Status</option>
        <option value="published">Published</option>
        <option value="development">Development</option>
        <option value="hidden">Hidden</option>
      </select>
      <select id="filterCategory" onchange="renderList()">
        <option value="">All Category</option>
        <option value="rpa">RPA</option>
        <option value="consulting">Consulting</option>
        <option value="content">Content</option>
        <option value="utility">Utility</option>
      </select>
    </div>
    <div class="product-list" id="productList"></div>
    <div class="sidebar-footer">
      <button class="btn btn-outline" style="width:100%" onclick="addProduct()">+ Add Product</button>
    </div>
  </div>
  <div class="editor" id="editorPanel">
    <div class="editor-empty">Select a product to edit</div>
  </div>
</div>

<script>
let catalog = [];
let selectedIdx = -1;
let dirty = false;
let currentLang = 'ja';

async function loadData() {
  try {
    const res = await fetch('/api/catalog');
    catalog = await res.json();
    dirty = false;
    updateSaveBtn();
    renderList();
    if (selectedIdx >= 0 && selectedIdx < catalog.length) renderEditor();
    else { selectedIdx = -1; document.getElementById('editorPanel').innerHTML = '<div class="editor-empty">Select a product to edit</div>'; }
    showMsg('Loaded', false);
  } catch (e) { showMsg('Load error: ' + e.message, true); }
}

async function saveData() {
  try {
    const res = await fetch('/api/catalog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(catalog) });
    const r = await res.json();
    if (r.ok) { dirty = false; updateSaveBtn(); showMsg('Saved!', false); }
    else throw new Error(r.error);
  } catch (e) { showMsg('Save error: ' + e.message, true); }
}

function markDirty() { dirty = true; updateSaveBtn(); }
function updateSaveBtn() { document.getElementById('saveBtn').disabled = !dirty; }
function showMsg(msg, isErr) {
  const el = document.getElementById('statusMsg');
  el.textContent = msg;
  el.className = 'status-msg' + (isErr ? '' : ' saved');
  if (!isErr) setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 3000);
}

function badgeClass(status) {
  return { published: 'badge-published', development: 'badge-development', hidden: 'badge-hidden' }[status] || '';
}
function badgeLabel(status) {
  return { published: 'Published', development: 'Dev', hidden: 'Hidden' }[status] || status;
}

function renderList() {
  const fs = document.getElementById('filterStatus').value;
  const fc = document.getElementById('filterCategory').value;
  const list = document.getElementById('productList');
  list.innerHTML = '';
  catalog.forEach((p, i) => {
    if (fs && p.status !== fs) return;
    if (fc && p.category !== fc) return;
    const div = document.createElement('div');
    div.className = 'product-item' + (i === selectedIdx ? ' active' : '');
    div.onclick = () => { selectedIdx = i; renderList(); renderEditor(); };
    div.innerHTML = \`
      <div class="icon-preview" style="background:linear-gradient(135deg, \${gradientColors(p.colorGradient)})">
        <svg fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="\${esc(p.svgIcon)}"/></svg>
      </div>
      <div class="info">
        <div class="name">\${esc(p.name.ja || p.name.en)}</div>
        <div class="code">\${esc(p.code)}</div>
      </div>
      <span class="badge \${badgeClass(p.status)}">\${badgeLabel(p.status)}</span>\`;
    list.appendChild(div);
  });
}

function gradientColors(cls) {
  const m = { 'emerald-500':'#10B981','emerald-600':'#059669','teal-600':'#0D9488','violet-500':'#8B5CF6','indigo-600':'#4F46E5','sky-500':'#0EA5E9','cyan-600':'#0891B2','green-500':'#22C55E','green-700':'#15803D','rose-400':'#FB7185','pink-600':'#DB2777','amber-500':'#F59E0B','yellow-700':'#A16207','orange-400':'#FB923C','amber-600':'#D97706','teal-500':'#14B8A6','red-500':'#EF4444','rose-600':'#E11D48','purple-500':'#A855F7','pink-500':'#EC4899','gray-500':'#6B7280','gray-700':'#374151','blue-500':'#3B82F6','blue-700':'#1D4ED8','indigo-400':'#818CF8','slate-500':'#64748B','slate-700':'#334155','yellow-400':'#FACC15','orange-500':'#F97316','pink-400':'#F472B6','red-600':'#DC2626' };
  const parts = cls.split(/\\s+/);
  let from = '#888', to = '#555';
  for (const p of parts) {
    const c = p.replace(/^from-/,'').replace(/^to-/,'');
    if (p.startsWith('from-') && m[c]) from = m[c];
    if (p.startsWith('to-') && m[c]) to = m[c];
  }
  return from + ', ' + to;
}

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function cur() { return catalog[selectedIdx]; }

function renderEditor() {
  if (selectedIdx < 0 || selectedIdx >= catalog.length) return;
  const p = cur();
  const panel = document.getElementById('editorPanel');
  panel.innerHTML = \`
    <div class="section">
      <h2>Basic Info</h2>
      <div class="form-row">
        <div class="form-group" style="width:120px"><label>Code</label><input value="\${esc(p.code)}" onchange="cur().code=this.value;markDirty();renderList()"></div>
        <div class="form-group flex1"><label>Slug</label><input value="\${esc(p.slug)}" onchange="cur().slug=this.value;markDirty()"></div>
        <div class="form-group" style="width:150px"><label>Status</label>
          <select onchange="cur().status=this.value;markDirty();renderList()">
            <option value="published" \${p.status==='published'?'selected':''}>Published (公開中)</option>
            <option value="development" \${p.status==='development'?'selected':''}>Development (開発中)</option>
            <option value="hidden" \${p.status==='hidden'?'selected':''}>Hidden (非公開)</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group" style="width:150px"><label>Category</label>
          <select onchange="cur().category=this.value;markDirty();renderList()">
            <option value="rpa" \${p.category==='rpa'?'selected':''}>RPA</option>
            <option value="consulting" \${p.category==='consulting'?'selected':''}>Consulting</option>
            <option value="content" \${p.category==='content'?'selected':''}>Content</option>
            <option value="utility" \${p.category==='utility'?'selected':''}>Utility</option>
          </select>
        </div>
        <div class="form-group" style="width:100px"><label>Display Order</label>
          <input type="number" value="\${p.displayOrder}" onchange="cur().displayOrder=+this.value;markDirty()">
        </div>
        <div class="form-group flex1"><label>Platforms</label>
          <div class="checkbox-group">
            \${['windows','web','android','ios'].map(pl => \`<label><input type="checkbox" \${p.platforms.includes(pl)?'checked':''} onchange="togglePlatform('\${pl}',this.checked)">\${pl}</label>\`).join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Appearance</h2>
      <div class="form-row" style="align-items:center">
        <div class="icon-display" id="iconPreview" style="background:linear-gradient(135deg, \${gradientColors(p.colorGradient)})">
          <svg fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="\${esc(p.svgIcon)}"/></svg>
        </div>
        <div class="form-group flex1"><label>SVG Icon Path</label>
          <input value="\${esc(p.svgIcon)}" onchange="cur().svgIcon=this.value;markDirty();renderEditor()">
        </div>
        <div class="form-group" style="width:220px"><label>Color Gradient</label>
          <input value="\${esc(p.colorGradient)}" onchange="cur().colorGradient=this.value;markDirty();renderEditor()">
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Content</h2>
      <div class="lang-tabs">
        \${['ja','en','zh'].map(l => \`<div class="lang-tab \${currentLang===l?'active':''}" onclick="currentLang='\${l}';renderEditor()">\${l.toUpperCase()}</div>\`).join('')}
      </div>
      <div class="form-row">
        <div class="form-group flex1"><label>Name</label>
          <input value="\${esc(p.name[currentLang])}" onchange="cur().name[currentLang]=this.value;markDirty();renderList()">
        </div>
      </div>
      <div class="form-group" style="margin-bottom:10px"><label>Tagline</label>
        <input value="\${esc(p.tagline[currentLang])}" onchange="cur().tagline[currentLang]=this.value;markDirty()">
      </div>
      <div class="form-group" style="margin-bottom:10px"><label>Description</label>
        <textarea rows="4" onchange="cur().description[currentLang]=this.value;markDirty()">\${esc(p.description[currentLang])}</textarea>
      </div>
      <div class="form-group" style="margin-bottom:10px"><label>Features</label>
        <div class="list-editor" id="featuresEditor">\${renderListItems(p.features[currentLang], 'features')}</div>
      </div>
      <div class="form-group"><label>Use Cases</label>
        <div class="list-editor" id="useCasesEditor">\${renderListItems(p.useCases[currentLang], 'useCases')}</div>
      </div>
    </div>

    <div class="section">
      <h2>Releases</h2>
      \${p.platforms.map(pl => renderReleaseRow(pl, p.releases[pl])).join('')}
      \${p.platforms.length === 0 ? '<div style="color:var(--text2);font-size:13px">No platforms selected</div>' : ''}
    </div>

    \${renderScreenshots(p)}

    <div style="padding:20px 0">
      <button class="btn btn-danger" onclick="deleteProduct()">Delete This Product</button>
    </div>
  \`;
}

function renderListItems(arr, field) {
  if (!arr) return '';
  return arr.map((item, i) => \`
    <div class="list-item">
      <input value="\${esc(item)}" onchange="cur().\${field}[currentLang][\${i}]=this.value;markDirty()">
      <button onclick="cur().\${field}[currentLang].splice(\${i},1);markDirty();renderEditor()">×</button>
    </div>\`).join('') +
    \`<button class="add-btn" onclick="cur().\${field}[currentLang].push('');markDirty();renderEditor()">+ Add</button>\`;
}

function renderReleaseRow(platform, rel) {
  const r = rel || {};
  return \`<div class="release-row">
    <span class="platform-label">\${platform}</span>
    <input class="ver" placeholder="version" value="\${esc(r.version||'')}" onchange="setRelease('\${platform}','version',this.value)">
    <input class="tag" placeholder="tag (e.g. INBT-v1.0.0)" value="\${esc(r.tag||'')}" onchange="setRelease('\${platform}','tag',this.value)">
    <input class="fname" placeholder="fileName" value="\${esc(r.fileName||'')}" onchange="setRelease('\${platform}','fileName',this.value)">
  </div>\`;
}

function renderScreenshots(p) {
  const ss = p.screenshots || [];
  return \`<div class="section">
    <h2>Screenshots</h2>
    \${ss.map((s, i) => \`<div class="form-row">
      <div class="form-group" style="width:180px"><label>File</label><input value="\${esc(s.file)}" onchange="cur().screenshots[\${i}].file=this.value;markDirty()"></div>
      <div class="form-group flex1"><label>Label (EN)</label><input value="\${esc(s.label.en)}" onchange="cur().screenshots[\${i}].label.en=this.value;markDirty()"></div>
      <div class="form-group flex1"><label>Label (JA)</label><input value="\${esc(s.label.ja)}" onchange="cur().screenshots[\${i}].label.ja=this.value;markDirty()"></div>
      <div class="form-group flex1"><label>Label (ZH)</label><input value="\${esc(s.label.zh)}" onchange="cur().screenshots[\${i}].label.zh=this.value;markDirty()"></div>
      <button class="btn btn-outline" style="margin-top:18px" onclick="cur().screenshots.splice(\${i},1);markDirty();renderEditor()">×</button>
    </div>\`).join('')}
    <button class="btn btn-outline" onclick="addScreenshot()">+ Add Screenshot</button>
  </div>\`;
}

function togglePlatform(pl, checked) {
  const p = cur();
  if (checked && !p.platforms.includes(pl)) p.platforms.push(pl);
  if (!checked) p.platforms = p.platforms.filter(x => x !== pl);
  markDirty();
  renderEditor();
}

function setRelease(platform, key, value) {
  const p = cur();
  if (!p.releases) p.releases = {};
  if (!p.releases[platform]) p.releases[platform] = { version: '', tag: '', fileName: '' };
  p.releases[platform][key] = value;
  // Remove empty releases
  const r = p.releases[platform];
  if (!r.version && !r.tag && !r.fileName) delete p.releases[platform];
  markDirty();
}

function addScreenshot() {
  const p = cur();
  if (!p.screenshots) p.screenshots = [];
  p.screenshots.push({ file: '', label: { en: '', ja: '', zh: '' } });
  markDirty();
  renderEditor();
}

function addProduct() {
  const code = prompt('Product code (e.g. NEWP):');
  if (!code) return;
  catalog.push({
    code, slug: code.toLowerCase(), status: 'hidden', displayOrder: 99,
    category: 'utility', svgIcon: 'M12 6v6m0 0v6m0-6h6m-6 0H6', colorGradient: 'from-gray-500 to-gray-700',
    platforms: [], name: { en: code, ja: code, zh: code }, tagline: { en: '', ja: '', zh: '' },
    description: { en: '', ja: '', zh: '' }, features: { en: [], ja: [], zh: [] },
    useCases: { en: [], ja: [], zh: [] }, releases: {}
  });
  selectedIdx = catalog.length - 1;
  markDirty();
  renderList();
  renderEditor();
}

function deleteProduct() {
  if (!confirm('Delete ' + cur().code + '?')) return;
  catalog.splice(selectedIdx, 1);
  selectedIdx = -1;
  markDirty();
  renderList();
  document.getElementById('editorPanel').innerHTML = '<div class="editor-empty">Select a product to edit</div>';
}

// Keyboard shortcut
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (dirty) saveData(); }
});

// Init
loadData();
</script>
</body>
</html>`;
