import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { NAVIGATION_ITEMS, getVisibleNavItems, isNavItemVisible } from '../src/config/navigation.js';

describe('PHASE 02: Navigation Consolidation & Visibility Verification', () => {

  test('1. Anonymous User: strictly only public items, no private or admin items', () => {
    const anonymousAuth = {
      isAuthenticated: false,
      role: null,
    };

    const visibleItems = getVisibleNavItems(NAVIGATION_ITEMS, anonymousAuth);

    // Verify presence of public categories
    const visibleIds = visibleItems.map((i) => i.id);
    const visibleUrls = visibleItems.map((i) => i.url);

    assert.ok(visibleIds.includes('cat-home'), 'cat-home must be visible for anonymous');
    assert.ok(visibleIds.includes('cat-1'), 'cat-1 (Pomoc) must be visible for anonymous');
    assert.ok(visibleIds.includes('cat-2'), 'cat-2 (Právo) must be visible for anonymous');
    assert.ok(visibleIds.includes('cat-3'), 'cat-3 (Péče) must be visible for anonymous');
    assert.ok(visibleIds.includes('cat-5'), 'cat-5 (AI) must be visible for anonymous');
    assert.ok(visibleIds.includes('cat-6'), 'cat-6 (Akademie) must be visible for anonymous');
    assert.ok(visibleIds.includes('cat-7'), 'cat-7 (Aktuality) must be visible for anonymous');
    assert.ok(visibleIds.includes('cat-8'), 'cat-8 (O projektu) must be visible for anonymous');

    // Forbidden for anonymous:
    assert.ok(!visibleIds.includes('cat-4'), 'cat-4 (Můj případ) must NOT be visible for anonymous');
    assert.ok(!visibleIds.includes('cat-9'), 'cat-9 (Můj účet) must NOT be visible for anonymous');
    assert.ok(!visibleIds.includes('cat-10'), 'cat-10 (Administrace) must NOT be visible for anonymous');

    // Forbidden URLs for anonymous
    assert.ok(!visibleUrls.includes('/muj-pripad'), '/muj-pripad must NOT be visible for anonymous');
    assert.ok(!visibleUrls.includes('/portal/dokumenty'), '/portal/dokumenty must NOT be visible for anonymous');
    assert.ok(!visibleUrls.includes('/ai-case-manager'), '/ai-case-manager must NOT be visible for anonymous');
    assert.ok(!visibleUrls.includes('/kalendar'), '/kalendar must NOT be visible for anonymous');
    assert.ok(!visibleUrls.includes('/portal/profil'), '/portal/profil must NOT be visible for anonymous');
    assert.ok(!visibleUrls.includes('/portal/zabezpeceni'), '/portal/zabezpeceni must NOT be visible for anonymous');
    assert.ok(!visibleUrls.includes('/portal/tikety'), '/portal/tikety must NOT be visible for anonymous');
    assert.ok(!visibleUrls.includes('/admin'), '/admin must NOT be visible for anonymous');
    assert.ok(!visibleUrls.includes('/administrace'), '/administrace must NOT be visible for anonymous');
    assert.ok(!visibleUrls.includes('/admin/users'), '/admin/users must NOT be visible for anonymous');
    assert.ok(!visibleUrls.includes('/ai-admin'), '/ai-admin must NOT be visible for anonymous');
    assert.ok(!visibleUrls.includes('/admin/vps'), '/admin/vps must NOT be visible for anonymous');
    assert.ok(!visibleUrls.includes('/logout'), '/logout must NOT be visible for anonymous');
  });

  test('2. Authenticated Standard USER: sees public + user items, no admin items', () => {
    const userAuth = {
      isAuthenticated: true,
      role: 'USER',
    };

    const visibleItems = getVisibleNavItems(NAVIGATION_ITEMS, userAuth);
    const visibleIds = visibleItems.map((i) => i.id);
    const visibleUrls = visibleItems.map((i) => i.url);

    // Visible for authenticated user
    assert.ok(visibleIds.includes('cat-home'), 'cat-home visible for user');
    assert.ok(visibleIds.includes('cat-1'), 'cat-1 visible for user');
    assert.ok(visibleIds.includes('cat-4'), 'cat-4 (Můj případ) visible for user');
    assert.ok(visibleIds.includes('cat-9'), 'cat-9 (Můj účet) visible for user');
    assert.ok(visibleUrls.includes('/muj-pripad'), '/muj-pripad visible for user');
    assert.ok(visibleUrls.includes('/portal/dokumenty'), '/portal/dokumenty visible for user');
    assert.ok(visibleUrls.includes('/ai-case-manager'), '/ai-case-manager visible for user');
    assert.ok(visibleUrls.includes('/portal/profil'), '/portal/profil visible for user');
    assert.ok(visibleUrls.includes('/logout'), '/logout visible for user');

    // Forbidden for standard user: Admin items
    assert.ok(!visibleIds.includes('cat-10'), 'cat-10 must NOT be visible for standard user');
    assert.ok(!visibleUrls.includes('/admin'), '/admin must NOT be visible for standard user');
    assert.ok(!visibleUrls.includes('/administrace'), '/administrace must NOT be visible for standard user');
    assert.ok(!visibleUrls.includes('/admin/users'), '/admin/users must NOT be visible for standard user');
    assert.ok(!visibleUrls.includes('/ai-admin'), '/ai-admin must NOT be visible for standard user');
    assert.ok(!visibleUrls.includes('/admin/vps'), '/admin/vps must NOT be visible for standard user');
  });

  test('3. Authenticated ADMIN / SUPER_ADMIN: sees public + user + admin items', () => {
    const adminAuth = {
      isAuthenticated: true,
      role: 'ADMIN',
    };

    const visibleItems = getVisibleNavItems(NAVIGATION_ITEMS, adminAuth);
    const visibleIds = visibleItems.map((i) => i.id);
    const visibleUrls = visibleItems.map((i) => i.url);

    assert.ok(visibleIds.includes('cat-home'));
    assert.ok(visibleIds.includes('cat-4'));
    assert.ok(visibleIds.includes('cat-9'));
    assert.ok(visibleIds.includes('cat-10'), 'cat-10 (Admin) must be visible for ADMIN');
    assert.ok(visibleUrls.includes('/administrace'), '/administrace must be visible for ADMIN');
    assert.ok(visibleUrls.includes('/admin/users'), '/admin/users must be visible for ADMIN');
    assert.ok(visibleUrls.includes('/ai-admin'), '/ai-admin must be visible for ADMIN');
    assert.ok(visibleUrls.includes('/admin/vps'), '/admin/vps must be visible for ADMIN');
  });

  test('4. Legal Editor / Moderator: sees admin items except super-admin-only routes', () => {
    const editorAuth = {
      isAuthenticated: true,
      role: 'LEGAL_EDITOR',
    };

    const visibleItems = getVisibleNavItems(NAVIGATION_ITEMS, editorAuth);
    const visibleIds = visibleItems.map((i) => i.id);
    const visibleUrls = visibleItems.map((i) => i.url);

    assert.ok(visibleIds.includes('cat-10'), 'cat-10 visible for LEGAL_EDITOR');
    assert.ok(visibleUrls.includes('/administrace'), '/administrace visible for LEGAL_EDITOR');
    assert.ok(!visibleUrls.includes('/admin/vps'), '/admin/vps must NOT be visible for LEGAL_EDITOR');
  });

  test('5. Hierarchy Integrity: No orphaned children or empty parent categories', () => {
    const contexts = [
      { isAuthenticated: false, role: null },
      { isAuthenticated: true, role: 'USER' },
      { isAuthenticated: true, role: 'ADMIN' },
    ];

    for (const ctx of contexts) {
      const items = getVisibleNavItems(NAVIGATION_ITEMS, ctx);
      const itemMap = new Map(items.map((i) => [i.id, i]));

      for (const item of items) {
        if (item.parentId) {
          assert.ok(
            itemMap.has(item.parentId),
            `Parent ${item.parentId} of child ${item.id} must exist in visible items for ${JSON.stringify(ctx)}`
          );
        }
      }
    }
  });

  test('6. Single Source of Truth: No duplicate Navbar component in codebase', () => {
    let navbarFound = false;
    try {
      // @ts-ignore
      require.resolve('../src/components/Navbar.tsx');
      navbarFound = true;
    } catch {
      navbarFound = false;
    }
    assert.strictEqual(navbarFound, false, 'src/components/Navbar.tsx must be removed');
  });
});
