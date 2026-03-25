'use strict';

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { Pipeline } = require('../Pipeline');
const { embedMarkdownInPdf } = require('../../../pipeline-model/src/embed');

/**
 * "MD-PDF: Convert .md to .md.pdf" command.
 *
 * Accepts a URI from the Explorer context menu (when right-clicking a .md file)
 * or prompts the user to choose a .md file via a file dialog.
 *
 * @param {vscode.ExtensionContext} context
 */
function registerConvertMdCommand(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('orzMdPdf.convertMd', async (contextUri) => {
            let mdUri = contextUri;

            // If invoked from command palette (no context URI), show an open dialog.
            if (!mdUri) {
                const picked = await vscode.window.showOpenDialog({
                    title: 'Select Markdown File to Convert',
                    filters: { Markdown: ['md'] },
                    canSelectMany: false,
                    openLabel: 'Convert',
                });
                if (!picked || picked.length === 0) return;
                mdUri = picked[0];
            }

            const mdPath   = mdUri.fsPath;
            const outPath  = mdPath.replace(/\.md$/, '.md.pdf');
            const outUri   = vscode.Uri.file(outPath);
            const markdown = fs.readFileSync(mdPath, 'utf8');

            await vscode.window.withProgress(
                { location: vscode.ProgressLocation.Notification, title: `Converting ${path.basename(mdPath)}…`, cancellable: false },
                async () => {
                    try {
                        const pdfBytes = await Pipeline.buildPdf(markdown, mdUri);
                        const embedded = await embedMarkdownInPdf(Buffer.from(pdfBytes), markdown);
                        fs.writeFileSync(outPath, Buffer.from(embedded));
                    } catch (err) {
                        vscode.window.showErrorMessage(`MD-PDF: Conversion failed — ${err.message}`);
                        return;
                    }
                    vscode.window.showInformationMessage(`Created ${path.basename(outPath)}`);
                }
            );

            // Open the result in the custom editor.
            await vscode.commands.executeCommand('vscode.openWith', outUri, 'orzMdPdf.editor');
        })
    );
}

module.exports = { registerConvertMdCommand };
