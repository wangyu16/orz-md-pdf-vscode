'use strict';

const fs = require('fs');
const path = require('path');

const FONT_PRESETS = {
    'system-serif': {
        label: 'System Serif',
        fontFamily: "'Times New Roman', Times, serif",
        cssFiles: [],
    },
    inter: {
        label: 'Inter',
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        packageName: '@fontsource/inter',
        cssFiles: ['latin-400.css', 'latin-700.css', 'latin-400-italic.css', 'latin-700-italic.css'],
    },
    'source-serif-4': {
        label: 'Source Serif 4',
        fontFamily: "'Source Serif 4', Georgia, serif",
        packageName: '@fontsource/source-serif-4',
        cssFiles: ['latin-400.css', 'latin-700.css', 'latin-400-italic.css', 'latin-700-italic.css'],
    },
    'ibm-plex-sans': {
        label: 'IBM Plex Sans',
        fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
        packageName: '@fontsource/ibm-plex-sans',
        cssFiles: ['latin-400.css', 'latin-700.css', 'latin-400-italic.css', 'latin-700-italic.css'],
    },
};

const cssCache = new Map();

function resolvePreset(name) {
    return FONT_PRESETS[name] || FONT_PRESETS['system-serif'];
}

function inlineFontCssFile(packageName, cssFileName) {
    const cacheKey = `${packageName}:${cssFileName}`;
    if (cssCache.has(cacheKey)) {
        return cssCache.get(cacheKey);
    }

    const packageDir = path.dirname(require.resolve(`${packageName}/package.json`));
    const cssPath = path.join(packageDir, cssFileName);
    let css = fs.readFileSync(cssPath, 'utf8');

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
    FONT_PRESETS,
    getFontFamily,
    getFontPresetCss,
};