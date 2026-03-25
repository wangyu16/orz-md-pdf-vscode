/**
 * convert.js — Generate a PDF from a markdown file using Puppeteer
 *
 * This uses the SAME template as the preview server, so the PDF output
 * exactly matches the browser preview.
 *
 * Usage: node src/convert.js [input.md] [output.pdf]
 *   Default input:  test/sample.md
 *   Default output: out/output.pdf
 *
 * Requires: Google Chrome / Chromium installed on the system.
 * Detected automatically; override with CHROMIUM_PATH env variable.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { parseMarkdown } = require('./parse');
const { generatePagedHtml, DEFAULT_SETTINGS } = require('./template');
const { extractDocumentSettings, stripMetadataScripts, transformNymlDocument } = require('./document-settings');
const { loadThemeCss } = require('./theme-loader');
const { resolveDocumentTemplate } = require('./templates');

// Local pagedjs polyfill path — served as a file:// URL to Puppeteer.
// This ensures Puppeteer uses the same pinned polyfill version as the preview server,
// with no network dependency and no CDN latency.
// Use path.join from the package root (dist/ is not in exports map).
const PAGEDJS_LOCAL_PATH = path.join(
    path.dirname(require.resolve('pagedjs')),
    '../dist/paged.polyfill.js'
);
const PAGEDJS_FILE_URL = `file://${PAGEDJS_LOCAL_PATH}`;
const MERMAID_FILE_URL = `file://${require.resolve('mermaid/dist/mermaid.min.js')}`;
const SMILES_DRAWER_FILE_URL = `file://${require.resolve('smiles-drawer/dist/smiles-drawer.min.js')}`;

// Chromium detection — ordered by priority
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
    for (const p of CHROMIUM_CANDIDATES) {
        if (fs.existsSync(p)) return p;
    }
    throw new Error(
        'No Chromium/Chrome found. Install Google Chrome or set the CHROMIUM_PATH environment variable.'
    );
}

/**
 * Wait for paged.js to finish layout inside the page.
 * paged.js sets window.__pagedRendered = true in the 'rendered' callback.
 * We poll with a timeout.
 */
async function waitForPagedJs(page, timeoutMs = 30000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const done = await page.evaluate(() => !!window.__pagedRendered);
        if (done) return;
        await new Promise(r => setTimeout(r, 200));
    }
    throw new Error(`paged.js did not finish rendering within ${timeoutMs}ms`);
}

/**
 * Convert a markdown file to PDF.
 *
 * @param {string} inputMd   Path to the source markdown file
 * @param {string} outputPdf Path for the PDF output
 * @param {object} settings  Page settings (merged with defaults)
 * @returns {Promise<void>}
 */
async function convertToPdf(inputMd, outputPdf, settings = {}) {
    // Parse markdown → HTML fragment
    console.log(`[convert] Parsing markdown: ${inputMd}`);
    const source = fs.readFileSync(inputMd, 'utf8');
    const parsedHtml = await parseMarkdown(source);
    const extractedSettings = extractDocumentSettings(parsedHtml);
    const resolvedTemplate = resolveDocumentTemplate(extractedSettings.documentTemplate || settings.documentTemplate);
    const mergedSettings = Object.assign(
        {},
        DEFAULT_SETTINGS,
        resolvedTemplate ? resolvedTemplate.settings : {},
        extractedSettings,
        settings
    );
    const transformed = await transformNymlDocument(parsedHtml);
    const contentHtml = `${transformed.preBodyHtml}${stripMetadataScripts(transformed.bodyHtml)}`;

    const themeCSS = loadThemeCss(mergedSettings.theme);
    const mergedThemeCss = [themeCSS, resolvedTemplate?.cssText].filter(Boolean).join('\n\n');

    // Build the complete paged.js HTML document
    // Supply the local file:// pagedjs URL so Puppeteer loads it from disk.
    const pageHtml = generatePagedHtml(contentHtml, mergedSettings, mergedThemeCss || null, PAGEDJS_FILE_URL, {
        mermaidUrl: MERMAID_FILE_URL,
        smilesDrawerUrl: SMILES_DRAWER_FILE_URL,
    });

    // Write temporary HTML file so Puppeteer can load it via file:// URL
    // (avoids CSP issues with data: URLs and allows relative asset resolution)
    const tmpHtml = path.join(path.dirname(outputPdf), '.tmp-paged.html');
    fs.mkdirSync(path.dirname(outputPdf), { recursive: true });
    fs.writeFileSync(tmpHtml, pageHtml, 'utf8');

    const executablePath = findChromium();
    console.log(`[convert] Using Chromium: ${executablePath}`);

    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--allow-file-access-from-files',  // allow file:// → file:// for pagedjs
        ],
    });

    try {
        const page = await browser.newPage();

        // Grant filesystem access and load the temp HTML
        await page.goto(`file://${tmpHtml}`, { waitUntil: 'networkidle0', timeout: 30000 });

        // Wait for paged.js to finish layout
        console.log('[convert] Waiting for paged.js to finish layout...');
        await waitForPagedJs(page, 30000);
        console.log('[convert] paged.js layout complete.');

        // Print to PDF using CSS page size (respects @page { size: A4 })
        await page.pdf({
            path: outputPdf,
            printBackground: true,
            preferCSSPageSize: true,
        });

        console.log(`✓ PDF written to ${outputPdf}`);
    } finally {
        await browser.close();
        // Clean up temp file
        try { fs.unlinkSync(tmpHtml); } catch { /* ignore */ }
    }
}

module.exports = { convertToPdf };

// CLI: node src/convert.js [input.md] [output.pdf]
if (require.main === module) {
    const inputMd = path.resolve(process.argv[2] || path.join(__dirname, '../test/sample.md'));
    const outputPdf = path.resolve(process.argv[3] || path.join(__dirname, '../out/output.pdf'));

    convertToPdf(inputMd, outputPdf).catch(err => {
        console.error('Conversion error:', err.message);
        process.exit(1);
    });
}
