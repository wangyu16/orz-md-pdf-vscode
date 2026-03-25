'use strict';

const { CORE_DEFAULT_SETTINGS } = require('./settings-schema');

/**
 * Merge settings layers (CORE < template < document < runtime).
 * All scalar values: last layer wins.
 * customCss: concatenated across all layers so template CSS is never lost
 * when the user also provides custom_css in their document.
 */
function mergeCoreSettings(...layers) {
    const merged = Object.assign({}, CORE_DEFAULT_SETTINGS, ...layers);
    // Concatenate customCss from all layers in order: template → doc → runtime.
    const cssParts = layers
        .map(layer => (layer && typeof layer.customCss === 'string' ? layer.customCss.trim() : ''))
        .filter(Boolean);
    merged.customCss = cssParts.join('\n\n');
    return merged;
}

module.exports = {
    mergeCoreSettings,
};