---
name: orz-markdown
description: >
  Authoring guide for the @orz-how/markdown-parser extended markdown dialect.
  USE THIS SKILL whenever the user is editing, writing, or reviewing a markdown
  document inside the orz-markdown-parser workspace, or whenever they mention
  orz markdown, orz-how/markdown-parser, or want to use custom markdown plugins
  such as {{emoji}}, {{span}}, {{mermaid}}, {{youtube}}, {{toc}}, {{qr}}, etc.
  ALWAYS activate this skill when the conversation involves custom markdown
  syntax beyond standard GitHub-Flavored Markdown in the orz-how project.
---

# orz-markdown Authoring Skill

This parser is `@orz-how/markdown-parser` — a `markdown-it` instance extended
with official plugins and a suite of custom `{{plugin …}}` plugins.  Every
rendered document must be wrapped in a `.markdown-body` element and styled with
one of the bundled CSS themes.

---

## 1. General Authoring Rules

- Use **standard Markdown first** for all structure: headings, paragraphs,
  lists, tables, blockquotes, fenced code, links, images, `---` rules, and
  footnotes `[^1]`.
- Use **official bundled extensions** when they improve legibility:
  `==mark==`, `~sub~`, `^sup^`, `++inserted++`, task lists `- [x]`, image
  sizing `![alt](url =200x100)`, and KaTeX math.
- Use **custom `{{plugin}}` syntax** only when the document will be rendered by
  this parser. Do not use it in content that must stay portable.
- **Never invent ad-hoc HTML** for callout boxes, colored labels, or embeds –
  every one of those use-cases is already covered by a plugin or container.
- Escape a literal `{{` with `\{{` when you want to show plugin syntax as text
  rather than render it.
- For multiline custom blocks, open on its own line (`{{plugin`), write the
  body, then close with `}}` on its own line.

---

## 2. Official Bundled Plugin Syntax

### Text decoration
```markdown
==highlighted text==          ← mark
~subscript~                   ← sub  (H~2~O)
^superscript^                 ← sup  (x^2^)
++inserted text++             ← ins (underline)
```

### Task lists
```markdown
- [x] Done item
- [ ] Pending item
```

### Image with explicit size
```markdown
![alt text](https://example.com/img.jpg =300x200)
```

### Math (KaTeX + mhchem)
```markdown
Inline: $E = mc^2$
Block:
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
Chemistry (inline): $\ce{2H2 + O2 -> 2H2O}$
```

### Footnotes
```markdown
Body text.[^fn1]

[^fn1]: Footnote content.
```

### Containers (markdown-it-container)

**Semantic callouts** – use for notices, never invent colored blockquotes:
```markdown
::: success
Operation succeeded.
:::

::: info
Informational note.
:::

::: warning
Review before continuing.
:::

::: danger
Irreversible – may cause data loss.
:::
```

**Layout containers** – use for inline figure placement:
```markdown
::: left
Caption or side-note floated left.
:::
Paragraph that flows to the right of the float.

::: right
Content floated right.
:::

::: center
Centred block (images, pull-quotes).
:::
```

**Spoiler** (collapsible):
```markdown
::: spoil Click to reveal
Hidden markdown content. Supports **bold**, *italic*, `code`.
:::
```

**Columns** – equal-width grid; add as many `col` blocks as needed:
```markdown
:::: cols
::: col
**Column One** — content here.
:::
::: col
**Column Two** — content here.
:::
::::
```

**Tabs** – language comparisons, alternative workflows:
```markdown
:::: tabs
::: tab Python
```python
print("Hello")
```
:::
::: tab JavaScript
```javascript
console.log("Hello");
```
:::
::::
```

---

## 3. Custom `{{plugin}}` Syntax Reference

All custom plugins use the uniform `{{plugin_name args}}` / `{{alias args}}`
format. Block plugins span multiple lines, inline plugins stay on one line.

### Emoji  (alias `em`)
```markdown
{{emoji smile}}   {{emoji rocket}}   {{em tada}}
```
Use for decorative or expressive accents. Do not overuse – one or two per
section is generally enough. If the name is unknown it renders literally.

### Span – inline styled text  (alias `sp`)
```markdown
{{span[red] red text}}      {{sp[blue] note}}
{{span[yellow] caution}}    {{sp[green] OK}}

{{span[success] Passed}}    {{sp[info] Tip}}
{{span[warning] Watch out}} {{sp[danger] Critical}}
```
**Colour classes** (`red`, `yellow`, `green`, `blue`): raw colour emphasis.  
**Badge classes** (`success`, `info`, `warning`, `danger`): small status
labels that match the container semantic palette.  
Use spans for *short labels within prose* (a word or phrase). For full
paragraphs use a `:::` container instead.

### Space – inline horizontal whitespace
```markdown
Column A:{{space 2}}Column B:{{space 4}}Column C
```
Use sparingly; normal paragraph flow handles spacing for most cases.  
Useful for aligning items inside a single line (e.g., custom table-like text).

### Table of Contents  (`toc`)
```markdown
{{toc}}          ← all heading levels
{{toc 2,3}}      ← h2 and h3 only (recommended for most documents)
```
Place at the top of the document body, just after any introductory paragraph.
Use `{{toc 2,3}}` for long documents so deep sub-sections don't clutter the
TOC.

### Attributes  (`attrs`)
```markdown
A paragraph with an injected class.{{attrs[class="highlight"]}}

## My Section {{attrs[id="custom-id"]}}
```
Must appear **immediately after** the element to modify (same block).  
Use to add IDs for deep-links or to apply a custom CSS class to a specific
element when none of the built-in classes fit.

### YouTube embed  (alias `yt`)
```markdown
{{youtube dQw4w9WgXcQ}}
{{yt 9bZkp7q19f0}}
```
Renders a responsive 16:9 iframe. Use only when the video is essential to the
content, not as decoration.

### QR Code  (alias `qrcode`)
```markdown
{{qr https://example.com}}
{{qrcode Hello World}}
```
Renders inline as an SVG. Use for print-friendly documents or wherever a
scannable link adds genuine value.

### Mermaid diagram  (alias `mm`)
```markdown
{{mermaid
graph LR
    A[Start] --> B{Decision}
    B -- Yes --> C[Action]
    B -- No  --> D[Skip]
    C --> E[End]
    D --> E
}}

{{mm
sequenceDiagram
    Alice->>Bob: Hello Bob!
    Bob-->>Alice: Hi Alice!
}}
```
Rendered client-side by Mermaid.js. Use for flowcharts, sequence diagrams,
class diagrams, Gantt charts, and ER diagrams. **Prefer Mermaid over
hand-drawn ASCII art in any technical document.**

### SMILES chemical structure  (alias `sm`)
```markdown
{{smiles C1=CC=CC=C1}}
{{sm CC(=O)OC1=CC=CC=C1C(=O)O}}
```
Drawn client-side by SmilesDrawer. Use when the document covers chemistry and
a structural formula materially aids comprehension.

### YAML metadata block  (`yaml`)
```markdown
{{yaml
title: My Document
author: Jane Doe
date: 2026-01-15
tags:
  - markdown
  - demo
}}
```
Embeds an invisible `<script type="application/yaml">` block. Use for
document metadata consumed by downstream tooling, not for visible content.

### NYML metadata block  (`nyml`)
```markdown
{{nyml
title: Document Title
author: Jane Doe
comments: |
  Multiline comment here.
}}
```
Same as yaml but processed by the NYML parser; output is JSON.  
Use when the consuming tool expects JSON rather than YAML.

### Markdown include  (alias `md`)
```markdown
{{md path/to/file.md}}
```
Embeds the rendered content of an external `.md` file at this point.  
Use for shared content (licences, disclaimers, change logs). Requires the
file to be at a stable relative path. Avoid for content that should stay
self-contained in the current document.

---

## 4. Choosing the Right Theme

Import exactly one theme CSS before rendering.  Select based on the purpose
and tone of the document:

| Theme file | Palette / typography | Best suited for |
|---|---|---|
| `light-neat-1.css` | Light blue-tinted, **Plus Jakarta Sans + Source Sans 3** | **Default safe choice** — product docs, developer references, wikis |
| `light-neat-2.css` | Warm off-white, **Space Grotesk + Literata** | Polished guides, design docs, mixed tech/non-tech audience |
| `light-academic-1.css` | Near-white Tufte serif, **Crimson Pro** | Research notes, math-heavy writing, serious long-form analysis |
| `light-academic-2.css` | White, **Merriweather + Fira Sans** | Reports, whitepapers, formal specifications, tutorials |
| `beige-decent-1.css` | Warm parchment, **Playfair Display + Crimson Pro** | Essays, reflective writing, humanities, editorial content |
| `beige-decent-2.css` | Softer beige, **DM Sans + Lora** | Long-form documentation with a gentle, contemporary tone |
| `dark-elegant-1.css` | Dark navy, **Playfair + Inter + JetBrains Mono** | Technical demos, dashboards, code-heavy engineering notes |
| `dark-elegant-2.css` | Deep dark, **Sora**, multiple font options, teal accent | Interactive docs, product showcases, slide-like reading |
| `light-playful-1.css` | Notebook lines, **Kalam + Comic Neue** | Workshops, educational content, onboarding, informal explainers |
| `light-playful-2.css` | Dot-grid, **Chewy + Patrick Hand** | Children's content, creative learning, intentionally playful decks |

**Quick decision guide:**
- Default, no strong preference → `light-neat-1.css`
- Document has heavy code blocks or diagrams → `dark-elegant-1.css`
- Scientific or mathematical writing → `light-academic-1.css`
- Formal business document or report → `light-academic-2.css`
- Warm, readable long prose → one of the `beige-decent` themes
- Playful or informal audience → one of the `light-playful` themes

`dark-elegant-2.css` supports optional body class modifiers:
`.font-serif`, `.font-sans`, `.font-handwritten`, `.font-typewrite`  
and `.size-xs`, `.size-sm`, `.size-lg`, `.size-xl`.  
`light-neat-1.css` and `light-neat-2.css` share the same modifiers.

---

## 5. Practical Patterns

### Long structured document
```markdown
# Title

{{toc 2,3}}

---

## Section One

…body…

## Section Two

…body…
```

### Feature comparison across languages
Use `:::: tabs` containers — do not use a table for code comparisons.

### Process or architecture overview
Use `{{mermaid …}}` — do not use nested lists or ASCII art.

### Document metadata for tooling
Use `{{yaml …}}` at the very top of the file (before any visible content).

### Callout for important notes
Use `:::warning`, `:::info`, etc. — do not use a blockquote with bold text as
a substitute.

### Status label in a table cell or heading
Use `{{sp[success] OK}}` / `{{sp[danger] Fail}}` — do not use raw HTML `<span>`.

### Structural deep-link target
```markdown
## My Section {{attrs[id="custom-anchor"]}}
```

---

## 6. Things to Avoid

- **Do not** use raw `<div>` or `<span>` HTML for callouts or colored text.
  Use containers and `{{span}}` respectively.
- **Do not** place `{{toc}}` midway through a document — always at the top.
- **Do not** use `{{attrs}}` on an element that is not immediately preceding it.
- **Do not** use `{{yaml}}` / `{{nyml}}` for visible content — it renders
  invisibly; use front-matter or a visible section for user-facing metadata.
- **Do not** use multiple themes in one document.
- **Do not** overload `{{space}}` to create layout — use `:::cols` or `:::left/right` instead.
