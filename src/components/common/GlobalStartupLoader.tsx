import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useText } from '../../context/TextContext';
import { useTheme } from '../../context/ThemeContext';
import { useModules } from '../../context/ModuleContext';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

// Helper functions to control DOM preloader from HTML
export function removePreloader() {
  const preloader = document.getElementById('app-preloader');
  if (preloader) {
    preloader.classList.add('fade-out');
    setTimeout(() => {
      if (preloader.parentNode) {
        preloader.parentNode.removeChild(preloader);
      }
    }, 450);
  }
}

export function showPreloaderError(message: string) {
  const loadingBox = document.getElementById('sp-loading-box');
  const errorBox = document.getElementById('sp-error-box');
  const errorText = document.getElementById('sp-error-text');

  if (loadingBox) loadingBox.style.display = 'none';
  if (errorBox) errorBox.style.display = 'flex';
  if (errorText) errorText.textContent = message;
}

class StartupErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Při startu aplikace došlo k neočekávané chybě.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Startup Initialization Error]:', error, errorInfo);
    showPreloaderError(error.message || 'Nepodařilo se inicializovat aplikaci. Zkontrolujte připojení.');
  }

  public render() {
    if (this.state.hasError) {
      // Fallback UI inside React if preloader DOM element was already removed
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Chyba při startu aplikace</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{this.state.errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-xl transition duration-200 shadow-md"
            >
              Zkusit znovu
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const LOADING_INFOS = [
  { icon: '⚖️', title: 'Právní poradna', desc: 'Získejte přehled o možnostech a právních otázkách, které mohou souviset s péčí o dítě.' },
  { icon: '📚', title: 'Judikatura', desc: 'Přístup k důležitým rozhodnutím soudů a nálezům Ústavního soudu na jednom místě.' },
  { icon: '👨‍👧', title: 'CoParent Hub', desc: 'Nástroj pro zjednodušení komunikace a sdílení informací s druhým rodičem.' },
  { icon: '📁', title: 'Můj případ', desc: 'Bezpečné úložiště pro vaši složku, dokumenty a termíny stání.' },
  { icon: '🤖', title: 'AI Právní Asistent', desc: 'Pomůže vám s návrhy, analýzou dokumentů a odpoví na právní dotazy.' },
  { icon: '🧮', title: 'Simulátor', desc: 'Spočítejte si pravděpodobnost úspěchu a predikci výživného.' },
  { icon: '🎓', title: 'Akademie', desc: 'Vzdělávejte se v oblasti práva, rodičovství a komunikace.' },
  { icon: '🎥', title: 'Videotéka', desc: 'Rozhovory s odborníky, záznamy webinářů a edukační materiály.' },
  { icon: '📰', title: 'Novinky', desc: 'Zůstaňte v obraze díky pravidelným aktualitám z rodinného práva.' },
  { icon: '👨‍👧‍👦', title: 'Příběhy otců', desc: 'Inspirujte se zkušenostmi ostatních, kteří si prošli podobnou cestou.' },
  { icon: '🆘', title: 'SOS plán', desc: 'Krok za krokem, jak postupovat v akutní krizi nebo při bránění ve styku.' },
  { icon: '📊', title: 'Statistiky', desc: 'Data o opatrovnických sporech, střídavé péči a rozhodování soudů.' },
  { icon: '🔐', title: 'Bezpečnost účtu', desc: 'Vaše data jsou šifrována a chráněna podle nejvyšších standardů.' },
  { icon: '❤️', title: 'Proč jsme vznikli', desc: 'Pomáháme otcům zůstat aktivní součástí života jejich dětí.' },
  { icon: '🧭', title: 'Mapa portálu', desc: 'Rychlá navigace ke všem důležitým nástrojům a službám.' },
  { icon: '💬', title: 'Komunita', desc: 'Prostor pro sdílení, podporu a diskuzi s ostatními členy.' },
  { icon: '📋', title: 'Generátor formulářů', desc: 'Vytvořte si podání k soudu rychle, správně a bez zbytečných chyb.' },
  { icon: '📑', title: 'Vzory dokumentů', desc: 'Ověřené šablony smluv, návrhů a dohod připravené k použití.' },
  { icon: '📖', title: 'Wiki', desc: 'Slovník pojmů a komplexní průvodce opatrovnickým řízením.' },
  { icon: '🏛️', title: 'O projektu', desc: 'Táta má právo je nezisková iniciativa za rovná práva obou rodičů.' }
];

function setRandomLoadingInfo() {
  const infoTitle = document.getElementById('sp-info-title');
  const infoDesc = document.getElementById('sp-info-desc');
  const box = document.getElementById('sp-info-box');
  
  if (infoTitle && infoDesc && box) {
    const randomInfo = LOADING_INFOS[Math.floor(Math.random() * LOADING_INFOS.length)];
    // Add subtle fade out/in effect
    box.style.opacity = '0';
    setTimeout(() => {
      infoTitle.textContent = `${randomInfo.icon} ${randomInfo.title}`;
      infoDesc.textContent = randomInfo.desc;
      box.style.opacity = '1';
    }, 300); // Wait for fade out transition (0.3s) defined in CSS
  }
}

export const StartupInitializer: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const auth = useAuth();
  const text = useText();
  const theme = useTheme();
  const modules = useModules();

  useEffect(() => {
    let isMounted = true;
    
    // Initialize random info
    setRandomLoadingInfo();
    
    // Rotate every 4 seconds if loading is taking a while
    const infoInterval = setInterval(() => {
      if (isMounted) setRandomLoadingInfo();
    }, 4000);

    const bootstrapApp = async () => {
      try {
        // Run essential initialization calls in parallel with a timeout guarantee
        const initPromise = Promise.allSettled([
          auth.refreshMe(),
          text.reloadTexts(),
          theme.reloadThemes(),
          modules.reloadModules(),
        ]);

        // Safety timeout to prevent infinite loading on slow connections or unresponsive APIs
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 6000));

        await Promise.race([initPromise, timeoutPromise]);

        if (isMounted) {
          setIsReady(true);
          clearInterval(infoInterval);
          removePreloader();
        }
      } catch (err: any) {
        console.error('[Startup Bootstrap Error]:', err);
        if (isMounted) {
          clearInterval(infoInterval);
          const msg = err?.message || 'Nepodařilo se načíst potřebná data ze serveru.';
          setInitError(msg);
          showPreloaderError(msg);
        }
      }
    };

    bootstrapApp();

    return () => {
      isMounted = false;
      clearInterval(infoInterval);
    };
  }, []);

  if (initError) {
    return null; // The DOM preloader displays the error box with "Zkusit znovu" button
  }

  return <>{children}</>;
};

export const GlobalStartupLoader: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <StartupErrorBoundary>
      <StartupInitializer>{children}</StartupInitializer>
    </StartupErrorBoundary>
  );
};
