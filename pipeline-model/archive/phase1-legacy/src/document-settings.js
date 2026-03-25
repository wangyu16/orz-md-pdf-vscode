'use strict';

const { parse: parseHtmlFragment } = require('node-html-parser');

const { BUILT_IN_ELEMENT_DEFINITIONS } = require('./builtins');
const { parseMarkdown } = require('./parse');

const DEFAULT_DOCUMENT_FLAGS = {
    limitImageToPage: true,
    keepImageTogether: true,
    repeatTableHeader: true,
    avoidTableRowBreaks: true,
    dynamicChoices: {},
};

const KEY_MAP = {
    template: { target: 'documentTemplate', type: 'string' },
    document_template: { target: 'documentTemplate', type: 'string' },
    page_size: { target: 'pageSize', type: 'string' },
    margin_top: { target: 'marginTop', type: 'number' },
    margin_bottom: { target: 'marginBottom', type: 'number' },
    margin_left: { target: 'marginLeft', type: 'number' },
    margin_right: { target: 'marginRight', type: 'number' },
    font_preset: { target: 'fontPreset', type: 'string' },
    font_family: { target: 'fontFamily', type: 'string' },
    font_size: { target: 'fontSize', type: 'number' },
    line_height: { target: 'lineHeight', type: 'number' },
    theme: { target: 'theme', type: 'string' },
    decoration_color: { target: 'decorationColor', type: 'string' },
    page_number_position: { target: 'pageNumberPosition', type: 'string' },
    page_number_style: { target: 'pageNumberStyle', type: 'string' },
    page_number_start_page: { target: 'pageNumberStartPage', type: 'number' },
    first_page_hide_header: { target: 'firstPageHideHeader', type: 'boolean' },
    first_page_hide_footer: { target: 'firstPageHideFooter', type: 'boolean' },
    first_page_skip_number: { target: 'firstPageSkipNumber', type: 'boolean' },
    pre_body_hide_header: { target: 'preBodyHideHeader', type: 'boolean' },
    pre_body_hide_footer: { target: 'preBodyHideFooter', type: 'boolean' },
    header_left: { target: 'headerLeft', type: 'string' },
    header_center: { target: 'headerCenter', type: 'string' },
    header_right: { target: 'headerRight', type: 'string' },
    header_rule: { target: 'headerRule', type: 'boolean' },
    header_rule_color: { target: 'headerRuleColor', type: 'string' },
    header_font_size: { target: 'headerFontSize', type: 'number' },
    footer_left: { target: 'footerLeft', type: 'string' },
    footer_center: { target: 'footerCenter', type: 'string' },
    footer_right: { target: 'footerRight', type: 'string' },
    footer_rule: { target: 'footerRule', type: 'boolean' },
    footer_rule_color: { target: 'footerRuleColor', type: 'string' },
    footer_font_size: { target: 'footerFontSize', type: 'number' },
    limit_image_to_page: { target: 'limitImageToPage', type: 'boolean' },
    keep_image_together: { target: 'keepImageTogether', type: 'boolean' },
    repeat_table_header: { target: 'repeatTableHeader', type: 'boolean' },
    avoid_table_row_breaks: { target: 'avoidTableRowBreaks', type: 'boolean' },
};

const NYML_SCRIPT_RE = /<script type="application\/json" id="nyml-data">\s*([\s\S]*?)\s*<\/script>/g;
const METADATA_SCRIPT_RE = /<script type="application\/(yaml|json)"(?: id="nyml-data")?>[\s\S]*?<\/script>\s*/g;
const SAFE_LENGTH_RE = /^\s*\d+(?:\.\d+)?(?:mm|pt|rem|em|lh)\s*$/i;
const SAFE_COLOR_RE = /^\s*(?:#[0-9a-f]{3,8}|(?:rgb|rgba|hsl|hsla)\([^\n]+\)|[a-z][a-z0-9-]*)\s*$/i;
const CUSTOM_ELEMENT_PLACEHOLDER_RE = /\[([a-zA-Z0-9_-]+)\]|\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g;
const FORBIDDEN_CUSTOM_CSS_RE = /@import|@page|url\s*\(|position\s*:\s*fixed|(^|[,{])\s*(html|body|\.markdown-body|\.pagedjs_[a-z0-9_-]+)/im;
const DYNAMIC_CHOICE_RE = /^\s*([a-zA-Z0-9_-]+)\s*=\s*(.+?)\s*$/;

function normalizeKey(key) {
    return String(key).trim().replace(/-/g, '_').toLowerCase();
}

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

function parseShowWhenCondition(rawValue) {
    const match = String(rawValue || '').match(DYNAMIC_CHOICE_RE);
    if (!match) {
        return null;
    }

    const key = normalizeKey(match[1]);
    const value = normalizeChoiceValue(match[2]);
    if (!key || !value) {
        return null;
    }

    return { key, value };
}

function matchesDynamicCondition(rawValue, dynamicChoices) {
    const condition = parseShowWhenCondition(rawValue);
    if (!condition) {
        return false;
    }

    return dynamicChoices[condition.key] === condition.value;
}

function shouldKeepConditionalNode(node, dynamicChoices) {
    const showWhen = node.getAttribute('data-show-when');
    if (showWhen !== undefined && !matchesDynamicCondition(showWhen, dynamicChoices)) {
        return false;
    }

    const hideWhen = node.getAttribute('data-hide-when');
    if (hideWhen !== undefined && matchesDynamicCondition(hideWhen, dynamicChoices)) {
        return false;
    }

    return true;
}

function stripConditionalAttributes(node) {
    if (node.getAttribute('data-show-when') !== undefined) {
        node.removeAttribute('data-show-when');
    }
    if (node.getAttribute('data-hide-when') !== undefined) {
        node.removeAttribute('data-hide-when');
    }
}

function filterConditionalNodes(html, dynamicChoices) {
    if (!html || (!/data-show-when=/i.test(html) && !/data-hide-when=/i.test(html))) {
        return html;
    }

    const root = parseHtmlFragment(`<mdpdf-root>${html}</mdpdf-root>`, {
        comment: true,
        blockTextElements: {
            script: true,
            style: true,
            pre: true,
            noscript: true,
        },
    });
    const wrapper = root.querySelector('mdpdf-root');

    if (!wrapper) {
        return html;
    }

    pruneConditionalNodes(wrapper, dynamicChoices);
    return wrapper.innerHTML;
}

function pruneConditionalNodes(node, dynamicChoices) {
    const childNodes = Array.isArray(node.childNodes) ? [...node.childNodes] : [];

    for (const childNode of childNodes) {
        if (typeof childNode.getAttribute !== 'function') {
            continue;
        }

        if (!shouldKeepConditionalNode(childNode, dynamicChoices)) {
            childNode.remove();
            continue;
        }

        stripConditionalAttributes(childNode);
        pruneConditionalNodes(childNode, dynamicChoices);
    }
}

function extractNymlEntries(html) {
    const entries = [];
    let match = NYML_SCRIPT_RE.exec(html);
    while (match) {
        try {
            const parsed = JSON.parse(match[1]);
            if (Array.isArray(parsed)) {
                entries.push(...parsed);
            }
        } catch {
            // Ignore malformed metadata scripts and fall back to defaults.
        }
        match = NYML_SCRIPT_RE.exec(html);
    }
    NYML_SCRIPT_RE.lastIndex = 0;
    return entries;
}

function entriesToBlocks(entries) {
    const blocks = [];
    let currentBlock = null;

    for (const entry of entries) {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            continue;
        }

        const keys = Object.keys(entry);
        if (keys.length !== 1) {
            continue;
        }

        const rawKey = keys[0];
        const rawValue = entry[rawKey];
        const normalizedKey = normalizeKey(rawKey);

        if (normalizedKey === 'kind') {
            if (currentBlock) {
                blocks.push(currentBlock);
            }
            currentBlock = { kind: String(rawValue).trim() };
            continue;
        }

        if (!currentBlock) {
            currentBlock = {};
        }

        currentBlock[normalizedKey] = rawValue;
    }

    if (currentBlock) {
        blocks.push(currentBlock);
    }

    return blocks;
}

function extractNymlScriptBlocks(html) {
    const scriptBlocks = [];
    let match = NYML_SCRIPT_RE.exec(html);

    while (match) {
        let blocks = [];
        try {
            const parsed = JSON.parse(match[1]);
            if (Array.isArray(parsed)) {
                blocks = entriesToBlocks(parsed);
            }
        } catch {
            blocks = [];
        }

        scriptBlocks.push({
            raw: match[0],
            blocks,
        });

        match = NYML_SCRIPT_RE.exec(html);
    }

    NYML_SCRIPT_RE.lastIndex = 0;
    return scriptBlocks;
}

function extractNymlBlocks(html) {
    return entriesToBlocks(extractNymlEntries(html));
}

function extractDocumentSettings(html) {
    const settings = Object.assign({}, DEFAULT_DOCUMENT_FLAGS);
    const blocks = extractNymlBlocks(html);

    for (const block of blocks) {
        const blockKind = normalizeKey(block.kind || '');
        if (blockKind && blockKind !== 'document') {
            continue;
        }

        const hasDynamicChoicesField = Object.prototype.hasOwnProperty.call(block, 'dynamic_choices');
        const fallbackDynamicChoices = {};

        for (const [rawKey, rawValue] of Object.entries(block)) {
            if (rawKey === 'kind') {
                continue;
            }

            const normalizedKey = normalizeKey(rawKey);
            if (normalizedKey === 'dynamic_choices') {
                settings.dynamicChoices = parseDynamicChoices(rawValue);
                continue;
            }

            const mapping = KEY_MAP[normalizedKey];
            if (!mapping && hasDynamicChoicesField) {
                const choiceValue = normalizeChoiceValue(rawValue);
                if (normalizedKey && choiceValue) {
                    fallbackDynamicChoices[normalizedKey] = choiceValue;
                }
                continue;
            }

            if (!mapping) {
                continue;
            }

            const coerced = coerceValue(rawValue, mapping.type);
            if (coerced !== undefined) {
                settings[mapping.target] = coerced;
            }
        }

        if (Object.keys(fallbackDynamicChoices).length > 0) {
            settings.dynamicChoices = Object.assign({}, fallbackDynamicChoices, settings.dynamicChoices);
        }
    }

    if (settings.pageNumberStartPage === undefined && settings.firstPageSkipNumber) {
        settings.pageNumberStartPage = 2;
    }

    return settings;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeHtmlAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
}

function escapeStyleTag(value) {
    return String(value).replace(/<\/style/gi, '<\\/style');
}

function sanitizeColor(value) {
    const text = String(value || '').trim();
    return SAFE_COLOR_RE.test(text) ? text : null;
}

function parseFieldSchema(fieldsValue) {
    const schema = new Map();
    const lines = String(fieldsValue || '').split(/\r?\n/);

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            continue;
        }

        const separatorIndex = trimmed.indexOf(':');
        if (separatorIndex === -1) {
            continue;
        }

        const fieldName = normalizeKey(trimmed.slice(0, separatorIndex));
        const rawType = trimmed.slice(separatorIndex + 1).trim();
        if (!fieldName || !rawType) {
            continue;
        }

        const enumMatch = rawType.match(/^enum\((.*)\)$/i);
        if (enumMatch) {
            const allowed = enumMatch[1]
                .split(/[|,]/)
                .map((value) => value.trim())
                .filter(Boolean);
            schema.set(fieldName, { type: 'enum', allowed });
            continue;
        }

        schema.set(fieldName, { type: normalizeKey(rawType) });
    }

    return schema;
}

function buildElementDefinitionRegistry(html) {
    const registry = new Map();

    for (const definition of BUILT_IN_ELEMENT_DEFINITIONS) {
        const name = normalizeKey(definition.name || '');
        const render = typeof definition.render === 'function' ? definition.render : null;
        const htmlTemplate = String(definition.htmlTemplate || '').trim();
        if (!name || (!htmlTemplate && !render)) {
            continue;
        }

        const cssText = String(definition.cssText || '').trim();
        registry.set(name, {
            name,
            htmlTemplate,
            render,
            cssText: FORBIDDEN_CUSTOM_CSS_RE.test(cssText) ? '' : cssText,
            fields: parseFieldSchema(definition.fields),
        });
    }

    for (const block of extractNymlBlocks(html)) {
        if (normalizeKey(block.kind || '') !== 'define_element') {
            continue;
        }

        const name = normalizeKey(block.name || '');
        if (!name) {
            continue;
        }

        const htmlTemplate = String(block.html || '').trim();
        if (!htmlTemplate) {
            continue;
        }

        const cssText = String(block.css || '').trim();
        registry.set(name, {
            name,
            htmlTemplate,
            cssText: FORBIDDEN_CUSTOM_CSS_RE.test(cssText) ? '' : cssText,
            fields: parseFieldSchema(block.fields),
        });
    }

    return registry;
}

async function sanitizeElementFieldValue(rawValue, fieldSchema) {
    if (rawValue === undefined || rawValue === null) {
        return '';
    }

    const text = String(rawValue);
    const type = fieldSchema?.type || 'text';

    switch (type) {
        case 'length': {
            const value = sanitizeLength(text);
            return value || '';
        }
        case 'color': {
            const value = sanitizeColor(text);
            return value || '';
        }
        case 'enum': {
            if (!fieldSchema.allowed || fieldSchema.allowed.length === 0) {
                return escapeHtml(text);
            }
            const normalized = normalizeKey(text);
            const match = fieldSchema.allowed.find((candidate) => normalizeKey(candidate) === normalized);
            return match ? escapeHtml(match) : '';
        }
        case 'markdown': {
            const parsedHtml = await parseMarkdown(text);
            return stripMetadataScripts(parsedHtml);
        }
        case 'text':
        default:
            return escapeHtml(text);
    }
}

async function resolveTemplatePlaceholders(template, resolver) {
    const matches = Array.from(template.matchAll(CUSTOM_ELEMENT_PLACEHOLDER_RE));
    if (matches.length === 0) {
        return template;
    }

    let cursor = 0;
    let output = '';

    for (const match of matches) {
        output += template.slice(cursor, match.index);
        output += await resolver(match);
        cursor = match.index + match[0].length;
    }

    output += template.slice(cursor);
    return output;
}

async function renderCustomElementBlock(block, registry, usedStyles, dynamicChoices) {
    const name = normalizeKey(block.name || '');
    const definition = registry.get(name);
    if (!definition) {
        return '';
    }

    if (definition.cssText) {
        usedStyles.add(name);
    }

    const renderFieldValue = async (fieldName) => {
        const normalizedFieldName = normalizeKey(fieldName || '');
        if (!normalizedFieldName) {
            return '';
        }
        return sanitizeElementFieldValue(block[normalizedFieldName], definition.fields.get(normalizedFieldName));
    };

    const html = definition.render
        ? await definition.render(block, {
            escapeHtml,
            normalizeKey,
            renderFieldValue,
            getRawField(fieldName) {
                return block[normalizeKey(fieldName || '')];
            },
        })
        : await resolveTemplatePlaceholders(definition.htmlTemplate, async (match) => {
            const bracketName = match[1];
            const moustacheName = match[2];
            return renderFieldValue(bracketName || moustacheName || '');
        });
    const filteredHtml = filterConditionalNodes(html, dynamicChoices);

    const pagebreakAfter = normalizeKey(block.pagebreak_after || 'false') === 'true';
    return pagebreakAfter ? `${filteredHtml}<div class="pagebreak"></div>` : filteredHtml;
}

function buildInjectedStyleHtml(registry, usedStyles) {
    const fragments = [];

    for (const name of usedStyles) {
        const definition = registry.get(name);
        if (!definition || !definition.cssText) {
            continue;
        }
        fragments.push(
            `<style type="text/css" data-nyml-element="${escapeHtmlAttribute(name)}">${escapeStyleTag(definition.cssText)}</style>`
        );
    }

    return fragments.join('');
}

function sanitizeLength(value) {
    const text = String(value || '').trim();
    return SAFE_LENGTH_RE.test(text) ? text : null;
}

function sanitizePositiveInteger(value, fallback = 1) {
    const text = String(value ?? '').trim();
    if (!text) {
        return fallback;
    }

    if (!/^\d+$/.test(text)) {
        return fallback;
    }

    const parsed = parseInt(text, 10);
    return parsed > 0 ? parsed : fallback;
}

function renderFlowBlock(block) {
    const blockKind = normalizeKey(block.kind || '');

    if (blockKind === 'pagebreak') {
        const count = sanitizePositiveInteger(block.number, 1);
        if (count === 1) {
            return '<div class="pagebreak"></div>';
        }

        return '<div class="pagebreak pagebreak--blank"></div>'.repeat(count - 1);
    }

    if (blockKind === 'vspace') {
        const height = sanitizeLength(block.height || block.size || block.value);
        if (!height) {
            return '';
        }
        return `<div class="mdpdf-vspace" style="height: ${escapeHtml(height)};"></div>`;
    }

    return '';
}

async function extractPreBodyHtml(html) {
    return (await transformNymlDocument(html)).preBodyHtml;
}

async function renderNymlScripts(html) {
    return (await transformNymlDocument(html)).bodyHtml;
}

async function transformNymlDocument(html) {
    const registry = buildElementDefinitionRegistry(html);
    const settings = extractDocumentSettings(html);
    const usedStyles = new Set();
    const preBodyFragments = [];

    let bodyHtml = '';
    let lastIndex = 0;
    let match = NYML_SCRIPT_RE.exec(html);

    while (match) {
        bodyHtml += html.slice(lastIndex, match.index);

        let blocks = [];
        try {
            const parsed = JSON.parse(match[1]);
            if (Array.isArray(parsed)) {
                blocks = entriesToBlocks(parsed);
            }
        } catch {
            blocks = [];
        }

        const rendered = [];
        for (const block of blocks) {
            const blockKind = normalizeKey(block.kind || '');
            if (blockKind === 'define_element') {
                continue;
            }

            if (blockKind === 'element') {
                const elementHtml = await renderCustomElementBlock(
                    block,
                    registry,
                    usedStyles,
                    settings.dynamicChoices || {}
                );
                if (!elementHtml) {
                    continue;
                }

                if (normalizeKey(block.placement || '') === 'pre_body') {
                    preBodyFragments.push(elementHtml);
                    continue;
                }

                rendered.push(elementHtml);
                continue;
            }

            rendered.push(renderFlowBlock(block));
        }

        bodyHtml += rendered.join('');
        lastIndex = match.index + match[0].length;
        match = NYML_SCRIPT_RE.exec(html);
    }

    bodyHtml += html.slice(lastIndex);
    NYML_SCRIPT_RE.lastIndex = 0;

    const stylesHtml = buildInjectedStyleHtml(registry, usedStyles);
    const wrappedPreBodyHtml = preBodyFragments.length
        ? `<div class="mdpdf-pre-body" data-mdpdf-pre-body="1">${preBodyFragments.join('')}</div>`
        : '';
    return {
        stylesHtml,
        preBodyHtml: `${stylesHtml}${wrappedPreBodyHtml}`,
        bodyHtml,
    };
}

function stripMetadataScripts(html) {
    return html.replace(METADATA_SCRIPT_RE, '');
}

module.exports = {
    DEFAULT_DOCUMENT_FLAGS,
    extractNymlBlocks,
    extractNymlScriptBlocks,
    extractDocumentSettings,
    extractPreBodyHtml,
    renderNymlScripts,
    stripMetadataScripts,
    transformNymlDocument,
};