// Debug script to fix indented code blocks in list items

import { parseNotedown } from "./src/parser.js";
import fs from "node:fs";

// Function to print indentation hierarchy for visualization
function printIndentationHierarchy(text) {
  const lines = text.split(/\n/);
  for (const line of lines) {
    const indentLevel = line.length - line.trimStart().length;
    console.log(`${indentLevel} | ${line}`);
  }
}

// Test content with list and code
const testContent = `1. First item
   
   Some content
   
   \`\`\`js
   console.log("Should be in item 1");
   \`\`\`
   
2. Second item`;

console.log("\nINDENTATION HIERARCHY:");
printIndentationHierarchy(testContent);

const parsed = parseNotedown(testContent);
console.log("\nPARSED STRUCTURE:");
console.log(JSON.stringify(parsed, null, 2));
