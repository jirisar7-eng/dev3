import React from 'react';
import { SeoHead } from './SeoHead';
import { ShieldCheck, Map } from 'lucide-react';

interface SitemapPageProps {
  onNavigate?: (path: string) => void;
}

export const SitemapPage: React.FC<SitemapPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[var(--color-background,#f8fafc)] pb-20">
      <SeoHead
        title="Architektura & Vývoj Synthesis OS (Sitemap) | Táta má právo"
        description="Stránka je připravena pro budoucí obsah."
        canonicalPath="/sitemap"
      />
      
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider mb-3">
            <Map className="w-4 h-4" />
            <span>Táta má právo • Mapa webu</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
            Architektura & Vývoj Synthesis OS (Sitemap)
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Stránka je připravena pro budoucí obsah.
          </p>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <div className="bg-[var(--color-surface,#ffffff)] p-6 rounded-3xl border border-[var(--color-border,#e2e8f0)] text-slate-800">
          <p className="mb-6 text-sm"><strong>Kategorie:</strong> 🛠️ ADMINISTRACE & SYSTÉM</p>
          <hr className="mb-6 border-[var(--color-border,#e2e8f0)]" />
          <h3 className="text-xl font-bold mb-4">📥 Stránka je připravena pro budoucí obsah.</h3>
          <p className="text-sm leading-relaxed text-slate-600">
            Všechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.
          </p>
        </div>
      </div>
    </div>
  );
};
