// Test the patched parser
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Replace the original parser with our patched version
const originalFile = path.join(__dirname, 'src', 'parser.ts');
const patchedFile = path.join(__dirname, 'src', 'parser.patched.ts');
const backupFile = path.join(__dirname, 'src', 'parser.backup.ts');

// Backup the original parser.ts
fs.copyFileSync(originalFile, backupFile);
console.log(`Original parser backed up to ${backupFile}`);

// Copy the patched parser to replace the original
fs.copyFileSync(patchedFile, originalFile);
console.log(`Patched parser copied to ${originalFile}`);

// Now import and test
import { parseNotedown } from './src/parser.js';
import { NotedownRenderer } from './src/renderer.js';
import { JSDOM } from 'jsdom';

// Create a DOM for rendering
const dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
const document = dom.window.document;
const renderer = new NotedownRenderer(document);

// Test with our original example
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

// Parse and dump structure
const parsed = parseNotedown(testContent);

// Helper function to make output more readable
function simplifyNode(node) {
  if (!node) return null;
  if (typeof node !== 'object') return node;
  
  const result = {};
  for (const key in node) {
    if (key === 'content' && Array.isArray(node[key])) {
      result[key] = node[key].map(item => {
        if (typeof item === 'object' && item !== null) {
          const simplified = {};
          if (item.type) simplified.type = item.type;
          if (item.text) simplified.text = item.text;
          return simplified;
        }
        return item;
      });
    } else if (key === 'items' && Array.isArray(node[key])) {
      result[key] = node[key].length + ' items';
    } else if (typeof node[key] === 'object' && node[key] !== null) {
      result[key] = `${node[key].type || 'object'}`;
    } else {
      result[key] = node[key];
    }
  }
  return result;
}

console.log('PARSED STRUCTURE:');
console.log(JSON.stringify(parsed, null, 2));

// Render to HTML
const rendered = renderer.renderWithStyles(parsed);
fs.writeFileSync(
  'patched-result.html',
  `<!DOCTYPE html>
<html>
<head>
  <title>Patched Parser Test</title>
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
  'utf8'
);

console.log('Test HTML output written to patched-result.html');

// Restore the original parser
fs.copyFileSync(backupFile, originalFile);
console.log(`Restored original parser from ${backupFile}`);
fs.unlinkSync(backupFile);
console.log('Cleanup complete');
