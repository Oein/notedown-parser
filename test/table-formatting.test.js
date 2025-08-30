import { describe, it, expect, beforeEach } from "bun:test";
import { parseNotedown } from "../src/parser";
import { NotedownRenderer } from "../src/renderer";
import { JSDOM } from "jsdom";
describe("Table Formatting Tests", () => {
    let dom;
    let document;
    let renderer;
    beforeEach(() => {
        dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
        document = dom.window.document;
        renderer = new NotedownRenderer(document);
    });
    it("should properly parse bold formatting inside table cells", () => {
        const input = `
| Header | **Bold Content** |
| ------ | --------------- |
| Row 1  | Normal **bold** text |
`;
        const parsed = parseNotedown(input);
        const table = parsed.content[0];
        // Check header row bold content
        const headerBoldCell = table.rows[0].cells[1];
        expect(headerBoldCell.content.length).toBe(1);
        expect(headerBoldCell.content[0].format).toBe("bold");
        // Check data row with mixed formatting
        const dataBoldCell = table.rows[1].cells[1];
        expect(dataBoldCell.content.length).toBe(3);
        expect(dataBoldCell.content[0].text).toBe("Normal ");
        expect(dataBoldCell.content[1].format).toBe("bold");
        expect(dataBoldCell.content[1]
            .content[0].text).toBe("bold");
        expect(dataBoldCell.content[2].text).toBe(" text");
    });
    it("should properly parse italic formatting inside table cells", () => {
        const input = `
| Header | *Italic Content* |
| ------ | --------------- |
| Row 1  | Normal *italic* text |
`;
        const parsed = parseNotedown(input);
        const table = parsed.content[0];
        // Check header row italic content
        const headerItalicCell = table.rows[0].cells[1];
        expect(headerItalicCell.content.length).toBe(1);
        expect(headerItalicCell.content[0].format).toBe("italic");
        // Check data row with mixed formatting
        const dataItalicCell = table.rows[1].cells[1];
        expect(dataItalicCell.content.length).toBe(3);
        expect(dataItalicCell.content[0].text).toBe("Normal ");
        expect(dataItalicCell.content[1].format).toBe("italic");
        expect(dataItalicCell.content[1]
            .content[0].text).toBe("italic");
        expect(dataItalicCell.content[2].text).toBe(" text");
    });
    it("should properly parse code formatting inside table cells", () => {
        const input = `
| Header | \`Code Content\` |
| ------ | --------------- |
| Row 1  | Normal \`code\` text |
`;
        const parsed = parseNotedown(input);
        const table = parsed.content[0];
        // Check header row code content
        const headerCodeCell = table.rows[0].cells[1];
        expect(headerCodeCell.content.length).toBe(1);
        expect(headerCodeCell.content[0].format).toBe("code");
        // Check data row with mixed formatting
        const dataCodeCell = table.rows[1].cells[1];
        expect(dataCodeCell.content.length).toBe(3);
        expect(dataCodeCell.content[0].text).toBe("Normal ");
        expect(dataCodeCell.content[1].format).toBe("code");
        expect(dataCodeCell.content[1]
            .content[0].text).toBe("code");
        expect(dataCodeCell.content[2].text).toBe(" text");
    });
    it("should properly parse links inside table cells", () => {
        const input = `
| Header | [Link](https://example.com) |
| ------ | --------------------------- |
| Row 1  | Text with [link](https://example.com) in it |
`;
        const parsed = parseNotedown(input);
        const table = parsed.content[0];
        // Check header row link content
        const headerLinkCell = table.rows[0].cells[1];
        expect(headerLinkCell.content.length).toBe(1);
        expect(headerLinkCell.content[0].link).toBe("https://example.com");
        expect(headerLinkCell.content[0].text).toBe("Link");
        // Check data row with mixed content and link
        const dataLinkCell = table.rows[1].cells[1];
        expect(dataLinkCell.content.length).toBe(3);
        expect(dataLinkCell.content[0].text).toBe("Text with ");
        expect(dataLinkCell.content[1].link).toBe("https://example.com");
        expect(dataLinkCell.content[1].text).toBe("link");
        expect(dataLinkCell.content[2].text).toBe(" in it");
    });
    it("should properly parse LaTeX inside table cells", () => {
        const input = `
| Header | $E = mc^2$ |
| ------ | ---------- |
| Row 1  | Formula: $E = mc^2$ here |
`;
        const parsed = parseNotedown(input);
        const table = parsed.content[0];
        // Check header row LaTeX content
        const headerLatexCell = table.rows[0].cells[1];
        expect(headerLatexCell.content.length).toBe(1);
        expect(headerLatexCell.content[0].format).toBe("latex");
        expect(headerLatexCell.content[0].formula).toBe("E = mc^2");
        // Check data row with mixed content and LaTeX
        const dataLatexCell = table.rows[1].cells[1];
        expect(dataLatexCell.content.length).toBe(3);
        expect(dataLatexCell.content[0].text).toBe("Formula: ");
        expect(dataLatexCell.content[1].format).toBe("latex");
        expect(dataLatexCell.content[1].formula).toBe("E = mc^2");
        expect(dataLatexCell.content[2].text).toBe(" here");
    });
    it("should render formatted table content correctly", () => {
        const input = `
| Formatting | Example |
| ---------- | ------- |
| **Bold**   | This is **bold** text |
| *Italic*   | This is *italic* text |
| \`Code\`   | This is \`code\` text |
| [Link](https://example.com) | This is a [link](https://example.com) |
| $E=mc^2$   | Formula: $E=mc^2$ |
`;
        const parsed = parseNotedown(input);
        const html = renderer.renderWithStyles(parsed);
        const htmlString = html.outerHTML;
        // Check for HTML elements for formatting
        expect(htmlString).toContain("<strong");
        expect(htmlString).toContain("<em");
        expect(htmlString).toContain("<code");
        expect(htmlString).toContain("<a");
        expect(htmlString).toContain('href="https://example.com"');
        expect(htmlString).toContain('class="notedown-latex"');
    });
});
//# sourceMappingURL=table-formatting.test.js.map