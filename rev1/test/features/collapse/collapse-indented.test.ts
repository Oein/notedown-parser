import { describe, test, expect } from "bun:test";
import { parseNotedown } from "../../../src/parser";
import type { NotedownCollapse } from "../../../src/types";

describe("Collapse with Indentation", () => {
  test("should parse indented header collapse blocks", () => {
    const input = `  #> Indented Level 1
  Content inside indented level 1
  \\#>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("collapse");
    const collapse = result.content[0] as NotedownCollapse;
    expect(collapse.size).toBe(1);
    expect(collapse.text).toEqual([{ text: "Indented Level 1" }]);
    expect(collapse.content).toHaveLength(1);
    expect(collapse.content[0].type).toBe("paragraph");
  });

  test("should parse multiple levels of indented header collapse blocks", () => {
    const input = `    ##> Deeply Indented Level 2
    Content with deeper indentation
    \\##>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("collapse");
    const collapse = result.content[0] as NotedownCollapse;
    expect(collapse.size).toBe(2);
    expect(collapse.text).toEqual([{ text: "Deeply Indented Level 2" }]);
  });

  test("should parse indented simple collapse blocks", () => {
    const input = `      |> Indented Simple Collapse
      Simple indented content
      \\|>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("collapse");
    const collapse = result.content[0] as NotedownCollapse;
    expect(collapse.size).toBeUndefined();
    expect(collapse.text).toEqual([{ text: "Indented Simple Collapse" }]);
  });

  test("should handle mixed indented and non-indented collapse blocks", () => {
    const input = `#> Non-indented collapse
Content here
\\#>

  ##> Indented collapse
  Indented content
  \\##>

    |> Deep indented simple
    Deep content  
    \\|>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(3);

    // Check non-indented collapse
    expect(result.content[0].type).toBe("collapse");
    const collapse1 = result.content[0] as NotedownCollapse;
    expect(collapse1.size).toBe(1);
    expect(collapse1.text).toEqual([{ text: "Non-indented collapse" }]);

    // Check indented header collapse
    expect(result.content[1].type).toBe("collapse");
    const collapse2 = result.content[1] as NotedownCollapse;
    expect(collapse2.size).toBe(2);
    expect(collapse2.text).toEqual([{ text: "Indented collapse" }]);

    // Check deep indented simple collapse
    expect(result.content[2].type).toBe("collapse");
    const collapse3 = result.content[2] as NotedownCollapse;
    expect(collapse3.size).toBeUndefined();
    expect(collapse3.text).toEqual([{ text: "Deep indented simple" }]);
  });

  test("should handle indented collapse blocks with varying indentation levels", () => {
    const input = `  #> Two spaces
Content
\\#>

    ##> Four spaces  
Content
\\##>

        ###> Eight spaces
Content
\\###>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(3);

    expect(result.content[0].type).toBe("collapse");
    const collapse1 = result.content[0] as NotedownCollapse;
    expect(collapse1.size).toBe(1);

    expect(result.content[1].type).toBe("collapse");
    const collapse2 = result.content[1] as NotedownCollapse;
    expect(collapse2.size).toBe(2);

    expect(result.content[2].type).toBe("collapse");
    const collapse3 = result.content[2] as NotedownCollapse;
    expect(collapse3.size).toBe(3);
  });

  test("should handle indented collapse blocks with formatted text in titles", () => {
    const input = `    ##> **Bold Indented** and *italic* text
    Content with formatting
    \\##>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("collapse");
    const collapse = result.content[0] as NotedownCollapse;
    expect(collapse.size).toBe(2);
    // The text should be parsed as inline content
    expect(collapse.text.length).toBeGreaterThan(0);
    const firstTextNode = collapse.text[0] as any;
    expect(firstTextNode.text).toContain("Bold Indented");
  });

  test("should not parse inline collapse blocks that don't start at line beginning", () => {
    const input = `Some text #> This should not be a collapse
More content
\\#> This is also not a collapse`;

    const result = parseNotedown(input);

    // Should be parsed as regular paragraph, not collapse
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("paragraph");
    expect(result.content.some((item) => item.type === "collapse")).toBe(false);
  });

  test("should handle tab indentation for collapse blocks", () => {
    const input = `\t#> Tab indented collapse
\tTab indented content
\t\\#>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("collapse");
    const collapse = result.content[0] as NotedownCollapse;
    expect(collapse.size).toBe(1);
    expect(collapse.text).toEqual([{ text: "Tab indented collapse" }]);
  });
});
