import React from 'react';
import { Menu, ArrowLeft } from 'lucide-react';
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
    <div className="bg-[var(--admin-surface)] text-[var(--admin-text)] rounded-3xl p-5 sm:p-7 shadow-sm mb-6 border border-[var(--admin-border)] flex flex-col min-w-0 max-w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
        {/* Left Side: Mobile Menu Button & Breadcrumb / Title */}
        <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden flex-shrink-0 p-2.5 rounded-2xl bg-[var(--admin-surface-muted)] text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)] border border-[var(--admin-border)] transition-all cursor-pointer"
            aria-label="Otevřít navigaci administrace"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--admin-surface-muted)] text-[var(--admin-text-muted)] border border-[var(--admin-border)] text-[10px] font-bold uppercase tracking-wider">
                ADMIN CONTROL CENTER
              </span>
              {currentSection && (
                <span className="text-xs text-[var(--admin-text-muted)] flex items-center gap-1 font-medium truncate">
                  <span>/</span>
                  <span className="truncate">{currentSection.emoji} {currentSection.title}</span>
                  {currentItem && (
                    <>
                      <span>/</span>
                      <span className="text-[var(--admin-primary)] font-bold truncate">{currentItem.title}</span>
                    </>
                  )}
                </span>
              )}
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-[var(--admin-primary)] tracking-tight flex items-center gap-2 truncate">
              {currentItem?.title || 'Administrace: Táta má právo'}
            </h1>
            <p className="text-xs text-[var(--admin-text-muted)] mt-0.5 hidden sm:block truncate">
              {currentItem?.subtitle || 'Hierarchická správa obsahu, uživatelů, práva, AI agentů a systémových operací.'}
            </p>
          </div>
          
          <button
            onClick={handleBackToPortal}
            className="md:hidden flex-shrink-0 p-2 rounded-xl bg-[var(--admin-surface-muted)] text-[var(--admin-text-muted)] border border-[var(--admin-border)] hover:text-[var(--admin-primary)] text-xs flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Right Side: Environment Status & User Info */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-shrink-0">
          <button
            onClick={handleBackToPortal}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--admin-surface-muted)] text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)] border border-[var(--admin-border)] text-xs font-semibold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Zpět do portálu</span>
          </button>
          
          <div className="flex items-center gap-3 bg-[var(--admin-surface-muted)] py-2 px-3 rounded-2xl border border-[var(--admin-border)] text-xs max-w-full">
            <img
              src={currentUser?.avatar}
              alt={currentUser?.name}
              className="w-8 h-8 rounded-xl border border-[var(--admin-border)] object-cover flex-shrink-0"
            />
            <div className="min-w-0 pr-1">
              <span className="font-bold text-[var(--admin-primary)] block truncate text-xs">{currentUser?.name}</span>
              <span className="text-[10px] text-[var(--admin-info)] font-bold uppercase font-mono truncate block">{currentUser?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
