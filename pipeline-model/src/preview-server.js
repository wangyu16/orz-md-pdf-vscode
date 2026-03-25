'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const { parseMarkdown } = require('./parse');
const { resolvePreviewPort, resolvePreviewSource } = require('./config/preview-config');
const { extractDocumentSettings } = require('./config/settings-normalize');
const { mergeCoreSettings } = require('./config/merge-settings');
const { resolveTemplateSettings } = require('./config/templates-registry');
const { stripMetadataScripts } = require('./nyml/extract');
const { processFlowDirectives } = require('./nyml/flow-directives');
const { processElements } = require('./nyml/elements');
const { generatePagedHtml } = require('./render/page-template');

const PAGEDJS_LOCAL_PATH = path.join(path.dirname(require.resolve('pagedjs')), '../dist/paged.polyfill.js');
const MERMAID_LOCAL_PATH = require.resolve('mermaid/dist/mermaid.min.js');
const SMILES_DRAWER_LOCAL_PATH = require.resolve('smiles-drawer/dist/smiles-drawer.min.js');

const INPUT_FILE = resolvePreviewSource(process.argv[2]);
const PORT = resolvePreviewPort(process.argv[3]);

const sseClients = new Map();
let sseClientId = 0;
let cachedPagedHtml = null;
let building = false;
let buildQueue = [];

function broadcastReload() {
    for (const [, res] of sseClients) {
        try {
            res.write('data: reload\n\n');
        } catch {
            // Ignore disconnected clients.
        }
    }
}

async function buildPagedHtml() {
    const source = fs.readFileSync(INPUT_FILE, 'utf8');
    const parsedHtml = await parseMarkdown(source);
    const extractedSettings = extractDocumentSettings(parsedHtml);
    const templateSettings = resolveTemplateSettings(extractedSettings.template);
    const settings = mergeCoreSettings(templateSettings, extractedSettings);
    const contentHtml = stripMetadataScripts(processElements(processFlowDirectives(parsedHtml), settings));
    return generatePagedHtml(contentHtml, settings, null, '/_pagedjs', {
        mermaidUrl: '/_mermaid',
        smilesDrawerUrl: '/_smiles-drawer',
    });
}

async function getPagedHtml() {
    if (cachedPagedHtml) {
        return cachedPagedHtml;
    }

    return new Promise((resolve, reject) => {
        buildQueue.push({ resolve, reject });
        if (!building) {
            triggerBuild();
        }
    });
}

function triggerBuild() {
    building = true;
    buildPagedHtml().then((html) => {
        cachedPagedHtml = html;
        building = false;
        buildQueue.splice(0).forEach(({ resolve }) => resolve(html));
    }).catch((error) => {
        building = false;
        buildQueue.splice(0).forEach(({ reject }) => reject(error));
    });
}

fs.watch(INPUT_FILE, () => {
    cachedPagedHtml = null;
    triggerBuild();
    setTimeout(broadcastReload, 600);
});

function buildShellHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MD-PDF Core Preview</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #525659; overflow: hidden; }
  #preview-frame { display: block; width: 100%; height: 100vh; border: none; background: #525659; }
  #status { position: fixed; top: 8px; right: 12px; font: 11px/1 monospace; color: #aaa; z-index: 10; pointer-events: none; }
</style>
</head>
<body>
<div id="status">loading...</div>
<iframe id="preview-frame" src="/content" title="Paged Preview"></iframe>
<script>
(function () {
    var frame = document.getElementById('preview-frame');
    var status = document.getElementById('status');
    function reloadContent() {
        status.textContent = 'rendering...';
        frame.src = '/content?' + Date.now();
    }
    window.addEventListener('message', function (e) {
        if (e.data && e.data.type === 'paged-rendered') {
            status.textContent = 'ready';
        }
    });
    frame.addEventListener('load', function () {
        status.textContent = 'paginating...';
    });
    var es = new EventSource('/_sse');
    es.onmessage = function (e) {
        if (e.data === 'reload') reloadContent();
    };
    es.onerror = function () {
        status.textContent = 'SSE lost - will retry';
    };
})();
</script>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
    const requestPath = new URL(req.url, 'http://127.0.0.1').pathname;

    try {
        if (requestPath === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(buildShellHtml());
            return;
        }

        if (requestPath === '/content') {
            const html = await getPagedHtml();
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
            res.end(html);
            return;
        }

        if (requestPath === '/_pagedjs') {
            res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
            fs.createReadStream(PAGEDJS_LOCAL_PATH).pipe(res);
            return;
        }

        if (requestPath === '/_mermaid') {
            res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
            fs.createReadStream(MERMAID_LOCAL_PATH).pipe(res);
            return;
        }

        if (requestPath === '/_smiles-drawer') {
            res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
            fs.createReadStream(SMILES_DRAWER_LOCAL_PATH).pipe(res);
            return;
        }

        if (requestPath === '/_sse') {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            });
            res.write('\n');
            const id = ++sseClientId;
            sseClients.set(id, res);
            req.on('close', () => {
                sseClients.delete(id);
            });
            return;
        }

        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(error.stack || error.message || String(error));
    }
});

server.listen(PORT, () => {
    console.log(`Core preview server running at http://localhost:${PORT}`);
    console.log(`Source file: ${INPUT_FILE}`);
});