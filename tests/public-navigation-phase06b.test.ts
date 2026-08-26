import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  NAVIGATION_ITEMS,
  getVisibleNavItems,
  isNavItemVisible,
  deduplicateNavItems,
  normalizeNavUrl,
  ADMIN_ROLES,
  SUPER_ADMIN_ROLES,
  TEAM_ROLES,
} from '../src/config/navigation';
import { NavItem } from '../src/types';

describe('PHASE 06B — Public Navigation Unification & Legacy Merge Fix', () => {

  test('1. normalizeNavUrl correctly normalizes legacy URLs to canonical targets', () => {
    assert.strictEqual(normalizeNavUrl('/cesta-zakladatele'), '/moje-cesta-zakladatele');
    assert.strictEqual(normalizeNavUrl('/cesta-zakladatele/'), '/moje-cesta-zakladatele');
    assert.strictEqual(normalizeNavUrl('/o-nas'), '/o-projektu');
    assert.strictEqual(normalizeNavUrl('/moje-cesta-zakladatele'), '/moje-cesta-zakladatele');
    assert.strictEqual(normalizeNavUrl('/krizova-pomoc/'), '/krizova-pomoc');
  });

  test('2. NAVIGATION_ITEMS contains no duplicate canonical IDs or normalized URLs', () => {
    const ids = new Set<string>();
    const urls = new Set<string>();

    NAVIGATION_ITEMS.forEach((item) => {
      // ID uniqueness check
      assert.ok(!ids.has(item.id), `Duplicate ID found in NAVIGATION_ITEMS: ${item.id}`);
      ids.add(item.id);

      // URL uniqueness check for sub-items
      const normUrl = normalizeNavUrl(item.url);
      const isCategory = item.id.startsWith('cat-');
      if (!isCategory && normUrl !== '#' && normUrl !== '/') {
        assert.ok(!urls.has(normUrl), `Duplicate URL found in NAVIGATION_ITEMS: ${normUrl} (ID: ${item.id})`);
        urls.add(normUrl);
      }
    });
  });

  test('3. "Moje cesta zakladatele" appears EXACTLY ONCE in canonical NAVIGATION_ITEMS with URL /moje-cesta-zakladatele', () => {
    const founderStoryItems = NAVIGATION_ITEMS.filter(
      (item) => normalizeNavUrl(item.url) === '/moje-cesta-zakladatele'
    );

    assert.strictEqual(founderStoryItems.length, 1, 'Founder story item must appear exactly once in canonical navigation');
    assert.strictEqual(founderStoryItems[0].id, 'sub-8-2');
    assert.strictEqual(founderStoryItems[0].labelKey, 'Moje cesta zakladatele');
    assert.strictEqual(founderStoryItems[0].url, '/moje-cesta-zakladatele');
  });

  test('4. Anonymous user filtering: sees only public items, hides Admin, Team, and Client Case features', () => {
    const anonNav = getVisibleNavItems(NAVIGATION_ITEMS, {
      isAuthenticated: false,
      role: null,
    });

    const anonUrls = anonNav.map((i) => normalizeNavUrl(i.url));
    const anonIds = new Set(anonNav.map((i) => i.id));

    // Must NOT contain Admin or Team categories/urls
    assert.ok(!anonIds.has('cat-10'), 'Anonymous user must NOT see cat-10 (Admin)');
    assert.ok(!anonUrls.includes('/administrace'), 'Anonymous user must NOT see /administrace');
    assert.ok(!anonUrls.includes('/admin/users'), 'Anonymous user must NOT see /admin/users');
    assert.ok(!anonUrls.includes('/team'), 'Anonymous user must NOT see /team');

    // Must NOT contain private User categories/urls
    assert.ok(!anonIds.has('cat-4'), 'Anonymous user must NOT see cat-4 (Můj případ)');
    assert.ok(!anonIds.has('cat-9'), 'Anonymous user must NOT see cat-9 (Můj účet)');
    assert.ok(!anonUrls.includes('/muj-pripad'), 'Anonymous user must NOT see /muj-pripad');
    assert.ok(!anonUrls.includes('/portal/dokumenty'), 'Anonymous user must NOT see /portal/dokumenty');
    assert.ok(!anonUrls.includes('/portal/profil'), 'Anonymous user must NOT see /portal/profil');

    // MUST contain public founder story item exactly once
    const founderItems = anonNav.filter((i) => normalizeNavUrl(i.url) === '/moje-cesta-zakladatele');
    assert.strictEqual(founderItems.length, 1, 'Anonymous user must see "Moje cesta zakladatele" exactly once');
  });

  test('5. Authenticated USER filtering: sees public items and private user items, but NO Admin or VPS', () => {
    const userNav = getVisibleNavItems(NAVIGATION_ITEMS, {
      isAuthenticated: true,
      role: 'USER',
    });

    const userUrls = userNav.map((i) => normalizeNavUrl(i.url));
    const userIds = new Set(userNav.map((i) => i.id));

    // MUST see private user items
    assert.ok(userIds.has('cat-4'), 'Authenticated USER must see cat-4 (Můj případ)');
    assert.ok(userIds.has('cat-9'), 'Authenticated USER must see cat-9 (Můj účet)');
    assert.ok(userUrls.includes('/muj-pripad'), 'Authenticated USER must see /muj-pripad');
    assert.ok(userUrls.includes('/portal/profil'), 'Authenticated USER must see /portal/profil');

    // Must NOT see Admin items
    assert.ok(!userIds.has('cat-10'), 'Authenticated USER must NOT see cat-10 (Admin)');
    assert.ok(!userUrls.includes('/administrace'), 'Authenticated USER must NOT see /administrace');
    assert.ok(!userUrls.includes('/admin/vps'), 'Authenticated USER must NOT see /admin/vps');
  });

  test('6. ADMIN role filtering: sees Admin items including /admin/vps, while non-admin role LEGAL_EDITOR does not see /admin/vps', () => {
    const adminNav = getVisibleNavItems(NAVIGATION_ITEMS, {
      isAuthenticated: true,
      role: 'ADMIN',
    });

    const adminUrls = adminNav.map((i) => normalizeNavUrl(i.url));
    const adminIds = new Set(adminNav.map((i) => i.id));

    assert.ok(adminIds.has('cat-10'), 'ADMIN must see cat-10 (Administrace CMS)');
    assert.ok(adminUrls.includes('/administrace'), 'ADMIN must see /administrace');
    assert.ok(adminUrls.includes('/admin/vps'), 'ADMIN must see /admin/vps');

    const editorNav = getVisibleNavItems(NAVIGATION_ITEMS, {
      isAuthenticated: true,
      role: 'LEGAL_EDITOR',
    });
    const editorUrls = editorNav.map((i) => normalizeNavUrl(i.url));
    assert.ok(!editorUrls.includes('/admin/vps'), 'LEGAL_EDITOR must NOT see /admin/vps');
  });

  test('7. Deduplication & legacy DB merge fix: legacy DB response with /cesta-zakladatele or duplicate sub-8-1b cannot contaminate public menu', () => {
    const legacyDbNavData: NavItem[] = [
      { id: 'cat-8', labelKey: '🏛️ O projektu', url: '/o-projektu', order: 80 },
      { id: 'sub-8-1b', labelKey: 'Cesta zakladatele (Legacy)', url: '/cesta-zakladatele', order: 82, parentId: 'cat-8' },
      { id: 'sub-8-2', labelKey: 'Moje cesta zakladatele', url: '/moje-cesta-zakladatele', order: 82, parentId: 'cat-8' },
    ];

    // Simulate Header.tsx merge logic
    let baseNav = deduplicateNavItems([...NAVIGATION_ITEMS]);
    const canonicalUrls = new Set(baseNav.map((n) => normalizeNavUrl(n.url)));
    const canonicalIds = new Set(baseNav.map((n) => n.id));

    legacyDbNavData.forEach((dbItem) => {
      const normUrl = normalizeNavUrl(dbItem.url);
      if (!canonicalIds.has(dbItem.id) && !canonicalUrls.has(normUrl)) {
        baseNav.push({ ...dbItem, url: normUrl });
        canonicalIds.add(dbItem.id);
        canonicalUrls.add(normUrl);
      }
    });

    const finalMergedNav = deduplicateNavItems(baseNav);

    const founderStoryItems = finalMergedNav.filter(
      (i) => normalizeNavUrl(i.url) === '/moje-cesta-zakladatele'
    );

    assert.strictEqual(founderStoryItems.length, 1, 'Merged navigation must contain "Moje cesta zakladatele" EXACTLY ONCE');
    assert.strictEqual(founderStoryItems[0].id, 'sub-8-2', 'Canonical ID sub-8-2 must be preserved');
    assert.strictEqual(founderStoryItems[0].url, '/moje-cesta-zakladatele');
  });

  test('8. RBAC security helper checks and constants', () => {
    assert.ok(ADMIN_ROLES.includes('ADMIN'));
    assert.ok(ADMIN_ROLES.includes('SUPER_ADMIN'));
    assert.ok(SUPER_ADMIN_ROLES.includes('SUPER_ADMIN'));
    assert.ok(TEAM_ROLES.includes('VOLUNTEER'));
    assert.ok(TEAM_ROLES.includes('MODERATOR'));

    // Check isNavItemVisible for VPS route
    const vpsItem: NavItem = {
      id: 'sub-vps',
      labelKey: 'VPS',
      url: '/admin/vps',
      requiredRoles: SUPER_ADMIN_ROLES,
    };

    assert.strictEqual(isNavItemVisible(vpsItem, { isAuthenticated: false, role: null }), false);
    assert.strictEqual(isNavItemVisible(vpsItem, { isAuthenticated: true, role: 'USER' }), false);
    assert.strictEqual(isNavItemVisible(vpsItem, { isAuthenticated: true, role: 'ADMIN' }), true);
    assert.strictEqual(isNavItemVisible(vpsItem, { isAuthenticated: true, role: 'SUPER_ADMIN' }), true);
  });
});
