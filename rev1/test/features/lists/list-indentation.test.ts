import { describe, test, expect, beforeEach } from "bun:test";
import { parseNotedown } from "../../../src/parser";
import { NotedownRenderer } from "../../../src/renderer";
import { JSDOM } from "jsdom";

describe("Indentation in Lists", () => {
  let dom: JSDOM;
  let document: Document;
  let renderer: NotedownRenderer;

  beforeEach(() => {
    dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
    document = dom.window.document as any;
    renderer = new NotedownRenderer(document);
  });

  test("should preserve indentation in list item content", () => {
    const input = `1. 시각정 정보전달
    
    장점: 많은 양의 정보 전달
    
    단점 : 방향의 일치가 필요함
    
    매질이 없을때 가장 빠름 (빛의 전달이기 때문)`;

    const parsed = parseNotedown(input);
    const html = renderer.renderWithStyles(parsed).innerHTML;

    // Check that the list item and its content are rendered
    expect(parsed.content[0].type).toBe("list");
    expect(html).toContain("시각정 정보전달");
    expect(html).toContain("장점: 많은 양의 정보 전달");
    expect(html).toContain("단점 : 방향의 일치가 필요함");
    expect(html).toContain("매질이 없을때 가장 빠름 (빛의 전달이기 때문)");
  });

  test("should handle multiple paragraphs within list items", () => {
    const input = `1. 첫번째 항목
    
    첫번째 단락
    
    두번째 단락
    
2. 두번째 항목
    
    항목의 내용`;

    const parsed = parseNotedown(input);
    const html = renderer.renderWithStyles(parsed).innerHTML;

    // Check that the list has multiple items with paragraphs
    expect(html).toContain("첫번째 항목");
    expect(html).toContain("첫번째 단락");
    expect(html).toContain("두번째 단락");
    expect(html).toContain("두번째 항목");
    expect(html).toContain("항목의 내용");
  });

  test("should handle nested content in list items", () => {
    const input = `1. 항목 1
    
    설명 텍스트
    
    - 중첩된 목록 1
    - 중첩된 목록 2
        - 더 중첩된 목록`;

    const parsed = parseNotedown(input);
    const html = renderer.renderWithStyles(parsed).innerHTML;

    // Check proper nesting of content
    expect(html).toContain("항목 1");
    expect(html).toContain("설명 텍스트");
    expect(html).toContain("중첩된 목록 1");
    expect(html).toContain("중첩된 목록 2");
    expect(html).toContain("더 중첩된 목록");
  });

  test("should handle complex nested Korean content with indentation", () => {
    const input = `1. 시각정 정보전달
    
    장점: 많은 양의 정보 전달
    
    단점 : 방향의 일치가 필요함
    
    매질이 없을때 가장 빠름 (빛의 전달이기 때문)
    
2. 청각정 정보전달
    
    장점 : 방향의 일치가 필요하지 않음
    
    단점 : 적은 양의 정보 전달
    
    매질이 필요함 (파동 "소리"의 의한 전달)
    
3. 화학적 정보전달
    
    장점 : 많은 양의 정보 전달, 방향의 일치 필요 X
    
    단점 : 없음`;

    const parsed = parseNotedown(input);
    const html = renderer.renderWithStyles(parsed).innerHTML;

    // Check that the complex list structure is preserved
    expect(html).toContain("시각정 정보전달");
    expect(html).toContain("청각정 정보전달");
    expect(html).toContain("화학적 정보전달");
    expect(html).toContain("장점: 많은 양의 정보 전달");
    expect(html).toContain("단점 : 방향의 일치가 필요함");
    expect(html).toContain("장점 : 방향의 일치가 필요하지 않음");
    expect(html).toContain("단점 : 적은 양의 정보 전달");
    expect(html).toContain("장점 : 많은 양의 정보 전달, 방향의 일치 필요 X");
    expect(html).toContain("단점 : 없음");
  });
});
