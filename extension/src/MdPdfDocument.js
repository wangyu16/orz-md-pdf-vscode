'use strict';

const vscode = require('vscode');
const path = require('path');
const { embedMarkdownInPdf, extractMarkdownFromPdf } = require('./pipeline/embed');
const { Pipeline } = require('./Pipeline');

const WELCOME_MARKDOWN = `\
{{nyml
kind: document
page_size: A4
font_preset: noto-serif
}}

# Welcome

Start editing your document here.
`;

/**
 * Represents an open .md.pdf document.
 * Implements the vscode.CustomDocument interface (uri + dispose()).
 * vscode.CustomDocument is a TypeScript interface — there is no runtime
 * class to extend, so we implement it directly.
 */
class MdPdfDocument {
    /**
     * @param {vscode.Uri} uri
     * @param {string} markdown  - current (edited) markdown source
     * @param {Uint8Array} savedBytes  - bytes of the most recently persisted .md.pdf
     */
    constructor(uri, markdown, savedBytes) {
        /** @type {vscode.Uri} */
        this.uri = uri;
        /** @type {string} */
        this.markdown = markdown;
        /** @private @type {string} */
        this._persistedMarkdown = markdown;
        /** @private @type {Uint8Array} */
        this._savedBytes = savedBytes;
        /** @private */
        this._onDidDisposeEmitter = new vscode.EventEmitter();
        /** Fires when VS Code disposes this document (all editors for it are closed). */
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
        // If a backup exists, restore from it (the backup stores raw markdown text).
        if (openContext.backupId) {
            const backupUri = vscode.Uri.parse(openContext.backupId);
            try {
                const backupBytes = await vscode.workspace.fs.readFile(backupUri);
                const markdown = Buffer.from(backupBytes).toString('utf8');
                // Read the real file bytes for re-embedding.
                const fileBytes = await MdPdfDocument._readFileSafe(uri);
                return new MdPdfDocument(uri, markdown, fileBytes);
            } catch {
                // Fall through to normal open if backup is unreadable.
            }
        }

        const fileBytes = await MdPdfDocument._readFileSafe(uri);
        let markdown = null;

        if (fileBytes && fileBytes.length > 4) {
            // Try to extract embedded markdown from an existing PDF.
            try {
                markdown = await extractMarkdownFromPdf(fileBytes);
            } catch {
                markdown = null;
            }
        }

        // Seed with welcome template for blank / non-PDF / non-embedded files.
        if (!markdown) {
            markdown = WELCOME_MARKDOWN;
        }

        return new MdPdfDocument(uri, markdown, fileBytes || new Uint8Array(0));
    }

    /**
     * @param {vscode.Uri} uri
     * @returns {Promise<Uint8Array | null>}
     */
    static async _readFileSafe(uri) {
        try {
            return await vscode.workspace.fs.readFile(uri);
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
        await vscode.workspace.fs.writeFile(destination, bytes);
        this._savedBytes = bytes;
        this._persistedMarkdown = this.markdown;
    }

    /**
     * Revert to the on-disk version.
     * @param {vscode.CancellationToken} _token
     */
    async revert(_token) {
        const fileBytes = await MdPdfDocument._readFileSafe(this.uri);
        if (!fileBytes) return;
        let markdown = null;
        try { markdown = await extractMarkdownFromPdf(fileBytes); } catch {}
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
        const mdBytes = Buffer.from(this.markdown, 'utf8');
        await vscode.workspace.fs.writeFile(destination, mdBytes);
        return {
            id: destination.toString(),
            delete: async () => {
                try { await vscode.workspace.fs.delete(destination); } catch {}
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
}

module.exports = { MdPdfDocument, WELCOME_MARKDOWN };
