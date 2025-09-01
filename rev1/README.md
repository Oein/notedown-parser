# notedown-parser

A TypeScript parser and renderer for Notedown markup language with syntax highlighting support.

## Features

- 🔍 Parse Notedown markup into structured data
- 🎨 Render Notedown to HTML with styling
- ✨ Syntax highlighting support
- 📝 Meta variables and inline formatting
- 🏷️ Table rendering
- 🎯 TypeScript support with full type definitions

## Installation

```bash
npm install notedown-parser
```

## Quick Start

```typescript
import {
  parseNotedown,
  NotedownRenderer,
  renderNotedown,
} from "notedown-parser";

// Quick render (parse + render in one step)
const htmlElement = await renderNotedown(notedownText, document);

// Or use individual components
const parsedData = parseNotedown(notedownText);
const renderer = new NotedownRenderer(document);
const htmlElement = renderer.renderWithStyles(parsedData);
```

## ⚡ Multi-Environment Support

Built with **Webpack** for optimal compatibility across:

- 🌐 **Browser**: ES modules with tree shaking support
- 📦 **Node.js**: Complete CommonJS + ES module compatibility
- ⚡ **Bun**: Native support with optimal performance

### Individual Modules (No Bundling)

Each module is transpiled and minified separately, preserving the original module structure:

```typescript
// Tree-shakable imports - import only what you need
import { parseNotedown } from "notedown-parser/parser"; // 5.6KB
import { NotedownRenderer } from "notedown-parser/renderer"; // 12.1KB
import { NotedownHighlighter } from "notedown-parser/highlighter"; // 1.5KB

// Main bundle with all exports
import { parseNotedown, renderNotedown } from "notedown-parser"; // 0.7KB + dependencies
```

### Module Sizes (Webpack minified)

- **index.min.js**: 0.7KB (main exports only)
- **parser.min.js**: 5.6KB (standalone parser)
- **renderer.min.js**: 12.1KB (standalone renderer)
- **highlighter.min.js**: 1.5KB (syntax highlighting)
- **Total package**: 44.9KB

## API Reference

### Functions

- `parseNotedown(ndText: string)` - Parse Notedown text into structured data
- `renderNotedown(ndText: string, document?: Document, useHighlighting?: boolean)` - Parse and render in one step

### Classes

- `NotedownRenderer` - Renders parsed Notedown data to HTML
- `NotedownHighlighter` - Provides syntax highlighting functionality
- `HighlighterLoader` - Manages highlight.js loading and configuration

### CSS Styling

Import the minified CSS theme for syntax highlighting:

```css
@import "notedown-parser/highlight-theme.css";
```

## Development

To build the project:

```bash
npm run build
```

To clean the build:

```bash
npm run clean
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
