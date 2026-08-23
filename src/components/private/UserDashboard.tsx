import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserOverviewView } from './UserOverviewView';
import { UserProfileView } from './UserProfileView';
import { UserDocumentsView } from './UserDocumentsView';
import { UserSupportTicketingView } from './UserSupportTicketingView';
import { MyCasePage } from '../../pages/MyCasePage';
import { CoParentPage } from '../../pages/portal/CoParentPage';
import { CareHubPage } from '../../pages/CareHubPage';
import { Lock, LogOut, Briefcase, User as UserIcon } from 'lucide-react';

interface UserDashboardProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ currentPath = '/portal', onNavigate }) => {
  const { currentUser, logout, switchUser } = useAuth();

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

  // 1. Vyhrazená stránka VÝHRADNĚ pro správu účtu (Můj profil) -> /portal/profil
  const isProfileRoute = currentPath.includes('/portal/profil') || currentPath.includes('/portal/nastaveni') || currentPath.includes('/portal/zabezpeceni');
  if (isProfileRoute) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Čistá hlavička pro správu uživatelského účtu */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold overflow-hidden">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-6 h-6 text-slate-600" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Můj profil & Správa účtu</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Uživatel: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.email}) • Správa přihlašovacích údajů, hesla a 2FA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onNavigate) onNavigate('/muj-pripad');
                else {
                  window.history.pushState({}, '', '/muj-pripad');
                  window.dispatchEvent(new Event('popstate'));
                }
              }}
              className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Osobní spis otce (/muj-pripad)</span>
            </button>
            <button
              onClick={logout}
              className="px-3.5 py-2 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Odhlásit se</span>
            </button>
          </div>
        </div>

        {/* Komponent výhradně pro uživatelský profil (změna hesla, 2FA, klíče, propojené účty) */}
        <UserProfileView user={currentUser} onProfileUpdated={(u) => switchUser(u)} />
      </div>
    );
  }

  // 1.5 Samostatná uživatelská sekce Péče o dítě (/pece, /pece/plany/:id, /pece/kalendar, /pece/simulator, /pece/porovnani, atd.)
  if (currentPath.startsWith('/pece')) {
    return (
      <CareHubPage
        onNavigate={
          onNavigate ||
          ((p) => {
            window.history.pushState({}, '', p);
            window.dispatchEvent(new Event('popstate'));
          })
        }
        currentPath={currentPath}
      />
    );
  }

  // 2. Pomocné podstránky portálu
  if (currentPath.includes('/portal/coparent')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CoParentPage onNavigate={onNavigate} />
      </div>
    );
  }

  if (currentPath.includes('/portal/dokumenty')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserDocumentsView user={currentUser} />
      </div>
    );
  }
  if (currentPath.includes("/portal/podpora") || currentPath.includes("/portal/tikety")) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserSupportTicketingView user={currentUser} />
      </div>
    );
  }


  if (currentPath.includes('/portal/prehled')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserOverviewView user={currentUser} />
      </div>
    );
  }

  // 3. VÝHRADNĚ pro Osobní spis otce / Můj případ (/portal, /muj-pripad, /portal/pripad)
  // Obsahuje záložky: Přehled spisu, Děti ve spisu, Kalendář péče, Trezor dokumentů, Deník, Soud & OSPOD, Úkoly, Katalog důkazů a Časová osa
  return <MyCasePage onNavigate={onNavigate} />;
};
