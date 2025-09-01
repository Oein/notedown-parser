# Notedown

# Rules

1. Bun을 기반으로 함.
2. Bun test를 이용해 모든 기능에 대해 test가 존재해야 하며 jsdom으로 DOM 테스트 또한 진행할 것.
3. 모든 css의 색은 variable로써 지정 하고 사용해야 하며, colored text는 inline-css(style tag of span)를 사용함.
4. 이 프로젝트는 Parser와 Renderer 두 부분으로 나뉨.
5. Parsed Content의 결과는 다음과 같음.

```ts
{
    "meta": {[key: string]: string};
    "content": any; // 이 부분은 결과에 따라 달라질 수 있음.
}
```

6. 파싱된 내용을 Renderer에서 최대한 사용하기 편리하게 반환해야함.
7. 이 프로젝트는 NPM에 배포할 목적으로 만들어짐.
8. Nodejs, Bun, Browser 환경에서 동작해야함.
9. Webpack을 사용해 빌드할 것.
10. Webpack을 사용하되 이 모듈 내부에서 사용하는 dependency들은 bundle하지 말것. 즉 Webpack은 minify용.
11. 샘플 파일들은 `samples` 폴더에 존재함.
12. 모든 기능들을 나눌 수 있다면 각 파일별로 나눠 Component 식으로 작성함을 권장하나, 구현의 복잡도나 최적화를 위해서 라면 같은 파일에 코드를 둬도 괜찮음.
13. 최대한 하드코딩 하지 말것.
14. 결과물을 playwright을 통해 결과물을 스크린샷 찍고 직접 확인하면서 개발하는것을 권장.
15. node 말고 bun 쓰는 것을 권장함.
16. 테스트시 잘못 만들어서 무한 루프에 걸릴 수 있으니 `gtimeout`을 설정하는 것을 권장함. Parser같은 경우 오래 걸리지 않기 때문에 10초 정도를 권장함.
17. **bun test**는 `--timeout`을 지원하지 않음. 무한 루프에 걸리지 않게 유의할것.
18. 디버그용 파일은 `debug.ts` 딱 하나만 사용할것. 새로히 파일을 만들지 말것.
19. `PROGRESS.md` 파일을 읽고 현재 상황을 이해할것.
20. 많은 작업이 들어왔을 경우 우선순위를 정하고 정한것들을 미래의 너에게 알리기 위해 `PROGRESS.md`에 작성해 놓을것.
21. 한 새션에서는 딱 하나의 작업만 할것. 여러 작업을 동시에 하지 말것. 여러 작업이 필요하다면 `PROGRESS.md`에 기록해 두고 다음 세션에서 처리할것.

# TODO

1. Bun으로 프로젝트 setup하기
2. Markdown Syntax 구현하기

   - Bold `**`
   - Italic `*`
   - Underline `__`
   - Crossline `~~`
   - LaTeX `$`
   - Escaping `\`
   - Inline Code `Backquote`
   - Code Block `Backquote Backquot Backquot`

     - Mermaid chart

     ```mermaid
     flowchart TD

     subgraph Z[" "]
     direction LR
         자궁벽 --> id1["물리적 수축(진통)"]
         id2[옥시토신] --> id1
         id1 --> 뇌
         뇌 --> 시상하부 --> id3["옥시토신 분비 촉진"]
     end
     ```

     - code highliting (hljs)

   - Table
   - Image
   - URL
   - 인용 `>`
   - List (1., 2., 3., -.,)
   - Nested List

3. Notedown Syntax 구현하기.

   - Colored text: `docs/coloredtext.md` 참조
   - Collapse `docs/collapse.md` 참조
   - Description Header
     > `~# 설명 글씨` 이렇게 쓸 수 있음.
   - Raw HTML Code
     > 코드 블록의 언어가 `html:raw` 인 경우 그 내용을 그대로 렌더링함.
   - Meta `docs/meta.md` 참조
   - 특수 기능
     > 한 줄에 `\n` 을 작성함으로써 같은 문단을 유지하면서 빈 줄을 만들 수 있음.
     > `\p`를 이용하여 강제로 다음 문단으로 내릴 수 있음.
     > 위 두 기능은 한줄에 자신만이 존재해야 하며, 앞이나 뒤에 본문이 존재할경우 escaped로 판정하고 출력함.

4. Renderer 구현하기.
   - 개발자가 완성된 css를 직접 로딩하는 방식으로 구현함. 즉 우리는 css를 자동으로 inject 해주지 않음.
