import { expect, test, describe } from "bun:test";
import { parseNotedown } from "../../../src/parser";

describe("Collapse Paragraph Consistency Tests", () => {
  test("should create separate paragraphs for entries with single empty lines in collapse content", () => {
    const ndText = `|> Test Collapse
  **Entry1** - First entry
  
  **Entry2** - Second entry
  
  **Entry3** - Third entry
\\|>`;

    const parsed = parseNotedown(ndText);

    expect(parsed.content).toHaveLength(1);
    expect(parsed.content[0].type).toBe("collapse");
    const collapse = parsed.content[0] as any;
    expect(collapse.content).toHaveLength(3);

    // Each entry should be its own paragraph
    for (let i = 0; i < 3; i++) {
      expect(collapse.content[i].type).toBe("paragraph");
      expect(collapse.content[i].content).toHaveLength(1);
      expect(collapse.content[i].content[0].type).toBe("text");
    }
  });

  test("should handle mixed single and double empty lines consistently in collapse content", () => {
    const ndText = `|> Mixed Line Breaks
  **Entry1** - Single empty line below
  
  **Entry2** - Double empty line below

  **Entry3** - Another single empty line below
  
  **Entry4** - Final entry
\\|>`;

    const parsed = parseNotedown(ndText);

    expect(parsed.content).toHaveLength(1);
    expect(parsed.content[0].type).toBe("collapse");
    const collapse = parsed.content[0] as any;
    expect(collapse.content).toHaveLength(4);

    // Each entry should be its own paragraph
    for (let i = 0; i < 4; i++) {
      expect(collapse.content[i].type).toBe("paragraph");
      expect(collapse.content[i].content).toHaveLength(1);
      expect(collapse.content[i].content[0].type).toBe("text");
    }
  });

  test("should not affect paragraph behavior in regular document content", () => {
    const ndText = `**Entry1** - First entry

**Entry2** - Second entry

**Entry3** - Third entry`;

    const parsed = parseNotedown(ndText);

    // In regular content, double empty lines create separate paragraphs
    expect(parsed.content).toHaveLength(3);
    expect(parsed.content[0].type).toBe("paragraph");
    expect(parsed.content[1].type).toBe("paragraph");
    expect(parsed.content[2].type).toBe("paragraph");

    // Each paragraph should have only one text item
    const firstParagraph = parsed.content[0] as any;
    expect(firstParagraph.content).toHaveLength(1);
    expect(firstParagraph.content[0].type).toBe("text");
  });

  test("should handle simple nested structure", () => {
    const ndText = `|> Simple Collapse
  **Entry1** - First entry
  
  **Entry2** - Second entry
\\|>`;

    const parsed = parseNotedown(ndText);

    expect(parsed.content).toHaveLength(1);
    expect(parsed.content[0].type).toBe("collapse");
    const outerCollapse = parsed.content[0] as any;
    expect(outerCollapse.content).toHaveLength(2); // Two separate entries

    // Each entry should be its own paragraph
    expect(outerCollapse.content[0].type).toBe("paragraph");
    expect(outerCollapse.content[1].type).toBe("paragraph");
  });
});
