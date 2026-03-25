
---

- [done] Core is completed, next parser/native element styling themes 
    - do not use the parser themes directly
    - create a complete list what style rules are needed in a theme (examine one of the orz-markdown parser built in theme)
    - extract corresponding settings from all parser themes except the dark ones (so 8 in total)
    - save these as themes fro this pipeline
    - when a theme is selected, it will only affect the internal style, relative font sizes, colors, etc. but will not affect the page layout, page background at all, nor affect the font family.

- [done] Next create a few simple templates without customized elements, all do not need special title page, author/affiliation, abstract, key words, ...
    - default document 
        - use theme light-academic-1
        - page size: letter
        - margin: 1 in for all 4 sides
        - font: noto-serif
        - font_margin_box_preset: system-serif
        - font size: 12
        - line height: 1.5
        - page_number_position: footer-center
        - page_number_style: page-n
        - header_rule: false
        - footer_rule: true
        - page_background: rgb(255, 255, 255)
    - casual note or document
        - use theme light-neat-1
        - font: Lora
        - everything else the same as above default
    - handwritten note
        - use theme light-playful-1
        - background color slight beige #fcf9f2
        - background style ruled
        - font Neucha
        - other settings the same as default

- [done] Next create elements
    - academic title page for thesis like documents
    - academic title section including author/affiliation for scientific report style documents
    - abstract and keywords
    - letter head, and other formal letter comonents except the main text. 
    - time stamp (such as 'last updated \n MM/DD/YYYY' align to right)



- [done] Next create templates 
    - beige journal style article (suitable for magazine style issues or articles), beige book style (suitable for novel, fiction, kinds of books), similar to academic manuscript and thesis styles, but more elegant, more comfortable for reading
    - CV - smaller margin than default document, do not use decorational styles from themes but keep simple and minimal, use one decoration color for simple decoration
    - exam (activate dynamic control) - do not use decorational styles from themes but keep simple and minimal, use one decoration color for simple decoration. Title page or section element, elements for different types of questions, dynamic control show/hide answer keys

---

Exam design ideas
- use default layout with one decoration color to keep the document looks simple (but not boring with proper layout design)
- seems no need to create exam template. use default or academic template and let user to decide header, footer, page number. 
- Design few title page (pagebreak after) or title section (title on the top of the page and the contents follow it) design choices 
- Generic question elements: multiple choice, question following by an empty space for answers (no mater short answer, long answer, text answer, math answer), what else? Keep as few types as possible. 
- Use compact layout. For example, question number (simply a number without the text 'question'), points, boday of the question, all in one line. Do not add border to questions. 
- Provide show or hide answer mechanism (for example, highlight correct choice in a color or add a check mark to the correct choice)


- Upcoming 
    - (future plan) DOI list to structured reference list - may create a separate pipeline
        - allow non-doi items, use markdown, output as rendered markdown
        - built-in styles, ACS, IEEE, APS .... 
        - styles pass along with the doi list
        - highlight selected authors in defined ways




---

Some additional notes
- simple elements can be defined simply using div block with css stylesheet. because the markdown parser can recognize `::: ClassName [content] :::` as a div block with classname 'ClassName'. In this case no need to use nyml. 
- NYML allows multiline values, all vaules are plain text, make good use of this feature for designing new elements. Always allow simple markdown syntax in nyml values and should be rendered in output. 
- in document settings always have highest priority. 


---

What have been done and tested
- casual note and handwritten note
- Academic style article/report and thesis style document
- Beige style journal and book
- Formal letter
- CV templates
- Exam elements with dynamic switch


