# Collapse

```nd
#> 접을 수 있는 제목
제목 안의 본문
\#>

##> 접을 수 있는 2제목
제목 안의 본문
\##>

###> 접을 수 있는 3제목
제목 안의 본문
\###>

|> 그냥 접을 수 있는 본문
asdsd
\|>

|> 그냥 접을 수 있는 본문 2
\\|>
접기 탈출 문법을 보여주기
\|>

탈출 문자로 탈출 가능

|> Nested Collapse - Outer
# Body 1
    |> Nested Collapse - Inner
    # Body2
    \|>
    |> Nested Collapse - Inner 2
# This is nested inner 2's content. Not outer collapse
    \|>
\|>
```

- 위와 같이 Collapse 시작과 끝 부분으로 나뉨.
- Nested Collapse를 지원
- Collapse안의 본문은 새로운 문서처럼 취급하나 meta 로딩은 해서는 안됨. (meta의 관점에서는 본문의 중간으로 생각하나, 전체의 시점에서는 새로운 문서인것임.)
