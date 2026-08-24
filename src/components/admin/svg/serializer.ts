import { SvgDocument, SvgNode } from './types';

export function serializeSvgDocument(doc: SvgDocument): string {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${doc.viewBox}" width="${doc.width}" height="${doc.height}">`
  ];
  
  for (const node of doc.nodes) {
    if (!node.hidden) {
      parts.push(serializeNode(node, 2));
    }
  }
  
  parts.push('</svg>');
  return parts.join('\n');
}

function serializeNode(node: SvgNode, indent: number): string {
  const spaces = ' '.repeat(indent);
  const attrStr = Object.entries(node.attrs)
    .filter(([k, v]) => v !== undefined && v !== null && k !== 'id') // exclude internal state if any
    .map(([k, v]) => `${k}="${escapeXml(String(v))}"`)
    .join(' ');
    
  if (node.type === 'text') {
    return `${spaces}<text${attrStr ? ' ' + attrStr : ''}>${escapeXml(node.textContext || '')}</text>`;
  }
  
  if (node.children && node.children.length > 0) {
    const childrenStr = node.children
      .filter(c => !c.hidden)
      .map(c => serializeNode(c, indent + 2))
      .join('\n');
    return `${spaces}<${node.type}${attrStr ? ' ' + attrStr : ''}>\n${childrenStr}\n${spaces}</${node.type}>`;
  }
  
  return `${spaces}<${node.type}${attrStr ? ' ' + attrStr : ''}/>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
