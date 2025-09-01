import { describe, test, expect, beforeEach } from "bun:test";
import { parseNotedown } from "../../../src/parser";
import { NotedownRenderer } from "../../../src/renderer";
import { JSDOM } from "jsdom";
import type { NotedownCollapse } from "../../../src/types";

describe("Collapse Comprehensive Indentation", () => {
  let dom: JSDOM;
  let document: Document;
  let renderer: NotedownRenderer;

  beforeEach(() => {
    dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
    document = dom.window.document as any;
    renderer = new NotedownRenderer(document);
  });

  test("should render the Korean example with list structure", () => {
    const input = `
1. 시각정 정보전달
    
    장점: 많은 양의 정보 전달
    
    단점 : 방향의 일치가 필요함
    
    매질이 없을때 가장 빠름 (빛의 전달이기 때문)
    
2. 청각정 정보전달
    
    장점 : 방향의 일치가 필요하지 않음
    
    단점 : 적은 양의 정보 전달
    
    매질이 필요함 (파동 "소리"의 의한 전달)
`;

    const parsed = parseNotedown(input);
    const html = renderer.renderWithStyles(parsed).innerHTML;

    // Check that we have the list items
    expect(html).toContain("시각정 정보전달");
    expect(html).toContain("청각정 정보전달");

    // Should render as an ordered list
    expect(html).toContain('<ol class="notedown-list notedown-list-ordered">');
    expect(html).toContain('<li class="notedown-list-item">');

    // Check structure in the parsed content
    expect(parsed.content).toHaveLength(1);
    expect(parsed.content[0].type).toBe("list");
  });

  test("should handle Korean content with collapse and indentation", () => {
    const input = `
#> 시각정 정보전달
    
    장점: 많은 양의 정보 전달
    
    단점 : 방향의 일치가 필요함
    
    매질이 없을때 가장 빠름 (빛의 전달이기 때문)
    
    ##> 청각정 정보전달
    
    장점 : 방향의 일치가 필요하지 않음
    
    단점 : 적은 양의 정보 전달
    
    매질이 필요함 (파동 "소리"의 의한 전달)
    \\##>
\\#>
`;

    const parsed = parseNotedown(input);
    const html = renderer.renderWithStyles(parsed).innerHTML;

    // Should have collapse blocks
    expect(html).toContain("<details");
    expect(html).toContain("<summary");

    // Should have the Korean text
    expect(html).toContain("시각정 정보전달");
    expect(html).toContain("장점: 많은 양의 정보 전달");
    expect(html).toContain("청각정 정보전달");
    expect(html).toContain("장점 : 방향의 일치가 필요하지 않음");
  });

  test("should handle complex indentation and nested content", () => {
    const input = `
#> 목차
  1. 시각정 정보전달
      - 장점: 많은 양의 정보 전달
      - 단점: 방향의 일치가 필요함
  
  2. 청각정 정보전달
      - 장점: 방향의 일치가 필요하지 않음
      - 단점: 적은 양의 정보 전달
      
      ##> 상세 설명
      소리는 공기를 통해 전달됩니다.
        * 음파의 속도: 340 m/s
        * 주파수 범위: 20Hz ~ 20,000Hz
        
        ###> 청각 시스템
        인간의 청각 시스템은 다음과 같이 작동합니다:
          1. 외이에서 소리 수집
          2. 중이에서 증폭
          3. 내이에서 신경 신호로 변환
        \\###>
      \\##>
\\#>
`;

    const parsed = parseNotedown(input);
    const html = renderer.renderWithStyles(parsed).innerHTML;

    // Navigate through the nested collapses
    expect(parsed.content).toHaveLength(1);
    const level1 = parsed.content[0] as NotedownCollapse;

    // Find level 2 and level 3 collapses
    const hasOrderedList = level1.content.some((item) => item.type === "list");
    expect(hasOrderedList).toBe(true);

    // Check that the HTML contains all the expected content
    expect(html).toContain("목차");
    expect(html).toContain("시각정 정보전달");
    expect(html).toContain("청각정 정보전달");
    expect(html).toContain("상세 설명");
    expect(html).toContain("청각 시스템");
    expect(html).toContain("인간의 청각 시스템은 다음과 같이 작동합니다");
  });
});
