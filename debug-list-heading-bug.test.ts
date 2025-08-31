import { describe, test, expect } from "bun:test";
import { parseNotedown } from "./src/parser";

describe("List with heading bug test", () => {
  test("should parse list when preceded by heading in collapse", () => {
    const input = `|> asd
  ### v2.1
  - Fix: Vote버튼이 여러개 생성되는 문제 해결 ‣
  - Fix: VOD에서 광고차단이 되지 않는 문제 해결 ‣
  - Feat: 채팅 왼쪽에 두기 ‣
  - Feat: 광고 자동 스킵 ‣
  - Feat: 설정창 추가 ‣
\\|>`;

    const result = parseNotedown(input);
    console.log("Parsed result:", JSON.stringify(result, null, 2));

    // Should find a collapse with content containing a heading and a list
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("collapse");

    const collapseContent = result.content[0].content;

    // Should contain a heading and a list
    const hasHeading = collapseContent.some(
      (item: any) => item.type === "heading"
    );
    const hasList = collapseContent.some((item: any) => item.type === "list");

    expect(hasHeading).toBe(true);
    expect(hasList).toBe(true);

    // The list should have 5 items
    const listItem = collapseContent.find((item: any) => item.type === "list");
    expect(listItem.items).toHaveLength(5);
  });

  test("should parse list when preceded by heading in regular paragraph", () => {
    const input = `### v2.1
- Fix: Vote버튼이 여러개 생성되는 문제 해결 ‣
- Fix: VOD에서 광고차단이 되지 않는 문제 해결 ‣
- Feat: 채팅 왼쪽에 두기 ‣
- Feat: 광고 자동 스킵 ‣
- Feat: 설정창 추가 ‣`;

    const result = parseNotedown(input);
    console.log(
      "Parsed result (without collapse):",
      JSON.stringify(result, null, 2)
    );

    // Should have a heading and a list as separate elements
    expect(result.content.length).toBeGreaterThan(1);

    const hasHeading = result.content.some(
      (item: any) => item.type === "heading"
    );
    const hasList = result.content.some((item: any) => item.type === "list");

    expect(hasHeading).toBe(true);
    expect(hasList).toBe(true);

    // The list should have 5 items
    const listItem = result.content.find((item: any) => item.type === "list");
    expect(listItem.items).toHaveLength(5);
  });
});
