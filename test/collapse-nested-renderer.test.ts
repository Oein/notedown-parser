import { describe, test, expect, beforeEach } from "bun:test";
import { parseNotedown } from "../src/parser";
import { NotedownRenderer } from "../src/renderer";
import { JSDOM } from "jsdom";

describe("Nested Collapse Rendering", () => {
  let dom: JSDOM;
  let document: Document;
  let renderer: NotedownRenderer;

  beforeEach(() => {
    dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
    document = dom.window.document;
    renderer = new NotedownRenderer(document);
  });

  test("should render nested collapse as a new Notedown document inside parent collapse", () => {
    const input = `#> Outer Collapse\nOuter content\n##> Inner Collapse\nInner content\n\\##>\n\\#>`;
    const parsed = parseNotedown(input);
    const htmlContainer = renderer.renderWithStyles(parsed);
    const detailsElements = htmlContainer.querySelectorAll(
      "details.notedown-collapse"
    );
    expect(detailsElements.length).toBe(2);
    // Outer collapse should contain inner collapse
    const outer = detailsElements[0];
    const inner = outer.querySelector("details.notedown-collapse-2");
    expect(inner).toBeTruthy();
    expect(inner?.querySelector("summary")?.textContent).toContain(
      "Inner Collapse"
    );
    expect(outer.querySelector("summary")?.textContent).toContain(
      "Outer Collapse"
    );
  });
});
