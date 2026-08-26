import React from 'react';
import { NavItem } from '../../types';
import { NAVIGATION_ITEMS, getVisibleNavItems } from '../../config/navigation';
import { Compass, X, ExternalLink, LogIn, UserPlus, User as UserIcon, Globe, LogOut, Shield, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath?: string;
  onNavigate: (url: string) => void;
  isAuthorizedAdmin?: boolean;
  isSuperAdmin?: boolean;
  items?: NavItem[];
}

export const MegaMenu: React.FC<MegaMenuProps> = ({
  isOpen,
  onClose,
  currentPath = '/',
  onNavigate,
  isAuthorizedAdmin = false,
  items = NAVIGATION_ITEMS,
}) => {
  const { currentUser, logout, hasRole } = useAuth();

  if (!isOpen) return null;

  const allowedNavItems = getVisibleNavItems(items, {
    isAuthenticated: !!currentUser,
    role: currentUser?.role || null,
  });

  const parentCategories = allowedNavItems.filter((item) => !item.parentId && item.id !== 'nav-1');
  const childItemsMap = allowedNavItems.reduce((acc, item) => {
    if (item.parentId) {
      if (!acc[item.parentId]) acc[item.parentId] = [];
      acc[item.parentId].push(item);
    }
    return acc;
  }, {} as Record<string, NavItem[]>);

  const canAccessAdmin =
    isAuthorizedAdmin ||
    hasRole('ADMIN') ||
    hasRole('SUPER_ADMIN') ||
    hasRole('SYSTEM_ADMIN') ||
    hasRole('MODERATOR') ||
    hasRole('LEGAL_EDITOR') ||
    hasRole('CONTENT_MANAGER');

  return (
    <div id="mega-menu-overlay" className="absolute top-16 left-0 right-0 w-full bg-white border-b border-slate-200 px-4 pt-4 pb-6 shadow-2xl animate-in slide-in-from-top-2 duration-200 max-h-[85vh] overflow-y-auto z-50">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" />
            <span>HLAVNÍ ROZCESTNÍK PORTÁLU</span>
          </div>
          <button
            id="mega-menu-close-button"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
            aria-label="Zavřít menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick links block with Home, Veřejnost, Můj účet, Login/Register */}
        <div className="flex flex-wrap gap-2 pt-1 border-b border-slate-100 pb-4">
          <a
            id="mega-menu-quick-home"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
              onClose();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
              currentPath === '/'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100'
            }`}
          >
            <span>🏠 Domů</span>
          </a>

          <button
            id="mega-menu-quick-public"
            type="button"
            onClick={() => {
              onNavigate('/');
              onClose();
            }}
            className="px-3 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Veřejný portál</span>
          </button>

          {currentUser ? (
            <>
              <button
                id="mega-menu-quick-portal"
                type="button"
                onClick={() => {
                  onNavigate('/portal');
                  onClose();
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer bg-blue-50 border border-blue-200 text-blue-900 hover:bg-blue-100"
              >
                <img
                  src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name)}`}
                  alt={currentUser.name}
                  className="w-4 h-4 rounded-full border border-blue-300"
                  referrerPolicy="no-referrer"
                />
                <span>Můj portál ({currentUser.name})</span>
              </button>

              <button
                id="mega-menu-quick-case"
                type="button"
                onClick={() => {
                  onNavigate('/muj-pripad');
                  onClose();
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100"
              >
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span>Můj případ</span>
              </button>

              {canAccessAdmin && (
                <button
                  id="mega-menu-quick-admin"
                  type="button"
                  onClick={() => {
                    onNavigate('/administrace');
                    onClose();
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span>Administrace CMS</span>
                </button>
              )}

              <button
                id="mega-menu-quick-logout"
                type="button"
                onClick={() => {
                  logout();
                  onNavigate('/login');
                  onClose();
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Odhlásit se</span>
              </button>
            </>
          ) : (
            <>
              <button
                id="mega-menu-quick-login"
                type="button"
                onClick={() => {
                  onNavigate('/login');
                  onClose();
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span>Přihlásit se</span>
              </button>

              <button
                id="mega-menu-quick-register"
                type="button"
                onClick={() => {
                  onNavigate('/registrace');
                  onClose();
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer bg-blue-800 text-white hover:bg-blue-900"
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-200" />
                <span>Registrace</span>
              </button>
            </>
          )}
        </div>

        {/* Grid layout with Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
          {parentCategories.map((cat) => {
            const children = childItemsMap[cat.id] || [];
            return (
              <div
                key={cat.id}
                id={`mega-menu-cat-${cat.id}`}
                className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="font-extrabold text-xs text-slate-900 border-b border-slate-200 pb-2 mb-2 flex items-center justify-between">
                    <span>{cat.labelKey}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    {children.map((subItem) => {
                      const isSubActive = currentPath === subItem.url;
                      return (
                        <a
                          key={subItem.id}
                          id={`mega-menu-item-${subItem.id}`}
                          href={subItem.url}
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate(subItem.url);
                            onClose();
                          }}
                          className={`text-left px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors flex items-center justify-between ${
                            isSubActive
                              ? 'bg-blue-600 text-white font-bold shadow-2xs'
                              : 'text-slate-700 hover:bg-white hover:text-blue-900'
                          }`}
                        >
                          <span>{subItem.labelKey}</span>
                          {subItem.isExternal && <ExternalLink className="w-3 h-3 opacity-60" />}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default MegaMenu;
