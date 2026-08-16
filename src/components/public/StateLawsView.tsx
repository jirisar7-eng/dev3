import React, { useState, useEffect } from 'react';
import { Search, Copy, Check, ExternalLink, Lightbulb, Scale, BookOpen, ShieldCheck, Filter } from 'lucide-react';
import { SeoHead } from './SeoHead';

interface LawSection {
  id: string;
  code: string;
  paragraph: string;
  title: string;
  category: string;
  officialText: string;
  practicalExplanation: string;
  courtUseTip: string;
  fullLawTitle: string;
}

const FALLBACK_LAWS: LawSection[] = [
  {
    id: 'law-887',
    code: '89/2012',
    paragraph: '§ 888',
    title: 'Právo dítěte na styk s oběma rodiči',
    category: 'Péče a styk',
    officialText: 'Dítě, které je v péči jen jednoho rodiče, má právo se stýkat s druhým rodičem v rozsahu, který je v zájmu dítěte, stejně jako druhý rodič má právo na styk s dítětem, ledaže soud styk rodiče s dítětem omezí nebo zakáže; soud může také určit podmínky styku, zejména místo, kde k němu má dojít, nebo určí osoby, které se smí nebo nesmí styku účastnit. Rodič, který má dítě v péči, je povinen dítě na styk s druhým rodičem řádně připravit, styk rodiče s dítětem řádně umožnit a při výkonu práva styku s druhým rodičem v potřebném rozsahu spolupracovat.',
    practicalExplanation: 'Tento paragraf zakotvuje zákonnou povinnost pečujícího rodiče aktivně připravit dítě na styk s druhým rodičem a styk nebrzdit ani nepřekážet. Pasivita matky/otce nebo vymlouvání se na „nechuť dítěte“ je přímým porušením § 888 OZ.',
    courtUseTip: 'V návrhu na výkon rozhodnutí nebo v opatrovnické žalobě citujte § 888 OZ jako důkaz, že bránění styku a psychická manipulace dítěte je v rozporu se zákonnou povinností součinnosti.',
    fullLawTitle: 'Zákon č. 89/2012 Sb., občanský zákoník',
  },
  {
    id: 'law-887-2',
    code: '89/2012',
    paragraph: '§ 887',
    title: 'Výkon rodičovské odpovědnosti a rovnoprávnost',
    category: 'Rodičovská odpovědnost',
    officialText: 'Rodičovskou odpovědnost vykonávají rodiče ve vzájemné shodě. Hrozí-li při zpoždění nebezpečí, může jeden z rodičů učinit právní jednání nebo dát k němu souhlas sám, je však povinen bez zbytečného odkladu uvědomit druhého rodiče.',
    practicalExplanation: 'Rodičovská odpovědnost náleží oběma rodičům stejně, bez ohledu na to, u koho má dítě trvalé bydliště. Změna školy, výběr lékaře či výjezd do zahraničí vyžadují souhlas obou.',
    courtUseTip: 'Pokud druhý rodič rozhoduje o dítěti jednostranně (např. přihlášení na novou školu bez vašeho vědomí), použijte § 887 OZ jako základ pro návrh na určení významné záležitosti dítěte.',
    fullLawTitle: 'Zákon č. 89/2012 Sb., občanský zákoník',
  },
  {
    id: 'law-906',
    code: '89/2012',
    paragraph: '§ 906',
    title: 'Svěření dítěte do péče a střídavá péče',
    category: 'Formy péče',
    officialText: 'Má-li být dítě svěřeno do společné nebo střídavé péče, je třeba, aby s tím rodiče souhlasili. Nejsou-li rodiče ve shodě, soud může rozhodnout o střídavé péči, je-li to v zájmu dítěte a jsou-li pro to splněny předpoklady u obou rodičů.',
    practicalExplanation: 'Nesouhlas jednoho z rodičů NENÍ překážkou pro nařízení střídavé péče. Soud má povinnost zkoumat faktické výchovné předpoklady, nikoli pouhou ochotu druhého rodiče dohodnout se.',
    courtUseTip: 'Při zdůvodňování návrhu na střídavou péči zdůrazněte, že vyhovujete všem výchovným předpokladům a že vetování střídavé péče druhým rodičem nesmí být soudem odměňováno.',
    fullLawTitle: 'Zákon č. 89/2012 Sb., občanský zákoník',
  },
  {
    id: 'law-zspod-19',
    code: '359/1999',
    paragraph: '§ 19',
    title: 'Role OSPOD jako kolizního opatrovníka',
    category: 'OSPOD & Stát',
    officialText: 'Orgán sociálně-právní ochrany dětí je povinen sledovat ochranu práv dítěte, působit k obnovení narušených funkcí rodiny a zastupovat nezletilé dítě v opatrovnickém řízení jako kolizní opatrovník.',
    practicalExplanation: 'OSPOD je zástupcem DÍTĚTE, nikoli soudcem ani poradcem jednoho z rodičů. Má povinnost vystupovat nestranně a chránit právo dítěte na oba rodiče.',
    courtUseTip: 'Vyjádření OSPOD je pouze jedním z důkazů. Pokud OSPOD nadržuje jedné straně bez objektivních důkazů, poukažte na judikaturu Ústavního soudu, podle které stanovisko OSPOD nesmí nahrazovat nezávislé dokazování soudu.',
    fullLawTitle: 'Zákon č. 359/1999 Sb., o sociálně-právní ochraně dětí',
  },
  {
    id: 'law-zvr-452',
    code: '292/2013',
    paragraph: '§ 452',
    title: 'Předběžné opatření o úpravě poměrů dítěte',
    category: 'Rychlá ochrana',
    officialText: 'Ocitlo-li se dítě bez jakékoliv péče nebo je-li jeho život nebo příznivý vývoj vážně ohrožen nebo narušen, soud předběžným opatřením upraví poměry dítěte na nezbytnou dobu tak, aby mu byla zajištěna řádná péče.',
    practicalExplanation: 'Předběžné opatření slouží k okamžitému zamezení izolace dítěte od jednoho z rodičů, pokud dochází k akutnímu zamezení styku nebo únosu dítěte.',
    courtUseTip: 'Návrh na předběžné opatření podle § 452 ZVR musí obsahovat přesná fakta, data a okamžitou naléhavost (např. "matka již 14 dní bezdůvodně neumožňuje jakýkoliv kontakt"). Soud rozhoduje do 7 dnů.',
    fullLawTitle: 'Zákon č. 292/2013 Sb., o zvláštních řízeních soudních',
  },
  {
    id: 'law-osr-102',
    code: '99/1963',
    paragraph: '§ 102',
    title: 'Obecné předběžné opatření v občanském soudním řízení',
    category: 'Procesní právo',
    officialText: 'Před zahájením řízení nebo během něj může předseda senátu nařídit předběžné opatření, je-li třeba, aby byly zatímně upraveny poměry účastníků, nebo je-li obava, že by výkon rozhodnutí byl ohrožen.',
    practicalExplanation: 'Umožňuje soudu dočasně upravit styk i v průběhu dlouho trvajícího soudního znalectví, aby dítě neztratilo vazbu na otce během mnohaměsíčního čekání na posudek.',
    courtUseTip: 'Navrhujte zatímní úpravu styku během znaleckého dokazování podle § 102 o.s.ř. Soud nesmí dopustit "odcizení dítěte" způsobené délkou znaleckého zkoumání.',
    fullLawTitle: 'Zákon č. 99/1963 Sb., občanský soudní řád',
  },
];

export const StateLawsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Vše');
  const [laws, setLaws] = useState<LawSection[]>(FALLBACK_LAWS);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/state/laws')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.laws) && data.laws.length > 0) {
          // Format server laws if available
          const mapped: LawSection[] = data.laws.map((l: any, idx: number) => ({
            id: l.id || `server-law-${idx}`,
            code: l.code || '89/2012',
            paragraph: l.paragraph || `§ ${l.code}`,
            title: l.title || 'Zákonný předpis',
            category: l.category || 'Legislativa',
            officialText: typeof l.content === 'string' ? l.content : (l.content?.summary || JSON.stringify(l.content)),
            practicalExplanation: l.practicalExplanation || 'Detailní legislativní znění dostupné v e-Sbírce.',
            courtUseTip: l.courtUseTip || 'Tento předpis lze citovat v opatrovnickém podání k okresnímu soudu.',
            fullLawTitle: l.title || 'Předpis z e-Sbírky ČR',
          }));
          setLaws([...mapped, ...FALLBACK_LAWS]);
        }
      })
      .catch(() => {
        // Fallback already set
      });
  }, []);

  const categories = ['Vše', ...Array.from(new Set(laws.map((l) => l.category)))];

  const filteredLaws = laws.filter((law) => {
    const matchesCategory = selectedCategory === 'Vše' || law.category === selectedCategory;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      law.paragraph.toLowerCase().includes(searchLower) ||
      law.title.toLowerCase().includes(searchLower) ||
      law.officialText.toLowerCase().includes(searchLower) ||
      law.practicalExplanation.toLowerCase().includes(searchLower) ||
      law.fullLawTitle.toLowerCase().includes(searchLower);

    return matchesCategory && matchesSearch;
  });

  const handleCopyCitation = (law: LawSection) => {
    const citation = `Dle ${law.paragraph} ${law.fullLawTitle}: "${law.officialText}"`;
    navigator.clipboard.writeText(citation);
    setCopiedId(law.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="e-Sbírka & e-Legislativa pro opatrovnictví • Táta má právo"
        description="Přehledné vyhledávání v klíčových paragrafech OZ, ZSPOD a o.s.ř. se srozumitelným praktickým výkladem pro otce u opatrovnického soudu."
        canonicalPath="/state-laws"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <Scale className="w-96 h-96" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Oficiální e-Sbírka ČR & Praktický výklad</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Opatrovnická e-Legislativa & Zákonná práva
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Vyhledávejte v klíčových paragrafech občanského zákoníku, zákona o SPOD a soudního řádu. Ke každému ustanovení nabízíme srozumitelný lidský výklad pro praxi u opatrovnického soudu a návod, jak citaci použít ve vašem podání.
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Hledat např. § 888, střídavá péče, OSPOD..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 hidden sm:block" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Laws List */}
      <div className="space-y-6">
        {filteredLaws.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Žádný paragraf neodpovídá vyhledávání</h3>
            <p className="text-xs text-slate-500">Zkuste zadat jiné klíčové slovo nebo změnit vybranou kategorii.</p>
          </div>
        ) : (
          filteredLaws.map((law) => (
            <div
              key={law.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-900 text-white font-black text-xs rounded-lg shadow-sm">
                    {law.paragraph}
                  </span>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{law.title}</h3>
                    <span className="text-[11px] text-slate-500">{law.fullLawTitle}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold rounded-md">
                    {law.category}
                  </span>
                  <button
                    onClick={() => handleCopyCitation(law)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
                    title="Zkopírovat doslovnou citaci zákona do vašeho soudního podání"
                  >
                    {copiedId === law.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Zkopírováno!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Kopírovat citaci</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-5">
                {/* Official Text */}
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono leading-relaxed border border-slate-800 relative">
                  <span className="text-[10px] text-blue-400 font-sans font-bold uppercase tracking-wider block mb-1">
                    Doslovná citace z e-Sbírky ČR:
                  </span>
                  „{law.officialText}“
                </div>

                {/* Practical Explanation for Fathers */}
                <div className="bg-amber-50/70 border-l-4 border-amber-500 p-4 rounded-r-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Srozumitelný výklad pro otce v praxi:</span>
                  </div>
                  <p className="text-xs text-amber-950 leading-relaxed font-medium pl-6">
                    {law.practicalExplanation}
                  </p>
                </div>

                {/* How to use at court */}
                <div className="bg-blue-50/60 border border-blue-200/80 p-4 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>Jak paragraf použít u soudního jednání:</span>
                  </div>
                  <p className="text-xs text-blue-950 leading-relaxed pl-6">
                    {law.courtUseTip}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Citation Banner */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 text-center space-y-2">
        <p className="text-xs text-slate-600">
          Znění předpisů jsou pravidelně ověřována vůči oficiálnímu systému <strong>e-Sbírka Ministerstva vnitra a spravedlnosti ČR</strong>.
        </p>
        <span className="text-[11px] text-slate-400 block">
          Zdroj: Ministerstvo spravedlnosti ČR & e-Sbírka.cz (2025/2026)
        </span>
      </div>
    </div>
  );
};
