'use strict';

// Base shared settings for all built-in templates.
// These override core defaults but are overridden by any user NYML settings.
const BASE = {
    pageSize: 'Letter',
    marginTop: 25.4,
    marginBottom: 25.4,
    marginLeft: 25.4,
    marginRight: 25.4,
    fontMarginBoxPreset: 'system-serif',
    fontSize: 12,
    lineHeight: 1.5,
    pageNumberPosition: 'footer-right',
    pageNumberStyle: 'page-n',
    headerRule: false,
    footerRule: false,
    pageBackground: 'rgb(255, 255, 255)',
};

const TEMPLATE_MAP = {
    /**
     * default-document
     * A clean, formal document for general writing and academic work.
     * Theme: light-academic-1 (Tufte-inspired serif, justified paragraphs)
     * Font: Noto Serif
     */
    'default': {
        ...BASE,
        theme: 'light-academic-1',
        fontPreset: 'noto-serif',
    },
    /** 
    * academic 
    */
    'academic': {
        ...BASE,
        theme: 'default',
        fontPreset: 'system-serif',
    },
    /**
     * casual-note
     * A modern, readable layout for personal notes and informal documents.
     * Theme: light-neat-1 (blue-accent, decorated headings)
     * Font: Lora
     */
    'casual-note': {
        ...BASE,
        theme: 'light-neat-1',
        fontPreset: 'lora',
    },

    /**
     * handwritten-note
     * A warm, informal look mimicking a handwritten or notebook page.
     * Theme: light-playful-1 (sticky-note callouts, playful headings)
     * Font: Neucha
     * Background: slight beige with ruled lines
     */
    'handwritten-note': {
        ...BASE,
        theme: 'light-playful-1',
        fontPreset: 'neucha',
        pageBackground: '#fcf9f2',
        pageBackgroundEffect: 'ruled',
    },

    /**
     * beige-journal
     * Elegant editorial/magazine article layout on a warm cream page.
     * Suited for journal articles, magazine essays, or literary content.
     * Theme: beige-decent-1 (sepia palette, centered h1, pull-quote blockquote)
     * Body font: Lora — warm humanist serif, ideal for editorial reading
     * Heading font: Raleway — clean sans contrast, evokes magazine hierarchy
     * Page: A4, 28 mm margins all round, 11 pt / 1.6 lh for comfortable column width
     * Footer: dash-n-dash centred folio (- 3 -)
     * Background: very light warm cream #faf8f4
     */
    'beige-journal': {
        ...BASE,
        theme: 'beige-decent-1',
        fontPreset: 'lora',
        fontHeadingPreset: 'raleway',
        pageSize: 'A4',
        marginTop: 25.4,
        marginBottom: 25.4,
        marginLeft: 28,
        marginRight: 28,
        fontSize: 11,
        lineHeight: 1.6,
        pageNumberPosition: 'footer-center',
        pageNumberStyle: 'dash-n-dash',
        headerRule: false,
        footerRule: false,
        pageBackground: '#f4ecdf',
        decorationColor: '#8b7355',
    },

    /**
     * beige-book
     * Classic book / literary prose layout on a warm cream page.
     * Suited for novels, fiction, long-form narrative non-fiction.
     * Theme: beige-decent-1 (sepia palette)
     * Body font: Crimson Pro — open, classical book face; generous x-height
     * Heading font: Lora — warm serif chapter headings blend with body
     * Page: Letter, 1.25 in left gutter / 1 in right, 28 mm top+bottom
     * Font size 13 pt / 1.7 lh — optimised for sustained leisure reading
     * Footer: simple centred numeral (drop folio on first page)
     * Background: warm cream #fdfaf5
     */
    'beige-book': {
        ...BASE,
        theme: 'beige-decent-1',
        fontPreset: 'crimson-pro',
        fontHeadingPreset: 'lora',
        pageSize: 'Letter',
        marginTop: 28,
        marginBottom: 28,
        marginLeft: 31.75,
        marginRight: 25.4,
        fontSize: 13,
        lineHeight: 1.7,
        pageNumberPosition: 'footer-center',
        pageNumberStyle: 'simple',
        headerRule: false,
        footerRule: false,
        firstPageHideFooter: true,
        pageBackground: '#f4ecdf',
        decorationColor: '#8b7355',
    },

    /**
     * cv-linear
     * Classic single-column CV / résumé layout.
     * No theme — all decoration driven by the template's own CSS.
     * Body font: Source Serif 4 — warm readable serif for CV prose.
     * Heading font: IBM Plex Sans — clean sans contrast for section labels.
     * Page: Letter, tight 15 mm top/bottom, 17 mm side margins.
     * h2 → ALL-CAPS small label + decoration-color bottom rule (section divider)
     * h3 → entry title (job title · employer · dates)
     * Footer: page number right; user sets footer_left to their name.
     */
    'cv-linear': {
        theme: 'none',
        fontPreset: 'source-serif-4',
        fontHeadingPreset: 'ibm-plex-sans',
        pageSize: 'Letter',
        marginTop: 15,
        marginBottom: 15,
        marginLeft: 17,
        marginRight: 17,
        fontSize: 10.5,
        lineHeight: 1.45,
        pageNumberPosition: 'footer-right',
        pageNumberStyle: 'simple',
        headerRule: false,
        footerRule: false,
        pageBackground: '',
        decorationColor: '#2a6496',
        customCss: `
/* ── cv-linear: single-column classic CV ─────────────────────────────── */
.markdown-body h1 {
    font-size: 2em;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin: 0 0 0.1em;
    border: none;
}
.markdown-body h1 + p {
    font-size: 0.85em;
    margin: 0 0 1.2em;
    opacity: 0.7;
    line-height: 1.6;
    border-bottom: 1px solid var(--mdpdf-decoration-color);
    padding-bottom: 0.5em;
}
.markdown-body h2 {
    font-size: 0.72em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.13em;
    color: var(--mdpdf-decoration-color);
    border-bottom: 1.5px solid var(--mdpdf-decoration-color);
    padding-bottom: 0.2em;
    margin: 1.4em 0 0.4em;
    break-after: avoid;
    page-break-after: avoid;
}
.markdown-body h3 {
    font-size: 0.9em;
    font-weight: 600;
    margin: 0.6em 0 0.1em;
    border: none;
    line-height: 1.3;
    break-after: avoid;
    page-break-after: avoid;
}
.markdown-body h4 {
    font-size: 0.82em;
    font-weight: 400;
    font-style: italic;
    margin: 0 0 0.2em;
    opacity: 0.65;
    border: none;
}
.markdown-body p {
    margin: 0.1em 0 0.35em;
    font-size: 0.9em;
}
.markdown-body ul, .markdown-body ol {
    margin: 0.1em 0 0.4em;
    padding-left: 1.5em;
}
.markdown-body li {
    margin-bottom: 0.08em;
    font-size: 0.88em;
}
.markdown-body hr {
    border: none;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    margin: 0.5em 0;
}
`.trim(),
    },

    /**
     * cv-block-grid
     * Two-column block grid CV using :::: cols containers for entries.
     * Left col = narrow label (date/category); right col = content.
     * No theme — CSS-only styling of standard markdown + orz-markdown cols.
     * Font: Noto Sans only — weight variation for hierarchy.
     * Page: Letter, 17 mm top/bottom, 20 mm sides.
     */
    'cv-block-grid': {
        theme: 'none',
        fontPreset: 'noto-sans',
        pageSize: 'Letter',
        marginTop: 17,
        marginBottom: 17,
        marginLeft: 20,
        marginRight: 20,
        fontSize: 10,
        lineHeight: 1.55,
        pageNumberPosition: 'footer-right',
        pageNumberStyle: 'simple',
        headerRule: false,
        footerRule: false,
        pageBackground: '',
        decorationColor: '#2a6496',
        customCss: `
/* ── cv-block-grid: two-column block grid CV ─────────────────────────── */
.markdown-body h1 {
    font-size: 1.9em;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.1;
    margin: 0 0 0.1em;
    border: none;
}
.markdown-body h1 + p {
    font-size: 0.85em;
    margin: 0 0 1.2em;
    opacity: 0.7;
    line-height: 1.5;
}
.markdown-body h2 {
    font-size: 0.78em;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--mdpdf-decoration-color);
    border: none;
    margin: 1.1em 0 0.35em;
    break-after: avoid;
    page-break-after: avoid;
}
.markdown-body hr {
    border: none;
    border-top: 1.5px solid var(--mdpdf-decoration-color);
    margin: 0.6em 0;
    opacity: 0.25;
}
/* Override default .cols grid: fixed-width left label, content right */
.markdown-body .cols {
    display: grid;
    grid-template-columns: 26mm 1fr;
    gap: 0 1.2em;
    margin-bottom: 0.4em;
    align-items: start;
}
.markdown-body .col {
    border: none;
    border-radius: 0;
    padding: 0;
    min-width: 0;
}
.markdown-body .col:first-child {
    font-size: 0.72em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: var(--mdpdf-decoration-color);
    text-align: right;
    white-space: normal;
    overflow-wrap: break-word;
    padding-top: 0.2em;
}
.markdown-body .col:first-child > p { margin: 0; }
.markdown-body .col:last-child h3 {
    font-size: 0.9em;
    font-weight: 600;
    margin: 0 0 0.1em;
    border: none;
}
.markdown-body .col:last-child p {
    font-size: 0.88em;
    margin: 0.08em 0 0.25em;
}
.markdown-body .col:last-child ul {
    margin: 0.05em 0 0.25em;
    padding-left: 1.4em;
}
.markdown-body .col:last-child li {
    font-size: 0.87em;
    margin-bottom: 0.05em;
}
.markdown-body p {
    font-size: 0.9em;
    margin: 0.1em 0 0.3em;
}
.markdown-body ul, .markdown-body ol {
    margin: 0.1em 0 0.35em;
    padding-left: 1.5em;
}
.markdown-body li {
    font-size: 0.88em;
    margin-bottom: 0.08em;
}
`.trim(),
    },

    /**
     * cv-sidebar
     * Sidebar accent CV using paged.js "running elements" to fill the left
     * margin box on every page.
     * The cv-sidebar-layout element is placed at the top of the document.
     * paged.js extracts it from the normal flow (via position:running declared
     * here in customCss so it lands in <head> where paged.js CSS parser runs)
     * and repeats it inside the @left-top margin box on every page.
     * Font: Inter (all sans) — clean, professional, modern.
     * Page: Letter, marginLeft=62 mm (sidebar 52mm + 10mm gap to content area)
     */
    'cv-sidebar': {
        theme: 'none',
        fontPreset: 'inter',
        pageSize: 'Letter',
        marginTop: 15,
        marginBottom: 15,
        marginLeft: 62,
        marginRight: 17,
        fontSize: 10,
        lineHeight: 1.5,
        pageNumberPosition: 'footer-right',
        pageNumberStyle: 'simple',
        headerRule: false,
        footerRule: false,
        pageBackground: '',
        decorationColor: '#2a6496',
        customCss: `
/* ── cv-sidebar: running-element sidebar CV ──────────────────────────── */

/* Declare the sidebar element as a running element.
   This rule MUST be in <head> CSS (customCss) so paged.js can find it
   with its own CSS parser — it is silently dropped by browsers from the
   CSSOM, but paged.js re-reads <head> <style> textContent directly. */
.mdpdf-el-cvsl {
    position: running(cv-sidebar-content);
}

/* Pull the running element into the @left-top margin box on every page.
   The left margin (62mm) provides the physical space for the sidebar. */
@page {
    @left-top {
        content: element(cv-sidebar-content);
        vertical-align: top;
        padding: 15mm 10mm 15mm 12mm;
        box-sizing: border-box;
    }
}

/* Paint a tinted left stripe on every page to fill the margin area.
   The gradient switches from the sidebar tint to white at the point
   where the content area begins (= marginLeft = 62mm from page edge). */
.pagedjs_page,
.pagedjs_sheet {
    background: linear-gradient(
        to right,
        rgba(42, 100, 150, 0.06) 62mm,
        white 62mm
    ) !important;
}

/* Content area heading styles */
#content {
    padding-left: 4mm;
}
.markdown-body h1 {
    font-size: 1.85em;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.1;
    margin: 0 0 0.15em;
    border: none;
}
.markdown-body h1 + p {
    font-size: 0.85em;
    margin: 0 0 1.1em;
    opacity: 0.65;
    line-height: 1.5;
}
.markdown-body h2 {
    font-size: 0.72em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--mdpdf-decoration-color);
    border-bottom: 1.5px solid var(--mdpdf-decoration-color);
    padding-bottom: 0.2em;
    margin: 1.3em 0 0.4em;
    break-after: avoid;
    page-break-after: avoid;
}
.markdown-body h3 {
    font-size: 0.9em;
    font-weight: 600;
    margin: 0.5em 0 0.1em;
    border: none;
    break-after: avoid;
    page-break-after: avoid;
}
.markdown-body p {
    font-size: 0.9em;
    margin: 0.1em 0 0.3em;
}
.markdown-body ul, .markdown-body ol {
    margin: 0.1em 0 0.35em;
    padding-left: 1.5em;
}
.markdown-body li {
    font-size: 0.88em;
    margin-bottom: 0.06em;
}
.markdown-body hr {
    border: none;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    margin: 0.5em 0;
}
`.trim(),
    },
};

/**
 * Return the settings object for a named template.
 * Returns {} (empty — no override) if name is falsy or unknown.
 */
function resolveTemplateSettings(name) {
    if (!name) return {};
    return TEMPLATE_MAP[name] || {};
}

/** Return an array of all available template names. */
function listTemplates() {
    return Object.keys(TEMPLATE_MAP);
}

module.exports = { resolveTemplateSettings, listTemplates, TEMPLATE_MAP };
