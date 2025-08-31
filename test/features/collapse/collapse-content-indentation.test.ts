import { describe, test, expect } from "bun:test";
import { parseNotedown } from "../../../src/parser";
import type { NotedownCollapse } from "../../../src/types";

describe("Collapse Content Indentation", () => {
  test("should preserve indentation in collapse content", () => {
    const input = `#> Collapse with indented content
    This line should be indented
      This line should be double-indented
        This line should be triple-indented
\\#>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("collapse");
    const collapse = result.content[0] as NotedownCollapse;

    // The content should be preserved with indentation
    expect(collapse.content).toHaveLength(1);
    expect(collapse.content[0].type).toBe("paragraph");

    // The paragraph should contain the indented content
    const paragraph = collapse.content[0] as any;
    expect(paragraph.content[0].content[0].text).toContain(
      "This line should be indented"
    );
  });

  test("should handle nested collapse blocks with indentation", () => {
    const input = `#> Outer collapse
    Content in outer collapse
    
    ##> Inner collapse
        This content should be indented in inner collapse
        This is still indented in inner collapse
    \\##>
    
    Back to outer collapse content
\\#>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("collapse");

    const outerCollapse = result.content[0] as NotedownCollapse;
    expect(outerCollapse.content.length).toBeGreaterThan(1);

    // Find the inner collapse
    const innerCollapse = outerCollapse.content.find(
      (item) => item.type === "collapse"
    ) as NotedownCollapse;

    expect(innerCollapse).toBeTruthy();
    expect(innerCollapse.size).toBe(2);
    expect(innerCollapse.content).toHaveLength(1);

    // Verify indentation is preserved in inner collapse
    const paragraph = innerCollapse.content[0] as any;
    expect(paragraph.content[0].content[0].text).toContain(
      "This content should be indented in inner collapse"
    );
  });

  test("should respect list indentation in collapse blocks", () => {
    const input = `#> Collapse with list
1. First level item
    - Second level item
        * Third level item
            + Fourth level item
2. Another first level item
\\#>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("collapse");

    const collapse = result.content[0] as NotedownCollapse;

    // The content should have a list
    expect(collapse.content.some((item) => item.type === "list")).toBe(true);

    // Find the list
    const list = collapse.content.find((item) => item.type === "list") as any;
    expect(list.ordered).toBe(true);
    expect(list.items.length).toBe(2);

    // Check that the first item has nested content
    expect(list.items[0].nested).toBeTruthy();
    expect(list.items[0].nested[0].items.length).toBe(1);

    // Check the second level of nesting
    const secondLevelItem = list.items[0].nested[0].items[0];
    expect(secondLevelItem.nested).toBeTruthy();
  });

  test("should handle Korean indented content in collapse", () => {
    const input = `#> 한글 접힘 블록
    들여쓰기된 한글 내용
      더 들여쓰기된 내용
\\#>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("collapse");

    const collapse = result.content[0] as NotedownCollapse;
    expect(collapse.content).toHaveLength(1);

    const paragraph = collapse.content[0] as any;
    expect(paragraph.content[0].content[0].text).toContain(
      "들여쓰기된 한글 내용"
    );
  });

  test("should handle the indentation in multiple nested collapses", () => {
    const input = `#> Level 1 collapse
    Content in level 1
    
    ##> Level 2 collapse
        Content in level 2 with indentation
        
        ###> Level 3 collapse
            Content in level 3 with even more indentation
                This line has extra indentation
        \\###>
        
        Back to level 2
    \\##>
    
    Back to level 1
\\#>`;

    const result = parseNotedown(input);

    expect(result.content).toHaveLength(1);
    const level1 = result.content[0] as NotedownCollapse;

    // Find level 2 collapse
    const level2 = level1.content.find(
      (item) => item.type === "collapse"
    ) as NotedownCollapse;
    expect(level2).toBeTruthy();

    // Find level 3 collapse
    const level3 = level2.content.find(
      (item) => item.type === "collapse"
    ) as NotedownCollapse;
    expect(level3).toBeTruthy();

    // Verify indentation is preserved in level 3
    const paragraph = level3.content[0] as any;
    expect(paragraph.content[0].content[0].text).toContain(
      "Content in level 3 with even more indentation"
    );
  });
});
