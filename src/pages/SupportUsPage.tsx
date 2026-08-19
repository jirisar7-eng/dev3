import React, { useState, useEffect } from 'react';
import { Heart, Building2, ChevronRight, Users, Sparkles, HandHeart, ShieldCheck, Scale, FileText, Eye } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { SupportInterestModal } from '../components/support/SupportInterestModal';
import { AssociationDocumentsModal } from '../components/support/AssociationDocumentsModal';
import { AssociationDemoModal } from '../components/support/AssociationDemoModal';

const SupportUsPage: React.FC<{ interactiveOnly?: boolean }> = ({ interactiveOnly }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'SPONSOR' | 'FOUNDER' | 'BOARD'>('SPONSOR');
  
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [docsModalTab, setDocsModalTab] = useState<'stanovy' | 'prohlaseni'>('stanovy');

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const openModal = (type: 'SPONSOR' | 'FOUNDER' | 'BOARD') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const openDocsModal = (tab: 'stanovy' | 'prohlaseni' = 'stanovy') => {
    setDocsModalTab(tab);
    setIsDocsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {!interactiveOnly && <Navbar onLoginClick={() => {}} user={null} />}
      
      <main className="flex-grow pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          {!interactiveOnly && (
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 text-rose-500 mb-6 shadow-sm">
              <Heart className="w-8 h-8 fill-current" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
              Pomozte nám budovat spravedlivé prostředí
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Vyvíjíme bezplatné nástroje a AI asistenty pro táty v rozvodovém řízení. Zajišťujeme osvětu, pomáháme chránit zájmy dětí a usilujeme o rovnoprávnější a spravedlivější justici. K tomu potřebujeme vaši podporu.
            </p>
          </div>
          )}

          {/* Cards Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Card 1: Sponsors */}
            <div className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-blue-50 transition-transform group-hover:scale-150 duration-700 ease-in-out"></div>
              
              <div className="relative z-10 flex-grow">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                  <HandHeart className="w-7 h-7" />
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-4">
                  Sponzoring & Darování
                </h2>
                
                <p className="text-slate-600 leading-relaxed mb-8">
                  Vaše finanční podpora zajistí provoz platformy Táta má právo, vývoj nových AI nástrojů (jako je CoParenting kalendář či analyzátor rozsudků) a umožní nám poskytovat právní osvětu tátům zcela zdarma.
                </p>

                <ul className="space-y-4 mb-10">
                  <li className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-700">Podpora provozu serverů a API (vč. LLM modelů).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-700">Vhodné pro individuální dárce i firemní sponzory.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Scale className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-700">Přímý dopad na stovky rodin v náročných životních situacích.</span>
                  </li>
                </ul>
              </div>

              <div className="relative z-10 mt-auto">
                <button 
                  onClick={() => openModal('SPONSOR')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  Chci se stát dárcem / sponzorem
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Card 2: NGO Formation */}
            <div className="bg-slate-900 rounded-[2rem] p-8 sm:p-10 shadow-xl shadow-slate-900/20 border border-slate-800 flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-indigo-500/10 transition-transform group-hover:scale-150 duration-700 ease-in-out"></div>
              
              <div className="relative z-10 flex-grow">
                <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-indigo-500/20">
                  <Building2 className="w-7 h-7" />
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-4">
                  Vznik spolku (z.s.)
                </h2>
                
                <p className="text-slate-300 leading-relaxed mb-8">
                  Připravujeme založení oficiálního zapsaného spolku (NGO). Hledáme partnery, kteří finančně podpoří právní vznik spolku a stanou se jeho ZAKLÁDAJÍCÍMI ČLENY nebo členy rady.
                </p>

                <ul className="space-y-4 mb-10">
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-200">Čestný titul <span className="text-indigo-300">Zakládající člen</span> zapsaný v rejstříku.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-200">Možnost vstoupit do rady spolku a podílet se na strategii.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-200">Zajištění transparentnosti financování přes transparentní účet.</span>
                  </li>
                </ul>
              </div>

              <div className="relative z-10 mt-auto space-y-3">
                <button 
                  onClick={() => openModal('FOUNDER')}
                  className="w-full bg-indigo-500 hover:bg-indigo-400 text-white py-4 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Mám zájem o zakládající členství
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button 
                  type="button"
                  onClick={() => setIsDemoModalOpen(true)}
                  className="w-full bg-slate-800/80 hover:bg-slate-800 text-indigo-300 hover:text-white py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-700/80 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs group/docbtn"
                >
                  <Eye className="w-4 h-4 text-indigo-400 group-hover/docbtn:scale-110 transition-transform" />
                  <span>Ukázkový režim Táta má právo z.s.</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      <SupportInterestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        defaultInterest={modalType}
      />

      <AssociationDocumentsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
        onJoinClick={() => openModal('FOUNDER')}
        initialTab={docsModalTab}
      />

      <AssociationDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onJoinClick={() => openModal('FOUNDER')}
      />
    </div>
  );
};

export default SupportUsPage;
