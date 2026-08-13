import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserOverviewView } from './UserOverviewView';
import { UserProfileView } from './UserProfileView';
import { UserSettingsView } from './UserSettingsView';
import { UserDocumentsView } from './UserDocumentsView';
import { Lock, LayoutDashboard, User as UserIcon, Settings, FolderOpen, LogOut } from 'lucide-react';

interface UserDashboardProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ currentPath = '/portal', onNavigate }) => {
  const { currentUser, logout, switchUser } = useAuth();

  // Determine active tab based on path
  const getTabFromPath = (path: string): 'overview' | 'profile' | 'settings' | 'documents' => {
    if (path.includes('/portal/profil')) return 'profile';
    if (path.includes('/portal/nastaveni')) return 'settings';
    if (path.includes('/portal/dokumenty')) return 'documents';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'settings' | 'documents'>(
    getTabFromPath(currentPath)
  );

  useEffect(() => {
    setActiveTab(getTabFromPath(currentPath));
  }, [currentPath]);

  const handleTabClick = (tab: 'overview' | 'profile' | 'settings' | 'documents', path: string) => {
    setActiveTab(tab);
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  if (!currentUser) {
    return (
      <div className="py-20 max-w-xl mx-auto text-center px-4">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-xs">
          <Lock className="w-8 h-8 text-blue-900" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Přístup do soukromé zóny</h2>
        <p className="text-sm text-slate-600 mb-6">Pro vstup do uživatelského portálu se prosím přihlaste.</p>
        <div className="flex items-center justify-center gap-3">
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
            Přihlásit se
          </button>
          <button
            onClick={() => {
              if (onNavigate) onNavigate('/registrace');
              else {
                window.history.pushState({}, '', '/registrace');
                window.dispatchEvent(new Event('popstate'));
              }
            }}
            className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-all cursor-pointer"
          >
            Vytvořit účet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Private Navigation Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-2 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1">
          <button
            onClick={() => handleTabClick('overview', '/portal/prehled')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Přehled & Spis
          </button>

          <button
            onClick={() => handleTabClick('profile', '/portal/profil')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Můj Profil
          </button>

          <button
            onClick={() => handleTabClick('settings', '/portal/nastaveni')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            Nastavení & Heslo
          </button>

          <button
            onClick={() => handleTabClick('documents', '/portal/dokumenty')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Dokumenty
          </button>
        </div>

        {/* User Account Controls */}
        <div className="flex items-center gap-3 px-3 py-1.5 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
          <div className="flex items-center gap-2 text-xs">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-7 h-7 rounded-xl border border-blue-600 object-cover" />
            <span className="font-bold text-slate-900 hidden md:inline">{currentUser.name}</span>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Odhlásit se
          </button>
        </div>
      </div>

      {/* Tab Content Rendering */}
      <div>
        {activeTab === 'overview' && <UserOverviewView user={currentUser} />}
        {activeTab === 'profile' && <UserProfileView user={currentUser} onProfileUpdated={(u) => switchUser(u)} />}
        {activeTab === 'settings' && <UserSettingsView user={currentUser} />}
        {activeTab === 'documents' && <UserDocumentsView user={currentUser} />}
      </div>
    </div>
  );
};
