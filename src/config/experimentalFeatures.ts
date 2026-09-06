import {
  ExperimentalFeature,
  ExperimentalFeatureCategory,
  ExperimentalFeatureStatus,
} from '../types/experimental';

export const EXPERIMENTAL_FEATURES: ExperimentalFeature[] = [
  // ==========================================
  // 5. AI / ORION FUNKCE
  // ==========================================
  {
    id: 'orion',
    name: 'Orion — Řízená AI entita',
    description: 'Centrální kognitivní entita Synthesis Hubu s perzistentním kontextem, pamětí a napojením na bezpečnostní Policy Engine.',
    category: 'ai',
    status: 'BETA',
    route: '/experimenty/orion',
    iconName: 'Cpu',
    backendCapability: 'orion_core',
    requiredRole: 'ADMIN',
    visible: true,
    experimental: true,
    implementationNote: {
      works: [
        'Orion Trace Mind Map vizualizace kognitivních toků v administraci',
        'Záznam systémových telemetrických stop a interakčních uzlů',
        'Auditování výstupů a kontrola zero privilege escalation',
      ],
      inProgressOrMissing: [
        'Dlouhodobá vektorová paměť na bázi RAG perzistence',
        'Autonomní plánování víceúrovňových operací s lidským schválením',
      ],
      technicalDetails: 'Řídí se globální instrukcí: RBAC + scopes + Policy Engine + audit trail. Default DENY.',
    },
    tags: ['AI', 'Orion', 'Kognitivní architektura'],
  },
  {
    id: 'ai-chat',
    name: 'AI Právní Asistent & Chat',
    description: 'Konverzační asistent pro rodiče poskytující orientaci v opatrovnickém právu a psychologii rodiny.',
    category: 'ai',
    status: 'READY',
    route: '/ai-asistent',
    iconName: 'MessageSquare',
    backendCapability: 'ai_chat',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Interaktivní chatové rozhraní s právním kontextem',
        'Serverový proxy endpoint chránící API klíče',
        'Právní disclaimery a bezpečnostní ohraničení',
      ],
      inProgressOrMissing: [
        'Přímé napojení na e-Sbírku s online verifikací znění zákonů',
        'Personalizovaná analýza nahraných dokumentů v chatu',
      ],
      technicalDetails: 'Server-side Gemini proxy, přísný zákaz generování halucinovaných paragrafů.',
    },
    tags: ['AI', 'Chat', 'Asistent'],
  },
  {
    id: 'agent-center',
    name: 'Agent Center',
    description: 'Administrační řídicí centrum pro monitorování, konfiguraci a správu všech specializovaných agentů.',
    category: 'ai',
    status: 'READY',
    route: '/administrace',
    iconName: 'LayoutDashboard',
    backendCapability: 'agent_center',
    requiredRole: 'ADMIN',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Přehled registrovaných agentních schopností v administraci',
        'Kontrola oprávnění přes ControlPlaneAuthorization',
        'Konfigurace limitů a operačních režimů',
      ],
      inProgressOrMissing: [
        'Vizuální editor orchestrace agentních workflow',
        'Multi-tenant oddělení pro další projekty nad Synthesis platformou',
      ],
      technicalDetails: 'Běží nad interní architekturou Unified Agent Layer (Phase 1).',
    },
    tags: ['AI', 'Agent', 'Admin'],
  },
  {
    id: 'agent-registry',
    name: 'Agent Registry',
    description: 'Centrální registr všech specializovaných agentů, jejich schopností, limitů a bezpečnostních politik.',
    category: 'ai',
    status: 'READY',
    route: '/experimenty/agent-registry',
    iconName: 'Database',
    backendCapability: 'agent_registry',
    requiredRole: 'ADMIN',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Statický i dynamický katalog agentních schopností',
        'Mapování capabilityId na autorizované operace',
        'Validace vstupních a výstupních schémat',
      ],
      inProgressOrMissing: [
        'Dynamická registrace externích mikroslužeb přes SYNAPI',
        'Automatická generace OpenAPI specifikace jednotlivých schopností',
      ],
      technicalDetails: 'Architektura Unified Agent Layer: server-authoritative evidence schopností.',
    },
    tags: ['AI', 'Agent', 'Registry'],
  },
  {
    id: 'agent-dispatcher',
    name: 'Agent Dispatcher & API',
    description: 'Vysoce bezpečný router požadavků (/api/admin/agent/dispatch) s vynucením ControlPlaneAuthorization a auditem.',
    category: 'ai',
    status: 'READY',
    route: '/experimenty/agent-dispatcher',
    iconName: 'Send',
    backendCapability: 'agent_dispatcher',
    requiredRole: 'ADMIN',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Endpoint POST /api/admin/agent/dispatch v provozu',
        'Striktní klientský payload kontrakt bez injection polí',
        'Mapování stavů 200 (SUCCESS), 202 (REQUIRE_HUMAN_APPROVAL), 403 (DENY)',
        'Integrovaný safeJsonResponse parser s ověřením Content-Type',
      ],
      inProgressOrMissing: [
        'Asynchronní fronta (BullMQ/Redis) pro dlouhoběžící analýzy',
        'Webhook notifikace o dokončení úloh na pozadí',
      ],
      technicalDetails: 'Server je jediná bezpečnostní autorita. Klient nesmí předávat role, model ani prompt.',
    },
    tags: ['AI', 'API', 'Dispatcher'],
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst Agent',
    description: 'Analytický agent pro vyhodnocování časových řad, frekvence styků, finančních nákladů a statistických anomálií.',
    category: 'ai',
    status: 'READY',
    route: '/experimenty/data-analyst',
    iconName: 'BarChart2',
    backendCapability: 'data_analyst',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Backend implementace z Phase 2B-2 plně funkční',
        'Agregace časových údajů a výpočet reálných poměrů péče',
        'Filtrování anomálií v docházce a výdajích na děti',
      ],
      inProgressOrMissing: [
        'Generování soudních srovnávacích tabulek do formátu PDF/DOCX',
        'Prediktivní model eskalace sporů na základě časových řad',
      ],
      technicalDetails: 'Schopnost data-analyst ověřena sadou unit a integračních testů.',
    },
    tags: ['AI', 'Data', 'Analýza', 'Péče'],
  },
  {
    id: 'document-processor',
    name: 'Document Processor Agent',
    description: 'Automatizované zpracování, OCR extrakce, analýza struktury a extrakce právních entit ze soudních rozhodnutí.',
    category: 'ai',
    status: 'READY',
    route: '/experimenty/document-processor',
    iconName: 'FileText',
    backendCapability: 'document_processor',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Kompletní backend modul Phase 2C integrován do DEV3',
        'Parsování PDF a textových podkladů',
        'Extrakce spisových značek, účastníků, data vydání a výroků',
      ],
      inProgressOrMissing: [
        'Pokročilé OCR naskenovaných nekvalitních fotokopií',
        'Automatická anonymizace citlivých osobních údajů třetích stran dle GDPR',
      ],
      technicalDetails: 'Backend Document Processor prošel plnou QA verifikací v PR #31.',
    },
    tags: ['AI', 'Dokumenty', 'OCR', 'Rozsudky'],
  },
  {
    id: 'ai-council',
    name: 'AI Council — Multiperspektivní poradní sbor',
    description: 'Experimentální systém tří nezávislých perspektivních agentů (Právník, Psycholog, Mediátor) pro objektivní posouzení situace.',
    category: 'ai',
    status: 'EXPERIMENT',
    route: '/experimenty/ai-council',
    iconName: 'Users',
    backendCapability: 'ai_council',
    visible: true,
    experimental: true,
    implementationNote: {
      works: [
        'UI rozhraní pro zadání konfliktní situace',
        'Metodický model triangulace: Právo vs. Psychologie dítěte vs. Deeskalace',
        'Strukturované zobrazení doporučení každého z hlasů',
      ],
      inProgressOrMissing: [
        'Backend multi-agent orchestrátor s paralelním vyhodnocením',
        'Automatická detekce protichůdných argumentů v závěrech sboru',
      ],
      technicalDetails: 'UI je připravené. Backendová orchestrace je ve fázi návrhu.',
    },
    tags: ['AI', 'Council', 'Multiperspektiva'],
  },
  {
    id: 'human-approval',
    name: 'Human Approval Center',
    description: 'Bezpečnostní centrum pro lidské schvalování operací, které vyžadují vyšší stupeň autorizace (HTTP 202).',
    category: 'ai',
    status: 'BETA',
    route: '/experimenty/human-approval',
    iconName: 'ShieldCheck',
    backendCapability: 'human_approval',
    requiredRole: 'ADMIN',
    visible: true,
    experimental: true,
    implementationNote: {
      works: [
        'Protokol 202 REQUIRE_HUMAN_APPROVAL definovaný v API kontraktu',
        'UI komponenta pro zobrazení čekajících žádostí a auditního detailu',
        'Možnost schválení nebo zamítnutí akce operátorem',
      ],
      inProgressOrMissing: [
        'Trvalá perzistence čekajících schválení v samostatné DB tabulce',
        'E-mailové a push notifikace správcům při kritickém požadavku',
      ],
      technicalDetails: 'Zajišťuje zásadu Human-in-the-loop pro rizikové operace Synthesis platformy.',
    },
    tags: ['AI', 'Bezpečnost', 'Human-in-the-loop'],
  },
  {
    id: 'ai-telemetry',
    name: 'AI Usage & Cost Monitoring',
    description: 'Telemetrie spotřeby AI tokenů, měření latence a sledování nákladů modelů v reálném čase.',
    category: 'ai',
    status: 'BETA',
    route: '/administrace',
    iconName: 'Activity',
    backendCapability: 'ai_telemetry',
    requiredRole: 'ADMIN',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Sledování počtu dotazů a odhadu spotřeby tokenů',
        'Přehledový graf a rozdělení nákladů v administrativním panelu',
      ],
      inProgressOrMissing: [
        'Automatické kvóty a rate-limiting per klientský token',
        'Podrobné rozdělení nákladů dle jednotlivých agentních schopností',
      ],
      technicalDetails: 'K dispozici v administraci pod záložkou Telemetrie AI.',
    },
    tags: ['AI', 'Telemetrie', 'Náklady'],
  },
  {
    id: 'ai-audit-trail',
    name: 'AI Audit Trail',
    description: 'Neměnný auditní log všech systémových rozhodnutí, volání agentů a bezpečnostních prověrek.',
    category: 'ai',
    status: 'READY',
    route: '/administrace',
    iconName: 'Shield',
    backendCapability: 'audit_trail',
    requiredRole: 'ADMIN',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Záznam událostí v AuditCenter a SharedAuditView',
        'Evidence requestId, časové značky, výsledku a typu akce',
        'Ochrana před únikem secrets a PII v logovacím řetězci',
      ],
      inProgressOrMissing: [
        'Kryptografické hašování auditních bloků (Merkle tree)',
        'Automatický export do nezávislého archivního úložiště',
      ],
      technicalDetails: 'Součást globálního bezpečnostního auditu Synthesis platformy.',
    },
    tags: ['AI', 'Audit', 'Bezpečnost'],
  },

  // ==========================================
  // 6. PRÁVNÍ FUNKCE
  // ==========================================
  {
    id: 'judikatura',
    name: 'Přelomová judikatura ÚS a NS',
    description: 'Databáze klíčových nálezů Ústavního soudu a rozsudků Nejvyššího soudu s právními větami a komentáři.',
    category: 'pravo',
    status: 'READY',
    route: '/judikatura',
    iconName: 'Scale',
    backendCapability: 'case_law',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Plnohodnotný katalog rozsudků s fulltext vyhledáváním a filtry',
        'Kategorizace dle témat: střídavá péče, výživné, OSPOD, maření péče',
        'Citace spisových značek a odkazů na oficiální zdroje NALUS',
      ],
      inProgressOrMissing: [
        'Automatická týdenní synchronizace s databází Ústavního soudu NALUS',
        'Vizuální graf provázanosti a citací jednotlivých judikátů',
      ],
      technicalDetails: 'Historická data jsou chráněna proti přepisování. Primární autorita: NALUS.',
    },
    tags: ['Právo', 'Judikatura', 'Ústavní soud'],
  },
  {
    id: 'import-judikatury',
    name: 'Import a analýza rozsudku',
    description: 'Nástroj pro nahrání vlastního rozsudku, extrakci výrokové části a porovnání s metodikou péče.',
    category: 'pravo',
    status: 'BETA',
    route: '/portal/coparent',
    iconName: 'FileUp',
    backendCapability: 'judgment_import',
    visible: true,
    experimental: true,
    implementationNote: {
      works: [
        'Modální okno pro nahrání textu nebo PDF rozsudku v CoParent Hubu',
        'Extrakce frekvence předávání dětí a výše stanoveného výživného',
        'Uložení rozsudku do klientského spisu otce',
      ],
      inProgressOrMissing: [
        'Automatické rozpoznání skrytých právních vad ve výrocích o výkonu rozhodnutí',
        'Přímé napojení na Document Processor pro dávkové zpracování',
      ],
      technicalDetails: 'Klientská data jsou přísně izolována, zpracování probíhá bez ukládání na veřejné servery.',
    },
    tags: ['Právo', 'Import', 'Rozsudek'],
  },
  {
    id: 'analyza-rozsudku',
    name: 'Hloubková analýza rozsudku',
    description: 'Detailní rozbor odůvodnění soudního rozhodnutí, kontrola souladu s judikaturou ÚS a identifikace odvolacích důvodů.',
    category: 'pravo',
    status: 'EXPERIMENT',
    route: '/experimenty/analyza-rozsudku',
    iconName: 'FileSearch',
    backendCapability: 'judgment_deep_analysis',
    visible: true,
    experimental: true,
    implementationNote: {
      works: [
        'UI rozhraní pro strukturované vložení odůvodnění rozsudku',
        'Katalog 12 nejčastějších pochybení soudů prvního stupně',
        'Vzorový výstup srovnávací tabulky výroků',
      ],
      inProgressOrMissing: [
        'Serverový analyzátor sémantické koherence a rozporů v dokazování',
        'Generování konceptu odvolání na základě identifikovaných vad',
      ],
      technicalDetails: 'Rozhraní je připravené. Backendová funkce se připravuje.',
    },
    tags: ['Právo', 'Analýza', 'Odvolání'],
  },
  {
    id: 'vyhledavani-faktu',
    name: 'Sémantické vyhledávání právních faktů',
    description: 'Chytré vyhledávání v zákonech, judikatuře a metodických pokynech MPSV přirozeným jazykem.',
    category: 'pravo',
    status: 'EXPERIMENT',
    route: '/experimenty/vyhledavani-faktu',
    iconName: 'Search',
    backendCapability: 'legal_fact_search',
    visible: true,
    experimental: true,
    implementationNote: {
      works: [
        'UI vyhledávací panel s filtry právních okruhů',
        'Vzorové dotazy a struktura zobrazení nalezených právních vět',
      ],
      inProgressOrMissing: [
        'Vektorová databáze embeddingů všech rozhodnutí Ústavního soudu',
        'Napojení na API e-Sbírky s přísným limitem dotazů (max 1 req/s)',
      ],
      technicalDetails: 'UI je připravené. Vektorový index a backend konektor jsou ve vývoji.',
    },
    tags: ['Právo', 'Vyhledávání', 'Fakta'],
  },
  {
    id: 'pravni-pruvodce',
    name: 'Právní průvodce opatrovnickým řízením',
    description: 'Komplexní metodický průvodce fázemi řízení: návrh, opatrovník OSPOD, dokazování, soudní jednání a opravné prostředky.',
    category: 'pravo',
    status: 'READY',
    route: '/agenda',
    iconName: 'BookOpen',
    backendCapability: 'legal_guide',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Kompletní procesní schéma fází opatrovnického soudu',
        'Dynamické metodické stránky pro jednotlivé instituty',
        'Interaktivní kontrolní seznamy pro otce před jednáním',
      ],
      inProgressOrMissing: [
        'Automatický kalendářní generátor zákonných lhůt na základě datumu doručení',
      ],
      technicalDetails: 'Obsah garantován metodickým týmem projektu Táta má právo.',
    },
    tags: ['Právo', 'Průvodce', 'Opatrovnictví'],
  },
  {
    id: 'pravni-dokumenty',
    name: 'Právní dokumenty a vzory podání',
    description: 'Knihovna ověřených vzorů návrhů, vyjádření a stížností připravených k vyplnění a podání na soud.',
    category: 'pravo',
    status: 'READY',
    route: '/dokumenty',
    iconName: 'Files',
    backendCapability: 'document_templates',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Rozsáhlá knihovna vzorů ke stažení (DOCX, PDF)',
        'Strukturované kategorie: návrhy na péči, úpravu výživného, stížnosti na OSPOD',
        'Zobrazení právních náležitostí a procesních poučení',
      ],
      inProgressOrMissing: [
        'Online vyplňování s automatickou kontrolou chybějících údajů',
      ],
      technicalDetails: 'Všechny vzory reflektují aktuální znění občanského zákoníku a ZŘS.',
    },
    tags: ['Právo', 'Dokumenty', 'Vzory'],
  },
  {
    id: 'generator-podani',
    name: 'Inteligentní generátor podání',
    description: 'Interaktivní průvodce tvorbou soudního podání na základě strukturovaného dotazníku s kontrolou logiky.',
    category: 'pravo',
    status: 'BETA',
    route: '/ai-formulare',
    iconName: 'PenTool',
    backendCapability: 'submission_generator',
    visible: true,
    experimental: true,
    implementationNote: {
      works: [
        'Krokový formulář pro generování návrhu na střídavou péči',
        'Validace formálních údajů (jména, data narození, spisové značky)',
        'Okamžitý export do formátu DOCX a PDF',
      ],
      inProgressOrMissing: [
        'Automatické začlenění judikatury přiléhavé ke specifickému věku dítěte',
        'Přímé odeslání přes datovou schránku uživatele',
      ],
      technicalDetails: 'Právní formuláře jsou validovány klientsky i serverově.',
    },
    tags: ['Právo', 'Generátor', 'Podání'],
  },
  {
    id: 'kontrola-podani',
    name: 'Kontrola a audit podání',
    description: 'Kontrolní nástroj pro prověření vlastního sepsaného návrhu před podáním na soud (formální vady, tón, B.I.F.F. pravidla).',
    category: 'pravo',
    status: 'EXPERIMENT',
    route: '/experimenty/kontrola-podani',
    iconName: 'CheckSquare',
    backendCapability: 'submission_audit',
    visible: true,
    experimental: true,
    implementationNote: {
      works: [
        'UI rozhraní pro vložení textu podání k prověření',
        'Kontrolní body formálních náležitostí podle § 79 OSŘ',
        'Zobrazení doporučení pro eliminaci emočně eskalujících formulací',
      ],
      inProgressOrMissing: [
        'Automatický backend parser procesních náležitostí',
        'Integrovaný lingvistický model deeskalace komunikace',
      ],
      technicalDetails: 'Rozhraní je připravené. Backendová funkce se připravuje.',
    },
    tags: ['Právo', 'Audit', 'Kontrola'],
  },
  {
    id: 'biff-konvertor',
    name: 'B.I.F.F. Konvertor komunikace',
    description: 'Nástroj pro transformaci konfliktních a emočně vypjatých e-mailů a zpráv do věcného, krátkého a deeskalačního formátu.',
    category: 'pravo',
    status: 'READY',
    route: '/komunikace-biff',
    iconName: 'ShieldAlert',
    backendCapability: 'biff_converter',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Interaktivní B.I.F.F. editor (Brief, Informative, Friendly, Firm)',
        'Okamžité hodnocení zprávy dle 4 základních principů',
        'Katalog modelových situací a doporučených odpovědí',
      ],
      inProgressOrMissing: [
        'Automatická asistence AI při přeformulování toxických zpráv',
      ],
      technicalDetails: 'Plně funkční nástroj pro každodenní komunikaci spolurodičů.',
    },
    tags: ['Právo', 'Komunikace', 'BIFF', 'Deeskalace'],
  },
  {
    id: 'evidence-dukazu',
    name: 'Evidence a chronologie důkazů',
    description: 'Strukturovaný digitální archiv důkazních materiálů (zprávy, nahrávky, platby, fotografie) s vazbou na tvrzení.',
    category: 'pravo',
    status: 'READY',
    route: '/muj-pripad',
    iconName: 'Archive',
    backendCapability: 'evidence_vault',
    requiredRole: 'USER',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Záložka Důkazy v klientském spisu Můj případ',
        'Kategorizace důkazů (listinné, digitální komunikace, zprávy OSPOD)',
        'Bezpečné šifrované ukládání a provázání s timeline sporu',
      ],
      inProgressOrMissing: [
        'Automatické generování soupisu důkazních příloh pro soudní podání',
        'Kryptografické časové razítko zaručující neměnnost důkazního materiálu',
      ],
      technicalDetails: 'K dispozici v přihlášeném rozhraní Můj případ -> Důkazy.',
    },
    tags: ['Právo', 'Důkazy', 'Spis'],
  },

  // ==========================================
  // 7. PŘÍPAD / PÉČE
  // ==========================================
  {
    id: 'muj-pripad',
    name: 'Můj případ — Digitální spis otce',
    description: 'Komplexní klientská složka integrující děti, soudní jednání, dokumenty, úkoly a zprávy OSPOD.',
    category: 'pripad',
    status: 'READY',
    route: '/muj-pripad',
    iconName: 'Folder',
    backendCapability: 'my_case',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Kompletní přehled případu s přehlednými záložkami',
        'Správa profilů dětí, termínů styků a soudních řízení',
        'Offline vault synchronizace pro práci bez připojení k internetu',
      ],
      inProgressOrMissing: [
        'Multi-case podpora pro souběžně vedená řízení u různých soudů',
      ],
      technicalDetails: 'Jádro klientské části Synthesis Hubu pro otce v řízení.',
    },
    tags: ['Případ', 'Spis', 'Klient'],
  },
  {
    id: 'prehled-pripadu',
    name: 'Přehled případu & Dashboard',
    description: 'Manažerský přehled stavu opatrovnického sporu, nejbližších lhůt a klíčových úkolů.',
    category: 'pripad',
    status: 'READY',
    route: '/muj-pripad',
    iconName: 'Layout',
    backendCapability: 'case_overview',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Záložka Přehled v klientském spisu otce',
        'Zobrazení stavu sporu, nejbližších milníků a souhrnu péče',
      ],
      inProgressOrMissing: [
        'Skórovací ukazatel procesního rizika na základě aktuálních důkazů',
      ],
      technicalDetails: 'Součást komponenty CaseOverviewTab.',
    },
    tags: ['Případ', 'Dashboard', 'Přehled'],
  },
  {
    id: 'timeline-pripadu',
    name: 'Timeline & Časová osa případu',
    description: 'Interaktivní chronologická osa všech incidentů, předání, komunikací a soudních úkonů.',
    category: 'pripad',
    status: 'READY',
    route: '/muj-pripad',
    iconName: 'Clock',
    backendCapability: 'case_timeline',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Vizuální časová osa v záložce Timeline',
        'Filtrování dle typu události: soud, OSPOD, předání, konflikt',
        'Vyhledávání v historických událostech',
      ],
      inProgressOrMissing: [
        'Export časové osy do přehledné přílohy soudního návrhu',
      ],
      technicalDetails: 'Implementováno v CaseTimelineTab.tsx.',
    },
    tags: ['Případ', 'Timeline', 'Historie'],
  },
  {
    id: 'kalendar-jednani',
    name: 'Kalendář jednání a procesních lhůt',
    description: 'Termínový kalendář pro sledování soudních jednání, návštěv OSPOD a zákonných procesních lhůt.',
    category: 'pripad',
    status: 'READY',
    route: '/kalendar',
    iconName: 'Calendar',
    backendCapability: 'calendar_deadlines',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Kalendář procesních lhůt (KalendarLhutView)',
        'Evidence soudních stání a přípravy na ně',
        'Barevné kódování dle naléhavosti a typu úkonu',
      ],
      inProgressOrMissing: [
        'Obousměrná iCal synchronizace s Google Calendar a Apple Calendar',
      ],
      technicalDetails: 'Dostupné veřejně i v klientském spisu otce.',
    },
    tags: ['Případ', 'Kalendář', 'Lhůty'],
  },
  {
    id: 'dokumenty-pripadu',
    name: 'Dokumenty k případu',
    description: 'Bezpečné úložiště klientských dokumentů spojených s případem s možností štítkování a třídění.',
    category: 'pripad',
    status: 'READY',
    route: '/muj-pripad',
    iconName: 'FolderLock',
    backendCapability: 'case_documents',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Nahrávání a správa souborů v CaseDocumentsTab',
        'Kategorizace dle typu: soudní rozhodnutí, podání, znalecké posudky',
      ],
      inProgressOrMissing: [
        'Automatická indexace obsahu pro fulltextové vyhledávání v PDF',
      ],
      technicalDetails: 'Ukládání s šifrováním na aplikační úrovni.',
    },
    tags: ['Případ', 'Dokumenty', 'Úložiště'],
  },
  {
    id: 'coparenthub',
    name: 'CoParent Hub — Portál spolurodičovství',
    description: 'Nástroj pro sdílenou správu péče, kalendáře předávání dětí, financí a nekonfliktní komunikace.',
    category: 'pripad',
    status: 'READY',
    route: '/coparent-hub',
    iconName: 'HeartHandshake',
    backendCapability: 'coparent_hub',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Kompletní rozhraní CoParentHubPage',
        'Sdílený kalendář předávání a plánování prázdnin',
        'Pozvánka druhého rodiče a evidence společných výdajů',
      ],
      inProgressOrMissing: [
        'Mobilní notifikace předání v reálném čase přes WebPush',
      ],
      technicalDetails: 'Plnohodnotný produkční modul pro rodiče.',
    },
    tags: ['Případ', 'CoParent', 'Spolurodičovství'],
  },
  {
    id: 'care-simulator',
    name: 'Care Simulator — Modely péče a předávání',
    description: 'Interaktivní simulátor rozvržení péče o děti (střídavá péče 7/7, 2-2-3, rozšířená péče, asymetrické modely).',
    category: 'pripad',
    status: 'READY',
    route: '/ai-simulator',
    iconName: 'Sliders',
    backendCapability: 'care_simulator',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Výpočet přesných procentuálních podílů péče obou rodičů',
        'Kalendářní vizualizace předávacích dnů a víkendů',
        'Zohlednění školních prázdnin a svátků',
      ],
      inProgressOrMissing: [
        'Optimalizace předávacích míst na mapě s ohledem na dojezdové časy',
      ],
      technicalDetails: 'Dostupné v AiSimulatorView a CareSimulatorModal.',
    },
    tags: ['Případ', 'Péče', 'Simulátor'],
  },
  {
    id: 'tvrzeni-druheho-rodice',
    name: 'Dekonstrukce tvrzení druhého rodiče',
    description: 'Metodický nástroj pro věcné rozebrání nepravdivých tvrzení, jejich přiřazení k důkazům a formulaci vyjádření.',
    category: 'pripad',
    status: 'EXPERIMENT',
    route: '/experimenty/tvrzeni-druheho-rodice',
    iconName: 'SplitSquareVertical',
    backendCapability: 'claim_deconstruction',
    visible: true,
    experimental: true,
    implementationNote: {
      works: [
        'UI rozhraní s tabulkou: Tvrzení -> Věcný protiargument -> Připojený důkaz',
        'Metodika deeskalace a eliminace osobních útoků',
        'Vzorové dekonstrukce pro typická tvrzení u opatrovnického soudu',
      ],
      inProgressOrMissing: [
        'Automatická křížová kontrola tvrzení s nahraným důkazním archivem',
        'Generování přehledné srovnávací tabulky pro samosoudce',
      ],
      technicalDetails: 'Rozhraní je připravené. Backendová funkce se připravuje.',
    },
    tags: ['Případ', 'Tvrzení', 'Argumentace'],
  },
  {
    id: 'ai-notes',
    name: 'AI Inteligentní poznámkový blok',
    description: 'Chytrý poznámkový blok pro rychlé zaznamenávání incidentů s automatickým rozpoznáváním data, osob a emocí.',
    category: 'pripad',
    status: 'BETA',
    route: '/muj-pripad',
    iconName: 'FileEdit',
    backendCapability: 'ai_notes',
    visible: true,
    experimental: true,
    implementationNote: {
      works: [
        'Záznam poznámek v CaseNotesTab',
        'Kategorizace a štítkování dle dětí a témat',
      ],
      inProgressOrMissing: [
        'Automatické převedení nestrukturovaného textu na timeline událost',
        'Detekce nesrovnalostí v časových údajích',
      ],
      technicalDetails: 'Základní poznámkový blok funguje, AI extrakce je ve fázi beta.',
    },
    tags: ['Případ', 'Poznámky', 'Záznamník'],
  },

  // ==========================================
  // 8. FINANCE
  // ==========================================
  {
    id: 'kalkulacka-vyzivneho',
    name: 'Kalkulačka výživného dle doporučující tabulky MPSV',
    description: 'Oficiální výpočet orientační výše výživného na základě metodiky Ministerstva práce a sociálních věcí ČR.',
    category: 'finance',
    status: 'READY',
    route: '/kalkulacka-vyzivneho',
    iconName: 'Calculator',
    backendCapability: 'alimony_calculator',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Kompletní kalkulačka reflektující věkové kategorie a počet vyživovacích povinností',
        'Podpora výpočtu pro výlučnou péči i střídavou péči s kompenzací',
        'Zohlednění kontrolních částek a životního minima',
      ],
      inProgressOrMissing: [
        'Možnost započtení mimořádných odůvodněných nákladů dítěte',
      ],
      technicalDetails: 'Plně funkční, prověřeno v produkčním provozu AlimonyCalculatorPage.',
    },
    tags: ['Finance', 'Výživné', 'Kalkulačka', 'MPSV'],
  },
  {
    id: 'financni-prehled',
    name: 'Finanční a majetkové vypořádání (SJM)',
    description: 'Metodika a nástroj pro inventarizaci společného jmění manželů, ocenění aktiv a návrh férového vypořádání.',
    category: 'finance',
    status: 'BETA',
    route: '/majetek',
    iconName: 'Coins',
    backendCapability: 'property_settlement',
    visible: true,
    experimental: true,
    implementationNote: {
      works: [
        'Informační přehled a metodická pravidla vypořádání SJM (MajetekView)',
        'Katalog nejčastějších chyb při oceňování nemovitostí a hypoték',
      ],
      inProgressOrMissing: [
        'Interaktivní bilance aktiv a pasiv s výpočtem vypořádacího podílu',
        'Export dohody o vypořádání SJM k notářskému ověření',
      ],
      technicalDetails: 'Informační vrstva je aktivní, interaktivní kalkulátor SJM je ve vývoji.',
    },
    tags: ['Finance', 'Majetek', 'SJM'],
  },
  {
    id: 'evidence-nakladu',
    name: 'Evidence nákladů dítěte',
    description: 'Průběžná evidence běžných a mimořádných výdajů na děti (kroužky, rovnátka, tábory, školné) s účtenkami.',
    category: 'finance',
    status: 'BETA',
    route: '/coparent-hub',
    iconName: 'Receipt',
    backendCapability: 'child_expenses',
    visible: true,
    experimental: true,
    implementationNote: {
      works: [
        'Správa výdajů v CoParent Hubu',
        'Dělení nákladů mezi rodiče v poměru stanoveném soudem',
        'Přehled schválených a čekajících plateb',
      ],
      inProgressOrMissing: [
        'OCR automatické čtení částek z nahraných účtenek a faktur',
      ],
      technicalDetails: 'Funguje v rámci CoParent Hubu.',
    },
    tags: ['Finance', 'Náklady', 'Děti'],
  },
  {
    id: 'financni-zavazky',
    name: 'Finanční závazky a platební kalendář',
    description: 'Komplexní přehled pohledávek, dluhů, úvěrů a plánovaných plateb výživného s notifikacemi splatnosti.',
    category: 'finance',
    status: 'PLANNED',
    route: '/experimenty/financni-zavazky',
    iconName: 'CreditCard',
    backendCapability: 'financial_obligations',
    visible: true,
    experimental: true,
    implementationNote: {
      works: [
        'Návrh datového modelu pro evidenci splátkových kalendářů',
        'Architektonický koncept propojení s bankovními výpisy',
      ],
      inProgressOrMissing: [
        'Uživatelské rozhraní správce závazků',
        'Backend perzistence v databázi',
      ],
      technicalDetails: 'Funkce je ve fázi plánování architektury. Backend neexistuje.',
    },
    tags: ['Finance', 'Závazky', 'Platby'],
  },
  {
    id: 'prehled-plateb',
    name: 'Přehled plateb a historie výživného',
    description: 'Generování potvrzení o úhradě výživného a transparentní auditní záznam pro vyloučení nařčení z neplacení.',
    category: 'finance',
    status: 'BETA',
    route: '/coparent-hub',
    iconName: 'History',
    backendCapability: 'payment_history',
    visible: true,
    experimental: true,
    implementationNote: {
      works: [
        'Záznam plateb s variabilním symbolem v modulu CoParent',
        'Generování přehledu pro potřeby soudu či exekuční obrany',
      ],
      inProgressOrMissing: [
        'Automatické párování s bankovním účtem přes bankovní API (PSD2)',
      ],
      technicalDetails: 'Součást finančního modulu CoParent.',
    },
    tags: ['Finance', 'Výživné', 'Historie'],
  },

  // ==========================================
  // 9. VZDĚLÁVÁNÍ
  // ==========================================
  {
    id: 'knihovna-studii',
    name: 'Knihovna vědeckých studií a výzkumů',
    description: 'Recenzované vědecké studie o vlivu střídavé péče, přespávání kojenců a citové vazbě pro soudy a OSPOD.',
    category: 'vzdelavani',
    status: 'READY',
    route: '/studie',
    iconName: 'GraduationCap',
    backendCapability: 'study_library',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Rozsáhlá databáze recenzovaných mezinárodních studií (Warshak, Fabricius, Nielsen)',
        'České anotace, metodické shrnutí a citace',
        'Možnost stažení studií ve formátu PDF pro založení do soudního spisu',
      ],
      inProgressOrMissing: [
        'AI generátor argumentačních výtahů pro konkrétní věkovou skupinu dítěte',
      ],
      technicalDetails: 'Plně funkční na trase /studie (StudyLibraryPage).',
    },
    tags: ['Vzdělávání', 'Studie', 'Výzkum', 'Věda'],
  },
  {
    id: 'vzdelavaci-centrum',
    name: 'Vzdělávací centrum & Tréninkové kvízy',
    description: 'Interaktivní videotéka, webináře a testovací kvízy procesních znalostí pro rodiče před soudním stáním.',
    category: 'vzdelavani',
    status: 'READY',
    route: '/kvizy',
    iconName: 'Award',
    backendCapability: 'educational_center',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Interaktivní kvízy ověřující znalost právních předpisů (QuizzesView)',
        'Videotéka a webináře s odborníky (VideothequeView)',
        'Vyhodnocení správných odpovědí s právním odůvodněním',
      ],
      inProgressOrMissing: [
        'Certifikovaný vzdělávací program pro rodiče v rozpadu rodiny',
      ],
      technicalDetails: 'Dostupné v sekci Akademie portálu.',
    },
    tags: ['Vzdělávání', 'Kvízy', 'Webináře'],
  },
  {
    id: 'ospod-pruvodce',
    name: 'Průvodce jednáním s OSPOD',
    description: 'Podrobný metodický manuál pro sociální šetření, práva rodiče, nahlížení do spisu Om a stížnosti na kolizního opatrovníka.',
    category: 'vzdelavani',
    status: 'READY',
    route: '/ospod',
    iconName: 'ShieldAlert',
    backendCapability: 'ospod_guide',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Komplexní průvodce OSPOD (OspodGuideView)',
        'Práva rodiče při sociálním šetření a nahrávání rozhovorů',
        'Postup při podjatosti sociálního pracovníka a vzor stížnosti',
      ],
      inProgressOrMissing: [
        'Interaktivní simulátor rozhovoru s pracovnicí OSPOD',
      ],
      technicalDetails: 'Plně zpracovaná metodika prověřená v praxi.',
    },
    tags: ['Vzdělávání', 'OSPOD', 'Průvodce'],
  },
  {
    id: 'pruvodce-soudem',
    name: 'Průvodce soudním jednáním',
    description: 'Příprava na soudní síň: vystupování, protokolace, námitky proti otázkám a zvládání psychického nátlaku.',
    category: 'vzdelavani',
    status: 'READY',
    route: '/soud',
    iconName: 'Gavel',
    backendCapability: 'court_guide',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Metodika přípravy na ústní jednání (CourtGuideView)',
        'Kontrolní seznam věcí a podkladů do soudní síně',
        'Pravidla pro diktování do soudního protokolu',
      ],
      inProgressOrMissing: [
        'Virtuální 3D prohlídka typické české soudní síně s popisem rolí',
      ],
      technicalDetails: 'Součást právní sekce portálu.',
    },
    tags: ['Vzdělávání', 'Soud', 'Jednání'],
  },
  {
    id: 'zivotni-situace',
    name: 'Životní situace a rozcestník',
    description: 'Přehledné řešení krizových momentů: náhlé bránění ve styku, obvinění z násilí, stěhování dítěte bez souhlasu.',
    category: 'vzdelavani',
    status: 'READY',
    route: '/krizova-pomoc',
    iconName: 'Compass',
    backendCapability: 'situations_guide',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'SOS akční plán první pomoci pro rodiče (SosPlanView)',
        'Rozcestník krizové pomoci a ověřené kontakty',
        'Postupy pro předběžná opatření dle § 452 ZŘS',
      ],
      inProgressOrMissing: [
        'Geolokační vyhledání nejbližšího dostupného rodinného advokáta',
      ],
      technicalDetails: 'Klíčová veřejná služba portálu Táta má právo.',
    },
    tags: ['Vzdělávání', 'Krize', 'Situace'],
  },
  {
    id: 'faq',
    name: 'Časté dotazy (FAQ)',
    description: 'Stovky zodpovězených otázek z praxe rozpadu rodiny, péče o děti, výživného a opatrovnického soudu.',
    category: 'vzdelavani',
    status: 'READY',
    route: '/faq',
    iconName: 'HelpCircle',
    backendCapability: 'faq_system',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Kategorizovaný přehled nejčastějších dotazů s odpověďmi',
        'Fulltextové vyhledávání v odpovědích (FaqSection)',
      ],
      inProgressOrMissing: [
        'AI generování odpovědí na dotazy, které ještě nejsou v databázi',
      ],
      technicalDetails: 'Pravidelně doplňováno právní poradnou spolku.',
    },
    tags: ['Vzdělávání', 'FAQ', 'Dotazy'],
  },
  {
    id: 'znalostni-centrum',
    name: 'Znalostní centrum & Právní slovník',
    description: 'Encyklopedie pojmů rodinného práva, procesních termínů a psychologických konceptů srozumitelným jazykem.',
    category: 'vzdelavani',
    status: 'READY',
    route: '/wiki',
    iconName: 'Bookmark',
    backendCapability: 'knowledge_wiki',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Encyklopedie pojmů rodinného práva (WikiView)',
        'Vysvětlení pojmů jako syndrom zavrženého rodiče, kolizní opatrovník, vyživovací povinnost',
        'Abecední index a fulltextové vyhledávání',
      ],
      inProgressOrMissing: [
        'Propojení hesel s konkrétními odstavci občanského zákoníku',
      ],
      technicalDetails: 'Dostupné na trase /wiki.',
    },
    tags: ['Vzdělávání', 'Wiki', 'Slovník'],
  },

  // ==========================================
  // 10. PLATFORM / SYSTEM
  // ==========================================
  {
    id: 'ai-control-center',
    name: 'Synthesis Control Center',
    description: 'Řídicí panel pro správu platformy Synthesis, multi-projektovou konfiguraci a nasazování služeb.',
    category: 'platforma',
    status: 'READY',
    route: '/administrace',
    iconName: 'Server',
    backendCapability: 'control_center',
    requiredRole: 'ADMIN',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'SynthesisProjectControlCenter komponenta v administraci',
        'Přehled připojených subsystémů (SCAPI, SPA, SAI, SORION, SSA, SDA)',
        'Stav nasazení a verze jednotlivých komponent',
      ],
      inProgressOrMissing: [
        'Multi-region orchestrace a automatický failover',
      ],
      technicalDetails: 'Chráněno přísnou ControlPlaneAuthorization na úrovni serveru.',
    },
    tags: ['Platforma', 'Control Center', 'Orchestrace'],
  },
  {
    id: 'security-policy',
    name: 'Security Policy & Compliance',
    description: 'Systém bezpečnostních pravidel, GDPR soulad, správa souhlasů a ochrana proti IDOR/BOLA útokům.',
    category: 'platforma',
    status: 'READY',
    route: '/pravni-dokumenty',
    iconName: 'ShieldCheck',
    backendCapability: 'security_policy',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'GDPR Compliance Center s volitelnými souhlasy a cookies',
        'Zásada Zero Trust: default DENY pro veškerá neautorizovaná volání',
        'Server-side izolace dat bez možnosti úniku klientských tajemství',
      ],
      inProgressOrMissing: [
        'Automatizovaný export dat subjektu údajů jedním kliknutím dle čl. 20 GDPR',
      ],
      technicalDetails: 'Bezpečnostní architektura je nedotknutelná priorita P0.',
    },
    tags: ['Platforma', 'Bezpečnost', 'GDPR', 'Zero Trust'],
  },
  {
    id: 'platform-audit-trail',
    name: 'Platform Audit Trail & Logy',
    description: 'Detailní systémový log všech administrativních, databázových a bezpečnostních událostí v reálném čase.',
    category: 'platforma',
    status: 'READY',
    route: '/administrace',
    iconName: 'FileCheck',
    backendCapability: 'platform_audit',
    requiredRole: 'ADMIN',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'AuditCenter v administraci s filtrováním dle závažnosti a typu události',
        'Zákaz logování hesel, tokenů a citlivých osobních údajů',
        'Sdílené auditní zprávy (SharedAuditView) s unikátním tokenem',
      ],
      inProgressOrMissing: [
        'Export do externího SIEM systému pro kontinuální bezpečnostní monitoring',
      ],
      technicalDetails: 'Auditní stopa je vyžadována globálními pravidly Synthesis ekosystému.',
    },
    tags: ['Platforma', 'Audit', 'Logování'],
  },
  {
    id: 'system-health',
    name: 'System Health & VPS Monitoring',
    description: 'Sledování vytížení serveru, paměti, stavu Docker kontejnerů a databázové odezvy.',
    category: 'platforma',
    status: 'READY',
    route: '/administrace',
    iconName: 'HardDrive',
    backendCapability: 'system_health',
    requiredRole: 'ADMIN',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Přehled stavu VPS a operačního systému v administraci',
        'Monitoring dostupnosti API endpointů a databázového spojení',
        'Bezpečnostní omezení: zákaz obecného shell exec endpointu',
      ],
      inProgressOrMissing: [
        'Automatická detekce memory leaků a proaktivní upozornění správce',
      ],
      technicalDetails: 'Dostupné v administrativním panelu pod záložkou VPS.',
    },
    tags: ['Platforma', 'VPS', 'Monitoring'],
  },
  {
    id: 'notifications',
    name: 'Notifikační centrum',
    description: 'Systém pro zasílání systémových upozornění, připomínek termínů a klientských notifikací.',
    category: 'platforma',
    status: 'BETA',
    route: '/aktivita-portalu',
    iconName: 'Bell',
    backendCapability: 'notification_center',
    visible: true,
    experimental: true,
    implementationNote: {
      works: [
        'Živý panel aktivity portálu (PortalActivityPanel)',
        'Systémová hlášení o změnách v aplikaci',
      ],
      inProgressOrMissing: [
        'Personalizované in-app notifikace pro přihlášeného uživatele',
        'E-mailové notifikace o blížícím se soudním stání',
      ],
      technicalDetails: 'Základní komponenta funguje, klientské notifikace se rozšiřují.',
    },
    tags: ['Platforma', 'Notifikace', 'Upozornění'],
  },
  {
    id: 'integrations',
    name: 'Platform Integrations & SYNAPI Hub',
    description: 'Konektory pro externí systémy: e-Sbírka předpisů, Justiční rejstřík, ISIR a datové schránky (ISDS).',
    category: 'platforma',
    status: 'EXPERIMENT',
    route: '/experimenty/integrace',
    iconName: 'Plug',
    backendCapability: 'synapi_integrations',
    requiredRole: 'ADMIN',
    visible: true,
    experimental: true,
    implementationNote: {
      works: [
        'Architektura konektoru pro e-Sbírku (e-Legislativa) se striktním rate-limitem',
        'UI přehled plánovaných integrací se státní správou',
      ],
      inProgressOrMissing: [
        'Přímé napojení na informační systém datových schránek (ISDS)',
        'Automatický scraping insolvenčního rejstříku ISIR',
      ],
      technicalDetails: 'Rozhraní je připravené. Backendové konektory podléhají přísným limitům státní správy.',
    },
    tags: ['Platforma', 'Integrace', 'SYNAPI', 'Stát'],
  },
  {
    id: 'project-knowledge',
    name: 'Synthesis Knowledge Protocol (SKP)',
    description: 'Dlouhodobá projektová paměť, dokumentace rozhodnutí (ADR) a napojení na Knowledge Service.',
    category: 'platforma',
    status: 'BETA',
    route: '/ai-context',
    iconName: 'Book',
    backendCapability: 'knowledge_service',
    visible: true,
    experimental: true,
    implementationNote: {
      works: [
        'Veřejný i administrátorský přehled systémového kontextu (AiContextView)',
        'Machine-readable index a transparentní architektura',
      ],
      inProgressOrMissing: [
        'Obousměrná synchronizace s Notion Knowledge base přes Knowledge Service',
        'Automatická detekce driftu mezi kódem a dokumentací',
      ],
      technicalDetails: 'Implementuje Synthesis Knowledge Protocol: READ -> VERIFY -> ACT -> WRITE BACK.',
    },
    tags: ['Platforma', 'Knowledge', 'SKP', 'Architektura'],
  },
  {
    id: 'team-center',
    name: 'Team Center — Koordinační centrum spolku',
    description: 'Pracovní prostředí pro dobrovolníky, koordinátory, právní editory a správce obsahu.',
    category: 'platforma',
    status: 'READY',
    route: '/team',
    iconName: 'Users2',
    backendCapability: 'team_center',
    requiredRole: 'VOLUNTEER',
    visible: true,
    experimental: false,
    implementationNote: {
      works: [
        'Kompletní TeamCenterDashboard s přehledem úkolů a projektů',
        'Správa dobrovolníků, schvalování kontaktů a koordinace poradny',
        'Role-based access pro VOLUNTEER, MODERATOR, CONTENT_MANAGER a ADMIN',
      ],
      inProgressOrMissing: [
        'Integrovaný chat pro členy týmu s end-to-end šifrováním',
      ],
      technicalDetails: 'Plnohodnotně funkční modul pro spolupracovníky spolku.',
    },
    tags: ['Platforma', 'Team', 'Spolek', 'Dobrovolníci'],
  },
];

// Helper functions for filtering and statistics
export const getExperimentalFeatures = (): ExperimentalFeature[] => {
  return EXPERIMENTAL_FEATURES.filter((f) => f.visible);
};

export const getExperimentalFeatureById = (id: string): ExperimentalFeature | undefined => {
  return EXPERIMENTAL_FEATURES.find((f) => f.id === id);
};

export const filterExperimentalFeatures = (
  category?: string,
  status?: string,
  search?: string
): ExperimentalFeature[] => {
  return EXPERIMENTAL_FEATURES.filter((feature) => {
    if (!feature.visible) return false;

    if (category && category !== 'vse' && feature.category !== category) {
      return false;
    }

    if (status && status !== 'vse' && feature.status !== status) {
      return false;
    }

    if (search && search.trim() !== '') {
      const q = search.toLowerCase();
      const matchName = feature.name.toLowerCase().includes(q);
      const matchDesc = feature.description.toLowerCase().includes(q);
      const matchCap = feature.backendCapability?.toLowerCase().includes(q);
      const matchTags = feature.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchCap && !matchTags) {
        return false;
      }
    }

    return true;
  });
};

export const getFeatureStatusStats = () => {
  const visible = getExperimentalFeatures();
  return {
    total: visible.length,
    ready: visible.filter((f) => f.status === 'READY').length,
    beta: visible.filter((f) => f.status === 'BETA').length,
    experiment: visible.filter((f) => f.status === 'EXPERIMENT').length,
    planned: visible.filter((f) => f.status === 'PLANNED').length,
    error: visible.filter((f) => f.status === 'ERROR').length,
  };
};
