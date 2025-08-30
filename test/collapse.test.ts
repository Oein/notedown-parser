import { describe, test, expect } from "bun:test";
import { parseNotedown } from "../src/parser";

describe("Collapse with Size Functionality", () => {
  test("should parse single-level collapse (#>)", () => {
    const input = `#> Level 1 Title
Content inside level 1
\\#>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("collapse");
    expect(result.content[0].size).toBe(1);
    expect(result.content[0].text).toEqual([{ text: "Level 1 Title" }]);
    expect(result.content[0].content).toHaveLength(1);
    expect(result.content[0].content[0].type).toBe("paragraph");
  });

  test("should parse double-level collapse (##>)", () => {
    const input = `##> Level 2 Title
Content inside level 2
\\##>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("collapse");
    expect(result.content[0].size).toBe(2);
    expect(result.content[0].text).toEqual([{ text: "Level 2 Title" }]);
  });

  test("should parse triple-level collapse (###>)", () => {
    const input = `###> Level 3 Title
Content inside level 3
\\###>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("collapse");
    expect(result.content[0].size).toBe(3);
    expect(result.content[0].text).toEqual([{ text: "Level 3 Title" }]);
  });

  test("should parse multiple collapse levels in same document", () => {
    const input = `#> Level 1 Title
Content 1
\\#>

##> Level 2 Title
Content 2
\\##>

###> Level 3 Title
Content 3
\\###>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(3);

    // Check level 1
    expect(result.content[0].type).toBe("collapse");
    expect(result.content[0].size).toBe(1);
    expect(result.content[0].text).toEqual([{ text: "Level 1 Title" }]);

    // Check level 2
    expect(result.content[1].type).toBe("collapse");
    expect(result.content[1].size).toBe(2);
    expect(result.content[1].text).toEqual([{ text: "Level 2 Title" }]);

    // Check level 3
    expect(result.content[2].type).toBe("collapse");
    expect(result.content[2].size).toBe(3);
    expect(result.content[2].text).toEqual([{ text: "Level 3 Title" }]);
  });

  test("should parse simple collapse without size (|>)", () => {
    const input = `|> Simple Collapse
Simple content
\\|>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("collapse");
    expect(result.content[0].size).toBeUndefined();
    expect(result.content[0].text).toEqual([{ text: "Simple Collapse" }]);
  });

  test("should handle collapse with formatted text in title", () => {
    const input = `##> **Bold Title** with *italic* text
Content here
\\##>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("collapse");
    expect(result.content[0].size).toBe(2);
    // The text should be parsed as inline content, exact count depends on parser implementation
    expect(result.content[0].text.length).toBeGreaterThan(0);
    expect(result.content[0].text[0].text).toContain("Bold Title");
  });

  test("should handle collapse with multiline content", () => {
    const input = `#> Multi-line Collapse
First line of content
Second line of content

Third line after empty line
\\#>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("collapse");
    expect(result.content[0].size).toBe(1);
    expect(result.content[0].content.length).toBeGreaterThan(1);
  });

  test("should handle edge case with maximum hash levels", () => {
    const input = `######> Level 6 Title
Content inside level 6
\\######>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("collapse");
    expect(result.content[0].size).toBe(6);
    expect(result.content[0].text).toEqual([{ text: "Level 6 Title" }]);
  });

  test("should handle Korean/Unicode text in collapse", () => {
    const input = `#> 접을 수 있는 제목
제목 안의 본문
\\#>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("collapse");
    expect(result.content[0].size).toBe(1);
    expect(result.content[0].text).toEqual([{ text: "접을 수 있는 제목" }]);
  });

  test("should not parse incomplete collapse blocks", () => {
    const input = `#> Incomplete collapse
This should not be parsed as collapse because it's missing the end tag`;

    const result = parseNotedown(input);

    // Should be parsed as regular text/title, not collapse
    expect(result.content.some((item) => item.type === "collapse")).toBe(false);
  });

  test("should handle mixed collapse and regular content", () => {
    const input = `# Regular Title

Some regular text.

##> Collapse Section
Collapse content
\\##>

More regular text after collapse.`;

    const result = parseNotedown(input);

    // Should contain both regular content and one collapse block
    const collapseBlocks = result.content.filter(
      (item) => item.type === "collapse"
    );
    expect(collapseBlocks).toHaveLength(1);
    expect(collapseBlocks[0].size).toBe(2);

    // Should also contain other content types
    expect(result.content.length).toBeGreaterThan(1);
  });
});
