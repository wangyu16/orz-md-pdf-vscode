'use strict';

const PAGE_SIZE_MM = {
    A3: { width: 297, height: 420 },
    A4: { width: 210, height: 297 },
    A5: { width: 148, height: 210 },
    Letter: { width: 215.9, height: 279.4 },
    Legal: { width: 215.9, height: 355.6 },
};

function getPrintableArea(pageSize, margins) {
    const preset = PAGE_SIZE_MM[pageSize];
    if (preset) {
        return {
            width: preset.width - margins.left - margins.right,
            height: preset.height - margins.top - margins.bottom,
        };
    }

    const mmMatch = String(pageSize).match(/^\s*([\d.]+)mm\s+([\d.]+)mm\s*$/i);
    if (!mmMatch) {
        return null;
    }

    return {
        width: parseFloat(mmMatch[1]) - margins.left - margins.right,
        height: parseFloat(mmMatch[2]) - margins.top - margins.bottom,
    };
}

module.exports = {
    getPrintableArea,
};