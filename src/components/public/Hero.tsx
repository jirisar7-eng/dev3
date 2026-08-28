import React from 'react';
import { useText } from '../../context/TextContext';
import { Shield, HeartHandshake, Scale, ArrowRight, LifeBuoy, PhoneCall, AlertTriangle, ChevronRight } from 'lucide-react';

interface HeroProps {
  onNavigate?: (path: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  const { t } = useText();

  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[var(--color-surface,#ffffff)] via-[var(--color-background,#f8fafc)] to-[var(--color-background,#f8fafc)] py-12 lg:py-20 border-b border-[var(--color-border,#e2e8f0)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Crisis SOS Banner */}
        <div className="mb-8 max-w-4xl mx-auto bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center shrink-0">
              <LifeBuoy className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                <span>Jste v akutní krizi nebo vám bylo zabráněno ve styku s dítětem?</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Okamžité postupy pro první hodiny, krizové linky a právní desatero.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => handleNav('/sos-plan')}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>SOS Krizový plán</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleNav('/krizova-pomoc')}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>Krizová pomoc</span>
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-6 shadow-2xs">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Portál pro právní a psychologickou oporu otců v ČR</span>
          </div>

          {/* Main Title powered by Text Manager */}
          <h1 className="text-4xl sm:text-5xl font-black text-[var(--color-heading,#0f172a)] tracking-tight leading-tight mb-6">
            {t('home.hero.title', 'Táta má právo. Dítě má právo na oba rodiče.')}
          </h1>

          {/* Subtitle powered by Text Manager */}
          <p className="text-lg sm:text-xl text-[var(--color-text,#1e293b)] leading-relaxed mb-8 opacity-90">
            {t(
              'home.hero.subtitle',
              'Komplexní opora pro otce v opatrovnických situacích. Právní orientace, psychologická podpora a spravedlivá péče zohledňující NEJLEPŠÍ ZÁJEM DÍTĚTE.'
            )}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => handleNav('/kalkulacka-vyzivneho')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--color-primary,#1e3a8a)] text-white font-semibold shadow-md hover:opacity-95 transition-all text-sm cursor-pointer"
            >
              <span>Kalkulačka výživného</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleNav('/judikatura')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-[var(--color-border,#e2e8f0)] text-[var(--color-heading,#0f172a)] font-semibold shadow-2xs hover:bg-slate-50 transition-all text-sm cursor-pointer"
            >
              <span>Judikatura ÚS ČR</span>
            </button>
            <button
              onClick={() => handleNav('/psychologie')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold shadow-2xs hover:bg-emerald-100 transition-all text-sm cursor-pointer"
            >
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
              <span>Psychologie & Emoce</span>
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-14 text-left border-t border-[var(--color-border,#e2e8f0)] pt-10">
            <div
              onClick={() => handleNav('/state-laws')}
              className="p-4 rounded-xl bg-white/70 border border-slate-100 shadow-2xs hover:border-blue-300 transition-all cursor-pointer"
            >
              <Scale className="w-6 h-6 text-blue-600 mb-2" />
              <h2 className="font-bold text-slate-900 text-sm">Právní jistota & e-Sbírka</h2>
              <p className="text-xs text-slate-600 mt-1">Metodika opatrovnického řízení, OSPOD a rozhodování soudů v ČR.</p>
            </div>
            <div
              onClick={() => handleNav('/psychologie')}
              className="p-4 rounded-xl bg-white/70 border border-slate-100 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer"
            >
              <HeartHandshake className="w-6 h-6 text-emerald-600 mb-2" />
              <h2 className="font-bold text-slate-900 text-sm">Psychologie & BIFF</h2>
              <p className="text-xs text-slate-600 mt-1">Nenásilná věcná komunikace, zvládání krizí a ochrana psychiky dítěte.</p>
            </div>
            <div
              onClick={() => handleNav('/majetek')}
              className="p-4 rounded-xl bg-white/70 border border-slate-100 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer"
            >
              <Shield className="w-6 h-6 text-indigo-600 mb-2" />
              <h2 className="font-bold text-slate-900 text-sm">Majetek & SJM</h2>
              <p className="text-xs text-slate-600 mt-1">Průvodce vypořádáním majetku, hypoték, vnosů a 3leté zákonné lhůty.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
