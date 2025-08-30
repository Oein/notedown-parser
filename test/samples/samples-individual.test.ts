import { describe, test, expect } from "bun:test";
import { parseNotedown } from "../../src/parser";

describe("Individual Sample File Validation", () => {
  test("body.nd - Basic paragraph and line break handling", () => {
    const content = `본문을 이렇게 적을 수 있음.
같은 문단에서 내려쓰기를 할 수 있음.

두번 내려쓰면 다음 문단으로 전환


세번 내려 써도 두번 한것과 같은 효과임
\\np
탈출 문자를 활용해서 다음 문단으로 내릴 수 있음
\\n
\\n
탈출 문자를 활용해서 같은 문단 안에서 여러 줄바꿈을 할 수 있음`;

    const result = parseNotedown(content);

    // Should parse into multiple paragraphs
    expect(
      result.content.filter((item) => item.type === "paragraph").length
    ).toBeGreaterThan(2);

    // Content verification
    const jsonStr = JSON.stringify(result);
    expect(jsonStr).toContain("본문을 이렇게 적을 수 있음");
    expect(jsonStr).toContain("두번 내려쓰면 다음 문단으로 전환");
    expect(jsonStr).toContain("탈출 문자를 활용해서");
  });

  test("bodyPlus.nd - Advanced text formatting", () => {
    const content = `본문 안에서 **Bold체** *Italic 체* __Underline__ ~~Crossline~~ \`Code\` \`Code with \\\` code syntax mark\`

본문을 |f#red,빨간 글씨| |b#blue,파란 배경| |f#fff,b#000,검정 배경 흰 글씨| |\\f#그저 아무것도 꾸미지 않았으나 색칠 문법 쓰기|
본몬을 \\|f#red,빨간 글씨로 표현되는 문법을 가진 그냥 글씨\\| |색칠 구문 안에 있으나 아무 색칠도 하지 않은 글씨|

링크 넣기 [링크 텍스트](https://google.com)

이미지 넣기
![이미지 alt](https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png)`;

    const result = parseNotedown(content);
    const jsonStr = JSON.stringify(result);

    // Text formatting
    expect(jsonStr).toContain('"format":"bold"');
    expect(jsonStr).toContain('"format":"italic"');
    expect(jsonStr).toContain('"format":"underline"');
    expect(jsonStr).toContain('"format":"crossline"');
    expect(jsonStr).toContain('"format":"code"');

    // Color formatting
    expect(jsonStr).toContain('"format":"color"');
    expect(jsonStr).toContain('"foreground":"red"');
    expect(jsonStr).toContain('"background":"blue"');

    // Links and images
    expect(jsonStr).toContain('"link":"https://google.com"');
    expect(jsonStr).toContain('"type":"image"');
    expect(jsonStr).toContain('"alt":"이미지 alt"');
  });

  test("code.nd - Code block handling", () => {
    const content = `\`\`\`
코드 적기
\`\`\`

\`\`\`ts
let a: number = 123; // With lang support
function say() {
    console.log("Hello World");
}
\`\`\`

\`\`\`
Code with \`\`\` syntax mark
\\\`\\\`\\\`
\\\`\`\`
\`\`\``;

    const result = parseNotedown(content);
    const codeBlocks = result.content.filter((item) => item.type === "code");

    expect(codeBlocks.length).toBeGreaterThanOrEqual(2);

    // Basic code block
    expect(codeBlocks[0].content).toBe("코드 적기");

    // TypeScript code block
    const tsBlock = codeBlocks.find((block) => block.lang === "ts");
    expect(tsBlock).toBeTruthy();
    expect(tsBlock.content).toContain("let a: number = 123");

    // Escaped syntax handling
    const jsonStr = JSON.stringify(result);
    expect(jsonStr).toContain("```");
  });

  test("collapse.nd - Collapse sections with sizes", () => {
    const content = `#> 접을 수 있는 제목
제목 안의 본문
\\#>

##> 접을 수 있는 2제목
제목 안의 본문
\\##>

###> 접을 수 있는 3제목
제목 안의 본문
\\###>

|> 그냥 접을 수 있는 본문
asdsd
\\|>

|> 그냥 접을 수 있는 본문 2
\\\\|>
접기 탈출 문법을 보여주기
\\|>

탈출 문자로 탈출 가능`;

    const result = parseNotedown(content);
    const collapseBlocks = result.content.filter(
      (item) => item.type === "collapse"
    );

    expect(collapseBlocks).toHaveLength(5);

    // Size verification
    expect(collapseBlocks[0].size).toBe(1);
    expect(collapseBlocks[1].size).toBe(2);
    expect(collapseBlocks[2].size).toBe(3);
    expect(collapseBlocks[3].size).toBeUndefined(); // Simple collapse
    expect(collapseBlocks[4].size).toBeUndefined(); // Simple collapse

    // Korean text handling
    expect(collapseBlocks[0].text[0].text).toBe("접을 수 있는 제목");
    expect(collapseBlocks[1].text[0].text).toBe("접을 수 있는 2제목");

    // Escape sequence handling
    const jsonStr = JSON.stringify(result);
    expect(jsonStr).toContain("접기 탈출 문법을 보여주기");
  });

  test("meta.nd - Meta variables and references", () => {
    const content = `\\meta title=메타 리딩 테스트
\\meta meta2=메타 여러개 불러오기

# 메타로 제목 쓰기, @{title}

본문, 메타 문법을 그대로 내보내기 \\@{title}

중간 부분에서 메타로 쓰인것은 인식이 되지 않고 문자 그대로 출력됨

\\meta nonmeta=1234`;

    const result = parseNotedown(content);

    // Meta parsing
    expect(result.meta).toBeTruthy();
    expect(result.meta.title).toBe("메타 리딩 테스트");
    expect(result.meta.meta2).toBe("메타 여러개 불러오기");

    // Meta references in content
    const jsonStr = JSON.stringify(result);
    expect(jsonStr).toContain('"meta":"title"');

    // Mid-document meta should be ignored
    expect(result.meta.nonmeta).toBeUndefined();

    // Escaped meta reference handling
    expect(jsonStr).toContain("본문, 메타 문법을 그대로 내보내기");
  });

  test("title.nd - Heading levels and descriptions", () => {
    const content = `# 마크다운의 문법 그대로 따라감.

## 작은 해딩

### 더 작은 해딩

#### 매우 작은 해딩

##### 진짜 작은 해딩

~# 설명 글씨`;

    const result = parseNotedown(content);

    // Find all titles nested in paragraphs
    const allTitles: any[] = [];
    const allDescs: any[] = [];

    result.content.forEach((item: any) => {
      if (item.type === "paragraph" && item.content) {
        item.content.forEach((contentItem: any) => {
          if (contentItem.type === "title") {
            allTitles.push(contentItem);
          } else if (contentItem.type === "desc") {
            allDescs.push(contentItem);
          }
        });
      }
    });

    // Heading levels
    expect(allTitles).toHaveLength(5);
    expect(allTitles[0].size).toBe(1);
    expect(allTitles[1].size).toBe(2);
    expect(allTitles[2].size).toBe(3);
    expect(allTitles[3].size).toBe(4);
    expect(allTitles[4].size).toBe(5);

    // Heading text
    expect(allTitles[0].text[0].text).toBe("마크다운의 문법 그대로 따라감.");
    expect(allTitles[1].text[0].text).toBe("작은 해딩");

    // Description
    expect(allDescs).toHaveLength(1);
    expect(allDescs[0].text[0].text).toBe("설명 글씨");
  });

  test("All samples together - Full integration", () => {
    // Test that all sample features work together
    const combinedContent = `\\meta project=Notedown Parser
\\meta version=1.0

# @{project} v@{version}

~# Complete feature demonstration

## Text Formatting
Basic text with **bold**, *italic*, __underline__, ~~strikethrough__, and \`inline code\`.

Colors: |f#red,red text| and |b#yellow,yellow background|.

## Code Blocks
\`\`\`javascript
console.log("Hello, Notedown!");
\`\`\`

## Links and Media
Visit [GitHub](https://github.com) or see this image:
![Sample](https://via.placeholder.com/100)

## Collapse Sections
#> Level 1 Section
Content here with **formatting**.
\\#>

##> Level 2 Section
More content.
\\##>

|> Simple Collapse
Basic collapse content.
\\|>

That's all!`;

    const result = parseNotedown(combinedContent);

    // Meta data
    expect(result.meta.project).toBe("Notedown Parser");
    expect(result.meta.version).toBe("1.0");

    // Content types present
    const contentTypes = new Set();
    const hasTitle = (content: any[]): boolean => {
      return content.some((item: any) => {
        if (item.type === "paragraph" && item.content) {
          return item.content.some((c: any) => c.type === "title");
        }
        return false;
      });
    };

    result.content.forEach((item: any) => {
      contentTypes.add(item.type);
    });

    expect(contentTypes.has("paragraph")).toBe(true);
    expect(contentTypes.has("code")).toBe(true);
    expect(contentTypes.has("collapse")).toBe(true);
    expect(hasTitle(result.content)).toBe(true);

    // Collapse types
    const collapses = result.content.filter(
      (item: any) => item.type === "collapse"
    );
    expect(collapses.some((c: any) => c.size === 1)).toBe(true);
    expect(collapses.some((c: any) => c.size === 2)).toBe(true);
    expect(collapses.some((c: any) => !c.size)).toBe(true); // Simple collapse

    // Content verification
    const jsonStr = JSON.stringify(result);
    expect(jsonStr).toContain("Complete feature demonstration");
    expect(jsonStr).toContain('"format":"bold"');
    expect(jsonStr).toContain('"format":"color"');
    expect(jsonStr).toContain('"lang":"javascript"');
    expect(jsonStr).toContain('"meta":"project"');
    expect(jsonStr).toContain('"link":"https://github.com"');
    expect(jsonStr).toContain('"type":"image"');
  });
});
