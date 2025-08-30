import { describe, it, expect } from "bun:test";
import { parseNotedown } from "../src";
describe("Raw Meta Text Tests", () => {
    it("should preserve raw meta text when prefixed with backslash", () => {
        const input = "\\meta title=Test Document\n\n# Title with \\@{title}";
        const parsed = parseNotedown(input);
        // Verify meta is correctly set
        expect(parsed.meta?.title).toBe("Test Document");
        // Get the content as JSON for easier inspection
        const contentJson = JSON.stringify(parsed.content);
        // Check if raw meta text is preserved
        expect(contentJson).toContain("@{title}");
        // It should not replace \@{title} with the value Test Document
        expect(contentJson).not.toContain("Title with Test Document");
    });
    it("should properly process unescaped meta references", () => {
        const input = "\\meta title=Test Document\n\n# Title with @{title}";
        const parsed = parseNotedown(input);
        // Get the content as JSON for easier inspection
        const contentJson = JSON.stringify(parsed.content);
        // Check if meta reference is properly processed (meta node is created)
        expect(contentJson).toContain('"meta":"title"');
        // Check if the meta section is defined with the right value
        expect(parsed.meta?.title).toBe("Test Document");
    });
    it("should handle multiple escaped and unescaped meta references", () => {
        const input = "\\meta name=John\n\\meta job=Developer\n\n# About \\@{name} who is a @{job}";
        const parsed = parseNotedown(input);
        // Verify metas are correctly set
        expect(parsed.meta?.name).toBe("John");
        expect(parsed.meta?.job).toBe("Developer");
        // Get the content as JSON for easier inspection
        const contentJson = JSON.stringify(parsed.content);
        // Should contain raw @{name} text
        expect(contentJson).toContain("@{name}");
        // Should contain job meta reference
        expect(contentJson).toContain('"meta":"job"');
        // Should not replace \@{name} with John
        expect(contentJson).not.toContain("About John");
    });
});
//# sourceMappingURL=raw-meta.test.js.map