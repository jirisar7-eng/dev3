import React, { useEffect, useState } from 'react';
import { X, ArrowRight } from 'lucide-react';

interface BetaNoticeModalProps {
  onNavigate: (path: string) => void;
}

export const BetaNoticeModal: React.FC<BetaNoticeModalProps> = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isAcknowledged = localStorage.getItem('tatovacesta_beta_notice_1_0_acknowledged');
    if (!isAcknowledged) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('tatovacesta_beta_notice_1_0_acknowledged', 'true');
    setIsVisible(false);
  };

  const handleNavigate = (path: string) => {
    handleClose();
    onNavigate(path);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 my-auto shadow-2xl border border-slate-200 relative flex flex-col" role="dialog" aria-modal="true" aria-labelledby="beta-modal-title">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 mb-2">
              PROJEKT V BETA PROVOZU • VERZE 1.0
            </span>
            <h2 id="beta-modal-title" className="text-2xl font-bold text-slate-900 leading-tight">
              Oznámení k verzi Beta 1.0 portálu Táta má právo
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center flex-shrink-0 transition-colors"
            aria-label="Zavřít oznámení"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-6 overflow-y-auto max-h-[60vh] pr-2 space-y-6 text-slate-700 text-sm sm:text-base leading-relaxed">
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span>📢</span> Vítejte na portálu Táta má právo
            </h3>
            <p className="mb-3">Vítejte na nové verzi portálu Táta má právo.</p>
            <p className="mb-3">Po dlouhém období vývoje, testování a postupného rozšiřování projektu se dostáváme do důležité fáze – Beta verze 1.0.</p>
            <p className="mb-3">Portál nyní přechází z vývojového prostředí do produkčního provozu na hlavní doméně tatovacesta.cz.</p>
            <p>Neznamená to konec vývoje. Naopak. Beta 1.0 představuje základ platformy, na kterém budeme dál stavět, rozšiřovat obsah, přidávat nové nástroje a reagovat na potřeby otců, kterým má portál sloužit.</p>
          </section>

          <hr className="border-slate-100" />

          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span>👨‍👧‍👦</span> Proč Táta má právo vzniklo
            </h3>
            <p className="mb-3">Rozchod rodičů může během krátké doby změnit prakticky celý život rodiny.</p>
            <p className="mb-3">Otec může současně řešit péči o dítě, komunikaci s druhým rodičem, soudní řízení, výživné, bydlení, majetek, finance, školu, úřady nebo otázku, jak si vůbec v nové situaci nastavit svůj další život.</p>
            <p className="mb-3">Táta má právo vzniklo jako místo, které má pomoci otci se v těchto situacích zorientovat.</p>
            <p className="mb-3">Hlavním principem projektu ale není konflikt mezi rodiči.</p>
            <p className="mb-3 font-medium text-slate-900">Na prvním místě je dítě.</p>
            <p>Prosazujeme jeho nejlepší zájem, právo na bezpečné a stabilní prostředí a pokud tomu nebrání závažné okolnosti také právo na smysluplný vztah a péči obou rodičů.</p>
          </section>

          <hr className="border-slate-100" />

          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span>📚</span> Co portál nabízí
            </h3>
            <p className="mb-4">Beta 1.0 propojuje na jednom místě informace, praktické návody, právní zdroje a nástroje, které mohou otci pomoci při řešení jeho konkrétní situace.</p>
            <p className="mb-3">Postupně zde najdete a využijete například:</p>
            <ul className="list-disc pl-5 space-y-1 mb-4 text-slate-600">
              <li>Životní situace po rozchodu</li>
              <li>Právní informace a legislativu</li>
              <li>Judikaturu a rozhodnutí soudů</li>
              <li>Praktické návody a doporučené postupy</li>
              <li>Formuláře a dokumenty</li>
              <li>Databázi případů a zkušeností</li>
              <li>Vzdělávací obsah</li>
              <li>Odborné studie a další zdroje</li>
              <li>Interaktivní nástroje</li>
              <li>Komunitní prostor</li>
              <li>Uživatelský účet a osobní nástroje</li>
            </ul>
            <p className="mb-3">Jednotlivé části portálu jsou navzájem propojené tak, aby uživatel nemusel hledat informace na desítkách různých míst.</p>
            <p>Cílem je vytvořit praktický systém pomoci pro otce, nikoliv pouze další informační web.</p>
          </section>

          <hr className="border-slate-100" />

          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span>🔐</span> Bezpečnost účtů
            </h3>
            <p className="mb-3">Součástí nové platformy je také důraz na bezpečnost a ochranu uživatelských účtů.</p>
            <p className="mb-3">Portál využívá moderní bezpečnostní mechanismy včetně dvoufaktorového ověřování (2FA) a podpory Passkeys, které umožňují bezpečné přihlášení pomocí zabezpečení vašeho zařízení, například otisku prstu nebo biometrického ověření.</p>
            <p>Bezpečnostní systém dále průběžně rozvíjíme a testujeme.</p>
          </section>

          <hr className="border-slate-100" />

          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span>🤖</span> Projekt vzniká také s pomocí umělé inteligence
            </h3>
            <p className="mb-3">Na vývoji portálu využívám také moderní nástroje umělé inteligence, mimo jiné Google AI Studio, a postupy označované jako vibecoding.</p>
            <p className="mb-3">AI používám jako nástroj pro vývoj, analýzu a zpracování návrhů.</p>
            <p className="mb-3 font-medium text-slate-900">O koncepci projektu, jeho obsahu, funkcích a směru rozhoduje člověk – autor projektu.</p>
            <p>Umělá inteligence tedy není tím, kdo určuje, jak má Táta má právo fungovat. Pomáhá pouze rychleji realizovat myšlenky a řešení, která jsou pro projekt navržena.</p>
          </section>

          <hr className="border-slate-100" />

          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span>🚀</span> Beta 1.0 není konec
            </h3>
            <p className="mb-3">Dostáváme se do první skutečně důležité produkční fáze.</p>
            <p className="mb-3">To, že portál vstupuje do Beta 1.0, neznamená, že je dokončený navždy.</p>
            <p className="mb-3">Naopak.</p>
            <p className="mb-3">Budeme dál:</p>
            <ul className="list-disc pl-5 space-y-1 mb-4 text-slate-600">
              <li>rozšiřovat obsah,</li>
              <li>doplňovat právní zdroje a judikaturu,</li>
              <li>přidávat nové praktické návody,</li>
              <li>rozvíjet interaktivní nástroje,</li>
              <li>zlepšovat uživatelské prostředí,</li>
              <li>opravovat případné chyby,</li>
              <li>reagovat na změny legislativy,</li>
              <li>a především naslouchat samotným otcům.</li>
            </ul>
            <p>Beta verze je proto zároveň začátkem další etapy projektu.</p>
          </section>

          <hr className="border-slate-100" />

          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span>💬</span> Vaše zkušenost je pro nás důležitá
            </h3>
            <p className="mb-3">Portál vzniká především pro skutečné lidi a skutečné životní situace.</p>
            <p className="mb-3">Pokud najdete chybu, narazíte na nefunkční část, něco vám bude chybět nebo máte návrh, jak by mohl portál otcům pomoci lépe, dejte nám vědět.</p>
            <p>Vaše zkušenosti mohou přímo ovlivnit další vývoj projektu.</p>
          </section>

          <hr className="border-slate-100" />

          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span>❤️</span> Táta má právo pokračuje
            </h3>
            <p className="mb-3">Za projektem stojí jednoduchá myšlenka:</p>
            <p className="mb-3 italic font-medium text-slate-800">Dítě potřebuje rodiče. A rodič potřebuje vědět, jak své dítě chránit, jak za něj bojovat a jak přitom neztratit sám sebe.</p>
            <p className="mb-3">Chceme vytvořit místo, kde otec v těžké životní situaci najde nejen informace, ale také praktické nástroje, ověřitelné zdroje a cestu, jak se v celé situaci zorientovat.</p>
            <p className="mb-3">Děkuji všem, kteří projekt sledují, používají, podporují a dávají nám zpětnou vazbu.</p>
            <p className="mb-3 font-medium text-slate-900">Vítejte v Beta 1.0.</p>
            <p className="font-bold text-slate-900">Vítejte na Táta má právo.</p>
          </section>
        </div>

        {/* Footer actions */}
        <div className="pt-6 border-t border-slate-100 mt-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm">
            <span className="text-slate-500 font-medium">Rychlé odkazy:</span>
            <button onClick={() => handleNavigate('/partneri')} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium">
              Sponzoři
            </button>
            <button onClick={() => handleNavigate('/mapa-stranek')} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium">
              Mapa stránek
            </button>
            <button onClick={() => handleNavigate('/podminky')} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium">
              Podmínky užívání
            </button>
          </div>
          
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2 group"
          >
            Pokračovat na hlavní stránku
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
      </div>
    </div>
  );
};
