'use strict';

const vscode = require('vscode');
const { MdPdfEditorProvider } = require('./MdPdfEditorProvider');
const { VirtualDocProvider } = require('./VirtualDocProvider');
const { StatusBarManager } = require('./StatusBarManager');
const { registerNewFileCommand } = require('./commands/newFile');
const { registerConvertMdCommand } = require('./commands/convertMd');
const { registerExportPdfCommand } = require('./commands/exportPdf');

/** @type {VirtualDocProvider} */
let virtualDocProvider;

/** @type {StatusBarManager} */
let statusBarManager;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    virtualDocProvider = new VirtualDocProvider();
    statusBarManager = new StatusBarManager(context);
    const editorProvider = new MdPdfEditorProvider(context, virtualDocProvider, statusBarManager);

    // Register the custom editor provider for *.md.pdf files.
    context.subscriptions.push(editorProvider);
    context.subscriptions.push(editorProvider.register());

    context.subscriptions.push(
        vscode.commands.registerCommand('orzMdPdf.togglePreview', async () => {
            const handled = await editorProvider.toggleActivePreview();
            if (!handled) {
                vscode.window.showInformationMessage('MD-PDF: No paired preview editor is available for the active document.');
            }
        })
    );

    // Register extension commands.
    registerNewFileCommand(context);
    registerConvertMdCommand(context);
    registerExportPdfCommand(context, virtualDocProvider);
}

function deactivate() {}

module.exports = { activate, deactivate };
