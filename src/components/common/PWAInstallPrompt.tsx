import React, { useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallPrompt: React.FC = () => {
  const { isVisible, isIOS, handleDismiss, handleInstall } = usePWAInstall();

  useEffect(() => {
    // Keyboard support for ESC key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, handleDismiss]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border border-slate-200 shadow-xl rounded-xl p-4 z-50 flex flex-col gap-3 transition-all duration-300 transform translate-y-0"
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-desc"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600" aria-hidden="true">
            <Download size={20} />
          </div>
          <h3 id="pwa-install-title" className="font-semibold text-slate-800 text-sm">
            Aplikace Táta má právo
          </h3>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label="Zavřít informační panel"
        >
          <X size={16} />
        </button>
      </div>
      
      <p id="pwa-install-desc" className="text-slate-600 text-xs leading-relaxed">
        {isIOS 
          ? 'Nainstalujte si aplikaci pro offline přístup. V prohlížeči Safari klepněte na tlačítko Sdílet a zvolte "Přidat na plochu".'
          : 'Nainstalujte si aplikaci pro rychlý a bezpečný offline přístup k vašim případům.'}
      </p>
      
      {!isIOS && (
        <div className="flex justify-end gap-2 mt-1">
          <button 
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Později
          </button>
          <button 
            onClick={handleInstall}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Nainstalovat aplikaci
          </button>
        </div>
      )}
      {isIOS && (
         <div className="flex items-center justify-center gap-2 mt-1 bg-slate-50 p-2 rounded border border-slate-100 text-slate-500 text-xs" aria-label="Instrukce pro iOS: Sdílet a Přidat na plochu">
           <Share size={14} aria-hidden="true" /> Sdílet → <span className="bg-slate-200 px-1 rounded text-slate-700 font-medium" aria-hidden="true">+</span> Přidat na plochu
         </div>
      )}
    </div>
  );
};
