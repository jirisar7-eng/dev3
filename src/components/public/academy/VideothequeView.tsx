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
  Sparkles
} from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface VideothequeViewProps {
  onNavigate?: (path: string) => void;
}

interface VideoItem {
  id: string;
  title: string;
  category: 'rozhovory' | 'navody' | 'webinare';
  categoryLabel: string;
  duration: string;
  speaker: string;
  speakerRole: string;
  thumbnailUrl: string;
  videoEmbedUrl: string;
  description: string;
  summaryNotes: string[];
  attachments?: { name: string; size: string }[];
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
    videoEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'Bariéry a mýty okolo střídavé péče. Jak poznat potřeby dítěte a eliminovat syndrom zavrženého rodiče.',
    summaryNotes: [
      'Dítě nepotřebuje ideální rodiče, ale rodiče, kteří spolu dokáží nekontaktně a mírově vycházet.',
      'Přespávání kojenců a útlého věku u obou rodičů je podle klinických dat prospěšné pro stabilní attachment.',
      'Soudy by měly předcházet odcizování reakcí do týdnů, nikoliv měsíců.'
    ],
    attachments: [
      { name: 'Shrnutí rozhovoru (PDF)', size: '1.2 MB' }
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
    videoEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'Pět zlatých pravidel pro vystupování před sociální pracovnicí. Čeho se vyvarovat a jak si správně připravit podklady.',
    summaryNotes: [
      'Nikdy nepomlouvejte druhého rodiče – hovořte výhradně o svém vztahu k dítěti a svých výchovných plánech.',
      'Přineste si rozpis pracovní doby, doklady o zázemí a fotografie dětského pokoje.',
      'Požádejte sociální pracovnici o nahlédnutí do spisu Om podle § 38 správního řádu.'
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
    videoEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'Jak funguje Cochemský model v českém soudnictví. Interdisciplinární spolupráce soudce, OSPOD a mediátora.',
    summaryNotes: [
      'Cochemská praxe směřuje k dohodě rodičů před samotným znaleckým dokazováním.',
      'Rodičovská dohoda je 3x trvanlivější než autoritativní rozsudek soudu.',
      'Využití mediace u zapsaného mediátora.'
    ]
  },
  {
    id: 'vid-4',
    title: 'Návod: Psaní BIFF zpráv – Odstraňujeme emoce z e-mailů',
    category: 'navody',
    categoryLabel: 'Praktické videonávody',
    duration: '15 min',
    speaker: 'Ing. Tomáš Dvořák',
    speakerRole: 'Lektor komunikace',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    videoEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'Živá ukázka přepisu 3 provokativních e-mailů od protistrany do věcné a pevné BIFF odpovědi.',
    summaryNotes: [
      'Brief (Stručný): Nepište slohové práce; max 3–5 větných celků.',
      'Informative (Informativní): Reagujte pouze na technická fakta o dítěti.',
      'Friendly & Firm (Přátelský & Pevný): Zůstaňte zdvořilí, ale neústupní v pravidlech.'
    ]
  },
  {
    id: 'vid-5',
    title: 'Webinář: Znalecké posudky a jak jim čelit u soudu',
    category: 'webinare',
    categoryLabel: 'Záznamy webinářů',
    duration: '35 min',
    speaker: 'Doc. PhDr. Karel Zelenka',
    speakerRole: 'Soudní znalec',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    videoEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'Metodické chyby v posudcích, právo na výslech znalce u soudu a požadavky na revizní posudek.',
    summaryNotes: [
      'Znalec musí využívat standardizované psychodiagnostické metody.',
      'Máte právo kposudku podat písemné výhrady a žádat výslech znalce přímo před soudem.'
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Videotéka & Odborné Webináře • Táta má právo"
        description="Video-knihovna rozhovorů s opatrovnickými advokáty, dětskými psychology, návodů na BIFF komunikaci a záznamů webinářů o střídavé péči."
        canonicalPath="/videoteka"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-400/30 mb-3">
              <Film className="w-3.5 h-3.5 text-indigo-400" /> Videotéka Opatrovnictví
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Odborné Videorozhovory & Praktické Návody
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Sledujte přednášky opatrovnických soudců, dětských psychologů a praktické videonávody s doprovodnými textovými poznámkami a materiál ke stažení.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hledat video, řečníka, téma..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Všechna videa
            </button>
            <button
              onClick={() => setSelectedCategory('rozhovory')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'rozhovory' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Rozhovory s odborníky
            </button>
            <button
              onClick={() => setSelectedCategory('navody')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'navody' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Praktické návody
            </button>
            <button
              onClick={() => setSelectedCategory('webinare')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'webinare' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Záznamy webinářů
            </button>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all group"
          >
            <div>
              {/* Video Poster Thumbnail */}
              <div
                onClick={() => setActiveVideo(video)}
                className="relative aspect-video bg-slate-900 cursor-pointer overflow-hidden group-hover:opacity-95 transition-opacity"
              >
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                  </div>
                </div>
                <span className="absolute bottom-3 right-3 bg-slate-900/80 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                  {video.duration}
                </span>
                <span className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                  {video.categoryLabel}
                </span>
              </div>

              {/* Video Meta Info */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>{video.speaker} ({video.speakerRole})</span>
                </div>

                <h3
                  onClick={() => setActiveVideo(video)}
                  className="text-base font-black text-slate-900 leading-snug cursor-pointer group-hover:text-indigo-600 transition-colors"
                >
                  {video.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {video.description}
                </p>
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={() => setActiveVideo(video)}
                className="w-full py-2.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-800 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Přehrát video & poznámky</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal Player & Notes */}
      {activeVideo && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">
                  {activeVideo.categoryLabel} • {activeVideo.duration}
                </span>
                <h2 className="text-base sm:text-lg font-black text-white leading-snug">
                  {activeVideo.title}
                </h2>
              </div>

              <button
                onClick={() => setActiveVideo(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Frame */}
            <div className="bg-black aspect-video w-full shrink-0 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
                <div className="w-16 h-16 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-400/40 mb-1">
                  <Play className="w-8 h-8 ml-1 fill-current text-indigo-400" />
                </div>
                <h3 className="text-lg font-black max-w-md">{activeVideo.title}</h3>
                <p className="text-xs text-slate-300 max-w-sm">
                  Přednáší: {activeVideo.speaker} ({activeVideo.speakerRole})
                </p>
                <div className="inline-flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg">
                  <span>Přehrávač videa aktivní</span>
                </div>
              </div>
            </div>

            {/* Video Accompanying Text Notes */}
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-slate-800 leading-relaxed">
                <strong className="text-indigo-900 font-extrabold uppercase tracking-wider block mb-1">
                  Anotace videa:
                </strong>
                {activeVideo.description}
              </div>

              <div className="space-y-2">
                <strong className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Doprovodné textové poznámky a klíčové body:
                </strong>
                <ul className="space-y-2">
                  {activeVideo.summaryNotes.map((note, nIdx) => (
                    <li key={nIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {activeVideo.attachments && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Ke stažení: {activeVideo.attachments[0].name}</span>
                  </div>
                  <button className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs rounded-xl transition-colors cursor-pointer">
                    Stáhnout podklady
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
