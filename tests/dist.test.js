const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]); }

test('dist has no retired assets, no book material, no em dashes; internal links resolve', () => {
  execSync('node build.js', { cwd: ROOT, stdio: 'pipe' });
  const html = walk(DIST).filter(f => f.endsWith('.html'));
  assert.ok(html.length > 50, 'expected 50+ html files');
  const retired = /obsidian\.css|focus\.css|particles\.js|atmosphere\.js|engagement\.js|fuse\.min\.js|showcase\.css/;
  const book = /Apress|forthcoming (book|title|with|from)|CXO Playbook|ARAA|Beachhead|Absorption Pyramid|Complexity Appropriateness|Strategic Congruence|Corporate Immune|Product-System Gap|Smallest Governable|Five Voices|Time to Takeoff|Moment Matrix/;
  const broken = [];
  for (const f of html) {
    const s = fs.readFileSync(f, 'utf-8');
    assert.ok(!retired.test(s), `retired asset in ${f}`);
    assert.ok(!book.test(s), `book term in ${f}`);
    assert.ok(!s.includes('—'), `em dash in ${f}`);
    assert.ok(!/deutsche bank/i.test(s), `employer name in ${f}`);
    for (const m of s.matchAll(/(?:href|src)="\/enterprise-ai\/([^"#?]*)"/g)) {
      const p = m[1];
      if (/\.(css|js|png|svg|ico|txt|json|xml|woff2?|md|pdf)$/.test(p)) { if (!fs.existsSync(path.join(DIST, p))) broken.push(`${path.relative(DIST, f)} -> ${p}`); continue; }
      const target = path.join(DIST, p, 'index.html');
      if (!fs.existsSync(target)) broken.push(`${path.relative(DIST, f)} -> ${p}`);
    }
  }
  assert.deepEqual(broken, [], 'broken internal links');
});

test('every discipline page has an executive summary and every hub has decisions', () => {
  const nav = JSON.parse(fs.readFileSync(path.join(DIST, 'nav.json'), 'utf-8'));
  for (const d of nav.disciplines) {
    const hub = fs.readFileSync(path.join(DIST, d.path, 'index.html'), 'utf-8');
    assert.ok(/hub-decisions[\s\S]*<ol><li>/.test(hub), `hub ${d.key} lacks decisions`);
    assert.ok(!hub.includes('Placeholder'), `hub ${d.key} has placeholder`);
    for (const p of d.pages) {
      if (p.tool) continue;
      const s = fs.readFileSync(path.join(DIST, p.path, 'index.html'), 'utf-8');
      assert.ok(s.includes('class="summary-box"'), `no summary box on ${p.path}`);
    }
  }
});
