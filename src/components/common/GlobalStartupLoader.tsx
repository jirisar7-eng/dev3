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

export const StartupInitializer: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const auth = useAuth();
  const text = useText();
  const theme = useTheme();
  const modules = useModules();

  useEffect(() => {
    let isMounted = true;

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
          removePreloader();
        }
      } catch (err: any) {
        console.error('[Startup Bootstrap Error]:', err);
        if (isMounted) {
          const msg = err?.message || 'Nepodařilo se načíst potřebná data ze serveru.';
          setInitError(msg);
          showPreloaderError(msg);
        }
      }
    };

    bootstrapApp();

    return () => {
      isMounted = false;
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
