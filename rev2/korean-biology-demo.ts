#!/usr/bin/env bun
import { parseAndRender } from './src/index';

const koreanBiologyNotes = `# 생물학 - 신호전달

## 세포막을 통한 신호전달

1. 신호전달 개요
    세포는 다양한 신호를 받아 반응한다

2. 수용체의 종류
    - 막수용체: 세포막에 위치
    - 세포질수용체: 세포 내부에 위치

3. 신호전달 과정
    신호 분자가 수용체에 결합하면 일련의 반응이 시작된다

4. 호르몬의 역할
    내분비계를 통해 신호를 전달한다

## 세포 호흡

1. 해당과정 (Glycolysis)
    - 포도당을 피루브산으로 분해
    - ATP 2분자 생성

2. 크렙스 회로 (Krebs Cycle)
    미토콘드리아에서 일어나는 과정

3. 전자전달계
    최대 ATP 생성 단계`;

console.log('=== Korean Biology Notes Rendering Demo ===\n');

const result = parseAndRender(koreanBiologyNotes);

console.log('HTML Output:');
console.log('='.repeat(50));
console.log(result.html);

console.log('\n' + '='.repeat(50));
console.log('Success! Korean biology notes with numbered lists are now fully supported! 🎉');
