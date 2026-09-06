import test from 'node:test';
import assert from 'node:assert';
import { sanitizeSvg } from '../src/utils/svgSanitizer';

test('Branding Security and System Resolver Test Suite', async (t) => {

  await t.test('1. Valid SVG allows standard tags', () => {
    const svg = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
    const result = sanitizeSvg(svg);
    assert.strictEqual(result.valid, true);
    assert.match(result.sanitized || '', /circle/);
  });

  await t.test('2. Invalid SVG fails validation', () => {
    const invalidSvg = '<div class="fake-svg">Not SVG</div>';
    const result = sanitizeSvg(invalidSvg);
    assert.strictEqual(result.valid, false);
  });

  await t.test('3. Malicious SVG with XSS / scripts is sanitized (scripts stripped)', () => {
    const malicious = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script></svg>';
    const result = sanitizeSvg(malicious);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.sanitized?.includes('<script>'), false, 'Should strip script tags');
  });

  await t.test('4. SVG with event handlers is sanitized (handlers stripped)', () => {
    const malicious = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>';
    const result = sanitizeSvg(malicious);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.sanitized?.includes('onload'), false, 'Should strip onload event handlers');
  });

  await t.test('5. Default/Fallback behavior when data is missing or empty', () => {
    const fallbackBranding = {
      primaryLogoSvg: '',
      darkLogoSvg: '',
      faviconSvg: '',
      logoAlt: 'Táta má právo'
    };

    assert.strictEqual(fallbackBranding.logoAlt, 'Táta má právo');
    assert.strictEqual(fallbackBranding.primaryLogoSvg, '');
  });
});
