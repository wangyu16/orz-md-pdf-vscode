---

## Phase 1: Model Sub-Project — Pipeline Validation

phase 1 basic functions completed. 

Will need revisions to add more features. Plan to use nyml plugin for these features in a consistent way. See 'nyml.md' and use the second mechanism to preseve order of input from nyml blocks. 

Key requirement: The '*.md.pdf' file must be self contained. Common features should be included in 'template.js'. Customized elements/styles need to be embeded to the .md.pdf file rather than relying on external sources. 

Usage: At the end of the implementation of these features, create a clear instruction what are allowed and how to use them. This instruction will be incorporated into phase 2 and will be used mostly by AI agent, i.e., users tell what they want and AI agent will help to create the corresponding elements following the instruction. So the most important thing for this project is to let human users know what they can do, but they do need to worry how to do that. The instruction, on the other hand, provides rules that are easy for AI agents to follow. 

First state: 
- font and font size, line spacing: Provide a unified way to define.
- headers, footers, pagenumbers: Provide options of the styles to let users select from. For each header and footer position allow users to input the actual values. In the original brainstorming stage it seemed desirable to allow simple markdown syntax here, but the later Phase I decision is to support plain text only for reliability in paged margin boxes. 
    - left, center, right headers and footers, i.e, six positions
    - Line below header, line above footer, true or false
    - page number can occupy one of these six positions, that position is not allowed to have other content
    - Provide all common page number styles to select from
- show header and/or footer on the first page, true or false. count page number from the first page or the second page (in case first page is title page and not counted): provide options to let users select from 
- title section setting: Treat title sections the same way as other customized elements. A title section is just an element placed in `pre-body` so it appears before the normal markdown body.  
    - Elements allowed in title section, e.g. title, subtitle, author, affiliation, date, ...
    - positioning and styles, e.g., padding above, padding below, pagebreak after true or false, positioning and styles of individual elements in the title section,.....
- pagebreak and vertical white space settings. 
    - A special nyml element to add pagebreak. two consequetive pagebreaks add an empty page
    - A special nyml element with one variable (the height) to add vertical white spacing
- KaTeX css and SmilesDrawer loading, mermaid, etc. should be included in 'template.js'. 
    - See 'MdElementExample.html'

Second stage:
- Besides the built in structured elements, allow customized block elements defined within an individual '*.md.html' file
    - To define a customized element: Use nyml to define a name of such element, define what variables are allowed, and use multiline nyml entry to define the style (css code) and html template
    - To use a defined customized element: In the same '*.md.html' file, use a nyml block inclulding above defined variables as keys to add actual instance of such an element. Variable values are plain text at the nyml level, but may contain markdown syntax and should be rendered as markdown in the final output when the field type requests it.

Third stage:
- Design built-in elements
    - Work the same way as customized elements, but do not need to add a 'define-element' by the user
    - Some title page ideas (implemented with the same define-element / element principle, or offered as convenience wrappers built on that same model), cv items (several types), exam questions (several types)

Questions (all solved):
- Is it possible to support Google Fonts?
- When there is a picture at the bottom of page, there is not enough space to show this picture, it will be moved to the next page and leave a big empty space in the front page. Is it possible to move the text behind this picture to the previous page just as LaTeX would do?
- or the picture may be cut in the middle and shown on two pages, this need to be avoided.
- Allow pagebreak within a table?

Templates
- Do not use the style templates from the markdown parser directly, but extract useful styles from them and create the customized style themes suitable for pdf pages for this project.
- Potential style themes: academic (based on academic I and II), casual, playful (based on playful I), and suggest more
- In principle, a user can use elements from different document styles and create one document, such as title section from cv style, multiple choice questions from exam style, .... The document would look weired and no one will actually do such thing, but there is scuh flexibility. 
- If a type of element has built-in template, allow user to add a field 'built-in-style: TamplateName' to use it. In this case, the user does not need to add a define-element block. If the user choose not to use built-in-style, but add a define-element block, it is fine as well. 
- For documents such as exam, need a globle rule to show or hide answer key.

---

To keep the preview server running use

```bash
cd pipeline-model && npm run preview
```

Goal: build a minimal working pipeline outside of VS Code so each step can be tested, debugged, and tuned in isolation before dealing with extension APIs.

### 1.1 Project Setup

```
pipeline-model/
├── package.json
├── src/
│   ├── parse.js          # Step 1: markdown → HTML via orz parser
│   ├── template.js       # Step 2: inject HTML into page template
│   ├── preview-server.js # Step 3: local HTTP server for live preview
│   └── convert.js        # Step 4: Puppeteer → PDF
├── template/
│   └── page.html         # Adapted from example.html (the validated template)
└── test/
    └── sample.md         # Sample markdown with yaml/nyml blocks
```

Initialize:

```bash
mkdir pipeline-model && cd pipeline-model
npm init -y
npm install --save-dev puppeteer-core
npm install github:orz-how/markdown-parser   # adjust to actual package name/path
```

---

### 1.2 Step 1 — Markdown Parser Integration (`src/parse.js`)

- Import the orz-how/markdown-parser
- Feed a markdown string (with yaml/nyml blocks) to the parser
- Confirm the output is an HTML fragment (content only, no `<html>` wrapper)
- Confirm yaml/nyml blocks become invisible `<script>` or data elements in the output
- Write a simple test:

```js
const { parse } = require('orz-markdown-parser'); // adjust import
const fs = require('fs');

const md = fs.readFileSync('test/sample.md', 'utf8');
const html = parse(md);
fs.writeFileSync('out/fragment.html', html);
console.log('Fragment written. Inspect out/fragment.html.');
```

**Acceptance criteria**: the HTML fragment renders correctly in a browser when pasted into a plain `<body>`.

---

### 1.3 Step 2 — Page Template (`template/page.html`)

Start directly from `example.html` — do not change anything that affects page sizing or paged.js behaviour. Only make these structural changes:

- Remove the CodeMirror editor pane and file-tree sidebar
- Remove all JavaScript except paged.js initialization
- Add a `<div id="content"></div>` placeholder where the parsed HTML fragment will be injected
- Keep all `@page` CSS rules, margins, header/footer, and paged.js script tag exactly as-is

This template is the single source of truth. Both the preview server (Step 3) and Puppeteer (Step 4) must use the **same file**.

---

### 1.4 Step 3 — Live Preview Server (`src/preview-server.js`)

A minimal HTTP server to drive the browser preview during development:

- Serve `template/page.html` at `GET /`
- Serve `GET /content` → run the markdown parser on a local `.md` file → return the HTML fragment
- The page template fetches `/content` on load and injects it into `#content`, then calls `PagedJS.preview()`
- Watch the source `.md` file for changes (use `fs.watch`) and trigger a reload via Server-Sent Events or WebSocket

```bash
node src/preview-server.js test/sample.md
# open http://localhost:3000 in browser
```

**Acceptance criteria**: editing `sample.md` causes the browser preview to refresh and show correct paginated output.

---

### 1.5 Step 4 — Puppeteer PDF Generation (`src/convert.js`)

- Use `puppeteer-core` pointed at a system Chromium (set `executablePath`)
- Load the **same** `template/page.html` via a `file://` URL (or serve via the local server)
- Inject the parsed HTML fragment into `#content` by evaluating JS in the page context
- Wait for paged.js to finish layout (`await page.waitForFunction(() => window.PagedConfig?.done)` or an equivalent signal)
- Call `page.pdf({ path: 'out/output.pdf', printBackground: true, preferCSSPageSize: true })`

```bash
node src/convert.js test/sample.md out/output.pdf
```

**Acceptance criteria**:
- The PDF page count, margins, fonts, and page numbers match what is visible in the browser preview exactly.
- The output opens correctly in an external PDF viewer.

---

### 1.6 Step 5 — Round-Trip Embedding Test (`src/embed.js`)

Validate the pdf-lib approach before touching the extension:

```bash
npm install pdf-lib
```

- Take `out/output.pdf`
- Use `pdf-lib` to attach the source markdown as an embedded file named `source.md`
- Write to `out/output.md.pdf`
- Re-open `out/output.md.pdf` with `pdf-lib`, extract the attachment, decode UTF-8
- Assert the extracted string equals the original markdown

```bash
node src/embed.js
```

**Acceptance criteria**: the `.md.pdf` file opens in an external PDF viewer (pages visible), and the embedded markdown can be extracted intact.

---

### 1.7 Phase 1 Exit Criteria

All five steps pass. You have a working, validated pipeline:

```
source.md  →  [orz parser]  →  HTML fragment
                                    ↓
                          [page template + paged.js]
                                    ↓
                           browser preview  ←─ live reload
                                    ↓
                          [Puppeteer headless]
                                    ↓
                              raw PDF pages
                                    ↓
                          [pdf-lib embed source.md]
                                    ↓
                              .md.pdf file
```

---

## Phase 2: VS Code Extension

### 2.1 Extension Scaffold

```bash
npm install -g @vscode/generator-code
yo code
# Choose: New Extension (TypeScript), name: orz-md-pdf-vscode
```

Copy Phase 1's `pipeline-model/` into the extension as `src/pipeline/`. The extension will call these modules from its Node.js extension host process.

Final structure:

```
orz-md-pdf-vscode/
├── package.json                        # Extension manifest
├── tsconfig.json
├── src/
│   ├── extension.ts                    # activate(), register providers
│   ├── MdPdfEditorProvider.ts          # CustomEditorProvider
│   ├── MdPdfDocument.ts                # File read/write, pdf-lib embed/extract
│   ├── MdPdfPreviewPanel.ts            # WebView panel management
│   ├── VirtualDocumentProvider.ts      # TextDocumentContentProvider (mdpdf: URIs)
│   └── pipeline/
│       ├── parse.ts                    # Wraps orz parser
│       ├── template.ts                 # Builds the full page HTML string
│       └── convert.ts                  # Puppeteer PDF generation
├── webview/
│   ├── preview.html                    # page.html from Phase 1 (preview-only)
│   ├── preview.js                      # postMessage listener, paged.js init
│   └── preview.css                     # Extracted styles
└── media/
    └── icon.png
```

---

### 2.2 `package.json` Manifest

Key contributions:

```json
{
  "contributes": {
    "customEditors": [
      {
        "viewType": "orz.mdpdf",
        "displayName": "MD-PDF Editor",
        "selector": [{ "filenamePattern": "*.md.pdf" }],
        "priority": "default"
      }
    ],
    "commands": [
      { "command": "orz.mdpdf.openPreview", "title": "Open MD-PDF Preview" }
    ]
  },
  "activationEvents": ["onCustomEditor:orz.mdpdf"]
}
```

---

### 2.3 `MdPdfDocument.ts` — File Model

Wraps the pdf-lib logic from Phase 1 Step 5:

```ts
class MdPdfDocument implements vscode.CustomDocument {
    static async create(uri: vscode.Uri): Promise<MdPdfDocument>
    // → reads file bytes, uses pdf-lib to extract 'source.md' attachment
    // → if no attachment (new file), markdown = ''

    async getMarkdown(): Promise<string>
    async save(markdown: string): Promise<void>
    // → calls pipeline/convert.ts to generate PDF bytes
    // → uses pdf-lib to embed updated markdown as attachment
    // → writes bytes to this.uri
}
```

---

### 2.4 `VirtualDocumentProvider.ts` — Native Text Editor Integration

Implements `vscode.TextDocumentContentProvider` for the `mdpdf:` URI scheme.

Registration in `extension.ts`:

```ts
vscode.workspace.registerTextDocumentContentProvider('mdpdf', provider);
```

URI scheme: `mdpdf://<encoded-file-path>/source.md`

The provider:
- Returns the extracted markdown content for a given `.md.pdf` file URI
- Maintains an in-memory map of `fileUri → currentMarkdown` that is updated on save

Opening flow (triggered when a `.md.pdf` is opened):

```ts
// 1. Open virtual markdown document in the main editor column
const mdUri = toVirtualUri(mdpdfUri);
await vscode.commands.executeCommand('vscode.open', mdUri, vscode.ViewColumn.One);

// 2. Open the preview WebView beside it
MdPdfPreviewPanel.create(mdpdfUri, vscode.ViewColumn.Two);
```

Change detection:

```ts
vscode.workspace.onDidChangeTextDocument(e => {
    if (e.document.uri.scheme !== 'mdpdf') return;
    const markdown = e.document.getText();
    const html = pipeline.parse(markdown);
    previewPanel.postMessage({ type: 'update', html });
});
```

Save flow:

```ts
// Intercept Ctrl+S on the virtual document
vscode.workspace.onWillSaveTextDocument(e => {
    if (e.document.uri.scheme !== 'mdpdf') return;
    e.waitUntil(document.save(e.document.getText()));
});
```

**Note**: `TextDocumentContentProvider` produces read-only virtual documents by default. To allow editing, use `vscode.workspace.openTextDocument({ content, language: 'markdown' })` into a temporary untitled buffer that is linked to the `.md.pdf` file, or implement a file-system provider (`vscode.FileSystemProvider`) for the `mdpdf:` scheme to make the document fully editable and saveable via VS Code's normal save path.

> **Recommendation**: Use `FileSystemProvider` over `TextDocumentContentProvider`. It supports read/write natively, so `Ctrl+S` works without extra interception, and VS Code tracks the dirty state automatically.

---

### 2.5 `MdPdfPreviewPanel.ts` — WebView Preview

Hosts the adapted `preview.html` (Phase 1's `page.html`):

```ts
class MdPdfPreviewPanel {
    static create(fileUri: vscode.Uri, column: vscode.ViewColumn): MdPdfPreviewPanel

    update(markdown: string): void {
        const html = pipeline.parse(markdown);
        this._panel.webview.postMessage({ type: 'update', html });
    }
}
```

`preview.js` inside the WebView:

```js
window.addEventListener('message', e => {
    if (e.data.type === 'update') {
        document.getElementById('content').innerHTML = e.data.html;
        // Re-run paged.js
        new Previewer().preview(document.getElementById('content'), {}, document.getElementById('page-container'));
    }
});
```

CSP header for the WebView:

```ts
`default-src 'none';
 script-src ${webview.cspSource} 'nonce-${nonce}';
 style-src ${webview.cspSource} 'unsafe-inline';
 font-src ${webview.cspSource} data:;`
```

All scripts (paged.js, any parser scripts) must be served via `webview.asWebviewUri()` from the extension's bundled assets — no remote CDNs.

---

### 2.6 `MdPdfEditorProvider.ts` — Custom Editor Registration

```ts
class MdPdfEditorProvider implements vscode.CustomEditorProvider<MdPdfDocument> {
    async openCustomDocument(uri, openContext, token): Promise<MdPdfDocument>
    async resolveCustomEditor(document, webviewPanel, token): Promise<void>
    // → webviewPanel is used as the WebView container
    // → also opens virtual markdown document in adjacent column
    saveCustomDocument(document, cancellation): Thenable<void>
    saveCustomDocumentAs(document, destination, cancellation): Thenable<void>
}
```

---

### 2.7 Settings Panel

The Settings panel from `example.html` is kept in the WebView. When the user changes a setting (page size, margins, font, etc.):

1. `preview.js` sends `postMessage({ type: 'settingsChanged', settings: {...} })`
2. The extension receives this, stores the settings (per-file, persisted in the pdf-lib metadata or a sidecar JSON)
3. On the next update or save, the settings are injected into the page template as CSS variables

Settings are embedded in the `.md.pdf` file itself (as additional pdf-lib document metadata or a second named attachment `settings.json`) so the file is fully self-contained.

---

### 2.8 Bundling

Use `esbuild` to bundle the extension:

```json
// package.json scripts
"compile": "esbuild src/extension.ts --bundle --outfile=dist/extension.js --external:vscode --platform=node",
"watch": "esbuild ... --watch"
```

Bundle the WebView assets separately (they run in the browser context, not Node.js):

```json
"compile:webview": "esbuild webview/preview.js --bundle --outfile=dist/webview/preview.js"
```

Add paged.js and the orz parser to the WebView bundle (or copy them to `dist/webview/` as separate files served via `asWebviewUri`).

---

### 2.9 Phase 2 Milestones

| Milestone | Description |
|---|---|
| 2a | Scaffold compiles, activates, and shows "Hello World" on `.md.pdf` open |
| 2b | `MdPdfDocument` reads/writes PDF attachment correctly |
| 2c | Virtual markdown document opens in native editor; Copilot works in it |
| 2d | Preview WebView shows paginated output driven by the markdown document |
| 2e | Live preview updates as the user types in the native editor |
| 2f | `Ctrl+S` saves: regenerates PDF via Puppeteer, embeds markdown, writes `.md.pdf` |
| 2g | Settings panel works; settings persisted in file |
| 2h | Creating a new `.md.pdf` works (blank PDF + empty markdown attachment) |
| 2i | Extension packaged with `vsce package`, installed and tested end-to-end |

---

## Key Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Preview ↔ PDF mismatch | Use the **same** `page.html` template and the **same** paged.js version for both. Never use separate CSS for Puppeteer. |
| Puppeteer binary size (~300 MB) | Use `puppeteer-core` + system Chromium. Detect path at runtime (`which chromium`, `which google-chrome`). Provide a setting for users to specify a custom path. Alternatively, use VS Code's bundled Electron binary via `process.execPath` for PDF printing. |
| `TextDocumentContentProvider` is read-only | Use `FileSystemProvider` for the `mdpdf:` scheme instead, which supports full read/write and native dirty-state tracking. |
| paged.js re-run on every keystroke is slow | Debounce the `onDidChangeTextDocument` handler (300–500 ms). Consider rendering only the visible page range during live preview and doing a full render only on save. |
| orz parser API unknown until tested | Phase 1 Step 1 exists specifically to validate this before any extension code is written. |
| Electron Chromium PDF flags may differ across VS Code versions | Pin Puppeteer to a specific Chromium version in `puppeteer-core`, or test with the system Chromium fallback. |
