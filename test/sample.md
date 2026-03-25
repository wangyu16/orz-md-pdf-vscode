{{nyml
kind: document
font_preset: inter
header_left: Sample Document
header_center: test
header_right: Phase I
header_rule: true
header_rule_color: #6f7d8c
header_font_size: 8.5
footer_left: test
footer_center: test
footer_rule: true
footer_rule_color: #6f7d8c
footer_font_size: 8.5
page_number_position: footer-right
page_number_style: page-n-of-N
page_number_start_page: 2
pre_body_hide_header: true
pre_body_hide_footer: true
limit_image_to_page: true
keep_image_together: true
repeat_table_header: true
avoid_table_row_breaks: true
}}

{{nyml
kind: define-element
name: title-page
fields: |
    title:text
    subtitle:text
    author:text
    affiliation:text
    date:text
html: |
    <section class="mdpdf-title-page mdpdf-title-page--pagebreak-after" style="--mdpdf-title-align: left; --mdpdf-title-justify: flex-start; --mdpdf-title-width: 150mm; padding-top: 30mm; padding-bottom: 18mm;">
        <div class="mdpdf-title-page__inner" style="--mdpdf-title-size: 26pt; --mdpdf-subtitle-size: 15pt; --mdpdf-meta-size: 11pt; --mdpdf-title-gap: 10pt; --mdpdf-subtitle-gap: 16pt; --mdpdf-meta-gap: 6pt;">
            <h1 class="mdpdf-title-page__title">[title]</h1>
            <p class="mdpdf-title-page__subtitle">[subtitle]</p>
            <p class="mdpdf-title-page__author">[author]</p>
            <p class="mdpdf-title-page__affiliation">[affiliation]</p>
            <p class="mdpdf-title-page__date">[date]</p>
        </div>
    </section>
css: |
    .mdpdf-title-page {
        min-height: 240mm;
        display: flex;
        align-items: stretch;
        justify-content: var(--mdpdf-title-justify, center);
        text-align: var(--mdpdf-title-align, center);
        break-inside: avoid;
        page-break-inside: avoid;
    }
    .mdpdf-title-page--pagebreak-after {
        break-after: page;
        page-break-after: always;
    }
    .mdpdf-title-page__inner {
        width: 100%;
        max-width: var(--mdpdf-title-width, 140mm);
        margin: 0 auto;
        font-size: var(--mdpdf-meta-size, inherit);
    }
    .mdpdf-title-page__title {
        font-size: var(--mdpdf-title-size, 24pt);
        line-height: 1.2;
        margin: 0 0 var(--mdpdf-title-gap, 12pt);
    }
    .mdpdf-title-page__subtitle {
        font-size: var(--mdpdf-subtitle-size, 14pt);
        margin: 0 0 var(--mdpdf-subtitle-gap, 18pt);
    }
    .mdpdf-title-page__author,
    .mdpdf-title-page__affiliation,
    .mdpdf-title-page__date {
        font-size: var(--mdpdf-meta-size, 11pt);
        margin: 0 0 var(--mdpdf-meta-gap, 8pt);
    }
}}

{{nyml
kind: element
name: title-page
placement: pre-body
pagebreak_after: true
title: Sample Document
subtitle: Phase I pipeline feature exercise
author: Test User
affiliation: orz-md-pdf-vscode
date: 2026-03-18
}}

{{nyml
kind: define-element
name: highlight-card
fields: |
    label:text
    title:text
    note:markdown
    accent:color
    pad:length
html: |
    <section class="mdpdf-el-highlight-card" style="--mdpdf-highlight-accent: [accent]; --mdpdf-highlight-pad: [pad];">
        <p class="mdpdf-el-highlight-card__label">[label]</p>
        <h3 class="mdpdf-el-highlight-card__title">[title]</h3>
        <div class="mdpdf-el-highlight-card__note">[note]</div>
    </section>
css: |
    .mdpdf-el-highlight-card {
        margin: 6mm 0 8mm;
        padding: var(--mdpdf-highlight-pad, 6mm);
        border-left: 3mm solid var(--mdpdf-highlight-accent, #1f5aa6);
        background: #f4f1e8;
    }
    .mdpdf-el-highlight-card__label {
        margin: 0 0 2mm;
        font-size: 9pt;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }
    .mdpdf-el-highlight-card__title {
        margin: 0 0 2mm;
        font-size: 16pt;
    }
    .mdpdf-el-highlight-card__note {
        margin: 0;
    }
}}

# Sample Document

Above h1 title is added on purpose to show the duplication. For a casual document, a title page or title section is not needed. You can use plain markdown to add a h1 line to show the title.

## Introduction

This is a sample markdown document used to test the **orz-md-pdf-vscode** pipeline.

It tests:
- Markdown parsing via `@orz-how/markdown-parser`
- paged.js pagination and `@page` layout
- Puppeteer headless PDF generation
- `pdf-lib` embedding and extraction

{{nyml
kind: element
name: highlight-card
label: Custom Element
title: Generic NYML components now render in body flow
note: |
    This block is generated from a define-element template with **markdown-rendered content**.

    It can also include regular Markdown lists:
    - first item
    - second item
accent: #1f5aa6
pad: 7mm
}}

Quick plugin check: {{emoji rocket}} {{em tada}} {{span[success] ready}} {{sp[warning] review}} aligned{{space 2}}text.

Math inline: $E = mc^2$ and block:

$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$

Chemistry inline: $\ce{2H2 + O2 -> 2H2O}$.

Body text with a footnote.[^sample-note]

{{toc 2,3}}

---

## Formatted Text


::: left
A container flow to the left, wrapped by other text. Can be used to add figures to the side. 
:::

Text can be **bold**, *italic*, ==highlighted==, ~subscript~ H~2~O, and ^superscript^ x^2^.

A paragraph with a custom class attached.{{attrs[class="highlighted-paragraph"]}}

::: info
This is an informational callout rendered by the custom container plugin.
:::



::: center
Centered block content.
:::

::: spoil Click to reveal plugin content
Hidden markdown content with **bold text**, inline code `code`, and math $a^2+b^2=c^2$.
:::

:::: cols
::: col
**Column One** with {{sp[info] inline badge}}.
:::
::: col
**Column Two** with a short list:
- item A
- item B
:::
::::

:::: tabs
::: tab Python
```python
print("hello from tab")
```
:::
::: tab JavaScript
```javascript
console.log("hello from tab");
```
:::
::::

---

## Code Example

```python
def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("World"))
```

- [x] Completed task item
- [ ] Pending task item

| Column A | Column B | Column C |
|---|---|---|
| Cell 1 | Cell 2 | Cell 3 |
| Cell 4 | Cell 5 | Cell 6 |

![Sized image](https://placehold.co/320x180/png?text=Sample+Image =320x180)

## Embedded Plugins

QR code: {{qr https://example.com/docs/sample}}

{{youtube dQw4w9WgXcQ}}

{{mermaid
graph TD
    A[Markdown] --> B[HTML Fragment]
    B --> C[Paged Preview]
    C --> D[PDF]
}}

{{smiles C1=CC=CC=C1}}

### span[class] — Inline coloured / styled text

This sentence contains {{span[red] red text}}, {{span[blue] blue text}},
{{span[green] green text}}, and {{span[yellow] yellow text}}.

A span with **bold inside**: {{span[info] **important note**}}.

Alias `sp`: {{sp[warning] watch out}}.

### emoji — Unicode emoji from name

A smile: {{emoji smile}} and a rocket: {{emoji rocket}}.

Party time: {{em tada}} (alias `em`).

If the name doesn't exist: {{emoji nonexistent_xyz}} (stays literal).

### space — Inline horizontal whitespace

Column A:{{space 2}}Column B:{{space 4}}Column C.

{{nyml
kind: vspace
height: 6mm
}}

---

## Page Break Test

This paragraph is before the page break.

{{nyml
kind: pagebreak
number: 2
}}

This paragraph begins on a new page with an empty page in front since the number of pagebreak is 2. The pipeline correctly splits content across physical A4 pages using paged.js's `break-before: page` rule.

---

## End

This document tests the complete pipeline. If you can see this page in the browser preview and in the generated PDF with consistent page layout, the pipeline is working correctly.

[^sample-note]: This is a rendered footnote generated by `markdown-it-footnote`.
