'use strict';

const { CORE_DEFAULT_SETTINGS, CORE_SETTING_KEY_MAP } = require('./settings-schema');
const { resolvePresetName } = require('../fonts/registry');
const { extractNymlBlocks, normalizeKey } = require('../nyml/extract');

function coerceValue(value, type) {
    if (type === 'number') {
        const parsed = parseFloat(String(value).trim());
        return Number.isFinite(parsed) ? parsed : undefined;
    }

    if (type === 'boolean') {
        const normalized = String(value).trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
        return undefined;
    }

    return String(value);
}

function normalizeChoiceValue(value) {
    return String(value || '').trim().toLowerCase();
}

function parseDynamicChoices(rawValue) {
    if (rawValue === undefined || rawValue === null) {
        return {};
    }

    if (typeof rawValue === 'object' && !Array.isArray(rawValue)) {
        const choices = {};
        for (const [rawKey, rawChoiceValue] of Object.entries(rawValue)) {
            const key = normalizeKey(rawKey);
            const value = normalizeChoiceValue(rawChoiceValue);
            if (key && value) {
                choices[key] = value;
            }
        }
        return choices;
    }

    const choices = {};
    const lines = String(rawValue).split(/\r?\n/);

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            continue;
        }

        const separatorIndex = trimmed.indexOf(':');
        if (separatorIndex === -1) {
            continue;
        }

        const key = normalizeKey(trimmed.slice(0, separatorIndex));
        const value = normalizeChoiceValue(trimmed.slice(separatorIndex + 1));
        if (key && value) {
            choices[key] = value;
        }
    }

    return choices;
}

function normalizePageSize(value) {
    const normalized = String(value || '').trim().toLowerCase();
    const aliases = {
        a3: 'A3',
        a4: 'A4',
        a5: 'A5',
        letter: 'Letter',
        legal: 'Legal',
    };

    return aliases[normalized] || String(value);
}

function normalizeSettingValue(target, value) {
    if (target === 'fontPreset') {
        return resolvePresetName(value);
    }

    // fontHeadingPreset and fontMarginBoxPreset: empty/none means "same as body"
    if (target === 'fontHeadingPreset' || target === 'fontMarginBoxPreset') {
        const str = String(value || '').trim().toLowerCase();
        return (str === '' || str === 'none') ? '' : resolvePresetName(value);
    }

    // theme: empty/none means "no theme"
    if (target === 'theme') {
        const str = String(value || '').trim().toLowerCase();
        return (str === '' || str === 'none') ? '' : String(value).trim();
    }

    // template: empty/none means "no template"
    if (target === 'template') {
        const str = String(value || '').trim().toLowerCase();
        return (str === '' || str === 'none') ? '' : String(value).trim();
    }

    // pageBackground: empty/none means "no background color"
    if (target === 'pageBackground') {
        const str = String(value || '').trim();
        const lower = str.toLowerCase();
        return (lower === '' || lower === 'none') ? '' : str;
    }

    if (target === 'pageSize') {
        return normalizePageSize(value);
    }

    return value;
}

function extractDocumentSettings(html) {
    // Returns only explicitly-set values (sparse object).
    // Callers should merge with CORE_DEFAULT_SETTINGS and any template layer
    // via mergeCoreSettings(templateSettings, explicitSettings).
    const settings = {};

    for (const block of extractNymlBlocks(html)) {
        const blockKind = normalizeKey(block.kind || 'document');
        if (blockKind && blockKind !== 'document') {
            continue;
        }

        for (const [rawKey, rawValue] of Object.entries(block)) {
            if (rawKey === 'kind') {
                continue;
            }

            const normalizedKey = normalizeKey(rawKey);
            if (normalizedKey === 'dynamic_choices') {
                settings.dynamicChoices = parseDynamicChoices(rawValue);
                continue;
            }

            const mapping = CORE_SETTING_KEY_MAP[normalizedKey];
            if (!mapping) {
                continue;
            }

            const coerced = coerceValue(rawValue, mapping.type);
            if (coerced !== undefined) {
                settings[mapping.target] = normalizeSettingValue(mapping.target, coerced);
            }
        }
    }

    // firstPageSkipNumber shorthand: if the user set it but not pageNumberStartPage, derive it
    if (settings.firstPageSkipNumber && settings.pageNumberStartPage === undefined) {
        settings.pageNumberStartPage = 2;
    }

    return settings;
}

module.exports = {
    extractDocumentSettings,
};