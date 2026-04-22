# ORZ MD-PDF Editor

Edit and preview `.md.pdf` files in VS Code — a hybrid format that is simultaneously a **valid PDF** and a **Markdown source file**, all in one binary.

## What is `.md.pdf`?

A `.md.pdf` file is a real PDF that can be opened by any PDF viewer. The Markdown source used to generate its pages is embedded inside the PDF binary. This extension extracts that source for editing, renders a live paged preview, and saves both the updated Markdown and the regenerated PDF pages back into a single file on demand.

## Features

- **Live split-view preview** — the Markdown editor and a paged.js-rendered preview open side by side automatically. The preview updates 0.5 s after you stop typing without flashing or jumping.
- **Accurate page layout** — preview and export use [paged.js](https://pagedjs.org/) for print-accurate pagination with configurable page size, margins, and fonts.
- **Rich Markdown** — syntax highlighting (highlight.js), math (KaTeX), diagrams (Mermaid), and chemical structures (SMILES Drawer).
- **Auto-save and manual save** — edits are kept in memory; the `.md.pdf` file is updated on `Ctrl+S` or every 60 seconds automatically.
- **One-click PDF export** — click the **↓ Export PDF** button in the bottom-right corner of the preview panel (or use the command palette) to export a clean PDF with a date-stamped filename.
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

## Requirements

- VS Code 1.88 or later.
- A Chromium or Chrome browser must be installed and discoverable by Puppeteer for PDF rendering. On most Linux systems, install with:

  ```bash
  sudo apt install chromium-browser   # Debian / Ubuntu
  sudo dnf install chromium           # Fedora
  ```

  On macOS and Windows, Chrome is typically found automatically.

## Known Limitations

- The preview requires an active network connection on first load to fetch paged.js, KaTeX, Mermaid, and fonts from their CDNs. Fonts are loaded from Google Fonts — if unavailable, the browser falls back to similar system fonts automatically.
- PDF export uses Puppeteer, which requires a local Chrome/Chromium binary. The preview itself works without Chrome.
