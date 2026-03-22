#!/usr/bin/env node
/**
 * serve.js - Dev server with file watching and LiveReload for Obsidian framework
 *
 * - Serves dist/ on port 3000
 * - Watches content/, layouts/, partials/, css/, js/ with chokidar
 * - Rebuilds by spawning node build.js on changes
 * - LiveReload via Server-Sent Events at /__reload
 * - Injects <script> into HTML responses for auto-reload
 * - Handles basePath /enterprise-ai -> dist/
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chokidar = require('chokidar');

// ─── Configuration ───────────────────────────────────────────────────────────

const PORT = 3000;
const ROOT = __dirname;
const DIST_DIR = path.join(ROOT, 'dist');
const BASE_PATH = '/enterprise-ai';
const WATCH_DIRS = ['content', 'layouts', 'partials', 'css', 'js'];

// ─── MIME Types ──────────────────────────────────────────────────────────────

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml':  'application/xml; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.eot':  'application/vnd.ms-fontobject',
  '.webp': 'image/webp',
  '.pdf':  'application/pdf',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

// ─── LiveReload SSE ───────────────────────────────────────────────────────────

const sseClients = new Set();

function addSseClient(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write(':\n\n'); // initial comment to establish connection
  sseClients.add(res);
  res.on('close', () => sseClients.delete(res));
}

function broadcastReload() {
  for (const client of sseClients) {
    client.write('data: reload\n\n');
  }
}

// The script injected into HTML responses to connect to the SSE reload endpoint
const LIVERELOAD_SCRIPT = `
<script>
(function() {
  var es = new EventSource('/__reload');
  es.onmessage = function() { location.reload(); };
  es.onerror = function() {
    es.close();
    setTimeout(function() { location.reload(); }, 1000);
  };
})();
</script>
</body>`;

// ─── Build Runner ─────────────────────────────────────────────────────────────

let building = false;
let pendingRebuild = false;

function runBuild() {
  if (building) {
    pendingRebuild = true;
    return;
  }
  building = true;
  const t0 = Date.now();

  const child = spawn(process.execPath, ['build.js'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', d => { stdout += d; });
  child.stderr.on('data', d => { stderr += d; });

  child.on('close', code => {
    building = false;
    const elapsed = Date.now() - t0;

    // Extract page count from build output
    const match = stdout.match(/Build complete: (\d+) page/);
    const pages = match ? match[1] : '?';

    if (code === 0) {
      console.log(`[Obsidian] Built ${pages} pages in ${elapsed}ms`);
      broadcastReload();
    } else {
      console.error(`[Obsidian] Build failed (exit ${code})`);
      if (stderr.trim()) console.error(stderr.trim());
    }

    if (pendingRebuild) {
      pendingRebuild = false;
      runBuild();
    }
  });
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────

function resolveFilePath(reqUrl) {
  // Strip query string
  const urlPath = reqUrl.split('?')[0];

  // Strip base path prefix /enterprise-ai -> serve from dist/
  let stripped = urlPath;
  if (stripped.startsWith(BASE_PATH)) {
    stripped = stripped.slice(BASE_PATH.length) || '/';
  }

  // Decode percent-encoded characters
  try {
    stripped = decodeURIComponent(stripped);
  } catch (_) {
    // leave as-is on decode error
  }

  // Resolve to dist/
  const candidate = path.join(DIST_DIR, stripped);

  // Guard against path traversal
  if (!candidate.startsWith(DIST_DIR)) {
    return null;
  }

  // If candidate is a directory, serve index.html within it
  try {
    const stat = fs.statSync(candidate);
    if (stat.isDirectory()) {
      return path.join(candidate, 'index.html');
    }
    return candidate;
  } catch (_) {
    // File doesn't exist; try appending /index.html for extensionless paths
    const withIndex = path.join(candidate, 'index.html');
    if (fs.existsSync(withIndex)) return withIndex;
    return candidate; // will 404 below
  }
}

const server = http.createServer((req, res) => {
  // SSE endpoint for LiveReload
  if (req.url === '/__reload') {
    addSseClient(res);
    return;
  }

  const filePath = resolveFilePath(req.url);

  if (!filePath) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Try 404.html
      const notFoundPath = path.join(DIST_DIR, '404.html');
      fs.readFile(notFoundPath, (err2, data404) => {
        if (!err2) {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(injectLiveReload(data404));
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        }
      });
      return;
    }

    const mime = getMimeType(filePath);
    res.writeHead(200, { 'Content-Type': mime });

    // Inject LiveReload script into HTML responses
    if (mime.startsWith('text/html')) {
      res.end(injectLiveReload(data));
    } else {
      res.end(data);
    }
  });
});

function injectLiveReload(htmlBuffer) {
  const html = htmlBuffer.toString('utf-8');
  // Replace closing </body> with the LiveReload script + </body>
  if (html.includes('</body>')) {
    return html.replace('</body>', LIVERELOAD_SCRIPT);
  }
  // No </body> found; append script at end
  return html + LIVERELOAD_SCRIPT;
}

// ─── File Watcher ─────────────────────────────────────────────────────────────

const watchPaths = WATCH_DIRS
  .map(d => path.join(ROOT, d))
  .filter(d => fs.existsSync(d));

const watcher = chokidar.watch(watchPaths, {
  ignoreInitial: true,
  persistent: true,
  awaitWriteFinish: { stabilityThreshold: 80, pollInterval: 20 },
});

watcher.on('all', (event, filePath) => {
  console.log(`[Obsidian] ${event}: ${path.relative(ROOT, filePath)}`);
  runBuild();
});

// ─── Start ────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`[Obsidian] Serving at http://localhost:${PORT}`);
  console.log(`[Obsidian] Base path: ${BASE_PATH} -> dist/`);
  console.log(`[Obsidian] Watching: ${WATCH_DIRS.join(', ')}`);
});
