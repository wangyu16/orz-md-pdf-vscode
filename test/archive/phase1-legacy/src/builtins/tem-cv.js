'use strict';

module.exports = {
    'cv-professional': {
        settings: {
            pageSize: 'Letter',
            marginTop: 15,
            marginBottom: 15,
            marginLeft: 16,
            marginRight: 16,
            fontPreset: 'ibm-plex-sans',
            fontSize: 10.5,
            lineHeight: 1.35,
            decorationColor: '#1f2933',
            pageNumberPosition: 'none',
            headerRule: false,
            footerRule: false,
            theme: 'light-academic-2',
        },
        cssText: `
#content h1,
#content h2,
#content h3 {
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.mdpdf-el-cv-header {
  border-bottom: 2px solid #1f2933;
  padding-bottom: 4.5mm;
}

.mdpdf-el-cv-header__name {
  letter-spacing: 0.02em;
}

.mdpdf-el-cv-item-2col,
.mdpdf-el-cv-item-3col {
  margin-bottom: 3.5mm;
}

.mdpdf-el-cv-item-2col__header,
.mdpdf-el-cv-item-3col__header {
  font-size: 10pt;
}

.mdpdf-el-cv-item-2col__right,
.mdpdf-el-cv-item-3col__right {
  color: #52606d;
}
`,
    },
    'cv-modern': {
        settings: {
            pageSize: 'Letter',
            marginTop: 14,
            marginBottom: 14,
            marginLeft: 15,
            marginRight: 15,
            fontPreset: 'ibm-plex-sans',
            fontSize: 10.5,
            lineHeight: 1.35,
            decorationColor: '#0f766e',
            pageNumberPosition: 'none',
            headerRule: false,
            footerRule: false,
            theme: 'light-academic-2',
        },
        cssText: `
.mdpdf-el-cv-header {
  border-bottom: none;
  border-left: 3mm solid #0f766e;
  padding: 2mm 0 2mm 5mm;
}

.mdpdf-el-cv-header__name {
  color: #0f766e;
}

.mdpdf-el-cv-item-2col,
.mdpdf-el-cv-item-3col {
  padding-left: 3mm;
  border-left: 1px solid rgba(15, 118, 110, 0.25);
}
`,
    },
};