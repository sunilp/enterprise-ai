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

test('in-page anchors resolve, code fences are escaped, and diagrams are inlined', () => {
  const html = walk(DIST).filter(f => f.endsWith('.html'));
  const broken = [];
  for (const f of html) {
    const s = fs.readFileSync(f, 'utf-8');
    // every #fragment link into this site points at an id that exists somewhere
    for (const m of s.matchAll(/href="\/enterprise-ai\/([^"#]*)#([^"]+)"/g)) {
      const target = m[1] ? path.join(DIST, m[1], 'index.html') : path.join(DIST, 'index.html');
      if (!fs.existsSync(target)) { broken.push(`${path.relative(DIST, f)} -> ${m[1]} (missing page)`); continue; }
      const t = fs.readFileSync(target, 'utf-8');
      if (!t.includes(`id="${m[2]}"`)) broken.push(`${path.relative(DIST, f)} -> #${m[2]} (no such id)`);
    }
    assert.ok(!/<pre><code[^>]*><script/.test(s), `unescaped code fence in ${f}`);
    assert.ok(!s.includes('cdn.jsdelivr.net/npm/mermaid'), `client-side mermaid still loaded in ${f}`);
    assert.ok(!/\.md"/.test(s.replace(/href="[^"]*static\/proof[^"]*"/g, '')), `unconverted .md link in ${f}`);
  }
  assert.deepEqual(broken, [], 'broken in-page anchors');
});

test('every navigation entry points at a page that was actually rendered', () => {
  const nav = JSON.parse(fs.readFileSync(path.join(DIST, 'nav.json'), 'utf-8'));
  const missing = [];
  const check = (p, where) => {
    const target = p.path ? path.join(DIST, p.path, 'index.html') : path.join(DIST, 'index.html');
    if (!fs.existsSync(target)) missing.push(`${where}: ${p.title} -> ${p.path}`);
  };
  for (const d of nav.disciplines) {
    check({ path: d.path, title: d.name }, 'hub');
    d.pages.forEach(p => check(p, `discipline ${d.key}`));
  }
  for (const g of nav.groups) g.pages.forEach(p => check(p, `group ${g.key}`));
  nav.tools.forEach(p => check(p, 'tools'));
  assert.deepEqual(missing, [], 'navigation points at unrendered pages');
});

test('the book switch cannot be turned on by a non-boolean', () => {
  const { execFileSync } = require('child_process');
  const os = require('os');
  const bad = path.join(os.tmpdir(), 'eaios-book-bad.json');
  fs.writeFileSync(bad, JSON.stringify({ book: { enabled: 'false' } }));
  assert.throws(() => execFileSync('node', ['build.js'], { cwd: ROOT, env: { ...process.env, SITE_CONFIG_PATH: bad }, stdio: 'pipe' }),
    /must be a boolean/, 'a string should not be accepted for book.enabled');
});

test('the newsletter link is the current one, everywhere it appears', () => {
  const CURRENT = 'https://www.linkedin.com/newsletters/building-ai-systems-7437710572604870656/';
  const RETIRED = /newsletters\/building-ai-systems-7310391508670377984/;
  const html = walk(DIST).filter(f => f.endsWith('.html'));
  let seen = 0;
  for (const f of html) {
    const s = fs.readFileSync(f, 'utf-8');
    assert.ok(!RETIRED.test(s), `retired newsletter link in ${path.relative(DIST, f)}`);
    for (const m of s.matchAll(/https:\/\/www\.linkedin\.com\/newsletters\/[^"']+/g)) {
      assert.equal(m[0], CURRENT, `unexpected newsletter URL in ${path.relative(DIST, f)}`);
      seen++;
    }
  }
  assert.ok(seen > 50, `expected the newsletter link on every page, saw ${seen}`);
});
