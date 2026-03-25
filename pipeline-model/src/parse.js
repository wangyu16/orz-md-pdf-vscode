'use strict';

const fs = require('fs');
const path = require('path');
const { md, prepareSources } = require('@orz-how/markdown-parser');
const hljs = require('highlight.js');

/**
 * Decode the HTML entities that markdown-it produces inside fenced code blocks.
 * hljs.highlight() expects plain text input, not HTML-encoded content.
 */
function decodeCodeEntities(str) {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

/**
 * Apply syntax highlighting to all fenced code blocks that carry a language class.
 * Blocks without a language class are left untouched.
 * The `hljs` class is added to the <code> element so the hljs theme's base
 * color/background rules apply.
 */
function applyHighlighting(html) {
    return html.replace(
        /<pre><code\b([^>]*)>([\s\S]*?)<\/code><\/pre>/g,
        (fullMatch, attrs, rawContent) => {
            const langMatch = attrs.match(/class="language-([^"\s]+)/);
            if (!langMatch) return fullMatch;

            const lang = langMatch[1];
            if (!hljs.getLanguage(lang)) return fullMatch;

            let highlighted;
            try {
                highlighted = hljs.highlight(decodeCodeEntities(rawContent), { language: lang }).value;
            } catch {
                return fullMatch;
            }

            // Append hljs class to existing class attribute
            const newAttrs = attrs.replace(/class="([^"]*)"/, 'class="$1 hljs"');
            return `<pre><code${newAttrs}>${highlighted}</code></pre>`;
        }
    );
}

async function parseMarkdown(source) {
    const prepared = await prepareSources(source);
    return applyHighlighting(md.render(prepared));
}

module.exports = { parseMarkdown };

if (require.main === module) {
    const inputFile = process.argv[2] || path.join(__dirname, '../test/core-smoke.md');
    const outDir = path.join(__dirname, '../out');
    fs.mkdirSync(outDir, { recursive: true });

    const source = fs.readFileSync(inputFile, 'utf8');
    parseMarkdown(source).then((html) => {
        const outFile = path.join(outDir, 'fragment.html');
        fs.writeFileSync(outFile, html, 'utf8');
        console.log(`HTML fragment written to ${outFile}`);
    }).catch((error) => {
        console.error('Parse error:', error);
        process.exit(1);
    });
}