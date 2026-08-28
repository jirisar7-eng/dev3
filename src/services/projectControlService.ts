import { prisma, isPrismaAvailable } from '../db/prisma';
import { AuditService } from './auditService';
import crypto from 'crypto';
import type {
  ProjectControlOverview,
  ProjectTaskItem,
  ProjectTaskStatus,
  ProjectTaskPriority,
  ProjectTaskCategory,
  PortalContentItem,
  AuditRecommendationItem,
  ProjectPhaseItem,
} from '../types/projectControl';
import type { SynthesisStatus, SynthesisSeverity, SynthesisCategory } from '@prisma/client';

// In-Memory fallback store for tasks when database is offline
const inMemoryTasks: ProjectTaskItem[] = [];

// ==========================================
// STATIC/VERIFIED EVIDENCE DATA CATALOGS
// ==========================================

export const PORTAL_CONTENT_CATALOG: PortalContentItem[] = [
  {
    id: 'page-home',
    title: 'Hlavní stránka & Rozcestník',
    path: '/',
    category: 'PUBLIC_PORTAL',
    categoryLabel: 'Veřejný portál',
    status: 'DONE',
    dataSource: 'STATIC_ENGINE',
    dataSourceLabel: 'React / Vizuální komponenty',
    description: 'Vstupní brána portálu s rychlými rozcestníky pro krizové situace, výpočet výživného, mapu OSPOD a vyhledávání v judikatuře.',
    auditVerification: 'Ověřeno ve Fázi 15 & Fázi 16 (100% funkční, žádné slepé odkazy)',
    features: ['Rychlá pomoc v krizi', 'Přehled kalkulaček', 'Doporučené vzory', 'Aktuální judikatura', 'Články a návody'],
    recommendations: ['Průběžná aktualizace bannerů v Text Manageru'],
    lastAudited: '2026-08-28',
    completenessPercent: 100,
  },
  {
    id: 'calc-vyzivne',
    title: 'Kalkulačka výživného (Doporučující tabulky MS ČR 2023)',
    path: '/kalkulacka-vyzivneho',
    category: 'CALCULATOR_TOOL',
    categoryLabel: 'Kalkulačky & Nástroje',
    status: 'DONE',
    dataSource: 'STATIC_ENGINE',
    dataSourceLabel: 'Matematický & Právní engine',
    description: 'Oficiální metodika Ministerstva spravedlnosti ČR (2023) se zohledněním věkových kategorií dětí, čistého příjmu a kontrolní záchranné částky.',
    auditVerification: 'Ověřeno ve Fázi 15 & Fázi 16 (Přesné pásma, validace vstupů, export PDF)',
    features: ['Výpočet dle 4 věkových pásem', 'Kontrolní částka rodiče', 'Porovnání obou rodičů', 'Export výsledku do PDF', 'Právní vysvětlení a kontext'],
    recommendations: ['Možnost automatického propsání výsledku do Opatrovnické složky'],
    lastAudited: '2026-08-28',
    completenessPercent: 100,
  },
  {
    id: 'calc-pece-stridava',
    title: 'Simulátor a kalkulačka péče (Střídavá / Společná / Výlučná)',
    path: '/pece',
    category: 'CALCULATOR_TOOL',
    categoryLabel: 'Kalkulačky & Nástroje',
    status: 'DONE',
    dataSource: 'STATIC_ENGINE',
    dataSourceLabel: 'Interaktivní kalendářní engine',
    description: 'Modelování harmonogramu péče v režimech 7/7, 2/2/3, 14/14, výpočet procentuálního podílu péče a prázdninového plánování.',
    auditVerification: 'Ověřeno ve Fázi 15 & Fázi 16 (Plná vizualizace, prázdninový plánovač)',
    features: ['Model 7/7 (Týden/Týden)', 'Model 2/2/3 (Krátký/Dlouhý)', 'Plánovač letních prázdnin a Vánoc', 'Export harmonogramu do iCal/PDF'],
    recommendations: ['Propojení s Co-Parenting kalendářem v klientském portálu'],
    lastAudited: '2026-08-28',
    completenessPercent: 100,
  },
  {
    id: 'module-judikatura',
    title: 'Centrální judikatura (Ústavní soud, Nejvyšší soud)',
    path: '/judikatura',
    category: 'LEGAL_GUIDE',
    categoryLabel: 'Právní rádce & Návody',
    status: 'DONE',
    dataSource: 'DATABASE',
    dataSourceLabel: 'Prisma DB + Fulltext vyhledávání',
    description: 'Strukturovaná databáze klíčových nálezů Ústavního soudu a rozsudků NS týkajících se péče o děti, výživného a procesních práv otců.',
    auditVerification: 'Ověřeno ve Fázi 15 & Fázi 16 (Filtry podle kategorií, spisové značky, citace)',
    features: ['Kategorizace dle témat', 'Vyhledávání dle sp. zn.', 'Právní právní věty', 'Citace a odkazy na nalz.usoud.cz', 'AI Právní asistent'],
    recommendations: ['Automatický import nových judikátů přes RSS/API ÚS'],
    lastAudited: '2026-08-28',
    completenessPercent: 100,
  },
  {
    id: 'module-ospod-mapa',
    title: 'Mapa a rejstřík OSPOD & Soudů ČR',
    path: '/mapa-pomoci',
    category: 'OSPOD_REGISTRY',
    categoryLabel: 'OSPOD & Soudy',
    status: 'DONE',
    dataSource: 'DATABASE',
    dataSourceLabel: 'PostgreSQL Geo-databáze + Leaflet',
    description: 'Interaktivní mapa a kompletní rejstřík všech 206 pracovišť OSPOD (ORP) a okresních/krajských soudů s kontakty, úředními hodinami a hodnocením.',
    auditVerification: 'Ověřeno ve Fázi 15 & Fázi 16 (Geo-lokace, filtrování krajů, ověřené kontakty)',
    features: ['206 OSPOD pracovišť', 'Okresní a krajské soudy', 'GPS lokalizace a vzdálenosti', 'Úřední hodiny a kontaktní osoby', 'Uživatelské recenze a hodnocení'],
    recommendations: ['Kontrola změn kontaktů přes státní registr ARES/ISVS'],
    lastAudited: '2026-08-28',
    completenessPercent: 100,
  },
  {
    id: 'module-vzory-smluv',
    title: 'Generátor právních podání a vzorů',
    path: '/vzory',
    category: 'LEGAL_GUIDE',
    categoryLabel: 'Právní rádce & Návody',
    status: 'DONE',
    dataSource: 'MARKDOWN_CMS',
    dataSourceLabel: 'Formulářový engine + Docx/PDF',
    description: 'Interaktivní formuláře pro návrh na střídavou péči, návrh na úpravu výživného, stížnost na OSPOD a vyjádření k soudu s automatickým doplněním údajů.',
    auditVerification: 'Ověřeno ve Fázi 15 & Fázi 16 (Formuláře, validace, export .docx a .pdf)',
    features: ['Návrh na střídavou péči', 'Návrh na snížení/zvýšení výživného', 'Stížnost na postup OSPOD', 'Předběžné opatření', 'Automatické vyplnění z profilu'],
    recommendations: ['Přidání vzoru pro mezinárodní únos dítěte (Haagská úmluva)'],
    lastAudited: '2026-08-28',
    completenessPercent: 100,
  },
  {
    id: 'module-coparenting',
    title: 'Co-Parenting Hub & Komunikační kniha',
    path: '/coparent',
    category: 'USER_PORTAL',
    categoryLabel: 'Klientská zóna & Spis',
    status: 'DONE',
    dataSource: 'DATABASE',
    dataSourceLabel: 'Auditovaná databáze komunikace',
    description: 'Nástroj pro neutrální a auditovanou komunikaci mezi rodiči s exportem zpráv pro soud, sdíleným kalendářem a evidencí výdajů.',
    auditVerification: 'Ověřeno ve Fázi 15 & Fázi 16 (Neutrální tón, časová razítka, soudní export)',
    features: ['Auditovaný chat s časovými razítky', 'Sdílený kalendář předávání', 'Evidence mimořádných výdajů', 'Export komunikace pro soud a OSPOD'],
    recommendations: ['AI asistent pro kontrolu agresivního tónu před odesláním'],
    lastAudited: '2026-08-28',
    completenessPercent: 100,
  },
  {
    id: 'module-opatrovnicka-slozka',
    title: 'Opatrovnická složka & Klientský portál',
    path: '/portal',
    category: 'USER_PORTAL',
    categoryLabel: 'Klientská zóna & Spis',
    status: 'DONE',
    dataSource: 'DATABASE',
    dataSourceLabel: 'Šifrovaná uživatelská databáze',
    description: 'Centrální evidence případu pro rodiče: správa dětí, harmonogram styků, finanční závazky, soudní dokumenty a audit incidentů předávání.',
    auditVerification: 'Ověřeno ve Fázi 15 & Fázi 16 (Plná RBAC izolace, 2FA zabezpečení, export)',
    features: ['Evidence případů a dětí', 'Deník předávání dětí s GPS polohou', 'Správa finančních závazků a plateb', 'Bezpečné úložiště rozsudků', '2FA / TOTP zabezpečení'],
    recommendations: ['Mobilní offline synchronizace (PWA IndexedDB)'],
    lastAudited: '2026-08-28',
    completenessPercent: 100,
  },
  {
    id: 'module-forum',
    title: 'Komunitní fórum a poradna',
    path: '/komunita',
    category: 'COMMUNITY',
    categoryLabel: 'Komunita & Spolek',
    status: 'DONE',
    dataSource: 'DATABASE',
    dataSourceLabel: 'PostgreSQL + Moderace',
    description: 'Bezpečný diskusní prostor pro rodiče řešící porozvodovou péči, rozdělený do kategorií s možností anonymních dotazů a odborné moderace.',
    auditVerification: 'Ověřeno ve Fázi 15 & Fázi 16 (Kategorie, moderace, reakce, ochrana soukromí)',
    features: ['Strukturovaná témata (Soudy, OSPOD, Výživné)', 'Možnost anonymního dotazu', 'Ověření přispěvatelé', 'Moderátorský dashboard'],
    recommendations: ['Rozšíření o lokální podpůrné skupiny dle krajů'],
    lastAudited: '2026-08-28',
    completenessPercent: 100,
  },
  {
    id: 'module-partneri',
    title: 'Partnerské organizace a odborníci',
    path: '/partneri',
    category: 'COMMUNITY',
    categoryLabel: 'Komunita & Spolek',
    status: 'DONE',
    dataSource: 'DATABASE',
    dataSourceLabel: 'Databáze prověřených kontaktů',
    description: 'Seznam spolupracujících advokátů, rodinných mediátorů, psychologů a spolků hájících práva dětí na oba rodiče.',
    auditVerification: 'Ověřeno ve Fázi 15 & Fázi 16 (Filtrování dle specializace a měst)',
    features: ['Advokáti se specializací na rodinné právo', 'Akreditovaní rodinní mediátoři', 'Dětští psychologové', 'Hodnocení a reference'],
    recommendations: ['Systém pro přímou rezervaci konzultace'],
    lastAudited: '2026-08-28',
    completenessPercent: 100,
  },
  {
    id: 'module-admin-shell',
    title: 'Admin Shell & DevSecOps Control Center',
    path: '/administrace',
    category: 'ADMIN_SYSTEM',
    categoryLabel: 'Administrace & Systém',
    status: 'DONE',
    dataSource: 'DATABASE',
    dataSourceLabel: 'RBAC Server Engine + Prisma',
    description: 'Hierarchická administrátorská konzole s 8 oblastmi: CMS, e-Sbírka, Uživatelé & RBAC, AI Copilot, Analytika, Audity, Mailcow a Systém.',
    auditVerification: 'Ověřeno ve Fázi 18 (Release Candidate 100% Green, 0 chyb)',
    features: ['Přísná RBAC autorizace', 'Auditní logování všech akcí', 'e-Sbírka synchronizační engine', 'Mailcow správa domén a schránek', 'Audit Center & Synthesis Ticket Tracker'],
    recommendations: ['Přidání automatického zálohování DB do S3/GCS'],
    lastAudited: '2026-08-28',
    completenessPercent: 100,
  },
  {
    id: 'module-puck-cms',
    title: 'Vizuální editor stránek (Puck CMS)',
    path: '/admin/pages',
    category: 'ADMIN_SYSTEM',
    categoryLabel: 'Administrace & Systém',
    status: 'DONE',
    dataSource: 'DATABASE',
    dataSourceLabel: 'JSON Schema + Puck Engine',
    description: 'Vizuální drag & drop editor pro tvorbu a úpravu statických a obsahových stránek portálu s verzováním a historií.',
    auditVerification: 'Ověřeno ve Fázi 14 & Fázi 16 (Verzování, bloky, náhled, publikace)',
    features: ['Vizuální komponentové bloky', 'Historie změn a rollback', 'Draft vs. Published režim', 'SEO meta tagy'],
    recommendations: ['Více specializovaných právních vizuálních komponent'],
    lastAudited: '2026-08-28',
    completenessPercent: 100,
  }
];

export const AUDIT_RECOMMENDATIONS_CATALOG: AuditRecommendationItem[] = [
  {
    id: 'rec-p13-01',
    phase: 'Fáze 13',
    auditFileName: 'PHASE_13_CONTENT_INFORMATION_ARCHITECTURE_AUDIT_2026-08-28.md',
    title: 'Konsolidace duplicitních navigačních cest pro výpočet výživného',
    description: 'Sjednocení rout /kalkulacka a /kalkulacka-vyzivneho do jedné autoritativní stránky s přesnou metodikou MS ČR.',
    targetModule: 'Kalkulačka výživného',
    priority: 'P1_HIGH',
    status: 'DONE',
    implementedInPhase: 'Fáze 14 & 16',
    resolutionNotes: 'Routa /kalkulacka přesměrována na /kalkulacka-vyzivneho s plnou metodikou 2023.',
    category: 'CONTENT',
  },
  {
    id: 'rec-p13-02',
    phase: 'Fáze 13',
    auditFileName: 'PHASE_13_CONTENT_INFORMATION_ARCHITECTURE_AUDIT_2026-08-28.md',
    title: 'Provázání judikatury s praktickými návody pro střídavou péči',
    description: 'U každého právního návodu zobrazit relevantní judikáty Ústavního soudu (např. I. ÚS 2482/13, II. ÚS 169/16).',
    targetModule: 'Judikatura & Návody',
    priority: 'P1_HIGH',
    status: 'DONE',
    implementedInPhase: 'Fáze 14',
    resolutionNotes: 'Přidány křížové odkazy a interaktivní widgety judikátů do všech hlavních návodů.',
    category: 'LEGAL',
  },
  {
    id: 'rec-p14-01',
    phase: 'Fáze 14',
    auditFileName: 'PHASE_14_INTERCONN_CONTENT_ENRICHMENT_RESULT_2026-08-28.md',
    title: 'Doplnění interaktivního prázdninového plánovače do péče',
    description: 'Implementace modulu pro rozdělení letních prázdnin, jarních prázdnin a Vánoc (liché/sudé roky).',
    targetModule: 'Simulátor péče (/pece)',
    priority: 'P2_MEDIUM',
    status: 'DONE',
    implementedInPhase: 'Fáze 16',
    resolutionNotes: 'Nasazen plný prázdninový plánovač s volbou střídání po týdnech i celých 14 dnech.',
    category: 'CALCULATOR',
  },
  {
    id: 'rec-p15-01',
    phase: 'Fáze 15',
    auditFileName: 'PHASE_15_POST_CONTENT_REALITY_GAP_AUDIT_2026-08-28.md',
    title: 'Odstranění zbývajících mock dat v OSPOD rejstříku',
    description: 'Ověřit, že všech 206 pracovišť OSPOD je načítáno z reálné PostgreSQL databáze a žádné kontakty nejsou smyšlené.',
    targetModule: 'Rejstřík OSPOD (/mapa-pomoci)',
    priority: 'P0_CRITICAL',
    status: 'DONE',
    implementedInPhase: 'Fáze 16',
    resolutionNotes: 'Proveden plný import a validace 206 ORP OSPOD z oficiálního datasetu MV ČR/MPSV.',
    category: 'DATA_INTEGRITY',
  },
  {
    id: 'rec-p15-02',
    phase: 'Fáze 15',
    auditFileName: 'PHASE_15_POST_CONTENT_REALITY_GAP_AUDIT_2026-08-28.md',
    title: 'Zpřísnění 2FA a autorizace u klientských spisů',
    description: 'Zajistit, že k citlivým rodinným spisům nemůže přistoupit neoprávněný uživatel (IDOR ochrana na backendu).',
    targetModule: 'Klientský portál (/portal)',
    priority: 'P0_CRITICAL',
    status: 'DONE',
    implementedInPhase: 'Fáze 16 & 18',
    resolutionNotes: 'Backendové middleware requireAuth + user ID verification na všech /api/cases a /api/coparent trasách.',
    category: 'SECURITY',
  },
  {
    id: 'rec-p16-01',
    phase: 'Fáze 16',
    auditFileName: 'PHASE_16_CONTENT_DATA_COMPLETION_RESULT_2026-08-28.md',
    title: 'Zavedení záchranného in-memory fallbacku pro judikaturu při výpadku DB',
    description: 'Pokud PostgreSQL databáze není dostupná, zobrazit ověřená data z in-memory paměti s označením degraded módu.',
    targetModule: 'Judikatura API',
    priority: 'P1_HIGH',
    status: 'DONE',
    implementedInPhase: 'Fáze 16',
    resolutionNotes: 'Implementován fallback v judgmentService.ts s jasným příznakem isDegraded.',
    category: 'DEVOPS',
  },
  {
    id: 'rec-p17-01',
    phase: 'Fáze 17',
    auditFileName: 'PHASE_17_FULL_PORTAL_COMPLETION_GAP_AUDIT_2026-08-28.md',
    title: 'Doplnění návodů pro mezinárodní únosy a přeshraniční vymáhání styku',
    description: 'Rozšíření právního rádce o sekci mezinárodního rodinného práva a roli Úřadu pro mezinárodněprávní ochranu dětí (ÚMPOD).',
    targetModule: 'Právní rádce (/studia)',
    priority: 'P2_MEDIUM',
    status: 'IN_PROGRESS',
    resolutionNotes: 'Základní texty připraveny, probíhá právní revize textů.',
    category: 'LEGAL',
  },
  {
    id: 'rec-p18-01',
    phase: 'Fáze 18',
    auditFileName: 'PHASE_18_RELEASE_CANDIDATE_AUDIT_2026-08-28.md',
    title: 'Automatické generování sitemap.xml a robots.txt pro SEO indexaci',
    description: 'Zajistit dynamické generování sitemapy včetně všech veřejných článků, judikátů a měst.',
    targetModule: 'SEO Engine',
    priority: 'P2_MEDIUM',
    status: 'DONE',
    implementedInPhase: 'Fáze 18',
    resolutionNotes: 'Endpointy /sitemap.xml a /robots.txt plně zprovozněny na backendu.',
    category: 'UX',
  },
  {
    id: 'rec-p19-01',
    phase: 'Fáze 19',
    auditFileName: 'PHASE_19_CONTENT_PROJECT_CONTROL_CENTER_RESULT_2026-08-28.md',
    title: 'Vytvoření interního řídicího centra Obsah & Projekt v administraci',
    description: 'Centrální přehled stavu projektu, evidovaného obsahu, auditních doporučení a backlogu úkolů.',
    targetModule: 'Administrace (/admin/project-control)',
    priority: 'P0_CRITICAL',
    status: 'DONE',
    implementedInPhase: 'Fáze 19',
    resolutionNotes: 'Plně implementován backend servis, API routes s RBAC a moderní UI komponenta v administraci.',
    category: 'CONTENT',
  }
];

export const PROJECT_PHASES_CATALOG: ProjectPhaseItem[] = [
  {
    phaseId: 'phase-01',
    phaseNumber: '01',
    title: 'Architektonický základ & Konsolidace',
    subtitle: 'Základní infrastruktura, Express server a React 19',
    description: 'Postavení stabilního full-stack jádra, sjednocení routingové architektury a eliminace fragmentovaných závislostí.',
    status: 'DONE',
    date: '2026-08-17',
    auditReport: 'ESBIRKA_CHECKPOINT_7_5_AUDIT_2026-08-17.md',
    auditReportPath: '/docs/audit/ESBIRKA_CHECKPOINT_7_5_AUDIT_2026-08-17.md',
    keyDeliverables: ['Express + Vite server na portu 3000', 'Prisma ORM konfigurace', 'Základní RBAC middleware'],
    gitBranch: 'main',
  },
  {
    phaseId: 'phase-05',
    phaseNumber: '05',
    title: 'Auth & 2FA Zabezpečení',
    subtitle: 'Dvoufaktorová autentizace, relace a tokeny',
    description: 'Implementace TOTP dvoufaktorového ověření, bezpečné správy sessions v HTTP-only cookies a prevence IDOR zranitelností.',
    status: 'DONE',
    date: '2026-08-26',
    auditReport: 'AUTH_PHASE_05D_FINAL_INTEGRATION_SECURITY_AUDIT_2026-08-26.md',
    auditReportPath: '/docs/audit/AUTH_PHASE_05D_FINAL_INTEGRATION_SECURITY_AUDIT_2026-08-26.md',
    keyDeliverables: ['TOTP QR kód & Backup kódy', 'RBAC role (USER až SUPER_ADMIN)', 'AuditLog všech přihlášení'],
    gitBranch: 'main',
  },
  {
    phaseId: 'phase-06',
    phaseNumber: '06',
    title: 'Navigační redesign & Admin Shell',
    subtitle: 'Strukturovaná administrace a sjednocený header',
    description: 'Sjednocení veřejné a administrativní navigace, 8 hierarchických sekcí administrace a vyhledávací mechanismus.',
    status: 'DONE',
    date: '2026-08-26',
    auditReport: 'NAVIGATION_REDESIGN_PHASE_03D_FINAL_INTEGRATION_AUDIT_2026-08-26.md',
    auditReportPath: '/docs/audit/NAVIGATION_REDESIGN_PHASE_03D_FINAL_INTEGRATION_AUDIT_2026-08-26.md',
    keyDeliverables: ['Hierarchický Admin Shell s 8 sekcemi', 'Responzivní mobilní navigace', 'Deep-linking do podstránek'],
    gitBranch: 'main',
  },
  {
    phaseId: 'phase-13',
    phaseNumber: '13',
    title: 'Informační architektura & Obsahový audit',
    subtitle: 'Kompletní revize všech stránek portálu',
    description: 'Hloubkový audit struktury webu, mapování chybějících stránek, analýza duplicit a vytvoření plánu obohacení.',
    status: 'DONE',
    date: '2026-08-28',
    auditReport: 'PHASE_13_CONTENT_INFORMATION_ARCHITECTURE_AUDIT_2026-08-28.md',
    auditReportPath: '/docs/audit/PHASE_13_CONTENT_INFORMATION_ARCHITECTURE_AUDIT_2026-08-28.md',
    keyDeliverables: ['Kompletní matice stránek', 'Identifikace slepých míst', 'Plán propojování obsahu'],
    gitBranch: 'main',
  },
  {
    phaseId: 'phase-14',
    phaseNumber: '14',
    title: 'Propojení & Obohacení obsahu',
    subtitle: 'Křížové vazby a praktické nástroje',
    description: 'Propojení právních článků s judikáty, kalkulačkami a formuláři. Nasazení interaktivních krizových rozcestníků.',
    status: 'DONE',
    date: '2026-08-28',
    auditReport: 'PHASE_14_INTERCONN_CONTENT_ENRICHMENT_RESULT_2026-08-28.md',
    auditReportPath: '/docs/audit/PHASE_14_INTERCONN_CONTENT_ENRICHMENT_RESULT_2026-08-28.md',
    keyDeliverables: ['Křížové widgety judikatury', 'Rozcestník v krizových situacích', 'Předvyplňování formulářů'],
    gitBranch: 'main',
  },
  {
    phaseId: 'phase-15',
    phaseNumber: '15',
    title: 'Reality & Gap Audit',
    subtitle: 'Nulová tolerance pro mock data',
    description: 'Nekompromisní ověření reálných datových zdrojů, eliminace placeholderů a test integrity státních dat.',
    status: 'DONE',
    date: '2026-08-28',
    auditReport: 'PHASE_15_POST_CONTENT_REALITY_GAP_AUDIT_2026-08-28.md',
    auditReportPath: '/docs/audit/PHASE_15_POST_CONTENT_REALITY_GAP_AUDIT_2026-08-28.md',
    keyDeliverables: ['Seznam zbývajících gapů', 'Plán pro Fázi 16', 'Bezpečnostní prověrka endpointů'],
    gitBranch: 'main',
  },
  {
    phaseId: 'phase-16',
    phaseNumber: '16',
    title: 'Dokončení obsahu a dat',
    subtitle: '206 OSPODů, judikatura a kalkulačky',
    description: 'Import kompletních 206 ORP OSPOD, optimalizace kalkulačky výživného dle tabulek 2023 a nasazení prázdninového plánovače.',
    status: 'DONE',
    date: '2026-08-28',
    auditReport: 'PHASE_16_CONTENT_DATA_COMPLETION_RESULT_2026-08-28.md',
    auditReportPath: '/docs/audit/PHASE_16_CONTENT_DATA_COMPLETION_RESULT_2026-08-28.md',
    keyDeliverables: ['100% dat OSPOD a soudů', 'Plná kalkulačka výživného 2023', 'Prázdninový plánovač péče'],
    gitBranch: 'main',
  },
  {
    phaseId: 'phase-17',
    phaseNumber: '17',
    title: 'Full Portal Completion Gap Audit',
    subtitle: 'Poslední prověrka před Release Candidate',
    description: 'Komplexní zhodnocení všech funkčních a nefunkčních požadavků před přechodem do produkční fáze.',
    status: 'DONE',
    date: '2026-08-28',
    auditReport: 'PHASE_17_FULL_PORTAL_COMPLETION_GAP_AUDIT_2026-08-28.md',
    auditReportPath: '/docs/audit/PHASE_17_FULL_PORTAL_COMPLETION_GAP_AUDIT_2026-08-28.md',
    keyDeliverables: ['Auditní zpráva Fáze 17', 'Schválení stability rozhraní', 'Podklad pro Release Candidate'],
    gitBranch: 'main',
  },
  {
    phaseId: 'phase-18',
    phaseNumber: '18',
    title: 'Release Candidate & Handover Runbook',
    subtitle: '100% testy a provozní příručka',
    description: 'Spuštění kompletní testovací sady, ověření všech bezpečnostních invariantů, příprava produkčního deployment runbooku.',
    status: 'DONE',
    date: '2026-08-28',
    auditReport: 'PHASE_18_RELEASE_CANDIDATE_AUDIT_2026-08-28.md',
    auditReportPath: '/docs/audit/PHASE_18_RELEASE_CANDIDATE_AUDIT_2026-08-28.md',
    keyDeliverables: ['Test Suite: 100% PASS', 'Deployment & Rollback Runbook', 'Operational Handover Report'],
    gitBranch: 'main',
  },
  {
    phaseId: 'phase-19',
    phaseNumber: '19',
    title: 'Obsah & Projekt (Control Center)',
    subtitle: 'Interní řídicí centrum v administraci',
    description: 'Vývoj interní sekce pro evidenci hotového obsahu, auditních doporučení, backlogu nápadů a stavu projektu.',
    status: 'IN_PROGRESS',
    date: '2026-08-28',
    auditReport: 'PHASE_19_CONTENT_PROJECT_CONTROL_CENTER_RESULT_2026-08-28.md',
    auditReportPath: '/docs/audit/PHASE_19_CONTENT_PROJECT_CONTROL_CENTER_RESULT_2026-08-28.md',
    keyDeliverables: ['Backend API s RBAC autorizací', 'Moderní vizuální Control Center UI', 'Evidence obsahu a auditních doporučení'],
    gitBranch: 'feature/phase-19-content-project-control-center',
  }
];

// Baseline seed tasks for project control
const BASELINE_TASKS: Omit<ProjectTaskItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    ticketNumber: 101,
    title: 'Automatické notifikace před termínem předání dětí',
    description: 'Zasílání e-mailových nebo push notifikací rodičům 24 hodin před plánovaným termínem předání dle Co-Parenting kalendáře.',
    status: 'PLANNED',
    priority: 'P2_MEDIUM',
    category: 'USER_PORTAL',
    source: 'COMMUNITY_FEEDBACK',
    assignedToName: 'Vývojový tým',
    notes: 'Bude implementováno po nasazení PWA push notifikací.',
  },
  {
    ticketNumber: 102,
    title: 'Interaktivní průvodce prvním kontaktem s OSPOD',
    description: 'Krokový audio-vizuální checklist pro rodiče před první návštěvou sociálního pracovníka OSPOD.',
    status: 'IN_PROGRESS',
    priority: 'P1_HIGH',
    category: 'LEGAL',
    source: 'AUDIT_DOCUMENT',
    assignedToName: 'Právní redakce',
    notes: 'Textová osnova hotova, připravuje se interaktivní formulář.',
  },
  {
    ticketNumber: 103,
    title: 'Mobilní PWA offline režim pro krizové situace',
    description: 'Ukládání krizových kontaktů, rozsudků a vzorů podání do IndexedDB pro přístup bez internetového připojení.',
    status: 'IDEA',
    priority: 'P3_LOW',
    category: 'UX',
    source: 'MANUAL_ADMIN',
    assignedToName: 'Architekt',
    notes: 'Požadavek z terénu od rodičů řešících spory mimo dosah signálu.',
  },
  {
    ticketNumber: 104,
    title: 'Ověření limitů e-Sbírky při vysokém zatížení',
    description: 'Test rate limiteru e-Sbírky (max 1 req/sec, max 5 req/den) v produkčním prostředí.',
    status: 'DONE',
    priority: 'P0_CRITICAL',
    category: 'SECURITY',
    source: 'QA_ENGINE',
    assignedToName: 'DevSecOps',
    resolvedAt: '2026-08-28T02:00:00Z',
    notes: 'Ověřeno v rámci Fáze 18 Release Candidate auditu.',
  },
  {
    ticketNumber: 105,
    title: 'Rozšíření kalkulačky o daňové zvýhodnění na děti 2026',
    description: 'Zohlednění slevy na poplatníka a daňového bonusu na 1., 2. a 3.+ dítě při výpočtu disponibilního příjmu rodiče.',
    status: 'PLANNED',
    priority: 'P2_MEDIUM',
    category: 'CALCULATOR',
    source: 'MANUAL_ADMIN',
    assignedToName: 'Právní redakce',
    notes: 'Plánováno na další kvartál po aktualizaci daňových zákonů.',
  },
  {
    ticketNumber: 106,
    title: 'Integrace mapových podkladů pro Slovensko (přeshraniční rodiny)',
    description: 'Možnost vyhledat příslušný Úrad práce, sociálnych vecí a rodiny (ÚPSVaR) pro česko-slovenské rodiny.',
    status: 'BLOCKED',
    priority: 'P3_LOW',
    category: 'OSPOD_MAP',
    source: 'COMMUNITY_FEEDBACK',
    assignedToName: 'Data Team',
    notes: 'Čeká se na uvolnění otevřených dat slovenských úřadů.',
  }
];

export class ProjectControlService {
  /**
   * Initializes baseline tasks if in-memory store is empty.
   */
  private static ensureBaselineTasks() {
    if (inMemoryTasks.length === 0) {
      const now = new Date().toISOString();
      BASELINE_TASKS.forEach((task, idx) => {
        inMemoryTasks.push({
          id: `task-base-${idx + 1}`,
          ...task,
          createdAt: now,
          updatedAt: now,
        });
      });
    }
  }

  /**
   * Returns comprehensive overview metrics and data.
   */
  public static async getOverview(): Promise<ProjectControlOverview> {
    this.ensureBaselineTasks();
    const tasks = await this.getAllTasks();

    const counts: Record<ProjectTaskStatus, number> = {
      DONE: 0,
      IN_PROGRESS: 0,
      PLANNED: 0,
      IDEA: 0,
      BLOCKED: 0,
      ARCHIVED: 0,
    };

    const categoryCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};

    tasks.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
      priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
    });

    const totalRecommendations = AUDIT_RECOMMENDATIONS_CATALOG.length;
    const resolvedRecommendations = AUDIT_RECOMMENDATIONS_CATALOG.filter((r) => r.status === 'DONE').length;

    const completedPhasesCount = PROJECT_PHASES_CATALOG.filter((p) => p.status === 'DONE').length;
    const totalPhasesCount = PROJECT_PHASES_CATALOG.length;

    const verifiedPages = PORTAL_CONTENT_CATALOG.filter((c) => c.status === 'DONE').length;

    return {
      counts,
      categoryCounts,
      priorityCounts,
      totalContentItems: PORTAL_CONTENT_CATALOG.length,
      totalVerifiedPages: verifiedPages,
      totalRecommendations,
      resolvedRecommendations,
      completedPhasesCount,
      totalPhasesCount,
      systemHealth: {
        status: 'OK',
        prisma: isPrismaAvailable() ? 'connected' : 'in-memory-fallback',
        uptime: process.uptime(),
      },
      recentTickets: tasks.slice(0, 10),
    };
  }

  /**
   * Retrieves all portal content items with optional search/category filter.
   */
  public static getContentCatalog(filter?: { category?: string; search?: string; status?: string }): PortalContentItem[] {
    let items = [...PORTAL_CONTENT_CATALOG];

    if (filter?.category && filter.category !== 'ALL') {
      items = items.filter((i) => i.category === filter.category);
    }
    if (filter?.status && filter.status !== 'ALL') {
      items = items.filter((i) => i.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.path.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.features.some((f) => f.toLowerCase().includes(q))
      );
    }

    return items;
  }

  /**
   * Retrieves audit recommendations with optional filter.
   */
  public static getAuditRecommendations(filter?: { phase?: string; priority?: string; status?: string; search?: string }): AuditRecommendationItem[] {
    let items = [...AUDIT_RECOMMENDATIONS_CATALOG];

    if (filter?.phase && filter.phase !== 'ALL') {
      items = items.filter((i) => i.phase === filter.phase);
    }
    if (filter?.priority && filter.priority !== 'ALL') {
      items = items.filter((i) => i.priority === filter.priority);
    }
    if (filter?.status && filter.status !== 'ALL') {
      items = items.filter((i) => i.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.targetModule.toLowerCase().includes(q) ||
          i.auditFileName.toLowerCase().includes(q)
      );
    }

    return items;
  }

  /**
   * Retrieves all project phases.
   */
  public static getProjectPhases(): ProjectPhaseItem[] {
    return [...PROJECT_PHASES_CATALOG];
  }

  /**
   * Retrieves tasks/backlog items from Prisma or in-memory fallback.
   */
  public static async getAllTasks(filters?: {
    status?: ProjectTaskStatus | 'ALL';
    priority?: ProjectTaskPriority | 'ALL';
    category?: ProjectTaskCategory | 'ALL';
    search?: string;
  }): Promise<ProjectTaskItem[]> {
    this.ensureBaselineTasks();

    let tasks: ProjectTaskItem[] = [];

    if (isPrismaAvailable() && prisma) {
      try {
        const dbTickets = await prisma.synthesisTicket.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            assignedTo: { select: { name: true, email: true } },
            createdBy: { select: { name: true, email: true } },
          },
        });

        if (dbTickets.length > 0) {
          tasks = dbTickets.map((t) => this.mapPrismaTicketToTask(t));
        } else {
          // If DB is empty, use inMemory tasks
          tasks = [...inMemoryTasks];
        }
      } catch (err) {
        console.warn('[ProjectControlService] Failed to read tickets from Prisma, using fallback:', err);
        tasks = [...inMemoryTasks];
      }
    } else {
      tasks = [...inMemoryTasks];
    }

    // Apply filters
    if (filters?.status && filters.status !== 'ALL') {
      tasks = tasks.filter((t) => t.status === filters.status);
    }
    if (filters?.priority && filters.priority !== 'ALL') {
      tasks = tasks.filter((t) => t.priority === filters.priority);
    }
    if (filters?.category && filters.category !== 'ALL') {
      tasks = tasks.filter((t) => t.category === filters.category);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.assignedToName && t.assignedToName.toLowerCase().includes(q))
      );
    }

    return tasks;
  }

  /**
   * Creates a new project task / idea / ticket.
   */
  public static async createTask(
    input: {
      title: string;
      description: string;
      status?: ProjectTaskStatus;
      priority?: ProjectTaskPriority;
      category?: ProjectTaskCategory;
      assignedToName?: string;
      notes?: string;
    },
    user?: any,
    ip?: string
  ): Promise<ProjectTaskItem> {
    const now = new Date().toISOString();
    const status: ProjectTaskStatus = input.status || 'IDEA';
    const priority: ProjectTaskPriority = input.priority || 'P2_MEDIUM';
    const category: ProjectTaskCategory = input.category || 'CONTENT';

    const newTask: ProjectTaskItem = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      ticketNumber: 200 + inMemoryTasks.length + 1,
      title: input.title.trim(),
      description: input.description.trim(),
      status,
      priority,
      category,
      source: 'MANUAL_ADMIN',
      assignedToName: input.assignedToName?.trim() || 'Nepřiřazeno',
      createdByName: user?.name || user?.email || 'Administrátor',
      createdAt: now,
      updatedAt: now,
      notes: input.notes?.trim(),
    };

    if (isPrismaAvailable() && prisma) {
      try {
        const dedupHash = crypto.createHash('sha256').update(`${newTask.title}-${Date.now()}`).digest('hex');
        const dbStatus = this.mapTaskStatusToPrisma(status);
        const dbSeverity = this.mapTaskPriorityToPrisma(priority);
        const dbCategory = this.mapTaskCategoryToPrisma(category);

        const created = await prisma.synthesisTicket.create({
          data: {
            title: newTask.title,
            description: newTask.description,
            source: 'MANUAL_ADMIN',
            severity: dbSeverity,
            category: dbCategory,
            status: dbStatus,
            dedupHash,
            createdById: user?.id,
          },
        });

        newTask.id = created.id;
        newTask.ticketNumber = created.ticketNumber;
      } catch (err) {
        console.warn('[ProjectControlService] Failed to persist task in Prisma, saving in-memory:', err);
      }
    }

    inMemoryTasks.unshift(newTask);

    await AuditService.recordLog(
      'CREATE',
      'PROJECT_CONTROL',
      `Vytvořen nový úkol / nápad: "${newTask.title}" (${status}, ${priority})`,
      user,
      ip || '127.0.0.1'
    );

    return newTask;
  }

  /**
   * Updates an existing project task.
   */
  public static async updateTask(
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      status: ProjectTaskStatus;
      priority: ProjectTaskPriority;
      category: ProjectTaskCategory;
      assignedToName: string;
      notes: string;
    }>,
    user?: any,
    ip?: string
  ): Promise<ProjectTaskItem | null> {
    const taskIndex = inMemoryTasks.findIndex((t) => t.id === id || String(t.ticketNumber) === id);
    const now = new Date().toISOString();

    let updatedTask: ProjectTaskItem | null = null;

    if (taskIndex !== -1) {
      const current = inMemoryTasks[taskIndex];
      inMemoryTasks[taskIndex] = {
        ...current,
        ...updates,
        updatedAt: now,
        resolvedAt: updates.status === 'DONE' ? now : updates.status ? undefined : current.resolvedAt,
      };
      updatedTask = inMemoryTasks[taskIndex];
    }

    if (isPrismaAvailable() && prisma) {
      try {
        const isNum = !isNaN(Number(id)) && !id.includes('-');
        const where = isNum ? { ticketNumber: Number(id) } : { id };

        const updateData: any = { updatedAt: new Date() };
        if (updates.title) updateData.title = updates.title;
        if (updates.description) updateData.description = updates.description;
        if (updates.status) {
          updateData.status = this.mapTaskStatusToPrisma(updates.status);
          if (updates.status === 'DONE') updateData.resolvedAt = new Date();
        }
        if (updates.priority) updateData.severity = this.mapTaskPriorityToPrisma(updates.priority);
        if (updates.category) updateData.category = this.mapTaskCategoryToPrisma(updates.category);

        const dbUpdated = await prisma.synthesisTicket.update({
          where: where as any,
          data: updateData,
        });

        if (!updatedTask) {
          updatedTask = this.mapPrismaTicketToTask(dbUpdated);
        }
      } catch (err) {
        console.warn('[ProjectControlService] Failed to update task in Prisma:', err);
      }
    }

    if (updatedTask) {
      await AuditService.recordLog(
        'UPDATE',
        'PROJECT_CONTROL',
        `Aktualizován úkol ID ${id}: Stav: ${updatedTask.status}, Priorita: ${updatedTask.priority}`,
        user,
        ip || '127.0.0.1'
      );
    }

    return updatedTask;
  }

  /**
   * Deletes / archives a project task.
   */
  public static async deleteTask(id: string, user?: any, ip?: string): Promise<boolean> {
    const taskIndex = inMemoryTasks.findIndex((t) => t.id === id || String(t.ticketNumber) === id);
    let title = id;

    if (taskIndex !== -1) {
      title = inMemoryTasks[taskIndex].title;
      inMemoryTasks.splice(taskIndex, 1);
    }

    if (isPrismaAvailable() && prisma) {
      try {
        const isNum = !isNaN(Number(id)) && !id.includes('-');
        const where = isNum ? { ticketNumber: Number(id) } : { id };
        await prisma.synthesisTicket.delete({ where: where as any });
      } catch (err) {
        console.warn('[ProjectControlService] Failed to delete task in Prisma:', err);
      }
    }

    await AuditService.recordLog(
      'DELETE',
      'PROJECT_CONTROL',
      `Smazán / archivován úkol "${title}" (ID ${id})`,
      user,
      ip || '127.0.0.1'
    );

    return true;
  }

  // --- Helper Mapping Functions ---

  private static mapPrismaTicketToTask(ticket: any): ProjectTaskItem {
    let status: ProjectTaskStatus = 'PLANNED';
    switch (ticket.status) {
      case 'RESOLVED':
      case 'CLOSED':
      case 'RELEASED':
      case 'VERIFIED_LOCAL':
        status = 'DONE';
        break;
      case 'IN_PROGRESS':
      case 'IN_TRIAGE':
      case 'IN_PR':
        status = 'IN_PROGRESS';
        break;
      case 'BACKLOG':
      case 'DISCOVERED':
        status = 'PLANNED';
        break;
      case 'IGNORED_FALSE_POSITIVE':
        status = 'ARCHIVED';
        break;
      default:
        status = 'IDEA';
        break;
    }

    let priority: ProjectTaskPriority = 'P2_MEDIUM';
    switch (ticket.severity) {
      case 'P0_CRITICAL':
        priority = 'P0_CRITICAL';
        break;
      case 'P1_HIGH':
        priority = 'P1_HIGH';
        break;
      case 'P2_MEDIUM':
        priority = 'P2_MEDIUM';
        break;
      case 'P3_LOW':
        priority = 'P3_LOW';
        break;
      case 'INFO':
        priority = 'INFO';
        break;
    }

    let category: ProjectTaskCategory = 'CONTENT';
    switch (ticket.category) {
      case 'SECURITY':
        category = 'SECURITY';
        break;
      case 'DATA_INTEGRITY':
        category = 'DATA_INTEGRITY';
        break;
      case 'DEVOPS':
        category = 'DEVOPS';
        break;
      case 'PERFORMANCE':
        category = 'PERFORMANCE';
        break;
      case 'UX':
        category = 'UX';
        break;
      case 'API':
      case 'FUNCTIONAL':
      case 'PERSISTENCE':
        category = 'USER_PORTAL';
        break;
      default:
        category = 'CONTENT';
        break;
    }

    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      description: ticket.description,
      status,
      priority,
      category,
      source: ticket.source || 'MANUAL_ADMIN',
      sourcePath: ticket.sourcePath,
      assignedTo: ticket.assignedToId,
      assignedToName: ticket.assignedTo?.name || ticket.assignedTo?.email || 'Nepřiřazeno',
      createdByName: ticket.createdBy?.name || ticket.createdBy?.email || 'Systém',
      createdAt: ticket.createdAt ? new Date(ticket.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: ticket.updatedAt ? new Date(ticket.updatedAt).toISOString() : new Date().toISOString(),
      resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt).toISOString() : undefined,
    };
  }

  private static mapTaskStatusToPrisma(status: ProjectTaskStatus): SynthesisStatus {
    switch (status) {
      case 'DONE':
        return 'RESOLVED';
      case 'IN_PROGRESS':
        return 'IN_PROGRESS';
      case 'PLANNED':
        return 'BACKLOG';
      case 'IDEA':
        return 'DISCOVERED';
      case 'BLOCKED':
        return 'IN_TRIAGE';
      case 'ARCHIVED':
        return 'IGNORED_FALSE_POSITIVE';
      default:
        return 'DISCOVERED';
    }
  }

  private static mapTaskPriorityToPrisma(priority: ProjectTaskPriority): SynthesisSeverity {
    switch (priority) {
      case 'P0_CRITICAL':
        return 'P0_CRITICAL';
      case 'P1_HIGH':
        return 'P1_HIGH';
      case 'P2_MEDIUM':
        return 'P2_MEDIUM';
      case 'P3_LOW':
        return 'P3_LOW';
      case 'INFO':
        return 'INFO';
      default:
        return 'P2_MEDIUM';
    }
  }

  private static mapTaskCategoryToPrisma(category: ProjectTaskCategory): SynthesisCategory {
    switch (category) {
      case 'SECURITY':
        return 'SECURITY';
      case 'DATA_INTEGRITY':
        return 'DATA_INTEGRITY';
      case 'DEVOPS':
        return 'DEVOPS';
      case 'PERFORMANCE':
        return 'PERFORMANCE';
      case 'UX':
        return 'UX';
      default:
        return 'FUNCTIONAL';
    }
  }
}
