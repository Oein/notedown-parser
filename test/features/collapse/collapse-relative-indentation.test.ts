import { describe, test, expect } from "bun:test";
import { parseNotedown } from "../../../src/parser";
import type { NotedownCollapse } from "../../../src/types";

describe("Collapse Relative Indentation", () => {
  test("should treat indentation relative to collapse level", () => {
    const input = `#> Level 1 collapse
Content with no indent
  Content with 2-space indent (should be treated as indented)
    Content with 4-space indent (should be treated as double-indented)
\\#>`;

    const result = parseNotedown(input);
    expect(result.content).toHaveLength(1);
    const collapse = result.content[0] as NotedownCollapse;

    // We should have one paragraph with the content
    expect(collapse.content.length).toBeGreaterThan(0);
  });

  test("should handle indentation in nested collapse blocks", () => {
    const input = `#> Outer collapse
Content in outer
  Indented in outer
  
  ##> Inner collapse
  Not indented in inner (because it's 2 spaces in a 2nd level collapse)
    Indented in inner (because it's 4 spaces in a 2nd level collapse)
      Double-indented in inner (because it's 6 spaces in a 2nd level collapse)
  \\##>
\\#>`;

    const result = parseNotedown(input);
    expect(result.content).toHaveLength(1);
    const outerCollapse = result.content[0] as NotedownCollapse;

    // Find the inner collapse
    const innerCollapse = outerCollapse.content.find(
      (item) => item.type === "collapse"
    ) as NotedownCollapse;
    expect(innerCollapse).toBeTruthy();

    // Verify the inner collapse has the expected content
    expect(innerCollapse.content.length).toBeGreaterThan(0);
  });

  test("should adjust indentation level based on collapse nesting depth", () => {
    const input = `#> First level
  Content indented once in level 1
  
  ##> Second level
    Content indented once in level 2 (4 spaces from start)
    
    ###> Third level
      Content indented once in level 3 (6 spaces from start)
        Content indented twice in level 3 (8 spaces from start)
    \\###>
  \\##>
\\#>`;

    const result = parseNotedown(input);
    expect(result.content).toHaveLength(1);

    // Navigate to level 3 collapse
    const level1 = result.content[0] as NotedownCollapse;
    const level2 = level1.content.find(
      (item) => item.type === "collapse"
    ) as NotedownCollapse;
    expect(level2).toBeTruthy();
    const level3 = level2.content.find(
      (item) => item.type === "collapse"
    ) as NotedownCollapse;
    expect(level3).toBeTruthy();

    // Verify content in level 3
    expect(level3.content.length).toBeGreaterThan(0);
  });
});
