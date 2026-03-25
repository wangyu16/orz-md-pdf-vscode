# Pipeline Refine Plan

Goal: clean up the current Phase I implementation without breaking the working pipeline, and establish stable boundaries so later features do not turn settings, themes, templates, and built-in elements into one large coupled system.

## 1. Evaluation Of The Current Ideas

The main direction is correct. The project already wants four different concepts:

1. core document settings
2. parser/native element styling themes
3. built-in reusable elements
4. document templates

That separation is the right long-term model.

The current problem is not lack of features. The current problem is that these concepts are not yet treated as separate contracts. In the code today:

- document setting extraction, NYML transformation, built-in element registry, custom element registry, and placement rules are mixed in one module
- templates currently combine default settings and template CSS, but there is not yet a stronger type boundary between page layout, content theme, and built-in element styling
- theme loading still contains font assumptions and PDF compatibility overrides, so the theme layer is not purely about internal content appearance
- the template system can easily become a second styling system unless its responsibility is narrowed now

If this is not cleaned up early, future problems will be:

- override order becoming hard to reason about
- templates fighting themes
- element-specific styling leaking into document-wide page layout
- font handling becoming inconsistent and non-reproducible
- built-in element growth forcing repeated edits in central pipeline files

So the plan should not mainly be "move files around". It should define stable boundaries first, then reorganize code around those boundaries.

## 2. Architectural Principles

Use these rules consistently.

### 2.1 Separate content model from rendering bundles

The authoring model should expose clear user-facing concepts:

- document settings: page, typography, running header/footer, flow rules, switches
- theme: styling for standard Markdown and parser-native structures
- built-in element: stable reusable layout block with schema
- template: a curated preset that selects and overrides the above

### 2.2 Templates must compose, not define new primitives

A template may:

- choose default document settings
- choose a default theme
- choose default built-in element variants
- provide small template-scoped CSS adjustments

A template must not:

- define new element kinds
- redefine document setting semantics
- inject page-level logic separate from the core layout system

This is important. If templates are allowed to become mini frameworks, the project will become hard to maintain.

### 2.3 Themes should only style parser-native content

A theme should affect:

- headings
- paragraphs
- lists
- tables
- blockquotes
- code
- callouts, columns, tabs, Mermaid wrapper appearance, and other parser-native output

A theme should not decide:

- page size
- page margins
- header/footer placement
- document font preset
- page numbering behavior

That means theme selection changes internal content appearance, but not page mechanics.

### 2.4 Built-in elements should be schema-first

Every built-in element should have:

- a stable name
- a field schema
- a renderer or HTML template
- a CSS block
- optional variants
- optional placement rules

This keeps them predictable for both human authors and AI agents.

### 2.5 Fonts must be locally reproducible

Do not rely on live Google Fonts requests in final output.

Because the project requirement is self-contained output, the font plan should be:

- maintain a local font catalog
- inline or bundle font assets through local packages or vendored files
- keep a fallback chain for each preset
- treat font preset selection as part of document settings, not theme behavior
- do not support arbitrary user-provided web fonts as part of the standard contract

Google Fonts can still be the source of some font files, but runtime fetching from Google should not be part of the rendering contract.

## 3. Refined Concept Model

The project should be organized around five registries.

### 3.1 Document settings registry

Responsibility: define all supported document-level keys, types, defaults, validation, aliases, and merge behavior.

This should include the following groups.

#### Page geometry

- `page_size`
- `margin_top`
- `margin_bottom`
- `margin_left`
- `margin_right`
- optional future support for mirrored margins
- optional future support for bleed or crop marks only if genuinely needed later

#### Typography

- `font_preset`
- `font_family` as advanced override
- `font_size`
- `line_height`
- optional future support for paragraph spacing and heading scale tokens

#### Running content

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
- `page_number_position`
- `page_number_style`
- `page_number_start_page`
- `first_page_hide_header`
- `first_page_hide_footer`
- `first_page_skip_number`
- `pre_body_hide_header`
- `pre_body_hide_footer`

#### Content flow rules

- `limit_image_to_page`
- `keep_image_together`
- `repeat_table_header`
- `avoid_table_row_breaks`
- explicit page break blocks
- explicit vertical space blocks

#### Styling hooks

- `theme`
- `decoration_color`

#### Dynamic behavior

- `dynamic_choices`
- future switch-based show or hide features

#### Likely additions worth planning now

- `language` or `locale` for future date, numbering, and typographic conventions
- `text_direction` only if multilingual RTL support becomes a real requirement
- `base_spacing_scale` only if enough templates need proportional spacing control

Important rule: document settings registry should be the only place where setting keys, aliases, coercion, and validation are defined.

### 3.2 Font registry

Responsibility: define font presets as reusable assets independent from themes and templates.

Each font preset should describe:

- public name
- label
- font family stack
- local asset source
- inline CSS loader
- supported weight and style coverage
- notes for Latin or CJK suitability

Recommended distinction:

- serif presets
- sans presets
- mono presets
- handwriting or decorative presets
- CJK-safe presets

Do not put arbitrary font-family strings into themes unless the theme is only consuming document-level CSS variables supplied by the font registry.

### 3.3 Theme registry

Responsibility: style standard Markdown output and parser-native structures only.

Each theme entry should provide:

- metadata
- normalized CSS scoped to `.markdown-body` or `#content`
- optional theme tokens such as border radius, neutral surface, accent shade mapping
- PDF compatibility patch only if truly unavoidable

Important refinement: the current "theme extraction" should not just mean copying CSS files. It should mean normalizing them into a print-safe theme layer.

The extraction process should be:

1. remove layout wrapper assumptions such as max-width, centered screen card behavior, and viewport styling
2. remove document-level font ownership
3. keep only internal content appearance
4. move any required print-safety adjustments into a separate compatibility layer

Recommended theme contract:

- theme CSS may read CSS variables such as `--mdpdf-font-body`, `--mdpdf-font-heading`, `--mdpdf-decoration-color`
- theme CSS should avoid hard-coding document-wide font decisions where possible

### 3.4 Built-in element registry

Responsibility: define stable reusable print-oriented blocks.

Suggested organization by domain:

- `frontmatter`: title page, abstract, author affiliation, report cover
- `academic`: dissertation frontmatter variants, chapter openers, later theorem-like blocks if needed
- `exam`: question types, score boxes, solution blocks, rubric blocks
- `report`: executive summary, decision box, risk box, milestone item
- `learning`: example block, instruction step, response area, materials list, safety note
- `cv`: cv header, timeline entries, multi-column cv items

Each element definition should support:

- `fields`
- `render` or `htmlTemplate`
- `cssText`
- `variants`
- `placementPolicy`

Variants are important. In many cases the project does not need a new built-in element name. It only needs a style variant such as:

- `title-page-academic` with variant `thesis`
- `question-choice` with variant `compact`
- `cv-item` with variant `2col` or `3col`

This reduces name sprawl.

### 3.5 Template registry

Responsibility: define a curated starting point for a document class.

Each template should contain:

- metadata
- default document settings
- default theme
- optional default built-in element variants
- optional small template CSS patch
- optional recommended pre-body sequence

Templates should represent document intent, for example:

- academic report
- dissertation
- personal notes
- tutorial book
- exam
- CV

Templates should not introduce new logic unavailable elsewhere.

## 4. Merge And Override Rules

This needs to be explicit now, otherwise later customization will become unpredictable.

Recommended merge order:

1. hard-coded pipeline defaults
2. selected template defaults
3. selected theme default tokens if any
4. document NYML settings
5. runtime overrides from CLI or extension UI

For element rendering:

1. built-in element base definition
2. built-in element variant
3. template-selected default variant
4. element instance fields

For CSS order:

1. core base CSS
2. font preset CSS
3. theme CSS
4. built-in element CSS for used elements only
5. template CSS patch
6. explicit per-document custom element CSS

This order keeps page layout stable while still allowing content-level customization.

## 5. Proposed Project Structure

The exact folders can change, but the boundaries should look like this.

```text
pipeline-model/src/
	config/
		settings-schema.js
		settings-normalize.js
		merge-settings.js
	fonts/
		registry.js
		loaders.js
	themes/
		registry.js
		loader.js
		print-safe/
			*.css
	elements/
		registry.js
		render.js
		frontmatter/
		academic/
		exam/
		report/
		learning/
		cv/
	templates/
		registry.js
		academic.js
		book.js
		exam.js
		report.js
		notes.js
		cv.js
	nyml/
		extract.js
		blocks.js
		transform.js
	render/
		page-template.js
		header-footer.js
		content-flow.js
	parse.js
	preview-server.js
	convert.js
```

Most important change: split current `document-settings.js` into separate concerns.

That file is currently doing too much:

- settings parsing
- dynamic choices
- built-in element registry assembly
- custom element registry assembly
- NYML transformation
- pre-body extraction
- flow block rendering

That should become several smaller modules with explicit inputs and outputs.

## 6. Refined Scope For Each Layer

### 6.1 Core page system

Owns:

- `@page`
- margins
- page size
- header and footer generation
- page numbering
- first-page and pre-body hide rules
- image and table pagination behavior
- explicit pagebreak and vspace blocks

Should not own:

- document-type-specific aesthetics
- built-in element semantics

### 6.2 Theme system

Owns:

- Markdown and parser-native internal appearance
- callout, blockquote, code, table, heading styling
- diagram wrapper appearance if needed

Should not own:

- margins
- page numbering
- document font preset selection
- title page geometry

### 6.3 Built-in element system

Owns:

- reusable print layouts with schemas
- stable semantic names for AI-guided authoring
- element variants

Should not own:

- global page layout
- template choice

### 6.4 Template system

Owns:

- curated defaults
- recommended combinations
- minor template-level visual tuning

Should not own:

- parser behavior
- new settings keys
- new primitive layout features

## 7. Specific Recommendations On The Ideas In The Current Draft

### 7.1 Core settings

Keep this part, but narrow it to true document-level settings only.

Add these clarifications:

- treat pagebreak and vspace as flow primitives, not built-in elements
- treat title sections as built-in elements placed in `pre_body`, not as a separate special system
- keep header and footer content plain text only unless paged margin-box reliability materially improves later
- reserve `font_family` as an escape hatch, while `font_preset` remains the normal path

### 7.2 Themes extracted from parser themes

Keep this part, but formalize the rule:

- extract only internal content styling
- move screen wrapper and PDF repair rules elsewhere
- avoid theme-specific font ownership where possible

### 7.3 Built-in elements

Keep this part and expand it, but define element families and variants early.

Do not let built-ins become a flat list of unrelated names forever.

### 7.4 Templates

Keep this part exactly in spirit, but enforce that templates are bundles of defaults, not a second element-definition mechanism.

This will avoid a major future maintenance problem.

## 8. Font Strategy

The desired font list is reasonable, but it should be split into three classes.

### Class A: fully supported bundled presets

These are fonts you package locally and can guarantee in preview and PDF.

Requested families normalized into Tier A bundled presets:

- `Noto Serif`
- `Noto Sans`
- `Roboto`
- `Raleway`  ← normalize earlier `Relaway`
- `Lora`  ← normalize earlier `Lori`
- `Crimson Pro`  ← for the earlier `Crimson` request
- `Courier Prime`  ← used as the bundled `Courier`-style preset
- `Comic Neue`
- `Neucha`
- `Noto Serif SC`
- `Noto Sans SC`
- `Noto Serif TC`
- `Noto Sans TC`

### Class B: optional locally installed fonts

These may be available on some systems but are not guaranteed. They should never be the default for templates that promise consistent output.

For this project, replace the earlier "optional system font" idea with locally bundled Tier B presets that are still curated rather than arbitrary:

- `LXGW WenKai TC`
- `Ma Shan Zheng`

### Class C: future candidates

These stay out of the public contract until you have a packaging path.

Recommended rule: only Class A presets appear in template defaults.

Allowed font selection policy:

- support only curated Tier A and Tier B presets from the local registry
- do not add arbitrary user-provided web-font URLs to documents or templates

For CJK support, prioritize a small number of reliable families rather than a long aspirational list.

## 9. Validation And Safety Rules

To avoid later instability, define these now.

### 9.1 Settings validation

- unknown document keys should be ignored with warning, not silently merged into runtime state
- invalid lengths, colors, enums, and booleans should fail safely
- aliases should normalize into one canonical internal key set

### 9.2 Theme validation

- no `@page`
- no `html` or `body` layout ownership except a controlled compatibility layer
- no remote imports in final packaged CSS

### 9.3 Custom element validation

- keep blocking `@import`, `@page`, fixed-position page overlays, and global wrapper selectors
- keep field schemas typed
- keep markdown rendering opt-in by field type

### 9.4 Template validation

- template references must point only to valid theme names, font presets, settings keys, built-in variants, and allowed CSS patches

## 10. Migration Plan

Refactor in this order so the pipeline stays working.

### Phase A: lock the contracts

- define the registries and merge order on paper first
- define canonical setting names and aliases
- define what counts as a theme, built-in element, and template

### Phase B: split the central module

- extract settings schema and normalization from the current `document-settings.js`
- extract NYML block extraction and transformation
- extract built-in element registry creation
- keep behavior unchanged while moving code

### Phase C: normalize themes

- turn current theme files into print-safe theme assets
- separate theme CSS from compatibility CSS
- move font ownership out of themes where practical

### Phase D: normalize built-in elements

- group elements by domain
- add optional variant support
- identify duplicated layouts that should be variants instead of separate names

### Phase E: normalize templates

- make each template reference explicit defaults rather than embedding mixed concerns
- add metadata so templates are inspectable by UI or AI later

### Phase F: documentation for authoring

- publish a compact authoring contract for AI agents and users
- document what belongs in standard Markdown, built-ins, and custom elements

## 11. Non-Goals For This Refactor

Do not mix these into the reorganization unless they become blocking.

- major new document features unrelated to structure cleanup
- complex interactive screen-only behaviors
- full bidirectional or RTL support before the core architecture is stable
- arbitrary remote asset loading as part of standard rendering

## 12. Final Recommended Direction

The refined direction is:

- keep the four-layer product model: core settings, themes, built-ins, templates
- add a separate font registry as a first-class concern
- split the current all-in-one NYML and settings module into smaller contract-driven modules
- define strict merge order now
- make themes content-only, templates composition-only, and built-ins schema-first

If this is done, later growth will remain manageable. If not, the project will keep working for a while, but every new template or element family will increase hidden coupling.

## 13. Execution Plan

Implementation should proceed as a controlled rebuild, not as piecemeal cleanup inside the existing structure.

### 13.1 Stage 0: archive the current implementation

- move the current `pipeline-model/src` implementation into an archive area
- keep the archived code runnable for comparison and regression checking
- treat the archive as a reference implementation, not as the place where new work continues

Suggested archive target:

```text
pipeline-model/archive/phase1-legacy/
	src/
	notes.md
```

### 13.2 Stage 1: rebuild the core pipeline only

Rebuild a minimal but systematic pipeline in the new `pipeline-model/src` tree.

Scope for this stage:

- parser wrapper
- document settings schema and normalization
- core page template and paged.js layout
- live preview server
- PDF conversion
- smoke-test sample files for core features only

Out of scope for this stage:

- built-in elements
- custom `define-element`
- document templates
- extracted parser themes

Acceptance for Stage 1:

- preview server runs from the new source tree
- a core sample document renders correctly in preview
- the same core sample converts to PDF
- core settings behave correctly without relying on legacy modules

### 13.3 Stage 2: rebuild the theme system

- create the new theme registry and loader
- trim and normalize archived theme CSS into print-safe theme assets
- add theme smoke tests using focused sample documents
- confirm that switching themes changes internal content appearance only, not page mechanics

Acceptance for Stage 2:

- theme selection works through the new registry
- no theme owns page size, margins, running headers or document font policy
- no remote imports remain in shipped theme CSS

### 13.4 Stage 3: rebuild the element system

- create the built-in element registry
- move archived elements into domain-based modules
- add field schema validation and optional variant support
- test each element family with focused sample documents

Acceptance for Stage 3:

- built-in elements render through the new registry and renderer path
- element CSS is loaded only when used
- element behavior no longer depends on a monolithic settings module

### 13.5 Stage 4: rebuild the template system

- create the template registry
- move archived templates into composition-only modules
- connect template defaults to settings, themes, and element variants
- test each template with one representative sample document

Acceptance for Stage 4:

- templates only provide defaults and small patches
- templates do not define new primitives or side-channel rendering logic
- override order remains deterministic

### 13.6 Stage 5: verification and transition

- compare new preview and conversion behavior against the archived pipeline where relevant
- keep a small matrix of smoke tests covering core, themes, elements, and templates
- update project documentation so the new structure becomes the canonical implementation

### 13.7 Immediate implementation order

The next concrete steps are:

1. archive the current `pipeline-model/src`
2. scaffold the new `pipeline-model/src` with only core modules
3. add a core-only sample markdown document
4. run the new preview server against the core sample
5. run PDF conversion for the same sample
6. only after the core path is stable, begin rebuilding themes

Preview policy for implementation work:

- use one canonical preview server entrypoint
- use one canonical default preview port from a shared config module
- avoid opening ad hoc verification ports during normal iteration