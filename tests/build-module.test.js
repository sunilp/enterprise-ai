const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

test('build.js exports helpers and does not auto-run', () => {
  const mod = require(path.join(__dirname, '..', 'build.js'));
  assert.equal(typeof mod.renderTemplate, 'function');
  assert.equal(typeof mod.parseFrontmatter, 'function');
  assert.equal(typeof mod.buildNavigation, 'function');
  assert.equal(typeof mod.loadSiteConfig, 'function');
  assert.equal(typeof mod.build, 'function');
});

test('loadSiteConfig defaults book.enabled to false', () => {
  const { loadSiteConfig } = require(path.join(__dirname, '..', 'build.js'));
  const cfg = loadSiteConfig();
  assert.equal(cfg.book.enabled, false);
});
