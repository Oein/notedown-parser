// Fix for code blocks within list items

import { parseNotedown } from "./src/parser.js";
import { NotedownRenderer } from "./src/renderer.js";
import fs from "node:fs";
import { JSDOM } from "jsdom";

// Patch the parser function to fix code blocks in list items
const originalParseNotedown = parseNotedown;
function patchedParseNotedown(ndText, isCollapseContent = false) {
  // Parse normally first
  const result = originalParseNotedown(ndText, isCollapseContent);
  
  // Post-process: reassign code blocks to their proper list items
  if (result.content) {
    fixCodeBlocks(result.content);
  }
  
  return result;
}

// Helper function to handle the fix
function fixCodeBlocks(content) {
  // Find all list items to process
  const lists = content.filter(item => item.type === "list");
  
  // Identify code blocks that need to be moved
  const standaloneCodeBlocks = content.filter(item => 
    item.type === "code" && item.indentLevel && item.indentLevel > 0
  );
  
  if (standaloneCodeBlocks.length === 0) return;
  
  // For each code block, find the list item it should belong to
  for (const codeBlock of standaloneCodeBlocks) {
    let foundHome = false;
    
    // Try to find a proper list item based on indentation
    for (const list of lists) {
      if (processListForCodeBlock(list, codeBlock)) {
        foundHome = true;
        break;
      }
    }
    
    // Remove code blocks that have been assigned to list items
    if (foundHome) {
      const index = content.indexOf(codeBlock);
      if (index !== -1) {
        content.splice(index, 1);
      }
    }
  }
  
  // Recursively process nested lists
  for (const item of content) {
    if (item.type === "list") {
      for (const listItem of item.items || []) {
        if (listItem.nested) {
          fixCodeBlocks(listItem.nested);
        }
      }
    }
  }
}

// Process a list to see if a code block belongs in any of its items
function processListForCodeBlock(list, codeBlock) {
  if (!list.items) return false;
  
  for (const listItem of list.items) {
    // Check if this list item should contain the code block
    // based on indentation level
    if (listItem.content_blocks || listItem.nested) {
      // Add to content blocks if indentation suggests it belongs here
      if (!listItem.content_blocks) {
        listItem.content_blocks = [];
      }
      
      // Add the code block to this list item
      listItem.content_blocks.push(codeBlock);
      return true;
    }
    
    // Recursively check nested lists
    if (listItem.nested) {
      for (const nested of listItem.nested) {
        if (processListForCodeBlock(nested, codeBlock)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Test with our original problem
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

// Create a DOM for rendering
const dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
const document = dom.window.document;
const renderer = new NotedownRenderer(document);

// Test both versions
console.log("\nORIGINAL PARSER:");
const originalResult = originalParseNotedown(testContent);
console.log(JSON.stringify(originalResult, null, 2));

console.log("\nPATCHED PARSER:");
const patchedResult = patchedParseNotedown(testContent);
console.log(JSON.stringify(patchedResult, null, 2));

// Render with patched version
const rendered = renderer.renderWithStyles(patchedResult);
fs.writeFileSync(
  "test-fixed.html",
  `<!DOCTYPE html>
<html>
<head>
  <title>Fixed Version</title>
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

console.log("\nFixed version test file written to test-fixed.html");
