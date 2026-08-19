#!/usr/bin/env node
// Apply dek/summary YAML patches (docs/superpowers/notes/patches/*.yaml) into page frontmatter.
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const ROOT = path.join(__dirname, '..');
const dir = process.argv[2] || path.join(ROOT, 'docs/superpowers/notes/patches');
let n = 0, problems = [];
for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.yaml'))) {
  const items = YAML.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) || [];
  for (const it of items) {
    const file = path.join(ROOT, it.file);
    if (!fs.existsSync(file)) { problems.push('missing ' + it.file); continue; }
    const raw = fs.readFileSync(file, 'utf-8');
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!m) { problems.push('no frontmatter ' + it.file); continue; }
    const meta = YAML.parse(m[1]) || {};
    if (it.dek) meta.dek = String(it.dek).trim();
    if (it.summary) meta.summary = { decide: String(it.summary.decide || '').trim(), cost: String(it.summary.cost || '').trim(), metric: String(it.summary.metric || '').trim() };
    for (const [k, v] of Object.entries({ dek: meta.dek, ...(meta.summary || {}) })) {
      if (v && /—/.test(v)) problems.push('em dash in ' + it.file + ' ' + k);
      if (k === 'dek' && v && v.length > 160) problems.push('dek too long ' + it.file + ' (' + v.length + ')');
      if (k !== 'dek' && v && v.length > 200) problems.push(k + ' too long ' + it.file + ' (' + v.length + ')');
    }
    fs.writeFileSync(file, `---\n${YAML.stringify(meta, { lineWidth: 0 }).trimEnd()}\n---\n${m[2]}`, 'utf-8');
    n++;
  }
}
console.log('applied', n, 'patches');
if (problems.length) { console.log(problems.join('\n')); process.exitCode = 1; }
