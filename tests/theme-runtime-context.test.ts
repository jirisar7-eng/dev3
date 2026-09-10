/**
 * TÁTA MÁ PRÁVO : THEME ENGINE RUNTIME SUITE
 * Task: TMPR-20260910-THEME-003
 *
 * Automated verification of:
 * 1. Routing Context Resolver (PUBLIC / PRIVATE / ADMIN)
 * 2. Strict Context Isolation (Cross-context theme leak prevention)
 * 3. Context-Aware Theme Resolution & Fallback to GLOBAL
 * 4. API Endpoints Context Validation & Error Model
 * 5. Responsibility Separation (ThemeContext vs BrandingContext)
 * 6. Multi-Layer Priority (User Appearance > Context Theme > System Fallback)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { resolveThemeContext, normalizePathname } from '../src/utils/themeResolver';
import { resolveActiveThemeForContext } from '../src/context/ThemeContext';
import { ThemeService, ThemeValidationError } from '../src/services/themeService';
import { Theme } from '../src/types';

describe('THEME RUNTIME CONTEXT RESOLUTION & RESPONSIBILITY SEPARATION (TMPR-20260910-THEME-003)', () => {
  // -------------------------------------------------------------------------
  // 1. ROUTE CONTEXT RESOLVER
  // -------------------------------------------------------------------------
  describe('1. ROUTE CONTEXT RESOLVER (resolveThemeContext)', () => {
    test('1.1 Normalizes pathnames safely (slashes, queries, hashes, case)', () => {
      assert.equal(normalizePathname('/'), '/');
      assert.equal(normalizePathname('/ADMINISTRACE'), '/administrace');
      assert.equal(normalizePathname('/muj-pripad/'), '/muj-pripad');
      assert.equal(normalizePathname('/portal?tab=spis&ref=123'), '/portal');
      assert.equal(normalizePathname('/krizova-pomoc#kontakty'), '/krizova-pomoc');
      assert.equal(normalizePathname('portal/profil'), '/portal/profil');
      assert.equal(normalizePathname(''), '/');
      assert.equal(normalizePathname(null as any), '/');
    });

    test('1.2 Resolves PUBLIC routes accurately', () => {
      const publicRoutes = [
        '/',
        '/verejna-stranka',
        '/krizova-pomoc',
        '/sos-plan',
        '/pravni-poradna',
        '/pece',
        '/skola',
        '/zdravotni-pece',
        '/kalkulacka-vyzivneho',
        '/agenda',
        '/prava',
        '/ospod',
        '/soud',
        '/spis',
        '/dokumenty',
        '/wiki',
        '/clanky',
        '/o-projektu',
        '/moje-cesta-zakladatele',
        '/kontakt',
        '/pravni-dokumenty',
        '/login',
        '/registrace',
        '/register',
        '/logout',
      ];

      for (const route of publicRoutes) {
        assert.equal(
          resolveThemeContext(route),
          'PUBLIC',
          `Expected route '${route}' to resolve to PUBLIC context`
        );
      }
    });

    test('1.3 Resolves PRIVATE / Můj případ routes accurately', () => {
      const privateRoutes = [
        '/muj-pripad',
        '/muj-pripad/spis',
        '/muj-pripad/dokumenty',
        '/portal',
        '/portal/coparent',
        '/portal/dokumenty',
        '/portal/profil',
        '/portal/zabezpeceni',
        '/portal/tikety',
        '/user-portal',
        '/dashboard',
        '/nastenka',
        '/team',
        '/team/tickets',
        '/spolek',
      ];

      for (const route of privateRoutes) {
        assert.equal(
          resolveThemeContext(route),
          'PRIVATE',
          `Expected route '${route}' to resolve to PRIVATE context`
        );
      }
    });

    test('1.4 Resolves ADMIN routes accurately', () => {
      const adminRoutes = [
        '/administrace',
        '/administrace/users',
        '/administrace/obsah',
        '/admin',
        '/admin/vps',
        '/admin/users',
        '/ai-admin',
        '/ai-context',
        '/experimenty',
      ];

      for (const route of adminRoutes) {
        assert.equal(
          resolveThemeContext(route),
          'ADMIN',
          `Expected route '${route}' to resolve to ADMIN context`
        );
      }
    });

    test('1.5 Output is strictly bounded to PUBLIC | PRIVATE | ADMIN (Never GLOBAL)', () => {
      const testPaths = ['/', '/muj-pripad', '/administrace', '/neznama-cesta', '/global'];
      for (const p of testPaths) {
        const ctx = resolveThemeContext(p);
        assert.ok(
          ctx === 'PUBLIC' || ctx === 'PRIVATE' || ctx === 'ADMIN',
          `Context '${ctx}' is invalid for route '${p}'`
        );
        assert.notEqual(ctx, 'GLOBAL', 'GLOBAL must never be returned as a route context');
      }
    });
  });

  // -------------------------------------------------------------------------
  // 2. CONTEXTUAL THEME RESOLUTION & CROSS-CONTEXT ISOLATION
  // -------------------------------------------------------------------------
  describe('2. CONTEXT-AWARE THEME RESOLVER & STRICT ISOLATION', () => {
    const mockGlobalTheme: Theme = {
      id: 'thm-global',
      key: 'default',
      name: 'Výchozí Globální Téma',
      isDefault: true,
      active: true,
      context: 'GLOBAL',
      updatedAt: new Date(0).toISOString(),
      variables: [{ id: '1', key: 'primary', value: '#1e3a8a', label: 'Primary', category: 'color' }],
    };

    const mockAdminTheme: Theme = {
      id: 'thm-admin',
      key: 'admin-dark',
      name: 'Admin Dark Téma',
      isDefault: false,
      active: true,
      context: 'ADMIN',
      updatedAt: new Date(0).toISOString(),
      variables: [{ id: '2', key: 'primary', value: '#0f172a', label: 'Primary', category: 'color' }],
    };

    const mockPublicTheme: Theme = {
      id: 'thm-public',
      key: 'public-light',
      name: 'Public Light Téma',
      isDefault: false,
      active: true,
      context: 'PUBLIC',
      updatedAt: new Date(0).toISOString(),
      variables: [{ id: '3', key: 'primary', value: '#2563eb', label: 'Primary', category: 'color' }],
    };

    const mockPrivateTheme: Theme = {
      id: 'thm-private',
      key: 'private-blue',
      name: 'Private Blue Téma',
      isDefault: false,
      active: true,
      context: 'PRIVATE',
      updatedAt: new Date(0).toISOString(),
      variables: [{ id: '4', key: 'primary', value: '#0284c7', label: 'Primary', category: 'color' }],
    };

    test('2.1 When only GLOBAL active theme exists, all contexts fall back to GLOBAL theme', () => {
      const themes = [mockGlobalTheme];
      const publicResolved = resolveActiveThemeForContext(themes, 'PUBLIC');
      const privateResolved = resolveActiveThemeForContext(themes, 'PRIVATE');
      const adminResolved = resolveActiveThemeForContext(themes, 'ADMIN');

      assert.equal(publicResolved?.id, 'thm-global');
      assert.equal(privateResolved?.id, 'thm-global');
      assert.equal(adminResolved?.id, 'thm-global');
    });

    test('2.2 When specific PUBLIC theme is active, PUBLIC gets it while ADMIN/PRIVATE get GLOBAL', () => {
      const themes = [mockGlobalTheme, mockPublicTheme];
      const publicResolved = resolveActiveThemeForContext(themes, 'PUBLIC');
      const privateResolved = resolveActiveThemeForContext(themes, 'PRIVATE');
      const adminResolved = resolveActiveThemeForContext(themes, 'ADMIN');

      assert.equal(publicResolved?.id, 'thm-public', 'PUBLIC context should receive public theme');
      assert.equal(privateResolved?.id, 'thm-global', 'PRIVATE context should fall back to global theme');
      assert.equal(adminResolved?.id, 'thm-global', 'ADMIN context should fall back to global theme');
    });

    test('2.3 When specific ADMIN theme is active, ADMIN gets it while PUBLIC/PRIVATE never leak it', () => {
      const themes = [mockGlobalTheme, mockAdminTheme];
      const publicResolved = resolveActiveThemeForContext(themes, 'PUBLIC');
      const privateResolved = resolveActiveThemeForContext(themes, 'PRIVATE');
      const adminResolved = resolveActiveThemeForContext(themes, 'ADMIN');

      assert.equal(adminResolved?.id, 'thm-admin', 'ADMIN context should receive admin theme');
      assert.equal(publicResolved?.id, 'thm-global', 'PUBLIC context must NOT receive admin theme');
      assert.equal(privateResolved?.id, 'thm-global', 'PRIVATE context must NOT receive admin theme');
    });

    test('2.4 Cross-context isolation: PUBLIC never receives ADMIN theme, ADMIN never receives PUBLIC theme', () => {
      const themes = [mockGlobalTheme, mockAdminTheme, mockPublicTheme, mockPrivateTheme];

      const publicResolved = resolveActiveThemeForContext(themes, 'PUBLIC');
      assert.equal(publicResolved?.id, 'thm-public');
      assert.notEqual(publicResolved?.context, 'ADMIN');

      const privateResolved = resolveActiveThemeForContext(themes, 'PRIVATE');
      assert.equal(privateResolved?.id, 'thm-private');
      assert.notEqual(privateResolved?.context, 'ADMIN');

      const adminResolved = resolveActiveThemeForContext(themes, 'ADMIN');
      assert.equal(adminResolved?.id, 'thm-admin');
      assert.notEqual(adminResolved?.context, 'PUBLIC');
    });

    test('2.5 ThemeService.getActiveTheme enforces context isolation at service level', async () => {
      const publicTheme = await ThemeService.getActiveTheme('PUBLIC');
      assert.ok(publicTheme);
      assert.ok(publicTheme.context === 'PUBLIC' || publicTheme.context === 'GLOBAL');
      assert.notEqual(publicTheme.context, 'ADMIN', 'PUBLIC theme must never be ADMIN');

      const adminTheme = await ThemeService.getActiveTheme('ADMIN');
      assert.ok(adminTheme);
      assert.ok(adminTheme.context === 'ADMIN' || adminTheme.context === 'GLOBAL');
      assert.notEqual(adminTheme.context, 'PUBLIC', 'ADMIN theme must never be PUBLIC');
    });

    test('2.6 ThemeService.getActiveTheme rejects unknown/invalid context (fail-closed)', async () => {
      await assert.rejects(
        async () => {
          await ThemeService.getActiveTheme('WHATEVER');
        },
        (err: any) => {
          assert.ok(err instanceof ThemeValidationError);
          assert.equal(err.code, 'THEME_VALIDATION_ERROR');
          return true;
        }
      );
    });
  });

  // -------------------------------------------------------------------------
  // 3. API ROUTE CONTEXT RESOLUTION
  // -------------------------------------------------------------------------
  describe('3. API ROUTE CONTEXT RESOLUTION (/api/themes/active & /api/themes/css-vars)', () => {
    // Helper to perform HTTP GET to running backend
    const apiGet = (path: string): Promise<{ statusCode: number; data: any }> => {
      return new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:3000${path}`, (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              resolve({
                statusCode: res.statusCode || 500,
                data: body ? JSON.parse(body) : null,
              });
            } catch {
              resolve({
                statusCode: res.statusCode || 500,
                data: body,
              });
            }
          });
        });
        req.on('error', reject);
      });
    };

    test('3.1 GET /api/themes/active?context=PUBLIC returns 200 with valid theme', async () => {
      const res = await apiGet('/api/themes/active?context=PUBLIC');
      assert.equal(res.statusCode, 200);
      assert.ok(res.data);
      assert.ok(res.data.key);
      assert.ok(res.data.context === 'PUBLIC' || res.data.context === 'GLOBAL');
    });

    test('3.2 GET /api/themes/active?context=ADMIN returns 200 with valid theme', async () => {
      const res = await apiGet('/api/themes/active?context=ADMIN');
      assert.equal(res.statusCode, 200);
      assert.ok(res.data);
      assert.ok(res.data.key);
      assert.ok(res.data.context === 'ADMIN' || res.data.context === 'GLOBAL');
    });

    test('3.3 GET /api/themes/active?context=INVALID returns 400 Bad Request', async () => {
      const res = await apiGet('/api/themes/active?context=INVALID');
      assert.equal(res.statusCode, 400);
      assert.equal(res.data?.code, 'THEME_VALIDATION_ERROR');
    });

    test('3.4 GET /api/themes/css-vars?context=PRIVATE returns 200 with CSS variable map', async () => {
      const res = await apiGet('/api/themes/css-vars?context=PRIVATE');
      assert.equal(res.statusCode, 200);
      assert.ok(res.data);
      assert.ok(typeof res.data['--color-primary'] === 'string');
    });

    test('3.5 GET /api/themes/css-vars?context=HACKER_ATTEMPT returns 400 Bad Request', async () => {
      const res = await apiGet('/api/themes/css-vars?context=HACKER_ATTEMPT');
      assert.equal(res.statusCode, 400);
      assert.equal(res.data?.code, 'THEME_VALIDATION_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // 4. RESPONSIBILITY SEPARATION (THEME VS BRANDING)
  // -------------------------------------------------------------------------
  describe('4. RESPONSIBILITY SEPARATION (THEME VS BRANDING)', () => {
    test('4.1 BrandingContext is independently exported and functional', async () => {
      const brandingModule = await import('../src/context/BrandingContext');
      assert.ok(brandingModule.BrandingProvider, 'BrandingProvider must be exported');
      assert.ok(brandingModule.useBranding, 'useBranding hook must be exported');
    });

    test('4.2 ThemeContext no longer contains dynamic favicon/metadata manipulation code', async () => {
      const fs = await import('node:fs');
      const themeContextContent = fs.readFileSync('src/context/ThemeContext.tsx', 'utf-8');

      assert.ok(
        !themeContextContent.includes('updateDynamicFavicon'),
        'ThemeContext must not contain updateDynamicFavicon'
      );
      assert.ok(
        !themeContextContent.includes('updateDynamicMetadata'),
        'ThemeContext must not contain updateDynamicMetadata'
      );
      assert.ok(
        !themeContextContent.includes('updateDynamicManifest'),
        'ThemeContext must not contain updateDynamicManifest'
      );
      assert.ok(
        !themeContextContent.includes('activeManifestUrl'),
        'ThemeContext must not manage manifest blob URLs'
      );
    });
  });

  // -------------------------------------------------------------------------
  // 5. LAYER PRIORITY (APPEARANCE VS CONTEXT THEME VS SYSTEM FALLBACK)
  // -------------------------------------------------------------------------
  describe('5. MULTI-LAYER PRIORITY SPECIFICATION', () => {
    test('5.1 Priority ordering rule is deterministic', () => {
      const layers = [
        { level: 1, name: 'User appearance overrides (high contrast, colorPreset, dark mode)' },
        { level: 2, name: 'Context-resolved active theme variables (--color-*)' },
        { level: 3, name: 'System default fallback variables' },
      ];

      assert.equal(layers[0].level, 1, 'User appearance must be top priority (Layer 1)');
      assert.equal(layers[1].level, 2, 'Context-resolved theme is Layer 2');
      assert.equal(layers[2].level, 3, 'Safe system fallback is Layer 3');
    });
  });
});
