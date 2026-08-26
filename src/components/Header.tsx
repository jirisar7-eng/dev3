import { apiFetch } from '../utils/apiClient';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useText } from '../context/TextContext';
import { NavItem } from '../types';
import { NAVIGATION_ITEMS, getVisibleNavItems, deduplicateNavItems, normalizeNavUrl } from '../config/navigation';
import { RegisterModal } from './public/RegisterModal';
import { Logo } from './common/Logo';
import { MegaMenu } from './layout/MegaMenu';
import {
  Shield,
  User as UserIcon,
  ChevronDown,
  Menu,
  X,
  UserPlus,
  LogIn,
  LogOut,
  Briefcase,
  Globe,
  Users,
} from 'lucide-react';

interface HeaderProps {
  currentView: 'public' | 'private' | 'team' | 'admin';
  setCurrentView: (view: 'public' | 'private' | 'team' | 'admin') => void;
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
  const { currentUser, switchUser, hasRole, logout } = useAuth();
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
      
      const isHeaderClick = target.closest('header');
      const isUserDropdownClick = target.closest('.user-dropdown-container');

      if (mobileMenuOpen && !isHeaderClick) {
        setMobileMenuOpen(false);
      }
      
      if (userDropdownOpen && !isUserDropdownClick) {
        setUserDropdownOpen(false);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [mobileMenuOpen, userDropdownOpen]);

  const isAuthorizedAdmin =
    hasRole('ADMIN') ||
    hasRole('SUPER_ADMIN') ||
    hasRole('SYSTEM_ADMIN');

  const isAuthorizedTeam =
    hasRole('VOLUNTEER') ||
    hasRole('VERIFIED_CONTRIBUTOR') ||
    hasRole('MODERATOR') ||
    hasRole('LEGAL_EDITOR') ||
    hasRole('CONTENT_MANAGER') ||
    hasRole('ADMIN') ||
    hasRole('SUPER_ADMIN') ||
    hasRole('SYSTEM_ADMIN');

  const effectiveNavItems = useMemo(() => {
    const raw = navItems && navItems.length > 0 ? navItems : FALLBACK_NAV_ITEMS;
    return deduplicateNavItems(raw);
  }, [navItems]);

  const allowedNavItems = useMemo(() => {
    return getVisibleNavItems(effectiveNavItems, {
      isAuthenticated: !!currentUser,
      role: currentUser?.role || null,
    });
  }, [effectiveNavItems, currentUser]);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/cms/nav').then((res) => (res.ok ? res.json() : [])).catch(() => []),
      apiFetch('/api/custom-modules?all=false').then((res) => (res.ok ? res.json() : [])).catch(() => []),
    ]).then(([navData, customMods]: [NavItem[], any[]]) => {
      // 1. Authoritative canonical source of truth for navigation structure
      let baseNav = deduplicateNavItems([...FALLBACK_NAV_ITEMS]);

      // 2. If custom DB nav items exist, only add non-duplicate custom items
      if (Array.isArray(navData) && navData.length > 0) {
        const canonicalUrls = new Set(baseNav.map((n) => normalizeNavUrl(n.url)));
        const canonicalIds = new Set(baseNav.map((n) => n.id));

        navData.forEach((dbItem) => {
          const normUrl = normalizeNavUrl(dbItem.url);
          // Only append if it's not already covered by canonical ID or canonical URL
          if (!canonicalIds.has(dbItem.id) && !canonicalUrls.has(normUrl)) {
            baseNav.push({ ...dbItem, url: normUrl });
            canonicalIds.add(dbItem.id);
            canonicalUrls.add(normUrl);
          }
        });
      }

      // 3. Add active custom modules if not already present
      if (Array.isArray(customMods) && customMods.length > 0) {
        const menuMods = customMods.filter((m) => m.isActive && m.showInMenu);
        menuMods.forEach((m, idx) => {
          const modUrl = normalizeNavUrl(`/${m.slug}`);
          const modId = `custom-mod-${m.id}`;
          if (!baseNav.some((n) => normalizeNavUrl(n.url) === modUrl || n.id === modId)) {
            baseNav.push({
              id: modId,
              labelKey: m.title,
              url: modUrl,
              order: 18 + idx,
              target: '_self',
              isExternal: false,
              parentId: 'cat-1',
            });
          }
        });
      }

      // 4. Final deduplication pass & sort
      const finalNav = deduplicateNavItems(baseNav).sort((a, b) => (a.order || 0) - (b.order || 0));
      setNavItems(finalNav);
    });
  }, []);

  const handleNavClick = (url: string) => {
    if (url === '/logout') {
      logout();
      if (onNavigate) {
        onNavigate('/');
      } else {
        window.location.href = '/';
      }
      return;
    }
    if (url === '/verejny-portal') {
      url = '/';
    }
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

    updateDimensions();

    const observer = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, [allowedNavItems]);

  // 4. Decision logic
  const isSpaceSufficient =
    dimensions.containerWidth > 0 &&
    dimensions.containerWidth >= dimensions.logoWidth + dimensions.navWidth + dimensions.rightWidth + 48;

  const showDesktopNav =
    capabilities.hasHover &&
    capabilities.isPointerFine &&
    isSpaceSufficient;

  // 5. Render helper for navigation items
  const renderNavigation = (isMeasuring = false) => {
    const parentItems = allowedNavItems.filter((item) => !item.parentId && item.id !== 'nav-1');
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
          <div key={item.id} id={`nav-desktop-cat-${item.id}`} className="relative group py-2">
            <button
              id={`nav-desktop-btn-${item.id}`}
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
                    id={`nav-desktop-sub-${subItem.id}`}
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
          id={`nav-desktop-link-${item.id}`}
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
    <header id="main-app-header" className="sticky top-0 z-40 bg-[var(--color-surface,#ffffff)] border-b border-[var(--color-border,#e2e8f0)] shadow-xs">
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
          <nav id="header-desktop-nav" className="flex items-center gap-5 text-xs sm:text-sm font-medium">
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
          {dimensions.containerWidth > 0 && dimensions.containerWidth < 640 ? (
            <>
              {/* COMPACT ICON NAVIGATION FOR MOBILE PORTRAIT */}
              
              {/* 1. MENU Button (Priority 1) */}
              <button
                id="header-mobile-menu-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                className="flex items-center justify-center w-11 h-11 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 shadow-xs cursor-pointer transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Otevřít hlavní menu"
                aria-expanded={mobileMenuOpen}
                title="MENU"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-red-600" />
                ) : (
                  <Menu className="w-5 h-5 text-blue-600" />
                )}
              </button>

              {/* 2. AUTHENTICATED: Avatar & Profile Menu */}
              {currentUser ? (
                <div className="relative user-dropdown-container">
                  <button
                    id="header-mobile-user-menu-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserDropdownOpen(!userDropdownOpen);
                    }}
                    className="flex items-center justify-center w-11 h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-xs cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Uživatelské menu"
                    aria-expanded={userDropdownOpen}
                    title={currentUser.name}
                  >
                    <img
                      src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name)}`}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-full border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                  {userDropdownOpen && (
                    <div id="header-mobile-user-dropdown" className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <span className="font-bold text-slate-900 block truncate">{currentUser.name}</span>
                        <span className="text-slate-500 text-[11px] block truncate">{currentUser.email}</span>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-bold">
                          Role: {currentUser.role}
                        </span>
                      </div>
                      <button
                        id="header-mobile-user-link-case"
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onNavigate) onNavigate('/muj-pripad');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-800 cursor-pointer"
                      >
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <span>Osobní spis / Můj případ</span>
                      </button>
                      <button
                        id="header-mobile-user-link-profile"
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onNavigate) onNavigate('/portal/profil');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-800 cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-slate-600" />
                        <span>Můj profil</span>
                      </button>
                      {isAuthorizedTeam && (
                        <button
                          id="header-mobile-user-link-team"
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            if (onNavigate) onNavigate('/team');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-blue-700 cursor-pointer"
                        >
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>Team Center (Spolek)</span>
                        </button>
                      )}
                      {isAuthorizedAdmin && (
                        <button
                          id="header-mobile-user-link-admin"
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            if (onNavigate) onNavigate('/administrace');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-amber-700 cursor-pointer"
                        >
                          <Shield className="w-4 h-4 text-amber-600" />
                          <span>Administrace</span>
                        </button>
                      )}
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        id="header-mobile-user-link-logout"
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
                /* UNATHENTICATED: Login & Register only */
                <>
                  {dimensions.containerWidth >= 280 && (
                    <button
                      id="header-mobile-login-btn"
                      type="button"
                      onClick={() => {
                        if (onNavigate) onNavigate('/login');
                      }}
                      className="flex items-center justify-center w-11 h-11 rounded-xl border border-slate-300 text-blue-700 bg-blue-50 hover:bg-blue-100 shadow-xs cursor-pointer transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Přihlásit se"
                      title="Přihlásit"
                    >
                      <LogIn className="w-5 h-5" />
                    </button>
                  )}
                  {dimensions.containerWidth >= 380 && (
                    <button
                      id="header-mobile-register-btn"
                      type="button"
                      onClick={() => {
                        if (onNavigate) onNavigate('/registrace');
                      }}
                      className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-800 text-white hover:bg-blue-950 shadow-xs cursor-pointer transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Registrace"
                      title="Registrace"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}

              {/* 3. VEŘEJNOST (Priority 3/4) */}
              {dimensions.containerWidth >= 440 && (
                <button
                  id="header-mobile-public-btn"
                  type="button"
                  onClick={() => {
                    setCurrentView('public');
                    handleNavClick('/');
                  }}
                  className={`flex items-center justify-center w-11 h-11 rounded-xl border shadow-xs cursor-pointer transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    currentView === 'public'
                      ? 'bg-blue-800 text-white border-blue-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                  aria-label="Veřejnost"
                  title="Veřejnost"
                >
                  <Globe className="w-5 h-5" />
                </button>
              )}
            </>
          ) : (
            <>
              {/* ORIGINAL STANDARD/DESKTOP CONTROLS */}
              {/* MENU Button */}
              <button
                id="header-desktop-menu-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs shadow-xs cursor-pointer transition-all active:scale-95"
                aria-label="Otevřít hlavní menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-4 h-4 text-red-600" />
                ) : (
                  <Menu className="w-4 h-4 text-blue-600" />
                )}
                <span className="tracking-wide uppercase">MENU</span>
              </button>

              {/* View Switcher Buttons (only for authenticated users or when useful) */}
              {currentUser && (
                <div id="header-desktop-layer-switcher" className="hidden sm:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
                  <button
                    id="header-layer-public-btn"
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
                    id="header-layer-private-btn"
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
                    <span>Můj Portál</span>
                  </button>
                  {isAuthorizedTeam && (
                    <button
                      id="header-layer-team-btn"
                      type="button"
                      onClick={() => {
                        setCurrentView('team');
                        if (onNavigate) onNavigate('/team');
                      }}
                      className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                        currentView === 'team'
                          ? 'bg-blue-800 text-white font-semibold shadow-xs'
                          : 'text-blue-700 hover:bg-blue-50'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Team</span>
                    </button>
                  )}
                  {isAuthorizedAdmin && (
                    <button
                      id="header-layer-admin-btn"
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
                <div className="relative user-dropdown-container">
                  <button
                    id="header-user-dropdown-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserDropdownOpen(!userDropdownOpen);
                    }}
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
                    <div id="header-user-dropdown-menu" className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <span className="font-bold text-slate-900 block truncate">{currentUser.name}</span>
                        <span className="text-slate-500 text-[11px] block truncate">{currentUser.email}</span>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-bold">
                          Role: {currentUser.role}
                        </span>
                      </div>

                      <button
                        id="header-user-dropdown-case"
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onNavigate) onNavigate('/muj-pripad');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-800 cursor-pointer"
                      >
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <span>Osobní spis / Můj případ</span>
                      </button>

                      <button
                        id="header-user-dropdown-profile"
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onNavigate) onNavigate('/portal/profil');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-800 cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-slate-600" />
                        <span>Můj profil (správa účtu)</span>
                      </button>

                      {isAuthorizedTeam && (
                        <button
                          id="header-user-dropdown-team"
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            if (onNavigate) onNavigate('/team');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-blue-700 cursor-pointer"
                        >
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>Team Center (Spolek)</span>
                        </button>
                      )}

                      {isAuthorizedAdmin && (
                        <button
                          id="header-user-dropdown-admin"
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
                        id="header-user-dropdown-logout"
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
                <div id="header-auth-buttons" className="flex items-center gap-2">
                  <button
                    id="header-login-btn"
                    type="button"
                    onClick={() => {
                      if (onNavigate) onNavigate('/login');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors text-xs font-bold cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-blue-600" />
                    <span>Přihlásit</span>
                  </button>

                  <button
                    id="header-register-btn"
                    type="button"
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
            </>
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
        items={effectiveNavItems}
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
export default Header;
