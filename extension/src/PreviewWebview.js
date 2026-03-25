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
            const fullHtml = await Pipeline.buildPreviewHtml(resolvedMd, (absPath) => this._server.getAssetPath(absPath));
            this._server.setContentHtml(fullHtml);
            this._panel.webview.html = this._buildOuterShellHtml();
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
            const fullHtml = await Pipeline.buildPreviewHtml(resolvedMd, (absPath) => this._server.getAssetPath(absPath));
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

    _buildOuterShellHtml() {
        const shellUrl = `${this._server.origin}/`;
        const csp = [
            "default-src 'none'",
            `frame-src ${this._server.origin}`,
            `child-src ${this._server.origin}`,
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
html, body {
    height: 100%;
    margin: 0;
    padding: 0;
    background: #525659;
    overflow: hidden;
}

#preview-shell {
    display: block;
    width: 100%;
    height: 100vh;
    border: none;
    background: #525659;
}
</style>
</head>
<body>
<iframe id="preview-shell" src="${shellUrl}" title="MD-PDF Preview"></iframe>
<script>
(function () {
    const vscode = acquireVsCodeApi();
    const frame = document.getElementById('preview-shell');

    window.addEventListener('message', function (event) {
        if (!event.data) return;

        if (event.data.type === 'mdpdf-reload') {
            if (frame && frame.contentWindow) {
                frame.contentWindow.postMessage({ type: 'mdpdf-reload' }, '*');
            }
            return;
        }

        if (event.data.type === 'paged-rendered') {
            vscode.postMessage({ type: 'paged-rendered' });
        }

        if (event.data.type === 'export-pdf') {
            vscode.postMessage({ type: 'export-pdf' });
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
