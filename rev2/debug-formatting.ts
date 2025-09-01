import { NotedownParser } from './src/index';

const parser = new NotedownParser();

const testInputs = [
  "**bold text**",
  "*italic text*",
  "- bullet item",
  "* another bullet",
  "1. numbered item"
];

testInputs.forEach((input, i) => {
  console.log(`Test ${i + 1}: "${input}"`);
  const result = parser.parse(input);
  console.log(`Result: ${result.content[0].type}`);
  if (result.content[0].type === 'list') {
    console.log(`  List with ${result.content[0].children?.length} items`);
  } else if (result.content[0].type === 'paragraph') {
    console.log(`  Paragraph with ${result.content[0].children?.length} children`);
    console.log(`  First child: ${result.content[0].children?.[0]?.type}`);
  }
  console.log('');
});
