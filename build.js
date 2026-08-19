#!/usr/bin/env node
/**
 * build.js - Obsidian static site generator
 *
 * Converts markdown content into themed HTML pages with
 * SEO metadata, navigation, sitemap, and search index.
 */

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const { marked } = require('marked');

// sharp is optional — OG generation degrades gracefully if unavailable
let sharp = null;
try {
  sharp = require('sharp');
} catch (_) {
  // sharp not available; OG images will use default.png fallback
}

// ─── Configuration ──────────────────────────────────────────────────────────

const ROOT = __dirname;
const CONTENT_DIR = path.join(ROOT, 'content');
const LAYOUTS_DIR = path.join(ROOT, 'layouts');
const PARTIALS_DIR = path.join(ROOT, 'partials');
const DIST_DIR = path.join(ROOT, 'dist');
const STATIC_DIRS = ['css', 'js', 'fonts', 'static'];
const BASE_PATH = '/enterprise-ai';
const SITE_URL = 'https://sunilprakash.com/enterprise-ai';
const SITE_CONFIG_PATH = path.join(ROOT, 'site.config.json');

// ─── Site Config (book switch) ─────────────────────────────────────────────

function loadSiteConfig() {
  const defaults = { book: { enabled: false } };
  const cfgPath = process.env.SITE_CONFIG_PATH || SITE_CONFIG_PATH;
  if (!fs.existsSync(cfgPath)) return defaults;
  try {
    const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    return { ...defaults, ...parsed, book: { ...defaults.book, ...(parsed.book || {}) } };
  } catch (e) {
    console.warn(`WARN: site.config.json unreadable (${e.message}); using defaults`);
    return defaults;
  }
}

// ─── Template Engine (< 50 lines) ──────────────────────────────────────────

const partialsCache = {};

function loadPartial(name) {
  if (partialsCache[name]) return partialsCache[name];
  const filePath = path.join(PARTIALS_DIR, `${name}.html`);
  if (!fs.existsSync(filePath)) {
    console.error(`FATAL: Missing partial "${name}" at ${filePath}`);
    process.exit(1);
  }
  partialsCache[name] = fs.readFileSync(filePath, 'utf-8');
  return partialsCache[name];
}

function renderTemplate(template, data) {
  // Phase 1: resolve partials {{> partialName}}
  let result = template.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
    return loadPartial(name);
  });
  // Phase 1b: sections {{#key}}...{{/key}} and {{^key}}...{{/key}}
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, inner) => data[key] ? inner : '');
  result = result.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, inner) => data[key] ? '' : inner);
  // Phase 2: replace variables {{variableName}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : '';
  });
  return result;
}

// ─── Frontmatter Parser ────────────────────────────────────────────────────

function parseFrontmatter(raw, filePath) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    const fileName = path.basename(filePath, '.md');
    console.warn(`WARN: No frontmatter in ${filePath}, using defaults`);
    return {
      meta: {
        title: kebabToTitle(fileName),
        description: '',
        section: inferSection(filePath),
        layout: 'standard',
        slug: fileName === 'index' ? 'homepage' : fileName,
        order: 99,
      },
      body: raw,
    };
  }
  const meta = YAML.parse(match[1]) || {};
  const fileName = path.basename(filePath, '.md');
  // Apply defaults
  if (!meta.title) meta.title = kebabToTitle(fileName);
  if (!meta.description) meta.description = '';
  if (!meta.section) meta.section = inferSection(filePath);
  if (!meta.layout) meta.layout = 'standard';
  if (!meta.slug) meta.slug = fileName === 'index' ? 'homepage' : fileName;
  if (meta.order === undefined) meta.order = 99;
  meta.summary = meta.summary || null;
  meta.dek = meta.dek || '';
  return { meta, body: match[2] };
}

function kebabToTitle(str) {
  return str
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function inferSection(filePath) {
  const rel = path.relative(CONTENT_DIR, filePath);
  const parts = rel.split(path.sep);
  if (parts.length > 1) return kebabToTitle(parts[0]);
  return 'Home';
}

// ─── Custom Marked Extensions ──────────────────────────────────────────────

let hasMermaid = false;

function configureMarked() {
  hasMermaid = false;

  const containerExtension = {
    name: 'container',
    level: 'block',
    start(src) {
      return src.match(/^:::/)?.index;
    },
    tokenizer(src) {
      const rule = /^:::(\w+)\r?\n([\s\S]*?)\r?\n:::\r?\n?/;
      const match = rule.exec(src);
      if (match) {
        return {
          type: 'container',
          raw: match[0],
          containerType: match[1],
          text: match[2].trim(),
        };
      }
    },
    renderer(token) {
      const inner = marked.parse(token.text);
      switch (token.containerType) {
        case 'insight':
          return `<div class="insight-box">${inner}</div>\n`;
        case 'tradeoff':
          return `<div class="tradeoff-panel"><div class="tradeoff-content">${inner}</div></div>\n`;
        case 'warning':
          return `<div class="warning-box">${inner}</div>\n`;
        case 'note':
          return `<div class="note-box">${inner}</div>\n`;
        case 'quote':
          return `<blockquote class="pull-quote">${inner}</blockquote>\n`;
        case 'decision-rights': {
          // Three cells from "**Who decides**", "**Who approves**", "**Who can stop**" paragraphs (or any 3 paragraphs in order)
          const cells = token.text.split(/\n\s*\n/).map(t => t.trim()).filter(Boolean).slice(0, 3);
          const labels = ['Who decides', 'Who approves', 'Who can stop'];
          const html = cells.map((c, i) => {
            const m = c.match(/^\*\*([^*]+)\*\*\s*[:.]?\s*([\s\S]*)$/);
            const k = m ? m[1] : labels[i];
            const v = marked.parse(m ? m[2] : c);
            return `<div><span class="k">${k}</span>${v}</div>`;
          }).join('');
          return `<div class="decision-rights">${html}</div>\n`;
        }
        default:
          return `<div class="${token.containerType}-box">${inner}</div>\n`;
      }
    },
  };

  const renderer = {
    table(token) {
      let header = '';
      let body = '';

      // Build header
      let headerCells = '';
      for (const cell of token.header) {
        const content = this.parser.parseInline(cell.tokens);
        const align = cell.align ? ` style="text-align:${cell.align}"` : '';
        headerCells += `<th${align}>${content}</th>`;
      }
      header = `<thead><tr>${headerCells}</tr></thead>`;

      // Build body
      let bodyRows = '';
      for (const row of token.rows) {
        let rowCells = '';
        for (const cell of row) {
          const content = this.parser.parseInline(cell.tokens);
          const align = cell.align ? ` style="text-align:${cell.align}"` : '';
          rowCells += `<td${align}>${content}</td>`;
        }
        bodyRows += `<tr>${rowCells}</tr>`;
      }
      body = bodyRows ? `<tbody>${bodyRows}</tbody>` : '';

      return `<div class="obsidian-table-wrap"><table class="obsidian-table">${header}${body}</table></div>\n`;
    },
    blockquote(token) {
      const body = this.parser.parse(token.tokens);
      return `<blockquote class="obsidian-quote gold-border">${body}</blockquote>\n`;
    },
    code(token) {
      if (token.lang === 'mermaid') {
        hasMermaid = true;
        // Strip hard-coded colours so the paper theme paints every diagram consistently
        const clean = token.text.split('\n').filter(l => !/^\s*(style|classDef|class|linkStyle)\s/.test(l)).join('\n');
        return `<pre class="mermaid">${clean}</pre>\n`;
      }
      const langClass = token.lang ? ` class="language-${token.lang}"` : '';
      return `<pre><code${langClass}>${token.text}</code></pre>\n`;
    },
  };

  marked.use({ extensions: [containerExtension], renderer });
}

// ─── File Discovery ────────────────────────────────────────────────────────

function findMarkdownFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(full));
    } else if (entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

// ─── Navigation Builder ────────────────────────────────────────────────────

// The spine: seven disciplines (names are the book's structure; questions are the site's own wording)
const DISCIPLINES = [
  { key: 'diagnose', number: 1, name: 'Diagnose', question: 'Where is the AI program actually stuck, and why?' },
  { key: 'prepare',  number: 2, name: 'Prepare',  question: 'Which foundations have to be in place before scale?' },
  { key: 'govern',   number: 3, name: 'Govern',   question: 'How does the enterprise stay in control at deployment speed?' },
  { key: 'design',   number: 4, name: 'Design',   question: 'What system, at what complexity, does the workflow need?' },
  { key: 'operate',  number: 5, name: 'Operate',  question: 'Is it working in production, and do the economics hold?' },
  { key: 'organize', number: 6, name: 'Organize', question: 'Who owns AI, and how does adoption spread?' },
  { key: 'sustain',  number: 7, name: 'Sustain',  question: 'What survives the next model cycle?' },
];
const GROUPS = [
  { key: 'start',     name: 'Start here' },
  { key: 'proof',     name: 'Proof' },
  { key: 'reference', name: 'Reference' },
];

function buildNavigation(pages) {
  const byDiscipline = Object.fromEntries(DISCIPLINES.map(d => [d.key, []]));
  const byGroup = Object.fromEntries(GROUPS.map(g => [g.key, []]));
  const hubs = {};
  for (const p of pages) {
    const m = p.meta;
    if (m.slug === 'homepage' || m.layout === 'cover') continue;
    if (m.hub) { hubs[m.discipline] = p; continue; }
    if (m.discipline && byDiscipline[m.discipline]) byDiscipline[m.discipline].push(p);
    else if (m.group && byGroup[m.group]) byGroup[m.group].push(p);
    else console.warn(`  WARN: ${p.filePath} has no discipline/group; it will not appear in navigation`);
  }
  const sortPages = arr => arr.sort((a, b) => ((a.meta.order ?? 99) - (b.meta.order ?? 99)) || String(a.meta.title).localeCompare(String(b.meta.title)));
  const entry = p => ({ title: p.meta.title, slug: p.meta.slug, path: p.outputPath, dek: p.meta.dek || '', tool: !!p.meta.tool, discipline: p.meta.discipline || null });
  const disciplines = DISCIPLINES.map(d => ({
    key: d.key, number: d.number, name: d.name, question: d.question,
    path: hubs[d.key] ? hubs[d.key].outputPath : d.key,
    pages: sortPages(byDiscipline[d.key]).map(entry),
  }));
  const groups = GROUPS.map(g => ({ key: g.key, name: g.name, pages: sortPages(byGroup[g.key]).map(entry) }));
  const tools = disciplines.flatMap(d => d.pages.filter(p => p.tool));
  return { disciplines, groups, tools };
}

function neighbours(nav, page) {
  const m = page.meta;
  const list = m.discipline
    ? (nav.disciplines.find(d => d.key === m.discipline) || { pages: [] }).pages
    : (nav.groups.find(g => g.key === m.group) || { pages: [] }).pages;
  const i = list.findIndex(p => p.slug === m.slug);
  const pick = p => p ? { title: p.title, path: p.path } : null;
  return { prev: i > 0 ? pick(list[i - 1]) : null, next: i >= 0 && i < list.length - 1 ? pick(list[i + 1]) : null };
}

// ─── SEO Generation ────────────────────────────────────────────────────────

function pageUrl(outputPath) {
  return outputPath ? `${SITE_URL}/${outputPath}/` : `${SITE_URL}/`;
}

function generateOgTags(meta, outputPath) {
  const ogTitle = meta.og_title || meta.title;
  const ogDesc = meta.og_description || meta.description;
  const ogImage = `${SITE_URL}/og/${meta.slug}.png`;
  const ogUrl = pageUrl(outputPath);

  return [
    `<meta property="og:title" content="${escHtml(ogTitle)}">`,
    `<meta property="og:description" content="${escHtml(ogDesc)}">`,
    `<meta property="og:image" content="${ogImage}">`,
    `<meta property="og:url" content="${ogUrl}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:site_name" content="The Enterprise AI Operating System">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escHtml(ogTitle)}">`,
    `<meta name="twitter:description" content="${escHtml(ogDesc)}">`,
    `<meta name="twitter:image" content="${ogImage}">`,
  ].join('\n');
}

function generateJsonLd(meta, outputPath, cfg) {
  const url = pageUrl(outputPath);
  const graph = [
    {
      '@type': 'Article',
      headline: meta.title,
      description: meta.description,
      url: url,
      image: `${SITE_URL}/og/${meta.slug}.png`,
      author: { '@type': 'Person', name: 'Sunil Prakash', url: 'https://sunilprakash.com' },
    },
    {
      '@type': 'WebSite',
      name: 'The Enterprise AI Operating System',
      url: SITE_URL + '/',
    },
  ];
  if (cfg && cfg.book && cfg.book.enabled) {
    graph.push({
      '@type': 'Book',
      name: cfg.book.title || 'The Enterprise AI Operating System',
      author: { '@type': 'Person', name: 'Sunil Prakash' },
      publisher: cfg.book.publisher || undefined,
      url: `${SITE_URL}/book/`,
    });
  }
  const ld = { '@context': 'https://schema.org', '@graph': graph };
  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── Markdown Link Converter ──────────────────────────────────────────────

function convertMdLinks(html, pages) {
  // Convert href="...something.md" and href="../something.md" to proper paths
  return html.replace(/href="([^"]*\.md)"/g, function(match, mdLink) {
    // Strip ../ prefixes and normalize
    var cleaned = mdLink.replace(/^(\.\.\/)+/, '');
    // Remove .md extension
    var withoutExt = cleaned.replace(/\.md$/, '');
    // Try to find matching page by output path or filename
    for (var i = 0; i < pages.length; i++) {
      var p = pages[i];
      if (p.outputPath === withoutExt || p.outputPath.endsWith('/' + withoutExt) || p.outputPath.endsWith(withoutExt)) {
        return 'href="' + BASE_PATH + '/' + (p.outputPath || '') + '/"';
      }
    }
    // Try matching just the filename part
    var fileName = withoutExt.split('/').pop();
    for (var j = 0; j < pages.length; j++) {
      var pg = pages[j];
      if (pg.meta.slug === fileName || pg.outputPath.split('/').pop() === fileName) {
        return 'href="' + BASE_PATH + '/' + (pg.outputPath || '') + '/"';
      }
    }
    // Template download links -> static path
    if (mdLink.indexOf('templates/') !== -1) {
      return 'href="' + BASE_PATH + '/static/proof/' + cleaned + '"';
    }
    // If no match found, return as-is but log warning
    console.log('  WARN: Could not resolve .md link: ' + mdLink);
    return match;
  });
}

// ─── Output Path Helpers ───────────────────────────────────────────────────

function computeOutputPath(filePath, meta) {
  if (meta && meta.permalink) return String(meta.permalink).replace(/^\/+|\/+$/g, '');
  const rel = path.relative(CONTENT_DIR, filePath);
  const parts = rel.split(path.sep);
  const fileName = parts.pop().replace('.md', '');

  // content/index.md -> dist/index.html
  if (parts.length === 0 && fileName === 'index') {
    return '';
  }
  // content/position/the-problem.md -> position/the-problem
  return [...parts, fileName].join('/');
}

function computeDistPath(outputPath) {
  if (outputPath === '') {
    return path.join(DIST_DIR, 'index.html');
  }
  return path.join(DIST_DIR, outputPath, 'index.html');
}

// ─── Static Asset Copy ────────────────────────────────────────────────────

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ─── Sitemap, Robots, Search Index, 404 ────────────────────────────────────

function generateSitemap(pages) {
  const urls = pages.map(p => {
    const loc = pageUrl(p.outputPath);
    return `  <url><loc>${loc}</loc></url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

function generateLlmsTxt(nav, pages) {
  const url = p => pageUrl(p);
  const lines = [];
  lines.push('# The Enterprise AI Operating System');
  lines.push('');
  lines.push('> The management system for enterprise AI, by Sunil Prakash. Seven disciplines (Diagnose, Prepare, Govern, Design, Operate, Organize, Sustain), each owning a question the leadership team has to answer. Every page opens with an executive summary: the decision, the cost of skipping it, the metric. Includes the Readiness Diagnostic, proof artifacts, and role-based reading paths.');
  lines.push('');
  lines.push(`Cover: ${url('')}`);
  lines.push(`The operating system on one page: ${url('framework')}`);
  lines.push(`Start by role: ${url('reading-paths')}`);
  lines.push('');
  for (const d of nav.disciplines) {
    lines.push(`## ${pad2(d.number)} ${d.name}: ${d.question}`);
    lines.push(`- Hub: ${url(d.path)}`);
    for (const p of d.pages) lines.push(`- ${p.title}: ${url(p.path)}${p.dek ? ' : ' + p.dek : ''}`);
    lines.push('');
  }
  for (const g of nav.groups) {
    if (g.key === 'start' || !g.pages.length) continue;
    lines.push(`## ${g.name}`);
    for (const p of g.pages) lines.push(`- ${p.title}: ${url(p.path)}${p.dek ? ' : ' + p.dek : ''}`);
    lines.push('');
  }
  lines.push('## Author');
  lines.push('Sunil Prakash, https://sunilprakash.com, sunil@sunilprakash.com. Related: Agent Engineering Lab https://agenticlab.sunilprakash.com, Agent Identity Protocol https://sunilprakash.com/aip/');
  return lines.join('\n') + '\n';
}

function generateRobotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml`;
}

function generateSearchIndex(pages) {
  return pages.map(p => ({
    title: p.meta.title,
    description: p.meta.description,
    discipline: p.meta.discipline || p.meta.group || '',
    slug: p.meta.slug,
    path: p.outputPath,
    body: p.body.replace(/[#*`>\[\](){}|_~-]/g, ' ').substring(0, 500),
  }));
}

function generate404(common) {
  const layoutPath = path.join(LAYOUTS_DIR, 'standard.html');
  if (!fs.existsSync(layoutPath)) return null;
  const layout = fs.readFileSync(layoutPath, 'utf-8');
  const data = Object.assign({}, common, {
    title: 'Page not found',
    pageTitle: 'Page not found · The Enterprise AI Operating System',
    description: 'The page you are looking for does not exist.',
    slug: '404',
    dek: '',
    content: '<div class="error-page"><p class="label">Error 404</p><p>This page does not exist. Use search (<kbd>⌘K</kbd>) or start from the <a href="' + BASE_PATH + '/">cover</a>.</p></div>',
    ogTags: '',
    jsonLd: '',
    canonicalPath: '404',
    hasMermaidAttr: '',
    breadcrumb: `<a href="${BASE_PATH}/">Operating System</a><span class="sep">/</span><span>Not found</span>`,
    rail: '',
    summaryBox: '',
    related: '',
    prevNext: '',
    readingTime: '',
    disciplineKey: '',
  });
  return renderTemplate(layout, data);
}

// ─── OG Image Generation ──────────────────────────────────────────────────

const OG_W = 1200;
const OG_H = 630;
const OG_PAPER = '#f5f1e8';
const OG_INK = '#16130e';
const OG_BRONZE = '#7a5c1e';
const OG_MUTED = '#7d766a';
const OG_RULE = '#d9d2c3';

function wrapTitle(title, maxChars, maxLines) {
  const words = String(title).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (t.length > maxChars && cur) { lines.push(cur); cur = w; } else cur = t;
    if (lines.length === maxLines) { cur = ''; break; }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (!lines.length) lines.push(String(title).substring(0, maxChars));
  return lines;
}

function ogFrame(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}" viewBox="0 0 ${OG_W} ${OG_H}">
  <rect width="${OG_W}" height="${OG_H}" fill="${OG_PAPER}"/>
  <rect x="0" y="0" width="${OG_W}" height="10" fill="${OG_BRONZE}"/>
  <line x1="72" y1="548" x2="1128" y2="548" stroke="${OG_RULE}" stroke-width="1"/>
  <text x="72" y="582" font-family="'Courier New', Courier, monospace" font-size="15" fill="${OG_MUTED}" letter-spacing="1">THE ENTERPRISE AI OPERATING SYSTEM  ·  sunilprakash.com/enterprise-ai</text>
  ${inner}
</svg>`;
}

function buildOgSvg({ title, label, sub }) {
  const lines = wrapTitle(title, 30, 2);
  const size = lines.length > 1 ? 56 : 64;
  const lh = Math.round(size * 1.15);
  const subLines = sub ? wrapTitle(sub, 78, 2) : [];
  const startY = (subLines.length ? 270 : 300) - Math.round(((lines.length - 1) * lh) / 2);
  const subSvg = subLines.map((l, i) => `<text x="72" y="${startY + (lines.length - 1) * lh + 52 + i * 30}" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="${OG_MUTED}">${escHtml(l)}</text>`).join('\n  ');
  const titleLines = lines.map((line, i) =>
    `<text x="72" y="${startY + i * lh}" font-family="Georgia, 'Times New Roman', serif" font-size="${size}" font-weight="400" fill="${OG_INK}">${escHtml(line)}</text>`
  ).join('\n  ');
  const labelText = label ? `<text x="72" y="${startY - size - 18}" font-family="'Courier New', Courier, monospace" font-size="16" fill="${OG_BRONZE}" letter-spacing="3">${escHtml(String(label).toUpperCase())}</text>` : '';
  return ogFrame(`${labelText}\n  ${titleLines}\n  ${subSvg}`);
}

function buildDefaultOgSvg() {
  return ogFrame(`
  <text x="72" y="180" font-family="'Courier New', Courier, monospace" font-size="16" fill="${OG_BRONZE}" letter-spacing="3">THE MANAGEMENT SYSTEM FOR ENTERPRISE AI</text>
  <text x="72" y="270" font-family="Georgia, 'Times New Roman', serif" font-size="72" fill="${OG_INK}">The Enterprise AI</text>
  <text x="72" y="356" font-family="Georgia, 'Times New Roman', serif" font-size="72" fill="${OG_INK}">Operating System</text>
  <text x="72" y="430" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="${OG_MUTED}">Seven disciplines. An executive summary on every page. Diagnostics and proof.</text>`);
}

async function ensureDefaultOgImage(ogDistDir) {
  const dest = path.join(ogDistDir, 'default.png');
  const staticSrc = path.join(ROOT, 'static', 'og', 'default.png');

  // Generate from SVG using sharp
  if (sharp) {
    try {
      await sharp(Buffer.from(buildDefaultOgSvg())).png().toFile(dest);
      return;
    } catch (err) {
      console.warn(`  WARN: Could not generate default.png via sharp: ${err.message}`);
    }
  }

  // Last resort: write a 1x1 transparent PNG so the file always exists
  const minimalPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(dest, minimalPng);
}

async function generateOGImages(pages) {
  const ogDistDir = path.join(DIST_DIR, 'og');
  fs.mkdirSync(ogDistDir, { recursive: true });

  // Always produce default.png first
  await ensureDefaultOgImage(ogDistDir);

  if (!sharp) {
    console.warn('  WARN: sharp not available — copying default.png for all OG images');
    for (const page of pages) {
      const dest = path.join(ogDistDir, `${page.meta.slug}.png`);
      fs.copyFileSync(path.join(ogDistDir, 'default.png'), dest);
    }
    console.log(`  OG images: ${pages.length} fallback copies written`);
    return;
  }

  const defaultPng = path.join(ogDistDir, 'default.png');

  const tasks = pages.map(async (page) => {
    const dest = path.join(ogDistDir, `${page.meta.slug}.png`);
    try {
      const d = DISCIPLINES.find(x => x.key === page.meta.discipline);
      const g = GROUPS.find(x => x.key === page.meta.group);
      const label = page.meta.hub ? `Discipline ${pad2(d.number)}` : d ? `${pad2(d.number)} · ${d.name}` : g ? g.name : '';
      const sub = page.meta.hub ? page.meta.question : (page.meta.dek || page.meta.og_description || '');
      const svg = page.meta.slug === 'homepage' ? buildDefaultOgSvg() : buildOgSvg({ title: page.meta.og_title || page.meta.title, label, sub });
      await sharp(Buffer.from(svg)).png().toFile(dest);
    } catch (err) {
      console.warn(`  WARN: OG image failed for "${page.meta.slug}": ${err.message}`);
      try { fs.copyFileSync(defaultPng, dest); } catch (_) {}
    }
  });

  await Promise.all(tasks);
  console.log(`  Generated: og/ (${pages.length} image(s))`);
}

// ─── Page data assembly ────────────────────────────────────────────────────

const pad2 = n => String(n).padStart(2, '0');
const REDIRECTS = { 'architecture/index': 'design' };

function disciplineOf(meta) { return DISCIPLINES.find(d => d.key === meta.discipline) || null; }

function readingTime(body) {
  const w = body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(w / 230))} min read`;
}

function renderBreadcrumb(meta, nav, d) {
  const home = `<a href="${BASE_PATH}/">Operating System</a>`;
  if (d) {
    const hub = nav.disciplines.find(x => x.key === d.key);
    return `${home}<span class="sep">/</span><a href="${BASE_PATH}/${hub.path}/">${pad2(d.number)} ${d.name}</a><span class="sep">/</span><span>${escHtml(meta.title)}</span>`;
  }
  const g = GROUPS.find(x => x.key === meta.group);
  return `${home}<span class="sep">/</span><span>${g ? g.name : ''}</span>`;
}

function renderRail(meta, nav) {
  const d = nav.disciplines.find(x => x.key === meta.discipline);
  const g = !d && meta.group !== 'start' ? nav.groups.find(x => x.key === meta.group) : null;
  const src = d || g;
  if (!src || src.pages.length < 2) return '';
  const items = src.pages.map(p => `<li class="${p.slug === meta.slug ? 'current' : ''}"><a href="${BASE_PATH}/${p.path}/">${escHtml(p.title)}</a></li>`).join('');
  return `<span class="label">In ${escHtml(src.name)}</span><ol>${items}</ol>`;
}

function renderSummaryBox(summary) {
  if (!summary || !(summary.decide || summary.cost || summary.metric)) return '';
  const row = (k, v) => v ? `<div class="k">${k}</div><p class="v">${escHtml(v)}</p>` : '';
  return `<aside class="summary-box" aria-label="Executive summary">${row('The decision', summary.decide)}${row('Cost of skipping', summary.cost)}${row('The metric', summary.metric)}</aside>`;
}

function renderPrevNext(nb) {
  if (!nb.prev && !nb.next) return '';
  const a = (p, cls, label) => p ? `<a class="${cls}" href="${BASE_PATH}/${p.path}/"><span class="label">${label}</span>${escHtml(p.title)}</a>` : '<span></span>';
  return `<nav class="prevnext" aria-label="Previous and next">${a(nb.prev, 'prev', 'Previous')}${a(nb.next, 'next', 'Next')}</nav>`;
}

function renderRelated(meta, pagesBySlug) {
  const slugs = Array.isArray(meta.related) ? meta.related : [];
  const items = slugs.map(sl => pagesBySlug[sl]).filter(Boolean)
    .map(p => `<li><a href="${BASE_PATH}/${p.outputPath}/">${escHtml(p.meta.title)}</a></li>`).join('');
  return items ? `<section class="related"><span class="label">Related</span><ul>${items}</ul></section>` : '';
}

function renderFooterLists(nav) {
  const li = (href, text) => `<li><a href="${BASE_PATH}/${href}">${escHtml(text)}</a></li>`;
  const group = key => (nav.groups.find(g => g.key === key) || { pages: [] }).pages;
  return {
    footerDisciplines: nav.disciplines.map(d => li(d.path + '/', `${pad2(d.number)} ${d.name}`)).join(''),
    footerStart: [li('', 'Cover'), li('framework/', 'The operating system on one page'), li('reading-paths/', 'Start by role'), li('assessment/tool/', 'Readiness Diagnostic')].join(''),
    footerProof: group('proof').map(p => li(p.path + '/', p.title)).join(''),
    footerReference: group('reference').map(p => li(p.path + '/', p.title)).join(''),
  };
}

function renderBookStrip(meta, cfg) {
  if (!cfg.book.enabled || !Array.isArray(cfg.book.chapters)) return '';
  const chs = cfg.book.chapters.filter(c => c.discipline === meta.discipline);
  if (!chs.length) return '';
  const list = chs.map(c => `Chapter ${c.n}${c.title ? ': ' + escHtml(c.title) : ''}`).join(', ');
  return `<aside class="book-strip"><span class="label">In the book</span> ${list}</aside>`;
}

function renderHubBits(page, nav, pagesBySlug, cfg) {
  const d = disciplineOf(page.meta);
  const disc = nav.disciplines.find(x => x.key === d.key);
  const decisions = Array.isArray(page.meta.decisions) ? page.meta.decisions : [];
  const hubDecisions = `<ol>${decisions.map(x => `<li>${escHtml(x)}</li>`).join('')}</ol>`;
  const card = (p, i, label) => {
    const src = pagesBySlug[p.slug];
    const rt = src ? readingTime(src.body) : '';
    return `<a class="card" href="${BASE_PATH}/${p.path}/"><span class="n">${label || pad2(i + 1)}</span><div><h3>${escHtml(p.title)}</h3>${p.dek ? `<p>${escHtml(p.dek)}</p>` : ''}</div><span class="rt">${rt}</span></a>`;
  };
  const readPages = disc.pages.filter(p => !p.tool);
  const toolPages = disc.pages.filter(p => p.tool);
  const hubPages = readPages.map((p, i) => card(p, i)).join('');
  const hubTools = toolPages.map(p => card(p, 0, 'Tool')).join('');
  const proofSlugs = Array.isArray(page.meta.proof) ? page.meta.proof : [];
  const hubProof = proofSlugs.map(sl => pagesBySlug[sl]).filter(Boolean)
    .map(p => card({ path: p.outputPath, title: p.meta.title, dek: p.meta.dek, slug: p.meta.slug }, 0, 'Proof')).join('');
  const nextD = DISCIPLINES[(d.number) % DISCIPLINES.length];
  const nextDisc = nav.disciplines.find(x => x.key === nextD.key);
  const nextDiscipline = `<span class="label">Next discipline</span><a href="${BASE_PATH}/${nextDisc.path}/">${pad2(nextD.number)} ${nextD.name}<span class="q">${escHtml(nextD.question)}</span></a>`;
  return { hubDecisions, hubPages, hubTools, hubProof, nextDiscipline };
}

function pageData(page, nav, cfg, pagesBySlug, contentHtml, layoutName, common) {
  const meta = page.meta;
  const d = disciplineOf(meta);
  const nb = neighbours(nav, page);
  const data = Object.assign({}, common, {
    title: meta.title,
    pageTitle: meta.slug === 'homepage' ? 'The Enterprise AI Operating System: the management system for enterprise AI' : `${meta.title} · The Enterprise AI Operating System`,
    description: meta.description || '',
    dek: meta.dek || '',
    slug: meta.slug,
    layoutName,
    content: contentHtml,
    ogTags: generateOgTags(meta, page.outputPath),
    jsonLd: generateJsonLd(meta, page.outputPath, cfg),
    canonicalPath: page.outputPath === '' ? '' : page.outputPath + '/',
    hasMermaidAttr: hasMermaid ? ' data-has-mermaid="true"' : '',
    interactiveSlot: layoutName === 'showcase' ? '<div id="interactive" class="interactive-mount"></div>' : '',
    showcaseHeader: (layoutName === 'showcase' && !/showcase-hero/.test(contentHtml))
      ? `<header class="page-header"><h1>${escHtml(meta.title)}</h1>${meta.dek ? `<p class="dek">${escHtml(meta.dek)}</p>` : ''}<div class="page-actions"><span class="meta">${readingTime(page.body)}</span><div class="share"><button type="button" class="share-btn" aria-haspopup="true" aria-expanded="false">Share</button><div class="share-menu"></div></div><button type="button" class="print-btn">Print brief</button></div></header>`
      : '',
    disciplineKey: d ? d.key : (meta.group || ''),
    disciplineName: d ? d.name : '',
    disciplineNumber: d ? pad2(d.number) : '',
    disciplineQuestion: d ? d.question : '',
    disciplinePath: d ? (nav.disciplines.find(x => x.key === d.key) || {}).path || d.key : '',
    breadcrumb: renderBreadcrumb(meta, nav, d),
    rail: meta.hub ? '' : renderRail(meta, nav),
    summaryBox: renderSummaryBox(meta.summary),
    prevNext: meta.hub ? '' : renderPrevNext(nb),
    related: renderRelated(meta, pagesBySlug),
    readingTime: readingTime(page.body),
    bookStrip: renderBookStrip(meta, cfg),
    toolScript: meta.tool_script || 'readiness',
  });
  if (meta.hub) Object.assign(data, renderHubBits(page, nav, pagesBySlug, cfg));
  if (meta.discipline && !meta.tool && !meta.hub && !meta.summary) console.warn(`  WARN: no summary: ${path.relative(ROOT, page.filePath)}`);
  return data;
}

function writeRedirects() {
  let n = 0;
  for (const [from, to] of Object.entries(REDIRECTS)) {
    const target = `${BASE_PATH}/${to}/`;
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${target}"><link rel="canonical" href="${SITE_URL}/${to}/"><title>Redirecting</title></head><body><a href="${target}">${to}</a></body></html>`;
    const dest = path.join(DIST_DIR, from, 'index.html');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, html, 'utf-8');
    n++;
  }
  if (n) console.log(`  Redirects: ${n}`);
}

// ─── Main Build ────────────────────────────────────────────────────────────

async function build() {
  const startTime = Date.now();
  console.log('Building The Enterprise AI Operating System...\n');
  const cfg = loadSiteConfig();

  // 1. Clean dist
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });
  console.log('  Cleaned dist/');

  // 2. Find markdown files
  const mdFiles = findMarkdownFiles(CONTENT_DIR);
  if (mdFiles.length === 0) {
    console.warn('WARN: No markdown files found in content/');
    return;
  }
  console.log(`  Found ${mdFiles.length} content file(s)`);

  // 3. Parse all files
  const pages = [];
  for (const filePath of mdFiles) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { meta, body } = parseFrontmatter(raw, filePath);
    const outputPath = computeOutputPath(filePath, meta);
    pages.push({ meta, body, filePath, outputPath });
  }
  const pagesBySlug = Object.fromEntries(pages.map(p => [p.meta.slug, p]));

  // 4. Build navigation
  const nav = buildNavigation(pages);
  const navDataJson = JSON.stringify(nav);
  const common = Object.assign({
    basePath: BASE_PATH,
    navDataJson,
    bookEnabled: !!cfg.book.enabled,
    year: new Date().getFullYear(),
  }, renderFooterLists(nav));

  // 5. Configure marked
  configureMarked();

  // 6. Render each page
  let rendered = 0;
  let errors = 0;

  for (const page of pages) {
    let layoutName = page.meta.layout;

    // Showcase JS fallback
    if (layoutName === 'showcase') {
      const jsPath = path.join(ROOT, 'js', 'pages', `${page.meta.slug}.js`);
      if (!fs.existsSync(jsPath)) {
        layoutName = 'standard';
      }
    }
    if (layoutName === 'book' && !cfg.book.enabled) {
      console.log(`  Skipped (book disabled): ${page.outputPath}`);
      continue;
    }

    const layoutPath = path.join(LAYOUTS_DIR, `${layoutName}.html`);
    if (!fs.existsSync(layoutPath)) {
      console.error(`  ERROR: Layout "${layoutName}" not found, skipping ${page.filePath}`);
      errors++;
      continue;
    }
    const layout = fs.readFileSync(layoutPath, 'utf-8');

    hasMermaid = false;
    let body = page.body;
    if (layoutName !== 'cover') body = body.replace(/^\s*#\s+[^\n]+\n+/, '');
    let contentHtml = marked.parse(body);
    contentHtml = convertMdLinks(contentHtml, pages);

    const data = pageData(page, nav, cfg, pagesBySlug, contentHtml, layoutName, common);
    const html = renderTemplate(layout, data);

    const distPath = computeDistPath(page.outputPath);
    fs.mkdirSync(path.dirname(distPath), { recursive: true });
    fs.writeFileSync(distPath, html, 'utf-8');
    rendered++;
    console.log(`  Rendered: ${page.outputPath || 'index'} (${layoutName})`);
  }

  // 7. Sitemap, robots, search index, nav.json, redirects
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), generateSitemap(pages), 'utf-8');
  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), generateRobotsTxt(), 'utf-8');
  fs.writeFileSync(path.join(DIST_DIR, 'search-index.json'), JSON.stringify(generateSearchIndex(pages), null, 2), 'utf-8');
  fs.writeFileSync(path.join(DIST_DIR, 'nav.json'), navDataJson, 'utf-8');
  console.log('  Generated: sitemap.xml, robots.txt, search-index.json, nav.json');
  writeRedirects();

  // 8. 404
  const html404 = generate404(common);
  if (html404) {
    fs.writeFileSync(path.join(DIST_DIR, '404.html'), html404, 'utf-8');
    console.log('  Generated: 404.html');
  }

  // 9. OG images
  await generateOGImages(pages);

  // 10. Static assets
  for (const dir of STATIC_DIRS) {
    const src = path.join(ROOT, dir);
    const dest = path.join(DIST_DIR, dir);
    copyDirSync(src, dest);
  }
  console.log(`  Copied: ${STATIC_DIRS.join(', ')}`);
  fs.mkdirSync(path.join(DIST_DIR, 'static'), { recursive: true });
  fs.writeFileSync(path.join(DIST_DIR, 'static', 'llms.txt'), generateLlmsTxt(nav, pages), 'utf-8');
  console.log('  Generated: static/llms.txt');

  const elapsed = Date.now() - startTime;
  console.log(`\nBuild complete: ${rendered} page(s), ${errors} error(s) in ${elapsed}ms`);
  if (errors > 0) process.exitCode = 1;
}

module.exports = { renderTemplate, parseFrontmatter, buildNavigation, neighbours, computeOutputPath, loadSiteConfig, DISCIPLINES, GROUPS, build };

if (require.main === module) {
  build().catch(err => {
    console.error('FATAL build error:', err);
    process.exitCode = 1;
  });
}
