# Fine Tune Implementation Plan

## Current Status

- Phase I pipeline is already working end-to-end for parse, preview, PDF conversion, and source embedding.
- NYML document settings already override pipeline defaults.
- `kind: define-element`, `kind: element`, `placement: pre-body`, `kind: pagebreak`, and `kind: vspace` are already implemented.
- The main remaining gaps from [FeatureFineTune.md](FeatureFineTune.md) are dynamic switches, project-specific templates, and a documented authoring specification.

## Implementation Priorities

1. Implement dynamic switch support in the shared NYML rendering path.
2. Create a project template system for PDF-oriented built-in styles.
3. Add built-in reusable element definitions for high-value document types.
4. Finalize the list of supported in-document settings and document them.
5. Write a README and AI-facing authoring guide after the behavior is stable.

## Dynamic Switch Plan

### Goal

Support one markdown source producing multiple output variants by keeping dynamic state in `kind: document` and conditional visibility in `kind: define-element` templates.

### Phase 1 Scope

- Add `dynamic_choices` to `kind: document`.
- Support `data-show-when="key=value"` in custom element HTML templates.
- Support `data-hide-when="key=value"` in custom element HTML templates.
- Remove unmatched nodes before pagination.
- Treat missing dynamic keys as non-matches.
- Keep `element` instances data-only.

### Example

```markdown
{{nyml
kind: document
dynamic_choices: |
	answer-key: hide
	audience: student
}}

{{nyml
kind: define-element
name: question-mcq
fields: |
	prompt:markdown
	choices:markdown
	answer:markdown
	explanation:markdown
html: |
	<section class="mdpdf-el-question-mcq">
		<div class="mdpdf-el-question-mcq__prompt">[prompt]</div>
		<div class="mdpdf-el-question-mcq__choices">[choices]</div>
		<div class="mdpdf-el-question-mcq__answer" data-show-when="answer-key=show">[answer]</div>
		<div class="mdpdf-el-question-mcq__explanation" data-show-when="audience=instructor">[explanation]</div>
	</section>
css: |
	.mdpdf-el-question-mcq__answer,
	.mdpdf-el-question-mcq__explanation {
		margin-top: 4mm;
	}
}}
```

### Implementation Notes

- Parse `dynamic_choices` as a normalized key/value map at the document level.
- Apply placeholder substitution first, then markdown field rendering, then conditional filtering.
- Remove `data-show-when` and `data-hide-when` attributes from the final emitted HTML.
- Limit the first version to a single equality check per node.
- Do not add boolean expressions or per-element dynamic logic in this phase.

## Template System Plan

### Goal

Create PDF-specific built-in templates instead of using parser themes directly as the public API.

### Proposed Templates

- academic
- casual
- playful
- report
- exam
- cv

### Merge Order

1. Pipeline defaults
2. Built-in template defaults
3. `kind: document` overrides
4. Explicit runtime overrides

## Built-in Template And Element Backlog

Use orz-markdown built-in features first. Only create a special built-in element when the parser's existing Markdown, containers, columns, spans, TOC, Mermaid, QR, or other bundled features are not enough for a good print-first result.

### Priority 1: First built-in release

#### Templates

- [x] `academic-paper`
- [x] `exam-classic`
- [x] `cv-professional`
- [x] `report-formal`
- [x] `notes-clean`

#### Reusable built-in elements

- [x] `question-choice` — generic multiple-choice or fixed-choice exam question with built-in answer-key and instructor visibility.
- [x] `question-open` — generic open-answer question for short answer, long answer, proof, and code response use cases.
- [x] `score-box` — compact score or marks display that can pair with question elements.
- [x] `solution-block` — built-in answer or instructor note block driven by dynamic switch.
- [x] `cv-item-2col` — generic two-column CV row so users can freely name left and right content.
- [x] `cv-item-3col` — generic three-column CV row for title, organization, date/location style layouts.
- [x] `cv-header` — name and contact block for CV templates.
- [x] `abstract-block` — academic front-matter summary block.
- [x] `decision-box` — report callout for decisions and conclusions.
- [x] `risk-box` — report callout for risks and mitigations.

### Priority 2: Expand common document coverage

#### Templates

- [x] `academic-thesis`
- [x] `exam-compact`
- [x] `cv-modern`
- [x] `report-brief`
- [x] `handout-classroom`
- [x] `worksheet-basic`

#### Reusable built-in elements

- [x] `title-page-academic`
- [x] `title-page-report`
- [x] `executive-summary-block`
- [x] `question-multi-part`
- [x] `rubric-block`
- [x] `report-cover`
- [x] `info-panel`
- [x] `milestone-item`
- [x] `figure-captioned`
- [x] `table-captioned`

### Priority 3: Long-form and specialized styles

#### Templates

- [x] `book-classic`
- [x] `book-technical`
- [x] `lab-report`
- [x] `personal-note-handwritten`
- [x] `personal-note-casual`

#### Reusable built-in elements

- [x] `chapter-opening`
- [x] `part-opening`
- [x] `sidebar-note`
- [x] `example-block`
- [x] `instruction-step`
- [x] `response-area`
- [x] `materials-list`
- [x] `safety-note`

### Simplification rules from planning

- Prefer generic exam elements over many narrow variants. A single `question-open` should cover short answer, long answer, proof, and code response patterns with style or field differences.
- Prefer generic CV layout rows over too many named content-specific entries. `cv-item-2col` and `cv-item-3col` are the base abstractions.
- Keep dynamic switch focused on real repeated needs such as `answer-key`, `audience`, and `version`. Do not add unnecessary dimensions like `solution-detail` unless a strong use case appears.
- For utility blocks already covered well by orz-markdown built-ins, prefer documentation and template styling over new special elements.

### Implemented foundation

- [x] Shared dynamic switch engine in `document-settings.js`
- [x] Built-in element registry hook in `document-settings.js`
- [x] First built-in elements: `question-choice`, `question-open`, `score-box`, `solution-block`, `cv-header`, `cv-item-2col`, `cv-item-3col`

## Documentation Deliverables

- Supported `kind` blocks
- Supported document-level settings
- Allowed field schema types
- Dynamic switch authoring rules
- Template selection rules
- Safe CSS constraints for custom elements
- README authoring guide drafted

## Immediate Next Steps

1. Add one more comparison sample if a second document family would clarify the tradeoff between plain Markdown and built-ins.
2. Add more specialized elements only when repeated real document patterns justify them.
3. Review whether any built-in template defaults should expose new document-level settings before starting a new priority batch.
4. Consider grouping the current sample corpus by authoring pattern in the README once it grows further.

### Implemented templates

- [x] `academic-paper` — letter-sized academic article styling with a built-in abstract block.
- [x] `academic-thesis` — long-form academic styling with front-matter support and delayed page numbering.
- [x] `book-classic` — long-form reading layout tuned for chapter-based documents and plain Markdown structure.
- [x] `book-technical` — long-form manual styling for documents that mix prose, code, diagrams, and helper blocks.
- [x] `exam-compact` — denser quiz and worksheet styling for exam documents.
- [x] `cv-modern` — a more visual CV variant with stronger accent styling.
- [x] `exam-classic` — letter-sized, black-and-white exam styling tuned for built-in question elements.
- [x] `handout-classroom` — classroom handout styling that pairs well with standard Markdown and a small set of reusable exercise blocks.
- [x] `lab-report` — procedure-and-results styling for lab instructions, experiments, and observation-heavy assignments.
- [x] `notes-clean` — lightweight notes styling that mainly enhances standard Markdown and built-in parser containers.
- [x] `personal-note-handwritten` — a more playful handwritten-feel note template that still stays printable and stable.
- [x] `personal-note-casual` — warmer informal note styling for personal study notes and lightweight printouts.
- [x] `report-brief` — lighter report styling intended for short professional summaries and briefs.
- [x] `report-formal` — letter-sized professional report styling with a decision-oriented callout block.
- [x] `cv-professional` — letter-sized compact CV styling tuned for the header and CV row built-ins.
- [x] `worksheet-basic` — worksheet styling with simple answer-space and exercise layout defaults.