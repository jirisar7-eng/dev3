import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useModules } from '../../context/ModuleContext';
import { useText } from '../../context/TextContext';
import {
  Lock,
  LayoutDashboard,
  Sliders,
  Type,
  Server,
  Activity,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';

import { AdminTabId, ADMIN_NAV_SECTIONS, findSectionByTabId, resolveAdminTabFromUrl } from '../../config/adminNavigation';
import { AdminHeader } from './layout/AdminHeader';
import { AdminSidebar } from './layout/AdminSidebar';
import { TeamCenterSlot } from './layout/TeamCenterSlot';

import { TextManager } from './TextManager';
import { ThemeManager } from './ThemeManager';
import { ModuleManager } from './ModuleManager';
import { BrandingManager } from './BrandingManager';
import { CmsManager } from './CmsManager';
import { UserManager } from './UserManager';
import { ComplianceManager } from './ComplianceManager';
import { AuditLogViewer } from './AuditLogViewer';
import { SettingsManager } from './SettingsManager';
import { GitHubPublisher } from './GitHubPublisher';
import { MailcowManager } from './MailcowManager';
import AdminPagesList from '../../pages/admin/AdminPagesList';
import AdminPageBuilder from '../../pages/admin/AdminPageBuilder';
import { DnsManagementPage } from '../../pages/admin/DnsManagementPage';
import { PartnerManager } from './PartnerManager';
import { TemplateManager } from './TemplateManager';
import { CustomModuleManager } from './CustomModuleManager';
import { SubjektManager } from './SubjektManager';
import { ContactModerationManager } from './ContactModerationManager';
import { VpsManagement } from './VpsManagement';
import { TestRunnerCard } from './TestRunnerCard';
import { QADashboard } from './qa/QADashboard';
import { AiContextManager } from './AiContextManager';
import { EsbirkaAdminPanel } from './EsbirkaAdminPanel';
import { StateAdminManager } from './StateAdminManager';
import { AuditCenter } from './AuditCenter';
import { AnalyticsManager } from './AnalyticsManager';
import { ContentProjectCenter } from './ContentProjectCenter';

interface AdminDashboardProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentPath, onNavigate }) => {
  const { currentUser, hasRole } = useAuth();
  const { modules } = useModules();
  const { texts } = useText();

  const [activeTab, setActiveTab] = useState<AdminTabId>(() => resolveAdminTabFromUrl(currentPath));
  const [mailcowInitName, setMailcowInitName] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setActiveTab(resolveAdminTabFromUrl(currentPath));
  }, [currentPath]);

  const handleSelectTab = (tabId: AdminTabId, path?: string) => {
    setActiveTab(tabId);
    if (path) {
      if (onNavigate) {
        onNavigate(path);
      } else {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new Event('popstate'));
      }
    }
  };

  if (!currentUser) {
    return (
      <div className="py-20 max-w-md mx-auto text-center px-4">
        <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
          <Lock className="w-8 h-8 text-blue-900" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Přihlášení vyžadováno</h2>
        <p className="text-xs text-slate-600 mb-6">
          Do administrace mají přístup pouze přihlášení uživatelé s rolí ADMIN nebo SUPER_ADMIN.
        </p>
        <button
          onClick={() => {
            if (onNavigate) onNavigate('/login');
            else {
              window.history.pushState({}, '', '/login');
              window.dispatchEvent(new Event('popstate'));
            }
          }}
          className="px-6 py-3 rounded-xl bg-blue-900 text-white font-bold text-sm hover:bg-blue-800 transition-all shadow-md cursor-pointer"
        >
          Přihlásit se do administrace
        </button>
      </div>
    );
  }

  // Check role authorization for admin area
  const isAuthorized =
    hasRole('ADMIN') ||
    currentUser.role === 'SUPER_ADMIN' ||
    currentUser.role === 'SYSTEM_ADMIN' ||
    currentUser.role === 'CONTENT_MANAGER' ||
    currentUser.role === 'LEGAL_EDITOR' ||
    currentUser.role === 'MODERATOR';

  if (!isAuthorized) {
    return (
      <div className="py-20 max-w-md mx-auto text-center px-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-200 shadow-xs">
          <Lock className="w-8 h-8" />
        </div>
        <div className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black uppercase mb-3">
          403 Access Denied
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Přístup odepřen (RBAC 403)</h2>
        <p className="text-xs text-slate-600 mb-6">
          Do administrátorské sekce mají přístup pouze oprávnění správci. Vaše aktuální role je:{' '}
          <strong className="text-slate-900 uppercase">{currentUser.role}</strong>.
        </p>
        <button
          onClick={() => {
            if (onNavigate) onNavigate('/portal');
            else {
              window.history.pushState({}, '', '/portal');
              window.dispatchEvent(new Event('popstate'));
            }
          }}
          className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer"
        >
          Zpět do uživatelského portálu
        </button>
      </div>
    );
  }

  const activeModulesCount = modules.filter((m) => m.enabled).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Admin Header with Breadcrumbs & Host Info */}
      <AdminHeader
        activeTab={activeTab}
        onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        onNavigate={onNavigate}
      />

      {/* Mobile Drawer (Slide-over) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl z-50 flex flex-col p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Navigace Administrace
              </span>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <AdminSidebar
                activeTab={activeTab}
                onSelectTab={handleSelectTab}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Admin Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Desktop Sidebar (Left Column) */}
        <div className="hidden lg:block lg:col-span-1 sticky top-6">
          <AdminSidebar
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
          />
        </div>

        {/* Content Area (Right Column) */}
        <div className="lg:col-span-3 min-w-0">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Aktivní Moduly</span>
                    <Sliders className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {activeModulesCount}{' '}
                    <span className="text-sm font-normal text-slate-400">/ {modules.length}</span>
                  </span>
                  <span className="text-[11px] text-emerald-600 block mt-1.5 font-semibold">
                    100% Core kompatibilní
                  </span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Slovník Textů</span>
                    <Type className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">{texts.length}</span>
                  <span className="text-[11px] text-blue-600 block mt-1.5 font-semibold">
                    Texty uloženy v databázi
                  </span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">VPS Prostředí</span>
                    <Server className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-slate-900 block font-mono truncate">
                    {typeof window !== 'undefined' ? window.location.host : 'localhost'}
                  </span>
                  <span className="text-[11px] text-emerald-600 block mt-1.5 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    PostgreSQL 16 & Caddy OK
                  </span>
                </div>
              </div>

              {/* 8 Areas Quick Hub Grid */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-blue-900" />
                    Rychlý přehled sekcí administrace
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded-full font-bold">
                    8 OBLASTÍ
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {ADMIN_NAV_SECTIONS.map((sec) => {
                    const SecIcon = sec.icon;
                    const firstItem = sec.items[0];

                    return (
                      <button
                        key={sec.id}
                        onClick={() => {
                          if (firstItem) {
                            handleSelectTab(firstItem.id, firstItem.path);
                          }
                        }}
                        className="text-left p-4 rounded-2xl border border-slate-200/80 hover:border-blue-900/40 hover:bg-blue-50/30 transition-all group flex flex-col justify-between cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xl">{sec.emoji}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">
                              {sec.items.length} položek
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                            {sec.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                            {sec.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-blue-900 font-bold">
                          <span>Otevřít sekci</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Copilot & Test Runner Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 🤖 Synthesis Admin Copilot Card */}
                {hasRole('ADMIN') && (
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all group">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100 group-hover:scale-105 transition-transform duration-200 shadow-xs">
                          <Activity className="w-6 h-6 text-purple-600 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                            🤖 Synthesis Admin Copilot
                          </h3>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold uppercase tracking-wider">
                            Multi-AI Agent
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-6">
                        AI asistent pro správu, QA, analýzu a bezpečné provádění administrativních úkolů.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        handleSelectTab('copilot', '/administrace/qa/copilot');
                      }}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group-hover:shadow-lg"
                    >
                      <Sparkles className="w-4 h-4 text-purple-300" />
                      Spustit Admin Copilot
                    </button>
                  </div>
                )}

                {/* Test Runner Card */}
                <TestRunnerCard />
              </div>

              {/* System Info Banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 text-xs text-slate-700">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Architektonický stav FÁZE 1 & Redesign FÁZE 3B
                </h3>
                <p className="leading-relaxed">
                  Systém je plně konsolidován do 8 hierarchických oblastí v novém strukturovaném Admin Shellu.
                  Byly zachovány všechny existující subsystémy: <strong>Auth, RBAC, CMS, Text Manager, Theme Manager, Module Manager, Media, SEO, Compliance, Audit, QA Copilot a Settings</strong>.
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 font-mono text-[11px] space-y-1 text-slate-600">
                  <p>• Hierarchical Admin Shell with 8 logical clusters & quick search</p>
                  <p>• React 19 + Express API Server running on port 3000</p>
                  <p>• Prisma 7 + PostgreSQL 16 Data Schema generated</p>
                  <p>• Strict Server-Side authorization & RBAC (USER..SUPER_ADMIN)</p>
                </div>
              </div>
            </div>
          )}

          {/* 📝 Obsah & CMS */}
          {activeTab === 'project-control' && <ContentProjectCenter onNavigate={onNavigate} />}
          {activeTab === 'pages' && <AdminPagesList onNavigate={onNavigate} />}
          {activeTab === 'templates' && <TemplateManager onNavigate={onNavigate} />}
          {activeTab === 'page-builder' && <AdminPageBuilder onNavigate={onNavigate} />}
          {activeTab === 'texts' && <TextManager />}
          {activeTab === 'theme' && <ThemeManager />}
          {activeTab === 'branding' && <BrandingManager />}
          {activeTab === 'custom-modules' && <CustomModuleManager />}
          {activeTab === 'cms' && <CmsManager onNavigate={onNavigate} />}

          {/* 👥 Uživatelé & Přístupy */}
          {activeTab === 'users' && (
            <UserManager
              onCreateMailbox={(name) => {
                setMailcowInitName(name);
                handleSelectTab('mailcow');
              }}
            />
          )}

          {/* ⚖️ Právo & Státní data */}
          {activeTab === 'esbirka' && <EsbirkaAdminPanel />}
          {activeTab === 'state-admin' && <StateAdminManager />}
          {activeTab === 'subjekty' && <SubjektManager />}
          {activeTab === 'schvalovani-kontaktu' && <ContactModerationManager />}

          {/* 🤖 AI & Automatizace */}
          {(activeTab === 'qa' || activeTab === 'copilot') && <QADashboard currentPath={currentPath} onNavigate={onNavigate} />}
          {activeTab === 'ai-context' && <AiContextManager />}
          {activeTab === 'tests' && <TestRunnerCard />}

          {/* 📈 Analytika & Audit */}
          {activeTab === 'analytics' && <AnalyticsManager />}
          {activeTab === 'audit' && <AuditLogViewer />}
          {activeTab === 'audits' && <AuditCenter />}
          {activeTab === 'compliance' && <ComplianceManager />}
          {activeTab === 'sponsors' && <PartnerManager />}

          {/* ⚙️ Systém & DevSecOps */}
          {activeTab === 'settings' && <SettingsManager />}
          {activeTab === 'modules' && <ModuleManager onNavigate={onNavigate} />}
          {activeTab === 'mailcow' && <MailcowManager initialName={mailcowInitName} />}
          {activeTab === 'dns' && <DnsManagementPage />}
          {activeTab === 'vps' && <VpsManagement />}
          {activeTab === 'github' && <GitHubPublisher />}

          {/* 🏛️ Team Center Slot */}
          {activeTab === 'team-center' && <TeamCenterSlot />}
        </div>
      </div>
    </div>
  );
};
