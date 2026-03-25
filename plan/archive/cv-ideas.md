---

## CV Template Ideas — Refined Plan

### Design Philosophy
- **Use built-in markdown first:** headings, paragraphs, lists, tables, `---` rules, `:::`containers, `:::: cols` for multi-column, `{{span}}` for inline labels
- **Use existing generic elements** (`timestamp`, `academic-title-section` as inspiration) before creating new ones
- **Minimal new elements:** only where markdown + CSS class on a `:::` div cannot achieve the layout
- **NYML values carry markdown** — bold, italic, inline links, even `{{span}}` badges work inside element fields
- Template-level `customCss` injects CV-specific CSS for all the class names used in `:::` containers

### What Each CV Template Consists Of

Every template:
- `theme: none` — no theme decorations at all
- Dedicated `customCss` block in the template registering `.cv-*` CSS class styles
- Smaller margins: 15 mm top/bottom, 17 mm left/right
- `decoration_color` drives all accents via `--mdpdf-decoration-color` CSS variable
- Footer: name left + folio right (set via `footer_left` / `footer_right` in the doc NYML block)
- No header

### Authoring a CV — Standard Flow

```
{{nyml
kind: document
template: cv-linear
footer_left: Jane Smith
decoration_color: #2a6496
}}

# Jane Smith

**Research Scientist** · jane@example.com · +1 555 000 0000 · github.com/jsmith

---

## Experience

### Postdoctoral Fellow · MIT CSAIL · 2024–present
- Lorem ipsum dolor sit amet
- Consectetur adipiscing elit

## Education

### Ph.D. Computer Science · Stanford University · 2024
Thesis: *Efficient Long-Context Transformers*

## Skills

**Languages:** Python, Julia, C++
**Tools:** PyTorch, JAX, LaTeX
```

The standard markdown heading hierarchy (`##` for sections, `###` for entries) is enough for all three linear CV variants. No custom elements needed for body content.

The only NYML element needed is a **`cv-header`** for structured name + contact layouts that go beyond a plain H1 (e.g., photo, two-column contact block, sidebar). For the linear style, a plain `# Name` + paragraph contact line is sufficient.

---

### Template 1: `cv-linear` — "Linear Classic"
Single-column. All decoration done via CSS on standard markdown elements.

**CSS injected by the template:**
- `h2` → small-caps, decoration color, thin bottom rule (matching `--mdpdf-decoration-color`)
- `h3` → normal weight, no border — reads as entry title + employer + date (markdown `###` row uses bold + `·` separators)
- `hr` → short centered ornamental rule (`◆` or gradient)
- Body font size 10.5 pt, tight line height

**Font pairing:** Source Serif 4 body / IBM Plex Sans headings  
**Page:** Letter, 15 mm top/bottom, 17 mm left/right

---

### Template 2: `cv-block-grid` — "Block Grid"
Two-column feel using `:::: cols` for heavy sections (Experience, Education). Left column is narrow label, right is content. For simple sections (Skills, Awards) just plain markdown.

**CSS injected by the template:**
- First `.col` in a `:::: cols` pair → narrow (22%), right-aligned, decoration color, all-caps, small font
- Second `.col` → wide (78%), normal body
- `h2` → visually hidden (the col label replaces it); or used as a standalone full-width divider

**Font pairing:** Noto Sans (all) — one font, weight variation only  
**Page:** Letter, 17 mm top/bottom, 20 mm left/right

**Column usage in the document:**
```markdown
:::: cols
::: col
EXPERIENCE
:::
::: col
### Senior Researcher · OpenAI · 2023–present
- Built XYZ
:::
::::
```

---

### Template 3: `cv-sidebar` — "Sidebar Accent"
Needs one NYML element: **`cv-sidebar-layout`** — wraps the whole page in a two-column flex with a colored left sidebar. Everything inside the sidebar is plain markdown rendered inside the element's left pane (photo, name, contact, skills written as `**Category:** item, item` lines).

**This is the only case where a custom element is genuinely needed** because the sidebar must bleed to the page edge, which pure `:::` containers cannot do (they sit inside the page margin box).

**Element fields:**
```
{{nyml
kind: element
name: cv-sidebar-layout
sidebar_width: 32%
sidebar_background: rgba(42, 100, 150, 0.08)
sidebar: |
  ![Photo](./photo.jpg =120x120)

  **Jane Smith**
  Research Scientist

  jane@example.com
  +1 555 000 0000

  **Skills**
  Python · Julia · C++

  **Languages**
  English (native)
  Mandarin (professional)
}}

## Experience
...
```

**Font pairing:** Inter (all sans)  
**Page:** Letter, 0 mm left margin (sidebar bleeds), 15 mm top/bottom, 17 mm right

---

### New Elements Needed (Minimal)

| Element | When needed | What it does |
|---|---|---|
| `cv-header` | Optional for all templates | Structured name block: name large, title, contact row aligned baseline or two-column. Replaces a plain `# Name` when a photo or more precise layout is wanted |
| `cv-sidebar-layout` | `cv-sidebar` template only | Full-page two-column wrapper with bleed sidebar |

Everything else (sections, entries, skills, publications, awards) is plain markdown with `##` / `###` / `- bullet` / `**bold**` / `*italic*`, styled entirely by the template's injected CSS.

---

### Implementation Order

1. Add `cv-linear` and `cv-block-grid` templates (no new elements — CSS only via `customCss` in template)
2. Write a sample CV test file showing how standard markdown maps to each template
3. Add optional `cv-header` element (generic, useful for all CV templates)
4. Add `cv-sidebar` template + `cv-sidebar-layout` element (more complex, do last)


