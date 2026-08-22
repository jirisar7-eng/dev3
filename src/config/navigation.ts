import { NavItem } from '../types';

export const NAVIGATION_ITEMS: NavItem[] = [
  { id: 'nav-1', labelKey: 'Domů', url: '/', order: 1, target: '_self', isExternal: false },

  // Category 1: 🚨 Pomoc & Komunita
  { id: 'cat-1', labelKey: '🚨 Pomoc & Komunita', url: '/krizova-pomoc', order: 10, target: '_self', isExternal: false },
  { id: 'sub-1-1', labelKey: 'SOS plán', url: '/sos-plan', order: 11, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-2', labelKey: 'Krizový rozcestník', url: '/krizova-pomoc', order: 12, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-3', labelKey: 'Právní poradna', url: '/pravni-poradna', order: 13, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-4', labelKey: 'Fórum', url: '/forum', order: 14, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-5', labelKey: 'Registr subjektů', url: '/registr-subjektu', order: 15, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-6', labelKey: 'Mapa subjektů', url: '/mapa-subjektu', order: 16, target: '_self', isExternal: false, parentId: 'cat-1' },

  // Category 2: ⚖️ Právo & Opatrovnictví
  { id: 'cat-2', labelKey: '⚖️ Právo & Opatrovnictví', url: '/agenda', order: 20, target: '_self', isExternal: false },
  { id: 'sub-2-1', labelKey: 'Agenda', url: '/agenda', order: 21, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-2', labelKey: 'Práva otců', url: '/prava', order: 22, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-3', labelKey: 'Judikatura', url: '/judikatura', order: 23, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-4', labelKey: 'Vzory dokumentů', url: '/dokumenty', order: 24, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-5', labelKey: 'Články', url: '/clanky', order: 25, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-6', labelKey: 'Zákony / e-Legislativa', url: '/state-laws', order: 26, target: '_self', isExternal: false, parentId: 'cat-2' },

  // Category 3: 👨‍👧 Péče & Spolurodičovství
  { id: 'cat-3', labelKey: '👨‍👧 Péče & Spolurodičovství', url: '/pece', order: 30, target: '_self', isExternal: false },
  { id: 'sub-3-1', labelKey: 'Péče o dítě (Care Hub)', url: '/pece', order: 31, target: '_self', isExternal: false, parentId: 'cat-3' },
  { id: 'sub-3-2', labelKey: 'CoParent Hub', url: '/portal/coparent', order: 32, target: '_self', isExternal: false, parentId: 'cat-3' },

  // Category 4: 💼 Můj případ & Dokumenty
  { id: 'cat-4', labelKey: '💼 Můj případ & Dokumenty', url: '/muj-pripad', order: 40, target: '_self', isExternal: false },
  { id: 'sub-4-1', labelKey: 'Osobní spis otce', url: '/muj-pripad', order: 41, target: '_self', isExternal: false, parentId: 'cat-4' },
  { id: 'sub-4-2', labelKey: 'Dokumenty případu', url: '/portal/dokumenty', order: 42, target: '_self', isExternal: false, parentId: 'cat-4' },
  { id: 'sub-4-3', labelKey: 'AI Case Manager', url: '/ai-case-manager', order: 43, target: '_self', isExternal: false, parentId: 'cat-4' },

  // Category 5: 🤖 AI Nástroje
  { id: 'cat-5', labelKey: '🤖 AI Nástroje', url: '/ai-asistent', order: 50, target: '_self', isExternal: false },
  { id: 'sub-5-1', labelKey: 'AI Právní Asistent', url: '/ai-asistent', order: 51, target: '_self', isExternal: false, parentId: 'cat-5' },
  { id: 'sub-5-2', labelKey: 'Generátor formulářů', url: '/ai-formulare', order: 52, target: '_self', isExternal: false, parentId: 'cat-5' },
  { id: 'sub-5-3', labelKey: 'Simulátor', url: '/ai-simulator', order: 53, target: '_self', isExternal: false, parentId: 'cat-5' },

  // Category 6: 🎓 Akademie & Vzdělávání
  { id: 'cat-6', labelKey: '🎓 Akademie & Vzdělávání', url: '/studia', order: 60, target: '_self', isExternal: false },
  { id: 'sub-6-1', labelKey: 'Kurzy', url: '/studia', order: 61, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-2', labelKey: 'Videotéka', url: '/videoteka', order: 62, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-3', labelKey: 'Kvízy', url: '/kvizy', order: 63, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-4', labelKey: 'Encyklopedie & Wiki', url: '/wiki', order: 64, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-5', labelKey: 'Katalog studií', url: '/studie', order: 65, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-6', labelKey: 'Statistiky', url: '/state-statistics', order: 66, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-7', labelKey: 'Uživatelský manuál', url: '/user-manual', order: 67, target: '_self', isExternal: false, parentId: 'cat-6' },

  // Category 7: 📰 Aktuality & Příběhy
  { id: 'cat-7', labelKey: '📰 Aktuality & Příběhy', url: '/novinky', order: 70, target: '_self', isExternal: false },
  { id: 'sub-7-1', labelKey: 'Novinky & Zprávy', url: '/novinky', order: 71, target: '_self', isExternal: false, parentId: 'cat-7' },
  { id: 'sub-7-2', labelKey: 'Příběhy otců', url: '/pribehy', order: 72, target: '_self', isExternal: false, parentId: 'cat-7' },

  // Category 8: 🏛️ O projektu & Podpora
  { id: 'cat-8', labelKey: '🏛️ O projektu & Podpora', url: '/o-projektu', order: 80, target: '_self', isExternal: false },
  { id: 'sub-8-1', labelKey: 'O nás', url: '/o-projektu', order: 81, target: '_self', isExternal: false, parentId: 'cat-8' },
  { id: 'sub-8-1b', labelKey: 'Moje cesta zakladatele', url: '/moje-cesta-zakladatele', order: 82, target: '_self', isExternal: false, parentId: 'cat-8' },
  { id: 'sub-8-2', labelKey: 'Podpořte nás', url: '/podporte-nas', order: 83, target: '_self', isExternal: false, parentId: 'cat-8' },
  { id: 'sub-8-3', labelKey: 'Kontakt', url: '/kontakt', order: 84, target: '_self', isExternal: false, parentId: 'cat-8' },
  { id: 'sub-8-4', labelKey: 'Hledáme dobrovolníky', url: '/dobrovolnici', order: 85, target: '_self', isExternal: false, parentId: 'cat-8' },
  { id: 'sub-8-5', labelKey: 'Kodex dobrovolníka', url: '/kodex-dobrovolnika', order: 86, target: '_self', isExternal: false, parentId: 'cat-8' },
  { id: 'sub-8-6', labelKey: 'Sponzoři & Partneři', url: '/partneri', order: 87, target: '_self', isExternal: false, parentId: 'cat-8' },

  // Category 9: 👤 Můj účet
  { id: 'cat-9', labelKey: '👤 Můj účet', url: '/portal/profil', order: 90, target: '_self', isExternal: false },
  { id: 'sub-9-1', labelKey: 'Můj Profil & Nastavení', url: '/portal/profil', order: 91, target: '_self', isExternal: false, parentId: 'cat-9' },
  { id: 'sub-9-2', labelKey: 'Uživatelská podpora', url: '/portal/tikety', order: 92, target: '_self', isExternal: false, parentId: 'cat-9' },

  // Category 10: ⚙️ Systém & Admin
  { id: 'cat-10', labelKey: '⚙️ Systém & Admin', url: '/admin', order: 100, target: '_self', isExternal: false },
  { id: 'sub-10-1', labelKey: 'Administrace', url: '/admin', order: 101, target: '_self', isExternal: false, parentId: 'cat-10' },
  { id: 'sub-10-2', labelKey: 'Správa VPS & Logy', url: '/admin/vps', order: 102, target: '_self', isExternal: false, parentId: 'cat-10' },
];
