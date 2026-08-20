import React from 'react';
import { Shield, Heart, AlertTriangle } from 'lucide-react';
import { Logo } from './common/Logo';

interface FooterProps {
  onOpenComplianceDoc: (docKey: string) => void;
  onNavigate?: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenComplianceDoc, onNavigate }) => {
  const currentYear = new Date().getFullYear();

  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  const handleCompliance = (docKey: string, fallbackPath?: string) => {
    if (onOpenComplianceDoc) {
      onOpenComplianceDoc(docKey);
    } else if (fallbackPath) {
      handleNav(fallbackPath);
    }
  };

  return (
    <footer id="footer" className="bg-slate-900 text-slate-300 border-t border-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        
        {/* ========================================== */}
        {/* DESKTOP VERSION (hidden md:block)          */}
        {/* ========================================== */}
        <div className="hidden md:block space-y-10">
          {/* Top Section: Identity & Crisis CTA */}
          <div className="grid grid-cols-12 gap-8 items-start pb-10 border-b border-slate-800">
            {/* Identity Column */}
            <div className="col-span-7 space-y-4">
              <Logo variant="white" size="md" showSubtitle={false} />
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                Praktická pomoc otcům v náročných rodinných situacích. Informace, dokumenty, zkušenosti a podpora na jednom místě.
              </p>
              <div>
                <button
                  onClick={() => handleNav('/o-nas')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-blue-400 hover:text-blue-300 border border-slate-700/80 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>🛡️ Nejlepší zájem dítěte</span>
                </button>
              </div>
            </div>

            {/* Crisis CTA Box */}
            <div className="col-span-5">
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <h4 className="font-bold text-white text-base">Potřebujete pomoc?</h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Nevíte, co udělat jako první? Začněte v Rozcestníku krizové pomoci.
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => handleNav('/sos-plan')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/40 hover:shadow-rose-900/60 transition-all cursor-pointer"
                    >
                      <span>🚨 Potřebuji pomoc</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Links Grid (3 Columns) */}
          <div className="grid grid-cols-3 gap-8 pb-10 border-b border-slate-800 text-sm">
            {/* Column 1: Pomoc */}
            <div>
              <h4 className="font-bold text-white text-sm mb-4 tracking-wide uppercase text-slate-200">
                Pomoc
              </h4>
              <ul className="space-y-2.5 text-slate-300">
                <li>
                  <button onClick={() => handleNav('/sos-plan')} className="hover:text-rose-400 transition-colors flex items-center gap-2 group text-left cursor-pointer">
                    <span>🚨</span>
                    <span className="font-semibold text-rose-300 group-hover:text-rose-400">Krizová pomoc</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav('/pravni-poradna')} className="hover:text-blue-400 transition-colors flex items-center gap-2 group text-left cursor-pointer">
                    <span>⚖️</span>
                    <span>Právní poradna</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav('/forum')} className="hover:text-blue-400 transition-colors flex items-center gap-2 group text-left cursor-pointer">
                    <span>👥</span>
                    <span>Komunitní fórum</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav('/podpora')} className="hover:text-blue-400 transition-colors flex items-center gap-2 group text-left cursor-pointer">
                    <span>🤝</span>
                    <span>Táta-Parťák</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Portál */}
            <div>
              <h4 className="font-bold text-white text-sm mb-4 tracking-wide uppercase text-slate-200">
                Portál
              </h4>
              <ul className="space-y-2.5 text-slate-300">
                <li>
                  <button onClick={() => handleNav('/')} className="hover:text-blue-400 transition-colors flex items-center gap-2 group text-left cursor-pointer">
                    <span>🏠</span>
                    <span>Domů</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav('/judikatura')} className="hover:text-blue-400 transition-colors flex items-center gap-2 group text-left cursor-pointer">
                    <span>📚</span>
                    <span>Judikatura</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav('/dokumenty')} className="hover:text-blue-400 transition-colors flex items-center gap-2 group text-left cursor-pointer">
                    <span>📁</span>
                    <span>Dokumenty</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav('/agenda')} className="hover:text-blue-400 transition-colors flex items-center gap-2 group text-left cursor-pointer">
                    <span>📅</span>
                    <span>Kalendář</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Informace */}
            <div>
              <h4 className="font-bold text-white text-sm mb-4 tracking-wide uppercase text-slate-200">
                Informace
              </h4>
              <ul className="space-y-2.5 text-slate-300">
                <li>
                  <button onClick={() => handleNav('/podporte-nas')} className="hover:text-rose-400 transition-colors flex items-center gap-2 group text-left cursor-pointer">
                    <span>❤️</span>
                    <span className="font-semibold text-rose-300 group-hover:text-rose-400">Podpořte nás & Vznik spolku</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav('/clanky')} className="hover:text-blue-400 transition-colors flex items-center gap-2 group text-left cursor-pointer">
                    <span>📄</span>
                    <span>Články</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => handleCompliance('gdpr', '/ochrana-osobnich-udaju')} className="hover:text-blue-400 transition-colors flex items-center gap-2 group text-left cursor-pointer">
                    <span>🔐</span>
                    <span>Ochrana osobních údajů</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => handleCompliance('terms', '/podminky-uzivani')} className="hover:text-blue-400 transition-colors flex items-center gap-2 group text-left cursor-pointer">
                    <span>📜</span>
                    <span>Podmínky používání</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => handleCompliance('cookies')} className="hover:text-blue-400 transition-colors flex items-center gap-2 group text-left cursor-pointer">
                    <span>🍪</span>
                    <span>Cookies</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Sponsors Attribution Block */}
          <div className="pt-6 border-t border-slate-800 text-center space-y-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Děkujeme našim sponzorům a technologickým partnerům
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm text-slate-400 font-medium">
              <a href="https://www.algotech.cz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">ALGOTECH a.s.</a>
              <span className="text-slate-700 select-none">•</span>
              <a href="https://www.vedos.cz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">VEDOS Internet, a.s.</a>
              <span className="text-slate-700 select-none">•</span>
              <a href="https://www.forpsi.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">FORPSI</a>
            </div>
          </div>

          {/* Desktop Bottom Bar */}
          <div className="space-y-3 pt-2 text-xs text-slate-400">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">Táta má právo © {currentYear}</span>
                <span className="text-slate-600">|</span>
                <span>Projekt zaměřený na podporu otců a nejlepší zájem dítěte.</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 font-medium">
                <button onClick={() => handleNav('/kontakt')} className="hover:text-slate-200 transition-colors cursor-pointer">
                  Kontakt
                </button>
                <span>·</span>
                <button onClick={() => handleCompliance('terms', '/podminky-uzivani')} className="hover:text-slate-200 transition-colors cursor-pointer">
                  Podmínky
                </button>
                <span>·</span>
                <button onClick={() => handleCompliance('gdpr', '/ochrana-osobnich-udaju')} className="hover:text-slate-200 transition-colors cursor-pointer">
                  Ochrana osobních údajů
                </button>
                <span>·</span>
                <button onClick={() => handleCompliance('cookies')} className="hover:text-slate-200 transition-colors cursor-pointer">
                  Cookies
                </button>
              </div>
            </div>

            <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
              <span>Vytvořeno s </span>
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline mx-0.5" />
              <span> pro spravedlivou péči o děti v ČR.</span>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* MOBILE VERSION (block md:hidden)           */}
        {/* ========================================== */}
        <div className="block md:hidden space-y-6">
          {/* 1. Logo and subtitle */}
          <div className="space-y-2">
            <Logo variant="white" size="md" showSubtitle={false} />
            <p className="text-xs text-slate-400 leading-relaxed">
              Praktická pomoc otcům v náročných rodinných situacích. Informace, dokumenty, zkušenosti a podpora na jednom místě.
            </p>
          </div>

          {/* 2. Badge / Button */}
          <div>
            <button
              onClick={() => handleNav('/o-nas')}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-blue-400 border border-slate-700/80 text-xs font-semibold cursor-pointer"
            >
              <Shield className="w-4 h-4 text-blue-400" />
              <span>🛡️ Nejlepší zájem dítěte</span>
            </button>
          </div>

          {/* 3. Prominent Crisis Button */}
          <div>
            <button
              onClick={() => handleNav('/sos-plan')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-900/40 cursor-pointer"
            >
              <span>🚨 Potřebuji pomoc</span>
            </button>
          </div>

          {/* 4. Rychlá navigace */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h5 className="font-bold text-white text-xs tracking-wider uppercase text-slate-300">
              Rychlá navigace
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleNav('/')}
                className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-left text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                🏠 Domů
              </button>
              <button
                onClick={() => handleNav('/sos-plan')}
                className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-left text-rose-300 hover:text-rose-200 font-medium transition-colors cursor-pointer"
              >
                🚨 Krizová pomoc
              </button>
              <button
                onClick={() => handleNav('/podporte-nas')}
                className="col-span-2 p-2.5 rounded-lg bg-rose-900/30 border border-rose-800/30 hover:bg-rose-900/50 text-center text-rose-300 hover:text-rose-200 font-medium transition-colors cursor-pointer"
              >
                ❤️ Podpořte nás & Vznik spolku
              </button>
              <button
                onClick={() => handleNav('/pravni-poradna')}
                className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-left text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                ⚖️ Právní poradna
              </button>
              <button
                onClick={() => handleNav('/judikatura')}
                className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-left text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                📚 Judikatura
              </button>
              <button
                onClick={() => handleNav('/forum')}
                className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-left text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                👥 Komunita
              </button>
              <button
                onClick={() => handleNav('/dokumenty')}
                className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-left text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                📁 Dokumenty
              </button>
            </div>
          </div>

          {/* 5. Právní informace */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h5 className="font-bold text-white text-xs tracking-wider uppercase text-slate-300">
              Právní informace
            </h5>
            <div className="flex flex-col space-y-2 text-xs text-slate-400">
              <button
                onClick={() => handleCompliance('terms', '/podminky-uzivani')}
                className="text-left hover:text-slate-200 transition-colors cursor-pointer"
              >
                📜 Podmínky používání
              </button>
              <button
                onClick={() => handleCompliance('gdpr', '/ochrana-osobnich-udaju')}
                className="text-left hover:text-slate-200 transition-colors cursor-pointer"
              >
                🔐 Ochrana osobních údajů
              </button>
              <button
                onClick={() => handleCompliance('cookies')}
                className="text-left hover:text-slate-200 transition-colors cursor-pointer"
              >
                🍪 Cookies
              </button>
            </div>
          </div>

          {/* 6. Oddělovací linka */}
          <div className="border-t border-slate-800 pt-4 space-y-2 text-center text-xs text-slate-400">
            {/* Sponsors Attribution Block */}
            <div className="pb-2 space-y-1">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                Děkujeme našim sponzorům a technologickým partnerům
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-medium">
                <a href="https://www.algotech.cz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">ALGOTECH a.s.</a>
                <span className="hidden sm:inline text-slate-700 select-none">•</span>
                <a href="https://www.vedos.cz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">VEDOS Internet, a.s.</a>
                <span className="hidden sm:inline text-slate-700 select-none">•</span>
                <a href="https://www.forpsi.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">FORPSI</a>
              </div>
            </div>

            <div className="border-t border-slate-800/60 pt-3">
              {/* 7. Autorská práva */}
              <div>Táta má právo © {currentYear}</div>
              <div className="flex items-center justify-center gap-1 text-slate-500 text-[11px] mt-1">
                <span>Pro spravedlivou péči o děti v ČR</span>
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};
