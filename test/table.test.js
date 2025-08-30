import { describe, it, expect } from "bun:test";
import { parseNotedown, NotedownRenderer } from "../src";
describe("Table Functionality Tests", () => {
    it("should parse a simple table correctly", () => {
        const input = `
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
`;
        const parsed = parseNotedown(input);
        // Verify structure
        expect(parsed.content.length).toBeGreaterThan(0);
        const table = parsed.content[0];
        expect(table.type).toBe("table");
        expect(table.rows.length).toBe(3); // Header + 2 data rows
        expect(table.rows[0].isHeader).toBe(true);
        expect(table.rows[0].cells.length).toBe(2);
        expect(table.rows[1].cells.length).toBe(2);
    });
    it("should handle tables with alignment", () => {
        const input = `
| Left | Center | Right |
| :--- | :----: | ----: |
| 1    | 2      | 3     |
`;
        const parsed = parseNotedown(input);
        const table = parsed.content[0];
        expect(table.rows[1].cells[0].align).toBe("left");
        expect(table.rows[1].cells[1].align).toBe("center");
        expect(table.rows[1].cells[2].align).toBe("right");
    });
    it("should handle tables with formatting in cells", () => {
        const input = `
| Formatting | Example |
| ---------- | ------- |
| **Bold**   | This is **bold** text |
| *Italic*   | This is *italic* text |
`;
        const parsed = parseNotedown(input);
        const table = parsed.content[0];
        // Verify we have cell content
        const cell = table.rows[1].cells[0];
        expect(cell.content).toBeTruthy();
        expect(cell.content.length).toBeGreaterThan(0);
        // Just verify we can render the table without errors
        expect(table.rows[1].cells[1].content.some((item) => typeof item === "object" && item !== null)).toBe(true);
    });
    it("should handle tables with meta references", () => {
        const input = `\\meta title=Table Test
    
| Header | Value |
| ------ | ----- |
| Title  | @{title} |
`;
        const parsed = parseNotedown(input);
        const table = parsed.content[0];
        // Check meta reference
        const metaCell = table.rows[1].cells[1];
        const metaRef = metaCell.content.find((item) => "meta" in item && item.meta === "title");
        expect(metaRef).toBeTruthy();
        if (metaRef && "meta" in metaRef) {
            expect(metaRef.meta).toBe("title");
        }
    });
    it("should render tables as HTML", () => {
        // Skip test in non-browser environment
        if (typeof window === "undefined") {
            console.log("Skipping HTML rendering test in non-browser environment");
            return;
        }
        const input = `
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
`;
        const parsed = parseNotedown(input);
        // Create a document for testing
        const renderer = new NotedownRenderer(document);
        const html = renderer.renderWithStyles(parsed);
        // Verify HTML structure
        const htmlString = html.outerHTML;
        expect(htmlString).toContain("<table");
        expect(htmlString).toContain("<thead");
        expect(htmlString).toContain("<tbody");
        expect(htmlString).toContain("<th");
        expect(htmlString).toContain("<td");
        expect(htmlString).toContain("Header 1");
        expect(htmlString).toContain("Cell 1");
    });
    it("should handle complex table structures", () => {
        const input = `
| Feature | Description | Example |
| ------- | ----------- | ------- |
| Links   | Insert links | [Link](https://example.com) |
| Code    | Insert code  | \`code\` |
| LaTeX   | Math formulas | $E=mc^2$ |
`;
        const parsed = parseNotedown(input);
        const table = parsed.content[0];
        // Check structure
        expect(table.rows.length).toBe(4); // Header + 3 data rows
        // Check that cells have content
        const linkCell = table.rows[1].cells[2];
        expect(linkCell.content).toBeTruthy();
        expect(linkCell.content.length).toBeGreaterThan(0);
        // Check for code cell - we're just verifying content exists
        const codeCell = table.rows[2].cells[2];
        expect(codeCell.content).toBeTruthy();
        expect(codeCell.content.length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=table.test.js.map