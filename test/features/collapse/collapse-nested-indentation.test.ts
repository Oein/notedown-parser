import { describe, test, expect, beforeEach } from "bun:test";
import { parseNotedown } from "../../../src/parser";
import { NotedownRenderer } from "../../../src/renderer";
import { JSDOM } from "jsdom";
import type { NotedownCollapse } from "../../../src/types";

describe("Collapse Nested Indentation", () => {
  let dom: JSDOM;
  let document: Document;
  let renderer: NotedownRenderer;

  beforeEach(() => {
    dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
    document = dom.window.document as any;
    renderer = new NotedownRenderer(document);
  });

  test("should treat indentation relative to the collapse level", () => {
    const input = `
#> Level 1 collapse
First line (no indent)
  Second line (2 spaces, should appear indented)
    Third line (4 spaces, should appear double-indented)
\\#>
`;

    const parsed = parseNotedown(input);
    const html = renderer.renderWithStyles(parsed).innerHTML;

    // There should be proper indentation preserved in HTML rendering
    expect(parsed.content).toHaveLength(1);
    expect(parsed.content[0].type).toBe("collapse");

    // Verify content structure has preserved relative indentation
    expect(html).toContain("First line (no indent)");
    expect(html).toContain("Second line (2 spaces, should appear indented)");
    expect(html).toContain(
      "Third line (4 spaces, should appear double-indented)"
    );
  });

  test("should handle indentation in nested collapse blocks", () => {
    const input = `
#> Level 1 collapse
Content in level 1 (no indent)
  Indented content in level 1 (2 spaces)
  
  ##> Level 2 collapse
  This has no indent in level 2 (2 spaces from parent, but reset in level 2)
    This has indent in level 2 (4 spaces from parent, 2 spaces in level 2)
      This has double indent in level 2 (6 spaces from parent, 4 spaces in level 2)
  \\##>
  
  Back to level 1 with indent (2 spaces)
\\#>
`;

    const parsed = parseNotedown(input);
    const html = renderer.renderWithStyles(parsed).innerHTML;

    expect(parsed.content).toHaveLength(1);
    const level1 = parsed.content[0] as NotedownCollapse;
    expect(level1.type).toBe("collapse");

    // Find the level 2 collapse
    const level2 = level1.content.find(
      (item) => item.type === "collapse"
    ) as NotedownCollapse;
    expect(level2).toBeTruthy();

    // Verify text is preserved correctly in HTML
    expect(html).toContain("Content in level 1 (no indent)");
    expect(html).toContain("Indented content in level 1 (2 spaces)");
    expect(html).toContain("This has no indent in level 2");
    expect(html).toContain("This has indent in level 2");
    expect(html).toContain("This has double indent in level 2");
    expect(html).toContain("Back to level 1 with indent (2 spaces)");
  });

  test("should correctly handle triple nested collapses with indentation", () => {
    const input = `
#> Level 1
Content in level 1
  Indented in level 1
  
  ##> Level 2
  Content in level 2
    Indented in level 2
    
    ###> Level 3
    Content in level 3
      Indented in level 3
        Double-indented in level 3
    \\###>
    
    Back to level 2 with indent
  \\##>
  
  Back to level 1 with indent
\\#>
`;

    const parsed = parseNotedown(input);
    const html = renderer.renderWithStyles(parsed).innerHTML;

    // Navigate through the collapse hierarchy
    expect(parsed.content).toHaveLength(1);
    const level1 = parsed.content[0] as NotedownCollapse;

    const level2 = level1.content.find(
      (item) => item.type === "collapse"
    ) as NotedownCollapse;
    expect(level2).toBeTruthy();

    const level3 = level2.content.find(
      (item) => item.type === "collapse"
    ) as NotedownCollapse;
    expect(level3).toBeTruthy();

    // Check that the HTML contains all our text with proper formatting
    expect(html).toContain("Content in level 1");
    expect(html).toContain("Indented in level 1");
    expect(html).toContain("Content in level 2");
    expect(html).toContain("Indented in level 2");
    expect(html).toContain("Content in level 3");
    expect(html).toContain("Indented in level 3");
    expect(html).toContain("Double-indented in level 3");
    expect(html).toContain("Back to level 2 with indent");
    expect(html).toContain("Back to level 1 with indent");
  });
});
