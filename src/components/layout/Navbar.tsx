import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavItem } from '../../types';
import { NAVIGATION_ITEMS } from '../../config/navigation';
import { Logo } from '../common/Logo';
import { MegaMenu } from './MegaMenu';
import { RegisterModal } from '../public/RegisterModal';
import {
  Shield,
  User as UserIcon,
  ChevronDown,
  Menu,
  X,
  UserPlus,
  LogIn,
  LogOut,
} from 'lucide-react';

interface NavbarProps {
  currentView?: 'public' | 'private' | 'admin';
  setCurrentView?: (view: 'public' | 'private' | 'admin') => void;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onLoginClick?: () => void;
  user?: any;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView = 'public',
  setCurrentView,
  currentPath = '/',
  onNavigate,
  onLoginClick,
}) => {
  const { currentUser, hasRole, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const isAuthorizedAdmin =
    hasRole('ADMIN') ||
    hasRole('SUPER_ADMIN') ||
    hasRole('SYSTEM_ADMIN') ||
    hasRole('MODERATOR') ||
    hasRole('LEGAL_EDITOR') ||
    hasRole('CONTENT_MANAGER');
  const isSuperAdmin = hasRole('SUPER_ADMIN') || hasRole('SYSTEM_ADMIN') || hasRole('ADMIN');

  const handleNavClick = (url: string) => {
    if (setCurrentView) setCurrentView('public');
    setMenuOpen(false);
    if (onNavigate) {
      onNavigate(url);
    } else {
      window.history.pushState({}, '', url);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const allowedNavItems = NAVIGATION_ITEMS.filter((item) => {
    const isCategory7 = item.id === 'cat-7' || item.parentId === 'cat-7';
    const isAdminRoute =
      item.url === '/admin' ||
      item.url.startsWith('/admin/') ||
      item.url === '/administrace' ||
      item.url === '/ai-admin';

    if ((isCategory7 || isAdminRoute) && !isAuthorizedAdmin) {
      return false;
    }
    if (item.url === '/admin/vps' && !isSuperAdmin) {
      return false;
    }
    return true;
  });

  const parentCategories = allowedNavItems.filter((item) => !item.parentId && item.id !== 'nav-1');
  const childItemsMap = allowedNavItems.reduce((acc, item) => {
    if (item.parentId) {
      if (!acc[item.parentId]) acc[item.parentId] = [];
      acc[item.parentId].push(item);
    }
    return acc;
  }, {} as Record<string, NavItem[]>);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Logo
          variant="full"
          size="md"
          className="shrink-0 cursor-pointer"
          onClick={() => handleNavClick('/')}
        />

        {/* Top Hover Menu items for desktop */}
        <nav className="hidden lg:flex items-center gap-4 text-xs font-semibold">
          {parentCategories.map((cat, idx) => {
            const children = childItemsMap[cat.id] || [];
            const isRightAligned = idx >= parentCategories.length - 2;

            if (children.length > 0) {
              return (
                <div key={cat.id} className="relative group py-2">
                  <button
                    type="button"
                    className="flex items-center gap-1 py-1 border-b-2 border-transparent text-slate-800 hover:text-blue-900 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <span>{cat.labelKey}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60 transition-transform group-hover:rotate-180" />
                  </button>
                  <div
                    className={`absolute mt-1 hidden group-hover:block bg-white border border-slate-200 rounded-2xl shadow-xl py-2 min-w-[240px] z-50 transition-all ${
                      isRightAligned ? 'right-0' : 'left-0'
                    }`}
                  >
                    {children.map((subItem) => (
                      <button
                        key={subItem.id}
                        type="button"
                        onClick={() => handleNavClick(subItem.url)}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-900 transition-colors cursor-pointer"
                      >
                        {subItem.labelKey}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleNavClick(cat.url)}
                className="py-1 text-slate-800 hover:text-blue-900 font-semibold cursor-pointer whitespace-nowrap"
              >
                {cat.labelKey}
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* MENU Toggle Button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs shadow-xs cursor-pointer transition-all active:scale-95"
            aria-label="Otevřít hlavní menu"
          >
            {menuOpen ? (
              <X className="w-4 h-4 text-rose-600" />
            ) : (
              <Menu className="w-4 h-4 text-blue-600" />
            )}
            <span className="tracking-wide uppercase">MENU</span>
          </button>

          {/* Layer Switcher Buttons */}
          {setCurrentView && (
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setCurrentView('public');
                  handleNavClick(currentPath || '/');
                }}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  currentView === 'public'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Veřejnost
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentView('private');
                  if (onNavigate) onNavigate('/portal');
                }}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  currentView === 'private'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Můj Účet</span>
              </button>
              {hasRole('ADMIN') && (
                <button
                  type="button"
                  onClick={() => setCurrentView('admin')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    currentView === 'admin'
                      ? 'bg-amber-500 text-white font-semibold shadow-xs'
                      : 'text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>CMS</span>
                </button>
              )}
            </div>
          )}

          {/* Auth Controls */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs cursor-pointer shadow-2xs"
              >
                <img
                  src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name)}`}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full border border-slate-200"
                />
                <div className="text-left hidden md:block">
                  <span className="font-bold text-slate-900 block leading-tight truncate max-w-[110px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[9px] text-blue-700 font-extrabold uppercase">{currentUser.role}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900 block truncate">{currentUser.name}</span>
                    <span className="text-slate-500 text-[11px] block truncate">{currentUser.email}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      if (onNavigate) onNavigate('/portal');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-700 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    <span>Můj účet & Portál</span>
                  </button>

                  {hasRole('ADMIN') && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onNavigate) onNavigate('/administrace');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 font-medium text-amber-700 cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-amber-600" />
                      <span>Administrace</span>
                    </button>
                  )}

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                      if (onNavigate) onNavigate('/login');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-rose-50 flex items-center gap-2 font-bold text-rose-600 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Odhlásit se</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onLoginClick) onLoginClick();
                  else if (onNavigate) onNavigate('/login');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors text-xs font-bold cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span>Přihlásit</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onNavigate) onNavigate('/registrace');
                  else setRegisterModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-900 text-white hover:bg-blue-800 transition-colors text-xs font-bold shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-200" />
                <span>Registrace</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MegaMenu Drawer Overlay */}
      <MegaMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        currentPath={currentPath}
        onNavigate={handleNavClick}
        isAuthorizedAdmin={isAuthorizedAdmin}
        isSuperAdmin={isSuperAdmin}
        items={NAVIGATION_ITEMS}
      />

      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSuccess={() => {
          if (setCurrentView) setCurrentView('private');
          if (onNavigate) onNavigate('/portal/profil');
        }}
        onNavigateToDoc={(path) => {
          setRegisterModalOpen(false);
          if (setCurrentView) setCurrentView('public');
          if (onNavigate) onNavigate(path);
        }}
      />
    </header>
  );
};

export default Navbar;
