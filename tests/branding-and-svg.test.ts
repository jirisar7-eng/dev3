import test from 'node:test';
import assert from 'node:assert';
import { sanitizeSvg } from '../src/utils/svgSanitizer';
import { BrandingService } from '../src/services/brandingService';

test('SVG Sanitizer Test Suite', async (t) => {
  await t.test('Valid SVG passes', () => {
    const validSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" /></svg>';
    const result = sanitizeSvg(validSvg);
    assert.strictEqual(result.valid, true);
    assert.ok(result.sanitized?.includes('<circle'));
  });

  await t.test('Rejects <script> tags', () => {
    const scriptSvg = '<svg><script>alert(1)</script></svg>';
    const result = sanitizeSvg(scriptSvg);
    assert.strictEqual(result.valid, true); // DOMPurify will just strip it
    assert.strictEqual(result.sanitized?.includes('<script>'), false);
  });

  await t.test('Rejects javascript: URI', () => {
    const jsUri = '<svg><a href="javascript:alert(1)"><circle cx="5" cy="5" r="5" /></a></svg>';
    const result = sanitizeSvg(jsUri);
    assert.strictEqual(result.valid, true); 
    assert.strictEqual(result.sanitized?.includes('javascript:'), false);
    // DOMPurify strips the dangerous href
  });

  await t.test('Rejects iframe/object/embed/foreignObject', () => {
    const embedSvg = '<svg><foreignObject><iframe src="javascript:alert(1)"></iframe></foreignObject></svg>';
    const result = sanitizeSvg(embedSvg);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.sanitized?.includes('<foreignObject'), false);
    assert.strictEqual(result.sanitized?.includes('<iframe'), false);
  });

  await t.test('Rejects event handlers', () => {
    const eventSvg = '<svg><circle cx="5" cy="5" r="5" onload="alert(1)" onclick="alert(1)" /></svg>';
    const result = sanitizeSvg(eventSvg);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.sanitized?.includes('onload'), false);
    assert.strictEqual(result.sanitized?.includes('onclick'), false);
  });
  
  await t.test('Rejects external images/resources (data/http URI)', () => {
    const externalImageSvg = '<svg><image href="http://example.com/image.jpg" /></svg>';
    const result = sanitizeSvg(externalImageSvg);
    assert.strictEqual(result.valid, true); // DOMPurify allows image? We configured FORBID_TAGS: ['image']
    assert.strictEqual(result.sanitized?.includes('<image'), false);
  });

  await t.test('Rejects large SVG files', () => {
    const largeSvg = '<svg>' + 'A'.repeat(300 * 1024) + '</svg>';
    const result = sanitizeSvg(largeSvg);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error?.includes('maximum 250 KB'), true);
  });

  await t.test('Rejects non-SVG inputs', () => {
    const htmlInput = '<html><body><h1>Not SVG</h1></body></html>';
    const result = sanitizeSvg(htmlInput);
    assert.strictEqual(result.valid, false);
  });
});
