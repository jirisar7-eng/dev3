import {
  User,
  TextItem,
  ThemeSetting,
  Module,
  Page,
  PageSection,
  Category,
  Article,
  Faq,
  NavItem,
  MediaItem,
  ComplianceDoc,
  UserConsent,
  AuditLog,
  Setting,
  UserRole,
  UserCase,
  UserChild,
  UserCalendarEvent,
  UserNote,
  UserDocument,
  Study,
  StateStatistic,
  CourtCase,
  Partner,
  PartnerType,
  ForumThread,
  ForumPost,
} from '../types';

// Initial Seed Data for "Táta má právo"
const defaultTextItems: TextItem[] = [
  {
    id: 'txt-1',
    key: 'home.hero.title',
    category: 'home',
    valueCzech: 'Táta má právo. Dítě má právo na oba rodiče.',
    valueEnglish: 'Dad Has a Right. Child Has a Right to Both Parents.',
    description: 'Hlavní nadpis na úvodní stránce',
    active: true,
    updatedBy: 'system@tatovacesta.cz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'txt-2',
    key: 'home.hero.subtitle',
    category: 'home',
    valueCzech: 'Komplexní opora pro otce v opatrovnických situacích. Právní orientace, psychologická podpora a spravedlivá péče zohledňující NEJLEPŠÍ ZÁJEM DÍTĚTE.',
    valueEnglish: 'Comprehensive support for fathers in custody situations.',
    description: 'Podnadpis v hlavním banneru',
    active: true,
    updatedBy: 'system@tatovacesta.cz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'txt-3',
    key: 'home.hero.cta',
    category: 'home',
    valueCzech: 'Prozkoumat poradnu',
    valueEnglish: 'Explore Advice',
    description: 'Tlačítko v hlavním banneru',
    active: true,
    updatedBy: 'system@tatovacesta.cz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'txt-4',
    key: 'nav.home',
    category: 'nav',
    valueCzech: 'Domů',
    valueEnglish: 'Home',
    description: 'Položka menu Domů',
    active: true,
    updatedBy: 'system@tatovacesta.cz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'txt-5',
    key: 'nav.about',
    category: 'nav',
    valueCzech: 'O projektu',
    valueEnglish: 'About',
    description: 'Položka menu O projektu',
    active: true,
    updatedBy: 'system@tatovacesta.cz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'txt-6',
    key: 'nav.legal',
    category: 'nav',
    valueCzech: 'Právní poradna',
    valueEnglish: 'Legal Advice',
    description: 'Položka menu Právní poradna',
    active: true,
    updatedBy: 'system@tatovacesta.cz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'txt-7',
    key: 'nav.modules',
    category: 'nav',
    valueCzech: 'Moduly & Nástroje',
    valueEnglish: 'Modules & Tools',
    description: 'Položka menu Moduly',
    active: true,
    updatedBy: 'system@tatovacesta.cz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'txt-8',
    key: 'nav.compliance',
    category: 'nav',
    valueCzech: 'Dokumenty & Práva',
    valueEnglish: 'Documents & Compliance',
    description: 'Položka menu Compliance',
    active: true,
    updatedBy: 'system@tatovacesta.cz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'txt-nav-sit',
    key: 'nav.situations',
    category: 'nav',
    valueCzech: 'Životní situace',
    valueEnglish: 'Life Situations',
    description: 'Položka menu Životní situace',
    active: true,
    updatedBy: 'system@tatovacesta.cz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'txt-nav-art',
    key: 'nav.articles',
    category: 'nav',
    valueCzech: 'Články & Judikatura',
    valueEnglish: 'Articles & Case Law',
    description: 'Položka menu Články',
    active: true,
    updatedBy: 'system@tatovacesta.cz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'txt-nav-faq',
    key: 'nav.faq',
    category: 'nav',
    valueCzech: 'Časté dotazy',
    valueEnglish: 'FAQ',
    description: 'Položka menu FAQ',
    active: true,
    updatedBy: 'system@tatovacesta.cz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'txt-nav-vol',
    key: 'nav.volunteering',
    category: 'nav',
    valueCzech: 'Dobrovolnictví',
    valueEnglish: 'Volunteering',
    description: 'Položka menu Dobrovolnictví',
    active: true,
    updatedBy: 'system@tatovacesta.cz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'txt-nav-cnt',
    key: 'nav.contact',
    category: 'nav',
    valueCzech: 'Kontakt',
    valueEnglish: 'Contact',
    description: 'Položka menu Kontakt',
    active: true,
    updatedBy: 'system@tatovacesta.cz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'txt-9',
    key: 'login.title',
    category: 'login',
    valueCzech: 'Přihlášení do portálu',
    valueEnglish: 'Portal Login',
    description: 'Nadpis přihlašovacího formuláře',
    active: true,
    updatedBy: 'system@tatovacesta.cz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'txt-10',
    key: 'login.email',
    category: 'login',
    valueCzech: 'E-mailová adresa',
    valueEnglish: 'Email Address',
    description: 'Štítek pro emailové pole',
    active: true,
    updatedBy: 'system@tatovacesta.cz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'txt-11',
    key: 'footer.copyright',
    category: 'footer',
    valueCzech: '© 2026 Táta má právo • Všechna práva vyhrazena',
    valueEnglish: '© 2026 Dad Has a Right • All rights reserved',
    description: 'Patička copyright',
    active: true,
    updatedBy: 'system@tatovacesta.cz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'txt-12',
    key: 'core.principle.title',
    category: 'core',
    valueCzech: 'NEJLEPŠÍ ZÁJEM DÍTĚTE',
    valueEnglish: 'BEST INTERESTS OF THE CHILD',
    description: 'Hlavní princip portálu',
    active: true,
    updatedBy: 'system@tatovacesta.cz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'txt-13',
    key: 'core.principle.desc',
    category: 'core',
    valueCzech: 'Všechna doporučení, nástroje a metodiky stavíme na nezpochybnitelném právu dítěte mít zdravý a rovnocenný vztah s oběma rodiči.',
    valueEnglish: 'All recommendations and tools are built on the child\'s right to a relationship with both parents.',
    description: 'Popis hlavního principu',
    active: true,
    updatedBy: 'system@tatovacesta.cz',
    updatedAt: new Date().toISOString(),
  },
];

const defaultThemeSettings: ThemeSetting[] = [
  { id: 'thm-1', key: 'primary', value: '#1e3a8a', label: 'Hlavní (Primary)', category: 'color', updatedAt: new Date().toISOString() },
  { id: 'thm-2', key: 'secondary', value: '#0284c7', label: 'Sekundární (Secondary)', category: 'color', updatedAt: new Date().toISOString() },
  { id: 'thm-3', key: 'background', value: '#f8fafc', label: 'Pozadí (Background)', category: 'color', updatedAt: new Date().toISOString() },
  { id: 'thm-4', key: 'surface', value: '#ffffff', label: 'Povrch karet (Surface)', category: 'color', updatedAt: new Date().toISOString() },
  { id: 'thm-5', key: 'text', value: '#1e293b', label: 'Text těla (Text)', category: 'color', updatedAt: new Date().toISOString() },
  { id: 'thm-6', key: 'textMuted', value: '#64748b', label: 'Tlumený text (Text Muted)', category: 'color', updatedAt: new Date().toISOString() },
  { id: 'thm-7', key: 'heading', value: '#0f172a', label: 'Text nadpisů (Heading)', category: 'color', updatedAt: new Date().toISOString() },
  { id: 'thm-8', key: 'link', value: '#2563eb', label: 'Odkazy (Link)', category: 'color', updatedAt: new Date().toISOString() },
  { id: 'thm-9', key: 'border', value: '#e2e8f0', label: 'Rámečky (Border)', category: 'color', updatedAt: new Date().toISOString() },
  { id: 'thm-10', key: 'button', value: '#1e3a8a', label: 'Tlačítko (Button)', category: 'color', updatedAt: new Date().toISOString() },
  { id: 'thm-11', key: 'buttonHover', value: '#0f172a', label: 'Tlačítko Hover (Button Hover)', category: 'color', updatedAt: new Date().toISOString() },
  { id: 'thm-12', key: 'success', value: '#16a34a', label: 'Úspěch (Success)', category: 'color', updatedAt: new Date().toISOString() },
  { id: 'thm-13', key: 'warning', value: '#d97706', label: 'Varování (Warning)', category: 'color', updatedAt: new Date().toISOString() },
  { id: 'thm-14', key: 'error', value: '#dc2626', label: 'Chyba (Error)', category: 'color', updatedAt: new Date().toISOString() },
];

const defaultModules: Module[] = [
  {
    id: 'mod-0',
    key: 'system-test-module',
    name: 'System Test Module (Technický Test)',
    version: '1.0.0',
    enabled: true,
    public: false,
    config: JSON.stringify({ maxRequestsPerMin: 100, debugMode: true, apiEndpointUrl: 'https://test.api' }),
    description: 'Demonstrační technický modul pro verifikaci funkčnosti Module Engine, RBAC a konfigurací.',
    icon: 'TestTube',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mod-1',
    key: 'child_support_calc',
    name: 'Kalkulačka výživného',
    version: '1.0.0',
    enabled: true,
    public: true,
    config: JSON.stringify({ minSalary: 20000, maxChildren: 5, useDoporučenéTabulkyMSP: true }),
    description: 'Orientační výpočet výživného dle doporučujících tabulek Ministerstva spravedlnosti ČR.',
    icon: 'Calculator',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mod-2',
    key: 'handover_simulator',
    name: 'Simulátor předávání dítěte',
    version: '1.0.0',
    enabled: true,
    public: true,
    config: JSON.stringify({ enableProtocolGenerator: true, requireGPSVerification: false }),
    description: 'Nástroj pro evidenci a bezpečné předávání dítěte včetně předávacích protokolů.',
    icon: 'RefreshCw',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mod-3',
    key: 'care_calendar',
    name: 'Kalendář péče',
    version: '1.0.0',
    enabled: true,
    public: true,
    config: JSON.stringify({ defaultRotationWeeks: 2, syncWithGoogleCalendar: true }),
    description: 'Plánovač střídavé péče, prázdnin a svátků pro bezkonfliktní organizaci času.',
    icon: 'Calendar',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mod-4',
    key: 'document_templates',
    name: 'Právní dokumenty a vzory',
    version: '1.0.0',
    enabled: true,
    public: true,
    config: JSON.stringify({ allowPDFDownload: true, enableCustomFields: true }),
    description: 'Generátor návrhů na úpravu poměrů k nezletilému dítěti, dohod a odvolání.',
    icon: 'FileText',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mod-5',
    key: 'volunteering',
    name: 'Dobrovolnictví a mentoring',
    version: '1.0.0',
    enabled: true,
    public: true,
    config: JSON.stringify({ requireApproval: true, allowPeerChat: true }),
    description: 'Spojení zkušených otců (mentorů) s táty v krizových opatrovnických situacích.',
    icon: 'Users',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mod-6',
    key: 'ai_assistant',
    name: 'AI Právní & Psychologický Asistent',
    version: '0.9.0',
    enabled: false,
    public: false,
    config: JSON.stringify({ model: 'gemini-2.5-flash', disclaimerNoticeRequired: true }),
    description: 'Inteligentní asistent navržený pro rychlou analýzu podání a přípravu na jednání OSPOD.',
    icon: 'Bot',
    updatedAt: new Date().toISOString(),
  },
];

const defaultUsers: User[] = [
  {
    id: 'usr-sarji-admin',
    email: 'sarji@seznam.cz',
    name: 'Sarji (Super Admin)',
    role: 'SUPER_ADMIN',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarji',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-superadmin',
    email: 'superadmin@tatovacesta.cz',
    name: 'Hlavní Správce (Super Admin)',
    role: 'SUPER_ADMIN',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-admin',
    email: 'admin@tatovacesta.cz',
    name: 'Pavel Novák (Admin)',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-volunteer',
    email: 'dobrovolnik@tatovacesta.cz',
    name: 'Martin Dvořák (Dobrovolník)',
    role: 'VOLUNTEER',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-user',
    email: 'tata@tatovacesta.cz',
    name: 'Jan Svoboda (Otec)',
    role: 'USER',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultCategories: Category[] = [
  { id: 'cat-1', slug: 'judikatura', name: 'Judikatura', description: 'Nálezy Ústavního soudu a judikáty', type: 'article' },
  { id: 'cat-2', slug: 'prakticke-rady', name: 'Praktické rady', description: 'Metodiky pro komunikaci s OSPOD a soudy', type: 'article' },
  { id: 'cat-3', slug: 'psychologie', name: 'Psychologie', description: 'Dopady na dítě a prevence konfliktů', type: 'article' },
  { id: 'cat-4', slug: 'pravni-dotazy', name: 'Právní dotazy', description: 'Časté dotazy k opatrovnictví', type: 'faq' },
  { id: 'cat-5', slug: 'vyzivne', name: 'Finance & Výživné', description: 'Stanovení a úprava výživného', type: 'faq' },
  { id: 'cat-6', slug: 'vedecke-myty-vs-fakta', name: 'Vědecké mýty vs. fakta', description: 'Vědecké studie, mezinárodní konsenzus a fakta vyvracející mýty v opatrovnických sporech.', type: 'article' },
  { id: 'cat-7', slug: 'ceska-praxe-a-judikatura', name: 'Česká praxe a judikatura', description: 'Analýza rozhodování českých soudů, přístupu OSPOD a sociologických dat z ČR.', type: 'article' },
  { id: 'cat-8', slug: 'dlouhodoby-dopad-na-vyvoj-ditete', name: 'Dlouhodobý dopad na vývoj dítěte', description: 'Dlouhodobé výzkumy dopadu sdílené noční péče na zdravý vývoj dospívajících.', type: 'article' },
  { id: 'cat-9', slug: 'specialni-formaty', name: 'Speciální formáty', description: 'Argumentační manuály, praktičtí průvodci a infografiky pro soudní řízení.', type: 'article' },
];

const defaultPageSections: PageSection[] = [
  {
    id: 'sec-1',
    pageId: 'pg-1',
    sectionKey: 'hero',
    title: 'Táta má právo. Dítě má právo na oba rodiče.',
    content: 'Osvětový a podpůrný portál pro otce v opatrovnickém řízení.',
    order: 1,
    config: JSON.stringify({ buttonText: 'Zjistit více', buttonUrl: '/o-projektu', badge: 'Klíčové poslání' }),
  },
  {
    id: 'sec-2',
    pageId: 'pg-1',
    sectionKey: 'cards',
    title: 'Naše hlavní pilíře',
    content: 'Tři pilíře spravedlivé péče pro každé dítě.',
    order: 2,
    config: JSON.stringify({
      cards: [
        { title: 'Právní osvěta', desc: 'Srozumitelná orientace v zákoně o rodině a opatrovnické praxi.' },
        { title: 'Rovnocenná péče', desc: 'Obhajoba střídavé péče a práva dítěte na oba rodiče.' },
        { title: 'Mentoring & Komunita', desc: 'Zkušenosti otců, kteří si prošli stejným krizovým obdobím.' },
      ],
    }),
  },
  {
    id: 'sec-3',
    pageId: 'pg-1',
    sectionKey: 'cta',
    title: 'Potřebujete okamžitou pomoc?',
    content: 'Využijte naši síť dobrovolníků, právní poradenství nebo komunitní mentoring.',
    order: 3,
    config: JSON.stringify({ primaryBtnText: 'Prohlédnout životní situace', primaryBtnUrl: '/zivotni-situace', secondaryBtnText: 'Kontaktovat poradnu', secondaryBtnUrl: '/kontakt' }),
  },
  {
    id: 'sec-4',
    pageId: 'pg-2',
    sectionKey: 'hero',
    title: 'O projektu Táta má právo',
    content: 'Vznikli jsme jako reakce na systémové nerovnosti v opatrovnickém soudnictví.',
    order: 1,
    config: JSON.stringify({ badge: 'O nás & Poslání' }),
  },
  {
    id: 'sec-5',
    pageId: 'pg-2',
    sectionKey: 'text',
    title: 'Naše hodnoty a vize',
    content: 'Obhajujeme nezpochybnitelné právo dítěte mít zdravý a rovnocenný vztah s oběma rodiči. Nabízíme právní orientaci, sdílení zkušeností a prevenci syndromu zavrženého rodiče.',
    order: 2,
    config: JSON.stringify({ highlight: true }),
  },
  {
    id: 'sec-6',
    pageId: 'pg-3',
    sectionKey: 'hero',
    title: 'Životní situace otců',
    content: 'Praktičtí průvodci pro klíčové okamžiky opatrovnického řízení.',
    order: 1,
    config: JSON.stringify({ badge: 'Průvodce kroky' }),
  },
  {
    id: 'sec-7',
    pageId: 'pg-3',
    sectionKey: 'cards',
    title: 'Klíčové životní momenty',
    content: 'Vyberte situaci, kterou aktuálně řešíte:',
    order: 2,
    config: JSON.stringify({
      cards: [
        { title: 'Rozpad vztahu a první kroky', desc: 'Jak postupovat v prvních dnech, abyste neztratili kontakt s dítětem.' },
        { title: 'Jednání s OSPOD', desc: 'Jak efektivně komunikovat s Orgánem sociálně-právní ochrany dětí.' },
        { title: 'Návrh na střídavou péči', desc: 'Příprava podkladů, důkazů a argumentace pro opatrovnický soud.' },
        { title: 'Odpírání styku a maření péče', desc: 'Právní kroky při bránění ve styku s dítětem a výkon rozhodnutí.' },
      ],
    }),
  },
  {
    id: 'sec-8',
    pageId: 'pg-6',
    sectionKey: 'hero',
    title: 'Kontakt a bezplatná poradna',
    content: 'Sme tu pro táty v krizových opatrovnických situacích.',
    order: 1,
    config: JSON.stringify({ badge: 'Budme v kontaktu' }),
  },
  {
    id: 'sec-9',
    pageId: 'pg-6',
    sectionKey: 'text',
    title: 'Kontaktní údaje a adresa',
    content: 'E-mail: info@tatovacesta.cz\nInfolinka: +420 800 123 456 (Po-Pá 9:00 - 17:00)\nProvozuje z.s. Táta má právo, Praha\n\nNapište nám svůj příběh a naši dobrovolníci a právní poradci vás budou kontaktovat.',
    order: 2,
    config: JSON.stringify({ highlight: false }),
  },
];

const defaultPages: Page[] = [
  {
    id: 'pg-1',
    slug: 'domu',
    title: 'Táta má právo • Hlavní strana',
    content: 'Komplexní opora pro otce v opatrovnických situacích. Právní orientace, psychologická podpora a spravedlivá péče zohledňující NEJLEPŠÍ ZÁJEM DÍTĚTE.',
    published: true,
    seoTitle: 'Táta má právo | Opatrovnictví & Dítě v rozvodu',
    seoDescription: 'Komplexní podpora otců v opatrovnickém řízení se zaměřením na nejlepší zájem dítěte.',
    sections: defaultPageSections.filter((s) => s.pageId === 'pg-1'),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-2',
    slug: 'o-projektu',
    title: 'O projektu Táta má právo',
    content: 'Projekt **Táta má právo** vznikl jako reakce na dlouhodobé nerovnosti v opatrovnickém soudnictví. Naším primárním cílem je obhajoba nezpochybnitelného práva každého dítěte na plnohodnotnou výchovu oběma rodiči.',
    published: true,
    seoTitle: 'O nás a našem poslání | Táta má právo',
    seoDescription: 'Informace o projektu Táta má právo, našem poslání, hodnotách a týmu.',
    sections: defaultPageSections.filter((s) => s.pageId === 'pg-2'),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-3',
    slug: 'zivotni-situace',
    title: 'Životní situace a právní průvodce',
    content: 'Opatrovnické řízení vyžaduje chladnou hlavu, znalost zákona o rodině (občanského zákoníku) a aktivní součinnost s OSPOD. Zde naleznete základní metodiku krok za krokem.',
    published: true,
    seoTitle: 'Životní situace otců v opatrovnickém řízení | Táta má právo',
    seoDescription: 'Průvodce opatrovnickým řízením, součinnost s OSPOD a soudní praxe v ČR.',
    sections: defaultPageSections.filter((s) => s.pageId === 'pg-3'),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-4',
    slug: 'clanky',
    title: 'Články, judikatura a metodiky',
    content: 'Odborné články, rozbory soudních rozhodnutí a praktická doporučení pro otce v opatrovnické praxi.',
    published: true,
    seoTitle: 'Články a judikatura k opatrovnictví | Táta má právo',
    seoDescription: 'Aktuální judikáty Ústavního soudu, návody k OSPOD a odborná doporučení.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-5',
    slug: 'faq',
    title: 'Časté dotazy (FAQ)',
    content: 'Odpovědi na nejčastější otázky otců ohledně střídavé péče, výživného, OSPOD a soudu.',
    published: true,
    seoTitle: 'Časté otázky a odpovědi | Táta má právo',
    seoDescription: 'Časté dotazy týkající se opatrovnického řízení, OSPOD a práv dětí.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-6',
    slug: 'kontakt',
    title: 'Kontakt a bezplatná poradna',
    content: 'Máte dotaz nebo potřebujete poradit? Napište nám přes náš kontaktní formulář nebo na info@tatovacesta.cz.',
    published: true,
    seoTitle: 'Kontaktujte nás | Táta má právo',
    seoDescription: 'Kontaktní údaje a bezplatná poradna pro otce v krizové situaci.',
    sections: defaultPageSections.filter((s) => s.pageId === 'pg-6'),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-7',
    slug: 'podminky-uzivani',
    title: 'Podmínky užívání portálu',
    content: 'Všechny informace poskytované v rámci portálu Táta má právo mají informativní a osvětový charakter. Nenahrazují individuální právní nebo psychologickou péči poskytovanou advokáty či licencovanými terapeuty.',
    published: true,
    seoTitle: 'Podmínky užívání portálu | Táta má právo',
    seoDescription: 'Právní informace o používání webového portálu Táta má právo.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-8',
    slug: 'gdpr',
    title: 'Ochrana osobních údajů (GDPR)',
    content: 'Portál Táta má právo zpracovává osobní údaje výhradně pro účely správy účtu, posílení bezpečnosti a umožnění využívání modulů. Vaše údaje nejsou předávány třetím stranám bez vašeho výslovného souhlasu.',
    published: true,
    seoTitle: 'Ochrana osobních údajů (GDPR) | Táta má právo',
    seoDescription: 'Informace o zpracování a ochraně osobních údajů uživatelů.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-9',
    slug: 'dobrovolnictvi',
    title: 'Dobrovolnictví a mentorská síť',
    content: 'Propojujeme zkušené otce, kteří úspěšně prošli opatrovnickým řízením, s táty, kteří jsou na začátku a potřebují lidskou oporu a sdílení zkušeností.',
    published: true,
    seoTitle: 'Zapojte se do dobrovolnictví a mentoringu | Táta má právo',
    seoDescription: 'Staňte se mentorem nebo požádejte o pomoc zkušeného otce.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-10',
    slug: 'ai-prohlaseni',
    title: 'Prohlášení o využití umělé inteligence (AI)',
    content: 'Výstupy generované AI asistentem jsou automatizovaným rozborem textových podkladů. Výstupy nemají charakter právní rady a vyžadují verifikaci lidským odborníkem.',
    published: true,
    seoTitle: 'Prohlášení o AI technologiích | Táta má právo',
    seoDescription: 'Informace o využití a limitech AI nástrojů na portálu.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-1',
    slug: 'crisis',
    title: 'Krizový Akční Plán SOS',
    content: '# Krizový Akční Plán SOS\n\n**Kategorie:** 🚨 KRIZOVÁ POMOC & KOMUNITA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Krizový Akční Plán SOS | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-2',
    slug: 'forum',
    title: 'Komunitní Diskuzní Fórum',
    content: '# Komunitní Diskuzní Fórum\n\n**Kategorie:** 🚨 KRIZOVÁ POMOC & KOMUNITA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Komunitní Diskuzní Fórum | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-3',
    slug: 'stories',
    title: 'Osobní Příběhy Tátů',
    content: '# Osobní Příběhy Tátů\n\n**Kategorie:** 🚨 KRIZOVÁ POMOC & KOMUNITA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Osobní Příběhy Tátů | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-4',
    slug: 'memento',
    title: 'Memento Opatrovnických Bojů',
    content: '# Memento Opatrovnických Bojů\n\n**Kategorie:** 🚨 KRIZOVÁ POMOC & KOMUNITA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Memento Opatrovnických Bojů | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-5',
    slug: 'advice',
    title: 'Právní Poradna & Zodpovězené Dotazy',
    content: '# Právní Poradna & Zodpovězené Dotazy\n\n**Kategorie:** 🚨 KRIZOVÁ POMOC & KOMUNITA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Právní Poradna & Zodpovězené Dotazy | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-6',
    slug: 'support',
    title: 'Podpora Projektu & Transparentní Dary',
    content: '# Podpora Projektu & Transparentní Dary\n\n**Kategorie:** 🚨 KRIZOVÁ POMOC & KOMUNITA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Podpora Projektu & Transparentní Dary | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-7',
    slug: 'opatrovnicka-agenda',
    title: 'Opatrovnická agenda krok za krokem',
    content: '# Opatrovnická agenda krok za krokem\n\n**Kategorie:** ⚖️ OPATROVNICTVÍ, PRÁVO & JUDIKATURA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Opatrovnická agenda krok za krokem | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-8',
    slug: 'rights',
    title: 'Práva Otců & Ústava ČR (LZPS)',
    content: '# Práva Otců & Ústava ČR (LZPS)\n\n**Kategorie:** ⚖️ OPATROVNICTVÍ, PRÁVO & JUDIKATURA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Práva Otců & Ústava ČR (LZPS) | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-9',
    slug: 'judikatura',
    title: 'Precedenty & Judikatura ÚS/NS ČR',
    content: '# Precedenty & Judikatura ÚS/NS ČR\n\n**Kategorie:** ⚖️ OPATROVNICTVÍ, PRÁVO & JUDIKATURA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Precedenty & Judikatura ÚS/NS ČR | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-10',
    slug: 'ke-stazeni',
    title: 'Ke Stažení & Oficiální Dokumenty',
    content: '# Ke Stažení & Oficiální Dokumenty\n\n**Kategorie:** ⚖️ OPATROVNICTVÍ, PRÁVO & JUDIKATURA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Ke Stažení & Oficiální Dokumenty | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-11',
    slug: 'state-laws',
    title: 'e-Sbírka & e-Legislativa REST API Portal',
    content: '# e-Sbírka & e-Legislativa REST API Portal\n\n**Kategorie:** 🏛️ STÁTNÍ DATA & REGISTRY\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'e-Sbírka & e-Legislativa REST API Portal | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-12',
    slug: 'state-statistics',
    title: 'ČSÚ & MPSV Demografické & Soudní Statistiky',
    content: '# ČSÚ & MPSV Demografické & Soudní Statistiky\n\n**Kategorie:** 🏛️ STÁTNÍ DATA & REGISTRY\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'ČSÚ & MPSV Demografické & Soudní Statistiky | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-13',
    slug: 'pripadova-databaze',
    title: 'Případová Databáze Rozsudků',
    content: '# Případová Databáze Rozsudků\n\n**Kategorie:** 🏛️ STÁTNÍ DATA & REGISTRY\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Případová Databáze Rozsudků | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-14',
    slug: 'knihovna-studii',
    title: 'Knihovna Vědeckých Studií & Psychologie',
    content: '# Knihovna Vědeckých Studií & Psychologie\n\n**Kategorie:** 🎓 EDUKAČNÍ AKADEMIE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Knihovna Vědeckých Studií & Psychologie | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-15',
    slug: 'videoteka',
    title: 'Edukační Videotéka & SmartVideoEmbed',
    content: '# Edukační Videotéka & SmartVideoEmbed\n\n**Kategorie:** 🎓 EDUKAČNÍ AKADEMIE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Edukační Videotéka & SmartVideoEmbed | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-16',
    slug: 'vzdelavani',
    title: 'Akademie Tátů & Interaktivní Kvízy',
    content: '# Akademie Tátů & Interaktivní Kvízy\n\n**Kategorie:** 🎓 EDUKAČNÍ AKADEMIE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Akademie Tátů & Interaktivní Kvízy | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-17',
    slug: 'legal-wiki',
    title: 'Právní Wiki & Slovník Pojmů',
    content: '# Právní Wiki & Slovník Pojmů\n\n**Kategorie:** 🎓 EDUKAČNÍ AKADEMIE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Právní Wiki & Slovník Pojmů | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-18',
    slug: 'cesta-zakladatele',
    title: 'Příběh Zakladatele Synthesis OS',
    content: '# Příběh Zakladatele Synthesis OS\n\n**Kategorie:** 🎓 EDUKAČNÍ AKADEMIE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Příběh Zakladatele Synthesis OS | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-19',
    slug: 'user-portal',
    title: 'Moje Pracovna & Osobní Složka',
    content: '# Moje Pracovna & Osobní Složka\n\n**Kategorie:** 📂 OSOBNÍ PRACOVNA & SPRÁVA PŘÍPADU\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Moje Pracovna & Osobní Složka | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-20',
    slug: 'profile',
    title: 'Profil Hráče / Uživatele & Identity Hub',
    content: '# Profil Hráče / Uživatele & Identity Hub\n\n**Kategorie:** 📂 OSOBNÍ PRACOVNA & SPRÁVA PŘÍPADU\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Profil Hráče / Uživatele & Identity Hub | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-21',
    slug: 'coparent-hub',
    title: 'Spolurodičovský Hub (CoParent)',
    content: '# Spolurodičovský Hub (CoParent)\n\n**Kategorie:** 📂 OSOBNÍ PRACOVNA & SPRÁVA PŘÍPADU\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Spolurodičovský Hub (CoParent) | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-22',
    slug: 'ai-assistant',
    title: 'AI Právní Asistent',
    content: '# AI Právní Asistent\n\n**Kategorie:** 🤖 CHYTRÉ AI NÁSTROJE & VALIDACE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'AI Právní Asistent | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-23',
    slug: 'ai-guide',
    title: 'Sémantický AI Průvodce Řízením',
    content: '# Sémantický AI Průvodce Řízením\n\n**Kategorie:** 🤖 CHYTRÉ AI NÁSTROJE & VALIDACE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Sémantický AI Průvodce Řízením | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-24',
    slug: 'ai-case-manager',
    title: 'Osobní Složka Případu & AI Strategický Asistent',
    content: '# Osobní Složka Případu & AI Strategický Asistent\n\n**Kategorie:** 🤖 CHYTRÉ AI NÁSTROJE & VALIDACE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Osobní Složka Případu & AI Strategický Asistent | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-25',
    slug: 'plan-pece',
    title: 'Simulátor Péče & Sourozenecké Soudržnosti',
    content: '# Simulátor Péče & Sourozenecké Soudržnosti\n\n**Kategorie:** 🤖 CHYTRÉ AI NÁSTROJE & VALIDACE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Simulátor Péče & Sourozenecké Soudržnosti | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-26',
    slug: 'centrum-formularu',
    title: 'Centrum Formulářů & Chytrý Editor',
    content: '# Centrum Formulářů & Chytrý Editor\n\n**Kategorie:** 🤖 CHYTRÉ AI NÁSTROJE & VALIDACE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Centrum Formulářů & Chytrý Editor | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-27',
    slug: 'news',
    title: 'Novinky & Systémové Aktualizace',
    content: '# Novinky & Systémové Aktualizace\n\n**Kategorie:** 🛠️ ADMINISTRACE & SYSTÉM\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Novinky & Systémové Aktualizace | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-28',
    slug: 'synthesis-hub',
    title: 'Synthesis OS Rozcestník & Central Hub',
    content: '# Synthesis OS Rozcestník & Central Hub\n\n**Kategorie:** 🛠️ ADMINISTRACE & SYSTÉM\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Synthesis OS Rozcestník & Central Hub | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-29',
    slug: 'ai-admin',
    title: 'Autonomní AI Admin & Moderátor',
    content: '# Autonomní AI Admin & Moderátor\n\n**Kategorie:** 🛠️ ADMINISTRACE & SYSTÉM\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Autonomní AI Admin & Moderátor | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-30',
    slug: 'admin',
    title: 'Administrace & Systémový Monitoring',
    content: '# Administrace & Systémový Monitoring\n\n**Kategorie:** 🛠️ ADMINISTRACE & SYSTÉM\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Administrace & Systémový Monitoring | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-31',
    slug: 'ai-context',
    title: 'AI Context & Strojový Index',
    content: '# AI Context & Strojový Index\n\n**Kategorie:** 🛠️ ADMINISTRACE & SYSTÉM\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'AI Context & Strojový Index | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-32',
    slug: 'user-manual',
    title: 'Nápověda & Uživatelský manuál',
    content: '# Nápověda & Uživatelský manuál\n\n**Kategorie:** 🛠️ ADMINISTRACE & SYSTÉM\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Nápověda & Uživatelský manuál | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pg-33-33',
    slug: 'sitemap',
    title: 'Architektura & Vývoj Synthesis OS (Sitemap)',
    content: '# Architektura & Vývoj Synthesis OS (Sitemap)\n\n**Kategorie:** 🛠️ ADMINISTRACE & SYSTÉM\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
    published: true,
    seoTitle: 'Architektura & Vývoj Synthesis OS (Sitemap) | Táta má právo',
    seoDescription: 'Stránka je připravena pro budoucí obsah.',
    sections: [],
    updatedAt: new Date().toISOString(),
  },
];

const defaultArticles: Article[] = [
  {
    id: 'art-prespavani-warshak',
    slug: 'prespavani-u-tatu-skodi-malym-detem-110-expertu-tvrdi-opak',
    title: 'Přespávání u tátů škodí malým dětem? 110 světových expertů tvrdí opak',
    summary: 'Přehled mezinárodního vědeckého konsenzu (Richard Warshak). Vysvětlení, že děti mladší 4 let profitují ze sdílené noční péče a že koncept jediného hlavní psychologického rodiče je překonaný.',
    content: 'V opatrovnické praxi v ČR se stále opakuje přežitý argument, že dětí mladší 3 let by neměly přespávat u otce, protože tím utrpí jejich vazba k matce. Moderní vývojová psychologie tento názor jednoznačně vyvrátila.\n\nV roce 2014 publikoval profesor Richard A. Warshak přelomový konsenzuální dokument podpořený 110 předními světovými experty na vývoj dětí a attachment z prestižních univerzit.\n\nKlíčové závěry vědecké komunity:\n1. Děti mladší 4 let profitují z noční péče obou rodičů.\n2. Koncept jediného primárního rodiče je překonaný.\n3. Odepření přespávání oslabuje vztah k otci.',
    published: true,
    category: 'Vědecké mýty vs. fakta',
    authorName: 'Redakce Táta má právo',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-arizona-fabricius',
    slug: 'vyzkum-z-arizona-state-university-prespavani-v-kojeneckem-veku',
    title: 'Výzkum z Arizona State University: Přespávání v kojeneckém věku upevňuje vztah k OBA rodičům',
    summary: 'Detailní rozbor studie Williama Fabricia. Časté přespávání u otce v prvních dvou letech života nenarušuje vazbu k matce, ale posiluje důvěru k oběma rodičům.',
    content: 'Reprezentativní dlouhodobá studie profesora Williama Fabricia z Arizona State University sledovala děti od kojeneckého věku až do dospělosti a přinesla klíčové empirické důkazy pro opatrovnická řízení.\n\nHlavní výsledky studie:\n- Časté přespávání u otce v prvních 2 letech nenarušuje vazbu k matce.\n- Výrazně posiluje vztah k otci v dospívání.\n- Snižuje úzkostnost a psychosomatické potíže v dospělosti.',
    published: true,
    category: 'Vědecké mýty vs. fakta',
    authorName: 'Redakce Táta má právo',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-pod-1-rok',
    slug: 'vek-pod-1-rok-neni-prekazka-proc-odkladat-prespavani',
    title: 'Věk pod 1 rok není překážka: Proč odkládat přespávání nedává smysl',
    summary: 'Zaměření na data prokazující, že přespávání funguje stejně pozitivně bez ohledu na to, zda začalo před 1. rokem věku nebo ve 2. roce.',
    content: 'Argument "počkáme, až bude dítěti 3 roky" je jedním z nejčastějších mýtů, se kterými se otcové setkávají u OSPOD i u soudních znalců. Empirická data však ukazují přesný opak.\n\nData prokazují, že přespávání funguje stejně pozitivně bez ohledu na to, zda začalo před 1. rokem věku nebo ve 2. roce. Odkládání přespávání na pozdější věk vytváří umělou bariéru.',
    published: true,
    category: 'Vědecké mýty vs. fakta',
    authorName: 'Redakce Táta má právo',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-muni-fucik',
    slug: 'zastarale-predsudky-ceskych-soudu-vs-data-z-muni',
    title: 'Zastaralé předsudky českých soudů vs. sociologická data z MUNI',
    summary: 'Analýza výzkumu Petra Fučíka z Masarykovy univerzity. Jak trvání na tradičním modelu škodí stabilitě dětí a proč české soudnictví ignoruje sociologická data.',
    content: 'Výzkumný tým docenta Petra Fučíka z katedry sociologie Masarykovy univerzity (MUNI) realizoval rozsáhlý výzkum zaměřený na uspořádání péče o děti po rozvodu v české společnosti.\n\nSociologická data jasně dokazují, že děti ze střídavé péče vykazují srovnatelnou nebo vyšší míru životní spokojenosti než děti z výhradní péče s omezeným stykem.',
    published: true,
    category: 'Česká praxe a judikatura',
    authorName: 'doc. Petr Fučík (MUNI)',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-repozitar-uk',
    slug: 'co-rozhoduje-o-uspesnem-prespavani-vek-ditete-to-neni',
    title: 'Co rozhoduje o úspěšném přespávání? Věk dítěte to není (poznatky z Univerzity Karlovy)',
    summary: 'Rozbor prací z repozitáře UK. Klíčovým faktorem pro zvládnutí noční péče je praktická schopnost otce zajistit večerní a ranní rutinu péče.',
    content: 'Přehled akademických prací a výzkumů z Univerzity Karlovy zaměřených na rodičovskou způsobilost a potřeby malých dětí.\n\nKlíčové faktory úspěchu:\n1. Praktická kompetence otce.\n2. Předvídatelnost a rituály.\n3. Klid při předávání.\n4. Respekt k potřebám dítěte.',
    published: true,
    category: 'Česká praxe a judikatura',
    authorName: 'Redakce Táta má právo',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-lsac-australia',
    slug: 'investice-do-budoucnosti-jak-prespavani-formuje-teenagery',
    title: 'Investice do budoucnosti: Jak přespávání v batolecím věku formuje teenagery',
    summary: 'Závěry z australské národní studie. Dospívající, kteří u otců odmalinka pravidelně přespávali, vykazují výrazně vyšší míru blízkosti a důvěry k oběma rodičům.',
    content: 'Australská podélná studie (LSAC) sledovala tisíce dětí po dobu 15 let.\n\nDospívající, kteří u otců odmalinka pravidelně přespávali, vykazují v 15–18 letech vyšší sebedůvěru, lepší studijní výsledky a vyrovnané vztahy s oběma rodičům.',
    published: true,
    category: 'Dlouhodobý dopad na vývoj dítěte',
    authorName: 'Redakce Táta má právo',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-manual-do-kapsy',
    slug: 'argumentacni-manual-do-kapsy',
    title: 'Argumentační manuál do kapsy (PDF ke stažení)',
    summary: 'Praktický přehled klíčových argumentů, vědeckých studií a judikátů Ústavního soudu pro jednání s OSPOD a soudem v přehledné formě.',
    content: 'Tento manuál slouží jako přehledný tahák pro otce, advokáty a konzultanty při vyjednávání na OSPOD a u soudních jednání.\n\n1. Vědecký konsenzus (Warshak 2014, Fabricius 2017).\n2. Judikatura Ústavního soudu ČR (I. ÚS 2482/13, I. ÚS 3216/13).\n3. Sociologická data (MUNI Fučík).',
    published: true,
    category: 'Speciální formáty',
    authorName: 'Právní poradna Táta má právo',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-pruvodce-cyklus',
    slug: 'prakticky-pruvodce-jak-zvladnout-vecerni-a-ranni-cyklus-pece',
    title: 'Praktický průvodce: Jak zvládnout večerní a ranní cyklus péče',
    summary: 'Detailní návod krok za krokem pro tátovy první noci s malým dítětem. Jak sestavit uklidňující rituály, řešit spánek, krmení a ranní přípravu.',
    content: 'Prokázání praktické způsobilosti otce je u OSPOD klíčovým argumentem pro schválení přespávání.\n\nVečerní cyklus (18:00 – 20:30):\n1. Večeře a zklidnění.\n2. Koupání a hygiena.\n3. Předspánkový rituál (pohádka, ukolébavka).\n4. Ukládání a klidný spánek.',
    published: true,
    category: 'Speciální formáty',
    authorName: 'Metodický tým',
    createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-infografika',
    slug: 'infografika-pro-socialni-site-prespavani-a-vyvoj-ditete',
    title: 'Infografika pro sociální sítě: Přespávání a vývoj dítěte',
    summary: 'Přehledná vizuální infografika shrnující fakta o přespávání malých dětí u otce, srovnání mýtů a vědecké reality.',
    content: 'Sdílejte tyto ověřené vědecké poznatky a pomozte šířit osvětu o právu dítěte na oba rodiče!\n\nMÝTUS 1: "Malé dítě u tátu nesmí přespávat." -> FAKT: 110 světových expertů (Warshak) potvrzuje opak.\nMÝTUS 2: "Přespávání u tátu naruší vazbu k matce." -> FAKT: Výzkum Arizona State University sledoval děti 20 let a vyvrátil jakékoliv narušení.',
    published: true,
    category: 'Speciální formáty',
    authorName: 'Redakce Táta má právo',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-1',
    slug: 'stridava-pece-v-praxi',
    title: 'Střídavá péče v judikatuře Ústavního soudu',
    summary: 'Ústavní soud opakovaně potvrdil, že střídavá péče by měla být pravidlem, pokud jsou oba rodiče způsobilí dítě vychovávat.',
    content: 'Při rozhodování o opatrovnictví je prioritním hlediskem nejlepší zájem dítěte. Dle nálezů Ústavního soudu ČR (např. I. ÚS 2482/13) je střídavá péče výchozím modelem, ze kterého by měly obecné soudy vycházet, pokud oba rodiče projevují o dítě opravdový zájem a mají k jeho výchově odpovídající předpoklady.',
    published: true,
    category: 'Judikatura',
    authorName: 'JUDr. Petr Svoboda',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-2',
    slug: 'jak-jednat-s-ospod',
    title: 'Jak efektivně komunikovat s OSPOD',
    summary: 'Orgán sociálně-právní ochrany dětí hraje u soudu klíčovou roli kolizního opatrovníka. Jak s ním jednat profesionálně?',
    content: '1. Vždy komunikujte věcně, písemně a slušně.\n2. Zdůrazňujte výhradně zájem dítěte, nikoli spory s bývalou partnerkou.\n3. Umožněte pracovníkům OSPOD nahlédnout do prostředí, ve kterém bude dítě pobývat.\n4. Záznamy ze schůzek si vyžadujte v písemné podobě.',
    published: true,
    category: 'Praktické rady',
    authorName: 'Mgr. Kateřina Černá',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-3',
    slug: 'psychologie-ditete-pri-rozvodu',
    title: 'Psychologický dopad rodičovského konfliktu na dítě',
    summary: 'Co dítě vnímá nejcitlivěji a jak ho uchránit před Syndromem zavrženého rodiče (PAS).',
    content: 'Dítě potřebuje pocit bezpečí a jistoty, že neztrácí ani jednoho z rodičů. Odborníci varují před manipulací a očerňováním druhého rodiče, které u dítěte vyvolává vnitřní konflikt loajality.',
    published: true,
    category: 'Psychologie',
    authorName: 'PhDr. Michal Procházka',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-algotech',
    slug: 'algotech-sponzor-cloud-vps',
    title: 'Algotech a.s. – Stabilní Cloud VPS infrastruktura pro projekt Táta má právo',
    summary: 'Česká společnost Algotech a.s. podporuje náš portál poskytnutím vysoko-výkonného Cloud VPS serveru, který zajišťuje rychlý chod databáze, backendu i AI Asistenta.',
    content: 'Pro provoz náročných systémů, jako je náš AI Asistent opatrovnictví, PostgreSQL databáze rozsudků a komunitní aplikace, je nezbytná nekompromisní rychlost, vysoká dostupnost a maximální bezpečnost dat.\n\nSpolečnost Algotech a.s. se stala klíčovým technologickým partnerem projektu Táta má právo tím, že nám bezplatně poskytuje špičkový Cloud VPS server.',
    published: true,
    category: 'Partneři a Sponzoři',
    authorName: 'Redakce',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-wedos',
    slug: 'wedos-sponzor-hosting',
    title: 'WEDOS Internet, a.s. – Spolehlivý webhosting pro náš portál',
    summary: 'Společnost WEDOS Internet, a.s., lídr na českém hostingovém trhu, zajišťuje našemu projektu stabilní hostingové prostředí a ochranu proti kybernetickým hrozbám.',
    content: 'Zajištění dostupnosti poradenských materiálů, článků a vzorů právních podání 24 hodin denně, 7 dní v týdnu je pro otce v krizových situacích klíčové.\n\nDíky podpoře společnosti WEDOS Internet, a.s., která je lídrem na českém hostingovém trhu, má náš portál Táta má právo zajištěno stabilní hostingové prostředí.',
    published: true,
    category: 'Partneři a Sponzoři',
    authorName: 'Redakce',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-forpsi',
    slug: 'forpsi-partner-domeny',
    title: 'FORPSI – Hrdý sponzor domény tatovacesta.cz',
    summary: 'Renomovaný registrátor FORPSI (INTERNET CZ, a.s.) zastřešuje správu a sponzoring naší hlavní domény tatovacesta.cz.',
    content: 'Každý významný projekt potřebuje svou jasnou adresu v digitálním světě. Naše doména tatovacesta.cz je místem, kde otcové nacházejí zastání, právní orientaci a metodiku pro rovnocennou péči o své děti.\n\nRenomovaný registrátor FORPSI (INTERNET CZ, a.s.) zastřešuje správu a sponzoring naší hlavní domény.',
    published: true,
    category: 'Partneři a Sponzoři',
    authorName: 'Redakce',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultFaqs: Faq[] = [
  {
    id: 'faq-1',
    question: 'Co dělat, když mi matka bezdůvodně odpírá styk s dítětem?',
    answer: 'Okamžitě zdokumentujte každý neuskutečněný styk (SMS, e-mail, svědectví, přítomnost na místě). Podejte návrh na vydání předběžného opatření a informujte OSPOD a příslušný okresní soud.',
    category: 'Právní dotazy',
    order: 1,
    published: true,
  },
  {
    id: 'faq-2',
    question: 'Jak se počítá výživné při střídavé péči?',
    answer: 'Při střídavé péči soud určuje výživné oběma rodičům podle jejich příjmů a rozsahu péče. Používají se doporučující tabulky Ministerstva spravedlnosti.',
    category: 'Finance & Výživné',
    order: 2,
    published: true,
  },
  {
    id: 'faq-3',
    question: 'Má otec stejná práva na informace o zdravotním stavu a škole?',
    answer: 'Ano. Pokud nebyl otec zbaven rodičovské odpovědnosti nebo mu nebyla omezená, má plné právo nahlížet do zdravotní dokumentace dítěte a komunikovat se školou.',
    category: 'Rodičovská práva',
    order: 3,
    published: true,
  },
];

const defaultNavItems: NavItem[] = [
  { id: 'nav-1', labelKey: 'Domů', url: '/', order: 1, target: '_self', isExternal: false },

  // Parent Category 1: 🚨 Krizová pomoc & Komunita
  { id: 'cat-1', labelKey: '🚨 Krizová pomoc & Komunita', url: '#', order: 10, target: '_self', isExternal: false },
  { id: 'sub-1-1', labelKey: 'SOS plán', url: '/crisis', order: 11, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-2', labelKey: 'Fórum', url: '/forum', order: 12, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-3', labelKey: 'Příběhy', url: '/stories', order: 13, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-4', labelKey: 'Memento', url: '/memento', order: 14, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-5', labelKey: 'Právní poradna', url: '/advice', order: 15, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-6', labelKey: 'Podpora', url: '/support', order: 16, target: '_self', isExternal: false, parentId: 'cat-1' },

  // Parent Category 2: ⚖️ Opatrovnictví & Právo
  { id: 'cat-2', labelKey: '⚖️ Opatrovnictví & Právo', url: '#', order: 20, target: '_self', isExternal: false },
  { id: 'sub-2-1', labelKey: 'Agenda', url: '/opatrovnicka-agenda', order: 21, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-2', labelKey: 'Práva', url: '/rights', order: 22, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-3', labelKey: 'Judikatura', url: '/judikatura', order: 23, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-4', labelKey: 'Dokumenty', url: '/ke-stazeni', order: 24, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-5', labelKey: 'Články', url: '/clanky', order: 25, target: '_self', isExternal: false, parentId: 'cat-2' },

  // Parent Category 3: 🏛️ Státní data & Projekt
  { id: 'cat-3', labelKey: '🏛️ Státní data & Projekt', url: '#', order: 30, target: '_self', isExternal: false },
  { id: 'sub-3-1', labelKey: 'e-Sbírka', url: '/state-laws', order: 31, target: '_self', isExternal: false, parentId: 'cat-3' },
  { id: 'sub-3-2', labelKey: 'Statistiky', url: '/state-statistics', order: 32, target: '_self', isExternal: false, parentId: 'cat-3' },
  { id: 'sub-3-3', labelKey: 'Databáze', url: '/pripadova-databaze', order: 33, target: '_self', isExternal: false, parentId: 'cat-3' },
  { id: 'sub-3-4', labelKey: '🤝 Partneři a sponzoři', url: '/sponzori', order: 34, target: '_self', isExternal: false, parentId: 'cat-3' },

  // Parent Category 4: 🎓 Akademie
  { id: 'cat-4', labelKey: '🎓 Akademie', url: '#', order: 40, target: '_self', isExternal: false },
  { id: 'sub-4-1', labelKey: 'Studia', url: '/knihovna-studii', order: 41, target: '_self', isExternal: false, parentId: 'cat-4' },
  { id: 'sub-4-2', labelKey: 'Videotéka', url: '/videoteka', order: 42, target: '_self', isExternal: false, parentId: 'cat-4' },
  { id: 'sub-4-3', labelKey: 'Kvízy', url: '/vzdelavani', order: 43, target: '_self', isExternal: false, parentId: 'cat-4' },
  { id: 'sub-4-4', labelKey: 'Wiki', url: '/legal-wiki', order: 44, target: '_self', isExternal: false, parentId: 'cat-4' },
  { id: 'sub-4-5', labelKey: 'Zakladatel', url: '/cesta-zakladatele', order: 45, target: '_self', isExternal: false, parentId: 'cat-4' },

  // Parent Category 5: 📂 Pracovna
  { id: 'cat-5', labelKey: '📂 Pracovna', url: '#', order: 50, target: '_self', isExternal: false },
  { id: 'sub-5-1', labelKey: 'Složka', url: '/user-portal', order: 51, target: '_self', isExternal: false, parentId: 'cat-5' },
  { id: 'sub-5-2', labelKey: 'Profil', url: '/profile', order: 52, target: '_self', isExternal: false, parentId: 'cat-5' },
  { id: 'sub-5-3', labelKey: 'CoParent', url: '/coparent-hub', order: 53, target: '_self', isExternal: false, parentId: 'cat-5' },

  // Parent Category 6: 🤖 AI nástroje
  { id: 'cat-6', labelKey: '🤖 AI nástroje', url: '#', order: 60, target: '_self', isExternal: false },
  { id: 'sub-6-1', labelKey: 'Asistent', url: '/ai-assistant', order: 61, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-2', labelKey: 'Průvodce', url: '/ai-guide', order: 62, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-3', labelKey: 'Case manager', url: '/ai-case-manager', order: 63, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-4', labelKey: 'Simulátor', url: '/plan-pece', order: 64, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-5', labelKey: 'Formuláře', url: '/centrum-formularu', order: 65, target: '_self', isExternal: false, parentId: 'cat-6' },

  // Parent Category 7: 🛠️ Systém
  { id: 'cat-7', labelKey: '🛠️ Systém', url: '#', order: 70, target: '_self', isExternal: false },
  { id: 'sub-7-1', labelKey: 'Novinky', url: '/news', order: 71, target: '_self', isExternal: false, parentId: 'cat-7' },
  { id: 'sub-7-2', labelKey: 'Hub', url: '/synthesis-hub', order: 72, target: '_self', isExternal: false, parentId: 'cat-7' },
  { id: 'sub-7-3', labelKey: 'AI admin', url: '/ai-admin', order: 73, target: '_self', isExternal: false, parentId: 'cat-7' },
  { id: 'sub-7-4', labelKey: 'Admin', url: '/admin', order: 74, target: '_self', isExternal: false, parentId: 'cat-7' },
  { id: 'sub-7-5', labelKey: 'Context', url: '/ai-context', order: 75, target: '_self', isExternal: false, parentId: 'cat-7' },
  { id: 'sub-7-6', labelKey: 'Nápověda', url: '/user-manual', order: 76, target: '_self', isExternal: false, parentId: 'cat-7' },
  { id: 'sub-7-7', labelKey: 'Architektura', url: '/sitemap', order: 77, target: '_self', isExternal: false, parentId: 'cat-7' },
];

const defaultComplianceDocs: ComplianceDoc[] = [
  {
    id: 'cmp-1',
    key: 'terms',
    title: 'Podmínky užívání portálu',
    type: 'TERMS',
    description: 'Právní vymezení informativní povahy portálu a zřeknutí se odpovědnosti za právní rady',
    content: `Podmínky užívání portálu Táta má právo (v1.0.0)

1. VŠEOBECNÁ USTANOVENÍ
Všechny informace, články, vzory podání a výstupy kalkulaček poskytované v rámci portálu Táta má právo mají výhradně informativní, edukativní a osvětový charakter.

2. ODPOVĚDNOST A LIMITY SLUŽBY
Nenahrazují individuální právní nebo psychologickou péči poskytovanou advokáty či licencovanými terapeuty. Provozovatelé portálu nenesou odpovědnost za jakékoli rozhodnutí nebo úkony učiněné uživatelem na základě informací z tohoto portálu.

3. OCHRANA AUTORSKÝCH PRÁV
Veškerý obsah, rozhraní a modulární nástroje jsou chráněny autorským právem. Jejich komerční šíření bez předchozího písemného souhlasu provozovatele je zakázáno.`,
    version: '1.0.0',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
    status: 'PUBLISHED',
    author: 'Hlavní Správce (Super Admin)',
  },
  {
    id: 'cmp-2',
    key: 'gdpr',
    title: 'Ochrana osobních údajů (GDPR)',
    type: 'PRIVACY',
    description: 'Pravidla zpracování a ochrany osobních údajů uživatelů dle nařízení GDPR',
    content: `Zásady ochrany osobních údajů (GDPR) - Táta má právo (v1.0.0)

1. SPRÁVCE OSOBNÍCH ÚDAJŮ
Portál Táta má právo zpracovává osobní údaje výhradně pro účely správy uživatelského účtu, posílení bezpečnosti a umožnění využívání interaktivních modulů.

2. ROZSAH ZPRACOVÁVANÝCH ÚDAJŮ
Zpracováváme jméno, e-mailovou adresu, IP adresu a údaje zadané uživatelem do soukromého portálu (např. spisy, poznámky, data v kalendáři péče).

3. PRÁVA UŽIVATELE
Každý uživatel má právo na přístup ke svým údajům, jejich opravu, výmaz (právo být zapomenut) a možnost odvolat udělený souhlas přes Compliance Center. Vaše údaje nejsou předávány třetím stranám bez vášho výslovného souhlasu.`,
    version: '1.0.0',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
    status: 'PUBLISHED',
    author: 'Hlavní Správce (Super Admin)',
  },
  {
    id: 'cmp-3',
    key: 'cookies',
    title: 'Zásady používání souborů cookie',
    type: 'COOKIES',
    description: 'Informace o používání technických a preferenčních souborů cookie',
    content: `Zásady používání souborů cookie (v1.0.0)

1. CO JSOU SOUBORY COOKIE
Soubory cookie jsou malé textové soubory ukládané ve vašem prohlížeči, které slouží k zajištění správného fungování webového portálu.

2. POUŽÍVANÉ COOKIES
Používáme výhradně nezbytné technické a relační cookies pro:
- Uložení stavu přihlášení a bezpečnostních tokenů (JWT / relace)
- Uložení vybraného barevného tématu (Theme Manager)
- Zaznamenání potvrzených souhlasů s compliance dokumenty

3. SPRÁVA COOKIES
Technické cookies jsou nezbytné pro provoz portálu. Můžete je zakázat v nastavení prohlížeče, což však může narušit funkčnost přihlášení.`,
    version: '1.0.0',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
    status: 'PUBLISHED',
    author: 'Hlavní Správce (Super Admin)',
  },
  {
    id: 'cmp-4',
    key: 'legal',
    title: 'Moje právní dokumenty & Právní výhrada',
    type: 'LEGAL',
    description: 'Právní výhrada k vygenerovaným návrhům na úpravu poměrů a vzorům podání',
    content: `Právní výhrada k vygenerovaným dokumentům (v1.0.0)

1. INFORMATIVNÍ CHARAKTER VZORŮ
Všechny vzory podání k soudu (návrhy na střídavou péči, vyjádření k OSPOD, dohody rodičů) generované v modulu Právní dokumenty mají orientační charakter.

2. DOPORUČENÁ VERIFIKACE
Uživatel přebírá plnou odpovědnost za kontrolu a doplnění vygenerovaných právních dokumentů. Důrazně doporučujeme každý návrh před podáním k okresnímu soudu konzultovat s advokátem specializovaným na rodinné právo.

3. ŽÁDNÝ VZNIK ADVOKÁTNÍHO VZTAHU
Využitím generátoru dokumentů nevzniká mezi uživatelem a provozovatelem portálu vztah mezi advokátem a klientem.`,
    version: '1.0.0',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
    status: 'PUBLISHED',
    author: 'Hlavní Správce (Super Admin)',
  },
  {
    id: 'cmp-5',
    key: 'volunteer_code',
    title: 'DOBROVOLNICKÝ KODEX • Táta má právo / Synthesis OS',
    type: 'VOLUNTEER_CODE',
    description: 'Etická pravidla, zásady komunikace a odpovědného jednání dobrovolníků projektu Táta má právo / Synthesis OS',
    content: `DOBROVOLNICKÝ KODEX

Táta má právo / Synthesis OS

Etická pravidla, zásady komunikace a odpovědného jednání dobrovolníků

Verze dokumentu: 1.0
Účinnost od: 12. 8. 2026
ID dokumentu: SYNTH-CODEX-VOL-2026-V1

---

I. ÚČEL KODEXU

1. Tento kodex stanovuje základní pravidla chování všech dobrovolníků, spolupracovníků a osob s přístupem k projektu Táta má právo / Synthesis OS.


2. Účelem kodexu je zajistit, aby projekt zůstal bezpečným, důvěryhodným a respektujícím prostředím pro rodiče, děti i všechny členy komunity.


3. Dobrovolník přijímá skutečnost, že práce v projektu může mít přímý dopad na životní situace lidí, kteří se nacházejí v náročných rodinných, právních nebo psychických okolnostech.




---

II. POSLÁNÍ PROJEKTU

Dobrovolník při své činnosti podporuje zejména:

nejlepší zájem dítěte,

zdravý vztah dítěte k oběma rodičům,

respekt mezi rodiči,

odpovědné rodičovství,

dostupnost ověřených informací,

lidský přístup k lidem v obtížné situaci.


Projekt není založen na boji proti jednotlivým osobám, ale na podpoře řešení, informovanosti a odpovědnosti.


---

III. ZÁKLADNÍ HODNOTY DOBROVOLNÍKA

1. Respekt

Dobrovolník jedná s respektem ke každému člověku bez ohledu na:

pohlaví,

věk,

rodinnou situaci,

názory,

životní zkušenosti.


Nikdo nesmí být ponižován, zesměšňován nebo napadán.


---

2. Ochrana dítěte

Dítě není nástroj konfliktu mezi dospělými.

Dobrovolník:

nezneužívá příběhy dětí pro argumentaci,

chrání jejich soukromí,

nepodporuje nenávist mezi rodiči,

vždy zohledňuje dlouhodobý zájem dítěte.



---

3. Pravdivost a odpovědnost

Dobrovolník:

nepřidává neověřená tvrzení,

nerozšiřuje fámy,

odlišuje fakta od osobního názoru,

uvádí zdroje, pokud pracuje s odbornými informacemi.



---

IV. KOMUNIKACE S UŽIVATELI

Dobrovolník komunikuje:

slušně,

klidně,

věcně,

bez odsuzování.


Je zakázáno:

urážení,

vyhrožování,

zesměšňování,

vyvolávání konfliktů,

podněcování nenávisti.



---

V. PRÁCE S RODIČI V KRIZI

Dobrovolník bere na vědomí, že uživatelé mohou být:

pod silným stresem,

v emoční krizi,

po rozchodu,

v probíhajícím soudním řízení.


Proto:

1. Nenahrazuje psychologa ani advokáta.


2. Neposkytuje právní záruky typu:

„Soud určitě rozhodne takto.“

3. Nepodporuje impulzivní jednání.


4. Pomáhá uživateli orientovat se, nikoliv eskalovat konflikt.




---

VI. ZÁSADA NEÚTOČENÍ NA DRUHÉHO RODIČE

Dobrovolník nesmí využívat projekt k:

veřejnému pranýřování druhého rodiče,

zveřejňování osobních údajů,

pomstě,

nátlaku.


Kritizovat lze:

postupy,

systémy,

rozhodnutí,

obecné problémy.


Nelze útočit na konkrétní osoby bez oprávněného důvodu.


---

VII. OCHRANA SOUKROMÍ

Dobrovolník:

chrání identitu uživatelů,

nezveřejňuje příběhy bez souhlasu,

nesdílí screenshoty komunikace,

nepřenáší informace mimo projekt.


Platí zásada:

„To, co člověk svěří projektu v těžké chvíli, není materiál pro veřejnou debatu.“


---

VIII. ODBORNOST A HRANICE ROLE

Dobrovolník:

nepředstírá odbornou kvalifikaci, kterou nemá,

nepředstavuje se jako právník, psycholog nebo úředník, pokud jím není,

přizná své limity.


Pokud si není jistý, požádá o konzultaci Správce projektu.


---

IX. SOCIÁLNÍ SÍTĚ A VEŘEJNÉ VYSTUPOVÁNÍ

Dobrovolník:

nesmí vystupovat jménem projektu bez oprávnění,

nesmí zveřejňovat interní informace,

nesmí poškozovat pověst projektu.


Při veřejném vyjadřování jasně rozlišuje:

„Můj osobní názor“

od

„Stanovisko projektu Táta má právo“.


---

X. TECHNOLOGICKÁ ETIKA

Dobrovolník pracující s technologií:

chrání bezpečnost systému,

nevyužívá chyby k vlastnímu prospěchu,

nezkouší útoky bez povolení,

chrání uživatelská data.


Bezpečnost projektu znamená ochranu lidí, ne pouze ochranu systému.


---

XI. UMĚLÁ INTELIGENCE

Dobrovolník využívající AI:

kontroluje výsledky,

nevkládá citlivé údaje do neschválených služeb,

nepoužívá AI k vytváření falešných důkazů,

zachovává lidskou odpovědnost.



---

XII. KONFLIKTY A NESOUHLAS

Rozdílný názor je přípustný.

Dobrovolník řeší neshody:

věcně,

přímo,

s respektem.


Není přípustné:

osobní napadání,

vytváření skupin proti konkrétním lidem,

poškozování projektu zevnitř.



---

XIII. PORUŠENÍ KODEXU

Porušení kodexu může vést k:

upozornění,

omezení oprávnění,

odebrání přístupu,

ukončení spolupráce.


Při závažném porušení může být věc řešena podle platných právních předpisů.


---

XIV. SLIB DOBROVOLNÍKA

Dobrovolník potvrzuje:

„Přijímám odpovědnost za své jednání v projektu Táta má právo. Budu chránit soukromí lidí, respektovat důstojnost rodičů i dětí a využívat své schopnosti k pomoci, nikoliv k prohlubování konfliktů.“


---

ELEKTRONICKÉ POTVRZENÍ

Jméno:

{{USER_FULL_NAME}}

ID účtu:

{{USER_ID}}

Datum:

{{TIMESTAMP}}

Potvrzení:

☐ Seznámil(a) jsem se s kodexem a zavazuji se jej dodržovat.`,
    version: '1.0.0',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
    status: 'PUBLISHED',
    author: 'Hlavní Správce (Super Admin)',
  },
  {
    id: 'cmp-6',
    key: 'ai_statement',
    title: 'Prohlášení o využití umělé inteligence (AI)',
    type: 'AI_STATEMENT',
    description: 'Prohlášení o vývoji portálu svépomocí s využitím AI, odborných zdrojů a právní výhradě',
    content: `PROHLÁŠENÍ O VYUŽITÍ UMĚLÉ INTELIGENCE (AI) & PRÁVNÍ VÝHRADA

Tento projekt a jeho webový portál vznikají svépomocí s využitím pokročilých technologií umělé inteligence (AI), odborných veřejných zdrojů, judikatury a vlastních životních zkušeností z opatrovnických řízení.

UPOZORNĚNÍ A PRÁVNÍ VÝHRADA:
1. Autor portálu ani provozovatelé nejsou licencovanými advokáty, právníky ani registrovanými klinickými psychology.
2. Všechny informace, vzory dokumentů, výstupy AI asistenta a kalkulačky mají výhradně informativní, edukativní a osvětový charakter.
3. Poskytované materiály nenahrazují individuální právní poradenství poskytované advokátem dle zákona o advokacii ani odbornou psychoterapeutickou péči.
4. Před podáním jakéhokoli návrhu či podání k okresnímu soudu nebo jednáním s OSPOD důrazně doporučujeme konzultovat konkrétní případ s kvalifikovaným odborníkem.`,
    version: '1.0.0',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
    status: 'PUBLISHED',
    author: 'Hlavní Správce (Super Admin)',
  },
  {
    id: 'cmp-7',
    key: 'dohoda-o-spolupraci',
    title: 'Dohoda o dobrovolné spolupráci (e-Smlouva)',
    type: 'VOLUNTEER_CODE',
    description: 'Dohoda o dobrovolné spolupráci, mlčenlivosti (NDA), ochraně informací, licenci k výstupům a GDPR',
    content: `DOHODA O DOBROVOLNÉ SPOLUPRÁCI, MLČENLIVOSTI, OCHRANĚ INFORMACÍ, LICENCI K VÝSTUPŮM A PRAVIDLECH PRÁCE S OSOBNÍMI ÚDAJI

Elektronická e-Smlouva projektu Táta má právo / Synthesis OS

Verze dokumentu: 1.0
ID smlouvy: SYNTH-VOL-{{GENERATED_ID}}
Datum uzavření: {{TIMESTAMP}}

---
STRANA 1/5
I. SMLUVNÍ STRANY
1. Zakladatel a správce projektu: Jiří Šár (Táta má právo / Synthesis OS, www.tatavacesta.cz, info@tatavacesta.cz)
2. Dobrovolník: {{USER_FULL_NAME}}, Nar. {{USER_BIRTH_DATE}}, Adresa: {{USER_ADDRESS}}, E-mail: {{USER_EMAIL}}, Uživatelské ID: {{USER_ID}}

II. ÚVODNÍ USTANOVENÍ A SMYSL SPOLUPRÁCE
Dohoda upravuje nezávislou občanskou iniciativu a podporu aktivního rodičovství, nejlepšího zájmu dítěte a ochranu soukromí rodin.

III. CHARAKTER DOBROVOLNÉ SPOLUPRÁCE
Vstup z vlastní svobodné vůle, bez nátlaku, bez očekávání mzdy či honoráře. Nezahrnuje pracovní poměr.

IV. PŘEDMĚT DOBROVOLNICKÉ ČINNOSTI
A) Obsah a vzdělávání, B) Technologie, C) Komunita, D) Výzkum a analýza.

---
STRANA 2/5
V. POVINNOSTI DOBROVOLNÍKA
Nezpůsobit škodu na dobrém jménu, zachovávat nestrannost, nepředstavovat osobní názory jako oficiální.

VI. ZÁKAZ ZNEUŽITÍ POSTAVENÍ DOBROVOLNÍKA
Zákaz komerční propagace, získávání kontaktů uživatelů pro vlastní účely a manipulativního jednání.

VII. PRÁCE S PŘÍBĚHY RODIN A UŽIVATELŮ
Striktní zákaz odtajňování anonymizovaných identit rodin a dětí.

VIII. MLČENLIVOST A OCHRANA DŮVĚRNÝCH INFORMACÍ (NDA)
Důvěrné informace zahrnují uživatelská data, zdrojové kódy, architketuru Synthesis OS i vývojové plány.

IX. POVINNOST MLČENLIVOSTI
Povinnost mlčenlivosti trvá během spolupráce i po jejím skončení.

X. VÝJIMKY Z MLČENLIVOSTI
Zákonné povinnosti či veřejně dostupné informace bez zavinění.

---
STRANA 3/5
XI. OCHRANA OSOBNÍCH ÚDAJŮ A PRAVIDLA GDPR
Respektování Nařízení GDPR (EU 2016/679) a zákona č. 110/2019 Sb.

XII. POVINNOSTI DOBROVOLNÍKA PŘI PRÁCI S OSOBNÍMI ÚDAJI
Používání pouze schválených nástrojů, zákaz neoprávněného exportu či ukládání na osobní cloudy.

XIII. PRAVIDLA PRO UCHOVÁVÁNÍ A MAZÁNÍ DAT
Po skončení spolupráce okamžité odstranění kopií a odhlášení ze systémů.

XIV. BEZPEČNOSTNÍ PRAVIDLA SYSTÉMU SYNTHESIS OS
Ochrana účtů, zákaz obcházení bezpečnostních prvků.

XV. PRAVIDLA PRO VYUŽITÍ UMĚLÉ INTELIGENCE (AI)
Zákaz vkládání osobních údajů uživatelů a zdrojových kódů do veřejných AI modelů.

XVI. TECHNICKÉ DÍLO, ZDROJOVÝ KÓD A INFRASTRUKTURA
Ochrana zdrojového kódu a know-how Správce projektu.

XVII. OZNAMOVACÍ POVINNOST
Bezodkladné oznámení bezpečnostních chyb a incidentů.

---
STRANA 4/5
XVIII. AUTORSKÁ DÍLA, VÝSTUPY A LICENČNÍ UJEDNÁNÍ
Výstupy zahrnují texty, kódy, grafiku, databáze a vzdělávací materiály.

XIX. POSKYTNUTÍ LICENCE K VÝSTUPŮM
Výhradní, bezúplatná, časově i územně neomezená licence pro Správce projektu.

XX. ÚPRAVY A ROZVOJ VÝSTUPŮ
Souhlas s úpravami, aktualizacemi a začleněním do budoucích verzí Synthesis OS.

XXI. AUTORSKÉ PROHLÁŠENÍ DOBROVOLNÍKA
Prohlášení o vlastní tvůrčí činnosti a neporušování práv třetích stran.

XXII. UVÁDĚNÍ AUTORSTVÍ
XXIII. PUBLIKACE A VEŘEJNÉ VYSTUPOVÁNÍ
XXIV. UKONČENÍ SPOLUPRÁCE
XXV. POVINNOSTI PO UKONČENÍ SPOLUPRÁCE

---
STRANA 5/5
XXVI. ODPOVĚDNOST, NÁHRADA ŠKODY A SMLUVNÍ SANKCE
Odpovědnost za úmyslné porušení mlčenlivosti či únik dat.

XXVII. ELEKTRONICKÁ SMLOUVA, AUDITNÍ STOPA A IDENTIFIKACE
Právní závaznost elektronické akceptace s unikátním ID a časovým razítkem.

XXVIII. ŘEŠENÍ SPORŮ A ROZHODNÉ PRÁVO
Rozhodné právo ČR a příslušnost českých soudů.

XXIX. ZÁVĚREČNÁ USTANOVENÍ A PROHLÁŠENÍ SOUHLASU
XXX. ELEKTRONICKÝ PODPIS, AKCEPTACE A AUDITNÍ PROTOKOL`,
    version: '1.0.0',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
    status: 'PUBLISHED',
    author: 'Jiří Šár (Zakladatel a správce)',
  },
];

const defaultSettings: Setting[] = [
  { id: 'set-1', key: 'site_title', value: 'Táta má právo', category: 'general', updatedAt: new Date().toISOString() },
  { id: 'set-2', key: 'contact_email', value: 'info@tatovacesta.cz', category: 'general', updatedAt: new Date().toISOString() },
  { id: 'set-3', key: 'maintenance_mode', value: 'false', category: 'system', updatedAt: new Date().toISOString() },
  { id: 'set-4', key: 'allow_registration', value: 'true', category: 'auth', updatedAt: new Date().toISOString() },
];

const defaultAuditLogs: AuditLog[] = [
  {
    id: 'aud-1',
    userId: 'usr-superadmin',
    userEmail: 'superadmin@tatovacesta.cz',
    action: 'SYSTEM_INIT',
    module: 'CORE',
    details: 'Základní architektura portálu Táta má právo úspěšně inicializována.',
    ipAddress: '127.0.0.1',
    createdAt: new Date().toISOString(),
  },
];

const defaultMediaItems: MediaItem[] = [
  {
    id: 'med-1',
    name: 'logo-tatovacesta.svg',
    url: '/assets/logo.svg',
    type: 'image',
    mimeType: 'image/svg+xml',
    size: 24500,
    alt: 'Logo Táta má právo',
    scanStatus: 'CLEAN',
    storageProvider: 'MinIO',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-2',
    name: 'metodika-ospod-2026.pdf',
    url: '/assets/metodika-ospod.pdf',
    type: 'document',
    mimeType: 'application/pdf',
    size: 1548000,
    alt: 'Metodika jednání s OSPOD',
    scanStatus: 'CLEAN',
    storageProvider: 'MinIO',
    createdAt: new Date().toISOString(),
  },
];

const defaultUserCases: UserCase[] = [
  {
    id: 'case-1',
    userId: 'usr-user',
    title: 'Úprava péče a výživného pro nezletilou dceru',
    caseNumber: '12 Nc 305/2025',
    courtName: 'Okresní soud v Olomouci',
    status: 'active',
    notes: 'Návrh na střídavou péči podán. Čekáme na vyjádření OSPOD.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultUserChildren: UserChild[] = [
  {
    id: 'child-1',
    userId: 'usr-user',
    name: 'Aneta Svobodová',
    birthDate: '2018-05-14',
    notes: 'Navštěvuje 2. třídu ZŠ, zájmy: výtvarný kroužek, plavání.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultUserEvents: UserCalendarEvent[] = [
  {
    id: 'evt-1',
    userId: 'usr-user',
    title: 'Předání dítěte na víkend',
    eventDate: '2026-08-14T16:00',
    category: 'handover',
    description: 'Předání před domem matky v 16:00 dle platné předběžné dohody.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'evt-2',
    userId: 'usr-user',
    title: 'Přípravné jednání na OSPOD',
    eventDate: '2026-08-20T09:00',
    category: 'ospod',
    description: 'Konzultace s opatrovnickou pracovnicí Mgr. Novotnou.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultUserNotes: UserNote[] = [
  {
    id: 'note-1',
    userId: 'usr-user',
    title: 'Poznámky z posledního předávání',
    content: 'Předání proběhlo bez komplikací. Dítě předáno s kompletní výbavou do školy.',
    category: 'handover',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultUserDocuments: UserDocument[] = [
  {
    id: 'doc-1',
    userId: 'usr-user',
    name: 'Navrh_na_stridavou_pecu_Svoboda.pdf',
    fileUrl: '/documents/navrh_stridava_pec.pdf',
    fileType: 'pdf',
    size: 345000,
    category: 'court_filing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'doc-2',
    userId: 'usr-user',
    name: 'Zprava_OSPOD_Olomouc_2026.pdf',
    fileUrl: '/documents/zprava_ospod.pdf',
    fileType: 'pdf',
    size: 512000,
    category: 'ospod_report',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultStudies: Study[] = [
  {
    id: 'study-fabricius-2017',
    slug: 'fabricius-warshak-2017-prespavanikojencu-stridava-pec',
    title: 'Frekvence přespávání kojenců a batolat u otců v rámci střídavé péče',
    originalTitle: 'Should Infants and Toddlers Have Frequent Overnight Parenting Time With Fathers? The Policy Debate and New Data',
    authors: 'William V. Fabricius, Go Woon Suh, Richard A. Warshak',
    publicationYear: 2017,
    publisher: 'Psychology, Public Policy, and Law (American Psychological Association)',
    doi: '10.1037/law0000108',
    sourceUrl: 'https://doi.org/10.1037/law0000108',
    abstract: 'Otázka, zda by děti ve věku do 2 let měly po rozchodu rodičů často přespávat u svých otců, byla předmětem rozsáhlých debat. Tato výzkumná studie zkoumala dlouhodobý dopad přespávání u otců v raném věku (0–3 roky) na kvalitu vztahů s oběma rodiči v dospělosti.',
    summary: 'Výzkum jednoznačně vyvrací mýtus o hypotéze monotropie (předpokladu, že dítě má v raném věku pouze jednu primární pečující osobu). Přespávání kojenců a batolat u otců podporuje budování pevné citové vazby, zvyšuje rodičovské dovednosti otce a matce poskytuje nezbytnou regeneraci bez jakéhokoli poškození vztahu matka-dítě.',
    methodology: 'Longitudinální hodnocení dlouhodobých vztahů u mladých dospělých (N = 116), jejichž rodiče se trvale rozvedli před 3. rokem věku dítěte. Měřena frekvence přespávání a denních návštěv ve věku <1 rok, 1-2 roky a 2-3 roky s kontrolou následné péče v dětství i dospívání, vzdělání rodičů a interrodičovského konfliktu až 5 let po rozchodu.',
    findings: '1. Častější přespávání u otce v raném věku (<1 rok a 2 roky) vedlo k lineárnímu zlepšení kvality vztahu otec-dítě v dospělosti ("dose-response" efekt).\n2. Vztah matka-dítě nebyl přespáváním u otce poškozen a zůstal na vysoké úrovni.\n3. Pozitivní efekt přespávání platil i v rodinách s vysokým rodičovským konfliktem a v případech, kdy plán přespávání určil soud/mediace přes námitky jednoho z rodičů.\n4. Pouhé denní návštěvy neposkytují stejný rozvojový přínos jako přespávání.',
    limitations: 'Retrospektivní hodnocení rodičů ohledně frekvence péče před lety bylo statisticky ověřeno vysokou shodou mezi nezávislými hlášeními obou rodičů (r > 0.84). Vzorek reprezentuje stabilní populaci, avšak biologické a psychologické mechanizmy reakce na separaci platí univerzálně.',
    relevance: 'Klíčový podklad pro soudní rozhodování, OSPOD a opatrovnické znalecké posudky. Prokazuje, že plány péče zahrnující přespávání od nejranějšího věku jsou v nejlepším zájmu dítěte a posilují rodinnou stabilitu.',
    keywords: 'střídavá péče, přespávání kojenců, vazba s otcem, rodičovský konflikt, vývojová psychologie',
    category: 'stridava_pece',
    status: 'PUBLISHED',
    featured: true,
    pdfUrl: '/uploads/studies/Fabricius_Warshak_2017_Overnight_Parenting_Infants.pdf',
    pdfMediaId: 'med-pdf-fabricius-2017',
    pdfSize: 1245000,
    createdBy: 'system@tatovacesta.cz',
    updatedBy: 'system@tatovacesta.cz',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultStateStatistics: StateStatistic[] = [
  {
    id: 'stat-1',
    category: 'Péče o děti',
    title: 'Podíl střídavé péče schválené soudy',
    description: 'Procento dětí svěřených do střídavé péče obou rodičů po rozchodu rodičů v ČR.',
    value: '32 %',
    unit: '%',
    period: '2024/2025',
    source: 'Ministerstvo spravedlnosti ČR / ČSÚ',
    chartData: {
      labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
      datasets: [{ label: 'Střídavá péče (%)', data: [18, 21, 24, 27, 30, 32] }],
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stat-2',
    category: 'Péče o děti',
    title: 'Péče jednoho rodiče (výhradní péče matky)',
    description: 'Podíl rozhodnutí, kde bylo dítě svěřeno do výhradní péče matky.',
    value: '58 %',
    unit: '%',
    period: '2024/2025',
    source: 'Ministerstvo spravedlnosti ČR',
    chartData: {
      labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
      datasets: [{ label: 'Výhradní péče matky (%)', data: [72, 68, 65, 62, 60, 58] }],
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stat-3',
    category: 'Délka řízení',
    title: 'Průměrná délka opatrovnického řízení u okresních soudů',
    description: 'Průměrný počet dnů od podání návrhu na úpravu poměrů do vydání prvostupňového rozsudku.',
    value: '215',
    unit: 'dní',
    period: '2024/2025',
    source: 'Ministerstvo spravedlnosti ČR - Statistická ročenka',
    chartData: {
      labels: ['2021', '2022', '2023', '2024', '2025'],
      datasets: [{ label: 'Délka řízení (dny)', data: [245, 238, 225, 220, 215] }],
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stat-4',
    category: 'Délka řízení',
    title: 'Průměrná doba rozhodování o předběžném opatření (§ 452 ZVR)',
    description: 'Doba rozhodování soudů o akutních návrzích na předběžnou úpravu poměrů dítěte.',
    value: '7',
    unit: 'dní',
    period: '2025',
    source: 'Ministerstvo spravedlnosti ČR',
    chartData: {
      labels: ['Zákonná lhůta', 'Průměrná praxe soudů'],
      datasets: [{ label: 'Dny', data: [7, 6.8] }],
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stat-5',
    category: 'Výživné',
    title: 'Průměrná stanovená výše výživného na jedno dítě',
    description: 'Průměrné měsíční výživné určované soudy ČR podle věkových kategorií.',
    value: '3 850',
    unit: 'Kč',
    period: '2024/2025',
    source: 'Český statistický úřad (ČSÚ) / MS ČR',
    chartData: {
      labels: ['0-5 let', '6-11 let', '12-15 let', '16-26 let'],
      datasets: [{ label: 'Průměrné výživné (Kč)', data: [2800, 3500, 4200, 4900] }],
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stat-6',
    category: 'Výživné',
    title: 'Míra plnění vyživovací povinnosti a náhradní výživné',
    description: 'Procento povinných rodičů hradících stanovené výživné řádně a včas.',
    value: '84 %',
    unit: '%',
    period: '2024/2025',
    source: 'Úřad práce ČR / Ministerstvo práce a sociálních věcí',
    chartData: {
      labels: ['Řádně placeno', 'Částečně placeno', 'Neplaceno'],
      datasets: [{ label: 'Podíl (%)', data: [84, 10, 6] }],
    },
    createdAt: new Date().toISOString(),
  },
];

const defaultCourtCases: CourtCase[] = [
  {
    id: 'case-us-1506-23',
    fileNumber: 'I. ÚS 1506/23',
    court: 'Ústavní soud',
    title: 'Právo dítěte na péči obou rodičů a presumpce střídavé péče',
    summary: 'Stěžovatel (otec) se domáhal střídavé péče o nezletilého syna. Obecné soudy ji zamítly s odkazem na pracovní vytížení otce a nesouhlas matky. Ústavní soud rozhodnutí zrušil pro porušení článku 32 odst. 4 Listiny základních práv a svobod.',
    legalRatio: 'Svěření dítěte do střídavé péče by mělo být pravidlem, pokud jsou oba rodiče způsobilí dítě vychovávat a mají o jeho výchovu zájem. Nesouhlas jednoho z rodičů nebo jeho subjektivní výhrady samy o sobě nemohou být důvodem pro vyloučení střídavé péče.',
    tags: ['střídavá péče', 'základní práva', 'nesouhlas matky', 'rovnoprávnost rodičů'],
    fullTextUrl: 'https://nalus.usoud.cz/Search/GetText.aspx?sz=1-1506-23',
    publishedAt: new Date('2023-10-18').toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'case-us-3242-22',
    fileNumber: 'II. ÚS 3242/22',
    court: 'Ústavní soud',
    title: 'Předběžná opatření v opatrovnických věcech a bezdůvodné maření styku',
    summary: 'Matka opakovaně znemožňovala otci styk s dcerou pod záminkou onemocnění bez lékařského potvrzení. Otec požádal o předběžné opatření k úpravě styku, které krajský soud zamítl.',
    legalRatio: 'Pokud jeden z rodičů systematicky a bezdůvodně maří styk druhého rodiče s dítětem, je povinností obecných soudů zakročit pomocí předběžného opatření a zajistit obnovení a udržení rodičovské vazby bez zbytečného prodlení.',
    tags: ['předběžné opatření', 'maření styku', 'vynutitelnost práva', 'rychlost řízení'],
    fullTextUrl: 'https://nalus.usoud.cz/Search/GetText.aspx?sz=2-3242-22',
    publishedAt: new Date('2023-03-14').toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'case-us-1200-21',
    fileNumber: 'III. ÚS 1200/21',
    court: 'Ústavní soud',
    title: 'Zjišťování názoru nezletilého dítěte a role OSPOD',
    summary: 'Obecný soud neprovedl výslek 10letého dítěte ani nepřihlédl k jeho přání střídavé péče, přičemž se spolehl výhradně na stanovisko OSPOD, který střídavou péči nedoporučil.',
    legalRatio: 'OSPOD je pouze kolizním opatrovníkem, jehož názor nezavazuje soud. Soud je povinen zjišťovat názor dítěte odpovídajícím způsobem vzhledem k jeho věku a rozvojové úrovni a přihlížet k němu.',
    tags: ['názor dítěte', 'OSPOD', 'dokazování', 'vyslechnutí nezletilého'],
    fullTextUrl: 'https://nalus.usoud.cz/Search/GetText.aspx?sz=3-1200-21',
    publishedAt: new Date('2021-11-02').toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'case-ns-1890-22',
    fileNumber: '21 Cdo 1890/2022',
    court: 'Nejvyšší soud',
    title: 'Kritéria pro stanovení výživného při změně poměrů a střídavé péči',
    summary: 'Přezkum rozhodnutí o výši výživného při přechodu z výhradní péče matky na střídavou péči s ohledem na odlišné příjmy rodičů a úhradu mimořádných nákladů.',
    legalRatio: 'Při střídavé péči se výživné určuje oběma rodičům vzájemně tak, aby byla zajištěna srovnatelná životní úroveň dítěte u obou rodičů. Samotný fakt střídavé péče nevylučuje stanovení výživného rodiči s výrazně vyššími příjmy.',
    tags: ['výživné', 'změna poměrů', 'životní úroveň', 'příjmy rodičů'],
    fullTextUrl: 'https://www.nsoud.cz/Judikatura/judikatura_ns.nsf/WebSearch/21Cdo1890-2022',
    publishedAt: new Date('2022-08-25').toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'case-us-2482-24',
    fileNumber: 'I. ÚS 2482/24',
    court: 'Ústavní soud',
    title: 'Vzdálenost bydlišť rodičů a střídavá péče při nástupu do školy',
    summary: 'Matka se bez souhlasu otce odstěhovala s dítětem do vzdálenosti 120 km a tvrdila, že střídavá péče již není z důvodu vzdálenosti možná.',
    legalRatio: 'Jednostranné odstěhování jednoho z rodičů bez souhlasu druhého rodiče či rozhodnutí soudu nemůže jít k tíži rodiče, který změnu nezpůsobil. Soudy musí zkoumat motivaci k odstěhování a možnost zachování střídavé péče či úpravy širšího styku.',
    tags: ['odstěhování', 'vzdálenost bydlišť', 'školní docházka', 'střídavá péče'],
    fullTextUrl: 'https://nalus.usoud.cz/Search/GetText.aspx?sz=1-2482-24',
    publishedAt: new Date('2024-05-10').toISOString(),
    createdAt: new Date().toISOString(),
  },
];

// In-Memory Database Store for Seamless Local Fallback
class MemoryStore {
  texts: TextItem[] = [...defaultTextItems];
  themes: ThemeSetting[] = [...defaultThemeSettings];
  modules: Module[] = [...defaultModules];
  users: User[] = [...defaultUsers];
  categories: Category[] = [...defaultCategories];
  pageSections: PageSection[] = [...defaultPageSections];
  pages: Page[] = [...defaultPages];
  articles: Article[] = [...defaultArticles];
  faqs: Faq[] = [...defaultFaqs];
  navItems: NavItem[] = [...defaultNavItems];
  mediaItems: MediaItem[] = [...defaultMediaItems];
  complianceDocs: ComplianceDoc[] = [...defaultComplianceDocs];
  userConsents: UserConsent[] = [];
  auditLogs: AuditLog[] = [...defaultAuditLogs];
  settings: Setting[] = [...defaultSettings];
  userCases: UserCase[] = [...defaultUserCases];
  userChildren: UserChild[] = [...defaultUserChildren];
  userEvents: UserCalendarEvent[] = [...defaultUserEvents];
  userNotes: UserNote[] = [...defaultUserNotes];
  userDocuments: UserDocument[] = [...defaultUserDocuments];
  studies: Study[] = [...defaultStudies];
  stateStatistics: StateStatistic[] = [...defaultStateStatistics];
  courtCases: CourtCase[] = [...defaultCourtCases];
  laws: any[] = [
    {
      id: 'law-89-2012',
      code: '89/2012',
      title: 'Zákon č. 89/2012 Sb., občanský zákoník',
      content: JSON.stringify({ summary: 'Občanský zákoník upravuje osobnostní práva, rodinné právo, opatrovnictví a věcná práva.' }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'law-359-1999',
      code: '359/1999',
      title: 'Zákon č. 359/1999 Sb., o sociálně-právní ochraně dětí (zOSPOD)',
      content: JSON.stringify({ summary: 'Zákon o sociálně-právní ochraně dětí upravuje ochranu práv dětí, OSPOD a pěstounskou péči.' }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  partners: Partner[] = [
    {
      id: 'partner-1',
      name: 'ALGOTECH a.s.',
      description: 'Přední poskytovatel cloudových VPS, IT služeb a podnikových systémů.',
      logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=128&auto=format&fit=crop&q=60',
      websiteUrl: 'https://www.algotech.cz',
      type: PartnerType.SPONSOR,
      order: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'partner-2',
      name: 'WEDOS Internet, a.s.',
      description: 'Největší poskytovatel webhostingu v ČR.',
      logoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&auto=format&fit=crop&q=60',
      websiteUrl: 'https://www.wedos.cz',
      type: PartnerType.SPONSOR,
      order: 2,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'partner-3',
      name: 'FORPSI',
      description: 'Tradiční poskytovatel internetových služeb.',
      logoUrl: 'https://images.unsplash.com/photo-1425421598808-4a22ce59cc97?w=128&auto=format&fit=crop&q=60',
      websiteUrl: 'https://www.forpsi.com',
      type: PartnerType.PARTNER,
      order: 3,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  forumThreads: ForumThread[] = [];
  forumPosts: ForumPost[] = [];




  // Helper methods
  logAudit(action: string, module: string, details: string, user?: User | null) {
    const newLog: AuditLog = {
      id: 'aud-' + Date.now(),
      userId: user?.id || 'system',
      userEmail: user?.email || 'system@tatovacesta.cz',
      action,
      module,
      details,
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(newLog);
  }
}

export const dbStore = new MemoryStore();
