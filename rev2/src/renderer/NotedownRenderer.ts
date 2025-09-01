import type { ASTNode, RendererOptions } from "../types";

export class NotedownRenderer {
  private options: RendererOptions;
  private meta: { [key: string]: string } = {};

  constructor(options: RendererOptions = {}) {
    this.options = {
      cssVariables: {},
      highlightCode: true,
      ...options,
    };
  }

  render(content: ASTNode[], meta: { [key: string]: string } = {}): string {
    this.meta = meta;
    return this.renderNodes(content);
  }

  private renderNodes(nodes: ASTNode[]): string {
    return nodes.map((node) => this.renderNode(node)).join("");
  }

  private renderNode(node: ASTNode): string {
    switch (node.type) {
      case "text":
        return this.escapeHtml(node.content || "");

      case "paragraph":
        return `<p>${this.renderNodes(node.children || [])}</p>\n`;

      case "heading":
        const level = node.attributes?.level || 1;
        return `<h${level}>${this.renderNodes(
          node.children || []
        )}</h${level}>\n`;

      case "descriptionHeader":
        const descLevel = node.attributes?.level || 1;
        return `<div class="description-header description-header-${descLevel}">
          <h${descLevel}>${this.renderNodes(
          node.children || []
        )}</h${descLevel}>
        </div>\n`;

      case "bold":
        return `<strong>${this.renderNodes(node.children || [])}</strong>`;

      case "italic":
        return `<em>${this.renderNodes(node.children || [])}</em>`;

      case "underline":
        return `<u>${this.renderNodes(node.children || [])}</u>`;

      case "strikethrough":
        return `<s>${this.renderNodes(node.children || [])}</s>`;

      case "code":
        return `<code>${this.escapeHtml(node.content || "")}</code>`;

      case "codeBlock":
        const language = node.attributes?.language || "";
        const codeContent = this.escapeHtml(node.content || "");

        if (this.options.highlightCode && language) {
          return `<pre><code class="language-${language}" data-language="${language}">${codeContent}</code></pre>\n`;
        }
        return `<pre><code>${codeContent}</code></pre>\n`;

      case "rawHtml":
        return node.content || "";

      case "mermaidChart":
        return `<div class="mermaid-chart" data-mermaid="${this.escapeHtml(
          node.content || ""
        )}">
          <pre class="mermaid-source">${this.escapeHtml(
            node.content || ""
          )}</pre>
        </div>\n`;

      case "latex":
        return `<span class="latex" data-latex="${this.escapeHtml(
          node.content || ""
        )}">${this.escapeHtml(node.content || "")}</span>`;

      case "coloredText":
        const foreground = node.attributes?.foreground;
        const background = node.attributes?.background;
        let style = "";

        if (foreground) {
          style += `color: ${foreground};`;
        }
        if (background) {
          style += `background-color: ${background};`;
        }

        return `<span class="colored-text" style="${style}">${this.escapeHtml(
          node.content || ""
        )}</span>`;

      case "metaReference":
        const key = node.attributes?.key || "";
        const value = this.meta[key] || `@{${key}}`;
        return `<span class="meta-reference" data-key="${key}">${this.escapeHtml(
          value
        )}</span>`;

      case "link":
        const url = node.attributes?.url || "";
        const linkText =
          node.children && node.children.length > 0
            ? this.renderNodes(node.children)
            : this.escapeHtml(node.attributes?.text || url);
        return `<a href="${this.escapeHtml(url)}">${linkText}</a>`;

      case "image":
        const imgUrl = node.attributes?.url || "";
        const alt = node.attributes?.alt || "";
        return `<img src="${this.escapeHtml(imgUrl)}" alt="${this.escapeHtml(
          alt
        )}">`;

      case "blockquote":
        return `<blockquote>\n${this.renderNodes(
          node.children || []
        )}</blockquote>\n`;

      case "list":
        const listClass = node.attributes?.isNumbered ? "notedown-list-numbered" : "notedown-list-bulleted";
        return `<div class="notedown-list ${listClass}">\n${this.renderNodes(
          node.children || []
        )}</div>\n`;

      case "listItem":
        const marker = node.attributes?.marker || "";
        const children = node.children || [];
        
        // Separate the main text content from nested content
        let mainContent = "";
        let nestedContent = "";
        let hasNested = false;
        
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          if (child.type === "text" && i === 0) {
            // First text node is the main item content
            mainContent = this.renderNode(child);
          } else {
            // Everything else is nested content
            if (!hasNested) {
              hasNested = true;
              nestedContent = '<div class="notedown-list-nested">\n';
            }
            nestedContent += this.renderNode(child);
          }
        }
        
        if (hasNested) {
          nestedContent += '</div>\n';
        }
        
        return `<div class="notedown-list-item">
          <div class="notedown-list-item-content">
            <span class="notedown-list-marker">${this.escapeHtml(marker)}</span>
            <span class="notedown-list-text">${mainContent}</span>
          </div>
          ${nestedContent}
        </div>\n`;

      case "table":
        return `<table class="notedown-table">\n${this.renderNodes(
          node.children || []
        )}</table>\n`;

      case "tableRow":
        return `<tr>${this.renderNodes(node.children || [])}</tr>\n`;

      case "tableCell":
        const isHeader = node.attributes?.isHeader;
        const cellTag = isHeader ? "th" : "td";
        return `<${cellTag}>${this.renderNodes(
          node.children || []
        )}</${cellTag}>`;

      case "collapse":
        const title = node.attributes?.title || "";
        const collapseLevel = node.attributes?.level;
        const isHeaderCollapse = node.attributes?.isHeaderCollapse;

        let collapseClass = "notedown-collapse";
        if (isHeaderCollapse && collapseLevel) {
          collapseClass += ` notedown-collapse-header notedown-collapse-level-${collapseLevel}`;
        } else {
          collapseClass += " notedown-collapse-simple";
        }

        return `<details class="${collapseClass}">
          <summary class="notedown-collapse-title">${this.escapeHtml(
            title
          )}</summary>
          <div class="notedown-collapse-content">
            ${this.renderNodes(node.children || [])}
          </div>
        </details>\n`;

      case "lineBreak":
        return '<br class="notedown-line-break">\n';

      case "paragraphBreak":
        return '<div class="notedown-paragraph-break"></div>\n';

      default:
        console.warn(`Unknown node type: ${node.type}`);
        return "";
    }
  }

  private escapeHtml(text: string): string {
    const htmlEscapes: { [key: string]: string } = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return text.replace(/[&<>"']/g, (match) => htmlEscapes[match] || match);
  }

  renderWithCSS(
    content: ASTNode[],
    meta: { [key: string]: string } = {}
  ): { html: string; css: string } {
    const html = this.render(content, meta);
    const css = this.generateCSS();

    return { html, css };
  }

  private generateCSS(): string {
    const variables = Object.entries(this.options.cssVariables || {})
      .map(([key, value]) => `  --notedown-${key}: ${value};`)
      .join("\n");

    return `
/* Notedown CSS Variables */
:root {
${variables}
  /* Default variables */
  --notedown-bg-primary: #ffffff;
  --notedown-bg-secondary: #f8f9fa;
  --notedown-text-primary: #212529;
  --notedown-text-secondary: #6c757d;
  --notedown-border: #dee2e6;
  --notedown-code-bg: #f8f9fa;
  --notedown-code-border: #e9ecef;
  --notedown-blockquote-border: #007bff;
  --notedown-collapse-bg: #f8f9fa;
}

/* Basic styles */
.notedown-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: var(--notedown-text-primary);
  background-color: var(--notedown-bg-primary);
}

/* Description headers */
.description-header {
  padding: 0.5rem 0;
  border-left: 4px solid var(--notedown-blockquote-border);
  padding-left: 1rem;
  margin: 1rem 0;
  background-color: var(--notedown-bg-secondary);
}

.description-header h1, .description-header h2, .description-header h3,
.description-header h4, .description-header h5, .description-header h6 {
  margin: 0;
  color: var(--notedown-blockquote-border);
}

/* Code blocks */
pre {
  background-color: var(--notedown-code-bg);
  border: 1px solid var(--notedown-code-border);
  border-radius: 0.375rem;
  padding: 1rem;
  overflow-x: auto;
  margin: 1rem 0;
}

pre code {
  background: none;
  border: none;
  padding: 0;
  border-radius: 0;
}

code {
  background-color: var(--notedown-code-bg);
  border: 1px solid var(--notedown-code-border);
  border-radius: 0.25rem;
  padding: 0.125rem 0.25rem;
  font-size: 0.875em;
  font-family: 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

/* Colored text */
.colored-text {
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

/* Meta references */
.meta-reference {
  background-color: var(--notedown-code-bg);
  border: 1px solid var(--notedown-code-border);
  border-radius: 0.25rem;
  padding: 0.125rem 0.25rem;
  font-size: 0.875em;
  color: var(--notedown-blockquote-border);
  font-weight: 500;
}

/* Blockquotes */
blockquote {
  border-left: 4px solid var(--notedown-blockquote-border);
  padding-left: 1rem;
  margin: 1rem 0;
  color: var(--notedown-text-secondary);
  background-color: var(--notedown-bg-secondary);
  padding: 1rem;
  border-radius: 0.375rem;
}

/* Lists */
.notedown-list {
  margin: 1rem 0;
}

.notedown-list-item {
  margin: 0.5rem 0;
  line-height: 1.6;
}

.notedown-list-item-content {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.notedown-list-marker {
  flex-shrink: 0;
  font-weight: 600;
  color: var(--notedown-text-primary);
  min-width: 2rem;
}

.notedown-list-text {
  flex: 1;
}

.notedown-list-nested {
  margin-top: 0.75rem;
  margin-left: 2.5rem;
}

.notedown-list-nested > .notedown-list {
  margin: 0.5rem 0;
}

.notedown-list-nested > p {
  margin: 0.5rem 0;
}

.notedown-list-nested > blockquote,
.notedown-list-nested > pre,
.notedown-list-nested > .notedown-table,
.notedown-list-nested > .notedown-collapse {
  margin: 0.75rem 0;
}

/* Tables */
.notedown-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  border: 1px solid var(--notedown-border);
  border-radius: 0.375rem;
  overflow: hidden;
}

.notedown-table th,
.notedown-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--notedown-border);
}

.notedown-table th {
  background-color: var(--notedown-bg-secondary);
  font-weight: 600;
}

.notedown-table tr:last-child td {
  border-bottom: none;
}

/* Collapse/Details */
.notedown-collapse {
  border: 1px solid var(--notedown-border);
  border-radius: 0.375rem;
  margin: 1rem 0;
  overflow: hidden;
}

.notedown-collapse-title {
  background-color: var(--notedown-collapse-bg);
  padding: 0.75rem;
  cursor: pointer;
  font-weight: 500;
  border: none;
  outline: none;
  display: block;
  width: 100%;
  text-align: left;
}

.notedown-collapse-title:hover {
  background-color: var(--notedown-border);
}

.notedown-collapse-content {
  padding: 1rem;
}

.notedown-collapse-header .notedown-collapse-title {
  font-size: 1.25rem;
}

.notedown-collapse-level-1 .notedown-collapse-title {
  font-size: 1.5rem;
}

.notedown-collapse-level-2 .notedown-collapse-title {
  font-size: 1.375rem;
}

.notedown-collapse-level-3 .notedown-collapse-title {
  font-size: 1.25rem;
}

/* Special elements */
.notedown-line-break {
  margin: 0.5rem 0;
}

.notedown-paragraph-break {
  height: 1rem;
}

/* Mermaid charts */
.mermaid-chart {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid var(--notedown-border);
  border-radius: 0.375rem;
  background-color: var(--notedown-bg-secondary);
}

.mermaid-source {
  display: none; /* Hide by default, show when mermaid fails to render */
}

/* LaTeX */
.latex {
  font-family: 'Times New Roman', serif;
  font-style: italic;
}

/* Responsive design */
@media (max-width: 768px) {
  .notedown-container {
    padding: 0.5rem;
  }
  
  .notedown-table {
    font-size: 0.875rem;
  }
  
  .notedown-table th,
  .notedown-table td {
    padding: 0.5rem;
  }
  
  pre {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
}
`;
  }
}
