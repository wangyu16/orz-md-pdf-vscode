'use strict';

module.exports = [
    {
        name: 'question-choice',
        fields: `
number:text
points:text
prompt:markdown
choices:markdown
answer:markdown
explanation:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-question-choice">
  <div class="mdpdf-el-question-choice__meta">
    <div class="mdpdf-el-question-choice__number">[number]</div>
    <div class="mdpdf-el-question-choice__points">[points]</div>
  </div>
  <div class="mdpdf-el-question-choice__prompt">[prompt]</div>
  <div class="mdpdf-el-question-choice__choices">[choices]</div>
  <div class="mdpdf-el-question-choice__answer" data-show-when="answer-key=show">
    <strong>Answer:</strong> [answer]
  </div>
  <div class="mdpdf-el-question-choice__explanation" data-show-when="audience=instructor">
    [explanation]
  </div>
</section>
`,
        cssText: `
.mdpdf-el-question-choice {
  border: 1px solid #333;
  border-radius: 3mm;
  padding: 4mm 4.5mm;
  margin: 0 0 5mm;
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-question-choice__meta {
  display: flex;
  justify-content: space-between;
  gap: 4mm;
  margin-bottom: 2mm;
  font-size: 10pt;
  font-weight: 600;
}

.mdpdf-el-question-choice__number:empty,
.mdpdf-el-question-choice__points:empty,
.mdpdf-el-question-choice__answer:empty,
.mdpdf-el-question-choice__explanation:empty {
  display: none;
}

.mdpdf-el-question-choice__choices ul,
.mdpdf-el-question-choice__choices ol {
  margin-top: 2mm;
  margin-bottom: 0;
}

.mdpdf-el-question-choice__answer,
.mdpdf-el-question-choice__explanation {
  margin-top: 3mm;
}
`,
    },
    {
        name: 'question-open',
        fields: `
number:text
points:text
prompt:markdown
response_area:length
answer:markdown
explanation:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-question-open">
  <div class="mdpdf-el-question-open__meta">
    <div class="mdpdf-el-question-open__number">[number]</div>
    <div class="mdpdf-el-question-open__points">[points]</div>
  </div>
  <div class="mdpdf-el-question-open__prompt">[prompt]</div>
  <div class="mdpdf-el-question-open__response" style="min-height: [response_area];"></div>
  <div class="mdpdf-el-question-open__answer" data-show-when="answer-key=show">
    <strong>Suggested answer:</strong>
    [answer]
  </div>
  <div class="mdpdf-el-question-open__explanation" data-show-when="audience=instructor">
    [explanation]
  </div>
</section>
`,
        cssText: `
.mdpdf-el-question-open {
  border: 1px solid #555;
  border-radius: 3mm;
  padding: 4mm 4.5mm;
  margin: 0 0 5mm;
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-question-open__meta {
  display: flex;
  justify-content: space-between;
  gap: 4mm;
  margin-bottom: 2mm;
  font-size: 10pt;
  font-weight: 600;
}

.mdpdf-el-question-open__number:empty,
.mdpdf-el-question-open__points:empty,
.mdpdf-el-question-open__answer:empty,
.mdpdf-el-question-open__explanation:empty {
  display: none;
}

.mdpdf-el-question-open__response {
  margin-top: 3mm;
  border: 1px dashed #999;
  border-radius: 2mm;
  background: rgba(0, 0, 0, 0.015);
}

.mdpdf-el-question-open__response[style="min-height: ;"] {
  min-height: 18mm !important;
}

.mdpdf-el-question-open__answer,
.mdpdf-el-question-open__explanation {
  margin-top: 3mm;
}
`,
    },
    {
        name: 'score-box',
        fields: `
label:text
value:text
max:text
note:markdown
`,
        htmlTemplate: `
<div class="mdpdf-el-score-box">
  <div class="mdpdf-el-score-box__label">[label]</div>
  <div class="mdpdf-el-score-box__value-row">
    <span class="mdpdf-el-score-box__value">[value]</span>
    <span class="mdpdf-el-score-box__separator">/</span>
    <span class="mdpdf-el-score-box__max">[max]</span>
  </div>
  <div class="mdpdf-el-score-box__note">[note]</div>
</div>
`,
        cssText: `
.mdpdf-el-score-box {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 22mm;
  padding: 2.5mm 3mm;
  border: 1px solid #333;
  border-radius: 2.5mm;
  margin: 0 0 4mm;
  text-align: center;
}

.mdpdf-el-score-box__label {
  font-size: 8.5pt;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mdpdf-el-score-box__value-row {
  display: flex;
  align-items: baseline;
  gap: 1mm;
  font-weight: 700;
  font-size: 12pt;
}

.mdpdf-el-score-box__separator:empty,
.mdpdf-el-score-box__note:empty,
.mdpdf-el-score-box__label:empty {
  display: none;
}

.mdpdf-el-score-box__note {
  margin-top: 1mm;
  font-size: 8.5pt;
}

.mdpdf-el-score-box__note > :last-child {
  margin-bottom: 0;
}
`,
    },
    {
        name: 'solution-block',
        fields: `
title:text
content:markdown
note:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-solution-block" data-show-when="answer-key=show">
  <div class="mdpdf-el-solution-block__title">[title]</div>
  <div class="mdpdf-el-solution-block__content">[content]</div>
  <div class="mdpdf-el-solution-block__note">[note]</div>
</section>
`,
        cssText: `
.mdpdf-el-solution-block {
  margin: 3mm 0 5mm;
  padding: 3.5mm 4mm;
  border-left: 2mm solid #2f6f44;
  background: rgba(47, 111, 68, 0.08);
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-solution-block__title {
  font-weight: 700;
  margin-bottom: 1.5mm;
}

.mdpdf-el-solution-block__title:empty,
.mdpdf-el-solution-block__note:empty {
  display: none;
}

.mdpdf-el-solution-block__content > :first-child,
.mdpdf-el-solution-block__note > :first-child {
  margin-top: 0;
}

.mdpdf-el-solution-block__content > :last-child,
.mdpdf-el-solution-block__note > :last-child {
  margin-bottom: 0;
}

.mdpdf-el-solution-block__note {
  margin-top: 2mm;
  font-size: 9pt;
}
`,
    },
    {
        name: 'question-multi-part',
        fields: `
number:text
points:text
prompt:markdown
parts:markdown
answer:markdown
explanation:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-question-multi-part">
  <div class="mdpdf-el-question-multi-part__meta">
    <div class="mdpdf-el-question-multi-part__number">[number]</div>
    <div class="mdpdf-el-question-multi-part__points">[points]</div>
  </div>
  <div class="mdpdf-el-question-multi-part__prompt">[prompt]</div>
  <div class="mdpdf-el-question-multi-part__parts">[parts]</div>
  <div class="mdpdf-el-question-multi-part__answer" data-show-when="answer-key=show">[answer]</div>
  <div class="mdpdf-el-question-multi-part__explanation" data-show-when="audience=instructor">[explanation]</div>
</section>
`,
        cssText: `
.mdpdf-el-question-multi-part {
  border: 1px solid #666;
  border-radius: 2.5mm;
  padding: 4mm 4.5mm;
  margin: 0 0 5mm;
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-question-multi-part__meta {
  display: flex;
  justify-content: space-between;
  gap: 4mm;
  margin-bottom: 2mm;
  font-size: 10pt;
  font-weight: 600;
}

.mdpdf-el-question-multi-part__number:empty,
.mdpdf-el-question-multi-part__points:empty,
.mdpdf-el-question-multi-part__answer:empty,
.mdpdf-el-question-multi-part__explanation:empty {
  display: none;
}

.mdpdf-el-question-multi-part__parts ol,
.mdpdf-el-question-multi-part__parts ul {
  margin-top: 2mm;
}

.mdpdf-el-question-multi-part__answer,
.mdpdf-el-question-multi-part__explanation {
  margin-top: 3mm;
}
`,
    },
    {
        name: 'rubric-block',
        fields: `
title:text
criteria:markdown
points:text
`,
        htmlTemplate: `
<section class="mdpdf-el-rubric-block">
  <div class="mdpdf-el-rubric-block__header">
    <div class="mdpdf-el-rubric-block__title">[title]</div>
    <div class="mdpdf-el-rubric-block__points">[points]</div>
  </div>
  <div class="mdpdf-el-rubric-block__criteria">[criteria]</div>
</section>
`,
        cssText: `
.mdpdf-el-rubric-block {
  margin: 0 0 5mm;
  padding: 3.5mm 4mm;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: rgba(0, 0, 0, 0.025);
}

.mdpdf-el-rubric-block__header {
  display: flex;
  justify-content: space-between;
  gap: 4mm;
  margin-bottom: 2mm;
}

.mdpdf-el-rubric-block__title {
  font-weight: 700;
}

.mdpdf-el-rubric-block__points:empty,
.mdpdf-el-rubric-block__title:empty {
  display: none;
}

.mdpdf-el-rubric-block__criteria > :first-child {
  margin-top: 0;
}

.mdpdf-el-rubric-block__criteria > :last-child {
  margin-bottom: 0;
}
`,
    },
];