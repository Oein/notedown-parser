import { describe, test, expect, beforeEach } from "bun:test";
import { parseNotedown } from "../src/parser";
import { NotedownRenderer } from "../src/renderer";
import { JSDOM } from "jsdom";

describe("List and Collapse Integration", () => {
  let dom: JSDOM;
  let document: Document;
  let renderer: NotedownRenderer;

  beforeEach(() => {
    dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
    document = dom.window.document;
    renderer = new NotedownRenderer(document);
  });

  test("should render lists inside collapses", () => {
    const notedownContent = `#> Todo List
1. Buy groceries
2. Walk the dog
3. Finish project

- Milk
- Bread
- Eggs
\\#>`;

    const parsed = parseNotedown(notedownContent);
    const htmlContainer = renderer.renderWithStyles(parsed);
    const html = htmlContainer.innerHTML;

    // Should contain collapse elements
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    expect(html).toContain("Todo List");

    // Should contain both ordered and unordered lists inside the collapse
    expect(html).toContain("<ol");
    expect(html).toContain("<ul");
    expect(html).toContain("Buy groceries");
    expect(html).toContain("Milk");
  });

  test("should handle complex nested structures", () => {
    const notedownContent = `# Main Document

Regular paragraph text.

1. First main item
2. Second main item with **bold text**
3. Third main item

#> Collapsible Section
This section contains:

- Item A
- Item B with *italic*
- Item C

##> Nested Collapse
1. Nested ordered item 1
2. Nested ordered item 2
\\##>
\\#>

Final paragraph.`;

    const parsed = parseNotedown(notedownContent);
    const htmlContainer = renderer.renderWithStyles(parsed);
    const html = htmlContainer.innerHTML;

    // Check for title
    expect(html).toContain("<h1");
    expect(html).toContain("Main Document");

    // Check for main list (looking at the actual output format)
    expect(html).toContain("First main item");
    expect(html).toContain("<strong"); // HTML strong tag for bold

    // Check for collapse structures
    expect(html).toContain("Collapsible Section");
    expect(html).toContain("Nested Collapse");

    // Check for lists inside collapses
    expect(html).toContain("Item A");
    expect(html).toContain("Nested ordered item");

    // Verify structure integrity
    expect((html.match(/<details/g) || []).length).toBe(2); // Two collapse blocks
    expect((html.match(/<ol/g) || []).length).toBeGreaterThanOrEqual(2); // At least two ordered lists
    expect((html.match(/<ul/g) || []).length).toBeGreaterThanOrEqual(1); // At least one unordered list
  });
});
