'use strict';

module.exports = [
    {
        name: 'chapter-opening',
        fields: `
eyebrow:text
title:markdown
subtitle:markdown
summary:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-chapter-opening">
  <div class="mdpdf-el-chapter-opening__eyebrow">[eyebrow]</div>
  <div class="mdpdf-el-chapter-opening__title">[title]</div>
  <div class="mdpdf-el-chapter-opening__subtitle">[subtitle]</div>
  <div class="mdpdf-el-chapter-opening__summary">[summary]</div>
</section>
`,
        cssText: `
.mdpdf-el-chapter-opening {
  margin: 0 0 10mm;
  padding: 12mm 0 7mm;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-chapter-opening__eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 9pt;
  margin-bottom: 2mm;
}

.mdpdf-el-chapter-opening__title {
  font-size: 24pt;
  line-height: 1.1;
  font-weight: 700;
}

.mdpdf-el-chapter-opening__subtitle,
.mdpdf-el-chapter-opening__summary {
  margin-top: 3mm;
}

.mdpdf-el-chapter-opening__eyebrow:empty,
.mdpdf-el-chapter-opening__subtitle:empty,
.mdpdf-el-chapter-opening__summary:empty {
  display: none;
}

.mdpdf-el-chapter-opening__title > :first-child,
.mdpdf-el-chapter-opening__subtitle > :first-child,
.mdpdf-el-chapter-opening__summary > :first-child {
  margin-top: 0;
}

.mdpdf-el-chapter-opening__title > :last-child,
.mdpdf-el-chapter-opening__subtitle > :last-child,
.mdpdf-el-chapter-opening__summary > :last-child {
  margin-bottom: 0;
}
`,
    },
    {
        name: 'part-opening',
        fields: `
label:text
title:markdown
summary:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-part-opening">
  <div class="mdpdf-el-part-opening__label">[label]</div>
  <div class="mdpdf-el-part-opening__title">[title]</div>
  <div class="mdpdf-el-part-opening__summary">[summary]</div>
</section>
`,
        cssText: `
.mdpdf-el-part-opening {
  margin: 0 0 8mm;
  padding: 6mm 0 4mm;
  border-top: 2px solid currentColor;
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-part-opening__label {
  font-size: 9pt;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 1.5mm;
}

.mdpdf-el-part-opening__title {
  font-size: 18pt;
  line-height: 1.15;
  font-weight: 700;
}

.mdpdf-el-part-opening__summary {
  margin-top: 2.5mm;
}

.mdpdf-el-part-opening__label:empty,
.mdpdf-el-part-opening__summary:empty {
  display: none;
}

.mdpdf-el-part-opening__title > :first-child,
.mdpdf-el-part-opening__summary > :first-child {
  margin-top: 0;
}

.mdpdf-el-part-opening__title > :last-child,
.mdpdf-el-part-opening__summary > :last-child {
  margin-bottom: 0;
}
`,
    },
    {
        name: 'sidebar-note',
        fields: `
title:text
content:markdown
tone:enum(info|warning|success|danger|neutral)
`,
        htmlTemplate: `
<aside class="mdpdf-el-sidebar-note mdpdf-el-sidebar-note--[tone]">
  <div class="mdpdf-el-sidebar-note__title">[title]</div>
  <div class="mdpdf-el-sidebar-note__content">[content]</div>
</aside>
`,
        cssText: `
.mdpdf-el-sidebar-note {
  margin: 0 0 5mm;
  padding: 3.5mm 4mm;
  border-left: 2mm solid #6b7280;
  background: rgba(107, 114, 128, 0.06);
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-sidebar-note--info {
  border-left-color: #2563eb;
  background: rgba(37, 99, 235, 0.06);
}

.mdpdf-el-sidebar-note--warning {
  border-left-color: #d97706;
  background: rgba(217, 119, 6, 0.08);
}

.mdpdf-el-sidebar-note--success {
  border-left-color: #2f6f44;
  background: rgba(47, 111, 68, 0.08);
}

.mdpdf-el-sidebar-note--danger {
  border-left-color: #b42318;
  background: rgba(180, 35, 24, 0.08);
}

.mdpdf-el-sidebar-note__title {
  font-weight: 700;
  margin-bottom: 1.5mm;
}

.mdpdf-el-sidebar-note__title:empty {
  display: none;
}

.mdpdf-el-sidebar-note__content > :first-child {
  margin-top: 0;
}

.mdpdf-el-sidebar-note__content > :last-child {
  margin-bottom: 0;
}
`,
    },
    {
        name: 'example-block',
        fields: `
title:text
content:markdown
takeaway:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-example-block">
  <div class="mdpdf-el-example-block__title">[title]</div>
  <div class="mdpdf-el-example-block__content">[content]</div>
  <div class="mdpdf-el-example-block__takeaway">[takeaway]</div>
</section>
`,
        cssText: `
.mdpdf-el-example-block {
  margin: 0 0 6mm;
  padding: 4mm 4.5mm;
  border: 1px solid rgba(49, 46, 129, 0.2);
  background: rgba(79, 70, 229, 0.04);
  border-radius: 2mm;
  break-inside: avoid;
  page-break-inside: avoid;
}

.mdpdf-el-example-block__title {
  font-weight: 700;
  margin-bottom: 2mm;
}

.mdpdf-el-example-block__title:empty,
.mdpdf-el-example-block__takeaway:empty {
  display: none;
}

.mdpdf-el-example-block__content > :first-child,
.mdpdf-el-example-block__takeaway > :first-child {
  margin-top: 0;
}

.mdpdf-el-example-block__content > :last-child,
.mdpdf-el-example-block__takeaway > :last-child {
  margin-bottom: 0;
}

.mdpdf-el-example-block__takeaway {
  margin-top: 2.5mm;
  font-size: 9.5pt;
}
`,
    },
];