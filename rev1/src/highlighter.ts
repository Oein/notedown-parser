/**
 * Notedown syntax highlighting module
 * This provides syntax highlighting for code blocks using highlight.js
 */
import { highlighterLoader } from "./highlighter-loader";

// Notedown highlighter with dynamic language loading
export class NotedownHighlighter {
  // In-memory cache for processed code
  private static cache = new Map<string, string>();

  /**
   * Apply syntax highlighting to a rendered notedown container
   * @param container The HTML element containing the rendered notedown
   * @param useExternalHighlighter Whether to use highlight.js (defaults to true)
   */
  static async highlight(
    container: Element,
    useExternalHighlighter: boolean = true
  ): Promise<void> {
    // Find all code blocks marked for highlighting
    const codeBlocks = container.querySelectorAll(
      'pre[data-highlight="true"] code'
    );

    if (!codeBlocks.length) return;

    // Use the appropriate highlighter
    if (useExternalHighlighter) {
      await this.applyExternalHighlighter(codeBlocks);
    } else {
      // Use basic highlighting as fallback
      this.applyBasicHighlighter(codeBlocks);
    }
  }

  /**
   * Apply highlighting using highlight.js with dynamic language loading
   */
  private static async applyExternalHighlighter(
    codeBlocks: NodeListOf<Element>
  ): Promise<void> {
    // Process each code block
    for (const codeElement of codeBlocks) {
      try {
        // Extract the language from the class
        const classList = codeElement.className?.split(" ") || [];
        const langClass = classList.find((cls) => cls.startsWith("language-"));
        const language = langClass ? langClass.replace("language-", "") : null;

        const code = codeElement.textContent || "";

        // Check cache first
        const cacheKey = `${language}:${code}`;
        if (this.cache.has(cacheKey)) {
          codeElement.innerHTML = this.cache.get(cacheKey) || "";
          continue;
        }

        // Apply highlighting based on the language
        let highlightedCode;
        if (language) {
          highlightedCode = await highlighterLoader.highlight(code, language);
        } else {
          // No language specified, use auto detection with the loader
          highlightedCode = await highlighterLoader.highlight(code, "");
        }

        // Store in cache and update element
        this.cache.set(cacheKey, highlightedCode);
        codeElement.innerHTML = highlightedCode;
      } catch (error) {
        console.warn("Highlight.js error:", error);
      }
    }
  }

  /**
   * Apply basic highlighting for when highlight.js is not available
   * This provides minimal syntax coloring for common programming constructs
   */
  private static applyBasicHighlighter(codeBlocks: NodeListOf<Element>): void {
    codeBlocks.forEach((codeElement) => {
      const code = codeElement.textContent || "";
      const cacheKey = `basic:${code}`;

      // Check cache first
      if (this.cache.has(cacheKey)) {
        codeElement.innerHTML = this.cache.get(cacheKey) || "";
        return;
      }

      // Apply very basic syntax highlighting with regex
      let highlighted = code
        // Replace HTML special characters to prevent XSS
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        // Comments
        .replace(/(\/\/.*?)($|\n)/g, '<span class="hljs-comment">$1</span>$2')
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hljs-comment">$1</span>')
        // Strings
        .replace(/("(?:\\.|[^"\\])*")/g, '<span class="hljs-string">$1</span>')
        .replace(/('(?:\\.|[^'\\])*')/g, '<span class="hljs-string">$1</span>')
        // Keywords
        .replace(
          /\b(function|return|var|let|const|if|else|for|while|class|import|export|from|async|await)\b/g,
          '<span class="hljs-keyword">$1</span>'
        )
        // Numbers
        .replace(/\b(\d+\.?\d*)\b/g, '<span class="hljs-number">$1</span>');

      // Store in cache and update element
      this.cache.set(cacheKey, highlighted);
      codeElement.innerHTML = highlighted;
    });
  }

  /**
   * Clear the highlighting cache
   */
  static clearCache(): void {
    this.cache.clear();
  }
}
