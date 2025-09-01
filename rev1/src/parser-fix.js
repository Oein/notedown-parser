// Apply post-processing to fix mermaid diagrams in list items
import { parseNotedown } from "./parser.js";

// Save the original parser function
const originalParseNotedown = parseNotedown;

// Create patched version and replace the original
global.parseNotedown = function patchedParseNotedown(ndText, isCollapseContent = false) {
  // Parse normally first
  const result = originalParseNotedown(ndText, isCollapseContent);
  
  // Post-process: reassign code blocks to their proper list items
  if (result.content) {
    fixCodeBlocks(result.content);
  }
  
  return result;
};

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
    // First try with content_blocks
    if (codeBlock.indentLevel > 0) {
      if (!listItem.content_blocks) {
        listItem.content_blocks = [];
      }
      
      // Add the code block to this list item's content_blocks
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

// Export the patched parser to replace the original
export { parseNotedown };
