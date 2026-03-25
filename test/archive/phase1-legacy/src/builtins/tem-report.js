'use strict';

module.exports = {
    'report-formal': {
        settings: {
            pageSize: 'Letter',
            marginTop: 17,
            marginBottom: 18,
            marginLeft: 18,
            marginRight: 18,
            fontPreset: 'ibm-plex-sans',
            fontSize: 11,
            lineHeight: 1.45,
            decorationColor: '#1f3a5b',
            pageNumberPosition: 'footer-right',
            pageNumberStyle: 'page-n',
            headerRule: true,
            footerRule: false,
            headerRuleColor: '#1f3a5b',
            theme: 'light-academic-2',
        },
        cssText: `
#content h1 {
  font-size: 22pt;
  margin-bottom: 4mm;
}

#content h2 {
  font-size: 14pt;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #1f3a5b;
  margin-top: 8mm;
}

.mdpdf-el-decision-box {
  border-left-width: 2.5mm;
  border-radius: 1.5mm;
}

.mdpdf-el-decision-box__status {
  color: #1f3a5b;
  font-weight: 700;
}

.mdpdf-el-risk-box {
  border-left-width: 2.5mm;
  border-radius: 1.5mm;
}

.mdpdf-el-risk-box__level {
  color: #8b4e13;
  font-weight: 700;
}
`,
    },
    'report-brief': {
        settings: {
            pageSize: 'Letter',
            marginTop: 16,
            marginBottom: 17,
            marginLeft: 17,
            marginRight: 17,
            fontPreset: 'inter',
            fontSize: 10.75,
            lineHeight: 1.42,
            decorationColor: '#24577a',
            pageNumberPosition: 'footer-right',
            pageNumberStyle: 'simple',
            headerRule: false,
            footerRule: false,
            theme: 'light-academic-2',
        },
        cssText: `
#content h1 {
  font-size: 21pt;
  margin-bottom: 3.5mm;
  letter-spacing: 0.01em;
}

#content h2 {
  font-size: 13pt;
  color: #24577a;
  margin-top: 6mm;
  margin-bottom: 2.5mm;
}

.mdpdf-el-info-panel {
  border-color: rgba(36, 87, 122, 0.2);
  background: rgba(36, 87, 122, 0.06);
}

.mdpdf-el-info-panel__title {
  color: #24577a;
}

.mdpdf-el-decision-box,
.mdpdf-el-risk-box {
  border-radius: 2mm;
}
`,
    },
};