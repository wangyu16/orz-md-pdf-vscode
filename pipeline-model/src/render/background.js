'use strict';

// Background effects applied to .pagedjs_page (the full printed sheet).
// All measurements are in mm so they scale correctly in both preview and PDF.
// Line/cell spacing defaults to 7mm ≈ 26px at screen resolution, which sits
// comfortably between 12pt × 1.0 and 12pt × 1.5 line heights.
//   background-image: repeating-linear-gradient(transparent, transparent 1.5rem, rgba(0, 150, 255, 0.08) 1.5rem, rgba(0, 150, 255, 0.08) 1.6rem);

const BACKGROUND_EFFECTS = {
    ruled: {
        // Horizontal lines like a ruled notebook.
        image: [
            'repeating-linear-gradient(transparent, transparent 1.5rem, rgba(0, 150, 255, 0.08) 1.5rem, rgba(0, 150, 255, 0.08) 1.6rem)',
        ].join('\n'),
    },
    grid: {
        // Square graph-paper grid at 7mm.
        image: [
            'repeating-linear-gradient(#d4dde5 0, rgba(0, 150, 255, 0.08)0.4px, transparent 0.4px, transparent 7mm)',
            'repeating-linear-gradient(90deg, rgba(0, 150, 255, 0.08) 0, #d4dde5 0.4px, transparent 0.4px, transparent 7mm)',
        ].join(', '),
    },
    dots: {
        // Bullet-journal dot grid at 7mm.
        image: 'radial-gradient(circle, rgba(0, 150, 255, 0.15) 1.2px, transparent 1.2px)',
        size: '7mm 7mm',
    },
    graph: {
        // Fine graph paper at 5mm — good for technical / engineering documents.
        image: [
            'repeating-linear-gradient(#e8edf2 0, rgba(0, 150, 255, 0.08) 0.4px, transparent 0.4px, transparent 5mm)',
            'repeating-linear-gradient(90deg, rgba(0, 150, 255, 0.08) 0, #e8edf2 0.4px, transparent 0.4px, transparent 5mm)',
        ].join(', '),
    },
};

/**
 * Returns a CSS block targeting `.pagedjs_sheet` that applies a custom
 * background color and/or decorative background effect (ruled lines, grid,
 * dots, or graph paper).  Returns an empty string when neither is requested.
 *
 * We target .pagedjs_sheet (not .pagedjs_page) because .pagedjs_sheet is the
 * immediate visual surface — it sits on top of .pagedjs_page and covers it
 * entirely. The post-render screen CSS also targets .pagedjs_sheet for
 * background-color, so placing our background-image here keeps both in sync
 * and prevents the solid color from occluding the pattern.
 *
 * @param {object} settings — merged document settings
 * @returns {string} CSS text, or ''
 */
function buildPageBackgroundCss(settings) {
    const color = String(settings.pageBackground || '').trim();
    const effectKey = String(settings.pageBackgroundEffect || 'none').trim().toLowerCase();
    const effect = BACKGROUND_EFFECTS[effectKey] || null;

    if (!color && !effect) {
        return '';
    }

    const declarations = [];
    if (color) {
        declarations.push(`background-color: ${color} !important;`);
    }
    if (effect) {
        declarations.push(`background-image: ${effect.image} !important;`);
        if (effect.size) {
            declarations.push(`background-size: ${effect.size} !important;`);
        }
    }

    // Target both .pagedjs_page and .pagedjs_sheet so the background applies
    // reliably in both screen-preview and PDF (print) mode. In print mode the
    // @media-screen rules in screenCss do not run, so this block is the sole
    // source of the background color/effect for the PDF output.
    const block = `    ${declarations.join('\n    ')}`;
    return `.pagedjs_page,\n.pagedjs_sheet {\n${block}\n}`;
}

module.exports = {
    buildPageBackgroundCss,
    BACKGROUND_EFFECTS,
};
