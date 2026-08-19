const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

test('book switch on renders nav item, hub strip, footer line; off renders none', () => {
  const tmp = path.join(os.tmpdir(), 'eaios-book-on.json');
  fs.writeFileSync(tmp, JSON.stringify({ book: { enabled: true, status: 'published', title: 'The Enterprise AI Operating System', publisher: 'Test Publisher', chapters: [{ n: 5, title: 'Test chapter', discipline: 'govern' }] } }));
  execSync('node build.js', { cwd: ROOT, stdio: 'pipe', env: { ...process.env, SITE_CONFIG_PATH: tmp } });
  const hub = fs.readFileSync(path.join(DIST, 'govern', 'index.html'), 'utf-8');
  assert.ok(hub.includes('href="/enterprise-ai/book/"'), 'nav Book link when enabled');
  assert.ok(hub.includes('In the book') && hub.includes('Chapter 5'), 'hub strip when enabled');
  assert.ok(hub.includes('Companion site to the book'), 'footer line when enabled');
  assert.ok(hub.includes('"@type":"Book"'), 'Book JSON-LD when enabled');
  // off again (default config)
  execSync('node build.js', { cwd: ROOT, stdio: 'pipe' });
  const hubOff = fs.readFileSync(path.join(DIST, 'govern', 'index.html'), 'utf-8');
  for (const needle of ['href="/enterprise-ai/book/"', 'In the book', 'Companion site', '"@type":"Book"', 'Chapter 5']) {
    assert.ok(!hubOff.includes(needle), `"${needle}" must not render when disabled`);
  }
});
