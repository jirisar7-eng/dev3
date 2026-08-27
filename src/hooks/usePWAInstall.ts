import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [isVisible, setIsVisible] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) {
      return;
    }

    // 2. Check cooldown
    try {
      const dismissedDateStr = localStorage.getItem('pwa_install_dismissed_date');
      if (dismissedDateStr) {
        const dismissedDate = parseInt(dismissedDateStr, 10);
        const daysSinceDismissed = (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 14) {
          return;
        }
      }
    } catch (e) {
      // Ignore storage errors
    }

    // 3. Check for iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    
    if (isIOSDevice) {
      setIsIOS(true);
      const timer = setTimeout(() => setIsVisible(true), 100); // Shorter for tests, 3000 normally
      return () => clearTimeout(timer);
    }

    // 4. Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    const handleAppInstalled = () => {
      setIsVisible(false);
      setInstallEvent(null);
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    try {
      localStorage.setItem('pwa_install_dismissed_date', Date.now().toString());
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installEvent) return;
    
    try {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      
      if (outcome === 'accepted') {
        setIsVisible(false);
      } else {
        handleDismiss();
      }
    } catch (e) {
      console.error('Install prompt failed', e);
    }
    
    setInstallEvent(null);
  }, [installEvent, handleDismiss]);

  return {
    isVisible,
    isIOS,
    isStandalone,
    handleDismiss,
    handleInstall,
    setIsVisible // for testing / manual override
  };
}
