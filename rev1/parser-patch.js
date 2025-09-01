/**
 * This patch adds support for code blocks within list items.
 * It focuses specifically on the issue with Mermaid diagrams inside lists.
 */

// Function to apply the patch to parser.ts
export function applyParserPatch(originalParser) {
  // Find the key areas in the original parser file
  const listLinesParseIndex = originalParser.indexOf('function parseListLines');
  
  if (listLinesParseIndex === -1) {
    console.error("Could not find parseListLines function in parser code");
    return originalParser;
  }

  // Find the section where content lines are processed in list items
  const contentLinesProcessingIndex = originalParser.indexOf(
    'if (contentLines.length > 0)', 
    listLinesParseIndex
  );
  
  if (contentLinesProcessingIndex === -1) {
    console.error("Could not find content lines processing section in parser code");
    return originalParser;
  }

  // Find the closing brace of the content lines processing block
  const endOfContentProcessing = findMatchingBrace(originalParser, contentLinesProcessingIndex);
  
  if (endOfContentProcessing === -1) {
    console.error("Could not find end of content processing block");
    return originalParser;
  }

  // The patch will replace the content lines processing with our improved version
  const beforePatch = originalParser.substring(0, contentLinesProcessingIndex);
  const afterPatch = originalParser.substring(endOfContentProcessing);
  
  // This is our improved content processing with code block detection
  const patchCode = `if (contentLines.length > 0) {
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
              const contentBlocks = parseContentLines(contentLines);

              // Add content to the current list item
              if (!item.content_blocks) {
                item.content_blocks = [];
              }
              item.content_blocks.push(...contentBlocks);
            }`;

  // Combine the parts to create the patched code
  return beforePatch + patchCode + afterPatch;
}

// Helper function to find matching closing brace
function findMatchingBrace(text, openingBraceIndex) {
  let braceCount = 0;
  let foundOpeningBrace = false;
  
  for (let i = openingBraceIndex; i < text.length; i++) {
    if (text[i] === '{') {
      braceCount++;
      foundOpeningBrace = true;
    } else if (text[i] === '}') {
      braceCount--;
      if (foundOpeningBrace && braceCount === 0) {
        return i + 1; // Return position after the closing brace
      }
    }
  }
  
  return -1; // No matching brace found
}

// This function can be used to test the patch
export function testPatch() {
  // Implementation of test code would go here
  console.log('Test function called');
}
