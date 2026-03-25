/**
 * parse.js — Markdown → HTML fragment
 *
 * Uses @orz-how/markdown-parser (markdown-it + custom plugins).
 * prepareSources(src) handles async plugins ({{md include}}, etc.)
 * md.render(prepared) produces the HTML fragment.
 *
 * Usage: node src/parse.js [file.md]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { md, prepareSources } = require('@orz-how/markdown-parser');

/**
 * Parse a markdown string to an HTML fragment.
 * @param {string} source  Raw markdown content
 * @returns {Promise<string>} HTML fragment (no <html>/<body> wrapper)
 */
async function parseMarkdown(source) {
    const prepared = await prepareSources(source);
    return md.render(prepared);
}

module.exports = { parseMarkdown };

// CLI: node src/parse.js [input.md]
if (require.main === module) {
    const inputFile = process.argv[2] || path.join(__dirname, '../test/sample.md');
    const outDir = path.join(__dirname, '../out');
    fs.mkdirSync(outDir, { recursive: true });

    const source = fs.readFileSync(inputFile, 'utf8');
    parseMarkdown(source).then(html => {
        const outFile = path.join(outDir, 'fragment.html');
        fs.writeFileSync(outFile, html, 'utf8');
        console.log(`✓ HTML fragment written to ${outFile}`);
        console.log(`  Preview by opening: file://${outFile}`);
    }).catch(err => {
        console.error('Parse error:', err);
        process.exit(1);
    });
}
