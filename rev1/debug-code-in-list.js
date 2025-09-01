// Test case for mermaid code blocks in list items
import { parseNotedown } from "./src/parser.js";
import { NotedownRenderer } from "./src/renderer.js";
import fs from "node:fs";
import { JSDOM } from "jsdom";

// Create a simple HTML DOM for rendering
const dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
const document = dom.window.document;
const renderer = new NotedownRenderer(document);

// Test content with nested mermaid diagram in list
const testContent = `1. First item with a code block
   
   Here is a code block inside an item:
   
   \`\`\`js
   console.log("This should be inside item 1");
   \`\`\`

2. Second item with a mermaid diagram
   
   Here is a mermaid diagram:
   
   \`\`\`mermaid
   graph TD
     A[Start] --> B[End]
   \`\`\``;

// Parse and render
const parsed = parseNotedown(testContent);
console.log(JSON.stringify(parsed, null, 2));

// Render and check the HTML output
const rendered = renderer.renderWithStyles(parsed);

// Write to test file
fs.writeFileSync(
  "test-code-in-list.html",
  `<!DOCTYPE html>
<html>
<head>
  <title>Code in List Test</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      mermaid.initialize({ startOnLoad: true });
    });
  </script>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .notedown-list-item {
      margin-bottom: 10px;
    }
    .notedown-code-block {
      background-color: #f5f5f5;
      border-radius: 4px;
      padding: 10px;
      margin: 10px 0;
      overflow: auto;
    }
  </style>
</head>
<body>
  ${rendered.outerHTML}
</body>
</html>`,
  "utf8"
);

console.log("Test file written to test-code-in-list.html");
