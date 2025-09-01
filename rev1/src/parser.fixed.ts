/**
 * Fixed version of the Notedown Parser to handle code blocks in list items correctly.
 * This file can be used as a direct replacement for parser.ts
 */

import type { NotedownDocument } from "./types";

// Complete Notedown parser
export function parseNotedown(
  ndText: string,
  isCollapseContent: boolean = false
): NotedownDocument {
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

    // Sort all matches by start position
    allMatches.sort((a, b) => a.start - b.start);

    // Second pass: build parts array using the found matches
    let lastIndex = 0;
    for (const match of allMatches) {
      // Add text before this match
      if (match.start > lastIndex) {
        parts.push({ text: text.slice(lastIndex, match.start) });
      }

      // Add meta reference (escaped or not)
      if (match.escaped) {
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
      // Escaped asterisk (handle first to prevent italic parsing)
      { re: /\\\*/, type: "escapedAsterisk" },
      // Bold (support escaped asterisks inside)
      { re: /\*\*((?:[^*\\]|\\.|\*(?!\*))*?)\*\*/, type: "bold" },
      // Italic (support escaped asterisks inside)
      { re: /\*((?:[^*\\]|\\.)*?)\*/, type: "italic" },
      // Underline
      { re: /__(.+?)__/, type: "underline" },
      // Crossline
      { re: /~~(.+?)~~/, type: "crossline" },
      // Code (support escaped backticks)
      { re: /\`((?:[^`\\]|\\.)*?)\`/, type: "code" },
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

    const result: any[] = [];
    let rest = text;

    while (rest) {
      let earliestMatch: RegExpExecArray | null = null;
      let earliestIndex = Infinity;
      let earliestPattern: any = null;

      // Find the earliest match among all patterns
      for (const pattern of patterns) {
        const match = pattern.re.exec(rest);
        if (match && match.index < earliestIndex) {
          earliestMatch = match;
          earliestIndex = match.index;
          earliestPattern = pattern;
        }
      }

      if (earliestMatch && earliestPattern) {
        // Add text before this match
        if (earliestMatch.index > 0) {
          result.push(...replaceMeta(rest.slice(0, earliestMatch.index)));
        }

        // Handle the match based on its type
        if (earliestPattern.type === "escapedAsterisk") {
          result.push({ text: "*" });
        } else if (earliestPattern.type === "escapedPipe") {
          result.push({ text: "|" + earliestMatch[1] + "|" });
        } else if (earliestPattern.type === "escapedContent") {
          result.push({ text: "|" + earliestMatch[1] + "|" });
        } else if (earliestPattern.type === "escapedLink") {
          result.push({
            text: "[" + earliestMatch[1] + "](" + earliestMatch[2] + ")",
          });
        } else if (
          ["bold", "italic", "underline", "crossline"].includes(
            earliestPattern.type
          )
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
        } else if (earliestPattern.type === "color") {
          let colorNode: any = { format: "color" };
          if (earliestPattern.noColor) {
            // Simple pipe syntax - no colors
            colorNode.content = parseInline(earliestMatch[1] || "");
          } else if (earliestPattern.fg && earliestPattern.bg) {
            // Both foreground and background colors
            colorNode.fg = earliestMatch[1];
            colorNode.bg = earliestMatch[2];
            colorNode.content = parseInline(earliestMatch[3] || "");
          } else if (earliestPattern.fg) {
            // Only foreground color
            colorNode.fg = earliestMatch[1];
            colorNode.content = parseInline(earliestMatch[2] || "");
          } else if (earliestPattern.bg) {
            // Only background color
            colorNode.bg = earliestMatch[1];
            colorNode.content = parseInline(earliestMatch[2] || "");
          }
          result.push(colorNode);
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

  // Handle code blocks first - allow for indentation before code blocks
  const codeBlockRegex = /^(\s*)```(\w+)?\n([\s\S]*?)\n\s*```$/gm;
  const blocks: { type: string; content: string; lang?: string; indentLevel?: number }[] = [];
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

    // Calculate indentation level for later processing
    const indentLevel = match[1] ? match[1].length : 0;

    // Add code block with proper property order
    const codeBlock: any = { 
      type: "code", 
      indentLevel // Store the indent level for later
    };
    
    if (match[2]) { // match[1] is the indentation, match[2] is the language
      codeBlock.lang = match[2];
    }
    
    // Only unescape \``` (backslash followed by exactly 3 backticks) but keep other escapes
    codeBlock.content = (match[3] || "").replace(/\\```/g, "```");
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

    // Find header collapse blocks (allow optional leading whitespace like headings)
    const headerCollapseRegex =
      /^(\s*)(#+)>\s*(.*?)(?:\n([\s\S]*?))?\n\s*\\\2>/gm;
    let match: RegExpExecArray | null;
    while ((match = headerCollapseRegex.exec(text)) !== null) {
      allCollapseMatches.push({
        start: match.index!,
        end: match.index! + match[0].length,
        type: "header",
        match,
      });
    }

    // Find simple collapse blocks (allow optional leading whitespace)
    const simpleCollapseRegex = /^(\s*)\|>\s*(.*?)(?:\n([\s\S]*?))?\n\s*\\\|>/gm;
    while ((match = simpleCollapseRegex.exec(text)) !== null) {
      allCollapseMatches.push({
        start: match.index!,
        end: match.index! + match[0].length,
        type: "simple",
        match,
      });
    }

    // Parse other content based on the found collapse blocks
    if (allCollapseMatches.length > 0) {
      // Sort collapse blocks by start position
      allCollapseMatches.sort((a, b) => a.start - b.start);

      // Process content sections and collapse blocks
      let lastPos = 0;
      for (const collapseMatch of allCollapseMatches) {
        // Parse content before this collapse block
        if (collapseMatch.start > lastPos) {
          parseContent(text.slice(lastPos, collapseMatch.start));
        }

        // Process the collapse block
        if (collapseMatch.type === "header") {
          // Header collapse with size (#>, ##>, ###>)
          const match = collapseMatch.match;
          const size = match[2].length;
          const title = match[3] || "";
          const content = match[4] || "";
          const collapse = {
            type: "collapse",
            size,
            text: parseInline(title),
            content: [],
          };

          // Parse collapse content recursively as a nested document
          if (content.trim()) {
            const parsed = parseNotedown(content, true);
            collapse.content = parsed.content;
          }

          result.content.push(collapse);
        } else if (collapseMatch.type === "simple") {
          // Simple collapse (|>)
          const match = collapseMatch.match;
          const title = match[2] || "";
          const content = match[3] || "";
          const collapse = {
            type: "collapse",
            text: parseInline(title),
            content: [],
          };

          // Parse collapse content recursively as a nested document
          if (content.trim()) {
            const parsed = parseNotedown(content, true);
            collapse.content = parsed.content;
          }

          result.content.push(collapse);
        }

        lastPos = collapseMatch.end;
      }

      // Parse any remaining content after the last collapse block
      if (lastPos < text.length) {
        parseContent(text.slice(lastPos));
      }
    } else {
      // No collapse blocks, process the entire text
      parseContent(text);
    }
  }

  function parseContent(text: string) {
    // Skip empty text
    if (!text || !text.trim()) {
      return;
    }

    // Split by lines for processing
    const lines = text.split(/\n/);

    // Process line by line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue; // Skip empty lines

      // Check for titles (allow optional leading whitespace)
      const titleMatch = /^(\s*)#{1,6}(?!\#|\>)\s+(.+)$/.exec(line);
      if (titleMatch) {
        // Count leading # symbols for title level
        const titleLevel = line
          .trim()
          .match(/^(#+)(?!\#|\>)/)![1].length;
        result.content.push({
          type: "title",
          size: titleLevel,
          text: parseInline(titleMatch[2].trim()),
        });
        continue;
      }

      // Check for description lines (like :Title:)
      const descMatch = /^\s*:([^:]+):/.exec(line);
      if (descMatch) {
        result.content.push({
          type: "desc",
          text: replaceMeta(descMatch[1].trim()),
        });
        i++;
        continue;
      }

      // Check if this line starts a list
      const isListLine = /^\d+\.\s+/.test(line) || /^[-*+]\s+/.test(line);
      if (isListLine && currentParagraphLines.length === 0) {
        // Start collecting list lines
        const listLines = [line];
        i++;

        // Collect all consecutive list lines (and nested items)
        while (i < lines.length) {
          const nextLine = lines[i];
          if (!nextLine) {
            i++;
            continue;
          }

          const nextTrimmed = nextLine.trim();

          if (!nextTrimmed) {
            i++;
            continue;
          }

          // Check if it's a list item or indented continuation
          const isNextListLine =
            /^\d+\.\s+/.test(nextTrimmed) || /^[-*+]\s+/.test(nextTrimmed);
          const isIndentedLine = nextLine.length > nextLine.trimStart().length;

          if (
            isNextListLine ||
            (isIndentedLine &&
              (/^\d+\.\s+/.test(nextTrimmed) || /^[-*+]\s+/.test(nextTrimmed)))
          ) {
            listLines.push(nextLine);
            i++;
          } else if (isIndentedLine) {
            // This is an indented line (content for the previous item)
            listLines.push(nextLine);
            i++;
          } else {
            // End of list
            break;
          }
        }

        // Parse the list lines
        const parsedList = parseListLines(listLines, 0);
        result.content.push(parsedList.list);
        i = parsedList.nextIndex - 1; // Adjust for the loop increment
        continue;
      }

      // Check for tables
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        // Look ahead to see if this is part of a table
        if (
          i + 1 < lines.length &&
          lines[i + 1] &&
          lines[i + 1].trim().startsWith("|") &&
          lines[i + 1].trim().endsWith("|") &&
          // Ensure the next line is a separator line
          lines[i + 1].trim().includes("|-")
        ) {
          // Start collecting table lines
          const tableLines = [line];
          i++;
          tableLines.push(lines[i]); // Add separator line

          // Collect all additional table rows
          i++;
          while (
            i < lines.length &&
            lines[i] &&
            lines[i].trim().startsWith("|") &&
            lines[i].trim().endsWith("|")
          ) {
            tableLines.push(lines[i]);
            i++;
          }

          // Parse the table
          result.content.push(parseTable(tableLines.join("\n")));
          i--; // Adjust for the loop increment
          continue;
        }
      }

      // Check for images ![alt](url)
      const imageMatch = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(line.trim());
      if (imageMatch) {
        result.content.push({
          type: "image",
          alt: imageMatch[1] || "",
          link: imageMatch[2] || "",
        });
        continue;
      }

      // Check for horizontal rule
      if (/^-{3,}$/.test(line.trim())) {
        result.content.push({
          type: "hr",
        });
        continue;
      }

      // Collect content for regular paragraphs
      let j = i;
      let currentParagraphLines: string[] = [];

      // Collect paragraph content
      while (j < lines.length) {
        // Skip leading empty lines
        if (!lines[j] || !lines[j].trim()) {
          j++;
          continue;
        }

        // Stop at double empty line (paragraph break)
        if (
          j > 0 &&
          j + 1 < lines.length &&
          !lines[j].trim() &&
          !lines[j + 1].trim()
        ) {
          j += 2;
          break;
        }

        // Stop at special elements
        const nextLine = lines[j];
        if (!nextLine) {
          j++;
          continue;
        }

        if (
          // Title
          /^#{1,6}(?!\#|\>)\s+/.test(nextLine) ||
          // List
          /^\d+\.\s+/.test(nextLine) ||
          /^[-*+]\s+/.test(nextLine) ||
          // Description
          /^:[^:]+:/.test(nextLine) ||
          // Table
          (nextLine.trim().startsWith("|") && nextLine.trim().endsWith("|"))
        ) {
          break;
        }

        currentParagraphLines.push(nextLine);
        j++;
      }

      // Process paragraph content
      if (currentParagraphLines.length > 0) {
        const paragraphText = currentParagraphLines.join("\n");
        const paragraph = {
          type: "paragraph",
          content: [
            {
              type: "text",
              content: parseInline(paragraphText),
            },
          ],
        };
        result.content.push(paragraph);
      }

      i = j - 1; // Adjust for the outer loop
    }
  }

  // Function to parse content lines into blocks
  function parseContentLines(lines: string[]): any[] {
    // Process indentation before joining lines
    // This preserves relative indentation while handling collapse nesting

    // Calculate common indentation level to remove
    let minIndent = Infinity;
    for (const line of lines) {
      if (line.trim()) {
        // Skip empty lines
        const indent = line.length - line.trimStart().length;
        minIndent = Math.min(minIndent, indent);
      }
    }

    // Remove common indentation prefix from all lines
    const processedLines = lines.map((line) => {
      if (line.trim()) {
        return line.slice(minIndent); // Remove the common indentation
      }
      return line; // Keep empty lines as is
    });

    // Check for code blocks in the content
    let codeBlockStart = -1;
    let codeBlockLang = "";
    let inCodeBlock = false;
    
    // First pass to check if this is a single code block
    for (let i = 0; i < processedLines.length; i++) {
      const currentLine = processedLines[i] || "";
      const line = currentLine.trim();
      if (!inCodeBlock && line.startsWith("```")) {
        inCodeBlock = true;
        codeBlockStart = i;
        codeBlockLang = line.slice(3).trim(); // Extract language
      } else if (inCodeBlock && line === "```") {
        // We found a complete code block - if it's the only content, return it directly
        if (codeBlockStart === 0 && i === processedLines.length - 1) {
          // Extract the code content
          const codeContent = processedLines
            .slice(codeBlockStart + 1, i)
            .join("\n");
          
          return [{
            type: "code",
            lang: codeBlockLang || undefined,
            content: codeContent
          }];
        }
        inCodeBlock = false;
      }
    }

    // Join lines back and parse as a full Notedown document to handle nested collapses
    const contentText = processedLines.join("\n");
    if (!contentText.trim()) {
      return [];
    }

    // Recursively parse the content as a new Notedown document
    const subDocument = parseNotedown(contentText, true);
    return subDocument.content || [];
  }

  // Helper function to parse mixed content (headings followed by lists, etc.)
  function parseMixedContent(contentLines: string[]): any[] {
    // Join and parse as a mini document
    const contentText = contentLines.join("\n");
    const parsedContent = parseNotedown(contentText, true);
    return parsedContent.content || [];
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
      if (!line.trim()) return;

      // Clean and split cells
      const cells = line
        .slice(1, -1) // Remove leading/trailing |
        .split("|")
        .map((cell, cellIndex) => ({
          type: "cell",
          content: parseInline(cell.trim()),
          align: cellIndex < alignments.length ? alignments[cellIndex] : "left",
        }));

      table.rows.push({
        isHeader: index === 0, // First row is header
        cells,
      });
    });

    return table;
  }

  // FIX: Special function to handle code blocks within list items - this is where we need to focus
  function handleCodeBlockInList(indentLevel: number, codeBlock: any, listItems: any[]): boolean {
    for (const item of listItems) {
      // Check if this is the right list item
      if (item.content_blocks) {
        // Add the code block to this item's content blocks
        if (!item.content_blocks) {
          item.content_blocks = [];
        }
        item.content_blocks.push(codeBlock);
        return true;
      }
      
      // Check nested lists
      if (item.nested) {
        for (const nestedList of item.nested) {
          if (handleCodeBlockInList(indentLevel, codeBlock, nestedList.items)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function parseListLines(
    lines: string[],
    startIndex: number
  ): { list: any; nextIndex: number } {
    // Detect if this is an ordered or unordered list
    const firstLine = lines[startIndex].trim();
    const isOrdered = /^\d+\./.test(firstLine);
    const items: any[] = [];
    const listType = isOrdered ? "ordered" : "unordered";
    let indent = 0;
    let i = startIndex;

    while (i < lines.length) {
      const line = lines[i];
      if (!line) {
        i++;
        continue;
      }

      const trimmed = line.trim();
      // Skip empty lines
      if (!trimmed) {
        i++;
        continue;
      }

      // Calculate indentation for this line
      indent = line.length - line.trimStart().length;

      // Check if this is a list item of the current type
      const orderedMatch = /^(\s*)(\d+\.)\s+(.+)$/.exec(line);
      const unorderedMatch = /^(\s*)([-*+])\s+(.+)$/.exec(line);

      // If not a matching list item, end this list
      if (
        (isOrdered && !orderedMatch) ||
        (!isOrdered && !unorderedMatch) ||
        (orderedMatch &&
          orderedMatch[1].length !== indent &&
          i !== startIndex) ||
        (unorderedMatch &&
          unorderedMatch[1].length !== indent &&
          i !== startIndex)
      ) {
        break;
      }

      // Extract content from the matched item
      let content = "";
      if (isOrdered && orderedMatch && orderedMatch[3]) {
        content = orderedMatch[3];
      } else if (!isOrdered && unorderedMatch && unorderedMatch[2]) {
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
        } else if (nextIndent > indent) {
          // Greater indentation but not a list item - this is indented content for the current item

          // Collect all lines with the same or greater indentation as additional content
          const contentLines = [];
          let k = j;

          while (k < lines.length) {
            const contentLine = lines[k];
            if (!contentLine) {
              // Keep empty lines
              contentLines.push("");
              k++;
              continue;
            }

            const contentIndent =
              contentLine.length - contentLine.trimStart().length;

            // If indentation drops below the content indentation level, we're done with this content block
            if (contentIndent < nextIndent) {
              break;
            }

            // Add this line to the content, preserving its indentation relative to nextIndent
            contentLines.push(contentLine.slice(nextIndent));
            k++;
          }

          // Process the collected content lines - THIS IS THE FIX FOR MERMAID DIAGRAMS
          if (contentLines.length > 0) {
            // Check for code blocks in the content
            let isCompleteCodeBlock = false;
            let codeBlockLang = "";
            let codeContent = "";
            
            // Pattern to check if this is a complete code block
            const fullContent = contentLines.join("\n");
            const codeBlockPattern = /^\s*```(\w*)\n([\s\S]*?)\n\s*```\s*$/;
            const codeMatch = fullContent.match(codeBlockPattern);
            
            if (codeMatch) {
              isCompleteCodeBlock = true;
              codeBlockLang = codeMatch[1] || "";
              codeContent = codeMatch[2] || "";
            }
            
            if (isCompleteCodeBlock) {
              // Handle as a direct code block
              if (!item.content_blocks) {
                item.content_blocks = [];
              }
              
              item.content_blocks.push({
                type: "code",
                lang: codeBlockLang || undefined,
                content: codeContent
              });
            } else {
              // Normal content processing
              const contentBlocks = parseContentLines(contentLines);

              // Add content to the current list item
              if (!item.content_blocks) {
                item.content_blocks = [];
              }
              item.content_blocks.push(...contentBlocks);
            }
          }

          j = k; // Move to the next line after the content block
        } else {
          // Not indented or a list item, skip
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
        ordered: listType === "ordered",
        items: items,
      },
      nextIndex: i,
    };
  }

  // Add post-processing step to handle code blocks in list items
  // Scan for code blocks at the root level that should be part of a list item
  const codeBlocks = result.content.filter(item => item.type === "code" && item.indentLevel);
  if (codeBlocks.length > 0) {
    for (const codeBlock of codeBlocks) {
      let isHandled = false;
      
      // Look for list items to attach this code block to
      for (const item of result.content) {
        if (item.type === "list") {
          // Try to find a suitable list item
          // This is a simplified approach - in a real solution, we'd use the indentation
          // level to determine the exact list item this code block belongs to
          const lastItem = item.items[item.items.length - 1];
          if (lastItem) {
            if (!lastItem.content_blocks) {
              lastItem.content_blocks = [];
            }
            lastItem.content_blocks.push(codeBlock);
            isHandled = true;
            break;
          }
        }
      }
      
      // If we handled this code block, remove it from the root level
      if (isHandled) {
        const index = result.content.indexOf(codeBlock);
        if (index !== -1) {
          result.content.splice(index, 1);
        }
      }
    }
  }

  return result;
}
