Goal: create a vs code extension for editing and previewing 'example.md.pdf' files. 
- These 'example.md.pdf' files are valid pdf files that can be viewed by any pdf viewer. 
- The markdown sources used to create these pdf pages are embeded and can be extracted by this extension for editing. 
- The extension automatically update the pdf output and provide preview. When saved, the markdown source and pdf pages both saved to one file. 

Ideas:
- Extract and display the markdown source as a virtual markdown file that can be edited directly in vs code default text editor. 
- Use a customized markdown parser to parse the markdown source into html elements with styles applied to these elements (no page layout). The markdown parser can be downloaded and installed directly from my GitHub.
- The markdown parser is customized to accept yaml and nyml elements from the markdown source and convert to invisible script objects in the html output. These objects can be used to create title section or title page, and sections with special styles, like exam questions, cv items, etc. 
- Assemble these html elements with header, footer, page number, page break, ... in to page style by paged.js and provide preview. 
- There is an 'example.html' file available which can preview by paged.js and convert to pdf perfectly fit the size. 
- Upon saving, convert all into '*.md.pdf' output. 

Importang:
- It is challenging to match html page to printed pdf. The 'example.html' settings are tested to work properly. If any changes need to be made and can potentially affect the html to pdf conversion, should be very careful. 

---

## Recommendations

### 1. Extension Type: CustomEditorProvider

Register a `CustomEditorProvider` for the `*.md.pdf` file type. This is the correct VS Code API for binary files that need a custom UI — it gives you full control over file read/write and renders a WebView as the editor.

Key files:
- `package.json` — contribute `customEditors` with `viewType` and glob `"**/*.md.pdf"`
- `src/MdPdfEditorProvider.ts` — implement `vscode.CustomEditorProvider<MdPdfDocument>`

### 2. File Format: PDF with Embedded Markdown Attachment

A `.md.pdf` file is a valid PDF. Embed the markdown source as a **PDF file attachment** (embedded file stream, per the PDF spec). This approach:
- Survives any PDF viewer opening the file (attachment is ignored by viewers)
- Is easy to extract programmatically with `pdf-lib`
- Keeps a single self-contained file

Recommended library: **`pdf-lib`** (pure JS, no native deps, works inside a VS Code extension).

Workflow:
- **Open**: use `pdf-lib` to load the PDF → find attachment named `source.md` → decode UTF-8 bytes → pass markdown string to WebView
- **Save**: receive markdown from WebView → regenerate PDF via headless render → embed updated `source.md` attachment → write bytes back

### 3. Markdown → HTML → PDF Pipeline

Reuse the `example.html` approach exactly — it is already validated. Do NOT change the `@page` CSS or paged.js settings.

Steps:
1. Run the orz-how markdown parser (loaded from your GitHub) on the markdown source to produce HTML content
2. Inject that HTML into the page template (the same structure as `example.html`)
3. Load paged.js to paginate in the preview WebView iframe
4. On save, launch a **headless Chromium via Puppeteer** (bundled as a VS Code extension dependency) to print the same HTML to PDF — this guarantees the saved PDF exactly matches the preview

> ⚠️ Critical: the headless print must use the same CSS and paged.js version as the preview. Drive both from a single shared HTML template file bundled with the extension.

### 4. WebView UI (Preview Only)

Adapt `example.html` into the WebView panel, used as a **preview-only** panel. The editing is handled by VS Code's native text editor (see §6). Remove:
- CodeMirror editor pane (not needed — VS Code native editor is used instead)
- File-tree sidebar (VS Code's own Explorer handles files)

Keep:
- paged.js preview iframe (full-width, since there is no embedded editor)
- Settings panel (page size, margins, font, header/footer, etc.)

Communication:
- Extension → WebView: `panel.webview.postMessage({ type: 'update', html: '...' })` — sent whenever the virtual markdown document changes
- WebView → Extension: `vscode.postMessage({ type: 'settingsChanged', settings: {...} })` — when user adjusts page settings

### 5. Markdown Parser Integration

Install the orz-how/markdown-parser from GitHub (`npm install github:orz-how/markdown-parser` or equivalent). Bundle it with the extension (add to `webpack` or `esbuild` bundle). Load it inside the WebView as a local script (use `webview.asWebviewUri` to serve bundled assets) — do NOT load it from a remote CDN inside VS Code WebViews (Content Security Policy will block it).


### 6. Virtual Markdown File (Primary Editing Approach)

Use VS Code's native text editor as the primary editing interface — it has GitHub Copilot integrated, which makes AI-assisted editing seamless.

Implementation:
- Implement a `TextDocumentContentProvider` that serves a `mdpdf:` URI (e.g. `mdpdf://<filepath>/source.md`)
- When a `.md.pdf` is opened, extract the embedded markdown and open it at this virtual URI in VS Code's built-in text editor
- Open the preview WebView panel beside it automatically (via `vscode.ViewColumn.Beside`)
- Listen for changes via `vscode.workspace.onDidChangeTextDocument` → re-run the markdown parser → push updated HTML to the WebView for live preview
- On save (`vscode.workspace.onDidSaveTextDocument` or `Ctrl+S` in the virtual doc), regenerate the PDF and write it back to the `.md.pdf` file

### 7. Project Structure

orz-md-pdf-vscode/
├── package.json # Extension manifest
├── src/
│ ├── extension.ts # activate(), register providers
│ ├── MdPdfEditorProvider.ts # CustomEditorProvider implementation
│ ├── MdPdfDocument.ts # File read/write, pdf-lib embed/extract
│ └── PdfConverter.ts # Puppeteer headless PDF generation
├── webview/
│ ├── preview.html # Adapted from example.html (preview-only WebView)
│ ├── preview.js # WebView script (paged.js, postMessage listener)
│ └── preview.css # Extracted styles
└── media/ # Icons, bundled assets


### 8. Key Dependencies

| Package | Purpose |
|---|---|
| `pdf-lib` | Embed/extract markdown attachment in PDF |
| `puppeteer-core` + `@puppeteer/browsers` | Headless PDF generation |
| `paged.js` | CSS pagination for preview (same as example.html) |
| orz-how/markdown-parser | Custom markdown → HTML |
| `split.js` | Resizable panes in preview WebView (already in example.html) |

### 9. Watch Out For

- **PDF/print fidelity**: Always generate PDFs via the same headless Chromium path + same HTML template. Never use a different PDF library to generate the page layout.
- **WebView CSP**: Allowlist only local extension resources and trusted CDNs. Avoid `unsafe-inline` scripts; use nonces.
- **Puppeteer bundling**: Puppeteer adds ~300 MB if it downloads Chromium. Use `puppeteer-core` and point it at a system Chromium, or use VS Code's built-in Electron Chromium via `electron`'s `--print-to-pdf` flag to avoid the download entirely.
- **First-time create**: When creating a new `.md.pdf`, generate a minimal valid PDF with the markdown source attached. `pdf-lib` can create a blank PDF for this.