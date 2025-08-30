// TypeScript interfaces for Notedown parser and renderer

export interface NotedownMeta {
  [key: string]: string;
}

export interface NotedownTextNode {
  text: string;
}

export interface NotedownLinkNode {
  link: string;
  text: string;
}

export interface NotedownMetaRefNode {
  meta: string;
}

export interface NotedownFormattedNode {
  format:
    | "bold"
    | "italic"
    | "underline"
    | "crossline"
    | "code"
    | "color"
    | "latex";
  content: NotedownInlineContent[];
  // Color-specific properties
  foreground?: string;
  background?: string;
  // Code-specific properties
  text?: string;
  // LaTeX-specific properties
  formula?: string;
}

export type NotedownInlineContent =
  | NotedownTextNode
  | NotedownLinkNode
  | NotedownMetaRefNode
  | NotedownFormattedNode;

export interface NotedownTextContent {
  type: "text";
  content: NotedownInlineContent[];
}

export interface NotedownParagraph {
  type: "paragraph";
  content: NotedownTextContent[];
}

export interface NotedownTitle {
  type: "title";
  size: number;
  text: NotedownInlineContent[];
}

export interface NotedownDescription {
  type: "desc";
  text: NotedownInlineContent[];
}

export interface NotedownCodeBlock {
  type: "code";
  lang?: string;
  content: string;
}

export interface NotedownCollapse {
  type: "collapse";
  size?: number;
  text: NotedownInlineContent[];
  content: NotedownContentItem[];
}

export interface NotedownImage {
  type: "image";
  link: string;
  alt: string;
}

export interface NotedownNewline {
  type: "newline";
}

export interface NotedownTableCell {
  content: NotedownInlineContent[];
  align?: "left" | "center" | "right";
}

export interface NotedownTableRow {
  cells: NotedownTableCell[];
  isHeader?: boolean;
}

export interface NotedownTable {
  type: "table";
  rows: NotedownTableRow[];
}

export interface NotedownListItem {
  type: "list-item";
  content: NotedownInlineContent[];
}

export interface NotedownList {
  type: "list";
  ordered: boolean;
  items: NotedownListItem[];
}

export type NotedownContentItem =
  | NotedownParagraph
  | NotedownTitle
  | NotedownDescription
  | NotedownCodeBlock
  | NotedownCollapse
  | NotedownImage
  | NotedownTextContent
  | NotedownNewline
  | NotedownTable
  | NotedownList;

export interface NotedownDocument {
  meta?: NotedownMeta;
  content: NotedownContentItem[];
}

// Pattern interface for parser
export interface NotedownPattern {
  re: RegExp;
  type: string;
  fg?: boolean;
  bg?: boolean;
  noColor?: boolean;
}
