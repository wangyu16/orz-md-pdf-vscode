'use strict';

module.exports = {
    'exam-classic': {
        settings: {
            pageSize: 'Letter',
            marginTop: 16,
            marginBottom: 16,
            marginLeft: 18,
            marginRight: 18,
            fontPreset: 'system-serif',
            fontSize: 11.5,
            lineHeight: 1.45,
            decorationColor: '#111111',
            pageNumberPosition: 'footer-right',
            pageNumberStyle: 'page-n',
            headerRule: false,
            footerRule: false,
            preBodyHideHeader: true,
            preBodyHideFooter: true,
            theme: 'light-academic-2',
        },
        cssText: `
#content h1,
#content h2,
#content h3 {
  letter-spacing: 0.01em;
}

#content h1 {
  text-transform: uppercase;
  font-size: 18pt;
  margin-bottom: 4mm;
}

.mdpdf-el-question-choice,
.mdpdf-el-question-open {
  border-color: #111111;
  border-radius: 0;
  box-shadow: none;
}

.mdpdf-el-question-choice__meta,
.mdpdf-el-question-open__meta {
  border-bottom: 1px solid rgba(0, 0, 0, 0.18);
  padding-bottom: 1.5mm;
}

.mdpdf-el-score-box {
  border-radius: 0;
  border-width: 1.25px;
  min-width: 24mm;
}

.mdpdf-el-solution-block {
  border-left-width: 1.5mm;
  background: rgba(0, 0, 0, 0.04);
}
`,
    },
    'exam-compact': {
        settings: {
            pageSize: 'Letter',
            marginTop: 13,
            marginBottom: 13,
            marginLeft: 15,
            marginRight: 15,
            fontPreset: 'system-serif',
            fontSize: 10.5,
            lineHeight: 1.35,
            decorationColor: '#101010',
            pageNumberPosition: 'footer-right',
            pageNumberStyle: 'simple',
            headerRule: false,
            footerRule: false,
            theme: 'light-academic-2',
        },
        cssText: `
#content h1 {
  font-size: 16pt;
  text-transform: uppercase;
  margin-bottom: 3mm;
}

.mdpdf-el-question-choice,
.mdpdf-el-question-open,
.mdpdf-el-question-multi-part {
  padding: 3mm 3.5mm;
  margin-bottom: 4mm;
  border-radius: 1.5mm;
}

.mdpdf-el-rubric-block {
  padding: 3mm 3.5mm;
  margin-bottom: 4mm;
}
`,
    },
};