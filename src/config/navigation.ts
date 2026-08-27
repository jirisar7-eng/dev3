import { NavItem } from '../types';

export type NavVisibility = 'public' | 'user' | 'team' | 'admin';

export interface NavAuthContext {
  isAuthenticated: boolean;
  role?: string | null;
  permissions?: string[];
}

export const ADMIN_ROLES = [
  'ADMIN',
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'MODERATOR',
  'LEGAL_EDITOR',
  'CONTENT_MANAGER',
];

export const SUPER_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'ADMIN',
];

export const TEAM_ROLES = [
  'VOLUNTEER',
  'VERIFIED_CONTRIBUTOR',
  'MODERATOR',
  'LEGAL_EDITOR',
  'CONTENT_MANAGER',
  'ADMIN',
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
];

export const NAVIGATION_ITEMS: NavItem[] = [
  // Category 0: 🏠 Domů & Veřejnost (Public)
  { id: 'cat-home', labelKey: '🏠 Domů & Veřejnost', url: '/', order: 0, target: '_self', isExternal: false, visibility: 'public' },
  { id: 'sub-home-1', labelKey: 'Domů', url: '/', order: 1, target: '_self', isExternal: false, parentId: 'cat-home', visibility: 'public' },
  { id: 'sub-home-4', labelKey: 'Přihlásit / Registrace', url: '/login', order: 4, target: '_self', isExternal: false, parentId: 'cat-home', visibility: 'public' },

  // Category 1: 🚨 Pomoc & Komunita (Public)
  { id: 'cat-1', labelKey: '🚨 Pomoc & Komunita', url: '/krizova-pomoc', order: 10, target: '_self', isExternal: false, visibility: 'public' },
  { id: 'sub-1-1', labelKey: 'SOS krizový plán', url: '/sos-plan', order: 11, target: '_self', isExternal: false, parentId: 'cat-1', visibility: 'public' },
  { id: 'sub-1-2', labelKey: 'Krizový rozcestník', url: '/krizova-pomoc', order: 12, target: '_self', isExternal: false, parentId: 'cat-1', visibility: 'public' },
  { id: 'sub-1-3', labelKey: 'Právní poradna', url: '/pravni-poradna', order: 13, target: '_self', isExternal: false, parentId: 'cat-1', visibility: 'public' },
  { id: 'sub-1-4', labelKey: 'Fórum / Komunitní podpora', url: '/forum', order: 14, target: '_self', isExternal: false, parentId: 'cat-1', visibility: 'public' },
  { id: 'sub-1-5', labelKey: 'Memento otců', url: '/memento', order: 15, target: '_self', isExternal: false, parentId: 'cat-1', visibility: 'public' },
  { id: 'sub-1-6', labelKey: 'Registr subjektů', url: '/registr-subjektu', order: 16, target: '_self', isExternal: false, parentId: 'cat-1', visibility: 'public' },
  { id: 'sub-1-7', labelKey: 'Mapa subjektů', url: '/mapa-subjektu', order: 17, target: '_self', isExternal: false, parentId: 'cat-1', visibility: 'public' },

  // Category 2: ⚖️ Právo & Opatrovnictví (Public)
  { id: 'cat-2', labelKey: '⚖️ Právo & Opatrovnictví', url: '/agenda', order: 20, target: '_self', isExternal: false, visibility: 'public' },
  { id: 'sub-2-1', labelKey: 'Agenda opatrovnického řízení', url: '/agenda', order: 21, target: '_self', isExternal: false, parentId: 'cat-2', visibility: 'public' },
  { id: 'sub-2-2', labelKey: 'Práva otců & rodičovská odpovědnost', url: '/prava', order: 22, target: '_self', isExternal: false, parentId: 'cat-2', visibility: 'public' },
  { id: 'sub-2-3', labelKey: 'Judikatura', url: '/judikatura', order: 23, target: '_self', isExternal: false, parentId: 'cat-2', visibility: 'public' },
  { id: 'sub-2-4', labelKey: 'Vzory dokumentů & podání', url: '/dokumenty', order: 24, target: '_self', isExternal: false, parentId: 'cat-2', visibility: 'public' },
  { id: 'sub-2-5', labelKey: 'Odborné články & analýzy', url: '/clanky', order: 25, target: '_self', isExternal: false, parentId: 'cat-2', visibility: 'public' },
  { id: 'sub-2-6', labelKey: 'Zákony / e-Sbírka', url: '/state-laws', order: 26, target: '_self', isExternal: false, parentId: 'cat-2', visibility: 'public' },
  { id: 'sub-2-7', labelKey: 'Průvodce OSPOD', url: '/ospod', order: 27, target: '_self', isExternal: false, parentId: 'cat-2', visibility: 'public' },
  { id: 'sub-2-8', labelKey: 'Průvodce soudním řízením', url: '/soud', order: 28, target: '_self', isExternal: false, parentId: 'cat-2', visibility: 'public' },
  { id: 'sub-2-9', labelKey: 'Finanční a majetkové vypořádání', url: '/majetek', order: 29, target: '_self', isExternal: false, parentId: 'cat-2', visibility: 'public' },

  // Category 3: 👨‍👧 Péče & Spolurodičovství (Public)
  { id: 'cat-3', labelKey: '👨‍👧 Péče & Spolurodičovství', url: '/pece', order: 30, target: '_self', isExternal: false, visibility: 'public' },
  { id: 'sub-3-1', labelKey: 'Péče o dítě / Care Hub', url: '/pece', order: 31, target: '_self', isExternal: false, parentId: 'cat-3', visibility: 'public' },
  { id: 'sub-3-2', labelKey: 'CoParent Hub (Spolurodičovství)', url: '/coparent', order: 32, target: '_self', isExternal: false, parentId: 'cat-3', visibility: 'public' },
  { id: 'sub-3-3', labelKey: 'Kalkulačka výživného a nákladů', url: '/kalkulacka-vyzivneho', order: 33, target: '_self', isExternal: false, parentId: 'cat-3', visibility: 'public' },
  { id: 'sub-3-4', labelKey: 'Psychologická podpora dětí', url: '/psychologie', order: 34, target: '_self', isExternal: false, parentId: 'cat-3', visibility: 'public' },

  // Category 4: 💼 Můj případ & Dokumenty (User - Authenticated Only)
  { id: 'cat-4', labelKey: '💼 Můj případ & Dokumenty', url: '/muj-pripad', order: 40, target: '_self', isExternal: false, visibility: 'user' },
  { id: 'sub-4-1', labelKey: 'Osobní spis otce', url: '/muj-pripad', order: 41, target: '_self', isExternal: false, parentId: 'cat-4', visibility: 'user' },
  { id: 'sub-4-2', labelKey: 'Dokumenty případu & důkazy', url: '/portal/dokumenty', order: 42, target: '_self', isExternal: false, parentId: 'cat-4', visibility: 'user' },
  { id: 'sub-4-3', labelKey: 'AI Case Manager', url: '/ai-case-manager', order: 43, target: '_self', isExternal: false, parentId: 'cat-4', visibility: 'user' },
  { id: 'sub-4-4', labelKey: 'Kalendář a důležité lhůty', url: '/kalendar', order: 44, target: '_self', isExternal: false, parentId: 'cat-4', visibility: 'user' },

  // Category 5: 🤖 AI Nástroje (Public)
  { id: 'cat-5', labelKey: '🤖 AI Nástroje', url: '/ai-asistent', order: 50, target: '_self', isExternal: false, visibility: 'public' },
  { id: 'sub-5-1', labelKey: 'AI Právní Asistent', url: '/ai-asistent', order: 51, target: '_self', isExternal: false, parentId: 'cat-5', visibility: 'public' },
  { id: 'sub-5-2', labelKey: 'AI Průvodce řízením', url: '/ai-pruvodce', order: 52, target: '_self', isExternal: false, parentId: 'cat-5', visibility: 'public' },
  { id: 'sub-5-3', labelKey: 'Generátor formulářů & podání', url: '/ai-formulare', order: 53, target: '_self', isExternal: false, parentId: 'cat-5', visibility: 'public' },
  { id: 'sub-5-4', labelKey: 'Simulátor modelů péče', url: '/ai-simulator', order: 54, target: '_self', isExternal: false, parentId: 'cat-5', visibility: 'public' },

  // Category 6: 🎓 Akademie & Vzdělávání (Public)
  { id: 'cat-6', labelKey: '🎓 Akademie & Vzdělávání', url: '/studia', order: 60, target: '_self', isExternal: false, visibility: 'public' },
  { id: 'sub-6-1', labelKey: 'Kurzy pro rodiče', url: '/studia', order: 61, target: '_self', isExternal: false, parentId: 'cat-6', visibility: 'public' },
  { id: 'sub-6-2', labelKey: 'Videotéka & Webináře', url: '/videoteka', order: 62, target: '_self', isExternal: false, parentId: 'cat-6', visibility: 'public' },
  { id: 'sub-6-3', labelKey: 'Kvízy', url: '/kvizy', order: 63, target: '_self', isExternal: false, parentId: 'cat-6', visibility: 'public' },
  { id: 'sub-6-4', labelKey: 'Encyklopedie & Wiki pojmů', url: '/wiki', order: 64, target: '_self', isExternal: false, parentId: 'cat-6', visibility: 'public' },
  { id: 'sub-6-5', labelKey: 'Katalog odborných studií a výzkumů', url: '/studie', order: 65, target: '_self', isExternal: false, parentId: 'cat-6', visibility: 'public' },
  { id: 'sub-6-6', labelKey: 'Statistiky a data', url: '/state-statistics', order: 66, target: '_self', isExternal: false, parentId: 'cat-6', visibility: 'public' },
  { id: 'sub-6-7', labelKey: 'Uživatelský manuál portálu', url: '/user-manual', order: 67, target: '_self', isExternal: false, parentId: 'cat-6', visibility: 'public' },

  // Category 7: 📰 Aktuality & Příběhy (Public)
  { id: 'cat-7', labelKey: '📰 Aktuality & Příběhy', url: '/novinky', order: 70, target: '_self', isExternal: false, visibility: 'public' },
  { id: 'sub-7-1', labelKey: 'Novinky & Zprávy', url: '/novinky', order: 71, target: '_self', isExternal: false, parentId: 'cat-7', visibility: 'public' },
  { id: 'sub-7-2', labelKey: 'Příběhy otců', url: '/pribehy', order: 72, target: '_self', isExternal: false, parentId: 'cat-7', visibility: 'public' },

  // Category 8: 🏛️ O projektu & Podpora (Public)
  { id: 'cat-8', labelKey: '🏛️ O projektu & Podpora', url: '/o-projektu', order: 80, target: '_self', isExternal: false, visibility: 'public' },
  { id: 'sub-8-1', labelKey: 'O nás & Tvůrci', url: '/o-projektu', order: 81, target: '_self', isExternal: false, parentId: 'cat-8', visibility: 'public' },
  { id: 'sub-8-2', labelKey: 'Moje cesta zakladatele', url: '/moje-cesta-zakladatele', order: 82, target: '_self', isExternal: false, parentId: 'cat-8', visibility: 'public' },
  { id: 'sub-8-3', labelKey: 'Podpořte nás / Sponzoři & Partneři', url: '/podporte-nas', order: 83, target: '_self', isExternal: false, parentId: 'cat-8', visibility: 'public' },
  { id: 'sub-8-4', labelKey: 'Kontakt', url: '/kontakt', order: 84, target: '_self', isExternal: false, parentId: 'cat-8', visibility: 'public' },
  { id: 'sub-8-5', labelKey: 'Hledáme dobrovolníky', url: '/dobrovolnici', order: 85, target: '_self', isExternal: false, parentId: 'cat-8', visibility: 'public' },
  { id: 'sub-8-6', labelKey: 'Kodex dobrovolníka', url: '/kodex-dobrovolnika', order: 86, target: '_self', isExternal: false, parentId: 'cat-8', visibility: 'public' },
  { id: 'sub-8-7', labelKey: 'Mapa stránek', url: '/sitemap', order: 87, target: '_self', isExternal: false, parentId: 'cat-8', visibility: 'public' },

  // Category 9: 👤 Můj účet (User - Authenticated Only)
  { id: 'cat-9', labelKey: '👤 Můj účet', url: '/portal/profil', order: 90, target: '_self', isExternal: false, visibility: 'user' },
  { id: 'sub-9-1', labelKey: 'Můj Profil & Nastavení', url: '/portal/profil', order: 91, target: '_self', isExternal: false, parentId: 'cat-9', visibility: 'user' },
  { id: 'sub-9-2', labelKey: 'Zabezpečení účtu', url: '/portal/zabezpeceni', order: 92, target: '_self', isExternal: false, parentId: 'cat-9', visibility: 'user' },
  { id: 'sub-9-3', labelKey: 'Uživatelská podpora & Tickety', url: '/portal/tikety', order: 93, target: '_self', isExternal: false, parentId: 'cat-9', visibility: 'user' },
  { id: 'sub-9-4', labelKey: 'Odhlásit se', url: '/logout', order: 94, target: '_self', isExternal: false, parentId: 'cat-9', visibility: 'user' },

  // Category 10: 🛡️ Administrace CMS (Admin Only)
  { id: 'cat-10', labelKey: '🛡️ Administrace CMS', url: '/administrace', order: 100, target: '_self', isExternal: false, visibility: 'admin' },
  { id: 'sub-10-1', labelKey: 'Přehled & CMS', url: '/administrace', order: 101, target: '_self', isExternal: false, parentId: 'cat-10', visibility: 'admin' },
  { id: 'sub-10-2', labelKey: 'Správa uživatelů & RBAC', url: '/admin/users', order: 102, target: '_self', isExternal: false, parentId: 'cat-10', visibility: 'admin' },
  { id: 'sub-10-3', labelKey: 'AI Context & Administrace', url: '/ai-admin', order: 103, target: '_self', isExternal: false, parentId: 'cat-10', visibility: 'admin' },
  { id: 'sub-10-4', labelKey: 'VPS & Server Management', url: '/admin/vps', order: 104, target: '_self', isExternal: false, parentId: 'cat-10', visibility: 'admin', requiredRoles: SUPER_ADMIN_ROLES },
];

/**
 * Determines whether a given NavItem should be visible based on authentication state and roles.
 */
export function isNavItemVisible(item: NavItem, auth: NavAuthContext): boolean {
  const role = auth.role || null;
  const isAuth = auth.isAuthenticated;

  // 1. VPS route requires super admin / system admin / admin
  if (item.url === '/admin/vps') {
    return isAuth && !!role && SUPER_ADMIN_ROLES.includes(role);
  }

  // 2. Explicit requiredRoles check
  if (item.requiredRoles && item.requiredRoles.length > 0) {
    if (!isAuth || !role) return false;
    return item.requiredRoles.includes(role);
  }

  // 3. Admin items / categories / routes
  const isAdmin =
    item.visibility === 'admin' ||
    item.id === 'cat-10' ||
    item.id === 'cat-admin' ||
    item.parentId === 'cat-10' ||
    item.parentId === 'cat-admin' ||
    item.url === '/admin' ||
    item.url.startsWith('/admin/') ||
    item.url === '/administrace' ||
    item.url.startsWith('/administrace/') ||
    item.url === '/ai-admin' ||
    item.url === '/ai-context';

  if (isAdmin) {
    if (!isAuth || !role) return false;
    return ADMIN_ROLES.includes(role);
  }

  // 4. Team items / categories
  const isTeam =
    item.visibility === 'team' ||
    item.id === 'cat-team' ||
    item.parentId === 'cat-team' ||
    item.url.startsWith('/portal/tym');

  if (isTeam) {
    if (!isAuth || !role) return false;
    return TEAM_ROLES.includes(role);
  }

  // 5. User (private) items / categories
  const isUser =
    item.visibility === 'user' ||
    item.id === 'cat-4' ||
    item.id === 'cat-9' ||
    item.parentId === 'cat-4' ||
    item.parentId === 'cat-9' ||
    item.url === '/muj-pripad' ||
    item.url.startsWith('/muj-pripad/') ||
    item.url === '/portal/dokumenty' ||
    item.url === '/ai-case-manager' ||
    item.url === '/kalendar' ||
    item.url === '/portal/profil' ||
    item.url === '/portal/zabezpeceni' ||
    item.url === '/portal/tikety' ||
    item.url === '/logout';

  if (isUser) {
    return isAuth;
  }

  // 6. Default: Public items visible to everyone
  return true;
}

/**
 * Normalizes navigation URLs to canonical forms.
 * For example, '/cesta-zakladatele' -> '/moje-cesta-zakladatele'
 */
export function normalizeNavUrl(url: string): string {
  if (!url) return '/';
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith('/') && cleanUrl.length > 1) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  if (cleanUrl === '/cesta-zakladatele') {
    return '/moje-cesta-zakladatele';
  }
  if (cleanUrl === '/o-nas') {
    return '/o-projektu';
  }
  return cleanUrl;
}

/**
 * Deduplicates and canonicalizes navigation items based on canonical IDs and canonical URLs.
 * Ensures items like 'Moje cesta zakladatele' are never duplicated.
 */
export function deduplicateNavItems(items: NavItem[]): NavItem[] {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const result: NavItem[] = [];

  for (const item of items) {
    const normUrl = normalizeNavUrl(item.url);
    const normalizedItem: NavItem = { ...item, url: normUrl };

    // 1. Skip duplicate IDs
    if (seenIds.has(item.id)) {
      continue;
    }

    // 2. Skip duplicate normalized URLs (except category containers where url is '#' or category header)
    const isCategoryHeader = item.id.startsWith('cat-');
    if (!isCategoryHeader && normUrl !== '#' && normUrl !== '/') {
      if (seenUrls.has(normUrl)) {
        continue;
      }
    }

    seenIds.add(item.id);
    if (!isCategoryHeader && normUrl !== '#') {
      seenUrls.add(normUrl);
    }

    result.push(normalizedItem);
  }

  return result;
}

/**
 * Filters navigation items according to user authorization and cleans up orphaned children or empty parent categories.
 */
export function getVisibleNavItems(items: NavItem[], auth: NavAuthContext): NavItem[] {
  // Step 0: Always deduplicate & normalize first
  const cleanItems = deduplicateNavItems(items);

  // Step 1: Filter individual items
  const visibleItems = cleanItems.filter((item) => isNavItemVisible(item, auth));

  // Step 2: Build parent-child map
  const visibleItemIds = new Set(visibleItems.map((i) => i.id));

  // Step 3: Remove child items whose parent is not visible
  const validHierarchyItems = visibleItems.filter((item) => {
    if (item.parentId && !visibleItemIds.has(item.parentId)) {
      return false;
    }
    return true;
  });

  // Step 4: Count children for each parent
  const parentChildCount: Record<string, number> = {};
  validHierarchyItems.forEach((item) => {
    if (item.parentId) {
      parentChildCount[item.parentId] = (parentChildCount[item.parentId] || 0) + 1;
    }
  });

  // Step 5: Filter out parent categories that have 0 visible children (if they represent a category folder)
  return validHierarchyItems.filter((item) => {
    if (!item.parentId) {
      // If it's a category header (like cat-1, cat-2, etc.) that defines children, ensure it has at least 1 child or is a standalone root link
      const isKnownCategory = item.id.startsWith('cat-');
      if (isKnownCategory && (parentChildCount[item.id] || 0) === 0 && item.url === '#') {
        return false;
      }
    }
    return true;
  });
}
