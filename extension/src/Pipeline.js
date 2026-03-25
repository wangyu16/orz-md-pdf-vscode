'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');

// Resolve unified pipeline paths relative to the bundled extension runtime.
// At runtime `__dirname` is extension/dist, while the pipeline sources live
// under extension/src/pipeline and dependencies live under extension/node_modules.
const EXTENSION_ROOT = path.resolve(__dirname, '..');
const PIPELINE_ROOT = path.resolve(__dirname, '../src/pipeline');

function resolvePipelinePackageDir(packageName) {
    const packageEntryPath = require.resolve(packageName, {
        paths: [EXTENSION_ROOT, __dirname],
    });
    return path.dirname(packageEntryPath);
}

const { parseMarkdown }           = require(path.join(PIPELINE_ROOT, 'parse'));
const { extractDocumentSettings } = require(path.join(PIPELINE_ROOT, 'config/settings-normalize'));
const { mergeCoreSettings }       = require(path.join(PIPELINE_ROOT, 'config/merge-settings'));
const { resolveTemplateSettings } = require(path.join(PIPELINE_ROOT, 'config/templates-registry'));
const { stripMetadataScripts }    = require(path.join(PIPELINE_ROOT, 'nyml/extract'));
const { processFlowDirectives }   = require(path.join(PIPELINE_ROOT, 'nyml/flow-directives'));
const { processElements }         = require(path.join(PIPELINE_ROOT, 'nyml/elements'));
const { generatePagedHtml }       = require(path.join(PIPELINE_ROOT, 'render/page-template'));

// Absolute paths to bundled library files (served to webview or Puppeteer via file://).
// These packages are installed under the top-level extension package.
const PAGEDJS_LOCAL_PATH = path.join(resolvePipelinePackageDir('pagedjs'), '../dist/paged.polyfill.js');
const MERMAID_LOCAL_PATH = require.resolve('mermaid/dist/mermaid.min.js', {
    paths: [EXTENSION_ROOT, __dirname],
});
const SMILES_DRAWER_LOCAL_PATH = require.resolve('smiles-drawer/dist/smiles-drawer.min.js', {
    paths: [EXTENSION_ROOT, __dirname],
});

// Chromium candidates (same list as convert.js).
const CHROMIUM_CANDIDATES = [
    process.env.CHROMIUM_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/local/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);

function findChromium() {
    for (const candidate of CHROMIUM_CANDIDATES) {
        if (fs.existsSync(candidate)) return candidate;
    }
    throw new Error('No Chromium/Chrome found. Install Chrome or set the CHROMIUM_PATH environment variable.');
}

/**
 * Parse markdown and extract settings — shared between preview and PDF builds.
 * @param {string} markdown
 * @returns {Promise<{ contentHtml: string, settings: object }>}
 */
async function _buildContent(markdown) {
    const parsedHtml = await parseMarkdown(markdown);
    const extractedSettings = extractDocumentSettings(parsedHtml);
    const templateSettings = resolveTemplateSettings(extractedSettings.template);
    const settings = mergeCoreSettings(templateSettings, extractedSettings);
    const contentHtml = stripMetadataScripts(processElements(processFlowDirectives(parsedHtml), settings));
    return { contentHtml, settings };
}

/**
 * Build the full paged HTML document for the webview (initial load).
 * Asset URLs are converted to webview URIs via the provided `asWebviewUri` fn.
 *
 * @param {string} markdown
 * @param {(absPath: string) => string} asWebviewUri  - maps abs fs path → webview-safe URL
 * @returns {Promise<string>} full HTML string
 */
async function buildPreviewHtml(markdown, asWebviewUri) {
    const { contentHtml, settings } = await _buildContent(markdown);
    return generatePagedHtml(contentHtml, settings, null, asWebviewUri(PAGEDJS_LOCAL_PATH), {
        mermaidUrl:      asWebviewUri(MERMAID_LOCAL_PATH),
        smilesDrawerUrl: asWebviewUri(SMILES_DRAWER_LOCAL_PATH),
    });
}

/**
 * Build only the inner content HTML fragment (no <html>/<head>/<body> wrapper).
 * Used for incremental webview updates via postMessage.
 *
 * @param {string} markdown
 * @returns {Promise<{ contentHtml: string, settings: object }>}
 */
async function buildContentFragment(markdown) {
    return _buildContent(markdown);
}

/**
 * Run the full Puppeteer pipeline and return raw PDF bytes (Uint8Array).
 * Images at local paths should be resolved to data URIs before calling this.
 *
 * @param {string} markdown
 * @param {vscode.Uri} documentUri  - used for temporary file placement
 * @returns {Promise<Uint8Array>}
 */
async function buildPdf(markdown, documentUri) {
    // Lazy require puppeteer so it is not loaded during normal preview usage.
    const puppeteer = require('puppeteer-core');

    const { contentHtml, settings } = await _buildContent(markdown);
    const pageHtml = generatePagedHtml(contentHtml, settings, null, `file://${PAGEDJS_LOCAL_PATH}`, {
        mermaidUrl:      `file://${MERMAID_LOCAL_PATH}`,
        smilesDrawerUrl: `file://${SMILES_DRAWER_LOCAL_PATH}`,
    });

    const tmpDir = os.tmpdir();
    const tmpHtml = path.join(tmpDir, `mdpdf-${Date.now()}.html`);
    fs.writeFileSync(tmpHtml, pageHtml, 'utf8');

    const browser = await puppeteer.launch({
        executablePath: findChromium(),
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'],
    });

    try {
        const page = await browser.newPage();
        await page.goto(`file://${tmpHtml}`, { waitUntil: 'networkidle0', timeout: 60000 });

        // Wait for paged.js to finish rendering.
        const deadline = Date.now() + 60000;
        while (Date.now() < deadline) {
            const done = await page.evaluate(() => !!window.__pagedRendered);
            if (done) break;
            await new Promise((r) => setTimeout(r, 200));
        }

        const pdfBuffer = await page.pdf({ printBackground: true, preferCSSPageSize: true });
        return new Uint8Array(pdfBuffer);
    } finally {
        await browser.close();
        try { fs.unlinkSync(tmpHtml); } catch {}
    }
}

module.exports = {
    Pipeline: { buildPreviewHtml, buildContentFragment, buildPdf },
    PAGEDJS_LOCAL_PATH,
    MERMAID_LOCAL_PATH,
    SMILES_DRAWER_LOCAL_PATH,
};
