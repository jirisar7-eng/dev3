import React, { useState } from 'react';
import {
  Gavel,
  Search,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Filter,
  Scale,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface CaseLawViewProps {
  onNavigate?: (path: string) => void;
}

interface CaseRuling {
  id: string;
  spZn: string;
  title: string;
  category: 'stridava-pece' | 'utly-vek' | 'ospod-znalci' | 'informace-skola';
  categoryLabel: string;
  court: string;
  date: string;
  legalSentence: string;
  rationale: string;
  keywords: string[];
  nalusUrl?: string;
}

const CASE_RULINGS: CaseRuling[] = [
  {
    id: 'us-2482-13',
    spZn: 'Nález ÚS sp. zn. I. ÚS 2482/13',
    title: 'Střídavá péče obou rodičů jako primární pravidlo',
    category: 'stridava-pece',
    categoryLabel: 'Střídavá péče',
    court: 'Ústavní soud ČR',
    date: '26. 5. 2014',
    legalSentence: '„Jsou-li oba rodiče způsobilí dítě vychovávat, mají-li o jeho výchovu zájem a mají-li pro jeho výchovu vhodné podmínky, je sváření dítěte do střídavé péče obou rodičů pravidlem, nikoliv výjimkou. Opuštění tohoto pravidla vyžaduje prokázání mimořádných a objektivních důvodů.“',
    rationale: 'Ústavní soud zdůraznil, že ústavně zaručené právo obou rodičů na péči o dítě (čl. 32 odst. 4 Listiny) zakládá prezumpci střídavé péče. Nesouhlas jednoho z rodičů nemůže sám o sobě střídavé péči bránit, pokud pramení z osobních animozit.',
    keywords: ['střídavá péče', 'primární pravidlo', 'prezumpci', 'zájem dítěte', 'výchovná způsobilost'],
    nalusUrl: 'https://nalus.usoud.cz/Search/ResultDetail.aspx?id=84411'
  },
  {
    id: 'us-3216-13',
    spZn: 'Nález ÚS sp. zn. I. ÚS 3216/13',
    title: 'Svévolný nesouhlas jednoho rodiče se střídavou péčí',
    category: 'stridava-pece',
    categoryLabel: 'Střídavá péče',
    court: 'Ústavní soud ČR',
    date: '25. 9. 2014',
    legalSentence: '„Soudy nemohou vystavět své rozhodnutí o zamítnutí střídavé péče pouze na nesouhlasu jednoho z rodičů či na jeho odmítání komunikovat. Takový postup by vedl k tomu, že by se jeden rodič stával rukojmím druhého rodiče.“',
    rationale: 'Pokud jeden rodič blokuje komunikaci nebo bezdůvodně odmítá střídavou péči, soudy mají povinnost zkoumat motivaci tohoto odmítání a nesmí tuto nespolupráci odměňovat svěřením dítěte do výlučné péče nespolupracujícího rodiče.',
    keywords: ['nesouhlas matky', 'blokování komunikace', 'veto rodiče', 'střídavá péče'],
    nalusUrl: 'https://nalus.usoud.cz/'
  },
  {
    id: 'us-1835-12',
    spZn: 'Nález ÚS sp. zn. II. ÚS 1835/12',
    title: 'Péče o děti útlého věku a kojence otcem',
    category: 'utly-vek',
    categoryLabel: 'Útlý věk & Kojenci',
    court: 'Ústavní soud ČR',
    date: '12. 9. 2012',
    legalSentence: '„Paušální odmítání svěření dítěte útlého věku do péče otce s poukazem na věk dítěte je v rozporu s principem rovnosti rodičů a nejlepším zájmem dítěte. I dítě útlého věku si potřebuje budovat citovou vazbu k oběma rodičům.“',
    rationale: 'Nízký věk dítěte (např. 1–3 roky) bez dalšího neodůvodňuje vyloučení otce z péče nebo přespávání. Otci musí být umožněn postupný a plnohodnotný rozsah péče včetně nocování.',
    keywords: ['útlý věk', 'kojenec', 'přespávání', 'otecko', 'citová vazba'],
    nalusUrl: 'https://nalus.usoud.cz/'
  },
  {
    id: 'us-1206-09',
    spZn: 'Nález ÚS sp. zn. III. ÚS 1206/09',
    title: 'Nezastupitelná role otce a rovnocenný rozsah kontaktních dnů',
    category: 'utly-vek',
    categoryLabel: 'Útlý věk & Kojenci',
    court: 'Ústavní soud ČR',
    date: '23. 2. 2010',
    legalSentence: '„Otec má nezastupitelnou roli ve vývoji dítěte. Stanovení styku pouze na dva víkendy v měsíci bez širšího zapojení v průběhu pracovního týdne redukuje roli otce na Pouhého víkendového pořadatele zábavy.“',
    rationale: 'Soudy musí vytvářet podmínky pro to, aby se otec podílel i na běžných všedních dnech (škola, příprava, kroužky), ne pouze na víkendovém odpočinku.',
    keywords: ['role otce', 'víkendový rodič', 'všední dny', 'rozsah péče'],
    nalusUrl: 'https://nalus.usoud.cz/'
  },
  {
    id: 'us-1642-22',
    spZn: 'Nález ÚS sp. zn. II. ÚS 1642/22',
    title: 'Spravedlivé určování výživného při rovnocenné péči',
    category: 'stridava-pece',
    categoryLabel: 'Střídavá péče',
    court: 'Ústavní soud ČR',
    date: '1. 11. 2022',
    legalSentence: '„Při střídavé péči o stejném nebo srovnatelném rozsahu je namístě stanovit výživné oběma rodičům zohledňující jejich reálné čisté příjmy, nebo výživné neurčovat vůbec, pokud jsou majetkové poměry srovnatelné.“',
    rationale: 'Výživné nesmí sloužit jako majetkový přenos ve prospěch jednoho rodiče na úkor druhého, pokud oba pečují rovnocenně.',
    keywords: ['výživné', 'střídavá péče', 'čistý příjem', 'majetkové poměry'],
    nalusUrl: 'https://nalus.usoud.cz/'
  },
  {
    id: 'us-1559-22',
    spZn: 'Nález ÚS sp. zn. I. ÚS 1559/22',
    title: 'Právo opatrovnického rodiče na informace ze školy a zdravotnictví',
    category: 'informace-skola',
    categoryLabel: 'Informace & Škola',
    court: 'Ústavní soud ČR',
    date: '14. 9. 2022',
    legalSentence: '„Školy a lékaři nemohou opatrovnickému rodiči odepřít informace o dítěti. Právo na informace o vývoji dítěte je nedílnou součástí rodičovské odpovědnosti podle § 885 o.z.“',
    rationale: 'Zákon garantuje oběma rodičům přímý prístup k informacím. Nesouhlas jednoho rodiče nemůže školu zbavit povinnosti poskytnout informace druhému rodiči.',
    keywords: ['informace', 'škola', 'lékař', 'Bakaláři', 'pediatr'],
    nalusUrl: 'https://nalus.usoud.cz/'
  },
  {
    id: 'us-3646-18',
    spZn: 'Nález ÚS sp. zn. II. ÚS 3646/18',
    title: 'Povinnost OSPOD a soudů zakročit při maření styku',
    category: 'ospod-znalci',
    categoryLabel: 'OSPOD & Znalci',
    court: 'Ústavní soud ČR',
    date: '8. 1. 2019',
    legalSentence: '„Orgány sociálně-právní ochrany dětí i opatrovnické soudy jsou povinny aktivně konat a využít všech zákonných prostředků (včetně uložení pokut dle § 500 z.ř.s.), pokud dochází k svévolnému maření styku.“',
    rationale: 'Pasivita OSPOD nebo odkládání řešení maření styku vede k nenapravitelnému odcizení dítěte a zakládá porušení práva na rodinný život.',
    keywords: ['maření styku', 'pokuty', 'OSPOD', 'nečinnost', 'výkon rozhodnutí'],
    nalusUrl: 'https://nalus.usoud.cz/'
  }
];

export const CaseLawView: React.FC<CaseLawViewProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedSpZn, setCopiedSpZn] = useState<string | null>(null);
  const [expandedRulingId, setExpandedRulingId] = useState<string | null>('us-2482-13');

  const filteredRulings = CASE_RULINGS.filter((ruling) => {
    const matchesCategory = selectedCategory === 'all' || ruling.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      ruling.spZn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ruling.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ruling.legalSentence.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ruling.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCopyCitation = (ruling: CaseRuling) => {
    const textToCopy = `${ruling.spZn}: "${ruling.legalSentence}" (${ruling.title}, ze dne ${ruling.date})`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSpZn(ruling.id);
    setTimeout(() => setCopiedSpZn(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Judikatura Ústavního Soudu ČR pro Opatrovnictví • Táta má právo"
        description="Prohledávatelná databáze klíčových nálezů Ústavního soudu garantujících střídavou péči, rovnocenný styk, právo na informace od škol a obranu před mařením péče."
        canonicalPath="/judikatura"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-400/30 mb-3">
              <Gavel className="w-3.5 h-3.5 text-indigo-400" /> Databáze Nálezů Ústavního Soudu ČR
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Judikatura Ústavního Soudu pro Opatrovnické Návrhy
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Vyhledejte a zkopírujte přímé citace závazných nálezů Ústavního soudu pro vaše podání k opatrovnickému soudu nebo vyjádření pro OSPOD.
            </p>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('/ai-formulare')}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Použít citace v AI Generátoru</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hledat např. I. ÚS 2482/13, střídavá péče, kojenec..."
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
              Všechna rozhodnutí
            </button>
            <button
              onClick={() => setSelectedCategory('stridava-pece')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'stridava-pece' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Střídavá péče
            </button>
            <button
              onClick={() => setSelectedCategory('utly-vek')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'utly-vek' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Útlý věk & Kojenci
            </button>
            <button
              onClick={() => setSelectedCategory('ospod-znalci')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'ospod-znalci' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              OSPOD & Pokuty
            </button>
            <button
              onClick={() => setSelectedCategory('informace-skola')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'informace-skola' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Informace & Škola
            </button>
          </div>
        </div>
      </div>

      {/* Rulings List */}
      <div className="space-y-4">
        {filteredRulings.map((ruling) => {
          const isExpanded = expandedRulingId === ruling.id;
          const isCopied = copiedSpZn === ruling.id;

          return (
            <div
              key={ruling.id}
              className={`bg-white rounded-3xl border transition-all ${
                isExpanded ? 'border-indigo-600 shadow-md ring-1 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              {/* Header Card */}
              <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 cursor-pointer flex-1" onClick={() => setExpandedRulingId(isExpanded ? null : ruling.id)}>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-0.5 rounded-full bg-slate-900 text-amber-300 text-[10px] font-mono font-bold">
                      {ruling.spZn}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                      {ruling.categoryLabel}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 pt-0.5">
                    {ruling.title}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium block">
                    {ruling.court} • ze dne {ruling.date}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyCitation(ruling)}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-indigo-200"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Zkopírováno</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Kopírovat citaci</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setExpandedRulingId(isExpanded ? null : ruling.id)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Legal Sentence Quote */}
              <div className="px-5 sm:px-6 pb-4">
                <div className="p-4 rounded-2xl bg-indigo-950 text-indigo-100 text-xs font-serif italic leading-relaxed border border-indigo-900">
                  {ruling.legalSentence}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-100 space-y-4 text-xs leading-relaxed text-slate-800">
                  <div>
                    <strong className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] block mb-1">
                      Odůvodnění & Význam pro opatrovnickou praxi:
                    </strong>
                    <p className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-700">
                      {ruling.rationale}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Klíčová slova:</span>
                      {ruling.keywords.map((kw, kIdx) => (
                        <span key={kIdx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          #{kw}
                        </span>
                      ))}
                    </div>

                    {ruling.nalusUrl && (
                      <a
                        href={ruling.nalusUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        <span>Zobrazit v databázi NALUS</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
