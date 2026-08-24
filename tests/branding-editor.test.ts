import test from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';

// Polyfill DOMParser for Node environment testing
const dom = new JSDOM();
(global as any).DOMParser = dom.window.DOMParser;

import { parseSvgString } from '../src/components/admin/svg/parser';
import { serializeSvgDocument } from '../src/components/admin/svg/serializer';
import { sanitizeSvg } from '../src/utils/svgSanitizer';

test('Visual SVG Editor Pipeline Test Suite', async (t) => {

  const testSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="100%" height="100%">
  <g transform="translate(15, 10)">
    <path d="M50 70 C30 50 10 35 5 25 C20 60 40 80 50 95 C60 80 80 60 95 25 C90 35 70 50 50 70 Z" fill="#60a5fa"/>
    <circle cx="50" cy="35" r="12" fill="#ffffff"/>
  </g>
  <text x="130" y="55" font-family="system-ui, sans-serif" font-size="26" font-weight="800" fill="#ffffff">TÁTA MÁ PRÁVO</text>
  <text x="132" y="80" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#93c5fd" letter-spacing="1.5">CELISTVOST A JISTOTA</text>
</svg>`;

  await t.test('1. Parses SVG correctly into internal model', () => {
    const doc = parseSvgString(testSvg);
    assert.ok(doc);
    assert.strictEqual(doc.viewBox, '0 0 400 120');
    assert.strictEqual(doc.nodes.length, 3);
    assert.strictEqual(doc.nodes[0].type, 'g');
    assert.strictEqual(doc.nodes[1].type, 'text');
    assert.strictEqual(doc.nodes[2].type, 'text');
    assert.strictEqual(doc.nodes[1].textContext, 'TÁTA MÁ PRÁVO');
    assert.strictEqual(doc.nodes[1].attrs['font-weight'], '800');
    assert.strictEqual(doc.nodes[2].attrs['letter-spacing'], '1.5');
  });

  await t.test('2. Round-trip serialization preserves critical attributes', () => {
    const doc = parseSvgString(testSvg);
    const serialized = serializeSvgDocument(doc!);
    
    assert.ok(serialized.includes('TÁTA MÁ PRÁVO'));
    assert.ok(serialized.includes('CELISTVOST A JISTOTA'));
    assert.ok(serialized.includes('letter-spacing="1.5"'));
    assert.ok(serialized.includes('fill="#60a5fa"'));
    assert.ok(serialized.includes('transform="translate(15, 10)"'));
  });

  await t.test('3. Output is fully validated by server-side SVG Sanitizer', () => {
    const doc = parseSvgString(testSvg);
    const serialized = serializeSvgDocument(doc!);
    const result = sanitizeSvg(serialized);
    
    assert.strictEqual(result.valid, true);
    assert.ok(result.sanitized?.includes('TÁTA MÁ PRÁVO'));
  });
  
  await t.test('4. Security: Rejects scripts and iframe injections during import/serialization', () => {
    const maliciousSvg = `<svg><g><script>alert(1)</script><path d="M0 0"/></g><iframe src="javascript:alert(1)"></iframe></svg>`;
    const doc = parseSvgString(maliciousSvg);
    // Our internal parser should ignore script and iframe because they are not in ALLOWED_TAGS
    assert.strictEqual(doc?.nodes[0].children.length, 1); // only path should be allowed
    assert.strictEqual(doc?.nodes[0].children[0].type, 'path');
    assert.strictEqual(doc?.nodes.length, 1); // iframe ignored
    
    const serialized = serializeSvgDocument(doc!);
    assert.strictEqual(serialized.includes('script'), false);
    assert.strictEqual(serialized.includes('iframe'), false);
    
    const result = sanitizeSvg(serialized);
    assert.strictEqual(result.valid, true);
  });
});
