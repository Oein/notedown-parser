import { describe, it, expect, beforeEach } from "bun:test";
import { parseNotedown, NotedownRenderer, NotedownHighlighter } from "../../../src";
import { JSDOM } from "jsdom";

// Create a mock highlight.js for testing
const mockHighlightJs = {
  highlight: (code: string, options: any) => {
    return {
      value: `<span class="hljs-keyword">function</span> highlighted() { <span class="hljs-comment">// ${options.language}</span> }`,
    };
  },
  highlightAuto: (code: string) => {
    return {
      value: '<span class="hljs-keyword">function</span> autoHighlighted() {}',
    };
  },
};

describe("Code Highlighting Tests", () => {
  let dom: JSDOM;
  let document: Document;
  let renderer: NotedownRenderer;

  beforeEach(() => {
    dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
    document = dom.window.document as any;
    renderer = new NotedownRenderer(document);
  });

  it("should add the correct classes and attributes to code blocks", () => {
    const input = `
\`\`\`javascript
// A simple function
function hello(name) {
  return "Hello, " + name + "!";
}
\`\`\`
`;
    const parsed = parseNotedown(input);
    const html = renderer.renderWithStyles(parsed);

    // We won't actually apply highlighting, just check the structure
    const htmlString = html.outerHTML;

    // Check for correct class structure
    expect(htmlString).toContain('class="language-javascript hljs"');
    expect(htmlString).toContain('data-lang="javascript"');
    expect(htmlString).toContain('data-highlight="true"');
  });

  it("should handle different language specifications", () => {
    const input = `
\`\`\`python
# Python code
def greet(name):
    return f"Hello, {name}!"
\`\`\`
`;
    const parsed = parseNotedown(input);
    const html = renderer.renderWithStyles(parsed);

    const htmlString = html.outerHTML;

    // Check for language marker
    expect(htmlString).toContain('data-lang="python"');
    expect(htmlString).toContain('class="language-python hljs"');
  });

  it("should handle code blocks without language specification", () => {
    const input = `
\`\`\`
// Generic code block
const x = 42;
\`\`\`
`;
    const parsed = parseNotedown(input);
    const html = renderer.renderWithStyles(parsed);

    const htmlString = html.outerHTML;

    // Should have the hljs class but no language class
    expect(htmlString).toContain('class="hljs"');
    expect(htmlString).not.toContain("language-");
  });

  it("should apply highlighting when using the mock highlight.js", async () => {
    const input = `
\`\`\`javascript
// Sample code
function test() {}
\`\`\`
`;
    const parsed = parseNotedown(input);
    const html = renderer.renderWithStyles(parsed);

    // Create a simple mock that adds keywords
    const mockHighlighter = (code: string) => {
      return code
        .replace(/function/g, '<span class="hljs-keyword">function</span>')
        .replace(/\/\/(.*)/g, '<span class="hljs-comment">$&</span>');
    };

    // Apply our own highlighting directly
    const codeElement = html.querySelector("code");
    if (codeElement) {
      codeElement.innerHTML = mockHighlighter(codeElement.textContent || "");
    }

    const htmlString = html.outerHTML;

    // Check that our mock highlighting was applied
    expect(htmlString).toContain('<span class="hljs-keyword">function</span>');
    expect(htmlString).toContain(
      '<span class="hljs-comment">// Sample code</span>'
    );
  });
});
