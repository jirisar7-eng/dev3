import React, { useState, useEffect } from 'react';
import { Search, Scale, ExternalLink, Tag, Gavel, Filter, Calendar, BookOpen, ShieldCheck, Sparkles } from 'lucide-react';
import { SeoHead } from './SeoHead';

interface CourtCaseItem {
  id: string;
  fileNumber: string;
  court: string;
  title: string;
  summary: string;
  legalRatio: string;
  tags: string[];
  fullTextUrl?: string;
  publishedAt: string | Date;
}

const FALLBACK_CASES: CourtCaseItem[] = [
  {
    id: 'case-us-1506-23',
    fileNumber: 'I. ÚS 1506/23',
    court: 'Ústavní soud',
    title: 'Právo dítěte na péči obou rodičů a presumpce střídavé péče',
    summary: 'Stěžovatel (otec) se domáhal střídavé péče o nezletilého syna. Obecné soudy ji zamítly s odkazem na pracovní vytížení otce a nesouhlas matky. Ústavní soud rozhodnutí zrušil pro porušení článku 32 odst. 4 Listiny základních práv a svobod.',
    legalRatio: 'Svěření dítěte do střídavé péče by mělo být pravidlem, pokud jsou oba rodiče způsobilí dítě vychovávat a mají o jeho výchovu zájem. Nesouhlas jednoho z rodičů nebo jeho subjektivní výhrady samy o sobě nemohou být důvodem pro vyloučení střídavé péče.',
    tags: ['střídavá péče', 'základní práva', 'nesouhlas matky', 'rovnoprávnost rodičů'],
    fullTextUrl: 'https://nalus.usoud.cz/Search/GetText.aspx?sz=1-1506-23',
    publishedAt: '2023-10-18',
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
    publishedAt: '2023-03-14',
  },
  {
    id: 'case-us-1200-21',
    fileNumber: 'III. ÚS 1200/21',
    court: 'Ústavní soud',
    title: 'Zjišťování názoru nezletilého dítěte a role OSPOD',
    summary: 'Obecný soud neprovedl výslech 10letého dítěte ani nepřihlédl k jeho přání střídavé péče, přičemž se spolehl výhradně na stanovisko OSPOD, který střídavou péči nedoporučil.',
    legalRatio: 'OSPOD je pouze kolizním opatrovníkem, jehož názor nezavazuje soud. Soud je povinen zjišťovat názor dítěte odpovídajícím způsobem vzhledem k jeho věku a rozvojové úrovni a přihlížet k němu.',
    tags: ['názor dítěte', 'OSPOD', 'dokazování', 'vyslechnutí nezletilého'],
    fullTextUrl: 'https://nalus.usoud.cz/Search/GetText.aspx?sz=3-1200-21',
    publishedAt: '2021-11-02',
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
    publishedAt: '2022-08-25',
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
    publishedAt: '2024-05-10',
  },
];

const PRESET_TAGS = [
  'Vše',
  'střídavá péče',
  'předběžné opatření',
  'maření styku',
  'výživné',
  'OSPOD',
  'názor dítěte',
];

export const CaseDatabaseView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('Vše');
  const [cases, setCases] = useState<CourtCaseItem[]>(FALLBACK_CASES);

  useEffect(() => {
    fetch('/api/state/cases')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const list = data.cases || data.courtCases || data.data;
          if (Array.isArray(list) && list.length > 0) {
            setCases(list);
          }
        }
      })
      .catch(() => {
        // Fallback already set
      });
  }, []);

  const filteredCases = cases.filter((c) => {
    const matchesTag =
      selectedTag === 'Vše' || (Array.isArray(c.tags) && c.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()));

    const s = searchTerm.toLowerCase();
    const matchesSearch =
      c.fileNumber.toLowerCase().includes(s) ||
      c.title.toLowerCase().includes(s) ||
      c.summary.toLowerCase().includes(s) ||
      c.legalRatio.toLowerCase().includes(s) ||
      c.court.toLowerCase().includes(s) ||
      (Array.isArray(c.tags) && c.tags.some((t) => t.toLowerCase().includes(s)));

    return matchesTag && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Případová databáze rozsudků & Precedentů • Táta má právo"
        description="Rejstřík klíčové judikatury Ústavního a Nejvyššího soudu k opatrovnictví, střídavé péči, bránění ve styku a výživnému."
        canonicalPath="/pripadova-databaze"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <Gavel className="w-96 h-96" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>Databáze judikatury Ústavního & Nejvyššího soudu</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Případová Databáze Rozsudků
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Vyhledávejte v přehledu přelomových nálezů Ústavního soudu a rozsudků Nejvyššího soudu. Získejte právní věty (precedenty), které můžete přímou citací použít jako argumentační základ ve vašem opatrovnickém řízení.
          </p>
        </div>
      </div>

      {/* Search Bar & Tag Filters */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Field */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Hledat např. I. ÚS 1506/23, střídavá péče, OSPOD..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Quick Tag Pills */}
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 hidden sm:block" />
            {PRESET_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedTag === tag
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tag === 'Vše' ? 'Vše' : `#${tag}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rulings / Cases List */}
      <div className="space-y-6">
        {filteredCases.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <Gavel className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Žádný rozsudek neodpovídá vyhledávání</h3>
            <p className="text-xs text-slate-500">Zkuste zadat jinou spisovou značku nebo zvolte jiný tag.</p>
          </div>
        ) : (
          filteredCases.map((caseItem) => (
            <div
              key={caseItem.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-slate-50/90 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-950 text-white font-mono font-black text-xs rounded-lg shadow-sm border border-blue-900">
                    {caseItem.fileNumber}
                  </span>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider block">
                      {caseItem.court}
                    </span>
                    <h3 className="text-base font-black text-slate-900">{caseItem.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{new Date(caseItem.publishedAt).toLocaleDateString('cs-CZ')}</span>
                  </span>

                  {caseItem.fullTextUrl && (
                    <a
                      href={caseItem.fullTextUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-blue-950 transition-all shadow-sm"
                    >
                      <span>Plný text rozsudku</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                {/* Legal Ratio / Precedent Highlight */}
                <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl space-y-2 border border-slate-800 relative shadow-inner">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>PRÁVNÍ VĚTA / PRECEDENT PRO SOUDNÍ PODÁNÍ:</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-100 pl-6">
                    „{caseItem.legalRatio}“
                  </p>
                </div>

                {/* Case Summary */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Stručné shrnutí případu:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {caseItem.summary}
                  </p>
                </div>

                {/* Tags Footer */}
                {Array.isArray(caseItem.tags) && caseItem.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    {caseItem.tags.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTag(t)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-md transition-all"
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer info box */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 text-center space-y-1.5">
        <p className="text-xs text-slate-600">
          Judikatura je průběžně doplňována z oficiální databáze <strong>Nalús (Ústavní soud ČR)</strong> a <strong>Sbírky rozhodnutí Nejvyššího soudu ČR</strong>.
        </p>
        <span className="text-[11px] text-slate-400 block">
          Zdroj: Ústavní soud ČR & Nejvyšší soud ČR (2025/2026)
        </span>
      </div>
    </div>
  );
};
