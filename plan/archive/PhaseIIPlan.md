# Phase 2 — Comprehensive Implementation Plan

## 1. Architecture Overview

Phase 2 wraps the validated Phase 1 pipeline into a VS Code extension. The core design decisions are:

- **Custom Editor Provider** — `.md.pdf` is a binary PDF file; VS Code cannot open it as text. A `CustomEditorProvider` intercepts the open event, extracts the embedded markdown, and orchestrates the editor and preview panels.
- **Virtual Text Document** — The extracted markdown is surfaced under a custom URI scheme (`mdpdf://`) so the built-in VS Code text editor can display and edit it with all normal editor features (syntax highlighting, IntelliSense, find/replace, etc.).
- **Webview Preview Panel** — A `WebviewPanel` renders the paged.js paginated output. On incremental edits the webview patches only the content DOM node (no full reload) to avoid flash and scroll jumps.
- **Pipeline Bridge** — The Phase 1 modules (`parse.js`, `convert.js`, `embed.js`, `render/*`, `config/*`, `nyml/*`) are consumed directly from inside the extension process. The extension directory sits beside `pipeline-model/` and requires its modules with relative paths, avoiding duplication.
- **Puppeteer is used only for save and export**, not for preview. The preview uses paged.js running inside the webview (same approach as the Phase 1 preview server) to keep the interactive loop fast.

### High-level data flow

```
user edits virtual .md doc
        │  (onChange, debounce 500 ms)
        ▼
  Pipeline.buildPreviewHtml(markdown)
        │
        ▼
  webview.postMessage({ type: 'update', html: contentHtml })
        │  (webview patches DOM, re-paginates in place)
        ▼
  paged.js re-paginates → preview updates, scroll position preserved

user presses Ctrl+S
        │
        ▼
  Pipeline.buildPdf(markdown, { imageResolver })
        │
        ▼
  embed.embedMarkdownInPdf(pdfBytes, markdown)
        │
        ▼
  fs.writeFile(mdpdfPath, combinedBytes)
```

---

## 2. Extension Directory Structure

```
extension/
  package.json                  ← VS Code extension manifest
  extension.js                  ← activation entry point
  src/
    MdPdfDocument.js            ← document model (raw bytes + markdown state)
    MdPdfEditorProvider.js      ← CustomEditorProvider implementation
    VirtualDocProvider.js       ← TextDocumentContentProvider (mdpdf: scheme)
    PreviewWebview.js           ← webview lifecycle + incremental update messaging
    Pipeline.js                 ← thin wrapper around pipeline-model modules
    ImageResolver.js            ← local image → data-URI preprocessing
    StatusBarManager.js         ← status bar item (editing / rendering / ready / error)
    commands/
      newFile.js                ← "MD-PDF: New File" command
      convertMd.js              ← "MD-PDF: Convert .md to .md.pdf" command
      exportPdf.js              ← "MD-PDF: Export as Pure PDF" command
  webview/
    preview.js                  ← injected into the webview; handles postMessage patching
    preview.css                 ← preview chrome (dark gutter, page shadow)
```

The extension does **not** copy or bundle the pipeline source. It references `../pipeline-model/src/...` directly during development and uses a `bundler` (esbuild) step for the packaged VSIX so that `pipeline-model` modules are tree-shaken into the single extension bundle.

---

## 3. Extension Manifest (`package.json`)

Key `contributes` entries:

```jsonc
{
  "name": "orz-md-pdf",
  "displayName": "ORZ MD-PDF Editor",
  "engines": { "vscode": "^1.88.0" },
  "activationEvents": [],          // modern VS Code: declared contributions activate automatically
  "main": "./extension.js",
  "contributes": {
    "customEditors": [
      {
        "viewType": "orzMdPdf.editor",
        "displayName": "MD-PDF Editor",
        "selector": [{ "filenamePattern": "*.md.pdf" }],
        "priority": "default"
      }
    ],
    "commands": [
      { "command": "orzMdPdf.newFile",    "title": "MD-PDF: New File" },
      { "command": "orzMdPdf.convertMd",  "title": "MD-PDF: Convert .md to .md.pdf" },
      { "command": "orzMdPdf.exportPdf",  "title": "MD-PDF: Export as Pure PDF" },
      { "command": "orzMdPdf.togglePreview", "title": "MD-PDF: Toggle Preview" }
    ],
    "menus": {
      "explorer/context": [
        { "command": "orzMdPdf.convertMd", "when": "resourceExtname == '.md'" }
      ]
    }
  }
}
```

---

## 4. Task Breakdown

### Task 1 — Extension Scaffolding

**Goal:** working skeleton that activates on `*.md.pdf` files and logs a message.

Steps:
1. Create `extension/package.json` with the manifest shown above.
2. Create `extension/extension.js` that calls `MdPdfEditorProvider.register(context)` inside `activate()`.
3. Configure `esbuild` (or webpack) build step: entry `extension.js`, external `vscode`, output `dist/extension.js`.
4. Add `.vscodeignore` to exclude `pipeline-model/`, `plan/`, `test/`, and development config from the VSIX.
5. Verify the extension activates in the Extension Development Host (`F5`).

**Acceptance:** opening any `*.md.pdf` file triggers the custom editor (even if it shows a blank panel).

---

### Task 2 — File Format Module (`MdPdfDocument.js`)

**Goal:** read and write the `.md.pdf` binary format, extracting and re-embedding the markdown source.

Design:
- `MdPdfDocument` extends `vscode.CustomDocument`.
- Constructor receives `uri` and the raw `Uint8Array` file bytes.
- `markdown` property: the currently edited markdown string (starts as extracted value, mutates as user edits).
- `pdfBytes` property: the last-saved PDF bytes (used as base for re-embed on save).

Key methods:
```js
static async create(uri, backupId, token)  // factory; reads file, extracts markdown
async save(destination, token)             // run pipeline, embed, write
async revert(token)                        // re-extract from disk bytes
async backup(destination, token)           // write current markdown to backup location
```

Extraction logic delegates to `pipeline-model/src/embed.js → extractMarkdownFromPdf`.

**Empty / unrecognised file handling:**
- If `extractMarkdownFromPdf` returns `null` (no embedded source), the file is either a brand-new blank `.md.pdf` or a converted regular PDF. In both cases, seed `markdown` with the welcome template (see §5 below).
- If `pdfBytes` is empty (0-byte file — user just typed `touch example.md.pdf`), synthesise an initial single-page PDF from the welcome template immediately.

---

### Task 3 — Virtual Document Provider (`VirtualDocProvider.js`)

**Goal:** expose the extracted markdown as a `vscode.TextDocument` that VS Code's built-in editor can open.

URI scheme: `mdpdf`  
URI format: `mdpdf:///absolute/path/to/file.md.pdf`

```js
class VirtualDocProvider {
  constructor() {
    this._emitter = new vscode.EventEmitter();
    this.onDidChange = this._emitter.event;
    this._docs = new Map();      // uri.toString() → markdown string
  }
  provideTextDocumentContent(uri) {
    return this._docs.get(uri.toString()) ?? '';
  }
  set(uri, markdown) {
    this._docs.set(uri.toString(), markdown);
    this._emitter.fire(uri);
  }
}
```

Registration in `extension.js`:
```js
vscode.workspace.registerTextDocumentContentProvider('mdpdf', provider);
```

The provider is updated whenever the user saves (and the pipeline regenerates), and queried whenever `onDidChangeTextDocument` fires on the virtual URI.

---

### Task 4 — Custom Editor Provider (`MdPdfEditorProvider.js`)

**Goal:** tie together the document model, the virtual text editor, and the preview webview.

Implements `vscode.CustomEditorProvider<MdPdfDocument>`.

#### `openCustomDocument(uri, openContext, token)`
1. Call `MdPdfDocument.create(uri, openContext.backupId, token)`.
2. Return the document.

#### `resolveCustomEditor(document, webviewPanel, token)`
1. Set `webviewPanel.webview.options = { enableScripts: true, localResourceRoots: [...] }`.
2. Call `PreviewWebview.initialize(webviewPanel, document)` — renders the initial paged HTML into the webview frame.
3. Open the virtual markdown document beside the preview:
   ```js
   const virtualUri = vscode.Uri.parse(`mdpdf:///${document.uri.fsPath}`);
   virtualDocProvider.set(virtualUri, document.markdown);
   await vscode.commands.executeCommand('vscode.openWith', virtualUri, 'default',
     { viewColumn: vscode.ViewColumn.Beside, preview: false });
   ```
4. Subscribe to `vscode.workspace.onDidChangeTextDocument`:
   - Filter for events on `virtualUri`.
   - Debounce 500 ms.
   - Update `document.markdown` from the text document content.
   - Call `PreviewWebview.sendUpdate(webviewPanel, document.markdown)`.

#### `saveCustomDocument(document, cancellation)`
Delegate to `document.save(document.uri, cancellation)`.

#### `saveCustomDocumentAs(document, destination, cancellation)`
Delegate to `document.save(destination, cancellation)`.

#### `revertCustomDocument(document, cancellation)`
1. Call `document.revert(cancellation)`.
2. Update `virtualDocProvider.set(virtualUri, document.markdown)`.
3. Trigger a full preview rebuild.

---

### Task 5 — Preview Webview (`PreviewWebview.js`)

**Goal:** show the paged.js paginated preview inside a `WebviewPanel` with smooth incremental updates.

#### Initial render
1. Call `Pipeline.buildPreviewHtml(document.markdown, document.uri)` — returns the full paged HTML string (same as Phase 1's `generatePagedHtml`, but with `webview.asWebviewUri(...)` for all local assets).
2. Set `webviewPanel.webview.html = shellHtml` where `shellHtml` is a minimal wrapper that loads the full content via an `<iframe>` sourced from a blob URL (same shell/iframe split as the Phase 1 preview server), or alternatively sets the webview HTML directly.

**Asset loading in the webview:**
- `pagedjs`, `mermaid`, `smiles-drawer` fonts must be served via `webview.asWebviewUri()`.
- Fonts (from `@fontsource/*`) must be declared as `localResourceRoots` so the webview can load them.

#### Incremental update (no scroll-jump, no flash)
When `sendUpdate(webviewPanel, markdown)` is called:
1. Build only the **content fragment**: `Pipeline.buildContentHtml(markdown, documentUri)` — the inner `contentHtml` string, not the full page.
2. Post a message to the webview:
   ```js
   webviewPanel.webview.postMessage({ type: 'update', contentHtml });
   ```
3. The injected `webview/preview.js` script:
   - Receives the message.
   - Patches `document.getElementById('orz-content').innerHTML = contentHtml`.
   - Calls `window.PagedPolyfill.preview()` (paged.js re-pagination API) in-place.
   - Preserves current scroll position by re-applying it after paged.js finishes.

The webview script must guard against concurrent re-pagination: queue incoming updates and process one at a time.

#### Status indicator
A small overlay in the webview shows "rendering…" during re-pagination and disappears on completion. This replaces the need for a separate status bar ping for preview state.

---

### Task 6 — Pipeline Bridge (`Pipeline.js`)

**Goal:** expose the Phase 1 pipeline as clean async functions callable from extension code.

```js
const { parseMarkdown }          = require('../pipeline-model/src/parse');
const { extractDocumentSettings }= require('../pipeline-model/src/config/settings-normalize');
const { mergeCoreSettings }      = require('../pipeline-model/src/config/merge-settings');
const { resolveTemplateSettings }= require('../pipeline-model/src/config/templates-registry');
const { stripMetadataScripts }   = require('../pipeline-model/src/nyml/extract');
const { processFlowDirectives }  = require('../pipeline-model/src/nyml/flow-directives');
const { processElements }        = require('../pipeline-model/src/nyml/elements');
const { generatePagedHtml }      = require('../pipeline-model/src/render/page-template');

// Returns full paged HTML for the webview (initial load)
async function buildPreviewHtml(markdown, documentUri, assetUris) { ... }

// Returns only the inner content HTML fragment (for incremental webview update)
async function buildContentHtml(markdown, documentUri) { ... }

// Runs the full Puppeteer pipeline and returns PDF bytes
async function buildPdf(markdown, documentUri, options = {}) { ... }
```

`buildPdf` also:
- Calls `ImageResolver.resolveImages(markdown, documentUri)` before parsing to inline local images.
- Passes the resolved markdown to `parseMarkdown`.
- Launches Puppeteer with the same logic as `convert.js`.

---

### Task 7 — Image Resolver (`ImageResolver.js`)

**Goal:** convert local relative image references to inline `data:` URIs before the markdown is parsed.

Algorithm:
1. Parse the markdown for `![...](<relative-path>)` patterns (regex or markdown-it token walk).
2. For each local path (not `http://`, `https://`, or `data:`):
   - Resolve relative to `path.dirname(documentUri.fsPath)`.
   - If the file exists: read it, detect MIME type from extension, base64-encode, replace reference with `data:<mime>;base64,<data>`.
   - If the file does not exist: show `vscode.window.showWarningMessage(...)` once per missing image; leave the reference unchanged (it will render as a broken image, which is safe).
3. Return the modified markdown string.

For the **preview webview**, the same resolution is applied so the webview can display images without file-system access restrictions.

For the **PDF export** path, all images (including web URLs) must be embedded. For web URLs during PDF generation, the Puppeteer browser loads them directly (it has network access), so no special handling is needed.

---

### Task 8 — New File & Convert Commands

#### `commands/newFile.js` — "MD-PDF: New File"

1. Show `vscode.window.showSaveDialog({ filters: { 'MD-PDF': ['md.pdf'] } })`.
2. Write an empty placeholder file (0 bytes or minimal valid PDF) to the chosen path.
3. Open it: `vscode.commands.executeCommand('vscode.openWith', uri, 'orzMdPdf.editor')`.
4. The `MdPdfDocument.create` factory detects an empty/invalid PDF and seeds `markdown` with the welcome template:

```markdown
{{nyml
kind: document
template: default
}}

# Welcome

Start editing your document here.
```

5. A first save immediately converts this template markdown into a real single-page PDF with embedded source.

#### `commands/convertMd.js` — "MD-PDF: Convert .md to .md.pdf"

Triggered from the Explorer context menu on `.md` files, or from the command palette with a file picker.

1. Read the `.md` file.
2. Run `Pipeline.buildPdf(markdown, mdUri)` → `pdfBytes`.
3. Run `embed.embedMarkdownInPdf(pdfBytes, markdown)` → `mdPdfBytes`.
4. Write to `mdUri.fsPath.replace(/\.md$/, '.md.pdf')`.
5. Open the resulting `.md.pdf` with the custom editor.

---

### Task 9 — Save Handler

Saving is handled entirely inside `MdPdfDocument.save(destination, token)`:

1. Show a progress notification: `vscode.window.withProgress({ location: Notification, title: 'Saving MD-PDF…' }, async () => { ... })`.
2. Resolve images: `const resolvedMd = await ImageResolver.resolveImages(this.markdown, this.uri)`.
3. Build PDF: `const pdfBytes = await Pipeline.buildPdf(resolvedMd, this.uri)`.
4. Embed source: `const finalBytes = await embed.embedMarkdownInPdf(pdfBytes, this.markdown)` — note the **original unresolved** markdown is embedded so the source remains portable (local paths stay relative, not hardcoded data URIs).
5. Write to `destination.fsPath`.
6. Update `this._savedPdfBytes = finalBytes`.
7. Update status bar to "Saved".

On error: show `vscode.window.showErrorMessage(...)` with the error detail.

---

### Task 10 — Export PDF Command (`commands/exportPdf.js`)

"MD-PDF: Export as Pure PDF" — available from the command palette when a `.md.pdf` custom editor is focused.

1. Build timestamp string: `YYYY-MM-DD` (e.g., `2026-03-24`).
2. Compute output path: `example.md.pdf` → `example-2026-03-24.pdf`.
3. If the output path already exists, show a confirmation dialog.
4. Import-resolve images (same as save, §Task 9 step 2).
5. Run `Pipeline.buildPdf(resolvedMd, documentUri)` — **no markdown embedding step**.
6. Write the raw PDF bytes.
7. Show a success notification with an "Open" button that opens the file externally (`vscode.env.openExternal`).

---

### Task 11 — Status Bar (`StatusBarManager.js`)

A single status bar item on the right side shows the current document state:

| State | Text | Tooltip |
|---|---|---|
| Idle (editing) | `$(edit) MD-PDF` | "Click to toggle preview" |
| Building preview | `$(sync~spin) Rendering…` | — |
| Ready | `$(check) MD-PDF` | "Preview up to date" |
| Saving | `$(sync~spin) Saving…` | — |
| Error | `$(error) MD-PDF Error` | Error message |

The status bar item is only shown when a `.md.pdf` custom editor is the active editor, and is hidden otherwise.

---

## 5. Detailed UX Behaviours

### No-flash incremental preview
- The webview HTML is set **once** (on `resolveCustomEditor`). Subsequent updates use `postMessage` only.
- The webview script saves `window.scrollY` before calling `PagedPolyfill.preview()` and restores it in the `paged-rendered` callback.
- A CSS `opacity: 1 → 0.6 → 1` micro-transition (200 ms) on the content area signals re-pagination without a full visual reset.

### Debounce strategy
- The extension registers `onDidChangeTextDocument` on the virtual document.
- Each event clears and restarts a 500 ms timer.
- The timer callback cancels any in-flight `buildContentHtml` promise (via `AbortController` or a generation counter) before starting a new one.

### Scroll position preservation
- The webview tracks the currently visible paged.js page number (by observing `IntersectionObserver` on `.pagedjs_page` elements).
- After re-pagination, it scrolls back to the same page number.

### Handling the `.md.pdf` icon
- Contribute a file icon theme association: files matching `*.md.pdf` use a custom icon (a PDF icon with a pencil overlay). This is optional polish and can be added last.

---

## 6. Implementation Order & Milestones

| # | Milestone | Tasks | Acceptance Criteria |
|---|---|---|---|
| M1 | Skeleton activates | Task 1 | Opening `*.md.pdf` shows a blank custom editor panel; no errors in Extension Host console |
| M2 | File format round-trip | Task 2 | `MdPdfDocument.create` extracts markdown; `save` re-embeds it; round-trip test passes |
| M3 | Virtual editor opens | Task 3, 4 (partial) | Opening `*.md.pdf` shows the extracted markdown in a text editor beside the custom editor |
| M4 | Initial preview renders | Task 5, 6 | The preview webview shows the paginated document on open |
| M5 | Live preview updates | Task 4 (full), Task 5 (incremental) | Editing the virtual doc → preview updates in ≤ 1 s without flash or scroll jump |
| M6 | Save works | Task 7, Task 9 | `Ctrl+S` writes a valid `.md.pdf`; reopening it shows updated content |
| M7 | New file & convert | Task 8 | Both commands create valid `.md.pdf` files that open correctly |
| M8 | Image handling | Task 7 | Local images appear in preview and are embedded in saved PDF |
| M9 | Export PDF | Task 10 | Export command produces a pure PDF with the correct timestamp suffix |
| M10 | UX polish | Task 11 | Status bar shows correct states; no scroll jumps; debounce works; missing-image warnings shown |

---

## 7. Key Technical Notes & Risks

### Puppeteer inside a VS Code extension
Puppeteer (used for PDF generation) spins up a headless Chromium process. This is fine for save/export (user-initiated, slow is acceptable) but must never run on every keystroke. The preview path must **not** use Puppeteer.

VS Code extensions run in Node.js, so Puppeteer works without special setup. The `executablePath` logic from `convert.js` (`CHROMIUM_CANDIDATES` list) is reused directly.

### Webview asset loading
All `node_modules` assets (pagedjs, mermaid, fonts) must be served via `webview.asWebviewUri()` and declared in `localResourceRoots`. Use a helper to map `require.resolve('pagedjs/dist/paged.polyfill.js')` → `vscode.Uri.file(absPath)` → `webview.asWebviewUri(...)`.

### Virtual document writability
`TextDocumentContentProvider` documents are read-only by default. The user edits them in the text editor, which fires `onDidChangeTextDocument` with the new content. The extension reads the content back from the text editor document (`vscode.workspace.textDocuments.find(d => d.uri.toString() === virtualUri.toString())`) rather than the provider. The provider only handles initial population and programmatic refreshes (e.g., after revert).

### paged.js re-pagination API
paged.js 0.4.x exposes `window.PagedPolyfill` after the polyfill script loads. The `preview()` method triggers a full re-layout. There is currently no incremental/section-only re-layout API in paged.js, so the entire document is re-paginated on each update. For typical documents this completes in under 500 ms; for very long documents a progress indicator in the webview is helpful (already addressed in Task 5).

### NYML syntax in the virtual editor
The virtual document has language ID `markdown` by default. NYML blocks (`{{nyml ... }}`) are not highlighted. A future enhancement (outside Phase 2 scope) could contribute a TextMate grammar injection to highlight NYML fences inside markdown files. A comment in the plan notes this as a known gap.

### `.md.pdf` — double extension
VS Code may not natively recognize `*.md.pdf` as a compound extension in some file-association contexts. The `customEditors` selector uses `"filenamePattern": "*.md.pdf"` which is glob-based and works correctly. Test on both Linux and macOS/Windows to confirm the glob resolves as expected.

---