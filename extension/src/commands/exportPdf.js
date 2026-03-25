'use strict';

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { Pipeline } = require('../Pipeline');
const { resolveImages } = require('../ImageResolver');

/**
 * "MD-PDF: Export as Pure PDF" command.
 *
 * Builds a clean PDF (no embedded markdown source) and writes it to a
 * timestamped filename beside the .md.pdf file.
 *
 * Requires an active custom editor document to be tracked via the
 * VirtualDocProvider (its URI is used to look up the current markdown).
 *
 * @param {vscode.ExtensionContext} context
 * @param {import('../VirtualDocProvider').VirtualDocProvider} virtualDocProvider
 */
function registerExportPdfCommand(context, virtualDocProvider) {
    context.subscriptions.push(
        vscode.commands.registerCommand('orzMdPdf.exportPdf', async () => {
            // Determine which .md.pdf is currently active.
            const mdPdfUri = _getActiveMdPdfUri();
            if (!mdPdfUri) {
                vscode.window.showErrorMessage('MD-PDF: No active .md.pdf editor found.');
                return;
            }

            // Retrieve the current markdown from the temp .md file tracked by virtualDocProvider.
            const tempUri = virtualDocProvider.getTempUri(mdPdfUri);
            const textDoc = tempUri
                ? vscode.workspace.textDocuments.find((d) => d.uri.toString() === tempUri.toString())
                : null;
            if (!textDoc) {
                vscode.window.showErrorMessage('MD-PDF: Could not find the open markdown document. Please ensure the .md.pdf file is open in the editor.');
                return;
            }

            const markdown = textDoc.getText();
            const mdPdfPath = mdPdfUri.fsPath;

            // Build a timestamped output path.
            const now = new Date();
            const stamp = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0'),
                String(now.getDate()).padStart(2, '0'),
            ].join('-');

            // example.md.pdf → example-2026-03-24.pdf
            const base = path.basename(mdPdfPath, '.md.pdf');
            const dir  = path.dirname(mdPdfPath);
            let outPath = path.join(dir, `${base}-${stamp}.pdf`);

            // Avoid overwriting an existing export.
            if (fs.existsSync(outPath)) {
                const answer = await vscode.window.showWarningMessage(
                    `${path.basename(outPath)} already exists. Overwrite?`,
                    { modal: true },
                    'Overwrite'
                );
                if (answer !== 'Overwrite') return;
            }

            await vscode.window.withProgress(
                { location: vscode.ProgressLocation.Notification, title: 'Exporting PDF…', cancellable: false },
                async () => {
                    try {
                        // Resolve local images before passing to Puppeteer.
                        const resolvedMd = resolveImages(markdown, mdPdfUri);
                        const pdfBytes = await Pipeline.buildPdf(resolvedMd, mdPdfUri);
                        fs.writeFileSync(outPath, Buffer.from(pdfBytes));
                    } catch (err) {
                        vscode.window.showErrorMessage(`MD-PDF: Export failed — ${err.message}`);
                        return;
                    }

                    const outUri = vscode.Uri.file(outPath);
                    const action = await vscode.window.showInformationMessage(
                        `Exported: ${path.basename(outPath)}`,
                        'Open PDF'
                    );
                    if (action === 'Open PDF') {
                        vscode.env.openExternal(outUri);
                    }
                }
            );
        })
    );
}

/**
 * Attempt to find the URI of the currently active .md.pdf custom editor
 * by inspecting the tab groups.
 * @returns {vscode.Uri | null}
 */
function _getActiveMdPdfUri() {
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

module.exports = { registerExportPdfCommand };
