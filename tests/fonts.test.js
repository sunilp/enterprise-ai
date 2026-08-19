const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
test('every font file is a real WOFF2 (the old Fraunces file was an HTML page)', () => {
  const dir = path.join(__dirname, '..', 'fonts');
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.woff2'))) {
    const head = fs.readFileSync(path.join(dir, f)).subarray(0, 4).toString('latin1');
    assert.equal(head, 'wOF2', `${f} is not a WOFF2 file`);
  }
});
