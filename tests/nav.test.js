const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { buildNavigation, neighbours, DISCIPLINES, computeOutputPath } = require('../build.js');

function page(slug, meta, outputPath) {
  return { meta: { slug, title: slug, ...meta }, body: '', filePath: '', outputPath };
}

test('DISCIPLINES has seven keys in order', () => {
  assert.deepEqual(DISCIPLINES.map(d => d.key), ['diagnose','prepare','govern','design','operate','organize','sustain']);
});

test('navigation groups pages by discipline and orders them', () => {
  const pages = [
    page('homepage', { layout: 'cover' }, ''),
    page('b', { discipline: 'govern', order: 2 }, 'governance/b'),
    page('a', { discipline: 'govern', order: 1, tool: true }, 'governance/a'),
    page('glossary', { group: 'reference', order: 1 }, 'glossary'),
    page('govern', { hub: true, discipline: 'govern', permalink: 'govern' }, 'govern'),
  ];
  const nav = buildNavigation(pages);
  const govern = nav.disciplines.find(d => d.key === 'govern');
  assert.deepEqual(govern.pages.map(p => p.slug), ['a', 'b']);
  assert.equal(govern.path, 'govern');
  assert.equal(nav.tools[0].slug, 'a');
  assert.equal(nav.groups.find(g => g.key === 'reference').pages[0].slug, 'glossary');
  const { prev, next } = neighbours(nav, pages[1]);
  assert.equal(prev.path, 'governance/a');
  assert.equal(next, null);
});

test('permalink overrides output path', () => {
  const fp = path.join(__dirname, '..', 'content', 'disciplines', 'govern.md');
  assert.equal(computeOutputPath(fp, { permalink: 'govern' }), 'govern');
});
