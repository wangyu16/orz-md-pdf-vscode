/**
 * preview-server.js — Live preview HTTP server
 *
 * Architecture (mirrors example.html exactly):
 *   GET /        → shell page: dark background + <iframe src="/content"> + SSE live-reload
 *   GET /content → full paged.js HTML   (loaded directly as iframe src — no srcdoc)
 *   GET /_pagedjs → local pagedjs polyfill bundle
 *   GET /_sse    → Server-Sent Events for live reload
 *
 * paged.js runs INSIDE the iframe (not the outer page), loaded at the bottom of
 * <body> after the content div — exactly as example.html does. This way paged.js
 * finds content already in the DOM and produces white page cards correctly.
 *
 * Usage: node src/preview-server.js [file.md] [port]
 *   Default file: test/sample.md
 *   Default port: 3000
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { parseMarkdown } = require('./parse');
const { generatePagedHtml, DEFAULT_SETTINGS } = require('./template');
const { extractDocumentSettings, stripMetadataScripts, transformNymlDocument } = require('./document-settings');
const { loadThemeCss } = require('./theme-loader');
const { resolveDocumentTemplate } = require('./templates');

// Local pagedjs polyfill served from disk — no CDN dependency.
// path.join from package root (dist/ is not in the exports map).
const PAGEDJS_LOCAL_PATH = path.join(
    path.dirname(require.resolve('pagedjs')),
    '../dist/paged.polyfill.js'
);
const MERMAID_LOCAL_PATH = require.resolve('mermaid/dist/mermaid.min.js');
const SMILES_DRAWER_LOCAL_PATH = require.resolve('smiles-drawer/dist/smiles-drawer.min.js');

const PORT = parseInt(process.argv[3] || '3000', 10);
const INPUT_FILE = path.resolve(process.argv[2] || path.join(__dirname, '../test/sample.md'));

// ─── SSE broadcast ────────────────────────────────────────────────────────────
const sseClients = new Map();
let sseClientId = 0;

function broadcastReload() {
    for (const [, res] of sseClients) {
        try { res.write('data: reload\n\n'); } catch { /* disconnected */ }
    }
}

// ─── Paged HTML build (what goes into the iframe srcdoc) ─────────────────────
// paged.js is loaded from /_pagedjs (local HTTP) and placed in <head> of the
// iframe document so paged.js intercepts before any content is painted.
let cachedPagedHtml = null;
let building = false;
let buildQueue = [];

async function buildPagedHtml() {
    const source = fs.readFileSync(INPUT_FILE, 'utf8');
    const parsedHtml = await parseMarkdown(source);
    const extractedSettings = extractDocumentSettings(parsedHtml);
    const resolvedTemplate = resolveDocumentTemplate(extractedSettings.documentTemplate);
    const settings = Object.assign({}, DEFAULT_SETTINGS, resolvedTemplate ? resolvedTemplate.settings : {}, extractedSettings);
    const transformed = await transformNymlDocument(parsedHtml);
    const contentHtml = `${transformed.preBodyHtml}${stripMetadataScripts(transformed.bodyHtml)}`;
    const themeCSS = loadThemeCss(settings.theme || DEFAULT_SETTINGS.theme);
    const mergedThemeCss = [themeCSS, resolvedTemplate?.cssText].filter(Boolean).join('\n\n');
    return generatePagedHtml(contentHtml, settings, mergedThemeCss || null, '/_pagedjs', {
        mermaidUrl: '/_mermaid',
        smilesDrawerUrl: '/_smiles-drawer',
    });
}

async function getPagedHtml() {
    if (cachedPagedHtml) return cachedPagedHtml;
    return new Promise((resolve, reject) => {
        buildQueue.push({ resolve, reject });
        if (!building) triggerBuild();
    });
}

function triggerBuild() {
    building = true;
    buildPagedHtml().then(html => {
        cachedPagedHtml = html;
        building = false;
        buildQueue.splice(0).forEach(({ resolve }) => resolve(html));
    }).catch(err => {
        building = false;
        buildQueue.splice(0).forEach(({ reject }) => reject(err));
    });
}

// ─── File watch → SSE reload ──────────────────────────────────────────────────
fs.watch(INPUT_FILE, () => {
    console.log(`[watch] ${path.basename(INPUT_FILE)} changed — rebuilding...`);
    cachedPagedHtml = null;
    triggerBuild();
    setTimeout(broadcastReload, 600);
});

// ─── Shell HTML (outer page — no paged.js here) ───────────────────────────────
// The shell provides the dark background and the <iframe>. It fetches /content
// and sets it as srcdoc, exactly as example.html does with generatePreviewHtml().
// SSE live-reload re-fetches /content and updates srcdoc in place.
function buildShellHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MD-PDF Preview</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    height: 100%;
    background: #525659;
    overflow: hidden;
  }
  #preview-frame {
    display: block;
    width: 100%;
    height: 100vh;
    border: none;
    background: #525659;
  }
  #status {
    position: fixed;
    top: 8px;
    right: 12px;
    font: 11px/1 monospace;
    color: #aaa;
    z-index: 10;
    pointer-events: none;
  }
</style>
</head>
<body>
<div id="status">loading…</div>
<iframe id="preview-frame" src="/content" title="Paged Preview"></iframe>
<script>
(function () {
    var frame = document.getElementById('preview-frame');
    var status = document.getElementById('status');

    function reloadContent() {
        status.textContent = 'rendering…';
        // Cache-bust so the browser re-fetches the rebuilt content
        frame.src = '/content?' + Date.now();
    }

    // Listen for paged.js 'rendered' message from the iframe
    window.addEventListener('message', function (e) {
        if (e.data && e.data.type === 'paged-rendered') {
            status.textContent = 'ready';
        }
    });

    frame.addEventListener('load', function () {
        status.textContent = 'paginating…';
    });

    // SSE for live reload
    var es = new EventSource('/_sse');
    es.onmessage = function (e) {
        if (e.data === 'reload') reloadContent();
    };
    es.onerror = function () {
        status.textContent = 'SSE lost — will retry';
    };
})();
</script>
</body>
</html>`;
}

// ─── HTTP server ──────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
    const requestPath = new URL(req.url, 'http://127.0.0.1').pathname;

    // SSE endpoint
    if (requestPath === '/_sse') {
        const id = ++sseClientId;
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });
        res.write('data: connected\n\n');
        sseClients.set(id, res);
        req.on('close', () => sseClients.delete(id));
        return;
    }

    // Local pagedjs polyfill
    if (requestPath === '/_pagedjs') {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        fs.createReadStream(PAGEDJS_LOCAL_PATH).pipe(res);
        return;
    }

    if (requestPath === '/_mermaid') {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        fs.createReadStream(MERMAID_LOCAL_PATH).pipe(res);
        return;
    }

    if (requestPath === '/_smiles-drawer') {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        fs.createReadStream(SMILES_DRAWER_LOCAL_PATH).pipe(res);
        return;
    }

    // Paged iframe content
    if (requestPath === '/content') {
        try {
            const html = await getPagedHtml();
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end(`Build error:\n${err.message}\n${err.stack}`);
        }
        return;
    }

    // Shell page
    if (requestPath === '/' || requestPath === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(buildShellHtml());
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
});

server.listen(PORT, () => {
    console.log(`✓ Preview server running at http://localhost:${PORT}`);
    console.log(`  Watching: ${INPUT_FILE}`);
    console.log(`  Edit the markdown file → browser updates automatically.`);
    triggerBuild();
});
