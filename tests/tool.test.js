const test = require('node:test');
const assert = require('node:assert');
global.window = {};
global.document = { createElement: () => ({ getContext: () => ({}) }) };
require('../js/core/tool.js');
const T = global.window.Tool;

test('encode/decode round-trips and matches legacy base64 of the digit string', () => {
  const a = [1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5];
  const enc = T.encode(a);
  assert.equal(enc, Buffer.from(a.join('')).toString('base64'));
  assert.deepEqual(T.decode(enc, 25), a);
  assert.equal(T.decode('!!notbase64', 25), null);
  assert.equal(T.decode(T.encode([1,2,3]), 25), null, 'length mismatch rejected');
  assert.equal(T.decode(Buffer.from('12306').toString('base64'), 5), null, 'zero is out of range');
});
