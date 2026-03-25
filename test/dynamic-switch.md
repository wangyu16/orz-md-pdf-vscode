{{nyml
kind: document
dynamic_choices: |
  answer-key: hide
  audience: student
  version: a
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
    <div class="mdpdf-el-question-mcq__version-a" data-show-when="version=a">
      <em>Version A wording</em>
    </div>
    <div class="mdpdf-el-question-mcq__version-b" data-show-when="version=b">
      <em>Version B wording</em>
    </div>
    <div class="mdpdf-el-question-mcq__student-note" data-hide-when="audience=instructor">
      <em>Student copy — instructor notes hidden</em>
    </div>
    <div class="mdpdf-el-question-mcq__choices">[choices]</div>
    <div class="mdpdf-el-question-mcq__answer" data-show-when="answer-key=show">
      <strong>Answer:</strong> [answer]
    </div>
    <div class="mdpdf-el-question-mcq__explanation" data-show-when="audience=instructor">
      <strong>Instructor note:</strong> [explanation]
    </div>
  </section>
css: |
  .mdpdf-el-question-mcq {
    margin-bottom: 8mm;
    border-left: 3px solid #ccc;
    padding-left: 6mm;
  }
  .mdpdf-el-question-mcq__prompt { font-weight: 600; margin-bottom: 2mm; }
  .mdpdf-el-question-mcq__version-a,
  .mdpdf-el-question-mcq__version-b,
  .mdpdf-el-question-mcq__student-note {
    font-size: 9pt;
    color: #888;
    margin-bottom: 2mm;
  }
  .mdpdf-el-question-mcq__choices { margin-left: 4mm; }
  .mdpdf-el-question-mcq__answer,
  .mdpdf-el-question-mcq__explanation {
    margin-top: 3mm;
    padding: 2mm 4mm;
    background: #f5f5f5;
    border-radius: 2px;
  }
}}

# Dynamic Switch Demo

Change `dynamic_choices` in the document block above to see different output from the same source.

| Key | Current value | Effect |
|---|---|---|
| `answer-key` | `hide` | Answer blocks hidden — set to `show` to reveal |
| `audience` | `student` | Instructor notes hidden — set to `instructor` to reveal |
| `version` | `a` | Version A shown — set to `b` to swap |

## Question 1

{{nyml
kind: element
name: question-mcq
prompt: What is 2 + 2?
choices: |
  - A. 3
  - B. 4
  - C. 5
answer: B. 4
explanation: The correct result of adding 2 and 2 is 4.
}}

## Question 2

{{nyml
kind: element
name: question-mcq
prompt: Which of the following is a prime number?
choices: |
  - A. 9
  - B. 15
  - C. 17
  - D. 21
answer: C. 17
explanation: |
  17 is prime — its only divisors are 1 and 17.
  9 = 3×3, 15 = 3×5, 21 = 3×7.
}}