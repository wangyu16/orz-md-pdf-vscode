# Phase I Feature Expansion

## Purpose

This document clarifies how Phase I should expand beyond the current basic pipeline.

The primary audience is the future AI agent that will help users create `.md.pdf` documents. The goal is to keep the supported feature set clear, consistent, and safe enough that the AI agent can generate valid structures without introducing fragile layout behavior.

This document focuses on:

- what is allowed
- what is not allowed
- what each nyml block kind is responsible for
- how title pages and custom blocks should work
- what constraints the AI agent must respect

## Core Decisions

### 1. Separate global settings from inline directives

Use document-level configuration for global settings and ordered nyml entries for visible or flow-sensitive directives.

- Global settings belong in `kind: document`.
- Ordered flow directives belong in `kind: element`, `kind: pagebreak`, and `kind: vspace`.
- Custom component definitions belong in `kind: define-element`.

### 2. Headers and footers are text only in Phase I

Headers and footers must be plain text only.

Allowed:

- plain text
- page number counters

Not allowed in header/footer content in Phase I:

- markdown formatting
- KaTeX math
- chemistry syntax
- HTML
- Mermaid
- images

Reason: the current implementation uses CSS margin boxes, which reliably support plain text and counters, but not rich rendered content.

### 3. Title sections use the same component system as other custom blocks

A title section is not a separate rendering engine. It is a custom component instance with a reserved placement mode.

This means:

- title pages should be defined using `kind: define-element`
- title page instances should be created using `kind: element`
- title-like blocks should usually use `placement: pre-body`
- title-like blocks may use `pagebreak_after: true`
- pages occupied by `placement: pre-body` content should be treated as front-matter pages for header/footer suppression
- `pre_body_hide_header` and `pre_body_hide_footer` should control that suppression independently and default to `true`

The key principle is simple: a customized element just claims some space on the final page, and its HTML template plus CSS decide how that space is used. Title sections follow exactly the same rule; they are only distinguished by being placed in `pre-body`.

### 4. Custom blocks are full template-driven components

Custom blocks should support:

- variables
- HTML template
- CSS
- markdown-capable content fields

They are not style-only blocks.

Each custom block definition should include:

- a unique name
- a field schema
- a single-root HTML template
- scoped CSS

## Main Design Principle

Use one unified nyml block family with a required `kind` field.

Recommended block kinds:

- `document`
- `define-element`
- `element`
- `pagebreak`
- `vspace`

This keeps the model simple for both implementation and AI-assisted authoring.

## Data Model

### `kind: document`

Purpose:

- define global page and typography settings
- define header/footer options
- define page numbering behavior
- define document-wide rendering mode flags
- define asset or theme options

Typical responsibilities:

- page size
- margins
- font preset
- font size
- line height
- theme
- header and footer text
- header and footer rule settings
- page number position and style
- page numbering start page
- rendering flags such as answer-key visibility

### `kind: define-element`

Purpose:

- define a reusable custom block type

Typical responsibilities:

- define the block name
- define allowed fields
- define the HTML structure
- define scoped CSS
- define which fields should be treated as markdown when rendered

### `kind: element`

Purpose:

- create one visible instance of a previously defined custom block

Typical responsibilities:

- choose which defined element to instantiate
- supply field values
- optionally specify placement behavior
- optionally request a page break after rendering

### `kind: pagebreak`

Purpose:

- force a page break at a specific location in document flow
- optionally emit multiple consecutive page breaks through `number`

### `kind: vspace`

Purpose:

- insert vertical white space in document flow

## Page Numbering Rule

Do not use a special boolean rule such as “skip first page number”.

Use this rule instead:

- `page_number_start_page: N`

The current pipeline implements this directly in the post-pagination runtime, so the counted total is also based on pages `N...end` rather than the full physical page count.

Meaning:

- physical pages before `N` show no page number
- physical page `N` displays page number `1`
- total counted pages start from physical page `N`

This rule works even if a title page or front matter spans more than one physical page.

Example:

- physical page 1: cover
- physical page 2: abstract
- physical page 3: main content starts

Then use:

```markdown
{{nyml
kind: document
page_number_start_page: 3
}}
```

Result:

- page 1: no page number
- page 2: no page number
- page 3: page 1

Legacy compatibility note:

- `first_page_skip_number: true` is still accepted as a fallback for older documents
- if `page_number_start_page` is present, it takes precedence
- new AI-authored documents should use `page_number_start_page`

## AI Agent Rules

The future AI agent should follow the rules in this section strictly.

### The AI agent should do

- Use `kind: document` for all global settings.
- Put the global `kind: document` block before all other visible content directives.
- Use `kind: define-element` to define reusable custom blocks.
- Use `kind: element` to create visible block instances.
- Use `kind: pagebreak` instead of raw HTML pagebreak hacks.
- Use `kind: vspace` instead of ad-hoc empty paragraphs or repeated `<br>` tags.
- Put cross-document rendering toggles such as `show_answer_key` in `kind: document`.
- Use `placement: pre-body` when the intent is a title page, cover page, or other front matter block that should appear before the main document body.
- Use `pagebreak_after: true` explicitly when a title-like block should end with a forced page break.
- Use `page_number_start_page` to control when numbering begins.
- Prefer standard Markdown for normal document content.
- Keep custom components focused on layout patterns that standard Markdown cannot express well.
- Prefer stacked sections, columns, or repeated headings over tabs in `.md.pdf` documents.


### The AI agent should not do

- Do not put markdown, math, HTML, or chemistry syntax into headers or footers.
- Do not use raw HTML like `<div class="pagebreak"></div>` when a nyml pagebreak directive is available.
- Do not use repeated empty paragraphs or repeated `<br>` tags to create vertical spacing.
- Do not assume the first visible block is automatically a title page.
- Do not infer page numbering behavior from component names.
- Do not use arbitrary local font names if the system is meant to stay self-contained.
- Do not define custom CSS that targets `html`, `body`, `.markdown-body`, `.pagedjs_*`, or `@page`.
- Do not use `@import` in custom CSS.
- Do not use external `url(...)` references in custom CSS.
- Do not use `position: fixed` in custom block CSS.
- Do not rely on viewport units such as `vh` or `vw` for print layout.
- Do not use percent-based heights for core layout behavior.
- Do not use page numbering booleans such as “skip first page” once `page_number_start_page` is introduced.
- Do not duplicate document-wide behavior flags across every repeated element instance.
- Do not recommend tabs for print-first documents; they are acceptable only as an optional preview enhancement and should not carry essential content that depends on interaction.
- YouTube video embedding is not recommended. 
- Do not mix YAML front matter with NYML document/title metadata in the normal Phase I authoring path.

## Custom Component Rules

Custom block definitions are powerful and therefore need constraints.

### Required structure

Each `define-element` block should contain:

- `name`
- `fields`
- `html`
- `css`

For the current parser, custom HTML templates should use `[field_name]` placeholders.

Do not place raw `{{field_name}}` markers directly inside a `{{nyml ...}}` block yet, because nested brace syntax collides with the markdown plugin delimiter.

### Required behavior

- The HTML template must have exactly one root element.
- The root element should use a stable class name such as `.mdpdf-el-NAME`.
- The CSS should only style that root element and its descendants.
- Variables should be inserted only through the declared field names.
- Prefer `[field_name]` placeholders in `html` templates for the current Phase I implementation.
- Field values are nyml strings, but `markdown`-typed fields should be rendered as markdown into the output rather than escaped as plain text.
- Keep `markdown`-typed fields within the safe markdown subset: emphasis, lists, links, tables, code, blockquotes, and KaTeX-style math are fine.
- Avoid nested raw `{{plugin ...}}` syntax inside NYML field values. It can collide with the outer NYML block delimiter before the markdown field is rendered.

### Recommended field types

At minimum, support field declarations such as:

- `text`
- `markdown`
- `color`
- `length`
- `enum`

The exact parser rules can be finalized during implementation, but the AI agent should write field schemas in a structured and predictable form.

## Dynamic Rendering Rules

Future dynamic rendering switches should be modeled as document settings, not as repeated per-element switches.

Recommended pattern:

- define the toggle in `kind: document`
- use a boolean and explicit key such as `show_answer_key: true`
- keep each question element structurally complete regardless of the current mode
- let the renderer or built-in exam element decide whether answer-key markup is emitted

This keeps a single source document reusable for both student and instructor variants.

## Title Component Rules

Title sections should be implemented as ordinary custom components with special placement behavior.

Recommended conventions:

- use `placement: pre-body`
- use `pagebreak_after: true` when the next content should begin on a new page
- keep layout stable and print-oriented
- prefer vertical centering, controlled padding, and normal flow layout over fragile absolute positioning
- do not rely on `first_page_hide_header` or `first_page_hide_footer` as the main title-page mechanism when the real intent is to suppress header/footer on pre-body front matter

The AI agent should treat the title section as a front-matter component, not as a global setting block.

Recommended authoring order:

1. one global `kind: document` block
2. one `kind: define-element` block for the title component if needed
3. one `kind: element` block with `placement: pre-body` for the title section
4. normal Markdown body content

If the title is already present in the pre-body title element, the AI agent should not add another Markdown H1 for the same title.

If a duplicate Markdown H1 is still present, it will render as normal body content and should be removed by the author or future AI edit.

## Supported Global Settings

The following document-level settings should be supported in Phase I.

### Typography

- `font_preset`
- `font_family`
- `font_size`
- `line_height`
- `theme`

For self-contained output, prefer `font_preset` with bundled presets such as `system-serif`, `inter`, `source-serif-4`, and `ibm-plex-sans`.

`font_family` should be treated as an advanced fallback, not the normal AI-generated path.

### Page layout

- `page_size`
- `margin_top`
- `margin_bottom`
- `margin_left`
- `margin_right`

### Header and footer

- `header_left`
- `header_center`
- `header_right`
- `footer_left`
- `footer_center`
- `footer_right`
- `header_rule`
- `footer_rule`
- `header_rule_color`
- `footer_rule_color`
- `header_font_size`
- `footer_font_size`
- `pre_body_hide_header`
- `pre_body_hide_footer`

### Page numbering

- `page_number_position`
- `page_number_style`
- `page_number_start_page`

### Images and tables

- `limit_image_to_page`
- `keep_image_together`
- `repeat_table_header`
- `avoid_table_row_breaks`

Recommended defaults:

- `limit_image_to_page: true`
- `keep_image_together: true`
- `repeat_table_header: true`
- `avoid_table_row_breaks: true`

## Safe Length Rules

For Phase I, the AI agent should only generate these units for print layout values:

- `mm`
- `pt`
- `rem`
- `em`
- `lh`

Do not generate:

- `vh`
- `vw`
- `%` for height-driven layout
- `calc(...)`

## Asset Loading Guidance

The final `.md.pdf` output must be self-contained.

Therefore:

- common assets should be bundled through `template.js`
- Mermaid, SmilesDrawer, KaTeX CSS, and similar shared resources should not depend on uncontrolled external runtime sources
- bundled font presets should be stored and loaded locally rather than fetched from Google Fonts at render time
- custom block CSS and HTML should be embedded into the generated document model

The rendering sequence must respect print layout stability:

1. Parse markdown and nyml
2. Build the full document HTML
3. Render client-side assets such as Mermaid and Smiles
4. Wait for them to finish
5. Run paged.js layout
6. Generate PDF

## Canonical Examples

### Example 1: Global document settings

```markdown
{{nyml
kind: document
page_size: A4
margin_top: 20mm
margin_bottom: 20mm
margin_left: 20mm
margin_right: 20mm
font_preset: source-serif-4
font_size: 11pt
line_height: 1.6
theme: light-academic-2
header_left: Example Project
header_rule: true
header_rule_color: #6f7d8c
header_font_size: 8.5
header_right: Draft
footer_center:
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
```

### Example 2: Define a title-page component

```markdown
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
	<section class="mdpdf-el-title-page">
		<div class="mdpdf-el-title-page__inner">
			<h1>[title]</h1>
			<p class="subtitle">[subtitle]</p>
			<p class="author">[author]</p>
			<p class="affiliation">[affiliation]</p>
			<p class="date">[date]</p>
		</div>
	</section>
css: |
	.mdpdf-el-title-page {
		min-height: 240mm;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	.mdpdf-el-title-page__inner h1 {
		font-size: 24pt;
		margin-bottom: 12pt;
	}
	.mdpdf-el-title-page .subtitle {
		font-size: 14pt;
		margin-bottom: 18pt;
	}
}}
```

### Example 2b: Define a body component

```markdown
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
}}
```

```markdown
{{nyml
kind: element
name: highlight-card
label: Custom Element
title: Generic NYML components now render in body flow
note: |
	This block is generated from a define-element template with **markdown** output.
	
	- first point
	- second point
accent: #1f5aa6
pad: 7mm
}}
```

### Example 3: Use the title-page component before the body

```markdown
{{nyml
kind: element
name: title-page
placement: pre-body
pagebreak_after: true
title: A Self-Contained Markdown to PDF Workflow
subtitle: Phase I Feature Expansion
author: Alice Smith
affiliation: Example Lab
date: March 18, 2026
}}
```

### Example 4: Explicit page break

```markdown
{{nyml
kind: pagebreak
}}
```

This is the preferred Phase I authoring form. Raw HTML pagebreak markers should be treated as legacy fallback only.

If `number` is omitted, it defaults to `1`.

```markdown
{{nyml
kind: pagebreak
number: 2
}}
```

This emits two consecutive pagebreak markers, which creates one empty page between the surrounding content.

### Example 5: Vertical white space

```markdown
{{nyml
kind: vspace
height: 12mm
}}
```

`height` should use a print-safe length unit such as `mm`, `pt`, `rem`, `em`, or `lh`.

## Validation Warnings The Future System Should Preferably Emit

If practical, the implementation should warn when:

- a `define-element` block does not have a single root HTML element
- custom CSS contains forbidden selectors or directives
- a title-like `placement: pre-body` block unintentionally spans more than one page while also using `pagebreak_after: true`
- `page_number_start_page` is greater than the total physical page count
- a custom element instance references an undefined component name

## Summary

Phase I should adopt a unified nyml-driven model:

- one global document block for global settings
- one reusable component system for custom visible blocks
- one explicit page numbering rule based on physical page index
- one clear set of AI-agent guardrails to prevent invalid or fragile layouts

This approach keeps the implementation flexible while still giving the future AI agent precise rules that are easy to follow.
