import React, { useState } from 'react';
import { SeoHead } from './SeoHead';
import { ShieldCheck, Book, Search, PlayCircle, FileText, LifeBuoy, ArrowRight } from 'lucide-react';

interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  articles: { title: string; link: string; type: 'video' | 'text' }[];
}

const HELP_DATA: HelpSection[] = [
  {
    id: 'start',
    title: 'Jak začít s aplikací',
    description: 'Základní průvodce nastavením účtu a prvními kroky.',
    icon: <PlayCircle className="w-6 h-6 text-blue-600" />,
    articles: [
      { title: 'Vytvoření bezpečného účtu', link: '#', type: 'text' },
      { title: 'Jak aktivovat 2FA ochranu', link: '#', type: 'video' },
      { title: 'Nastavení SOS kontaktů', link: '#', type: 'text' }
    ]
  },
  {
    id: 'cases',
    title: 'Spis a dokumenty',
    description: 'Návody k nahrávání a správě právních dokumentů.',
    icon: <FileText className="w-6 h-6 text-blue-600" />,
    articles: [
      { title: 'Jak bezpečně nahrát rozsudek', link: '#', type: 'text' },
      { title: 'Kategorizace důkazních materiálů', link: '#', type: 'text' },
      { title: 'Export spisu pro advokáta', link: '#', type: 'video' }
    ]
  },
  {
    id: 'ai',
    title: 'AI Právní asistent',
    description: 'Využití AI pro analýzu případu a generování podání.',
    icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
    articles: [
      { title: 'Jak zadat prompt pro analýzu', link: '#', type: 'video' },
      { title: 'Ochrana osobních údajů v AI', link: '#', type: 'text' },
      { title: 'Generování návrhu na úpravu péče', link: '#', type: 'text' }
    ]
  },
  {
    id: 'support',
    title: 'Podpora a SOS',
    description: 'Co dělat v krizové situaci a jak kontaktovat podporu.',
    icon: <LifeBuoy className="w-6 h-6 text-blue-600" />,
    articles: [
      { title: 'Aktivace krizového SOS plánu', link: '#', type: 'video' },
      { title: 'Otevření tiketu na podpoře', link: '#', type: 'text' },
      { title: 'Seznam krizových linek', link: '#', type: 'text' }
    ]
  }
];

interface UserManualPageProps { onNavigate?: (path: string) => void; }
export const UserManualPage: React.FC<UserManualPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-[var(--color-background,#f8fafc)] pb-20">
      <SeoHead
        title="Nápověda & Uživatelský manuál | Táta má právo"
        description="Kompletní průvodce systémem Táta má právo. Návody, postupy a odpovědi na vaše dotazy."
        canonicalPath="/user-manual"
      />

      <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider mb-4">
            <Book className="w-4 h-4" />
            <span>Centrum nápovědy</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-6">
            Jak vám můžeme pomoci?
          </h1>
          
          <div className="max-w-2xl mx-auto relative mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Hledat v nápovědě (např. 'nastavení 2FA', 'jak nahrát důkaz')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm transition-all text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {HELP_DATA.map(section => (
            <div key={section.id} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded-2xl shrink-0">
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
                  <p className="text-sm text-slate-500 mt-1">{section.description}</p>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                {section.articles.map((article, idx) => (
                  <a 
                    key={idx} 
                    href={article.link} 
                    className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {article.type === 'video' ? (
                        <PlayCircle className="w-4 h-4 text-blue-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">{article.title}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </a>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-100">
                <a href="#" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                  Zobrazit všechny články v této sekci
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 bg-slate-900 rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-600/10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/2"></div>
          <div className="relative z-10">
            <LifeBuoy className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Nenašli jste, co jste hledali?</h3>
            <p className="text-slate-300 mb-6 max-w-lg mx-auto">
              Náš tým podpory je připraven vám pomoci. Otevřete nový tiket a my se vám ozveme co nejdříve.
            </p>
            <a href="/portal/podpora" className="inline-flex px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-colors">
              Kontaktovat podporu
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
