'use strict';

module.exports = [
    {
        name: 'instruction-step',
        fields: `
step:text
title:text
content:markdown
note:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-instruction-step">
  <div class="mdpdf-el-instruction-step__header">
    <div class="mdpdf-el-instruction-step__step">[step]</div>
    <div class="mdpdf-el-instruction-step__title">[title]</div>
  </div>
  <div class="mdpdf-el-instruction-step__content">[content]</div>
  <div class="mdpdf-el-instruction-step__note">[note]</div>
</section>
`,
        cssText: `
.mdpdf-el-instruction-step {
  margin: 0 0 5mm;
  padding: 3.5mm 4mm;
  border: 1px solid rgba(0, 0, 0, 0.16);
  border-radius: 2mm;
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-instruction-step__header {
  display: flex;
  align-items: baseline;
  gap: 3mm;
  margin-bottom: 2mm;
}

.mdpdf-el-instruction-step__step {
  min-width: 10mm;
  padding: 0.5mm 2mm;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  font-size: 8.5pt;
  text-transform: uppercase;
}

.mdpdf-el-instruction-step__title {
  font-weight: 700;
}

.mdpdf-el-instruction-step__step:empty,
.mdpdf-el-instruction-step__title:empty,
.mdpdf-el-instruction-step__note:empty {
  display: none;
}

.mdpdf-el-instruction-step__content > :first-child,
.mdpdf-el-instruction-step__note > :first-child {
  margin-top: 0;
}

.mdpdf-el-instruction-step__content > :last-child,
.mdpdf-el-instruction-step__note > :last-child {
  margin-bottom: 0;
}

.mdpdf-el-instruction-step__note {
  margin-top: 2mm;
  font-size: 9.5pt;
}
`,
    },
    {
        name: 'response-area',
        fields: `
title:text
height:length
hint:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-response-area">
  <div class="mdpdf-el-response-area__title">[title]</div>
  <div class="mdpdf-el-response-area__box" style="min-height: [height];"></div>
  <div class="mdpdf-el-response-area__hint">[hint]</div>
</section>
`,
        cssText: `
.mdpdf-el-response-area {
  margin: 0 0 5mm;
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-response-area__title {
  font-weight: 700;
  margin-bottom: 1.5mm;
}

.mdpdf-el-response-area__box {
  border: 1px dashed rgba(0, 0, 0, 0.4);
  border-radius: 2mm;
  background: rgba(0, 0, 0, 0.015);
}

.mdpdf-el-response-area__box[style="min-height: ;"] {
  min-height: 18mm !important;
}

.mdpdf-el-response-area__title:empty,
.mdpdf-el-response-area__hint:empty {
  display: none;
}

.mdpdf-el-response-area__hint {
  margin-top: 1.5mm;
  font-size: 9pt;
}

.mdpdf-el-response-area__hint > :first-child {
  margin-top: 0;
}

.mdpdf-el-response-area__hint > :last-child {
  margin-bottom: 0;
}
`,
    },
    {
        name: 'materials-list',
        fields: `
title:text
items:markdown
note:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-materials-list">
  <div class="mdpdf-el-materials-list__title">[title]</div>
  <div class="mdpdf-el-materials-list__items">[items]</div>
  <div class="mdpdf-el-materials-list__note">[note]</div>
</section>
`,
        cssText: `
.mdpdf-el-materials-list {
  margin: 0 0 5mm;
  padding: 3.5mm 4mm;
  border: 1px solid rgba(0, 0, 0, 0.16);
  border-radius: 2mm;
  background: rgba(0, 0, 0, 0.02);
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-materials-list__title {
  font-weight: 700;
  margin-bottom: 2mm;
}

.mdpdf-el-materials-list__title:empty,
.mdpdf-el-materials-list__note:empty {
  display: none;
}

.mdpdf-el-materials-list__items ul,
.mdpdf-el-materials-list__items ol {
  margin-bottom: 0;
}

.mdpdf-el-materials-list__note {
  margin-top: 2mm;
  font-size: 9.5pt;
}

.mdpdf-el-materials-list__note > :first-child {
  margin-top: 0;
}

.mdpdf-el-materials-list__note > :last-child {
  margin-bottom: 0;
}
`,
    },
    {
        name: 'safety-note',
        fields: `
title:text
level:text
content:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-safety-note">
  <div class="mdpdf-el-safety-note__header">
    <div class="mdpdf-el-safety-note__title">[title]</div>
    <div class="mdpdf-el-safety-note__level">[level]</div>
  </div>
  <div class="mdpdf-el-safety-note__content">[content]</div>
</section>
`,
        cssText: `
.mdpdf-el-safety-note {
  margin: 0 0 5mm;
  padding: 4mm 4.5mm;
  border: 1px solid rgba(180, 35, 24, 0.24);
  border-left: 2mm solid #b42318;
  background: rgba(180, 35, 24, 0.08);
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-safety-note__header {
  display: flex;
  justify-content: space-between;
  gap: 4mm;
  margin-bottom: 2mm;
}

.mdpdf-el-safety-note__title {
  font-weight: 700;
}

.mdpdf-el-safety-note__level {
  font-size: 9pt;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mdpdf-el-safety-note__title:empty,
.mdpdf-el-safety-note__level:empty {
  display: none;
}

.mdpdf-el-safety-note__content > :first-child {
  margin-top: 0;
}

.mdpdf-el-safety-note__content > :last-child {
  margin-bottom: 0;
}
`,
    },
];