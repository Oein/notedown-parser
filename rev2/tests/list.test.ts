import { describe, test, expect } from "bun:test";
import { NotedownParser, NotedownRenderer } from "../src/index";

describe("List Support", () => {
  const parser = new NotedownParser();
  const renderer = new NotedownRenderer();

  describe("List Parsing", () => {
    test("should parse numbered lists", () => {
      const input = `1. First item
2. Second item
3. Third item`;

      const result = parser.parse(input);
      
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("list");
      expect(result.content[0].attributes?.isNumbered).toBe(true);
      expect(result.content[0].children).toHaveLength(3);
      
      // Check markers
      expect(result.content[0].children[0].attributes?.marker).toBe("1.");
      expect(result.content[0].children[1].attributes?.marker).toBe("2.");
      expect(result.content[0].children[2].attributes?.marker).toBe("3.");
    });

    test("should parse bullet lists", () => {
      const input = `- First item
- Second item
* Third item`;

      const result = parser.parse(input);
      
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("list");
      expect(result.content[0].attributes?.isNumbered).toBe(false);
      expect(result.content[0].children).toHaveLength(3);
      
      // Check markers
      expect(result.content[0].children[0].attributes?.marker).toBe("-");
      expect(result.content[0].children[1].attributes?.marker).toBe("-");
      expect(result.content[0].children[2].attributes?.marker).toBe("*");
    });

    test("should parse nested content in list items", () => {
      const input = `1. First item
    
    Nested paragraph content
    
    More nested content
    
2. Second item
    
    Another nested paragraph`;

      const result = parser.parse(input);
      
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("list");
      expect(result.content[0].children).toHaveLength(2);
      
      // First item should have nested content
      const firstItem = result.content[0].children[0];
      expect(firstItem.children.length).toBeGreaterThan(1);
      
      // Should have main text + nested paragraph(s)
      expect(firstItem.children[0].type).toBe("text");
      expect(firstItem.children.some((child: any) => child.type === "paragraph")).toBe(true);
    });

    test("should handle Korean text in lists", () => {
      const input = `1. 시각정 정보전달
    
    장점: 많은 양의 정보 전달
    
2. 청각정 정보전달
    
    장점: 방향의 일치가 필요하지 않음`;

      const result = parser.parse(input);
      
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("list");
      expect(result.content[0].children).toHaveLength(2);
      
      // Check Korean text is preserved
      const firstItemText = result.content[0].children[0].children[0];
      expect(firstItemText.content).toBe("시각정 정보전달");
    });

    test("should separate different list types", () => {
      const input = `1. Numbered item
2. Another numbered

- Bullet item
- Another bullet`;

      const result = parser.parse(input);
      
      expect(result.content).toHaveLength(2);
      expect(result.content[0].type).toBe("list");
      expect(result.content[0].attributes?.isNumbered).toBe(true);
      expect(result.content[1].type).toBe("list");
      expect(result.content[1].attributes?.isNumbered).toBe(false);
    });
  });

  describe("List Rendering", () => {
    test("should render numbered lists with div structure", () => {
      const input = `1. First item
2. Second item`;

      const parsed = parser.parse(input);
      const html = renderer.render(parsed.content);
      
      expect(html).toContain('class="notedown-list notedown-list-numbered"');
      expect(html).toContain('class="notedown-list-item"');
      expect(html).toContain('class="notedown-list-marker"');
      expect(html).toContain('<span class="notedown-list-marker">1.</span>');
      expect(html).toContain('<span class="notedown-list-marker">2.</span>');
    });

    test("should render bullet lists with div structure", () => {
      const input = `- First item
- Second item`;

      const parsed = parser.parse(input);
      const html = renderer.render(parsed.content);
      
      expect(html).toContain('class="notedown-list notedown-list-bulleted"');
      expect(html).toContain('<span class="notedown-list-marker">-</span>');
    });

    test("should render nested content in separate div", () => {
      const input = `1. Main item
    
    Nested content here`;

      const parsed = parser.parse(input);
      const html = renderer.render(parsed.content);
      
      expect(html).toContain('class="notedown-list-nested"');
      expect(html).toContain('<p>Nested content here</p>');
    });

    test("should include list CSS", () => {
      const parsed = parser.parse("1. Item");
      const result = renderer.renderWithCSS(parsed.content);
      const css = result.css;
      
      expect(css).toContain('.notedown-list');
      expect(css).toContain('.notedown-list-item');
      expect(css).toContain('.notedown-list-marker');
      expect(css).toContain('.notedown-list-nested');
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty list items", () => {
      const input = `1. 
2. Second item`;

      const result = parser.parse(input);
      expect(result.content[0].children).toHaveLength(2);
      
      // First item should be empty (no children)
      expect(result.content[0].children[0].children).toHaveLength(0);
      
      // Second item should have content
      expect(result.content[0].children[1].children[0].content).toBe("Second item");
    });

    test("should handle mixed formatting in list items", () => {
      const input = `1. **Bold** and *italic* text
2. Item with \`code\` and [links](http://example.com)`;

      const parsed = parser.parse(input);
      const html = renderer.render(parsed.content);
      
      expect(html).toContain('<strong>Bold</strong>');
      expect(html).toContain('<em>italic</em>');
      expect(html).toContain('<code>code</code>');
      expect(html).toContain('<a href="http://example.com">links</a>');
    });
  });
});
