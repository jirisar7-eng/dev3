import React, { useState } from 'react';
import {
  Scale,
  ShieldCheck,
  BookOpen,
  School,
  Building2,
  HeartHandshake,
  AlertOctagon,
  Copy,
  Check,
  Search,
  ExternalLink,
  ChevronRight,
  FileCode,
  Users,
  Info
} from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface RightsViewProps {
  onNavigate?: (path: string) => void;
}

interface LegalRightItem {
  id: string;
  category: 'rovnocenna-pece' | 'informace-skoly-lekari' | 'spolurozhodovani' | 'ochrana-styku';
  categoryTitle: string;
  paragraph: string;
  title: string;
  source: string;
  summary: string;
  legalText: string;
  practicalAdvice: string;
  commonViolations: string;
}

const LEGAL_RIGHTS: LegalRightItem[] = [
  {
    id: 'rovnocenna-pece-855',
    category: 'rovnocenna-pece',
    categoryTitle: '1. Rovnocenná péče obou rodičů',
    paragraph: '§ 855 a § 888 o.z.',
    title: 'Rovnocennost rodičovské odpovědnosti a právo dítěte na obou rodiče',
    source: 'Zákon č. 89/2012 Sb., občanský zákoník + čl. 32 odst. 4 Listiny',
    summary: 'Oba rodiče mají rovnocenná práva a povinnosti při výchově a péči o dítě. Péče a výchova dětí je právem rodičů a děti mají právo na péči obou rodičů.',
    legalText: '„Rodičovská odpovědnost náleží rovněž oběma rodičům. Dítě, které je v péči jednoho rodiče, má právo stýkat se s druhým rodičem v rozsahu, který je v zájmu dítěte, a druhý rodič má právo se s dítětem stýkat... Rodič, který má dítě v péči, je povinen dítě na styk s druhým rodičem řádně připravit, styk dítěte s druhým rodičem umožnit a při výkonu práva styku s druhým rodičem v potřebném rozsahu spolupracovat.“',
    practicalAdvice: 'I když dítě žije převážně u jednoho rodiče, druhý rodič neztrácí svá práva. Žádejte maximální rovnocenný rozsah péče (dříve střídavou péči).',
    commonViolations: 'Druhý rodič tvrdí: „Já jsem matka/otec, já rozhoduji, kdy dítě uvidíš.“ Všechny jednostranné diktáty jsou v rozporu se zákonem.'
  },
  {
    id: 'informace-885',
    category: 'informace-skoly-lekari',
    categoryTitle: '2. Právo na informace od škol a lékařů',
    paragraph: '§ 885 o.z. & Školský zákon',
    title: 'Právo opatrovnického rodiče na informace o vzdělávání a zdravotním stavu',
    source: 'Zákon č. 89/2012 Sb. (§ 885 o.z.) & Zákon č. 561/2004 Sb. (§ 21 školského zákona)',
    summary: 'Rodič, kterému nebylem rodičovská odpovědnost omezena, má plné právo na informace o dítěti od mateřských škol, základních škol, pediatrů a nemocnic.',
    legalText: '„Rodič, který nemá dítě v péči, má právo na pravidelné informace o dítěti od druhého rodiče i od třetích osob (škol, zdravotnických zařízení, zájmových kroužků). Třetí osoby jsou povinny tyto informace poskytnout bez ohledu na to, zda s tím druhý rodič souhlasí.“',
    practicalAdvice: 'Předložte škole nebo pediatrovi rodný list dítěte a písemnou žádost s odkazem na § 885 o.z. Škola má povinnost zřídit vám přístup do Bakalářů / EduPage.',
    commonViolations: 'Škola nebo lékař odmítne sdělit informace s odkazem na to, že "matka/otec si to nepřeje". Školní řád ani přání rodiče nemůže přebíjet zákon!'
  },
  {
    id: 'spolurozhodovani-877',
    category: 'spolurozhodovani',
    categoryTitle: '3. Spolurozhodování v podstatných záležitostech',
    paragraph: '§ 877 o.z.',
    title: 'Významné záležitosti dítěte vyžadují souhlas obou rodičů',
    source: 'Zákon č. 89/2012 Sb., občanský zákoník (§ 877 o.z.)',
    summary: 'V běžných věcech rozhoduje rodič, u kterého dítě právě pobývá. Ve významných záležitostech (výběr školy, změna bydliště, léčení, odjezd do zahraničí) je nutná dohoda obou rodičů.',
    legalText: '„Nedohodnou-li se rodiče v záležitosti, která je pro dítě významná zejména se zřetelem k jeho věku a vývoji, rozhodne soud na návrh jednoho z rodičů; to platí zejména při změně bydliště dítěte, výběru jeho vzdělání nebo pracovní přípravy, nezanedbatelném zdravotním zákroku či volbě jeho náboženství.“',
    practicalAdvice: 'Pokud druhý rodič bez vašeho souhlasu přihlásil dítě do jiné školy nebo odstěhoval dítě do vzdáleného města, bezodkladně podejte návrh k soudu na nahrazení projevu vůle nebo změnu bydliště.',
    commonViolations: 'Jednostranné přestěhování dítěte na druhý konec republiky bez souhlasu druhého rodiče či rozhodnutí soudu.'
  },
  {
    id: 'ochrana-styku-889',
    category: 'ochrana-styku',
    categoryTitle: '4. Ochrana před bráněním ve styku a mařením',
    paragraph: '§ 888 & § 889 o.z.',
    title: 'Povinnost rodiče usnadňovat styk a zakazování maření péče',
    source: 'Zákon č. 89/2012 Sb. (§ 888, § 889 o.z.) + § 500 z.ř.s.',
    summary: 'Rodič, který má dítě u sebe, je povinen aktivně usnadňovat a podporovat styk dítěte s druhým rodičem. Bezdůvodné bránění ve styku je hrubým porušením zákona.',
    legalText: '„Rodič, který má dítě v péči, je povinen nehatit styk druhého rodiče s dítětem. Opakované bezdůvodné maření styku nebo navádění dítěte proti druhému rodiči (syndrom zavrženého rodiče) zakládá důvod pro změnu rozhodnutí o péči a uložení soudních pokut.“',
    practicalAdvice: 'Každé nepředání dítěte pečlivě dokumentujte (zprávy, fotky, svědkové). Podejte návrh na výkon rozhodnutí uložením pokuty (§ 500 z.ř.s.).',
    commonViolations: 'Omlouvání nepředání dítěte výmluvami typu "dítě má rýmu" bez lékařské zprávy nebo "dítě nechce jít".'
  },
  {
    id: 'mezinarodni-standardy-un',
    category: 'rovnocenna-pece',
    categoryTitle: '1. Rovnocenná péče obou rodičů',
    paragraph: 'čl. 9 & čl. 18 Úmluvy',
    title: 'Mezinárodní standardy a právo na rovnocennou péči obou rodičů',
    source: 'Úmluva o právech dítěte (vyhl. pod č. 104/1991 Sb.) & Rezoluce Rady Evropy č. 2079 (2015)',
    summary: 'Mezinárodní smlouvy mají v ČR ústavní přednost před standardními zákony. Úmluva o právech dítěte a Rezoluce RE č. 2079 jednoznačně garantují právo dítěte na rovnocennou péči obou rodičů.',
    legalText: '„Smluvní státy uznávají právo dítěte odděleného od jednoho nebo obou rodičů udržovat pravidelné osobní styky a přímé spojení s oběma rodiči... a vyvinou veškeré úsilí k tomu, aby byla zajištěna zásada, že oba rodiče mají společnou odpovědnost... Rezoluce Rady Evropy č. 2079 vyzývá členské státy, aby zavedly princip vyrovnaného rozsahu péče (shared residency) jako výchozí bod s cílem eliminovat diskriminaci.“',
    practicalAdvice: 'Česká republika je plně vázána Úmluvou o právech dítěte podle čl. 10 Ústavy ČR. Argumentujte čl. 9 a 18 Úmluvy a Rezolucí Rady Evropy č. 2079 u opatrovnických soudů k překonání lokálních předsudků o výhradní péči jednoho rodiče.',
    commonViolations: 'Lokální opatrovnické orgány (OSPOD) a některé soudy argumentují zastaralými genderovými stereotypy a ignorují čl. 10 Ústavy ČR, který dává mezinárodním smlouvám aplikační přednost před vnitrostátními předpisy.'
  }
];

export const RightsView: React.FC<RightsViewProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredRights = LEGAL_RIGHTS.filter((right) => {
    const matchesCategory = selectedCategory === 'all' || right.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      right.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      right.paragraph.toLowerCase().includes(searchQuery.toLowerCase()) ||
      right.legalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      right.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleCopyCitation = (item: LegalRightItem) => {
    const textToCopy = `${item.title} (${item.paragraph})\nZdroj: ${item.source}\nCitace: ${item.legalText}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Přehled Práv Rodiče & Dítěte (§ 855–§ 889 o.z.) • Táta má právo"
        description="Kompletní strukturovaný přehled zákonných práv rodičů a dětí v ČR: rovnocenná péče, právo na informace od škol a lékařů, spolurozhodování a ochrana před mařením styku."
        canonicalPath="/prava"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-400/30 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Zákonná Práva Rodiče a Dítěte
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Práva Rodiče podle Občanského Zákoníku ČR
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Garance rovnocenné péče, přístupu k informacím ze škol a zdravotnictví, spolurozhodování a právní ochrany před mařením kontaktu s dítětem.
            </p>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('/ai-formulare')}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer shrink-0"
            >
              <FileCode className="w-4 h-4" />
              <span>Použít v AI Podání</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hledat paragraf, školu, styk..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Všechna práva
            </button>
            <button
              onClick={() => setSelectedCategory('rovnocenna-pece')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'rovnocenna-pece'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              1. Rovnocenná péče
            </button>
            <button
              onClick={() => setSelectedCategory('informace-skoly-lekari')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'informace-skoly-lekari'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              2. Školy & Lékaři
            </button>
            <button
              onClick={() => setSelectedCategory('spolurozhodovani')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'spolurozhodovani'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              3. Spolurozhodování
            </button>
            <button
              onClick={() => setSelectedCategory('ochrana-styku')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'ochrana-styku'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              4. Ochrana styku
            </button>
          </div>
        </div>
      </div>

      {/* Rights Cards List */}
      <div className="space-y-6">
        {filteredRights.map((item) => {
          const isCopied = copiedId === item.id;

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5 hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-black uppercase tracking-wider inline-block border border-indigo-200">
                    {item.paragraph}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                    {item.title}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium block">
                    {item.source}
                  </span>
                </div>

                <button
                  onClick={() => handleCopyCitation(item)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer border border-slate-200"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600">Citace zkopírována!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600" />
                      <span>Kopírovat paragraf</span>
                    </>
                  )}
                </button>
              </div>

              {/* Exact Legal Citation Text Box */}
              <div className="bg-slate-900 text-slate-100 p-4 sm:p-5 rounded-2xl text-xs font-serif italic leading-relaxed border border-slate-800 relative">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block not-italic mb-1">
                  Přesná zákonná formulace
                </span>
                {item.legalText}
              </div>

              {/* Summary and Practical Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1.5">
                  <strong className="text-indigo-950 font-black text-xs uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Praktická aplikace pro opatrovnickou praxi
                  </strong>
                  <p className="text-indigo-950 font-medium">
                    {item.practicalAdvice}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
                  <strong className="text-amber-950 font-black text-xs uppercase tracking-wider flex items-center gap-1">
                    <AlertOctagon className="w-4 h-4 text-amber-600" />
                    Typické nezákonné jednání protistrany / škol
                  </strong>
                  <p className="text-amber-950 font-medium">
                    {item.commonViolations}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
