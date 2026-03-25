'use strict';

module.exports = {
    'academic-thesis': {
        settings: {
            pageSize: 'Letter',
            marginTop: 24,
            marginBottom: 22,
            marginLeft: 24,
            marginRight: 22,
            fontPreset: 'source-serif-4',
            fontSize: 11.5,
            lineHeight: 1.6,
            decorationColor: '#222831',
            pageNumberPosition: 'footer-right',
            pageNumberStyle: 'simple',
            pageNumberStartPage: 2,
            preBodyHideHeader: true,
            preBodyHideFooter: true,
            headerRule: false,
            footerRule: false,
            theme: 'light-academic-2',
        },
        cssText: `
#content h1 {
  font-size: 22pt;
  text-align: center;
  margin-bottom: 5mm;
}

#content h2 {
  font-size: 15pt;
  margin-top: 9mm;
  margin-bottom: 3mm;
}

#content h3 {
  font-size: 12pt;
  margin-top: 6mm;
}

.mdpdf-title-page--academic .mdpdf-title-page__title {
  font-size: 28pt;
}

.mdpdf-pre-body .mdpdf-title-page.mdpdf-title-page--academic {
  align-items: flex-start;
}

.mdpdf-pre-body .mdpdf-title-page.mdpdf-title-page--academic .mdpdf-title-page__inner {
  padding-top: 20mm;
}

.mdpdf-el-abstract-block {
  max-width: 145mm;
  margin-left: auto;
  margin-right: auto;
}
`,
    },
    'academic-paper': {
        settings: {
            pageSize: 'Letter',
            marginTop: 19,
            marginBottom: 19,
            marginLeft: 20,
            marginRight: 20,
            fontPreset: 'source-serif-4',
            fontSize: 11.5,
            lineHeight: 1.55,
            decorationColor: '#20262e',
            pageNumberPosition: 'footer-center',
            pageNumberStyle: 'simple',
            headerRule: false,
            footerRule: false,
            theme: 'light-academic-2',
        },
        cssText: `
#content h1 {
  font-size: 20pt;
  text-align: center;
  margin-bottom: 5mm;
}

#content h2 {
  font-size: 14pt;
  margin-top: 8mm;
  margin-bottom: 3mm;
}

.mdpdf-el-abstract-block {
  max-width: 150mm;
  margin-left: auto;
  margin-right: auto;
  border-radius: 1.5mm;
}

.mdpdf-el-abstract-block__title {
  text-align: center;
}

.mdpdf-el-author-affiliation {
  margin-top: -1mm;
  margin-bottom: 8mm;
}
`,
    },
};