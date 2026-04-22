'use strict';

const vscode = require('vscode');
const path = require('path');
const { Pipeline, PAGEDJS_LOCAL_PATH, MERMAID_LOCAL_PATH, SMILES_DRAWER_LOCAL_PATH } = require('./Pipeline');
const { PreviewServer } = require('./PreviewServer');
const { resolveImages } = require('./ImageResolver');

/**
 * Manages the webview panel that shows the paged.js preview.
 * The webview hosts a stable localhost-backed shell iframe. The shell reloads
 * only its inner content frame when markdown changes, which preserves scroll
 * position and avoids flashing the whole webview.
 */
class PreviewWebview {
    /**
     * @param {vscode.WebviewPanel} panel
     * @param {import('./MdPdfDocument').MdPdfDocument} document
     * @param {import('./StatusBarManager').StatusBarManager} statusBar
     */
    constructor(panel, document, statusBar) {
        this._panel = panel;
        this._document = document;
        this._statusBar = statusBar;
        this._ready = false;
        this._server = new PreviewServer({
            routeToFilePath: {
                '/_pagedjs': PAGEDJS_LOCAL_PATH,
                '/_mermaid': MERMAID_LOCAL_PATH,
                '/_smiles-drawer': SMILES_DRAWER_LOCAL_PATH,
            },
        });

        panel.webview.onDidReceiveMessage((message) => {
            if (message && message.type === 'paged-rendered') {
                this._statusBar.setState('ready');
            }
            if (message && message.type === 'export-pdf') {
                vscode.commands.executeCommand('orzMdPdf.exportPdf');
            }
        });
        panel.onDidDispose(() => this.dispose());
    }

    /**
     * Do the initial render: build the full paged HTML and set it as the webview content.
     * This is called once when the custom editor is first resolved.
     */
    async initialize() {
        await this._server.start();

        this._panel.webview.options = {
            enableScripts: true,
            portMapping: [
                {
                    webviewPort: this._server.port,
                    extensionHostPort: this._server.port,
                },
            ],
        };
        this._statusBar.setState('rendering');
        try {
            // Resolve local images so they appear in the preview.
            const resolvedMd = resolveImages(this._document.markdown, this._document.uri);
            const serverOrigin = this._server.origin;
            const fullHtml = await Pipeline.buildPreviewHtml(resolvedMd, (absPath) => `${serverOrigin}${this._server.getAssetPath(absPath)}`);
            this._server.setContentHtml(fullHtml);
            this._panel.webview.html = this._buildWebviewHtml();
            this._ready = true;
        } catch (err) {
            this._statusBar.setState('error', err.message);
            this._panel.webview.html = this._errorHtml(err.message);
        }
    }

    /**
     * Rebuild the preview webview with the latest markdown after debounce.
     * @param {string} markdown  - current markdown (already from text editor)
     */
    async sendUpdate(markdown) {
        if (!this._ready) return;
        this._statusBar.setState('rendering');
        try {
            const resolvedMd = resolveImages(markdown, this._document.uri);
            const serverOrigin = this._server.origin;
            const fullHtml = await Pipeline.buildPreviewHtml(resolvedMd, (absPath) => `${serverOrigin}${this._server.getAssetPath(absPath)}`);
            this._server.setContentHtml(fullHtml);
            this._panel.webview.postMessage({ type: 'mdpdf-reload' });
        } catch (err) {
            this._statusBar.setState('error', err.message);
        }
    }

    reveal() {
        this._panel.reveal(this._panel.viewColumn, false);
    }

    isVisible() {
        return this._panel.visible;
    }

    /**
     * @param {string} message
     * @returns {string}
     */
    _errorHtml(message) {
        return `<!DOCTYPE html><html><body style="background:#1e1e1e;color:#f44;font-family:monospace;padding:2rem">
<h2>MD-PDF Render Error</h2><pre>${escapeHtml(message)}</pre></body></html>`;
    }

    // Embed the shell UI directly in the webview HTML so that VS Code's portMapping
    // only needs to proxy the content iframes (localhost/content), not an intermediate
    // shell page. This eliminates the 3-level iframe chain that caused the grey/empty
    // panel in the Extension Development Host.
    _buildWebviewHtml() {
        const serverOrigin = this._server.origin;
        const contentUrl = `${serverOrigin}/content`;
        const csp = [
            "default-src 'none'",
            `frame-src ${serverOrigin}`,
            `child-src ${serverOrigin}`,
            "script-src 'unsafe-inline'",
            "style-src 'unsafe-inline'",
        ].join('; ');

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
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
<button id="export-btn" title="Export as PDF">&#8595; Export PDF</button>
<div id="frame-container">
  <iframe id="frame-a" class="preview-frame" style="z-index:1" src="${contentUrl}" title="Paged Preview"></iframe>
  <iframe id="frame-b" class="preview-frame" style="z-index:0;opacity:0" title="Paged Preview (buffer)"></iframe>
</div>
<script>
(function () {
    var vscode = acquireVsCodeApi();
    var serverOrigin = ${JSON.stringify(serverOrigin)};
    var frameA = document.getElementById('frame-a');
    var frameB = document.getElementById('frame-b');
    var status = document.getElementById('status');
    var exportBtn = document.getElementById('export-btn');

    exportBtn.addEventListener('click', function () {
        vscode.postMessage({ type: 'export-pdf' });
    });

    var activeFrame = frameA;
    var hiddenFrame = frameB;
    // Scroll ratio [0,1] reported by the active content frame via postMessage.
    // cross-origin rules block direct contentDocument access, so the content
    // page sends updates and we echo the ratio back in each new frame's URL.
    var savedScrollRatio = 0;
    var expectedToken = null;
    var pollingTimer = null;

    function startPolling(frame, onDone) {
        if (pollingTimer) clearInterval(pollingTimer);
        pollingTimer = setInterval(function() {
            try {
                if (frame.contentWindow && frame.contentWindow.__pagedRendered) {
                    clearInterval(pollingTimer);
                    pollingTimer = null;
                    onDone();
                }
            } catch(e) {
                clearInterval(pollingTimer);
                pollingTimer = null;
            }
        }, 200);
    }

    function swapFrames() {
        // Bring the incoming frame to front while it's still opacity:0 (invisible),
        // so the browser can render + scroll-position it without the user seeing page 1.
        hiddenFrame.style.zIndex = '1';
        activeFrame.style.zIndex = '0';
        var tmp = activeFrame;
        activeFrame = hiddenFrame;
        hiddenFrame = tmp;
        // Ask the content page to re-apply its scroll position now that it is the
        // front frame — the browser may have deferred or ignored the scrollTop
        // assignment made while it was behind the previous frame.
        try { activeFrame.contentWindow.postMessage({ type: 'frame-visible' }, '*'); } catch(e) {}
        // Reveal the frame after two animation frames: enough time for the browser
        // to commit the correct scroll position before the user sees anything.
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                activeFrame.style.opacity = '1';
                // Reset the outgoing frame's opacity so it is ready for the next swap.
                hiddenFrame.style.opacity = '0';
                status.textContent = 'ready';
                vscode.postMessage({ type: 'paged-rendered' });
            });
        });
    }

    function reloadContent() {
        status.textContent = 'rendering...';
        expectedToken = String(Date.now());
        // Ensure the incoming frame is invisible before we start loading new content.
        hiddenFrame.style.opacity = '0';
        hiddenFrame.src = serverOrigin + '/content?t=' + expectedToken + '&scroll=' + savedScrollRatio;
        startPolling(hiddenFrame, function() {
            if (expectedToken !== null) {
                expectedToken = null;
                swapFrames();
            }
        });
    }

    window.addEventListener('message', function (e) {
        if (!e.data) return;

        // Scroll ratio from the active content frame (cross-origin postMessage).
        if (e.data.type === 'scroll-update') {
            savedScrollRatio = e.data.ratio;
            return;
        }

        if (e.data.type === 'paged-rendered') {
            var token = e.data.token || null;
            if (expectedToken !== null && token === expectedToken) {
                expectedToken = null;
                if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null; }
                swapFrames();
            } else if (expectedToken === null && token === null) {
                if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null; }
                status.textContent = 'ready';
                vscode.postMessage({ type: 'paged-rendered' });
            }
            return;
        }

        if (e.data.type === 'mdpdf-reload') {
            reloadContent();
        }
    });

    frameA.addEventListener('load', function () {
        if (expectedToken === null) {
            status.textContent = 'paginating...';
            startPolling(frameA, function() {
                status.textContent = 'ready';
                vscode.postMessage({ type: 'paged-rendered' });
            });
        }
    });
})();
<\/script>
</body>
</html>`;
    }

    async dispose() {
        this._ready = false;
        await this._server.dispose();
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

module.exports = { PreviewWebview };
