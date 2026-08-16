import React, { useState } from 'react';
import {
  BookMarked,
  Search,
  Filter,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  Tag,
  ExternalLink,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface WikiViewProps {
  onNavigate?: (path: string) => void;
}

interface TermItem {
  id: string;
  term: string;
  firstLetter: string;
  category: 'pravo' | 'ospod' | 'soud' | 'finance';
  categoryLabel: string;
  citation?: string;
  definition: string;
  practicalTips: string[];
  relatedTerms?: string[];
}

const WIKI_TERMS: TermItem[] = [
  {
    id: 'biff',
    term: 'BIFF Komunikace',
    firstLetter: 'B',
    category: 'ospod',
    categoryLabel: 'Komunikace & Psychologie',
    definition: 'Metoda písomné komunikace s vysoce konfliktním druhým rodičem vyvinutá High Conflict Institute. Zkratka znamená Brief (Stručná), Informative (Informativní), Friendly (Přátelská), Firm (Pevná).',
    practicalTips: [
      'Eliminuje emoce, obvinění a dlouhé slohové práce.',
      'Služba pro bezpečný výkaz pro opatrovnický soud.'
    ],
    relatedTerms: ['PAS (Syndrom zavrženého rodiče)', 'OSPOD']
  },
  {
    id: 'cochemska-praxe',
    term: 'Cochemská praxe (Cochemský model)',
    firstLetter: 'C',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    definition: 'Interdisciplinární přístup v opatrovnickém soudnictví pocházející z německého Cochemu. Spojuje soudce, OSPOD, mediátory a psychology s cílem přimět rodiče k dohodě bez zbytečných znaleckých posudků.',
    practicalTips: [
      'Jednání probíhá do několika týdnů od podání návrhu.',
      'Rodičovská dohoda má přednost před rozhodnutím autority.'
    ],
    relatedTerms: ['Kolizní opatrovník', 'Soudní smír']
  },
  {
    id: 'dolozka-pravni-moci',
    term: 'Doložka právní moci',
    firstLetter: 'D',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    citation: '§ 160 o.s.ř.',
    definition: 'Oficiální razítko a potvrzení soudu na písemném vyhotovení rozsudku nebo usnesení, které osvědčuje, že rozhodnutí je konečné, nelze proti němu podat řádný opravný prostředek (odvolání) a je právně závazné a vykonatelné.',
    practicalTips: [
      'Bez doložky právní moci nelze vymáhat plnění exekučně.',
      'Vyžádejte si vyznačení doložky na kancekáři soudu po uplynutí odvolací lhůty (15 dní).'
    ],
    relatedTerms: ['Vykonatelnost', 'Petit']
  },
  {
    id: 'exekuce-styku',
    term: 'Exekuce styku (Výkon rozhodnutí)',
    firstLetter: 'E',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    citation: '§ 500 z.ř.s.',
    definition: 'Soudní postup uplatňovaný v případech, kdy jeden z rodičů svévolně a opakovaně maří styk druhého rodiče s dítětem určený vykonatelným rozsudkem nebo předběžným opatřením.',
    practicalTips: [
      'Soud nejprve ukládá výzvu a pokutu do 50 000 Kč.',
      'Při přetrvávajícím maření může soud přistoupit k odnětí dítěte nebo změně péče.'
    ],
    relatedTerms: ['Předběžné opatření', 'Doložka právní moci']
  },
  {
    id: 'kolizni-opatrovnik',
    term: 'Kolizní opatrovník',
    firstLetter: 'K',
    category: 'ospod',
    categoryLabel: 'OSPOD & Postupy',
    citation: '§ 892 odst. 3 o.z.',
    definition: 'Zástupce jmenovaný soudem pro nezletilé dítě v řízení, kde by mohlo dojít ke střetu zájmů mezi rodiči a dítětem (zpravidla Orgán sociálně-právní ochrany dětí - OSPOD).',
    practicalTips: [
      'Kolizní opatrovník má zastupovat nezávisle zájem dítěte, nikoliv zájem matky či otce.',
      'Máte právo předkládat opatrovníkovi své návrhy a důkazy.'
    ],
    relatedTerms: ['OSPOD', 'Předběžné opatření']
  },
  {
    id: 'ospod',
    term: 'OSPOD (Orgán sociálně-právní ochrany dětí)',
    firstLetter: 'O',
    category: 'ospod',
    categoryLabel: 'OSPOD & Postupy',
    citation: 'Zákon č. 359/1999 Sb.',
    definition: 'Státní orgán působící při obecních úřadech s rozšířenou působností. V opatrovnickém řízení plní funkci kolizního opatrovníka a provádí sociální šetření v rodinách.',
    practicalTips: [
      'Máte právo nahlížet do spisu Om vedeného u OSPODu (§ 38 správního řádu).',
      'Vystupujte vždy věcně, klidně a bez emocí.'
    ],
    relatedTerms: ['Kolizní opatrovník', 'BIFF Komunikace']
  },
  {
    id: 'pas',
    term: 'PAS (Syndrom zavrženého rodiče)',
    firstLetter: 'P',
    category: 'ospod',
    categoryLabel: 'Komunikace & Psychologie',
    definition: 'Stav, kdy jedno dítě bez racionálního důvodu odmítá a nenávidí jednoho z rodičů v důsledku systematické psychické manipulace a programování ze strany druhého pečujícího rodiče.',
    practicalTips: [
      'Důležité je včasné podání návrhu na soud k zamezení odcizení.',
      'Vyžaduje odborný psychologický posudek a krizovou terapii.'
    ],
    relatedTerms: ['BIFF Komunikace', 'Znalecký posudek']
  },
  {
    id: 'petit',
    term: 'Petit (Soudní návrh)',
    firstLetter: 'P',
    category: 'pravo',
    categoryLabel: 'Právní pojmy',
    citation: '§ 79 o.s.ř.',
    definition: 'Závěrečná a zcela zásadní část soudního návrhu, ve které žalobce/navrhovatel přesně formuluje, jaké rozhodnutí má soud vynést.',
    practicalTips: [
      'Petit musí být naprosto přesný, určitý a vykonatelný (dny, hodiny, místo předání).',
      'Soud je petitem v opatrovnickém řízení vázán z hlediska vykonatelnosti.'
    ],
    relatedTerms: ['Předběžné opatření', 'Doložka právní moci']
  },
  {
    id: 'predbezne-opatreni',
    term: 'Předběžné opatření (§ 452 z.ř.s.)',
    firstLetter: 'P',
    category: 'pravo',
    categoryLabel: 'Právní pojmy',
    citation: '§ 452 z.ř.s.',
    definition: 'Krizové rozhodnutí soudu vydávané ve zrychleném režimu (do 24 hodin u zvláštního nebo do 7 dnů u obecného), které zatímně upravuje poměry dítěte v situacích bezprostředního ohrožení nebo zamezení styku.',
    practicalTips: [
      'Slouží k okamžitému obnovení zamezeného styku s dítětem.',
      'Rozhodnutí je vykonatelné okamžikem doručení.'
    ],
    relatedTerms: ['Exekuce styku', 'Petit']
  },
  {
    id: 'status-quo',
    term: 'Status Quo',
    firstLetter: 'S',
    category: 'pravo',
    categoryLabel: 'Právní pojmy',
    definition: 'Stávající faktický stav věcí. V opatrovnickém řízení soudy často zkoumají faktické uspořádání péče a prostředí, ve kterém dítě reálně vyrůstá a žije.',
    practicalTips: [
      'Svévolná změna status quo jedním rodičem (únos dítěte, přestěhování) má být soudem okamžitě korigována předběžným opatřením.'
    ],
    relatedTerms: ['Předběžné opatření', 'OSPOD']
  },
  {
    id: 'znalecky-posudek',
    term: 'Znalecký posudek',
    firstLetter: 'Z',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    citation: '§ 127 o.s.ř.',
    definition: 'Odborné posouzení psychického stavu rodičů, dětské osobnosti, rodičovských kompetencí a citových vazeb vypracované soudním znalcem v oboru psychologie/psychiatrie.',
    practicalTips: [
      'Máte právo klást znalci otázky u soudního jednání.',
      'Výhrady k posudku je nutné podat písemně v zákonné lhůtě.'
    ],
    relatedTerms: ['Cochemská praxe', 'PAS (Syndrom zavrženého rodiče)']
  }
];

const ALPHABET = ['Vše', 'B', 'C', 'D', 'E', 'K', 'O', 'P', 'S', 'Z'];

export const WikiView: React.FC<WikiViewProps> = ({ onNavigate }) => {
  const [selectedLetter, setSelectedLetter] = useState<string>('Vše');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTerms = WIKI_TERMS.filter((t) => {
    const matchesLetter = selectedLetter === 'Vše' || t.firstLetter === selectedLetter;
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.definition.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLetter && matchesCategory && matchesQuery;
  });

  const handleCopyTerm = (term: TermItem) => {
    const textToCopy = `${term.term} ${term.citation ? `(${term.citation})` : ''}: ${term.definition}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(term.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Opatrovnická Právní Wiki & Slovník Pojmů • Táta má právo"
        description="Prohledatelný abecední a tematický slovník opatrovnických pojmů: OSPOD, BIFF komunikace, Předběžné opatření, Status Quo, Znalecký posudek, Exekuce styku."
        canonicalPath="/wiki"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-400/30 mb-3">
              <BookMarked className="w-3.5 h-3.5 text-indigo-400" /> Právní Wiki & Slovník
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Slovník Opatrovnických Pojmů
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Přezkoumané výklady právních institutů, postupů OSPOD, Cochemské praxe a psychologických termínů se zákonnými citacemi a praktickými tipy.
            </p>
          </div>
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
              placeholder="Vyhledat pojem (např. OSPOD, BIFF, § 452)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Všechny kategorie
            </button>
            <button
              onClick={() => setSelectedCategory('pravo')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'pravo' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Právní pojmy
            </button>
            <button
              onClick={() => setSelectedCategory('ospod')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'ospod' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              OSPOD & Psychologie
            </button>
            <button
              onClick={() => setSelectedCategory('soud')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'soud' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Soudní řízení
            </button>
          </div>
        </div>

        {/* Alphabet Bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[10px] font-black uppercase text-slate-400 mr-2 shrink-0">Abeceda:</span>
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold shrink-0 transition-all cursor-pointer ${
                selectedLetter === letter
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTerms.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-full border border-slate-200">
                  {item.categoryLabel}
                </span>
                {item.citation && (
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                    {item.citation}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-black text-slate-900 leading-tight">
                {item.term}
              </h3>

              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                {item.definition}
              </p>

              {/* Practical Tips */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <strong className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  💡 Praktické doporučení:
                </strong>
                <ul className="space-y-1">
                  {item.practicalTips.map((tip, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <span>Heslo v kódexu</span>
              </div>

              <button
                onClick={() => handleCopyTerm(item)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedId === item.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Zkopírováno</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Kopírovat pojem</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
