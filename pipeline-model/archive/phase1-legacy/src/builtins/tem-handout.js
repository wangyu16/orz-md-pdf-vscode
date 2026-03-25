'use strict';

module.exports = {
    'handout-classroom': {
        settings: {
            pageSize: 'Letter',
            marginTop: 16,
            marginBottom: 16,
            marginLeft: 16,
            marginRight: 16,
            fontPreset: 'inter',
            fontSize: 11,
            lineHeight: 1.45,
            decorationColor: '#355070',
            pageNumberPosition: 'footer-center',
            pageNumberStyle: 'simple',
            headerRule: false,
            footerRule: false,
            theme: 'light-academic-2',
        },
        cssText: `
#content h1 {
  font-size: 20pt;
  color: #355070;
}

#content h2 {
  color: #355070;
  margin-top: 7mm;
}

#content .info,
#content .warning,
#content .success,
#content .danger {
  border-radius: 2mm;
  padding: 3mm 4mm;
}

.mdpdf-el-question-open,
.mdpdf-el-question-multi-part,
.mdpdf-el-rubric-block {
  border-color: rgba(53, 80, 112, 0.35);
}
`,
    },
    'lab-report': {
        settings: {
            pageSize: 'Letter',
            marginTop: 18,
            marginBottom: 18,
            marginLeft: 19,
            marginRight: 19,
            fontPreset: 'source-serif-4',
            fontSize: 11.25,
            lineHeight: 1.5,
            decorationColor: '#1d4d4f',
            pageNumberPosition: 'footer-right',
            pageNumberStyle: 'simple',
            headerRule: true,
            footerRule: false,
            headerRuleColor: '#1d4d4f',
            theme: 'light-academic-2',
        },
        cssText: `
#content h1 {
  font-size: 21pt;
  margin-bottom: 4mm;
}

#content h2 {
  font-size: 13.5pt;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #1d4d4f;
  margin-top: 7mm;
  margin-bottom: 2.5mm;
}

#content h3 {
  font-size: 11.25pt;
  color: #1d4d4f;
  margin-top: 5mm;
}

#content table {
  font-size: 9.75pt;
}

#content th {
  background: rgba(29, 77, 79, 0.08);
}

.mdpdf-el-abstract-block,
.mdpdf-el-figure-captioned,
.mdpdf-el-table-captioned,
.mdpdf-el-info-panel {
  border-radius: 1.5mm;
}

.mdpdf-el-figure-captioned__caption,
.mdpdf-el-table-captioned__caption {
  color: #355b5d;
}

#content .warning,
#content .info {
  border-radius: 2mm;
  padding: 3mm 4mm;
}
`,
    },
    'worksheet-basic': {
        settings: {
            pageSize: 'Letter',
            marginTop: 15,
            marginBottom: 15,
            marginLeft: 16,
            marginRight: 16,
            fontPreset: 'inter',
            fontSize: 10.75,
            lineHeight: 1.4,
            decorationColor: '#4b5563',
            pageNumberPosition: 'footer-right',
            pageNumberStyle: 'simple',
            headerRule: false,
            footerRule: false,
            theme: 'light-academic-2',
        },
        cssText: `
#content h1 {
  font-size: 18pt;
  margin-bottom: 3mm;
}

.mdpdf-el-question-open__response {
  background: rgba(0, 0, 0, 0.01);
  min-height: 24mm;
}

.mdpdf-el-rubric-block,
.mdpdf-el-question-multi-part {
  border-radius: 1.5mm;
}
`,
    },
};