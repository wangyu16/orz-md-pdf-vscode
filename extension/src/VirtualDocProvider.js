'use strict';

const vscode = require('vscode');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Manages a real temporary .md file on disk that the user edits freely.
 *
 * Why a real file instead of a TextDocumentContentProvider:
 *   TextDocumentContentProvider documents are always read-only in VS Code.
 *   Writing to a real temp file gives the user a fully editable document with
 *   markdown syntax highlighting, find/replace, undo history, etc.
 *
 * The temp file path is deterministic (derived from the .md.pdf path via a short hash),
 * so VS Code can restore the text-editor tab across sessions and find the same file.
 */
class VirtualDocProvider {
    constructor() {
        /** @type {Map<string, string>} mdPdfFsPath → temp file fsPath */
        this._tempFiles = new Map();
        /** @type {Map<string, vscode.Uri>} temp file URI string → md.pdf URI */
        this._mdPdfUrisByTempUri = new Map();
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
            // Name the temp file after the original so the tab title is recognisable.
            // Use a hash of the full path so the same .md.pdf always maps to the same
            // temp file — this lets VS Code restore the text-editor tab across sessions
            // without hitting a "file not found" error.
            const base = path.basename(mdPdfUri.fsPath, '.md.pdf');
            const hash = crypto.createHash('md5').update(key).digest('hex').slice(0, 8);
            tempPath = path.join(os.tmpdir(), `mdpdf-${base}-${hash}.md`);
            this._tempFiles.set(key, tempPath);
        }

        // Always write the current markdown so the file is up to date.
        fs.writeFileSync(tempPath, markdown, 'utf8');
        const tempUri = vscode.Uri.file(tempPath);
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
            fs.writeFileSync(tempPath, markdown, 'utf8');
        }
    }

    /**
     * Get the temp file URI for a .md.pdf URI (returns null if not yet created).
     * @param {vscode.Uri} mdPdfUri
     * @returns {vscode.Uri | null}
     */
    getTempUri(mdPdfUri) {
        const tempPath = this._tempFiles.get(mdPdfUri.fsPath);
        return tempPath ? vscode.Uri.file(tempPath) : null;
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
            this._mdPdfUrisByTempUri.delete(vscode.Uri.file(tempPath).toString());
            try { fs.unlinkSync(tempPath); } catch {}
            this._tempFiles.delete(mdPdfUri.fsPath);
        }
    }

    /**
     * @deprecated kept for call-site compatibility during transition
     * No-op — temp files do not need a separate "set" step.
     */
    set() {}

    dispose() {
        // Clean up all temp files.
        for (const [, tempPath] of this._tempFiles) {
            this._mdPdfUrisByTempUri.delete(vscode.Uri.file(tempPath).toString());
            try { fs.unlinkSync(tempPath); } catch {}
        }
        this._tempFiles.clear();
        this._mdPdfUrisByTempUri.clear();
    }
}

module.exports = { VirtualDocProvider };
