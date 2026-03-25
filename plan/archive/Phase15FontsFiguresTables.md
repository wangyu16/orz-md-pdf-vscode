# Phase 1.5 — Fonts, Figures, and Table Pagination

## Purpose

Phase 1.5 adds a narrow but high-value feature set on top of the current Phase I pipeline:

- bundled font presets based on a curated subset of Google Fonts
- safer default figure and image behavior for paged output
- stable natural table pagination at row boundaries

This phase is intentionally conservative. The goal is to improve document quality and authoring predictability without introducing a complex float engine or fragile page-breaking rules.

## Scope

This phase includes:

- a few pre-selected font presets that users can choose from
- local vendoring of those fonts so preview and PDF rendering stay reproducible
- global image rules that keep images inside the printable area when possible
- default behavior to avoid splitting images across pages when they fit on one page
- natural table pagination between rows
- repeated table headers across page breaks when the browser engine supports it stably

This phase does not include:

- arbitrary remote Google Fonts URLs
- automatic LaTeX-style float optimization
- explicit pagebreak directives inside a markdown table
- arbitrary float placement heuristics for normal body content

## Product Decisions

### 1. Font support

Support a curated set of bundled font presets rather than arbitrary font URLs.

Recommended initial presets:

- `times-like` — existing default serif fallback
- `inter` — clean sans-serif
- `source-serif-4` — readable serif for reports and articles
- `ibm-plex-sans` — neutral technical sans-serif

Rules:

- Font assets must be available locally during preview and PDF generation.
- The generated HTML used for preview and Puppeteer should not depend on `fonts.googleapis.com` or `fonts.gstatic.com`.
- The future `.md.pdf` embedding path should treat font files as bundled assets, not external dependencies.

### 2. Figures and images

Phase 1.5 will not attempt LaTeX-style backward float optimization.

Instead, the pipeline should:

- constrain image width to the content box width
- constrain image height to the printable content height when possible
- avoid splitting an image block across pages if it can fit on a single page
- keep standalone image paragraphs together

If an image is taller than the printable area, the fallback policy is:

1. scale down to fit within printable bounds if possible
2. otherwise allow overflow only as a last-resort engine limitation and emit a warning in future validation work

### 3. Tables

Phase 1.5 supports natural pagination between rows.

Rules:

- explicit pagebreak directives inside markdown tables are not supported
- table headers should repeat across pages when technically stable
- row boundary pagination is sufficient for this phase
- rows should avoid splitting across pages when possible

If a user needs a forced break, the correct recommendation is to split one logical table into two physical tables.

## AI Agent Guidance

The future AI agent should:

- prefer bundled font preset names, not ad-hoc font families
- recommend serif presets for articles and reports, sans-serif presets for technical notes and slides
- treat standalone images as block elements that should remain intact
- avoid promising LaTeX-like float behavior
- recommend splitting oversized tables into multiple tables when a manual break is desired

The future AI agent should not:

- generate remote Google Fonts URLs
- claim that body text will automatically move backward around a bumped full-width figure
- place essential content in constructs that require interactive reflow to read correctly
- insert pagebreak markers inside markdown table syntax

## Implementation Plan

### A. Bundled font presets

1. Add a small vendored font set through npm packages.
2. Create a helper that inlines selected `@font-face` rules and font binaries into the generated HTML.
3. Add a `fontPreset` layer in `template.js` that maps stable preset names to font-family stacks.
4. Keep the current fallback serif stack as the default when no preset is selected.

### B. Global image rules

1. Compute printable page dimensions from the selected page size and margins where possible.
2. Apply global `max-width` and `max-height` rules for images.
3. Mark standalone image blocks as `break-inside: avoid`.
4. Keep image rendering compatible with existing markdown-it image sizing.

### C. Table pagination rules

1. Add CSS to encourage header repetition.
2. Add CSS to avoid splitting rows when possible.
3. Preserve natural row-boundary pagination.
4. Do not add explicit intra-table pagebreak directives in this phase.

## Acceptance Criteria

Phase 1.5 is complete when:

- users can select one of several bundled font presets
- preview and PDF use the same local font assets
- ordinary standalone images do not split across pages when they fit
- images are constrained to the printable box by default
- long tables break naturally between rows
- repeated table headers are present when the engine supports them
- the new behavior is documented clearly enough for future AI-assisted authoring

## Risks

### Font size growth

Bundling fonts increases HTML and PDF generation payload size.

Mitigation:

- keep the preset list small
- inline only the needed weights and styles

### Oversized images

Some images will still exceed a page even with global constraints.

Mitigation:

- scale to printable bounds by default
- add future validation warnings for pathological cases

### Table engine limitations

Browser table pagination behavior is not as controllable as TeX.

Mitigation:

- support only natural row-boundary breaks in Phase 1.5
- avoid promising explicit intra-table break placement