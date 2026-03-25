'use strict';

const NYML_SCRIPT_RE = /<script type="application\/json" id="nyml-data">\s*([\s\S]*?)\s*<\/script>/g;
const METADATA_SCRIPT_RE = /<script type="application\/(yaml|json)"(?: id="nyml-data")?>[\s\S]*?<\/script>\s*/g;

function normalizeKey(key) {
    return String(key || '').trim().replace(/-/g, '_').toLowerCase();
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
            // Ignore malformed metadata and fall back to defaults.
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

function extractNymlBlocks(html) {
    return entriesToBlocks(extractNymlEntries(html));
}

function stripMetadataScripts(html) {
    return String(html || '').replace(METADATA_SCRIPT_RE, '');
}

module.exports = {
    entriesToBlocks,
    extractNymlBlocks,
    normalizeKey,
    stripMetadataScripts,
};