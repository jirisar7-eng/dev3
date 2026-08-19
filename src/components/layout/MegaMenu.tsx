import React from 'react';
import { NavItem } from '../../types';
import { NAVIGATION_ITEMS } from '../../config/navigation';
import { Compass, X, ExternalLink } from 'lucide-react';

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
  isSuperAdmin = false,
  items = NAVIGATION_ITEMS,
}) => {
  if (!isOpen) return null;

  const allowedNavItems = items.filter((item) => {
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
    <div className="absolute top-16 left-0 right-0 w-full bg-white border-b border-slate-200 px-4 pt-4 pb-6 shadow-2xl animate-in slide-in-from-top-2 duration-200 max-h-[85vh] overflow-y-auto z-50">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" />
            <span>HLAVNÍ ROZCESTNÍK PORTÁLU (7 KATEGORIÍ)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
            aria-label="Zavřít menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick link: Home */}
        <div>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
              onClose();
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all inline-flex items-center gap-2 cursor-pointer ${
              currentPath === '/'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100'
            }`}
          >
            <span>🏠</span>
            <span>Domů</span>
          </a>
        </div>

        {/* Grid layout with 7 Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
          {parentCategories.map((cat) => {
            const children = childItemsMap[cat.id] || [];
            return (
              <div
                key={cat.id}
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
