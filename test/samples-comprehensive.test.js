import { describe, test, expect, beforeEach } from "bun:test";
import { parseNotedown } from "../src/parser";
import { NotedownRenderer } from "../src/renderer";
import { JSDOM } from "jsdom";
import * as fs from "fs";
import * as path from "path";
describe("Sample Files Comprehensive Tests", () => {
    let dom;
    let document;
    let renderer;
    beforeEach(() => {
        dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>");
        document = dom.window.document;
        renderer = new NotedownRenderer(document);
    });
    describe("LaTeX Sample Tests", () => {
        test("should parse and render LaTeX formulas", () => {
            const latexNdPath = path.join(__dirname, "../samples/latex.nd");
            const latexContent = fs.readFileSync(latexNdPath, "utf8");
            const result = parseNotedown(latexContent);
            // Verify meta information
            expect(result.meta?.title).toBe("LaTeX Sample Document");
            expect(result.meta?.author).toBe("Notedown User");
            // Verify that there are LaTeX nodes in the document
            let foundLatex = false;
            // Helper function to recursively find LaTeX nodes
            function findLatexNodes(item) {
                if (item && item.format === "latex") {
                    foundLatex = true;
                    return true;
                }
                if (item && item.content && Array.isArray(item.content)) {
                    for (const child of item.content) {
                        if (findLatexNodes(child)) {
                            return true;
                        }
                    }
                }
                return false;
            }
            // Check all content items
            for (const item of result.content) {
                findLatexNodes(item);
                if (foundLatex)
                    break;
            }
            expect(foundLatex).toBe(true);
            // Verify rendering
            const htmlContainer = renderer.renderWithStyles(result);
            const html = htmlContainer.innerHTML;
            expect(html).toContain('class="notedown-latex"');
            // We no longer use the data-formula attribute
            expect(html).toContain("$E = mc^2$");
        });
    });
    describe("Body Sample Tests", () => {
        const bodyContent = `본문을 이렇게 적을 수 있음.
같은 문단에서 내려쓰기를 할 수 있음.

두번 내려쓰면 다음 문단으로 전환


세번 내려 써도 두번 한것과 같은 효과임
\\np
탈출 문자를 활용해서 다음 문단으로 내릴 수 있음
\\n
\\n
탈출 문자를 활용해서 같은 문단 안에서 여러 줄바꿈을 할 수 있음`;
        test("should parse basic paragraph structure", () => {
            const result = parseNotedown(bodyContent);
            // Should contain multiple paragraphs
            const paragraphs = result.content.filter((item) => item.type === "paragraph");
            expect(paragraphs.length).toBeGreaterThan(2);
            // First paragraph should contain two text elements (two lines)
            expect(paragraphs[0].content).toHaveLength(2);
            expect(paragraphs[0].content[0].content[0].text).toBe("본문을 이렇게 적을 수 있음.");
            expect(paragraphs[0].content[1].content[0].text).toBe("같은 문단에서 내려쓰기를 할 수 있음.");
        });
        test("should handle paragraph breaks correctly", () => {
            const result = parseNotedown(bodyContent);
            const paragraphs = result.content.filter((item) => item.type === "paragraph");
            // Should treat multiple line breaks as single paragraph break
            expect(paragraphs[1].content[0].content[0].text).toBe("두번 내려쓰면 다음 문단으로 전환");
            expect(paragraphs[2].content[0].content[0].text).toBe("세번 내려 써도 두번 한것과 같은 효과임");
        });
        test("should handle escape sequences (\\np, \\n)", () => {
            const result = parseNotedown(bodyContent);
            // Should handle \\np for paragraph breaks and \\n for line breaks
            const textContent = JSON.stringify(result);
            expect(textContent).toContain("탈출 문자를 활용해서 다음 문단으로 내릴 수 있음");
            expect(textContent).toContain("탈출 문자를 활용해서 같은 문단 안에서 여러 줄바꿈을 할 수 있음");
        });
        test("should render body content to HTML", () => {
            const result = parseNotedown(bodyContent);
            const htmlContainer = renderer.renderWithStyles(result);
            const html = htmlContainer.innerHTML;
            expect(html).toContain('class="notedown-paragraph"');
            expect(html).toContain("본문을 이렇게 적을 수 있음");
            expect(html).toContain("두번 내려쓰면 다음 문단으로 전환");
        });
    });
    describe("Body Plus Sample Tests", () => {
        const bodyPlusContent = `본문 안에서 **Bold체** *Italic 체* __Underline__ ~~Crossline~~ \`Code\` \`Code with \\\` code syntax mark\`

본문을 |f#red,빨간 글씨| |b#blue,파란 배경| |f#fff,b#000,검정 배경 흰 글씨| |\\f#그저 아무것도 꾸미지 않았으나 색칠 문법 쓰기|
본몬을 \\|f#red,빨간 글씨로 표현되는 문법을 가진 그냥 글씨\\| |색칠 구문 안에 있으나 아무 색칠도 하지 않은 글씨|

링크 넣기 [링크 텍스트](https://google.com)

이미지 넣기
![이미지 alt](https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png)`;
        test("should parse all text formatting options", () => {
            const result = parseNotedown(bodyPlusContent);
            const jsonStr = JSON.stringify(result);
            // Check for formatting types
            expect(jsonStr).toContain('"format":"bold"');
            expect(jsonStr).toContain('"format":"italic"');
            expect(jsonStr).toContain('"format":"underline"');
            expect(jsonStr).toContain('"format":"crossline"');
            expect(jsonStr).toContain('"format":"code"');
        });
        test("should parse color formatting", () => {
            const result = parseNotedown(bodyPlusContent);
            const jsonStr = JSON.stringify(result);
            // Check for color formatting
            expect(jsonStr).toContain('"format":"color"');
            expect(jsonStr).toContain('"foreground":"red"');
            expect(jsonStr).toContain('"background":"blue"');
            expect(jsonStr).toContain('"foreground":"fff"');
            expect(jsonStr).toContain('"background":"000"');
        });
        test("should parse links correctly", () => {
            const result = parseNotedown(bodyPlusContent);
            const jsonStr = JSON.stringify(result);
            expect(jsonStr).toContain('"link":"https://google.com"');
            expect(jsonStr).toContain('"text":"링크 텍스트"');
        });
        test("should parse images correctly", () => {
            const result = parseNotedown(bodyPlusContent);
            const jsonStr = JSON.stringify(result);
            expect(jsonStr).toContain('"type":"image"');
            expect(jsonStr).toContain('"alt":"이미지 alt"');
            expect(jsonStr).toContain("upload.wikimedia.org");
        });
        test("should handle escape sequences in formatting", () => {
            const result = parseNotedown(bodyPlusContent);
            const jsonStr = JSON.stringify(result);
            // Should handle escaped color syntax
            expect(jsonStr).toContain("그저 아무것도 꾸미지 않았으나 색칠 문법 쓰기");
            expect(jsonStr).toContain("빨간 글씨로 표현되는 문법을 가진 그냥 글씨");
        });
        test("should render formatted text to HTML", () => {
            const result = parseNotedown(bodyPlusContent);
            const htmlContainer = renderer.renderWithStyles(result);
            const html = htmlContainer.innerHTML;
            expect(html).toContain('class="notedown-bold"');
            expect(html).toContain('class="notedown-italic"');
            expect(html).toContain('class="notedown-underline"');
            expect(html).toContain('class="notedown-crossline"');
            expect(html).toContain('class="notedown-inline-code"'); // Correct class name
            expect(html).toContain('class="notedown-color"');
            expect(html).toContain('class="notedown-image"');
        });
    });
    describe("Code Sample Tests", () => {
        const codeContent = `\`\`\`
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
        test("should parse basic code blocks", () => {
            const result = parseNotedown(codeContent);
            const codeBlocks = result.content.filter((item) => item.type === "code");
            expect(codeBlocks.length).toBeGreaterThanOrEqual(2);
            expect(codeBlocks[0].content).toBe("코드 적기");
        });
        test("should parse code blocks with language", () => {
            const result = parseNotedown(codeContent);
            const codeBlocks = result.content.filter((item) => item.type === "code");
            const tsBlock = codeBlocks.find((block) => block.lang === "ts");
            expect(tsBlock).toBeTruthy();
            expect(tsBlock.content).toContain("let a: number = 123");
            expect(tsBlock.content).toContain('console.log("Hello World")');
        });
        test("should handle escaped code syntax", () => {
            const result = parseNotedown(codeContent);
            const codeBlocks = result.content.filter((item) => item.type === "code");
            // Should handle escaped backticks in code content
            const escapedBlock = codeBlocks.find((block) => block.content.includes("```"));
            expect(escapedBlock).toBeTruthy();
        });
        test("should render code blocks to HTML", () => {
            const result = parseNotedown(codeContent);
            const htmlContainer = renderer.renderWithStyles(result);
            const html = htmlContainer.innerHTML;
            expect(html).toContain('<pre class="notedown-code-block"');
            expect(html).toContain("<code");
            expect(html).toContain('class="language-ts hljs"');
            expect(html).toContain('data-lang="ts"');
            expect(html).toContain("코드 적기");
        });
    });
    describe("Meta Sample Tests", () => {
        const metaContent = `\\meta title=메타 리딩 테스트
\\meta meta2=메타 여러개 불러오기

# 메타로 제목 쓰기, @{title}

본문, 메타 문법을 그대로 내보내기 \\@{title}

중간 부분에서 메타로 쓰인것은 인식이 되지 않고 문자 그대로 출력됨

\\meta nonmeta=1234`;
        test("should parse meta variables", () => {
            const result = parseNotedown(metaContent);
            expect(result.meta).toBeTruthy();
            expect(result.meta.title).toBe("메타 리딩 테스트");
            expect(result.meta.meta2).toBe("메타 여러개 불러오기");
        });
        test("should handle meta references in content", () => {
            const result = parseNotedown(metaContent);
            const jsonStr = JSON.stringify(result);
            // Should contain meta references using "meta" property
            expect(jsonStr).toContain('"meta":"title"');
        });
        test("should handle escaped meta references", () => {
            const result = parseNotedown(metaContent);
            const jsonStr = JSON.stringify(result);
            // Should contain literal text for escaped meta references
            expect(jsonStr).toContain("@{title}");
            expect(jsonStr).not.toContain("\\@{title}"); // The backslash should be removed
        });
        test("should properly handle raw meta syntax with backslash", () => {
            const rawMetaContent = `\\meta title=Raw Test\n\n# Title with \\@{title}`;
            const result = parseNotedown(rawMetaContent);
            const jsonStr = JSON.stringify(result);
            // Check if meta is defined
            expect(result.meta?.title).toBe("Raw Test");
            // Raw meta reference should be preserved as text
            expect(jsonStr).toContain("@{title}");
            // Should not replace the raw meta reference with its value
            expect(jsonStr).not.toContain("Title with Raw Test");
        });
        test("should ignore meta definitions in middle of content", () => {
            const result = parseNotedown(metaContent);
            // Meta defined in middle should not be in meta object
            expect(result.meta?.nonmeta).toBeUndefined();
        });
        test("should render meta references to HTML", () => {
            const result = parseNotedown(metaContent);
            const htmlContainer = renderer.renderWithStyles(result);
            const html = htmlContainer.innerHTML;
            expect(html).toContain("메타 리딩 테스트");
            expect(html).toContain('class="notedown-meta-ref"');
            expect(html).toContain('data-meta-key="title"'); // Correct attribute name
        });
    });
    describe("Title Sample Tests", () => {
        const titleContent = `# 마크다운의 문법 그대로 따라감.

## 작은 해딩

### 더 작은 해딩

#### 매우 작은 해딩

##### 진짜 작은 해딩

~# 설명 글씨`;
        test("should parse all heading levels", () => {
            const result = parseNotedown(titleContent);
            // Find titles nested within paragraphs
            const allTitles = [];
            result.content.forEach((item) => {
                if (item.type === "paragraph" && item.content) {
                    item.content.forEach((contentItem) => {
                        if (contentItem.type === "title") {
                            allTitles.push(contentItem);
                        }
                    });
                }
            });
            expect(allTitles).toHaveLength(5); // h1 through h5
            expect(allTitles[0].size).toBe(1);
            expect(allTitles[1].size).toBe(2);
            expect(allTitles[2].size).toBe(3);
            expect(allTitles[3].size).toBe(4);
            expect(allTitles[4].size).toBe(5);
        });
        test("should parse description text", () => {
            const result = parseNotedown(titleContent);
            // Find description nested within paragraph
            const descriptions = [];
            result.content.forEach((item) => {
                if (item.type === "paragraph" && item.content) {
                    item.content.forEach((contentItem) => {
                        if (contentItem.type === "desc") {
                            descriptions.push(contentItem);
                        }
                    });
                }
            });
            expect(descriptions).toHaveLength(1);
            expect(descriptions[0].text[0].text).toBe("설명 글씨");
        });
        test("should parse heading text correctly", () => {
            const result = parseNotedown(titleContent);
            // Find titles nested within paragraphs
            const allTitles = [];
            result.content.forEach((item) => {
                if (item.type === "paragraph" && item.content) {
                    item.content.forEach((contentItem) => {
                        if (contentItem.type === "title") {
                            allTitles.push(contentItem);
                        }
                    });
                }
            });
            expect(allTitles[0].text[0].text).toBe("마크다운의 문법 그대로 따라감.");
            expect(allTitles[1].text[0].text).toBe("작은 해딩");
            expect(allTitles[2].text[0].text).toBe("더 작은 해딩");
            expect(allTitles[3].text[0].text).toBe("매우 작은 해딩");
            expect(allTitles[4].text[0].text).toBe("진짜 작은 해딩");
        });
        test("should render titles and descriptions to HTML", () => {
            const result = parseNotedown(titleContent);
            const htmlContainer = renderer.renderWithStyles(result);
            const html = htmlContainer.innerHTML;
            expect(html).toContain('<h1 class="notedown-title notedown-title-1"');
            expect(html).toContain('<h2 class="notedown-title notedown-title-2"');
            expect(html).toContain('<h3 class="notedown-title notedown-title-3"');
            expect(html).toContain('<h4 class="notedown-title notedown-title-4"');
            expect(html).toContain('<h5 class="notedown-title notedown-title-5"');
            expect(html).toContain('class="notedown-description"');
            expect(html).toContain("마크다운의 문법 그대로 따라감");
            expect(html).toContain("설명 글씨");
        });
    });
    describe("Collapse Sample Tests", () => {
        const collapseContent = `#> 접을 수 있는 제목
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
        test("should parse all collapse types", () => {
            const result = parseNotedown(collapseContent);
            const collapseBlocks = result.content.filter((item) => item.type === "collapse");
            expect(collapseBlocks).toHaveLength(5);
            // Check sizes
            expect(collapseBlocks[0].size).toBe(1);
            expect(collapseBlocks[1].size).toBe(2);
            expect(collapseBlocks[2].size).toBe(3);
            expect(collapseBlocks[3].size).toBeUndefined(); // Simple collapse
            expect(collapseBlocks[4].size).toBeUndefined(); // Simple collapse
        });
        test("should parse Korean text in collapse titles", () => {
            const result = parseNotedown(collapseContent);
            const collapseBlocks = result.content.filter((item) => item.type === "collapse");
            // Check titles by accessing collapse titles (assuming they are text nodes)
            const title0 = collapseBlocks[0].text.find((t) => "text" in t);
            const title1 = collapseBlocks[1].text.find((t) => "text" in t);
            const title2 = collapseBlocks[2].text.find((t) => "text" in t);
            expect(title0 && "text" in title0 ? title0.text : null).toBe("접을 수 있는 제목");
            expect(title1 && "text" in title1 ? title1.text : null).toBe("접을 수 있는 2제목");
            expect(title2 && "text" in title2 ? title2.text : null).toBe("접을 수 있는 3제목");
        });
        test("should handle escape sequences in collapse", () => {
            const result = parseNotedown(collapseContent);
            const jsonStr = JSON.stringify(result);
            // Should contain escaped content
            expect(jsonStr).toContain("접기 탈출 문법을 보여주기");
        });
        test("should render collapse blocks to HTML", () => {
            const result = parseNotedown(collapseContent);
            const htmlContainer = renderer.renderWithStyles(result);
            const html = htmlContainer.innerHTML;
            expect(html).toContain('<details class="notedown-collapse notedown-collapse-1"');
            expect(html).toContain('<details class="notedown-collapse notedown-collapse-2"');
            expect(html).toContain('<details class="notedown-collapse notedown-collapse-3"');
            expect(html).toContain('<summary class="notedown-collapse-title"');
            expect(html).toContain('data-size="1"');
            expect(html).toContain('data-size="2"');
            expect(html).toContain('data-size="3"');
        });
    });
    describe("Integration Tests - Mixed Content", () => {
        test("should handle document with all features combined", () => {
            const mixedContent = `\\meta title=Complete Test
\\meta author=Test Suite

# @{title} by @{author}

~# This document tests all notedown features

## Basic Text Formatting

Regular paragraph with **bold**, *italic*, __underline__, ~~strikethrough~~, and \`code\`.

Colored text: |f#red,red text| and |b#yellow,yellow background|.

## Code Blocks

\`\`\`javascript
function test() {
    console.log("Testing all features");
}
\`\`\`

## Links and Images

Visit [Google](https://google.com) for search.

![Test Image](https://via.placeholder.com/150)

## Collapse Sections

#> Level 1 Collapse
Content with **formatting** inside collapse.
\\#>

##> Level 2 Collapse  
More content here.
\\##>

|> Simple Collapse
Simple collapse content.
\\|>`;
            const result = parseNotedown(mixedContent);
            // Test meta
            expect(result.meta?.title).toBe("Complete Test");
            expect(result.meta?.author).toBe("Test Suite");
            // Test content types - adjust based on actual parser behavior
            const contentTypes = result.content.map((item) => item.type);
            expect(contentTypes).toContain("paragraph"); // Main content type
            expect(contentTypes).toContain("code");
            expect(contentTypes).toContain("collapse");
            // Test rendering
            const htmlContainer = renderer.renderWithStyles(result);
            const html = htmlContainer.innerHTML;
            expect(html).toContain("Complete Test");
            expect(html).toContain("Test Suite");
            expect(html).toContain('class="notedown-paragraph"');
            expect(html).toContain('class="notedown-code-block"');
            expect(html).toContain('class="notedown-collapse"');
            expect(html).toContain('class="notedown-image"');
        });
    });
});
//# sourceMappingURL=samples-comprehensive.test.js.map