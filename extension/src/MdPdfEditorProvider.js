'use strict';

const vscode = require('vscode');
const { MdPdfDocument } = require('./MdPdfDocument');
const { VirtualDocProvider } = require('./VirtualDocProvider');
const { PreviewWebview } = require('./PreviewWebview');

const DEBOUNCE_MS = 500;
const AUTO_SAVE_MS = 60 * 1000;

/**
 * Custom Editor Provider for *.md.pdf files.
 *
 * Lifecycle per file open:
 *   openCustomDocument  → creates MdPdfDocument (extracts markdown from the binary PDF)
 *   resolveCustomEditor → wires up PreviewWebview + virtual text editor
 *
 * A single MdPdfDocument can have multiple webview panels (e.g., the user opens
 * the same file in a second column). Each panel gets its own PreviewWebview instance.
 */
class MdPdfEditorProvider {
    /**
     * @param {vscode.ExtensionContext} context
     * @param {VirtualDocProvider} virtualDocProvider
     * @param {import('./StatusBarManager').StatusBarManager} statusBar
     */
    constructor(context, virtualDocProvider, statusBar) {
        this._context = context;
        this._virtualDocProvider = virtualDocProvider;
        this._statusBar = statusBar;

        /** @type {Map<string, Set<PreviewWebview>>} fsPath → set of preview instances */
        this._previews = new Map();

        /** @type {Map<string, { tempUri: vscode.Uri, disposables: vscode.Disposable[], autoSaveTimer: NodeJS.Timeout | null, pendingManualSave: boolean }>} */
        this._documentBindings = new Map();

        /** @type {Map<string, NodeJS.Timeout>} fsPath → pending debounce timer for preview only */
        this._debounceTimers = new Map();

        /** @type {Map<string, Promise<void>>} fsPath → in-flight save promise */
        this._saveOperations = new Map();

        /**
         * VS Code requires this event to be on the provider to track dirty state.
         * We fire CustomDocumentContentChangeEvent (simpler form — no undo/redo).
         * This makes the custom editor tab show a dot when the document is dirty
         * and enables Ctrl+S to trigger saveCustomDocument.
         * @type {vscode.EventEmitter<vscode.CustomDocumentContentChangeEvent<import('./MdPdfDocument').MdPdfDocument>>}
         */
        this._onDidChangeEmitter = new vscode.EventEmitter();
        /** @type {vscode.Event<vscode.CustomDocumentContentChangeEvent<import('./MdPdfDocument').MdPdfDocument>>} */
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
        return vscode.window.registerCustomEditorProvider('orzMdPdf.editor', this, {
            webviewOptions: {
                retainContextWhenHidden: true,   // keep paged.js state when tab is not visible
            },
            supportsMultipleEditorsPerDocument: false,
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

        // Track the preview instance for this document.
        const key = document.uri.fsPath;
        if (!this._previews.has(key)) this._previews.set(key, new Set());
        this._previews.get(key).add(preview);

        webviewPanel.onDidDispose(() => {
            this._previews.get(key)?.delete(preview);
            this._statusBar.refreshVisibility();
        });

        // Open the text editor in the column opposite to where the webview landed,
        // creating a side-by-side split without touching the webview panel.
        // If the webview is in column 1, open text beside it (→ col 2).
        // If the webview is already in col 2+, open text in col 1 (preferred order).
        const textColumn = webviewPanel.viewColumn === vscode.ViewColumn.One
            ? vscode.ViewColumn.Beside
            : vscode.ViewColumn.One;

        const tempUri = await this._openVirtualEditor(document, textColumn);
        this._ensureDocumentBindings(document, tempUri);

        // Render the initial preview (now in the right column).
        await preview.initialize();

        // Keep the status bar in sync when this panel gains focus.
        webviewPanel.onDidChangeViewState((e) => {
            if (e.webviewPanel.active) {
                this._statusBar.setState('ready');
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
        // Overwrite the temp file with the reverted markdown so the text editor
        // picks up the change via the file-system watcher built into VS Code.
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

            const textDoc = await vscode.workspace.openTextDocument(binding.tempUri);
            await vscode.window.showTextDocument(textDoc, {
                viewColumn: vscode.ViewColumn.One,
                preserveFocus: false,
                preview: false,
            });
            return true;
        }

        const activeEditor = vscode.window.activeTextEditor;
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
    async _openVirtualEditor(document, viewColumn = vscode.ViewColumn.Beside) {
        try {
            const tempUri = this._virtualDocProvider.getOrCreateTempFile(
                document.uri,
                document.markdown
            );
            const textDoc = await vscode.workspace.openTextDocument(tempUri);
            await vscode.window.showTextDocument(textDoc, {
                viewColumn,
                preserveFocus: false,
                preview: false,
            });
            return tempUri;
        } catch {
            // Non-fatal.
            return null;
        }
    }

    _ensureDocumentBindings(document, tempUri) {
        if (!tempUri) return;

        const key = document.uri.fsPath;
        if (this._documentBindings.has(key)) return;

        const disposables = [
            vscode.workspace.onDidChangeTextDocument((e) => {
                if (e.document.uri.toString() !== tempUri.toString()) return;

                const newMarkdown = e.document.getText();
                document.markdown = newMarkdown;
                this._statusBar.setState('idle');
                this._schedulePreviewUpdate(document, newMarkdown);
                this._scheduleAutoSave(document);
            }),
            vscode.workspace.onWillSaveTextDocument((e) => {
                if (e.document.uri.toString() !== tempUri.toString()) return;

                const binding = this._documentBindings.get(key);
                if (!binding) return;

                binding.pendingManualSave = e.reason === vscode.TextDocumentSaveReason.Manual;
            }),
            vscode.workspace.onDidSaveTextDocument(async (savedDoc) => {
                if (savedDoc.uri.toString() !== tempUri.toString()) return;

                const binding = this._documentBindings.get(key);
                if (!binding || !binding.pendingManualSave) return;

                binding.pendingManualSave = false;
                this._clearAutoSaveTimer(key);

                try {
                    await this._saveDocument(document, document.uri, new vscode.CancellationTokenSource().token);
                } catch {
                    // Error already surfaced by _saveDocument.
                }
            }),
        ];

        this._documentBindings.set(key, {
            tempUri,
            disposables,
            autoSaveTimer: null,
            pendingManualSave: false,
        });
    }

    async _saveDocument(document, destination, cancellation) {
        const key = document.uri.fsPath;
        const inFlight = this._saveOperations.get(key);
        if (inFlight) {
            return inFlight;
        }

        const operation = (async () => {
            this._statusBar.setState('saving');
            try {
                await document.save(destination, cancellation);
                this._statusBar.setState('ready');
            } catch (err) {
                this._statusBar.setState('error', err.message);
                vscode.window.showErrorMessage(`MD-PDF save failed: ${err.message}`);
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
                await this._saveDocument(document, document.uri, new vscode.CancellationTokenSource().token);
            } catch {
                // Error already surfaced by _saveDocument.
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
        for (const group of vscode.window.tabGroups.all) {
            for (const tab of group.tabs) {
                const input = tab.input;
                if (!tab.isActive) continue;
                if (!input || typeof input !== 'object') continue;
                if (input.viewType !== 'orzMdPdf.editor') continue;
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
        if (timer) { clearTimeout(timer); this._debounceTimers.delete(key); }

        const binding = this._documentBindings.get(key);
        if (binding) {
            this._clearAutoSaveTimer(key);
            for (const disposable of binding.disposables) {
                disposable.dispose();
            }
            this._documentBindings.delete(key);
        }

        this._saveOperations.delete(key);

        // Delete the temp file.
        this._virtualDocProvider.delete(document.uri);
    }
}

module.exports = { MdPdfEditorProvider };
