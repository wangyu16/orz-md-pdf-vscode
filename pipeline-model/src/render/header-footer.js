'use strict';

const { getFontFamily } = require('../fonts/registry');

const POSITION_MAP = {
    'header-left': { selector: '@top-left', isHeader: true },
    'header-center': { selector: '@top-center', isHeader: true },
    'header-right': { selector: '@top-right', isHeader: true },
    'footer-left': { selector: '@bottom-left', isHeader: false },
    'footer-center': { selector: '@bottom-center', isHeader: false },
    'footer-right': { selector: '@bottom-right', isHeader: false },
};

const HEADER_RULE_OFFSET_MM = 2.4;
const FOOTER_RULE_OFFSET_MM = 2.4;
const HEADER_TEXT_GAP_MM = 0.3;
const FOOTER_TEXT_GAP_MM = 0.3;
const HEADER_TEXT_OFFSET_MM = 0.45;
const FOOTER_TEXT_OFFSET_MM = 0.45;

function getPageNumberContent(style) {
    switch (style) {
        case 'page-n':
            return '"Page " counter(page)';
        case 'page-n-of-N':
            return '"Page " counter(page) " of " counter(pages)';
        case 'n-of-N':
            return 'counter(page) " of " counter(pages)';
        case 'n-slash-N':
            return 'counter(page) " / " counter(pages)';
        case 'dash-n-dash':
            return '"- " counter(page) " -"';
        case 'brackets':
            return '"[" counter(page) "]"';
        case 'parentheses':
            return '"(" counter(page) ")"';
        default:
            return 'counter(page)';
    }
}

function getMarginText(settings, position) {
    if (position === settings.pageNumberPosition && settings.pageNumberPosition !== 'none') {
        return getPageNumberContent(settings.pageNumberStyle);
    }

    const textMap = {
        'header-left': settings.headerLeft,
        'header-center': settings.headerCenter,
        'header-right': settings.headerRight,
        'footer-left': settings.footerLeft,
        'footer-center': settings.footerCenter,
        'footer-right': settings.footerRight,
    };
    const text = (textMap[position] || '').trim();
    if (!text) {
        return null;
    }

    return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function buildMarginRuleCss(info, ruleColor) {
    if (info.isHeader) {
        return `background-image: linear-gradient(${ruleColor}, ${ruleColor}); background-repeat: no-repeat; background-size: 100% 1px; background-position: left calc(100% - ${HEADER_RULE_OFFSET_MM}mm); padding-top: ${HEADER_TEXT_OFFSET_MM}mm; padding-bottom: ${HEADER_TEXT_GAP_MM}mm;`;
    }

    return `background-image: linear-gradient(${ruleColor}, ${ruleColor}); background-repeat: no-repeat; background-size: 100% 1px; background-position: left ${FOOTER_RULE_OFFSET_MM}mm; padding-top: ${FOOTER_TEXT_GAP_MM}mm; padding-bottom: ${FOOTER_TEXT_OFFSET_MM}mm;`;
}

function buildHeaderFooterCss(settings) {
    let css = '';
    const resolvedFontFamily = getFontFamily(settings.fontPreset, settings.fontFamily);
    // fontMarginBoxPreset: '' means follow body font; otherwise use the specified preset
    const marginBoxFontFamily = settings.fontMarginBoxPreset
        ? getFontFamily(settings.fontMarginBoxPreset, settings.fontFamily)
        : resolvedFontFamily;

    for (const [position, info] of Object.entries(POSITION_MAP)) {
        const fontSize = info.isHeader ? settings.headerFontSize : settings.footerFontSize;
        const ruleEnabled = info.isHeader ? settings.headerRule : settings.footerRule;
        const ruleColor = info.isHeader
            ? (settings.headerRuleColor || settings.decorationColor)
            : (settings.footerRuleColor || settings.decorationColor);
        const contentVal = getMarginText(settings, position);

        const declarations = [];
        if (ruleEnabled) {
            declarations.push(buildMarginRuleCss(info, ruleColor));
        }

        if (contentVal) {
            declarations.push(`content: ${contentVal};`);
            declarations.push(`font-family: ${marginBoxFontFamily};`);
            declarations.push(`font-size: ${fontSize}pt;`);
            declarations.push(`color: ${settings.decorationColor};`);
        } else if (ruleEnabled) {
            declarations.push('content: "";');
        }

        if (declarations.length > 0) {
            css += `
                ${info.selector} {
                    ${declarations.join('\n                    ')}
                }`;
        }
    }

    return css;
}

module.exports = {
    buildHeaderFooterCss,
};