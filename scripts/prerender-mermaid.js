#!/usr/bin/env node
/**
 * prerender-mermaid.js
 *
 * Renders every ```mermaid fence in content/ to a static SVG in static/diagrams/,
 * so pages ship the diagram instead of a 900KB client-side renderer. build.js inlines
 * the SVG when a matching file exists and falls back to the client renderer when it
 * does not, so this script is optional for a build but should be re-run whenever a
 * diagram changes.
 *
 * Run locally (needs the Playwright chromium used elsewhere in this repo):
 *   PLAYWRIGHT_BROWSERS_PATH=<path-to>/pw-browsers node scripts/prerender-mermaid.js
 *   node scripts/prerender-mermaid.js --check     # fail if any diagram is missing
 *
 * The rendered SVGs are committed, so CI never needs a browser.
 */
const fs = require('fs');
const path = require('path');
const { diagramHash, extractMermaidBlocks, DIAGRAM_DIR } = require('../build.js');

const ROOT = path.join(__dirname, '..');
const CHECK_ONLY = process.argv.includes('--check');

function allBlocks() {
  const out = [];
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.name.endsWith('.md')) {
      for (const src of extractMermaidBlocks(fs.readFileSync(f, 'utf-8'))) {
        out.push({ file: path.relative(ROOT, f), src, hash: diagramHash(src) });
      }
    }
  });
  walk(path.join(ROOT, 'content'));
  return out;
}

const blocks = allBlocks();
const seen = new Map();
for (const b of blocks) if (!seen.has(b.hash)) seen.set(b.hash, b);
const unique = [...seen.values()];
const missing = unique.filter(b => !fs.existsSync(path.join(DIAGRAM_DIR, b.hash + '.svg')));

console.log(`${blocks.length} mermaid block(s), ${unique.length} unique, ${missing.length} missing`);

if (CHECK_ONLY) {
  if (missing.length) {
    console.error('Missing pre-rendered diagrams:');
    missing.forEach(b => console.error(`  ${b.hash}  ${b.file}`));
    process.exitCode = 1;
  } else {
    console.log('prerender-mermaid: all diagrams present');
  }
  return;
}

if (!missing.length) { console.log('nothing to render'); return; }

(async () => {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) {
    console.error('playwright is not installed here. Install it in a scratch dir and run with NODE_PATH set, or render on a machine that has it.');
    process.exitCode = 1;
    return;
  }
  fs.mkdirSync(DIAGRAM_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.setContent('<!doctype html><html><body><div id="out"></div></body></html>');
  await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js' });
  await page.evaluate(() => {
    /* global mermaid */
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      themeVariables: {
        primaryColor: '#fbf9f4',
        primaryTextColor: '#16130e',
        primaryBorderColor: '#7a5c1e',
        lineColor: '#6a6357',
        secondaryColor: '#ece6d8',
        tertiaryColor: '#f5f1e8',
        background: '#f5f1e8',
        mainBkg: '#fbf9f4',
        nodeBorder: '#7a5c1e',
        clusterBkg: '#ece6d8',
        clusterBorder: '#d9d2c3',
        titleColor: '#16130e',
        edgeLabelBackground: '#f5f1e8',
        fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
        fontSize: '20px',
      },
      flowchart: { curve: 'basis', htmlLabels: false, useMaxWidth: true },
      sequence: { useMaxWidth: true },
      gantt: { useMaxWidth: true },
      pie: { useMaxWidth: true },
      xyChart: { useMaxWidth: true },
      quadrantChart: { useMaxWidth: true },
    });
  });

  let ok = 0, failed = [];
  for (const b of missing) {
    try {
      const svg = await page.evaluate(async (src) => {
        const { svg } = await mermaid.render('d' + Math.abs([...src].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7)), src);
        return svg;
      }, b.src);
      if (!svg || !svg.includes('<svg')) throw new Error('empty svg');
      fs.writeFileSync(path.join(DIAGRAM_DIR, b.hash + '.svg'), svg, 'utf-8');
      ok++;
      console.log(`  rendered ${b.hash}  ${b.file}`);
    } catch (e) {
      failed.push(`${b.file} (${b.hash}): ${e.message}`);
    }
  }
  await browser.close();
  console.log(`rendered ${ok}, failed ${failed.length}`);
  if (failed.length) { failed.forEach(f => console.error('  ' + f)); process.exitCode = 1; }
})();
