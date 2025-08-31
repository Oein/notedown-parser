import { describe, expect, test } from "bun:test";
import { parseNotedown } from "../../../src/parser";
import { NotedownRenderer } from "../../../src/renderer";

/**
 * Regression test for heading rendering bug.
 * Issue: Headings inside collapse blocks were not being rendered
 * because the renderer only handled "title" type but parser
 * generated "heading" type elements.
 */
describe("Heading Renderer Bug Fix", () => {
  // Mock document for testing
  const mockDoc = {
    createElement: (tag: string) => {
      const element = {
        tagName: tag.toUpperCase(),
        className: "",
        appendChild: (child: any) => {
          element.children = element.children || [];
          element.children.push(child);
        },
        setAttribute: (name: string, value: string) => {
          element.attributes = element.attributes || {};
          element.attributes[name] = value;
        },
        children: [] as any[],
        textContent: "",
        attributes: {} as Record<string, string>,
      };
      return element;
    },
    createDocumentFragment: () => {
      const fragment = {
        children: [] as any[],
        appendChild: (child: any) => {
          fragment.children = fragment.children || [];
          fragment.children.push(child);
        },
      };
      return fragment;
    },
    createTextNode: (text: string) => ({
      textContent: text,
      nodeType: 3,
    }),
  };

  test("should render headings both outside and inside collapse blocks", () => {
    const testContent = `# Main Heading
## Sub Heading
### Third Level

|> Collapse Section
### Heading Inside Collapse
- List item after heading
### Another Heading Inside
Content after second heading
\\|>

## Final Heading Outside`;

    const parsed = parseNotedown(testContent);
    const renderer = new NotedownRenderer(mockDoc as any);
    const result = renderer.render(parsed);

    // Check that all headings are rendered as HTML heading elements
    function findHeadings(element: any, headings: any[] = []): any[] {
      if (element.tagName && element.tagName.match(/^H[1-6]$/)) {
        headings.push({
          tag: element.tagName,
          text: element.children?.[0]?.textContent || "",
          className: element.className,
        });
      }
      if (element.children) {
        element.children.forEach((child: any) => {
          findHeadings(child, headings);
        });
      }
      return headings;
    }

    const headings = findHeadings(result);

    // Should have 6 headings total: 3 outside as paragraphs with titles + 2 inside as direct headings + 1 final outside
    expect(headings).toHaveLength(6);

    // Verify heading structure
    expect(headings[0].tag).toBe("H1");
    expect(headings[0].text).toBe("Main Heading");
    expect(headings[0].className).toBe("notedown-title notedown-title-1");

    expect(headings[1].tag).toBe("H2");
    expect(headings[1].text).toBe("Sub Heading");
    expect(headings[1].className).toBe("notedown-title notedown-title-2");

    expect(headings[2].tag).toBe("H3");
    expect(headings[2].text).toBe("Third Level");
    expect(headings[2].className).toBe("notedown-title notedown-title-3");

    expect(headings[3].tag).toBe("H3");
    expect(headings[3].text).toBe("Heading Inside Collapse");
    expect(headings[3].className).toBe("notedown-title notedown-title-3");

    expect(headings[4].tag).toBe("H3");
    expect(headings[4].text).toBe("Another Heading Inside");
    expect(headings[4].className).toBe("notedown-title notedown-title-3");

    expect(headings[5].tag).toBe("H2");
    expect(headings[5].text).toBe("Final Heading Outside");
    expect(headings[5].className).toBe("notedown-title notedown-title-2");
  });

  test("should handle the original bug reproduction case", () => {
    const originalBugContent = `# asd
## asd
### asd

|> 과거 기록
### v2.16.2
- Fix: 클립 다운로드가 최초 1회에만 나타나는 현상 수정
### v2.16
  - Feat: 클립 다운로드 추가
\\|>`;

    const parsed = parseNotedown(originalBugContent);
    const renderer = new NotedownRenderer(mockDoc as any);
    const result = renderer.render(parsed);

    function findHeadings(element: any, headings: any[] = []): any[] {
      if (element.tagName && element.tagName.match(/^H[1-6]$/)) {
        headings.push({
          tag: element.tagName,
          text: element.children?.[0]?.textContent || "",
        });
      }
      if (element.children) {
        element.children.forEach((child: any) => {
          findHeadings(child, headings);
        });
      }
      return headings;
    }

    const headings = findHeadings(result);

    // Should have 5 headings: 3 outside collapse + 2 inside collapse
    expect(headings).toHaveLength(5);

    // Verify specific headings exist
    const headingTexts = headings.map((h) => h.text);
    expect(headingTexts).toContain("asd"); // appears 3 times
    expect(headingTexts).toContain("v2.16.2");
    expect(headingTexts).toContain("v2.16");
  });

  test("should parse heading elements correctly in parser", () => {
    const simpleHeadingContent = `# Simple Heading`;
    const mixedHeadingContent = `### Mixed Heading
- List item`;

    const simpleParsed = parseNotedown(simpleHeadingContent);
    const mixedParsed = parseNotedown(mixedHeadingContent);

    // Simple heading should be paragraph containing title
    expect(simpleParsed.content).toHaveLength(1);
    expect(simpleParsed.content[0].type).toBe("paragraph");
    expect((simpleParsed.content[0] as any).content).toHaveLength(1);
    expect((simpleParsed.content[0] as any).content[0].type).toBe("title");
    expect((simpleParsed.content[0] as any).content[0].size).toBe(1);
    expect((simpleParsed.content[0] as any).content[0].text[0].text).toBe(
      "Simple Heading"
    );

    // Mixed content should create direct heading element
    expect(mixedParsed.content).toHaveLength(2);
    expect(mixedParsed.content[0].type).toBe("heading");
    expect((mixedParsed.content[0] as any).size).toBe(3);
    expect((mixedParsed.content[0] as any).text[0].text).toBe("Mixed Heading");
    expect(mixedParsed.content[1].type).toBe("list");
  });
});
