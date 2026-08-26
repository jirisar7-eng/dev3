import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import {
  AdminTabId,
  AdminNavSection,
  AdminNavItem,
  getVisibleAdminSections,
  findSectionByTabId,
} from '../../../config/adminNavigation';
import { useAuth } from '../../../context/AuthContext';

interface AdminSidebarProps {
  activeTab: AdminTabId;
  onSelectTab: (tabId: AdminTabId, path?: string) => void;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  onCloseMobile,
}) => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Find the active section based on current tab
  const initialActiveSection = findSectionByTabId(activeTab) || 'sec-overview';
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    [initialActiveSection]: true,
    'sec-overview': true,
    'sec-cms': true,
  });

  const visibleSections = useMemo(() => {
    return getVisibleAdminSections(currentUser?.role);
  }, [currentUser?.role]);

  // Handle Search Filtering
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase().trim();
    const results: { sectionTitle: string; sectionEmoji: string; item: AdminNavItem }[] = [];

    for (const section of visibleSections) {
      for (const item of section.items) {
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesSubtitle = item.subtitle?.toLowerCase().includes(query) || false;
        const matchesKeywords = item.keywords.some((kw) => kw.toLowerCase().includes(query));

        if (matchesTitle || matchesSubtitle || matchesKeywords) {
          results.push({
            sectionTitle: section.title,
            sectionEmoji: section.emoji,
            item,
          });
        }
      }
    }
    return results;
  }, [searchQuery, visibleSections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleItemClick = (item: AdminNavItem) => {
    onSelectTab(item.id, item.path);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const getBadgeClass = (variant?: string) => {
    switch (variant) {
      case 'indigo':
        return 'bg-indigo-100 text-indigo-900 border-indigo-200';
      case 'emerald':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'amber':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'purple':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'rose':
        return 'bg-rose-100 text-rose-900 border-rose-200';
      case 'sky':
        return 'bg-sky-100 text-sky-900 border-sky-200';
      case 'slate':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'blue':
      default:
        return 'bg-blue-100 text-blue-900 border-blue-200';
    }
  };

  return (
    <aside className="w-full bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Search Header */}
      <div className="p-3.5 border-b border-slate-100 bg-slate-50/50">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Hledat v administraci…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              /
            </span>
          )}
        </div>
      </div>

      {/* Navigation Body */}
      <div className="p-3 flex-1 overflow-y-auto space-y-2 divide-y divide-slate-100/80">
        {filteredItems ? (
          /* Search Results Mode */
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-500">
              <span>Nalezeno výsledků: {filteredItems.length}</span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-600 hover:underline text-[11px]"
              >
                Zrušit hledání
              </button>
            </div>

            {filteredItems.length === 0 ? (
              <div className="py-8 text-center px-4">
                <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Žádná funkce nenalezena</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Zkuste jiný výraz nebo zkontrolujte oprávnění vaší role.
                </p>
              </div>
            ) : (
              filteredItems.map(({ sectionTitle, sectionEmoji, item }) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={`search-${item.id}`}
                    onClick={() => handleItemClick(item)}
                    className={`w-full text-left p-2.5 rounded-2xl text-xs transition-all flex items-center justify-between group cursor-pointer ${
                      isActive
                        ? 'bg-blue-900 text-white shadow-sm font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-blue-800 text-blue-200'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-blue-900 border border-slate-200'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold truncate">{item.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({sectionEmoji} {sectionTitle})
                          </span>
                        </div>
                        {item.subtitle && (
                          <span
                            className={`text-[10px] block truncate ${
                              isActive ? 'text-blue-200' : 'text-slate-500'
                            }`}
                          >
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold border shrink-0 ${
                          isActive
                            ? 'bg-blue-800 text-blue-100 border-blue-700'
                            : getBadgeClass(item.badge.variant)
                        }`}
                      >
                        {item.badge.text}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        ) : (
          /* Standard Structured 8 Sections Mode */
          visibleSections.map((section, idx) => {
            const isExpanded = !!expandedSections[section.id];
            const SectionIcon = section.icon;
            const hasActiveChild = section.items.some((it) => it.id === activeTab);

            return (
              <div key={section.id} className={idx > 0 ? 'pt-2' : ''}>
                {/* Section Header Accordion Trigger */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all group cursor-pointer ${
                    hasActiveChild && !isExpanded
                      ? 'bg-blue-50 text-blue-950 border border-blue-200'
                      : 'text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">{section.emoji}</span>
                    <span className="tracking-tight">{section.title}</span>
                    {hasActiveChild && !isExpanded && (
                      <span className="w-2 h-2 rounded-full bg-blue-900" />
                    )}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400 group-hover:text-slate-600">
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      {section.items.length}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                </button>

                {/* Collapsible Children */}
                {isExpanded && (
                  <div className="mt-1 space-y-0.5 pl-2">
                    {section.items.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition-all flex items-center justify-between group cursor-pointer ${
                            isActive
                              ? 'bg-blue-900 text-white shadow-xs font-bold'
                              : 'text-slate-700 hover:bg-slate-100/80'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0 pr-2">
                            <IconComponent
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isActive ? 'text-amber-300' : 'text-slate-500 group-hover:text-blue-900'
                              }`}
                            />
                            <span className="truncate">{item.title}</span>
                          </span>

                          {item.badge && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                                isActive
                                  ? 'bg-blue-800 text-blue-100 border border-blue-700'
                                  : getBadgeClass(item.badge.variant)
                              }`}
                            >
                              {item.badge.text}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer Info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="truncate font-medium">{currentUser?.email}</span>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold uppercase text-[9px] font-mono shrink-0">
          {currentUser?.role}
        </span>
      </div>
    </aside>
  );
};
