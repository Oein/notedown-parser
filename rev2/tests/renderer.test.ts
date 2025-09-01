import { describe, test, expect, beforeEach } from "bun:test";
import { JSDOM } from "jsdom";
import { NotedownRenderer } from "../src/renderer/NotedownRenderer";
import { NotedownParser } from "../src/parser/NotedownParser";
import type { ASTNode } from "../src/types";

// Setup JSDOM for DOM testing
const dom = new JSDOM();
global.document = dom.window.document;
global.window = dom.window as any;

describe("NotedownRenderer", () => {
  let renderer: NotedownRenderer;
  let parser: NotedownParser;

  beforeEach(() => {
    renderer = new NotedownRenderer();
    parser = new NotedownParser();
  });

  describe("Basic Rendering", () => {
    test("should render simple text", () => {
      const nodes: ASTNode[] = [
        {
          type: "paragraph",
          children: [{ type: "text", content: "Hello world!" }],
        },
      ];

      const result = renderer.render(nodes);
      expect(result).toBe("<p>Hello world!</p>\n");
    });

    test("should render headings", () => {
      const nodes: ASTNode[] = [
        {
          type: "heading",
          attributes: { level: 1 },
          children: [{ type: "text", content: "Title" }],
        },
      ];

      const result = renderer.render(nodes);
      expect(result).toBe("<h1>Title</h1>\n");
    });

    test("should render formatted text", () => {
      const nodes: ASTNode[] = [
        {
          type: "paragraph",
          children: [
            {
              type: "bold",
              children: [{ type: "text", content: "bold" }],
            },
            { type: "text", content: " and " },
            {
              type: "italic",
              children: [{ type: "text", content: "italic" }],
            },
          ],
        },
      ];

      const result = renderer.render(nodes);
      expect(result).toBe("<p><strong>bold</strong> and <em>italic</em></p>\n");
    });
  });

  describe("Notedown Features", () => {
    test("should render colored text", () => {
      const nodes: ASTNode[] = [
        {
          type: "coloredText",
          content: "colored text",
          attributes: {
            foreground: "red",
            background: "blue",
          },
        },
      ];

      const result = renderer.render(nodes);
      expect(result).toBe(
        '<span class="colored-text" style="color: red;background-color: blue;">colored text</span>'
      );
    });

    test("should render meta references", () => {
      const meta = { title: "Test Title" };
      const nodes: ASTNode[] = [
        {
          type: "metaReference",
          attributes: { key: "title" },
        },
      ];

      const result = renderer.render(nodes, meta);
      expect(result).toBe(
        '<span class="meta-reference" data-key="title">Test Title</span>'
      );
    });

    test("should render collapse sections", () => {
      const nodes: ASTNode[] = [
        {
          type: "collapse",
          attributes: {
            title: "Collapsible",
            isHeaderCollapse: false,
          },
          children: [
            {
              type: "paragraph",
              children: [{ type: "text", content: "Hidden content" }],
            },
          ],
        },
      ];

      const result = renderer.render(nodes);
      expect(result).toContain(
        '<details class="notedown-collapse notedown-collapse-simple">'
      );
      expect(result).toContain(
        '<summary class="notedown-collapse-title">Collapsible</summary>'
      );
      expect(result).toContain("<p>Hidden content</p>");
    });

    test("should render description headers", () => {
      const nodes: ASTNode[] = [
        {
          type: "descriptionHeader",
          attributes: { level: 2 },
          children: [{ type: "text", content: "Description" }],
        },
      ];

      const result = renderer.render(nodes);
      expect(result).toContain(
        '<div class="description-header description-header-2">'
      );
      expect(result).toContain("<h2>Description</h2>");
    });
  });

  describe("Code and Technical Content", () => {
    test("should render inline code", () => {
      const nodes: ASTNode[] = [
        {
          type: "code",
          content: 'console.log("hello")',
        },
      ];

      const result = renderer.render(nodes);
      expect(result).toBe("<code>console.log(&quot;hello&quot;)</code>");
    });

    test("should render code blocks", () => {
      const nodes: ASTNode[] = [
        {
          type: "codeBlock",
          content: "const x = 1;",
          attributes: { language: "javascript" },
        },
      ];

      const result = renderer.render(nodes);
      expect(result).toBe(
        '<pre><code class="language-javascript" data-language="javascript">const x = 1;</code></pre>\n'
      );
    });

    test("should render raw HTML", () => {
      const nodes: ASTNode[] = [
        {
          type: "rawHtml",
          content: '<div class="custom">Raw</div>',
        },
      ];

      const result = renderer.render(nodes);
      expect(result).toBe('<div class="custom">Raw</div>');
    });

    test("should render mermaid charts", () => {
      const nodes: ASTNode[] = [
        {
          type: "mermaidChart",
          content: "graph TD\n    A --> B",
          attributes: { language: "mermaid" },
        },
      ];

      const result = renderer.render(nodes);
      expect(result).toContain('<div class="mermaid-chart"');
      expect(result).toContain('data-mermaid="graph TD');
    });

    test("should render LaTeX", () => {
      const nodes: ASTNode[] = [
        {
          type: "latex",
          content: "x = y + z",
        },
      ];

      const result = renderer.render(nodes);
      expect(result).toBe(
        '<span class="latex" data-latex="x = y + z">x = y + z</span>'
      );
    });
  });

  describe("Tables", () => {
    test("should render tables", () => {
      const nodes: ASTNode[] = [
        {
          type: "table",
          children: [
            {
              type: "tableRow",
              children: [
                {
                  type: "tableCell",
                  attributes: { isHeader: true },
                  children: [{ type: "text", content: "Header 1" }],
                },
                {
                  type: "tableCell",
                  attributes: { isHeader: true },
                  children: [{ type: "text", content: "Header 2" }],
                },
              ],
            },
            {
              type: "tableRow",
              children: [
                {
                  type: "tableCell",
                  attributes: { isHeader: false },
                  children: [{ type: "text", content: "Cell 1" }],
                },
                {
                  type: "tableCell",
                  attributes: { isHeader: false },
                  children: [{ type: "text", content: "Cell 2" }],
                },
              ],
            },
          ],
        },
      ];

      const result = renderer.render(nodes);
      expect(result).toContain('<table class="notedown-table">');
      expect(result).toContain("<th>Header 1</th>");
      expect(result).toContain("<td>Cell 1</td>");
    });
  });

  describe("HTML Escaping", () => {
    test("should escape HTML characters", () => {
      const nodes: ASTNode[] = [
        {
          type: "paragraph",
          children: [
            { type: "text", content: '<script>alert("xss")</script>' },
          ],
        },
      ];

      const result = renderer.render(nodes);
      expect(result).toBe(
        "<p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>\n"
      );
    });
  });

  describe("CSS Generation", () => {
    test("should generate CSS with custom variables", () => {
      const rendererWithVars = new NotedownRenderer({
        cssVariables: {
          "primary-color": "#007bff",
          "font-size": "16px",
        },
      });

      const { css } = rendererWithVars.renderWithCSS([]);
      expect(css).toContain("--notedown-primary-color: #007bff;");
      expect(css).toContain("--notedown-font-size: 16px;");
    });

    test("should include default CSS classes", () => {
      const { css } = renderer.renderWithCSS([]);
      expect(css).toContain(".notedown-container");
      expect(css).toContain(".colored-text");
      expect(css).toContain(".notedown-collapse");
      expect(css).toContain(".description-header");
    });
  });

  describe("Integration Tests", () => {
    test("should parse and render complete document", () => {
      const input = `\\meta title=Integration Test

# @{title}

This is **bold** and *italic* text with \`code\`.

|f#red,Red text| and normal text.

|> Collapsible Section
Content inside the collapse.
\\|>

\`\`\`javascript
console.log("Hello, World!");
\`\`\``;

      const parsed = parser.parse(input);
      const { html, css } = renderer.renderWithCSS(parsed.content, parsed.meta);

      expect(html).toContain(
        '<h1><span class="meta-reference" data-key="title">Integration Test</span></h1>'
      );
      expect(html).toContain("<strong>bold</strong>");
      expect(html).toContain("<em>italic</em>");
      expect(html).toContain("<code>code</code>");
      expect(html).toContain(
        '<span class="colored-text" style="color: red;">Red text</span>'
      );
      expect(html).toContain('<details class="notedown-collapse');
      expect(html).toContain('<pre><code class="language-javascript"');
      expect(css).toContain(".notedown-container");
    });
  });
});
