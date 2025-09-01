// Simplified test for mermaid diagrams in lists

import { parseNotedown } from "./src/parser.js";
import { NotedownRenderer } from "./src/renderer.js";
import fs from "node:fs";
import { JSDOM } from "jsdom";

// Create a simple HTML DOM for rendering
const dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
const document = dom.window.document;
const renderer = new NotedownRenderer(document);

// Test content with the minimal reproducible example
const testContent = `1. Level 1 item
    
    Some text content
    
    \`\`\`mermaid
    flowchart TD
      A[Start] --> B[End]
    \`\`\``;

// Parse content
const parsed = parseNotedown(testContent);
console.log(JSON.stringify(parsed, null, 2));

// Render to HTML
const rendered = renderer.renderWithStyles(parsed);
fs.writeFileSync(
  "test-simplified.html",
  `<!DOCTYPE html>
<html>
<head>
  <title>Simplified Test</title>
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
    .notedown-list {
      padding-left: 20px;
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

console.log("Test file written to test-simplified.html");
