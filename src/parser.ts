import type { NotedownDocument } from "./types";

// Complete Notedown parser
export function parseNotedown(ndText: string): NotedownDocument {
  const meta: any = {};

  // First pass: extract meta variables from beginning of document only
  const lines = ndText.split(/\r?\n/);
  const processedLines: string[] = [];
  let metaSection = true;

  for (const line of lines) {
    const metaMatch = line.match(/^\\meta\s+(\w+)=(.+)$/);
    if (metaMatch && metaMatch[1] && metaMatch[2] && metaSection) {
      meta[metaMatch[1]] = metaMatch[2];
    } else {
      processedLines.push(line);
      // Stop processing meta after first non-empty, non-meta line
      if (line.trim() !== "" && !line.match(/^\\meta\s+/)) {
        metaSection = false;
      }
    }
  }

  const result: any = {};
  if (Object.keys(meta).length > 0) {
    result.meta = meta;
  }
  result.content = [];

  // Helper to replace meta references (handle escaping)
  function replaceMeta(text: string): any[] {
    const parts: any[] = [];

    // First, we'll use a two-pass approach
    // First pass: find all meta references (both escaped and non-escaped)
    const allMatches: {
      start: number;
      end: number;
      content: string;
      escaped: boolean;
    }[] = [];

    // Find escaped meta references
    const escapedRegex = /\\@\{(\w+)\}/g;
    let escapedMatch;
    while ((escapedMatch = escapedRegex.exec(text)) !== null) {
      allMatches.push({
        start: escapedMatch.index,
        end: escapedMatch.index + escapedMatch[0].length,
        content: escapedMatch[1] || "",
        escaped: true,
      });
    }

    // Find regular meta references (that aren't already escaped)
    const metaRegex = /@\{(\w+)\}/g;
    let metaMatch: RegExpExecArray | null;
    while ((metaMatch = metaRegex.exec(text)) !== null) {
      // Check if this match overlaps with any escaped match
      const isOverlap = allMatches.some(
        (m) =>
          (metaMatch !== null &&
            metaMatch.index >= m.start &&
            metaMatch.index < m.end) ||
          (metaMatch !== null &&
            metaMatch.index + metaMatch[0].length > m.start &&
            metaMatch.index + metaMatch[0].length <= m.end)
      );

      if (!isOverlap) {
        allMatches.push({
          start: metaMatch.index,
          end: metaMatch.index + metaMatch[0].length,
          content: metaMatch[1] || "",
          escaped: false,
        });
      }
    }

    // Sort matches by start position
    allMatches.sort((a, b) => a.start - b.start);

    // Second pass: build the parts array based on the matches
    let lastIndex = 0;
    for (const match of allMatches) {
      // Add text before this match
      if (match.start > lastIndex) {
        parts.push({ text: text.slice(lastIndex, match.start) });
      }

      // Add the match itself
      if (match.escaped) {
        // For escaped matches, add as regular text without the backslash
        parts.push({ text: `@{${match.content}}` });
      } else {
        // For regular meta references, add as meta node
        parts.push({ meta: match.content });
      }

      lastIndex = match.end;
    }

    // Add any remaining text
    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex) });
    }

    return parts.length > 0 ? parts : [{ text }];
  }

  // Helper to parse inline formatting with better nesting support
  function parseInline(text: string): any[] {
    const patterns = [
      // Bold
      { re: /\*\*(.+?)\*\*/, type: "bold" },
      // Italic
      { re: /\*(.+?)\*/, type: "italic" },
      // Underline
      { re: /__(.+?)__/, type: "underline" },
      // Crossline
      { re: /~~(.+?)~~/, type: "crossline" },
      // Code (support escaped backticks)
      { re: /`((?:[^`\\]|\\.)*?)`/, type: "code" },
      // LaTeX formula
      { re: /\$((?:[^$\\]|\\.)*?)\$/, type: "latex" },
      // Escaped link (handle before regular link)
      { re: /\\\[([^\]]+)\]\(([^)]+)\)/, type: "escapedLink" },
      // Escaped color patterns (handle these first to avoid parsing them as colors)
      { re: /\\\|([^|]+)\\\|/, type: "escapedPipe" },
      { re: /\|\\([^|]+)\|/, type: "escapedContent" },
      // Color foreground/background (order matters - longest first)
      {
        re: /\|f#([\w]+),b#([\w]+),([^|]+)\|/,
        type: "color",
        fg: true,
        bg: true,
      },
      { re: /\|b#([\w]+),([^|]+)\|/, type: "color", bg: true },
      { re: /\|f#([\w]+),([^|]+)\|/, type: "color", fg: true },
      // Color with no color (plain) - this should come last
      { re: /\|([^|]+)\|/, type: "color", noColor: true },
      // Link
      { re: /\[([^\]]+)\]\(([^)]+)\)/, type: "link" },
    ];

    // Image (block-level)
    if (/^!\[([^\]]*)\]\(([^)]+)\)$/.test(text.trim())) {
      const m = text.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (m) {
        return [{ type: "image", link: m[2], alt: m[1] }];
      }
    }

    let rest = text;
    const result: any[] = [];

    while (rest.length > 0) {
      let earliestMatch = null;
      let earliestPattern = null;
      let earliestIndex = rest.length;

      // Find the earliest match among all patterns
      for (const pat of patterns) {
        const m = rest.match(pat.re);
        if (m && m.index !== undefined && m.index < earliestIndex) {
          earliestMatch = m;
          earliestPattern = pat;
          earliestIndex = m.index;
        }
      }

      if (
        earliestMatch &&
        earliestPattern &&
        earliestMatch.index !== undefined
      ) {
        // Add text before match
        if (earliestMatch.index > 0) {
          const beforeText = rest.slice(0, earliestMatch.index);
          result.push(...replaceMeta(beforeText));
        }

        if (
          earliestPattern.type === "bold" ||
          earliestPattern.type === "italic" ||
          earliestPattern.type === "underline" ||
          earliestPattern.type === "crossline"
        ) {
          // Parse content recursively to handle nested formatting and links
          result.push({
            format: earliestPattern.type,
            content: parseInline(earliestMatch[1] || ""),
          });
        } else if (earliestPattern.type === "code") {
          const codeText = (earliestMatch[1] || "").replace(/\\`/g, "`");
          result.push({ format: "code", content: [{ text: codeText }] });
        } else if (earliestPattern.type === "latex") {
          const formula = (earliestMatch[1] || "").replace(/\\\$/g, "$");
          result.push({
            format: "latex",
            formula,
            content: [{ text: formula }],
          });
        } else if (earliestPattern.type === "escapedLink") {
          // \[text](url) -> [text](url) (render as plain text)
          result.push({ text: `[${earliestMatch[1]}](${earliestMatch[2]})` });
        } else if (earliestPattern.type === "text") {
          // For escaped patterns, add as plain text
          result.push({ text: earliestMatch[0] });
        } else if (earliestPattern.type === "escapedPipe") {
          // \|text\| -> |text|
          result.push({ text: `|${earliestMatch[1]}|` });
        } else if (earliestPattern.type === "escapedContent") {
          // |\text| -> |text| (remove the backslash)
          result.push({ text: `|${earliestMatch[1]}|` });
        } else if (
          earliestPattern.type === "color" &&
          earliestPattern.fg &&
          earliestPattern.bg
        ) {
          result.push({
            format: "color",
            foreground: earliestMatch[1],
            background: earliestMatch[2],
            content: parseInline(earliestMatch[3] || ""),
          });
        } else if (earliestPattern.type === "color" && earliestPattern.bg) {
          result.push({
            format: "color",
            background: earliestMatch[1],
            content: parseInline(earliestMatch[2] || ""),
          });
        } else if (earliestPattern.type === "color" && earliestPattern.fg) {
          result.push({
            format: "color",
            foreground: earliestMatch[1],
            content: parseInline(earliestMatch[2] || ""),
          });
        } else if (
          earliestPattern.type === "color" &&
          earliestPattern.noColor
        ) {
          result.push({
            format: "color",
            content: parseInline(earliestMatch[1] || ""),
          });
        } else if (earliestPattern.type === "link") {
          result.push({ link: earliestMatch[2], text: earliestMatch[1] });
        }
        rest = rest.slice(earliestMatch.index + earliestMatch[0].length);
      } else {
        result.push(...replaceMeta(rest));
        break;
      }
    }
    return result;
  }

  // Parse content
  const contentText = processedLines.join("\n");

  // Handle code blocks first
  const codeBlockRegex = /^```(\w+)?\n([\s\S]*?)\n```$/gm;
  const blocks: { type: string; content: string; lang?: string }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(contentText)) !== null) {
    // Add content before code block
    if (match.index > lastIndex) {
      const beforeContent = contentText.slice(lastIndex, match.index).trim();
      if (beforeContent) {
        blocks.push({ type: "text", content: beforeContent });
      }
    }

    // Add code block with proper property order
    const codeBlock: any = { type: "code" };
    if (match[1]) {
      codeBlock.lang = match[1];
    }
    // Only unescape \``` (backslash followed by exactly 3 backticks) but keep other escapes
    codeBlock.content = (match[2] || "").replace(/\\```/g, "```");
    blocks.push(codeBlock);
    lastIndex = match.index + match[0].length;
  }

  // Add remaining content
  if (lastIndex < contentText.length) {
    const remainingContent = contentText.slice(lastIndex).trim();
    if (remainingContent) {
      blocks.push({ type: "text", content: remainingContent });
    }
  }

  // If no code blocks found, treat entire content as text
  if (blocks.length === 0) {
    blocks.push({ type: "text", content: contentText });
  }

  // Process each block
  for (const block of blocks) {
    if (block.type === "code") {
      result.content.push(block);
    } else {
      parseTextContent(block.content);
    }
  }

  function parseTextContent(text: string) {
    // Track positions of all collapse blocks first
    const allCollapseMatches: Array<{
      start: number;
      end: number;
      type: "header" | "simple";
      match: RegExpMatchArray;
    }> = [];

    // Find header collapse blocks
    const headerCollapseRegex = /(#+)>\s*(.*?)(?:\n([\s\S]*?))?\n\\\1>/g;
    let match;
    while ((match = headerCollapseRegex.exec(text)) !== null) {
      allCollapseMatches.push({
        start: match.index!,
        end: match.index! + match[0].length,
        type: "header",
        match,
      });
    }

    // Find simple collapse blocks
    const simpleCollapseRegex = /\|>\s*(.*?)(?:\n([\s\S]*?))?\\\|>/g;
    while ((match = simpleCollapseRegex.exec(text)) !== null) {
      allCollapseMatches.push({
        start: match.index!,
        end: match.index! + match[0].length,
        type: "simple",
        match,
      });
    }

    // Sort by position
    allCollapseMatches.sort((a, b) => a.start - b.start);

    // Process text in order, maintaining positions
    let currentPos = 0;

    if (allCollapseMatches.length === 0) {
      // No collapses found, parse entire text as normal content
      parseAsNormalContent(text);
    } else {
      // Process text with collapses in order
      for (const collapseMatch of allCollapseMatches) {
        // Process any text before this collapse
        if (collapseMatch.start > currentPos) {
          const beforeText = text.slice(currentPos, collapseMatch.start);
          if (beforeText.trim()) {
            parseAsNormalContent(beforeText.trim());
          }
        }

        // Process the collapse block
        if (collapseMatch.type === "header") {
          const [, hashes, title, content] = collapseMatch.match;
          const size = hashes?.length || 1;
          const collapseBlock = {
            type: "collapse",
            size,
            text: title?.trim()
              ? replaceMeta(title.trim())
              : [{ text: "Collapse" }],
            content:
              content && content.trim()
                ? parseContentLines(content.trim().split("\n"))
                : [],
          };
          result.content.push(collapseBlock);
        } else {
          const [, title, content] = collapseMatch.match;
          const collapseBlock = {
            type: "collapse",
            text: title?.trim()
              ? replaceMeta(title.trim())
              : [{ text: "Collapse" }],
            content:
              content && content.trim()
                ? parseContentLines(content.trim().split("\n"))
                : [],
          };
          result.content.push(collapseBlock);
        }

        currentPos = collapseMatch.end;
      }

      // Process any remaining text after the last collapse
      if (currentPos < text.length) {
        const remainingText = text.slice(currentPos);
        if (remainingText.trim()) {
          parseAsNormalContent(remainingText.trim());
        }
      }
    }
  }

  function parseContentLines(lines: string[]): any[] {
    // Join lines back and parse as a full Notedown document to handle nested collapses
    const contentText = lines.join("\n");
    if (!contentText.trim()) {
      return [];
    }

    // Recursively parse the content as a new Notedown document
    const subDocument = parseNotedown(contentText);
    return subDocument.content || [];
  }

  function parseAsNormalContent(text: string) {
    // Split by \np or two or more newlines for paragraphs
    const paraSplitRegex = /(?:\\np|\n{2,})/;
    const rawParagraphs = text
      .split(paraSplitRegex)
      .map((p) => p.trim())
      .filter(Boolean);

    for (const rawPara of rawParagraphs) {
      // Check if this paragraph is a table
      if (isTable(rawPara)) {
        result.content.push(parseTable(rawPara));
        continue;
      }

      // Check if this paragraph is a list
      if (isList(rawPara)) {
        result.content.push(parseList(rawPara));
        continue;
      }

      let para = rawPara.replace(/\\np/g, "");
      const lines = para.split(/\n/);
      const paraContent: any[] = [];

      for (const line of lines) {
        // Check for titles
        const titleMatch = line.match(/^(#+)\s+(.+)$/);
        if (titleMatch && titleMatch[1] && titleMatch[2]) {
          const size = titleMatch[1].length;
          paraContent.push({
            type: "title",
            size,
            text: replaceMeta(titleMatch[2].trim()),
          });
          continue;
        }

        // Check for description
        const descMatch = line.match(/^~#\s+(.+)$/);
        if (descMatch && descMatch[1]) {
          paraContent.push({
            type: "desc",
            text: replaceMeta(descMatch[1].trim()),
          });
          continue;
        }

        if (line.trim() === "" || line.trim() === "\\n") {
          paraContent.push({ type: "newline" });
        } else {
          const cleanText = line.replace(/\\n/g, "").trim();
          if (cleanText.length > 0) {
            const inline = parseInline(cleanText);
            // If image, push as block
            if (inline.length === 1 && inline[0].type === "image") {
              paraContent.push(inline[0]);
            } else {
              paraContent.push({ type: "text", content: inline });
            }
          }
        }
      }

      // Remove trailing newlines in paragraph
      while (
        paraContent.length &&
        paraContent[paraContent.length - 1].type === "newline"
      ) {
        paraContent.pop();
      }

      if (paraContent.length > 0) {
        result.content.push({ type: "paragraph", content: paraContent });
      }
    }
  }

  // Helper functions for table parsing
  function isTable(text: string): boolean {
    const lines = text.split(/\n/).map((line) => line.trim());
    if (lines.length < 2) return false; // Need at least header and separator

    // Check if all lines have pipe characters
    if (!lines.every((line) => line.includes("|"))) return false;

    // Check for separator row (second row)
    const secondLine = lines[1];
    return secondLine ? /^\|?\s*:?-{3,}:?\s*\|/.test(secondLine) : false;
  }

  function parseTable(text: string): any {
    const lines = text.split(/\n/).map((line) => line.trim());
    const table: any = {
      type: "table",
      rows: [],
    };

    // Parse alignment from separator row
    const separatorRow = lines[1];
    const alignments = separatorRow
      ? separatorRow
          .split("|")
          .filter((cell) => cell.trim() !== "")
          .map((cell) => {
            const trimmed = cell.trim();
            if (trimmed.startsWith(":") && trimmed.endsWith(":"))
              return "center";
            if (trimmed.endsWith(":")) return "right";
            return "left"; // Default alignment
          })
      : [];

    // Process each row
    lines.forEach((line, index) => {
      if (index === 1) return; // Skip separator row

      // Skip empty rows
      if (line.trim().replace(/\|/g, "").trim() === "") return;

      const cells = line
        .split("|")
        .filter((cell) => cell !== "") // Filter out empty strings from beginning/ending pipes
        .map((cellContent, cellIndex) => {
          return {
            content: parseInline(cellContent.trim()),
            align:
              cellIndex < alignments.length ? alignments[cellIndex] : "left",
          };
        });

      table.rows.push({
        cells,
        isHeader: index === 0, // First row is header
      });
    });

    return table;
  }

  // Helper functions for list parsing
  function isList(text: string): boolean {
    const lines = text.split(/\n/).filter(Boolean);
    if (lines.length === 0) return false;

    // Check if the first non-empty line is a list item
    const firstLine = lines[0]?.trim();
    if (!firstLine) return false;
    return /^\d+\.\s+/.test(firstLine) || /^[-*+]\s+/.test(firstLine);
  }

  function parseList(text: string): any {
    const lines = text.split(/\n/).filter(Boolean);
    if (lines.length === 0) return { type: "list", ordered: false, items: [] };

    return parseListLines(lines, 0).list;
  }

  function parseListLines(
    lines: string[],
    startIndex: number
  ): { list: any; nextIndex: number } {
    const items: any[] = [];
    let i = startIndex;
    let currentListType: "ordered" | "unordered" | null = null;
    let baseIndent = -1; // Track the base indentation level for this list

    while (i < lines.length) {
      const line = lines[i];
      if (!line) {
        i++;
        continue;
      }

      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) {
        i++;
        continue;
      }

      // Check indentation level
      const indent = line.length - line.trimStart().length;

      // If we've established a base indentation and this line is less indented,
      // it belongs to a parent list
      if (baseIndent >= 0 && indent < baseIndent) {
        break;
      }

      // Check if this line is a list item
      const orderedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
      const unorderedMatch = trimmedLine.match(/^([-*+])\s+(.+)$/);

      if (!orderedMatch && !unorderedMatch) {
        // Not a list item, stop parsing this list
        break;
      }

      // Set base indentation from first item
      if (baseIndent === -1) {
        baseIndent = indent;
        // Determine list type from first item
        currentListType = orderedMatch ? "ordered" : "unordered";
      } else if (indent > baseIndent) {
        // This item is more indented, it's a nested list, break to let parent handle it
        break;
      }

      let content = "";

      if (orderedMatch && orderedMatch[2]) {
        content = orderedMatch[2];
      } else if (unorderedMatch && unorderedMatch[2]) {
        content = unorderedMatch[2];
      } else {
        i++;
        continue;
      }

      // Create list item
      const item: any = {
        type: "list-item",
        content: parseInline(content),
      };

      // Look ahead for nested lists
      const nestedItems: any[] = [];
      let j = i + 1;

      while (j < lines.length) {
        const nextLine = lines[j];
        if (!nextLine) {
          j++;
          continue;
        }

        const nextTrimmed = nextLine.trim();
        const nextIndent = nextLine.length - nextLine.trimStart().length;

        // Empty line - continue checking
        if (!nextTrimmed) {
          j++;
          continue;
        }

        // If this line has the same or less indentation as current item, stop looking for nested items
        if (nextIndent <= indent) {
          break;
        }

        // If this line is a list item with greater indentation, it's nested
        if (
          nextIndent > indent &&
          (/^\d+\.\s+/.test(nextTrimmed) || /^[-*+]\s+/.test(nextTrimmed))
        ) {
          // Parse nested list starting from this line
          const nestedResult = parseListLines(lines, j);
          nestedItems.push(nestedResult.list);
          j = nestedResult.nextIndex;
        } else {
          // Greater indentation but not a list item, skip
          j++;
        }
      }

      // Add nested lists to item if any
      if (nestedItems.length > 0) {
        item.nested = nestedItems;
      }

      items.push(item);
      i = j; // Move to the next unprocessed line
    }

    return {
      list: {
        type: "list",
        ordered: currentListType === "ordered",
        items: items,
      },
      nextIndex: i,
    };
  }

  return result;
}
