import { describe, test, expect } from "bun:test";
import { parseNotedown } from "../src/parser";

describe("Nested and Mixed List Functionality", () => {
  test("should parse nested ordered lists", () => {
    const input = `1. First item
  1. Nested item A
  2. Nested item B
2. Second item
3. Third item`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("list");
    expect((result.content[0] as any).ordered).toBe(true);
    expect((result.content[0] as any).items).toHaveLength(3);

    // Check first item has nested list
    const firstItem = (result.content[0] as any).items[0];
    expect(firstItem.nested).toBeDefined();
    expect(firstItem.nested).toHaveLength(1);
    expect(firstItem.nested[0].type).toBe("list");
    expect(firstItem.nested[0].ordered).toBe(true);
    expect(firstItem.nested[0].items).toHaveLength(2);
  });

  test("should parse nested unordered lists", () => {
    const input = `- First item
  - Nested item A
  - Nested item B
- Second item
- Third item`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("list");
    expect((result.content[0] as any).ordered).toBe(false);

    // Check first item has nested list
    const firstItem = (result.content[0] as any).items[0];
    expect(firstItem.nested).toBeDefined();
    expect(firstItem.nested[0].ordered).toBe(false);
    expect(firstItem.nested[0].items).toHaveLength(2);
  });

  test("should parse mixed nested lists (ordered inside unordered)", () => {
    const input = `- First item
  1. Nested ordered A
  2. Nested ordered B
- Second item
- Third item`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    const mainList = result.content[0] as any;
    expect(mainList.type).toBe("list");
    expect(mainList.ordered).toBe(false);

    // Check first item has nested ordered list
    const firstItem = mainList.items[0];
    expect(firstItem.nested).toBeDefined();
    expect(firstItem.nested[0].ordered).toBe(true);
    expect(firstItem.nested[0].items).toHaveLength(2);
  });

  test("should parse mixed nested lists (unordered inside ordered)", () => {
    const input = `1. First item
  - Nested unordered A
  - Nested unordered B
2. Second item
3. Third item`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    const mainList = result.content[0] as any;
    expect(mainList.type).toBe("list");
    expect(mainList.ordered).toBe(true);

    // Check first item has nested unordered list
    const firstItem = mainList.items[0];
    expect(firstItem.nested).toBeDefined();
    expect(firstItem.nested[0].ordered).toBe(false);
    expect(firstItem.nested[0].items).toHaveLength(2);
  });

  test("should parse deeply nested lists", () => {
    const input = `1. Level 1 item
  - Level 2 item
    1. Level 3 item A
    2. Level 3 item B
  - Level 2 item 2
2. Another level 1 item`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    const mainList = result.content[0] as any;
    expect(mainList.ordered).toBe(true);

    // Check level 1 -> level 2
    const firstItem = mainList.items[0];
    expect(firstItem.nested).toBeDefined();
    expect(firstItem.nested[0].ordered).toBe(false);
    expect(firstItem.nested[0].items).toHaveLength(2);

    // Check level 2 -> level 3
    const level2FirstItem = firstItem.nested[0].items[0];
    expect(level2FirstItem.nested).toBeDefined();
    expect(level2FirstItem.nested[0].ordered).toBe(true);
    expect(level2FirstItem.nested[0].items).toHaveLength(2);
  });

  test("should handle different bullet types in same document", () => {
    const input = `- First dash item
* First asterisk item
+ First plus item
- Second dash item`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    const list = result.content[0] as any;
    expect(list.type).toBe("list");
    expect(list.ordered).toBe(false);
    expect(list.items).toHaveLength(4);
  });

  test("should separate different list types into different lists", () => {
    const input = `1. Ordered item 1
2. Ordered item 2

- Unordered item 1
- Unordered item 2`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(2);

    // First should be ordered list
    const firstList = result.content[0] as any;
    expect(firstList.type).toBe("list");
    expect(firstList.ordered).toBe(true);
    expect(firstList.items).toHaveLength(2);

    // Second should be unordered list
    const secondList = result.content[1] as any;
    expect(secondList.type).toBe("list");
    expect(secondList.ordered).toBe(false);
    expect(secondList.items).toHaveLength(2);
  });

  test("should handle lists with formatted content", () => {
    const input = `1. **Bold** item
  - *Italic* nested item
  - [Link](https://example.com) item
2. Normal item`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    const mainList = result.content[0] as any;

    // Check first item has formatted content
    const firstItem = mainList.items[0];
    expect(firstItem.content[0].format).toBe("bold");

    // Check nested items have formatting
    const nestedList = firstItem.nested[0];
    expect(nestedList.items[0].content[0].format).toBe("italic");
    expect(nestedList.items[1].content[0].link).toBe("https://example.com");
  });
});
