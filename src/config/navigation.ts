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
  // Category 0: 🏠 Domů (Public)
  { id: 'cat-home', labelKey: '🏠 Domů', url: '/', order: 0, target: '_self', isExternal: false, visibility: 'public' },
  { id: 'sub-home-1', labelKey: 'Úvodní stránka', url: '/', order: 1, target: '_self', isExternal: false, parentId: 'cat-home', visibility: 'public' },
  { id: 'sub-home-2', labelKey: 'Živá aktivita portálu', url: '/aktivita-portalu', order: 2, target: '_self', isExternal: false, parentId: 'cat-home', visibility: 'public' },

  // Category 1: 🆘 Potřebuji pomoc (Public)
  { id: 'cat-1', labelKey: '🆘 Potřebuji pomoc', url: '/krizova-pomoc', order: 10, target: '_self', isExternal: false, visibility: 'public' },
  { id: 'sub-1-1', labelKey: 'SOS krizový plán — první kroky', url: '/sos-plan', order: 11, target: '_self', isExternal: false, parentId: 'cat-1', visibility: 'public' },
  { id: 'sub-1-2', labelKey: 'Krizový rozcestník & Linky pomoci', url: '/krizova-pomoc', order: 12, target: '_self', isExternal: false, parentId: 'cat-1', visibility: 'public' },
  { id: 'sub-1-3', labelKey: 'Právní poradna & Dotazy', url: '/pravni-poradna', order: 13, target: '_self', isExternal: false, parentId: 'cat-1', visibility: 'public' },
  { id: 'sub-1-4', labelKey: 'Registr & Hodnocení subjektů', url: '/registr-subjektu', order: 14, target: '_self', isExternal: false, parentId: 'cat-1', visibility: 'public' },
  { id: 'sub-1-5', labelKey: 'Mapa institucí a poraden', url: '/mapa-subjektu', order: 15, target: '_self', isExternal: false, parentId: 'cat-1', visibility: 'public' },
  { id: 'sub-1-6', labelKey: 'Memento otců', url: '/memento', order: 16, target: '_self', isExternal: false, parentId: 'cat-1', visibility: 'public' },

  // Category 2: 👨‍👧 Moje dítě (Public)
  { id: 'cat-dite', labelKey: '👨‍👧 Moje dítě', url: '/pece', order: 20, target: '_self', isExternal: false, visibility: 'public' },
  { id: 'sub-dite-1', labelKey: 'Psychologický vývoj & Emoce dítěte', url: '/psychologie', order: 21, target: '_self', isExternal: false, parentId: 'cat-dite', visibility: 'public' },
  { id: 'sub-dite-2', labelKey: 'Péče o novorozence a malé děti', url: '/pece', order: 22, target: '_self', isExternal: false, parentId: 'cat-dite', visibility: 'public' },
  { id: 'sub-dite-3', labelKey: 'Škola, školka & Informovanost rodiče', url: '/skola', order: 23, target: '_self', isExternal: false, parentId: 'cat-dite', visibility: 'public' },
  { id: 'sub-dite-4', labelKey: 'Lékařská péče, OČR & Dokumentace', url: '/zdravotni-pece', order: 24, target: '_self', isExternal: false, parentId: 'cat-dite', visibility: 'public' },
  { id: 'sub-dite-5', labelKey: 'Výzkumy citové vazby & Přespávání', url: '/studie/citova-vazba', order: 25, target: '_self', isExternal: false, parentId: 'cat-dite', visibility: 'public' },

  // Category 3: 🤝 Spolurodičovství & Finance (Public)
  { id: 'cat-coparent', labelKey: '🤝 Spolurodičovství & Finance', url: '/portal/coparent', order: 30, target: '_self', isExternal: false, visibility: 'public' },
  { id: 'sub-coparent-1', labelKey: 'CoParent Hub — Nástroj pro rodiče', url: '/portal/coparent', order: 31, target: '_self', isExternal: false, parentId: 'cat-coparent', visibility: 'public' },
  { id: 'sub-coparent-2', labelKey: 'Kalkulačka výživného MPSV', url: '/kalkulacka-vyzivneho', order: 32, target: '_self', isExternal: false, parentId: 'cat-coparent', visibility: 'public' },
  { id: 'sub-coparent-3', labelKey: 'Finanční a majetkové vypořádání (SJM)', url: '/majetek', order: 33, target: '_self', isExternal: false, parentId: 'cat-coparent', visibility: 'public' },
  { id: 'sub-coparent-4', labelKey: 'Deeskalační komunikace (B.I.F.F.)', url: '/komunikace-biff', order: 34, target: '_self', isExternal: false, parentId: 'cat-coparent', visibility: 'public' },
  { id: 'sub-coparent-5', labelKey: 'Simulátor modelů péče a předávání', url: '/ai-simulator', order: 35, target: '_self', isExternal: false, parentId: 'cat-coparent', visibility: 'public' },

  // Category 4: ⚖️ Právo a soudy (Public)
  { id: 'cat-pravo', labelKey: '⚖️ Právo a soudy', url: '/agenda', order: 40, target: '_self', isExternal: false, visibility: 'public' },
  { id: 'sub-pravo-1', labelKey: 'Průvodce opatrovnickým řízením', url: '/agenda', order: 41, target: '_self', isExternal: false, parentId: 'cat-pravo', visibility: 'public' },
  { id: 'sub-pravo-2', labelKey: 'Práva otců & Rodičovská odpovědnost', url: '/prava', order: 42, target: '_self', isExternal: false, parentId: 'cat-pravo', visibility: 'public' },
  { id: 'sub-pravo-3', labelKey: 'Průvodce OSPOD', url: '/ospod', order: 43, target: '_self', isExternal: false, parentId: 'cat-pravo', visibility: 'public' },
  { id: 'sub-pravo-4', labelKey: 'Průvodce soudním jednáním', url: '/soud', order: 44, target: '_self', isExternal: false, parentId: 'cat-pravo', visibility: 'public' },
  { id: 'sub-pravo-5', labelKey: 'Nahlížení do spisu & Příprava důkazů', url: '/spis', order: 45, target: '_self', isExternal: false, parentId: 'cat-pravo', visibility: 'public' },
  { id: 'sub-pravo-6', labelKey: 'Znalecké posudky v rodinném právu', url: '/znalecke-posudky', order: 46, target: '_self', isExternal: false, parentId: 'cat-pravo', visibility: 'public' },
  { id: 'sub-pravo-7', labelKey: 'Odvolání, dovolání & Ústavní stížnosti', url: '/odvolani', order: 47, target: '_self', isExternal: false, parentId: 'cat-pravo', visibility: 'public' },
  { id: 'sub-pravo-8', labelKey: 'Výkon rozhodnutí & Maření péče', url: '/vykon-rozhodnuti', order: 48, target: '_self', isExternal: false, parentId: 'cat-pravo', visibility: 'public' },
  { id: 'sub-pravo-9', labelKey: 'Mezinárodní spory & Únosy dětí', url: '/mezinarodni-spory', order: 49, target: '_self', isExternal: false, parentId: 'cat-pravo', visibility: 'public' },
  { id: 'sub-pravo-10', labelKey: 'Přelomová judikatura ÚS a NS', url: '/judikatura', order: 50, target: '_self', isExternal: false, parentId: 'cat-pravo', visibility: 'public' },
  { id: 'sub-pravo-11', labelKey: 'Zákony & e-Sbírka předpisů', url: '/state-laws', order: 51, target: '_self', isExternal: false, parentId: 'cat-pravo', visibility: 'public' },
  { id: 'sub-pravo-12', labelKey: 'Zákonné procesní lhůty & kalendář', url: '/kalendar', order: 52, target: '_self', isExternal: false, parentId: 'cat-pravo', visibility: 'public' },

  // Category 5: 📝 Dokumenty a formuláře (Public)
  { id: 'cat-docs', labelKey: '📝 Dokumenty a formuláře', url: '/dokumenty', order: 60, target: '_self', isExternal: false, visibility: 'public' },
  { id: 'sub-docs-1', labelKey: 'Vzory návrhů a podání ke stažení', url: '/dokumenty', order: 61, target: '_self', isExternal: false, parentId: 'cat-docs', visibility: 'public' },
  { id: 'sub-docs-2', labelKey: 'Inteligentní generátor formulářů', url: '/ai-formulare', order: 62, target: '_self', isExternal: false, parentId: 'cat-docs', visibility: 'public' },
  { id: 'sub-docs-3', labelKey: 'Právní dokumenty a podmínky portálu', url: '/pravni-dokumenty', order: 63, target: '_self', isExternal: false, parentId: 'cat-docs', visibility: 'public' },

  // Category 6: 🤖 AI Asistenti (Public)
  { id: 'cat-ai', labelKey: '🤖 AI Asistenti', url: '/ai-asistent', order: 70, target: '_self', isExternal: false, visibility: 'public' },
  { id: 'sub-ai-1', labelKey: 'AI Právní Asistent — konzultace', url: '/ai-asistent', order: 71, target: '_self', isExternal: false, parentId: 'cat-ai', visibility: 'public' },
  { id: 'sub-ai-2', labelKey: 'AI Průvodce procesními kroky', url: '/ai-pruvodce', order: 72, target: '_self', isExternal: false, parentId: 'cat-ai', visibility: 'public' },
  { id: 'sub-ai-3', labelKey: 'AI Analýza spisu & Case Manager', url: '/ai-case-manager', order: 73, target: '_self', isExternal: false, parentId: 'cat-ai', visibility: 'public' },

  // Category 7: 📚 Knihovna a data (Public)
  { id: 'cat-library', labelKey: '📚 Knihovna a data', url: '/wiki', order: 80, target: '_self', isExternal: false, visibility: 'public' },
  { id: 'sub-lib-1', labelKey: 'Encyklopedie & Právní slovník', url: '/wiki', order: 81, target: '_self', isExternal: false, parentId: 'cat-library', visibility: 'public' },
  { id: 'sub-lib-2', labelKey: 'Katalog odborných studií a výzkumů', url: '/studie', order: 82, target: '_self', isExternal: false, parentId: 'cat-library', visibility: 'public' },
  { id: 'sub-lib-3', labelKey: 'Odborné články a analýzy', url: '/clanky', order: 83, target: '_self', isExternal: false, parentId: 'cat-library', visibility: 'public' },
  { id: 'sub-lib-4', labelKey: 'Statistiky a data ČR', url: '/state-statistics', order: 84, target: '_self', isExternal: false, parentId: 'cat-library', visibility: 'public' },
  { id: 'sub-lib-5', labelKey: 'Kurzy a akademie pro rodiče', url: '/studia', order: 85, target: '_self', isExternal: false, parentId: 'cat-library', visibility: 'public' },
  { id: 'sub-lib-6', labelKey: 'Videotéka & Webináře', url: '/videoteka', order: 86, target: '_self', isExternal: false, parentId: 'cat-library', visibility: 'public' },
  { id: 'sub-lib-7', labelKey: 'Kvízy & Opatrovnický trenažér', url: '/kvizy', order: 87, target: '_self', isExternal: false, parentId: 'cat-library', visibility: 'public' },

  // Category 8: 📰 Komunita & O projektu (Public)
  { id: 'cat-community', labelKey: '📰 Komunita & O projektu', url: '/o-projektu', order: 90, target: '_self', isExternal: false, visibility: 'public' },
  { id: 'sub-comm-1', labelKey: 'O spolku & Tvůrci', url: '/o-projektu', order: 91, target: '_self', isExternal: false, parentId: 'cat-community', visibility: 'public' },
  { id: 'sub-8-2', labelKey: 'Moje cesta zakladatele', url: '/moje-cesta-zakladatele', order: 92, target: '_self', isExternal: false, parentId: 'cat-community', visibility: 'public' },
  { id: 'sub-comm-2', labelKey: 'Příběhy a zkušenosti otců', url: '/pribehy', order: 93, target: '_self', isExternal: false, parentId: 'cat-community', visibility: 'public' },
  { id: 'sub-comm-3', labelKey: 'Fórum / Komunitní podpora', url: '/forum', order: 94, target: '_self', isExternal: false, parentId: 'cat-community', visibility: 'public' },
  { id: 'sub-comm-4', labelKey: 'Novinky & Zprávy', url: '/novinky', order: 95, target: '_self', isExternal: false, parentId: 'cat-community', visibility: 'public' },
  { id: 'sub-comm-5', labelKey: 'Podpořte nás / Sponzoři & Partneři', url: '/podporte-nas', order: 96, target: '_self', isExternal: false, parentId: 'cat-community', visibility: 'public' },
  { id: 'sub-comm-6', labelKey: 'Kontakt', url: '/kontakt', order: 97, target: '_self', isExternal: false, parentId: 'cat-community', visibility: 'public' },
  { id: 'sub-comm-7', labelKey: 'Hledáme dobrovolníky', url: '/dobrovolnici', order: 98, target: '_self', isExternal: false, parentId: 'cat-community', visibility: 'public' },
  { id: 'sub-comm-8', labelKey: 'Kodex dobrovolníka', url: '/kodex-dobrovolnika', order: 99, target: '_self', isExternal: false, parentId: 'cat-community', visibility: 'public' },
  { id: 'sub-comm-9', labelKey: 'Uživatelský manuál portálu', url: '/user-manual', order: 100, target: '_self', isExternal: false, parentId: 'cat-community', visibility: 'public' },
  { id: 'sub-comm-10', labelKey: 'Mapa stránek', url: '/sitemap', order: 101, target: '_self', isExternal: false, parentId: 'cat-community', visibility: 'public' },

  // User Section: 💼 Můj případ (User - Authenticated Only)
  { id: 'cat-4', labelKey: '💼 Můj případ & Dokumenty', url: '/muj-pripad', order: 110, target: '_self', isExternal: false, visibility: 'user' },
  { id: 'sub-4-1', labelKey: 'Osobní spis otce', url: '/muj-pripad', order: 111, target: '_self', isExternal: false, parentId: 'cat-4', visibility: 'user' },
  { id: 'sub-4-2', labelKey: 'Dokumenty případu & důkazy', url: '/portal/dokumenty', order: 112, target: '_self', isExternal: false, parentId: 'cat-4', visibility: 'user' },

  // User Section: 👤 Můj účet (User - Authenticated Only)
  { id: 'cat-9', labelKey: '👤 Můj účet', url: '/portal/profil', order: 120, target: '_self', isExternal: false, visibility: 'user' },
  { id: 'sub-9-1', labelKey: 'Můj Profil & Nastavení', url: '/portal/profil', order: 121, target: '_self', isExternal: false, parentId: 'cat-9', visibility: 'user' },
  { id: 'sub-9-2', labelKey: 'Zabezpečení účtu', url: '/portal/zabezpeceni', order: 122, target: '_self', isExternal: false, parentId: 'cat-9', visibility: 'user' },
  { id: 'sub-9-3', labelKey: 'Uživatelská podpora & Tickety', url: '/portal/tikety', order: 123, target: '_self', isExternal: false, parentId: 'cat-9', visibility: 'user' },
  { id: 'sub-9-4', labelKey: 'Odhlásit se', url: '/logout', order: 124, target: '_self', isExternal: false, parentId: 'cat-9', visibility: 'user' },

  // Admin Section: 🛡️ Administrace CMS (Admin Only)
  { id: 'cat-10', labelKey: '🛡️ Administrace CMS', url: '/administrace', order: 130, target: '_self', isExternal: false, visibility: 'admin' },
  { id: 'sub-10-1', labelKey: 'Přehled & CMS', url: '/administrace', order: 131, target: '_self', isExternal: false, parentId: 'cat-10', visibility: 'admin' },
  { id: 'sub-10-2', labelKey: 'Správa uživatelů & RBAC', url: '/admin/users', order: 132, target: '_self', isExternal: false, parentId: 'cat-10', visibility: 'admin' },
  { id: 'sub-10-3', labelKey: 'AI Context & Administrace', url: '/ai-admin', order: 133, target: '_self', isExternal: false, parentId: 'cat-10', visibility: 'admin' },
  { id: 'sub-10-4', labelKey: 'VPS & Server Management', url: '/admin/vps', order: 134, target: '_self', isExternal: false, parentId: 'cat-10', visibility: 'admin', requiredRoles: SUPER_ADMIN_ROLES },
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
