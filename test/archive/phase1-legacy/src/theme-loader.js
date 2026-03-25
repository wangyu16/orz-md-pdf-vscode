'use strict';

const fs = require('fs');
const path = require('path');

const THEMES_DIR = path.join(__dirname, 'themes');
const CODE_FONT = `'Liberation Mono', 'Courier New', monospace`;
const SANS_FONT = `'Inter', 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif`;
const SERIF_FONT = `'Source Serif 4', 'Times New Roman', Times, serif`;

function normalizeThemeName(themeName) {
    return String(themeName || '').trim().replace(/\.css$/i, '');
}

function listLocalThemes() {
    try {
        return fs.readdirSync(THEMES_DIR)
            .filter((fileName) => fileName.endsWith('.css'))
            .map((fileName) => path.basename(fileName, '.css'))
            .sort();
    } catch {
        return [];
    }
}

function resolveLocalThemePath(themeName) {
    const normalizedName = normalizeThemeName(themeName);
    if (!/^[a-z0-9-]+$/i.test(normalizedName)) {
        return null;
    }

    const themePath = path.join(THEMES_DIR, `${normalizedName}.css`);
    return fs.existsSync(themePath) ? themePath : null;
}

function stripRemoteImports(cssText) {
  return String(cssText || '').replace(/^@import[^\r\n]*(?:\r?\n|$)/gm, '').trim();
}

function getThemeFontOverride(themeName) {
    const normalizedName = normalizeThemeName(themeName);

    if (/^beige-decent-/.test(normalizedName)) {
        return `
:root {
  --header-font: ${SERIF_FONT};
  --main-font: ${SERIF_FONT};
  --heading-font: ${SERIF_FONT};
  --body-font: ${SERIF_FONT};
  --font-heading: ${SERIF_FONT};
  --font-body: ${SERIF_FONT};
  --code-font: ${CODE_FONT};
  --font-code: ${CODE_FONT};
}`;
    }

    if (/^light-playful-/.test(normalizedName)) {
        return `
:root {
  --header-font: ${SANS_FONT};
  --main-font: ${SANS_FONT};
  --heading-font: ${SANS_FONT};
  --body-font: ${SANS_FONT};
  --font-heading: ${SANS_FONT};
  --font-body: ${SANS_FONT};
  --code-font: ${CODE_FONT};
  --font-code: ${CODE_FONT};
}`;
    }

    if (/^light-neat-/.test(normalizedName)) {
        return `
:root {
  --header-font: ${SANS_FONT};
  --main-font: ${SANS_FONT};
  --heading-font: ${SANS_FONT};
  --body-font: ${SANS_FONT};
  --font-heading: ${SANS_FONT};
  --font-body: ${SANS_FONT};
  --code-font: ${CODE_FONT};
  --font-code: ${CODE_FONT};
}`;
    }

    return `
:root {
  --header-font: ${SANS_FONT};
  --main-font: ${SERIF_FONT};
  --heading-font: ${SANS_FONT};
  --body-font: ${SERIF_FONT};
  --font-heading: ${SANS_FONT};
  --font-body: ${SERIF_FONT};
  --code-font: ${CODE_FONT};
  --font-code: ${CODE_FONT};
}`;
}

function getPdfCompatibilityCss(themeName) {
    return `
${getThemeFontOverride(themeName)}

html,
body {
  background: #ffffff !important;
}

body {
  margin: 0 !important;
  padding: 0 !important;
  min-height: auto !important;
}

.markdown-body {
  max-width: none !important;
  width: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  overflow: visible !important;
  isolation: auto !important;
}

.markdown-body::before,
.markdown-body::after {
  content: none !important;
  display: none !important;
}

@media print {
  html,
  body {
    background: #ffffff !important;
  }
}
`;
}

function loadThemeCss(themeName) {
    const themePath = resolveLocalThemePath(themeName);
    if (!themePath) {
        console.warn(`Theme CSS not found for ${themeName}, rendering without theme.`);
        return null;
    }

    const cssText = fs.readFileSync(themePath, 'utf8');
    return [stripRemoteImports(cssText), getPdfCompatibilityCss(themeName)].join('\n\n');
}

module.exports = {
    listLocalThemes,
    loadThemeCss,
};