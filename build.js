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
  let result = template.replace(/\{\{>\s*(\w+)\s*\}\}/g, (_, name) => {
    return loadPartial(name);
  });
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
        return `<pre class="mermaid">${token.text}</pre>\n`;
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

function buildNavigation(pages) {
  const sections = {};
  const sectionOrder = [];
  let homePage = null;

  for (const page of pages) {
    if (page.meta.slug === 'homepage') {
      homePage = page;
      continue;
    }
    const sec = page.meta.section;
    if (!sections[sec]) {
      sections[sec] = [];
      sectionOrder.push(sec);
    }
    sections[sec].push(page);
  }

  // Sort pages within sections by order
  for (const sec of Object.keys(sections)) {
    sections[sec].sort((a, b) => (a.meta.order || 99) - (b.meta.order || 99));
  }

  const nav = [];
  if (homePage) {
    nav.push({
      title: 'Home',
      slug: 'homepage',
      path: '',
      section: 'Home',
    });
  }

  for (const sec of sectionOrder) {
    nav.push({
      title: sec,
      pages: sections[sec].map(p => ({
        title: p.meta.title,
        slug: p.meta.slug,
        path: p.outputPath,
        section: sec,
      })),
    });
  }

  return nav;
}

function flattenNav(nav) {
  const flat = [];
  for (const item of nav) {
    if (item.pages) {
      flat.push(...item.pages);
    } else {
      flat.push(item);
    }
  }
  return flat;
}

// ─── SEO Generation ────────────────────────────────────────────────────────

function generateOgTags(meta) {
  const ogTitle = meta.og_title || meta.title;
  const ogDesc = meta.og_description || meta.description;
  const ogImage = `${SITE_URL}/og/${meta.slug}.png`;
  const ogUrl = meta.slug === 'homepage' ? SITE_URL + '/' : `${SITE_URL}/${meta.slug}/`;

  return [
    `<meta property="og:title" content="${escHtml(ogTitle)}">`,
    `<meta property="og:description" content="${escHtml(ogDesc)}">`,
    `<meta property="og:image" content="${ogImage}">`,
    `<meta property="og:url" content="${ogUrl}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:site_name" content="Enterprise AI Playbook">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escHtml(ogTitle)}">`,
    `<meta name="twitter:description" content="${escHtml(ogDesc)}">`,
    `<meta name="twitter:image" content="${ogImage}">`,
  ].join('\n');
}

function generateJsonLd(meta) {
  const url = meta.slug === 'homepage' ? SITE_URL + '/' : `${SITE_URL}/${meta.slug}/`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: meta.title,
        description: meta.description,
        url: url,
        image: `${SITE_URL}/og/${meta.slug}.png`,
        author: { '@type': 'Person', name: 'Sunil Prakash' },
      },
      {
        '@type': 'Person',
        name: 'Sunil Prakash',
        url: 'https://sunilprakash.com',
      },
      {
        '@type': 'WebSite',
        name: 'Enterprise AI Playbook',
        url: SITE_URL,
      },
    ],
  };
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

function computeOutputPath(filePath) {
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
    const loc = p.meta.slug === 'homepage'
      ? SITE_URL + '/'
      : `${SITE_URL}/${p.outputPath}/`;
    return `  <url><loc>${loc}</loc></url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
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
    section: p.meta.section,
    slug: p.meta.slug,
    path: p.outputPath,
    body: p.body.replace(/[#*`>\[\](){}|_~-]/g, ' ').substring(0, 500),
  }));
}

function generate404(navDataJson) {
  const layoutPath = path.join(LAYOUTS_DIR, 'standard.html');
  if (!fs.existsSync(layoutPath)) return null;
  const layout = fs.readFileSync(layoutPath, 'utf-8');
  const data = {
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist.',
    section: 'Error',
    slug: '404',
    content: '<div class="error-page"><h1>404</h1><p>This page does not exist. Use the command palette (<kbd>Ctrl+K</kbd>) to navigate.</p></div>',
    basePath: BASE_PATH,
    ogTags: '',
    jsonLd: '',
    showcaseCss: '',
    canonicalPath: '404',
    navDataJson: navDataJson,
    hasMermaidAttr: '',
    interactiveSlot: '',
    nextSlug: '',
    nextTitle: '',
  };
  return renderTemplate(layout, data);
}

// ─── OG Image Generation ──────────────────────────────────────────────────

const OG_W = 1200;
const OG_H = 630;
const OG_BG = '#0a0a0a';
const OG_GOLD = '#c8b48c';
const OG_CREAM = '#f0ece4';
const OG_MUTED = '#6b6560';

function buildOgSvg({ title, section }) {
  // Wrap title at ~40 chars per line, max 2 lines
  const words = title.split(' ');
  const lines = [];
  let current = '';
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (test.length > 40 && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
    if (lines.length === 2) { current = ''; break; }
  }
  if (current && lines.length < 2) lines.push(current);
  if (lines.length === 0) lines.push(title.substring(0, 40));

  const titleFontSize = 36;
  const lineHeight = 52;
  const totalTitleH = lines.length * lineHeight;
  const titleStartY = Math.round((OG_H - totalTitleH) / 2) + 10;

  const titleLines = lines.map((line, i) =>
    `<text x="600" y="${titleStartY + i * lineHeight}" font-family="Georgia, 'Times New Roman', serif" font-size="${titleFontSize}" font-weight="600" fill="${OG_CREAM}" text-anchor="middle" dominant-baseline="middle">${escHtml(line)}</text>`
  ).join('\n    ');

  // Section label — positioned above title block
  const sectionY = titleStartY - 70;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}" viewBox="0 0 ${OG_W} ${OG_H}">
  <defs>
    <linearGradient id="goldBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${OG_GOLD}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${OG_GOLD}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${OG_W}" height="${OG_H}" fill="${OG_BG}"/>

  <!-- Gold gradient bar at top -->
  <rect x="0" y="0" width="${OG_W}" height="10" fill="url(#goldBar)"/>

  <!-- Corner accents — top-left -->
  <line x1="40" y1="40" x2="100" y2="40" stroke="${OG_GOLD}" stroke-width="1" opacity="0.5"/>
  <line x1="40" y1="40" x2="40" y2="100" stroke="${OG_GOLD}" stroke-width="1" opacity="0.5"/>

  <!-- Corner accents — top-right -->
  <line x1="1160" y1="40" x2="1100" y2="40" stroke="${OG_GOLD}" stroke-width="1" opacity="0.5"/>
  <line x1="1160" y1="40" x2="1160" y2="100" stroke="${OG_GOLD}" stroke-width="1" opacity="0.5"/>

  <!-- Corner accents — bottom-left -->
  <line x1="40" y1="590" x2="100" y2="590" stroke="${OG_GOLD}" stroke-width="1" opacity="0.5"/>
  <line x1="40" y1="590" x2="40" y2="530" stroke="${OG_GOLD}" stroke-width="1" opacity="0.5"/>

  <!-- Corner accents — bottom-right -->
  <line x1="1160" y1="590" x2="1100" y2="590" stroke="${OG_GOLD}" stroke-width="1" opacity="0.5"/>
  <line x1="1160" y1="590" x2="1160" y2="530" stroke="${OG_GOLD}" stroke-width="1" opacity="0.5"/>

  <!-- Section label -->
  <text x="600" y="${sectionY}" font-family="'Courier New', Courier, monospace, sans-serif" font-size="14" fill="${OG_GOLD}" text-anchor="middle" dominant-baseline="middle" letter-spacing="3" text-transform="uppercase">${escHtml((section || '').toUpperCase())}</text>

  <!-- Page title -->
  ${titleLines}

  <!-- Footer -->
  <text x="600" y="530" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="${OG_MUTED}" text-anchor="middle" dominant-baseline="middle">Enterprise AI Playbook | Sunil Prakash</text>
</svg>`;
}

function buildDefaultOgSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}" viewBox="0 0 ${OG_W} ${OG_H}">
  <defs>
    <linearGradient id="goldBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${OG_GOLD}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${OG_GOLD}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${OG_W}" height="${OG_H}" fill="${OG_BG}"/>
  <rect x="0" y="0" width="${OG_W}" height="10" fill="url(#goldBar)"/>
  <line x1="40" y1="40" x2="100" y2="40" stroke="${OG_GOLD}" stroke-width="1" opacity="0.5"/>
  <line x1="40" y1="40" x2="40" y2="100" stroke="${OG_GOLD}" stroke-width="1" opacity="0.5"/>
  <line x1="1160" y1="40" x2="1100" y2="40" stroke="${OG_GOLD}" stroke-width="1" opacity="0.5"/>
  <line x1="1160" y1="40" x2="1160" y2="100" stroke="${OG_GOLD}" stroke-width="1" opacity="0.5"/>
  <line x1="40" y1="590" x2="100" y2="590" stroke="${OG_GOLD}" stroke-width="1" opacity="0.5"/>
  <line x1="40" y1="590" x2="40" y2="530" stroke="${OG_GOLD}" stroke-width="1" opacity="0.5"/>
  <line x1="1160" y1="590" x2="1100" y2="590" stroke="${OG_GOLD}" stroke-width="1" opacity="0.5"/>
  <line x1="1160" y1="590" x2="1160" y2="530" stroke="${OG_GOLD}" stroke-width="1" opacity="0.5"/>
  <text x="600" y="290" font-family="Georgia, 'Times New Roman', serif" font-size="40" font-weight="600" fill="${OG_CREAM}" text-anchor="middle" dominant-baseline="middle">Enterprise AI Playbook</text>
  <text x="600" y="360" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="${OG_MUTED}" text-anchor="middle" dominant-baseline="middle">sunilprakash.com</text>
</svg>`;
}

async function ensureDefaultOgImage(ogDistDir) {
  const dest = path.join(ogDistDir, 'default.png');
  const staticSrc = path.join(ROOT, 'static', 'og', 'default.png');

  // If a hand-crafted static version exists, use it
  if (fs.existsSync(staticSrc)) {
    fs.copyFileSync(staticSrc, dest);
    return;
  }

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
      const svg = buildOgSvg({
        title: page.meta.title,
        section: page.meta.section,
      });
      await sharp(Buffer.from(svg)).png().toFile(dest);
    } catch (err) {
      console.warn(`  WARN: OG image failed for "${page.meta.slug}": ${err.message}`);
      try { fs.copyFileSync(defaultPng, dest); } catch (_) {}
    }
  });

  await Promise.all(tasks);
  console.log(`  Generated: og/ (${pages.length} image(s))`);
}

// ─── Main Build ────────────────────────────────────────────────────────────

async function build() {
  const startTime = Date.now();
  console.log('Building Enterprise AI Playbook...\n');

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
    const outputPath = computeOutputPath(filePath);
    pages.push({ meta, body, filePath, outputPath });
  }

  // 4. Build navigation
  const nav = buildNavigation(pages);
  const navDataJson = JSON.stringify(nav);
  const flatNav = flattenNav(nav);

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
        console.warn(`  WARN: Showcase JS not found for "${page.meta.slug}", falling back to standard layout`);
        layoutName = 'standard';
      }
    }

    // Load layout
    const layoutPath = path.join(LAYOUTS_DIR, `${layoutName}.html`);
    if (!fs.existsSync(layoutPath)) {
      console.error(`  ERROR: Layout "${layoutName}" not found, skipping ${page.filePath}`);
      errors++;
      continue;
    }
    const layout = fs.readFileSync(layoutPath, 'utf-8');

    // Convert markdown to HTML
    hasMermaid = false;
    const contentHtml = marked.parse(page.body);

    // Determine next page
    const flatIdx = flatNav.findIndex(n => n.slug === page.meta.slug);
    const nextPage = flatIdx >= 0 && flatIdx < flatNav.length - 1 ? flatNav[flatIdx + 1] : null;

    // Build canonical path
    const canonicalPath = page.outputPath === '' ? '' : page.outputPath + '/';

    // Showcase CSS
    const needsShowcaseCss = layoutName === 'showcase' || layoutName === 'assessment';
    const showcaseCss = needsShowcaseCss
      ? `<link rel="stylesheet" href="${BASE_PATH}/css/showcase.css">`
      : '';

    // Build data
    const data = {
      title: page.meta.title,
      description: page.meta.description || '',
      section: page.meta.section,
      slug: page.meta.slug,
      content: contentHtml,
      basePath: BASE_PATH,
      ogTags: generateOgTags(page.meta),
      jsonLd: generateJsonLd(page.meta),
      showcaseCss: showcaseCss,
      canonicalPath: canonicalPath,
      navDataJson: navDataJson,
      hasMermaidAttr: hasMermaid ? ' data-has-mermaid="true"' : '',
      interactiveSlot: layoutName === 'showcase'
        ? '<div id="interactive" class="interactive-mount"></div>'
        : '',
      nextSuggestion: nextPage
        ? `<div class="next-suggestion"><span class="next-label">Continue with</span><a href="${BASE_PATH}/${nextPage.path}/" class="next-link">${nextPage.title}</a></div>`
        : '',
      flagshipClass: ['homepage', 'framework', 'governance-architecture', 'measurement-design', 'capability-stack'].includes(page.meta.slug) ? ' flagship' : '',
    };

    // Post-process: convert .md links to proper HTML paths
    data.content = convertMdLinks(data.content, pages);

    const html = renderTemplate(layout, data);

    // Write output
    const distPath = computeDistPath(page.outputPath);
    fs.mkdirSync(path.dirname(distPath), { recursive: true });
    fs.writeFileSync(distPath, html, 'utf-8');
    rendered++;
    console.log(`  Rendered: ${page.outputPath || 'index'} (${layoutName})`);
  }

  // 7. Generate sitemap, robots.txt, search index
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), generateSitemap(pages), 'utf-8');
  console.log('  Generated: sitemap.xml');

  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), generateRobotsTxt(), 'utf-8');
  console.log('  Generated: robots.txt');

  const searchIndex = generateSearchIndex(pages);
  fs.writeFileSync(
    path.join(DIST_DIR, 'search-index.json'),
    JSON.stringify(searchIndex, null, 2),
    'utf-8'
  );
  console.log('  Generated: search-index.json');

  // 8. Generate 404
  const html404 = generate404(navDataJson);
  if (html404) {
    fs.writeFileSync(path.join(DIST_DIR, '404.html'), html404, 'utf-8');
    console.log('  Generated: 404.html');
  }

  // 9. Generate OG images
  await generateOGImages(pages);

  // 10. Copy static assets
  for (const dir of STATIC_DIRS) {
    const src = path.join(ROOT, dir);
    const dest = path.join(DIST_DIR, dir);
    copyDirSync(src, dest);
    console.log(`  Copied: ${dir}/`);
  }

  // Done
  const elapsed = Date.now() - startTime;
  console.log(`\nBuild complete: ${rendered} page(s), ${errors} error(s) in ${elapsed}ms`);
  if (errors > 0) process.exitCode = 1;
}

build().catch(err => {
  console.error('FATAL build error:', err);
  process.exitCode = 1;
});
