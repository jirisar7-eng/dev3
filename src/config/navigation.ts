import { NavItem } from '../types';

export const NAVIGATION_ITEMS: NavItem[] = [
  { id: 'nav-1', labelKey: 'Domů', url: '/', order: 1, target: '_self', isExternal: false },

  // Category 1: 🚨 Krizová pomoc & Komunita
  { id: 'cat-1', labelKey: '🚨 Krizová pomoc & Komunita', url: '/krizova-pomoc', order: 10, target: '_self', isExternal: false },
  { id: 'sub-1-1', labelKey: 'SOS plán', url: '/sos-plan', order: 11, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-2', labelKey: 'Krizový rozcestník', url: '/krizova-pomoc', order: 12, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-3', labelKey: 'Právní poradna', url: '/pravni-poradna', order: 13, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-4', labelKey: 'Fórum', url: '/forum', order: 14, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-5', labelKey: 'Hledáme dobrovolníky', url: '/o-projektu/dobrovolnici', order: 15, target: '_self', isExternal: false, parentId: 'cat-1' },

  // Category 2: ⚖️ Opatrovnictví & Právo
  { id: 'cat-2', labelKey: '⚖️ Opatrovnictví & Právo', url: '/agenda', order: 20, target: '_self', isExternal: false },
  { id: 'sub-2-1', labelKey: 'Agenda', url: '/agenda', order: 21, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-2', labelKey: 'Práva otců', url: '/prava', order: 22, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-3', labelKey: 'Judikatura', url: '/judikatura', order: 23, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-4', labelKey: 'Vzory dokumentů', url: '/dokumenty', order: 24, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-5', labelKey: 'Články', url: '/clanky', order: 25, target: '_self', isExternal: false, parentId: 'cat-2' },

  // Category 3: 💼 Osobní pracovna & Spolurodičovství
  { id: 'cat-3', labelKey: '💼 Osobní pracovna & Spolurodičovství', url: '/muj-pripad', order: 30, target: '_self', isExternal: false },
  { id: 'sub-3-1', labelKey: 'Osobní spis otce', url: '/muj-pripad', order: 31, target: '_self', isExternal: false, parentId: 'cat-3' },
  { id: 'sub-3-2', labelKey: 'CoParent Hub', url: '/portal/coparent', order: 32, target: '_self', isExternal: false, parentId: 'cat-3' },
  { id: 'sub-3-3', labelKey: 'Můj Profil', url: '/portal/profil', order: 33, target: '_self', isExternal: false, parentId: 'cat-3' },

  // Category 4: 🤖 AI Nástroje
  { id: 'cat-4', labelKey: '🤖 AI Nástroje', url: '/ai-asistent', order: 40, target: '_self', isExternal: false },
  { id: 'sub-4-1', labelKey: 'AI Právní Asistent', url: '/ai-asistent', order: 41, target: '_self', isExternal: false, parentId: 'cat-4' },
  { id: 'sub-4-2', labelKey: 'AI Case Manager', url: '/ai-case-manager', order: 42, target: '_self', isExternal: false, parentId: 'cat-4' },
  { id: 'sub-4-3', labelKey: 'Generátor formulářů', url: '/ai-formulare', order: 43, target: '_self', isExternal: false, parentId: 'cat-4' },
  { id: 'sub-4-4', labelKey: 'Simulátor', url: '/ai-simulator', order: 44, target: '_self', isExternal: false, parentId: 'cat-4' },

  // Category 5: 🎓 Akademie & Vzdělávání
  { id: 'cat-5', labelKey: '🎓 Akademie & Vzdělávání', url: '/studia', order: 50, target: '_self', isExternal: false },
  { id: 'sub-5-1', labelKey: 'Kurzy', url: '/studia', order: 51, target: '_self', isExternal: false, parentId: 'cat-5' },
  { id: 'sub-5-2', labelKey: 'Videotéka', url: '/videoteka', order: 52, target: '_self', isExternal: false, parentId: 'cat-5' },
  { id: 'sub-5-3', labelKey: 'Kvízy', url: '/kvizy', order: 53, target: '_self', isExternal: false, parentId: 'cat-5' },
  { id: 'sub-5-4', labelKey: 'Wiki', url: '/wiki', order: 54, target: '_self', isExternal: false, parentId: 'cat-5' },

  // Category 6: 🏛️ O projektu & Podpora
  { id: 'cat-6', labelKey: '🏛️ O projektu & Podpora', url: '/o-projektu', order: 60, target: '_self', isExternal: false },
  { id: 'sub-6-1', labelKey: 'O nás', url: '/o-projektu', order: 61, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-2', labelKey: 'Podpořte nás & Vznik spolku', url: '/podporte-nas', order: 62, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-3', labelKey: 'Kontakt', url: '/kontakt', order: 63, target: '_self', isExternal: false, parentId: 'cat-6' },

  // Category 7: ⚙️ Systém & Admin
  { id: 'cat-7', labelKey: '⚙️ Systém & Admin', url: '/admin', order: 70, target: '_self', isExternal: false },
  { id: 'sub-7-1', labelKey: 'Administrace', url: '/admin', order: 71, target: '_self', isExternal: false, parentId: 'cat-7' },
  { id: 'sub-7-2', labelKey: 'Správa VPS & Logy', url: '/admin/vps', order: 72, target: '_self', isExternal: false, parentId: 'cat-7' },
];
