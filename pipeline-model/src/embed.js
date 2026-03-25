'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { PDFDocument } = require('pdf-lib');

async function embedMarkdownInPdf(pdfBytes, markdown) {
    const doc = await PDFDocument.load(pdfBytes);
    const encoded = Buffer.from(markdown, 'utf8');

    await doc.attach(encoded, 'source.md', {
        mimeType: 'text/markdown',
        description: 'Markdown source for this document',
        creationDate: new Date(),
        modificationDate: new Date(),
    });

    return doc.save();
}

async function extractMarkdownFromPdf(pdfBytes) {
    const { PDFName, PDFDict, PDFArray } = require('pdf-lib');
    const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const catalog = doc.catalog;
    const namesDict = catalog.lookupMaybe(PDFName.of('Names'), PDFDict);
    if (!namesDict) return null;

    const embeddedFiles = namesDict.lookupMaybe(PDFName.of('EmbeddedFiles'), PDFDict);
    if (!embeddedFiles) return null;

    const namesArray = embeddedFiles.lookupMaybe(PDFName.of('Names'), PDFArray);
    if (!namesArray) return null;

    for (let index = 0; index + 1 < namesArray.size(); index += 2) {
        const nameObj = namesArray.lookup(index);
        const nameStr = nameObj.decodeText ? nameObj.decodeText() : nameObj.asString();
        if (nameStr !== 'source.md') continue;

        const fileSpec = namesArray.lookup(index + 1, PDFDict);
        const efDict = fileSpec.lookupMaybe(PDFName.of('EF'), PDFDict);
        if (!efDict) return null;

        const fileStream = efDict.lookup(PDFName.of('F'));
        if (!fileStream) return null;

        const rawBytes = fileStream.getContents();
        const buffer = Buffer.from(rawBytes);
        if (buffer.length >= 2 && buffer[0] === 0x78) {
            return zlib.inflateSync(buffer).toString('utf8');
        }
        return buffer.toString('utf8');
    }

    return null;
}

module.exports = { embedMarkdownInPdf, extractMarkdownFromPdf };

if (require.main === module) {
    const inputPdf = path.resolve(process.argv[2] || path.join(__dirname, '../out/core-smoke.pdf'));
    const inputMd = path.resolve(process.argv[3] || path.join(__dirname, '../test/core-smoke.md'));
    const outputMdPdf = path.resolve(process.argv[4] || path.join(__dirname, '../out/core-smoke.md.pdf'));

    (async () => {
        if (!fs.existsSync(inputPdf)) {
            console.error(`Input PDF not found: ${inputPdf}`);
            process.exit(1);
        }

        const pdfBytes = fs.readFileSync(inputPdf);
        const markdown = fs.readFileSync(inputMd, 'utf8');
        const mdPdfBytes = await embedMarkdownInPdf(pdfBytes, markdown);
        fs.writeFileSync(outputMdPdf, mdPdfBytes);

        const extracted = await extractMarkdownFromPdf(mdPdfBytes);
        if (extracted !== markdown) {
            console.error('Round-trip failed: extracted markdown does not match original.');
            process.exit(1);
        }

        console.log(`Embedded markdown round-trip passed: ${outputMdPdf}`);
    })().catch((error) => {
        console.error('Embed error:', error.message);
        process.exit(1);
    });
}