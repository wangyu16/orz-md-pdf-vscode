# ORZ MD-PDF Editor

Edit and preview `.md.pdf` files in VS Code — a hybrid format that is simultaneously a **valid PDF** and a **Markdown source file**, all in one binary.

## What is `.md.pdf`?

A `.md.pdf` file is a real PDF that can be opened by any PDF viewer. The Markdown source used to generate its pages is embedded inside the PDF binary. This extension extracts that source for editing, renders a live paged preview, and saves both the updated Markdown and the regenerated PDF pages back into a single file on demand.

## Requirements

- VS Code 1.88 or later.
- The **[ORZ Markdown Preview](https://marketplace.visualstudio.com/items?itemName=yuwang26.orz-md-preview)** extension (`yuwang26.orz-md-preview`) — installed automatically as a dependency.
- A Chromium or Chrome browser for PDF export. On most Linux systems:

  ```bash
  sudo apt install chromium-browser   # Debian / Ubuntu
  sudo dnf install chromium           # Fedora
  ```

  On macOS and Windows, Chrome is typically found automatically. The live preview works without Chrome.

## Features

- **Live split-view preview** — the Markdown editor and a paged.js-rendered preview open side by side automatically. The preview updates 0.5 s after you stop typing, preserving scroll position without flashing.
- **Accurate page layout** — preview and export use [paged.js](https://pagedjs.org/) for print-accurate pagination with configurable page size, margins, and fonts.
- **Rich Markdown** — powered by `yuwang26.orz-md-preview`: math (KaTeX), diagrams (Mermaid), chemical structures (SMILES Drawer), code highlighting, custom containers, tabs, QR codes, and more.
- **Local fonts** — font presets use your system's installed fonts; no external font requests are made.
- **Auto-save and manual save** — edits are kept in memory; the `.md.pdf` file is updated on `Ctrl+S` or every 60 seconds automatically.
- **One-click PDF export** — click the **↓ Export PDF** button in the preview panel or use the command palette to export a clean PDF with a date-stamped filename.
- **Convert existing Markdown** — right-click any `.md` file in the Explorer to convert it into a `.md.pdf`.

## Getting Started

### Create a new file

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
2. Run **MD-PDF: New File**.
3. Choose a save location and name (`.md.pdf` extension is added automatically).
4. The file opens with a welcome template — start editing the Markdown on the left.

### Convert an existing `.md` file

- **Right-click** a `.md` file in the Explorer and choose **MD-PDF: Convert .md to .md.pdf**, or
- Run **MD-PDF: Convert .md to .md.pdf** from the Command Palette and pick the file.

The converted `.md.pdf` is created next to the original and opened immediately.

### Open an existing `.md.pdf`

Double-click any `.md.pdf` file in the Explorer. The extension opens the Markdown editor on one side and the live preview on the other.

## Commands

| Command | Description |
|---|---|
| **MD-PDF: New File** | Create a new `.md.pdf` with a welcome template |
| **MD-PDF: Convert .md to .md.pdf** | Convert a Markdown file into the `.md.pdf` format |
| **MD-PDF: Export as Pure PDF** | Export a clean `.pdf` (no embedded source) with a date-stamped name |
| **MD-PDF: Toggle Preview Panel** | Show or hide the live preview panel |

## Saving and Exporting

| Action | What happens |
|---|---|
| `Ctrl+S` inside the Markdown editor | Saves edits back into the `.md.pdf` file |
| Auto-save (every 60 s) | Same as above, triggered automatically |
| **↓ Export PDF** button / Export command | Writes `<name>-YYYY-MM-DD.pdf` alongside the `.md.pdf` |

## Document Settings

Configure your document via a `{{nyml ...}}` block at the top of the Markdown source:

```
{{nyml
kind: document
page_size: A4
font_preset: noto-serif
font_size: 11
margin_top: 20
margin_bottom: 20
margin_left: 25
margin_right: 25
}}
```

Common font presets: `system-serif`, `inter`, `noto-serif`, `noto-sans`, `noto-serif-sc`, `noto-sans-sc`, `lora`, `crimson-pro`, `ibm-plex-sans`.

## Known Limitations

- PDF export requires a local Chrome/Chromium binary (Puppeteer). The live preview works without it.
- KaTeX math CSS is loaded from a CDN (`cdn.jsdelivr.net`); math display requires network access on first load.
