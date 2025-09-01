
    import { readFileSync } from 'fs';
    import { parseNotedown } from './src/parser.patched';

    const testDoc = readFileSync('./test-mermaid-doc.nd', 'utf8');
    const result = parseNotedown(testDoc);
    console.log(JSON.stringify(result, null, 2));
    