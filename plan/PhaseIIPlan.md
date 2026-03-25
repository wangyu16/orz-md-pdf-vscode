Goal: create a vs code extension for editing and previewing 'example.md.pdf' files. 
- These 'example.md.pdf' files are valid pdf files that can be viewed by any pdf viewer. 
- The markdown sources used to create these pdf pages are embeded and can be extracted by this extension for editing. 
- The extension automatically update the pdf output and provide preview. When saved, the markdown source and pdf pages both saved to one file. 

# Implementation Plan

## Overview

This plan is divided into two phases:

- **Phase 1** — A standalone model sub-project to validate and harden the core pipeline: Markdown source → custom parser → HTML → paged.js preview → Puppeteer PDF.
- **Phase 2** — The full VS Code extension that wraps Phase 1's pipeline with the extension framework, virtual document editing, and the `.md.pdf` binary file format.

Phase 1 has been completed. 

## Phase 2 perspectives: 
### Initiate a file:

- A blank file is created and named with '.md.pdf' as extension name. When this file is opened in vs code, the extension recognize it and convert it to a valid empty '.md.pdf' file injecting one sentence saying initiated and welcome to continue editing.
- When a markdown file, e.g. 'example.md', is converted to 'example.md.pdf', and is opened in vs code, the extension recognize it and extract the markdown source, convert this file into valid '.md.pdf' file, inject the existing markdown source to it, so 'example.md.pdf' becomes a valid pdf file with contents from previous markdown source. 
- When use this extension to create an empty '.md.pdf' file, initiate a valid empty file with welcome editing note. 

### Edit a file:
- extract the source markdown as a virtual file and edit in built-in editor; preview using paged.js using the pipeline
- the original '.md.pdf' file does not need to be updated all the time. Only when user click 'ctrl + s' or when auto saving (e.g. every minute), the new editing results will be saved to original file. In other words, editing does not directly affect the original file, but runs in memory and shows the preview in a local server as a webpage assembled in paged.js. 
- When the markdown source has changes, the preview update the changed part only while the rest as if nothing happened. do not change the position of preview (i.e., do not always jump to the top). Do not make the preview panel flash/shake when update. 
- do not need to update as user is typing. wait 0.5 s after typeing stops and update once. See 'example.html' which works in such a manner. 


### Save a file:
- Upon saving, the 'md.pdf' file is updated with newly edited content. All images should be embeded into the output as well. 

### Export pdf:
- Allow user to export pure pdf file by removing the markdown source and other features used only for '.md.pdf' editing, create a pure pdf file with the same name as the previous '.md.pdf' file with a timestamp added. For example, 'example.md.pdf' can be exported as 'example-03-23-2026.pdf'. 

---



## Issues and Additional thoughts

- [done] want to have split view by default, left editor, right preview. but now they are opened as two tags. 
    - partially solved. but now it opens a preview first, then the markdown souce and another preview in split view. I.e., opens three panels every time a file is opened. 
- [done] Add a float 'export' icon directly to the right bottom corner of the preview panel, so it is easier for user to notice it.  
- [done] when vs code is closed and re-opened, two virtual markdown files show up. It cause confusing. Should either avoid auto reopening previous document, or open both editor and previewer that can work directly. 
    - let'a apply the suggested approach: Fix in VirtualDocProvider.getOrCreateTempFile — replace the timestamp with a deterministic hash of the file path so the same .md.pdf always maps to the same temp path
- [done] does this extension work when vs code is opened remotely via ssh?

Push to GitHub

git@github.com:wangyu16/orz-md-pdf-vscode.git