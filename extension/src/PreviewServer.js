'use strict';

const http = require('http');
const fs = require('fs');

class PreviewServer {
    /**
     * @param {{ routeToFilePath: Record<string, string> }} options
     */
    constructor(options) {
        this._routeToFilePath = options.routeToFilePath;
        this._contentHtml = '<!DOCTYPE html><html><body></body></html>';
        this._server = null;
        this._origin = null;
    }

    async start() {
        if (this._server) {
            return;
        }

        this._server = http.createServer((req, res) => this._handleRequest(req, res));

        await new Promise((resolve, reject) => {
            this._server.once('error', reject);
            this._server.listen(0, '127.0.0.1', () => {
                this._server.off('error', reject);
                const address = this._server.address();
                this._origin = `http://localhost:${address.port}`;
                resolve();
            });
        });
    }

    get origin() {
        return this._origin;
    }

    get port() {
        if (!this._server) return null;
        const address = this._server.address();
        return address ? address.port : null;
    }

    setContentHtml(html) {
        this._contentHtml = html;
    }

    getAssetPath(filePath) {
        for (const [routePath, assetFilePath] of Object.entries(this._routeToFilePath)) {
            if (assetFilePath === filePath) {
                return routePath;
            }
        }

        throw new Error(`Unknown preview asset: ${filePath}`);
    }

    async dispose() {
        if (!this._server) {
            return;
        }

        const server = this._server;
        this._server = null;
        this._origin = null;

        await new Promise((resolve) => {
            server.close(() => resolve());
        });
    }

    _handleRequest(req, res) {
        const requestPath = new URL(req.url, 'http://127.0.0.1').pathname;

        try {
            if (requestPath === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
                res.end(this._buildShellHtml());
                return;
            }

            if (requestPath === '/content') {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
                res.end(this._contentHtml);
                return;
            }

            const assetFilePath = this._routeToFilePath[requestPath];
            if (assetFilePath) {
                res.writeHead(200, {
                    'Content-Type': requestPath.endsWith('.css') ? 'text/css; charset=utf-8' : 'application/javascript; charset=utf-8',
                    'Cache-Control': 'no-store',
                });
                fs.createReadStream(assetFilePath).pipe(res);
                return;
            }

            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(error.stack || error.message || String(error));
        }
    }

    _buildShellHtml() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MD-PDF Preview Shell</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #525659; overflow: hidden; }
  #frame-container { position: relative; width: 100%; height: 100vh; }
  .preview-frame { display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; background: #525659; }
  #status { position: fixed; top: 8px; right: 12px; font: 11px/1 monospace; color: #aaa; z-index: 10; pointer-events: none; }
  #export-btn {
    position: fixed; bottom: 16px; right: 16px; z-index: 20;
    background: rgba(30,30,30,0.82); color: #ccc;
    border: 1px solid #555; border-radius: 5px;
    padding: 6px 14px; font: 12px/1.5 sans-serif;
    cursor: pointer; user-select: none;
  }
  #export-btn:hover { background: rgba(70,70,70,0.95); color: #fff; border-color: #888; }
</style>
</head>
<body>
<div id="status">loading...</div>
<button id="export-btn" title="Export as PDF" onclick="window.parent.postMessage({type:'export-pdf'},'*')">&#8595; Export PDF</button>
<div id="frame-container">
  <iframe id="frame-a" class="preview-frame" style="z-index:1" src="/content" title="Paged Preview"></iframe>
  <iframe id="frame-b" class="preview-frame" style="z-index:0" title="Paged Preview (buffer)"></iframe>
</div>
<script>
(function () {
    var frameA = document.getElementById('frame-a');
    var frameB = document.getElementById('frame-b');
    var status = document.getElementById('status');

    // activeFrame is the currently visible frame; hiddenFrame pre-loads the next render.
    var activeFrame = frameA;
    var hiddenFrame = frameB;
    var savedScrollPosition = 0;

    // expectedToken: the ?t= value of the currently-loading hidden frame.
    // null means no update is in progress (idle / initial load).
    // Using a token instead of e.source comparison because VS Code's sandboxed
    // webview environment does not reliably propagate e.source across iframe boundaries.
    var expectedToken = null;

    function saveScrollPosition() {
        try {
            var doc = activeFrame.contentDocument;
            savedScrollPosition = doc.documentElement.scrollTop || doc.body.scrollTop || 0;
        } catch (e) {
            savedScrollPosition = 0;
        }
    }

    function restoreScrollPosition(frame) {
        try {
            var doc = frame.contentDocument;
            doc.documentElement.scrollTop = savedScrollPosition;
            doc.body.scrollTop = savedScrollPosition;
        } catch (e) {}
    }

    function swapFrames() {
        // Restore scroll in the just-rendered frame before revealing it.
        restoreScrollPosition(hiddenFrame);

        // Bring the rendered frame to the front using z-index.
        // Both frames stay display:block so paged.js can compute real dimensions.
        hiddenFrame.style.zIndex = '1';
        activeFrame.style.zIndex = '0';

        var tmp = activeFrame;
        activeFrame = hiddenFrame;
        hiddenFrame = tmp;

        status.textContent = 'ready';
        try { window.parent.postMessage({ type: 'paged-rendered' }, '*'); } catch (e) {}
    }

    function reloadContent() {
        saveScrollPosition();
        status.textContent = 'rendering...';
        // Stamp the URL with a unique token; the content page echoes it back in
        // the paged-rendered message so we can identify this exact load.
        expectedToken = String(Date.now());
        hiddenFrame.src = '/content?t=' + expectedToken;
    }

    window.addEventListener('message', function (e) {
        if (!e.data) return;

        if (e.data.type === 'paged-rendered') {
            var token = e.data.token || null;
            if (expectedToken !== null && token === expectedToken) {
                // The hidden frame we requested has finished rendering — swap it in.
                expectedToken = null;
                swapFrames();
            } else if (expectedToken === null && token === null) {
                // No update pending: the initial active-frame load just finished.
                status.textContent = 'ready';
                try { window.parent.postMessage({ type: 'paged-rendered' }, '*'); } catch (err) {}
            }
            // else: stale event from a superseded load — ignore.
            return;
        }

        if (e.data.type === 'mdpdf-reload') {
            reloadContent();
        }
    });

    // Show 'paginating…' while paged.js is laying out the initial frame.
    frameA.addEventListener('load', function () {
        if (expectedToken === null) {
            status.textContent = 'paginating...';
        }
    });
})();
</script>
</body>
</html>`;
    }
}

module.exports = { PreviewServer };