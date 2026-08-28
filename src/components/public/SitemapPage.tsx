import React, { useState } from 'react';
import { SeoHead } from './SeoHead';
import {
  Map,
  Search,
  ExternalLink,
  ShieldCheck,
  Scale,
  Heart,
  Brain,
  BookOpen,
  Newspaper,
  MapPin,
  Info,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Layers
} from 'lucide-react';

interface SitemapItem {
  path: string;
  title: string;
  description: string;
  badge?: string;
}

interface SitemapSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  items: SitemapItem[];
}

const SITEMAP_SECTIONS: SitemapSection[] = [
  {
    id: 'krize',
    title: 'Krizová pomoc & Bezpečí',
    description: 'Okamžitá krizová intervence, SOS plány a rychlá podpora pro rodiče v akutní nouzi.',
    icon: ShieldCheck,
    color: 'from-rose-500/20 to-rose-600/20 text-rose-700 border-rose-200',
    items: [
      { path: '/sos-plan', title: 'SOS Krizový plán', description: 'Okamžitý algoritmus krok za krokem při náhlém odebrání dítěte či konfliktu.', badge: 'Krizové' },
      { path: '/krizova-pomoc', title: 'Rozcestník Krizové pomoci', description: 'Přehled krizových linek, psychologické a právní pomoci pro otce.', badge: '24/7' },
      { path: '/pravni-poradna', title: 'Bezplatná právní poradna', description: 'Orientace v základních právech a možnostech řešení rodinných sporů.' },
      { path: '/memento', title: 'Memento pro otce', description: 'Důležitá mementa a zásady pro zachování klidu a důstojnosti v těžkých chvílích.' }
    ]
  },
  {
    id: 'pravo',
    title: 'Právo, Soudy & Odborní průvodci',
    description: 'Metodičtí průvodci soudním procesem, jednáním s OSPOD, dokazováním a právy rodičů.',
    icon: Scale,
    color: 'from-indigo-500/20 to-indigo-600/20 text-indigo-700 border-indigo-200',
    items: [
      { path: '/soud', title: 'Průvodce soudním řízením', description: 'Příprava na opatrovnický soud, jednací síň, práva účastníka a předběžná opatření.', badge: 'Klíčové' },
      { path: '/ospod', title: 'Průvodce jednáním s OSPOD', description: 'Nahlížení do spisu Om (§ 38 SŘ), sociální šetření v bytě a práva rodiče.', badge: 'Doporučeno' },
      { path: '/prava', title: 'Katalog rodičovských práv', description: 'Zákonný a ústavní přehled práv otce a dítěte v českém právním řádu.' },
      { path: '/judikatura', title: 'Databáze judikatury Ústavního soudu', description: 'Klíčové nálezy ÚS k rovné péči, přespávání batolat a střídavé péči.' },
      { path: '/state-laws', title: 'Zákony & e-Sbírka', description: 'Oficiální znění zákonů: Občanský zákoník, ZŘS, OSŘ, Správní řád a Listina.' },
      { path: '/dokumenty', title: 'Vzory dokumentů & podání', description: 'Připravené vzory návrhů na svěření do péče, úpravu styku a stížností.' },
      { path: '/agenda', title: 'Opatrovnická agenda', description: 'Přehled a fáze opatrovnického řízení v ČR od podání po rozsudek.' },
      { path: '/majetek', title: 'Majetkové vypořádání & SJM', description: 'Pravidla vypořádání společného jmění manželů a bydlení po rozchodu.' },
      { path: '/vykon-rozhodnuti', title: 'Výkon rozhodnutí & maření styku', description: 'Postup při neplnění rozsudku: pokuty dle § 500 z.ř.s. a výkon rozhodnutí.' },
      { path: '/znalecke-posudky', title: 'Průvodce znaleckými posudky', description: 'Znalecké zkoumání z psychologie, námitky a žádost o revizní posudek.' },
      { path: '/odvolani', title: 'Odvolání a opravné prostředky', description: 'Lhůty a náležitosti odvolání ke krajskému soudu a ústavní stížnosti.' },
      { path: '/mezinarodni-spory', title: 'Mezinárodní spory & ÚMPOD', description: 'Řešení mezinárodních únosů dětí a přeshraniční úpravy péče dle Haagské úmluvy.' },
      { path: '/zdravotni-pece', title: 'Zdravotní péče & Dokumentace', description: 'Právo na nahlížení do zdravotní dokumentace dítěte a výběr lékaře.' },
      { path: '/skola', title: 'Školní záležitosti & Informace', description: 'Rodičovská práva ve škole: Bakaláři, třídní schůzky a změna školy.' }
    ]
  },
  {
    id: 'pece',
    title: 'Péče, Finance & Spolurodičovství',
    description: 'Kalkulace výživného, psychologická podpora a nástroje pro harmonickou péči o dítě.',
    icon: Heart,
    color: 'from-emerald-500/20 to-emerald-600/20 text-emerald-700 border-emerald-200',
    items: [
      { path: '/kalkulacka-vyzivneho', title: 'Kalkulačka výživného MS ČR', description: 'Výpočet doporučujícího výživného dle nových tabulek Ministerstva spravedlnosti.', badge: 'Interaktivní' },
      { path: '/pece', title: 'Portál péče o dítě', description: 'Přehled modelů péče: střídavá, společná, výhradní s rozšířeným stykem.' },
      { path: '/coparent-hub', title: 'CoParent Spolurodičovský Hub', description: 'Metodika a nástroje pro efektivní komunikaci a koordinaci mezi rodiči.' },
      { path: '/psychologie', title: 'Psychologická podpora dětí i otců', description: 'Jak chránit psychiku dítěte během rozchodu a zvládat stres.' },
      { path: '/kalendar', title: 'Procesní lhůtník & Kalendář', description: 'Sledování zákonných lhůt v opatrovnickém a soudním řízení.' }
    ]
  },
  {
    id: 'ai',
    title: 'AI Nástroje & Inteligentní asistenti',
    description: 'Specializovaní AI asistenti pro rozbor spisu, simulaci péče a tvorbu právních podání.',
    icon: Brain,
    color: 'from-amber-500/20 to-amber-600/20 text-amber-700 border-amber-200',
    items: [
      { path: '/ai-asistent', title: 'AI Právní Asistent', description: 'Odpovídá na otázky opatrovnického práva s citacemi zákonů a judikatury ÚS.', badge: 'AI Model' },
      { path: '/ai-pruvodce', title: 'AI Průvodce řízením', description: 'Interaktivní průvodce životní situací podle konkrétního stavu vašeho případu.' },
      { path: '/ai-formulare', title: 'AI Generátor formulářů a podání', description: 'Interaktivní tvorba návrhů k soudu a žádostí na OSPOD na míru.' },
      { path: '/ai-simulator', title: 'AI Simulátor modelů péče', description: 'Modelování harmonogramů střídavé péče, logistiky a finančních nákladů.' },
      { path: '/ai-case-manager', title: 'AI Case Manager & Rozbor spisu', description: 'Chytrá analýza dokumentů ze spisu Om a vyhledávání procesních vad.' }
    ]
  },
  {
    id: 'akademie',
    title: 'Akademie & Vzdělávání',
    description: 'E-learningové kurzy, kvízy, videonávody a vědecká knihovna studií.',
    icon: BookOpen,
    color: 'from-cyan-500/20 to-cyan-600/20 text-cyan-700 border-cyan-200',
    items: [
      { path: '/studia', title: 'Akademie E-learningových kurzů', description: '4 komplexní kurzy s 19 interaktivními lekcemi a sledováním pokroku.', badge: '19 lekcí' },
      { path: '/kvizy', title: 'Opatrovnické Kvízy & BIFF Trenažér', description: 'Interaktivní testy právních znalostí a trénink deeskalace zpráv.', badge: '5 kvízů' },
      { path: '/videoteka', title: 'Videotéka & Metodické záznamy', description: 'Odborné rozbory rozhovorů s psychology, advokáty a soudci s přepisy.', badge: 'Záznamy' },
      { path: '/studie', title: 'Vědecká knihovna studií', description: 'Recenzované vědecké studie o přespávání kojenců a střídavé péči (Warshak, Nielsen).' },
      { path: '/wiki', title: 'Právní a opatrovnická Wiki', description: 'Srozumitelný výkladový slovník pojmů: kolizní opatrovník, petit, PAS, SJM...' },
      { path: '/state-statistics', title: 'Statistiky opatrovnických soudů v ČR', description: 'Oficiální data Ministerstva spravedlnosti o podílu střídavé péče a délce řízení.' },
      { path: '/user-manual', title: 'Uživatelský manuál portálu', description: 'Kompletní návod k ovládání všech modulů a nástrojů portálu.' }
    ]
  },
  {
    id: 'obsah',
    title: 'Příběhy, Novinky & Články',
    description: 'Reálné kazuistiky otců, novinky v legislativě a odborné články.',
    icon: Newspaper,
    color: 'from-orange-500/20 to-orange-600/20 text-orange-700 border-orange-200',
    items: [
      { path: '/pribehy', title: 'Příběhy & Kazuistiky z praxe', description: 'Anonymizované příběhy otců: střídavá péče u batolat, obrana proti křivým obviněním.', badge: 'Kazuistiky' },
      { path: '/clanky', title: 'Odborné články a rozbory', description: 'Metodické analýzy soudních rozhodnutí a doporučení pro rodiče.' },
      { path: '/novinky', title: 'Novinky a aktuality', description: 'Přehled legislativních změn a událostí v oblasti rodinného práva.' },
      { path: '/faq', title: 'Časté dotazy (FAQ)', description: 'Odpovědi na nejčastější praktické otázky otců v opatrovnickém řízení.' }
    ]
  },
  {
    id: 'mapy',
    title: 'Adresáře & Mapy subjektů',
    description: 'Adresář a hodnocení okresních soudů, poboček OSPOD a mediačních center.',
    icon: MapPin,
    color: 'from-purple-500/20 to-purple-600/20 text-purple-700 border-purple-200',
    items: [
      { path: '/registr-subjektu', title: 'Registr opatrovnických subjektů', description: 'Vyhledávání okresních a krajských soudů a pracovišť OSPOD v ČR.' },
      { path: '/mapa-subjektu', title: 'Interaktivní mapa soudů a OSPOD', description: 'Geografická mapa institucí s kontakty a orientačními údaji.' }
    ]
  },
  {
    id: 'projekt',
    title: 'O projektu & Spolupráce',
    description: 'Mise spolku Táta má právo, dobrovolnictví, podpora a právní ochrana.',
    icon: Info,
    color: 'from-slate-500/20 to-slate-600/20 text-slate-700 border-slate-200',
    items: [
      { path: '/o-projektu', title: 'O projektu & Naše mise', description: 'Principy ochrany nejlepšího zájmu dítěte a rovnocenného rodičovství.' },
      { path: '/cesta-zakladatele', title: 'Cesta zakladatele', description: 'Osobní příběh vzniku iniciativy a cesta za spravedlivou péčí.' },
      { path: '/dobrovolnici', title: 'Hledáme dobrovolníky', description: 'Možnosti zapojení do činnosti spolku a odborné pomoci rodičům.' },
      { path: '/kodex-dobrovolnika', title: 'Etický kodex dobrovolníka', description: 'Zásady etického chování a neutrality při pomoci rodičům.' },
      { path: '/dohoda-o-spolupraci', title: 'E-Dohoda o dobrovolnictví', description: 'Vzor a uzavření dobrovolnické smlouvy se spolkem.' },
      { path: '/podporte-nas', title: 'Podpořte náš spolek', description: 'Informace o transparentním účtu a možnostech finanční či materiální podpory.' },
      { path: '/partneri', title: 'Partneři a spolupracující organizace', description: 'Odborní partneři, krizová centra a spolupracující advokátní kanceláře.' },
      { path: '/kontakt', title: 'Kontaktní centrum', description: 'Oficiální kontakty na poradnu, e-mail a infolinku.' },
      { path: '/zasady-ochrany-osobnich-udaju', title: 'Zásady ochrany osobních údajů (GDPR)', description: 'Informace o bezpečnosti dat a ochraně soukromí uživatelů.' },
      { path: '/pravni-dokumenty', title: 'Právní dokumenty spolku', description: 'Stanovy spolku, compliance a oficiální dokumentace.' },
      { path: '/aktivita-portalu', title: 'Aktivita a stav portálu', description: 'Aktuální provozní stav a statistika využití veřejných nástrojů.' }
    ]
  }
];

interface SitemapPageProps {
  onNavigate?: (path: string) => void;
}

export const SitemapPage: React.FC<SitemapPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('all');

  const filteredSections = SITEMAP_SECTIONS.map((section) => {
    if (selectedSection !== 'all' && section.id !== selectedSection) {
      return { ...section, items: [] };
    }
    const matchingItems = section.items.filter(
      (item) =>
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.path.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...section, items: matchingItems };
  }).filter((section) => section.items.length > 0);

  const totalPublicRoutes = SITEMAP_SECTIONS.reduce((acc, sec) => acc + sec.items.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 space-y-8">
      <SeoHead
        title="Mapa webu (Sitemap) • Táta má právo"
        description="Kompletní přehled všech veřejných stránek, průvodců, kalkulaček a AI nástrojů portálu Táta má právo."
        canonicalPath="/sitemap"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-400/30 mb-3">
              <Map className="w-3.5 h-3.5 text-amber-400" /> Navigace Portálu
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Kompletní Mapa Webu (Sitemap)
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Přehledně uspořádaný adresář všech {totalPublicRoutes} veřejných stránek, právních průvodců, kalkulaček a vzdělávacích modulů.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-xs text-white shrink-0">
            <Layers className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <span className="text-slate-300 block text-[10px]">Veřejné moduly</span>
              <strong className="text-sm text-white font-extrabold">{totalPublicRoutes} stránek</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Search and Section Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedSection('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedSection === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Všechny sekce ({totalPublicRoutes})
            </button>
            {SITEMAP_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setSelectedSection(sec.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedSection === sec.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {sec.title}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrovat stránky a témata..."
              className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            />
          </div>
        </div>

        {/* Sitemap Sections Grid */}
        <div className="space-y-10">
          {filteredSections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.id} className="space-y-4">
                {/* Section Header */}
                <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      {section.title}
                    </h2>
                    <p className="text-xs text-slate-500">{section.description}</p>
                  </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.items.map((item) => (
                    <div
                      key={item.path}
                      onClick={() => onNavigate && onNavigate(item.path)}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <code className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {item.path}
                          </code>
                          {item.badge && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {item.badge}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center justify-between">
                          <span>{item.title}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0 ml-1" />
                        </h3>

                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
