import React, { useState, useEffect } from 'react';
import { Cookie, Settings, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CookieConsentBannerProps {
  forceOpenTrigger?: boolean;
  onCloseTrigger?: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ forceOpenTrigger, onCloseTrigger }) => {
  const { currentUser: user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [preferences, setPreferences] = useState({
    essential: true, // always active
    functional: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const savedConsent = localStorage.getItem('cookie_consent_v1');
    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent);
        setPreferences(prev => ({ ...prev, ...parsed }));
        if (forceOpenTrigger) {
          setIsVisible(true);
          setShowSettings(true);
        }
      } catch (e) {
        setIsVisible(true);
      }
    } else {
      // Small timeout to not disrupt loading layout
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [forceOpenTrigger]);

  const saveConsent = async (prefs: typeof preferences) => {
    localStorage.setItem('cookie_consent_v1', JSON.stringify(prefs));
    setIsVisible(false);
    setShowSettings(false);
    if (onCloseTrigger) onCloseTrigger();

    // Log to backend if user is authenticated or guest
    try {
      const sessionHash = localStorage.getItem('session_hash') || 'sess_' + Math.random().toString(36).substring(2, 15);
      if (!localStorage.getItem('session_hash')) {
        localStorage.setItem('session_hash', sessionHash);
      }

      await fetch('/api/legal/cookie-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || null,
          sessionHash,
          essential: prefs.essential,
          functional: prefs.functional,
          analytics: prefs.analytics,
          marketing: prefs.marketing
        })
      });
    } catch (err) {
      console.warn('Could not record cookie consent to backend:', err);
    }
  };

  const handleAcceptAll = () => {
    const allOn = { essential: true, functional: true, analytics: true, marketing: true };
    setPreferences(allOn);
    saveConsent(allOn);
  };

  const handleAcceptEssential = () => {
    const essentialOnly = { essential: true, functional: false, analytics: false, marketing: false };
    setPreferences(essentialOnly);
    saveConsent(essentialOnly);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!isVisible && !forceOpenTrigger) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl font-sans text-xs sm:text-sm text-slate-800 animate-in fade-in slide-in-from-bottom duration-350">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Banner main content */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                Soubory cookie & Ochrana soukromí
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed max-w-3xl">
                Tento portál používá nezbytné technické cookies pro správné přihlášení a bezpečnost. S vaším souhlasem rádi využijeme také funkční a analytické cookies pro neustálé zlepšování našich opatrovnických kalkulaček a asistentů.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:shrink-0">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="inline-flex items-center gap-1 px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Nastavení</span>
            </button>
            <button
              onClick={handleAcceptEssential}
              className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Jen nezbytné
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Povolit vše</span>
            </button>
          </div>
        </div>

        {/* Granular settings drawer */}
        {showSettings && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
            {/* Necessary */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">Nezbytné cookies</span>
                <span className="px-2 py-0.5 rounded text-[8px] bg-slate-200 text-slate-600 font-bold uppercase">Aktivní</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Nezbytné pro přihlášení, uložení bezpečnostních tokenů (JWT) a správný chod portálu. Nelze je vypnout.
              </p>
            </div>

            {/* Functional */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">Funkční cookies</span>
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Slouží k zapamatování vašich nastavení, například barevného tématu, konfigurace modulů či rozhraní.
              </p>
            </div>

            {/* Analytical */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">Analytické cookies</span>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Umožňují nám anonymně sledovat návštěvnost a uživatelské interakce pro zlepšení stability a rychlosti webu.
              </p>
            </div>

            {/* Marketing */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Marketingové cookies</span>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                  Umožňují zprostředkovat informace o komunitních akcích, webinářích a tiskových zprávách spolku.
                </p>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-1.5 bg-blue-900 text-white hover:bg-blue-950 font-bold text-[10px] rounded-lg transition-all"
                >
                  Uložit nastavení
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
