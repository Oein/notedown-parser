import { NotedownParser, NotedownRenderer } from './src/index';

const comprehensiveTest = `# List Formatting Test

## Numbered Lists

1. 시각정 정보전달
    
    장점: 많은 양의 정보 전달
    
    단점: 방향의 일치가 필요함
    
    매질이 없을때 가장 빠름 (빛의 전달이기 때문)
    
2. 청각정 정보전달
    
    장점: 방향의 일치가 필요하지 않음
    
    단점: 적은 양의 정보 전달
    
3. 화학적 정보전달
    
    장점: 많은 양의 정보 전달, 방향의 일치 필요 X

## Bullet Lists

- First bullet point
    
    Some nested content here
    
- Second bullet point
    
    More nested content with **bold** and *italic* formatting
    
- Third bullet point

## Mixed Content

1. Numbered item with code
    
    \`\`\`javascript
    console.log("Hello World");
    \`\`\`
    
2. Numbered item with table
    
    | Column 1 | Column 2 |
    |----------|----------|
    | Data 1   | Data 2   |
    
3. Final numbered item`;

const parser = new NotedownParser();
const renderer = new NotedownRenderer();

console.log('=== Comprehensive List Test ===');
const parsed = parser.parse(comprehensiveTest);

const lists = parsed.content.filter(item => item.type === 'list');
console.log(`Found ${lists.length} lists total`);

lists.forEach((list, i) => {
    console.log(`List ${i + 1}: ${list.attributes?.isNumbered ? 'Numbered' : 'Bulleted'} with ${list.children?.length} items`);
});

const html = renderer.render(parsed.content);
console.log('\nHTML structure example:');
console.log(html.substring(0, 500) + '...');
