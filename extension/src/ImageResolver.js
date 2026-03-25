'use strict';

const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

// MIME type map for common image extensions.
const MIME_MAP = {
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.webp': 'image/webp',
    '.svg':  'image/svg+xml',
    '.bmp':  'image/bmp',
    '.ico':  'image/x-icon',
    '.tiff': 'image/tiff',
    '.tif':  'image/tiff',
};

// Regex patterns for markdown image syntax.
//  ![alt](path) and ![alt](path "title")
const MD_IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)]+)\)/g;
const warnedMissingPaths = new Set();
const warnedReadFailures = new Set();

/**
 * Resolve all local relative image references in a markdown string to
 * inline data: URIs so the webview / Puppeteer can display them regardless of
 * file system access restrictions.
 *
 * Web URLs (http://, https://) and existing data: URIs are left unchanged.
 * Missing local files trigger a warning notification (once per file per session).
 *
 * @param {string} markdown
 * @param {vscode.Uri} documentUri  - the .md.pdf file's URI, used as the base for relative paths
 * @returns {string} - markdown with local image paths replaced by data URIs
 */
function resolveImages(markdown, documentUri) {
    const baseDir = path.dirname(documentUri.fsPath);

    return markdown.replace(MD_IMAGE_PATTERN, (fullMatch, alt, rawSrc) => {
        // Strip optional title from src: `path.png "title"` → `path.png`
        const src = rawSrc.trim().replace(/\s+"[^"]*"$/, '').trim();

        // Leave web URLs and data URIs untouched.
        if (/^https?:\/\//i.test(src) || /^data:/i.test(src)) {
            return fullMatch;
        }

        // Treat as a local relative (or absolute) path.
        const absPath = path.isAbsolute(src) ? src : path.resolve(baseDir, src);

        if (!fs.existsSync(absPath)) {
            if (!warnedMissingPaths.has(absPath)) {
                warnedMissingPaths.add(absPath);
                vscode.window.showWarningMessage(`MD-PDF: Image not found: ${src}`);
            }
            return fullMatch; // Leave unchanged — renders as broken image.
        }

        const ext = path.extname(absPath).toLowerCase();
        const mime = MIME_MAP[ext] || 'application/octet-stream';

        try {
            const data = fs.readFileSync(absPath);
            const b64 = data.toString('base64');
            // Preserve the title part (if any) in the replacement.
            const titlePart = rawSrc.trim().replace(/^[^\s]+/, '').trim();
            const newSrc = titlePart ? `data:${mime};base64,${b64} ${titlePart}` : `data:${mime};base64,${b64}`;
            return `![${alt}](${newSrc})`;
        } catch (err) {
            const warningKey = `${absPath}:${err.message}`;
            if (!warnedReadFailures.has(warningKey)) {
                warnedReadFailures.add(warningKey);
                vscode.window.showWarningMessage(`MD-PDF: Could not read image: ${src} — ${err.message}`);
            }
            return fullMatch;
        }
    });
}

module.exports = { resolveImages };
