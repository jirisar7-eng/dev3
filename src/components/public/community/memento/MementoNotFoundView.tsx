import React from 'react';
import { SeoHead } from '../../SeoHead';
import { ArrowLeft, AlertCircle, ChevronRight, BookOpen } from 'lucide-react';
import { MEMENTO_THEMES } from './mementoTypes';

interface MementoNotFoundViewProps {
  onNavigate: (path: string) => void;
}

export const MementoNotFoundView: React.FC<MementoNotFoundViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <SeoHead
        title="Stránka nenalezena • Memento otců"
        description="Požadovaná stránka v modulu Memento otců nebyla nalezena."
        canonicalPath="/memento"
      />

      <nav className="flex items-center gap-2 text-xs font-bold text-slate-600">
        <button
          onClick={() => onNavigate('/memento')}
          className="hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Memento otců</span>
        </button>
        <span>/</span>
        <span className="text-slate-900">Stránka nenalezena (404)</span>
      </nav>

      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Požadovaná stránka v modulu Memento otců nebyla nalezena
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Zkontrolujte zadanou URL adresu nebo se vraťte na hlavní přehled či některý z tematických okruhů.
        </p>

        <div className="pt-4">
          <button
            onClick={() => onNavigate('/memento')}
            className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ← Vracím se na hlavní stránku Mementa
          </button>
        </div>
      </div>

      {/* Seznam dostupných témat */}
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
          Dostupné tématické okruhy Mementa:
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.values(MEMENTO_THEMES).map((theme) => (
            <button
              key={theme.id}
              onClick={() => onNavigate(`/memento/${theme.slug}`)}
              className="p-4 rounded-2xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-left transition-all cursor-pointer group flex items-center justify-between"
            >
              <div>
                <strong className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 block">
                  {theme.title}
                </strong>
                <span className="text-[11px] text-slate-500">{theme.badge}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
