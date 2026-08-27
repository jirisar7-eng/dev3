import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TextProvider } from './context/TextContext';
import { ThemeProvider } from './context/ThemeContext';
import { ModuleProvider } from './context/ModuleContext';
import { GlobalStartupLoader } from './components/common/GlobalStartupLoader';

import { Header } from './components/Header';
import { Footer } from './components/Footer';

import { PublicPortal } from './components/public/PublicPortal';
import { LoginPage } from './components/public/LoginPage';
import { RegisterPage } from './components/public/RegisterPage';
import { BetaNoticeModal } from './components/public/BetaNoticeModal';
import { ComplianceModal } from './components/public/ComplianceModal';

import { UserDashboard } from './components/private/UserDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TeamCenterDashboard } from './components/team/TeamCenterDashboard';

import SupportUsPage from './pages/SupportUsPage';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';

type AppView = 'public' | 'private' | 'team' | 'admin' | 'login' | 'register';

function MainApp() {
  const initialPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  
  const getViewFromPath = (path: string): AppView => {
    if (path === '/login') return 'login';
    if (path === '/registrace' || path === '/register') return 'register';
    if (path === '/logout') return 'public';
    if (path.startsWith('/team') || path.startsWith('/spolek')) return 'team';
    if (path.startsWith('/portal') || path.startsWith('/muj-pripad') || path.startsWith('/pece') || path.startsWith('/user-portal') || path.startsWith('/dashboard') || path.startsWith('/nastenka')) return 'private';
    if (path.startsWith('/administrace') || path.startsWith('/admin')) return 'admin';
    return 'public';
  };

  const [currentView, setCurrentView] = useState<AppView>(getViewFromPath(initialPath));
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [activeComplianceDoc, setActiveComplianceDoc] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.pathname === '/logout') {
      window.location.href = '/';
    }
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      setCurrentView(getViewFromPath(path));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    const formattedPath = path.startsWith('/') ? path : '/' + path;
    window.history.pushState({}, '', formattedPath);
    setCurrentPath(formattedPath);
    setCurrentView(getViewFromPath(formattedPath));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--color-background,#f8fafc)] text-[var(--color-text,#1e293b)] flex flex-col font-sans antialiased selection:bg-blue-200 selection:text-blue-900">
      {/* Top Header Navigation & Layer Switcher */}
      <Header
        currentView={currentView === 'login' || currentView === 'register' ? 'public' : currentView}
        setCurrentView={(view) => handleNavigate(view === 'private' ? '/portal' : view === 'admin' ? '/administrace' : '/')}
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'login' && <LoginPage onNavigate={handleNavigate} />}

        {currentView === 'register' && <RegisterPage onNavigate={handleNavigate} />}

        {currentView === 'public' && (
          <PublicPortal currentPath={currentPath} onNavigate={handleNavigate} />
        )}

        {currentView === 'private' && (
          <UserDashboard currentPath={currentPath} onNavigate={handleNavigate} />
        )}

        {currentView === 'team' && (
          <TeamCenterDashboard onNavigate={handleNavigate} />
        )}

        {currentView === 'admin' && <AdminDashboard currentPath={currentPath} onNavigate={handleNavigate} />}
      </main>

      {/* Footer with Compliance Links */}
      <Footer onOpenComplianceDoc={(docKey) => handleNavigate(`/pravni-dokumenty?doc=${docKey}`)} onNavigate={handleNavigate} />

      {/* Beta 1.0 First-Visit Notice */}
      <BetaNoticeModal onNavigate={handleNavigate} />

      {/* Compliance Modal for versioned legal documents */}
      <ComplianceModal
        activeDocKey={activeComplianceDoc}
        onClose={() => setActiveComplianceDoc(null)}
      />
      <PWAInstallPrompt />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TextProvider>
        <ThemeProvider>
          <ModuleProvider>
            <GlobalStartupLoader>
              <MainApp />
            </GlobalStartupLoader>
          </ModuleProvider>
        </ThemeProvider>
      </TextProvider>
    </AuthProvider>
  );
}
