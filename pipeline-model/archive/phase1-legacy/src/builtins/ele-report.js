'use strict';

module.exports = [
    {
        name: 'decision-box',
        fields: `
title:text
status:text
summary:markdown
details:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-decision-box">
  <div class="mdpdf-el-decision-box__header">
    <div class="mdpdf-el-decision-box__title">[title]</div>
    <div class="mdpdf-el-decision-box__status">[status]</div>
  </div>
  <div class="mdpdf-el-decision-box__summary">[summary]</div>
  <div class="mdpdf-el-decision-box__details">[details]</div>
</section>
`,
        cssText: `
.mdpdf-el-decision-box {
  margin: 0 0 6mm;
  padding: 4mm 4.5mm;
  border: 1px solid rgba(18, 52, 86, 0.25);
  border-left: 2mm solid #1f4b7a;
  background: rgba(31, 75, 122, 0.06);
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-decision-box__header {
  display: flex;
  justify-content: space-between;
  gap: 4mm;
  align-items: baseline;
  margin-bottom: 2mm;
}

.mdpdf-el-decision-box__title {
  font-weight: 700;
}

.mdpdf-el-decision-box__status {
  font-size: 9pt;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mdpdf-el-decision-box__title:empty,
.mdpdf-el-decision-box__status:empty,
.mdpdf-el-decision-box__details:empty {
  display: none;
}

.mdpdf-el-decision-box__summary > :first-child,
.mdpdf-el-decision-box__details > :first-child {
  margin-top: 0;
}

.mdpdf-el-decision-box__summary > :last-child,
.mdpdf-el-decision-box__details > :last-child {
  margin-bottom: 0;
}

.mdpdf-el-decision-box__details {
  margin-top: 2mm;
  font-size: 9.5pt;
}
`,
    },
    {
        name: 'risk-box',
        fields: `
title:text
level:text
impact:markdown
mitigation:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-risk-box">
  <div class="mdpdf-el-risk-box__header">
    <div class="mdpdf-el-risk-box__title">[title]</div>
    <div class="mdpdf-el-risk-box__level">[level]</div>
  </div>
  <div class="mdpdf-el-risk-box__impact">[impact]</div>
  <div class="mdpdf-el-risk-box__mitigation">[mitigation]</div>
</section>
`,
        cssText: `
.mdpdf-el-risk-box {
  margin: 0 0 6mm;
  padding: 4mm 4.5mm;
  border: 1px solid rgba(120, 53, 15, 0.28);
  border-left: 2mm solid #a15c17;
  background: rgba(161, 92, 23, 0.08);
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-risk-box__header {
  display: flex;
  justify-content: space-between;
  gap: 4mm;
  align-items: baseline;
  margin-bottom: 2mm;
}

.mdpdf-el-risk-box__title {
  font-weight: 700;
}

.mdpdf-el-risk-box__level {
  font-size: 9pt;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mdpdf-el-risk-box__title:empty,
.mdpdf-el-risk-box__level:empty,
.mdpdf-el-risk-box__mitigation:empty {
  display: none;
}

.mdpdf-el-risk-box__impact > :first-child,
.mdpdf-el-risk-box__mitigation > :first-child {
  margin-top: 0;
}

.mdpdf-el-risk-box__impact > :last-child,
.mdpdf-el-risk-box__mitigation > :last-child {
  margin-bottom: 0;
}

.mdpdf-el-risk-box__mitigation {
  margin-top: 2mm;
  font-size: 9.5pt;
}
`,
    },
    {
        name: 'info-panel',
        fields: `
title:text
left:markdown
right:markdown
details:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-info-panel">
  <div class="mdpdf-el-info-panel__title">[title]</div>
  <div class="mdpdf-el-info-panel__grid">
    <div class="mdpdf-el-info-panel__left">[left]</div>
    <div class="mdpdf-el-info-panel__right">[right]</div>
  </div>
  <div class="mdpdf-el-info-panel__details">[details]</div>
</section>
`,
        cssText: `
.mdpdf-el-info-panel {
  margin: 0 0 6mm;
  padding: 4mm 4.5mm;
  border: 1px solid rgba(48, 72, 94, 0.18);
  background: rgba(48, 72, 94, 0.04);
  border-radius: 2mm;
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-info-panel__title {
  font-weight: 700;
  margin-bottom: 2mm;
}

.mdpdf-el-info-panel__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4mm;
}

.mdpdf-el-info-panel__title:empty,
.mdpdf-el-info-panel__details:empty {
  display: none;
}

.mdpdf-el-info-panel__left > :first-child,
.mdpdf-el-info-panel__right > :first-child,
.mdpdf-el-info-panel__details > :first-child {
  margin-top: 0;
}

.mdpdf-el-info-panel__left > :last-child,
.mdpdf-el-info-panel__right > :last-child,
.mdpdf-el-info-panel__details > :last-child {
  margin-bottom: 0;
}

.mdpdf-el-info-panel__details {
  margin-top: 2.5mm;
  font-size: 9.5pt;
}
`,
    },
    {
        name: 'report-cover',
        fields: `
title:markdown
subtitle:markdown
organization:markdown
summary:markdown
date:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-report-cover">
  <div class="mdpdf-el-report-cover__title">[title]</div>
  <div class="mdpdf-el-report-cover__subtitle">[subtitle]</div>
  <div class="mdpdf-el-report-cover__organization">[organization]</div>
  <div class="mdpdf-el-report-cover__summary">[summary]</div>
  <div class="mdpdf-el-report-cover__date">[date]</div>
</section>
`,
        cssText: `
.mdpdf-el-report-cover {
  min-height: 220mm;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 16mm 0 8mm;
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-report-cover__title {
  font-size: 24pt;
  line-height: 1.1;
  font-weight: 700;
}

.mdpdf-el-report-cover__subtitle,
.mdpdf-el-report-cover__organization,
.mdpdf-el-report-cover__summary,
.mdpdf-el-report-cover__date {
  margin-top: 3mm;
}

.mdpdf-el-report-cover__title > :first-child,
.mdpdf-el-report-cover__subtitle > :first-child,
.mdpdf-el-report-cover__organization > :first-child,
.mdpdf-el-report-cover__summary > :first-child,
.mdpdf-el-report-cover__date > :first-child {
  margin-top: 0;
}

.mdpdf-el-report-cover__title > :last-child,
.mdpdf-el-report-cover__subtitle > :last-child,
.mdpdf-el-report-cover__organization > :last-child,
.mdpdf-el-report-cover__summary > :last-child,
.mdpdf-el-report-cover__date > :last-child {
  margin-bottom: 0;
}
`,
    },
    {
        name: 'milestone-item',
        fields: `
title:markdown
owner:markdown
date:text
status:text
summary:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-milestone-item">
  <div class="mdpdf-el-milestone-item__header">
    <div class="mdpdf-el-milestone-item__title">[title]</div>
    <div class="mdpdf-el-milestone-item__status">[status]</div>
  </div>
  <div class="mdpdf-el-milestone-item__meta">
    <div class="mdpdf-el-milestone-item__owner">[owner]</div>
    <div class="mdpdf-el-milestone-item__date">[date]</div>
  </div>
  <div class="mdpdf-el-milestone-item__summary">[summary]</div>
</section>
`,
        cssText: `
.mdpdf-el-milestone-item {
  margin: 0 0 4.5mm;
  padding-bottom: 3mm;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.mdpdf-el-milestone-item__header,
.mdpdf-el-milestone-item__meta {
  display: flex;
  justify-content: space-between;
  gap: 4mm;
}

.mdpdf-el-milestone-item__title {
  font-weight: 700;
}

.mdpdf-el-milestone-item__meta {
  margin-top: 1mm;
  font-size: 9.5pt;
}

.mdpdf-el-milestone-item__summary {
  margin-top: 2mm;
}

.mdpdf-el-milestone-item__summary > :first-child {
  margin-top: 0;
}

.mdpdf-el-milestone-item__summary > :last-child {
  margin-bottom: 0;
}
`,
    },
    {
        name: 'figure-captioned',
        fields: `
figure:markdown
caption:markdown
`,
        htmlTemplate: `
<figure class="mdpdf-el-figure-captioned">
  <div class="mdpdf-el-figure-captioned__media">[figure]</div>
  <figcaption class="mdpdf-el-figure-captioned__caption">[caption]</figcaption>
</figure>
`,
        cssText: `
.mdpdf-el-figure-captioned {
  margin: 0 0 6mm;
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-figure-captioned__media > :first-child,
.mdpdf-el-figure-captioned__caption > :first-child {
  margin-top: 0;
}

.mdpdf-el-figure-captioned__caption {
  margin-top: 2mm;
  font-size: 9pt;
  text-align: center;
}
`,
    },
    {
        name: 'table-captioned',
        fields: `
table_body:markdown
caption:markdown
`,
        htmlTemplate: `
<figure class="mdpdf-el-table-captioned">
  <div class="mdpdf-el-table-captioned__table">[table_body]</div>
  <figcaption class="mdpdf-el-table-captioned__caption">[caption]</figcaption>
</figure>
`,
        cssText: `
.mdpdf-el-table-captioned {
  margin: 0 0 6mm;
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-table-captioned__caption {
  margin-top: 2mm;
  font-size: 9pt;
  text-align: center;
}
`,
    },
];