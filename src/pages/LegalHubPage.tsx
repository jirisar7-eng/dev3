import React, { useState } from 'react';
import { 
  Scale, 
  FileText, 
  Gavel, 
  ShieldAlert, 
  ChevronRight, 
  ArrowLeft,
  BookOpen
} from 'lucide-react';
import { 
  AgendaView, 
  RightsView, 
  CaseLawView, 
  DocumentsView 
} from '../components/public/legal';

interface LegalHubPageProps {
  onNavigate: (path: string) => void;
  onOpenCookieSettings: () => void;
}

type LegalSubView = 'hub' | 'rights' | 'agenda' | 'caselaw' | 'documents';

export const LegalHubPage: React.FC<LegalHubPageProps> = ({ onNavigate }) => {
  const [activeSubView, setActiveSubView] = useState<LegalSubView>('hub');

  const renderSubView = () => {
    switch (activeSubView) {
      case 'rights':
        return <RightsView />;
      case 'agenda':
        return <AgendaView />;
      case 'caselaw':
        return <CaseLawView />;
      case 'documents':
        return <DocumentsView />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setActiveSubView('rights')}
              className="flex flex-col items-start p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Vaše práva</h3>
              <p className="text-sm text-slate-600 text-left">
                Přehled základních práv rodičů v opatrovnickém řízení a jak je efektivně hájit.
              </p>
              <div className="mt-4 flex items-center text-blue-600 font-bold text-sm">
                Zobrazit více <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => setActiveSubView('agenda')}
              className="flex flex-col items-start p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
                <Gavel className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Soudní agenda</h3>
              <p className="text-sm text-slate-600 text-left">
                Jak probíhá řízení, co očekávat od soudu a jak se připravit na jednání.
              </p>
              <div className="mt-4 flex items-center text-orange-600 font-bold text-sm">
                Zobrazit více <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => setActiveSubView('caselaw')}
              className="flex flex-col items-start p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Judikatura</h3>
              <p className="text-sm text-slate-600 text-left">
                Důležitá rozhodnutí Ústavního a Nejvyššího soudu, o která se můžete opřít.
              </p>
              <div className="mt-4 flex items-center text-purple-600 font-bold text-sm">
                Zobrazit více <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => setActiveSubView('documents')}
              className="flex flex-col items-start p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Vzory dokumentů</h3>
              <p className="text-sm text-slate-600 text-left">
                Šablony podání, vyjádření a návrhů ke stažení a úpravě.
              </p>
              <div className="mt-4 flex items-center text-green-600 font-bold text-sm">
                Zobrazit více <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4">
        {activeSubView !== 'hub' ? (
          <button 
            onClick={() => setActiveSubView('hub')}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Zpět na právní rozcestník</span>
          </button>
        ) : (
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold mb-4">
              <ShieldAlert className="w-3 h-3" />
              <span>Právní podpora</span>
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Právní rozcestník</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Všechny důležité informace, zákony a judikáty na jednom místě. Pomáháme vám orientovat se v právním systému.
            </p>
          </div>
        )}

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {renderSubView()}
        </div>
      </div>
    </div>
  );
};
