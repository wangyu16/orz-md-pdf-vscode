'use strict';

const path = require('path');

const DEFAULT_PREVIEW_PORT = 3000;
const DEFAULT_PREVIEW_SOURCE = path.resolve(__dirname, '../../test/core-smoke.md');

function resolvePreviewPort(cliArg) {
    const rawValue = cliArg || process.env.MDPDF_PREVIEW_PORT;
    if (!rawValue) {
        return DEFAULT_PREVIEW_PORT;
    }

    const parsed = parseInt(rawValue, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PREVIEW_PORT;
}

function resolvePreviewSource(cliArg) {
    if (!cliArg) {
        return DEFAULT_PREVIEW_SOURCE;
    }

    return path.resolve(cliArg);
}

module.exports = {
    DEFAULT_PREVIEW_PORT,
    DEFAULT_PREVIEW_SOURCE,
    resolvePreviewPort,
    resolvePreviewSource,
};