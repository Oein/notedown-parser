import { describe, it, expect } from "bun:test";
import { parseNotedown } from "../src";
import * as fs from "fs";
import * as path from "path";
// Type guard for text nodes
function isTextNode(node) {
    return "text" in node;
}
// Type guard for formatted nodes
function isFormattedNode(node) {
    return "format" in node;
}
describe("LaTeX Formula Tests", () => {
    it("should correctly parse inline LaTeX formulas", () => {
        const input = "This is a formula $E = mc^2$ in text.";
        const parsed = parseNotedown(input);
        // Expect the parsed content to have a paragraph with a text node
        expect(parsed.content).toHaveLength(1);
        expect(parsed.content[0].type).toBe("paragraph");
        // Get the text content
        const paragraph = parsed.content[0];
        const textContent = paragraph.content[0];
        expect(textContent.type).toBe("text");
        // Check that the inline content has 3 parts: text before, formula, text after
        expect(textContent.content).toHaveLength(3);
        const firstNode = textContent.content[0];
        expect(isTextNode(firstNode)).toBe(true);
        if (isTextNode(firstNode)) {
            expect(firstNode.text).toBe("This is a formula ");
        }
        // Check the formula node
        const formulaNode = textContent.content[1];
        expect(isFormattedNode(formulaNode)).toBe(true);
        if (isFormattedNode(formulaNode)) {
            expect(formulaNode.format).toBe("latex");
            expect(formulaNode.formula).toBe("E = mc^2");
        }
        const lastNode = textContent.content[2];
        expect(isTextNode(lastNode)).toBe(true);
        if (isTextNode(lastNode)) {
            expect(lastNode.text).toBe(" in text.");
        }
    });
    it("should handle LaTeX with special characters", () => {
        const input = "Complex formula: $\\sum_{i=1}^{n} x_i^2 \\leq \\infty$";
        const parsed = parseNotedown(input);
        // Get the LaTeX node
        const paragraph = parsed.content[0];
        const textContent = paragraph.content[0];
        const latexNode = textContent.content[1];
        expect(isFormattedNode(latexNode)).toBe(true);
        if (isFormattedNode(latexNode)) {
            expect(latexNode.format).toBe("latex");
            expect(latexNode.formula).toBe("\\sum_{i=1}^{n} x_i^2 \\leq \\infty");
        }
    });
    it("should handle dollar signs", () => {
        const input = "This costs $5$ as a formula.";
        const parsed = parseNotedown(input);
        const paragraph = parsed.content[0];
        const textContent = paragraph.content[0];
        // Check that the content has parts with LaTeX formula
        const latexNode = textContent.content.find((node) => isFormattedNode(node) && node.format === "latex");
        expect(latexNode).toBeDefined();
        if (latexNode && isFormattedNode(latexNode)) {
            expect(latexNode.format).toBe("latex");
            expect(latexNode.formula).toBe("5");
        }
    });
    it("should handle nested formatting with LaTeX", () => {
        const input = "**Bold text with $E = mc^2$ formula**";
        const parsed = parseNotedown(input);
        // Get the bold node
        const paragraph = parsed.content[0];
        const textContent = paragraph.content[0];
        const boldNode = textContent.content[0];
        expect(isFormattedNode(boldNode)).toBe(true);
        if (isFormattedNode(boldNode)) {
            expect(boldNode.format).toBe("bold");
            // Check the content inside bold
            const boldContent = boldNode.content;
            expect(boldContent).toHaveLength(3);
            const firstNode = boldContent[0];
            expect(isTextNode(firstNode)).toBe(true);
            if (isTextNode(firstNode)) {
                expect(firstNode.text).toBe("Bold text with ");
            }
            const latexNode = boldContent[1];
            expect(isFormattedNode(latexNode)).toBe(true);
            if (isFormattedNode(latexNode)) {
                expect(latexNode.format).toBe("latex");
                expect(latexNode.formula).toBe("E = mc^2");
            }
            const lastNode = boldContent[2];
            expect(isTextNode(lastNode)).toBe(true);
            if (isTextNode(lastNode)) {
                expect(lastNode.text).toBe(" formula");
            }
        }
    });
    it("should load and parse the LaTeX sample document", () => {
        const ndContent = fs.readFileSync(path.join(__dirname, "../samples/latex.nd"), "utf8");
        const parsed = parseNotedown(ndContent);
        // Verify meta information
        expect(parsed.meta?.title).toBe("LaTeX Sample Document");
        expect(parsed.meta?.author).toBe("Notedown User");
        // Verify that there are LaTeX nodes in the document
        let foundLatex = false;
        // Helper function to recursively find LaTeX nodes
        function findLatexNodes(item) {
            if (item.format === "latex") {
                foundLatex = true;
                return true;
            }
            if (item.content && Array.isArray(item.content)) {
                for (const child of item.content) {
                    if (findLatexNodes(child)) {
                        return true;
                    }
                }
            }
            return false;
        }
        // Check all content items
        for (const item of parsed.content) {
            findLatexNodes(item);
            if (foundLatex)
                break;
        }
        expect(foundLatex).toBe(true);
    });
});
//# sourceMappingURL=latex.test.js.map