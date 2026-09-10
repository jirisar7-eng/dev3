import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiFetch, safeJsonResponse } from '../utils/apiClient';
import { useAuth } from './AuthContext';
import { Theme, ThemeSetting, ThemeVariable } from '../types';
import { resolveThemeContext, AppThemeContext } from '../utils/themeResolver';
import { DEFAULT_THEME_VARIABLES } from '../services/themeService';

export { resolveThemeContext };
export type { AppThemeContext };

/**
 * Pure resolver function to determine which theme is active for a given runtime context.
 * Strict context isolation & priority:
 * 1. Active theme matching the specific context (PUBLIC, PRIVATE, ADMIN)
 * 2. Active GLOBAL theme
 * 3. Default theme matching specific context or GLOBAL
 * 4. Any theme matching specific context or GLOBAL
 * 5. Safe system read-only default
 * Cross-context isolation: Context X never receives active theme of context Y.
 */
export function resolveActiveThemeForContext(themeList: Theme[], context: AppThemeContext): Theme | null {
  if (!themeList || themeList.length === 0) return null;

  // 1. Active theme matching specific context
  const specificActive = themeList.find((t) => t.active && t.context === context);
  if (specificActive) return specificActive;

  // 2. Active GLOBAL theme
  const globalActive = themeList.find((t) => t.active && (t.context === 'GLOBAL' || !t.context));
  if (globalActive) return globalActive;

  // 3. Default theme matching specific context or GLOBAL
  const defaultTheme = themeList.find(
    (t) => t.isDefault && (t.context === context || t.context === 'GLOBAL' || !t.context)
  );
  if (defaultTheme) return defaultTheme;

  // 4. Any theme matching specific context or GLOBAL
  const fallbackMatching = themeList.find(
    (t) => t.context === context || t.context === 'GLOBAL' || !t.context
  );
  if (fallbackMatching) return fallbackMatching;

  // 5. Never return a theme of a different explicit non-global context if we can avoid it
  return themeList[0] || null;
}

export interface ThemeContextType {
  themes: Theme[];
  activeTheme: Theme | null;
  currentContext: AppThemeContext;
  themeSettings: ThemeSetting[];
  updateColor: (key: string, value: string) => Promise<void>;
  updateThemeVars: (themeId: string, variables: Record<string, string>) => Promise<void>;
  activateTheme: (themeIdOrKey: string) => Promise<void>;
  createNewTheme: (data: { key: string; name: string; description?: string; context?: string; variables?: Record<string, string> }) => Promise<void>;
  deleteThemeById: (themeId: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  reloadThemes: () => Promise<void>;
  branding?: any; // Optional legacy compatibility accessor
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  const { currentUser } = useAuth();

  // Resolve current route context (PUBLIC | PRIVATE | ADMIN)
  const currentContext: AppThemeContext = useMemo(() => {
    return resolveThemeContext(currentPath);
  }, [currentPath]);

  // Track client-side navigation (popstate and custom app-navigate events)
  useEffect(() => {
    const handleLocationChange = () => {
      if (typeof window !== 'undefined') {
        setCurrentPath(window.location.pathname);
      }
    };

    const handleAppNavigate = (e: any) => {
      if (e?.detail && typeof e.detail === 'string') {
        setCurrentPath(e.detail);
      } else if (typeof window !== 'undefined') {
        setCurrentPath(window.location.pathname);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('app-navigate', handleAppNavigate);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('app-navigate', handleAppNavigate);
    };
  }, []);

  // Determine active theme based on resolved context
  const activeTheme = useMemo(() => {
    return resolveActiveThemeForContext(themes, currentContext);
  }, [themes, currentContext]);

  // Build ThemeSetting[] representation of active variables for UI consumers
  const themeSettings: ThemeSetting[] = useMemo(() => {
    if (activeTheme?.variables && activeTheme.variables.length > 0) {
      return activeTheme.variables.map((v) => ({
        id: v.id,
        key: v.key,
        value: v.value,
        label: v.label,
        category: v.category,
        updatedAt: v.updatedAt || new Date().toISOString(),
      }));
    }
    return DEFAULT_THEME_VARIABLES.map((v) => ({
      id: 'thm-' + v.key,
      key: v.key,
      value: v.value,
      label: v.label,
      category: v.category,
      updatedAt: new Date(0).toISOString(),
    }));
  }, [activeTheme]);

  /**
   * Applies CSS variables and user appearance preferences according to strict priority:
   * Layer 1 (Highest): User appearance overrides (high contrast, explicit color preset, dark mode, font size, density)
   * Layer 2: Context-resolved active theme variables (--color-*)
   * Layer 3: Safe system fallback
   */
  const applyThemeAndPreferences = useCallback(
    (theme: Theme | null, prefs: any) => {
      if (typeof document === 'undefined') return;
      const root = document.documentElement;

      // 1. Apply active theme CSS variables (or fallback)
      const varsToApply = theme?.variables && theme.variables.length > 0
        ? theme.variables
        : DEFAULT_THEME_VARIABLES;

      varsToApply.forEach((v) => {
        root.style.setProperty(`--color-${v.key}`, v.value);
      });

      // 2. Apply User Appearance Overrides (Higher Priority)
      if (prefs) {
        // Dark / light mode
        if (
          prefs.themeMode === 'dark' ||
          (prefs.themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }

        // Color preset override
        if (prefs.colorPreset && prefs.colorPreset !== 'default') {
          root.setAttribute('data-color-preset', prefs.colorPreset);
          if (prefs.colorPreset === 'blue') {
            root.style.setProperty('--color-primary', '#2563eb');
            root.style.setProperty('--color-background', '#eff6ff');
            root.classList.remove('high-contrast');
          } else if (prefs.colorPreset === 'green') {
            root.style.setProperty('--color-primary', '#16a34a');
            root.style.setProperty('--color-background', '#f0fdf4');
            root.classList.remove('high-contrast');
          } else if (prefs.colorPreset === 'purple') {
            root.style.setProperty('--color-primary', '#9333ea');
            root.style.setProperty('--color-background', '#faf5ff');
            root.classList.remove('high-contrast');
          } else if (prefs.colorPreset === 'neutral') {
            root.style.setProperty('--color-primary', '#475569');
            root.style.setProperty('--color-background', '#f8fafc');
            root.classList.remove('high-contrast');
          } else if (prefs.colorPreset === 'high-contrast') {
            root.style.setProperty('--color-primary', '#000000');
            root.style.setProperty('--color-background', '#ffffff');
            root.classList.add('high-contrast');
          }
        } else {
          root.removeAttribute('data-color-preset');
          root.classList.remove('high-contrast');
        }

        // Typography
        if (prefs.fontFamily && prefs.fontFamily !== 'default') {
          root.style.setProperty('font-family', prefs.fontFamily);
        } else {
          root.style.removeProperty('font-family');
        }

        // Font Size
        if (prefs.fontSize) {
          root.style.setProperty('font-size', `${prefs.fontSize}%`);
        } else {
          root.style.removeProperty('font-size');
        }

        // Density
        if (prefs.density) {
          root.setAttribute('data-density', prefs.density);
        } else {
          root.removeAttribute('data-density');
        }

        // Border Radius
        if (prefs.borderRadius) {
          root.setAttribute('data-radius', prefs.borderRadius);
        } else {
          root.removeAttribute('data-radius');
        }
      } else {
        // User logged out or no preferences: clear appearance overrides, keep active theme variables
        root.classList.remove('dark', 'high-contrast');
        root.removeAttribute('data-color-preset');
        root.style.removeProperty('font-family');
        root.style.removeProperty('font-size');
        root.removeAttribute('data-density');
        root.removeAttribute('data-radius');
      }
    },
    []
  );

  // Re-apply whenever active theme or user preferences change
  useEffect(() => {
    applyThemeAndPreferences(activeTheme, currentUser?.preferences);
  }, [activeTheme, currentUser?.preferences, applyThemeAndPreferences]);

  // Listen to user preferences dynamic updates from UI
  useEffect(() => {
    const handlePrefChange = (e: any) => {
      applyThemeAndPreferences(activeTheme, e.detail);
    };
    window.addEventListener('user-preferences-updated', handlePrefChange);
    return () => window.removeEventListener('user-preferences-updated', handlePrefChange);
  }, [activeTheme, applyThemeAndPreferences]);

  const reloadThemes = useCallback(async () => {
    try {
      const res = await apiFetch('/api/themes');
      if (res.ok) {
        const data: Theme[] | null = await safeJsonResponse(res);
        if (data && Array.isArray(data)) {
          setThemes(data);
        }
      }
    } catch (e) {
      console.error('[ThemeContext] Error fetching themes:', e);
    }
  }, []);

  useEffect(() => {
    reloadThemes();
  }, [reloadThemes]);

  const updateColor = async (key: string, value: string) => {
    if (!activeTheme) return;
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await apiFetch(`/api/themes/${activeTheme.id}/variables`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        document.documentElement.style.setProperty(`--color-${key}`, value);
        await reloadThemes();
      }
    } catch (e) {
      console.error('[ThemeContext] Error updating theme color:', e);
    }
  };

  const updateThemeVars = async (themeId: string, variables: Record<string, string>) => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await apiFetch(`/api/themes/${themeId}/variables`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(variables),
      });
      if (res.ok) {
        await reloadThemes();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Chyba při aktualizaci proměnných tématu');
      }
    } catch (e) {
      console.error('[ThemeContext] Error updating theme variables:', e);
      throw e;
    }
  };

  const activateTheme = async (themeIdOrKey: string) => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await apiFetch(`/api/themes/${themeIdOrKey}/activate`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        await reloadThemes();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Chyba při aktivaci tématu');
      }
    } catch (e) {
      console.error('[ThemeContext] Error activating theme:', e);
      throw e;
    }
  };

  const createNewTheme = async (data: {
    key: string;
    name: string;
    description?: string;
    context?: string;
    variables?: Record<string, string>;
  }) => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await apiFetch('/api/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await reloadThemes();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Chyba při vytváření tématu');
      }
    } catch (e) {
      console.error('[ThemeContext] Error creating theme:', e);
      throw e;
    }
  };

  const deleteThemeById = async (themeId: string) => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await apiFetch(`/api/themes/${themeId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        await reloadThemes();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Chyba při mazání tématu');
      }
    } catch (e) {
      console.error('[ThemeContext] Error deleting theme:', e);
      throw e;
    }
  };

  const resetToDefaults = async () => {
    const defaultColors: Record<string, string> = {
      primary: '#1e3a8a',
      secondary: '#0284c7',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1e293b',
      textMuted: '#64748b',
      heading: '#0f172a',
      link: '#2563eb',
      border: '#e2e8f0',
      button: '#1e3a8a',
      buttonHover: '#0f172a',
      success: '#16a34a',
      warning: '#d97706',
      error: '#dc2626',
    };

    if (activeTheme) {
      await updateThemeVars(activeTheme.id, defaultColors);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        themes,
        activeTheme,
        currentContext,
        themeSettings,
        updateColor,
        updateThemeVars,
        activateTheme,
        createNewTheme,
        deleteThemeById,
        resetToDefaults,
        reloadThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
