import { describe, it, expect } from "bun:test";
import { parseNotedown } from "../src";
describe("Debug Test", () => {
    it("should parse a simple title correctly", () => {
        const input = "# Simple Title";
        const parsed = parseNotedown(input);
        console.log("Parsed content:", JSON.stringify(parsed, null, 2));
        // Find paragraphs that contain titles
        const foundTitle = parsed.content.some((node) => {
            if (node.type === "paragraph" && Array.isArray(node.content)) {
                return node.content.some((item) => item && item.type === "title");
            }
            return false;
        });
        expect(foundTitle).toBe(true);
    });
    it("should parse a title with meta correctly", () => {
        const input = "\\meta title=Test\n\n# Title with @{title}";
        const parsed = parseNotedown(input);
        console.log("Parsed content with meta:", JSON.stringify(parsed, null, 2));
        // Check if there's a title node inside a paragraph
        const hasTitle = parsed.content.some((node) => {
            if (node.type === "paragraph" && Array.isArray(node.content)) {
                return node.content.some((item) => item && item.type === "title");
            }
            return false;
        });
        expect(hasTitle).toBe(true);
        // Also check that meta was parsed correctly
        expect(parsed.meta?.title).toBe("Test");
    });
});
//# sourceMappingURL=debug.test.js.map