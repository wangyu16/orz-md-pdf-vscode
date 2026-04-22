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

}

module.exports = { PreviewServer };