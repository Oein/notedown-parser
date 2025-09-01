import { describe, test, expect, beforeEach } from "bun:test";
import { JSDOM } from "jsdom";
import { NotedownParser } from "../src/parser/NotedownParser";

// Setup JSDOM for DOM testing
const dom = new JSDOM();
global.document = dom.window.document;
global.window = dom.window as any;

describe("NotedownParser", () => {
  let parser: NotedownParser;

  beforeEach(() => {
    parser = new NotedownParser();
  });

  describe("Basic Parsing", () => {
    test("should parse simple text", () => {
      const input = "Hello world!";
      const result = parser.parse(input);

      expect(result.meta).toEqual({});
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("paragraph");
      expect(result.content[0].children).toHaveLength(1);
      expect(result.content[0].children[0].type).toBe("text");
      expect(result.content[0].children[0].content).toBe("Hello world!");
    });

    test("should parse meta data", () => {
      const input = `\\meta title=Test Title
\\meta author=Test Author

# @{title}

Content by @{author}`;

      const result = parser.parse(input);

      expect(result.meta).toEqual({
        title: "Test Title",
        author: "Test Author",
      });
    });

    test("should parse headings", () => {
      const input = `# Heading 1
## Heading 2
### Heading 3`;

      const result = parser.parse(input);

      expect(result.content).toHaveLength(3);
      expect(result.content[0].type).toBe("heading");
      expect(result.content[0].attributes?.level).toBe(1);
      expect(result.content[1].type).toBe("heading");
      expect(result.content[1].attributes?.level).toBe(2);
      expect(result.content[2].type).toBe("heading");
      expect(result.content[2].attributes?.level).toBe(3);
    });
  });

  describe("Markdown Syntax", () => {
    test("should parse bold text", () => {
      const input = "**bold text**";
      const result = parser.parse(input);

      const paragraph = result.content[0];
      expect(paragraph.children[0].type).toBe("bold");
      expect(paragraph.children[0].children[0].content).toBe("bold text");
    });

    test("should parse italic text", () => {
      const input = "*italic text*";
      const result = parser.parse(input);

      const paragraph = result.content[0];
      expect(paragraph.children[0].type).toBe("italic");
      expect(paragraph.children[0].children[0].content).toBe("italic text");
    });

    test("should parse underline text", () => {
      const input = "__underline text__";
      const result = parser.parse(input);

      const paragraph = result.content[0];
      expect(paragraph.children[0].type).toBe("underline");
      expect(paragraph.children[0].children[0].content).toBe("underline text");
    });

    test("should parse strikethrough text", () => {
      const input = "~~strikethrough text~~";
      const result = parser.parse(input);

      const paragraph = result.content[0];
      expect(paragraph.children[0].type).toBe("strikethrough");
      expect(paragraph.children[0].children[0].content).toBe(
        "strikethrough text"
      );
    });

    test("should parse inline code", () => {
      const input = "`inline code`";
      const result = parser.parse(input);

      const paragraph = result.content[0];
      expect(paragraph.children[0].type).toBe("code");
      expect(paragraph.children[0].content).toBe("inline code");
    });

    test("should parse code blocks", () => {
      const input = `\`\`\`javascript
console.log("Hello, World!");
\`\`\``;

      const result = parser.parse(input);

      expect(result.content[0].type).toBe("codeBlock");
      expect(result.content[0].attributes?.language).toBe("javascript");
      expect(result.content[0].content).toBe('console.log("Hello, World!");');
    });

    test("should parse LaTeX", () => {
      const input = "$x = y + z$";
      const result = parser.parse(input);

      const paragraph = result.content[0];
      expect(paragraph.children[0].type).toBe("latex");
      expect(paragraph.children[0].content).toBe("x = y + z");
    });

    test("should parse links", () => {
      const input = "[Google](https://google.com)";
      const result = parser.parse(input);

      const paragraph = result.content[0];
      expect(paragraph.children[0].type).toBe("link");
      expect(paragraph.children[0].attributes?.url).toBe("https://google.com");
      expect(paragraph.children[0].attributes?.text).toBe("Google");
    });

    test("should parse images", () => {
      const input = "![Alt text](https://example.com/image.jpg)";
      const result = parser.parse(input);

      const paragraph = result.content[0];
      expect(paragraph.children[0].type).toBe("image");
      expect(paragraph.children[0].attributes?.url).toBe(
        "https://example.com/image.jpg"
      );
      expect(paragraph.children[0].attributes?.alt).toBe("Alt text");
    });

    test("should parse blockquotes", () => {
      const input = `> This is a quote
> Second line of quote`;

      const result = parser.parse(input);

      expect(result.content[0].type).toBe("blockquote");
      expect(result.content[0].children).toHaveLength(1);
      expect(result.content[0].children[0].type).toBe("paragraph");
    });

    test("should parse tables", () => {
      const input = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;

      const result = parser.parse(input);

      expect(result.content[0].type).toBe("table");
      expect(result.content[0].children).toHaveLength(2); // Header + data row
      expect(result.content[0].children[0].type).toBe("tableRow");
      expect(result.content[0].children[0].children[0].type).toBe("tableCell");
      expect(
        result.content[0].children[0].children[0].attributes?.isHeader
      ).toBe(true);
    });
  });

  describe("Notedown Syntax", () => {
    test("should parse colored text", () => {
      const input = "|f#red,b#blue,colored text|";
      const result = parser.parse(input);

      const paragraph = result.content[0];
      expect(paragraph.children[0].type).toBe("coloredText");
      expect(paragraph.children[0].content).toBe("colored text");
      expect(paragraph.children[0].attributes?.foreground).toBe("red");
      expect(paragraph.children[0].attributes?.background).toBe("blue");
    });

    test("should parse meta references", () => {
      const input = "Title: @{title}";
      const result = parser.parse(input);

      const paragraph = result.content[0];
      expect(paragraph.children[1].type).toBe("metaReference");
      expect(paragraph.children[1].attributes?.key).toBe("title");
    });

    test("should parse simple collapse", () => {
      const input = `|> Collapsible content
This is inside
\\|>`;

      const result = parser.parse(input);

      expect(result.content[0].type).toBe("collapse");
      expect(result.content[0].attributes?.title).toBe("Collapsible content");
      expect(result.content[0].attributes?.isHeaderCollapse).toBe(false);
    });

    test("should parse header collapse", () => {
      const input = `#> Header Collapse
Content inside
\\#>`;

      const result = parser.parse(input);

      expect(result.content[0].type).toBe("collapse");
      expect(result.content[0].attributes?.title).toBe("Header Collapse");
      expect(result.content[0].attributes?.level).toBe(1);
      expect(result.content[0].attributes?.isHeaderCollapse).toBe(true);
    });

    test("should parse description headers", () => {
      const input = "~# Description Header";
      const result = parser.parse(input);

      expect(result.content[0].type).toBe("descriptionHeader");
      expect(result.content[0].attributes?.level).toBe(1);
    });

    test("should parse line breaks", () => {
      const input = "\\n";
      const result = parser.parse(input);

      expect(result.content[0].type).toBe("lineBreak");
    });

    test("should parse paragraph breaks", () => {
      const input = "\\p";
      const result = parser.parse(input);

      expect(result.content[0].type).toBe("paragraphBreak");
    });

    test("should parse raw HTML", () => {
      const input = `\`\`\`html:raw
<div class="custom">Raw HTML</div>
\`\`\``;

      const result = parser.parse(input);

      expect(result.content[0].type).toBe("rawHtml");
      expect(result.content[0].content).toBe(
        '<div class="custom">Raw HTML</div>'
      );
    });

    test("should parse mermaid charts", () => {
      const input = `\`\`\`mermaid
graph TD
    A --> B
\`\`\``;

      const result = parser.parse(input);

      expect(result.content[0].type).toBe("mermaidChart");
      expect(result.content[0].content).toBe("graph TD\n    A --> B");
      expect(result.content[0].attributes?.language).toBe("mermaid");
    });
  });

  describe("Escaping", () => {
    test("should handle escape sequences", () => {
      const input = "Escaped \\*not italic\\* text";
      const result = parser.parse(input);

      const paragraph = result.content[0];
      expect(paragraph.children).toHaveLength(3);
      expect(paragraph.children[0].content).toBe("Escaped ");
      expect(paragraph.children[1].content).toBe("*");
      expect(paragraph.children[2].content).toBe("not italic* text");
    });

    test("should handle escaped meta references", () => {
      const input = "Escaped \\@{title} reference";
      const result = parser.parse(input);

      const paragraph = result.content[0];
      expect(paragraph.children[1].content).toBe("@");
      expect(paragraph.children[2].content).toBe("{title} reference");
    });
  });

  describe("Complex nested structures", () => {
    test("should parse nested collapse", () => {
      const input = `|> Outer Collapse
# Header inside

    |> Inner Collapse
    Content in inner
    \\|>

More outer content
\\|>`;

      const result = parser.parse(input);

      expect(result.content[0].type).toBe("collapse");
      expect(result.content[0].attributes?.title).toBe("Outer Collapse");

      // Check for nested collapse inside
      const outerContent = result.content[0].children;
      expect(outerContent).toContainEqual(
        expect.objectContaining({ type: "collapse" })
      );
    });

    test("should parse mixed formatting", () => {
      const input = "**Bold and *italic* text** with `code`";
      const result = parser.parse(input);

      const paragraph = result.content[0];
      expect(paragraph.children[0].type).toBe("bold");
      expect(paragraph.children[0].children[1].type).toBe("italic");
      expect(paragraph.children[2].type).toBe("code");
    });
  });
});
