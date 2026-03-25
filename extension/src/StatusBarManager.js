'use strict';

const vscode = require('vscode');

const STATES = {
    idle: { text: '$(edit) MD-PDF', tooltip: 'Click to toggle preview' },
    rendering: { text: '$(sync~spin) MD-PDF: Rendering\u2026', tooltip: 'Rendering preview' },
    saving: { text: '$(sync~spin) MD-PDF: Saving\u2026', tooltip: 'Saving document' },
    ready: { text: '$(check) MD-PDF', tooltip: 'Preview up to date' },
    error: { text: '$(error) MD-PDF Error', tooltip: '' },
};

/**
 * Manages the single status bar item that reflects the current .md.pdf editor state.
 * Only visible when a .md.pdf custom editor is the active editor.
 */
class StatusBarManager {
    /**
     * @param {vscode.ExtensionContext} context
     */
    constructor(context) {
        this._item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this._item.command = 'orzMdPdf.togglePreview';
        this._exportItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 101);
        this._exportItem.command = 'orzMdPdf.exportPdf';
        this._exportItem.text = '$(export)';
        this._exportItem.tooltip = 'Export as pure PDF';
        context.subscriptions.push(this._item, this._exportItem);
        this._state = 'idle';
        this._errorMessage = undefined;

        const refresh = () => this.refreshVisibility();
        context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(refresh));
        if (vscode.window.tabGroups && typeof vscode.window.tabGroups.onDidChangeTabs === 'function') {
            context.subscriptions.push(vscode.window.tabGroups.onDidChangeTabs(refresh));
        }
        if (vscode.window.tabGroups && typeof vscode.window.tabGroups.onDidChangeTabGroups === 'function') {
            context.subscriptions.push(vscode.window.tabGroups.onDidChangeTabGroups(refresh));
        }

        this.setState('idle');
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
        this._item.tooltip = this._state === 'error' && this._errorMessage ? this._errorMessage : cfg.tooltip;
        this._item.backgroundColor =
            this._state === 'error'
                ? new vscode.ThemeColor('statusBarItem.errorBackground')
                : undefined;
        this._item.show();
        this._exportItem.show();
    }

    _isMdPdfEditorActive() {
        const activeTab = vscode.window.tabGroups?.activeTabGroup?.activeTab;
        const input = activeTab?.input;
        return Boolean(
            input &&
            typeof input === 'object' &&
            input.viewType === 'orzMdPdf.editor' &&
            input.uri
        );
    }

    hide() {
        this._item.hide();
        this._exportItem.hide();
    }
}

module.exports = { StatusBarManager };
