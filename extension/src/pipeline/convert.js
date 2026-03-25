'use strict';

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const { parseMarkdown } = require('./parse');
const { extractDocumentSettings } = require('./config/settings-normalize');
const { mergeCoreSettings } = require('./config/merge-settings');
const { resolveTemplateSettings } = require('./config/templates-registry');
const { stripMetadataScripts } = require('./nyml/extract');
const { processFlowDirectives } = require('./nyml/flow-directives');
const { processElements } = require('./nyml/elements');
const { generatePagedHtml } = require('./render/page-template');

const PAGEDJS_LOCAL_PATH = path.join(path.dirname(require.resolve('pagedjs')), '../dist/paged.polyfill.js');
const PAGEDJS_FILE_URL = `file://${PAGEDJS_LOCAL_PATH}`;
const MERMAID_FILE_URL = `file://${require.resolve('mermaid/dist/mermaid.min.js')}`;
const SMILES_DRAWER_FILE_URL = `file://${require.resolve('smiles-drawer/dist/smiles-drawer.min.js')}`;

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
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    throw new Error('No Chromium/Chrome found. Install Chrome or set CHROMIUM_PATH.');
}

async function waitForPagedJs(page, timeoutMs = 30000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const done = await page.evaluate(() => !!window.__pagedRendered);
        if (done) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
    }

    throw new Error(`paged.js did not finish rendering within ${timeoutMs}ms`);
}

async function convertToPdf(inputMd, outputPdf, settings = {}) {
    const source = fs.readFileSync(inputMd, 'utf8');
    const parsedHtml = await parseMarkdown(source);
    const extractedSettings = extractDocumentSettings(parsedHtml);
    const templateSettings = resolveTemplateSettings(extractedSettings.template);
    const mergedSettings = mergeCoreSettings(templateSettings, extractedSettings, settings);
    const contentHtml = stripMetadataScripts(processElements(processFlowDirectives(parsedHtml), mergedSettings));
    const pageHtml = generatePagedHtml(contentHtml, mergedSettings, null, PAGEDJS_FILE_URL, {
        mermaidUrl: MERMAID_FILE_URL,
        smilesDrawerUrl: SMILES_DRAWER_FILE_URL,
    });

    const tmpHtml = path.join(path.dirname(outputPdf), '.tmp-core-paged.html');
    fs.mkdirSync(path.dirname(outputPdf), { recursive: true });
    fs.writeFileSync(tmpHtml, pageHtml, 'utf8');

    const browser = await puppeteer.launch({
        executablePath: findChromium(),
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'],
    });

    try {
        const page = await browser.newPage();
        await page.goto(`file://${tmpHtml}`, { waitUntil: 'networkidle0', timeout: 30000 });
        await waitForPagedJs(page, 30000);
        await page.pdf({
            path: outputPdf,
            printBackground: true,
            preferCSSPageSize: true,
        });
        console.log(`PDF written to ${outputPdf}`);
    } finally {
        await browser.close();
        try {
            fs.unlinkSync(tmpHtml);
        } catch {
            // Ignore cleanup failures.
        }
    }
}

module.exports = { convertToPdf };

if (require.main === module) {
    const inputMd = path.resolve(process.argv[2] || path.join(__dirname, '../../../test/core-smoke.md'));
    const outputPdf = path.resolve(process.argv[3] || path.join(__dirname, '../../../out/core-smoke.pdf'));

    convertToPdf(inputMd, outputPdf).catch((error) => {
        console.error('Conversion error:', error.message);
        process.exit(1);
    });
}