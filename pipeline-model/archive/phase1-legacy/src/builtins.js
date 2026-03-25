'use strict';

const examElements = require('./builtins/ele-exam');
const frontmatterElements = require('./builtins/ele-frontmatter');
const reportElements = require('./builtins/ele-report');
const longformElements = require('./builtins/ele-longform');
const learningElements = require('./builtins/ele-learning');
const cvElements = require('./builtins/ele-cv');

const BUILT_IN_ELEMENT_DEFINITIONS = [
    ...examElements,
    ...frontmatterElements,
    ...reportElements,
    ...longformElements,
    ...learningElements,
    ...cvElements,
];

module.exports = {
    BUILT_IN_ELEMENT_DEFINITIONS,
};