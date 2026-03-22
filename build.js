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

// ─── Configuration ──────────────────────────────────────────────────────────

const ROOT = __dirname;
const CONTENT_DIR = path.join(ROOT, 'content');
const LAYOUTS_DIR = path.join(ROOT, 'layouts');
const PARTIALS_DIR = path.join(ROOT, 'partials');
const DIST_DIR = path.join(ROOT, 'dist');
const STATIC_DIRS = ['css', 'js', 'static'];
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

// ─── Main Build ────────────────────────────────────────────────────────────

function build() {
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
      nextSlug: nextPage ? nextPage.slug : '',
      nextTitle: nextPage ? nextPage.title : '',
    };

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

  // 9. Copy static assets
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

build();
