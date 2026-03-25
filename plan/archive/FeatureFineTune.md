## Notes

- The orz-markdown parser has been updated. Install the most recent version to the pipeline. - 2026/03/20
- The pipeline can be used ont only for the '.md.pdf' vs code extension, but provide a generalized markdown source to output assembly method that can be used in many cases. Complete fine tuning the pipeline features and then create a READM.md file to explain how to use it. 
- Remaining tasks
	- Add the dynamic switch mechanism
	- Create templates
	- Enable in-document settings overide default settings.

## Ideas

General idea: Built-in styles are available for user to choose from. But when necessary, user can always define the page layout and element styles in the markdown source with nyml blocks (almost full control over the visible effect of the output). The '.md.pdf' files are self-contained. When a user open such a file created by another user, this new user should see the same output as the original user and can continue to edit the file. 

- Need a systematic and complete list of all allowed in-document settings. A proper way to organize them in the document. A clear instruction how to add in-document settings. So in-document settings will not cause conflicts when used properly. 
- Create some style theme templates (such as academic, casual, playful, and for special types of documents like exam, cv, report, , casual notes, book, dissertation, other suggesitons?) General requirements:
	- Use letter as default page size
	- Allow relative widths of cols. 
	- div class left: allow setting the width of the flow to left container. 
- Normally user just need to select a style theme and do not need further customization. But if wanted, allow user to set page size, text font, color, font size, line spacing, background color, margin size adjustment, as well as internal element styles to overide the template setting, or if the user make a full set of rules no need to select a template. 
- Allow dynamic switch, i.e., one source various outputs. For example, an exam with answer key shown or hidden. 
	- If user select a built-in exam template, no need to define how to show the exams or how to show/hide answers, just use the methods provided by the template (which already has the built-in define-element settings). If the user does not like the built-in template, then it is possible to define everything from scratch then save the document as a template for future usage. Exam is just one example, many other types of documents follow the same idea. 
	- The idea how to implement dynamic switch is discussed below. 


---
## Dynamic switch

Keep all dynamic state at the document level, but let `define-element` control visibility inside its own template. Then `element` instances stay purely data.

**Recommended Design**

1. One document field holds all dynamic choices.
2. `define-element` templates declare which parts appear for which choice.
3. `element` instances always carry the full data, including answer keys or alternate outputs.
4. The renderer removes unmatched parts before pagination.

That matches your exam example well.

**Document-Level State**

Use one multiline field in `kind: document`:

```markdown
{{nyml
kind: document
dynamic_choices: |
	answer-key: show
	version: a
	audience: instructor
}}
```

Rules:
- keys are arbitrary identifiers
- values are named variants
- parser compares normalized strings
- AI should prefer one canonical spelling per key, even if the system accepts synonyms

For example, although `true/false` could work, I would still recommend `show/hide` for clarity.

**Element Definition Model**

Do not create a separate `answer-key-block`.

Instead, the `question` element always includes:
- prompt
- choices
- answer key
- optional explanation

Then the `define-element` template decides what appears.

The cleanest way is to support conditional attributes inside the template HTML, for example:

- `data-show-when="answer-key=show"`
- `data-show-when="audience=instructor"`
- optionally later: `data-hide-when="version=student"`

Example:

```markdown
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
		<div class="mdpdf-el-question-mcq__answer" data-show-when="answer-key=show">
			**Answer:** [answer]
		</div>
		<div class="mdpdf-el-question-mcq__explanation" data-show-when="audience=instructor">
			[explanation]
		</div>
	</section>
css: |
	.mdpdf-el-question-mcq__answer,
	.mdpdf-el-question-mcq__explanation {
		margin-top: 4mm;
	}
}}
```

Then the instance stays simple:

```markdown
{{nyml
kind: element
name: question-mcq
prompt: What is 2 + 2?
choices: |
	- A. 3
	- B. 4
	- C. 5
answer: B. 4
explanation: Addition of two and two gives four.
}}
```

**Why This Is Better**

This gives you exactly what you described:

- no separate answer-key element
- answer key is always embedded in the question data
- parser decides whether that part is shown
- other document variants can work the same way

For other use cases, you can define multiple possible regions in the same template:

```html
<div data-show-when="version=a">Version A wording</div>
<div data-show-when="version=b">Version B wording</div>
```

So “all possible output are listed, parser chooses which to show” becomes a general rule.

**What The Renderer Should Support**

To keep it simple, I would support only this condition form first:

- `key=value`

Examples:
- `answer-key=show`
- `audience=instructor`
- `version=a`

I would not start with:
- `and` / `or`
- nested logic
- arbitrary expressions
- inline scripting

That would make the model harder for AI to generate reliably.

**Processing Order**

The renderer should do this inside the custom-element rendering path:

1. read `dynamic_choices` from the document block
2. resolve `[field]` placeholders
3. render `markdown` fields
4. parse the resulting HTML fragment
5. remove nodes whose `data-show-when` condition does not match
6. remove the condition attributes from the final output
7. send the cleaned fragment into the normal document flow

This is important because hidden content should not affect page layout.

**Behavior For Missing Choices**

Keep the default rule simple:

- if a `data-show-when` condition does not match, that node is omitted
- if the key is missing entirely, treat it as no match

That means authors should explicitly set the needed choice in the document block when a component depends on it.

Example:
- if `answer-key` is missing, answer sections do not show

That is a safer default than accidentally revealing content.

**Naming Recommendation**

If you want the system to stay general, `dynamic_choices` is fine.

I would define it as:
- one document-level mapping
- keys are arbitrary
- values are named variants
- conditions use simple equality matching

That is general enough for:
- answer keys
- instructor/student versions
- short/full solution detail
- exam A/B/C variants
- draft/final watermark sections

**Suggested Constraints**

I would formalize these rules:

- `dynamic_choices` only exists in `kind: document`
- `element` instances do not declare dynamic logic
- `define-element` templates may use `data-show-when`
- first version supports only one equality condition per node
- unmatched nodes are removed before pagination
- AI-authored docs should prefer canonical variant names like `show/hide`, `student/instructor`, `a/b`

**Concrete Exam Pattern**

Document:

```markdown
{{nyml
kind: document
dynamic_choices: |
	answer-key: hide
	audience: student
}}
```

Question definition:
- includes answer and explanation in fields
- answer wrapper has `data-show-when="answer-key=show"`
- explanation wrapper has `data-show-when="audience=instructor"`

Question instance:
- always includes all data

Result:
- one source document
- student and instructor versions come from document choices
- no duplicated question structures

I think this is the right level of simplicity.

If you want, I can turn this into a spec section and add it to plan/PhaseIFeatureExpansion.md or plan/FeatureFineTune.md.

---
## Built-in templates and reusable elements

The tool should provide a practical built-in catalog so that in common use cases the user only needs to choose a template and then use a small set of reusable elements. In-document settings should still be allowed, but should be optional rather than necessary.

### Design principle

- Each common document type should have one or two built-in templates.
- Templates should mainly define page layout, typography, spacing rhythm, heading style, decoration color, and built-in element styles.
- Reusable elements should work across templates when possible, but each template may provide its own built-in style for those elements.
- Dynamic switch should be used when one source often needs multiple output variants.
- The first goal is convenience, not maximum flexibility.
- Use orz-markdown built-in features first. If standard Markdown, containers, columns, spans, TOC, Mermaid, QR, or other parser features already solve the problem well, do not create a special built-in element for it.

## Proposed built-in template families

### 1. Academic

**Templates**

- `academic-paper`: clean serif body, restrained headings, article/report style.
- `academic-thesis`: similar base style but with wider structure, stronger chapter headings, and front-matter support.

**Use cases**

- article
- report
- dissertation draft
- lecture notes

**Design ideas**

- serif body font, conservative spacing, strong readability in print
- subtle header/footer rules
- figure and table captions visually consistent
- support title page, abstract block, theorem-like or definition-like callouts later if needed

### 2. Exam

**Templates**

- `exam-classic`: highly readable, black-and-white print-first style.
- `exam-compact`: denser spacing for worksheet or quiz use.

**Use cases**

- quiz
- exam
- homework sheet
- answer key

**Design ideas**

- question numbers visually prominent
- answer areas and score boxes aligned and consistent
- dynamic switch for `answer-key`, `audience`, and `version`
- should work even when printed in grayscale

### 3. CV / Resume

**Templates**

- `cv-professional`: minimal, formal, text-dense, for academic or office use.
- `cv-modern`: slightly more visual with stronger section markers and accent color.

**Use cases**

- resume
- cv
- academic bio sheet

**Design ideas**

- first-page impact matters more than headers/footers
- spacing and alignment must be very controlled
- contact row and section headings should be built in
- one-column default, but allow narrow side column variants later

### 4. Business / Report

**Templates**

- `report-formal`: for proposals, internal reports, policy drafts.
- `report-brief`: lighter and more presentation-like for short professional documents.

**Use cases**

- project report
- business memo
- proposal
- meeting summary

**Design ideas**

- strong title block and executive summary style
- visually clear section dividers
- callout boxes for decisions, risks, and next actions
- optional status labels and milestone blocks

### 5. Book / Long-form

**Templates**

- `book-classic`: long-form reading layout with chapter openings.
- `book-technical`: for manuals or structured technical handbooks.

**Use cases**

- handbook
- manual
- monograph draft
- tutorial book

**Design ideas**

- front matter and chapter opening pages should feel intentional
- stable headers/footers and page numbering
- better handling of long tables, figures, and code blocks
- could later include running headers based on chapter title

### 6. Notes / Handout

**Templates**

- `notes-clean`: plain study-note style with minimal decoration.
- `handout-classroom`: slightly more structured with callouts and exercise blocks.

**Use cases**

- class notes
- workshop handout
- study guide
- quick reference sheet

**Design ideas**

- easy to scan
- stronger styles for lists, callouts, and examples
- compact but not cramped
- should pair well with columns and simple diagrams

### 7. Informal / Personal Notes

**Templates**

- `personal-note-handwritten`: playful handwritten-feel note style for personal study or informal printouts.
- `personal-note-casual`: light casual notebook style with soft visual structure.

**Use cases**

- personal notes
- journal-like study pages
- informal handouts

**Design ideas**

- visually warmer and less formal than academic or report templates
- should still remain printable and readable
- can use stronger paper-like decoration, looser spacing, and more expressive headings without harming layout stability

### 8. Lab / Assignment / Worksheet

**Templates**

- `worksheet-basic`: school-style worksheet with answer areas.
- `lab-report`: procedure/observation/result structure with space for tables and figures.

**Use cases**

- worksheet
- lab instruction
- assignment sheet
- guided activity

**Design ideas**

- task blocks and response areas should be built in
- dynamic switch can show teacher notes or sample answers
- good fit for repeated structured elements

## Proposed reusable built-in elements

These should be implemented with the same `define-element` / `element` mechanism internally, but exposed as ready-to-use built-ins.

### A. Title and front matter

- `title-page-academic`
- `title-page-report`
- `title-page-book`
- `subtitle-block`
- `author-block`
- `affiliation-block`
- `abstract-block`
- `executive-summary-block`

**Design ideas**

- these should mainly be `placement: pre-body`
- different templates should style them differently without changing the data model
- front matter should usually suppress normal header/footer automatically

### B. Exam question family

- `question-choice`
- `question-open`
- `question-fill-blank`
- `question-matching`
- `question-multi-part`
- `score-box`
- `rubric-block`
- `solution-block`

**Dynamic switch ideas**

- `answer-key: show/hide`
- `audience: student/instructor`
- `version: a/b/c`

**Design ideas**

- keep the family generic where possible rather than splitting into too many narrow question types
- one complete data structure per question, never separate student/instructor duplicates
- answer, explanation, marking notes, and instructor hints should be conditionally shown
- question numbering and score alignment should be built into the style system

### C. CV / Resume family

- `cv-header`
- `cv-contact-row`
- `cv-summary`
- `cv-item-2col`
- `cv-item-3col`
- `cv-education-item`
- `cv-experience-item`
- `cv-project-item`
- `cv-publication-item`
- `cv-award-item`
- `cv-skill-group`
- `cv-reference-item`

**Design ideas**

- the element family should keep alignment consistent across the whole document
- include generic two-column and three-column row items so users can label and reuse them freely
- dates and locations should be in predictable positions
- markdown-capable description fields are important here
- a compact variant and a detailed variant may share the same data structure

### D. Report / business family

- `report-cover`
- `info-panel`
- `decision-box`
- `risk-box`
- `milestone-item`
- `timeline-block`
- `team-member-card`
- `kpi-card`
- `quote-highlight`

**Design ideas**

- strong visual hierarchy without looking like slides
- should support formal reports and internal planning documents
- can later integrate Mermaid-based process or timeline diagrams near these elements

### E. Book / manual family

- `chapter-opening`
- `part-opening`
- `sidebar-note`
- `example-block`
- `definition-block`
- `warning-block`
- `exercise-block`
- `answer-block`

**Dynamic switch ideas**

- `audience: learner/instructor`
- `answer-key: show/hide`

**Design ideas**

- useful for textbooks, manuals, and study guides
- should integrate naturally with long-form body text
- callout blocks should not require custom CSS from the user

### F. Worksheet / lab family

- `instruction-step`
- `observation-box`
- `result-box`
- `analysis-question`
- `response-area`
- `materials-list`
- `safety-note`

**Dynamic switch ideas**

- `teacher-notes: show/hide`
- `answer-key: show/hide`

**Design ideas**

- should help teachers create handouts quickly
- response areas need stable printable spacing
- safety or warning blocks should be built in and obvious

### G. General utility elements

- `callout-info`
- `callout-warning`
- `callout-danger`
- `boxed-note`
- `two-column-info`
- `figure-captioned`
- `table-captioned`
- `contact-card`
- `metadata-list`
- `signature-block`

**Design ideas**

- these are cross-template elements that many document types can reuse
- they reduce the need for users to write custom element definitions for common layouts
- some of these overlap with standard orz-markdown features, so they should only be added when template styling alone is not enough

## Recommended first implementation set

To keep the scope under control, the first built-in release should focus on the document types users are most likely to create repeatedly.

### Templates to implement first

- `academic-paper`
- `exam-classic`
- `cv-professional`
- `report-formal`
- `notes-clean`

### Elements to implement first

- `title-page-academic`
- `abstract-block`
- `question-choice`
- `question-open`
- `score-box`
- `solution-block`
- `cv-header`
- `cv-item-2col`
- `cv-item-3col`
- `cv-education-item`
- `cv-experience-item`
- `cv-skill-group`
- `decision-box`
- `risk-box`
- `callout-info`
- `callout-warning`
- `figure-captioned`

## Important implementation constraint

The built-in templates and elements should not become a second rendering engine. They should compile down to the same NYML-based `define-element` / `element` model and the same document settings pipeline. That keeps behavior consistent and still allows advanced users to replace any built-in with a custom version when needed.