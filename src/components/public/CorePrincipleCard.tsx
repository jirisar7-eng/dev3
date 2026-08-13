import React from 'react';
import { useText } from '../../context/TextContext';
import { Heart, CheckCircle2, ShieldCheck } from 'lucide-react';

export const CorePrincipleCard: React.FC = () => {
  const { t } = useText();

  return (
    <section className="py-12 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl my-8 rounded-3xl max-w-7xl mx-auto px-6 sm:px-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold mb-4">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>Základní filozofie portálu</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
            {t('core.principle.title', 'NEJLEPŠÍ ZÁJEM DÍTĚTE')}
          </h2>
          <p className="text-blue-100 text-base leading-relaxed max-w-2xl">
            {t(
              'core.principle.desc',
              'Všechna doporučení, nástroje a metodiky stavíme na nezpochybnitelném právu dítěte mít zdravý a rovnocenný vztah s oběma rodiči. Rodičovský konflikt nesmí připravit dítě o jednoho z rodičů.'
            )}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 max-w-md w-full">
          <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Pilíře opatrovnické péče:
          </h3>
          <ul className="space-y-2 text-xs text-blue-100">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Rovnováha výchovného působení otce i matky</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Ochrana před psychickým odcizením a manipulací</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Stabilita prostředí a transparentní předávání dítěte</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Konstruktivní dohoda namísto destruktivních soudních sporů</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};
