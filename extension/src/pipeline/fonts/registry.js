'use strict';

const FONT_PRESETS = {
    'system-serif': {
        label: 'System Serif',
        tier: 'A',
        category: 'serif',
        fontFamily: "'Times New Roman', Times, serif",
    },
    inter: {
        label: 'Inter',
        tier: 'A',
        category: 'sans',
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    },
    'source-serif-4': {
        label: 'Source Serif 4',
        tier: 'A',
        category: 'serif',
        fontFamily: "'Source Serif 4', Georgia, serif",
    },
    'ibm-plex-sans': {
        label: 'IBM Plex Sans',
        tier: 'A',
        category: 'sans',
        fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
    },
    roboto: {
        label: 'Roboto',
        tier: 'A',
        category: 'sans',
        fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
    },
    raleway: {
        label: 'Raleway',
        tier: 'A',
        category: 'sans',
        fontFamily: "'Raleway', 'Helvetica Neue', Arial, sans-serif",
    },
    lora: {
        label: 'Lora',
        tier: 'A',
        category: 'serif',
        fontFamily: "'Lora', Georgia, serif",
    },
    'crimson-pro': {
        label: 'Crimson Pro',
        tier: 'A',
        category: 'serif',
        fontFamily: "'Crimson Pro', Georgia, serif",
    },
    'courier-prime': {
        label: 'Courier Prime',
        tier: 'A',
        category: 'mono',
        fontFamily: "'Courier Prime', 'Courier New', monospace",
    },
    'comic-neue': {
        label: 'Comic Neue',
        tier: 'A',
        category: 'handwriting',
        fontFamily: "'Comic Neue', 'Comic Sans MS', cursive",
    },
    neucha: {
        label: 'Neucha',
        tier: 'A',
        category: 'handwriting',
        fontFamily: "'Neucha', 'Comic Sans MS', cursive",
    },
    'noto-serif': {
        label: 'Noto Serif',
        tier: 'A',
        category: 'serif',
        fontFamily: "'Noto Serif', Georgia, serif",
    },
    'noto-sans': {
        label: 'Noto Sans',
        tier: 'A',
        category: 'sans',
        fontFamily: "'Noto Sans', 'Helvetica Neue', Arial, sans-serif",
    },
    'noto-serif-sc': {
        label: 'Noto Serif SC',
        tier: 'A',
        category: 'cjk-serif',
        fontFamily: "'Noto Serif SC', 'Noto Serif', serif",
    },
    'noto-sans-sc': {
        label: 'Noto Sans SC',
        tier: 'A',
        category: 'cjk-sans',
        fontFamily: "'Noto Sans SC', 'Noto Sans', sans-serif",
    },
    'noto-serif-tc': {
        label: 'Noto Serif TC',
        tier: 'A',
        category: 'cjk-serif',
        fontFamily: "'Noto Serif TC', 'Noto Serif', serif",
    },
    'noto-sans-tc': {
        label: 'Noto Sans TC',
        tier: 'A',
        category: 'cjk-sans',
        fontFamily: "'Noto Sans TC', 'Noto Sans', sans-serif",
    },
    'lxgw-wenkai-tc': {
        label: 'LXGW WenKai TC',
        tier: 'B',
        category: 'cjk-handwriting',
        fontFamily: "'LXGW WenKai TC', 'Noto Serif TC', serif",
    },
    'ma-shan-zheng': {
        label: 'Ma Shan Zheng',
        tier: 'B',
        category: 'cjk-handwriting',
        fontFamily: "'Ma Shan Zheng', 'Noto Sans SC', cursive",
    },
};

const FONT_PRESET_ALIASES = {
    courier: 'courier-prime',
    relaway: 'raleway',
    lori: 'lora',
    'source-serif-1': 'source-serif-4',
};

function resolvePresetName(name) {
    const normalizedName = String(name || '').trim().toLowerCase();
    const aliasedName = FONT_PRESET_ALIASES[normalizedName] || normalizedName;
    return FONT_PRESETS[aliasedName] ? aliasedName : 'system-serif';
}

function resolvePreset(name) {
    return FONT_PRESETS[resolvePresetName(name)] || FONT_PRESETS['system-serif'];
}

function listFontPresets() {
    return Object.entries(FONT_PRESETS)
        .map(([id, preset]) => ({ id, ...preset }))
        .sort((left, right) => left.label.localeCompare(right.label));
}

// No external font loading — all fonts are resolved from the user's local system.
// The fontFamily strings in each preset include system fallbacks so the browser
// uses whatever matching fonts are installed locally.
function getFontPresetLinks(_name) {
    return '';
}

function getFontFamily(name, fallbackFamily) {
    return resolvePreset(name).fontFamily || fallbackFamily;
}

module.exports = {
    FONT_PRESET_ALIASES,
    FONT_PRESETS,
    getFontFamily,
    getFontPresetLinks,
    listFontPresets,
    resolvePreset,
    resolvePresetName,
};
