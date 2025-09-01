import { describe, test, expect, beforeEach } from "bun:test";
import { parseNotedown } from "../../../src/parser";
import { NotedownRenderer } from "../../../src/renderer";
import { JSDOM } from "jsdom";

describe("Link (href) Functionality Tests", () => {
  let dom: JSDOM;
  let document: Document;
  let renderer: NotedownRenderer;

  beforeEach(() => {
    dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
    document = dom.window.document as any;
    renderer = new NotedownRenderer(document);
  });

  test("should parse basic links correctly", () => {
    const content = `Check out [Google](https://google.com) for search.`;

    const result = parseNotedown(content);
    console.log("Link parsing result:", JSON.stringify(result, null, 2));

    const jsonStr = JSON.stringify(result);
    expect(jsonStr).toContain('"link":"https://google.com"');
    expect(jsonStr).toContain('"text":"Google"');
  });

  test("should render links with proper href attribute", () => {
    const content = `Visit [GitHub](https://github.com) and [Google](https://google.com).`;

    const result = parseNotedown(content);
    const htmlContainer = renderer.renderWithStyles(result);
    const html = htmlContainer.innerHTML;

    console.log("Link HTML output:", html);

    // Check for proper anchor tags with href
    expect(html).toContain("<a");
    expect(html).toContain('href="https://github.com"');
    expect(html).toContain('href="https://google.com"');
    expect(html).toContain(">GitHub</a>");
    expect(html).toContain(">Google</a>");
  });

  test("should handle multiple links in same paragraph", () => {
    const content = `Visit [Site 1](https://site1.com) and [Site 2](https://site2.com) and [Site 3](https://site3.com).`;

    const result = parseNotedown(content);
    const htmlContainer = renderer.renderWithStyles(result);
    const html = htmlContainer.innerHTML;

    // Should have 3 links
    expect((html.match(/href="/g) || []).length).toBe(3);
    expect(html).toContain('href="https://site1.com"');
    expect(html).toContain('href="https://site2.com"');
    expect(html).toContain('href="https://site3.com"');
  });

  test("should handle links with various URL formats", () => {
    const content = `Links: [HTTP](http://example.com), [HTTPS](https://example.com), [FTP](ftp://files.com), [Email](mailto:test@example.com), [Relative](/path/to/page).`;

    const result = parseNotedown(content);
    const htmlContainer = renderer.renderWithStyles(result);
    const html = htmlContainer.innerHTML;

    expect(html).toContain('href="http://example.com"');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('href="ftp://files.com"');
    expect(html).toContain('href="mailto:test@example.com"');
    expect(html).toContain('href="/path/to/page"');
  });

  test("should handle links with special characters in text", () => {
    const content = `Links: [Link with spaces](https://example.com), [Link-with-dashes](https://dash.com), [Link_with_underscores](https://under.com).`;

    const result = parseNotedown(content);
    const htmlContainer = renderer.renderWithStyles(result);
    const html = htmlContainer.innerHTML;

    expect(html).toContain(">Link with spaces</a>");
    expect(html).toContain(">Link-with-dashes</a>");
    expect(html).toContain(">Link_with_underscores</a>");
  });

  test("should handle Korean/Unicode text in links", () => {
    const content = `한국어 링크: [구글](https://google.com), [깃허브](https://github.com).`;

    const result = parseNotedown(content);
    const htmlContainer = renderer.renderWithStyles(result);
    const html = htmlContainer.innerHTML;

    expect(html).toContain(">구글</a>");
    expect(html).toContain(">깃허브</a>");
    expect(html).toContain('href="https://google.com"');
    expect(html).toContain('href="https://github.com"');
  });

  test("should handle links mixed with other formatting", () => {
    const content = `Text with **bold [link](https://bold.com) text** and *italic [link](https://italic.com) text*.`;

    const result = parseNotedown(content);
    const htmlContainer = renderer.renderWithStyles(result);
    const html = htmlContainer.innerHTML;

    // Should contain both formatting and links
    expect(html).toContain('href="https://bold.com"');
    expect(html).toContain('href="https://italic.com"');
    expect(html).toContain('class="notedown-bold"');
    expect(html).toContain('class="notedown-italic"');
  });

  test("should handle escaped link syntax", () => {
    const content = `This is not a link: \\[text](url) but this is: [actual link](https://real.com).`;

    const result = parseNotedown(content);
    const htmlContainer = renderer.renderWithStyles(result);
    const html = htmlContainer.innerHTML;

    // Should only have one actual link
    expect((html.match(/href="/g) || []).length).toBe(1);
    expect(html).toContain('href="https://real.com"');
    expect(html).toContain("[text](url)"); // Escaped version should be literal
  });

  test("should render links with proper CSS classes", () => {
    const content = `Visit [Test Link](https://test.com).`;

    const result = parseNotedown(content);
    const htmlContainer = renderer.renderWithStyles(result);
    const html = htmlContainer.innerHTML;

    // Check for link-specific CSS class
    expect(html).toContain("class=");

    // The HTML structure should be proper
    const linkRegex = /<a[^>]*href="https:\/\/test\.com"[^>]*>Test Link<\/a>/;
    expect(linkRegex.test(html)).toBe(true);
  });

  test("should handle malformed link syntax gracefully", () => {
    const content = `Malformed: [text only without url], [](empty url), [text](incomplete url.`;

    const result = parseNotedown(content);
    const htmlContainer = renderer.renderWithStyles(result);
    const html = htmlContainer.innerHTML;

    // Should not create any actual links for malformed syntax
    expect(html).not.toContain("<a ");
    expect(html).toContain("text only without url");
  });
});
