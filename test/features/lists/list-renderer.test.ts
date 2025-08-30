import { describe, test, expect, beforeEach } from "bun:test";
import { NotedownRenderer } from "../../../src/renderer";
import { JSDOM } from "jsdom";

describe("List Renderer", () => {
  let dom: JSDOM;
  let document: Document;
  let renderer: NotedownRenderer;

  beforeEach(() => {
    dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
    document = dom.window.document;
    renderer = new NotedownRenderer(document);
  });

  test("should render ordered list", () => {
    const testData = {
      content: [
        {
          type: "list",
          ordered: true,
          items: [
            { type: "list-item", content: [{ text: "First item" }] },
            { type: "list-item", content: [{ text: "Second item" }] },
            { type: "list-item", content: [{ text: "Third item" }] },
          ],
        },
      ],
    };

    const result = renderer.renderWithStyles(testData);
    const html = result.innerHTML;

    expect(html).toContain("<ol");
    expect(html).toContain("notedown-list");
    expect(html).toContain("notedown-list-ordered");
    expect(html).toContain("First item");
    expect(html).toContain("Second item");
    expect(html).toContain("Third item");
    expect((html.match(/<li/g) || []).length).toBe(3);
  });

  test("should render unordered list", () => {
    const testData = {
      content: [
        {
          type: "list",
          ordered: false,
          items: [
            { type: "list-item", content: [{ text: "First item" }] },
            { type: "list-item", content: [{ text: "Second item" }] },
          ],
        },
      ],
    };

    const result = renderer.renderWithStyles(testData);
    const html = result.innerHTML;

    expect(html).toContain("<ul");
    expect(html).toContain("notedown-list");
    expect(html).toContain("notedown-list-unordered");
    expect(html).toContain("First item");
    expect(html).toContain("Second item");
    expect((html.match(/<li/g) || []).length).toBe(2);
  });

  test("should render list with formatted content", () => {
    const testData = {
      content: [
        {
          type: "list",
          ordered: true,
          items: [
            {
              type: "list-item",
              content: [
                { format: "bold", content: [{ text: "Bold" }] },
                { text: " item" },
              ],
            },
            {
              type: "list-item",
              content: [
                { format: "italic", content: [{ text: "Italic" }] },
                { text: " item" },
              ],
            },
          ],
        },
      ],
    };

    const result = renderer.renderWithStyles(testData);
    const html = result.innerHTML;

    expect(html).toContain("<strong");
    expect(html).toContain("<em");
    expect(html).toContain("Bold");
    expect(html).toContain("Italic");
  });

  test("should include list CSS classes", () => {
    const testData = {
      content: [
        {
          type: "list",
          ordered: true,
          items: [{ type: "list-item", content: [{ text: "Test" }] }],
        },
      ],
    };

    const result = renderer.renderWithStyles(testData);

    // CSS is now handled by external notedown-theme.css
    // Check that correct classes are applied to HTML elements
    const listElement = result.querySelector("ol");
    expect(listElement).toBeTruthy();
    expect(listElement?.classList.contains("notedown-list")).toBe(true);
    expect(listElement?.classList.contains("notedown-list-ordered")).toBe(true);

    const listItemElement = result.querySelector("li");
    expect(listItemElement).toBeTruthy();
    expect(listItemElement?.classList.contains("notedown-list-item")).toBe(
      true
    );
  });
});
