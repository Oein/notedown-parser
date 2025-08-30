import { describe, it, expect, beforeAll } from "bun:test";
import { parseNotedown } from "../src/index.js";
import { JSDOM } from "jsdom";
import { NotedownRenderer } from "../src/renderer.js";

describe("Additional Escape Pattern Tests", () => {
  let renderer;

  beforeAll(() => {
    // Setup JSDOM environment for testing
    const dom = new JSDOM(
      "<!DOCTYPE html><html><head></head><body></body></html>"
    );
    global.document = dom.window.document;
    global.window = dom.window;

    renderer = new NotedownRenderer();
  });

  describe("Italic Formatting Escape Tests", () => {
    it("should handle escaped asterisks preventing italic formatting", () => {
      const content = `\\*not italic\\*`;
      const result = parseNotedown(content);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("paragraph");

      const textContent = result.content[0].content[0].content;
      // Should not contain italic formatting
      expect(
        textContent.every((item) => !item.format || item.format !== "italic")
      ).toBe(true);
      // Should contain literal asterisks
      expect(textContent.some((item) => item.text === "*")).toBe(true);
    });

    it("should handle mixed escaped and unescaped asterisks", () => {
      const content = `\\*escaped* but *still italic* and \\*escaped again\\*`;
      const result = parseNotedown(content);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("paragraph");

      const textContent = result.content[0].content[0].content;
      // Should contain italic formatting for unescaped part
      expect(textContent.some((item) => item.format === "italic")).toBe(true);
      // Should contain literal asterisks from escaped parts
      expect(textContent.some((item) => item.text === "*")).toBe(true);
    });
  });

  describe("Complex Nested Escape Scenarios", () => {
    it("should handle escape sequences within different formatting levels", () => {
      const content = `**Bold with \\*escaped asterisk\\* and *italic with \\*escaped\\** more bold**`;
      const result = parseNotedown(content);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("paragraph");

      const textContent = result.content[0].content[0].content;
      // The complex parsing may create multiple text elements due to italic conflicts
      expect(textContent.length).toBeGreaterThanOrEqual(1);

      // Should find bold formatting somewhere in the result
      let hasBold = false;
      let hasEscapedAsterisks = false;

      function checkContent(items) {
        items.forEach((item) => {
          if (item.format === "bold") {
            hasBold = true;
            if (item.content) {
              checkContent(item.content);
            }
          }
          if (item.text === "*") {
            hasEscapedAsterisks = true;
          }
          if (item.content && Array.isArray(item.content)) {
            checkContent(item.content);
          }
        });
      }

      checkContent(textContent);

      expect(hasBold).toBe(true);
      expect(hasEscapedAsterisks).toBe(true);
    });

    it("should handle escaped sequences at formatting boundaries", () => {
      const content = `**\\*start and end\\***`;
      const result = parseNotedown(content);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("paragraph");

      const textContent = result.content[0].content[0].content;
      // The parsing may create multiple elements due to boundary handling
      expect(textContent.length).toBeGreaterThanOrEqual(1);

      // Should find bold formatting somewhere
      let hasBold = false;
      let hasEscapedAsterisks = false;

      function checkContent(items) {
        items.forEach((item) => {
          if (item.format === "bold") {
            hasBold = true;
            if (item.content) {
              checkContent(item.content);
            }
          }
          if (item.text === "*") {
            hasEscapedAsterisks = true;
          }
          if (item.content && Array.isArray(item.content)) {
            checkContent(item.content);
          }
        });
      }

      checkContent(textContent);

      expect(hasBold).toBe(true);
      expect(hasEscapedAsterisks).toBe(true);
    });
  });

  describe("Image and Advanced Link Escape Tests", () => {
    it("should handle escaped image syntax", () => {
      const content = `\\![alt text](image.jpg)`;
      const result = parseNotedown(content);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("paragraph");

      const textContent = result.content[0].content[0].content;
      // Based on debug output, \\! becomes literal but [text](url) becomes a link
      expect(textContent.every((item) => item.type !== "image")).toBe(true);
      // Should contain the backslash-exclamation as literal text
      expect(
        textContent.some((item) => item.text && item.text.includes("\\!"))
      ).toBe(true);
    });

    it("should handle escaped links with complex URLs", () => {
      const content = `\\[Complex Link](https://example.com/path?param=value&other=123)`;
      const result = parseNotedown(content);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("paragraph");

      const textContent = result.content[0].content[0].content;
      // Should not create link object
      expect(textContent.every((item) => !item.link)).toBe(true);
      // Should contain literal link text with full URL
      expect(
        textContent.some(
          (item) =>
            item.text &&
            item.text.includes("[Complex Link]") &&
            item.text.includes("https://example.com/path?param=value&other=123")
        )
      ).toBe(true);
    });
  });

  describe("Color Formatting Escape Tests", () => {
    it("should handle escaped color with foreground and background", () => {
      const content = `\\|f#red,b#blue,colored text\\|`;
      const result = parseNotedown(content);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("paragraph");

      const textContent = result.content[0].content[0].content;
      // Should not create color formatting
      expect(textContent.every((item) => item.format !== "color")).toBe(true);
      // Should contain literal pipe characters and color syntax
      expect(
        textContent.some(
          (item) =>
            item.text && item.text.includes("|f#red,b#blue,colored text|")
        )
      ).toBe(true);
    });

    it("should handle escaped content with backslash in pipes", () => {
      const content = `|\\special content with backslash|`;
      const result = parseNotedown(content);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("paragraph");

      const textContent = result.content[0].content[0].content;
      // Should render the escaped content
      expect(
        textContent.some(
          (item) =>
            item.text && item.text.includes("|special content with backslash|")
        )
      ).toBe(true);
    });
  });

  describe("Table Escape Sequences", () => {
    it("should handle escaped pipe characters in table-like content", () => {
      const content = `\\| Column 1 \\| Column 2 \\|
\\| Value 1  \\| Value 2  \\|`;
      const result = parseNotedown(content);

      expect(result.content.length).toBeGreaterThan(0);

      // Should not create table structure
      const hasTable = result.content.some((item) => item.type === "table");
      expect(hasTable).toBe(false);

      // Should contain literal pipe characters
      let foundPipes = false;
      result.content.forEach((item) => {
        if (item.type === "paragraph") {
          item.content.forEach((textBlock) => {
            textBlock.content.forEach((textItem) => {
              if (textItem.text && textItem.text.includes("|")) {
                foundPipes = true;
              }
            });
          });
        }
      });
      expect(foundPipes).toBe(true);
    });
  });

  describe("List Escape Sequences", () => {
    it("should handle escaped list markers", () => {
      const content = `\\- Not a list item
\\* Not a list item  
\\+ Not a list item
1\\. Not a numbered list`;
      const result = parseNotedown(content);

      // Should not create list structures
      const hasLists = result.content.some(
        (item) => item.type === "list" || item.type === "orderedList"
      );
      expect(hasLists).toBe(false);

      // Should contain literal markers
      let foundMarkers = false;
      result.content.forEach((item) => {
        if (item.type === "paragraph") {
          item.content.forEach((textBlock) => {
            textBlock.content.forEach((textItem) => {
              if (
                textItem.text &&
                (textItem.text.includes("-") ||
                  textItem.text.includes("*") ||
                  textItem.text.includes("+") ||
                  textItem.text.includes("1."))
              ) {
                foundMarkers = true;
              }
            });
          });
        }
      });
      expect(foundMarkers).toBe(true);
    });
  });

  describe("Title/Header Escape Sequences", () => {
    it("should handle escaped header markers", () => {
      const content = `\\# Not a header
\\## Not a header
\\### Not a header`;
      const result = parseNotedown(content);

      // Should not create title/header structures
      const hasTitles = result.content.some((item) => item.type === "title");
      expect(hasTitles).toBe(false);

      // Should contain literal hash characters
      let foundHashes = false;
      result.content.forEach((item) => {
        if (item.type === "paragraph") {
          item.content.forEach((textBlock) => {
            textBlock.content.forEach((textItem) => {
              if (textItem.text && textItem.text.includes("#")) {
                foundHashes = true;
              }
            });
          });
        }
      });
      expect(foundHashes).toBe(true);
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle large amounts of escape sequences efficiently", () => {
      const content =
        Array(100).fill("\\*escaped\\* ").join("") + "and *italic*";
      const result = parseNotedown(content);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("paragraph");

      // Should still process correctly and contain both escaped and unescaped content
      const textContent = result.content[0].content[0].content;
      expect(textContent.some((item) => item.text === "*")).toBe(true);
      expect(textContent.some((item) => item.format === "italic")).toBe(true);
    });

    it("should handle mixed escape sequences with special characters", () => {
      const content = `\\*\\#\\|\\[\\]\\(\\)\\{\\}\\\\`;
      const result = parseNotedown(content);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("paragraph");

      // Should handle all escape sequences gracefully
      const textContent = result.content[0].content[0].content;
      expect(textContent.length).toBeGreaterThan(0);
    });
  });
});
