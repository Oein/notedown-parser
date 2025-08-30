import { describe, test, expect } from "bun:test";
import { parseNotedown } from "../src/parser";

describe("List Functionality", () => {
  test("should parse ordered lists", () => {
    const input = `1. First item
2. Second item
3. Third item`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("list");
    expect((result.content[0] as any).ordered).toBe(true);
    expect((result.content[0] as any).items).toHaveLength(3);
    expect((result.content[0] as any).items[0].content[0].text).toBe(
      "First item"
    );
    expect((result.content[0] as any).items[1].content[0].text).toBe(
      "Second item"
    );
    expect((result.content[0] as any).items[2].content[0].text).toBe(
      "Third item"
    );
  });

  test("should parse unordered lists with dash", () => {
    const input = `- First item
- Second item
- Third item`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("list");
    expect((result.content[0] as any).ordered).toBe(false);
    expect((result.content[0] as any).items).toHaveLength(3);
    expect((result.content[0] as any).items[0].content[0].text).toBe(
      "First item"
    );
  });

  test("should parse unordered lists with asterisk", () => {
    const input = `* First item
* Second item
* Third item`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("list");
    expect((result.content[0] as any).ordered).toBe(false);
    expect((result.content[0] as any).items).toHaveLength(3);
  });

  test("should parse unordered lists with plus", () => {
    const input = `+ First item
+ Second item
+ Third item`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("list");
    expect((result.content[0] as any).ordered).toBe(false);
    expect((result.content[0] as any).items).toHaveLength(3);
  });

  test("should parse lists with formatted content", () => {
    const input = `1. **Bold** item
2. *Italic* item
3. Regular item with \`code\``;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("list");
    expect((result.content[0] as any).ordered).toBe(true);
    expect((result.content[0] as any).items).toHaveLength(3);
    // First item should have formatted content (bold)
    expect((result.content[0] as any).items[0].content[0].format).toBe("bold");
  });

  test("should handle mixed content with lists", () => {
    const input = `# Title

Some text before the list.

1. First item
2. Second item

Some text after the list.`;

    const result = parseNotedown(input);

    expect(result.content.length).toBeGreaterThan(1);
    const listItem = result.content.find((item: any) => item.type === "list");
    expect(listItem).toBeTruthy();
    expect((listItem as any).ordered).toBe(true);
  });

  test("should not parse incomplete lists", () => {
    const input = `This is not a list
Just some regular text
1 This is also not a list item`;

    const result = parseNotedown(input);

    // Should be parsed as paragraph, not list
    expect(result.content.some((item: any) => item.type === "list")).toBe(
      false
    );
  });
});
