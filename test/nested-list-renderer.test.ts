import { describe, test, expect, beforeEach } from "bun:test";
import { JSDOM } from "jsdom";
import { parseNotedown } from "../src/parser";
import { NotedownRenderer } from "../src/renderer";

describe("Nested List Renderer", () => {
  let dom: JSDOM;
  let document: Document;
  let renderer: NotedownRenderer;

  beforeEach(() => {
    dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
    document = dom.window.document;
    (global as any).document = document;
    renderer = new NotedownRenderer(document);
  });

  test("should render nested ordered lists correctly", () => {
    const input = `1. First item
  1. Nested item A
  2. Nested item B
2. Second item`;

    const parsed = parseNotedown(input);
    const element = renderer.render(parsed);

    // Should have main ordered list
    const mainList = element.querySelector("ol.notedown-list-ordered");
    expect(mainList).not.toBeNull();

    // Should have 2 direct children (main items)
    const directChildren = Array.from(mainList?.children || []).filter(
      (child) => child.tagName === "LI"
    );
    expect(directChildren.length).toBe(2);

    // First item should have nested list
    const firstItem = directChildren[0] as HTMLElement;
    const nestedList = firstItem.querySelector("ol.notedown-list-ordered");
    expect(nestedList).not.toBeNull();

    // Nested list should have 2 direct children
    const nestedChildren = Array.from(nestedList?.children || []).filter(
      (child) => child.tagName === "LI"
    );
    expect(nestedChildren.length).toBe(2);
  });

  test("should render mixed nested lists correctly", () => {
    const input = `- First unordered item
  1. Nested ordered A
  2. Nested ordered B
- Second unordered item`;

    const parsed = parseNotedown(input);
    const element = renderer.render(parsed);

    // Main list should be unordered
    const mainList = element.querySelector("ul.notedown-list-unordered");
    expect(mainList).not.toBeNull();

    // First item should have nested ordered list
    const firstItem = mainList?.querySelector("li.notedown-list-item");
    const nestedList = firstItem?.querySelector("ol.notedown-list-ordered");
    expect(nestedList).not.toBeNull();

    // Nested list should have 2 items
    const nestedItems = nestedList?.querySelectorAll("li.notedown-list-item");
    expect(nestedItems?.length).toBe(2);
  });

  test("should render deeply nested lists correctly", () => {
    const input = `1. Level 1
  - Level 2
    1. Level 3
2. Another level 1`;

    const parsed = parseNotedown(input);
    const element = renderer.render(parsed);

    // Check main ordered list exists
    const mainList = element.querySelector("ol.notedown-list-ordered");
    expect(mainList).not.toBeNull();

    // Check level 2 unordered list exists
    const level2List = mainList?.querySelector("ul.notedown-list-unordered");
    expect(level2List).not.toBeNull();

    // Check level 3 ordered list exists
    const level3List = level2List?.querySelector("ol.notedown-list-ordered");
    expect(level3List).not.toBeNull();
  });

  test("should preserve list CSS classes for nested lists", () => {
    const input = `1. Item
  - Nested item`;

    const parsed = parseNotedown(input);
    const elementWithStyles = renderer.renderWithStyles(parsed);

    // CSS is now handled by external notedown-theme.css, not inline
    // Just check that the HTML structure and classes are correct

    // Check list elements have correct classes
    const orderedList = elementWithStyles.querySelector("ol");
    expect(orderedList?.classList.contains("notedown-list")).toBe(true);
    expect(orderedList?.classList.contains("notedown-list-ordered")).toBe(true);

    const unorderedList = elementWithStyles.querySelector("ul");
    expect(unorderedList?.classList.contains("notedown-list")).toBe(true);
    expect(unorderedList?.classList.contains("notedown-list-unordered")).toBe(
      true
    );

    // Check that list items have correct classes
    const listItems = elementWithStyles.querySelectorAll("li");
    listItems.forEach((item) => {
      expect(item.classList.contains("notedown-list-item")).toBe(true);
    });
  });
});
