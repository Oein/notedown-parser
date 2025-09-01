/**
 * Test script to apply the patch and verify it fixes the mermaid in list issue
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyParserPatch } from './parser-patch.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

// Create a temporary patched parser file
async function createPatchedParser() {
  const parserPath = path.resolve(__dirname, './src/parser.ts');
  const originalParser = fs.readFileSync(parserPath, 'utf8');
  
  const patchedParser = applyParserPatch(originalParser);
  const patchedParserPath = path.resolve(__dirname, './src/parser.patched.ts');
  
  fs.writeFileSync(patchedParserPath, patchedParser, 'utf8');
  console.log(`Patched parser written to ${patchedParserPath}`);
  
  return patchedParserPath;
}

// Test with the example that had issues
async function testMermaidInList() {
  const patchedParserPath = await createPatchedParser();
  
  // We need to temporarily replace the import with our patched version
  const rendererPath = path.resolve(__dirname, './src/renderer.ts');
  const originalRenderer = fs.readFileSync(rendererPath, 'utf8');
  
  // Create a temporary modified renderer that uses our patched parser
  const modifiedRenderer = originalRenderer.replace(
    'import { parseNotedown } from "./parser";',
    'import { parseNotedown } from "./parser.patched";'
  );
  
  const modifiedRendererPath = path.resolve(__dirname, './src/renderer.patched.ts');
  fs.writeFileSync(modifiedRendererPath, modifiedRenderer, 'utf8');
  
  // Now test with our sample
  const testDocument = `
# Test Mermaid in List

- List item with Mermaid diagram
  \`\`\`mermaid
  graph TD;
      A-->B;
      A-->C;
      B-->D;
      C-->D;
  \`\`\`
- Another list item
`;

  try {
    // Save the test document to a file
    const testFilePath = path.resolve(__dirname, './test-mermaid-doc.nd');
    fs.writeFileSync(testFilePath, testDocument, 'utf8');
    
    // Create a simple script to use our patched parser
    const testParserCode = `
    import { readFileSync } from 'fs';
    import { parseNotedown } from './src/parser.patched';

    const testDoc = readFileSync('./test-mermaid-doc.nd', 'utf8');
    const result = parseNotedown(testDoc);
    console.log(JSON.stringify(result, null, 2));
    `;
    
    const testScriptPath = path.resolve(__dirname, './run-parser-test.js');
    fs.writeFileSync(testScriptPath, testParserCode, 'utf8');
    
    // Transpile our patched TypeScript file to JavaScript
    console.log("Transpiling patched parser...");
    await execAsync('npx tsc src/parser.patched.ts --esModuleInterop --target esnext --module esnext --outDir ./dist-patch');
    
    // Run the test script
    console.log("Running test with patched parser...");
    const { stdout } = await execAsync('node run-parser-test.js');
    
    console.log("Parser output:");
    console.log(stdout);
    
    // Analyze the output to check if our fix worked
    const parsedOutput = JSON.parse(stdout);
    
    let mermaidBlockFound = false;
    let correctlyNested = false;
    
    // Check if we can find the mermaid block in the correct place
    if (parsedOutput.content) {
      for (const item of parsedOutput.content) {
        if (item.type === 'list') {
          for (const listItem of item.items) {
            if (listItem.content_blocks) {
              for (const block of listItem.content_blocks) {
                if (block.type === 'code' && block.lang === 'mermaid') {
                  mermaidBlockFound = true;
                  correctlyNested = true;
                  console.log("✅ Success! Mermaid block found correctly nested in list item");
                  break;
                }
              }
            }
          }
        } else if (item.type === 'code' && item.lang === 'mermaid') {
          mermaidBlockFound = true;
          console.log("❌ Found mermaid block but it's at the top level (not fixed)");
        }
      }
    }
    
    if (!mermaidBlockFound) {
      console.log("❌ No mermaid block found in the document");
    } else if (correctlyNested) {
      console.log("✅ Fix successfully implemented! Mermaid diagrams now work in list items.");
    } else {
      console.log("❌ Mermaid block found but not correctly nested in list item");
    }
    
  } catch (error) {
    console.error("Error during testing:", error);
  } finally {
    // Clean up temporary files
    try {
      //fs.unlinkSync(patchedParserPath);
      //fs.unlinkSync(modifiedRendererPath);
      console.log("Test completed");
    } catch (error) {
      console.error("Error cleaning up:", error);
    }
  }
}

// Run the test
testMermaidInList();
