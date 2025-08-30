import type { NotedownDocument } from "./types";

// HTML Renderer for Notedown - using only document object
export class NotedownRenderer {
  private doc: Document;
  private meta: Record<string, string> = {};

  constructor(document?: Document) {
    this.doc =
      document ||
      (typeof globalThis !== "undefined" && (globalThis as any).document);
    if (!this.doc) {
      throw new Error(
        "Document object is required. Please provide one or use in a browser environment."
      );
    }
  }

  render(parsedData: NotedownDocument): HTMLElement {
    const container = this.doc.createElement("div");
    container.className = "notedown-container";

    this.meta = parsedData.meta || {};

    if (parsedData.meta) {
      for (const [key, value] of Object.entries(parsedData.meta)) {
        container.setAttribute(`data-meta-${key}`, value as string);
      }
    }

    if (parsedData.content && Array.isArray(parsedData.content)) {
      for (const item of parsedData.content) {
        const element = this.buildContentItem(item);
        if (element) {
          container.appendChild(element);
        }
      }
    }

    return container;
  }

  private buildContentItem(item: any): HTMLElement | null {
    switch (item.type) {
      case "paragraph":
        return this.buildParagraph(item);
      case "title":
        return this.buildTitle(item);
      case "desc":
        return this.buildDescription(item);
      case "code":
        return this.buildCodeBlock(item);
      case "collapse":
        return this.buildCollapse(item);
      case "image":
        return this.buildImage(item);
      case "text":
        return this.buildTextContent(item);
      case "table":
        return this.buildTable(item);
      case "newline":
        return this.buildNewline();
      default:
        console.warn("Unknown content type:", item.type);
        return null;
    }
  }

  private buildParagraph(item: any): HTMLElement {
    const p = this.doc.createElement("p");
    p.className = "notedown-paragraph";

    if (item.content && Array.isArray(item.content)) {
      for (const contentItem of item.content) {
        const element = this.buildContentItem(contentItem);
        if (element) {
          p.appendChild(element);
        }
      }
    }

    return p;
  }

  private buildTitle(item: any): HTMLElement {
    const level = Math.min(Math.max(item.size || 1, 1), 6);
    const heading = this.doc.createElement(`h${level}`);
    heading.className = `notedown-title notedown-title-${level}`;

    if (item.text && Array.isArray(item.text)) {
      for (const textItem of item.text) {
        const element = this.buildInlineContent(textItem);
        if (element) {
          heading.appendChild(element);
        }
      }
    }

    return heading;
  }

  private buildDescription(item: any): HTMLElement {
    const desc = this.doc.createElement("div");
    desc.className = "notedown-description";

    if (item.text && Array.isArray(item.text)) {
      for (const textItem of item.text) {
        const element = this.buildInlineContent(textItem);
        if (element) {
          desc.appendChild(element);
        }
      }
    }

    return desc;
  }

  private buildCodeBlock(item: any): HTMLElement {
    const pre = this.doc.createElement("pre");
    pre.className = "notedown-code-block";

    const code = this.doc.createElement("code");
    if (item.lang) {
      code.className = `language-${item.lang} hljs`;
      pre.setAttribute("data-lang", item.lang);
    } else {
      // Even without language, apply hljs class for consistent styling
      code.className = "hljs";
    }

    code.textContent = item.content || "";
    pre.appendChild(code);

    // Mark the code element for highlighting later
    pre.setAttribute("data-highlight", "true");

    return pre;
  }

  private buildCollapse(item: any): HTMLElement {
    const details = this.doc.createElement("details");
    details.className = "notedown-collapse";

    if (item.size) {
      details.setAttribute("data-size", item.size.toString());
      details.classList.add(`notedown-collapse-${item.size}`);
    }

    const summary = this.doc.createElement("summary");
    summary.className = "notedown-collapse-title";

    if (item.text && Array.isArray(item.text)) {
      for (const textItem of item.text) {
        const element = this.buildInlineContent(textItem);
        if (element) {
          summary.appendChild(element);
        }
      }
    }

    details.appendChild(summary);

    if (item.content && Array.isArray(item.content)) {
      const contentDiv = this.doc.createElement("div");
      contentDiv.className = "notedown-collapse-content";

      for (const contentItem of item.content) {
        const element = this.buildContentItem(contentItem);
        if (element) {
          contentDiv.appendChild(element);
        }
      }

      details.appendChild(contentDiv);
    }

    return details;
  }

  private buildImage(item: any): HTMLElement {
    const img = this.doc.createElement("img");
    img.className = "notedown-image";
    img.src = item.link || "";
    img.alt = item.alt || "";

    const figure = this.doc.createElement("figure");
    figure.className = "notedown-image-figure";
    figure.appendChild(img);

    if (item.alt) {
      const caption = this.doc.createElement("figcaption");
      caption.textContent = item.alt;
      figure.appendChild(caption);
    }

    return figure;
  }

  private buildTextContent(item: any): HTMLElement {
    const span = this.doc.createElement("span");
    span.className = "notedown-text";

    if (item.content && Array.isArray(item.content)) {
      for (const contentItem of item.content) {
        const element = this.buildInlineContent(contentItem);
        if (element) {
          span.appendChild(element);
        }
      }
    }

    return span;
  }

  private buildNewline(): HTMLElement {
    return this.doc.createElement("br");
  }

  private buildInlineContent(item: any): any {
    if (item.link) {
      const link = this.doc.createElement("a");
      link.className = "notedown-link";
      link.href = item.link;
      link.textContent = item.text || item.link;
      return link;
    }

    if (item.text !== undefined) {
      return this.doc.createTextNode(item.text);
    }

    if (item.meta) {
      const span = this.doc.createElement("span");
      span.className = "notedown-meta-ref";
      span.setAttribute("data-meta-key", item.meta);

      const metaValue = this.meta[item.meta];
      if (metaValue !== undefined) {
        span.textContent = metaValue;
      } else {
        span.textContent = `@{${item.meta}}`;
        span.style.color = "#ff6b6b";
        span.title = `Meta variable '${item.meta}' not found`;
      }

      return span;
    }

    if (item.format) {
      return this.buildFormattedContent(item);
    }

    console.warn("Unknown inline content type:", item);
    return null;
  }

  private buildFormattedContent(item: any): any {
    let element: any;

    switch (item.format) {
      case "bold":
        element = this.doc.createElement("strong");
        element.className = "notedown-bold";
        break;
      case "italic":
        element = this.doc.createElement("em");
        element.className = "notedown-italic";
        break;
      case "underline":
        element = this.doc.createElement("u");
        element.className = "notedown-underline";
        break;
      case "crossline":
        element = this.doc.createElement("del");
        element.className = "notedown-crossline";
        break;
      case "code":
        element = this.doc.createElement("code");
        element.className = "notedown-inline-code";
        break;
      case "latex":
        element = this.doc.createElement("span");
        element.className = "notedown-latex";
        // Simply include the formula with $ signs for MathJax to process
        element.textContent = `$${item.formula || ""}$`;
        // Set content to null to prevent the content loop from running
        item.content = null;
        break;
      case "color":
        element = this.doc.createElement("span");
        element.className = "notedown-color";
        this.applyColorStyles(element, item);
        break;
      default:
        element = this.doc.createElement("span");
        element.className = `notedown-format-${item.format}`;
        break;
    }

    if (item.content && Array.isArray(item.content)) {
      for (const contentItem of item.content) {
        const childElement = this.buildInlineContent(contentItem);
        if (childElement) {
          element.appendChild(childElement);
        }
      }
    } else if (item.text !== undefined) {
      element.textContent = item.text;
    }

    return element;
  }

  private applyColorStyles(element: any, item: any): void {
    let styles: string[] = [];

    if (item.foreground) {
      const fgColor = this.normalizeColor(item.foreground);
      styles.push(`color: ${fgColor}`);
      element.setAttribute("data-fg-color", item.foreground);
    }

    if (item.background) {
      const bgColor = this.normalizeColor(item.background);
      styles.push(`background-color: ${bgColor}`);
      element.setAttribute("data-bg-color", item.background);
    }

    if (styles.length > 0) {
      element.style.cssText = styles.join("; ");
    }
  }

  private normalizeColor(color: string): string {
    if (/^[0-9a-fA-F]{3,6}$/.test(color)) {
      return `#${color}`;
    }
    return color;
  }

  private buildTable(item: any): HTMLElement {
    const table = this.doc.createElement("table");
    table.className = "notedown-table";

    // Create table structure
    const thead = this.doc.createElement("thead");
    const tbody = this.doc.createElement("tbody");

    item.rows.forEach((row: any) => {
      const tr = this.doc.createElement("tr");

      row.cells.forEach((cell: any) => {
        // Create appropriate cell element (th for header, td for data)
        const cellElement = this.doc.createElement(row.isHeader ? "th" : "td");

        // Set alignment
        if (cell.align) {
          cellElement.style.textAlign = cell.align;
        }

        // Add cell content
        if (cell.content && Array.isArray(cell.content)) {
          for (const contentItem of cell.content) {
            const element = this.buildInlineContent(contentItem);
            if (element) {
              cellElement.appendChild(element);
            }
          }
        }

        tr.appendChild(cellElement);
      });

      if (row.isHeader) {
        thead.appendChild(tr);
      } else {
        tbody.appendChild(tr);
      }
    });

    if (thead.childNodes.length > 0) {
      table.appendChild(thead);
    }

    if (tbody.childNodes.length > 0) {
      table.appendChild(tbody);
    }

    return table;
  }

  renderWithStyles(parsedData: NotedownDocument): HTMLElement {
    const container = this.render(parsedData);
    this.addDefaultStyles();
    this.applyCodeHighlighting(container);
    return container;
  }

  private applyCodeHighlighting(container: HTMLElement): void {
    // This method will be used by external code to apply highlighting library
    // Mark the container as needing highlighting
    container.setAttribute("data-needs-highlighting", "true");
  }

  private addDefaultStyles(): void {
    if (this.doc.getElementById("notedown-default-styles")) {
      return;
    }

    const style = this.doc.createElement("style");
    style.id = "notedown-default-styles";
    style.textContent = `
      .notedown-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .notedown-title {
        margin-top: 2em;
        margin-bottom: 1em;
        font-weight: 600;
        line-height: 1.2;
      }
      .notedown-title-1 { font-size: 2.5em; }
      .notedown-title-2 { font-size: 2em; }
      .notedown-title-3 { font-size: 1.75em; }
      .notedown-title-4 { font-size: 1.5em; }
      .notedown-title-5 { font-size: 1.25em; }
      .notedown-title-6 { font-size: 1em; }
      .notedown-description {
        font-style: italic;
        color: #666;
        margin-bottom: 1em;
      }
      .notedown-paragraph {
        margin-bottom: 1em;
      }
      .notedown-code-block {
        background: #f6f8fa;
        border: 1px solid #d1d9e0;
        border-radius: 6px;
        padding: 16px;
        overflow-x: auto;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
        font-size: 0.9em;
        margin: 1em 0;
        position: relative;
      }
      
      /* Default styling for code when highlight.js is not available */
      .notedown-code-block code.hljs {
        display: block;
        padding: 0;
        background: transparent;
      }
      
      /* Language marker */
      .notedown-code-block::after {
        content: attr(data-lang);
        position: absolute;
        top: 0;
        right: 0;
        padding: 4px 8px;
        font-size: 0.7em;
        color: #666;
        background: #e6e9ed;
        border-bottom-left-radius: 4px;
        border-top-right-radius: 5px;
        font-family: sans-serif;
        opacity: 0.8;
      }
      
      /* Base highlight.js theme - light version */
      .hljs {
        color: #24292e;
      }
      .hljs-doctag,
      .hljs-keyword,
      .hljs-meta .hljs-keyword,
      .hljs-template-tag,
      .hljs-template-variable,
      .hljs-type,
      .hljs-variable.language_ {
        color: #d73a49;
      }
      .hljs-title,
      .hljs-title.class_,
      .hljs-title.class_.inherited__,
      .hljs-title.function_ {
        color: #6f42c1;
      }
      .hljs-attr,
      .hljs-attribute,
      .hljs-literal,
      .hljs-meta,
      .hljs-number,
      .hljs-operator,
      .hljs-variable,
      .hljs-selector-attr,
      .hljs-selector-class,
      .hljs-selector-id {
        color: #005cc5;
      }
      .hljs-regexp,
      .hljs-string,
      .hljs-meta .hljs-string {
        color: #032f62;
      }
      .hljs-built_in,
      .hljs-symbol {
        color: #e36209;
      }
      .hljs-comment,
      .hljs-code,
      .hljs-formula {
        color: #6a737d;
      }
      .hljs-name,
      .hljs-quote,
      .hljs-selector-tag,
      .hljs-selector-pseudo {
        color: #22863a;
      }
      .notedown-inline-code {
        background: #f6f8fa;
        border: 1px solid #d1d9e0;
        border-radius: 3px;
        padding: 2px 4px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
        font-size: 0.9em;
      }
      .notedown-collapse {
        border: 1px solid #d1d9e0;
        border-radius: 6px;
        margin: 1em 0;
      }
      .notedown-collapse-1 .notedown-collapse-title {
        background: #e6f3ff;
        font-size: 1.3em;
        font-weight: 700;
        border-left: 4px solid #0969da;
      }
      .notedown-collapse-2 .notedown-collapse-title {
        background: #f0f6ff;
        font-size: 1.15em;
        font-weight: 650;
        border-left: 4px solid #4A90E2;
      }
      .notedown-collapse-3 .notedown-collapse-title {
        background: #f6f9ff;
        font-size: 1.05em;
        font-weight: 600;
        border-left: 4px solid #8BB4E8;
      }
      .notedown-collapse-title {
        background: #f6f8fa;
        padding: 12px 16px;
        cursor: pointer;
        font-weight: 500;
      }
      .notedown-collapse-content {
        padding: 16px;
      }
      .notedown-image-figure {
        margin: 1em 0;
        text-align: center;
      }
      .notedown-image {
        max-width: 100%;
        height: auto;
        border-radius: 6px;
      }
      .notedown-link {
        color: #0969da;
        text-decoration: none;
      }
      .notedown-link:hover {
        text-decoration: underline;
      }
      .notedown-bold {
        font-weight: 600;
      }
      .notedown-italic {
        font-style: italic;
      }
      .notedown-underline {
        text-decoration: underline;
      }
      .notedown-crossline {
        text-decoration: line-through;
      }
      .notedown-color {
        border-radius: 2px;
      }
      .notedown-meta-ref {
        background: #fff3cd;
        color: #856404;
        padding: 2px 4px;
        border-radius: 2px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
        font-size: 0.9em;
      }
      .notedown-table {
        border-collapse: collapse;
        width: 100%;
        margin: 16px 0;
        font-size: 0.95em;
      }
      .notedown-table th,
      .notedown-table td {
        border: 1px solid #ddd;
        padding: 8px 12px;
      }
      .notedown-table thead {
        background-color: #f5f5f5;
      }
      .notedown-table th {
        text-align: left;
        font-weight: 600;
      }
      .notedown-table tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      .notedown-table tr:hover {
        background-color: #f1f1f1;
      }
    `;

    this.doc.head.appendChild(style);
  }
}
