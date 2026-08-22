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

export interface LoadingInfoItem {
  category: 'PORTÁL' | 'PRAKTICKÉ TIPY' | 'VZDĚLÁVÁNÍ' | 'PODPORA';
  icon: string;
  title: string;
  desc: string;
}

const LOADING_INFOS: LoadingInfoItem[] = [
  // PORTÁL
  { category: 'PORTÁL', icon: '⚖️', title: 'Právní poradna', desc: 'Přehled o zákonných možnostech, opatrovnických postupech a judikatuře.' },
  { category: 'PORTÁL', icon: '📁', title: 'Osobní spis', desc: 'Bezpečné úložiště pro vaši rodinnou dokumentaci, časovou osu a podklady.' },
  { category: 'PORTÁL', icon: '📚', title: 'Judikatura', desc: 'Banka rozhodnutí Ústavního a Nejvyššího soudu týkající se péče o děti.' },
  { category: 'PORTÁL', icon: '👨‍👧', title: 'CoParent Hub', desc: 'Strukturovaná a věcná komunikace i sdílený kalendář s druhým rodičem.' },
  { category: 'PORTÁL', icon: '🎓', title: 'Akademie', desc: 'Edukační videa, odborné kurzy a průvodce zaměřené na psychologii a právo.' },
  { category: 'PORTÁL', icon: '🆘', title: 'Krizová pomoc & SOS', desc: 'Postup krok za krokem při náhlém bránění ve styku nebo rodinné krizi.' },
  { category: 'PORTÁL', icon: '📋', title: 'Generátor podání', desc: 'Vytvořte si věcně správný návrh k soudu nebo vyjádření bez procesních chyb.' },
  { category: 'PORTÁL', icon: '🤖', title: 'AI Právní Asistent', desc: 'Analýza dokumentů, vyhledání paragrafů a rychlá příprava podkladů.' },
  { category: 'PORTÁL', icon: '🧮', title: 'Kalkulačka výživného', desc: 'Orientační výpočet doporučeného výživného dle metodiky MS ČR.' },
  { category: 'PORTÁL', icon: '🗺️', title: 'Mapa subjektů', desc: 'Přehledný adresář soudů, OSPOD, poraden a krizových center v ČR.' },
  { category: 'PORTÁL', icon: '❓', title: 'Právní kvízy', desc: 'Otestujte si své znalosti opatrovnického práva a připravte se na jednání.' },
  { category: 'PORTÁL', icon: '⚠️', title: 'Procesní memento', desc: 'Přehled nejčastějších chybných kroků před soudem a OSPOD a jak jim předejít.' },

  // PRAKTICKÉ TIPY
  { category: 'PRAKTICKÉ TIPY', icon: '📝', title: 'Uchovávejte komunikaci', desc: 'Písemnou komunikaci s druhým rodičem si ukládejte přehledně a chronologicky.' },
  { category: 'PRAKTICKÉ TIPY', icon: '⏱️', title: 'Veďte chronologii událostí', desc: 'Zaznamenávejte si přesné termíny předávání dětí, zpoždění i zmařené styky.' },
  { category: 'PRAKTICKÉ TIPY', icon: '🧘', title: 'Komunikujte věcně', desc: 'Zachovávejte klid a používejte BIFF pravidlo (stručnost, věcnost, zdvořilost).' },
  { category: 'PRAKTICKÉ TIPY', icon: '📂', title: 'Mějte systém v dokumentech', desc: 'Rodný list dětí, rozsudky a zprávy OSPOD ukládejte systematicky na jedno místo.' },
  { category: 'PRAKTICKÉ TIPY', icon: '👶', title: 'Soustřeďte se na potřeby dítěte', desc: 'Při jednání i rozhodování stavte na první místo stabilitu a zájem vašeho dítěte.' },
  { category: 'PRAKTICKÉ TIPY', icon: '🏛️', title: 'Příprava na OSPOD', desc: 'Na jednání s orgánem ochrany dětí přicházejte vždy připraveni s konkrétními návrhy.' },
  { category: 'PRAKTICKÉ TIPY', icon: '✍️', title: 'Připravte si otazníky předem', desc: 'Před soudním jednáním si sepište klíčové argumenty, fakta a otázky.' },
  { category: 'PRAKTICKÉ TIPY', icon: '🤝', title: 'Upřednostňujte dohodu', desc: 'Rodičovská dohoda schválená soudem je nejlepším základem pro budoucnost dětí.' },
  { category: 'PRAKTICKÉ TIPY', icon: '📞', title: 'Pravidelný kontakt s dětmi', desc: 'Udržujte spojení i na dálku prostřednictvím krátkých a pozitivních zpráv.' },
  { category: 'PRAKTICKÉ TIPY', icon: '🛡️', title: 'Chraňte děti před konflikty', desc: 'Vyhýbejte se řešení sporných témat v přítomnosti dětí – šetřete jejich pohodu.' },

  // VZDĚLÁVÁNÍ
  { category: 'VZDĚLÁVÁNÍ', icon: '🏛️', title: 'Co je OSPOD', desc: 'Orgán sociálně-právní ochrany dětí vystupuje v soudním řízení jako opatrovník dítěte.' },
  { category: 'VZDĚLÁVÁNÍ', icon: '⚖️', title: 'Opatrovnické řízení', desc: 'Soudní proces, ve kterém se rozhoduje o péči, výživném a styku rodičů s dítětem.' },
  { category: 'VZDĚLÁVÁNÍ', icon: '👨‍👩‍👧', title: 'Rodičovská odpovědnost', desc: 'Práva a povinnosti rodičů při péči o dítě, jeho výchově, zastupování a správě jmění.' },
  { category: 'VZDĚLÁVÁNÍ', icon: '🔄', title: 'Střídavá péče', desc: 'Forma péče, při které se oba rodiče rovnocenně podílejí na osobní výchově dítěte.' },
  { category: 'VZDĚLÁVÁNÍ', icon: '🕊️', title: 'Rodičovská mediace', desc: 'Dobrovolný proces mimosoudního řešení sporů za pomoci nezávislého odborníka.' },
  { category: 'VZDĚLÁVÁNÍ', icon: '📜', title: 'Soudní judikatura', desc: 'Sjednocující rozhodnutí vyšších soudů nastavující standardy rozhodování o péči.' },
  { category: 'VZDĚLÁVÁNÍ', icon: '💡', title: 'Péče jednoho rodiče', desc: 'Forma péče s určeným rozsahem styku druhého rodiče a stanoveným výživným.' },
  { category: 'VZDĚLÁVÁNÍ', icon: '🛡️', title: 'Právní moc rozsudku', desc: 'Okamžik, kdy je rozhodnutí soudu konečné a závazné po uplynutí lhůty pro odvolání.' },

  // PODPORA
  { category: 'PODPORA', icon: '🤝', title: 'Nejste na to sami', desc: 'Tisíce otců procházejí podobnou zkušeností a společně hledají spravedlivou cestu.' },
  { category: 'PODPORA', icon: '🎯', title: 'Trpělivost a systém', desc: 'Systematickým přístupem a klidnou vytrvalostí dosáhnete nejlepších výsledků.' },
  { category: 'PODPORA', icon: '💚', title: 'Aktivní otcovství', desc: 'Vaše přítomnost a péče má pro vývoj a štěstí vašeho dítěte nenahraditelnou hodnotu.' },
  { category: 'PODPORA', icon: '☀️', title: 'Každý krok se počítá', desc: 'I malé pokroky v komunikaci a dohodě posouvají rodinnou situaci k lepšímu.' },
  { category: 'PODPORA', icon: '🛡️', title: 'Důležité podklady na jednom místě', desc: 'Udržujte si klid v mysli díky přehledně uspořádanému Osobnímu spisu.' },
  { category: 'PODPORA', icon: '🧭', title: 'Rozvaha nad emocemi', desc: 'V krizových chvílích se nenechte strhnout emocemi – soustřeďte se na fakta.' },
  { category: 'PODPORA', icon: '👨‍👦', title: 'Bezpečná náruč pro dítě', desc: 'Dítě potřebuje cítit jistotu a lásku obou rodičů bez ohledu na probíhající spory.' },
  { category: 'PODPORA', icon: '🌟', title: 'Budoucnost vašich dětí', desc: 'Vaše dnešní zralé a uvážlivé jednání vytváří stabilní prostředí pro vaše děti.' },
];

let lastSelectedInfoIndex = -1;

function setRandomLoadingInfo() {
  const infoCategory = document.getElementById('sp-info-category');
  const infoTitle = document.getElementById('sp-info-title');
  const infoDesc = document.getElementById('sp-info-desc');
  const box = document.getElementById('sp-info-box');
  
  if (infoTitle && infoDesc && box) {
    let nextIndex = Math.floor(Math.random() * LOADING_INFOS.length);
    if (LOADING_INFOS.length > 1 && nextIndex === lastSelectedInfoIndex) {
      nextIndex = (nextIndex + 1) % LOADING_INFOS.length;
    }
    lastSelectedInfoIndex = nextIndex;

    const randomInfo = LOADING_INFOS[nextIndex];
    box.style.opacity = '0';
    setTimeout(() => {
      if (infoCategory) {
        infoCategory.textContent = randomInfo.category;
      }
      infoTitle.textContent = `${randomInfo.icon} ${randomInfo.title}`;
      infoDesc.textContent = randomInfo.desc;
      box.style.opacity = '1';
    }, 250);
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
