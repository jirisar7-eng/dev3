import React from 'react';
import { Menu, Shield, ArrowLeft, ExternalLink, Server } from 'lucide-react';
import { AdminTabId, ADMIN_NAV_SECTIONS, findSectionByTabId } from '../../../config/adminNavigation';
import { useAuth } from '../../../context/AuthContext';

interface AdminHeaderProps {
  activeTab: AdminTabId;
  onOpenMobileMenu: () => void;
  onNavigate?: (path: string) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  onNavigate,
}) => {
  const { currentUser } = useAuth();

  const currentSectionId = findSectionByTabId(activeTab);
  const currentSection = ADMIN_NAV_SECTIONS.find((s) => s.id === currentSectionId);
  const currentItem = currentSection?.items.find((i) => i.id === activeTab);

  const handleBackToPortal = () => {
    if (onNavigate) {
      onNavigate('/portal');
    } else {
      window.history.pushState({}, '', '/portal');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl mb-6 border border-slate-800">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Breadcrumb / Title */}
        <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2.5 rounded-2xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
            aria-label="Otevřít navigaci administrace"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                ADMIN CONTROL CENTER
              </span>
              {currentSection && (
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <span>/</span>
                  <span>{currentSection.emoji} {currentSection.title}</span>
                  {currentItem && (
                    <>
                      <span>/</span>
                      <span className="text-white font-bold">{currentItem.title}</span>
                    </>
                  )}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {currentItem?.title || 'Administrace: Táta má právo'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              {currentItem?.subtitle || 'Hierarchická správa obsahu, uživatelů, práva, AI agentů a systémových operací.'}
            </p>
          </div>

          <button
            onClick={handleBackToPortal}
            className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Right Side: Environment Status & User Info */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleBackToPortal}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Zpět do portálu</span>
          </button>

          <div className="flex items-center gap-3 bg-slate-800/90 py-2 px-3 rounded-2xl border border-slate-700/80 text-xs">
            <img
              src={currentUser?.avatar}
              alt={currentUser?.name}
              className="w-8 h-8 rounded-xl border border-amber-400 object-cover"
            />
            <div className="min-w-0">
              <span className="font-bold text-white block truncate text-xs">{currentUser?.name}</span>
              <span className="text-[10px] text-amber-400 font-bold uppercase font-mono">{currentUser?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
