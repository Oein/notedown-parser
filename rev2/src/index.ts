// Main exports
export { NotedownParser } from "./parser/NotedownParser";
export { NotedownRenderer } from "./renderer/NotedownRenderer";

// Type exports
export type {
  ParsedContent,
  ParserOptions,
  RendererOptions,
  ASTNode,
  ASTNodeType,
  CollapseNode,
  ColoredTextNode,
  CodeBlockNode,
  MetaReferenceNode,
} from "./types";

import { NotedownParser } from "./parser/NotedownParser";
import { NotedownRenderer } from "./renderer/NotedownRenderer";
import { ParserOptions, RendererOptions } from "./types";

// Convenience function to parse and render in one go
export function parseAndRender(
  input: string,
  options: {
    parser?: ParserOptions;
    renderer?: RendererOptions;
  } = {}
): { html: string; css: string; meta: { [key: string]: string } } {
  const parser = new NotedownParser(options.parser);
  const renderer = new NotedownRenderer(options.renderer);

  const parsed = parser.parse(input);
  const { html, css } = renderer.renderWithCSS(parsed.content, parsed.meta);

  return {
    html,
    css,
    meta: parsed.meta,
  };
}

// Default instance exports for common use cases
export const parser = new NotedownParser();
export const renderer = new NotedownRenderer();
