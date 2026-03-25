'use strict';

const { entriesToBlocks } = require('./extract');

const SCRIPT_RE = /<script type="application\/json" id="nyml-data">\s*([\s\S]*?)\s*<\/script>/g;

// Validation: accepted CSS length units for vspace height
const CSS_LENGTH_RE = /^[\d.]+(%|em|rem|px|pt|mm|cm|in|lh|ex|ch|vw|vh)$/;

/**
 * Replace kind:pagebreak and kind:vspace NYML blocks with HTML flow elements.
 * All other nyml script tags are left in place for stripMetadataScripts() to remove.
 * Must be called BEFORE stripMetadataScripts().
 *
 * kind:pagebreak → <div class="mdpdf-pagebreak"></div>  (repeated `number` times)
 * kind:vspace    → <div class="mdpdf-vspace" style="height: NNmm"></div>
 */
function processFlowDirectives(html) {
    return String(html).replace(SCRIPT_RE, (fullMatch, content) => {
        let entries;
        try {
            entries = JSON.parse(content.trim());
        } catch {
            return fullMatch;
        }

        if (!Array.isArray(entries) || entries.length === 0) return fullMatch;

        const blocks = entriesToBlocks(entries);
        if (blocks.length === 0) return fullMatch;

        const block = blocks[0];

        if (block.kind === 'pagebreak') {
            // Clamp number to 1–10 to avoid abuse
            const count = Math.max(1, Math.min(10, parseInt(String(block.number || 1), 10) || 1));
            return '<div class="mdpdf-pagebreak"></div>'.repeat(count);
        }

        if (block.kind === 'vspace') {
            const raw = String(block.height || '1em').trim();
            const height = CSS_LENGTH_RE.test(raw) ? raw : '1em';
            return `<div class="mdpdf-vspace" style="height:${height}"></div>`;
        }

        return fullMatch;
    });
}

module.exports = { processFlowDirectives };
