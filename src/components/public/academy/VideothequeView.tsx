import React, { useState } from 'react';
import {
  Play,
  Film,
  Search,
  CheckCircle2,
  FileText,
  Download,
  ExternalLink,
  Clock,
  UserCheck,
  Tag,
  Share2,
  X,
  Bookmark,
  Sparkles,
  BookOpen,
  AlertCircle,
  Video,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface VideothequeViewProps {
  onNavigate?: (path: string) => void;
}

export interface VideoItem {
  id: string;
  title: string;
  category: 'rozhovory' | 'navody' | 'webinare' | 'soud';
  categoryLabel: string;
  duration: string;
  speaker: string;
  speakerRole: string;
  thumbnailUrl: string;
  status: 'curated_notes' | 'in_production' | 'available';
  statusLabel: string;
  videoEmbedUrl?: string; // Only set when verified real video stream is available
  description: string;
  chapters: Array<{ time: string; title: string }>;
  summaryNotes: string[];
  keyTakeaways: string[];
  relatedLegalLinks: Array<{ label: string; path: string }>;
  attachments?: Array<{ name: string; size: string }>;
}

const VIDEOS_DATA: VideoItem[] = [
  {
    id: 'vid-1',
    title: 'Rozhovor: Střídavá péče očima dětského psychologa',
    category: 'rozhovory',
    categoryLabel: 'Rozhovory s odborníky',
    duration: '28 min',
    speaker: 'PhDr. Jaroslav Šturma',
    speakerRole: 'Dětský klinický psycholog',
    thumbnailUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    status: 'curated_notes',
    statusLabel: 'Studijní textový záznam • Čeká na videozáznam',
    description: 'Bariéry a mýty okolo střídavé péče. Jak poznat skutečné citové potřeby dítěte a předcházet syndromu zavrženého rodiče (PAS).',
    chapters: [
      { time: '00:00', title: 'Úvod: Mýty o výhradní péči jednoho rodiče' },
      { time: '06:15', title: 'Teorie citové vazby (Attachment) u batolat' },
      { time: '14:30', title: 'Přespávání dětí u otce v raném věku' },
      { time: '21:45', title: 'Jak mluvit s dítětem během rozchodu rodičů' }
    ],
    summaryNotes: [
      'Dítě nepotřebuje ideální rodiče, ale rodiče, kteří spolu dokáží nekontaktně a mírově vycházet v zájmu dítěte.',
      'Přespávání kojenců a dětí útlého věku u obou rodičů je podle klinických dat klíčové pro stabilní budování vícečetné citové vazby.',
      'Soudy a OSPOD by měly na pokusy o odcizení dítěte reagovat v řádu dnů až týdnů, nikoliv až po měsících nečinnosti.'
    ],
    keyTakeaways: [
      'Nenechte si vnutit představu, že dítě má pouze jednoho primárního pečovatele.',
      'Důsledně udržujte klidný, podporující tón a nikdy dítě nezatahujte do sporů o peníze.'
    ],
    relatedLegalLinks: [
      { label: 'Studie o přespávání kojenců (Warshak 2014)', path: '/studie' },
      { label: 'Psychologická podpora dětí', path: '/psychologie' }
    ],
    attachments: [
      { name: 'Metodické shrnutí rozhovoru (PDF)', size: '1.2 MB' }
    ]
  },
  {
    id: 'vid-2',
    title: 'Návod: Jak se připravit na první jednání u OSPOD',
    category: 'navody',
    categoryLabel: 'Praktické videonávody',
    duration: '18 min',
    speaker: 'Mgr. Petr Novák',
    speakerRole: 'Opatrovnický advokát',
    thumbnailUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    status: 'curated_notes',
    statusLabel: 'Studijní textový záznam • Čeká na videozáznam',
    description: 'Pět zlatých pravidel pro vystupování před sociální pracovnicí OSPOD. Čeho se vyvarovat a jak si správně připravit podklady.',
    chapters: [
      { time: '00:00', title: 'Role OSPOD jako kolizního opatrovníka' },
      { time: '04:20', title: 'Příprava dokumentace (bydlení, práce, režim dne)' },
      { time: '09:50', title: 'Komunikace na schůzce: Zákaz očerňování protistrany' },
      { time: '15:10', title: 'Právo na nahlížení do spisu Om dle § 38 správního řádu' }
    ],
    summaryNotes: [
      'Nikdy nepomlouvejte druhého rodiče – hovořte výhradně o svém vztahu k dítěti a svých reálných výchovných plánech.',
      'Přineste si rozpis pracovní doby, doklady o zázemí pro dítě a fotografie zařízeného dětského pokoje.',
      'Požádejte sociální pracovnici o nahlédnutí do spisu Om podle § 38 správního řádu a pořiďte si fotodokumentaci.'
    ],
    keyTakeaways: [
      'Před sociální pracovnicí vystupujte věcně, kultivovaně a s důrazem na potřeby dítěte.',
      'Veškeré podstatné návrhy a omluvy předkládejte písemně přes podatelnu do spisu.'
    ],
    relatedLegalLinks: [
      { label: 'Kompletní průvodce OSPOD', path: '/ospod' },
      { label: 'Vzory žádostí o nahlédnutí do spisu', path: '/ai-formulare' }
    ],
    attachments: [
      { name: 'Kontrolní checklist pro jednání na OSPOD (PDF)', size: '850 KB' }
    ]
  },
  {
    id: 'vid-3',
    title: 'Webinář: Cochemská praxe a soudní smír v ČR',
    category: 'webinare',
    categoryLabel: 'Záznamy webinářů',
    duration: '42 min',
    speaker: 'JUDr. Martin Holub',
    speakerRole: 'Soudce opatrovnického soudu',
    thumbnailUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
    status: 'curated_notes',
    statusLabel: 'Studijní textový záznam • Čeká na videozáznam',
    description: 'Jak funguje Cochemský model v českém soudnictví. Interdisciplinární spolupráce soudce, OSPOD, mediátorů a rodičů směřující ke smíru.',
    chapters: [
      { time: '00:00', title: 'Princip Cochemské praxe: Rychlost a interdisciplinarita' },
      { time: '11:00', title: 'Proč je rodičovská dohoda trvanlivější než rozsudek' },
      { time: '22:30', title: 'Úloha rodinné mediace a krizových center' },
      { time: '34:00', title: 'Co dělat při obstrukcích jednoho z rodičů' }
    ],
    summaryNotes: [
      'Cochemská praxe směřuje k dohodě rodičů dříve, než dojde k eskalaci znaleckého dokazování a odcizení dítěte.',
      'Dohoda rodičů má 3x vyšší statistickou trvanlivost a dodržování než autoritativní rozsudek soudu.',
      'Soudy v Cochemském modelu nařizují první jednání zpravidla do několika týdnů od podání návrhu.'
    ],
    keyTakeaways: [
      'Aktivně nabízejte konstruktivní návrhy smíru a mediaci.',
      'Konstruktivní rodičovský plán je nejlepší vizitkou před opatrovnickým soudcem.'
    ],
    relatedLegalLinks: [
      { label: 'Průvodce soudním řízením', path: '/soud' },
      { label: 'Simulátor modelů péče', path: '/ai-simulator' }
    ],
    attachments: [
      { name: 'Vzor rodičovského plánu (PDF)', size: '1.4 MB' }
    ]
  },
  {
    id: 'vid-4',
    title: 'Návod: Psaní BIFF zpráv – Odstraňujeme emoce z e-mailů',
    category: 'navody',
    categoryLabel: 'Praktické videonávody',
    duration: '15 min',
    speaker: 'Ing. Tomáš Dvořák',
    speakerRole: 'Lektor deeskalace komunikace',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    status: 'curated_notes',
    statusLabel: 'Studijní textový záznam • Čeká na videozáznam',
    description: 'Praktická ukázka přepisu 3 reálných provokativních e-mailů od protistrany do věcné a pevné BIFF odpovědi bez zbytečných hádek.',
    chapters: [
      { time: '00:00', title: '4 pilíře BIFF: Brief, Informative, Friendly, Firm' },
      { time: '04:15', title: 'Pravidlo 24 hodin a vychladnutí emocí' },
      { time: '08:30', title: 'Přepis e-mailu č. 1: Odpověď na obvinění ze špatné péče' },
      { time: '12:00', title: 'Přepis e-mailu č. 2: Reakce na finanční vydírání' }
    ],
    summaryNotes: [
      'Brief (Stručný): Nepište sáhodlouhé e-maily; omezte se na 2 až 4 věty.',
      'Informative (Informativní): Odpovídejte výhradně na praktická fakta týkající se dítěte (časy, logistika, léky).',
      'Friendly & Firm (Přátelský & Pevný): Udržujte neutrálně zdvořilý tón a jasně vymezte hranice.'
    ],
    keyTakeaways: [
      'Nikdy nereagujte v afektu. Napište koncept do poznámek a pošlete ho až po vyspání.',
      'Před odesláním aplikujte Test soudního oka: Působí zpráva vyrovnaně a kultivovaně?'
    ],
    relatedLegalLinks: [
      { label: 'E-learning kurz BIFF komunikace', path: '/studia' },
      { label: 'Interaktivní BIFF trenažér kvíz', path: '/kvizy' }
    ]
  },
  {
    id: 'vid-5',
    title: 'Webinář: Znalecké posudky z psychologie a jak jim čelit',
    category: 'webinare',
    categoryLabel: 'Záznamy webinářů',
    duration: '35 min',
    speaker: 'Doc. PhDr. Karel Zelenka',
    speakerRole: 'Soudní znalec a klinický psycholog',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    status: 'curated_notes',
    statusLabel: 'Studijní textový záznam • Čeká na videozáznam',
    description: 'Metodické chyby v psychologických posudcích, právo na osobní výslech znalce u soudu a požadavky na vypracování revizního posudku.',
    chapters: [
      { time: '00:00', title: 'Jak probíhá znalecké zkoumání rodičů a dítěte' },
      { time: '09:20', title: 'Standardizované psychodiagnostické testy vs. subjektivní dojmy' },
      { time: '18:40', title: 'Právo klást znalci otázky u soudního jednání (§ 127 OSŘ)' },
      { time: '27:10', title: 'Kdy a jak žádat revizní znalecký posudek' }
    ],
    summaryNotes: [
      'Znalec musí využívat výhradně validované a standardizované psychodiagnostické metody.',
      'Jako účastník řízení máte právo seznámit se s posudkem, podat písemné námitky a žádat výslech znalce přímo před soudem.',
      'Znalecký posudek je pouze jedním z důkazů; soudce jím není formálně vázán, ačkoliv má v praxi vysokou váhu.'
    ],
    keyTakeaways: [
      'Při vyšetření u znalce buďte přirození a autenticky prezentujte svou lásku k dítěti.',
      'Při zjištění metodických chyb v posudku okamžitě konzultujte postup s advokátem a žádejte revizi.'
    ],
    relatedLegalLinks: [
      { label: 'Průvodce znaleckými posudky', path: '/znalecke-posudky' },
      { label: 'Judikatura k vadným posudkům', path: '/judikatura' }
    ]
  }
];

export const VideothequeView: React.FC<VideothequeViewProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  const filteredVideos = VIDEOS_DATA.filter((vid) => {
    const matchesCategory = selectedCategory === 'all' || vid.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const categories = [
    { id: 'all', label: 'Všechna témata' },
    { id: 'rozhovory', label: 'Rozhovory s odborníky' },
    { id: 'navody', label: 'Praktické návody' },
    { id: 'webinare', label: 'Záznamy webinářů' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Videotéka & Studijní Záznamy • Táta má právo"
        description="Odborné rozhovory, praktické videonávody a záznamy webinářů o opatrovnickém právu, dětské psychologii a deeskalaci sporů."
        canonicalPath="/videoteka"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-400/30 mb-3">
              <Film className="w-3.5 h-3.5 text-indigo-400" /> Akademie Opatrovnictví
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Videotéka & Metodické Záznamy
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Strukturované studijní lekce, rozbory rozhovorů s dětskými psychology, advokáty a soudci s kompletními textovými rešeršemi a kapitolami.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onNavigate && (
              <button
                onClick={() => onNavigate('/studia')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <BookOpen className="w-4 h-4 text-indigo-300" />
                <span>E-learning Kurzy</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat téma nebo lektora..."
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>
      </div>

      {/* Video Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all group"
          >
            <div>
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer" onClick={() => setActiveVideo(video)}>
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/90 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg backdrop-blur-sm">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Duration & Category Badges */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] text-white">
                  <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md font-bold">
                    {video.categoryLabel}
                  </span>
                  <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {video.duration}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                  <Info className="w-3 h-3 text-amber-600" />
                  <span>{video.statusLabel}</span>
                </div>

                <h2
                  onClick={() => setActiveVideo(video)}
                  className="text-base font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-2"
                >
                  {video.title}
                </h2>

                <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {video.speaker.charAt(0)}
                  </div>
                  <div className="truncate">
                    <strong className="block text-slate-800 truncate">{video.speaker}</strong>
                    <span className="text-[10px] text-slate-400 block truncate">{video.speakerRole}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 pt-2">
                  {video.description}
                </p>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-bold">
                {video.chapters.length} kapitol lekce
              </span>
              <button
                onClick={() => setActiveVideo(video)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Otevřít záznam</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Video / Study Notes Modal Player */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-fadeIn">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between z-10">
              <div className="flex items-center gap-2 truncate pr-4">
                <Film className="w-5 h-5 text-indigo-600 shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {activeVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Video Player or Study Stream Indicator */}
              <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
                {activeVideo.videoEmbedUrl ? (
                  <div className="aspect-video">
                    <iframe
                      src={activeVideo.videoEmbedUrl}
                      title={activeVideo.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="p-8 sm:p-12 text-center text-white space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-400 flex items-center justify-center mx-auto shadow-lg">
                      <Video className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 max-w-lg mx-auto">
                      <h4 className="text-lg sm:text-xl font-bold text-white">
                        Odborný záznam & Studijní materiály
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                        Tento modul obsahuje kompletní textové a metodické zpracování. Oficiální videozáznam je v redakční postprodukci a bude doplněn po konečné autorizaci lektorem.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                      <Clock className="w-3.5 h-3.5" /> Stopáž lekce: {activeVideo.duration} • {activeVideo.chapters.length} kapitol
                    </div>
                  </div>
                )}
              </div>

              {/* Speaker & Metadata */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    {activeVideo.speaker.charAt(0)}
                  </div>
                  <div>
                    <strong className="block text-sm text-slate-900 font-bold">{activeVideo.speaker}</strong>
                    <span className="text-xs text-slate-500">{activeVideo.speakerRole}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white text-indigo-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm">
                    {activeVideo.categoryLabel}
                  </span>
                </div>
              </div>

              {/* Chapters & Timeline */}
              <div className="space-y-3">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" /> Časová osa & Kapitoly lekce
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeVideo.chapters.map((ch, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold shrink-0">
                        {ch.time}
                      </span>
                      <span className="text-slate-700 font-medium truncate">{ch.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Notes */}
              <div className="space-y-3">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" /> Klíčové body & Právní shrnutí
                </h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {activeVideo.summaryNotes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{note}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Takeaways */}
              <div className="bg-indigo-50/70 rounded-2xl p-4 border border-indigo-100 space-y-2 text-xs text-indigo-950">
                <strong className="block font-bold text-indigo-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> Hlavní doporučení pro praxi:
                </strong>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  {activeVideo.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx}>{takeaway}</li>
                  ))}
                </ul>
              </div>

              {/* Related Links & Navigation */}
              {activeVideo.relatedLegalLinks && activeVideo.relatedLegalLinks.length > 0 && onNavigate && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-bold text-slate-500 block">Související nástroje na portálu:</span>
                  <div className="flex flex-wrap gap-2">
                    {activeVideo.relatedLegalLinks.map((link, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveVideo(null);
                          onNavigate(link.path);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{link.label}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setActiveVideo(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Zavřít studijní záznam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
