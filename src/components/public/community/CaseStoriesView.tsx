import React, { useState } from 'react';
import { SeoHead } from '../SeoHead';
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Scale,
  Award,
  ChevronDown,
  ChevronUp,
  Heart,
  ShieldCheck,
  Calendar,
  Sparkles,
  PlusCircle,
  Send,
  X,
  Search,
  Filter,
  AlertCircle,
  Lock
} from 'lucide-react';

interface Story {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  badge: string;
  badgeBg: string;
  childAge: string;
  duration: string;
  result: string;
  summary: string;
  timeline: Array<{ period: string; event: string }>;
  takeaway: string;
  judicature?: string;
  details: string;
}

interface CaseStoriesViewProps {
  onNavigate: (path: string) => void;
}

export const CaseStoriesView: React.FC<CaseStoriesViewProps> = ({ onNavigate }) => {
  const [stories, setStories] = useState<Story[]>([
    {
      id: 'story-1',
      title: 'Od nuly ke střídavé péči u 10měsíčního chlapce',
      subtitle: 'Vyvrácení mýtu o údajné nemožnosti přespávání kojenců a batolat u otce',
      category: 'Kojenci & Batolata',
      badge: 'Ústřední judikatura',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      childAge: '10 měsíců na začátku (nyní 3 roky)',
      duration: '8 měsíců soudního řízení',
      result: 'Rovnocenná střídavá péče 7/7 dní s přespáváním',
      summary: 'Matka i OSPOD tvrdily, že kojenec potřebuje výhradní péči matky a přespávání u otce je možné až od 3 let. Díky vědeckým studiím a nálezům Ústavního soudu se podařilo dohodnout postupné navyšování péče zakončené rovnocenným režimem.',
      timeline: [
        { period: '1. měsíc', event: 'Matka brání kontaktu. Otec podává návrh na úpravu péče s odkazem na studii dr. Warshak (2014) o přespávání batolat.' },
        { period: '3. měsíc', event: 'Soud vydává úpravu styku: 3x týdně odpoledne po 4 hodinách + sobota. Otec důsledně pečuje, nakupuje výbavu.' },
        { period: '5. měsíc', event: 'Rozšíření na 1 noc týdně (sobota-neděle). OSPOD na základě zprávy dětské lékařky konstatuje vynikající vazbu.' },
        { period: '8. měsíc', event: 'Rozsudek: Střídavá péče v cyklu týden / týden od 18 měsíců věku chlapce.' },
      ],
      judicature: 'Nález Ústavního soudu sp. zn. II. ÚS 1642/22 & I. ÚS 3216/13 – věk dítěte sám o sobě nevylučuje přespávání u otce, je-li vybudována citová vazba.',
      takeaway: 'Nenechte se odbýt tvrzením, že malé dítě "patří k matce". Trvejte na postupné adaptaci od prvních měsíců rozchodu.',
      details: 'Klíčem k úspěchu bylo, že otec okamžitě zajistil plně vybavený dětský pokojíček, kojeneckou stravu, pleny a vedl si pečlivý deník. Na OSPOD se choval maximálně vstřícně a nikdy nekritizoval matku.',
    },
    {
      id: 'story-2',
      title: 'Jak jsem ustál 14 měsíců křivého obvinění a získal dítě do péče',
      subtitle: 'Praktická metodika obrany proti falešným nařčením z domácího násilí a zneužívání',
      category: 'Křivá obvinění',
      badge: 'Forenzní znalecký posudek',
      badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      childAge: '5 let (dcera)',
      duration: '14 měsíců',
      result: 'Střídavá péče + očištění jména otce',
      summary: 'Během vyhroceného rozvodu podala matka na otce trestní oznámení pro údajné psychické a fyzické týrání. Otec zachoval absolutní klid, nesnížil se k odplatě a aktivně součinnil s PČR a soudními znalci.',
      timeline: [
        { period: '1. měsíc', event: 'Podáno trestní oznámení. Otec okamžitě přechází výhradně na písemnou komunikaci a vyhledává právní zastoupení.' },
        { period: '4. měsíc', event: 'PČR po prověření věc odkládá. Matka podává stížnost. Otec navrhuje vypracování komplexního znaleckého posudku.' },
        { period: '9. měsíc', event: 'Znalecký posudek z oboru dětské psychologie potvrzuje vysoce nadprůměrnou vazbu dcery k otci a účelovost nařčení matky.' },
        { period: '14. měsíc', event: 'Soud schvaluje střídavou péči a varuje matku před dalším ovlivňováním dítěte.' },
      ],
      judicature: 'Nález Ústavního soudu sp. zn. III. ÚS 149/20 – účelové bránění ve styku a falešná obvinění jsou závažným porušením práv dítěte.',
      takeaway: 'Při křivém obvinění nepodléhejte panice. Nevyhrožujte, trvejte na odborném psychologickém posudku a zachovejte chladnou hlavu.',
      details: 'Rozhodujícím faktorem byl kompletní archiv zpráv v BIFF tónu. Když soudní znalec četl komunikaci, viděl klidného otce nabízejícího dohodu a hysterií reagující matku.',
    },
    {
      id: 'story-3',
      title: 'Rekonstrukce vztahu s dospívající dcerou po letech manipulace',
      subtitle: 'Překonání syndromu zavrženého rodiče (PAS) a obnova citové vazby u 14leté slečny',
      category: 'Odcizení & PAS',
      badge: 'Obnova vazby & Terapie',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
      childAge: '14 let (dcera)',
      duration: '18 měsíců',
      result: 'Obnovení pravidelného styku a víkendových pobytů',
      summary: 'Po 3 letech od rozvodu dcera pod vlivem matky odmítala s otcem mluvit i se setkat. Otec nevyvíjel agresivní tlak, ale nabízel nepodmíněnou lásku, trpělivost a odbornou rodinnou terapii.',
      timeline: [
        { period: '1. měsíc', event: 'Dcera na setkání pláče a opakuje matčina slova. Otec netrestá, nekritizuje matku, ale ujišťuje dceru o své lásce.' },
        { period: '6. měsíc', event: 'Soud nařídil odbornou rodinnou terapii v neutrálním krizovém centru. Pravidelná 45minutová sezení.' },
        { period: '12. měsíc', event: 'První společný víkendový výlet bez přítomnosti matky. Dcera se postupně otevírá a svěřuje.' },
        { period: '18. měsíc', event: 'Obnoven přirozený vztah. Dcera k otci jezdí dobrovolně každý druhý víkend a část prázdnin.' },
      ],
      judicature: 'Nález Ústavního soudu sp. zn. I. ÚS 2482/13 – povinnost státu a orgánů aktivně pomáhat obnovit narušenou vazbu mezi rodičem a dítětem.',
      takeaway: 'I dospívající dítě zasažené manipulací potřebuje vědět, že ho otec neopustil. Trpělivost a terapie dokáží zázraky.',
      details: 'Otec dceři nikdy neříkal: "Matka ti lže". Místo toho jí ukazoval fotky z dětství, psal jí milé dopisy a na sezeních ji naslouchal bez výčitek.',
    },
    {
      id: 'story-4',
      title: 'Střídavá péče na vzdálenost 120 km a dojíždění do školy',
      subtitle: 'Jak obhájit rovnocennou péči i při přestěhování druhého rodiče do jiného města',
      category: 'Vzdálenost & Logistika',
      badge: 'Judikatura vzdálenosti',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
      childAge: '8 let (syn v 2. třídě)',
      duration: '11 měsíců',
      result: 'Střídavá péče v 14denních cyklech s dělenou dopravou',
      summary: 'Matka se po rozchodu odstěhovala 120 km daleko a tvrdila, že vzdálenost vylučuje střídavou péči. Otec doložil flexibilitu práce na home office, pronajal si u školy byt a soud potvrdil střídavou péči.',
      timeline: [
        { period: '1. měsíc', event: 'Matka se jednostranně odstěhuje. Otec podává návrh na předběžné opatření a zákaz změny školy.' },
        { period: '4. měsíc', event: 'Soud nařizuje střídání po 14 dnech. Otec v týdnech péče syna osobně vozí a zajišťuje doučování.' },
        { period: '8. měsíc', event: 'Škola potvrzuje výborné školní výsledky a bezproblémovou docházku v obou rodinách.' },
        { period: '11. měsíc', event: 'Pravomocný rozsudek: Střídavá péče 14/14 dní, rodiče si předávají dítě v polovině cesty.' },
      ],
      judicature: 'Nález Ústavního soudu sp. zn. I. ÚS 1506/13 – vzdálenost bydlišť rodičů sama o sobě není překážkou pro střídavou péči, je-li překonatelná.',
      takeaway: 'Vzdálenost není nepřekonatelnou překážkou, pokud otec aktivně nabídne flexibilní logistické řešení a férové dělení nákladů na dopravu.',
      details: 'Otec předložil soudu precizní dopravní plán, tabulku vlakových a automobilových spojů a souhlas zaměstnavatele s prací na dálku.',
    },
    {
      id: 'story-5',
      title: 'Úspěšné vymáhání styku přes pokuty a výkon rozhodnutí (§ 500 z.ř.s.)',
      subtitle: 'Když druhý rodič svévolně odmítá předávat dítě a jak postupovat právní cestou',
      category: 'Výkon rozhodnutí',
      badge: 'Procesní vymáhání',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
      childAge: '6 let (syn)',
      duration: '9 měsíců',
      result: 'Uložení pokuty 25 000 Kč a úplné obnovení předávání',
      summary: 'Matka 6x po sobě nepředala syna pod záminkou smyšlených viróz bez lékařské zprávy. Otec na každé předání přišel se svědkem, pořídil zápis a podal návrh na výkon rozhodnutí uložením pokuty dle § 500 z.ř.s.',
      timeline: [
        { period: '1. měsíc', event: 'Matka odmítá otevřít dveře. Otec posílá zdvořilou BIFF SMS a sepisuje úřední záznam.' },
        { period: '3. měsíc', event: 'Po třetím zmaření podává otec k soudu návrh na výkon rozhodnutí dle § 500 z.ř.s.' },
        { period: '5. měsíc', event: 'Soud ukládá matce pokutu 25 000 Kč a varuje ji před změnou svěření dítěte do péče otce dle § 889 o.z.' },
        { period: '9. měsíc', event: 'Od uložení pokuty probíhá veškeré předávání bez jediného incidentu a přesně na minutu.' },
      ],
      judicature: 'Nález Ústavního soudu sp. zn. III. ÚS 3462/14 – povinnost obecných soudů důsledně a neprodleně vymáhat pravomocné soudní rozhodnutí o styku.',
      takeaway: 'Při maření styku neztrácejte nervy. Důsledně sbírejte důkazy o přítomnosti na místě a využijte zákonné sankce výkonu rozhodnutí.',
      details: 'Otec u každého neúspěšného předání zachoval naprostý klid, nikdy nekřičel, nezvonil opakovaně a vždy si zajistil časovou stopu (SMS, GPS).',
    }
  ]);

  const [expandedId, setExpandedId] = useState<string | null>('story-1');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Submit new story modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Kojenci & Batolata',
    childAge: '',
    duration: '',
    result: '',
    summary: '',
    takeaway: '',
    details: '',
    anonymityConsent: false
  });

  const categories = ['all', ...Array.from(new Set(stories.map((s) => s.category)))];

  const filteredStories = stories.filter((story) => {
    const matchesCat = selectedCategory === 'all' || story.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.takeaway.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.anonymityConsent) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsModalOpen(false);
      setFormData({
        title: '',
        category: 'Kojenci & Batolata',
        childAge: '',
        duration: '',
        result: '',
        summary: '',
        takeaway: '',
        details: '',
        anonymityConsent: false
      });
    }, 4000);
  };

  return (
    <div className="space-y-8 pb-16">
      <SeoHead
        title="Příběhy & Kazuistiky z opatrovnické praxe • Táta má právo"
        description="Reálné anonymizované kazuistiky otců: Střídavá péče u kojenců, obrana proti křivým obviněním, překonání syndromu zavrženého rodiče i střídání na dálku."
        canonicalPath="/pribehy"
      />

      {/* Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <button
          onClick={() => onNavigate('/krizova-pomoc')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět na rozcestník Krizové pomoci</span>
        </button>

        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-400/30 mb-3">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Kazuistiky & Skutečné příběhy
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Příběhy z Opatrovnické Praxe
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Inspirativní a poučné příběhy otců, kteří úspěšně prošli opatrovnickým labyrintem a obhájili právo svého dítěte na oba milující rodiče.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Sdílet anonymizovaný příběh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat === 'all' ? 'Všechna témata' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat v příbězích..."
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
          />
        </div>
      </div>

      {/* Stories Cards List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {filteredStories.map((story) => {
          const isExpanded = expandedId === story.id;
          return (
            <div
              key={story.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-amber-300"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : story.id)}
                className="p-6 sm:p-8 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full border font-bold text-[10px] ${story.badgeBg}`}>
                      {story.badge}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Věk dítěte: {story.childAge} • Doba: {story.duration}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                    {story.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    {story.subtitle}
                  </p>

                  <p className="text-xs text-slate-500 leading-relaxed pt-1">
                    {story.summary}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Výsledek</span>
                    <strong className="text-xs font-black text-emerald-600">{story.result}</strong>
                  </div>

                  <button className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold cursor-pointer">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded Story Details */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-6 sm:p-8 bg-slate-50/50 space-y-6">
                  {/* Key Takeaway Banner */}
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                    <strong className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Klíčové ponaučení (Takeaway pro vás):</span>
                    </strong>
                    <p className="text-xs font-bold leading-relaxed">{story.takeaway}</p>
                  </div>

                  {/* Details Paragraph */}
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white p-5 rounded-2xl border border-slate-200">
                    <h4 className="font-extrabold text-slate-900 mb-2 text-xs uppercase tracking-wider">
                      Podrobný průběh kazuistiky:
                    </h4>
                    <p>{story.details}</p>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="font-extrabold text-slate-900 mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span>Časová osa sporu:</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {story.timeline.map((step, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-black text-amber-600 uppercase block">
                            {step.period}
                          </span>
                          <p className="text-xs text-slate-700 leading-snug">{step.event}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Judicature Citation */}
                  {story.judicature && (
                    <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs flex items-start gap-3">
                      <Scale className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block mb-0.5 font-bold">Judikatorní opora:</strong>
                        <span className="text-slate-300">{story.judicature}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Share Anonymized Story Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600 shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Sdílet anonymizovaný příběh pro redakční posouzení
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Privacy Warning */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 flex items-start gap-3 text-xs leading-relaxed">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-amber-900 mb-1">
                    Důsledná ochrana soukromí & Redakční kontrola
                  </strong>
                  Všechny příspěvky prochází před případným zařazením do kazuistik důslednou redakční kontrolou a právním posouzením. Nikdy neuvádějte skutečná jména dětí, druhého rodiče ani konkrétní města/adresy.
                </div>
              </div>

              {isSubmitted ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Příběh byl bezpečně odeslán do redakce</h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Děkujeme za sdílení vaší zkušenosti. Naše redakce příběh anonymizuje, prověří právní kontext a zařadí jej do vzdělávací sekce kazuistik.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Anonymizovaný název kazuistiky *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Např. Střídavá péče u batolete po 6 měsících sporu"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kategorie</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Kojenci & Batolata">Kojenci & Batolata</option>
                        <option value="Křivá obvinění">Křivá obvinění</option>
                        <option value="Odcizení & PAS">Odcizení & PAS</option>
                        <option value="Vzdálenost & Logistika">Vzdálenost & Logistika</option>
                        <option value="Výkon rozhodnutí">Výkon rozhodnutí</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Věk dítěte</label>
                      <input
                        type="text"
                        required
                        value={formData.childAge}
                        onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
                        placeholder="Např. 4 roky (syn)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Délka řízení</label>
                      <input
                        type="text"
                        required
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="Např. 10 měsíců"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Výsledek sporu</label>
                      <input
                        type="text"
                        required
                        value={formData.result}
                        onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                        placeholder="Např. Střídavá péče 7/7 dní"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Stručné shrnutí situace *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      placeholder="Popište výchozí postoj matky a OSPOD, postup soudu a dosažený obrat..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Hlavní ponaučení pro ostatní otce (Takeaway) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.takeaway}
                      onChange={(e) => setFormData({ ...formData, takeaway: e.target.value })}
                      placeholder="Např. Nikdy nereagujte v hněvu a trvejte na přesném petitu předběžného opatření."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={formData.anonymityConsent}
                        onChange={(e) => setFormData({ ...formData, anonymityConsent: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 mt-0.5"
                      />
                      <span className="text-slate-600 text-[11px] leading-relaxed">
                        Potvrzuji, že text neobsahuje žádné osobní identifikační údaje (PII) třetích osob ani dětí a souhlasím s redakčním zpracováním a anonymizovanou publikací v sekci kazuistik.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!formData.anonymityConsent}
                    className="w-full py-2.5 bg-slate-900 hover:bg-amber-600 hover:text-slate-950 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Odeslat kazuistiku do redakce</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
