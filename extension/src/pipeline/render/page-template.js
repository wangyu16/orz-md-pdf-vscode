'use strict';

const { CORE_DEFAULT_SETTINGS } = require('../config/settings-schema');
const { getFontFamily, getFontPresetLinks } = require('../fonts/registry');
const { getThemeCss, getCommonCss, getDefaultCss } = require('../themes/registry');
const { buildHeaderFooterCss } = require('./header-footer');
const {
    buildFirstPageMarginCss,
    buildPageNumberRuntimeJs,
    buildPreBodyMarginRuntimeJs,
} = require('./margin-box-policy');
const { getPrintableArea } = require('./content-flow');
const { buildPageBackgroundCss } = require('./background');

const PAGEDJS_CDN = 'https://unpkg.com/pagedjs@0.4.3/dist/paged.polyfill.js';
const KATEX_CSS_CDN = 'https://cdn.jsdelivr.net/npm/katex@0.16.35/dist/katex.min.css';
const HLJS_CSS = require('fs').readFileSync(require.resolve('highlight.js/styles/github.min.css'), 'utf8');
const RENDERER_ASSETS = {
    mermaidUrl: null,
    smilesDrawerUrl: null,
};

function generatePagedHtml(contentHtml, userSettings = {}, _themeCss = null, pagedJsUrl = PAGEDJS_CDN, rendererAssets = RENDERER_ASSETS) {
    const settings = Object.assign({}, CORE_DEFAULT_SETTINGS, userSettings);
    const assets = Object.assign({}, RENDERER_ASSETS, rendererAssets);
    const resolvedFontFamily = getFontFamily(settings.fontPreset, settings.fontFamily);
    const fontPresetLinks = getFontPresetLinks(settings.fontPreset);
    const resolvedThemeCss = getThemeCss(settings.theme);
    const commonCss = getCommonCss();
    const defaultCss = getDefaultCss();

    // Heading font — only if different from body preset
    const headingPreset = settings.fontHeadingPreset;
    const headingFontPresetLinks = (headingPreset && headingPreset !== settings.fontPreset)
        ? getFontPresetLinks(headingPreset)
        : '';
    const headingFontFamily = headingPreset ? getFontFamily(headingPreset, settings.fontFamily) : '';
    const headingFontCss = headingFontFamily
        ? `#content h1, #content h2, #content h3, #content h4, #content h5, #content h6 { font-family: ${headingFontFamily}; }`
        : '';
    const printableArea = getPrintableArea(settings.pageSize, {
        top: settings.marginTop,
        bottom: settings.marginBottom,
        left: settings.marginLeft,
        right: settings.marginRight,
    });
    const maxImageHeightRule = printableArea && printableArea.height > 0
        ? `max-height: ${printableArea.height}mm;`
        : '';
    const imageMaxHeightCss = settings.limitImageToPage ? maxImageHeightRule : '';
    const imageKeepTogetherCss = settings.keepImageTogether ? 'break-inside: avoid; page-break-inside: avoid;' : '';
    const tableHeaderCss = settings.repeatTableHeader ? 'display: table-header-group;' : '';
    const tableFooterCss = settings.repeatTableHeader ? 'display: table-footer-group;' : '';
    const tableRowBreakCss = settings.avoidTableRowBreaks ? 'break-inside: avoid; page-break-inside: avoid;' : '';
    const pageBackgroundCss = buildPageBackgroundCss(settings);
    const pageScreenBgColor = settings.pageBackground || 'white';

    const pageCss = `
        @page {
            size: ${settings.pageSize};
            margin-top: ${settings.marginTop}mm;
            margin-bottom: ${settings.marginBottom}mm;
            margin-left: ${settings.marginLeft}mm;
            margin-right: ${settings.marginRight}mm;
            ${buildHeaderFooterCss(settings)}
        }
        ${buildFirstPageMarginCss(settings)}
    `;

    const renderedScreenCss = `
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
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
                outline: 1px solid rgba(0, 0, 0, 0.15) !important;
                background-color: ${pageScreenBgColor} !important;
            }
            .pagedjs_sheet {
                box-shadow: none !important;
                outline: none !important;
            }
            .pagedjs_page {
                margin-bottom: 20px !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }
        }
    `;

    const screenCss = `
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
            .pagedjs_page,
            .pagedjs_sheet {
                background-color: ${pageScreenBgColor} !important;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
                outline: 1px solid rgba(0, 0, 0, 0.15) !important;
            }
            .pagedjs_page {
                margin-bottom: 20px !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }
        }
        @media print {
            body { background: white; }
        }
    `;

    const baseContentCss = `
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
        :root {
            --mdpdf-decoration-color: ${settings.decorationColor || '#000000'};
        }
        #content {
            font-family: ${resolvedFontFamily};
            font-size: ${settings.fontSize}pt;
            line-height: ${settings.lineHeight};
            --mdpdf-decoration-color: ${settings.decorationColor || '#000000'};
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
        /* Page break and vertical space flow directives */
        .mdpdf-pagebreak {
            break-before: page;
            page-break-before: always;
            display: block;
            height: 0;
        }
        .mdpdf-vspace {
            display: block;
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
        .tabs-bar::-webkit-scrollbar { display: none; }
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
        .tabs-bar-btn.active {
            color: var(--accent, #0969da);
            border-bottom-color: var(--accent, #0969da);
        }
        .tab { display: none; padding: 1.25rem 1.5rem; }
        .tab.active { display: block; }
        .tabs:not([data-js]) .tab { display: block; }
        .tabs:not([data-js]) .tab + .tab { border-top: 1px solid var(--border-subtle, #d8dee4); }
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
        .smiles-render canvas,
        .smiles-render img {
            display: block;
            margin: auto;
            max-width: 100%;
            height: auto;
        }
    `;

    const rendererRuntimeJs = `
        const existingPagedBefore = window.PagedConfig && window.PagedConfig.before;
        function initTabs() {
            document.querySelectorAll('.tabs').forEach(function(tabs) {
                tabs.setAttribute('data-js', '1');
                const panels = tabs.querySelectorAll(':scope > .tab');
                if (!panels.length) return;
                const existingBar = tabs.querySelector(':scope > .tabs-bar');
                if (existingBar) existingBar.remove();
                const bar = document.createElement('div');
                bar.className = 'tabs-bar';
                panels.forEach(function(panel, index) {
                    const label = panel.getAttribute('data-label') || 'Tab ' + (index + 1);
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'tabs-bar-btn' + (index === 0 ? ' active' : '');
                    button.textContent = label;
                    button.addEventListener('click', function() {
                        tabs.querySelectorAll('.tabs-bar-btn').forEach(function(btn) { btn.classList.remove('active'); });
                        panels.forEach(function(item) { item.classList.remove('active'); });
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
                window.mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'default' });
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
            if (!canvases.length || !window.SmilesDrawer || typeof window.SmilesDrawer.parse !== 'function' || typeof window.SmilesDrawer.Drawer !== 'function') {
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
                    freshCanvas.id = canvas.id || ('smiles-canvas-' + index);
                    canvas.replaceWith(freshCanvas);
                    const drawer = new window.SmilesDrawer.Drawer({ width: freshCanvas.width, height: freshCanvas.height });
                    window.SmilesDrawer.parse(smiles, function(tree) {
                        try {
                            drawer.draw(tree, freshCanvas.id, 'light', false);
                            requestAnimationFrame(function() {
                                requestAnimationFrame(function() {
                                    try {
                                        const image = document.createElement('img');
                                        image.src = freshCanvas.toDataURL();
                                        image.alt = 'SMILES structure';
                                        image.width = freshCanvas.width;
                                        image.height = freshCanvas.height;
                                        freshCanvas.replaceWith(image);
                                    } catch (error) {
                                        console.error('SMILES snapshot error:', error);
                                    }
                                    resolve();
                                });
                            });
                        } catch (error) {
                            console.error('SMILES draw error:', error);
                            resolve();
                        }
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
                // Wait for fonts with a 3 s timeout; Google Fonts can be slow
                // in VS Code's webview and would otherwise block paged.js indefinitely.
                await Promise.race([
                    document.fonts.ready,
                    new Promise(function(resolve) { setTimeout(resolve, 3000); }),
                ]);
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
    const pageNumberRuntimeJs = buildPageNumberRuntimeJs(settings);
    const preBodyMarginRuntimeJs = buildPreBodyMarginRuntimeJs(settings);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="${KATEX_CSS_CDN}">
${fontPresetLinks}
${headingFontPresetLinks}
<style>
body {
    font-family: ${resolvedFontFamily};
    font-size: ${settings.fontSize}pt;
    line-height: ${settings.lineHeight};
    color: #000;
    margin: 0;
}
${pageCss}
${screenCss}
${baseContentCss}
/* hljs css */
${HLJS_CSS}
${headingFontCss}
/* common css */
${commonCss}
/* default css */
${defaultCss}
${resolvedThemeCss ? `/* theme css */\n${resolvedThemeCss}` : ''}
${pageBackgroundCss ? `/* page background */\n${pageBackgroundCss}` : ''}
${settings.customCss ? `/* custom css */\n${settings.customCss}` : ''}
</style>
</head>
<body>
<div id="content" class="markdown-body">${contentHtml}</div>
${rendererScripts}
<script>
${rendererRuntimeJs}
</script>
<script src="${pagedJsUrl}"><\/script>
<script>
if (window.PagedPolyfill) {
    window.PagedPolyfill.on('rendered', function() {
        ${pageNumberRuntimeJs}
        ${preBodyMarginRuntimeJs}
        if (window.matchMedia('screen').matches) {
            const previewStyle = document.createElement('style');
            previewStyle.textContent = ${JSON.stringify(renderedScreenCss)};
            document.head.appendChild(previewStyle);
        }
        window.__pagedRendered = true;
        var renderMessage = { type: 'paged-rendered', token: (new URLSearchParams(location.search)).get('t') };
        [0, 150, 500, 1200].forEach(function(delay) {
            setTimeout(function() {
                try { window.parent.postMessage(renderMessage, '*'); } catch (error) {}
            }, delay);
        });
    });
}
</script>
</body>
</html>`;
}

module.exports = {
    CORE_DEFAULT_SETTINGS,
    generatePagedHtml,
    PAGEDJS_CDN,
};
