// Debug script for testing nested mermaid diagrams
// This will help us understand how to fix the parser

import { parseNotedown } from "./src/parser.js";
import fs from "node:fs";

// Helper function to print the structure with less noise
function simplifyStructure(node, indent = "") {
  if (!node) return "null";
  
  if (Array.isArray(node)) {
    return node.map(item => simplifyStructure(item, indent + "  ")).join("\n");
  }
  
  if (typeof node === "object") {
    if (node.type === "code") {
      return `${indent}${node.type} (${node.lang || "no-lang"}): "${node.content.slice(0, 20)}..."`;
    }
    
    if (node.content) {
      if (Array.isArray(node.content)) {
        return `${indent}${node.type}:\n${simplifyStructure(node.content, indent + "  ")}`;
      } else {
        return `${indent}${node.type}: "${String(node.content).slice(0, 30)}..."`;
      }
    }
    
    if (node.items) {
      return `${indent}${node.type} (${node.ordered ? "ordered" : "unordered"}):\n${
        node.items.map(item => simplifyStructure(item, indent + "  ")).join("\n")
      }`;
    }
    
    const props = Object.keys(node)
      .filter(k => k !== "content" && k !== "items")
      .map(k => `${k}=${JSON.stringify(node[k]).slice(0, 20)}`)
      .join(", ");
      
    return `${indent}${node.type || "unknown"} [${props}]`;
  }
  
  return `${indent}${String(node)}`;
}

// Test content with mermaid diagram in list
const testContent = `1. 시각정 정보전달
    2. 후엽
        
        신경 세포 생성하는 화학 물질
        
        1. ADH (Antidiuretic) = Vasopressin (바소프레신)
            
            향 이뇨 호르몬
            
            → 신장: 수분 재흡수 촉진 ⇒ 혈압 증가
            
        2. 옥시토신
            
            자궁수축 호르몬 - 분만 과정
            
            \`\`\`mermaid
            flowchart TD
            
            subgraph Z[" "]
            direction LR
            	자궁벽 --> id1["물리적 수축(진통)"]
            	id2[옥시토신] --> id1
            	id1 --> 뇌
            	뇌 --> 시상하부 --> id3["옥시토신 분비 촉진"]
            end
            \`\`\``;

const parsed = parseNotedown(testContent);
console.log("PARSED STRUCTURE:");
console.log(simplifyStructure(parsed));
