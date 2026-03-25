'use strict';

const { entriesToBlocks, normalizeKey } = require('./extract');
const { resolveElement } = require('../elements/registry');
const { md } = require('@orz-how/markdown-parser');
const { parse: parseHtml } = require('node-html-parser');

const SCRIPT_RE = /<script type="application\/json" id="nyml-data">\s*([\s\S]*?)\s*<\/script>/g;

/**
 * CSS for the mdpdf-pre-body named-page wrapper.
 * Injected once into the document whenever any element uses placement: pre-body.
 *
 * The `page: mdpdf-pre-body` property causes paged.js to treat these elements
 * on a separate named page type. paged.js resets its `page` CSS counter when
 * switching between named page types, so body pages automatically start at 1.
 *
 * All @page margin boxes are suppressed on mdpdf-pre-body pages so that
 * headers, footers, and page numbers are hidden on these pages.
 */
const PRE_BODY_CSS = `
.mdpdf-pre-body {
    page: mdpdf-pre-body;
}
@page mdpdf-pre-body {
    @top-left-corner { content: none; border: none; box-shadow: none; background-image: none; }
    @top-left { content: none; border: none; box-shadow: none; background-image: none; }
    @top-center { content: none; border: none; box-shadow: none; background-image: none; }
    @top-right { content: none; border: none; box-shadow: none; background-image: none; }
    @top-right-corner { content: none; border: none; box-shadow: none; background-image: none; }
    @bottom-left-corner { content: none; border: none; box-shadow: none; background-image: none; }
    @bottom-left { content: none; border: none; box-shadow: none; background-image: none; }
    @bottom-center { content: none; border: none; box-shadow: none; background-image: none; }
    @bottom-right { content: none; border: none; box-shadow: none; background-image: none; }
    @bottom-right-corner { content: none; border: none; box-shadow: none; background-image: none; }
}`.trim();

/**
 * Extract headings from rendered HTML for TOC generation.
 * Returns an array of { level, id, text } objects in document order.
 * Only includes headings that have an id attribute (set by markdown-it-anchor).
 */
function extractHeadings(html) {
    const headings = [];
    const re = /<h([1-6])\b[^>]*\bid="([^"]*)"[^>]*>([\s\S]*?)<\/h\1>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
        const level = parseInt(m[1], 10);
        const id = m[2];
        // Strip all HTML tags and decode basic entities for plain text label
        const text = m[3]
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
        if (id) headings.push({ level, id, text });
    }
    return headings;
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom element helpers (define-element + dynamic switch)
// ─────────────────────────────────────────────────────────────────────────────

/** Escape user text for safe injection into HTML. */
function escHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Parse the `fields` definition string from a define-element block.
 * Each non-empty line is `fieldname:type` (e.g. `prompt:markdown`).
 * Returns { normalizedFieldName: 'text' | 'markdown' | 'markdown-inline' | ... }
 */
function parseFieldDefs(fieldsStr) {
    const defs = {};
    for (const line of String(fieldsStr || '').split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const colonIdx = trimmed.indexOf(':');
        let fname, ftype;
        if (colonIdx === -1) {
            fname = normalizeKey(trimmed);
            ftype = 'text';
        } else {
            fname = normalizeKey(trimmed.slice(0, colonIdx));
            ftype = trimmed.slice(colonIdx + 1).trim().toLowerCase() || 'text';
        }
        if (fname) defs[fname] = ftype;
    }
    return defs;
}

/**
 * Render a single field value according to its declared type.
 * - markdown        → md.render() (block-level, wraps in <p> etc.)
 * - markdown-inline → md.renderInline() (span-level)
 * - text (default)  → HTML-escaped plain text
 */
function renderFieldValue(value, fieldType) {
    const raw = String(value ?? '');
    if (fieldType === 'markdown') return md.render(raw);
    if (fieldType === 'markdown-inline') return md.renderInline(raw);
    return escHtml(raw);
}

/**
 * Test whether a `key=value` condition string matches dynamicChoices.
 * Key normalization: hyphens → underscores, lowercase (same as NYML keys).
 * Value normalization: lowercase.
 * Returns false if dynamicChoices is empty or the key is absent (safe default).
 */
function conditionMatches(condition, dynamicChoices) {
    const s = String(condition || '').trim();
    const eqIdx = s.indexOf('=');
    if (eqIdx === -1) return false;
    const key = normalizeKey(s.slice(0, eqIdx));
    const value = s.slice(eqIdx + 1).trim().toLowerCase();
    return dynamicChoices[key] === value;
}

/**
 * Apply data-show-when / data-hide-when filtering to an HTML fragment.
 *
 * Condition syntax: `key=value` (simple equality, no AND/OR).
 * Normalization rule: same as NYML key normalization (hyphens → underscores, lowercase).
 *
 * data-show-when="k=v" → node removed if condition does not match; attribute removed if it matches.
 * data-hide-when="k=v" → node removed if condition matches; attribute removed if it does not match.
 *
 * Missing key in dynamicChoices → treated as no match, so:
 *   data-show-when node is removed (safe default — hidden unless explicitly shown)
 *   data-hide-when node is kept
 */
function applyDynamicFilter(htmlFragment, dynamicChoices) {
    if (!htmlFragment) return htmlFragment;
    if (!htmlFragment.includes('data-show-when') && !htmlFragment.includes('data-hide-when')) {
        return htmlFragment;
    }

    const root = parseHtml(htmlFragment, { lowerCaseTagName: false, comment: false });

    for (const el of root.querySelectorAll('[data-show-when]')) {
        const cond = el.getAttribute('data-show-when');
        if (conditionMatches(cond, dynamicChoices)) {
            el.removeAttribute('data-show-when');
        } else {
            el.remove();
        }
    }

    for (const el of root.querySelectorAll('[data-hide-when]')) {
        const cond = el.getAttribute('data-hide-when');
        if (conditionMatches(cond, dynamicChoices)) {
            el.remove();
        } else {
            el.removeAttribute('data-hide-when');
        }
    }

    return root.toString();
}

/**
 * Render a custom element from a define-element definition + element instance block.
 * Steps:
 *   1. Parse field definitions (name → type)
 *   2. Replace [fieldname] placeholders in the HTML template with rendered field values
 *   3. Apply data-show-when / data-hide-when filtering against dynamicChoices
 */
function renderCustomElement(defBlock, instanceBlock, dynamicChoices) {
    const fieldDefs = parseFieldDefs(defBlock.fields);
    let html = String(defBlock.html || '');

    for (const [fname, ftype] of Object.entries(fieldDefs)) {
        const rendered = renderFieldValue(instanceBlock[fname], ftype);
        // Use split/join to avoid regex special-character issues in rendered content
        html = html.split(`[${fname}]`).join(rendered);
    }

    return applyDynamicFilter(html, dynamicChoices);
}

/**
 * Replace kind:element NYML blocks with their rendered HTML + scoped CSS.
 *
 * Each element type's CSS is emitted only once per document (tracked via a
 * Set).  Unknown element names are left in place so stripMetadataScripts()
 * can remove them cleanly.
 *
 * Elements that define renderWithContext(block, ctx) receive a context object
 * containing { headings } extracted from the full document HTML.
 *
 * Must be called BEFORE stripMetadataScripts().
 *
 * @param {string} html        - Full parsed HTML with NYML script tags in place.
 * @param {object} [settings]  - Merged document settings (used for dynamicChoices).
 */
function processElements(html, settings = {}) {
    const injectedCss = new Set();
    const headings = extractHeadings(html);
    const ctx = { headings };
    const dynamicChoices = (settings && settings.dynamicChoices) || {};

    // ── Pre-pass: collect all kind:define-element blocks ────────────────────
    // Must run before the replacement pass so that element instances can look
    // up their definitions even if define-element appears before the instance.
    const customElementRegistry = new Map();
    SCRIPT_RE.lastIndex = 0;
    {
        let preMatch;
        while ((preMatch = SCRIPT_RE.exec(html)) !== null) {
            let entries;
            try { entries = JSON.parse(preMatch[1].trim()); } catch { continue; }
            if (!Array.isArray(entries) || entries.length === 0) continue;
            const blocks = entriesToBlocks(entries);
            if (blocks.length === 0) continue;
            const block = blocks[0];
            if (block.kind !== 'define-element') continue;
            const name = String(block.name || '').trim();
            if (name) customElementRegistry.set(name, block);
        }
        SCRIPT_RE.lastIndex = 0;
    }

    // ── Replacement pass ─────────────────────────────────────────────────────
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

        // define-element blocks are declarations; they produce no HTML output.
        // They are already consumed in the pre-pass above.
        if (block.kind === 'define-element') return '';

        if (block.kind !== 'element') return fullMatch;

        // ── Built-in element registry ────────────────────────────────────────
        const builtinDef = resolveElement(block.name);
        if (builtinDef) {
            const isPreBody = String(block.placement || '').trim() === 'pre-body';

            let result = '';

            // Inject shared pre-body CSS once when any element uses placement: pre-body
            if (isPreBody && !injectedCss.has('__pre-body__')) {
                injectedCss.add('__pre-body__');
                result += `<style>\n${PRE_BODY_CSS}\n</style>\n`;
            }

            if (!injectedCss.has(block.name)) {
                injectedCss.add(block.name);
                result += `<style>\n${builtinDef.css}\n</style>\n`;
            }

            let builtinHtml;
            if (typeof builtinDef.renderWithContext === 'function') {
                builtinHtml = builtinDef.renderWithContext(block, ctx);
            } else {
                builtinHtml = builtinDef.render(block);
            }
            result += applyDynamicFilter(builtinHtml, dynamicChoices);

            // Append an explicit page break after each pre-body element.
            // Using mdpdf-pagebreak (break-before: page) is more reliable with
            // paged.js than break-after on the wrapper div itself.
            if (isPreBody) {
                result += '\n<div class="mdpdf-pagebreak"></div>';
            }

            return result;
        }

        // ── Custom element registry (define-element) ─────────────────────────
        const customDef = customElementRegistry.get(block.name);
        if (customDef) {
            let result = '';

            if (!injectedCss.has(block.name)) {
                injectedCss.add(block.name);
                const css = String(customDef.css || '').trim();
                if (css) result += `<style>\n${css}\n</style>\n`;
            }

            result += renderCustomElement(customDef, block, dynamicChoices);
            return result;
        }

        // Unknown element — leave for stripMetadataScripts
        return fullMatch;
    });
}

module.exports = { processElements };
