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
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    },
    'source-serif-4': {
        label: 'Source Serif 4',
        tier: 'A',
        category: 'serif',
        fontFamily: "'Source Serif 4', Georgia, serif",
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    },
    'ibm-plex-sans': {
        label: 'IBM Plex Sans',
        tier: 'A',
        category: 'sans',
        fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    },
    roboto: {
        label: 'Roboto',
        tier: 'A',
        category: 'sans',
        fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    },
    raleway: {
        label: 'Raleway',
        tier: 'A',
        category: 'sans',
        fontFamily: "'Raleway', 'Helvetica Neue', Arial, sans-serif",
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    },
    lora: {
        label: 'Lora',
        tier: 'A',
        category: 'serif',
        fontFamily: "'Lora', Georgia, serif",
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    },
    'crimson-pro': {
        label: 'Crimson Pro',
        tier: 'A',
        category: 'serif',
        fontFamily: "'Crimson Pro', Georgia, serif",
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    },
    'courier-prime': {
        label: 'Courier Prime',
        tier: 'A',
        category: 'mono',
        fontFamily: "'Courier Prime', 'Courier New', monospace",
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    },
    'comic-neue': {
        label: 'Comic Neue',
        tier: 'A',
        category: 'handwriting',
        fontFamily: "'Comic Neue', 'Comic Sans MS', cursive",
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Comic+Neue:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    },
    neucha: {
        label: 'Neucha',
        tier: 'A',
        category: 'handwriting',
        fontFamily: "'Neucha', 'Comic Sans MS', cursive",
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Neucha&display=swap',
    },
    'noto-serif': {
        label: 'Noto Serif',
        tier: 'A',
        category: 'serif',
        fontFamily: "'Noto Serif', Georgia, serif",
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    },
    'noto-sans': {
        label: 'Noto Sans',
        tier: 'A',
        category: 'sans',
        fontFamily: "'Noto Sans', 'Helvetica Neue', Arial, sans-serif",
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    },
    'noto-serif-sc': {
        label: 'Noto Serif SC',
        tier: 'A',
        category: 'cjk-serif',
        fontFamily: "'Noto Serif SC', 'Noto Serif', serif",
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap',
    },
    'noto-sans-sc': {
        label: 'Noto Sans SC',
        tier: 'A',
        category: 'cjk-sans',
        fontFamily: "'Noto Sans SC', 'Noto Sans', sans-serif",
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap',
    },
    'noto-serif-tc': {
        label: 'Noto Serif TC',
        tier: 'A',
        category: 'cjk-serif',
        fontFamily: "'Noto Serif TC', 'Noto Serif', serif",
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&display=swap',
    },
    'noto-sans-tc': {
        label: 'Noto Sans TC',
        tier: 'A',
        category: 'cjk-sans',
        fontFamily: "'Noto Sans TC', 'Noto Sans', sans-serif",
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap',
    },
    'lxgw-wenkai-tc': {
        label: 'LXGW WenKai TC',
        tier: 'B',
        category: 'cjk-handwriting',
        fontFamily: "'LXGW WenKai TC', 'Noto Serif TC', serif",
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@300;400;700&display=swap',
    },
    'ma-shan-zheng': {
        label: 'Ma Shan Zheng',
        tier: 'B',
        category: 'cjk-handwriting',
        fontFamily: "'Ma Shan Zheng', 'Noto Sans SC', cursive",
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap',
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

// Returns HTML to load the Google Fonts stylesheet asynchronously (non-render-blocking),
// or '' for system fonts. Falls back to the system fonts in each preset's fontFamily
// string if Google Fonts is unreachable.
function getFontPresetLinks(name) {
    const preset = resolvePreset(name);
    if (!preset.googleFontsUrl) return '';
    const url = preset.googleFontsUrl;
    // Use the media="print" trick so the request is non-render-blocking.
    // The onload handler promotes it to screen media once it finishes loading.
    // A <noscript> fallback ensures the stylesheet still applies in environments
    // where JS is unavailable (e.g. static HTML exports).
    return `<link rel="preconnect" href="https://fonts.googleapis.com">\n` +
        `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n` +
        `<link rel="stylesheet" media="print" onload="this.media='all'" href="${url}">\n` +
        `<noscript><link rel="stylesheet" href="${url}"></noscript>`;
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
