import { NotedownParser } from './src/index';

const parser = new NotedownParser();

const testInput = `1. 
2. Second item`;

console.log('Testing empty list item parsing...');
console.log('Input:');
console.log(JSON.stringify(testInput));

const result = parser.parse(testInput);
console.log('\nParsed result:');
console.log(JSON.stringify(result, null, 2));
