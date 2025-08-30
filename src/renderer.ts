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
      case "list":
        return this.buildList(item);
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

      // Treat collapse content as a new Notedown document for recursive rendering
      const NotedownRendererClass = this.constructor as typeof NotedownRenderer;
      const subRenderer = new NotedownRendererClass(this.doc);
      // If meta is needed, pass it; otherwise, just content
      const subDoc = { content: item.content };
      const subRendered = subRenderer.render(subDoc);
      contentDiv.appendChild(subRendered);

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

  private buildList(item: any): HTMLElement {
    const listElement = this.doc.createElement(item.ordered ? "ol" : "ul");
    listElement.className = `notedown-list notedown-list-${
      item.ordered ? "ordered" : "unordered"
    }`;

    if (item.items && Array.isArray(item.items)) {
      for (const listItem of item.items) {
        const li = this.doc.createElement("li");
        li.className = "notedown-list-item";

        // Add main content
        if (listItem.content && Array.isArray(listItem.content)) {
          for (const contentItem of listItem.content) {
            const element = this.buildInlineContent(contentItem);
            if (element) {
              li.appendChild(element);
            }
          }
        }

        // Add nested lists if they exist
        if (listItem.nested && Array.isArray(listItem.nested)) {
          for (const nestedList of listItem.nested) {
            const nestedElement = this.buildList(nestedList);
            if (nestedElement) {
              li.appendChild(nestedElement);
            }
          }
        }

        listElement.appendChild(li);
      }
    }

    return listElement;
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

    const tableWrapper = this.doc.createElement("div");
    tableWrapper.className = "notedown-table-wrapper";
    tableWrapper.appendChild(table);
    return tableWrapper;
  }

  renderWithStyles(parsedData: NotedownDocument): HTMLElement {
    // Inject styles if they don't exist yet
    this.injectDefaultStyles();

    const container = this.render(parsedData);
    this.applyCodeHighlighting(container);
    return container;
  }

  private injectDefaultStyles(): void {
    // Check if styles are already injected
    if (this.doc.getElementById("notedown-default-styles")) {
      return;
    }

    // Create style element
    const styleElement = this.doc.createElement("style");
    styleElement.id = "notedown-default-styles";
    styleElement.textContent = this.getDefaultStyles();

    // Inject into head if it exists, otherwise into body
    const head = this.doc.head || this.doc.getElementsByTagName("head")[0];
    if (head) {
      head.appendChild(styleElement);
    } else {
      this.doc.body?.appendChild(styleElement);
    }
  }

  private getDefaultStyles(): string {
    // Include the CSS from notedown-theme.css
    return `
.notedown-container {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
}

/* Nested containers should not have centering styles */
.notedown-container .notedown-container {
  max-width: none;
  margin: 0;
  padding: 0;
  position: static;
}

.notedown-container > * {
  position: static;
  float: none;
}
.notedown-title {
  margin-top: 2em;
  margin-bottom: 1em;
  font-weight: 600;
  line-height: 1.2;
}
.notedown-title-1 {
  font-size: 2.5em;
}
.notedown-title-2 {
  font-size: 2em;
}
.notedown-title-3 {
  font-size: 1.75em;
}
.notedown-title-4 {
  font-size: 1.5em;
}
.notedown-title-5 {
  font-size: 1.25em;
}
.notedown-title-6 {
  font-size: 1em;
}
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
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace;
  font-size: 0.9em;
  margin: 1em 0;
  position: relative;
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
  border-left: 4px solid #4a90e2;
}
.notedown-collapse-3 .notedown-collapse-title {
  background: #f6f9ff;
  font-size: 1.05em;
  font-weight: 600;
  border-left: 4px solid #8bb4e8;
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

/* List Styles */
.notedown-list {
  margin: 1em 0;
  padding-left: 2em;
}

.notedown-list-ordered {
  list-style-type: decimal;
}

.notedown-list-unordered {
  list-style-type: disc;
}

.notedown-list-item {
  margin: 0.5em 0;
  line-height: 1.6;
  position: relative;
}

/* Collapse Styles */
.notedown-collapse {
  margin: 1em 0;
  border-radius: 4px;
  border: 1px solid #e1e8ed;
  background-color: #f8f9fa;
  position: static;
  display: block;
  width: 100%;
  box-sizing: border-box;
}

.notedown-collapse-title {
  font-weight: bold;
  cursor: pointer;
  padding: 0.75em 1em;
  margin: 0;
  background-color: #f1f3f4;
  border-bottom: 1px solid #e1e8ed;
  user-select: none;
}

.notedown-collapse-title:hover {
  background-color: #e8eaed;
}

.notedown-collapse-content {
  padding: 1em;
  background-color: #ffffff;
  position: static;
  display: block;
  clear: both;
}

.notedown-collapse[open] .notedown-collapse-title {
  border-bottom: 1px solid #e1e8ed;
}

/* Ensure collapse elements stay in document flow */
details.notedown-collapse {
  position: static !important;
  float: none !important;
  top: auto !important;
  left: auto !important;
  right: auto !important;
  bottom: auto !important;
}
`;
  }

  private applyCodeHighlighting(container: HTMLElement): void {
    // This method will be used by external code to apply highlighting library
    // Mark the container as needing highlighting
    container.setAttribute("data-needs-highlighting", "true");
  }
}
