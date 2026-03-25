"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/pipeline/embed.js
var require_embed = __commonJS({
  "src/pipeline/embed.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    var zlib = require("zlib");
    var { PDFDocument } = require("pdf-lib");
    async function embedMarkdownInPdf(pdfBytes, markdown) {
      const doc = await PDFDocument.load(pdfBytes);
      const encoded = Buffer.from(markdown, "utf8");
      await doc.attach(encoded, "source.md", {
        mimeType: "text/markdown",
        description: "Markdown source for this document",
        creationDate: /* @__PURE__ */ new Date(),
        modificationDate: /* @__PURE__ */ new Date()
      });
      return doc.save();
    }
    async function extractMarkdownFromPdf(pdfBytes) {
      const { PDFName, PDFDict, PDFArray } = require("pdf-lib");
      const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const catalog = doc.catalog;
      const namesDict = catalog.lookupMaybe(PDFName.of("Names"), PDFDict);
      if (!namesDict) return null;
      const embeddedFiles = namesDict.lookupMaybe(PDFName.of("EmbeddedFiles"), PDFDict);
      if (!embeddedFiles) return null;
      const namesArray = embeddedFiles.lookupMaybe(PDFName.of("Names"), PDFArray);
      if (!namesArray) return null;
      for (let index = 0; index + 1 < namesArray.size(); index += 2) {
        const nameObj = namesArray.lookup(index);
        const nameStr = nameObj.decodeText ? nameObj.decodeText() : nameObj.asString();
        if (nameStr !== "source.md") continue;
        const fileSpec = namesArray.lookup(index + 1, PDFDict);
        const efDict = fileSpec.lookupMaybe(PDFName.of("EF"), PDFDict);
        if (!efDict) return null;
        const fileStream = efDict.lookup(PDFName.of("F"));
        if (!fileStream) return null;
        const rawBytes = fileStream.getContents();
        const buffer = Buffer.from(rawBytes);
        if (buffer.length >= 2 && buffer[0] === 120) {
          return zlib.inflateSync(buffer).toString("utf8");
        }
        return buffer.toString("utf8");
      }
      return null;
    }
    module2.exports = { embedMarkdownInPdf, extractMarkdownFromPdf };
    if (require.main === module2) {
      const inputPdf = path.resolve(process.argv[2] || path.join(__dirname, "../../../out/core-smoke.pdf"));
      const inputMd = path.resolve(process.argv[3] || path.join(__dirname, "../../../test/core-smoke.md"));
      const outputMdPdf = path.resolve(process.argv[4] || path.join(__dirname, "../../../out/core-smoke.md.pdf"));
      (async () => {
        if (!fs.existsSync(inputPdf)) {
          console.error(`Input PDF not found: ${inputPdf}`);
          process.exit(1);
        }
        const pdfBytes = fs.readFileSync(inputPdf);
        const markdown = fs.readFileSync(inputMd, "utf8");
        const mdPdfBytes = await embedMarkdownInPdf(pdfBytes, markdown);
        fs.writeFileSync(outputMdPdf, mdPdfBytes);
        const extracted = await extractMarkdownFromPdf(mdPdfBytes);
        if (extracted !== markdown) {
          console.error("Round-trip failed: extracted markdown does not match original.");
          process.exit(1);
        }
        console.log(`Embedded markdown round-trip passed: ${outputMdPdf}`);
      })().catch((error) => {
        console.error("Embed error:", error.message);
        process.exit(1);
      });
    }
  }
});

// src/Pipeline.js
var require_Pipeline = __commonJS({
  "src/Pipeline.js"(exports2, module2) {
    "use strict";
    var path = require("path");
    var fs = require("fs");
    var os = require("os");
    var EXTENSION_ROOT = path.resolve(__dirname, "..");
    var PIPELINE_ROOT = path.resolve(__dirname, "../src/pipeline");
    function resolvePipelinePackageDir(packageName) {
      const packageEntryPath = require.resolve(packageName, {
        paths: [EXTENSION_ROOT, __dirname]
      });
      return path.dirname(packageEntryPath);
    }
    var { parseMarkdown } = require(path.join(PIPELINE_ROOT, "parse"));
    var { extractDocumentSettings } = require(path.join(PIPELINE_ROOT, "config/settings-normalize"));
    var { mergeCoreSettings } = require(path.join(PIPELINE_ROOT, "config/merge-settings"));
    var { resolveTemplateSettings } = require(path.join(PIPELINE_ROOT, "config/templates-registry"));
    var { stripMetadataScripts } = require(path.join(PIPELINE_ROOT, "nyml/extract"));
    var { processFlowDirectives } = require(path.join(PIPELINE_ROOT, "nyml/flow-directives"));
    var { processElements } = require(path.join(PIPELINE_ROOT, "nyml/elements"));
    var { generatePagedHtml } = require(path.join(PIPELINE_ROOT, "render/page-template"));
    var PAGEDJS_LOCAL_PATH = path.join(resolvePipelinePackageDir("pagedjs"), "../dist/paged.polyfill.js");
    var MERMAID_LOCAL_PATH = require.resolve("mermaid/dist/mermaid.min.js", {
      paths: [EXTENSION_ROOT, __dirname]
    });
    var SMILES_DRAWER_LOCAL_PATH = require.resolve("smiles-drawer/dist/smiles-drawer.min.js", {
      paths: [EXTENSION_ROOT, __dirname]
    });
    var CHROMIUM_CANDIDATES = [
      process.env.CHROMIUM_PATH,
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/usr/local/bin/chromium",
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    ].filter(Boolean);
    function findChromium() {
      for (const candidate of CHROMIUM_CANDIDATES) {
        if (fs.existsSync(candidate)) return candidate;
      }
      throw new Error("No Chromium/Chrome found. Install Chrome or set the CHROMIUM_PATH environment variable.");
    }
    async function _buildContent(markdown) {
      const parsedHtml = await parseMarkdown(markdown);
      const extractedSettings = extractDocumentSettings(parsedHtml);
      const templateSettings = resolveTemplateSettings(extractedSettings.template);
      const settings = mergeCoreSettings(templateSettings, extractedSettings);
      const contentHtml = stripMetadataScripts(processElements(processFlowDirectives(parsedHtml), settings));
      return { contentHtml, settings };
    }
    async function buildPreviewHtml(markdown, asWebviewUri) {
      const { contentHtml, settings } = await _buildContent(markdown);
      return generatePagedHtml(contentHtml, settings, null, asWebviewUri(PAGEDJS_LOCAL_PATH), {
        mermaidUrl: asWebviewUri(MERMAID_LOCAL_PATH),
        smilesDrawerUrl: asWebviewUri(SMILES_DRAWER_LOCAL_PATH)
      });
    }
    async function buildContentFragment(markdown) {
      return _buildContent(markdown);
    }
    async function buildPdf(markdown, documentUri) {
      const puppeteer = require("puppeteer-core");
      const { contentHtml, settings } = await _buildContent(markdown);
      const pageHtml = generatePagedHtml(contentHtml, settings, null, `file://${PAGEDJS_LOCAL_PATH}`, {
        mermaidUrl: `file://${MERMAID_LOCAL_PATH}`,
        smilesDrawerUrl: `file://${SMILES_DRAWER_LOCAL_PATH}`
      });
      const tmpDir = os.tmpdir();
      const tmpHtml = path.join(tmpDir, `mdpdf-${Date.now()}.html`);
      fs.writeFileSync(tmpHtml, pageHtml, "utf8");
      const browser = await puppeteer.launch({
        executablePath: findChromium(),
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--allow-file-access-from-files"]
      });
      try {
        const page = await browser.newPage();
        await page.goto(`file://${tmpHtml}`, { waitUntil: "networkidle0", timeout: 6e4 });
        const deadline = Date.now() + 6e4;
        while (Date.now() < deadline) {
          const done = await page.evaluate(() => !!window.__pagedRendered);
          if (done) break;
          await new Promise((r) => setTimeout(r, 200));
        }
        const pdfBuffer = await page.pdf({ printBackground: true, preferCSSPageSize: true });
        return new Uint8Array(pdfBuffer);
      } finally {
        await browser.close();
        try {
          fs.unlinkSync(tmpHtml);
        } catch {
        }
      }
    }
    module2.exports = {
      Pipeline: { buildPreviewHtml, buildContentFragment, buildPdf },
      PAGEDJS_LOCAL_PATH,
      MERMAID_LOCAL_PATH,
      SMILES_DRAWER_LOCAL_PATH
    };
  }
});

// src/MdPdfDocument.js
var require_MdPdfDocument = __commonJS({
  "src/MdPdfDocument.js"(exports2, module2) {
    "use strict";
    var vscode2 = require("vscode");
    var path = require("path");
    var { embedMarkdownInPdf, extractMarkdownFromPdf } = require_embed();
    var { Pipeline } = require_Pipeline();
    var WELCOME_MARKDOWN = `{{nyml
kind: document
page_size: A4
font_preset: noto-serif
}}

# Welcome

Start editing your document here.
`;
    var MdPdfDocument = class _MdPdfDocument {
      /**
       * @param {vscode.Uri} uri
       * @param {string} markdown  - current (edited) markdown source
       * @param {Uint8Array} savedBytes  - bytes of the most recently persisted .md.pdf
       */
      constructor(uri, markdown, savedBytes) {
        this.uri = uri;
        this.markdown = markdown;
        this._persistedMarkdown = markdown;
        this._savedBytes = savedBytes;
        this._onDidDisposeEmitter = new vscode2.EventEmitter();
        this.onDidDispose = this._onDidDisposeEmitter.event;
      }
      /**
       * Called by VS Code when all editors for this document are closed.
       */
      dispose() {
        this._onDidDisposeEmitter.fire();
        this._onDidDisposeEmitter.dispose();
      }
      /**
       * Factory: called by VS Code when a .md.pdf file is first opened.
       * @param {vscode.Uri} uri
       * @param {{ backupId?: string }} openContext
       * @param {vscode.CancellationToken} _token
       * @returns {Promise<MdPdfDocument>}
       */
      static async create(uri, openContext, _token) {
        if (openContext.backupId) {
          const backupUri = vscode2.Uri.parse(openContext.backupId);
          try {
            const backupBytes = await vscode2.workspace.fs.readFile(backupUri);
            const markdown2 = Buffer.from(backupBytes).toString("utf8");
            const fileBytes2 = await _MdPdfDocument._readFileSafe(uri);
            return new _MdPdfDocument(uri, markdown2, fileBytes2);
          } catch {
          }
        }
        const fileBytes = await _MdPdfDocument._readFileSafe(uri);
        let markdown = null;
        if (fileBytes && fileBytes.length > 4) {
          try {
            markdown = await extractMarkdownFromPdf(fileBytes);
          } catch {
            markdown = null;
          }
        }
        if (!markdown) {
          markdown = WELCOME_MARKDOWN;
        }
        return new _MdPdfDocument(uri, markdown, fileBytes || new Uint8Array(0));
      }
      /**
       * @param {vscode.Uri} uri
       * @returns {Promise<Uint8Array | null>}
       */
      static async _readFileSafe(uri) {
        try {
          return await vscode2.workspace.fs.readFile(uri);
        } catch {
          return null;
        }
      }
      /**
       * Save to `uri` (or this.uri if same).
       * Runs the full PDF pipeline then re-embeds the markdown source.
       * @param {vscode.Uri} destination
       * @param {vscode.CancellationToken} _token
       */
      async save(destination, _token) {
        const bytes = await this._buildMdPdfBytes(this.markdown);
        await vscode2.workspace.fs.writeFile(destination, bytes);
        this._savedBytes = bytes;
        this._persistedMarkdown = this.markdown;
      }
      /**
       * Revert to the on-disk version.
       * @param {vscode.CancellationToken} _token
       */
      async revert(_token) {
        const fileBytes = await _MdPdfDocument._readFileSafe(this.uri);
        if (!fileBytes) return;
        let markdown = null;
        try {
          markdown = await extractMarkdownFromPdf(fileBytes);
        } catch {
        }
        this.markdown = markdown || WELCOME_MARKDOWN;
        this._persistedMarkdown = this.markdown;
        this._savedBytes = fileBytes;
      }
      /**
       * Write a crash-recovery backup (just the markdown text).
       * @param {vscode.Uri} destination
       * @param {vscode.CancellationToken} _token
       * @returns {Promise<vscode.CustomDocumentBackup>}
       */
      async backup(destination, _token) {
        const mdBytes = Buffer.from(this.markdown, "utf8");
        await vscode2.workspace.fs.writeFile(destination, mdBytes);
        return {
          id: destination.toString(),
          delete: async () => {
            try {
              await vscode2.workspace.fs.delete(destination);
            } catch {
            }
          }
        };
      }
      /**
       * Build the full .md.pdf bytes for a given markdown string.
       * The original (unresolved) markdown is embedded so that relative
       * image paths remain portable.
       * @param {string} markdown
       * @returns {Promise<Uint8Array>}
       */
      async _buildMdPdfBytes(markdown) {
        const pdfBytes = await Pipeline.buildPdf(markdown, this.uri);
        const embedded = await embedMarkdownInPdf(Buffer.from(pdfBytes), markdown);
        return new Uint8Array(embedded);
      }
      /**
       * Public accessor for building the PDF bytes from the current markdown,
       * used by the export command (which may apply image resolution first).
       * @param {string} markdown - may differ from this.markdown (e.g., images already resolved)
       * @returns {Promise<Uint8Array>} - pure PDF bytes (no embedded source)
       */
      async buildPurePdf(markdown) {
        return Pipeline.buildPdf(markdown, this.uri);
      }
      isDirty() {
        return this.markdown !== this._persistedMarkdown;
      }
    };
    module2.exports = { MdPdfDocument, WELCOME_MARKDOWN };
  }
});

// src/VirtualDocProvider.js
var require_VirtualDocProvider = __commonJS({
  "src/VirtualDocProvider.js"(exports2, module2) {
    "use strict";
    var vscode2 = require("vscode");
    var crypto = require("crypto");
    var fs = require("fs");
    var path = require("path");
    var os = require("os");
    var VirtualDocProvider2 = class {
      constructor() {
        this._tempFiles = /* @__PURE__ */ new Map();
        this._mdPdfUrisByTempUri = /* @__PURE__ */ new Map();
      }
      /**
       * Get (or create) the temp .md file path for a given .md.pdf document.
       * Writes the current markdown content to the file.
       *
       * @param {vscode.Uri} mdPdfUri
       * @param {string} markdown
       * @returns {vscode.Uri} URI of the writable temp .md file
       */
      getOrCreateTempFile(mdPdfUri, markdown) {
        const key = mdPdfUri.fsPath;
        let tempPath = this._tempFiles.get(key);
        if (!tempPath) {
          const base = path.basename(mdPdfUri.fsPath, ".md.pdf");
          const hash = crypto.createHash("md5").update(key).digest("hex").slice(0, 8);
          tempPath = path.join(os.tmpdir(), `mdpdf-${base}-${hash}.md`);
          this._tempFiles.set(key, tempPath);
        }
        fs.writeFileSync(tempPath, markdown, "utf8");
        const tempUri = vscode2.Uri.file(tempPath);
        this._mdPdfUrisByTempUri.set(tempUri.toString(), mdPdfUri);
        return tempUri;
      }
      /**
       * Overwrite the temp file with new content (used on revert).
       * @param {vscode.Uri} mdPdfUri
       * @param {string} markdown
       */
      updateTempFile(mdPdfUri, markdown) {
        const tempPath = this._tempFiles.get(mdPdfUri.fsPath);
        if (tempPath) {
          fs.writeFileSync(tempPath, markdown, "utf8");
        }
      }
      /**
       * Get the temp file URI for a .md.pdf URI (returns null if not yet created).
       * @param {vscode.Uri} mdPdfUri
       * @returns {vscode.Uri | null}
       */
      getTempUri(mdPdfUri) {
        const tempPath = this._tempFiles.get(mdPdfUri.fsPath);
        return tempPath ? vscode2.Uri.file(tempPath) : null;
      }
      /**
       * Find the owning .md.pdf URI for an open temp markdown URI.
       * @param {vscode.Uri} tempUri
       * @returns {vscode.Uri | null}
       */
      getMdPdfUri(tempUri) {
        return this._mdPdfUrisByTempUri.get(tempUri.toString()) || null;
      }
      /**
       * Delete the temp file and remove the entry.
       * @param {vscode.Uri} mdPdfUri
       */
      delete(mdPdfUri) {
        const tempPath = this._tempFiles.get(mdPdfUri.fsPath);
        if (tempPath) {
          this._mdPdfUrisByTempUri.delete(vscode2.Uri.file(tempPath).toString());
          try {
            fs.unlinkSync(tempPath);
          } catch {
          }
          this._tempFiles.delete(mdPdfUri.fsPath);
        }
      }
      /**
       * @deprecated kept for call-site compatibility during transition
       * No-op — temp files do not need a separate "set" step.
       */
      set() {
      }
      dispose() {
        for (const [, tempPath] of this._tempFiles) {
          this._mdPdfUrisByTempUri.delete(vscode2.Uri.file(tempPath).toString());
          try {
            fs.unlinkSync(tempPath);
          } catch {
          }
        }
        this._tempFiles.clear();
        this._mdPdfUrisByTempUri.clear();
      }
    };
    module2.exports = { VirtualDocProvider: VirtualDocProvider2 };
  }
});

// src/PreviewServer.js
var require_PreviewServer = __commonJS({
  "src/PreviewServer.js"(exports2, module2) {
    "use strict";
    var http = require("http");
    var fs = require("fs");
    var PreviewServer = class {
      /**
       * @param {{ routeToFilePath: Record<string, string> }} options
       */
      constructor(options) {
        this._routeToFilePath = options.routeToFilePath;
        this._contentHtml = "<!DOCTYPE html><html><body></body></html>";
        this._server = null;
        this._origin = null;
      }
      async start() {
        if (this._server) {
          return;
        }
        this._server = http.createServer((req, res) => this._handleRequest(req, res));
        await new Promise((resolve, reject) => {
          this._server.once("error", reject);
          this._server.listen(0, "127.0.0.1", () => {
            this._server.off("error", reject);
            const address = this._server.address();
            this._origin = `http://localhost:${address.port}`;
            resolve();
          });
        });
      }
      get origin() {
        return this._origin;
      }
      get port() {
        if (!this._server) return null;
        const address = this._server.address();
        return address ? address.port : null;
      }
      setContentHtml(html) {
        this._contentHtml = html;
      }
      getAssetPath(filePath) {
        for (const [routePath, assetFilePath] of Object.entries(this._routeToFilePath)) {
          if (assetFilePath === filePath) {
            return routePath;
          }
        }
        throw new Error(`Unknown preview asset: ${filePath}`);
      }
      async dispose() {
        if (!this._server) {
          return;
        }
        const server = this._server;
        this._server = null;
        this._origin = null;
        await new Promise((resolve) => {
          server.close(() => resolve());
        });
      }
      _handleRequest(req, res) {
        const requestPath = new URL(req.url, "http://127.0.0.1").pathname;
        try {
          if (requestPath === "/") {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
            res.end(this._buildShellHtml());
            return;
          }
          if (requestPath === "/content") {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
            res.end(this._contentHtml);
            return;
          }
          const assetFilePath = this._routeToFilePath[requestPath];
          if (assetFilePath) {
            res.writeHead(200, {
              "Content-Type": requestPath.endsWith(".css") ? "text/css; charset=utf-8" : "application/javascript; charset=utf-8",
              "Cache-Control": "no-store"
            });
            fs.createReadStream(assetFilePath).pipe(res);
            return;
          }
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Not found");
        } catch (error) {
          res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
          res.end(error.stack || error.message || String(error));
        }
      }
      _buildShellHtml() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MD-PDF Preview Shell</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #525659; overflow: hidden; }
  #frame-container { position: relative; width: 100%; height: 100vh; }
  .preview-frame { display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; background: #525659; }
  #status { position: fixed; top: 8px; right: 12px; font: 11px/1 monospace; color: #aaa; z-index: 10; pointer-events: none; }
  #export-btn {
    position: fixed; bottom: 16px; right: 16px; z-index: 20;
    background: rgba(30,30,30,0.82); color: #ccc;
    border: 1px solid #555; border-radius: 5px;
    padding: 6px 14px; font: 12px/1.5 sans-serif;
    cursor: pointer; user-select: none;
  }
  #export-btn:hover { background: rgba(70,70,70,0.95); color: #fff; border-color: #888; }
</style>
</head>
<body>
<div id="status">loading...</div>
<button id="export-btn" title="Export as PDF" onclick="window.parent.postMessage({type:'export-pdf'},'*')">&#8595; Export PDF</button>
<div id="frame-container">
  <iframe id="frame-a" class="preview-frame" style="z-index:1" src="/content" title="Paged Preview"></iframe>
  <iframe id="frame-b" class="preview-frame" style="z-index:0" title="Paged Preview (buffer)"></iframe>
</div>
<script>
(function () {
    var frameA = document.getElementById('frame-a');
    var frameB = document.getElementById('frame-b');
    var status = document.getElementById('status');

    // activeFrame is the currently visible frame; hiddenFrame pre-loads the next render.
    var activeFrame = frameA;
    var hiddenFrame = frameB;
    var savedScrollPosition = 0;

    // expectedToken: the ?t= value of the currently-loading hidden frame.
    // null means no update is in progress (idle / initial load).
    // Using a token instead of e.source comparison because VS Code's sandboxed
    // webview environment does not reliably propagate e.source across iframe boundaries.
    var expectedToken = null;

    function saveScrollPosition() {
        try {
            var doc = activeFrame.contentDocument;
            savedScrollPosition = doc.documentElement.scrollTop || doc.body.scrollTop || 0;
        } catch (e) {
            savedScrollPosition = 0;
        }
    }

    function restoreScrollPosition(frame) {
        try {
            var doc = frame.contentDocument;
            doc.documentElement.scrollTop = savedScrollPosition;
            doc.body.scrollTop = savedScrollPosition;
        } catch (e) {}
    }

    function swapFrames() {
        // Restore scroll in the just-rendered frame before revealing it.
        restoreScrollPosition(hiddenFrame);

        // Bring the rendered frame to the front using z-index.
        // Both frames stay display:block so paged.js can compute real dimensions.
        hiddenFrame.style.zIndex = '1';
        activeFrame.style.zIndex = '0';

        var tmp = activeFrame;
        activeFrame = hiddenFrame;
        hiddenFrame = tmp;

        status.textContent = 'ready';
        try { window.parent.postMessage({ type: 'paged-rendered' }, '*'); } catch (e) {}
    }

    function reloadContent() {
        saveScrollPosition();
        status.textContent = 'rendering...';
        // Stamp the URL with a unique token; the content page echoes it back in
        // the paged-rendered message so we can identify this exact load.
        expectedToken = String(Date.now());
        hiddenFrame.src = '/content?t=' + expectedToken;
    }

    window.addEventListener('message', function (e) {
        if (!e.data) return;

        if (e.data.type === 'paged-rendered') {
            var token = e.data.token || null;
            if (expectedToken !== null && token === expectedToken) {
                // The hidden frame we requested has finished rendering \u2014 swap it in.
                expectedToken = null;
                swapFrames();
            } else if (expectedToken === null && token === null) {
                // No update pending: the initial active-frame load just finished.
                status.textContent = 'ready';
                try { window.parent.postMessage({ type: 'paged-rendered' }, '*'); } catch (err) {}
            }
            // else: stale event from a superseded load \u2014 ignore.
            return;
        }

        if (e.data.type === 'mdpdf-reload') {
            reloadContent();
        }
    });

    // Show 'paginating\u2026' while paged.js is laying out the initial frame.
    frameA.addEventListener('load', function () {
        if (expectedToken === null) {
            status.textContent = 'paginating...';
        }
    });
})();
</script>
</body>
</html>`;
      }
    };
    module2.exports = { PreviewServer };
  }
});

// src/ImageResolver.js
var require_ImageResolver = __commonJS({
  "src/ImageResolver.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    var vscode2 = require("vscode");
    var MIME_MAP = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".bmp": "image/bmp",
      ".ico": "image/x-icon",
      ".tiff": "image/tiff",
      ".tif": "image/tiff"
    };
    var MD_IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)]+)\)/g;
    var warnedMissingPaths = /* @__PURE__ */ new Set();
    var warnedReadFailures = /* @__PURE__ */ new Set();
    function resolveImages(markdown, documentUri) {
      const baseDir = path.dirname(documentUri.fsPath);
      return markdown.replace(MD_IMAGE_PATTERN, (fullMatch, alt, rawSrc) => {
        const src = rawSrc.trim().replace(/\s+"[^"]*"$/, "").trim();
        if (/^https?:\/\//i.test(src) || /^data:/i.test(src)) {
          return fullMatch;
        }
        const absPath = path.isAbsolute(src) ? src : path.resolve(baseDir, src);
        if (!fs.existsSync(absPath)) {
          if (!warnedMissingPaths.has(absPath)) {
            warnedMissingPaths.add(absPath);
            vscode2.window.showWarningMessage(`MD-PDF: Image not found: ${src}`);
          }
          return fullMatch;
        }
        const ext = path.extname(absPath).toLowerCase();
        const mime = MIME_MAP[ext] || "application/octet-stream";
        try {
          const data = fs.readFileSync(absPath);
          const b64 = data.toString("base64");
          const titlePart = rawSrc.trim().replace(/^[^\s]+/, "").trim();
          const newSrc = titlePart ? `data:${mime};base64,${b64} ${titlePart}` : `data:${mime};base64,${b64}`;
          return `![${alt}](${newSrc})`;
        } catch (err) {
          const warningKey = `${absPath}:${err.message}`;
          if (!warnedReadFailures.has(warningKey)) {
            warnedReadFailures.add(warningKey);
            vscode2.window.showWarningMessage(`MD-PDF: Could not read image: ${src} \u2014 ${err.message}`);
          }
          return fullMatch;
        }
      });
    }
    module2.exports = { resolveImages };
  }
});

// src/PreviewWebview.js
var require_PreviewWebview = __commonJS({
  "src/PreviewWebview.js"(exports2, module2) {
    "use strict";
    var vscode2 = require("vscode");
    var path = require("path");
    var { Pipeline, PAGEDJS_LOCAL_PATH, MERMAID_LOCAL_PATH, SMILES_DRAWER_LOCAL_PATH } = require_Pipeline();
    var { PreviewServer } = require_PreviewServer();
    var { resolveImages } = require_ImageResolver();
    var PreviewWebview = class {
      /**
       * @param {vscode.WebviewPanel} panel
       * @param {import('./MdPdfDocument').MdPdfDocument} document
       * @param {import('./StatusBarManager').StatusBarManager} statusBar
       */
      constructor(panel, document, statusBar) {
        this._panel = panel;
        this._document = document;
        this._statusBar = statusBar;
        this._ready = false;
        this._server = new PreviewServer({
          routeToFilePath: {
            "/_pagedjs": PAGEDJS_LOCAL_PATH,
            "/_mermaid": MERMAID_LOCAL_PATH,
            "/_smiles-drawer": SMILES_DRAWER_LOCAL_PATH
          }
        });
        panel.webview.onDidReceiveMessage((message) => {
          if (message && message.type === "paged-rendered") {
            this._statusBar.setState("ready");
          }
          if (message && message.type === "export-pdf") {
            vscode2.commands.executeCommand("orzMdPdf.exportPdf");
          }
        });
        panel.onDidDispose(() => this.dispose());
      }
      /**
       * Do the initial render: build the full paged HTML and set it as the webview content.
       * This is called once when the custom editor is first resolved.
       */
      async initialize() {
        await this._server.start();
        this._panel.webview.options = {
          enableScripts: true,
          portMapping: [
            {
              webviewPort: this._server.port,
              extensionHostPort: this._server.port
            }
          ]
        };
        this._statusBar.setState("rendering");
        try {
          const resolvedMd = resolveImages(this._document.markdown, this._document.uri);
          const fullHtml = await Pipeline.buildPreviewHtml(resolvedMd, (absPath) => this._server.getAssetPath(absPath));
          this._server.setContentHtml(fullHtml);
          this._panel.webview.html = this._buildOuterShellHtml();
          this._ready = true;
        } catch (err) {
          this._statusBar.setState("error", err.message);
          this._panel.webview.html = this._errorHtml(err.message);
        }
      }
      /**
       * Rebuild the preview webview with the latest markdown after debounce.
       * @param {string} markdown  - current markdown (already from text editor)
       */
      async sendUpdate(markdown) {
        if (!this._ready) return;
        this._statusBar.setState("rendering");
        try {
          const resolvedMd = resolveImages(markdown, this._document.uri);
          const fullHtml = await Pipeline.buildPreviewHtml(resolvedMd, (absPath) => this._server.getAssetPath(absPath));
          this._server.setContentHtml(fullHtml);
          this._panel.webview.postMessage({ type: "mdpdf-reload" });
        } catch (err) {
          this._statusBar.setState("error", err.message);
        }
      }
      reveal() {
        this._panel.reveal(this._panel.viewColumn, false);
      }
      isVisible() {
        return this._panel.visible;
      }
      /**
       * @param {string} message
       * @returns {string}
       */
      _errorHtml(message) {
        return `<!DOCTYPE html><html><body style="background:#1e1e1e;color:#f44;font-family:monospace;padding:2rem">
<h2>MD-PDF Render Error</h2><pre>${escapeHtml(message)}</pre></body></html>`;
      }
      _buildOuterShellHtml() {
        const shellUrl = `${this._server.origin}/`;
        const csp = [
          "default-src 'none'",
          `frame-src ${this._server.origin}`,
          `child-src ${this._server.origin}`,
          "script-src 'unsafe-inline'",
          "style-src 'unsafe-inline'"
        ].join("; ");
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
html, body {
    height: 100%;
    margin: 0;
    padding: 0;
    background: #525659;
    overflow: hidden;
}

#preview-shell {
    display: block;
    width: 100%;
    height: 100vh;
    border: none;
    background: #525659;
}
</style>
</head>
<body>
<iframe id="preview-shell" src="${shellUrl}" title="MD-PDF Preview"></iframe>
<script>
(function () {
    const vscode = acquireVsCodeApi();
    const frame = document.getElementById('preview-shell');

    window.addEventListener('message', function (event) {
        if (!event.data) return;

        if (event.data.type === 'mdpdf-reload') {
            if (frame && frame.contentWindow) {
                frame.contentWindow.postMessage({ type: 'mdpdf-reload' }, '*');
            }
            return;
        }

        if (event.data.type === 'paged-rendered') {
            vscode.postMessage({ type: 'paged-rendered' });
        }

        if (event.data.type === 'export-pdf') {
            vscode.postMessage({ type: 'export-pdf' });
        }
    });
})();
</script>
</body>
</html>`;
      }
      async dispose() {
        this._ready = false;
        await this._server.dispose();
      }
    };
    function escapeHtml(str) {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    module2.exports = { PreviewWebview };
  }
});

// src/MdPdfEditorProvider.js
var require_MdPdfEditorProvider = __commonJS({
  "src/MdPdfEditorProvider.js"(exports2, module2) {
    "use strict";
    var vscode2 = require("vscode");
    var { MdPdfDocument } = require_MdPdfDocument();
    var { VirtualDocProvider: VirtualDocProvider2 } = require_VirtualDocProvider();
    var { PreviewWebview } = require_PreviewWebview();
    var DEBOUNCE_MS = 500;
    var AUTO_SAVE_MS = 60 * 1e3;
    var MdPdfEditorProvider2 = class {
      /**
       * @param {vscode.ExtensionContext} context
       * @param {VirtualDocProvider} virtualDocProvider
       * @param {import('./StatusBarManager').StatusBarManager} statusBar
       */
      constructor(context, virtualDocProvider2, statusBar) {
        this._context = context;
        this._virtualDocProvider = virtualDocProvider2;
        this._statusBar = statusBar;
        this._previews = /* @__PURE__ */ new Map();
        this._documentBindings = /* @__PURE__ */ new Map();
        this._debounceTimers = /* @__PURE__ */ new Map();
        this._saveOperations = /* @__PURE__ */ new Map();
        this._onDidChangeEmitter = new vscode2.EventEmitter();
        this.onDidChangeCustomDocument = this._onDidChangeEmitter.event;
      }
      /**
       * Register this provider with VS Code.
       * @param {vscode.ExtensionContext} context
       * @param {VirtualDocProvider} virtualDocProvider
       * @param {import('./StatusBarManager').StatusBarManager} statusBar
       * @returns {vscode.Disposable}
       */
      register() {
        return vscode2.window.registerCustomEditorProvider("orzMdPdf.editor", this, {
          webviewOptions: {
            retainContextWhenHidden: true
            // keep paged.js state when tab is not visible
          },
          supportsMultipleEditorsPerDocument: false
        });
      }
      // ------------------------------------------------------------------ //
      //  CustomEditorProvider interface                                      //
      // ------------------------------------------------------------------ //
      /**
       * Called once per unique URI when the file is first opened.
       */
      async openCustomDocument(uri, openContext, token) {
        const doc = await MdPdfDocument.create(uri, openContext, token);
        doc.onDidDispose(() => this._onDocumentDisposed(doc));
        return doc;
      }
      /**
       * Called for every editor panel that opens the document.
       */
      async resolveCustomEditor(document, webviewPanel, _token) {
        const preview = new PreviewWebview(webviewPanel, document, this._statusBar);
        const key = document.uri.fsPath;
        if (!this._previews.has(key)) this._previews.set(key, /* @__PURE__ */ new Set());
        this._previews.get(key).add(preview);
        webviewPanel.onDidDispose(() => {
          this._previews.get(key)?.delete(preview);
          this._statusBar.refreshVisibility();
        });
        const textColumn = webviewPanel.viewColumn === vscode2.ViewColumn.One ? vscode2.ViewColumn.Beside : vscode2.ViewColumn.One;
        const tempUri = await this._openVirtualEditor(document, textColumn);
        this._ensureDocumentBindings(document, tempUri);
        await preview.initialize();
        webviewPanel.onDidChangeViewState((e) => {
          if (e.webviewPanel.active) {
            this._statusBar.setState("ready");
          }
          this._statusBar.refreshVisibility();
        });
      }
      async saveCustomDocument(document, cancellation) {
        this._clearAutoSaveTimer(document.uri.fsPath);
        await this._saveDocument(document, document.uri, cancellation);
      }
      async saveCustomDocumentAs(document, destination, cancellation) {
        this._clearAutoSaveTimer(document.uri.fsPath);
        await this._saveDocument(document, destination, cancellation);
      }
      async revertCustomDocument(document, cancellation) {
        await document.revert(cancellation);
        this._virtualDocProvider.updateTempFile(document.uri, document.markdown);
        this._clearAutoSaveTimer(document.uri.fsPath);
        this._broadcastUpdate(document, document.markdown);
      }
      async backupCustomDocument(document, context, cancellation) {
        return document.backup(context.destination, cancellation);
      }
      dispose() {
        for (const timer of this._debounceTimers.values()) {
          clearTimeout(timer);
        }
        this._debounceTimers.clear();
        for (const binding of this._documentBindings.values()) {
          for (const disposable of binding.disposables) {
            disposable.dispose();
          }
        }
        this._documentBindings.clear();
        this._saveOperations.clear();
        this._previews.clear();
      }
      async toggleActivePreview() {
        const activeMdPdfUri = this._getActiveMdPdfUri();
        if (activeMdPdfUri) {
          const binding = this._documentBindings.get(activeMdPdfUri.fsPath);
          if (!binding) return false;
          const textDoc = await vscode2.workspace.openTextDocument(binding.tempUri);
          await vscode2.window.showTextDocument(textDoc, {
            viewColumn: vscode2.ViewColumn.One,
            preserveFocus: false,
            preview: false
          });
          return true;
        }
        const activeEditor = vscode2.window.activeTextEditor;
        if (!activeEditor) return false;
        const mdPdfUri = this._virtualDocProvider.getMdPdfUri(activeEditor.document.uri);
        if (!mdPdfUri) return false;
        const preview = this._getPreferredPreview(mdPdfUri.fsPath);
        if (!preview) return false;
        preview.reveal();
        return true;
      }
      // ------------------------------------------------------------------ //
      //  Internal helpers                                                    //
      // ------------------------------------------------------------------ //
      /**
       * Write the markdown to a real temp .md file and open it in the LEFT column.
       * Returns the URI of the temp file (used to watch for changes), or null on failure.
       * @param {import('./MdPdfDocument').MdPdfDocument} document
       * @returns {Promise<vscode.Uri | null>}
       */
      async _openVirtualEditor(document, viewColumn = vscode2.ViewColumn.Beside) {
        try {
          const tempUri = this._virtualDocProvider.getOrCreateTempFile(
            document.uri,
            document.markdown
          );
          const textDoc = await vscode2.workspace.openTextDocument(tempUri);
          await vscode2.window.showTextDocument(textDoc, {
            viewColumn,
            preserveFocus: false,
            preview: false
          });
          return tempUri;
        } catch {
          return null;
        }
      }
      _ensureDocumentBindings(document, tempUri) {
        if (!tempUri) return;
        const key = document.uri.fsPath;
        if (this._documentBindings.has(key)) return;
        const disposables = [
          vscode2.workspace.onDidChangeTextDocument((e) => {
            if (e.document.uri.toString() !== tempUri.toString()) return;
            const newMarkdown = e.document.getText();
            document.markdown = newMarkdown;
            this._statusBar.setState("idle");
            this._schedulePreviewUpdate(document, newMarkdown);
            this._scheduleAutoSave(document);
          }),
          vscode2.workspace.onWillSaveTextDocument((e) => {
            if (e.document.uri.toString() !== tempUri.toString()) return;
            const binding = this._documentBindings.get(key);
            if (!binding) return;
            binding.pendingManualSave = e.reason === vscode2.TextDocumentSaveReason.Manual;
          }),
          vscode2.workspace.onDidSaveTextDocument(async (savedDoc) => {
            if (savedDoc.uri.toString() !== tempUri.toString()) return;
            const binding = this._documentBindings.get(key);
            if (!binding || !binding.pendingManualSave) return;
            binding.pendingManualSave = false;
            this._clearAutoSaveTimer(key);
            try {
              await this._saveDocument(document, document.uri, new vscode2.CancellationTokenSource().token);
            } catch {
            }
          })
        ];
        this._documentBindings.set(key, {
          tempUri,
          disposables,
          autoSaveTimer: null,
          pendingManualSave: false
        });
      }
      async _saveDocument(document, destination, cancellation) {
        const key = document.uri.fsPath;
        const inFlight = this._saveOperations.get(key);
        if (inFlight) {
          return inFlight;
        }
        const operation = (async () => {
          this._statusBar.setState("saving");
          try {
            await document.save(destination, cancellation);
            this._statusBar.setState("ready");
          } catch (err) {
            this._statusBar.setState("error", err.message);
            vscode2.window.showErrorMessage(`MD-PDF save failed: ${err.message}`);
            throw err;
          } finally {
            this._saveOperations.delete(key);
          }
        })();
        this._saveOperations.set(key, operation);
        return operation;
      }
      /**
       * Debounce the preview re-render only.
       * document.markdown is updated immediately in the change listener above.
       * @param {import('./MdPdfDocument').MdPdfDocument} document
       * @param {string} newMarkdown
       */
      _schedulePreviewUpdate(document, newMarkdown) {
        const key = document.uri.fsPath;
        const existing = this._debounceTimers.get(key);
        if (existing) clearTimeout(existing);
        const timer = setTimeout(() => {
          this._debounceTimers.delete(key);
          this._broadcastUpdate(document, newMarkdown);
        }, DEBOUNCE_MS);
        this._debounceTimers.set(key, timer);
      }
      /**
       * Send an incremental update to all open preview panels for this document.
       * @param {MdPdfDocument} document
       * @param {string} markdown
       */
      _broadcastUpdate(document, markdown) {
        const previews = this._previews.get(document.uri.fsPath);
        if (!previews) return;
        for (const preview of previews) {
          preview.sendUpdate(markdown);
        }
      }
      _scheduleAutoSave(document) {
        const key = document.uri.fsPath;
        const binding = this._documentBindings.get(key);
        if (!binding) return;
        this._clearAutoSaveTimer(key);
        binding.autoSaveTimer = setTimeout(async () => {
          binding.autoSaveTimer = null;
          if (!document.isDirty()) {
            return;
          }
          try {
            await this._saveDocument(document, document.uri, new vscode2.CancellationTokenSource().token);
          } catch {
          }
        }, AUTO_SAVE_MS);
      }
      _clearAutoSaveTimer(documentKey) {
        const binding = this._documentBindings.get(documentKey);
        if (!binding || !binding.autoSaveTimer) return;
        clearTimeout(binding.autoSaveTimer);
        binding.autoSaveTimer = null;
      }
      _getActiveMdPdfUri() {
        for (const group of vscode2.window.tabGroups.all) {
          for (const tab of group.tabs) {
            const input = tab.input;
            if (!tab.isActive) continue;
            if (!input || typeof input !== "object") continue;
            if (input.viewType !== "orzMdPdf.editor") continue;
            if (!input.uri) continue;
            return input.uri;
          }
        }
        return null;
      }
      _getPreferredPreview(documentKey) {
        const previews = this._previews.get(documentKey);
        if (!previews || previews.size === 0) return null;
        for (const preview of previews) {
          if (preview.isVisible()) {
            return preview;
          }
        }
        return previews.values().next().value || null;
      }
      /**
       * Clean up when the document is closed.
       * @param {import('./MdPdfDocument').MdPdfDocument} document
       */
      _onDocumentDisposed(document) {
        const key = document.uri.fsPath;
        this._previews.delete(key);
        const timer = this._debounceTimers.get(key);
        if (timer) {
          clearTimeout(timer);
          this._debounceTimers.delete(key);
        }
        const binding = this._documentBindings.get(key);
        if (binding) {
          this._clearAutoSaveTimer(key);
          for (const disposable of binding.disposables) {
            disposable.dispose();
          }
          this._documentBindings.delete(key);
        }
        this._saveOperations.delete(key);
        this._virtualDocProvider.delete(document.uri);
      }
    };
    module2.exports = { MdPdfEditorProvider: MdPdfEditorProvider2 };
  }
});

// src/StatusBarManager.js
var require_StatusBarManager = __commonJS({
  "src/StatusBarManager.js"(exports2, module2) {
    "use strict";
    var vscode2 = require("vscode");
    var STATES = {
      idle: { text: "$(edit) MD-PDF", tooltip: "Click to toggle preview" },
      rendering: { text: "$(sync~spin) MD-PDF: Rendering\u2026", tooltip: "Rendering preview" },
      saving: { text: "$(sync~spin) MD-PDF: Saving\u2026", tooltip: "Saving document" },
      ready: { text: "$(check) MD-PDF", tooltip: "Preview up to date" },
      error: { text: "$(error) MD-PDF Error", tooltip: "" }
    };
    var StatusBarManager2 = class {
      /**
       * @param {vscode.ExtensionContext} context
       */
      constructor(context) {
        this._item = vscode2.window.createStatusBarItem(vscode2.StatusBarAlignment.Right, 100);
        this._item.command = "orzMdPdf.togglePreview";
        this._exportItem = vscode2.window.createStatusBarItem(vscode2.StatusBarAlignment.Right, 101);
        this._exportItem.command = "orzMdPdf.exportPdf";
        this._exportItem.text = "$(export)";
        this._exportItem.tooltip = "Export as pure PDF";
        context.subscriptions.push(this._item, this._exportItem);
        this._state = "idle";
        this._errorMessage = void 0;
        const refresh = () => this.refreshVisibility();
        context.subscriptions.push(vscode2.window.onDidChangeActiveTextEditor(refresh));
        if (vscode2.window.tabGroups && typeof vscode2.window.tabGroups.onDidChangeTabs === "function") {
          context.subscriptions.push(vscode2.window.tabGroups.onDidChangeTabs(refresh));
        }
        if (vscode2.window.tabGroups && typeof vscode2.window.tabGroups.onDidChangeTabGroups === "function") {
          context.subscriptions.push(vscode2.window.tabGroups.onDidChangeTabGroups(refresh));
        }
        this.setState("idle");
      }
      /**
       * @param {'idle'|'rendering'|'saving'|'ready'|'error'} state
       * @param {string} [errorMessage]
       */
      setState(state, errorMessage) {
        this._state = state;
        this._errorMessage = errorMessage;
        this._render();
      }
      refreshVisibility() {
        this._render();
      }
      _render() {
        if (!this._isMdPdfEditorActive()) {
          this._item.hide();
          this._exportItem.hide();
          return;
        }
        const cfg = STATES[this._state] || STATES.idle;
        this._item.text = cfg.text;
        this._item.tooltip = this._state === "error" && this._errorMessage ? this._errorMessage : cfg.tooltip;
        this._item.backgroundColor = this._state === "error" ? new vscode2.ThemeColor("statusBarItem.errorBackground") : void 0;
        this._item.show();
        this._exportItem.show();
      }
      _isMdPdfEditorActive() {
        const activeTab = vscode2.window.tabGroups?.activeTabGroup?.activeTab;
        const input = activeTab?.input;
        return Boolean(
          input && typeof input === "object" && input.viewType === "orzMdPdf.editor" && input.uri
        );
      }
      hide() {
        this._item.hide();
        this._exportItem.hide();
      }
    };
    module2.exports = { StatusBarManager: StatusBarManager2 };
  }
});

// src/commands/newFile.js
var require_newFile = __commonJS({
  "src/commands/newFile.js"(exports2, module2) {
    "use strict";
    var vscode2 = require("vscode");
    var path = require("path");
    var fs = require("fs");
    var { WELCOME_MARKDOWN } = require_MdPdfDocument();
    var { Pipeline } = require_Pipeline();
    var { embedMarkdownInPdf } = require_embed();
    function registerNewFileCommand2(context) {
      context.subscriptions.push(
        vscode2.commands.registerCommand("orzMdPdf.newFile", async () => {
          const saveUri = await vscode2.window.showSaveDialog({
            title: "Create New MD-PDF File",
            filters: { "MD-PDF Document": ["md.pdf"] },
            saveLabel: "Create"
          });
          if (!saveUri) return;
          await vscode2.window.withProgress(
            { location: vscode2.ProgressLocation.Notification, title: "Creating MD-PDF file\u2026", cancellable: false },
            async () => {
              try {
                const fakeUri = vscode2.Uri.file(saveUri.fsPath);
                const pdfBytes = await Pipeline.buildPdf(WELCOME_MARKDOWN, fakeUri);
                const embedded = await embedMarkdownInPdf(Buffer.from(pdfBytes), WELCOME_MARKDOWN);
                fs.mkdirSync(path.dirname(saveUri.fsPath), { recursive: true });
                fs.writeFileSync(saveUri.fsPath, Buffer.from(embedded));
              } catch (err) {
                vscode2.window.showErrorMessage(`MD-PDF: Failed to create file \u2014 ${err.message}`);
                return;
              }
            }
          );
          await vscode2.commands.executeCommand("vscode.openWith", saveUri, "orzMdPdf.editor");
        })
      );
    }
    module2.exports = { registerNewFileCommand: registerNewFileCommand2 };
  }
});

// src/commands/convertMd.js
var require_convertMd = __commonJS({
  "src/commands/convertMd.js"(exports2, module2) {
    "use strict";
    var vscode2 = require("vscode");
    var path = require("path");
    var fs = require("fs");
    var { Pipeline } = require_Pipeline();
    var { embedMarkdownInPdf } = require_embed();
    function registerConvertMdCommand2(context) {
      context.subscriptions.push(
        vscode2.commands.registerCommand("orzMdPdf.convertMd", async (contextUri) => {
          let mdUri = contextUri;
          if (!mdUri) {
            const picked = await vscode2.window.showOpenDialog({
              title: "Select Markdown File to Convert",
              filters: { Markdown: ["md"] },
              canSelectMany: false,
              openLabel: "Convert"
            });
            if (!picked || picked.length === 0) return;
            mdUri = picked[0];
          }
          const mdPath = mdUri.fsPath;
          const outPath = mdPath.replace(/\.md$/, ".md.pdf");
          const outUri = vscode2.Uri.file(outPath);
          const markdown = fs.readFileSync(mdPath, "utf8");
          await vscode2.window.withProgress(
            { location: vscode2.ProgressLocation.Notification, title: `Converting ${path.basename(mdPath)}\u2026`, cancellable: false },
            async () => {
              try {
                const pdfBytes = await Pipeline.buildPdf(markdown, mdUri);
                const embedded = await embedMarkdownInPdf(Buffer.from(pdfBytes), markdown);
                fs.writeFileSync(outPath, Buffer.from(embedded));
              } catch (err) {
                vscode2.window.showErrorMessage(`MD-PDF: Conversion failed \u2014 ${err.message}`);
                return;
              }
              vscode2.window.showInformationMessage(`Created ${path.basename(outPath)}`);
            }
          );
          await vscode2.commands.executeCommand("vscode.openWith", outUri, "orzMdPdf.editor");
        })
      );
    }
    module2.exports = { registerConvertMdCommand: registerConvertMdCommand2 };
  }
});

// src/commands/exportPdf.js
var require_exportPdf = __commonJS({
  "src/commands/exportPdf.js"(exports2, module2) {
    "use strict";
    var vscode2 = require("vscode");
    var path = require("path");
    var fs = require("fs");
    var { Pipeline } = require_Pipeline();
    var { resolveImages } = require_ImageResolver();
    function registerExportPdfCommand2(context, virtualDocProvider2) {
      context.subscriptions.push(
        vscode2.commands.registerCommand("orzMdPdf.exportPdf", async () => {
          const mdPdfUri = _getActiveMdPdfUri();
          if (!mdPdfUri) {
            vscode2.window.showErrorMessage("MD-PDF: No active .md.pdf editor found.");
            return;
          }
          const tempUri = virtualDocProvider2.getTempUri(mdPdfUri);
          const textDoc = tempUri ? vscode2.workspace.textDocuments.find((d) => d.uri.toString() === tempUri.toString()) : null;
          if (!textDoc) {
            vscode2.window.showErrorMessage("MD-PDF: Could not find the open markdown document. Please ensure the .md.pdf file is open in the editor.");
            return;
          }
          const markdown = textDoc.getText();
          const mdPdfPath = mdPdfUri.fsPath;
          const now = /* @__PURE__ */ new Date();
          const stamp = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0")
          ].join("-");
          const base = path.basename(mdPdfPath, ".md.pdf");
          const dir = path.dirname(mdPdfPath);
          let outPath = path.join(dir, `${base}-${stamp}.pdf`);
          if (fs.existsSync(outPath)) {
            const answer = await vscode2.window.showWarningMessage(
              `${path.basename(outPath)} already exists. Overwrite?`,
              { modal: true },
              "Overwrite"
            );
            if (answer !== "Overwrite") return;
          }
          await vscode2.window.withProgress(
            { location: vscode2.ProgressLocation.Notification, title: "Exporting PDF\u2026", cancellable: false },
            async () => {
              try {
                const resolvedMd = resolveImages(markdown, mdPdfUri);
                const pdfBytes = await Pipeline.buildPdf(resolvedMd, mdPdfUri);
                fs.writeFileSync(outPath, Buffer.from(pdfBytes));
              } catch (err) {
                vscode2.window.showErrorMessage(`MD-PDF: Export failed \u2014 ${err.message}`);
                return;
              }
              const outUri = vscode2.Uri.file(outPath);
              const action = await vscode2.window.showInformationMessage(
                `Exported: ${path.basename(outPath)}`,
                "Open PDF"
              );
              if (action === "Open PDF") {
                vscode2.env.openExternal(outUri);
              }
            }
          );
        })
      );
    }
    function _getActiveMdPdfUri() {
      for (const group of vscode2.window.tabGroups.all) {
        for (const tab of group.tabs) {
          const input = tab.input;
          if (!tab.isActive) continue;
          if (!input || typeof input !== "object") continue;
          if (input.viewType !== "orzMdPdf.editor") continue;
          if (!input.uri) continue;
          return input.uri;
        }
      }
      return null;
    }
    module2.exports = { registerExportPdfCommand: registerExportPdfCommand2 };
  }
});

// src/extension.js
var vscode = require("vscode");
var { MdPdfEditorProvider } = require_MdPdfEditorProvider();
var { VirtualDocProvider } = require_VirtualDocProvider();
var { StatusBarManager } = require_StatusBarManager();
var { registerNewFileCommand } = require_newFile();
var { registerConvertMdCommand } = require_convertMd();
var { registerExportPdfCommand } = require_exportPdf();
var virtualDocProvider;
var statusBarManager;
function activate(context) {
  virtualDocProvider = new VirtualDocProvider();
  statusBarManager = new StatusBarManager(context);
  const editorProvider = new MdPdfEditorProvider(context, virtualDocProvider, statusBarManager);
  context.subscriptions.push(editorProvider);
  context.subscriptions.push(editorProvider.register());
  context.subscriptions.push(
    vscode.commands.registerCommand("orzMdPdf.togglePreview", async () => {
      const handled = await editorProvider.toggleActivePreview();
      if (!handled) {
        vscode.window.showInformationMessage("MD-PDF: No paired preview editor is available for the active document.");
      }
    })
  );
  registerNewFileCommand(context);
  registerConvertMdCommand(context);
  registerExportPdfCommand(context, virtualDocProvider);
}
function deactivate() {
}
module.exports = { activate, deactivate };
//# sourceMappingURL=extension.js.map
