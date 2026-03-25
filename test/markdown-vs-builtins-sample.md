{{nyml
kind: document
template: handout-classroom
dynamic_choices: |
  answer-key: show
  audience: instructor
}}

# Markdown Versus Built-ins

This sample shows the same kind of instructional content in two forms.

## Version A: Plain Markdown First

### Materials

- Thermometer
- Stopwatch
- Prepared sample tray

### Safety

::: warning
Wear gloves and eye protection before heating any sample container.
:::

### Procedure

1. Measure the starting temperature.
2. Heat the first sample for one minute.
3. Record the visible change.

### Response Space

Use the blank area below for a short handwritten summary.





### Instructor Note

::: info
Students should notice that the higher temperature samples react more quickly.
:::

---

## Version B: Reusable Built-ins For Repeated Print Structure

{{nyml
kind: element
name: materials-list
title: Materials
items: |
  - Thermometer
  - Stopwatch
  - Prepared sample tray
}}

{{nyml
kind: element
name: safety-note
title: Safety
level: Required
content: |
  Wear gloves and eye protection before heating any sample container.
}}

{{nyml
kind: element
name: instruction-step
step: Step 1
title: Measure the starting temperature
content: |
  Record the baseline before applying heat.
}}

{{nyml
kind: element
name: instruction-step
step: Step 2
title: Heat the sample
content: |
  Heat the first sample for one minute and record the visible change.
}}

{{nyml
kind: element
name: response-area
title: Observation Summary
height: 20mm
hint: |
  Write one short paragraph about the relationship between temperature and reaction speed.
}}

{{nyml
kind: element
name: solution-block
title: Instructor Note
content: |
  Students should notice that the higher temperature samples react more quickly.
}}

## Takeaway

Use Version A when the structure is simple and does not repeat much.

Use Version B when the same lab or worksheet blocks will appear across many documents and should keep a stable print layout.