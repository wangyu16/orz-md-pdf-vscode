'use strict';

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { WELCOME_MARKDOWN } = require('../MdPdfDocument');
const { Pipeline } = require('../Pipeline');
const { embedMarkdownInPdf } = require('../../../pipeline-model/src/embed');

/**
 * "MD-PDF: New File" command.
 *
 * Shows a save dialog, writes a seed .md.pdf file, then opens it
 * with the custom editor. The MdPdfDocument factory detects the
 * empty/blank file and seeds it with WELCOME_MARKDOWN automatically.
 *
 * @param {vscode.ExtensionContext} context
 */
function registerNewFileCommand(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('orzMdPdf.newFile', async () => {
            const saveUri = await vscode.window.showSaveDialog({
                title: 'Create New MD-PDF File',
                filters: { 'MD-PDF Document': ['md.pdf'] },
                saveLabel: 'Create',
            });
            if (!saveUri) return;

            // Build a seed .md.pdf from the welcome template.
            await vscode.window.withProgress(
                { location: vscode.ProgressLocation.Notification, title: 'Creating MD-PDF file…', cancellable: false },
                async () => {
                    try {
                        const fakeUri = vscode.Uri.file(saveUri.fsPath);
                        const pdfBytes = await Pipeline.buildPdf(WELCOME_MARKDOWN, fakeUri);
                        const embedded = await embedMarkdownInPdf(Buffer.from(pdfBytes), WELCOME_MARKDOWN);
                        fs.mkdirSync(path.dirname(saveUri.fsPath), { recursive: true });
                        fs.writeFileSync(saveUri.fsPath, Buffer.from(embedded));
                    } catch (err) {
                        vscode.window.showErrorMessage(`MD-PDF: Failed to create file — ${err.message}`);
                        return;
                    }
                }
            );

            // Open the new file with the custom editor.
            await vscode.commands.executeCommand('vscode.openWith', saveUri, 'orzMdPdf.editor');
        })
    );
}

module.exports = { registerNewFileCommand };
