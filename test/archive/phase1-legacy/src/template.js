/**
 * template.js — Generate complete paged.js HTML from content + settings
 *
 * This is the single source of truth for the page layout.
 * Both the preview server and the Puppeteer converter use this same function,
 * guaranteeing that the preview matches the printed PDF exactly.
 *
 * The paged.js CDN URL is pinned to a specific version. Do NOT change it
 * without re-validating the PDF output against a printed test.
 */

'use strict';

const { getFontFamily, getFontPresetCss } = require('./font-presets');

// Default paged.js URL — callers should override this with a local path.
// CDN is kept as fallback only; prefer local serving to avoid flash-of-unstyled-content.
const PAGEDJS_CDN = 'https://unpkg.com/pagedjs@0.4.3/dist/paged.polyfill.js';
const KATEX_CSS_CDN = 'https://cdn.jsdelivr.net/npm/katex@0.16.35/dist/katex.min.css';
const RENDERER_ASSETS = {
    mermaidUrl: null,
    smilesDrawerUrl: null,
};

/**
 * Default page settings. All margin values are in mm.
 * @type {PageSettings}
 */
const DEFAULT_SETTINGS = {
    pageSize: 'A4',
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20,
    fontPreset: 'system-serif',
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: 12,           // pt
    lineHeight: 1.5,
    decorationColor: '#000000',
    pageNumberPosition: 'footer-center',   // or header-*/footer-*/none
    pageNumberStyle: 'simple',             // simple|page-n|page-n-of-N|n-of-N|n-slash-N|dash-n-dash|brackets|parentheses
    pageNumberStartPage: 1,
    firstPageHideHeader: false,
    firstPageHideFooter: false,
    firstPageSkipNumber: false,
    preBodyHideHeader: true,
    preBodyHideFooter: true,
    headerLeft: '',
    headerCenter: '',
    headerRight: '',
    headerRule: true,
    headerRuleColor: '#000000',
    headerFontSize: 9,
    footerLeft: '',
    footerCenter: '',
    footerRight: '',
    footerRule: true,
    footerRuleColor: '#000000',
    footerFontSize: 9,
    // Theme CSS from @orz-how/markdown-parser (null = no theme, rely on content styles only)
    theme: 'light-academic-2',
};

// Maps position key → CSS @page margin-box selector
const POSITION_MAP = {
    'header-left':   { selector: '@top-left',      isHeader: true  },
    'header-center': { selector: '@top-center',    isHeader: true  },
    'header-right':  { selector: '@top-right',     isHeader: true  },
    'footer-left':   { selector: '@bottom-left',   isHeader: false },
    'footer-center': { selector: '@bottom-center', isHeader: false },
    'footer-right':  { selector: '@bottom-right',  isHeader: false },
};

const PAGE_SIZE_MM = {
    A3: { width: 297, height: 420 },
    A4: { width: 210, height: 297 },
    A5: { width: 148, height: 210 },
    Letter: { width: 215.9, height: 279.4 },
    Legal: { width: 215.9, height: 355.6 },
};

const HEADER_RULE_OFFSET_MM = 2.4;
const FOOTER_RULE_OFFSET_MM = 2.4;
const HEADER_TEXT_GAP_MM = 0.3;
const FOOTER_TEXT_GAP_MM = 0.3;
const HEADER_TEXT_OFFSET_MM = 0.45;
const FOOTER_TEXT_OFFSET_MM = 0.45;

function getPrintableArea(pageSize, margins) {
    const preset = PAGE_SIZE_MM[pageSize];
    if (preset) {
        return {
            width: preset.width - margins.left - margins.right,
            height: preset.height - margins.top - margins.bottom,
        };
    }

    const mmMatch = String(pageSize).match(/^\s*([\d.]+)mm\s+([\d.]+)mm\s*$/i);
    if (!mmMatch) {
        return null;
    }

    return {
        width: parseFloat(mmMatch[1]) - margins.left - margins.right,
        height: parseFloat(mmMatch[2]) - margins.top - margins.bottom,
    };
}

function getPageNumberContent(style) {
    switch (style) {
        case 'page-n':      return '"Page " counter(page)';
        case 'page-n-of-N': return '"Page " counter(page) " of " counter(pages)';
        case 'n-of-N':      return 'counter(page) " of " counter(pages)';
        case 'n-slash-N':   return 'counter(page) " / " counter(pages)';
        case 'dash-n-dash': return '"- " counter(page) " -"';
        case 'brackets':    return '"[" counter(page) "]"';
        case 'parentheses': return '"(" counter(page) ")"';
        default:            return 'counter(page)';  // 'simple'
    }
}

function buildHeaderFooterCSS(settings) {
    let css = '';
    const resolvedFontFamily = getFontFamily(settings.fontPreset, settings.fontFamily);

    for (const [position, info] of Object.entries(POSITION_MAP)) {
        const fontSize = info.isHeader ? settings.headerFontSize : settings.footerFontSize;
        const ruleEnabled = info.isHeader ? settings.headerRule : settings.footerRule;
        const ruleColor = info.isHeader
            ? (settings.headerRuleColor || settings.decorationColor)
            : (settings.footerRuleColor || settings.decorationColor);
        const ruleDecoration = ruleEnabled
            ? (info.isHeader
                ? `background-image: linear-gradient(${ruleColor}, ${ruleColor}); background-repeat: no-repeat; background-size: 100% 1px; background-position: left calc(100% - ${HEADER_RULE_OFFSET_MM}mm); padding-top: ${HEADER_TEXT_OFFSET_MM}mm; padding-bottom: ${HEADER_TEXT_GAP_MM}mm;`
                : `background-image: linear-gradient(${ruleColor}, ${ruleColor}); background-repeat: no-repeat; background-size: 100% 1px; background-position: left ${FOOTER_RULE_OFFSET_MM}mm; padding-top: ${FOOTER_TEXT_GAP_MM}mm; padding-bottom: ${FOOTER_TEXT_OFFSET_MM}mm;`)
            : 'background-image: none;';

        let contentVal = null;

        if (position === settings.pageNumberPosition && settings.pageNumberPosition !== 'none') {
            contentVal = getPageNumberContent(settings.pageNumberStyle);
        } else {
            const textMap = {
                'header-left':   settings.headerLeft,
                'header-center': settings.headerCenter,
                'header-right':  settings.headerRight,
                'footer-left':   settings.footerLeft,
                'footer-center': settings.footerCenter,
                'footer-right':  settings.footerRight,
            };
            const text = (textMap[position] || '').trim();
            if (text) {
                contentVal = `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
            }
        }

        if (contentVal) {
            css += `
                ${info.selector} {
                    content: ${contentVal};
                    font-family: ${resolvedFontFamily};
                    font-size: ${fontSize}pt;
                    color: ${settings.decorationColor};
                    ${ruleDecoration}
                }`;
        }
    }
    return css;
}

function buildFirstPageCSS(settings) {
    if (!settings.firstPageHideHeader && !settings.firstPageHideFooter) {
        return '';
    }
    let inner = '';
    if (settings.firstPageHideHeader) {
        inner += `
            @top-left { content: none; border: none; box-shadow: none; background-image: none; }
            @top-center { content: none; border: none; box-shadow: none; background-image: none; }
            @top-right { content: none; border: none; box-shadow: none; background-image: none; }`;
    }
    if (settings.firstPageHideFooter) {
        inner += `
            @bottom-left { content: none; border: none; box-shadow: none; background-image: none; }
            @bottom-center { content: none; border: none; box-shadow: none; background-image: none; }
            @bottom-right { content: none; border: none; box-shadow: none; background-image: none; }`;
    }
    return inner ? `\n        @page:first {\n            ${inner.trim()}\n        }` : '';
}

/**
 * Generate the complete paged.js HTML document.
 *
 * @param {string}       contentHtml  Parsed HTML fragment (from parse.js)
 * @param {object}       userSettings Settings to merge with defaults
 * @param {string|null}  themeCSS     Raw CSS from a @orz-how/markdown-parser theme file (optional)
 * @param {string}       [pagedJsUrl] URL for the paged.js polyfill script. Defaults to CDN.
 *                                   Pass a local URL (e.g. '/_pagedjs') for the preview server,
 *                                   or a file:// path for Puppeteer. Serving locally eliminates
 *                                   the flash-of-unstyled-content caused by CDN load delay.
 * @param {object}       [rendererAssets] Optional runtime asset URLs for diagram renderers.
 * @returns {string}  Complete HTML string ready for browser or Puppeteer
 */
function generatePagedHtml(
    contentHtml,
    userSettings = {},
    themeCSS = null,
    pagedJsUrl = PAGEDJS_CDN,
    rendererAssets = RENDERER_ASSETS
) {
    const s = Object.assign({}, DEFAULT_SETTINGS, userSettings);
    const assets = Object.assign({}, RENDERER_ASSETS, rendererAssets);
    const resolvedFontFamily = getFontFamily(s.fontPreset, s.fontFamily);
    const fontPresetCss = getFontPresetCss(s.fontPreset);
    const printableArea = getPrintableArea(s.pageSize, {
        top: s.marginTop,
        bottom: s.marginBottom,
        left: s.marginLeft,
        right: s.marginRight,
    });
    const maxImageHeightRule = printableArea && printableArea.height > 0
        ? `max-height: ${printableArea.height}mm;`
        : '';
    const imageMaxHeightCss = s.limitImageToPage ? maxImageHeightRule : '';
    const imageKeepTogetherCss = s.keepImageTogether
        ? `break-inside: avoid; page-break-inside: avoid;`
        : '';
    const tableHeaderCss = s.repeatTableHeader ? 'display: table-header-group;' : '';
    const tableFooterCss = s.repeatTableHeader ? 'display: table-footer-group;' : '';
    const tableRowBreakCss = s.avoidTableRowBreaks
        ? `break-inside: avoid; page-break-inside: avoid;`
        : '';

    const pageCSS = `
        @page {
            size: ${s.pageSize};
            margin-top: ${s.marginTop}mm;
            margin-bottom: ${s.marginBottom}mm;
            margin-left: ${s.marginLeft}mm;
            margin-right: ${s.marginRight}mm;
            ${buildHeaderFooterCSS(s)}
        }
        ${buildFirstPageCSS(s)}
    `;

    const renderedScreenCSS = `
        @media screen {
            html, body {
                width: 100%;
                overflow-x: auto;
            }
            .pagedjs_pages {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: flex-start !important;
                width: 100% !important;
                min-width: fit-content !important;
                padding: 20px 0 !important;
                margin: 0 auto !important;
            }
            .pagedjs_page {
                background-color: white !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
                outline: 1px solid rgba(0,0,0,0.15) !important;
                margin-bottom: 20px !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }
            .pagedjs_sheet {
                background-color: white !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
                outline: 1px solid rgba(0,0,0,0.15) !important;
            }
        }
    `;

    const screenCSS = `
        @media screen {
            html, body {
                width: 100%;
                overflow-x: auto;
            }
            body {
                background-color: #525659;
                min-height: 100vh;
            }
            .pagedjs_pages {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                width: 100%;
                min-width: fit-content;
                padding: 20px 0;
                margin: 0 auto;
            }
            .pagedjs_page {
                background-color: white !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
                outline: 1px solid rgba(0,0,0,0.15) !important;
                margin-bottom: 20px !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }
            .pagedjs_sheet {
                background-color: white !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
                outline: 1px solid rgba(0,0,0,0.15) !important;
            }
        }
        @media print {
            body { background: white; }
        }
    `;

    const baseContentCSS = `
        .mdpdf-hide-margin-boxes-header .pagedjs_margin-top-left,
        .mdpdf-hide-margin-boxes-header .pagedjs_margin-top-center,
        .mdpdf-hide-margin-boxes-header .pagedjs_margin-top-right,
        .mdpdf-hide-margin-boxes-footer .pagedjs_margin-bottom-left,
        .mdpdf-hide-margin-boxes-footer .pagedjs_margin-bottom-center,
        .mdpdf-hide-margin-boxes-footer .pagedjs_margin-bottom-right {
            content: none !important;
            background-image: none !important;
            border: none !important;
            box-shadow: none !important;
            color: transparent !important;
            font-size: 0 !important;
            line-height: 0 !important;
        }
        .mdpdf-hide-margin-boxes-header .pagedjs_margin-top-left .pagedjs_margin-content,
        .mdpdf-hide-margin-boxes-header .pagedjs_margin-top-center .pagedjs_margin-content,
        .mdpdf-hide-margin-boxes-header .pagedjs_margin-top-right .pagedjs_margin-content,
        .mdpdf-hide-margin-boxes-footer .pagedjs_margin-bottom-left .pagedjs_margin-content,
        .mdpdf-hide-margin-boxes-footer .pagedjs_margin-bottom-center .pagedjs_margin-content,
        .mdpdf-hide-margin-boxes-footer .pagedjs_margin-bottom-right .pagedjs_margin-content {
            display: none !important;
        }
        #content {
            font-family: ${resolvedFontFamily};
            font-size: ${s.fontSize}pt;
            line-height: ${s.lineHeight};
        }
        #content strong, #content b { font-weight: bold; }
        #content em, #content i { font-style: italic; }
        #content img {
            display: block;
            max-width: 100%;
            ${imageMaxHeightCss}
            width: auto;
            height: auto;
            object-fit: contain;
            ${imageKeepTogetherCss}
        }
        #content p:has(> img:only-child),
        #content .center:has(img),
        #content .left:has(img),
        #content .right:has(img) {
            ${imageKeepTogetherCss}
        }
        #content table {
            width: 100%;
            break-inside: auto;
            page-break-inside: auto;
        }
        #content thead {
            ${tableHeaderCss}
        }
        #content tfoot {
            ${tableFooterCss}
        }
        #content tr,
        #content th,
        #content td {
            ${tableRowBreakCss}
        }
        .mdpdf-title-page {
            min-height: 240mm;
            display: flex;
            align-items: stretch;
            justify-content: var(--mdpdf-title-justify, center);
            text-align: var(--mdpdf-title-align, center);
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .mdpdf-title-page--pagebreak-after {
            break-after: page;
            page-break-after: always;
        }
        .mdpdf-title-page__inner {
            width: 100%;
            max-width: var(--mdpdf-title-width, 140mm);
            margin: 0 auto;
            font-size: var(--mdpdf-meta-size, inherit);
        }
        .mdpdf-title-page__title {
            font-size: var(--mdpdf-title-size, 24pt);
            line-height: 1.2;
            margin: 0 0 var(--mdpdf-title-gap, 12pt);
        }
        .mdpdf-title-page__subtitle {
            font-size: var(--mdpdf-subtitle-size, 14pt);
            margin: 0 0 var(--mdpdf-subtitle-gap, 18pt);
        }
        .mdpdf-title-page__author,
        .mdpdf-title-page__affiliation,
        .mdpdf-title-page__date {
            font-size: var(--mdpdf-meta-size, 11pt);
            margin: 0 0 var(--mdpdf-meta-gap, 8pt);
        }
        .mdpdf-vspace {
            width: 100%;
            display: block;
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .pagebreak {
            display: block;
            width: 100%;
            height: 0;
            break-before: page;
            page-break-before: always;
        }
        .pagebreak--blank {
            break-after: page;
            page-break-after: always;
        }
        .tabs {
            border: 1px solid var(--border, #d0d7de);
            border-radius: var(--radius, 8px);
            overflow: hidden;
            margin: 1.5rem 0;
        }
        .tabs-bar {
            display: flex;
            background: var(--bg-elevated, #f6f8fa);
            border-bottom: 1px solid var(--border, #d0d7de);
            overflow-x: auto;
            scrollbar-width: none;
        }
        .tabs-bar::-webkit-scrollbar {
            display: none;
        }
        .tabs-bar-btn {
            padding: 0.6rem 1.1rem;
            border: none;
            background: none;
            color: var(--text-secondary, #57606a);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            white-space: nowrap;
            border-bottom: 2px solid transparent;
            transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }
        .tabs-bar-btn:hover {
            color: var(--text-primary, #1f2328);
            background: rgba(0, 0, 0, 0.04);
        }
        .tabs-bar-btn.active {
            color: var(--accent, #0969da);
            border-bottom-color: var(--accent, #0969da);
        }
        .tab {
            display: none;
            padding: 1.25rem 1.5rem;
        }
        .tab.active {
            display: block;
        }
        .tabs:not([data-js]) .tab {
            display: block;
        }
        .tabs:not([data-js]) .tab + .tab {
            border-top: 1px solid var(--border-subtle, #d8dee4);
        }
        .smiles-render {
            background: var(--bg-elevated, #f6f8fa);
            border: 1px solid var(--border, #d0d7de);
            border-radius: var(--radius, 8px);
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            margin: 1rem 0;
        }
        .smiles-render canvas {
            display: block;
            margin: auto;
            border-radius: var(--radius-sm, 4px);
            max-width: 100%;
            height: auto;
        }
        .smiles-render img {
            display: block;
            margin: auto;
            max-width: 100%;
            height: auto;
        }
    `;

    const rendererRuntimeJS = `
        const existingPagedBefore = window.PagedConfig && window.PagedConfig.before;

        function initTabs() {
            document.querySelectorAll('.tabs').forEach(function(tabs) {
                tabs.setAttribute('data-js', '1');
                const panels = tabs.querySelectorAll(':scope > .tab');
                if (!panels.length) {
                    return;
                }

                const existingBar = tabs.querySelector(':scope > .tabs-bar');
                if (existingBar) {
                    existingBar.remove();
                }

                const bar = document.createElement('div');
                bar.className = 'tabs-bar';

                panels.forEach(function(panel, index) {
                    const label = panel.getAttribute('data-label') || 'Tab ' + (index + 1);
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'tabs-bar-btn' + (index === 0 ? ' active' : '');
                    button.textContent = label;
                    button.addEventListener('click', function() {
                        tabs.querySelectorAll('.tabs-bar-btn').forEach(function(btn) {
                            btn.classList.remove('active');
                        });
                        panels.forEach(function(item) {
                            item.classList.remove('active');
                        });
                        button.classList.add('active');
                        panel.classList.add('active');
                    });
                    bar.appendChild(button);
                    panel.classList.toggle('active', index === 0);
                });

                tabs.insertBefore(bar, tabs.firstChild);
            });
        }

        async function renderMermaidBlocks() {
            const blocks = document.querySelectorAll('.mermaid');
            if (!blocks.length || !window.mermaid) return;
            if (!window.__mermaidInitialized) {
                window.mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: 'loose',
                    theme: 'default'
                });
                window.__mermaidInitialized = true;
            }
            if (typeof window.mermaid.run === 'function') {
                await window.mermaid.run({ querySelector: '.mermaid' });
                return;
            }
            if (typeof window.mermaid.init === 'function') {
                window.mermaid.init(undefined, blocks);
            }
        }

        async function renderSmilesBlocks() {
            const canvases = document.querySelectorAll('.smiles-render canvas[data-smiles]');
            if (
                !canvases.length ||
                !window.SmilesDrawer ||
                typeof window.SmilesDrawer.parse !== 'function' ||
                typeof window.SmilesDrawer.Drawer !== 'function'
            ) {
                return;
            }

            const renderJobs = Array.prototype.slice.call(canvases).map(function(canvas, index) {
                return new Promise(function(resolve) {
                    const smiles = canvas.getAttribute('data-smiles');
                    if (!smiles) {
                        resolve();
                        return;
                    }

                    const freshCanvas = canvas.cloneNode(false);
                    freshCanvas.width = canvas.width;
                    freshCanvas.height = canvas.height;
                    if (canvas.id) {
                        freshCanvas.id = canvas.id;
                    } else {
                        freshCanvas.id = 'smiles-canvas-' + index;
                    }

                    canvas.replaceWith(freshCanvas);

                    const drawer = new window.SmilesDrawer.Drawer({
                        width: freshCanvas.width,
                        height: freshCanvas.height,
                    });

                    window.SmilesDrawer.parse(smiles, function(tree) {
                        if (!freshCanvas.isConnected) {
                            resolve();
                            return;
                        }
                        try {
                            drawer.draw(tree, freshCanvas.id, 'light', false);
                            requestAnimationFrame(function() {
                                requestAnimationFrame(function() {
                                    if (!freshCanvas.isConnected) {
                                        resolve();
                                        return;
                                    }
                                    try {
                                        const image = document.createElement('img');
                                        image.src = freshCanvas.toDataURL();
                                        image.alt = 'SMILES structure';
                                        image.width = freshCanvas.width;
                                        image.height = freshCanvas.height;
                                        freshCanvas.replaceWith(image);
                                    } catch (snapshotError) {
                                        console.error('SMILES snapshot error:', snapshotError);
                                    }
                                    resolve();
                                });
                            });
                            return;
                        } catch (error) {
                            console.error('SMILES draw error:', error);
                        }
                        resolve();
                    }, function(error) {
                        console.error('SMILES parse error:', error);
                        resolve();
                    });
                });
            });

            await Promise.all(renderJobs);
        }

        window.PagedConfig = Object.assign({}, window.PagedConfig, {
            before: async function() {
                if (typeof existingPagedBefore === 'function') {
                    await existingPagedBefore();
                }
                initTabs();
                await renderMermaidBlocks();
                await renderSmilesBlocks();
            }
        });
    `;

    const rendererScripts = [assets.mermaidUrl, assets.smilesDrawerUrl]
        .filter(Boolean)
        .map((url) => `<script src="${url}"><\/script>`)
        .join('\n');

    const pageNumberStartPage = Number.isFinite(Number(s.pageNumberStartPage))
        ? Math.max(1, Math.floor(Number(s.pageNumberStartPage)))
        : (s.firstPageSkipNumber ? 2 : 1);

    const pageNumberRuntimeJS = s.pageNumberPosition !== 'none' ? `
        (function() {
            const positionToClass = {
                'header-left':   'pagedjs_margin-top-left',
                'header-center': 'pagedjs_margin-top-center',
                'header-right':  'pagedjs_margin-top-right',
                'footer-left':   'pagedjs_margin-bottom-left',
                'footer-center': 'pagedjs_margin-bottom-center',
                'footer-right':  'pagedjs_margin-bottom-right'
            };
            const targetClass = positionToClass['${s.pageNumberPosition}'];
            const style = '${s.pageNumberStyle}';
            const allPages = document.querySelectorAll('.pagedjs_page');
            const startPage = ${pageNumberStartPage};
            const total = Math.max(0, allPages.length - startPage + 1);
            function fmt(n, t) {
                switch(style) {
                    case 'page-n':      return 'Page ' + n;
                    case 'page-n-of-N': return 'Page ' + n + ' of ' + t;
                    case 'n-of-N':      return n + ' of ' + t;
                    case 'n-slash-N':   return n + ' / ' + t;
                    case 'dash-n-dash': return '- ' + n + ' -';
                    case 'brackets':    return '[' + n + ']';
                    case 'parentheses': return '(' + n + ')';
                    default:            return String(n);
                }
            }
            const hide = document.createElement('style');
            hide.textContent = '.' + targetClass + ' .pagedjs_margin-content::after { content: none !important; }';
            document.head.appendChild(hide);
            allPages.forEach(function(page, i) {
                const box = page.querySelector('.' + targetClass + ' .pagedjs_margin-content');
                if (!box) return;
                const physicalPage = i + 1;
                if (physicalPage < startPage || total === 0) {
                    box.textContent = '';
                    return;
                }
                box.textContent = fmt(physicalPage - startPage + 1, total);
            });
        })();
    ` : '';

    const preBodyMarginHideJS = `
        (function() {
            const hideHeader = ${s.preBodyHideHeader ? 'true' : 'false'};
            const hideFooter = ${s.preBodyHideFooter ? 'true' : 'false'};
            const marginSelectors = [];

            if (hideHeader) {
                marginSelectors.push(
                    '.pagedjs_margin-top-left',
                    '.pagedjs_margin-top-center',
                    '.pagedjs_margin-top-right'
                );
            }

            if (hideFooter) {
                marginSelectors.push(
                    '.pagedjs_margin-bottom-left',
                    '.pagedjs_margin-bottom-center',
                    '.pagedjs_margin-bottom-right'
                );
            }

            document.querySelectorAll('.pagedjs_page').forEach(function(page) {
                if (!page.querySelector('.mdpdf-pre-body, [data-mdpdf-pre-body="1"]')) {
                    return;
                }

                if (hideHeader) {
                    page.classList.add('mdpdf-hide-margin-boxes-header');
                }
                if (hideFooter) {
                    page.classList.add('mdpdf-hide-margin-boxes-footer');
                }

                marginSelectors.forEach(function(selector) {
                    const box = page.querySelector(selector);
                    if (!box) return;
                    const content = box.querySelector('.pagedjs_margin-content');
                    if (content) {
                        content.textContent = '';
                    }
                });
            });
        })();
    `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="${KATEX_CSS_CDN}">
<style>
body {
    font-family: ${resolvedFontFamily};
    font-size: ${s.fontSize}pt;
    line-height: ${s.lineHeight};
    color: #000;
    margin: 0;
}
${fontPresetCss}
${pageCSS}
${screenCSS}
${baseContentCSS}
${themeCSS ? `/* theme and template css */\n${themeCSS}` : ''}
</style>
</head>
<body>
<div id="content" class="markdown-body">${contentHtml}</div>
<!-- paged.js MUST be at the bottom of <body>, after content, so it finds the
     content already in the DOM when it runs. Loading in <head> causes it to
     paginate an empty body. This is the validated pattern from example.html. -->
${rendererScripts}
<script>
${rendererRuntimeJS}
</script>
<script src="${pagedJsUrl}"><\/script>
<script>
if (window.PagedPolyfill) {
    window.PagedPolyfill.on('rendered', function() {
        ${pageNumberRuntimeJS}
        ${preBodyMarginHideJS}
        if (window.matchMedia('screen').matches) {
            const previewStyle = document.createElement('style');
            previewStyle.textContent = ${JSON.stringify(renderedScreenCSS)};
            document.head.appendChild(previewStyle);
        }
        // Notify any parent frame that rendering is complete
        try { window.parent.postMessage({ type: 'paged-rendered' }, '*'); } catch(e) {}
        // Signal for Puppeteer to detect completion
        window.__pagedRendered = true;
    });
}
</script>
</body>
</html>`;
}

module.exports = { generatePagedHtml, DEFAULT_SETTINGS, PAGEDJS_CDN };
