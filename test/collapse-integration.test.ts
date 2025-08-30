import { describe, test, expect, beforeEach } from "bun:test";
import { parseNotedown } from "../src/parser";
import { NotedownRenderer } from "../src/renderer";
import { JSDOM } from "jsdom";

describe("Collapse Integration Tests", () => {
  let dom: JSDOM;
  let document: Document;
  let renderer: NotedownRenderer;

  beforeEach(() => {
    dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
    document = dom.window.document as any;
    renderer = new NotedownRenderer(document);
  });

  test("should handle complete collapse workflow from parsing to rendering", () => {
    const notedownContent = `# Main Title

Regular paragraph text.

#> Level 1 Collapse
This is level 1 content with **bold text**.
\\#>

##> Level 2 Collapse  
This is level 2 content with |f#blue,colored text|.
\\##>

###> Level 3 Collapse
This is level 3 content.
\\###>

|> Simple Collapse
Simple collapse without size.
\\|>

More regular text after collapses.`;

    // Parse the content
    const parsed = parseNotedown(notedownContent);

    // Verify parsing worked correctly
    const collapseBlocks = parsed.content.filter(
      (item) => item.type === "collapse"
    );
    expect(collapseBlocks).toHaveLength(4);

    // Check sizes
    expect(collapseBlocks[0].size).toBe(1);
    expect(collapseBlocks[1].size).toBe(2);
    expect(collapseBlocks[2].size).toBe(3);
    expect(collapseBlocks[3].size).toBeUndefined(); // Simple collapse

    // Render to HTML
    const htmlContainer = renderer.renderWithStyles(parsed);
    const html = htmlContainer.innerHTML;

    // Verify rendering
    expect(html).toContain('class="notedown-collapse notedown-collapse-1"');
    expect(html).toContain('class="notedown-collapse notedown-collapse-2"');
    expect(html).toContain('class="notedown-collapse notedown-collapse-3"');
    expect(html).toContain('data-size="1"');
    expect(html).toContain('data-size="2"');
    expect(html).toContain('data-size="3"');

    // Check that all collapse blocks are properly structured
    expect((html.match(/<details/g) || []).length).toBe(4);
    expect((html.match(/<summary/g) || []).length).toBe(4);
    expect(html).toContain("Level 1 Collapse");
    expect(html).toContain("Level 2 Collapse");
    expect(html).toContain("Level 3 Collapse");
    expect(html).toContain("Simple Collapse");

    // Verify CSS classes are applied correctly in HTML structure
    expect(html).toContain('class="notedown-collapse notedown-collapse-1"');
    expect(html).toContain('class="notedown-collapse notedown-collapse-2"');
    expect(html).toContain('class="notedown-collapse notedown-collapse-3"');
  });

  test("should properly handle nested content in collapse blocks", () => {
    const notedownContent = `##> Complex Collapse Block
This has **bold text** and *italic text*.

And some |f#red,colored text|.
\\##>`;

    const parsed = parseNotedown(notedownContent);

    const htmlContainer = renderer.renderWithStyles(parsed);
    const html = htmlContainer.innerHTML;

    // Should contain the collapse with proper size
    expect(html).toContain('data-size="2"');
    expect(html).toContain("notedown-collapse-2");

    // Should contain the formatted content with proper CSS classes
    expect(html).toContain("notedown-bold"); // Bold text with CSS class
    expect(html).toContain("notedown-italic"); // Italic text with CSS class
    expect(html).toContain("notedown-color"); // Colored text
    expect(html).toContain('style="color: red;"'); // Color styling
  });

  test("should handle multiple identical size levels", () => {
    const notedownContent = `##> First Level 2
Content 1
\\##>

##> Second Level 2
Content 2  
\\##>

##> Third Level 2
Content 3
\\##>`;

    const parsed = parseNotedown(notedownContent);
    const collapseBlocks = parsed.content.filter(
      (item) => item.type === "collapse"
    );

    expect(collapseBlocks).toHaveLength(3);
    expect(collapseBlocks.every((block) => block.size === 2)).toBe(true);

    const htmlContainer = renderer.renderWithStyles(parsed);
    const html = htmlContainer.innerHTML;

    // Should have 3 collapse blocks all with size 2
    expect((html.match(/data-size="2"/g) || []).length).toBe(3);
    expect((html.match(/notedown-collapse-2/g) || []).length).toBe(3);
  });
});
