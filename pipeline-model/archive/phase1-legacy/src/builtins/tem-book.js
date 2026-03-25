'use strict';

module.exports = {
    'book-classic': {
        settings: {
            pageSize: 'Letter',
            marginTop: 21,
            marginBottom: 19,
            marginLeft: 23,
            marginRight: 21,
            fontPreset: 'source-serif-4',
            fontSize: 11.75,
            lineHeight: 1.68,
            decorationColor: '#6b4f3a',
            pageNumberPosition: 'footer-center',
            pageNumberStyle: 'simple',
            firstPageSkipNumber: true,
            headerRule: false,
            footerRule: false,
            theme: 'light-academic-2',
        },
        cssText: `
#content h1 {
  font-size: 24pt;
  text-align: center;
  margin-top: 16mm;
  margin-bottom: 8mm;
  page-break-before: always;
}

#content h1:first-child {
  page-break-before: auto;
  margin-top: 4mm;
}

#content h2 {
  font-size: 15pt;
  margin-top: 9mm;
  margin-bottom: 3mm;
}

#content p,
#content li {
  hyphens: auto;
}

#content blockquote {
  border-left: 1mm solid rgba(107, 79, 58, 0.35);
  padding-left: 4mm;
  color: #5f4b3b;
}

#content hr {
  border: none;
  border-top: 1px solid rgba(107, 79, 58, 0.2);
  margin: 6mm 0;
}
`,
    },
    'book-technical': {
        settings: {
            pageSize: 'Letter',
            marginTop: 18,
            marginBottom: 18,
            marginLeft: 20,
            marginRight: 18,
            fontPreset: 'ibm-plex-sans',
            fontSize: 10.75,
            lineHeight: 1.5,
            decorationColor: '#0f3d56',
            pageNumberPosition: 'footer-right',
            pageNumberStyle: 'simple',
            headerRule: true,
            headerRuleColor: '#0f3d56',
            footerRule: false,
            theme: 'light-academic-2',
        },
        cssText: `
#content h1 {
  font-size: 21pt;
  color: #0f3d56;
  margin-top: 10mm;
  margin-bottom: 5mm;
}

#content h2 {
  font-size: 14pt;
  color: #0f3d56;
  margin-top: 7mm;
  margin-bottom: 3mm;
}

#content h3 {
  font-size: 11.5pt;
  color: #20526c;
  margin-top: 5mm;
}

#content pre,
#content code {
  font-family: "IBM Plex Sans", "DejaVu Sans Mono", monospace;
}

#content pre {
  border: 1px solid rgba(15, 61, 86, 0.16);
  background: rgba(15, 61, 86, 0.035);
}

#content th {
  background: rgba(15, 61, 86, 0.06);
}

.mdpdf-el-chapter-opening,
.mdpdf-el-part-opening {
  color: #0f3d56;
}

.mdpdf-el-example-block,
.mdpdf-el-sidebar-note,
.mdpdf-el-materials-list {
  border-radius: 2mm;
}
`,
    },
};