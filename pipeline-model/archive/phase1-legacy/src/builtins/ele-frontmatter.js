'use strict';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseStructuredRows(rawValue) {
  return String(rawValue || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split('|').map((part) => part.trim()));
}

function normalizeLabelList(rawValue) {
  return String(rawValue || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function renderSuperscript(labels) {
  if (!labels || labels.length === 0) {
    return '';
  }

  return `<sup class="mdpdf-el-author-affiliation__sup">${escapeHtml(labels.join(','))}</sup>`;
}

function renderAuthorAffiliationStructured(block, helpers) {
  const authorRows = parseStructuredRows(helpers.getRawField('authors'));
  if (authorRows.length === 0) {
    return '';
  }

  const affiliationRows = parseStructuredRows(helpers.getRawField('affiliations'));
  const correspondingRows = parseStructuredRows(helpers.getRawField('corresponding'));

  const authorsHtml = authorRows
    .map((parts) => {
      const [name = '', affiliationLabels = '', correspondingLabels = ''] = parts;
      const labels = [
        ...normalizeLabelList(affiliationLabels),
        ...normalizeLabelList(correspondingLabels),
      ];
      if (!name) {
        return '';
      }
      return `<span class="mdpdf-el-author-affiliation__author-chip">${escapeHtml(name)}${renderSuperscript(labels)}</span>`;
    })
    .filter(Boolean)
    .join('<span class="mdpdf-el-author-affiliation__separator">, </span>');

  const affiliationsHtml = affiliationRows
    .map((parts) => {
      const [label = '', ...textParts] = parts;
      const text = textParts.join(' | ').trim();
      if (!label || !text) {
        return '';
      }
      return `
<div class="mdpdf-el-author-affiliation__affiliation-row">
  <span class="mdpdf-el-author-affiliation__label">${escapeHtml(label)}</span>
  <span class="mdpdf-el-author-affiliation__text">${escapeHtml(text)}</span>
</div>`;
    })
    .filter(Boolean)
    .join('');

  const correspondingHtml = correspondingRows
    .map((parts) => {
      const [label = '', ...textParts] = parts;
      const text = textParts.join(' | ').trim();
      if (!label || !text) {
        return '';
      }
      return `
<div class="mdpdf-el-author-affiliation__corresponding-row">
  <span class="mdpdf-el-author-affiliation__label">${escapeHtml(label)}</span>
  <span class="mdpdf-el-author-affiliation__text">${escapeHtml(text)}</span>
</div>`;
    })
    .filter(Boolean)
    .join('');

  const noteHtml = helpers.renderFieldValue('note');

  return Promise.resolve(noteHtml).then((resolvedNoteHtml) => `
<section class="mdpdf-el-author-affiliation mdpdf-el-author-affiliation--journal">
  <div class="mdpdf-el-author-affiliation__authors">${authorsHtml}</div>
  <div class="mdpdf-el-author-affiliation__affiliations">${affiliationsHtml}</div>
  <div class="mdpdf-el-author-affiliation__corresponding">${correspondingHtml}</div>
  <div class="mdpdf-el-author-affiliation__note">${resolvedNoteHtml}</div>
</section>`);
}

async function renderAuthorAffiliation(block, helpers) {
  const hasStructuredAuthors = String(helpers.getRawField('authors') || '').trim().length > 0;

  if (hasStructuredAuthors) {
    return renderAuthorAffiliationStructured(block, helpers);
  }

  const author = await helpers.renderFieldValue('author');
  const affiliation = await helpers.renderFieldValue('affiliation');
  const email = await helpers.renderFieldValue('email');
  const note = await helpers.renderFieldValue('note');

  return `
<section class="mdpdf-el-author-affiliation">
  <div class="mdpdf-el-author-affiliation__author">${author}</div>
  <div class="mdpdf-el-author-affiliation__affiliation">${affiliation}</div>
  <div class="mdpdf-el-author-affiliation__email">${email}</div>
  <div class="mdpdf-el-author-affiliation__note">${note}</div>
</section>`;
}

module.exports = [
    {
        name: 'abstract-block',
        fields: `
title:text
content:markdown
keywords:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-abstract-block">
  <div class="mdpdf-el-abstract-block__title">[title]</div>
  <div class="mdpdf-el-abstract-block__content">[content]</div>
  <div class="mdpdf-el-abstract-block__keywords">[keywords]</div>
</section>
`,
        cssText: `
.mdpdf-el-abstract-block {
  margin: 0 0 7mm;
  padding: 4mm 5mm;
  border: 1px solid rgba(0, 0, 0, 0.22);
  background: rgba(0, 0, 0, 0.02);
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-abstract-block__title {
  font-size: 11pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 2mm;
}

.mdpdf-el-abstract-block__title:empty,
.mdpdf-el-abstract-block__keywords:empty {
  display: none;
}

.mdpdf-el-abstract-block__content > :first-child,
.mdpdf-el-abstract-block__keywords > :first-child {
  margin-top: 0;
}

.mdpdf-el-abstract-block__content > :last-child,
.mdpdf-el-abstract-block__keywords > :last-child {
  margin-bottom: 0;
}

.mdpdf-el-abstract-block__keywords {
  margin-top: 2.5mm;
  font-size: 9pt;
}
`,
    },
    {
        name: 'title-page-academic',
        fields: `
title:markdown
subtitle:markdown
author:markdown
affiliation:markdown
date:markdown
`,
        htmlTemplate: `
<section class="mdpdf-title-page mdpdf-title-page--academic">
  <div class="mdpdf-title-page__inner">
    <div class="mdpdf-title-page__title">[title]</div>
    <div class="mdpdf-title-page__subtitle">[subtitle]</div>
    <div class="mdpdf-title-page__author">[author]</div>
    <div class="mdpdf-title-page__affiliation">[affiliation]</div>
    <div class="mdpdf-title-page__date">[date]</div>
  </div>
</section>
`,
        cssText: `
.mdpdf-title-page--academic {
  align-items: center;
}

.mdpdf-title-page--academic .mdpdf-title-page__inner {
  max-width: 135mm;
}

.mdpdf-title-page--academic .mdpdf-title-page__title {
  text-align: center;
}

.mdpdf-title-page--academic .mdpdf-title-page__subtitle:empty,
.mdpdf-title-page--academic .mdpdf-title-page__author:empty,
.mdpdf-title-page--academic .mdpdf-title-page__affiliation:empty,
.mdpdf-title-page--academic .mdpdf-title-page__date:empty {
  display: none;
}

.mdpdf-title-page--academic .mdpdf-title-page__subtitle,
.mdpdf-title-page--academic .mdpdf-title-page__author,
.mdpdf-title-page--academic .mdpdf-title-page__affiliation,
.mdpdf-title-page--academic .mdpdf-title-page__date {
  text-align: center;
}
`,
    },
    {
        name: 'author-affiliation',
        fields: `
author:markdown
affiliation:markdown
email:markdown
note:markdown
    authors:text
    affiliations:text
    corresponding:text
`,
      render: renderAuthorAffiliation,
        cssText: `
.mdpdf-el-author-affiliation {
  max-width: 125mm;
  margin: 0 auto 7mm;
  text-align: center;
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-author-affiliation__author {
  font-size: 12pt;
  font-weight: 700;
  line-height: 1.35;
}

.mdpdf-el-author-affiliation__authors {
  font-size: 12pt;
  font-weight: 700;
  line-height: 1.45;
}

.mdpdf-el-author-affiliation__author-chip {
  display: inline;
}

.mdpdf-el-author-affiliation__sup {
  font-size: 0.75em;
  vertical-align: super;
  margin-left: 0.08em;
}

.mdpdf-el-author-affiliation__affiliation,
.mdpdf-el-author-affiliation__email,
.mdpdf-el-author-affiliation__note {
  font-size: 10pt;
  line-height: 1.45;
  color: rgba(0, 0, 0, 0.72);
}

.mdpdf-el-author-affiliation__affiliation {
  margin-top: 1.5mm;
}

.mdpdf-el-author-affiliation__email,
.mdpdf-el-author-affiliation__note {
  margin-top: 1mm;
}

.mdpdf-el-author-affiliation__affiliations,
.mdpdf-el-author-affiliation__corresponding {
  margin-top: 2mm;
}

.mdpdf-el-author-affiliation__affiliation-row,
.mdpdf-el-author-affiliation__corresponding-row {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 1.6mm;
}

.mdpdf-el-author-affiliation__label {
  min-width: 3.5mm;
  font-size: 9pt;
  font-weight: 700;
  line-height: 1.45;
}

.mdpdf-el-author-affiliation__text {
  max-width: 116mm;
  font-size: 10pt;
  line-height: 1.45;
  text-align: left;
}

.mdpdf-el-author-affiliation__separator {
  white-space: pre;
}

.mdpdf-el-author-affiliation__author:empty,
.mdpdf-el-author-affiliation__affiliation:empty,
.mdpdf-el-author-affiliation__email:empty,
.mdpdf-el-author-affiliation__note:empty,
.mdpdf-el-author-affiliation__authors:empty,
.mdpdf-el-author-affiliation__affiliations:empty,
.mdpdf-el-author-affiliation__corresponding:empty {
  display: none;
}

.mdpdf-el-author-affiliation__author > :first-child,
.mdpdf-el-author-affiliation__affiliation > :first-child,
.mdpdf-el-author-affiliation__email > :first-child,
.mdpdf-el-author-affiliation__note > :first-child,
.mdpdf-el-author-affiliation__text > :first-child {
  margin-top: 0;
}

.mdpdf-el-author-affiliation__author > :last-child,
.mdpdf-el-author-affiliation__affiliation > :last-child,
.mdpdf-el-author-affiliation__email > :last-child,
.mdpdf-el-author-affiliation__note > :last-child,
.mdpdf-el-author-affiliation__text > :last-child {
  margin-bottom: 0;
}
`,
    },
    {
        name: 'title-page-report',
        fields: `
title:markdown
subtitle:markdown
organization:markdown
author:markdown
date:markdown
`,
        htmlTemplate: `
<section class="mdpdf-title-page mdpdf-title-page--report">
  <div class="mdpdf-title-page__inner">
    <div class="mdpdf-title-page__title">[title]</div>
    <div class="mdpdf-title-page__subtitle">[subtitle]</div>
    <div class="mdpdf-title-page__affiliation">[organization]</div>
    <div class="mdpdf-title-page__author">[author]</div>
    <div class="mdpdf-title-page__date">[date]</div>
  </div>
</section>
`,
        cssText: `
.mdpdf-title-page--report {
  align-items: flex-end;
}

.mdpdf-title-page--report .mdpdf-title-page__inner {
  max-width: 145mm;
  border-top: 3px solid currentColor;
  padding-top: 12mm;
}
`,
    },
    {
        name: 'executive-summary-block',
        fields: `
title:text
summary:markdown
recommendation:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-executive-summary-block">
  <div class="mdpdf-el-executive-summary-block__title">[title]</div>
  <div class="mdpdf-el-executive-summary-block__summary">[summary]</div>
  <div class="mdpdf-el-executive-summary-block__recommendation">[recommendation]</div>
</section>
`,
        cssText: `
.mdpdf-el-executive-summary-block {
  margin: 0 0 7mm;
  padding: 4mm 5mm;
  border: 1px solid rgba(31, 58, 91, 0.22);
  background: rgba(31, 58, 91, 0.04);
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-executive-summary-block__title {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 2mm;
}

.mdpdf-el-executive-summary-block__title:empty,
.mdpdf-el-executive-summary-block__recommendation:empty {
  display: none;
}

.mdpdf-el-executive-summary-block__summary > :first-child,
.mdpdf-el-executive-summary-block__recommendation > :first-child {
  margin-top: 0;
}

.mdpdf-el-executive-summary-block__summary > :last-child,
.mdpdf-el-executive-summary-block__recommendation > :last-child {
  margin-bottom: 0;
}

.mdpdf-el-executive-summary-block__recommendation {
  margin-top: 2mm;
}
`,
    },
];