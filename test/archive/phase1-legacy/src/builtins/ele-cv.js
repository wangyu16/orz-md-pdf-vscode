'use strict';

module.exports = [
    {
        name: 'cv-item-2col',
        fields: `
left:markdown
right:markdown
body:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-cv-item-2col">
  <div class="mdpdf-el-cv-item-2col__header">
    <div class="mdpdf-el-cv-item-2col__left">[left]</div>
    <div class="mdpdf-el-cv-item-2col__right">[right]</div>
  </div>
  <div class="mdpdf-el-cv-item-2col__body">[body]</div>
</section>
`,
        cssText: `
.mdpdf-el-cv-item-2col {
  margin: 0 0 4mm;
}

.mdpdf-el-cv-item-2col__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4mm;
  align-items: baseline;
}

.mdpdf-el-cv-item-2col__left > :first-child,
.mdpdf-el-cv-item-2col__right > :first-child {
  margin-top: 0;
}

.mdpdf-el-cv-item-2col__right {
  text-align: right;
  white-space: nowrap;
}

.mdpdf-el-cv-item-2col__body:empty {
  display: none;
}

.mdpdf-el-cv-item-2col__body {
  margin-top: 1.5mm;
}

.mdpdf-el-cv-item-2col__body > :last-child {
  margin-bottom: 0;
}
`,
    },
    {
        name: 'cv-item-3col',
        fields: `
left:markdown
center:markdown
right:markdown
body:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-cv-item-3col">
  <div class="mdpdf-el-cv-item-3col__header">
    <div class="mdpdf-el-cv-item-3col__left">[left]</div>
    <div class="mdpdf-el-cv-item-3col__center">[center]</div>
    <div class="mdpdf-el-cv-item-3col__right">[right]</div>
  </div>
  <div class="mdpdf-el-cv-item-3col__body">[body]</div>
</section>
`,
        cssText: `
.mdpdf-el-cv-item-3col {
  margin: 0 0 4mm;
}

.mdpdf-el-cv-item-3col__header {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) auto;
  gap: 3mm;
  align-items: baseline;
}

.mdpdf-el-cv-item-3col__left > :first-child,
.mdpdf-el-cv-item-3col__center > :first-child,
.mdpdf-el-cv-item-3col__right > :first-child {
  margin-top: 0;
}

.mdpdf-el-cv-item-3col__center {
  text-align: center;
}

.mdpdf-el-cv-item-3col__right {
  text-align: right;
  white-space: nowrap;
}

.mdpdf-el-cv-item-3col__body:empty {
  display: none;
}

.mdpdf-el-cv-item-3col__body {
  margin-top: 1.5mm;
}

.mdpdf-el-cv-item-3col__body > :last-child {
  margin-bottom: 0;
}
`,
    },
    {
        name: 'cv-header',
        fields: `
full_name:markdown
title:markdown
contacts:markdown
summary:markdown
`,
        htmlTemplate: `
<section class="mdpdf-el-cv-header">
  <div class="mdpdf-el-cv-header__name">[full_name]</div>
  <div class="mdpdf-el-cv-header__title">[title]</div>
  <div class="mdpdf-el-cv-header__contacts">[contacts]</div>
  <div class="mdpdf-el-cv-header__summary">[summary]</div>
</section>
`,
        cssText: `
.mdpdf-el-cv-header {
  margin: 0 0 7mm;
  padding-bottom: 4mm;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
}

.mdpdf-el-cv-header__name {
  font-size: 22pt;
  line-height: 1.1;
  font-weight: 700;
}

.mdpdf-el-cv-header__title {
  margin-top: 1.5mm;
  font-size: 11pt;
  font-weight: 600;
}

.mdpdf-el-cv-header__contacts {
  margin-top: 2mm;
  font-size: 9.5pt;
}

.mdpdf-el-cv-header__summary {
  margin-top: 3mm;
}

.mdpdf-el-cv-header__name > :first-child,
.mdpdf-el-cv-header__title > :first-child,
.mdpdf-el-cv-header__contacts > :first-child,
.mdpdf-el-cv-header__summary > :first-child {
  margin-top: 0;
}

.mdpdf-el-cv-header__name > :last-child,
.mdpdf-el-cv-header__title > :last-child,
.mdpdf-el-cv-header__contacts > :last-child,
.mdpdf-el-cv-header__summary > :last-child {
  margin-bottom: 0;
}

.mdpdf-el-cv-header__title:empty,
.mdpdf-el-cv-header__contacts:empty,
.mdpdf-el-cv-header__summary:empty {
  display: none;
}
`,
    },
];