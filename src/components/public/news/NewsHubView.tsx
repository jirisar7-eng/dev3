import React, { useState } from 'react';
import { SeoHead } from '../SeoHead';
import { Newspaper, Calendar, ExternalLink, Search, Filter, Tag, ArrowRight } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: 'legislativa' | 'judikatura' | 'projekt' | 'studie';
  source?: string;
  url?: string;
  tags: string[];
}

const MOCK_NEWS: NewsItem[] = [
  {
    id: 'n1',
    title: 'Novela zákona o rodině: Změny v definici péče od 1. 1. 2026',
    summary: 'Soudy opouští formální označení výlučná/střídavá/společná péče a nově definují pouze "rozsah péče". Co to znamená pro stávající rozsudky?',
    date: '2025-10-15',
    category: 'legislativa',
    source: 'e-Sbírka',
    tags: ['Zákon 268/2025 Sb.', 'Rozsah péče']
  },
  {
    id: 'n2',
    title: 'Přelomový nález Ústavního soudu k právu na spravedlivý proces',
    summary: 'ÚS se zastal otce, kterému obecné soudy odepřely možnost vyjádřit se k novým důkazům OSPOD před vynesením rozsudku.',
    date: '2026-02-28',
    category: 'judikatura',
    source: 'Ústavní soud ČR',
    tags: ['Ústavní soud', 'Spravedlivý proces', 'OSPOD']
  },
  {
    id: 'n3',
    title: 'Nová studie: Vliv rovnocenné péče na psychiku dětí v adolescentním věku',
    summary: 'Rozsáhlá metaanalýza ukazuje, že děti v uspořádání rovnocenného rozsahu péče vykazují nižší míru úzkostí než děti ve výhradní péči.',
    date: '2026-05-12',
    category: 'studie',
    url: 'https://example.com/study',
    tags: ['Psychologie', 'Výzkum', 'Adolescenti']
  },
  {
    id: 'n4',
    title: 'Spuštění nového modulu: AI Case Manager pro prémiové účty',
    summary: 'Nový nástroj analyzuje vaše nahrané dokumenty a upozorní vás na termíny, procesní vady a doporučí další kroky.',
    date: '2026-08-01',
    category: 'projekt',
    tags: ['AI Nástroje', 'Aktualizace', 'Premium']
  }
];

export const NewsHubView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredNews = MOCK_NEWS.filter(news => {
    const matchesSearch = news.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          news.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || news.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[var(--color-background,#f8fafc)] pb-20">
      <SeoHead
        title="Novinky & Aktuality | Táta má právo"
        description="Sledujte nejnovější legislativní změny, přelomovou judikaturu a novinky v projektu Táta má právo."
        canonicalPath="/novinky"
      />

      <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider mb-3">
            <Newspaper className="w-4 h-4" />
            <span>Informační servis</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            Novinky & Aktuality
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Legislativní změny, nová judikatura, výzkumy a aktualizace nástrojů projektu. Zůstaňte v obraze.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Hledat v novinkách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            <Filter className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            {['all', 'legislativa', 'judikatura', 'projekt', 'studie'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  activeCategory === cat 
                    ? 'bg-blue-900 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'Všechny' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {filteredNews.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
              <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">Žádné novinky nenalezeny</h3>
              <p className="text-slate-500 text-sm mt-2">Zkuste upravit vyhledávání nebo filtry.</p>
            </div>
          ) : (
            filteredNews.map(news => (
              <article key={news.id} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(news.date).toLocaleDateString('cs-CZ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                      news.category === 'legislativa' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      news.category === 'judikatura' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      news.category === 'studie' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {news.category}
                    </span>
                  </div>
                  {news.source && (
                    <span className="text-[11px] font-semibold text-slate-400 border border-slate-100 bg-slate-50 px-2.5 py-1 rounded-lg">
                      Zdroj: {news.source}
                    </span>
                  )}
                </div>
                
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">
                  {news.title}
                </h2>
                
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
                  {news.summary}
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-slate-100">
                  <div className="flex flex-wrap gap-2">
                    {news.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  {news.url ? (
                    <a href={news.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl">
                      Přečíst celý článek <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <button className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
                      Více informací <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
