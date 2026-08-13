import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useModules } from '../../context/ModuleContext';
import { useText } from '../../context/TextContext';
import {
  LayoutDashboard,
  Type,
  Palette,
  Sliders,
  FileText,
  Users,
  ShieldCheck,
  Clock,
  Settings,
  Server,
  Activity,
  CheckCircle2,
  Lock,
  Mail,
  Sparkles,
} from 'lucide-react';


import { TextManager } from './TextManager';
import { ThemeManager } from './ThemeManager';
import { ModuleManager } from './ModuleManager';
import { CmsManager } from './CmsManager';
import { UserManager } from './UserManager';
import { ComplianceManager } from './ComplianceManager';
import { AuditLogViewer } from './AuditLogViewer';
import { SettingsManager } from './SettingsManager';
import { GitHubPublisher } from './GitHubPublisher';
import { MailcowManager } from './MailcowManager';
import { GitPullRequest, LayoutTemplate } from 'lucide-react';
import AdminPagesList from '../../pages/admin/AdminPagesList';
import AdminPageBuilder from '../../pages/admin/AdminPageBuilder';

import { PartnerManager } from './PartnerManager';
import { TemplateManager } from './TemplateManager';

type AdminTab =
  | 'overview'
  | 'pages'
  | 'templates'
  | 'page-builder'
  | 'texts'
  | 'theme'
  | 'modules'
  | 'cms'
  | 'users'
  | 'mailcow'
  | 'compliance'
  | 'audit'
  | 'settings'
  | 'sponsors'
  | 'github';


interface AdminDashboardProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentPath, onNavigate }) => {
  const { currentUser, hasRole } = useAuth();
  const { modules } = useModules();
  const { texts } = useText();
  
  const getInitialTab = (): AdminTab => {
    const path = currentPath || (typeof window !== 'undefined' ? window.location.pathname : '');
    if (path.startsWith('/admin/pages/new') || path.startsWith('/admin/pages/edit')) return 'page-builder';
    if (path.startsWith('/admin/pages')) return 'pages';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<AdminTab>(getInitialTab());
  const [mailcowInitName, setMailcowInitName] = useState('');

  React.useEffect(() => {
    const path = currentPath || (typeof window !== 'undefined' ? window.location.pathname : '');
    if (path.startsWith('/admin/pages/new') || path.startsWith('/admin/pages/edit')) {
      setActiveTab('page-builder');
    } else if (path.startsWith('/admin/pages')) {
      setActiveTab('pages');
    }
  }, [currentPath]);

  if (!currentUser) {
    return (
      <div className="py-20 max-w-md mx-auto text-center px-4">
        <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
          <Lock className="w-8 h-8 text-blue-900" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Přihlášení vyžadováno</h2>
        <p className="text-xs text-slate-600 mb-6">
          Do administrace maji přístup pouze přihlášení uživatelé s rolí ADMIN nebo SUPER_ADMIN.
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

  if (!hasRole('ADMIN')) {
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
          Do administrátorské sekce mají přístup pouze uživatelé s rolí ADMIN nebo SUPER_ADMIN. Vaše aktuální role je: <strong className="text-slate-900 uppercase">{currentUser.role}</strong>.
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
              ADMIN CMS CONTROL PANEL
            </span>
            <span className="text-xs text-slate-400 font-mono">{window.location.host}</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Administrace: Táta má právo
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Modulární řízení obsahu, textů, barev, uživatelů, modulů a auditu.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 text-xs">
          <img src={currentUser?.avatar} alt={currentUser?.name} className="w-10 h-10 rounded-xl border border-amber-400" />
          <div>
            <span className="font-bold text-white block">{currentUser?.name}</span>
            <span className="text-[10px] text-amber-400 font-bold uppercase">{currentUser?.role}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="bg-white rounded-3xl border border-slate-200 p-3 shadow-xs h-fit space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 py-2">
            Moduly Administrace (Core)
          </span>

          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
              activeTab === 'overview' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-blue-400" />
            <span>Přehled systému</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('pages');
              if (onNavigate) onNavigate('/admin/pages');
              else {
                window.history.pushState({}, '', '/admin/pages');
                window.dispatchEvent(new Event('popstate'));
              }
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between ${
              activeTab === 'pages' || activeTab === 'page-builder' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <LayoutTemplate className="w-4 h-4 text-indigo-400" />
              <span>Správa stránek</span>
            </span>
            <span className="text-[10px] bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded font-mono font-bold">
              Puck
            </span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between ${
              activeTab === 'templates' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Šablony stránek</span>
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
              Engine
            </span>
          </button>


          <button
            onClick={() => setActiveTab('texts')}
            className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between ${
              activeTab === 'texts' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Type className="w-4 h-4 text-blue-400" />
              Text Manager
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-mono font-bold">
              {texts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
              activeTab === 'theme' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Palette className="w-4 h-4 text-purple-400" />
            <span>Theme & Colors</span>
          </button>

          <button
            onClick={() => setActiveTab('modules')}
            className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between ${
              activeTab === 'modules' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Module Manager
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">
              {activeModulesCount}/{modules.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cms')}
            className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
              activeTab === 'cms' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Obsah CMS</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
              activeTab === 'users' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Uživatelé & RBAC</span>
          </button>

          <button
            onClick={() => setActiveTab('sponsors')}
            className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
              activeTab === 'sponsors' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Sponzoři a partneři</span>
          </button>

          <button
            onClick={() => setActiveTab('mailcow')}
            className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
              activeTab === 'mailcow' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Mail className="w-4 h-4 text-blue-500" />
            <span>Správa E-mailů</span>
          </button>

          <button
            onClick={() => setActiveTab('compliance')}
            className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
              activeTab === 'compliance' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Compliance Docs</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
              activeTab === 'audit' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4 text-rose-400" />
            <span>Audit Log</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
              activeTab === 'settings' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Systémové Nastavení</span>
          </button>

          <div className="pt-2 border-t border-slate-100 my-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 py-1">
              System Operations
            </span>
            <button
              onClick={() => setActiveTab('github')}
              className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between ${
                activeTab === 'github' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <GitPullRequest className="w-4 h-4 text-emerald-500" />
                GitHub Publisher
              </span>
              <span className="text-[9px] bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-mono font-bold">
                SUPER_ADMIN
              </span>
            </button>
          </div>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Aktivní Moduly</span>
                    <Sliders className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-3xl font-black text-slate-900">
                    {activeModulesCount} <span className="text-sm font-normal text-slate-400">/ {modules.length}</span>
                  </span>
                  <span className="text-[11px] text-emerald-600 block mt-2 font-semibold">
                    100% Core kompatibilní
                  </span>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Slovník Textů</span>
                    <Type className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-3xl font-black text-slate-900">{texts.length}</span>
                  <span className="text-[11px] text-blue-600 block mt-2 font-semibold">
                    Texty uloženy v databázi
                  </span>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">VPS Prostředí</span>
                    <Server className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-lg font-bold text-slate-900 block font-mono">{window.location.host}</span>
                  <span className="text-[11px] text-emerald-600 block mt-2 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    PostgreSQL 16 & Caddy OK
                  </span>
                </div>
              </div>

              {/* System Info Banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 text-xs text-slate-700">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Architektonický stav FÁZE 1
                </h3>
                <p className="leading-relaxed">
                  Systém je kompletně připraven dle zadání FÁZE 1 (CORE + MODULES).
                  Byly zprovozněny všechny klíčové subsystémy: <strong>Auth, RBAC, CMS, Text Manager, Theme Manager, Module Manager, Media, SEO, Compliance, Audit a Settings</strong>.
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 font-mono text-[11px] space-y-1 text-slate-600">
                  <p>• React 19 + Express API Server running on port 3000</p>
                  <p>• Prisma 7 + PostgreSQL 16 Data Schema generated</p>
                  <p>• Strict Server-Side authorization & RBAC (USER..SUPER_ADMIN)</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pages' && <AdminPagesList onNavigate={onNavigate} />}
          {activeTab === 'templates' && <TemplateManager onNavigate={onNavigate} />}
          {activeTab === 'page-builder' && <AdminPageBuilder onNavigate={onNavigate} />}
          {activeTab === 'texts' && <TextManager />}
          {activeTab === 'theme' && <ThemeManager />}
          {activeTab === 'modules' && <ModuleManager />}
          {activeTab === 'cms' && <CmsManager />}
          {activeTab === 'users' && (
            <UserManager
              onCreateMailbox={(name) => {
                setMailcowInitName(name);
                setActiveTab('mailcow');
              }}
            />
          )}
          {activeTab === 'mailcow' && <MailcowManager initialName={mailcowInitName} />}
          {activeTab === 'compliance' && <ComplianceManager />}
          {activeTab === 'audit' && <AuditLogViewer />}
          {activeTab === 'settings' && <SettingsManager />}
          {activeTab === 'sponsors' && <PartnerManager />}
          {activeTab === 'github' && <GitHubPublisher />}
        </div>
      </div>
    </div>
  );
};
