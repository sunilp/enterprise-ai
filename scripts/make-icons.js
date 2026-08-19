#!/usr/bin/env node
// Regenerate favicons and touch icons from static/img/logo-ink.svg on a paper background.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const svg = fs.readFileSync(path.join(ROOT, 'static/img/logo-ink.svg'));
async function icon(size, out, pad = 0.08) {
  const inner = Math.round(size * (1 - pad * 2));
  const logo = await sharp(svg).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: '#f5f1e8' } })
    .composite([{ input: logo, left: Math.round(size * pad), top: Math.round(size * pad) }])
    .png().toFile(path.join(ROOT, 'static/img', out));
  console.log('wrote', out);
}
(async () => {
  await icon(16, 'icon-16.png', 0.02);
  await icon(32, 'icon-32.png', 0.04);
  await icon(180, 'apple-touch-icon.png');
  await icon(512, 'logo-512.png');
  // favicon.ico: a single 32x32 PNG-in-ICO container
  const png32 = fs.readFileSync(path.join(ROOT, 'static/img/icon-32.png'));
  const header = Buffer.alloc(6); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16); entry[0] = 32; entry[1] = 32; entry[2] = 0; entry[3] = 0; entry.writeUInt16LE(1, 4); entry.writeUInt16LE(32, 6); entry.writeUInt32LE(png32.length, 8); entry.writeUInt32LE(22, 12);
  fs.writeFileSync(path.join(ROOT, 'static/img/favicon.ico'), Buffer.concat([header, entry, png32]));
  console.log('wrote favicon.ico');
})();
