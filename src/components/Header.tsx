import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useText } from '../context/TextContext';
import { NavItem } from '../types';
import { NAVIGATION_ITEMS } from '../config/navigation';
import { RegisterModal } from './public/RegisterModal';
import { Logo } from './common/Logo';
import { MegaMenu } from './layout/MegaMenu';
import {
  Shield,
  User as UserIcon,
  ChevronDown,
  Check,
  Menu,
  X,
  UserPlus,
  LogIn,
  LogOut,
  Briefcase,
} from 'lucide-react';

interface HeaderProps {
  currentView: 'public' | 'private' | 'admin';
  setCurrentView: (view: 'public' | 'private' | 'admin') => void;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

const FALLBACK_NAV_ITEMS: NavItem[] = NAVIGATION_ITEMS;

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
  const [openDesktopDropdown, setOpenDesktopDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      setOpenDesktopDropdown(null);
      const target = e.target as HTMLElement;
      if (mobileMenuOpen && !target.closest('header')) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [mobileMenuOpen]);

  const isAuthorizedAdmin =
    hasRole('ADMIN') ||
    hasRole('SUPER_ADMIN') ||
    hasRole('SYSTEM_ADMIN') ||
    hasRole('MODERATOR') ||
    hasRole('LEGAL_EDITOR') ||
    hasRole('CONTENT_MANAGER');
  const isSuperAdmin = hasRole('SUPER_ADMIN') || hasRole('SYSTEM_ADMIN') || hasRole('ADMIN');

  const effectiveNavItems = navItems && navItems.length > 0 ? navItems : FALLBACK_NAV_ITEMS;

  const allowedNavItems = effectiveNavItems.filter((item) => {
    const isCategory7 = item.id === 'cat-7' || item.parentId === 'cat-7';
    const isAdminRoute =
      item.url === '/admin' ||
      item.url.startsWith('/admin/') ||
      item.url === '/administrace' ||
      item.url.startsWith('/administrace/') ||
      item.url === '/ai-admin' ||
      item.url === '/ai-context';

    if ((isCategory7 || isAdminRoute) && !isAuthorizedAdmin) {
      return false;
    }
    if (item.url === '/admin/vps' && !isSuperAdmin) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/cms/nav').then((res) => (res.ok ? res.json() : [])).catch(() => []),
      fetch('/api/custom-modules?all=false').then((res) => (res.ok ? res.json() : [])).catch(() => []),
    ]).then(([navData, customMods]: [NavItem[], any[]]) => {
      let baseNav = Array.isArray(navData) && navData.length > 0 ? [...navData] : [...FALLBACK_NAV_ITEMS];

      if (Array.isArray(customMods) && customMods.length > 0) {
        const menuMods = customMods.filter((m) => m.isActive && m.showInMenu);
        menuMods.forEach((m, idx) => {
          const modNavItem: NavItem = {
            id: `custom-mod-${m.id}`,
            labelKey: m.title,
            url: `/${m.slug}`,
            order: 18 + idx,
            target: '_self',
            isExternal: false,
            parentId: 'cat-1',
          };
          if (!baseNav.some((n) => n.url === `/${m.slug}`)) {
            baseNav.push(modNavItem);
          }
        });
      }

      const sorted = baseNav.sort((a, b) => (a.order || 0) - (b.order || 0));
      setNavItems(sorted);
    });
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

  // 1. Media query capability listeners
  const getMediaCapabilities = () => {
    if (typeof window === 'undefined') return { hasHover: true, isPointerFine: true };
    const hasHover = window.matchMedia('(hover: hover)').matches;
    const isPointerFine = window.matchMedia('(pointer: fine)').matches;
    return { hasHover, isPointerFine };
  };

  const [capabilities, setCapabilities] = useState(() => getMediaCapabilities());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hoverQuery = window.matchMedia('(hover: hover)');
    const pointerQuery = window.matchMedia('(pointer: fine)');

    const onChange = () => {
      setCapabilities({
        hasHover: hoverQuery.matches,
        isPointerFine: pointerQuery.matches,
      });
    };

    if (hoverQuery.addEventListener) {
      hoverQuery.addEventListener('change', onChange);
      pointerQuery.addEventListener('change', onChange);
    } else {
      hoverQuery.addListener(onChange);
      pointerQuery.addListener(onChange);
    }

    return () => {
      if (hoverQuery.removeEventListener) {
        hoverQuery.removeEventListener('change', onChange);
        pointerQuery.removeEventListener('change', onChange);
      } else {
        hoverQuery.removeListener(onChange);
        pointerQuery.removeListener(onChange);
      }
    };
  }, []);

  // 2. Refs for layout elements
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const navMeasureRef = useRef<HTMLElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  // 3. Dimensions tracking state
  const [dimensions, setDimensions] = useState({
    containerWidth: 0,
    logoWidth: 0,
    navWidth: 0,
    rightWidth: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDimensions = () => {
      setDimensions({
        containerWidth: containerRef.current?.getBoundingClientRect().width || 0,
        logoWidth: logoRef.current?.getBoundingClientRect().width || 0,
        navWidth: navMeasureRef.current?.getBoundingClientRect().width || 0,
        rightWidth: rightRef.current?.getBoundingClientRect().width || 0,
      });
    };

    // Initial measurement
    updateDimensions();

    // ResizeObserver to detect change in container size
    const observer = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Additional event listeners
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, [allowedNavItems]); // update whenever allowedNavItems changes

  // 4. Decision logic
  const isSpaceSufficient =
    dimensions.containerWidth > 0 &&
    dimensions.containerWidth >= dimensions.logoWidth + dimensions.navWidth + dimensions.rightWidth + 48; // 48px safety gap margin

  const showDesktopNav =
    capabilities.hasHover &&
    capabilities.isPointerFine &&
    isSpaceSufficient;

  // 5. Render helper for navigation items to avoid duplication
  const renderNavigation = (isMeasuring = false) => {
    const parentItems = allowedNavItems.filter((item) => !item.parentId);
    const childItemsMap = allowedNavItems.reduce((acc, item) => {
      if (item.parentId) {
        if (!acc[item.parentId]) acc[item.parentId] = [];
        acc[item.parentId].push(item);
      }
      return acc;
    }, {} as Record<string, NavItem[]>);

    return parentItems.map((item, idx) => {
      const children = childItemsMap[item.id] || [];
      const isActive =
        currentView === 'public' &&
        (currentPath === item.url || (item.url !== '/' && currentPath.startsWith(item.url)));

      const isRightAligned = idx >= parentItems.length - 2;

      if (children.length > 0) {
        const isDropdownOpen = !isMeasuring && openDesktopDropdown === item.id;
        return (
          <div key={item.id} className="relative group py-2">
            <button
              type="button"
              onClick={isMeasuring ? undefined : (e) => {
                e.stopPropagation();
                setOpenDesktopDropdown(isDropdownOpen ? null : item.id);
              }}
              className={`flex items-center gap-1 transition-all py-1 border-b-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-[var(--color-primary,#1e3a8a)] text-[var(--color-primary,#1e3a8a)] font-bold'
                  : 'border-transparent text-[var(--color-text,#1e293b)] hover:text-[var(--color-primary,#1e3a8a)]'
              }`}
            >
              <span>{getLabelForNavKey(item.labelKey)}</span>
              <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${isDropdownOpen ? 'rotate-180' : 'group-hover:rotate-180'}`} />
            </button>
            <div className={`absolute mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 min-w-[280px] max-h-[80vh] overflow-y-auto z-50 transition-all duration-200 ${isRightAligned ? 'right-0' : 'left-0'} ${
              isDropdownOpen ? 'block' : 'hidden group-hover:block'
            }`}>
              {children.map((subItem) => {
                const isSubActive = currentView === 'public' && currentPath === subItem.url;
                return (
                  <button
                    key={subItem.id}
                    type="button"
                    onClick={isMeasuring ? undefined : () => {
                      handleNavClick(subItem.url);
                      setOpenDesktopDropdown(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-colors flex items-center justify-between cursor-pointer ${
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
          type="button"
          onClick={isMeasuring ? undefined : () => handleNavClick(item.url)}
          className={`transition-all py-1 border-b-2 whitespace-nowrap cursor-pointer ${
            isActive
              ? 'border-[var(--color-primary,#1e3a8a)] text-[var(--color-primary,#1e3a8a)] font-bold'
              : 'border-transparent text-[var(--color-text,#1e293b)] hover:text-[var(--color-primary,#1e3a8a)]'
          }`}
        >
          {getLabelForNavKey(item.labelKey)}
        </button>
      );
    });
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-surface,#ffffff)] border-b border-[var(--color-border,#e2e8f0)] shadow-xs">
      <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div ref={logoRef} className="shrink-0 flex items-center">
          <Logo
            variant="full"
            size="md"
            className="cursor-pointer"
            onClick={() => handleNavClick('/')}
          />
        </div>

        {/* CMS Dynamic Navigation Links (Desktop) */}
        {showDesktopNav && (
          <nav className="flex items-center gap-5 text-xs sm:text-sm font-medium">
            {renderNavigation(false)}
          </nav>
        )}

        {/* Hidden measuring wrapper to compute exact dynamic navigation width without displaying it */}
        <div className="absolute pointer-events-none invisible left-[-9999px] top-[-9999px] flex whitespace-nowrap">
          <nav ref={navMeasureRef} className="flex items-center gap-5 text-xs sm:text-sm font-medium">
            {renderNavigation(true)}
          </nav>
        </div>

        {/* Layer Switcher & User Control */}
        <div ref={rightRef} className="flex items-center gap-2 sm:gap-3 shrink-0">
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
                      if (onNavigate) onNavigate('/muj-pripad');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-800"
                  >
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span>Osobní spis / Můj případ</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      if (onNavigate) onNavigate('/portal/profil');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-800"
                  >
                    <UserIcon className="w-4 h-4 text-slate-600" />
                    <span>Můj profil (správa účtu)</span>
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

      {/* Dynamic Portal Navigation MegaMenu Overlay */}
      <MegaMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentPath={currentPath}
        onNavigate={handleNavClick}
        isAuthorizedAdmin={isAuthorizedAdmin}
        isSuperAdmin={isSuperAdmin}
        items={allowedNavItems}
      />
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
