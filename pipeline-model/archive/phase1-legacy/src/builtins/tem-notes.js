'use strict';

module.exports = {
    'notes-clean': {
        settings: {
            pageSize: 'Letter',
            marginTop: 17,
            marginBottom: 17,
            marginLeft: 17,
            marginRight: 17,
            fontPreset: 'inter',
            fontSize: 11,
            lineHeight: 1.5,
            decorationColor: '#243b53',
            pageNumberPosition: 'none',
            headerRule: false,
            footerRule: false,
            theme: 'light-academic-2',
        },
        cssText: `
#content h1 {
  font-size: 20pt;
  margin-bottom: 4mm;
}

#content h2 {
  font-size: 13pt;
  margin-top: 7mm;
  margin-bottom: 2.5mm;
  color: #243b53;
}

#content blockquote {
  border-left: 1.5mm solid #9fb3c8;
  padding-left: 4mm;
  color: #486581;
}

#content hr {
  border: none;
  border-top: 1px solid rgba(36, 59, 83, 0.18);
  margin: 5mm 0;
}

#content .info,
#content .warning,
#content .success,
#content .danger {
  border-radius: 2mm;
  padding: 3mm 4mm;
  margin: 4mm 0;
}

#content .info {
  background: rgba(36, 59, 83, 0.06);
}

#content .warning {
  background: rgba(161, 92, 23, 0.08);
}

#content .success {
  background: rgba(47, 111, 68, 0.08);
}

#content .danger {
  background: rgba(146, 43, 33, 0.08);
}

#content ul.task-list {
  padding-left: 0;
}
`,
    },
    'personal-note-casual': {
        settings: {
            pageSize: 'Letter',
            marginTop: 16,
            marginBottom: 16,
            marginLeft: 18,
            marginRight: 18,
            fontPreset: 'inter',
            fontSize: 11,
            lineHeight: 1.55,
            decorationColor: '#d97706',
            pageNumberPosition: 'none',
            headerRule: false,
            footerRule: false,
            theme: 'light-academic-2',
        },
        cssText: `
#content {
  color: #3f3a34;
}

#content h1 {
  font-size: 22pt;
  color: #b45309;
  margin-bottom: 4mm;
}

#content h2 {
  font-size: 13.5pt;
  color: #92400e;
  margin-top: 7mm;
  margin-bottom: 2.5mm;
}

#content blockquote {
  border-left: 2mm solid rgba(217, 119, 6, 0.28);
  background: rgba(251, 191, 36, 0.08);
  padding: 3mm 4mm;
  border-radius: 0 2mm 2mm 0;
}

#content hr {
  border: none;
  border-top: 2px dashed rgba(217, 119, 6, 0.24);
  margin: 5mm 0;
}

#content .info,
#content .warning,
#content .success,
#content .danger {
  border-radius: 3mm;
  padding: 3mm 4mm;
}

#content ul.task-list {
  padding-left: 0;
}
`,
    },
    'personal-note-handwritten': {
        settings: {
            pageSize: 'Letter',
            marginTop: 16,
            marginBottom: 16,
            marginLeft: 18,
            marginRight: 18,
            fontPreset: 'inter',
            fontFamily: '"Comic Sans MS", "Segoe Print", "Bradley Hand", cursive',
            fontSize: 11,
            lineHeight: 1.6,
            decorationColor: '#c2410c',
            pageNumberPosition: 'none',
            headerRule: false,
            footerRule: false,
            theme: 'light-academic-2',
        },
        cssText: `
#content {
  color: #4b3621;
}

#content h1 {
  font-size: 23pt;
  color: #c2410c;
  margin-bottom: 4mm;
  transform: rotate(-1deg);
  transform-origin: left center;
}

#content h2 {
  font-size: 14pt;
  color: #9a3412;
  margin-top: 7mm;
  margin-bottom: 2.5mm;
}

#content blockquote {
  border-left: 2mm solid rgba(194, 65, 12, 0.24);
  background: rgba(251, 146, 60, 0.08);
  padding: 3mm 4mm;
  border-radius: 0 2mm 2mm 0;
}

#content hr {
  border: none;
  border-top: 2px dotted rgba(194, 65, 12, 0.3);
  margin: 5mm 0;
}

#content .info,
#content .warning,
#content .success,
#content .danger {
  border-radius: 4mm;
  padding: 3mm 4mm;
}
`,
    },
};