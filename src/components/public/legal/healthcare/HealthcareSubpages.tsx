import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Stethoscope,
  Scale,
  FileText,
  MessageSquare,
  Activity,
  Thermometer,
  Briefcase,
  Share2,
  CheckSquare,
  Users,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Printer,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Building2,
  Clock,
  HeartPulse,
  Info
} from 'lucide-react';
import { SeoHead } from '../../SeoHead';

interface SubpageProps {
  onNavigate?: (path: string) => void;
}

// Common Subpage Header
const SubpageHeader: React.FC<{
  title: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
  onNavigate?: (path: string) => void;
}> = ({ title, badge, description, icon, onNavigate }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => onNavigate ? onNavigate('/zdravotni-pece') : (window.location.href = '/zdravotni-pece')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-xl border border-teal-200/80 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět na Zdravotní péči</span>
        </button>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Vytisknout</span>
        </button>
      </div>

      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold">
            {icon}
            <span>{badge}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{title}</h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <p>
          <strong>Právní & zdravotní upozornění:</strong> Informace na této stránce mají obecný edukační charakter. Nenahrazují individuální právní poradenství ani zdravotní péči poskytovanou zdravotnickým pracovníkem.
        </p>
      </div>
    </div>
  );
};

// Common Subpage Footer / Return
const SubpageFooter: React.FC<{
  sources: string[];
  related: { title: string; url: string; icon: React.ReactNode }[];
  onNavigate?: (path: string) => void;
}> = ({ sources, related, onNavigate }) => {
  return (
    <div className="space-y-6 pt-6 border-t border-slate-200">
      {/* Related topics */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Související témata</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {related.map((rel, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate ? onNavigate(rel.url) : (window.location.href = rel.url)}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-left transition-colors group cursor-pointer"
            >
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-teal-600 group-hover:text-teal-700 shrink-0">
                {rel.icon}
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900">{rel.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sources */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-1">
        <strong className="text-slate-700 block">Použité primární zdroje & právní předpisy:</strong>
        <ul className="list-disc pl-5 space-y-0.5">
          {sources.map((src, idx) => (
            <li key={idx}>{src}</li>
          ))}
        </ul>
        <p className="pt-1 text-[10px] text-slate-400">Aktuálnost ověřena k: Srpen 2026. Zdrojová provenance: e-Sbírka ČR, MZČR, ČSSZ.</p>
      </div>

      {/* Return button */}
      <div className="pt-2 text-center print:hidden">
        <button
          onClick={() => onNavigate ? onNavigate('/zdravotni-pece') : (window.location.href = '/zdravotni-pece')}
          className="inline-flex items-center gap-2 text-sm font-bold text-teal-800 bg-teal-100 hover:bg-teal-200 px-6 py-3 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět na hlavní rozcestník Zdravotní péče</span>
        </button>
      </div>
    </div>
  );
};

// Common FAQ Accordion Component
const FaqAccordion: React.FC<{ items: { q: string; a: string }[] }> = ({ items }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-teal-600" /> Časté otázky (FAQ)
      </h3>
      <div className="space-y-2">
        {items.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span>{item.q}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
              </button>
              {isOpen && (
                <div className="p-4 text-sm text-slate-700 bg-white border-t border-slate-100 leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 1. SUBPAGE: PRÁVA RODIČE (/zdravotni-pece/prava-rodice)
// ==========================================
export const PravaRodiceSubpage: React.FC<SubpageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 pt-4 max-w-4xl mx-auto">
      <SeoHead
        title="Práva rodiče ve zdravotní péči o dítě"
        description="Detailní průvodce rodičovskou odpovědností, rozhodováním o zdravotní péči (§ 858 a § 876 o.z.) a přítomností u vyšetření."
        canonicalPath="/zdravotni-pece/prava-rodice"
      />

      <SubpageHeader
        title="Práva rodiče ve zdravotní péči"
        badge="Práva rodiče"
        description="Detailní výklad rodičovské odpovědnosti, přístupu k informacím o zdraví dítěte a rozhodování o běžné vs. závažné zdravotní péči."
        icon={<Scale className="w-4 h-4 text-teal-400" />}
        onNavigate={onNavigate}
      />

      {/* Anchor Navigation */}
      <div className="bg-slate-100 p-4 rounded-2xl flex flex-wrap gap-2 text-xs font-semibold print:hidden">
        <span className="text-slate-500 flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Obsah stránky:</span>
        <a href="#odpovednost" className="text-teal-700 hover:underline bg-white px-2.5 py-1 rounded-lg border border-slate-200">Rodičovská odpovědnost</a>
        <a href="#rozsah" className="text-teal-700 hover:underline bg-white px-2.5 py-1 rounded-lg border border-slate-200">Běžná vs. Závažná péče</a>
        <a href="#vysetreni" className="text-teal-700 hover:underline bg-white px-2.5 py-1 rounded-lg border border-slate-200">Přítomnost u vyšetření</a>
        <a href="#neshody" className="text-teal-700 hover:underline bg-white px-2.5 py-1 rounded-lg border border-slate-200">Řešení neshod</a>
      </div>

      {/* Section 1: Rodičovská odpovědnost */}
      <section id="odpovednost" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Scale className="w-5 h-5 text-teal-600" /> Rodičovská odpovědnost (§ 858 a násl. o.z.)
        </h2>
        <div className="text-sm text-slate-700 space-y-3 leading-relaxed">
          <p>
            Rodičovská odpovědnost zahrnuje povinnosti a práva rodičů, která spočívají v péči o dítě, zahrnující zejména péči o jeho zdraví, jeho tělesný, citový, rozumový a mravní vývoj.
          </p>
          <div className="bg-teal-50 p-4 rounded-xl border border-teal-200 font-medium text-teal-900 text-xs sm:text-sm">
            <strong>Klíčová právní zásada:</strong> Rodičovská odpovědnost náleží oběma rodičům rovnocenně, a to i po rozvodu či rozchodu. Trvání rodičovské odpovědnosti nezávisí na tom, komu bylo dítě svěřeno do péče, pokud soud jednoho z rodičů této odpovědnosti výslovně nezbavil nebo jí neomezil (§ 865 odst. 1 občanského zákoníku).
          </div>
        </div>
      </section>

      {/* Section 2: Běžná vs. Závažná péče */}
      <section id="rozsah" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-600" /> Běžná vs. Závažná zdravotní péče
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" /> Běžná zdravotní péče (§ 876 o.z.)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Při běžných záležitostech zastupuje dítě kterýkoliv z rodičů samostatně. Má se za to, že druhý rodič s jeho jednáním souhlasí.
            </p>
            <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1 pt-2">
              <li>Ošetření běžné virózy, rýmy či odřeniny</li>
              <li>Pravidelné preventivní prohlídky u pediatra</li>
              <li>Standardní povinné očkování podle kalendáře</li>
              <li>Běžná zubní hygiena a preventivní prohlídky</li>
            </ul>
          </div>

          <div className="bg-amber-50/70 p-5 rounded-xl border border-amber-200 space-y-2">
            <h3 className="font-bold text-amber-950 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Závažná zdravotní péče (§ 877 o.z.)
            </h3>
            <p className="text-xs text-amber-900 leading-relaxed">
              Jde-li o záležitost, která je pro dítě významná, je nutný souhlas obou rodičů. V případě neshody rozhodne na návrh jednoho z rodičů soud.
            </p>
            <ul className="list-disc pl-4 text-xs text-amber-900 space-y-1 pt-2">
              <li>Plánovaný operační zákrok s trvalým či významným rizikem</li>
              <li>Nahrnutá nepovinná očkování či experimentální léčba</li>
              <li>Dlouhodobá psychiatrická či psychoterapeutická péče</li>
              <li>Změna ošetřujícího pediatra či dětského specialisty</li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl text-xs leading-relaxed space-y-1">
          <strong className="text-teal-400 block">Akutní neodkladná péče (§ 38 zákona č. 372/2011 Sb.):</strong>
          <p className="text-slate-300">
            Při akutním ohrožení života nebo zdraví dítěte poskytne lékař neodkladnou péči okamžitě. Souhlas rodičů se v takových případech nečeká a zdravotnický zásah nelze odkládat.
          </p>
        </div>
      </section>

      {/* Section 3: Přítomnost u vyšetření */}
      <section id="vysetreni" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-teal-600" /> Přítomnost rodiče u vyšetření a hospitalizace
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Podle § 28 odst. 3 písm. e) zákona č. 372/2011 Sb., o zdravotních službách, má nezletilý pacient právo na nepřetržitou přítomnost zákonného zástupce, pokud to není v rozporu s jinými právními předpisy nebo to nenaruší poskytování zdravotních služeb.
        </p>
        <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1.5">
          <li>Rodič má právo doprovázet dítě na ordinace, odběry i preventivní prohlídky.</li>
          <li>Při hospitalizaci má rodič právo na pobyt s dítětem na lůžkovém oddělení (v závislosti na kapacitě nemocnice a věku dítěte).</li>
          <li>Lékař či nemocnice nemohou rodiči zakázat přítomnost u dítěte bez věcného a zákonem odůvodněného rizika.</li>
        </ul>
      </section>

      {/* Model Example */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-300 space-y-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">Modelový příklad — nejde o právně závazný vzor</span>
        <h3 className="font-bold text-sm text-slate-900">Příklad: Informování otce o plánovaném očkování</h3>
        <p className="text-xs text-slate-700 leading-relaxed">
          Matka objednala dítě na běžné povinné očkování, ale otci nesdělila termín. Otec kontaktoval přímo ordinaci pediatra. Pediatr otci termín sdělil a umožnil mu účast na prohlídce. Postup pediatra byl zcela v souladu s § 31 zákona č. 372/2011 Sb., neboť rodičovská odpovědnost otce nebyla omezená.
        </p>
      </div>

      {/* Risks / What to watch out for */}
      <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200 space-y-2 text-xs text-rose-950">
        <h3 className="font-bold text-sm text-rose-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" /> Na co si dát pozor (Časté chyby)
        </h3>
        <ul className="list-disc pl-5 space-y-1 text-rose-900">
          <li><strong>Pozor na automatické tvrzení:</strong> «„Vždy musí rozhodnout oba rodiče.“» U běžné denní péče a standardních vyšetření stačí jednání jednoho rodiče. Souhlas obou se vyžaduje u významných záležitostí.</li>
          <li><strong>Nezneužívejte veto:</strong> Bezdůvodné blokování potřebné zdravotní péče dítěti druhým rodičem může být soudem posouzeno jako jednání v rozporu s nejlepším zájmem dítěte.</li>
        </ul>
      </div>

      {/* FAQ */}
      <FaqAccordion
        items={[
          {
            q: 'Může lékař odmítnout sdělit informace otci, protože si to matka nepřeje?',
            a: 'Ne. Pokud otec nebyl soudně zbaven rodičovské odpovědnosti, přání druhého rodiče nemá žádný právní význam. Lékař je ze zákona (§ 31 č. 372/2011 Sb.) povinen informace poskytnout.'
          },
          {
            q: 'Co když druhý rodič nesouhlasí s povinným očkováním?',
            a: 'Povinná očkování stanovená vyhláškou spadají pod plnění zákonné povinnosti. Pokud jeden rodič odmítá povinné očkování bez zdravotní indikace, může se druhý rodič obrátit na opatrovnický soud nebo nechat dítě očkovat v rámci ochrany jeho zdraví.'
          },
          {
            q: 'Mohu změnit pediatra dítěte bez souhlasu matky?',
            a: 'Změna ošetřujícího lékaře je považována za závažnou záležitost (§ 877 o.z.), u které je vyžadována dohoda obou rodičů. Pokud se nedohodnete, o změně pediatra rozhodne soud.'
          }
        ]}
      />

      {/* CTA */}
      <div className="bg-teal-900 text-white p-6 rounded-2xl space-y-3 print:hidden">
        <h3 className="font-bold text-base">Potřebujete písemně požádat lékaře o informace?</h3>
        <p className="text-xs text-teal-100">
          Vygenerujte si oficiální písemnou žádost pediatrovi podle zákona o zdravotních službách.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={() => onNavigate ? onNavigate('/ai-formulare?template=zdravotni-informace') : (window.location.href = '/ai-formulare?template=zdravotni-informace')}
            className="inline-flex items-center gap-2 bg-teal-400 hover:bg-teal-300 text-teal-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <span>Otevřít AI Formulář pro lékaře</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <SubpageFooter
        sources={[
          'Zákon č. 89/2012 Sb., občanský zákoník (§ 858, § 865, § 876, § 877 o.z.)',
          'Zákon č. 372/2011 Sb., o zdravotních službách (§ 28, § 31, § 35, § 38)',
          'Listina základních práv a svobod (čl. 32 odst. 4)'
        ]}
        related={[
          { title: 'Zdravotnická dokumentace', url: '/zdravotni-pece/dokumentace', icon: <FileText className="w-4 h-4" /> },
          { title: 'Komunikace s lékařem', url: '/zdravotni-pece/komunikace', icon: <MessageSquare className="w-4 h-4" /> },
          { title: 'Přehled odborníků', url: '/zdravotni-pece/odbornici', icon: <Users className="w-4 h-4" /> }
        ]}
        onNavigate={onNavigate}
      />
    </div>
  );
};

// ==========================================
// 2. SUBPAGE: ZDRAVOTNICKÁ DOKUMENTACE (/zdravotni-pece/dokumentace)
// ==========================================
export const DokumentaceSubpage: React.FC<SubpageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 pt-4 max-w-4xl mx-auto">
      <SeoHead
        title="Zdravotnická dokumentace dítěte — Práva a nahlížení"
        description="Jak získat výpis, nahlížet do zdravotnické dokumentace podle § 65 zákona č. 372/2011 Sb. a řešit případné obstrukce."
        canonicalPath="/zdravotni-pece/dokumentace"
      />

      <SubpageHeader
        title="Zdravotnická dokumentace dítěte"
        badge="Dokumentace"
        description="Detailní průvodce právem na nahlížení do zdravotnické dokumentace, pořizování kopií a postupem při nesoučinnosti poskytovatele."
        icon={<FileText className="w-4 h-4 text-teal-400" />}
        onNavigate={onNavigate}
      />

      {/* Anchor Nav */}
      <div className="bg-slate-100 p-4 rounded-2xl flex flex-wrap gap-2 text-xs font-semibold print:hidden">
        <span className="text-slate-500 flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Obsah stránky:</span>
        <a href="#pravo" className="text-teal-700 hover:underline bg-white px-2.5 py-1 rounded-lg border border-slate-200">Právo na nahlížení</a>
        <a href="#postup" className="text-teal-700 hover:underline bg-white px-2.5 py-1 rounded-lg border border-slate-200">Postup žádosti</a>
        <a href="#obstrukce" className="text-teal-700 hover:underline bg-white px-2.5 py-1 rounded-lg border border-slate-200">Řešení obstrukcí</a>
      </div>

      {/* Section 1: Právo na nahlížení */}
      <section id="pravo" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-600" /> Právo na nahlížení a kopie (§ 65 zákona č. 372/2011 Sb.)
        </h2>
        <div className="text-sm text-slate-700 space-y-3 leading-relaxed">
          <p>
            Podle § 65 odst. 1 písm. a) zákona č. 372/2011 Sb., o zdravotních službách, mají zákonní zástupci nezletilého pacienta právo <strong>nahlížet do zdravotnické dokumentace, pořizovat si z ní výpisy nebo kopie</strong>.
          </p>
          <div className="bg-teal-50 p-4 rounded-xl border border-teal-200 font-medium text-teal-900 text-xs sm:text-sm">
            <strong>Důležitý právní fakt:</strong> Právo nahlížet do dokumentace náleží oběma zákonným zástupcům nezávisle na sobě. Lékař nesmí k nahlížení či vydání kopie vyžadovat souhlas druhého rodiče.
          </div>
        </div>
      </section>

      {/* Section 2: Postup žádosti */}
      <section id="postup" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-600" /> Praktický postup při žádosti o dokumentaci
        </h2>
        <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-3 leading-relaxed">
          <li>
            <strong>Ústní či písemná žádost:</strong> Požádejte ošetřujícího pediatra či specialistu o nahlédnutí nebo pořízení kopií dokumentace. Doporučuje se písemná forma (e-mail s doručením nebo doporučený dopis).
          </li>
          <li>
            <strong>Lhůta pro vyřízení:</strong> Podle § 66 odst. 1 zákona č. 372/2011 Sb. je poskytovatel zdravotních služeb povinen umožnit nahlédnutí nebo pořídit výpis/kopii <strong>do 30 dnů od obdržení žádosti</strong>.
          </li>
          <li>
            <strong>Úhrada nákladů:</strong> Poskytovatel může požadovat úhradu ve výši, která nesmí překročit náklady spojené s pořízením kopií (např. běžná cena fotokopií a poštovného).
          </li>
        </ol>
      </section>

      {/* Section 3: Řešení obstrukcí */}
      <section id="obstrukce" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" /> Postup při odmítnutí nebo obstrukcích ze strany lékaře
        </h2>
        <div className="text-sm text-slate-700 space-y-3 leading-relaxed">
          <p>Pokud se setkáte s tvrzením „matka/otec si nepřeje, abych vám dokumentaci ukázal“:</p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <p>1. Zašlete lékaři písemnou žádost s odkazem na <strong>§ 65 odst. 1 písm. a) zákona č. 372/2011 Sb.</strong></p>
            <p>2. Upozorněte lékaře, že odepření dokumentace zákonnému zástupci je přestupkem podle zákona o zdravotních službách.</p>
            <p>3. Při přetrvávajícím odmítání podejte písemnou stížnost zřizovateli zdravotnického zařízení (u soukromého ordinace Krajskému úřadu, odboru zdravotnictví, případně České lékařské komoře).</p>
          </div>
        </div>
      </section>

      {/* Model Example */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-300 space-y-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">Modelový příklad — nejde o právně závazný vzor</span>
        <h3 className="font-bold text-sm text-slate-900">Příklad: Žádost o kopii zdravotní karty u dětského alergologa</h3>
        <p className="text-xs text-slate-700 leading-relaxed">
          Otec se dozvěděl, že dítě navštěvuje alergologii. Sestřička odmítla vydat kopii zprávy bez přítomnosti matky. Otec zaslal doporučený dopis vedoucímu lékaři s odkazem na § 65 zákona č. 372/2011 Sb. Do 10 dnů obdržel kopii zprávy e-mailem v PDF za úhradu nákladů 50 Kč.
        </p>
      </div>

      <FaqAccordion
        items={[
          {
            q: 'Může si lékař za pořízení kopií účtovat tisícové částky?',
            a: 'Ne. Úhrada nákladů podle zákona nesmí přesáhnout skutečně vynaložené náklady (obvykle několik korun za stranu fotokopie nebo cenu za naskenování).'
          },
          {
            q: 'Má otec právo nahlížet do zpráv dětského psychologa?',
            a: 'Ano, pokud je psycholog poskytovatelem zdravotních služeb (klinický psycholog). U školních psychologů platí pravidla školského zákona.'
          }
        ]}
      />

      {/* CTA */}
      <div className="bg-teal-900 text-white p-6 rounded-2xl space-y-3 print:hidden">
        <h3 className="font-bold text-base">Stáhněte si připravený vzor nebo vygenerujte žádost</h3>
        <p className="text-xs text-teal-100">
          Využijte připravené právní formuláře pro písemnou žádost pediatrovi.
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={() => onNavigate ? onNavigate('/ai-formulare?template=zdravotni-informace') : (window.location.href = '/ai-formulare?template=zdravotni-informace')}
            className="inline-flex items-center gap-2 bg-teal-400 hover:bg-teal-300 text-teal-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <span>Generovat Žádost (AI Formuláře)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onNavigate ? onNavigate('/ke-stazeni') : (window.location.href = '/ke-stazeni')}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <span>Vzory ke stažení</span>
            <FileText className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <SubpageFooter
        sources={[
          'Zákon č. 372/2011 Sb., o zdravotních službách (§ 65 a § 66 nahlížení a kopie)',
          'Správní řád č. 500/2004 Sb. (§ 38 nahlížení do spisu)'
        ]}
        related={[
          { title: 'Práva rodiče', url: '/zdravotni-pece/prava-rodice', icon: <Scale className="w-4 h-4" /> },
          { title: 'Komunikace s lékařem', url: '/zdravotni-pece/komunikace', icon: <MessageSquare className="w-4 h-4" /> },
          { title: 'Checklist', url: '/zdravotni-pece/checklist', icon: <CheckSquare className="w-4 h-4" /> }
        ]}
        onNavigate={onNavigate}
      />
    </div>
  );
};

// ==========================================
// 3. SUBPAGE: KOMUNIKACE S LÉKAŘEM (/zdravotni-pece/komunikace)
// ==========================================
export const KomunikaceSubpage: React.FC<SubpageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 pt-4 max-w-4xl mx-auto">
      <SeoHead
        title="Komunikace s lékařem a druhým rodičem o zdraví dítěte"
        description="Návod na věcnou komunikaci s pediatrem, aplikace metody BIFF a jak nezatahovat zdravotníky do rodičovského konfliktu."
        canonicalPath="/zdravotni-pece/komunikace"
      />

      <SubpageHeader
        title="Komunikace s lékařem & druhým rodičem"
        badge="Komunikace"
        description="Praktické zásady pro věcné předávání zdravotních informací bez zbytečných emocí a zatahování zdravotníků do sporu."
        icon={<MessageSquare className="w-4 h-4 text-teal-400" />}
        onNavigate={onNavigate}
      />

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-teal-600" /> Metoda BIFF v komunikaci o zdraví
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Při řešení zdravotního stavu dítěte s druhým rodičem nebo lékařem udržujte komunikaci v duchu metody <strong>BIFF</strong>:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <strong className="text-teal-700 block mb-1">Brief (Stručná)</strong>
            Nepište dlouhé odstavec týkající se minulých sporů. Uveďte pouze fakta o zdraví dítěte.
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <strong className="text-teal-700 block mb-1">Informative (Informativní)</strong>
            Zprostředkujte pouze fakta: teplota, název léku, dávkování, čas další kontroly.
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <strong className="text-teal-700 block mb-1">Friendly (Zdvořilá)</strong>
            Udržujte neutrální, zdvořilý tón bez ironie či osočování.
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <strong className="text-teal-700 block mb-1">Firm (Jasná & Pevná)</strong>
            Jasně definujte, jaký krok následuje nebo co potřebujete potvrdit.
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-teal-600" /> Nezatahujte pediatra do sporu rodičů
        </h2>
        <div className="text-sm text-slate-700 space-y-2 leading-relaxed">
          <p>
            Dětský lékař je zdravotník, nikoli opatrovnický soudce ani policista. Jeho prvořadým úkolem je péče o zdraví dítěte.
          </p>
          <ul className="list-disc pl-5 text-xs space-y-1 text-slate-700">
            <li>Nežádejte po lékaři hodnocení rodičovských schopností druhého rodiče.</li>
            <li>Komunikujte věcně: ptejte se na zdravotní stav, léčbu, režim a kontroly.</li>
            <li>Respektujte časové možnosti ordinace.</li>
          </ul>
        </div>
      </section>

      {/* Model Examples */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-300 space-y-3">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">Modelové příklady communications — nejde o právně závazný vzor</span>
        
        <div className="space-y-2 text-xs">
          <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 text-rose-950">
            <strong className="text-rose-700 block mb-0.5">Nevhodná zpráva (zatahující do sporu):</strong>
            „Opět jsi mi předala dítě nemocné a bez léků! Jak je možné, že jsi s ním nešla k doktorovi? Okamžitě mi napiš, co jsi zase zanedbala!“
          </div>
          <div className="bg-teal-50 p-3 rounded-lg border border-teal-200 text-teal-950">
            <strong className="text-teal-800 block mb-0.5">Vhodná zpráva (BIFF metoda):</strong>
            „Ahoj, syn má teplotu 38.2 °C. Podal jsem v 14:00 Nurofen 5ml. Zítra v 9:00 jdeme k pediatrovi na kontrolu. O výsledku tě budu hned informovat.“
          </div>
        </div>
      </div>

      <FaqAccordion
        items={[
          {
            q: 'Co když druhý rodič odmítá předat informace o proběhlé návštěvě lékaře?',
            a: 'Pokud druhý rodič nespolupracuje, kontaktujte ordinaci pediatra přímo. Jako zákonný zástupce máte právo na informace od lékaře bez ohledu na druhého rodiče.'
          }
        ]}
      />

      <SubpageFooter
        sources={[
          'Metodika BIFF (High Conflict Institute)',
          'Zákon č. 89/2012 Sb., občanský zákoník (§ 888 povinnost předávat si informace)'
        ]}
        related={[
          { title: 'Předávání informací', url: '/zdravotni-pece/predavani', icon: <Share2 className="w-4 h-4" /> },
          { title: 'Práva rodiče', url: '/zdravotni-pece/prava-rodice', icon: <Scale className="w-4 h-4" /> }
        ]}
        onNavigate={onNavigate}
      />
    </div>
  );
};

// ==========================================
// 4. SUBPAGE: PSYCHOLOGICKÁ PÉČE (/zdravotni-pece/psychologie)
// ==========================================
export const PsychologieSubpage: React.FC<SubpageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 pt-4 max-w-4xl mx-auto">
      <SeoHead
        title="Dětská psychologická a psychiatrická péče"
        description="Pravidla pro návštěvu dětského psychologa, krizovou intervenci, souhlas rodičů a prolink na psychologický modul."
        canonicalPath="/zdravotni-pece/psychologie"
      />

      <SubpageHeader
        title="Dětská psychologická a psychiatrická péče"
        badge="Psychologie & Psychiatrie"
        description="Pravidla odborné péče o psychické zdraví dítěte v náročném období opatrovnického sporu."
        icon={<Activity className="w-4 h-4 text-teal-400" />}
        onNavigate={onNavigate}
      />

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-600" /> Dětský psycholog vs. Dětský psychiatr
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900">Dětský psycholog / Terapeut</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Poskytuje psychologické poradenství, terapii a krizovou intervenci. Pomáhá dítěti zpracovat náročné emoce z rozpadu rodiny.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900">Dětský psychiatr</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Lékař se specializací na duševní zdraví. Diagnostikuje závažnější psychické poruchy a může indikovat farmakoterapii.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-600" /> Souhlas rodičů a ochrana dítěte
        </h2>
        <ul className="list-disc pl-5 text-xs text-slate-700 space-y-2 leading-relaxed">
          <li><strong>Krizová intervence:</strong> V akutních krizových situacích (např. akutní trauma, sebepoškozování) může být poskytnuta okamžitá krizová pomoc bez odkladu.</li>
          <li><strong>Dlouhodobá péče:</strong> Dlouhodobá psychoterapie či odborné vyšetření spadá pod významné záležitosti (§ 877 o.z.), kde by měli být informováni a dát souhlas oba rodiče.</li>
          <li><strong>Ochrana soukromí dítěte:</strong> Terapie slouží k pomoci dítěti, nikoli k vytváření "důkazních materiálů pro opatrovnický soud" proti druhému rodiči.</li>
        </ul>
      </section>

      {/* Warning regarding laická diagnostika */}
      <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 space-y-2 text-xs text-amber-950">
        <h3 className="font-bold text-sm text-amber-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" /> Důležité: Zamezení laické diagnostice
        </h3>
        <p className="leading-relaxed">
          Vyhněte se laickému určování diagnóz dítěte či druhého rodiče na základě internetových článků.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
          <div className="bg-rose-100/80 p-2 rounded text-rose-900">❌ „Dítě má PAS / trauma z otce.“</div>
          <div className="bg-teal-100/80 p-2 rounded text-teal-900">✅ „Při podezření na PAS je vhodné odborné vyšetření u dětského klinického psychologa.“</div>
        </div>
      </div>

      {/* Prolink CTA */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-6 rounded-2xl space-y-3 print:hidden">
        <h3 className="font-bold text-base">Hledáte hlubší edukační podklady k psychologickému vývoji dítěte?</h3>
        <p className="text-xs text-slate-200">
          Navštivte náš hlavní modul věnovaný psychologickému vývoji, věkovým etapám a emocím dítěte.
        </p>
        <button
          onClick={() => onNavigate ? onNavigate('/psychologie') : (window.location.href = '/psychologie')}
          className="inline-flex items-center gap-2 bg-teal-400 hover:bg-teal-300 text-teal-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          <span>Přejít na modul Psychologie & Emoce dítěte</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      <SubpageFooter
        sources={[
          'Zákon č. 89/2012 Sb., občanský zákoník (§ 877 významné záležitosti)',
          'Zákon č. 372/2011 Sb., o zdravotních službách',
          'Etický kodex Českomoravské psychologické společnosti (ČMPS)'
        ]}
        related={[
          { title: 'Psychologický vývoj', url: '/psychologie', icon: <Activity className="w-4 h-4" /> },
          { title: 'Krizová pomoc', url: '/krizova-pomoc', icon: <HeartPulse className="w-4 h-4" /> }
        ]}
        onNavigate={onNavigate}
      />
    </div>
  );
};

// ==========================================
// 5. SUBPAGE: NEMOC DÍTĚTE (/zdravotni-pece/nemoc)
// ==========================================
export const NemocSubpage: React.FC<SubpageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 pt-4 max-w-4xl mx-auto">
      <SeoHead
        title="Nemoc dítěte a režimová opatření"
        description="Praktický průvodce péčí o nemocné dítě, dávkováním lécí podle zdravotníka a předáváním informací mezi rodiči."
        canonicalPath="/zdravotni-pece/nemoc"
      />

      <SubpageHeader
        title="Nemoc dítěte a režimová opatření"
        badge="Nemoc dítěte"
        description="Praktický návod pro bezpečné zvládnutí běžného onemocnění dítěte v péči jednoho či druhého rodiče."
        icon={<Thermometer className="w-4 h-4 text-teal-400" />}
        onNavigate={onNavigate}
      />

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-teal-600" /> Běžné onemocnění a klidový režim
        </h2>
        <div className="text-sm text-slate-700 space-y-3 leading-relaxed">
          <p>
            Při běžném onemocnění (teplota, viróza, rýma) má dítě nárok na klidové prostředí, pitný režim a dodržování pokynů ošetřujícího lékaře.
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <strong className="text-slate-900 block font-bold">Léky a dávkování:</strong>
            <p>
              Podávejte lék <strong>výhradně podle pokynů ošetřujícího lékaře nebo příbalového letáku</strong>. Vyvarujte se svévolného měnění dávkování či zkoušení neověřených léčebných postupů.
            </p>
          </div>
        </div>
      </section>

      {/* Warning box */}
      <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200 space-y-2 text-xs text-rose-950">
        <h3 className="font-bold text-sm text-rose-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" /> Zákaz laické diagnózy a vlastního dávkování
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Žádná laická diagnóza:</strong> Určování diagnózy náleží výhradně lékaři.</li>
          <li><strong>Žádné vlastní dávkování:</strong> Vždy dodržujte přesné dávkování a časový odstup léků (např. paracetamol / ibuprofen) určený lékařem nebo lékárníkem.</li>
          <li><strong>Kdy kontaktovat lékaře:</strong> Při horečce trvající déle než 3 dny, febrilních křečích, nelepšícím se stavu či potížích s dýcháním ihned vyhledejte lékařskou pomoc.</li>
        </ul>
      </div>

      <SubpageFooter
        sources={[
          'Doporučené postupy České pediatrické společnosti ČLS JEP',
          'Národní zdravotnický informační portál (NZIP)'
        ]}
        related={[
          { title: 'Ošetřovné (OČR)', url: '/zdravotni-pece/ocr', icon: <Briefcase className="w-4 h-4" /> },
          { title: 'Předávání informací', url: '/zdravotni-pece/predavani', icon: <Share2 className="w-4 h-4" /> }
        ]}
        onNavigate={onNavigate}
      />
    </div>
  );
};

// ==========================================
// 6. SUBPAGE: OČR (/zdravotni-pece/ocr)
// ==========================================
export const OcrSubpage: React.FC<SubpageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 pt-4 max-w-4xl mx-auto">
      <SeoHead
        title="Ošetřovné (OČR) pro otce — Podmínky a střídání"
        description="Detailní právní průvodce Ošetřovným člena rodiny (OČR) podle zákona č. 187/2006 Sb., střídáním rodičů a postupem u ČSSZ."
        canonicalPath="/zdravotni-pece/ocr"
      />

      <SubpageHeader
        title="Ošetřovné (OČR) a péče o nemocné dítě"
        badge="OČR & ČSSZ"
        description="Kompletní přehled podmínek pro čerpání Ošetřovného člena rodiny (OČR) zaměstnancem, střídání v péči a postupu vůči ČSSZ."
        icon={<Briefcase className="w-4 h-4 text-teal-400" />}
        onNavigate={onNavigate}
      />

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-teal-600" /> Právní úprava OČR (§ 39 zákona č. 187/2006 Sb.)
        </h2>
        <div className="text-sm text-slate-700 space-y-3 leading-relaxed">
          <p>
            Ošetřovné je dávka nemocenského pojištění, na kterou má nárok zaměstnanec, který nemůže pracovat z důvodu ošetřování nemocného dítěte.
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <h3 className="font-bold text-slate-900">Základní zákonné podmínky:</h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li><strong>Věk dítěte:</strong> Dítě mladší 10 let (u starších dětí pouze při závažném zdravotním stavu vyžadujícím ošetřování podle lékaře).</li>
              <li><strong>Společná domácnost:</strong> Zaměstnanec musí žít s dítětem ve společné domácnosti. <em>Při střídavé péči nebo stanoveném styku se tato podmínka podle ČSSZ považuje za splněnou u obou rodičů.</em></li>
              <li><strong>Délka podpůrčí doby:</strong> Standardně max. 9 kalendářních dnů (u osamělého zaměstnance až 16 dnů).</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-600" /> Střídání se v ošetřování během jedné nemoci
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Podle § 39 odst. 4 zákona č. 187/2006 Sb. se v témže případě ošetřování mohou rodiče <strong>jednou vystřídat</strong>.
        </p>
        <div className="bg-teal-50 p-4 rounded-xl border border-teal-200 text-xs text-teal-950 space-y-1">
          <strong>Postup při střídání:</strong>
          <p>
            Druhý rodič vyplní tiskopis ČSSZ „Žádost o ošetřovné pro osobu, která převzala ošetřování (péči)“ a předá jej svému zaměstnavateli. Celková podpůrčí doba (9 dnů) se nesčítá, ale započítává se do ní doba ošetřování prvního rodiče.
          </p>
        </div>
      </section>

      {/* Official Link */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h3 className="font-bold text-sm">Oficiální informace a tiskopisy ČSSZ</h3>
          <p className="text-xs text-slate-300">Podrobné informace a elektronické tiskopisy naleznete na portálu České správy sociálního zabezpečení.</p>
        </div>
        <a
          href="https://www.cssz.cz"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 bg-teal-400 hover:bg-teal-300 text-teal-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <span>Navštívit portál ČSSZ</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <SubpageFooter
        sources={[
          'Zákon č. 187/2006 Sb., o nemocenském pojištění (§ 39 až § 41 ošetřovné)',
          'Oficiální metodika České správy sociálního zabezpečení (ČSSZ)'
        ]}
        related={[
          { title: 'Nemoc dítěte', url: '/zdravotni-pece/nemoc', icon: <Thermometer className="w-4 h-4" /> },
          { title: 'Předávání informací', url: '/zdravotni-pece/predavani', icon: <Share2 className="w-4 h-4" /> }
        ]}
        onNavigate={onNavigate}
      />
    </div>
  );
};

// ==========================================
// 7. SUBPAGE: PŘEDÁVÁNÍ INFORMACÍ (/zdravotni-pece/predavani)
// ==========================================
export const PredavaniSubpage: React.FC<SubpageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 pt-4 max-w-4xl mx-auto">
      <SeoHead
        title="Předávání zdravotních informací o dítěti mezi rodiči"
        description="Doporučená struktura předávání zdravotních údajů, přehledová tabulka a modelové příklady věcných zpráv."
        canonicalPath="/zdravotni-pece/predavani"
      />

      <SubpageHeader
        title="Předávání zdravotních informací"
        badge="Předávání informací"
        description="Praktický návod a doporučená struktura zápisu pro bezpečné předávání informací o zdravotním stavu dítěte."
        icon={<Share2 className="w-4 h-4 text-teal-400" />}
        onNavigate={onNavigate}
      />

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-teal-600" /> Doporučená struktura předávaných informací
        </h2>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                <th className="p-3">Informace</th>
                <th className="p-3">Co předat</th>
                <th className="p-3">Příklad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="p-3 font-bold text-slate-900">Aktuální stav</td>
                <td className="p-3">Jak se stav vyvíjel, teplota</td>
                <td className="p-3">„Ráno bez teploty, večer 37.8 °C.“</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">Léky</td>
                <td className="p-3">Název, dávka, čas podání</td>
                <td className="p-3">„Nurofen 5ml podán v 14:00.“</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">Alergie</td>
                <td className="p-3">Důležité reakce na léky či stravu</td>
                <td className="p-3">„Alergie na Penicilin.“</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">Kontrola</td>
                <td className="p-3">Datum, čas a místo kontroly</td>
                <td className="p-3">„Kontrola u pediatra ve čtvrtek v 8:30.“</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">Režim</td>
                <td className="p-3">Pokyny lékaře ke cvičení/klidu</td>
                <td className="p-3">„Klidový režim bez tělocviku do pátku.“</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Model Example */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-300 space-y-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">Modelový příklad — nejde o právně závazný vzor</span>
        <h3 className="font-bold text-sm text-slate-900">Vzorový předávací protokolek zprávy:</h3>
        <p className="text-xs font-mono bg-white p-3 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
          Předání syna Jakuba (6.9.2026):<br/>
          - Teplota: Ráno 36.6 °C, bez horečky.<br/>
          - Léky: Aerius 2.5ml užit v 8:00 ráno. Další dávka zítra v 8:00.<br/>
          - Lékař: Pediatr MUDr. Novák doporučil klidový režim do konce týdne.<br/>
          - Kontrola: Příští úterý v 10:00.
        </p>
      </div>

      <SubpageFooter
        sources={[
          'Zákon č. 89/2012 Sb., občanský zákoník (§ 888 o.z.)'
        ]}
        related={[
          { title: 'Komunikace s lékařem', url: '/zdravotni-pece/komunikace', icon: <MessageSquare className="w-4 h-4" /> },
          { title: 'Checklist', url: '/zdravotni-pece/checklist', icon: <CheckSquare className="w-4 h-4" /> }
        ]}
        onNavigate={onNavigate}
      />
    </div>
  );
};

// ==========================================
// 8. SUBPAGE: CHECKLIST (/zdravotni-pece/checklist)
// ==========================================
export const ChecklistSubpage: React.FC<SubpageProps> = ({ onNavigate }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('zdravotni_pece_checklist');
      if (saved) {
        setCheckedItems(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const toggleItem = (id: string) => {
    const next = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(next);
    try {
      localStorage.setItem('zdravotni_pece_checklist', JSON.stringify(next));
    } catch (e) {}
  };

  const resetChecklist = () => {
    setCheckedItems({});
    try {
      localStorage.removeItem('zdravotni_pece_checklist');
    } catch (e) {}
  };

  const items = [
    { id: 'item1', text: 'Mám aktuální informace o zdravotním stavu dítěte.' },
    { id: 'item2', text: 'Znám termín další kontroly či očkování.' },
    { id: 'item3', text: 'Znám aktuální pokyny ošetřujícího zdravotníka.' },
    { id: 'item4', text: 'Mám informace potřebné pro bezpečnou denní péči.' },
    { id: 'item5', text: 'Vím, kde získat zdravotnickou dokumentaci.' },
    { id: 'item6', text: 'Vím, kam se obrátit při zdravotním problému či nesoučinnosti.' }
  ];

  const completedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="space-y-8 pt-4 max-w-4xl mx-auto">
      <SeoHead
        title="Rodičovský checklist zdravotní péče"
        description="Interaktivní rodičovský kontrolní seznam kroků při zdravotní péči o dítě s lokálním ukládáním bez PII."
        canonicalPath="/zdravotni-pece/checklist"
      />

      <SubpageHeader
        title="Interaktivní rodičovský checklist"
        badge="Checklist"
        description="Kontrolní seznam pro ověření, že máte k dispozici všechny podstatné informace pro bezpečnou péči o dítě."
        icon={<CheckSquare className="w-4 h-4 text-teal-400" />}
        onNavigate={onNavigate}
      />

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-600" /> Kontrolní body ({completedCount}/{items.length})
          </h2>
          {completedCount > 0 && (
            <button
              onClick={resetChecklist}
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              Vynulovat checklist
            </button>
          )}
        </div>

        <div className="space-y-2">
          {items.map((item) => {
            const isChecked = !!checkedItems[item.id];
            return (
              <label
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-teal-50/80 border-teal-300 text-teal-950 font-medium'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="mt-0.5 h-4 w-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-xs sm:text-sm leading-relaxed">{item.text}</span>
              </label>
            );
          })}
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
          <span><strong>Ochrana soukromí:</strong> Stav checklistu se ukládá výhradně v prohlížeči (localStorage). Nezaznamenávají se žádná jména, diagnózy ani osobní údaje (0 PII).</span>
        </div>
      </section>

      <SubpageFooter
        sources={['Metodika Synthesis Hub pro rodičovskou orientaci ve zdravotnictví']}
        related={[
          { title: 'Práva rodiče', url: '/zdravotni-pece/prava-rodice', icon: <Scale className="w-4 h-4" /> },
          { title: 'Dokumentace', url: '/zdravotni-pece/dokumentace', icon: <FileText className="w-4 h-4" /> }
        ]}
        onNavigate={onNavigate}
      />
    </div>
  );
};

// ==========================================
// 9. SUBPAGE: ODBORNÍCI (/zdravotni-pece/odbornici)
// ==========================================
export const OdborniciSubpage: React.FC<SubpageProps> = ({ onNavigate }) => {
  const roles = [
    {
      title: 'Pediatr (Praktický lékař pro děti a dorost)',
      what: 'Běžná zdravotní péče, preventivní prohlídky, očkování, nahlížení do dokumentace, vystavení OČR.',
      expect: 'Odbornou zdravotní péči. Pediatr není soudce a neřeší opatrovnické spory rodičů.',
      when: 'Při nemoci dítěte, preventivní prohlídce, potřebě zdravotní dokumentace nebo vystavení OČR.'
    },
    {
      title: 'Specialista (neurolog, alergolog, ortoped apod.)',
      what: 'Specializovaná vyšetření a cílena léčba konkrétního zdravotního problému.',
      expect: 'Lékařskou zprávu z vyšetření. Druhý rodič má právo na kopii zprávy.',
      when: 'Při indikaci od pediatra nebo zhoršení specifického zdravotního stavu.'
    },
    {
      title: 'Dětský psycholog / Terapeut',
      what: 'Psychologická podpora, dětská psychoterapie, pomáhání zvládat rozchod rodičů.',
      expect: 'Podporu pro dítě. Psycholog neslouží jako sběratel důkazů pro opatrovnický soud.',
      when: 'Při výrazných změnách chování, úzkostech, problémech ve škole či traumatu.'
    },
    {
      title: 'Dětský psychiatr',
      what: 'Diagnostika a léčba závažnějších psychických a psychiatrických poruch, případná farmakoterapie.',
      expect: 'Lékařskou diagnostiku a léčebný plán.',
      when: 'Při doporučení pediatra či psychologa při závažných psychických obtížích.'
    },
    {
      title: 'Právník / Právní poradce',
      what: 'Právní zastoupení, sepisování návrhů k opatrovnickému soudu, obrana práv rodiče.',
      expect: 'Právní rozbor situace a procesní zastoupení.',
      when: 'Při odmítání součinnosti ze strany lékaře, maření práv nebo soudním řízení.'
    },
    {
      title: 'OSPOD (Orgán sociálně-právní ochrany dětí)',
      what: 'Opatrovník dítěte jmenovaný soudem v opatrovnickém řízení.',
      expect: 'Sociální šetření. OSPOD není soud ani lékař a nestanovuje diagnózy.',
      when: 'V rámci probíhajícího opatrovnického soudního řízení.'
    },
    {
      title: 'ČSSZ (Česká správa sociálního zabezpečení)',
      what: 'Schvalování a výplata dávky Ošetřovného (OČR).',
      expect: 'Administraci a výplatu OČR.',
      when: 'Při podání Žádosti o ošetřovné od ošetřujícího lékaře.'
    }
  ];

  return (
    <div className="space-y-8 pt-4 max-w-4xl mx-auto">
      <SeoHead
        title="Přehled odborníků ve zdravotnictví a opatrovnictví"
        description="Přehled rolí a kompetencí: pediatr, specialista, dětský psycholog, psychiatr, právník, OSPOD a ČSSZ."
        canonicalPath="/zdravotni-pece/odbornici"
      />

      <SubpageHeader
        title="Přehled odborníků a jejich kompetencí"
        badge="Přehled odborníků"
        description="Jasné vymezení odpovědností jednotlivých rolí ve zdravotní, psychologické a právní péči o dítě."
        icon={<Users className="w-4 h-4 text-teal-400" />}
        onNavigate={onNavigate}
      />

      <div className="space-y-4">
        {roles.map((role, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600 shrink-0" /> {role.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <strong className="text-slate-900 block mb-0.5">Co řeší:</strong>
                <span className="text-slate-700">{role.what}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <strong className="text-slate-900 block mb-0.5">Co očekávat:</strong>
                <span className="text-slate-700">{role.expect}</span>
              </div>
              <div className="bg-teal-50/70 p-3 rounded-xl border border-teal-100">
                <strong className="text-teal-900 block mb-0.5">Kdy se obrátit:</strong>
                <span className="text-teal-950">{role.when}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SubpageFooter
        sources={['Přehled kompetencí podle platného právního řádu ČR']}
        related={[
          { title: 'Práva rodiče', url: '/zdravotni-pece/prava-rodice', icon: <Scale className="w-4 h-4" /> },
          { title: 'Psychologie', url: '/zdravotni-pece/psychologie', icon: <Activity className="w-4 h-4" /> }
        ]}
        onNavigate={onNavigate}
      />
    </div>
  );
};
