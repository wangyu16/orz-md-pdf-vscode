'use strict';

// Lazy-cached API from the dependent orz-md-preview extension.
let _apiPromise = null;

async function _getOrzMdApi() {
    if (_apiPromise) return _apiPromise;
    _apiPromise = (async () => {
        // vscode is available because this module runs inside the VS Code extension host.
        const vscode = require('vscode');
        const ext = vscode.extensions.getExtension('yuwang26.orz-md-preview');
        if (!ext) {
            throw new Error(
                'The required extension "yuwang26.orz-md-preview" is not installed. ' +
                'Please install it before using orz-md-pdf.'
            );
        }
        return await ext.activate();
    })();
    return _apiPromise;
}

/**
 * Parse markdown source to an HTML fragment using the orz-md-preview extension API.
 * Returns a self-contained HTML fragment ready to be placed inside a .markdown-body container.
 * @param {string} source
 * @returns {Promise<string>}
 */
async function parseMarkdown(source) {
    const api = await _getOrzMdApi();
    return api.renderMarkdownHtml(source);
}

module.exports = { parseMarkdown };
