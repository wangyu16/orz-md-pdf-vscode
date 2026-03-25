'use strict';

const fs = require('fs');
const path = require('path');

const THEMES_DIR = path.join(__dirname);

// Map of theme name → CSS filename (without .css)
const THEME_MAP = {
  'light-academic-1': 'light-academic-1',
  'light-academic-2': 'light-academic-2',
  'light-neat-1': 'light-neat-1',
  'light-neat-2': 'light-neat-2',
  'light-playful-1': 'light-playful-1',
  'light-playful-2': 'light-playful-2',
  'beige-decent-1': 'beige-decent-1',
  'beige-decent-2': 'beige-decent-2',
};

/**
 * Return the CSS string for a named theme.
 * Returns '' if name is falsy or unknown.
 * Always reads from disk so edits are picked up without restarting the server.
 */
function getThemeCss(name) {
  if (!name) return '';
  const file = THEME_MAP[name];
  if (!file) return '';
  const cssPath = path.join(THEMES_DIR, file + '.css');
  return fs.readFileSync(cssPath, 'utf8');
}

/** Return an array of all available theme names. */
function listThemes() {
  return Object.keys(THEME_MAP);
}

/**
 * Return the common structural CSS applied to all themes.
 * Always reads from disk so edits are picked up without restarting the server.
 */
function getCommonCss() {
  return fs.readFileSync(path.join(THEMES_DIR, 'common.css'), 'utf8');
}

/**
 * Return the default visual stylesheet, applied to all documents.
 * Themes inject after this and override whatever they specify.
 * Always reads from disk so edits are picked up without restarting the server.
 */
function getDefaultCss() {
  return fs.readFileSync(path.join(THEMES_DIR, 'default.css'), 'utf8');
}

module.exports = { getThemeCss, getCommonCss, getDefaultCss, listThemes, THEME_MAP };
