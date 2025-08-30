// Notedown module - Main exports
export { parseNotedown } from "./parser";
export { NotedownRenderer } from "./renderer";
export { NotedownHighlighter } from "./highlighter";
export { highlighterLoader, HighlighterLoader } from "./highlighter-loader";
export * from "./types";

// Import for internal use
import { parseNotedown } from "./parser";
import { NotedownRenderer } from "./renderer";
import { NotedownHighlighter } from "./highlighter";

/**
 * Convenience function to parse and render notedown in one step
 * @param ndText Notedown text to render
 * @param document Document object to create elements with
 * @param useHighlighting Whether to apply syntax highlighting (defaults to true)
 * @returns The rendered HTML element
 */
export async function renderNotedown(
  ndText: string,
  document?: Document,
  useHighlighting: boolean = true
): Promise<HTMLElement> {
  const parsedData = parseNotedown(ndText);
  const renderer = new NotedownRenderer(document);
  const result = renderer.renderWithStyles(parsedData);

  // Apply syntax highlighting if document is available
  if (document && useHighlighting) {
    await NotedownHighlighter.highlight(result, true);
  }

  return result;
}
