/**
 * TÁTA MÁ PRÁVO : THEME ENGINE TOKEN FOUNDATION SUITE
 * Task: TMPR-20260910-THEME-004
 *
 * Automated verification of:
 * 1. Token Architecture Contract & Categories (BRAND, SURFACE, TEXT, BORDER, ACTION, SEMANTIC)
 * 2. 1:1 Bidirectional Mapping (Legacy DB Keys <-> Semantic Design Tokens)
 * 3. Canonical Táta Classic Profile (SSOT snapshot baseline)
 * 4. CSS Variable Resolution & Dual-Bridge Compatibility
 * 5. ThemeService & ThemeContext Integration with Tata Classic
 * 6. Backward Compatibility with Existing DB Keys (Zero DB Schema Mutation)
 * 7. Tailwind v4 @theme CSS Definitions Integrity
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  SEMANTIC_TOKEN_DEFINITIONS,
  LEGACY_KEY_TO_SEMANTIC_TOKEN,
  SEMANTIC_TOKEN_TO_LEGACY_KEY,
  resolveSemanticCssVars,
} from '../src/theme/themeTokens';
import {
  TATA_CLASSIC_PROFILE,
  getTataClassicVariablesMap,
} from '../src/theme/profiles/tataClassic';
import {
  ThemeService,
  DEFAULT_THEME_VARIABLES,
} from '../src/services/themeService';
import { ALLOWED_THEME_VARIABLE_KEYS } from '../src/services/themeValidation';

describe('THEME ENGINE — TOKEN FOUNDATION + TÁTA CLASSIC SNAPSHOT (TMPR-20260910-THEME-004)', () => {
  // -------------------------------------------------------------------------
  // 1. TOKEN ARCHITECTURE & CONTRACT
  // -------------------------------------------------------------------------
  describe('1. TOKEN ARCHITECTURE & CONTRACT', () => {
    test('1.1 Token definitions contain exactly 14 canonical tokens', () => {
      assert.equal(SEMANTIC_TOKEN_DEFINITIONS.length, 14);
    });

    test('1.2 Each definition defines valid category, tokens, and CSS properties', () => {
      const allowedCategories = ['BRAND', 'SURFACE', 'TEXT', 'BORDER', 'ACTION', 'SEMANTIC'];
      for (const def of SEMANTIC_TOKEN_DEFINITIONS) {
        assert.ok(def.token, 'Token name must be defined');
        assert.ok(def.legacyKey, 'Legacy key must be defined');
        assert.ok(allowedCategories.includes(def.category), `Category ${def.category} must be valid`);
        assert.ok(def.cssVar.startsWith('--color-'), `cssVar ${def.cssVar} must start with --color-`);
        assert.ok(def.legacyCssVar.startsWith('--color-'), `legacyCssVar ${def.legacyCssVar} must start with --color-`);
        assert.ok(/^#[0-9a-fA-F]{6}$/.test(def.fallbackValue), `Fallback value ${def.fallbackValue} must be valid hex`);
      }
    });

    test('1.3 Grouping by category covers all required UI concerns', () => {
      const categories = new Set(SEMANTIC_TOKEN_DEFINITIONS.map((d) => d.category));
      assert.ok(categories.has('BRAND'), 'Must have BRAND category');
      assert.ok(categories.has('SURFACE'), 'Must have SURFACE category');
      assert.ok(categories.has('TEXT'), 'Must have TEXT category');
      assert.ok(categories.has('BORDER'), 'Must have BORDER category');
      assert.ok(categories.has('ACTION'), 'Must have ACTION category');
      assert.ok(categories.has('SEMANTIC'), 'Must have SEMANTIC category');
    });
  });

  // -------------------------------------------------------------------------
  // 2. 1:1 BIDIRECTIONAL MAPPING
  // -------------------------------------------------------------------------
  describe('2. 1:1 BIDIRECTIONAL MAPPING', () => {
    test('2.1 Every allowed legacy DB key maps to a unique semantic token', () => {
      for (const key of ALLOWED_THEME_VARIABLE_KEYS) {
        const token = LEGACY_KEY_TO_SEMANTIC_TOKEN[key];
        assert.ok(token, `Legacy key ${key} must map to a semantic token`);
      }
    });

    test('2.2 Reverse mapping maps every semantic token back to exact legacy key', () => {
      for (const def of SEMANTIC_TOKEN_DEFINITIONS) {
        const reverseKey = SEMANTIC_TOKEN_TO_LEGACY_KEY[def.token];
        assert.equal(reverseKey, def.legacyKey, `Reverse mapping for ${def.token} must match ${def.legacyKey}`);
      }
    });

    test('2.3 Legacy keys match ALLOWED_THEME_VARIABLE_KEYS set exactly (no orphans)', () => {
      const mappedKeys = Object.keys(LEGACY_KEY_TO_SEMANTIC_TOKEN).sort();
      const allowedKeys = [...ALLOWED_THEME_VARIABLE_KEYS].sort();
      assert.deepEqual(mappedKeys, allowedKeys);
    });
  });

  // -------------------------------------------------------------------------
  // 3. TÁTA CLASSIC CANONICAL PROFILE (SSOT SNAPSHOT)
  // -------------------------------------------------------------------------
  describe('3. TÁTA CLASSIC CANONICAL PROFILE (SSOT SNAPSHOT)', () => {
    test('3.1 Profile metadata is deterministic and versioned', () => {
      assert.equal(TATA_CLASSIC_PROFILE.key, 'tata-classic');
      assert.equal(TATA_CLASSIC_PROFILE.name, 'Táta má právo — Classic');
      assert.equal(TATA_CLASSIC_PROFILE.version, 1);
      assert.equal(TATA_CLASSIC_PROFILE.isDefault, true);
      assert.equal(TATA_CLASSIC_PROFILE.context, 'GLOBAL');
    });

    test('3.2 Baseline colors match Táta má právo original visual identity 100%', () => {
      const varsMap = getTataClassicVariablesMap();
      assert.equal(varsMap.primary, '#1e3a8a');
      assert.equal(varsMap.secondary, '#0284c7');
      assert.equal(varsMap.background, '#f8fafc');
      assert.equal(varsMap.surface, '#ffffff');
      assert.equal(varsMap.text, '#1e293b');
      assert.equal(varsMap.textMuted, '#64748b');
      assert.equal(varsMap.heading, '#0f172a');
      assert.equal(varsMap.link, '#2563eb');
      assert.equal(varsMap.border, '#e2e8f0');
      assert.equal(varsMap.button, '#1e3a8a');
      assert.equal(varsMap.buttonHover, '#0f172a');
      assert.equal(varsMap.success, '#16a34a');
      assert.equal(varsMap.warning, '#d97706');
      assert.equal(varsMap.error, '#dc2626');
    });

    test('3.3 Profile variables match ALLOWED_THEME_VARIABLE_KEYS length and keys', () => {
      assert.equal(TATA_CLASSIC_PROFILE.variables.length, ALLOWED_THEME_VARIABLE_KEYS.length);
      const keys = TATA_CLASSIC_PROFILE.variables.map((v) => v.key).sort();
      const expected = [...ALLOWED_THEME_VARIABLE_KEYS].sort();
      assert.deepEqual(keys, expected);
    });
  });

  // -------------------------------------------------------------------------
  // 4. CSS VARIABLE RESOLUTION & DUAL BRIDGE
  // -------------------------------------------------------------------------
  describe('4. CSS VARIABLE RESOLUTION & DUAL BRIDGE', () => {
    test('4.1 resolveSemanticCssVars produces both legacy and semantic aliases from array', () => {
      const input = [
        { key: 'primary', value: '#1e3a8a' },
        { key: 'background', value: '#f8fafc' },
      ];
      const resolved = resolveSemanticCssVars(input);

      // Legacy
      assert.equal(resolved['--color-primary'], '#1e3a8a');
      assert.equal(resolved['--color-background'], '#f8fafc');

      // Semantic
      assert.equal(resolved['--color-brand-primary'], '#1e3a8a');
      assert.equal(resolved['--color-surface-page'], '#f8fafc');
    });

    test('4.2 resolveSemanticCssVars produces both legacy and semantic aliases from record', () => {
      const input = {
        primary: '#1e3a8a',
        button: '#1e3a8a',
        buttonHover: '#0f172a',
      };
      const resolved = resolveSemanticCssVars(input);

      assert.equal(resolved['--color-primary'], '#1e3a8a');
      assert.equal(resolved['--color-brand-primary'], '#1e3a8a');
      assert.equal(resolved['--color-button'], '#1e3a8a');
      assert.equal(resolved['--color-action-primary'], '#1e3a8a');
      assert.equal(resolved['--color-buttonHover'], '#0f172a');
      assert.equal(resolved['--color-action-primary-hover'], '#0f172a');
    });

    test('4.3 ThemeService.getCssVariablesMap includes both legacy and semantic variables', async () => {
      const cssMap = await ThemeService.getCssVariablesMap('GLOBAL');
      assert.equal(cssMap['--color-primary'], '#1e3a8a');
      assert.equal(cssMap['--color-brand-primary'], '#1e3a8a');
      assert.equal(cssMap['--color-surface-card'], '#ffffff');
      assert.equal(cssMap['--color-surface'], '#ffffff');
      assert.equal(cssMap['--color-action-primary'], '#1e3a8a');
      assert.equal(cssMap['--color-button'], '#1e3a8a');
    });
  });

  // -------------------------------------------------------------------------
  // 5. UNIFIED CONSTANTS & REFACTOR INTEGRITY
  // -------------------------------------------------------------------------
  describe('5. UNIFIED CONSTANTS & REFACTOR INTEGRITY', () => {
    test('5.1 DEFAULT_THEME_VARIABLES in themeService is derived directly from TATA_CLASSIC_PROFILE', () => {
      assert.deepEqual(DEFAULT_THEME_VARIABLES, TATA_CLASSIC_PROFILE.variables);
    });

    test('5.2 All 14 variables in DEFAULT_THEME_VARIABLES are present with correct keys and categories', () => {
      for (const item of DEFAULT_THEME_VARIABLES) {
        assert.ok(ALLOWED_THEME_VARIABLE_KEYS.includes(item.key as any));
        assert.equal(item.category, 'color');
      }
    });
  });

  // -------------------------------------------------------------------------
  // 6. TAILWIND V4 @THEME INTEGRATION
  // -------------------------------------------------------------------------
  describe('6. TAILWIND V4 @THEME INTEGRATION', () => {
    test('6.1 src/index.css contains all 14 semantic design token declarations in @theme', () => {
      const cssContent = fs.readFileSync(path.join(process.cwd(), 'src/index.css'), 'utf-8');
      for (const def of SEMANTIC_TOKEN_DEFINITIONS) {
        assert.ok(
          cssContent.includes(def.cssVar),
          `index.css @theme must declare ${def.cssVar}`
        );
        assert.ok(
          cssContent.includes(def.legacyCssVar),
          `index.css fallback bridge must reference legacy variable ${def.legacyCssVar}`
        );
        assert.ok(
          cssContent.includes(def.fallbackValue),
          `index.css fallback bridge must contain fallback value ${def.fallbackValue}`
        );
      }
    });
  });

  // -------------------------------------------------------------------------
  // 7. COMPONENT MIGRATION VERIFICATION
  // -------------------------------------------------------------------------
  describe('7. COMPONENT MIGRATION VERIFICATION', () => {
    test('7.1 Hero.tsx uses semantic token utility classes', () => {
      const heroContent = fs.readFileSync(path.join(process.cwd(), 'src/components/public/Hero.tsx'), 'utf-8');
      assert.ok(heroContent.includes('text-text-heading'), 'Hero must use text-text-heading');
      assert.ok(heroContent.includes('text-text-primary'), 'Hero must use text-text-primary');
      assert.ok(heroContent.includes('bg-action-primary'), 'Hero must use bg-action-primary');
      assert.ok(heroContent.includes('bg-surface-card'), 'Hero must use bg-surface-card');
      assert.ok(heroContent.includes('border-border-default'), 'Hero must use border-border-default');
    });

    test('7.2 PWAInstallPrompt.tsx uses semantic token utility classes', () => {
      const pwaContent = fs.readFileSync(path.join(process.cwd(), 'src/components/common/PWAInstallPrompt.tsx'), 'utf-8');
      assert.ok(pwaContent.includes('bg-surface-card'), 'PWAInstallPrompt must use bg-surface-card');
      assert.ok(pwaContent.includes('border-border-default'), 'PWAInstallPrompt must use border-border-default');
      assert.ok(pwaContent.includes('text-text-heading'), 'PWAInstallPrompt must use text-text-heading');
      assert.ok(pwaContent.includes('bg-action-primary'), 'PWAInstallPrompt must use bg-action-primary');
    });

    test('7.3 Header.tsx uses semantic token utility classes', () => {
      const headerContent = fs.readFileSync(path.join(process.cwd(), 'src/components/Header.tsx'), 'utf-8');
      assert.ok(headerContent.includes('border-brand-primary'), 'Header must use border-brand-primary');
      assert.ok(headerContent.includes('text-brand-primary'), 'Header must use text-brand-primary');
      assert.ok(headerContent.includes('text-text-primary'), 'Header must use text-text-primary');
      assert.ok(headerContent.includes('bg-action-primary'), 'Header CTA must use bg-action-primary');
    });

    test('7.4 CookieConsentBanner.tsx uses semantic token utility classes', () => {
      const bannerContent = fs.readFileSync(path.join(process.cwd(), 'src/components/common/CookieConsentBanner.tsx'), 'utf-8');
      assert.ok(bannerContent.includes('bg-surface-card'), 'CookieConsentBanner must use bg-surface-card');
      assert.ok(bannerContent.includes('border-border-default'), 'CookieConsentBanner must use border-border-default');
      assert.ok(bannerContent.includes('bg-action-primary'), 'CookieConsentBanner must use bg-action-primary');
    });
  });
});
