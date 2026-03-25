'use strict';

const fs = require('fs');
const path = require('path');

const FONT_PRESETS = {
    'system-serif': {
        label: 'System Serif',
        tier: 'A',
        category: 'serif',
        fontFamily: "'Times New Roman', Times, serif",
        cssFiles: [],
    },
    inter: {
        label: 'Inter',
        tier: 'A',
        category: 'sans',
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        packageName: '@fontsource/inter',
        cssFiles: ['latin-400.css', 'latin-700.css', 'latin-400-italic.css', 'latin-700-italic.css'],
    },
    'source-serif-4': {
        label: 'Source Serif 4',
        tier: 'A',
        category: 'serif',
        fontFamily: "'Source Serif 4', Georgia, serif",
        packageName: '@fontsource/source-serif-4',
        cssFiles: ['latin-400.css', 'latin-700.css', 'latin-400-italic.css', 'latin-700-italic.css'],
    },
    'ibm-plex-sans': {
        label: 'IBM Plex Sans',
        tier: 'A',
        category: 'sans',
        fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
        packageName: '@fontsource/ibm-plex-sans',
        cssFiles: ['latin-400.css', 'latin-700.css', 'latin-400-italic.css', 'latin-700-italic.css'],
    },
    roboto: {
        label: 'Roboto',
        tier: 'A',
        category: 'sans',
        fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
        packageName: '@fontsource/roboto',
        cssFiles: ['latin-400.css', 'latin-700.css', 'latin-400-italic.css', 'latin-700-italic.css'],
    },
    raleway: {
        label: 'Raleway',
        tier: 'A',
        category: 'sans',
        fontFamily: "'Raleway', 'Helvetica Neue', Arial, sans-serif",
        packageName: '@fontsource/raleway',
        cssFiles: ['latin-400.css', 'latin-700.css', 'latin-400-italic.css', 'latin-700-italic.css'],
    },
    lora: {
        label: 'Lora',
        tier: 'A',
        category: 'serif',
        fontFamily: "'Lora', Georgia, serif",
        packageName: '@fontsource/lora',
        cssFiles: ['latin-400.css', 'latin-700.css', 'latin-400-italic.css', 'latin-700-italic.css'],
    },
    'crimson-pro': {
        label: 'Crimson Pro',
        tier: 'A',
        category: 'serif',
        fontFamily: "'Crimson Pro', Georgia, serif",
        packageName: '@fontsource/crimson-pro',
        cssFiles: ['latin-400.css', 'latin-700.css', 'latin-400-italic.css', 'latin-700-italic.css'],
    },
    'courier-prime': {
        label: 'Courier Prime',
        tier: 'A',
        category: 'mono',
        fontFamily: "'Courier Prime', 'Courier New', monospace",
        packageName: '@fontsource/courier-prime',
        cssFiles: ['latin-400.css', 'latin-700.css', 'latin-400-italic.css', 'latin-700-italic.css'],
    },
    'comic-neue': {
        label: 'Comic Neue',
        tier: 'A',
        category: 'handwriting',
        fontFamily: "'Comic Neue', 'Comic Sans MS', cursive",
        packageName: '@fontsource/comic-neue',
        cssFiles: ['latin-400.css', 'latin-700.css', 'latin-400-italic.css', 'latin-700-italic.css'],
    },
    neucha: {
        label: 'Neucha',
        tier: 'A',
        category: 'handwriting',
        fontFamily: "'Neucha', 'Comic Sans MS', cursive",
        packageName: '@fontsource/neucha',
        cssFiles: ['latin-400.css'],
    },
    'noto-serif': {
        label: 'Noto Serif',
        tier: 'A',
        category: 'serif',
        fontFamily: "'Noto Serif', Georgia, serif",
        packageName: '@fontsource/noto-serif',
        cssFiles: ['latin-400.css', 'latin-700.css', 'latin-400-italic.css', 'latin-700-italic.css'],
    },
    'noto-sans': {
        label: 'Noto Sans',
        tier: 'A',
        category: 'sans',
        fontFamily: "'Noto Sans', 'Helvetica Neue', Arial, sans-serif",
        packageName: '@fontsource/noto-sans',
        cssFiles: ['latin-400.css', 'latin-700.css', 'latin-400-italic.css', 'latin-700-italic.css'],
    },
    'noto-serif-sc': {
        label: 'Noto Serif SC',
        tier: 'A',
        category: 'cjk-serif',
        fontFamily: "'Noto Serif SC', 'Noto Serif', serif",
        packageName: '@fontsource/noto-serif-sc',
        cssFiles: ['latin-400.css', 'latin-700.css', 'chinese-simplified-400.css', 'chinese-simplified-700.css'],
    },
    'noto-sans-sc': {
        label: 'Noto Sans SC',
        tier: 'A',
        category: 'cjk-sans',
        fontFamily: "'Noto Sans SC', 'Noto Sans', sans-serif",
        packageName: '@fontsource/noto-sans-sc',
        cssFiles: ['latin-400.css', 'latin-700.css', 'chinese-simplified-400.css', 'chinese-simplified-700.css'],
    },
    'noto-serif-tc': {
        label: 'Noto Serif TC',
        tier: 'A',
        category: 'cjk-serif',
        fontFamily: "'Noto Serif TC', 'Noto Serif', serif",
        packageName: '@fontsource/noto-serif-tc',
        cssFiles: ['latin-400.css', 'latin-700.css', 'chinese-traditional-400.css', 'chinese-traditional-700.css'],
    },
    'noto-sans-tc': {
        label: 'Noto Sans TC',
        tier: 'A',
        category: 'cjk-sans',
        fontFamily: "'Noto Sans TC', 'Noto Sans', sans-serif",
        packageName: '@fontsource/noto-sans-tc',
        cssFiles: ['latin-400.css', 'latin-700.css', 'chinese-traditional-400.css', 'chinese-traditional-700.css'],
    },
    'lxgw-wenkai-tc': {
        label: 'LXGW WenKai TC',
        tier: 'B',
        category: 'cjk-handwriting',
        fontFamily: "'LXGW WenKai TC', 'Noto Serif TC', serif",
        packageName: '@fontsource/lxgw-wenkai-tc',
        cssFiles: ['latin-400.css', 'latin-700.css', 'chinese-traditional-400.css', 'chinese-traditional-700.css'],
    },
    'ma-shan-zheng': {
        label: 'Ma Shan Zheng',
        tier: 'B',
        category: 'cjk-handwriting',
        fontFamily: "'Ma Shan Zheng', 'Noto Sans SC', cursive",
        packageName: '@fontsource/ma-shan-zheng',
        cssFiles: ['latin-400.css', 'chinese-simplified-400.css'],
    },
};

const FONT_PRESET_ALIASES = {
    courier: 'courier-prime',
    relaway: 'raleway',
    lori: 'lora',
    'source-serif-1': 'source-serif-4',
};

const cssCache = new Map();

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

function inlineFontCssFile(packageName, cssFileName) {
    const cacheKey = `${packageName}:${cssFileName}`;
    if (cssCache.has(cacheKey)) {
        return cssCache.get(cacheKey);
    }

    const packageDir = path.dirname(require.resolve(`${packageName}/package.json`));
    const cssPath = path.join(packageDir, cssFileName);
    let css = fs.readFileSync(cssPath, 'utf8');

    // Chromium-based webviews and Puppeteer both support woff2, so strip the
    // woff fallback before inlining to avoid shipping duplicate font binaries.
    css = css.replace(/,\s*url\((\.\/files\/[^)]+\.woff)\)\s*format\('woff'\)/g, '');

    css = css.replace(/url\((\.\/files\/[^)]+)\)/g, (match, relativePath) => {
        const cleanPath = relativePath.replace(/^['"]|['"]$/g, '');
        const fontPath = path.join(packageDir, cleanPath);
        const ext = path.extname(fontPath).slice(1);
        const mimeType = ext === 'woff2' ? 'font/woff2' : 'font/woff';
        const data = fs.readFileSync(fontPath).toString('base64');
        return `url(data:${mimeType};base64,${data})`;
    });

    cssCache.set(cacheKey, css);
    return css;
}

function getFontPresetCss(name) {
    const preset = resolvePreset(name);
    if (!preset.packageName || !preset.cssFiles.length) {
        return '';
    }

    return preset.cssFiles.map((cssFileName) => inlineFontCssFile(preset.packageName, cssFileName)).join('\n');
}

function getFontFamily(name, fallbackFamily) {
    return resolvePreset(name).fontFamily || fallbackFamily;
}

module.exports = {
    FONT_PRESET_ALIASES,
    FONT_PRESETS,
    getFontFamily,
    getFontPresetCss,
    listFontPresets,
    resolvePreset,
    resolvePresetName,
};