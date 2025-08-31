import { describe, test, expect } from "bun:test";
import { parseNotedown } from "../../../src/parser";
import { NotedownRenderer } from "../../../src/renderer";
import { JSDOM } from "jsdom";

describe("Escape Algorithm Tests", () => {
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
  const document = (dom.window as any).document;
  const renderer = new NotedownRenderer(document);

  describe("Bold formatting with escaped asterisks", () => {
    test("should handle escaped asterisks at the end of bold text (Korean)", () => {
      const content = `**박\\*\\***`;
      const result = parseNotedown(content);
      const htmlContainer = renderer.renderWithStyles(result);
      const html = htmlContainer.innerHTML;

      // Should contain the escaped asterisks as literal text
      expect(html).toContain('<strong class="notedown-bold">박**</strong>');
      expect(html).not.toContain("\\"); // Should not contain backslashes
    });

    test("should handle escaped asterisks at the end of bold text (English)", () => {
      const content = `**test\\*\\***`;
      const result = parseNotedown(content);
      const htmlContainer = renderer.renderWithStyles(result);
      const html = htmlContainer.innerHTML;

      // Should contain the escaped asterisks as literal text
      expect(html).toContain('<strong class="notedown-bold">test**</strong>');
      expect(html).not.toContain("\\"); // Should not contain backslashes
    });

    test("should handle single escaped asterisk in bold text", () => {
      const content = `**test\\*more**`;
      const result = parseNotedown(content);
      const htmlContainer = renderer.renderWithStyles(result);
      const html = htmlContainer.innerHTML;

      expect(html).toContain(
        '<strong class="notedown-bold">test*more</strong>'
      );
      expect(html).not.toContain("\\");
    });

    test("should handle multiple escaped asterisks in bold text", () => {
      const content = `**start\\*middle\\*end**`;
      const result = parseNotedown(content);
      const htmlContainer = renderer.renderWithStyles(result);
      const html = htmlContainer.innerHTML;

      expect(html).toContain(
        '<strong class="notedown-bold">start*middle*end</strong>'
      );
      expect(html).not.toContain("\\");
    });

    test("should handle mixed escaped and unescaped content", () => {
      const content = `**bold \\*\\*not bold formatting\\*\\* more bold**`;
      const result = parseNotedown(content);
      const htmlContainer = renderer.renderWithStyles(result);
      const html = htmlContainer.innerHTML;

      expect(html).toContain(
        '<strong class="notedown-bold">bold **not bold formatting** more bold</strong>'
      );
      expect(html).not.toContain("\\");
    });
  });

  describe("Italic formatting with escaped asterisks", () => {
    test("should handle escaped asterisks in italic text", () => {
      const content = `*italic\\*text*`;
      const result = parseNotedown(content);
      const htmlContainer = renderer.renderWithStyles(result);
      const html = htmlContainer.innerHTML;

      expect(html).toContain('<em class="notedown-italic">italic*text</em>');
      expect(html).not.toContain("\\");
    });
  });

  describe("Fully escaped formatting", () => {
    test("should not format completely escaped asterisks", () => {
      const content = `\\*\\*not bold\\*\\*`;
      const result = parseNotedown(content);
      const htmlContainer = renderer.renderWithStyles(result);
      const html = htmlContainer.innerHTML;

      expect(html).toContain("**not bold**");
      expect(html).not.toContain("<strong");
      expect(html).not.toContain("\\");
    });

    test("should handle mixed escaped and formatted text", () => {
      const content = `\\*\\*escaped\\*\\* and **bold** text`;
      const result = parseNotedown(content);
      const htmlContainer = renderer.renderWithStyles(result);
      const html = htmlContainer.innerHTML;

      expect(html).toContain("**escaped**");
      expect(html).toContain('<strong class="notedown-bold">bold</strong>');
      expect(html).not.toContain("\\");
    });
  });
});
