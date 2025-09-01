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

  private buildContentItem(item: any): HTMLElement | DocumentFragment | null {
    switch (item.type) {
      case "paragraph":
        return this.buildParagraph(item);
      case "title":
        return this.buildTitle(item);
      case "heading":
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

  private buildParagraph(item: any): HTMLElement | DocumentFragment {
    if (!item.content || !Array.isArray(item.content)) {
      const p = this.doc.createElement("p");
      p.className = "notedown-paragraph";
      return p;
    }

    // Check if paragraph contains titles - if so, we need to split it
    const hasTitle = item.content.some(
      (contentItem: any) => contentItem.type === "title"
    );

    if (!hasTitle) {
      // Normal paragraph - no titles
      const p = this.doc.createElement("p");
      p.className = "notedown-paragraph";

      for (const contentItem of item.content) {
        const element = this.buildContentItem(contentItem);
        if (element) {
          p.appendChild(element);
        }
      }
      return p;
    }

    // Paragraph contains titles - split into multiple elements
    const fragment = this.doc.createDocumentFragment();
    let currentParagraph: HTMLElement | null = null;

    for (const contentItem of item.content) {
      if (contentItem.type === "title") {
        // Close current paragraph if it exists and has content
        if (currentParagraph && currentParagraph.childNodes.length > 0) {
          fragment.appendChild(currentParagraph);
          currentParagraph = null;
        }

        // Add the title as a separate element
        const titleElement = this.buildContentItem(contentItem);
        if (titleElement) {
          fragment.appendChild(titleElement);
        }
      } else {
        // Non-title content - add to current paragraph
        if (!currentParagraph) {
          currentParagraph = this.doc.createElement("p");
          currentParagraph.className = "notedown-paragraph";
        }

        const element = this.buildContentItem(contentItem);
        if (element) {
          currentParagraph.appendChild(element);
        }
      }
    }

    // Add final paragraph if it has content
    if (currentParagraph && currentParagraph.childNodes.length > 0) {
      fragment.appendChild(currentParagraph);
    }

    return fragment;
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

        // Add content blocks if they exist (indented paragraphs within list item)
        if (listItem.content_blocks && Array.isArray(listItem.content_blocks)) {
          for (const block of listItem.content_blocks) {
            const element = this.buildContentItem(block);
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
    const container = this.render(parsedData);
    this.applyCodeHighlighting(container);
    return container;
  }

  private applyCodeHighlighting(container: HTMLElement): void {
    // This method will be used by external code to apply highlighting library
    // Mark the container as needing highlighting
    container.setAttribute("data-needs-highlighting", "true");
  }
}
