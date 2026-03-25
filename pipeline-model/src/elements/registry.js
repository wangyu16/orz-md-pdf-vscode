'use strict';

const { md } = require('@orz-how/markdown-parser');

/** Escape user-supplied text for safe HTML injection. */
function esc(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Render a field value as inline markdown (bold, italic, images, links, etc.).
 * Use this for single-line display fields where the user may want formatting.
 */
function renderMd(str) {
    if (!str) return '';
    return md.renderInline(String(str));
}

/**
 * Render a field value as block markdown (paragraphs, lists, etc.).
 * Use this for multi-line content fields where the user may write full prose.
 */
function renderBlock(str) {
    if (!str) return '';
    return md.render(String(str));
}

/** Split a pipe-separated list into trimmed, non-empty strings. */
function splitPipe(str) {
    return String(str || '').split('|').map((s) => s.trim()).filter(Boolean);
}

/** Validate a CSS length value (same units as vspace). */
const CSS_LENGTH_RE = /^[\d.]+(%|em|rem|px|pt|mm|cm|in|lh|ex|ch|vw|vh)$/;
function cssLength(raw, fallback) {
    const s = String(raw || '').trim();
    return CSS_LENGTH_RE.test(s) ? s : fallback;
}

/** Format a Date object as MM/DD/YYYY. */
function formatDate(d) {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}/${dd}/${d.getFullYear()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Element definitions
// ─────────────────────────────────────────────────────────────────────────────

const ELEMENTS = {

    // ── thesis-title-page ────────────────────────────────────────────────────
    //
    // A full-page thesis / dissertation title page.
    //
    // Fields:
    //   title        (required) — main title
    //   subtitle     (optional) — subtitle
    //   author       (optional) — author name
    //   degree       (optional) — e.g. "Doctor of Philosophy"
    //   department   (optional) — department name
    //   institution  (optional) — institution name
    //   date         (optional) — e.g. "March 2026"
    //   placement    (optional) — "pre-body": page break after, hides header/footer, skips page counter
    //
    // When placement is "pre-body", the element is wrapped in a .mdpdf-pre-body
    // container that forces a page break after and hides header/footer on that page.
    'thesis-title-page': {
        css: `
.mdpdf-el-thesis-title-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    min-height: calc(100vh - 2in);
    font-family: inherit;
}
.mdpdf-el-thesis-title-page .tpg-spacer-top { flex: 2; min-height: 0.5in; }
.mdpdf-el-thesis-title-page .tpg-spacer-bottom { flex: 1; min-height: 0.25in; }
.mdpdf-el-thesis-title-page .tpg-institution {
    font-size: 1.05em;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 0.15em;
}
.mdpdf-el-thesis-title-page .tpg-department {
    font-size: 0.88em;
    margin-bottom: 1.8em;
}
.mdpdf-el-thesis-title-page .tpg-rule {
    width: 55%;
    border: none;
    border-top: 1px solid currentColor;
    opacity: 0.35;
    margin: 0.6em 0;
    align-self: center;
}
.mdpdf-el-thesis-title-page .tpg-title {
    font-size: 1.85em;
    font-weight: 700;
    line-height: 1.25;
    max-width: 78%;
    margin: 0.4em 0 0.3em;
}
.mdpdf-el-thesis-title-page .tpg-subtitle {
    font-size: 1.05em;
    font-style: italic;
    opacity: 0.72;
    margin-bottom: 0.2em;
}
.mdpdf-el-thesis-title-page .tpg-degree-label {
    font-size: 0.82em;
    font-style: italic;
    opacity: 0.65;
    margin-top: 1.6em;
    margin-bottom: 0.25em;
}
.mdpdf-el-thesis-title-page .tpg-degree {
    font-size: 0.97em;
    font-weight: 700;
    margin-bottom: 1.2em;
}
.mdpdf-el-thesis-title-page .tpg-by {
    font-size: 0.82em;
    opacity: 0.65;
    margin-bottom: 0.2em;
}
.mdpdf-el-thesis-title-page .tpg-author {
    font-size: 1.12em;
    font-weight: 600;
    margin-bottom: 1.4em;
}
.mdpdf-el-thesis-title-page .tpg-date {
    font-size: 0.88em;
    opacity: 0.65;
}`.trim(),

        render(fields) {
            const parts = [];
            parts.push('<div class="mdpdf-el-thesis-title-page">');
            parts.push('<div class="tpg-spacer-top"></div>');
            if (fields.institution) {
                parts.push(`<div class="tpg-institution">${esc(fields.institution)}</div>`);
            }
            if (fields.department) {
                parts.push(`<div class="tpg-department">${esc(fields.department)}</div>`);
            }
            parts.push('<hr class="tpg-rule">');
            parts.push(`<div class="tpg-title">${renderMd(fields.title || 'Untitled')}</div>`);
            if (fields.subtitle) {
                parts.push(`<div class="tpg-subtitle">${renderMd(fields.subtitle)}</div>`);
            }
            parts.push('<hr class="tpg-rule">');
            if (fields.degree) {
                parts.push('<div class="tpg-degree-label">Submitted in partial fulfillment of the requirements for the degree of</div>');
                parts.push(`<div class="tpg-degree">${esc(fields.degree)}</div>`);
            }
            if (fields.author) {
                parts.push('<div class="tpg-by">by</div>');
                parts.push(`<div class="tpg-author">${renderMd(fields.author)}</div>`);
            }
            if (fields.date) {
                parts.push(`<div class="tpg-date">${esc(fields.date)}</div>`);
            }
            parts.push('<div class="tpg-spacer-bottom"></div>');
            parts.push('</div>');
            const inner = parts.join('\n');
            if (String(fields.placement || '').trim() === 'pre-body') {
                return `<div class="mdpdf-pre-body">${inner}</div>`;
            }
            return inner;
        },
    },

    // ── academic-title-section ───────────────────────────────────────────────
    //
    // Compact title block for scientific paper / report style documents.
    //
    // Fields:
    //   title        (required) — paper title
    //   authors      (optional) — comma-separated, supports ^N superscripts
    //   affiliations (optional) — pipe-separated list, supports ^N superscripts
    //   date         (optional) — e.g. "March 2026"
    //   doi          (optional) — DOI string
    'academic-title-section': {
        css: `
.mdpdf-el-academic-title-section {
    text-align: center;
    margin: 1.5em 0 1em;
    font-family: inherit;
}
.mdpdf-el-academic-title-section .ats-title {
    font-size: 1.45em;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 0.6em;
}
.mdpdf-el-academic-title-section .ats-authors {
    font-size: 0.97em;
    margin-bottom: 0.4em;
}
.mdpdf-el-academic-title-section .ats-affiliations {
    font-size: 0.82em;
    opacity: 0.72;
    line-height: 1.5;
    margin-bottom: 0.4em;
}
.mdpdf-el-academic-title-section .ats-meta {
    font-size: 0.82em;
    opacity: 0.65;
    font-style: italic;
}`.trim(),

        render(fields) {
            const parts = [];
            parts.push('<div class="mdpdf-el-academic-title-section">');
            parts.push(`<div class="ats-title">${renderMd(fields.title || 'Untitled')}</div>`);
            if (fields.authors) {
                parts.push(`<div class="ats-authors">${renderMd(fields.authors)}</div>`);
            }
            if (fields.affiliations) {
                const affils = splitPipe(fields.affiliations);
                parts.push('<div class="ats-affiliations">');
                for (const a of affils) {
                    parts.push(`<div>${renderMd(a)}</div>`);
                }
                parts.push('</div>');
            }
            const meta = [];
            if (fields.date) meta.push(esc(fields.date));
            if (fields.doi) meta.push(`DOI:&nbsp;${esc(fields.doi)}`);
            if (meta.length) {
                parts.push(`<div class="ats-meta">${meta.join(' · ')}</div>`);
            }
            parts.push('</div>');
            return parts.join('\n');
        },
    },

    // ── abstract ────────────────────────────────────────────────────────────
    //
    // Abstract block with optional keywords line.
    //
    // Fields:
    //   text          (required) — abstract body text; supports block markdown
    //   keywords      (optional) — comma-separated keyword list; supports inline markdown
    //   heading_style (optional) — "centered" (default): centered "ABSTRACT" heading on a separate line
    //                              "inline": "Abstract." bold run-in at the start of the text
    //   placement     (optional) — "pre-body": page break after, hides header/footer, skips page counter
    'abstract': {
        css: `
.mdpdf-el-abstract {
    margin: 1.2em auto;
    max-width: 88%;
    font-family: inherit;
}
.mdpdf-el-abstract .abs-heading {
    font-size: 0.9em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-align: center;
    margin-bottom: 0.5em;
}
.mdpdf-el-abstract .abs-text {
    font-size: 0.9em;
    line-height: 1.55;
    text-align: justify;
    hyphens: auto;
}
.mdpdf-el-abstract .abs-keywords {
    font-size: 0.85em;
    margin-top: 0.7em;
    line-height: 1.4;
}
.mdpdf-el-abstract .abs-keywords-label {
    font-weight: 700;
}`.trim(),

        render(fields) {
            const headingStyle = String(fields.heading_style || 'centered').trim();
            const parts = [];
            parts.push('<div class="mdpdf-el-abstract">');
            if (headingStyle === 'inline') {
                // Run-in style: "Abstract." bolded at the start of the text block
                const combined = `**Abstract:** ${(fields.text || '').trimStart()}`;
                parts.push(`<div class="abs-text abs-text--inline">${renderBlock(combined)}</div>`);
            } else {
                // Default: centered heading on its own line
                parts.push('<div class="abs-heading">Abstract</div>');
                parts.push(`<div class="abs-text">${renderBlock(fields.text || '')}</div>`);
            }
            if (fields.keywords) {
                parts.push(`<div class="abs-keywords"><span class="abs-keywords-label">Keywords: </span>${renderMd(fields.keywords)}</div>`);
            }
            parts.push('</div>');
            const inner = parts.join('\n');
            if (String(fields.placement || '').trim() === 'pre-body') {
                return `<div class="mdpdf-pre-body">${inner}</div>`;
            }
            return inner;
        },
    },

    // ── letterhead ───────────────────────────────────────────────────────────
    //
    // Letterhead block for formal letter documents.
    //
    // Fields:
    //   organization (required) — organization / sender name; supports inline markdown
    //   tagline      (optional) — subtitle or department; supports inline markdown
    //   logo         (optional) — logo image using `![]()` syntax (or any inline markdown)
    //   logo_text    (optional) — plain-text placeholder (fallback when logo is absent)
    //   address      (optional) — pipe-separated address lines
    //   phone        (optional)
    //   email        (optional)
    //   website      (optional)
    //   border       (optional) — "false" to hide the bottom rule; default true
    'letterhead': {
        css: `
.mdpdf-el-letterhead {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1em;
    padding-bottom: 0.75em;
    border-bottom: 1.5px solid currentColor;
    margin-bottom: 1.6em;
    font-family: inherit;
}
.mdpdf-el-letterhead.lhd-no-border {
    border-bottom: none;
    padding-bottom: 0;
}
.mdpdf-el-letterhead .lhd-left {
    flex: 1;
}
.mdpdf-el-letterhead .lhd-logo {
    margin-bottom: 0.35em;
    line-height: 1;
}
.mdpdf-el-letterhead .lhd-logo img {
    max-height: 1.5in;
    width: auto;
    display: block;
    margin: 0;
}
.mdpdf-el-letterhead .lhd-logo-text {
    font-size: 0.75em;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.45;
    margin-bottom: 0.2em;
    font-style: italic;
}
.mdpdf-el-letterhead .lhd-org {
    font-size: 1.25em;
    font-weight: 700;
    line-height: 1.2;
}
.mdpdf-el-letterhead .lhd-tagline {
    font-size: 0.82em;
    opacity: 0.68;
    margin-top: 0.15em;
    font-style: italic;
}
.mdpdf-el-letterhead .lhd-right {
    text-align: right;
    font-size: 0.82em;
    line-height: 1.75;
    opacity: 0.68;
}`.trim(),

        render(fields) {
            const showBorder = String(fields.border ?? 'true').trim() !== 'false';
            const borderClass = showBorder ? '' : ' lhd-no-border';
            const parts = [];
            parts.push(`<div class="mdpdf-el-letterhead${borderClass}">`);
            parts.push('<div class="lhd-left">');
            if (fields.logo) {
                parts.push(`<div class="lhd-logo">${renderMd(fields.logo)}</div>`);
            } else if (fields.logo_text) {
                parts.push(`<div class="lhd-logo-text">${esc(fields.logo_text)}</div>`);
            }
            parts.push(`<div class="lhd-org">${renderMd(fields.organization || 'Organization')}</div>`);
            if (fields.tagline) {
                parts.push(`<div class="lhd-tagline">${renderMd(fields.tagline)}</div>`);
            }
            parts.push('</div>');
            parts.push('<div class="lhd-right">');
            if (fields.address) {
                for (const line of splitPipe(fields.address)) {
                    parts.push(`<div>${esc(line)}</div>`);
                }
            }
            if (fields.phone) parts.push(`<div>${esc(fields.phone)}</div>`);
            if (fields.email) parts.push(`<div>${esc(fields.email)}</div>`);
            if (fields.website) parts.push(`<div>${esc(fields.website)}</div>`);
            parts.push('</div>');
            parts.push('</div>');
            return parts.join('\n');
        },
    },

    // ── letterhead-academic ──────────────────────────────────────────────────
    //
    // Institutional letterhead: logo flush-left, institute + department on the
    // right, then a thick grey divider, then a full-width contact row below.
    //
    // Fields:
    //   logo           (optional) — logo image using `![]()` syntax
    //   logo_text      (optional) — text placeholder when logo is absent
    //   institute      (required) — top-level institution name; inline markdown
    //   department     (optional) — department or unit; inline markdown
    //   address        (optional) — pipe-separated contact items below divider
    //   phone          (optional)
    //   email          (optional)
    //   website        (optional)
    //   contact_align  (optional) — left (default) | center | right
    'letterhead-academic': {
        css: `
.mdpdf-el-letterhead-academic {
    font-family: inherit;
    margin-bottom: 1.6em;
}
.mdpdf-el-letterhead-academic .lhac-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1em;
    padding-bottom: 0.6em;
    border-bottom: 4px solid #8a8a8a;
    margin-bottom: 0.45em;
}
.mdpdf-el-letterhead-academic .lhac-left {
    flex: 0 0 auto;
}
.mdpdf-el-letterhead-academic .lhac-logo {
    line-height: 1;
}
.mdpdf-el-letterhead-academic .lhac-logo img {
    max-height: 1.2in;
    max-width: 2.4in;
    width: auto;
    display: block;
    margin: 0;
}
.mdpdf-el-letterhead-academic .lhac-logo-text {
    font-size: 0.75em;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.45;
    font-style: italic;
}
.mdpdf-el-letterhead-academic .lhac-right {
    text-align: right;
    flex: 1 1 auto;
}
.mdpdf-el-letterhead-academic .lhac-institute {
    font-size: 1.1em;
    font-weight: 700;
    line-height: 1.25;
}
.mdpdf-el-letterhead-academic .lhac-department {
    font-size: 0.88em;
    opacity: 0.72;
    margin-top: 0.1em;
    font-style: italic;
}
.mdpdf-el-letterhead-academic .lhac-contact {
    font-size: 0.8em;
    opacity: 0.65;
    line-height: 1.6;
    display: flex;
    flex-wrap: wrap;
    gap: 0 1.2em;
}
.mdpdf-el-letterhead-academic .lhac-contact.lhac-center {
    justify-content: center;
}
.mdpdf-el-letterhead-academic .lhac-contact.lhac-right {
    justify-content: flex-end;
}`.trim(),

        render(fields) {
            const parts = [];
            parts.push('<div class="mdpdf-el-letterhead-academic">');

            // Top row: logo left, institute/department right
            parts.push('<div class="lhac-top">');
            parts.push('<div class="lhac-left">');
            if (fields.logo) {
                parts.push(`<div class="lhac-logo">${renderMd(fields.logo)}</div>`);
            } else if (fields.logo_text) {
                parts.push(`<div class="lhac-logo-text">${esc(fields.logo_text)}</div>`);
            }
            parts.push('</div>');
            parts.push('<div class="lhac-right">');
            parts.push(`<div class="lhac-institute">${renderMd(fields.institute || 'Institution')}</div>`);
            if (fields.department) {
                parts.push(`<div class="lhac-department">${renderMd(fields.department)}</div>`);
            }
            parts.push('</div>');
            parts.push('</div>');

            // Contact row below the thick border
            const contactItems = [];
            if (fields.address) contactItems.push(...splitPipe(fields.address).map(esc));
            if (fields.phone)   contactItems.push(esc(fields.phone));
            if (fields.email)   contactItems.push(esc(fields.email));
            if (fields.website) contactItems.push(esc(fields.website));
            if (contactItems.length) {
                const align = String(fields.contact_align || '').trim().toLowerCase();
                const alignClass = align === 'center' ? ' lhac-center'
                    : align === 'right'  ? ' lhac-right'
                    : '';
                parts.push(`<div class="lhac-contact${alignClass}">`);
                for (const item of contactItems) {
                    parts.push(`<span>${item}</span>`);
                }
                parts.push('</div>');
            }

            parts.push('</div>');
            return parts.join('\n');
        },
    },

    // ── letterhead-academic-2 ────────────────────────────────────────────────
    //
    // Two-column institutional letterhead.
    // Left column: logo only (left-aligned, vertically centered).
    // Right column (right-aligned):
    //   — institute name
    //   — department name
    //   — thin horizontal rule
    //   — contact information list
    //
    // Fields:
    //   logo         (optional) — logo image using `![]()` syntax
    //   logo_text    (optional) — text placeholder when logo is absent
    //   institute    (required) — top-level institution name; inline markdown
    //   department   (optional) — department or unit; inline markdown
    //   address      (optional) — pipe-separated contact items below rule
    //   phone        (optional)
    //   email        (optional)
    //   website      (optional)
    'letterhead-academic-2': {
        css: `
.mdpdf-el-letterhead-academic-2 {
    display: flex;
    align-items: flex-start;
    gap: 1.5em;
    font-family: inherit;
    margin-bottom: 1.6em;
}
.mdpdf-el-letterhead-academic-2 .lha2-left {
    flex: 0 0 auto;
}
.mdpdf-el-letterhead-academic-2 .lha2-logo {
    line-height: 1;
}
.mdpdf-el-letterhead-academic-2 .lha2-logo img {
    max-height: 1.8in;
    max-width: 2.8in;
    width: auto;
    display: block;
    margin: 0;
}
.mdpdf-el-letterhead-academic-2 .lha2-logo-text {
    font-size: 0.75em;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.45;
    font-style: italic;
}
.mdpdf-el-letterhead-academic-2 .lha2-right {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}
.mdpdf-el-letterhead-academic-2 .lha2-header {
    text-align: right;
    padding-bottom: 0.4em;
    border-bottom: 1px solid rgba(0, 0, 0, 0.3);
    margin-bottom: 0.45em;
}
.mdpdf-el-letterhead-academic-2 .lha2-institute {
    font-size: 1.1em;
    font-weight: 700;
    line-height: 1;
}
.mdpdf-el-letterhead-academic-2 .lha2-department {
    font-size: 0.88em;
    opacity: 0.72;
    margin-top: 0.1em;
    font-style: italic;
}
.mdpdf-el-letterhead-academic-2 .lha2-contact {
    text-align: right;
    font-size: 0.8em;
    opacity: 0.65;
    line-height: 1.1;
}`.trim(),

        render(fields) {
            const parts = [];
            parts.push('<div class="mdpdf-el-letterhead-academic-2">');

            // Left: logo, pinned to top
            parts.push('<div class="lha2-left">');
            if (fields.logo) {
                parts.push(`<div class="lha2-logo">${renderMd(fields.logo)}</div>`);
            } else if (fields.logo_text) {
                parts.push(`<div class="lha2-logo-text">${esc(fields.logo_text)}</div>`);
            }
            parts.push('</div>');

            // Right column: header block (institute + dept) with border-bottom, then contact
            parts.push('<div class="lha2-right">');
            parts.push('<div class="lha2-header">');
            parts.push(`<div class="lha2-institute">${renderMd(fields.institute || 'Institution')}</div>`);
            if (fields.department) {
                parts.push(`<div class="lha2-department">${renderMd(fields.department)}</div>`);
            }
            parts.push('</div>');

            const contactItems = [];
            if (fields.address) contactItems.push(...splitPipe(fields.address).map(esc));
            if (fields.phone)   contactItems.push(esc(fields.phone));
            if (fields.email)   contactItems.push(esc(fields.email));
            if (fields.website) contactItems.push(esc(fields.website));
            if (contactItems.length) {
                parts.push('<div class="lha2-contact">');
                for (const item of contactItems) {
                    parts.push(`<div>${item}</div>`);
                }
                parts.push('</div>');
            }

            parts.push('</div>');
            parts.push('</div>');
            return parts.join('\n');
        },
    },

    // ── letter-inside-address ────────────────────────────────────────────────
    //
    // Formal letter inside address block — placed after the date, before the
    // salutation.  All fields are pipe-separated for multiline support.
    //
    // Fields:
    //   to           (required) — recipient's full name (use 'to' to avoid collision with element 'name' key)
    //   title        (optional) — recipient's title / position; pipe-separated for multiple lines
    //   organization (optional) — organization / company name; pipe-separated
    //   address      (optional) — pipe-separated address lines
    //   align        (optional) — "left" (default) | "right"
    'letter-inside-address': {
        css: `
.mdpdf-el-letter-inside-address {
    font-family: inherit;
    font-size: 0.97em;
    line-height: 1.7;
    margin: 1.2em 0;
}
.mdpdf-el-letter-inside-address.lia-align-right {
    text-align: right;
}
.mdpdf-el-letter-inside-address .lia-name {
    font-weight: 600;
}
.mdpdf-el-letter-inside-address .lia-line {
    display: block;
}`.trim(),

        render(fields) {
            const alignClass = String(fields.align || '').trim() === 'right'
                ? ' lia-align-right'
                : '';
            const parts = [];
            parts.push(`<div class="mdpdf-el-letter-inside-address${alignClass}">`);
            parts.push(`<span class="lia-name lia-line">${esc(fields.to || '')}</span>`);
            if (fields.title) {
                for (const line of splitPipe(fields.title)) {
                    parts.push(`<span class="lia-line">${esc(line)}</span>`);
                }
            }
            if (fields.organization) {
                for (const line of splitPipe(fields.organization)) {
                    parts.push(`<span class="lia-line">${esc(line)}</span>`);
                }
            }
            if (fields.address) {
                for (const line of splitPipe(fields.address)) {
                    parts.push(`<span class="lia-line">${esc(line)}</span>`);
                }
            }
            parts.push('</div>');
            return parts.join('\n');
        },
    },

    // ── letter-signature ─────────────────────────────────────────────────────
    //
    // Formal letter signature block — placed at the end of the letter body.
    //
    // Fields:
    //   closing         (optional) — closing phrase, default "Sincerely"; supports inline markdown
    //   margin_left     (optional) — CSS left margin for the block, default "40%"
    //   signature_space (optional) — CSS height for handwritten sig area, default "1in"
    //                                (ignored when signature_image is provided)
    //   signature_image (optional) — signature image using `![]()` syntax; replaces blank sig space
    //   from            (required) — signer's full name; supports inline markdown
    //   title           (optional) — pipe-separated title / position lines; supports inline markdown
    //   organization    (optional) — pipe-separated organization lines; supports inline markdown
    'letter-signature': {
        css: `
.mdpdf-el-letter-signature {
    font-family: inherit;
    font-size: 0.97em;
    line-height: 1.7;
    margin: 1.8em 0 1em;
}
.mdpdf-el-letter-signature .lsig-closing {
    display: block;
    margin-bottom: 0;
}
.mdpdf-el-letter-signature .lsig-space {
    display: block;
}
.mdpdf-el-letter-signature .lsig-image {
    display: block;
    margin: 0.25em 0;
}
.mdpdf-el-letter-signature .lsig-image img {
    max-height: 0.6in;
    width: auto;
    display: block;
}
.mdpdf-el-letter-signature .lsig-name {
    font-weight: 600;
    display: block;
}
.mdpdf-el-letter-signature .lsig-line {
    display: block;
}`.trim(),

        render(fields) {
            const closing = renderMd(fields.closing || 'Sincerely');
            const marginLeft = cssLength(fields.margin_left, '40%');
            const parts = [];
            parts.push(`<div class="mdpdf-el-letter-signature" style="margin-left:${marginLeft}">`);
            parts.push(`<span class="lsig-closing">${closing},</span>`);
            if (fields.signature_image) {
                parts.push(`<div class="lsig-image">${renderMd(fields.signature_image)}</div>`);
            } else {
                const space = cssLength(fields.signature_space, '1in');
                parts.push(`<span class="lsig-space" style="height:${space}">&nbsp;</span>`);
            }
            parts.push(`<span class="lsig-name">${renderMd(fields.from || '')}</span>`);
            if (fields.title) {
                for (const line of splitPipe(fields.title)) {
                    parts.push(`<span class="lsig-line">${renderMd(line)}</span>`);
                }
            }
            if (fields.organization) {
                for (const line of splitPipe(fields.organization)) {
                    parts.push(`<span class="lsig-line">${renderMd(line)}</span>`);
                }
            }
            parts.push('</div>');
            return parts.join('\n');
        },
    },

    // ── toc ──────────────────────────────────────────────────────────────────
    //
    // Table of contents element for thesis / book type documents.
    // Generates a TOC from the document headings (h1–h6) with page numbers.
    // Page numbers are filled in by runtime JS after paged.js renders.
    //
    // Fields:
    //   title      (optional) — TOC title, default "Table of Contents"
    //   max_level  (optional) — deepest heading level to include (1–6), default 3
    //   placement  (optional) — "pre-body": page break after, hides header/footer,
    //                           page numbers of body pages start at 1 (skipping this TOC)
    //
    // This element uses renderWithContext(block, ctx) to access the heading list
    // extracted from the full document HTML.
    'toc': {
        css: `
.mdpdf-el-toc {
    font-family: inherit;
    margin: 1.5em 0;
}
.mdpdf-el-toc .toc-title {
    font-size: 1.15em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 1em;
    padding-bottom: 0.35em;
    border-bottom: 1.5px solid currentColor;
}
.mdpdf-el-toc ol.toc-list {
    list-style: none;
    margin: 0;
    padding: 0;
}
.mdpdf-el-toc .toc-item {
    display: flex;
    align-items: baseline;
    line-height: 1.7;
}
.mdpdf-el-toc .toc-item-l1 { padding-left: 0;    font-weight: 600; }
.mdpdf-el-toc .toc-item-l2 { padding-left: 1.2em; font-size: 0.95em; }
.mdpdf-el-toc .toc-item-l3 { padding-left: 2.4em; font-size: 0.90em; opacity: 0.85; }
.mdpdf-el-toc .toc-item-l4 { padding-left: 3.6em; font-size: 0.85em; opacity: 0.75; }
.mdpdf-el-toc .toc-item-l5 { padding-left: 4.8em; font-size: 0.82em; opacity: 0.70; }
.mdpdf-el-toc .toc-item-l6 { padding-left: 6.0em; font-size: 0.80em; opacity: 0.65; }
.mdpdf-el-toc .toc-link {
    display: contents;
    color: inherit;
    text-decoration: none;
}
.mdpdf-el-toc .toc-text {
    flex: 1;
}
.mdpdf-el-toc .toc-dots {
    flex: 1;
    border-bottom: 1px dotted currentColor;
    opacity: 0.4;
    margin: 0 0.4em;
    align-self: flex-end;
    margin-bottom: 0.3em;
}
.mdpdf-el-toc .toc-page {
    min-width: 2em;
    text-align: right;
    font-variant-numeric: tabular-nums;
}`.trim(),

        renderWithContext(block, ctx) {
            const title = String(block.title || 'Table of Contents');
            const maxLevel = Math.min(6, Math.max(1, parseInt(block.max_level || '3', 10)));
            const headings = (ctx.headings || []).filter((h) => h.level <= maxLevel);
            const isPreBody = String(block.placement || '').trim() === 'pre-body';

            const parts = [];
            parts.push('<div class="mdpdf-el-toc">');
            if (title) parts.push(`<div class="toc-title">${esc(title)}</div>`);
            parts.push('<ol class="toc-list">');
            for (const h of headings) {
                const id = h.id;
                parts.push(
                    `<li class="toc-item toc-item-l${h.level}">` +
                    `<a class="toc-link" href="#${id}">` +
                    `<span class="toc-text">${esc(h.text)}</span>` +
                    `</a>` +
                    `<span class="toc-dots"></span>` +
                    `<span class="toc-page" data-mdpdf-toc-target="${id}"></span>` +
                    `</li>`
                );
            }
            parts.push('</ol>');
            parts.push('</div>');
            const inner = parts.join('\n');
            if (isPreBody) {
                return `<div class="mdpdf-pre-body">${inner}</div>`;
            }
            return inner;
        },

        // Fallback render when context is unavailable (produces an empty TOC placeholder)
        render(block) {
            const title = String(block.title || 'Table of Contents');
            return `<div class="mdpdf-el-toc"><div class="toc-title">${esc(title)}</div><ol class="toc-list"></ol></div>`;
        },
    },

    // ── timestamp ────────────────────────────────────────────────────────────
    //
    // Right-aligned "last updated" timestamp block.
    //
    // Fields:
    //   label  (optional) — defaults to "Last updated"
    //   date   (optional) — date string, or "auto" / omitted for today's date
    'timestamp': {
        css: `
.mdpdf-el-timestamp {
    text-align: right;
    font-size: 0.82em;
    line-height: 1.45;
    opacity: 0.55;
    margin: 0.5em 0;
    font-family: inherit;
}
.mdpdf-el-timestamp .ts-label {
    display: block;
    font-style: italic;
}
.mdpdf-el-timestamp .ts-date {
    display: block;
    font-weight: 600;
}`.trim(),

        render(fields) {
            const label = esc(fields.label || 'Last updated');
            const raw = String(fields.date || '').trim();
            const dateStr = (!raw || raw === 'auto') ? formatDate(new Date()) : esc(raw);
            return [
                '<div class="mdpdf-el-timestamp">',
                `<span class="ts-label">${label}</span>`,
                `<span class="ts-date">${dateStr}</span>`,
                '</div>',
            ].join('\n');
        },
    },
    // ── cv-header ─────────────────────────────────────────────────────────────
    //
    // Structured CV / résumé header block.
    // Renders a professional name + title + contact row, with an optional photo.
    // Works with all cv-* templates but is purely optional — a plain `# Name`
    // paragraph with contact info below is sufficient for cv-linear / cv-block-grid.
    //
    // Fields:
    //   full_name (required) — full name; inline markdown (e.g. **Jane Smith**)
    //   title     (optional) — professional title / tagline; inline markdown
    //   contacts  (optional) — pipe-separated contact items (email | phone | website)
    //   photo     (optional) — photo using `![]()` syntax; rendered as a circular image
    //   summary   (optional) — brief 1-2 sentence summary; block markdown
    //   border    (optional) — "false" to suppress the bottom rule; default true
    'cv-header': {
        css: `
.mdpdf-el-cvhdr {
    margin-bottom: 1em;
    break-inside: avoid;
    page-break-inside: avoid;
}
.mdpdf-el-cvhdr .cvhdr-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.5em;
}
.mdpdf-el-cvhdr .cvhdr-main {
    flex: 1;
    min-width: 0;
}
.mdpdf-el-cvhdr .cvhdr-name {
    font-size: 2em;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.05;
    margin-bottom: 0.1em;
}
.mdpdf-el-cvhdr .cvhdr-title {
    font-size: 0.9em;
    opacity: 0.68;
    margin-bottom: 0.45em;
    font-style: italic;
}
.mdpdf-el-cvhdr .cvhdr-contacts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.15em 0.75em;
    font-size: 0.78em;
    color: var(--mdpdf-decoration-color);
}
.mdpdf-el-cvhdr .cvhdr-contact-item {
    white-space: nowrap;
}
.mdpdf-el-cvhdr .cvhdr-photo {
    flex-shrink: 0;
}
.mdpdf-el-cvhdr .cvhdr-photo img {
    width: 75px;
    height: 75px;
    object-fit: cover;
    border-radius: 50%;
    display: block;
    margin: 0;
}
.mdpdf-el-cvhdr .cvhdr-divider {
    border: none;
    border-top: 2px solid var(--mdpdf-decoration-color);
    margin: 0.55em 0 0.5em;
    opacity: 0.45;
}
.mdpdf-el-cvhdr.cvhdr-no-border .cvhdr-divider {
    display: none;
}
.mdpdf-el-cvhdr .cvhdr-summary {
    font-size: 0.85em;
    font-style: italic;
    line-height: 1.55;
    opacity: 0.78;
    margin-top: 0.4em;
}
.mdpdf-el-cvhdr .cvhdr-summary p {
    margin: 0;
}`.trim(),

        render(fields) {
            const showBorder = String(fields.border ?? 'true').trim() !== 'false';
            const borderClass = showBorder ? '' : ' cvhdr-no-border';
            const parts = [];
            parts.push(`<div class="mdpdf-el-cvhdr${borderClass}">`);

            // ── Top row: main info + optional photo ────────────────────────
            parts.push('<div class="cvhdr-top">');
            parts.push('<div class="cvhdr-main">');
            parts.push(`<div class="cvhdr-name">${renderMd(fields.full_name || fields.name || 'Your Name')}</div>`);
            if (fields.title) {
                parts.push(`<div class="cvhdr-title">${renderMd(fields.title)}</div>`);
            }
            if (fields.contacts) {
                parts.push('<div class="cvhdr-contacts">');
                for (const item of splitPipe(fields.contacts)) {
                    parts.push(`<span class="cvhdr-contact-item">${esc(item)}</span>`);
                }
                parts.push('</div>');
            }
            parts.push('</div>'); // .cvhdr-main

            if (fields.photo) {
                parts.push(`<div class="cvhdr-photo">${renderMd(fields.photo)}</div>`);
            }
            parts.push('</div>'); // .cvhdr-top

            // ── Divider ────────────────────────────────────────────────────
            parts.push('<hr class="cvhdr-divider">');

            // ── Optional summary ───────────────────────────────────────────
            if (fields.summary) {
                parts.push(`<div class="cvhdr-summary">${renderBlock(fields.summary)}</div>`);
            }

            parts.push('</div>'); // .mdpdf-el-cvhdr
            return parts.join('\n');
        },
    },

    // ── cv-header-centered ────────────────────────────────────────────────────
    //
    // Symmetric, center-aligned CV header.
    // Suitable for creative, design, or academic CVs where a balanced,
    // formal look is preferred. Photo appears above the name when provided.
    //
    // Fields:
    //   full_name (required) — full name; inline markdown
    //   title     (optional) — professional title / tagline; inline markdown
    //   contacts  (optional) — pipe-separated contact items; shown inline with dot separators
    //   photo     (optional) — photo using `![]()` syntax; circular image above name
    //   summary   (optional) — brief summary; block markdown, centered
    //   border    (optional) — "false" to suppress the bottom rule; default true
    'cv-header-centered': {
        css: `
.mdpdf-el-cvhdr-centered {
    margin-bottom: 1em;
    text-align: center;
    break-inside: avoid;
    page-break-inside: avoid;
}
.mdpdf-el-cvhdr-centered .cvhdr-photo {
    display: flex;
    justify-content: center;
    margin-bottom: 0.5em;
}
.mdpdf-el-cvhdr-centered .cvhdr-photo img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 50%;
    border: 2.5px solid var(--mdpdf-decoration-color);
    display: block;
}
.mdpdf-el-cvhdr-centered .cvhdr-name {
    font-size: 2em;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.05;
    margin-bottom: 0.12em;
}
.mdpdf-el-cvhdr-centered .cvhdr-title {
    font-size: 0.88em;
    font-style: italic;
    opacity: 0.65;
    margin-bottom: 0.45em;
}
.mdpdf-el-cvhdr-centered .cvhdr-contacts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0 0em;
    font-size: 0.78em;
    color: var(--mdpdf-decoration-color);
    margin-bottom: 0.1em;
}
.mdpdf-el-cvhdr-centered .cvhdr-contact-item + .cvhdr-contact-item::before {
    content: "·";
    margin: 0 0.5em;
    opacity: 0.5;
    color: currentColor;
}
.mdpdf-el-cvhdr-centered .cvhdr-divider {
    border: none;
    border-top: 1.5px solid var(--mdpdf-decoration-color);
    margin: 0.55em auto 0.5em;
    width: 55%;
    opacity: 0.45;
}
.mdpdf-el-cvhdr-centered.cvhdr-no-border .cvhdr-divider {
    display: none;
}
.mdpdf-el-cvhdr-centered .cvhdr-summary {
    font-size: 0.84em;
    line-height: 1.55;
    font-style: italic;
    opacity: 0.75;
    margin-top: 0.4em;
}
.mdpdf-el-cvhdr-centered .cvhdr-summary p {
    margin: 0;
}`.trim(),

        render(fields) {
            const showBorder = String(fields.border ?? 'true').trim() !== 'false';
            const borderClass = showBorder ? '' : ' cvhdr-no-border';
            const parts = [];
            parts.push(`<div class="mdpdf-el-cvhdr-centered${borderClass}">`);

            if (fields.photo) {
                parts.push(`<div class="cvhdr-photo">${renderMd(fields.photo)}</div>`);
            }
            parts.push(`<div class="cvhdr-name">${renderMd(fields.full_name || fields.name || 'Your Name')}</div>`);
            if (fields.title) {
                parts.push(`<div class="cvhdr-title">${renderMd(fields.title)}</div>`);
            }
            if (fields.contacts) {
                parts.push('<div class="cvhdr-contacts">');
                for (const item of splitPipe(fields.contacts)) {
                    parts.push(`<span class="cvhdr-contact-item">${esc(item)}</span>`);
                }
                parts.push('</div>');
            }
            parts.push('<hr class="cvhdr-divider">');
            if (fields.summary) {
                parts.push(`<div class="cvhdr-summary">${renderBlock(fields.summary)}</div>`);
            }

            parts.push('</div>');
            return parts.join('\n');
        },
    },

    // ── cv-header-split ───────────────────────────────────────────────────────
    //
    // Two-column header: name + title on the left, contacts stacked on the right.
    // Photo sits above the contacts column when provided.
    // Suits traditional, formal CVs where contact information is clearly separated.
    //
    // Fields:
    //   full_name (required) — full name; inline markdown
    //   title     (optional) — professional title / tagline; inline markdown
    //   contacts  (optional) — pipe-separated contact items; each on its own line, right-aligned
    //   photo     (optional) — photo using `![]()` syntax; circular image, right column
    //   summary   (optional) — brief summary below the divider; block markdown
    //   border    (optional) — "false" to suppress the bottom rule; default true
    'cv-header-split': {
        css: `
.mdpdf-el-cvhdr-split {
    margin-bottom: 1em;
    break-inside: avoid;
    page-break-inside: avoid;
}
.mdpdf-el-cvhdr-split .cvhdr-top {
    display: flex;
    align-items: flex-start;
    gap: 1.5em;
}
.mdpdf-el-cvhdr-split .cvhdr-main {
    flex: 1;
    min-width: 0;
}
.mdpdf-el-cvhdr-split .cvhdr-name {
    font-size: 2em;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.05;
    margin-bottom: 0.1em;
}
.mdpdf-el-cvhdr-split .cvhdr-title {
    font-size: 0.88em;
    font-style: italic;
    opacity: 0.65;
}
.mdpdf-el-cvhdr-split .cvhdr-right {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.3em;
    padding-top: 0.2em;
}
.mdpdf-el-cvhdr-split .cvhdr-photo img {
    width: 70px;
    height: 70px;
    object-fit: cover;
    border-radius: 50%;
    display: block;
    border: 2px solid var(--mdpdf-decoration-color);
}
.mdpdf-el-cvhdr-split .cvhdr-contacts {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.18em;
    font-size: 0.78em;
    color: var(--mdpdf-decoration-color);
}
.mdpdf-el-cvhdr-split .cvhdr-divider {
    border: none;
    border-top: 2px solid var(--mdpdf-decoration-color);
    margin: 0.55em 0 0.5em;
    opacity: 0.4;
}
.mdpdf-el-cvhdr-split.cvhdr-no-border .cvhdr-divider {
    display: none;
}
.mdpdf-el-cvhdr-split .cvhdr-summary {
    font-size: 0.85em;
    font-style: italic;
    line-height: 1.55;
    opacity: 0.78;
    margin-top: 0.4em;
}
.mdpdf-el-cvhdr-split .cvhdr-summary p {
    margin: 0;
}`.trim(),

        render(fields) {
            const showBorder = String(fields.border ?? 'true').trim() !== 'false';
            const borderClass = showBorder ? '' : ' cvhdr-no-border';
            const parts = [];
            parts.push(`<div class="mdpdf-el-cvhdr-split${borderClass}">`);

            // ── Top row ────────────────────────────────────────────────────
            parts.push('<div class="cvhdr-top">');

            // Left: name + title
            parts.push('<div class="cvhdr-main">');
            parts.push(`<div class="cvhdr-name">${renderMd(fields.full_name || fields.name || 'Your Name')}</div>`);
            if (fields.title) {
                parts.push(`<div class="cvhdr-title">${renderMd(fields.title)}</div>`);
            }
            parts.push('</div>'); // .cvhdr-main

            // Right: optional photo + contacts
            if (fields.photo || fields.contacts) {
                parts.push('<div class="cvhdr-right">');
                if (fields.photo) {
                    parts.push(`<div class="cvhdr-photo">${renderMd(fields.photo)}</div>`);
                }
                if (fields.contacts) {
                    parts.push('<div class="cvhdr-contacts">');
                    for (const item of splitPipe(fields.contacts)) {
                        parts.push(`<span class="cvhdr-contact-item">${esc(item)}</span>`);
                    }
                    parts.push('</div>');
                }
                parts.push('</div>'); // .cvhdr-right
            }

            parts.push('</div>'); // .cvhdr-top

            // ── Divider ────────────────────────────────────────────────────
            parts.push('<hr class="cvhdr-divider">');

            // ── Optional summary ───────────────────────────────────────────
            if (fields.summary) {
                parts.push(`<div class="cvhdr-summary">${renderBlock(fields.summary)}</div>`);
            }

            parts.push('</div>');
            return parts.join('\n');
        },
    },

    // ── cv-header-compact ─────────────────────────────────────────────────────
    //
    // Ultra-compact single-row header for space-efficient one-page CVs.
    // Name and title sit on one baseline-aligned row; contacts flow on the line
    // below as a tight pill-separated list. Summary (if any) appears after the rule.
    // No photo field — use cv-header or cv-header-split when a photo is needed.
    //
    // Fields:
    //   full_name (required) — full name; inline markdown
    //   title     (optional) — professional title; placed inline after a · separator
    //   contacts  (optional) — pipe-separated contact items; shown in a single row
    //   summary   (optional) — brief summary below the divider; block markdown
    //   border    (optional) — "false" to suppress the bottom rule; default true
    'cv-header-compact': {
        css: `
.mdpdf-el-cvhdr-compact {
    margin-bottom: 0.8em;
    break-inside: avoid;
    page-break-inside: avoid;
}
.mdpdf-el-cvhdr-compact .cvhdr-top {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0 0.55em;
}
.mdpdf-el-cvhdr-compact .cvhdr-name {
    font-size: 1.65em;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.1;
}
.mdpdf-el-cvhdr-compact .cvhdr-sep {
    font-size: 1.1em;
    opacity: 0.28;
    font-weight: 300;
    line-height: 1;
}
.mdpdf-el-cvhdr-compact .cvhdr-title {
    font-size: 0.88em;
    font-style: italic;
    opacity: 0.62;
    line-height: 1.1;
}
.mdpdf-el-cvhdr-compact .cvhdr-contacts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.1em 0.7em;
    font-size: 0.78em;
    color: var(--mdpdf-decoration-color);
    margin-top: 0.18em;
}
.mdpdf-el-cvhdr-compact .cvhdr-contact-item {
    white-space: nowrap;
}
.mdpdf-el-cvhdr-compact .cvhdr-divider {
    border: none;
    border-top: 1.5px solid var(--mdpdf-decoration-color);
    margin: 0.42em 0 0.38em;
    opacity: 0.4;
}
.mdpdf-el-cvhdr-compact.cvhdr-no-border .cvhdr-divider {
    display: none;
}
.mdpdf-el-cvhdr-compact .cvhdr-summary {
    font-size: 0.84em;
    font-style: italic;
    line-height: 1.55;
    opacity: 0.78;
    margin-top: 0.3em;
}
.mdpdf-el-cvhdr-compact .cvhdr-summary p {
    margin: 0;
}`.trim(),

        render(fields) {
            const showBorder = String(fields.border ?? 'true').trim() !== 'false';
            const borderClass = showBorder ? '' : ' cvhdr-no-border';
            const parts = [];
            parts.push(`<div class="mdpdf-el-cvhdr-compact${borderClass}">`);

            // ── Name · title row ───────────────────────────────────────────
            parts.push('<div class="cvhdr-top">');
            parts.push(`<span class="cvhdr-name">${renderMd(fields.full_name || fields.name || 'Your Name')}</span>`);
            if (fields.title) {
                parts.push('<span class="cvhdr-sep">·</span>');
                parts.push(`<span class="cvhdr-title">${renderMd(fields.title)}</span>`);
            }
            parts.push('</div>');

            // ── Contacts row ───────────────────────────────────────────────
            if (fields.contacts) {
                parts.push('<div class="cvhdr-contacts">');
                for (const item of splitPipe(fields.contacts)) {
                    parts.push(`<span class="cvhdr-contact-item">${esc(item)}</span>`);
                }
                parts.push('</div>');
            }

            // ── Divider ────────────────────────────────────────────────────
            parts.push('<hr class="cvhdr-divider">');

            // ── Optional summary ───────────────────────────────────────────
            if (fields.summary) {
                parts.push(`<div class="cvhdr-summary">${renderBlock(fields.summary)}</div>`);
            }

            parts.push('</div>');
            return parts.join('\n');
        },
    },

    // ── cv-header-banner ──────────────────────────────────────────────────────
    //
    // Bold banner-style header: name displayed on a full-width colored strip,
    // with title and contacts below the band. Makes a strong first impression;
    // suited for modern, design-forward, or industry CVs.
    //
    // Fields:
    //   full_name (required) — full name; inline markdown; rendered in white on the band
    //   title     (optional) — professional title; appears below the band, left-aligned
    //   contacts  (optional) — pipe-separated contact items; right-aligned below the band
    //   photo     (optional) — photo using `![]()` syntax; circular image inset in the band
    //   summary   (optional) — brief summary below the divider; block markdown
    //   border    (optional) — "false" to suppress the thin rule below title/contacts; default true
    'cv-header-banner': {
        css: `
.mdpdf-el-cvhdr-banner {
    margin-bottom: 1em;
    break-inside: avoid;
    page-break-inside: avoid;
}
.mdpdf-el-cvhdr-banner .cvhdr-name-band {
    background: var(--mdpdf-decoration-color);
    color: #fff;
    padding: 0.5em 0.75em 0.45em;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1em;
    border-radius: 2px;
}
.mdpdf-el-cvhdr-banner .cvhdr-name {
    font-size: 1.85em;
    font-weight: 800;
    letter-spacing: -0.01em;
    line-height: 1.1;
    color: #fff;
}
.mdpdf-el-cvhdr-banner .cvhdr-photo {
    flex-shrink: 0;
}
.mdpdf-el-cvhdr-banner .cvhdr-photo img {
    width: 62px;
    height: 62px;
    object-fit: cover;
    border-radius: 50%;
    display: block;
    border: 2px solid rgba(255, 255, 255, 0.7);
}
.mdpdf-el-cvhdr-banner .cvhdr-below {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.15em 0.6em;
    margin-top: 0.45em;
}
.mdpdf-el-cvhdr-banner .cvhdr-title {
    font-size: 0.88em;
    font-style: italic;
    opacity: 0.68;
    flex: 1;
    min-width: 0;
}
.mdpdf-el-cvhdr-banner .cvhdr-contacts {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.1em 0.7em;
    font-size: 0.78em;
    color: var(--mdpdf-decoration-color);
}
.mdpdf-el-cvhdr-banner .cvhdr-contact-item {
    white-space: nowrap;
}
.mdpdf-el-cvhdr-banner .cvhdr-divider {
    border: none;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    margin: 0.5em 0 0.45em;
}
.mdpdf-el-cvhdr-banner.cvhdr-no-border .cvhdr-divider {
    display: none;
}
.mdpdf-el-cvhdr-banner .cvhdr-summary {
    font-size: 0.85em;
    font-style: italic;
    line-height: 1.55;
    opacity: 0.78;
    margin-top: 0.3em;
}
.mdpdf-el-cvhdr-banner .cvhdr-summary p {
    margin: 0;
}`.trim(),

        render(fields) {
            const showBorder = String(fields.border ?? 'true').trim() !== 'false';
            const borderClass = showBorder ? '' : ' cvhdr-no-border';
            const parts = [];
            parts.push(`<div class="mdpdf-el-cvhdr-banner${borderClass}">`);

            // ── Colored name band ──────────────────────────────────────────
            parts.push('<div class="cvhdr-name-band">');
            parts.push(`<div class="cvhdr-name">${renderMd(fields.full_name || fields.name || 'Your Name')}</div>`);
            if (fields.photo) {
                parts.push(`<div class="cvhdr-photo">${renderMd(fields.photo)}</div>`);
            }
            parts.push('</div>'); // .cvhdr-name-band

            // ── Title + contacts row below band ────────────────────────────
            if (fields.title || fields.contacts) {
                parts.push('<div class="cvhdr-below">');
                if (fields.title) {
                    parts.push(`<div class="cvhdr-title">${renderMd(fields.title)}</div>`);
                }
                if (fields.contacts) {
                    parts.push('<div class="cvhdr-contacts">');
                    for (const item of splitPipe(fields.contacts)) {
                        parts.push(`<span class="cvhdr-contact-item">${esc(item)}</span>`);
                    }
                    parts.push('</div>');
                }
                parts.push('</div>'); // .cvhdr-below
            }

            // ── Divider ────────────────────────────────────────────────────
            parts.push('<hr class="cvhdr-divider">');

            // ── Optional summary ───────────────────────────────────────────
            if (fields.summary) {
                parts.push(`<div class="cvhdr-summary">${renderBlock(fields.summary)}</div>`);
            }

            parts.push('</div>');
            return parts.join('\n');
        },
    },

    // ── cv-sidebar-layout ─────────────────────────────────────────────────────
    //
    // Sidebar content block for the cv-sidebar template.
    // paged.js extracts it from the normal flow (via position:running declared
    // in the template's customCss) and repeats it inside the @left-top margin
    // box on every page. Place this element at the very top of the document.
    //
    // Fields:
    //   full_name (optional) — person's full name; displayed prominently at the
    //                          top of the sidebar in large, decorated type.
    //   photo     (optional) — photo using `![]()` syntax; circular image.
    //   sidebar   (required) — multiline markdown for the rest of the sidebar.
    //                          Use **bold** lines as category labels, plain lines
    //                          as values.
    'cv-sidebar-layout': {
        css: `
/* Visual styles for the sidebar content that paged.js will place in the
   @left-top margin box. Layout/positioning is handled by the template's
   customCss (which lands in <head> and is parsed by paged.js directly). */
.mdpdf-el-cvsl {
    font-size: 0.82em;
    line-height: 1.5;
    font-family: inherit;
    color: inherit;
    display: block;
}
/* ── Name block ── */
.mdpdf-el-cvsl .cvsl-name {
    font-size: 2.5em;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.01em;
    color: var(--mdpdf-decoration-color);
    margin-bottom: 0.5em;
    padding-bottom: 0.4em;
    border-bottom: 2px solid var(--mdpdf-decoration-color);
    word-break: break-word;
}
.mdpdf-el-cvsl .cvsl-photo {
    margin-bottom: 0.8em;
    text-align: center;
}
.mdpdf-el-cvsl .cvsl-photo img {
    width: 90px;
    height: 90px;
    object-fit: cover;
    border-radius: 50%;
    display: inline-block;
    margin: 0 auto;
}
.mdpdf-el-cvsl .cvsl-body p {
    margin: 0.1em 0 0.35em;
}
.mdpdf-el-cvsl .cvsl-body ul {
    margin: 0.1em 0 0.4em;
    padding-left: 1.2em;
}
.mdpdf-el-cvsl .cvsl-body li {
    margin-bottom: 0.05em;
}
.mdpdf-el-cvsl .cvsl-body strong {
    display: block;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 0.72em;
    letter-spacing: 0.1em;
    color: var(--mdpdf-decoration-color);
    margin-top: 0.9em;
    margin-bottom: 0.1em;
}
.mdpdf-el-cvsl .cvsl-body strong:first-child {
    margin-top: 0;
}
.mdpdf-el-cvsl .cvsl-body hr {
    border: none;
    border-top: 1px solid rgba(0, 0, 0, 0.12);
    margin: 0.6em 0;
}`.trim(),

        render(fields) {
            const parts = [];
            parts.push('<div class="mdpdf-el-cvsl">');

            if (fields.full_name) {
                parts.push(`<div class="cvsl-name">${renderMd(fields.full_name)}</div>`);
            }
            if (fields.photo) {
                parts.push(`<div class="cvsl-photo">${renderMd(fields.photo)}</div>`);
            }

            const sidebarMd = String(fields.sidebar || '').trim();
            if (sidebarMd) {
                parts.push(`<div class="cvsl-body">${renderBlock(sidebarMd)}</div>`);
            }

            parts.push('</div>');
            return parts.join('\n');
        },
    },

    // ── exam-title-page ───────────────────────────────────────────────────────
    //
    // Full-page exam / quiz cover sheet. Use placement: pre-body to place it on
    // its own page before the exam body starts.
    //
    // Fields:
    //   title         (required) — exam title; inline markdown
    //   course        (optional) — course name/code; inline markdown
    //   instructor    (optional) — instructor name; plain text
    //   date          (optional) — exam date; plain text
    //   duration      (optional) — e.g. "90 minutes"; plain text
    //   total_points  (optional) — e.g. "100 points"; plain text
    //   student_info  (optional) — pipe-separated list of fill-in labels;
    //                              default "Name | Student ID"
    //   instructions  (optional) — multiline block markdown shown below info rows
    //   placement     (optional) — "pre-body" for a standalone cover page
    'exam-title-page': {
        css: `
.mdpdf-el-exam-title-page {
    font-family: inherit;
}
.mdpdf-el-exam-title-page .etp-name-band {
    border-bottom: 2.5px solid var(--mdpdf-decoration-color);
    padding-bottom: 0.55em;
    margin-bottom: 0.75em;
}
.mdpdf-el-exam-title-page .etp-title {
    font-size: 1.55em;
    font-weight: 800;
    letter-spacing: -0.01em;
    line-height: 1.2;
    margin-bottom: 0.1em;
}
.mdpdf-el-exam-title-page .etp-course {
    font-size: 0.96em;
    font-weight: 600;
    margin-bottom: 0.05em;
}
.mdpdf-el-exam-title-page .etp-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0 2em;
    font-size: 0.82em;
    opacity: 0.68;
    margin-top: 0.35em;
}
.mdpdf-el-exam-title-page .etp-student-info {
    display: grid;
    gap: 0.7em 0;
    margin-top: 0.8em;
}
.mdpdf-el-exam-title-page .etp-student-row {
    display: flex;
    align-items: flex-end;
    gap: 0.5em;
    font-size: 0.88em;
}
.mdpdf-el-exam-title-page .etp-student-label {
    white-space: nowrap;
    flex-shrink: 0;
}
.mdpdf-el-exam-title-page .etp-student-line {
    flex: 1;
    border-bottom: 1px solid #000;
    height: 1.4em;
}
.mdpdf-el-exam-title-page .etp-instructions {
    margin-top: 1.2em;
    padding-top: 0.8em;
    border-top: 1px solid rgba(0,0,0,0.12);
    font-size: 0.88em;
    line-height: 1.65;
}
.mdpdf-el-exam-title-page .etp-instructions > p:first-child { margin-top: 0; }
.mdpdf-el-exam-title-page .etp-instructions > p:last-child { margin-bottom: 0; }
.mdpdf-el-exam-title-page .etp-instructions ol,
.mdpdf-el-exam-title-page .etp-instructions ul { padding-left: 1.4em; }`.trim(),

        render(fields) {
            const parts = [];
            parts.push('<div class="mdpdf-el-exam-title-page">');

            // ── Title band ─────────────────────────────────────────────────
            parts.push('<div class="etp-name-band">');
            parts.push(`<div class="etp-title">${renderMd(fields.title || 'Exam')}</div>`);
            if (fields.course) {
                parts.push(`<div class="etp-course">${renderMd(fields.course)}</div>`);
            }
            const meta = [];
            if (fields.instructor) meta.push(`<span>Instructor: ${esc(fields.instructor)}</span>`);
            if (fields.date)       meta.push(`<span>Date: ${esc(fields.date)}</span>`);
            if (fields.duration)   meta.push(`<span>Time: ${esc(fields.duration)}</span>`);
            if (fields.total_points) meta.push(`<span>Total: ${esc(fields.total_points)}</span>`);
            if (meta.length) {
                parts.push(`<div class="etp-meta">${meta.join('')}</div>`);
            }
            parts.push('</div>'); // .etp-name-band

            // ── Student info fill-in rows ───────────────────────────────────
            const labels = splitPipe(fields.student_info || 'Name | Student ID');
            parts.push('<div class="etp-student-info">');
            for (const label of labels) {
                parts.push('<div class="etp-student-row">');
                parts.push(`<span class="etp-student-label">${esc(label)}:</span>`);
                parts.push('<span class="etp-student-line"></span>');
                parts.push('</div>');
            }
            parts.push('</div>'); // .etp-student-info

            // ── Instructions ───────────────────────────────────────────────
            if (fields.instructions) {
                parts.push(`<div class="etp-instructions">${renderBlock(fields.instructions)}</div>`);
            }

            parts.push('</div>'); // .mdpdf-el-exam-title-page
            const inner = parts.join('\n');
            if (String(fields.placement || '').trim() === 'pre-body') {
                return `<div class="mdpdf-pre-body">${inner}</div>`;
            }
            return inner;
        },
    },

    // ── exam-title-section ────────────────────────────────────────────────────
    //
    // Compact exam header placed at the top of the first page; body content
    // flows directly below it on the same page. No page break is forced.
    // Use this instead of exam-title-page when the exam is short enough to
    // start questions immediately.
    //
    // Fields: same as exam-title-page (placement field is ignored / not used)
    'exam-title-section': {
        css: `
.mdpdf-el-exam-title-section {
    margin-bottom: 1.2em;
    break-inside: avoid;
    page-break-inside: avoid;
    font-family: inherit;
}
.mdpdf-el-exam-title-section .ets-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.5em;
    border-bottom: 2px solid var(--mdpdf-decoration-color);
    padding-bottom: 0.5em;
    margin-bottom: 0.6em;
}
.mdpdf-el-exam-title-section .ets-main { flex: 1; min-width: 0; }
.mdpdf-el-exam-title-section .ets-title {
    font-size: 1.3em;
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: 0.08em;
}
.mdpdf-el-exam-title-section .ets-course {
    font-size: 0.9em;
    font-weight: 600;
    margin-bottom: 0.05em;
}
.mdpdf-el-exam-title-section .ets-meta {
    font-size: 0.8em;
    opacity: 0.65;
    margin-top: 0.25em;
}
.mdpdf-el-exam-title-section .ets-meta span + span::before {
    content: " · ";
}
.mdpdf-el-exam-title-section .ets-student-info {
    display: flex;
    flex-direction: column;
    gap: 0.4em;
    align-items: flex-end;
    flex-shrink: 0;
    font-size: 0.82em;
    padding-top: 0.2em;
}
.mdpdf-el-exam-title-section .ets-student-row {
    display: flex;
    align-items: flex-end;
    gap: 0.4em;
}
.mdpdf-el-exam-title-section .ets-student-label { white-space: nowrap; }
.mdpdf-el-exam-title-section .ets-student-line {
    width: 6em;
    border-bottom: 1px solid #000;
    height: 1.2em;
}
.mdpdf-el-exam-title-section .ets-instructions {
    font-size: 0.86em;
    line-height: 1.65;
    margin-bottom: 0.4em;
}
.mdpdf-el-exam-title-section .ets-instructions > p:first-child { margin-top: 0; }
.mdpdf-el-exam-title-section .ets-instructions > p:last-child { margin-bottom: 0; }
.mdpdf-el-exam-title-section .ets-instructions ol,
.mdpdf-el-exam-title-section .ets-instructions ul { padding-left: 1.4em; }`.trim(),

        render(fields) {
            const parts = [];
            parts.push('<div class="mdpdf-el-exam-title-section">');
            parts.push('<div class="ets-header">');

            // Left: title + course + meta
            parts.push('<div class="ets-main">');
            parts.push(`<div class="ets-title">${renderMd(fields.title || 'Exam')}</div>`);
            if (fields.course) {
                parts.push(`<div class="ets-course">${renderMd(fields.course)}</div>`);
            }
            const metaSpans = [];
            if (fields.instructor)   metaSpans.push(`<span>Instructor: ${esc(fields.instructor)}</span>`);
            if (fields.date)         metaSpans.push(`<span>Date: ${esc(fields.date)}</span>`);
            if (fields.duration)     metaSpans.push(`<span>Time: ${esc(fields.duration)}</span>`);
            if (fields.total_points) metaSpans.push(`<span>Total: ${esc(fields.total_points)}</span>`);
            if (metaSpans.length) {
                parts.push(`<div class="ets-meta">${metaSpans.join('')}</div>`);
            }
            parts.push('</div>'); // .ets-main

            // Right: student info fill-in rows
            const labels = splitPipe(fields.student_info || 'Name | ID');
            parts.push('<div class="ets-student-info">');
            for (const label of labels) {
                parts.push('<div class="ets-student-row">');
                parts.push(`<span class="ets-student-label">${esc(label)}:</span>`);
                parts.push('<span class="ets-student-line"></span>');
                parts.push('</div>');
            }
            parts.push('</div>'); // .ets-student-info

            parts.push('</div>'); // .ets-header

            if (fields.instructions) {
                parts.push(`<div class="ets-instructions">${renderBlock(fields.instructions)}</div>`);
            }

            parts.push('</div>'); // .mdpdf-el-exam-title-section
            return parts.join('\n');
        },
    },

    // ── question-mc ───────────────────────────────────────────────────────────
    //
    // Multiple-choice question with compact one-line header.
    // The correct answer is always embedded in the data. When dynamic_choices
    // contains answer-key=show, a ✓ mark appears beside the correct option and
    // the option text is colored with the decoration color.
    //
    // Fields:
    //   n       (required) — question number; plain text (e.g. "1", "2a")
    //   pts     (optional) — point value; plain text (e.g. "5 pts")
    //   body    (required) — question stem; block markdown (KaTeX supported)
    //   options (required) — multiline list of options; each non-empty line is
    //                        one option. Start each line with a letter label:
    //                        "A. choice text" or "(A) choice text".
    //                        Options without a leading letter label are accepted
    //                        and lettered automatically.
    //   answer  (optional) — the correct option letter (case insensitive, e.g. "B");
    //                        shown as ✓ only when answer-key=show
    'question-mc': {
        css: `
.mdpdf-el-qmc {
    margin-bottom: 0.9em;
    break-inside: avoid;
    page-break-inside: avoid;
}
.mdpdf-el-qmc .qmc-header {
    display: flex;
    align-items: flex-start;
    gap: 0.35em;
    margin-bottom: 0.35em;
}
.mdpdf-el-qmc .qmc-num {
    font-weight: 700;
    color: var(--mdpdf-decoration-color);
    flex-shrink: 0;
    min-width: 1.6em;
    line-height: 1.55;
}
.mdpdf-el-qmc .qmc-pts {
    font-size: 0.78em;
    opacity: 0.58;
    flex-shrink: 0;
    white-space: nowrap;
    line-height: 1.9;
}
.mdpdf-el-qmc .qmc-body {
    flex: 1;
    min-width: 0;
    line-height: 1.55;
}
.mdpdf-el-qmc .qmc-body > p { margin: 0; }
.mdpdf-el-qmc .qmc-options {
    margin-left: 1.95em;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.18em 1.5em;
}
.mdpdf-el-qmc .qmc-options.qmc-options-single-col {
    grid-template-columns: 1fr;
}
.mdpdf-el-qmc .qmc-option {
    display: flex;
    align-items: baseline;
    gap: 0.25em;
    font-size: 0.92em;
    line-height: 1.5;
}
.mdpdf-el-qmc .qmc-option-letter {
    flex-shrink: 0;
    min-width: 1.4em;
}
.mdpdf-el-qmc .qmc-check {
    color: var(--mdpdf-decoration-color);
    font-weight: 700;
    flex-shrink: 0;
}
.mdpdf-el-qmc .qmc-option-correct .qmc-option-letter,
.mdpdf-el-qmc .qmc-option-correct .qmc-option-text {
    color: var(--mdpdf-decoration-color);
    font-weight: 600;
}`.trim(),

        render(fields) {
            // ── Parse options ──────────────────────────────────────────────
            const LETTER_RE = /^[\(\[]?([A-Za-z])[\)\].]?\s*/;
            const AUTO_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const rawLines = String(fields.options || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            const options = rawLines.map((line, idx) => {
                const m = line.match(LETTER_RE);
                if (m) {
                    return { letter: m[1].toUpperCase(), text: line.slice(m[0].length) };
                }
                return { letter: AUTO_LETTERS[idx] || String(idx + 1), text: line };
            });

            const answerLetter = String(fields.answer || '').trim().toUpperCase().replace(/[^A-Z]/g, '');
            const n = esc(fields.n || '?');
            const pts = fields.pts ? `(${esc(fields.pts)})` : '';

            // Use single-column when any option is long (rough threshold: > 40 chars)
            const singleCol = options.some(o => o.text.length > 40);

            const parts = [];
            parts.push('<div class="mdpdf-el-qmc">');

            // ── Header row: number · pts · body ───────────────────────────
            parts.push('<div class="qmc-header">');
            parts.push(`<span class="qmc-num">${n}.</span>`);
            if (pts) parts.push(`<span class="qmc-pts">${pts}</span>`);
            parts.push(`<div class="qmc-body">${renderBlock(fields.body || '')}</div>`);
            parts.push('</div>');

            // ── Options ────────────────────────────────────────────────────
            const colClass = singleCol ? ' qmc-options-single-col' : '';
            parts.push(`<div class="qmc-options${colClass}">`);
            for (const opt of options) {
                const isCorrect = answerLetter && opt.letter === answerLetter;
                if (isCorrect) {
                    // Student copy: plain unstyled option, hidden when answer key is revealed
                    parts.push('<div class="qmc-option" data-hide-when="answer-key=show">');
                    parts.push(`<span class="qmc-option-letter">${esc(opt.letter)}.</span>`);
                    parts.push(`<span class="qmc-option-text">${renderMd(opt.text)}</span>`);
                    parts.push('</div>');
                    // Answer key: highlighted option with ✓, hidden in student copy
                    parts.push('<div class="qmc-option qmc-option-correct" data-show-when="answer-key=show">');
                    parts.push('<span class="qmc-check">✓</span>');
                    parts.push(`<span class="qmc-option-letter">${esc(opt.letter)}.</span>`);
                    parts.push(`<span class="qmc-option-text">${renderMd(opt.text)}</span>`);
                    parts.push('</div>');
                } else {
                    parts.push('<div class="qmc-option">');
                    parts.push(`<span class="qmc-option-letter">${esc(opt.letter)}.</span>`);
                    parts.push(`<span class="qmc-option-text">${renderMd(opt.text)}</span>`);
                    parts.push('</div>');
                }
            }
            parts.push('</div>'); // .qmc-options

            parts.push('</div>'); // .mdpdf-el-qmc
            return parts.join('\n');
        },
    },

    // ── question-open ─────────────────────────────────────────────────────────
    //
    // Open-ended question (short answer, long answer, calculation, essay, etc.)
    // followed by a blank writing space. The answer is embedded in the data and
    // revealed only when answer-key=show.
    //
    // Fields:
    //   n       (required) — question number; plain text
    //   pts     (optional) — point value; plain text
    //   body    (required) — question text; block markdown
    //   space   (optional) — CSS height of the blank answer area (default "3cm")
    //                        Accepts any CSS length: "2cm", "5em", "60mm", etc.
    //   answer  (optional) — model answer; block markdown; shown only when
    //                        answer-key=show
    'question-open': {
        css: `
.mdpdf-el-qopen {
    margin-bottom: 0.9em;
}
.mdpdf-el-qopen .qopen-header {
    display: flex;
    align-items: flex-start;
    gap: 0.35em;
    margin-bottom: 0.3em;
}
.mdpdf-el-qopen .qopen-num {
    font-weight: 700;
    color: var(--mdpdf-decoration-color);
    flex-shrink: 0;
    min-width: 1.6em;
    line-height: 1.55;
}
.mdpdf-el-qopen .qopen-pts {
    font-size: 0.78em;
    opacity: 0.58;
    flex-shrink: 0;
    white-space: nowrap;
    line-height: 1.9;
}
.mdpdf-el-qopen .qopen-body {
    flex: 1;
    min-width: 0;
    line-height: 1.55;
}
.mdpdf-el-qopen .qopen-body > p { margin: 0; }
.mdpdf-el-qopen .qopen-blank {
    margin-left: 1.95em;
    border-bottom: 1px solid rgba(0,0,0,0.2);
    box-sizing: border-box;
}
.mdpdf-el-qopen .qopen-answer {
    margin-left: 1.95em;
    margin-top: 0.25em;
    padding: 0.35em 0.6em;
    border-left: 3px solid var(--mdpdf-decoration-color);
    background: rgba(0,0,0,0.025);
    font-size: 0.88em;
    line-height: 1.6;
}
.mdpdf-el-qopen .qopen-answer-label {
    font-size: 0.8em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--mdpdf-decoration-color);
    margin-bottom: 0.2em;
}
.mdpdf-el-qopen .qopen-answer > p:last-child { margin-bottom: 0; }`.trim(),

        render(fields) {
            const space = cssLength(fields.space, '3cm');
            const n = esc(fields.n || '?');
            const pts = fields.pts ? `(${esc(fields.pts)})` : '';

            const parts = [];
            parts.push('<div class="mdpdf-el-qopen">');

            // ── Header row: number · pts · body ───────────────────────────
            parts.push('<div class="qopen-header">');
            parts.push(`<span class="qopen-num">${n}.</span>`);
            if (pts) parts.push(`<span class="qopen-pts">${pts}</span>`);
            parts.push(`<div class="qopen-body">${renderBlock(fields.body || '')}</div>`);
            parts.push('</div>');

            // ── Blank writing space ────────────────────────────────────────
            parts.push(`<div class="qopen-blank" style="min-height:${space}"></div>`);

            // ── Model answer (shown only when answer-key=show) ─────────────
            if (fields.answer) {
                parts.push('<div class="qopen-answer" data-show-when="answer-key=show">');
                parts.push('<div class="qopen-answer-label">Answer</div>');
                parts.push(renderBlock(fields.answer));
                parts.push('</div>');
            }

            parts.push('</div>'); // .mdpdf-el-qopen
            return parts.join('\n');
        },
    },
};

// ─────────────────────────────────────────────────────────────────────────────

function resolveElement(name) {
    return ELEMENTS[String(name || '')] || null;
}

function listElements() {
    return Object.keys(ELEMENTS);
}

module.exports = { resolveElement, listElements };
