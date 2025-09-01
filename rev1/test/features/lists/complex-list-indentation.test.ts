import { describe, test, expect, beforeEach } from "bun:test";
import { parseNotedown } from "../../../src/parser";
import { NotedownRenderer } from "../../../src/renderer";
import { JSDOM } from "jsdom";

describe("Complex List with Indentation", () => {
  let dom: JSDOM;
  let document: Document;
  let renderer: NotedownRenderer;

  beforeEach(() => {
    dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
    document = dom.window.document as any;
    renderer = new NotedownRenderer(document);
  });

  test("should handle complex list with multiple levels of indentation", () => {
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
    
    단점 : 없음
    
    페로몬에 의한 전달 (게체와 게체사이의 전달)
    
    ⇒ ex: 개미들 끼리 소통
    
    호르몬에 의한 전달 (게체 내부의 신호 전달)
    
    \`A가 B에게\` : 이웃분비호르몬
    
    \`T가 T에게\` : 자기분비 호르몬
    
    \`A가 혈액에게\` : 내분비 호르몬 (중학교 에서의 호르몬)
    
    \`신경 세포가 신경 세포에게\` : 아세트 콜린, 신경전달물질
    
4. 촉각적 정보 전달
    
    ex: 벌의 춤)
    
    - 원형 춤
        
        먹이가 100m 이내에 존재
        
    - 8자 춤
        
        꼬리 흔드는 횟수가 많으면 더 많이 가까이
        
        8의 각도에 따라 해의 그림자 각도방향에 먹이가 있다`;

    const parsed = parseNotedown(input);
    const html = renderer.renderWithStyles(parsed).innerHTML;

    // Check that we have the list with ordered items
    expect(html).toContain('<ol class="notedown-list notedown-list-ordered">');
    expect(html).toContain("시각정 정보전달");
    expect(html).toContain("청각정 정보전달");
    expect(html).toContain("화학적 정보전달");
    expect(html).toContain("촉각적 정보 전달");

    // Check that indented content is included
    expect(html).toContain("장점: 많은 양의 정보 전달");
    expect(html).toContain("단점 : 방향의 일치가 필요함");
    expect(html).toContain("매질이 없을때 가장 빠름");

    // Check for deeper indented content
    expect(html).toContain("페로몬에 의한 전달");
    expect(html).toContain("호르몬에 의한 전달");

    // Check for code blocks in list items
    expect(html).toContain(
      '<code class="notedown-inline-code">A가 B에게</code>'
    );
    expect(html).toContain("이웃분비호르몬");

    // Check for nested unordered list
    expect(html).toContain(
      '<ul class="notedown-list notedown-list-unordered">'
    );
    expect(html).toContain("원형 춤");
    expect(html).toContain("8자 춤");
    expect(html).toContain("먹이가 100m 이내에 존재");
    expect(html).toContain("꼬리 흔드는 횟수가 많으면 더 많이 가까이");

    // Check overall structure by checking HTML string patterns
    const liMatches = html.match(/<li class="notedown-list-item">/g);
    expect(liMatches && liMatches.length).toBeGreaterThan(4); // At least the main 4 items plus nested ones

    // Should have at least one ordered list
    const olMatches = html.match(
      /<ol class="notedown-list notedown-list-ordered">/g
    );
    expect(olMatches && olMatches.length).toBeGreaterThan(0);

    // Should have at least one unordered list (nested under item 4)
    const ulMatches = html.match(
      /<ul class="notedown-list notedown-list-unordered">/g
    );
    expect(ulMatches && ulMatches.length).toBeGreaterThan(0);
  });
});
