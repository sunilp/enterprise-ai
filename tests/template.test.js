const test = require('node:test');
const assert = require('node:assert');
const { renderTemplate } = require('../build.js');

test('positive and negative sections', () => {
  const tpl = 'A{{#on}} yes {{/on}}{{^on}} no {{/on}}B {{name}}';
  assert.equal(renderTemplate(tpl, { on: true, name: 'x' }), 'A yes B x');
  assert.equal(renderTemplate(tpl, { on: false, name: 'x' }), 'A no B x');
  assert.equal(renderTemplate(tpl, { name: 'x' }), 'A no B x');
});

test('missing vars render empty', () => {
  assert.equal(renderTemplate('[{{nope}}]', {}), '[]');
});
