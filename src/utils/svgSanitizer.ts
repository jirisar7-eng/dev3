import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

const MAX_SVG_SIZE_BYTES = 250 * 1024; // 250 KB limit

export const sanitizeSvg = (svgContent: string): { valid: boolean; sanitized?: string; error?: string } => {
  if (!svgContent || typeof svgContent !== 'string') {
    return { valid: false, error: 'Empty content' };
  }
  
  const content = svgContent.trim();
  const byteLength = Buffer.byteLength(content, 'utf8');
  
  if (byteLength > MAX_SVG_SIZE_BYTES) {
    return { valid: false, error: 'SVG soubor je příliš velký (maximum 250 KB)' };
  }

  if (!content.toLowerCase().startsWith('<svg') || !content.toLowerCase().endsWith('</svg>')) {
    return { valid: false, error: 'Vstup musí být platný SVG tag začínající <svg> a končící </svg>' };
  }

  try {
    // We configure DOMPurify to only allow SVG and safe tags/attributes
    const cleanSvg = purify.sanitize(content, {
      USE_PROFILES: { svg: true, svgFilters: true },
      FORBID_TAGS: ['script', 'style', 'foreignObject', 'iframe', 'object', 'embed', 'image'],
      FORBID_ATTR: ['style', 'href', 'xlink:href'],
      ALLOW_DATA_ATTR: false,
    });

    if (!cleanSvg || typeof cleanSvg !== 'string') {
      return { valid: false, error: 'Chyba sanitizace - neplatný výstup' };
    }

    const cleanTrimmed = cleanSvg.trim();
    if (!cleanTrimmed.toLowerCase().startsWith('<svg') || !cleanTrimmed.toLowerCase().endsWith('</svg>')) {
      return { valid: false, error: 'Výsledek sanitizace není validní SVG' };
    }

    return { valid: true, sanitized: cleanTrimmed };
  } catch (error: any) {
    return { valid: false, error: `Chyba při parsování SVG: ${error.message}` };
  }
};
