import { describe, test, expect, beforeEach } from "bun:test";
import { NotedownRenderer } from "../src/renderer";
import { JSDOM } from "jsdom";

describe("Collapse Renderer with Size", () => {
  let dom: JSDOM;
  let document: Document;
  let renderer: NotedownRenderer;

  beforeEach(() => {
    // Create a fake DOM environment for testing
    dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
    document = dom.window.document;
    renderer = new NotedownRenderer(document);
  });

  test("should render collapse with size-specific CSS classes", () => {
    const testData = {
      content: [
        {
          type: "collapse",
          size: 1,
          text: [{ text: "Level 1 Collapse" }],
          content: [
            {
              type: "text",
              content: [{ text: "Content inside level 1" }],
            },
          ],
        },
        {
          type: "collapse",
          size: 2,
          text: [{ text: "Level 2 Collapse" }],
          content: [
            {
              type: "text",
              content: [{ text: "Content inside level 2" }],
            },
          ],
        },
        {
          type: "collapse",
          size: 3,
          text: [{ text: "Level 3 Collapse" }],
          content: [
            {
              type: "text",
              content: [{ text: "Content inside level 3" }],
            },
          ],
        },
      ],
    };

    const result = renderer.renderWithStyles(testData);
    const html = result.innerHTML;

    // Check that size-specific CSS classes are applied
    expect(html).toContain('class="notedown-collapse notedown-collapse-1"');
    expect(html).toContain('class="notedown-collapse notedown-collapse-2"');
    expect(html).toContain('class="notedown-collapse notedown-collapse-3"');

    // Check that data-size attributes are set
    expect(html).toContain('data-size="1"');
    expect(html).toContain('data-size="2"');
    expect(html).toContain('data-size="3"');

    // Check that details/summary elements are created
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    expect((html.match(/<details/g) || []).length).toBe(3);
  });

  test("should render simple collapse without size", () => {
    const testData = {
      content: [
        {
          type: "collapse",
          text: [{ text: "Simple Collapse" }],
          content: [
            {
              type: "text",
              content: [{ text: "Simple content" }],
            },
          ],
        },
      ],
    };

    const result = renderer.renderWithStyles(testData);
    const html = result.innerHTML;

    // Should have basic collapse class but no size-specific class like notedown-collapse-1
    expect(html).toContain('class="notedown-collapse"');
    expect(html).not.toContain("notedown-collapse-1");
    expect(html).not.toContain("notedown-collapse-2");
    expect(html).not.toContain("notedown-collapse-3");
    expect(html).not.toContain("data-size=");
  });

  test("should include size-specific CSS styles", () => {
    const testData = {
      content: [
        {
          type: "collapse",
          size: 1,
          text: [{ text: "Test" }],
          content: [],
        },
      ],
    };

    const result = renderer.renderWithStyles(testData);

    // Check that the style element is present in the document head
    const styleElement = document.getElementById("notedown-default-styles");
    expect(styleElement).toBeTruthy();

    const styleContent = styleElement!.textContent || "";

    // Check for size-specific CSS rules
    expect(styleContent).toContain(".notedown-collapse-1");
    expect(styleContent).toContain(".notedown-collapse-2");
    expect(styleContent).toContain(".notedown-collapse-3");
    expect(styleContent).toContain("margin: 1em 0");
  });

  test("should render collapse with proper nesting structure", () => {
    const testData = {
      content: [
        {
          type: "collapse",
          size: 2,
          text: [{ text: "Test Collapse" }],
          content: [
            {
              type: "text",
              content: [{ text: "Test content" }],
            },
          ],
        },
      ],
    };

    const result = renderer.renderWithStyles(testData);
    const detailsElement = result.querySelector("details");

    expect(detailsElement).toBeTruthy();
    expect(detailsElement?.classList.contains("notedown-collapse")).toBe(true);
    expect(detailsElement?.classList.contains("notedown-collapse-2")).toBe(
      true
    );
    expect(detailsElement?.getAttribute("data-size")).toBe("2");

    const summaryElement = detailsElement?.querySelector("summary");
    expect(summaryElement).toBeTruthy();
    expect(summaryElement?.classList.contains("notedown-collapse-title")).toBe(
      true
    );
    expect(summaryElement?.textContent?.trim()).toBe("Test Collapse");

    const contentElement = detailsElement?.querySelector(
      ".notedown-collapse-content"
    );
    expect(contentElement).toBeTruthy();
  });
});
