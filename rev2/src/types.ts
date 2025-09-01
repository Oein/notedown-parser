export interface ParsedContent {
  meta: { [key: string]: string };
  content: any;
}

export interface ParserOptions {
  allowHtml?: boolean;
  highlightCode?: boolean;
}

export interface RendererOptions {
  cssVariables?: { [key: string]: string };
  highlightCode?: boolean;
}

// AST Node Types
export type ASTNodeType =
  | "text"
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "code"
  | "codeBlock"
  | "latex"
  | "link"
  | "image"
  | "heading"
  | "paragraph"
  | "blockquote"
  | "list"
  | "listItem"
  | "table"
  | "tableRow"
  | "tableCell"
  | "collapse"
  | "coloredText"
  | "metaReference"
  | "lineBreak"
  | "paragraphBreak"
  | "rawHtml"
  | "descriptionHeader"
  | "mermaidChart";

export interface ASTNode {
  type: ASTNodeType;
  content?: string;
  children?: ASTNode[];
  attributes?: { [key: string]: any };
}

export interface CollapseNode extends ASTNode {
  type: "collapse";
  title?: string;
  level?: number; // For #>, ##>, ###>
  children: ASTNode[];
}

export interface ColoredTextNode extends ASTNode {
  type: "coloredText";
  content: string;
  foreground?: string;
  background?: string;
}

export interface CodeBlockNode extends ASTNode {
  type: "codeBlock";
  content: string;
  language?: string;
  isRaw?: boolean; // for html:raw
}

export interface MetaReferenceNode extends ASTNode {
  type: "metaReference";
  key: string;
}
