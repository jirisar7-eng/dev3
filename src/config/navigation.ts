import { NavItem } from '../types';

export const NAVIGATION_ITEMS: NavItem[] = [
  // Category 0: 🏠 Domů & Veřejnost
  { id: 'cat-home', labelKey: '🏠 Domů & Veřejnost', url: '/', order: 0, target: '_self', isExternal: false },
  { id: 'sub-home-1', labelKey: 'Domů', url: '/', order: 1, target: '_self', isExternal: false, parentId: 'cat-home' },
  { id: 'sub-home-2', labelKey: 'O projektu & Vize', url: '/o-projektu', order: 2, target: '_self', isExternal: false, parentId: 'cat-home' },
  { id: 'sub-home-3', labelKey: 'Veřejný portál', url: '/verejny-portal', order: 3, target: '_self', isExternal: false, parentId: 'cat-home' },
  { id: 'sub-home-4', labelKey: 'Přihlásit / Registrace', url: '/login', order: 4, target: '_self', isExternal: false, parentId: 'cat-home' },

  // Category 1: 🚨 Pomoc & Komunita
  { id: 'cat-1', labelKey: '🚨 Pomoc & Komunita', url: '/krizova-pomoc', order: 10, target: '_self', isExternal: false },
  { id: 'sub-1-1', labelKey: 'SOS krizový plán', url: '/sos-plan', order: 11, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-2', labelKey: 'Krizový rozcestník', url: '/krizova-pomoc', order: 12, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-3', labelKey: 'Právní poradna', url: '/pravni-poradna', order: 13, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-4', labelKey: 'Fórum / Komunitní podpora', url: '/forum', order: 14, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-5', labelKey: 'Memento otců', url: '/memento', order: 15, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-6', labelKey: 'Registr subjektů', url: '/registr-subjektu', order: 16, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-7', labelKey: 'Mapa subjektů', url: '/mapa-subjektu', order: 17, target: '_self', isExternal: false, parentId: 'cat-1' },

  // Category 2: ⚖️ Právo & Opatrovnictví
  { id: 'cat-2', labelKey: '⚖️ Právo & Opatrovnictví', url: '/agenda', order: 20, target: '_self', isExternal: false },
  { id: 'sub-2-1', labelKey: 'Agenda opatrovnického řízení', url: '/agenda', order: 21, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-2', labelKey: 'Práva otců & rodičovská odpovědnost', url: '/prava', order: 22, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-3', labelKey: 'Judikatura', url: '/judikatura', order: 23, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-4', labelKey: 'Vzory dokumentů & podání', url: '/dokumenty', order: 24, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-5', labelKey: 'Odborné články & analýzy', url: '/clanky', order: 25, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-6', labelKey: 'Zákony / e-Sbírka', url: '/state-laws', order: 26, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-7', labelKey: 'Průvodce OSPOD', url: '/ospod', order: 27, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-8', labelKey: 'Průvodce soudním řízením', url: '/soud', order: 28, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-9', labelKey: 'Finanční a majetkové vypořádání', url: '/majetek', order: 29, target: '_self', isExternal: false, parentId: 'cat-2' },

  // Category 3: 👨‍👧 Péče & Spolurodičovství
  { id: 'cat-3', labelKey: '👨‍👧 Péče & Spolurodičovství', url: '/pece', order: 30, target: '_self', isExternal: false },
  { id: 'sub-3-1', labelKey: 'Péče o dítě / Care Hub', url: '/pece', order: 31, target: '_self', isExternal: false, parentId: 'cat-3' },
  { id: 'sub-3-2', labelKey: 'CoParent Hub', url: '/portal/coparent', order: 32, target: '_self', isExternal: false, parentId: 'cat-3' },
  { id: 'sub-3-3', labelKey: 'Kalkulačka výživného a nákladů', url: '/kalkulacka-vyzivneho', order: 33, target: '_self', isExternal: false, parentId: 'cat-3' },
  { id: 'sub-3-4', labelKey: 'Psychologická podpora dětí', url: '/psychologie', order: 34, target: '_self', isExternal: false, parentId: 'cat-3' },

  // Category 4: 💼 Můj případ & Dokumenty
  { id: 'cat-4', labelKey: '💼 Můj případ & Dokumenty', url: '/muj-pripad', order: 40, target: '_self', isExternal: false },
  { id: 'sub-4-1', labelKey: 'Osobní spis otce', url: '/muj-pripad', order: 41, target: '_self', isExternal: false, parentId: 'cat-4' },
  { id: 'sub-4-2', labelKey: 'Dokumenty případu & důkazy', url: '/portal/dokumenty', order: 42, target: '_self', isExternal: false, parentId: 'cat-4' },
  { id: 'sub-4-3', labelKey: 'AI Case Manager', url: '/ai-case-manager', order: 43, target: '_self', isExternal: false, parentId: 'cat-4' },
  { id: 'sub-4-4', labelKey: 'Kalendář a důležité lhůty', url: '/kalendar', order: 44, target: '_self', isExternal: false, parentId: 'cat-4' },

  // Category 5: 🤖 AI Nástroje
  { id: 'cat-5', labelKey: '🤖 AI Nástroje', url: '/ai-asistent', order: 50, target: '_self', isExternal: false },
  { id: 'sub-5-1', labelKey: 'AI Právní Asistent', url: '/ai-asistent', order: 51, target: '_self', isExternal: false, parentId: 'cat-5' },
  { id: 'sub-5-2', labelKey: 'AI Průvodce řízením', url: '/ai-pruvodce', order: 52, target: '_self', isExternal: false, parentId: 'cat-5' },
  { id: 'sub-5-3', labelKey: 'Generátor formulářů & podání', url: '/ai-formulare', order: 53, target: '_self', isExternal: false, parentId: 'cat-5' },
  { id: 'sub-5-4', labelKey: 'Simulátor modelů péče', url: '/ai-simulator', order: 54, target: '_self', isExternal: false, parentId: 'cat-5' },

  // Category 6: 🎓 Akademie & Vzdělávání
  { id: 'cat-6', labelKey: '🎓 Akademie & Vzdělávání', url: '/studia', order: 60, target: '_self', isExternal: false },
  { id: 'sub-6-1', labelKey: 'Kurzy pro rodiče', url: '/studia', order: 61, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-2', labelKey: 'Videotéka & Webináře', url: '/videoteka', order: 62, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-3', labelKey: 'Kvízy', url: '/kvizy', order: 63, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-4', labelKey: 'Encyklopedie & Wiki pojmů', url: '/wiki', order: 64, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-5', labelKey: 'Katalog odborných studií a výzkumů', url: '/studie', order: 65, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-6', labelKey: 'Statistiky a data', url: '/state-statistics', order: 66, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-7', labelKey: 'Uživatelský manuál portálu', url: '/user-manual', order: 67, target: '_self', isExternal: false, parentId: 'cat-6' },

  // Category 7: 📰 Aktuality & Příběhy
  { id: 'cat-7', labelKey: '📰 Aktuality & Příběhy', url: '/novinky', order: 70, target: '_self', isExternal: false },
  { id: 'sub-7-1', labelKey: 'Novinky & Zprávy', url: '/novinky', order: 71, target: '_self', isExternal: false, parentId: 'cat-7' },
  { id: 'sub-7-2', labelKey: 'Příběhy otců', url: '/pribehy', order: 72, target: '_self', isExternal: false, parentId: 'cat-7' },

  // Category 8: 🏛️ O projektu & Podpora
  { id: 'cat-8', labelKey: '🏛️ O projektu & Podpora', url: '/o-projektu', order: 80, target: '_self', isExternal: false },
  { id: 'sub-8-1', labelKey: 'O nás & Tvůrci', url: '/o-projektu', order: 81, target: '_self', isExternal: false, parentId: 'cat-8' },
  { id: 'sub-8-2', labelKey: 'Moje cesta zakladatele', url: '/moje-cesta-zakladatele', order: 82, target: '_self', isExternal: false, parentId: 'cat-8' },
  { id: 'sub-8-3', labelKey: 'Podpořte nás / Sponzoři & Partneři', url: '/podporte-nas', order: 83, target: '_self', isExternal: false, parentId: 'cat-8' },
  { id: 'sub-8-4', labelKey: 'Kontakt', url: '/kontakt', order: 84, target: '_self', isExternal: false, parentId: 'cat-8' },
  { id: 'sub-8-5', labelKey: 'Hledáme dobrovolníky', url: '/dobrovolnici', order: 85, target: '_self', isExternal: false, parentId: 'cat-8' },
  { id: 'sub-8-6', labelKey: 'Kodex dobrovolníka', url: '/kodex-dobrovolnika', order: 86, target: '_self', isExternal: false, parentId: 'cat-8' },
  { id: 'sub-8-7', labelKey: 'Mapa stránek', url: '/sitemap', order: 87, target: '_self', isExternal: false, parentId: 'cat-8' },

  // Category 9: 👤 Můj účet
  { id: 'cat-9', labelKey: '👤 Můj účet', url: '/portal/profil', order: 90, target: '_self', isExternal: false },
  { id: 'sub-9-1', labelKey: 'Můj Profil & Nastavení', url: '/portal/profil', order: 91, target: '_self', isExternal: false, parentId: 'cat-9' },
  { id: 'sub-9-2', labelKey: 'Zabezpečení', url: '/portal/zabezpeceni', order: 92, target: '_self', isExternal: false, parentId: 'cat-9' },
  { id: 'sub-9-3', labelKey: 'Administrace', url: '/admin', order: 93, target: '_self', isExternal: false, parentId: 'cat-9' },
  { id: 'sub-9-4', labelKey: 'Uživatelská podpora & Tickety', url: '/portal/tikety', order: 94, target: '_self', isExternal: false, parentId: 'cat-9' },
  { id: 'sub-9-5', labelKey: 'Odhlásit se', url: '/logout', order: 95, target: '_self', isExternal: false, parentId: 'cat-9' },
];
