import { SvgDocument, SvgNode, SvgNodeType } from './types';

const ALLOWED_TAGS = ['g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text'];

export function parseSvgString(svgString: string): SvgDocument | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const root = doc.documentElement;
    
    if (root.tagName.toLowerCase() !== 'svg') {
      return null;
    }

    const defaultDoc: SvgDocument = {
      viewBox: root.getAttribute('viewBox') || '0 0 400 120',
      width: root.getAttribute('width') || '100%',
      height: root.getAttribute('height') || '100%',
      nodes: []
    };

    defaultDoc.nodes = parseNodes(root);
    return defaultDoc;
  } catch (e) {
    console.error("SVG Parse Error", e);
    return null;
  }
}

function parseNodes(element: Element): SvgNode[] {
  const nodes: SvgNode[] = [];
  
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    
    if (child.nodeType === 1) { // Element node
      const el = child as Element;
      const tagName = el.tagName.toLowerCase() as SvgNodeType;
      
      if (ALLOWED_TAGS.includes(tagName)) {
        const attrs: Record<string, string> = {};
        for (let j = 0; j < el.attributes.length; j++) {
          const attr = el.attributes[j];
          // Simple block for some forbidden attrs natively in parser
          if (!attr.name.startsWith('on') && attr.name !== 'style') {
            attrs[attr.name] = attr.value;
          }
        }
        
        nodes.push({
          id: crypto.randomUUID(),
          type: tagName,
          attrs,
          children: parseNodes(el),
          textContext: tagName === 'text' ? el.textContent || undefined : undefined
        });
      }
    }
  }
  
  return nodes;
}
