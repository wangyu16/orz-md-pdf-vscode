'use strict';

const bookTemplates = require('./builtins/tem-book');
const academicTemplates = require('./builtins/tem-academic');
const examTemplates = require('./builtins/tem-exam');
const handoutTemplates = require('./builtins/tem-handout');
const reportTemplates = require('./builtins/tem-report');
const notesTemplates = require('./builtins/tem-notes');
const cvTemplates = require('./builtins/tem-cv');

const TEMPLATE_DEFINITIONS = Object.assign(
    {},
    bookTemplates,
    academicTemplates,
    examTemplates,
    handoutTemplates,
    reportTemplates,
    notesTemplates,
    cvTemplates
);

function normalizeTemplateName(value) {
    return String(value || '').trim().toLowerCase();
}

function resolveDocumentTemplate(templateName) {
    const normalized = normalizeTemplateName(templateName);
    if (!normalized) {
        return null;
    }

    const template = TEMPLATE_DEFINITIONS[normalized];
    if (!template) {
        return null;
    }

    return {
        name: normalized,
        settings: Object.assign({}, template.settings),
        cssText: String(template.cssText || '').trim(),
    };
}

module.exports = {
    TEMPLATE_DEFINITIONS,
    resolveDocumentTemplate,
};