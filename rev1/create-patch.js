// Create a permanent fix for the mermaid diagram issue

// 1. Make a copy of the original parser file 
import fs from 'node:fs';

// Read the current parser.ts file
const parserCode = fs.readFileSync('./src/parser.ts', 'utf-8');

// Create a patched version
const patchedCode = parserCode.replace(
  // Identify the processListLines function's content_blocks handling section
  /\/\/ Process the collected content lines\s+if \(contentLines\.length > 0\) {\s+\/\/ Parse the content as a paragraph or other block element\s+const contentText = contentLines\.join\("\\n"\);\s+const contentBlocks = parseContentLines\(contentLines\);\s+\/\/ Add content to the current list item\s+if \(!item\.content_blocks\) {\s+item\.content_blocks = \[\];\s+}\s+item\.content_blocks\.push\(\.\.\.contentBlocks\);\s+}/g,
  `// Process the collected content lines
          if (contentLines.length > 0) {
            // Check for complete code blocks - special handling for mermaid diagrams
            let isCompleteCodeBlock = false;
            let codeBlockLang = "";
            let codeContent = "";
            
            // Pattern to check if this is a complete code block
            const codeBlockPattern = /^\\s*\`\`\`(\\w*)\\n([\\s\\S]*?)\\n\\s*\`\`\`\\s*$/;
            const contentText = contentLines.join("\\n");
            const codeMatch = contentText.match(codeBlockPattern);
            
            if (codeMatch) {
              isCompleteCodeBlock = true;
              codeBlockLang = codeMatch[1] || "";
              codeContent = codeMatch[2] || "";
            }
            
            if (isCompleteCodeBlock) {
              // Handle as a direct code block
              if (!item.content_blocks) {
                item.content_blocks = [];
              }
              
              item.content_blocks.push({
                type: "code",
                lang: codeBlockLang || undefined,
                content: codeContent
              });
            } else {
              // Normal content processing
              const contentText = contentLines.join("\\n");
              const contentBlocks = parseContentLines(contentLines);
              
              // Add content to the current list item
              if (!item.content_blocks) {
                item.content_blocks = [];
              }
              item.content_blocks.push(...contentBlocks);
            }
          }`
);

// Write the patched file
fs.writeFileSync('./src/parser.patched.ts', patchedCode);

console.log('Patched parser file created at ./src/parser.patched.ts');
console.log('To use this fix, replace the original parser.ts with this file.');
