import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useText } from '../context/TextContext';
import { NavItem } from '../types';
import { RegisterModal } from './public/RegisterModal';
import {
  Shield,
  User as UserIcon,
  ChevronDown,
  Check,
  Menu,
  X,
  Compass,
  UserPlus,
  LogIn,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  currentView: 'public' | 'private' | 'admin';
  setCurrentView: (view: 'public' | 'private' | 'admin') => void;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

const FALLBACK_NAV_ITEMS: NavItem[] = [
  { id: 'nav-1', labelKey: 'Domů', url: '/', order: 1, target: '_self', isExternal: false },

  // Parent Category 1: 🚨 Krizová pomoc & Komunita
  { id: 'cat-1', labelKey: '🚨 Krizová pomoc & Komunita', url: '/krizova-pomoc', order: 10, target: '_self', isExternal: false },
  { id: 'sub-1-0', labelKey: 'Rozcestník', url: '/krizova-pomoc', order: 11, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-1', labelKey: 'SOS plán', url: '/sos-plan', order: 12, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-2', labelKey: 'Fórum', url: '/forum', order: 13, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-3', labelKey: 'Příběhy', url: '/pribehy', order: 14, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-4', labelKey: 'Memento', url: '/memento', order: 15, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-5', labelKey: 'Právní poradna', url: '/pravni-poradna', order: 16, target: '_self', isExternal: false, parentId: 'cat-1' },
  { id: 'sub-1-6', labelKey: 'Podpora', url: '/podpora', order: 17, target: '_self', isExternal: false, parentId: 'cat-1' },

  // Parent Category 2: ⚖️ Opatrovnictví & Právo
  { id: 'cat-2', labelKey: '⚖️ Opatrovnictví & Právo', url: '/agenda', order: 20, target: '_self', isExternal: false },
  { id: 'sub-2-1', labelKey: 'Agenda', url: '/agenda', order: 21, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-2', labelKey: 'Práva', url: '/prava', order: 22, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-3', labelKey: 'Judikatura', url: '/judikatura', order: 23, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-4', labelKey: 'Dokumenty', url: '/dokumenty', order: 24, target: '_self', isExternal: false, parentId: 'cat-2' },
  { id: 'sub-2-5', labelKey: 'Články', url: '/clanky', order: 25, target: '_self', isExternal: false, parentId: 'cat-2' },

  // Parent Category 3: 🏛️ Státní data & Projekt
  { id: 'cat-3', labelKey: '🏛️ Státní data & Projekt', url: '#', order: 30, target: '_self', isExternal: false },
  { id: 'sub-3-1', labelKey: 'e-Sbírka', url: '/state-laws', order: 31, target: '_self', isExternal: false, parentId: 'cat-3' },
  { id: 'sub-3-2', labelKey: 'Statistiky', url: '/state-statistics', order: 32, target: '_self', isExternal: false, parentId: 'cat-3' },
  { id: 'sub-3-3', labelKey: 'Databáze', url: '/pripadova-databaze', order: 33, target: '_self', isExternal: false, parentId: 'cat-3' },
  { id: 'sub-3-4', labelKey: '🤝 Partneři a sponzoři', url: '/sponzori', order: 34, target: '_self', isExternal: false, parentId: 'cat-3' },

  // Parent Category 4: 🎓 Akademie
  { id: 'cat-4', labelKey: '🎓 Akademie', url: '/studia', order: 40, target: '_self', isExternal: false },
  { id: 'sub-4-1', labelKey: 'Studia', url: '/studia', order: 41, target: '_self', isExternal: false, parentId: 'cat-4' },
  { id: 'sub-4-2', labelKey: 'Videotéka', url: '/videoteka', order: 42, target: '_self', isExternal: false, parentId: 'cat-4' },
  { id: 'sub-4-3', labelKey: 'Kvízy', url: '/kvizy', order: 43, target: '_self', isExternal: false, parentId: 'cat-4' },
  { id: 'sub-4-4', labelKey: 'Wiki', url: '/wiki', order: 44, target: '_self', isExternal: false, parentId: 'cat-4' },

  // Parent Category 5: 📂 Pracovna
  { id: 'cat-5', labelKey: '📂 Pracovna', url: '#', order: 50, target: '_self', isExternal: false },
  { id: 'sub-5-1', labelKey: 'Složka', url: '/user-portal', order: 51, target: '_self', isExternal: false, parentId: 'cat-5' },
  { id: 'sub-5-2', labelKey: 'Profil', url: '/profile', order: 52, target: '_self', isExternal: false, parentId: 'cat-5' },
  { id: 'sub-5-3', labelKey: 'CoParent', url: '/coparent-hub', order: 53, target: '_self', isExternal: false, parentId: 'cat-5' },

  // Parent Category 6: 🤖 AI nástroje
  { id: 'cat-6', labelKey: '🤖 AI nástroje', url: '#', order: 60, target: '_self', isExternal: false },
  { id: 'sub-6-1', labelKey: 'AI Asistent & BIFF', url: '/ai-asistent', order: 61, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-2', labelKey: 'AI Průvodce', url: '/ai-pruvodce', order: 62, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-3', labelKey: 'AI Case Manager', url: '/ai-case-manager', order: 63, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-4', labelKey: 'AI Simulátor', url: '/ai-simulator', order: 64, target: '_self', isExternal: false, parentId: 'cat-6' },
  { id: 'sub-6-5', labelKey: 'AI Formuláře', url: '/ai-formulare', order: 65, target: '_self', isExternal: false, parentId: 'cat-6' },

  // Parent Category 7: 🛠️ Systém
  { id: 'cat-7', labelKey: '🛠️ Systém', url: '#', order: 70, target: '_self', isExternal: false },
  { id: 'sub-7-1', labelKey: 'Novinky', url: '/news', order: 71, target: '_self', isExternal: false, parentId: 'cat-7' },
  { id: 'sub-7-2', labelKey: 'Hub', url: '/synthesis-hub', order: 72, target: '_self', isExternal: false, parentId: 'cat-7' },
  { id: 'sub-7-3', labelKey: 'AI admin', url: '/ai-admin', order: 73, target: '_self', isExternal: false, parentId: 'cat-7' },
  { id: 'sub-7-4', labelKey: 'Admin', url: '/admin', order: 74, target: '_self', isExternal: false, parentId: 'cat-7' },
  { id: 'sub-7-5', labelKey: 'Context', url: '/ai-context', order: 75, target: '_self', isExternal: false, parentId: 'cat-7' },
  { id: 'sub-7-6', labelKey: 'Nápověda', url: '/user-manual', order: 76, target: '_self', isExternal: false, parentId: 'cat-7' },
  { id: 'sub-7-7', labelKey: 'Architektura', url: '/sitemap', order: 77, target: '_self', isExternal: false, parentId: 'cat-7' },
];

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  currentPath = '/',
  onNavigate,
}) => {
  const { currentUser, users, switchUser, hasRole, logout } = useAuth();
  const { t } = useText();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>([]);

  const isAdmin = hasRole('ADMIN');
  const effectiveNavItems = navItems && navItems.length > 0 ? navItems : FALLBACK_NAV_ITEMS;

  const allowedNavItems = effectiveNavItems.filter((item) => {
    const isSystemOrAdmin =
      item.id === 'cat-7' ||
      item.parentId === 'cat-7' ||
      item.url === '/admin' ||
      item.url.startsWith('/admin/') ||
      item.url === '/administrace' ||
      item.url.startsWith('/administrace/');
    if (isSystemOrAdmin && !isAdmin) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    fetch('/api/cms/nav')
      .then((res) => res.json())
      .then((data: NavItem[]) => {
        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => (a.order || 0) - (b.order || 0));
          setNavItems(sorted);
        }
      })
      .catch((err) => console.error('Error fetching CMS navigation:', err));
  }, []);

  const handleNavClick = (url: string) => {
    setCurrentView('public');
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(url);
    } else {
      window.history.pushState({}, '', url);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const getLabelForNavKey = (key: string) => {
    const defaultMap: Record<string, string> = {
      'nav.home': 'Domů',
      'nav.about': 'O projektu',
      'nav.situations': 'Životní situace',
      'nav.articles': 'Články & Judikatura',
      'nav.faq': 'Časté dotazy',
      'nav.volunteering': 'Dobrovolnictví',
      'nav.contact': 'Kontakt',
      'nav.legal': 'Právní poradna',
      'nav.modules': 'Moduly',
      'nav.compliance': 'Compliance',
    };
    return t(key, defaultMap[key] || key);
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-surface,#ffffff)] border-b border-[var(--color-border,#e2e8f0)] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer shrink-0"
          onClick={() => handleNavClick('/')}
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--color-primary,#1e3a8a)] flex items-center justify-center text-white shadow-sm font-bold text-xl">
            T
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-[var(--color-heading,#0f172a)] block leading-none">
              TÁTA MÁ PRÁVO
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-[var(--color-secondary,#0284c7)] tracking-wide uppercase">
              Pro nejlepší zájem dítěte
            </span>
          </div>
        </div>

        {/* CMS Dynamic Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-5 text-xs sm:text-sm font-medium">
          {(() => {
            const parentItems = allowedNavItems.filter((item) => !item.parentId);
            const childItemsMap = allowedNavItems.reduce((acc, item) => {
              if (item.parentId) {
                if (!acc[item.parentId]) acc[item.parentId] = [];
                acc[item.parentId].push(item);
              }
              return acc;
            }, {} as Record<string, NavItem[]>);

            return parentItems.map((item) => {
              const children = childItemsMap[item.id] || [];
              const isActive =
                currentView === 'public' &&
                (currentPath === item.url || (item.url !== '/' && currentPath.startsWith(item.url)));

              if (children.length > 0) {
                return (
                  <div key={item.id} className="relative group py-2">
                    <button
                      className={`flex items-center gap-1 transition-all py-1 border-b-2 whitespace-nowrap ${
                        isActive
                          ? 'border-[var(--color-primary,#1e3a8a)] text-[var(--color-primary,#1e3a8a)] font-bold'
                          : 'border-transparent text-[var(--color-text,#1e293b)] hover:text-[var(--color-primary,#1e3a8a)]'
                      }`}
                    >
                      <span>{getLabelForNavKey(item.labelKey)}</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-60 transition-transform group-hover:rotate-180" />
                    </button>
                    <div className="absolute left-0 mt-1 hidden group-hover:block bg-white border border-slate-200 rounded-2xl shadow-xl py-2 min-w-[280px] max-h-[80vh] overflow-y-auto z-50 transition-all duration-200">
                      {children.map((subItem) => {
                        const isSubActive = currentView === 'public' && currentPath === subItem.url;
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => handleNavClick(subItem.url)}
                            className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-colors flex items-center justify-between ${
                              isSubActive
                                ? 'bg-blue-50 text-[var(--color-primary,#1e3a8a)] font-bold'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-[var(--color-primary,#1e3a8a)]'
                            }`}
                          >
                            <span>{getLabelForNavKey(subItem.labelKey)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.url)}
                  className={`transition-all py-1 border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'border-[var(--color-primary,#1e3a8a)] text-[var(--color-primary,#1e3a8a)] font-bold'
                      : 'border-transparent text-[var(--color-text,#1e293b)] hover:text-[var(--color-primary,#1e3a8a)]'
                  }`}
                >
                  {getLabelForNavKey(item.labelKey)}
                </button>
              );
            });
          })()}
        </nav>

        {/* Layer Switcher & User Control */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* MENU Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs shadow-xs cursor-pointer transition-all active:scale-95"
            aria-label="Otevřít hlavním menu"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4 text-red-600" />
            ) : (
              <Menu className="w-4 h-4 text-blue-600" />
            )}
            <span className="tracking-wide uppercase">MENU</span>
          </button>

          {/* View Switcher Buttons */}
          <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => {
                setCurrentView('public');
                handleNavClick(currentPath || '/');
              }}
              className={`px-2.5 py-1 rounded-md transition-all ${
                currentView === 'public'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Veřejnost
            </button>
            <button
              onClick={() => {
                setCurrentView('private');
                if (onNavigate) onNavigate('/portal');
              }}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
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
                onClick={() => setCurrentView('admin')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
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

          {/* Auth Controls */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--color-border,#e2e8f0)] bg-white hover:bg-slate-50 transition-colors text-xs cursor-pointer shadow-2xs"
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
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-bold">
                      Role: {currentUser.role}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      if (onNavigate) onNavigate('/portal');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-700"
                  >
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    <span>Můj účet & Portál</span>
                  </button>

                  {hasRole('ADMIN') && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onNavigate) onNavigate('/administrace');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 font-medium text-amber-700"
                    >
                      <Shield className="w-4 h-4 text-amber-600" />
                      <span>Administrace</span>
                    </button>
                  )}

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                      if (onNavigate) onNavigate('/login');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-rose-50 flex items-center gap-2 font-bold text-rose-600"
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
                onClick={() => {
                  if (onNavigate) onNavigate('/login');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors text-xs font-bold cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span>Přihlásit</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigate) onNavigate('/registrace');
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--color-primary,#1e3a8a)] text-white hover:bg-blue-900 transition-colors text-xs font-bold shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-200" />
                <span>Registrace</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Portal Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="bg-white border-b border-slate-200 px-4 pt-4 pb-6 shadow-2xl animate-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span>HLAVNÍ MENU PORTÁLU (33 MODULŮ V 7 KATEGORIÍCH)</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Zavřít menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Domů Button */}
            <div>
              <button
                onClick={() => {
                  handleNavClick('/');
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                  currentView === 'public' && currentPath === '/'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span>🏠</span>
                <span>Domů</span>
              </button>
            </div>

            {/* Grid container with 7 categories */}
            {(() => {
              const parentCategories = allowedNavItems.filter(
                (item) => item.parentId === undefined && item.id !== 'nav-1'
              );
              const childItemsMap = allowedNavItems.reduce((acc, item) => {
                if (item.parentId) {
                  if (!acc[item.parentId]) acc[item.parentId] = [];
                  acc[item.parentId].push(item);
                }
                return acc;
              }, {} as Record<string, NavItem[]>);

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
                  {parentCategories.map((cat) => {
                    const children = childItemsMap[cat.id] || [];
                    return (
                      <div
                        key={cat.id}
                        className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3 shadow-2xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="font-extrabold text-xs text-slate-900 border-b border-slate-200 pb-2 mb-2 flex items-center gap-1.5">
                            <span>{getLabelForNavKey(cat.labelKey)}</span>
                          </div>
                          <div className="flex flex-col space-y-1">
                            {children.map((subItem) => {
                              const isSubActive =
                                currentView === 'public' && currentPath === subItem.url;
                              return (
                                <button
                                  key={subItem.id}
                                  onClick={() => {
                                    handleNavClick(subItem.url);
                                    setMobileMenuOpen(false);
                                  }}
                                  className={`text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                                    isSubActive
                                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                      : 'text-slate-700 hover:bg-white hover:text-blue-900'
                                  }`}
                                >
                                  {getLabelForNavKey(subItem.labelKey)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Mobile Layer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Přepnout sekci:</span>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setCurrentView('public');
                  setMobileMenuOpen(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  currentView === 'public' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Veřejnost
              </button>
              <button
                onClick={() => {
                  setCurrentView('private');
                  setMobileMenuOpen(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  currentView === 'private' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Můj Účet
              </button>
              {hasRole('ADMIN') && (
                <button
                  onClick={() => {
                    setCurrentView('admin');
                    setMobileMenuOpen(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    currentView === 'admin' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  CMS
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Register Wizard Modal */}
      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSuccess={() => {
          setCurrentView('private');
          if (onNavigate) onNavigate('/portal/profil');
        }}
        onNavigateToDoc={(path) => {
          setRegisterModalOpen(false);
          setCurrentView('public');
          if (onNavigate) onNavigate(path);
        }}
      />
    </header>
  );
};
