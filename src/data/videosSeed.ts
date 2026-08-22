import { AcademyVideo } from '../types';

export const DEFAULT_ACADEMY_VIDEOS: AcademyVideo[] = [
  {
    id: 'vid-1',
    slug: 'rozhovor-stridava-pece-detsky-psycholog',
    title: 'Rozhovor: Střídavá péče očima dětského psychologa',
    category: 'rozhovory',
    categoryLabel: 'Rozhovory s odborníky',
    duration: '28 min',
    speaker: 'PhDr. Jaroslav Šturma',
    speakerRole: 'Dětský klinický psycholog',
    thumbnailUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    videoEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    sourceType: 'youtube',
    description: 'Bariéry a mýty okolo střídavé péče. Jak poznat potřeby dítěte a eliminovat syndrom zavrženého rodiče.',
    summaryNotes: [
      'Dítě nepotřebuje ideální rodiče, ale rodiče, kteří spolu dokáží nekontaktně a mírově vycházet.',
      'Přespávání kojenců a útlého věku u obou rodičů je podle klinických dat prospěšné pro stabilní attachment.',
      'Soudy by měly předcházet odcizování reakcí do týdnů, nikoliv měsíců.'
    ],
    attachments: [
      { name: 'Shrnutí rozhovoru (PDF)', size: '1.2 MB' }
    ],
    order: 1,
    status: 'PUBLISHED',
    seoTitle: 'Střídavá péče očima dětského psychologa • Videorozhovor',
    seoDescription: 'Odborný rozhovor s PhDr. Jaroslavem Šturmou o bariérách a mýtech ve střídavé péči a attachmentu dítěte k oběma rodičům.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z'
  },
  {
    id: 'vid-2',
    slug: 'navod-jak-se-pripravit-na-prvni-jednani-ospod',
    title: 'Návod: Jak se připravit na první jednání u OSPOD',
    category: 'navody',
    categoryLabel: 'Praktické videonávody',
    duration: '18 min',
    speaker: 'Mgr. Petr Novák',
    speakerRole: 'Opatrovnický advokát',
    thumbnailUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    videoEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    sourceType: 'youtube',
    description: 'Pět zlatých pravidel pro vystupování před sociální pracovnicí. Čeho se vyvarovat a jak si správně připravit podklady.',
    summaryNotes: [
      'Nikdy nepomlouvejte druhého rodiče – hovořte výhradně o svém vztahu k dítěti a svých výchovných plánech.',
      'Přineste si rozpis pracovní doby, doklady o zázemí a fotografie dětského pokoje.',
      'Požádejte sociální pracovnici o nahlédnutí do spisu Om podle § 38 správního řádu.'
    ],
    order: 2,
    status: 'PUBLISHED',
    seoTitle: 'Jak se připravit na první jednání u OSPOD • Videonávod',
    seoDescription: 'Praktický videonávod opatrovnického advokáta pro vystupování před kolizním opatrovníkem OSPOD a přípravu podkladů.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z'
  },
  {
    id: 'vid-3',
    slug: 'webinar-cochemska-praxe-a-soudni-smir-cr',
    title: 'Webinář: Cochemská praxe a soudní smír v ČR',
    category: 'webinare',
    categoryLabel: 'Záznamy webinářů',
    duration: '42 min',
    speaker: 'JUDr. Martin Holub',
    speakerRole: 'Soudce opatrovnického soudu',
    thumbnailUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
    videoEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    sourceType: 'youtube',
    description: 'Jak funguje Cochemský model v českém soudnictví. Interdisciplinární spolupráce soudce, OSPOD a mediátora.',
    summaryNotes: [
      'Cochemská praxe směřuje k dohodě rodičů před samotným znaleckým dokazováním.',
      'Rodičovská dohoda je 3x trvanlivější než autoritativní rozsudek soudu.',
      'Využití mediace u zapsaného mediátora.'
    ],
    order: 3,
    status: 'PUBLISHED',
    seoTitle: 'Cochemská praxe a soudní smír v ČR • Záznam webináře',
    seoDescription: 'Záznam přednášky soudce JUDr. Martina Holuba o fungování interdisciplinárního Cochemského modelu v českém opatrovnictví.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z'
  },
  {
    id: 'vid-4',
    slug: 'navod-psani-biff-zprav-bez-emoci',
    title: 'Návod: Psaní BIFF zpráv – Odstraňujeme emoce z e-mailů',
    category: 'navody',
    categoryLabel: 'Praktické videonávody',
    duration: '15 min',
    speaker: 'Ing. Tomáš Dvořák',
    speakerRole: 'Lektor komunikace',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    videoEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    sourceType: 'youtube',
    description: 'Živá ukázka přepisu 3 provokativních e-mailů od protistrany do věcné a pevné BIFF odpovědi.',
    summaryNotes: [
      'Brief (Stručný): Nepište slohové práce; max 3–5 větných celků.',
      'Informative (Informativní): Reagujte pouze na technická fakta o dítěti.',
      'Friendly & Firm (Přátelský & Pevný): Zůstaňte zdvořilí, ale neústupní v pravidlech.'
    ],
    order: 4,
    status: 'PUBLISHED',
    seoTitle: 'Psaní BIFF zpráv – Odstraňujeme emoce • Videonávod',
    seoDescription: 'Videonávod s ukázkami přepisu provokativních zpráv a e-mailů do věcné, pevné a přátelské formy podle metody BIFF.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z'
  },
  {
    id: 'vid-5',
    slug: 'webinar-znalecke-posudky-jak-jim-celit-u-soudu',
    title: 'Webinář: Znalecké posudky a jak jim čelit u soudu',
    category: 'webinare',
    categoryLabel: 'Záznamy webinářů',
    duration: '35 min',
    speaker: 'Doc. PhDr. Karel Zelenka',
    speakerRole: 'Soudní znalec',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    videoEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    sourceType: 'youtube',
    description: 'Metodické chyby v posudcích, právo na výslech znalce u soudu a požadavky na revizní posudek.',
    summaryNotes: [
      'Znalec musí využívat standardizované psychodiagnostické metody.',
      'Máte právo k posudku podat písemné výhrady a žádat výslech znalce přímo před soudem.'
    ],
    order: 5,
    status: 'PUBLISHED',
    seoTitle: 'Znalecké posudky a jak jim čelit u soudu • Webinář',
    seoDescription: 'Odborný rozbor metodických chyb v psychologických znaleckých posudcích a postup pro uplatnění námitek u soudu.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z'
  }
];
