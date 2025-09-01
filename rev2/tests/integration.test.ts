import { describe, test, expect } from "bun:test";
import { parseAndRender, NotedownParser, NotedownRenderer } from "../src/index";

describe("Integration Tests", () => {
  test("should work with parseAndRender convenience function", () => {
    const input = `\\meta title=Test Document
\\meta author=Test Author

# @{title}

By @{author}

This is a **bold** statement with *emphasis*.

|f#red,b#yellow,Colored text|

|> Collapsible content
This is hidden content.
\\|>

\`\`\`javascript
console.log("Hello, World!");
\`\`\``;

    const result = parseAndRender(input);

    expect(result.meta).toEqual({
      title: "Test Document",
      author: "Test Author",
    });

    expect(result.html).toContain(
      '<h1><span class="meta-reference" data-key="title">Test Document</span></h1>'
    );
    expect(result.html).toContain("<strong>bold</strong>");
    expect(result.html).toContain('<span class="colored-text"');
    expect(result.html).toContain('<details class="notedown-collapse');
    expect(result.html).toContain('<code class="language-javascript"');

    expect(result.css).toContain(".notedown-container");
    expect(result.css).toContain(".colored-text");
  });

  test("should handle empty input", () => {
    const result = parseAndRender("");

    expect(result.meta).toEqual({});
    expect(result.html).toBe("");
    expect(result.css).toContain(".notedown-container");
  });

  test("should handle only meta", () => {
    const input = `\\meta title=Only Meta
\\meta description=No content`;

    const result = parseAndRender(input);

    expect(result.meta).toEqual({
      title: "Only Meta",
      description: "No content",
    });
    expect(result.html).toBe("");
  });

  test("should work with default parser and renderer instances", () => {
    const parser = new NotedownParser();
    const renderer = new NotedownRenderer();

    const input = "Simple **test** content.";

    const parsed = parser.parse(input);
    const html = renderer.render(parsed.content, parsed.meta);

    expect(html).toContain("<strong>test</strong>");
  });

  test("should handle complex nested structures", () => {
    const input = `# Main Title

|> First Level Collapse
## Nested Header

This is content with **bold** and *italic*.

    |> Second Level Collapse
    Deeply nested content with \`code\`.
    \\|>

Back to first level.
\\|>

Final paragraph with |f#blue,colored text|.`;

    const result = parseAndRender(input);

    expect(result.html).toContain("<h1>Main Title</h1>");
    expect(result.html).toContain('<details class="notedown-collapse');
    expect(result.html).toContain("<h2>Nested Header</h2>");
    expect(result.html).toContain("<strong>bold</strong>");
    expect(result.html).toContain("<em>italic</em>");
    expect(result.html).toContain("<code>code</code>");
    expect(result.html).toContain('<span class="colored-text"');
  });

  test("should handle all markdown features", () => {
    const input = `# Markdown Features Test

## Text Formatting
**Bold text** and *italic text* and __underlined text__ and ~~strikethrough~~.

## Code
Inline \`code\` and block code:

\`\`\`python
def hello():
    print("Hello, World!")
\`\`\`

## Links and Images
[Google](https://google.com)
![Alt text](https://example.com/image.jpg)

## Blockquotes
> This is a blockquote
> with multiple lines

## Tables
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

## LaTeX
Mathematical expression: $E = mc^2$

## Lists would go here if implemented`;

    const result = parseAndRender(input);

    // Check various elements are present
    expect(result.html).toContain("<strong>Bold text</strong>");
    expect(result.html).toContain("<em>italic text</em>");
    expect(result.html).toContain("<u>underlined text</u>");
    expect(result.html).toContain("<s>strikethrough</s>");
    expect(result.html).toContain("<code>code</code>");
    expect(result.html).toContain('<pre><code class="language-python"');
    expect(result.html).toContain('<a href="https://google.com">Google</a>');
    expect(result.html).toContain('<img src="https://example.com/image.jpg"');
    expect(result.html).toContain("<blockquote>");
    expect(result.html).toContain('<table class="notedown-table">');
    expect(result.html).toContain('<span class="latex"');
  });

  test("should handle notedown specific features", () => {
    const input = `\\meta title=Notedown Features

# @{title}

~## Description Header
This is a description.

|f#red,Red text|, |b#blue,Blue background|, and |f#white,b#black,White on black|.

#> Header Collapse Level 1
Content in header collapse.

##> Header Collapse Level 2
More content.
\\##>
\\#>

|> Simple Collapse
Simple collapse content.
\\|>

Special line breaks:
\\n
After line break.

\\p
After paragraph break.

\`\`\`html:raw
<div class="custom-html">Raw HTML content</div>
\`\`\`

\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\``;

    const result = parseAndRender(input);

    expect(result.html).toContain(
      '<span class="meta-reference" data-key="title">Notedown Features</span>'
    );
    expect(result.html).toContain(
      '<div class="description-header description-header-2">'
    );
    expect(result.html).toContain(
      '<span class="colored-text" style="color: red;">Red text</span>'
    );
    expect(result.html).toContain(
      '<span class="colored-text" style="background-color: blue;">Blue background</span>'
    );
    expect(result.html).toContain(
      '<span class="colored-text" style="color: white;background-color: black;">White on black</span>'
    );
    expect(result.html).toContain(
      '<details class="notedown-collapse notedown-collapse-header notedown-collapse-level-1">'
    );
    expect(result.html).toContain(
      '<details class="notedown-collapse notedown-collapse-simple">'
    );
    expect(result.html).toContain('<br class="notedown-line-break">');
    expect(result.html).toContain('<div class="notedown-paragraph-break">');
    expect(result.html).toContain(
      '<div class="custom-html">Raw HTML content</div>'
    );
    expect(result.html).toContain('<div class="mermaid-chart"');
  });

  test("should handle escaping correctly", () => {
    const input = `Escaped characters: \\*not bold\\*, \\@{not meta}, \\|not colored|, \\~not description.

Escaped in collapse:
|> Title with \\|> in it
Content with \\\\|> escape sequence.
\\|>`;

    const result = parseAndRender(input);

    expect(result.html).toContain("*not bold*");
    expect(result.html).toContain("@{not meta}");
    expect(result.html).toContain("|not colored|");
    expect(result.html).toContain("~not description");
    expect(result.html).toContain(
      '<summary class="notedown-collapse-title">Title with |&gt; in it</summary>'
    );
  });
});
