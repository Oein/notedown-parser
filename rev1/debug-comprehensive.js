// More comprehensive test case for complex list items with code blocks

import { parseNotedown } from "./src/parser.js";
import { NotedownRenderer } from "./src/renderer.js";
import fs from "node:fs";
import { JSDOM } from "jsdom";

// Create a simple HTML DOM for rendering
const dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
const document = dom.window.document;
const renderer = new NotedownRenderer(document);

// Helper function for visual debugging
function dumpStructure(node, indent = "") {
  if (!node) return;

  if (Array.isArray(node)) {
    console.log(`${indent}Array(${node.length})`);
    node.forEach((item, i) => {
      console.log(`${indent}[${i}]:`);
      dumpStructure(item, indent + "  ");
    });
    return;
  }

  if (typeof node === "object") {
    console.log(`${indent}${node.type || "Object"}`);
    Object.entries(node).forEach(([key, value]) => {
      if (key === "content" || key === "items" || key === "content_blocks" || key === "nested") {
        console.log(`${indent}  ${key}:`);
        dumpStructure(value, indent + "    ");
      } else if (typeof value !== "object" || value === null) {
        console.log(`${indent}  ${key}: ${JSON.stringify(value)}`);
      }
    });
  }
}

// Test content
const testContent = `1. 시각정 정보전달
    2. 후엽
        
        신경 세포 생성하는 화학 물질
        
        1. ADH (Antidiuretic) = Vasopressin (바소프레신)
            
            향 이뇨 호르몬
            
            → 신장: 수분 재흡수 촉진 ⇒ 혈압 증가
            
        2. 옥시토신
            
            자궁수축 호르몬 - 분만 과정
            
            \`\`\`mermaid
            flowchart TD
            
            subgraph Z[" "]
            direction LR
            	자궁벽 --> id1["물리적 수축(진통)"]
            	id2[옥시토신] --> id1
            	id1 --> 뇌
            	뇌 --> 시상하부 --> id3["옥시토신 분비 촉진"]
            end
            \`\`\``;

// Parse content
const parsed = parseNotedown(testContent);
console.log("PARSED STRUCTURE:");
dumpStructure(parsed);

// Render to HTML
const rendered = renderer.renderWithStyles(parsed);

// Write to a test file to view in browser
fs.writeFileSync(
  "test-comprehensive.html",
  `<!DOCTYPE html>
<html>
<head>
  <title>Comprehensive Test</title>
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

console.log("\nTest file written to test-comprehensive.html");
